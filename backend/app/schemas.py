from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

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
