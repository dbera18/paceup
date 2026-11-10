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
import { metersPerUnit } from "@/lib/format";
import { useApp } from "@/components/shell/AppProvider";
import { ChevronIcon } from "@/components/ui/Icons";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { input } from "@/components/ui/styles";

type Errors = Partial<Record<"type" | "distance" | "time" | "heartRate" | "form", string>>;

// "5,2" and " 5.2 " both mean 5.2. Empty means "not filled in".
function toNumber(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

// A text input with its unit (km, min, bpm…) shown inside on the right.
function UnitInput({ unit, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { unit: string }) {
  return (
    <div className="relative">
      <input autoComplete="off" {...props} className={input + " pr-16 text-lg tabular-nums"} />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[0.9375rem] font-medium text-muted">
        {unit}
      </span>
    </div>
  );
}

export default function ActivityForm({ onPosted }: { onPosted: (message: string) => void }) {
  const { unit, setUnit } = useApp();
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

    const dist = toNumber(distance);
    const maxInUnit = MAX_DISTANCE_M / metersPerUnit(unit);
    if (showDistance && dist !== null && (Number.isNaN(dist) || dist < 0 || dist > maxInUnit)) {
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
      distanceMeters: showDistance && dist !== null ? Math.round(dist * metersPerUnit(unit)) : null,
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
      onPosted("Nice work, logged!");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* Activity type: big tappable tiles */}
      <fieldset className="space-y-3">
        <legend className="text-[0.9375rem] font-semibold text-text">What did you do?</legend>
        <div className="grid grid-cols-3 gap-2.5">
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
                  "flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border text-[0.9375rem] font-semibold transition duration-200 active:scale-95 " +
                  (selected
                    ? "border-accent bg-accent-soft text-accent-text ring-1 ring-accent"
                    : "border-line bg-surface text-text hover:border-muted/40 hover:bg-surface-2/50")
                }
              >
                <span aria-hidden className={"text-[1.75rem] leading-none transition-transform duration-300 " + (selected ? "scale-110" : "")}>
                  {t.emoji}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
        {errors.type && <p role="alert" className="text-sm font-medium text-danger-text">{errors.type}</p>}
      </fieldset>

      {showDistance && (
        <Field
          id="distance"
          label="Distance"
          optional
          error={errors.distance}
          aside={
            <div role="group" aria-label="Distance unit" className="flex rounded-full bg-surface-2 p-1">
              {(["km", "mi"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => setUnit(u)}
                  className={
                    "min-h-8 rounded-full px-3.5 text-sm font-semibold transition " +
                    (unit === u ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")
                  }
                >
                  {u === "km" ? "km" : "miles"}
                </button>
              ))}
            </div>
          }
        >
          <UnitInput
            id="distance"
            unit={unit}
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={unit === "km" ? "5.0" : "3.1"}
            aria-invalid={!!errors.distance}
            aria-describedby="distance-error"
          />
        </Field>
      )}

      <fieldset className="space-y-2">
        <legend className="text-[0.9375rem] font-semibold text-text">How long did it take?</legend>
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div>
            <label htmlFor="minutes" className="sr-only">Minutes</label>
            <UnitInput
              id="minutes"
              unit="min"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="30"
              aria-invalid={!!errors.time}
              aria-describedby="time-error"
            />
          </div>
          <div>
            <label htmlFor="seconds" className="sr-only">Seconds</label>
            <UnitInput
              id="seconds"
              unit="sec"
              inputMode="numeric"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              placeholder="00"
              aria-invalid={!!errors.time}
              aria-describedby="time-error"
            />
          </div>
        </div>
        {errors.time && <p id="time-error" role="alert" className="text-sm font-medium text-danger-text">{errors.time}</p>}
      </fieldset>

      <Field id="heartRate" label="Average heart rate" optional error={errors.heartRate}>
        <UnitInput
          id="heartRate"
          unit="bpm"
          inputMode="numeric"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
          placeholder="145"
          aria-invalid={!!errors.heartRate}
          aria-describedby="heartRate-error"
        />
      </Field>

      <Field id="activityPurpose" label="What did you move for?" optional>
        <div className="relative">
          <select
            id="activityPurpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as Purpose | "")}
            className={input + " appearance-none pr-12"}
          >
            <option value="">Choose a purpose…</option>
            {PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronIcon
            width={18}
            height={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted"
          />
        </div>
      </Field>

      <Field
        id="note"
        label="A note"
        optional
        footer={<p className="ml-auto shrink-0 text-sm tabular-nums text-muted">{note.length}/{MAX_NOTE_LENGTH}</p>}
      >
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="How did it feel? What kept you going?"
          className={input + " resize-y font-serif text-lg leading-relaxed"}
        />
      </Field>

      <Field id="activityName" label="Your name" optional>
        <input
          id="activityName"
          type="text"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Leave blank to post as Anonymous"
          className={input}
        />
      </Field>

      {errors.form && (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-[0.9375rem] text-danger-text">
          {errors.form}
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" block disabled={submitting}>
        {submitting ? "Logging…" : "Log activity"}
      </Button>
    </form>
  );
}
