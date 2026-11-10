// Turning raw numbers (meters, seconds) into friendly text.

export type DistanceUnit = "km" | "mi";

export const METERS_PER_KM = 1000;
export const METERS_PER_MILE = 1609.344;

export function metersPerUnit(unit: DistanceUnit): number {
  return unit === "km" ? METERS_PER_KM : METERS_PER_MILE;
}

/** 5000, "km" → "5.00 km" (or "5.0 km" with decimals = 1) */
export function formatDistance(meters: number, unit: DistanceUnit, decimals = 2): string {
  return `${(meters / metersPerUnit(unit)).toFixed(decimals)} ${unit}`;
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

/** "2026-11-04T12:00:00Z" → "Tue, Nov 4 · 7:00 AM" (in the viewer's time zone) */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}
