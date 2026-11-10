// Turning raw numbers (meters, seconds) into friendly text.

export type DistanceUnit = "km" | "mi";

export const METERS_PER_KM = 1000;
export const METERS_PER_MILE = 1609.344;

export function metersPerUnit(unit: DistanceUnit): number {
  return unit === "km" ? METERS_PER_KM : METERS_PER_MILE;
}

/** 5000, "km" → "5.00 km" */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  return `${(meters / metersPerUnit(unit)).toFixed(2)} ${unit}`;
}

/** 1650 → "27:30", 3725 → "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

/** 330 s/km, "km" → "5:30 / km" */
export function formatPace(secondsPerKm: number, unit: DistanceUnit): string {
  const perUnit = secondsPerKm * (metersPerUnit(unit) / METERS_PER_KM);
  return `${formatDuration(perUnit)} / ${unit}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
