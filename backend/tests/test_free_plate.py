import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, User, Stamp
from schemas import FreePlateClaim
from main import (
    intent_to_get_free_plate,
    get_free_plate,
    get_free_plate_intent_status,
)
import claims


@pytest.fixture(autouse=True)
def clean_memory():
    claims._claims.clear()
    claims._free_plate_requests.clear()
    yield
    claims._claims.clear()
    claims._free_plate_requests.clear()


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_intent_to_get_free_plate_insufficient_stamps(db_session):
    user = User(email="customer1@momo.com", password_hash="dummy", role="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Add 4 stamps (insufficient: needs 5)
    for _ in range(4):
        db_session.add(Stamp(user_id=user.id, category="Steam Veg", claimed=False))
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        intent_to_get_free_plate(user=user, db=db_session)
    assert exc.value.status_code == 400
    assert "at least 5 unclaimed stamps" in exc.value.detail


def test_intent_to_get_free_plate_success_and_caching(db_session):
    user = User(email="customer2@momo.com", password_hash="dummy", name="Lucky Customer", role="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Add 5 stamps in Steam Veg and 2 in Afghani
    for _ in range(5):
        db_session.add(Stamp(user_id=user.id, category="Steam Veg", claimed=False))
    for _ in range(2):
        db_session.add(Stamp(user_id=user.id, category="Afghani", claimed=False))
    db_session.commit()

    res = intent_to_get_free_plate(user=user, db=db_session)
    assert res["success"] is True
    assert "Valid for 2 minutes" in res["message"]
    assert res["request"]["category_counts"]["Steam Veg"] == 5
    assert res["request"]["category_counts"]["Afghani"] == 2
    assert res["request"]["category_counts"]["Fried"] == 0

    # Verify cached
    status_res = get_free_plate_intent_status(user=user)
    assert status_res["active"] is True
    assert status_res["request"]["user_id"] == user.id


def test_intent_ignores_already_claimed_stamps(db_session):
    user = User(email="customer3@momo.com", password_hash="dummy", role="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # 5 stamps already claimed, 2 unclaimed
    for _ in range(5):
        db_session.add(Stamp(user_id=user.id, category="Steam Veg", claimed=True))
    for _ in range(2):
        db_session.add(Stamp(user_id=user.id, category="Steam Veg", claimed=False))
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        intent_to_get_free_plate(user=user, db=db_session)
    assert exc.value.status_code == 400


def test_get_free_plate_marks_stamps_as_claimed(db_session):
    admin = User(email="admin@momo.com", password_hash="dummy", role="admin")
    customer = User(email="customer4@momo.com", password_hash="dummy", role="user")
    db_session.add_all([admin, customer])
    db_session.commit()

    # Add 7 stamps in Steam Veg
    for _ in range(7):
        db_session.add(Stamp(user_id=customer.id, category="Steam Veg", claimed=False))
    db_session.commit()

    # Put request in cache
    claims.create_free_plate_request(customer, {"Steam Veg": 7})
    assert len(claims.get_active_free_plate_requests()) == 1

    # Admin claims 5 stamps
    claim_data = FreePlateClaim(user_id=customer.id, category="Steam Veg")
    res = get_free_plate(data=claim_data, _=admin, db=db_session)

    assert res["success"] is True
    assert res["claimed_count"] == 5
    assert len(res["claimed_stamp_ids"]) == 5

    # Check DB: exactly 5 stamps are now claimed, 2 remain unclaimed
    claimed_count = (
        db_session.query(Stamp)
        .filter(Stamp.user_id == customer.id, Stamp.category == "Steam Veg", Stamp.claimed == True)
        .count()
    )
    unclaimed_count = (
        db_session.query(Stamp)
        .filter(Stamp.user_id == customer.id, Stamp.category == "Steam Veg", Stamp.claimed == False)
        .count()
    )
    assert claimed_count == 5
    assert unclaimed_count == 2

    # Verify request removed from cache
    assert len(claims.get_active_free_plate_requests()) == 0


def test_get_free_plate_fails_if_insufficient_unclaimed(db_session):
    admin = User(email="admin@momo.com", password_hash="dummy", role="admin")
    customer = User(email="customer5@momo.com", password_hash="dummy", role="user")
    db_session.add_all([admin, customer])
    db_session.commit()

    # Only 3 stamps in Afghani
    for _ in range(3):
        db_session.add(Stamp(user_id=customer.id, category="Afghani", claimed=False))
    db_session.commit()

    claim_data = FreePlateClaim(user_id=customer.id, category="Afghani")
    with pytest.raises(HTTPException) as exc:
        get_free_plate(data=claim_data, _=admin, db=db_session)
    assert exc.value.status_code == 400
    assert "5 required" in exc.value.detail

