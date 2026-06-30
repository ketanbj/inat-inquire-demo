import asyncio

import httpx
import pytest

from app.pipeline import PipelinePayloadError, _histogram_quantile_ms, _public_object_url
from app.pipeline import fetch_pipeline_metrics, pipeline_is_online, presigned_object_url
from app.pipeline import search_live_pipeline, summarize_prometheus_metrics


def test_public_object_url_prefers_local_s3_key():
    url = _public_object_url(
        "http://localhost:9000",
        "s3://pipeline/hf-inat/gt-csse__inat-open-data-embeddings/12750775.jpg",
        "hf-inat/gt-csse__inat-open-data-embeddings/12750775.jpg",
    )

    assert url == "http://localhost:9000/pipeline/hf-inat/gt-csse__inat-open-data-embeddings/12750775.jpg"


def test_public_object_url_encodes_object_key_and_uses_s3_uri_bucket():
    url = _public_object_url(
        "http://localhost:9000/",
        "s3://custom-bucket/folder with spaces/sample image.jpg",
        "",
    )

    assert url == "http://localhost:9000/custom-bucket/folder%20with%20spaces/sample%20image.jpg"


def test_object_url_helpers_return_empty_without_location():
    class FakeS3Client:
        def generate_presigned_url(self, *_args, **_kwargs):
            raise AssertionError("presign should not be called without an object location")

    assert _public_object_url("http://localhost:9000", "", "") == ""
    assert presigned_object_url(FakeS3Client(), "", "", expires_in_seconds=60) == ""


def test_public_object_url_prefers_s3_key_over_malformed_s3_uri_bucket():
    url = _public_object_url(
        "http://localhost:9000",
        "s3://hf-inat/batch-1/sample.jpg",
        "hf-inat/batch-1/sample.jpg",
    )

    assert url == "http://localhost:9000/pipeline/hf-inat/batch-1/sample.jpg"


def test_presigned_object_url_uses_bucket_key_and_expiry():
    class FakeS3Client:
        def __init__(self):
            self.call = None

        def generate_presigned_url(self, operation, *, Params, ExpiresIn):
            self.call = (operation, Params, ExpiresIn)
            return "http://localhost:9000/pipeline/sample.jpg?X-Amz-Signature=abc"

    client = FakeS3Client()
    url = presigned_object_url(
        client,
        "s3://pipeline/folder with spaces/sample image.jpg",
        "",
        expires_in_seconds=900,
    )

    assert url == "http://localhost:9000/pipeline/sample.jpg?X-Amz-Signature=abc"
    assert client.call == (
        "get_object",
        {"Bucket": "pipeline", "Key": "folder with spaces/sample image.jpg"},
        900,
    )


def test_presigned_object_url_prefers_s3_key_over_malformed_s3_uri_bucket():
    class FakeS3Client:
        def __init__(self):
            self.call = None

        def generate_presigned_url(self, operation, *, Params, ExpiresIn):
            self.call = (operation, Params, ExpiresIn)
            return "http://localhost:9000/pipeline/hf-inat/batch-1/sample.jpg?X-Amz-Signature=abc"

    client = FakeS3Client()
    presigned_object_url(
        client,
        "s3://hf-inat/batch-1/sample.jpg",
        "hf-inat/batch-1/sample.jpg",
        expires_in_seconds=900,
    )

    assert client.call == (
        "get_object",
        {"Bucket": "pipeline", "Key": "hf-inat/batch-1/sample.jpg"},
        900,
    )


def test_pipeline_health_and_metric_fetch_helpers():
    async def run_checks():
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(lambda _: httpx.Response(200, text="metric 1"))
        ) as client:
            assert await pipeline_is_online("http://pipeline.test", client) is True
            assert await fetch_pipeline_metrics("http://pipeline.test", client) == "metric 1"

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(lambda _: (_ for _ in ()).throw(httpx.ConnectError("no")))
        ) as client:
            assert await pipeline_is_online("http://pipeline.test", client) is False

    asyncio.run(run_checks())


def test_search_live_pipeline_uses_signed_image_url_factory():
    async def run_search():
        transport = httpx.MockTransport(
            lambda _: httpx.Response(
                200,
                json={
                    "query": "nudibranch",
                    "collection": "inat-demo-live",
                    "results": [
                        {
                            "id": "1",
                            "score": 0.91,
                            "s3_uri": "s3://pipeline/hf-inat/sample.jpg",
                            "s3_key": "hf-inat/sample.jpg",
                        }
                    ],
                },
            )
        )
        async with httpx.AsyncClient(transport=transport) as client:
            return await search_live_pipeline(
                base_url="http://pipeline.test",
                client=client,
                query="nudibranch",
                limit=1,
                collection="inat-demo-live",
                minio_public_url="http://localhost:9000",
                object_url_factory=lambda _s3_uri, s3_key: f"http://signed.test/{s3_key}",
            )

    response = asyncio.run(run_search())

    assert response.results[0].image_url == "http://signed.test/hf-inat/sample.jpg"


