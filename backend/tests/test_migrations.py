"""The startup step that adds new columns to tables that already exist."""

from sqlalchemy import create_engine, inspect, text

from app.migrations import add_missing_columns


def make_old_database():
    """An in-memory database with the activities table as it was before started_at."""
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE activities (id INTEGER PRIMARY KEY, activity_type VARCHAR(16), duration_s INTEGER, created_at TIMESTAMP)"
        ))
        connection.execute(text("INSERT INTO activities (activity_type, duration_s) VALUES ('run', 600)"))
    return engine


def columns(engine):
    return {c["name"] for c in inspect(engine).get_columns("activities")}


def test_adds_started_at_to_an_existing_table():
    engine = make_old_database()
    assert "started_at" not in columns(engine)
    assert add_missing_columns(engine) == ["activities.started_at"]
    assert "started_at" in columns(engine)


def test_keeps_existing_rows():
    engine = make_old_database()
    add_missing_columns(engine)
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT activity_type, started_at FROM activities")).all()
    assert rows == [("run", None)]  # old activities simply have no start time


def test_running_twice_is_harmless():
    engine = make_old_database()
    add_missing_columns(engine)
    assert add_missing_columns(engine) == []


def test_does_nothing_when_table_does_not_exist_yet():
    engine = create_engine("sqlite://")
    assert add_missing_columns(engine) == []
