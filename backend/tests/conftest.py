import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture
def client():
    # A brand-new in-memory SQLite database for each test, so tests never touch Postgres.
    # StaticPool keeps one connection open; otherwise each connection would get its own
    # empty in-memory database.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    # Not used as a context manager on purpose: that would run the app's startup,
    # which tries to connect to the real Postgres database.
    yield TestClient(app)
    app.dependency_overrides.clear()
    engine.dispose()
