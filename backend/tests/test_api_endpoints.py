import os
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, User
from schemas import UserRegister, UserLogin
from main import register, login, seed_users, health


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_health_check_endpoint():
    res = health()
    assert res == {"status": "ok"}


def test_register_new_user(db_session):
    data = UserRegister(email="newuser@momo.com", password="secretpassword123", name="New Momo Fan")
    result = register(data, db_session)

    assert result["success"] is True
    assert result["record"]["email"] == "newuser@momo.com"
    assert result["record"]["name"] == "New Momo Fan"
    assert result["record"]["role"] == "user"

    # User in database has hashed password
    user = db_session.query(User).filter(User.email == "newuser@momo.com").first()
    assert user is not None
    assert user.password_hash != "secretpassword123"


def test_register_duplicate_email(db_session):
    data = UserRegister(email="duplicate@momo.com", password="password123", name="Duplicate")
    register(data, db_session)

    # Registering same email (even with different case) should fail with 400
    duplicate_data = UserRegister(email="DUPLICATE@momo.com", password="password123", name="Duplicate 2")
    with pytest.raises(HTTPException) as exc:
        register(duplicate_data, db_session)
    assert exc.value.status_code == 400
    assert "already exists" in exc.value.detail


def test_login_successful_with_email(db_session):
    register(UserRegister(email="loginuser@momo.com", password="correctpassword"), db_session)

    login_data = UserLogin(email="loginuser@momo.com", password="correctpassword")
    result = login(login_data, db_session)

    assert "token" in result
    assert result["user"]["email"] == "loginuser@momo.com"


def test_login_successful_with_identity(db_session):
    register(UserRegister(email="identityuser@momo.com", password="correctpassword"), db_session)

    login_data = UserLogin(identity="identityuser@momo.com", password="correctpassword")
    result = login(login_data, db_session)

    assert "token" in result
    assert result["user"]["email"] == "identityuser@momo.com"


def test_login_invalid_password(db_session):
    register(UserRegister(email="wrongpass@momo.com", password="correctpassword"), db_session)

    login_data = UserLogin(email="wrongpass@momo.com", password="wrongpassword")
    with pytest.raises(HTTPException) as exc:
        login(login_data, db_session)
    assert exc.value.status_code == 401
    assert "Invalid email or password" in exc.value.detail


def test_login_nonexistent_user(db_session):
    login_data = UserLogin(email="notfound@momo.com", password="anypassword")
    with pytest.raises(HTTPException) as exc:
        login(login_data, db_session)
    assert exc.value.status_code == 401


def test_seed_users_from_environment(db_session, monkeypatch):
    monkeypatch.setenv("ADMIN_ID", "headchef@momo.com")
    monkeypatch.setenv("ADMIN_PASS", "headchefpass123")
    monkeypatch.setenv("ADMIN_NAME", "Head Chef")

    seed_users(db_session)

    admin = db_session.query(User).filter(User.email == "headchef@momo.com").first()
    assert admin is not None
    assert admin.role == "admin"
    assert admin.name == "Head Chef"

    # Idempotent: Calling seed_users again should not duplicate user
    seed_users(db_session)
    admin_count = db_session.query(User).filter(User.email == "headchef@momo.com").count()
    assert admin_count == 1

