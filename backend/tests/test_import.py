"""Tests for POST /activities/import (reads a workout file, returns a summary preview)."""

from pathlib import Path

from tests.fit_builder import build_fit

SAMPLES = Path(__file__).parent / "samples"


def upload(client, filename, content, content_type="application/octet-stream"):
    return client.post("/activities/import", files={"file": (filename, content, content_type)})


# ---------- valid files ----------


def test_valid_gpx_run(client):
    response = upload(client, "Morning_Run.gpx", (SAMPLES / "run.gpx").read_bytes(), "application/gpx+xml")
    assert response.status_code == 200
    data = response.json()
    assert data["activity_type"] == "run"
    assert 1950 < data["distance_m"] < 2050  # ~2 km between the three points
    assert data["duration_s"] == 600  # 12:00 → 12:10
    assert data["avg_heart_rate"] == 148  # (140 + 150 + 154) / 3
    assert data["started_at"].startswith("2026-11-04T12:00:00")
    assert data["source_format"] == "gpx"


def test_valid_fit_file(client):
    response = upload(client, "garmin_activity.fit", (SAMPLES / "run.fit").read_bytes())
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "activity_type": "run",
        "distance_m": 5200.0,
        "duration_s": 1900,
        "avg_heart_rate": 148,
        "started_at": "2026-11-06T06:45:00Z",
        "source_format": "fit",
    }


def test_valid_fit_ride_without_heart_rate(client):
    content = build_fit(sport="cycling", distance_m=20_000, duration_s=3600, avg_heart_rate=None)
    data = upload(client, "ride.FIT", content).json()  # upper-case extension is fine
    assert data["activity_type"] == "ride"
    assert data["distance_m"] == 20_000
    assert data["avg_heart_rate"] is None


def test_valid_tcx_ride(client):
    data = upload(client, "ride.tcx", (SAMPLES / "ride.tcx").read_bytes()).json()
    assert data["activity_type"] == "ride"
    assert data["distance_m"] == 12_000  # two laps added together
    assert data["duration_s"] == 1800
    assert data["avg_heart_rate"] == 135  # weighted by lap time: (130×1200 + 145×600) / 1800


# ---------- privacy: summary only, nothing saved ----------


def test_preview_contains_no_location_data(client):
    data = upload(client, "run.gpx", (SAMPLES / "run.gpx").read_bytes()).json()
    assert set(data) == {"activity_type", "distance_m", "duration_s", "avg_heart_rate", "started_at", "source_format"}
    assert "35.3" not in str(data) and "-80.73" not in str(data)


def test_import_does_not_save_an_activity(client):
    upload(client, "run.gpx", (SAMPLES / "run.gpx").read_bytes())
    assert client.get("/activities").json() == []


def test_preview_can_be_saved_through_activities_endpoint(client):
    preview = upload(client, "run.fit", (SAMPLES / "run.fit").read_bytes()).json()
    payload = {k: preview[k] for k in ("activity_type", "distance_m", "duration_s", "avg_heart_rate", "started_at")}
    saved = client.post("/activities", json={**payload, "purpose": "for_myself", "note": "Imported"})
    assert saved.status_code == 201
    assert saved.json()["pace_s_per_km"] == round(1900 / 5.2, 1)
    assert saved.json()["started_at"] == "2026-11-06T06:45:00Z"  # the workout's real date is kept


# ---------- rejected files ----------


def test_corrupted_fit_file(client):
    content = bytearray((SAMPLES / "run.fit").read_bytes())
    content[20] ^= 0xFF  # flip some bits in the middle: the checksum no longer matches
    response = upload(client, "broken.fit", bytes(content))
    assert response.status_code == 400
    assert "couldn't read that file" in response.json()["detail"]


def test_truncated_gpx_file(client):
    content = (SAMPLES / "run.gpx").read_bytes()[:300]
    response = upload(client, "cut_off.gpx", content)
    assert response.status_code == 400
    assert "couldn't read that file" in response.json()["detail"]


def test_fit_extension_on_non_fit_content(client):
    response = upload(client, "notes.fit", b"just some text, not a workout at all")
    assert response.status_code == 400
    assert "doesn't look like a workout" in response.json()["detail"]


def test_wrong_file_type(client):
    response = upload(client, "photo.jpg", b"\xff\xd8\xff\xe0 fake jpeg", "image/jpeg")
    assert response.status_code == 415
    assert response.json()["detail"] == "That file doesn't look like a workout. Try a GPX, TCX, or FIT file."


def test_xml_that_is_not_a_workout(client):
    response = upload(client, "feed.gpx", b"<?xml version='1.0'?><rss><channel/></rss>")
    assert response.status_code == 400
    assert "doesn't look like a workout" in response.json()["detail"]


def test_oversized_file(client):
    content = b"<gpx>" + b" " * (5 * 1024 * 1024) + b"</gpx>"  # just over 5 MB
    response = upload(client, "huge.gpx", content)
    assert response.status_code == 413
    assert "bigger than 5 MB" in response.json()["detail"]


def test_empty_file(client):
    assert upload(client, "empty.gpx", b"").status_code == 400


def test_missing_file(client):
    assert client.post("/activities/import").status_code == 422


# ---------- XML attacks are refused ----------


def test_rejects_xml_bomb(client):
    # "Billion laughs": tiny file that would expand to gigabytes if parsed naively.
    bomb = b"""<?xml version="1.0"?>
<!DOCTYPE gpx [
  <!ENTITY a "lol">
  <!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">
  <!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;">
]>
<gpx><trk><name>&c;</name></trk></gpx>"""
    response = upload(client, "bomb.gpx", bomb)
    assert response.status_code == 400
    assert "safety reasons" in response.json()["detail"]


def test_rejects_external_entity(client):
    xxe = b"""<?xml version="1.0"?>
<!DOCTYPE TrainingCenterDatabase [<!ENTITY secret SYSTEM "file:///etc/passwd">]>
<TrainingCenterDatabase><Activities><Activity Sport="&secret;"/></Activities></TrainingCenterDatabase>"""
    response = upload(client, "xxe.tcx", xxe)
    assert response.status_code == 400
    assert "safety reasons" in response.json()["detail"]
    assert "root:" not in response.text


def test_gpx_without_times_is_rejected(client):
    content = b"""<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
<trk><trkseg><trkpt lat="1" lon="1"/><trkpt lat="1.01" lon="1"/></trkseg></trk></gpx>"""
    response = upload(client, "no_time.gpx", content)
    assert response.status_code == 400
    assert "how long that workout took" in response.json()["detail"]
