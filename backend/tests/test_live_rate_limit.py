import os
import time
import json
import urllib.request
import urllib.error
import concurrent.futures
import pytest

LIVE_BASE_URL = os.getenv("TEST_BASE_URL", "https://api.momoos.shop").rstrip("/")

DEFAULT_HEADERS = {
    # Custom User-Agent to avoid Cloudflare automated bot blocking
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}


def send_http_request(path: str, headers: dict = None) -> tuple[int, str, dict]:
    """Helper to dispatch requests to the live hosted API."""
    merged_headers = dict(DEFAULT_HEADERS)
    if headers:
        merged_headers.update(headers)

    url = f"{LIVE_BASE_URL}{path}"
    req = urllib.request.Request(url, headers=merged_headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.read().decode("utf-8"), {k.lower(): v for k, v in resp.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8"), {k.lower(): v for k, v in e.headers.items()}


@pytest.fixture(autouse=True, scope="module")
def require_live_server():
    """Skips live server tests gracefully if the remote server is unreachable."""
    try:
        req = urllib.request.Request(f"{LIVE_BASE_URL}/health", headers=DEFAULT_HEADERS)
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status != 200:
                pytest.skip(f"Live server at {LIVE_BASE_URL} returned status {resp.status}")
    except Exception as e:
        pytest.skip(f"Live server at {LIVE_BASE_URL} is not reachable from this environment: {e}")


def test_live_health_endpoint_is_exempt():
    """
    Verifies that the /health endpoint is explicitly exempted from rate limiting
    and returns 200 OK across multiple consecutive calls.
    """
    for _ in range(12):
        status, body, _ = send_http_request("/health")
        assert status == 200
        assert "ok" in body


def test_live_rate_limiting_enforced():
    """
    Verifies that sending more than 10 requests per second to an API route
    triggers HTTP 429 Too Many Requests.
    """
    # Brief pause to ensure clean window
    time.sleep(1.2)

    num_requests = 20
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_requests) as executor:
        results = list(executor.map(lambda _: send_http_request("/auth/google/url"), range(num_requests)))

    statuses = [res[0] for res in results]

    assert 200 in statuses, "At least some requests should succeed with 200"
    assert 429 in statuses, "Requests exceeding 10/sec must receive HTTP 429"

    # Verify the 429 error structure
    rate_limited = [res for res in results if res[0] == 429]
    sample_429 = rate_limited[0]
    error_status, error_body, error_headers = sample_429

    assert error_status == 429
    assert "retry-after" in error_headers or "Retry-After" in error_headers

    parsed_json = json.loads(error_body)
    assert parsed_json.get("error") == "Rate limit exceeded"
    assert "detail" in parsed_json


def test_live_rate_limit_resets_after_window():
    """
    Verifies that after the 1-second window expires, subsequent requests
    are admitted normally again with 200 OK.
    """
    # Wait for the rate-limit window (1s) to clear
    time.sleep(1.2)

    status, body, _ = send_http_request("/auth/google/url")
    assert status == 200
    assert "url" in body

