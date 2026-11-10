// Everything the frontend needs to talk to the PaceUp backend.

// NEXT_PUBLIC_ variables are baked into the browser code when the app is built.
// The fallback keeps local development working if .env.local is missing.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ---------- Purposes (shared by stories and activities) ----------

// Each purpose has a friendly label. Its tag colors live in app/globals.css (see [data-purpose]).
export const PURPOSES = [
  { value: "for_myself", label: "For myself" },
  { value: "for_someone_i_love", label: "For someone I love" },
  { value: "for_mental_wellbeing", label: "For my mental wellbeing" },
  { value: "for_a_cause", label: "For a cause" },
  { value: "for_my_family", label: "For my family" },
  { value: "to_prove_i_can", label: "To prove I can" },
  { value: "for_my_community", label: "For my community" },
] as const;

export type Purpose = (typeof PURPOSES)[number]["value"];

export function findPurpose(value: string | null) {
  return PURPOSES.find((p) => p.value === value);
}

// ---------- Activity types ----------

export const ACTIVITY_TYPES = [
  { value: "run", phrase: "went for a run", label: "Run", emoji: "🏃" },
  { value: "walk", phrase: "went for a walk", label: "Walk", emoji: "🚶" },
  { value: "ride", phrase: "went for a ride", label: "Ride", emoji: "🚴" },
  { value: "swim", phrase: "went for a swim", label: "Swim", emoji: "🏊" },
  { value: "gym", phrase: "hit the gym", label: "Gym", emoji: "🏋️" },
  { value: "other", phrase: "got moving", label: "Other", emoji: "✨" },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];

export function findActivityType(value: string) {
  return ACTIVITY_TYPES.find((t) => t.value === value) ?? ACTIVITY_TYPES[5];
}

// ---------- Limits (match the backend) ----------

export const MAX_BODY_LENGTH = 1000;
export const MAX_NOTE_LENGTH = 500;
export const MAX_NAME_LENGTH = 50;
export const MAX_DISTANCE_M = 500_000;
export const MAX_DURATION_S = 24 * 60 * 60;
export const MIN_HEART_RATE = 30;
export const MAX_HEART_RATE = 250;

// ---------- Data shapes ----------

export type Story = {
  id: number;
  purpose: Purpose;
  body: string;
  display_name: string | null;
  created_at: string;
};

export type NewStory = Pick<Story, "purpose" | "body" | "display_name">;

export type Activity = {
  id: number;
  activity_type: ActivityType;
  distance_m: number | null;
  duration_s: number;
  avg_heart_rate: number | null;
  purpose: Purpose | null;
  note: string | null;
  display_name: string | null;
  created_at: string;
  pace_s_per_km: number | null; // calculated by the backend
};

export type NewActivity = Omit<Activity, "id" | "created_at" | "pace_s_per_km">;

// ---------- Requests ----------

const SERVER_DOWN_MESSAGE =
  "We can't reach the PaceUp server right now. Please make sure the backend is running and try again.";

// fetch() only throws when the request never gets an answer (server off, no network).
async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(SERVER_DOWN_MESSAGE);
  }
}

// When the backend rejects data (422), it explains why. Pass that along in plain words.
async function validationMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    const first = data?.detail?.[0]?.msg;
    if (typeof first === "string") return first.replace(/^Value error, /, "");
  } catch {
    // the response wasn't JSON, so use the fallback
  }
  return fallback;
}

async function postJson<T>(path: string, payload: unknown, what: string): Promise<T> {
  const response = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 422) {
    throw new Error(
      await validationMessage(response, "Something doesn't look right. Please check the fields and try again."),
    );
  }
  if (!response.ok) {
    throw new Error(`We couldn't save your ${what}. Please try again in a moment.`);
  }
  return response.json();
}

async function getJson<T>(path: string, what: string): Promise<T> {
  const response = await request(path);
  if (!response.ok) {
    throw new Error(`We couldn't load ${what} just now. Please try again in a moment.`);
  }
  return response.json();
}

export const getStories = () => getJson<Story[]>("/stories", "stories");
export const getActivities = () => getJson<Activity[]>("/activities", "activities");
export const createStory = (story: NewStory) => postJson<Story>("/stories", story, "story");
export const createActivity = (activity: NewActivity) =>
  postJson<Activity>("/activities", activity, "activity");

// ---------- Importing from Strava, Garmin, etc. ----------

export const IMPORT_EXTENSIONS = [".gpx", ".tcx", ".fit"] as const;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const NOT_A_WORKOUT_MESSAGE = "That file doesn't look like a workout. Try a GPX, TCX, or FIT file.";

// What the backend read from the file. Nothing is saved until the person shares it.
export type ImportPreview = {
  activity_type: ActivityType;
  distance_m: number | null;
  duration_s: number;
  avg_heart_rate: number | null;
  started_at: string | null;
  source_format: "gpx" | "tcx" | "fit";
};

// Quick checks in the browser, so obviously wrong files never get uploaded.
export function checkImportFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip") || name.endsWith(".gz")) {
    return "That file is compressed. Unzip it first, then choose the GPX, TCX, or FIT file inside.";
  }
  if (!IMPORT_EXTENSIONS.some((ext) => name.endsWith(ext))) return NOT_A_WORKOUT_MESSAGE;
  if (file.size > MAX_IMPORT_BYTES) return "That file is bigger than 5 MB. Try exporting just one activity.";
  if (file.size === 0) return "That file is empty. Try exporting it again.";
  return null;
}

export async function importActivityFile(file: File): Promise<ImportPreview> {
  const form = new FormData();
  form.append("file", file);
  const response = await request("/activities/import", { method: "POST", body: form });
  if (!response.ok) {
    let message = "We couldn't read that file. Please try again.";
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") message = data.detail;
    } catch {
      // not JSON; keep the friendly default
    }
    throw new Error(message);
  }
  return response.json();
}
