"use client";

import { FormEvent, useState } from "react";
import {
  ACTIVITY_TYPES,
  ActivityType,
  createActivity,
  MAX_DISTANCE_M,
  MAX_DURATION_S,
  MAX_HEART_RATE,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  MIN_HEART_RATE,
  Purpose,
  PURPOSES,
} from "@/lib/api";
import { DistanceUnit, metersPerUnit } from "@/lib/format";
import { fieldErrorClass, hintClass, inputClass, labelClass, primaryButtonClass } from "./ui";

type Props = {
  unit: DistanceUnit;
  onUnitChange: (unit: DistanceUnit) => void;
  onPosted: (message: string) => void;
};

type Errors = Partial<Record<"type" | "distance" | "time" | "heartRate" | "form", string>>;

// "5,2" and " 5.2 " both mean 5.2. Empty means "not filled in".
function toNumber(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export default function ActivityForm({ unit, onUnitChange, onPosted }: Props) {
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [purpose, setPurpose] = useState<Purpose | "">("");
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const showDistance = activityType !== "gym";

  // Check the form in the browser first, so people get instant, friendly feedback.
  function validate() {
    const found: Errors = {};

    if (!activityType) found.type = "Pick what you did.";

    const km = toNumber(distance);
    const maxInUnit = MAX_DISTANCE_M / metersPerUnit(unit);
    if (showDistance && km !== null && (Number.isNaN(km) || km < 0 || km > maxInUnit)) {
      found.distance = `Distance should be between 0 and ${Math.floor(maxInUnit)} ${unit}.`;
    }

    const min = toNumber(minutes);
    const sec = toNumber(seconds);
    const totalSeconds = (min ?? 0) * 60 + (sec ?? 0);
    if (min === null && sec === null) {
      found.time = "Add how long it took.";
    } else if (
      Number.isNaN(min) || Number.isNaN(sec) ||
      !Number.isInteger(min ?? 0) || !Number.isInteger(sec ?? 0) ||
      (min ?? 0) < 0 || (sec ?? 0) < 0
    ) {
      found.time = "Use whole numbers for minutes and seconds.";
    } else if ((sec ?? 0) > 59) {
      found.time = "Seconds should be between 0 and 59.";
    } else if (totalSeconds < 1) {
      found.time = "Add how long it took.";
    } else if (totalSeconds > MAX_DURATION_S) {
      found.time = "That's more than 24 hours. Could you check the time?";
    }

    const hr = toNumber(heartRate);
    if (hr !== null && (!Number.isInteger(hr) || hr < MIN_HEART_RATE || hr > MAX_HEART_RATE)) {
      found.heartRate = `Heart rate should be a whole number from ${MIN_HEART_RATE} to ${MAX_HEART_RATE} bpm.`;
    }

    return {
      found,
      distanceMeters: showDistance && km !== null ? Math.round(km * metersPerUnit(unit)) : null,
      totalSeconds,
      hr,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { found, distanceMeters, totalSeconds, hr } = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !activityType) return;

    setSubmitting(true);
    try {
      await createActivity({
        activity_type: activityType,
        distance_m: distanceMeters,
        duration_s: totalSeconds,
        avg_heart_rate: hr,
        purpose: purpose || null,
        note: note.trim() || null,
        display_name: name.trim() || null,
      });
      // Clear the form for the next activity (but remember the km/mi choice and name).
      setActivityType(null);
      setDistance("");
      setMinutes("");
      setSeconds("");
      setHeartRate("");
      setPurpose("");
      setNote("");
      onPosted("Nice work, logged! 🎉");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* Activity type: big tappable buttons */}
      <fieldset className="space-y-3">
        <legend className={labelClass}>What did you do?</legend>
        <div className="grid grid-cols-3 gap-3">
          {ACTIVITY_TYPES.map((t) => {
            const selected = activityType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setActivityType(t.value);
                  setErrors((e) => ({ ...e, type: undefined }));
                }}
                className={
                  "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-base font-semibold transition " +
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 active:scale-95 " +
                  (selected
                    ? "border-brand bg-brand-soft text-brand-text"
                    : "border-line bg-surface text-text hover:border-brand/50")
                }
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {t.emoji}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
        {errors.type && <p className={fieldErrorClass}>{errors.type}</p>}
      </fieldset>

      {/* Distance with km / miles toggle (hidden for gym sessions) */}
      {showDistance && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="distance" className={labelClass}>
              Distance <span className={hintClass}>(optional)</span>
            </label>
            <div role="group" aria-label="Distance unit" className="flex rounded-xl bg-surface-2 p-1">
              {(["km", "mi"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => onUnitChange(u)}
                  className={
                    "min-h-9 min-w-14 rounded-lg px-3 text-sm font-bold transition " +
                    (unit === u ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")
                  }
                >
                  {u === "km" ? "km" : "miles"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              id="distance"
              inputMode="decimal"
              autoComplete="off"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder={unit === "km" ? "e.g. 5" : "e.g. 3.1"}
              aria-invalid={!!errors.distance}
              className={inputClass + " pr-16"}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-muted">
              {unit}
            </span>
          </div>
          {errors.distance && <p className={fieldErrorClass}>{errors.distance}</p>}
        </div>
      )}

      {/* Time as minutes + seconds */}
      <fieldset className="space-y-2">
        <legend className={labelClass}>How long did it take?</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label htmlFor="minutes" className="sr-only">Minutes</label>
            <input
              id="minutes"
              inputMode="numeric"
              autoComplete="off"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="30"
              aria-invalid={!!errors.time}
              className={inputClass + " pr-14"}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-muted">
              min
            </span>
          </div>
          <div className="relative">
            <label htmlFor="seconds" className="sr-only">Seconds</label>
            <input
              id="seconds"
              inputMode="numeric"
              autoComplete="off"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              placeholder="00"
              aria-invalid={!!errors.time}
              className={inputClass + " pr-14"}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-muted">
              sec
            </span>
          </div>
        </div>
        {errors.time && <p className={fieldErrorClass}>{errors.time}</p>}
      </fieldset>

      {/* Heart rate */}
      <div className="space-y-2">
        <label htmlFor="heartRate" className={labelClass}>
          Average heart rate <span className={hintClass}>(optional)</span>
        </label>
        <div className="relative">
          <input
            id="heartRate"
            inputMode="numeric"
            autoComplete="off"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder="e.g. 145"
            aria-invalid={!!errors.heartRate}
            className={inputClass + " pr-16"}
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-muted">
            bpm
          </span>
        </div>
        {errors.heartRate && <p className={fieldErrorClass}>{errors.heartRate}</p>}
      </div>

      {/* Purpose */}
      <div className="space-y-2">
        <label htmlFor="activityPurpose" className={labelClass}>
          Why did you move? <span className={hintClass}>(optional)</span>
        </label>
        <select
          id="activityPurpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as Purpose | "")}
          className={inputClass}
        >
          <option value="">Choose a purpose…</option>
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label htmlFor="note" className={labelClass}>
          Note <span className={hintClass}>(optional)</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="How did it feel? Anything to remember?"
          className={inputClass + " resize-y"}
        />
        <p className="text-right text-sm text-muted">
          {note.length}/{MAX_NOTE_LENGTH}
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="activityName" className={labelClass}>
          Your name <span className={hintClass}>(optional)</span>
        </label>
        <input
          id="activityName"
          type="text"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Anonymous"
          className={inputClass}
        />
      </div>

      {errors.form && (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-base text-danger-text">
          {errors.form}
        </p>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Logging…" : "Log activity"}
      </button>
    </form>
  );
}
