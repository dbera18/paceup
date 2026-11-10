from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Read from the DATABASE_URL environment variable (or a .env file) when set.
    # The default connects to a local Postgres database named "paceup".
    database_url: str = "postgresql+psycopg://localhost/paceup"
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
