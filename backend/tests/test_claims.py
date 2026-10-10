import time
import pytest
from models import User
import claims


@pytest.fixture(autouse=True)
def clean_claims_memory():
    """Ensure in-memory claims store is clean before and after each test."""
    claims._claims.clear()
    yield
    claims._claims.clear()


def test_create_and_get_claim():
    user = User(id=1, email="test@momo.com", name="Tester", role="user")
    claim = claims.create_claim(user, category="steamed", count=2)

    assert claim["user_id"] == 1
    assert claim["category"] == "steamed"
    assert claim["count"] == 2
    assert claim["status"] == "pending"
    assert "expand" in claim
    assert claim["expand"]["user"]["email"] == "test@momo.com"

    active = claims.get_active_claims()
    assert len(active) == 1
    assert active[0]["id"] == claim["id"]


def test_claim_count_clamping():
    user = User(id=2, email="clamp@momo.com", name="Clamp", role="user")

    # Count > 10 should clamp to 10
    claim_max = claims.create_claim(user, category="fried", count=99)
    assert claim_max["count"] == 10

    # Count < 1 should clamp to 1
    claim_min = claims.create_claim(user, category="jhol", count=-5)
    assert claim_min["count"] == 1


def test_claim_deduplication_per_user():
    user = User(id=3, email="dedup@momo.com", name="Dedup", role="user")

    # Create first claim
    c1 = claims.create_claim(user, category="steamed", count=1)
    assert len(claims.get_user_pending(3)) == 1

    # Creating a second claim replaces the old pending claim
    c2 = claims.create_claim(user, category="kothey", count=2)
    user_claims = claims.get_user_pending(3)

    assert len(user_claims) == 1
    assert user_claims[0]["id"] == c2["id"]
    assert user_claims[0]["category"] == "kothey"


def test_pop_and_restore_claim():
    user = User(id=4, email="pop@momo.com", name="Pop", role="user")
    claim = claims.create_claim(user, category="steamed", count=1)
    cid = claim["id"]

    # Pop removes the claim
    popped = claims.pop_claim(cid)
    assert popped is not None
    assert popped["id"] == cid
    assert claims.pop_claim(cid) is None
    assert len(claims.get_active_claims()) == 0

    # Restore puts the claim back
    claims.restore_claim(popped)
    assert len(claims.get_active_claims()) == 1
    assert claims.get_active_claims()[0]["id"] == cid


def test_claim_ttl_expiration():
    user = User(id=5, email="ttl@momo.com", name="TTL", role="user")
    claim = claims.create_claim(user, category="steamed", count=1)

    # Manually backdate expires_at to simulate expiration
    claims._claims[claim["id"]]["expires_at"] = time.time() - 10

    # Calling active claims should trigger cleanup
    assert len(claims.get_active_claims()) == 0
    assert len(claims.get_user_pending(5)) == 0

