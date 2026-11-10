def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_story(client):
    response = client.post(
        "/stories",
        json={"purpose": "charity", "body": "Ran 5k for the food bank.", "display_name": "Sam"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"] > 0
    assert data["purpose"] == "charity"
    assert data["body"] == "Ran 5k for the food bank."
    assert data["display_name"] == "Sam"
    assert "created_at" in data


def test_display_name_is_optional(client):
    response = client.post("/stories", json={"purpose": "health", "body": "First walk."})
    assert response.status_code == 201
    assert response.json()["display_name"] is None


def test_blank_display_name_becomes_none(client):
    response = client.post(
        "/stories", json={"purpose": "health", "body": "First walk.", "display_name": "   "}
    )
    assert response.status_code == 201
    assert response.json()["display_name"] is None


def test_list_stories_newest_first(client):
    client.post("/stories", json={"purpose": "joy", "body": "first"})
    client.post("/stories", json={"purpose": "joy", "body": "second"})
    response = client.get("/stories")
    assert response.status_code == 200
    assert [s["body"] for s in response.json()] == ["second", "first"]


def test_list_stories_empty(client):
    response = client.get("/stories")
    assert response.status_code == 200
    assert response.json() == []


def test_list_stories_limit(client):
    for i in range(3):
        client.post("/stories", json={"purpose": "training", "body": f"run {i}"})
    response = client.get("/stories", params={"limit": 2})
    assert len(response.json()) == 2


def test_rejects_unknown_purpose(client):
    response = client.post("/stories", json={"purpose": "fame", "body": "hello"})
    assert response.status_code == 422


def test_rejects_empty_body(client):
    response = client.post("/stories", json={"purpose": "health", "body": ""})
    assert response.status_code == 422


def test_rejects_whitespace_only_body(client):
    response = client.post("/stories", json={"purpose": "health", "body": "    "})
    assert response.status_code == 422


def test_body_length_limit(client):
    ok = client.post("/stories", json={"purpose": "health", "body": "a" * 1000})
    too_long = client.post("/stories", json={"purpose": "health", "body": "a" * 1001})
    assert ok.status_code == 201
    assert too_long.status_code == 422


def test_rejects_missing_fields(client):
    response = client.post("/stories", json={})
    assert response.status_code == 422


def test_cors_allows_frontend(client):
    response = client.options(
        "/stories",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"},
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_blocks_other_origins(client):
    response = client.get("/stories", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in response.headers
