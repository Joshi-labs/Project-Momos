import os
import urllib.parse
from typing import Optional, Dict, Any
import requests
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_google_client_id() -> str:
    return os.getenv("GOOGLE_CLIENT_ID", "").strip()


def get_google_client_secret() -> str:
    return os.getenv("GOOGLE_CLIENT_SECRET", "").strip()


def get_default_redirect_uri() -> str:
    return os.getenv("GOOGLE_REDIRECT_URI", "").strip()


def get_google_oauth_url(redirect_uri: Optional[str] = None) -> str:
    client_id = get_google_client_id()
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in backend/.env",
        )

    effective_redirect_uri = (redirect_uri or get_default_redirect_uri()).strip()
    if not effective_redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="redirect_uri is required. Provide it in query param or set GOOGLE_REDIRECT_URI in backend/.env",
        )

    params = {
        "client_id": client_id,
        "redirect_uri": effective_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_BASE_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_google_user(code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    client_id = get_google_client_id()
    client_secret = get_google_client_secret()
    effective_redirect_uri = (redirect_uri or get_default_redirect_uri()).strip()

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env",
        )

    if not effective_redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="redirect_uri is required for exchanging Google authorization code.",
        )

    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": effective_redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        resp = requests.post(GOOGLE_TOKEN_URL, data=payload, timeout=10)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Network error contacting Google OAuth token endpoint: {str(e)}",
        )

    if not resp.ok:
        try:
            err_data = resp.json()
            err_desc = err_data.get("error_description") or err_data.get("error") or resp.text
        except Exception:
            err_desc = resp.text
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google token exchange failed: {err_desc}",
        )

    token_data = resp.json()
    access_token = token_data.get("access_token")
    raw_id_token = token_data.get("id_token")

    user_info = None

    # Option 1: Verify and decode id_token if present
    if raw_id_token:
        try:
            req = google_requests.Request()
            verified = google_id_token.verify_oauth2_token(raw_id_token, req, client_id)
            if verified and verified.get("email"):
                user_info = verified
        except Exception:
            pass

    # Option 2: Fallback to Google userinfo endpoint with access_token
    if not user_info and access_token:
        try:
            userinfo_resp = requests.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            if userinfo_resp.ok:
                user_info = userinfo_resp.json()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error fetching Google user profile: {str(e)}",
            )

    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve verified email address from Google.",
        )

    return user_info


def verify_direct_google_id_token(token: str) -> Dict[str, Any]:
    client_id = get_google_client_id()
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_ID is not configured in backend/.env",
        )
    try:
        req = google_requests.Request()
        id_info = google_id_token.verify_oauth2_token(token, req, client_id)
        if not id_info.get("email"):
            raise ValueError("Token missing email claim.")
        return id_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {str(e)}",
        )

