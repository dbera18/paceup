// Everything the frontend needs to talk to the PaceUp backend.

// NEXT_PUBLIC_ variables are baked into the browser code when the app is built.
// The fallback keeps local development working if .env.local is missing.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// The 7 purposes the backend accepts, paired with friendly labels for people.
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

export const MAX_BODY_LENGTH = 1000;
export const MAX_NAME_LENGTH = 50;

export type Story = {
  id: number;
  purpose: Purpose;
  body: string;
  display_name: string | null;
  created_at: string;
};

export type NewStory = {
  purpose: Purpose;
  body: string;
  display_name: string | null;
};

export function purposeLabel(value: string): string {
  return PURPOSES.find((p) => p.value === value)?.label ?? value;
}

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

export async function getStories(): Promise<Story[]> {
  const response = await request("/stories");
  if (!response.ok) {
    throw new Error("We couldn't load stories just now. Please try again in a moment.");
  }
  return response.json();
}

export async function createStory(story: NewStory): Promise<Story> {
  const response = await request("/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(story),
  });
  if (response.status === 422) {
    throw new Error("Something in your story doesn't look right. Please check the fields and try again.");
  }
  if (!response.ok) {
    throw new Error("We couldn't share your story. Please try again in a moment.");
  }
  return response.json();
}
