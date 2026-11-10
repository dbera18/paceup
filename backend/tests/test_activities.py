import pytest


def post(client, **fields):
    return client.post("/activities", json=fields)


def error_messages(response):
    return " ".join(err["msg"] for err in response.json()["detail"])


# ---------- valid activities ----------


def test_valid_run(client):
    response = post(
        client,
        activity_type="run",
        distance_m=5000,
        duration_s=1650,  # 27:30
        avg_heart_rate=152,
        purpose="for_a_cause",
        note="Parkrun with the club",
        display_name="Sam",
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"] > 0
    assert data["activity_type"] == "run"
    assert data["distance_m"] == 5000
    assert data["duration_s"] == 1650
    assert data["avg_heart_rate"] == 152
    assert data["purpose"] == "for_a_cause"
    assert data["note"] == "Parkrun with the club"
    assert data["display_name"] == "Sam"
    assert "created_at" in data


def test_valid_gym_session_without_distance(client):
    response = post(client, activity_type="gym", duration_s=45 * 60)
    assert response.status_code == 201
    data = response.json()
    assert data["distance_m"] is None
    assert data["pace_s_per_km"] is None
    assert data["avg_heart_rate"] is None
    assert data["purpose"] is None
    assert data["note"] is None
    assert data["display_name"] is None


def test_blank_note_and_name_become_none(client):
    response = post(client, activity_type="walk", duration_s=600, note="  ", display_name=" ")
    assert response.status_code == 201
    assert response.json()["note"] is None
    assert response.json()["display_name"] is None


def test_boundary_values_are_accepted(client):
    assert post(client, activity_type="ride", distance_m=0, duration_s=1).status_code == 201
    assert post(client, activity_type="ride", distance_m=500_000, duration_s=86_400).status_code == 201
    assert post(client, activity_type="run", duration_s=60, avg_heart_rate=30).status_code == 201
    assert post(client, activity_type="run", duration_s=60, avg_heart_rate=250).status_code == 201


# ---------- pace ----------


def test_pace_calculation(client):
    # 5 km in 27:30 → 330 seconds per km → 5:30 / km
    data = post(client, activity_type="run", distance_m=5000, duration_s=1650).json()
    assert data["pace_s_per_km"] == 330.0


def test_pace_with_uneven_distance(client):
    # 10.5 km in 1 hour → 342.857… s/km, rounded to 1 decimal
    data = post(client, activity_type="run", distance_m=10_500, duration_s=3600).json()
    assert data["pace_s_per_km"] == 342.9


def test_no_pace_for_zero_distance(client):
    data = post(client, activity_type="other", distance_m=0, duration_s=300).json()
    assert data["pace_s_per_km"] is None


def test_pace_is_not_stored():
    from app.models import Activity

    assert "pace_s_per_km" not in Activity.__table__.columns


# ---------- rejected values ----------


@pytest.mark.parametrize(
    "fields, expected",
    [
        ({"distance_m": -1}, "between 0 and 500,000 meters"),
        ({"distance_m": 500_001}, "between 0 and 500,000 meters"),
        ({"duration_s": 0}, "between 1 second and 24 hours"),
        ({"duration_s": 86_401}, "between 1 second and 24 hours"),
        ({"avg_heart_rate": 29}, "between 30 and 250 bpm"),
        ({"avg_heart_rate": 251}, "between 30 and 250 bpm"),
    ],
)
def test_rejects_out_of_range_values(client, fields, expected):
    payload = {"activity_type": "run", "distance_m": 5000, "duration_s": 1500, **fields}
    response = client.post("/activities", json=payload)
    assert response.status_code == 422
    assert expected in error_messages(response)


def test_rejects_unknown_activity_type(client):
    assert post(client, activity_type="skydive", duration_s=60).status_code == 422


def test_rejects_unknown_purpose(client):
    assert post(client, activity_type="run", duration_s=60, purpose="fame").status_code == 422


def test_requires_duration(client):
    response = post(client, activity_type="run", distance_m=5000)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "duration_s"]


def test_requires_activity_type(client):
    assert post(client, duration_s=60).status_code == 422


def test_rejects_long_note(client):
    assert post(client, activity_type="run", duration_s=60, note="a" * 500).status_code == 201
    assert post(client, activity_type="run", duration_s=60, note="a" * 501).status_code == 422


# ---------- listing ----------


def test_list_activities_newest_first(client):
    post(client, activity_type="run", duration_s=60, note="first")
    post(client, activity_type="swim", duration_s=60, note="second")
    response = client.get("/activities")
    assert response.status_code == 200
    assert [a["note"] for a in response.json()] == ["second", "first"]


def test_list_activities_defaults_to_50(client):
    for _ in range(55):
        post(client, activity_type="walk", duration_s=60)
    assert len(client.get("/activities").json()) == 50


# ---------- start time (when the workout happened) ----------


def test_started_at_is_saved_and_returned(client):
    data = post(client, activity_type="run", duration_s=1800, started_at="2026-11-04T07:00:00-05:00").json()
    assert data["started_at"] == "2026-11-04T12:00:00Z"  # stored and returned in UTC


def test_started_at_is_optional(client):
    data = post(client, activity_type="walk", duration_s=600).json()
    assert data["started_at"] is None


def test_started_at_without_time_zone_is_treated_as_utc(client):
    data = post(client, activity_type="run", duration_s=60, started_at="2026-11-04T12:00:00").json()
    assert data["started_at"] == "2026-11-04T12:00:00Z"


def test_rejects_started_at_in_the_future(client):
    response = post(client, activity_type="run", duration_s=60, started_at="2099-01-01T00:00:00Z")
    assert response.status_code == 422
    assert "can't be in the future" in error_messages(response)


def test_rejects_started_at_before_1990(client):
    response = post(client, activity_type="run", duration_s=60, started_at="1985-06-01T00:00:00Z")
    assert response.status_code == 422
    assert "1990 or later" in error_messages(response)
