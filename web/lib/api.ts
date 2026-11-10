// Everything the frontend needs to talk to the PaceUp backend.

// NEXT_PUBLIC_ variables are baked into the browser code when the app is built.
// The fallback keeps local development working if .env.local is missing.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ---------- Purposes (shared by stories and activities) ----------

// Each purpose has a friendly label and its own tag color (light + dark mode).
export const PURPOSES = [
  { value: "for_myself", label: "For myself", tag: "bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-200" },
  { value: "for_someone_i_love", label: "For someone I love", tag: "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-200" },
  { value: "for_mental_wellbeing", label: "For my mental wellbeing", tag: "bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-200" },
  { value: "for_a_cause", label: "For a cause", tag: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200" },
  { value: "for_my_family", label: "For my family", tag: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200" },
  { value: "to_prove_i_can", label: "To prove I can", tag: "bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-200" },
  { value: "for_my_community", label: "For my community", tag: "bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-200" },
] as const;

export type Purpose = (typeof PURPOSES)[number]["value"];

export function findPurpose(value: string | null) {
  return PURPOSES.find((p) => p.value === value);
}

// ---------- Activity types ----------

export const ACTIVITY_TYPES = [
  { value: "run", label: "Run", emoji: "🏃" },
  { value: "walk", label: "Walk", emoji: "🚶" },
  { value: "ride", label: "Ride", emoji: "🚴" },
  { value: "swim", label: "Swim", emoji: "🏊" },
  { value: "gym", label: "Gym", emoji: "🏋️" },
  { value: "other", label: "Other", emoji: "✨" },
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
