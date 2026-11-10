"""
Read a workout file exported from Strava, Garmin, etc. and pull out a SUMMARY.

We only ever return: activity type, total distance, total duration, average
heart rate, and start time. GPS points and routes are read in memory to add up
the distance, then thrown away. Nothing here touches the database or the disk.

Safety:
- XML files (GPX, TCX) are first checked with defusedxml, which refuses any
  file containing a DTD. That blocks "XML bomb" and external-entity attacks.
  Only files that pass this check are handed to gpxpy.
- FIT files are binary and read with fitdecode, which checks their checksum.
"""

import io
from dataclasses import dataclass
from datetime import datetime, timezone

import defusedxml.ElementTree as SafeET
import fitdecode
import gpxpy
from defusedxml import DefusedXmlException
from gpxpy.gpx import GPXException

from app.schemas import MAX_DISTANCE_M, MAX_DURATION_S, MAX_HEART_RATE, MIN_HEART_RATE

MAX_IMPORT_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = (".gpx", ".tcx", ".fit")

NOT_A_WORKOUT = "That file doesn't look like a workout. Try a GPX, TCX, or FIT file."
CORRUPTED = "We couldn't read that file. It may be damaged or incomplete. Try exporting it again."
UNSAFE = "That file contains content we don't accept for safety reasons. Try exporting it again."
NO_DURATION = "We couldn't find how long that workout took, so we can't import it."


