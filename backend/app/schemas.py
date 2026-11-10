from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, computed_field, field_validator

# The 7 reasons someone can be moving. Change this list to change what's allowed.
Purpose = Literal[
    "for_myself",
    "for_someone_i_love",
    "for_mental_wellbeing",
    "for_a_cause",
    "for_my_family",
    "to_prove_i_can",
    "for_my_community",
]

Body = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]
DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)]


class StoryCreate(BaseModel):
    """What a client sends to POST /stories."""

    purpose: Purpose
    body: Body
    display_name: DisplayName | None = None

    @field_validator("display_name")
    @classmethod
    def blank_name_means_anonymous(cls, value: str | None) -> str | None:
        return value or None


class StoryRead(BaseModel):
    """What the API sends back."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    purpose: Purpose
    body: str
    display_name: str | None
    created_at: datetime


# ---------- Activities ----------

ActivityType = Literal["run", "swim", "ride", "gym", "walk", "other"]

MAX_DISTANCE_M = 500_000  # 500 km
MAX_DURATION_S = 24 * 60 * 60  # 24 hours
MIN_HEART_RATE, MAX_HEART_RATE = 30, 250

Note = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]

EARLIEST_START = datetime(1990, 1, 1, tzinfo=timezone.utc)


def as_utc(value: datetime) -> datetime:
    """Convert any time to UTC. Times without a time zone are treated as UTC already."""
    return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)


class ActivityCreate(BaseModel):
    """What a client sends to POST /activities."""

    activity_type: ActivityType
    distance_m: float | None = None
    duration_s: int
    avg_heart_rate: int | None = None
    purpose: Purpose | None = None
    note: Note | None = None
    display_name: DisplayName | None = None
    started_at: datetime | None = None  # when the workout happened; defaults to "not known"

    @field_validator("distance_m")
    @classmethod
    def check_distance(cls, value: float | None) -> float | None:
        if value is not None and not 0 <= value <= MAX_DISTANCE_M:
            raise ValueError("Distance must be between 0 and 500,000 meters (500 km).")
        return value

    @field_validator("duration_s")
    @classmethod
    def check_duration(cls, value: int) -> int:
        if not 1 <= value <= MAX_DURATION_S:
            raise ValueError("Duration must be between 1 second and 24 hours (86,400 seconds).")
        return value

    @field_validator("avg_heart_rate")
    @classmethod
    def check_heart_rate(cls, value: int | None) -> int | None:
        if value is not None and not MIN_HEART_RATE <= value <= MAX_HEART_RATE:
            raise ValueError("Average heart rate must be between 30 and 250 bpm.")
        return value

    @field_validator("note", "display_name")
    @classmethod
    def blank_means_none(cls, value: str | None) -> str | None:
        return value or None

    @field_validator("started_at")
    @classmethod
    def check_started_at(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        value = as_utc(value)
        # A day of slack covers time-zone differences between devices.
        if value > datetime.now(timezone.utc) + timedelta(days=1):
            raise ValueError("Start time can't be in the future.")
        if value < EARLIEST_START:
            raise ValueError("Start time must be in 1990 or later.")
        return value


class ActivityRead(BaseModel):
    """What the API sends back. Pace is calculated here, not stored."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    activity_type: ActivityType
    distance_m: float | None
    duration_s: int
    avg_heart_rate: int | None
    purpose: Purpose | None
    note: str | None
    display_name: str | None
    started_at: datetime | None
    created_at: datetime

    @field_validator("started_at", "created_at")
    @classmethod
    def times_are_utc(cls, value: datetime | None) -> datetime | None:
        return as_utc(value) if value else value

    @computed_field
    @property
    def pace_s_per_km(self) -> float | None:
        """Seconds per kilometer, e.g. 330.0 means 5:30 / km. None without a distance."""
        if not self.distance_m:
            return None
        return round(self.duration_s / (self.distance_m / 1000), 1)


class ActivityImportPreview(BaseModel):
    """A summary read from an uploaded file. It is NOT saved: the person checks it,
    adds a purpose and note, and then sends it to POST /activities."""

    activity_type: ActivityType
    distance_m: float | None
    duration_s: int
    avg_heart_rate: int | None
    started_at: datetime | None
    source_format: Literal["gpx", "tcx", "fit"]
