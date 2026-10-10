import pytest
from starlette.requests import Request
from rate_limiter import parse_rate_limit, get_client_ip


def test_parse_rate_limit_units():
    # Second / sec / s
    assert parse_rate_limit("10/sec") == (10, 1)
    assert parse_rate_limit("5/second") == (5, 1)
    assert parse_rate_limit("1/s") == (1, 1)

    # Minute / min / m
    assert parse_rate_limit("100/min") == (100, 60)
    assert parse_rate_limit("60/minute") == (60, 60)
    assert parse_rate_limit("30/m") == (30, 60)

    # Hour / h
    assert parse_rate_limit("1000/hour") == (1000, 3600)
    assert parse_rate_limit("500/h") == (500, 3600)

    # Fallback on invalid inputs
    assert parse_rate_limit("invalid") == (10, 1)
    assert parse_rate_limit("") == (10, 1)


def test_get_client_ip_prioritizes_cloudflare():
    # Cloudflare Tunnel header
    scope_cf = {
        "type": "http",
        "headers": [
            (b"cf-connecting-ip", b"203.0.113.10"),
            (b"x-forwarded-for", b"198.51.100.1, 10.0.0.1"),
        ],
        "client": ("127.0.0.1", 12345),
    }
    assert get_client_ip(Request(scope_cf)) == "203.0.113.10"


def test_get_client_ip_falls_back_to_x_forwarded_for():
    # X-Forwarded-For with multiple proxies
    scope_xff = {
        "type": "http",
        "headers": [
            (b"x-forwarded-for", b"198.51.100.25, 172.16.0.2, 10.0.0.5"),
        ],
        "client": ("127.0.0.1", 12345),
    }
    assert get_client_ip(Request(scope_xff)) == "198.51.100.25"


def test_get_client_ip_falls_back_to_socket_client():
    # Direct socket connection without headers
    scope_direct = {
        "type": "http",
        "headers": [],
        "client": ("192.168.1.42", 54321),
    }
    assert get_client_ip(Request(scope_direct)) == "192.168.1.42"