class ImportProblem(Exception):
    """A friendly, user-facing reason the file can't be imported."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class ActivitySummary:
    activity_type: str
    distance_m: float | None
    duration_s: int
    avg_heart_rate: int | None
    started_at: datetime | None
    source_format: str


# ---------- helpers ----------


def file_extension(filename: str | None) -> str:
    name = (filename or "").lower().strip()
    return next((ext for ext in ALLOWED_EXTENSIONS if name.endswith(ext)), "")


def map_activity_type(raw: str | None) -> str:
    """Turn 'Running', 'cycling', 'strength_training'… into one of our 6 types."""
    text = (raw or "").lower()
    if any(word in text for word in ("run", "jog")):
        return "run"
    if any(word in text for word in ("ride", "cycl", "bik")):
        return "ride"
    if "swim" in text:
        return "swim"
    if any(word in text for word in ("walk", "hik")):
        return "walk"
    if any(word in text for word in ("strength", "training", "fitness", "gym", "weight", "workout")):
        return "gym"
    return "other"


def local_name(tag: str) -> str:
    """'{http://…}DistanceMeters' → 'DistanceMeters'"""
    return tag.rsplit("}", 1)[-1]


def check_xml_is_safe(data: bytes):
    """Parse with defusedxml, refusing DTDs and entities. Returns the root element."""
    try:
        return SafeET.fromstring(data, forbid_dtd=True, forbid_entities=True, forbid_external=True)
    except DefusedXmlException:
        raise ImportProblem(UNSAFE)
    except SafeET.ParseError:
        raise ImportProblem(CORRUPTED)


def as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def parse_iso(text: str | None) -> datetime | None:
    if not text:
        return None
    try:
        return as_utc(datetime.fromisoformat(text.strip().replace("Z", "+00:00")))
    except ValueError:
        return None


# ---------- GPX (Strava's usual export) ----------


def parse_gpx(data: bytes) -> ActivitySummary:
    root = check_xml_is_safe(data)
    if local_name(root.tag) != "gpx":
        raise ImportProblem(NOT_A_WORKOUT)

    try:
        gpx = gpxpy.parse(data.decode("utf-8-sig"))
    except (UnicodeDecodeError, GPXException, ValueError, TypeError):
        raise ImportProblem(CORRUPTED)

    if not gpx.tracks:
        raise ImportProblem(NOT_A_WORKOUT)

    bounds = gpx.get_time_bounds()
    duration = gpx.get_duration()  # seconds from first to last point

    # Heart rate lives in each point's extensions (e.g. <gpxtpx:hr>148</gpxtpx:hr>).
    heart_rates: list[int] = []
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                for extension in point.extensions:
                    for element in extension.iter():
                        if local_name(element.tag).lower() == "hr" and element.text:
                            try:
                                heart_rates.append(int(float(element.text)))
                            except ValueError:
                                pass

    return ActivitySummary(
        activity_type=map_activity_type(gpx.tracks[0].type or gpx.tracks[0].name),
        distance_m=gpx.length_2d() or None,
        duration_s=round(duration or 0),
        avg_heart_rate=round(sum(heart_rates) / len(heart_rates)) if heart_rates else None,
        started_at=as_utc(bounds.start_time),
        source_format="gpx",
    )


# ---------- TCX (Garmin Connect "Export to TCX") ----------


def parse_tcx(data: bytes) -> ActivitySummary:
    root = check_xml_is_safe(data)
    if local_name(root.tag) != "TrainingCenterDatabase":
        raise ImportProblem(NOT_A_WORKOUT)

    activity = next((el for el in root.iter() if local_name(el.tag) == "Activity"), None)
    if activity is None:
        raise ImportProblem(NOT_A_WORKOUT)

    def child_text(element, name):
        found = next((c for c in element if local_name(c.tag) == name), None)
        return found.text if found is not None else None

    total_time = 0.0
    total_distance = 0.0
    weighted_hr = 0.0
    hr_seconds = 0.0
    laps = [el for el in activity if local_name(el.tag) == "Lap"]
    try:
        for lap in laps:
            seconds = float(child_text(lap, "TotalTimeSeconds") or 0)
            total_time += seconds
            total_distance += float(child_text(lap, "DistanceMeters") or 0)
            hr_element = next((c for c in lap if local_name(c.tag) == "AverageHeartRateBpm"), None)
            if hr_element is not None and child_text(hr_element, "Value"):
                weighted_hr += float(child_text(hr_element, "Value")) * seconds
                hr_seconds += seconds
    except ValueError:
        raise ImportProblem(CORRUPTED)

    started_at = parse_iso(child_text(activity, "Id")) or (parse_iso(laps[0].get("StartTime")) if laps else None)

    return ActivitySummary(
        activity_type=map_activity_type(activity.get("Sport")),
        distance_m=total_distance or None,
        duration_s=round(total_time),
        avg_heart_rate=round(weighted_hr / hr_seconds) if hr_seconds else None,
        started_at=started_at,
        source_format="tcx",
    )


# ---------- FIT (Garmin's original binary format) ----------


def parse_fit(data: bytes) -> ActivitySummary:
    if len(data) < 12 or data[8:12] != b".FIT":
        raise ImportProblem(NOT_A_WORKOUT)

    session = None
    try:
        # CrcCheck.RAISE: a damaged file (wrong checksum) is an error, not just a warning.
        with fitdecode.FitReader(io.BytesIO(data), check_crc=fitdecode.CrcCheck.RAISE) as reader:
            for frame in reader:
                if isinstance(frame, fitdecode.FitDataMessage) and frame.name == "session" and session is None:
                    session = {f.name: f.value for f in frame.fields}
    except Exception:  # any decoding failure in a binary file means it's damaged
        raise ImportProblem(CORRUPTED)

    if session is None:
        raise ImportProblem(NOT_A_WORKOUT)

    duration = session.get("total_elapsed_time") or session.get("total_timer_time") or 0
    heart_rate = session.get("avg_heart_rate")
    start = session.get("start_time")

    return ActivitySummary(
        activity_type=map_activity_type(f"{session.get('sport') or ''} {session.get('sub_sport') or ''}"),
        distance_m=float(session["total_distance"]) if session.get("total_distance") else None,
        duration_s=round(float(duration)),
        avg_heart_rate=int(heart_rate) if heart_rate else None,
        started_at=as_utc(start) if isinstance(start, datetime) else None,
        source_format="fit",
    )


# ---------- entry point ----------

PARSERS = {".gpx": parse_gpx, ".tcx": parse_tcx, ".fit": parse_fit}


def summarize_workout_file(filename: str | None, data: bytes) -> ActivitySummary:
    extension = file_extension(filename)
    if not extension:
        raise ImportProblem(NOT_A_WORKOUT, status_code=415)
    if len(data) > MAX_IMPORT_BYTES:
        raise ImportProblem("That file is bigger than 5 MB. Try exporting just one activity.", status_code=413)
    if not data:
        raise ImportProblem(CORRUPTED)

    summary = PARSERS[extension](data)

    # Make sure the summary fits the same rules as a hand-logged activity.
    if summary.duration_s < 1:
        raise ImportProblem(NO_DURATION)
    if summary.duration_s > MAX_DURATION_S:
        raise ImportProblem("That workout is longer than 24 hours, which is more than we can import.")
    if summary.distance_m is not None:
        if summary.distance_m > MAX_DISTANCE_M:
            raise ImportProblem("That workout is longer than 500 km, which is more than we can import.")
        summary.distance_m = round(summary.distance_m, 1)
    if summary.avg_heart_rate is not None and not MIN_HEART_RATE <= summary.avg_heart_rate <= MAX_HEART_RATE:
        summary.avg_heart_rate = None  # an odd sensor reading shouldn't block the import

    return summary