def test_search_live_pipeline_uses_seed_metadata_and_defaults():
    async def run_search():
        transport = httpx.MockTransport(
            lambda _: httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "id": "",
                            "score": "0.82",
                            "s3_uri": "s3://pipeline/hf-inat/seeded.jpg",
                            "s3_key": "hf-inat/seeded.jpg",
                            "format": "jpeg",
                            "width": "1200",
                            "height": "900",
                        }
                    ],
                },
            )
        )
        async with httpx.AsyncClient(transport=transport) as client:
            return await search_live_pipeline(
                base_url="http://pipeline.test",
                client=client,
                query="lichen",
                limit=1,
                collection=None,
                minio_public_url="http://localhost:9000",
                seed_lookup={
                    "hf-inat/seeded.jpg": {
                        "dataset": "gt-csse/inat-open-data-embeddings",
                        "source_url": "https://example.test/source",
                        "license": "CC BY",
                    }
                },
            )

    response = asyncio.run(run_search())

    assert response.query == "lichen"
    assert response.collection == "documents"
    assert response.total == 1
    assert response.results[0].dataset == "gt-csse/inat-open-data-embeddings"
    assert response.results[0].image_url == "http://localhost:9000/pipeline/hf-inat/seeded.jpg"


def test_search_live_pipeline_rejects_unexpected_payload_shapes():
    async def run_search(payload):
        transport = httpx.MockTransport(lambda _: httpx.Response(200, json=payload))
        async with httpx.AsyncClient(transport=transport) as client:
            return await search_live_pipeline(
                base_url="http://pipeline.test",
                client=client,
                query="lichen",
                limit=1,
                collection=None,
                minio_public_url="http://localhost:9000",
            )

    with pytest.raises(PipelinePayloadError, match="must be a JSON object"):
        asyncio.run(run_search(["not", "an", "object"]))
    with pytest.raises(PipelinePayloadError, match="must be a list"):
        asyncio.run(run_search({"results": {"id": "not-a-list"}}))


def test_search_live_pipeline_skips_bad_items_and_defaults_bad_numbers():
    async def run_search():
        transport = httpx.MockTransport(
            lambda _: httpx.Response(
                200,
                json={
                    "results": [
                        "not-a-result",
                        {
                            "score": "not-a-score",
                            "width": "wide",
                            "height": "7",
                            "s3_key": "",
                            "s3_uri": "",
                        },
                    ],
                    "total": "not-a-total",
                },
            )
        )
        async with httpx.AsyncClient(transport=transport) as client:
            return await search_live_pipeline(
                base_url="http://pipeline.test",
                client=client,
                query="lichen",
                limit=2,
                collection=None,
                minio_public_url="http://localhost:9000",
            )

    response = asyncio.run(run_search())

    assert response.total == 1
    assert response.results[0].id == "2"
    assert response.results[0].score == 0.0
    assert response.results[0].image_url == ""
    assert response.results[0].width is None
    assert response.results[0].height == 7


def test_prometheus_summary_parses_labeled_samples():
    metrics = """
    inatinq_ingestion_documents_processed_total{status="success",source="a,b"} 12
    inatinq_ingestion_documents_processed_total{status="failed"} 1
    inatinq_search_vector_query_duration_seconds_bucket{le="0.1"} 1
    inatinq_search_vector_query_duration_seconds_bucket{le="0.2"} 2
    """

    summary = summarize_prometheus_metrics(metrics)

    assert summary["ingested_success_total"] == 12
    assert summary["ingested_failed_total"] == 1
    assert summary["vector_query_p95_ms"] == 200


def test_prometheus_summary_extracts_cache_checkpoint_and_embedding_metrics():
    metrics = """
    # comments and malformed lines are ignored
    malformed
    invalid_value nope
    inatinq_ingestion_checkpoint_saves_total 2
    inatinq_cache_hits_total 3
    inatinq_cache_misses_total 1
    inatinq_search_embedding_duration_seconds_bucket{le="0.05"} 1
    inatinq_search_embedding_duration_seconds_bucket{le="0.2"} 4
    inatinq_search_embedding_duration_seconds_bucket{le="+Inf"} 4
    """

    summary = summarize_prometheus_metrics(metrics)

    assert summary["checkpoint_saves"] == 2
    assert summary["cache_hit_ratio"] == "75%"
    assert summary["embedding_p95_ms"] == 200


def test_histogram_quantile_handles_empty_invalid_and_zero_buckets():
    assert _histogram_quantile_ms([], "bucket", 0.95) is None
    assert _histogram_quantile_ms([("bucket", {"le": "bad"}, 1)], "bucket", 0.95) is None
    assert _histogram_quantile_ms([("bucket", {"le": "0.1"}, 0)], "bucket", 0.95) is None
    assert _histogram_quantile_ms([("bucket", {"le": "0.1"}, 1)], "bucket", 2) == 100
