"""
Small, safe database upgrades that run when the server starts.

create_all() only creates tables that don't exist yet. It never adds new
columns to a table that's already there. So when a column is added to a model,
existing databases (like your local Postgres) need it added here.

Each step checks first and only adds what's missing, so running it many
times is harmless. When the app grows, a migration tool like Alembic is the
long-term replacement for this file.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# (table, column, SQL type) for every column added after a table first shipped.
ADDED_COLUMNS = [
    ("activities", "started_at", "TIMESTAMP WITH TIME ZONE"),
]


def add_missing_columns(engine: Engine) -> list[str]:
    """Add any columns from ADDED_COLUMNS that the database doesn't have yet."""
    added = []
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, column, sql_type in ADDED_COLUMNS:
            if not inspector.has_table(table):
                continue  # create_all() will make the whole table, column included
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column not in existing:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
                added.append(f"{table}.{column}")
    return added
