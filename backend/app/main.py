from contextlib import asynccontextmanager
from dataclasses import asdict

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import Base, engine, get_db
from app.importers import MAX_IMPORT_BYTES, ImportProblem, summarize_workout_file
from app.models import Activity, Story
from app.schemas import ActivityCreate, ActivityImportPreview, ActivityRead, StoryCreate, StoryRead


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



@app.post("/activities", response_model=ActivityRead, status_code=201)
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    new_activity = Activity(**activity.model_dump())
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    return new_activity


@app.get("/activities", response_model=list[ActivityRead])
def list_activities(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(Activity).order_by(Activity.created_at.desc(), Activity.id.desc()).limit(limit)
    return db.scalars(query).all()



@app.post("/activities/import", response_model=ActivityImportPreview)
async def import_activity(file: UploadFile = File(...)):
    """Read a GPX, TCX or FIT file and return a summary preview. Nothing is saved.

    The file is only held in memory for this request. We never write it anywhere,
    and we never return or keep GPS points or routes.
    """
    try:
        # Read one byte past the limit so we can tell "exactly 5 MB" from "too big".
        data = await file.read(MAX_IMPORT_BYTES + 1)
        summary = summarize_workout_file(file.filename, data)
    except ImportProblem as problem:
        raise HTTPException(status_code=problem.status_code, detail=problem.message)
    finally:
        await file.close()
    return asdict(summary)
