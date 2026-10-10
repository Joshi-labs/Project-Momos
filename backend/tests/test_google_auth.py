import pytest
from fastapi import HTTPException
import google_auth


def test_get_google_oauth_url(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id-123.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "https://momoos.shop/auth")

    url = google_auth.get_google_oauth_url()
    assert url.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
    assert "client_id=test-client-id-123.apps.googleusercontent.com" in url
    assert "redirect_uri=https%3A%2F%2Fmomoos.shop%2Fauth" in url
    assert "response_type=code" in url
    assert "scope=openid+email+profile" in url


def test_get_google_oauth_url_override_redirect(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id-123.apps.googleusercontent.com")

    url = google_auth.get_google_oauth_url(redirect_uri="http://localhost:4321/auth")
    assert "redirect_uri=http%3A%2F%2Flocalhost%3A4321%2Fauth" in url


def test_get_google_oauth_url_missing_client_id(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "")
    with pytest.raises(HTTPException) as exc:
        google_auth.get_google_oauth_url()
    assert exc.value.status_code == 500


def test_get_google_oauth_url_missing_redirect_uri(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "")
    with pytest.raises(HTTPException) as exc:
        google_auth.get_google_oauth_url()
    assert exc.value.status_code == 400


def test_exchange_code_missing_client_credentials(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "")
    with pytest.raises(HTTPException) as exc:
        google_auth.exchange_code_for_google_user("dummy_code", "http://localhost:4321/auth")
    assert exc.value.status_code == 500

