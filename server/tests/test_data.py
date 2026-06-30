import pytest

from app.data import DataArtifactError, _load_runtime_ingestion_runs, load_benchmark_summary
from app.data import load_live_seed_lookup, load_production_readiness
from tests.helpers import benchmark_payload, production_readiness_payload, write_json


def test_live_seed_lookup_reads_runtime_summary(tmp_path):
    runtime_dir = tmp_path / "runtime"
    runtime_dir.mkdir()
    (runtime_dir / "hf-live-seed-summary.json").write_text(
        """
        {
          "items": [
            {
              "dataset": "gt-csse/inat-open-data-embeddings",
              "s3_key": "hf-inat/sample.jpg",
              "source_url": "https://example.test/sample.jpg",
              "license": "example-license"
            }
          ]
        }
        """,
        encoding="utf-8",
    )

    lookup = load_live_seed_lookup(tmp_path)

    assert lookup["hf-inat/sample.jpg"]["dataset"] == "gt-csse/inat-open-data-embeddings"


def test_live_seed_lookup_reads_incremental_batch_summaries(tmp_path):
    runtime_dir = tmp_path / "runtime"
    runtime_dir.mkdir()
    (runtime_dir / "hf-live-seed-batch-2.json").write_text(
        """
        {
          "items": [
            {
              "dataset": "gt-csse/iNat24-vit-b-16",
              "s3_key": "hf-inat/batch-2/sample.jpg",
              "source_url": "https://example.test/sample-2.jpg",
              "license": "example-license"
            }
          ]
        }
        """,
        encoding="utf-8",
    )

    lookup = load_live_seed_lookup(tmp_path)

    assert lookup["hf-inat/batch-2/sample.jpg"]["dataset"] == "gt-csse/iNat24-vit-b-16"


def test_live_seed_lookup_returns_empty_without_runtime_artifacts(tmp_path):
    assert load_live_seed_lookup(tmp_path) == {}


def test_live_seed_lookup_skips_corrupt_runtime_summary(tmp_path):
    runtime_dir = tmp_path / "runtime"
    runtime_dir.mkdir()
    (runtime_dir / "hf-live-seed-batch-1.json").write_text("{", encoding="utf-8")

    assert load_live_seed_lookup(tmp_path) == {}


def test_live_seed_lookup_skips_non_object_items(tmp_path):
    runtime_dir = tmp_path / "runtime"
    runtime_dir.mkdir()
    write_json(
        runtime_dir / "hf-live-seed-summary.json",
        {"items": ["not-an-object", {"s3_key": "hf-inat/valid.jpg", "dataset": "valid"}]},
    )

    assert load_live_seed_lookup(tmp_path) == {
        "hf-inat/valid.jpg": {"s3_key": "hf-inat/valid.jpg", "dataset": "valid"}
    }


def test_benchmark_summary_load_errors_are_descriptive(tmp_path):
    with pytest.raises(DataArtifactError, match="Required demo data artifact is missing"):
        load_benchmark_summary(tmp_path)

    write_json(tmp_path / "evidence" / "benchmark-summary.json", {"dataset": "missing-fields"})

    with pytest.raises(DataArtifactError, match="Benchmark summary schema validation failed"):
        load_benchmark_summary(tmp_path)


def test_production_readiness_load_errors_are_descriptive(tmp_path):
    write_json(tmp_path / "evidence" / "benchmark-summary.json", benchmark_payload())
    payload = production_readiness_payload()
    payload["control_plane"] = "not-an-object"
    write_json(tmp_path / "evidence" / "production-readiness.json", payload)

    with pytest.raises(DataArtifactError, match="Production readiness schema validation failed"):
        load_production_readiness(tmp_path)


def test_runtime_ingestion_runs_handle_missing_and_corrupt_summaries(tmp_path):
    assert _load_runtime_ingestion_runs(tmp_path) == []

    runtime_dir = tmp_path / "runtime"
    runtime_dir.mkdir()
    (runtime_dir / "live-ingest-batch-1-summary.json").write_text("{", encoding="utf-8")
    write_json(runtime_dir / "live-ingest-batch-2-summary.json", {"batch": 2})

    runs = _load_runtime_ingestion_runs(tmp_path)

    assert runs[0]["batch"] == 2
    assert runs[0]["source_artifact"].endswith("runtime/live-ingest-batch-2-summary.json")
