import os
import time
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


def parse_rate_limit(rate_str: str) -> tuple[int, int]:
    """
    Parses rate limit strings such as:
      - '10/sec', '10/second', '10/s' -> (10, 1)
      - '100/min', '100/minute', '100/m' -> (100, 60)
      - '1000/hour', '1000/h' -> (1000, 3600)
    Defaults to (10, 1) [10 per second].
    """
    try:
        parts = rate_str.strip().split("/")
        count = int(parts[0])
        unit = parts[1].lower().strip() if len(parts) > 1 else "sec"
        if "sec" in unit or unit == "s":
            window = 1
        elif "min" in unit or unit == "m":
            window = 60
        elif "hour" in unit or unit == "h" or "hr" in unit:
            window = 3600
        else:
            window = 1
        return count, window
    except Exception:
        return 10, 1


def get_client_ip(request: Request) -> str:
    """
    Extracts client IP. Prioritizes Cloudflare CF-Connecting-IP,
    then X-Forwarded-For, and falls back to socket host.
    """
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip and cf_ip.strip():
        return cf_ip.strip()

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded and forwarded.strip():
        return forwarded.split(",")[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory sliding-window rate limiter middleware.
    Defaults to 10 requests per second (10/sec) if RATE_LIMIT is not set in environment.
    """

    def __init__(self, app, rate_limit: Optional[str] = None):
        super().__init__(app)
        env_rate = os.getenv("RATE_LIMIT")
        limit_str = (
            rate_limit
            or (env_rate.strip() if env_rate and env_rate.strip() else None)
            or "10/sec"
        )
        self.max_requests, self.window_seconds = parse_rate_limit(limit_str)
        self.requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        # Exempt health check and API documentation
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        client_ip = get_client_ip(request)
        now = time.time()
        window_start = now - self.window_seconds

        # Filter timestamps within active window
        history = [t for t in self.requests.get(client_ip, []) if t > window_start]

        if len(history) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Allowed {self.max_requests} requests per {self.window_seconds}s. Please slow down.",
                },
                headers={"Retry-After": str(self.window_seconds)},
            )

        history.append(now)
        self.requests[client_ip] = history
        return await call_next(request)
