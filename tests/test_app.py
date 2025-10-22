from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)

# Keep a deep copy of the original activities so tests can restore state
import copy
ORIGINAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def restore_activities():
    # Before each test, reset activities to original
    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL_ACTIVITIES))
    yield


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure not present initially
    assert email not in activities[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Attempt duplicate signup should fail
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400

    # Unregister
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]


def test_signup_nonexistent_activity():
    resp = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert resp.status_code == 404


def test_unregister_nonexistent_activity():
    resp = client.post("/activities/NoSuchActivity/unregister?email=a@b.com")
    assert resp.status_code == 404


def test_unregister_not_registered():
    activity = "Chess Club"
    resp = client.post(f"/activities/{activity}/unregister?email=not@here.com")
    assert resp.status_code == 400
