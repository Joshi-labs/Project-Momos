import pytest
from datetime import timedelta
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, User
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
)


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()


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


def test_get_current_user_valid(test_db):
    user = User(email="test@momo.com", password_hash="dummy_hash", name="Momo Fan", role="user")
    test_db.add(user)
    test_db.commit()

    token = create_access_token({"sub": str(user.id)})
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    current_user = get_current_user(creds, test_db)
    assert current_user.id == user.id
    assert current_user.email == "test@momo.com"


def test_get_current_user_missing_credentials(test_db):
    with pytest.raises(HTTPException) as exc:
        get_current_user(None, test_db)
    assert exc.value.status_code == 401


def test_get_current_user_invalid_token(test_db):
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.signature")
    with pytest.raises(HTTPException) as exc:
        get_current_user(creds, test_db)
    assert exc.value.status_code == 401


def test_get_current_user_expired_token(test_db):
    user = User(email="expired@momo.com", password_hash="dummy_hash", role="user")
    test_db.add(user)
    test_db.commit()

    # Create token expired 1 hour ago
    expired_token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(hours=-1))
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)

    with pytest.raises(HTTPException) as exc:
        get_current_user(creds, test_db)
    assert exc.value.status_code == 401


def test_get_current_admin_authorization(test_db):
    normal_user = User(email="user@momo.com", password_hash="hash", role="user")
    admin_user = User(email="chef@momo.com", password_hash="hash", role="admin")
    test_db.add_all([normal_user, admin_user])
    test_db.commit()

    # Normal user should be rejected with 403 Forbidden
    with pytest.raises(HTTPException) as exc:
        get_current_admin(normal_user)
    assert exc.value.status_code == 403

    # Admin user should succeed
    admin_res = get_current_admin(admin_user)
    assert admin_res.id == admin_user.id
    assert admin_res.role == "admin"
