import pytest
from pydantic import ValidationError
from schemas import (
    UserRegister,
    UserLogin,
    StampClaim,
    StampStatusUpdate,
    GoogleAuthRequest,
)


def test_user_register_schema_valid():
    reg = UserRegister(email="chef@momo.com", password="securepassword", name="Chef John")
    assert reg.email == "chef@momo.com"
    assert reg.password == "securepassword"
    assert reg.name == "Chef John"


def test_user_register_schema_validation_errors():
    # Password too short (< 6 chars)
    with pytest.raises(ValidationError):
        UserRegister(email="valid@momo.com", password="123")

    # Email too short (< 3 chars)
    with pytest.raises(ValidationError):
        UserRegister(email="a", password="securepassword")

    # Password too long (> 72 chars for bcrypt limitation)
    with pytest.raises(ValidationError):
        UserRegister(email="valid@momo.com", password="a" * 73)


def test_user_login_schema():
    # Login with email
    l1 = UserLogin(email="user@momo.com", password="mypassword")
    assert l1.email == "user@momo.com"

    # Login with identity
    l2 = UserLogin(identity="admin", password="adminpassword")
    assert l2.identity == "admin"

    # Empty password should fail
    with pytest.raises(ValidationError):
        UserLogin(email="user@momo.com", password="")


def test_stamp_claim_schema():
    # Valid claim
    c = StampClaim(category="steam_momo", count=5)
    assert c.category == "steam_momo"
    assert c.count == 5

    # Default count is 1
    c_default = StampClaim(category="fried_momo")
    assert c_default.count == 1

    # Count out of bounds (> 10 or < 1)
    with pytest.raises(ValidationError):
        StampClaim(category="steamed", count=11)
    with pytest.raises(ValidationError):
        StampClaim(category="steamed", count=0)


def test_stamp_status_update_schema():
    # Valid case-insensitive status values: 'approved' or 'rejected'
    assert StampStatusUpdate(status="approved").status == "approved"
    assert StampStatusUpdate(status="APPROVED").status == "APPROVED"
    assert StampStatusUpdate(status="rejected").status == "rejected"
    assert StampStatusUpdate(status="Rejected").status == "Rejected"

    # Disallowed status values
    for invalid in ["pending", "declined", "cancelled", "unknown"]:
        with pytest.raises(ValidationError):
            StampStatusUpdate(status=invalid)


def test_google_auth_request_schema():
    req1 = GoogleAuthRequest(code="auth_code_123", redirect_uri="http://localhost:3000/callback")
    assert req1.code == "auth_code_123"

    req2 = GoogleAuthRequest(credential="google_jwt_credential")
    assert req2.credential == "google_jwt_credential"

