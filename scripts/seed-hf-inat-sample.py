#!/usr/bin/env python3
"""Seed local MinIO with live iNaturalist images sampled from gt-csse HF datasets.

The gt-csse Hugging Face datasets used for the INQUIRE/iNat work are embedding
tables. For the laptop demo we use their row identifiers as candidate
iNaturalist photo IDs, download resolvable images from iNaturalist Open Data,
upload those bytes to MinIO, and let the existing Ray image ingestion endpoint
perform the actual embedding/upsert path.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote

import boto3
import requests
from PIL import Image


DEFAULT_DATASETS = (
    "gt-csse/inat-open-data-embeddings",
    "gt-csse/iNat24-vit-b-16-test",
    "gt-csse/iNat24-vit-b-16",
)
DATASET_ID_FIELDS = {
    "gt-csse/inat-open-data-embeddings": "photo_id",
    "gt-csse/iNat24-vit-b-16-test": "id",
    "gt-csse/iNat24-vit-b-16": "id",
}
DATASET_LICENSES = {
    "gt-csse/inat-open-data-embeddings": "iNaturalist Open Data source; see source dataset",
    "gt-csse/iNat24-vit-b-16-test": "cc-by-nc-2.0",
    "gt-csse/iNat24-vit-b-16": "cc-by-nc-4.0",
}
IMAGE_EXTENSIONS = ("jpg", "jpeg", "png")
INAT_PHOTO_BASE_URL = "https://inaturalist-open-data.s3.amazonaws.com/photos"
HF_ROWS_URL = "https://datasets-server.huggingface.co/first-rows"
HF_ROWS_PAGE_URL = "https://datasets-server.huggingface.co/rows"
HF_REQUEST_RETRIES = int(os.getenv("DEMO_HF_REQUEST_RETRIES", "3"))
HF_REQUEST_BACKOFF_SECONDS = float(os.getenv("DEMO_HF_REQUEST_BACKOFF_SECONDS", "2"))


@dataclass(frozen=True)
class SeededImage:
    dataset: str
    row_idx: int
    photo_id: str
    source_url: str
    s3_key: str
    width: int
    height: int
    byte_size: int
    content_type: str
    license: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--datasets",
        default=os.getenv("DEMO_HF_DATASETS", ",".join(DEFAULT_DATASETS)),
        help="Comma-separated Hugging Face dataset IDs.",
    )
    parser.add_argument(
        "--per-dataset",
        type=int,
        default=int(os.getenv("DEMO_HF_IMAGES_PER_DATASET", "8")),
        help="Number of successfully resolved images to upload from each dataset.",
    )
    parser.add_argument(
        "--max-rows-per-dataset",
        type=int,
        default=int(os.getenv("DEMO_HF_MAX_ROWS_PER_DATASET", "300")),
        help="Maximum HF rows to inspect for each dataset while resolving images.",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=int(os.getenv("DEMO_HF_PAGE_SIZE", "25")),
        help="HF dataset-server page size after the first preview page.",
    )
    parser.add_argument(
        "--start-offset",
        type=int,
        default=int(os.getenv("DEMO_HF_START_OFFSET", "0")),
        help="Starting HF row offset. Use a later offset for a second incremental demo batch.",
    )
    parser.add_argument(
        "--bucket",
        default=os.getenv("DEMO_S3_BUCKET", "pipeline"),
        help="MinIO/S3 bucket name.",
    )
    parser.add_argument(
        "--prefix",
        default=os.getenv("DEMO_S3_PREFIX", "hf-inat/"),
        help="S3 prefix for uploaded demo images.",
    )
    parser.add_argument(
        "--endpoint-url",
        default=os.getenv("DEMO_MINIO_ENDPOINT_URL", os.getenv("MINIO_PUBLIC_URL", "http://localhost:9000")),
        help="MinIO endpoint URL reachable from the host.",
    )
    parser.add_argument(
        "--access-key-id",
        default=os.getenv("DEMO_S3_ACCESS_KEY_ID", "minioadmin"),
        help="MinIO access key.",
    )
    parser.add_argument(
        "--secret-access-key",
        default=os.getenv("DEMO_S3_SECRET_ACCESS_KEY", "minioadmin"),
        help="MinIO secret key.",
    )
    parser.add_argument(
        "--summary-path",
        default=os.getenv("DEMO_HF_SEED_SUMMARY", "data/runtime/hf-live-seed-summary.json"),
        help="Path where the seed summary JSON should be written.",
    )
    parser.add_argument(
        "--exclude-summary",
        action="append",
        default=[],
        help="Existing seed summary JSON whose photo IDs should be skipped.",
    )
    parser.add_argument(
        "--clear-prefix",
        action=argparse.BooleanOptionalAction,
        default=os.getenv("DEMO_CLEAR_S3_PREFIX", "1") != "0",
        help="Delete existing objects under the target prefix before uploading.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Resolve and download images without uploading to MinIO.",
    )
    return parser.parse_args()


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def fetch_json_with_retries(
    url: str,
    *,
    params: dict[str, Any],
    timeout_s: int = 60,
) -> dict[str, Any]:
    last_error: requests.RequestException | None = None
    attempts = max(1, HF_REQUEST_RETRIES)
    for attempt in range(1, attempts + 1):
        try:
            response = requests.get(url, params=params, timeout=timeout_s)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            last_error = exc
            if attempt >= attempts:
                break
            sleep_s = HF_REQUEST_BACKOFF_SECONDS * attempt
            log(f"  HF request timed out or failed; retrying in {sleep_s:g}s ({attempt}/{attempts})")
            time.sleep(sleep_s)
    assert last_error is not None
    raise last_error


def hf_rows_params(dataset: str, **extra: Any) -> dict[str, Any]:
    params: dict[str, Any] = {"dataset": dataset, "config": "default", "split": "train"}
    params.update(extra)
    return params


def fetch_hf_rows(
    dataset: str,
    *,
    offset: int | None = None,
    length: int | None = None,
    timeout_s: int = 60,
) -> list[dict[str, Any]]:
    url = HF_ROWS_URL
    extra: dict[str, Any] = {}
    if offset is not None and length is not None:
        url = HF_ROWS_PAGE_URL
        extra = {"offset": offset, "length": length}
    payload = fetch_json_with_retries(
        url,
        params=hf_rows_params(dataset, **extra),
        timeout_s=timeout_s,
    )
    return payload.get("rows", [])


def fetch_rows(dataset: str, timeout_s: int = 60) -> list[dict[str, Any]]:
    return fetch_hf_rows(dataset, timeout_s=timeout_s)


def fetch_rows_page(dataset: str, *, offset: int, length: int, timeout_s: int = 60) -> list[dict[str, Any]]:
    return fetch_hf_rows(dataset, offset=offset, length=length, timeout_s=timeout_s)


def candidate_photo_ids(dataset: str, rows: list[dict[str, Any]]) -> list[tuple[int, str]]:
    id_field = DATASET_ID_FIELDS.get(dataset)
    if not id_field:
        raise ValueError(f"No ID field configured for dataset {dataset!r}")

    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()
    for item in rows:
        row = item.get("row", {})
        raw_photo_id = row.get(id_field)
        if raw_photo_id in (None, ""):
            continue
        photo_id = str(raw_photo_id).strip()
        if not photo_id or photo_id in seen:
            continue
        seen.add(photo_id)
        candidates.append((int(item.get("row_idx", len(candidates))), photo_id))
    return candidates


def download_inat_image(photo_id: str, timeout_s: int = 20) -> tuple[str, bytes, str] | None:
    for extension in IMAGE_EXTENSIONS:
        url = f"{INAT_PHOTO_BASE_URL}/{photo_id}/medium.{extension}"
        try:
            response = requests.get(url, timeout=timeout_s)
        except requests.RequestException:
            continue
        if response.status_code != 200 or not response.content:
            continue
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type:
            continue
        return url, response.content, content_type
    return None


def image_dimensions(image_bytes: bytes) -> tuple[int, int]:
    with Image.open(io.BytesIO(image_bytes)) as image:
        width, height = image.size
    return int(width), int(height)


def dataset_slug(dataset: str) -> str:
    return dataset.replace("/", "__").replace(" ", "_")


def object_key(prefix: str, dataset: str, photo_id: str, source_url: str) -> str:
    extension = source_url.rsplit(".", 1)[-1].split("?", 1)[0].lower()
    safe_prefix = prefix.strip().strip("/")
    return f"{safe_prefix}/{dataset_slug(dataset)}/{photo_id}.{extension}" if safe_prefix else f"{dataset_slug(dataset)}/{photo_id}.{extension}"


def make_s3_client(args: argparse.Namespace):
    return boto3.client(
        "s3",
        endpoint_url=args.endpoint_url,
        aws_access_key_id=args.access_key_id,
        aws_secret_access_key=args.secret_access_key,
        region_name="us-east-1",
    )


def ensure_bucket(s3_client: Any, bucket: str) -> None:
    try:
        s3_client.head_bucket(Bucket=bucket)
    except Exception:
        s3_client.create_bucket(Bucket=bucket)


def clear_prefix(s3_client: Any, bucket: str, prefix: str) -> int:
    deleted = 0
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix.strip().lstrip("/")):
        objects = [{"Key": item["Key"]} for item in page.get("Contents", [])]
        if not objects:
            continue
        s3_client.delete_objects(Bucket=bucket, Delete={"Objects": objects})
        deleted += len(objects)
    return deleted


def upload_image(
    s3_client: Any,
    *,
    bucket: str,
    key: str,
    image_bytes: bytes,
    content_type: str,
    metadata: dict[str, str],
) -> None:
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=image_bytes,
        ContentType=content_type or "image/jpeg",
        Metadata={k: v for k, v in metadata.items() if v},
    )


def write_summary(path: str, summary: dict[str, Any]) -> None:
    if not path:
        return
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)
        handle.write("\n")


def load_excluded_photo_ids(paths: list[str]) -> set[str]:
    excluded: set[str] = set()
    for path in paths:
        if not path or not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
        for item in payload.get("items", []):
            if not isinstance(item, dict):
                continue
            photo_id = str(item.get("photo_id") or "").strip()
            if photo_id:
                excluded.add(photo_id)
    return excluded


def main() -> int:
    args = parse_args()
    datasets = [item.strip() for item in args.datasets.split(",") if item.strip()]
    if not datasets:
        raise ValueError("At least one Hugging Face dataset must be configured.")
    if args.per_dataset <= 0:
        raise ValueError("--per-dataset must be greater than 0.")
    if args.max_rows_per_dataset < args.per_dataset:
        raise ValueError("--max-rows-per-dataset must be greater than or equal to --per-dataset.")
    if args.page_size <= 0:
        raise ValueError("--page-size must be greater than 0.")
    if args.start_offset < 0:
        raise ValueError("--start-offset must be greater than or equal to 0.")

    s3_client = None
    if not args.dry_run:
        s3_client = make_s3_client(args)
        ensure_bucket(s3_client, args.bucket)
        if args.clear_prefix:
            deleted = clear_prefix(s3_client, args.bucket, args.prefix)
            log(f"Cleared {deleted} existing objects from s3://{args.bucket}/{args.prefix}")

    seeded: list[SeededImage] = []
    seeded_photo_ids: set[str] = load_excluded_photo_ids(args.exclude_summary)
    dataset_counts: dict[str, dict[str, int]] = {}

    for dataset in datasets:
        log(f"Sampling {dataset}")
        if args.start_offset:
            rows = fetch_rows_page(
                dataset,
                offset=args.start_offset,
                length=min(args.page_size, args.max_rows_per_dataset),
            )
        else:
            rows = fetch_rows(dataset)
        next_offset = max(
            (int(row.get("row_idx", -1)) for row in rows),
            default=args.start_offset - 1,
        ) + 1
        seen_row_indexes: set[int] = set()
        uploaded_for_dataset = 0
        checked = 0
        skipped = 0

        while uploaded_for_dataset < args.per_dataset and checked < args.max_rows_per_dataset:
            if not rows:
                remaining = args.max_rows_per_dataset - checked
                if remaining <= 0:
                    break
                page_length = min(args.page_size, remaining)
                try:
                    rows = fetch_rows_page(dataset, offset=next_offset, length=page_length)
                except requests.RequestException as exc:
                    log(f"  unable to fetch more rows from {dataset} at offset {next_offset}: {exc}")
                    break
                if not rows:
                    break
                next_offset = max(int(row.get("row_idx", next_offset)) for row in rows) + 1

            candidates = candidate_photo_ids(dataset, rows)
            rows = []
            for row_idx, photo_id in candidates:
                if row_idx in seen_row_indexes:
                    continue
                seen_row_indexes.add(row_idx)
                checked += 1
                if photo_id in seeded_photo_ids:
                    skipped += 1
                    continue
                downloaded = download_inat_image(photo_id)
                if downloaded is None:
                    skipped += 1
                    continue
                source_url, image_bytes, content_type = downloaded
                try:
                    width, height = image_dimensions(image_bytes)
                except Exception:
                    skipped += 1
                    continue

                key = object_key(args.prefix, dataset, photo_id, source_url)
                license_text = DATASET_LICENSES.get(dataset, "")
                if s3_client is not None:
                    upload_image(
                        s3_client,
                        bucket=args.bucket,
                        key=key,
                        image_bytes=image_bytes,
                        content_type=content_type,
                        metadata={
                            "hf_dataset": dataset,
                            "hf_row_idx": str(row_idx),
                            "inat_photo_id": photo_id,
                            "source_url": source_url,
                            "license": license_text,
                        },
                    )

                seeded.append(
                    SeededImage(
                        dataset=dataset,
                        row_idx=row_idx,
                        photo_id=photo_id,
                        source_url=source_url,
                        s3_key=key,
                        width=width,
                        height=height,
                        byte_size=len(image_bytes),
                        content_type=content_type,
                        license=license_text,
                    )
                )
                uploaded_for_dataset += 1
                seeded_photo_ids.add(photo_id)
                log(f"  {uploaded_for_dataset}/{args.per_dataset}: {photo_id} -> s3://{args.bucket}/{key}")
                if uploaded_for_dataset >= args.per_dataset or checked >= args.max_rows_per_dataset:
                    break

        dataset_counts[dataset] = {
            "requested": args.per_dataset,
            "seeded": uploaded_for_dataset,
            "checked": checked,
            "skipped": skipped,
        }
        if uploaded_for_dataset < args.per_dataset:
            raise RuntimeError(
                f"Only resolved {uploaded_for_dataset}/{args.per_dataset} iNaturalist images "
                f"from {dataset} after checking {checked} rows."
            )

    summary = {
        "generated_at": datetime.now(UTC).isoformat(),
        "source": "huggingface-gt-csse",
        "huggingface_org": "https://huggingface.co/gt-csse",
        "datasets": datasets,
        "bucket": args.bucket,
        "prefix": args.prefix,
        "start_offset": args.start_offset,
        "uploaded_count": len(seeded),
        "total_bytes": sum(item.byte_size for item in seeded),
        "dataset_counts": dataset_counts,
        "items": [asdict(item) for item in seeded],
        "notes": [
            "HF rows are sampled from embedding datasets; image bytes are resolved from iNaturalist Open Data photo URLs.",
            "No downloaded images are committed to the repository.",
            f"Dataset pages: {', '.join('https://huggingface.co/datasets/' + quote(ds, safe='/') for ds in datasets)}",
        ],
    }
    write_summary(args.summary_path, summary)
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
