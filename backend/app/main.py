from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import Base, engine, get_db
from app.models import Story
from app.schemas import StoryCreate, StoryRead


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the tables in Postgres when the server starts (if they don't exist yet).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="PaceUp API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/stories", response_model=StoryRead, status_code=201)
def create_story(story: StoryCreate, db: Session = Depends(get_db)):
    new_story = Story(**story.model_dump())
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    return new_story


@app.get("/stories", response_model=list[StoryRead])
def list_stories(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(Story).order_by(Story.created_at.desc(), Story.id.desc()).limit(limit)
    return db.scalars(query).all()
