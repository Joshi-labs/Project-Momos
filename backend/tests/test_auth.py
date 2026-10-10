import os
import pytest
from auth import hash_password, verify_password, create_access_token


def test_password_hashing_and_verification():
    raw = "SuperSecret123!"
    hashed = hash_password(raw)

    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_create_access_token():
    token = create_access_token({"sub": "123", "role": "admin"})
    assert isinstance(token, str)
    assert len(token) > 20

