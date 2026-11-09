from datetime import datetime, timezone
from sqlalchemy import DateTime, String, 
Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

class Story(Base):
__tablename__ = "stories"
id: Mapped[int] = mapped_column(primary_key=TRUE)
