"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  ACTIVITY_TYPES,
  ActivityType,
  checkImportFile,
  createActivity,
  findActivityType,
  importActivityFile,
  ImportPreview,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  Purpose,
} from "@/lib/api";
import { formatDateTime, formatDistance, formatDuration } from "@/lib/format";
import { useApp } from "@/components/shell/AppProvider";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { FileIcon, LockIcon, UploadIcon } from "@/components/ui/Icons";
import { input } from "@/components/ui/styles";
import PurposePicker from "./PurposePicker";

const HOW_TO_EXPORT = [
  {
    app: "Strava",
    steps: "Open the activity on strava.com, click the ··· menu, then choose Export GPX.",
  },
  {
    app: "Garmin Connect",
    steps: "Open the activity, click the gear icon, then Export to TCX. (Export Original gives a .zip: unzip it to get the .fit file.)",
  },
  {
    app: "Other apps",
    steps: "Look for Export or Share, and pick GPX, TCX, or FIT.",
  },
];

function PrivacyNote() {
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-muted">
      <LockIcon width={16} height={16} />
      We only keep the summary, not your route.
    </p>
  );
}

export default function ImportFlow({ onPosted }: { onPosted: (message: string) => void }) {
  const { unit } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  // Things the person adds before sharing
  const [activityType, setActivityType] = useState<ActivityType>("run");
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [sharing, setSharing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const problem = checkImportFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setFileName(file.name);
    setReading(true);
    try {
      const result = await importActivityFile(file);
      setPreview(result);
      setActivityType(result.activity_type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't read that file. Please try again.");
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = ""; // allow choosing the same file again
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  async function share() {
    if (!preview) return;
    setSharing(true);
    setError(null);
    try {
      // Saved through the same endpoint as a hand-logged activity.
      await createActivity({
        activity_type: activityType,
        distance_m: activityType === "gym" ? null : preview.distance_m,
        duration_s: preview.duration_s,
        avg_heart_rate: preview.avg_heart_rate,
        purpose,
        note: note.trim() || null,
        display_name: name.trim() || null,
        started_at: preview.started_at, // keep the real date of the workout
      });
      onPosted("Imported and shared!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't share it. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  // ---------- Step 2: preview, purpose, note, share ----------
  if (preview) {
    const type = findActivityType(activityType);
    const parts = [
      type.label,
      preview.distance_m && activityType !== "gym" ? formatDistance(preview.distance_m, unit, 1) : null,
      formatDuration(preview.duration_s),
      preview.avg_heart_rate ? `avg HR ${preview.avg_heart_rate}` : null,
    ].filter(Boolean);

    return (
      <div className="space-y-7">
        <div className="rounded-3xl border border-line bg-surface-2/50 p-5 motion-safe:animate-rise">
          <div className="flex items-center gap-4">
            <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-3xl shadow-sm">
              {type.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Preview</p>
              <p className="mt-1 text-lg font-semibold leading-snug text-text">{parts.join(" · ")}</p>
              {preview.started_at && <p className="mt-0.5 text-sm text-muted">{formatDateTime(preview.started_at)}</p>}
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p id="import-type-label" className="text-sm font-medium text-muted">Not quite right? Change the type:</p>
            <div role="group" aria-labelledby="import-type-label" className="mt-2 flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={activityType === t.value}
                  onClick={() => setActivityType(t.value)}
                  className={
                    "min-h-9 rounded-full border px-3 text-sm font-semibold transition active:scale-95 " +
                    (activityType === t.value
                      ? "border-accent bg-accent-soft text-accent-text"
                      : "border-line bg-surface text-muted hover:text-text")
                  }
                >
                  <span aria-hidden className="mr-1">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PurposePicker legend="What did you move for?" optional value={purpose} onChange={setPurpose} />

        <Field
          id="import-note"
          label="A note"
          optional
          footer={<p className="ml-auto shrink-0 text-sm tabular-nums text-muted">{note.length}/{MAX_NOTE_LENGTH}</p>}
        >
          <textarea
            id="import-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            placeholder="How did it feel? What kept you going?"
            className={input + " resize-y font-serif text-lg leading-relaxed"}
          />
        </Field>

        <Field id="import-name" label="Your name" optional>
          <input
            id="import-name"
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Leave blank to post as Anonymous"
            className={input}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-[0.9375rem] text-danger-text">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <Button variant="accent" size="lg" block disabled={sharing} onClick={share}>
            {sharing ? "Sharing…" : "Share"}
          </Button>
          <Button variant="ghost" block onClick={() => setPreview(null)}>
            Choose a different file
          </Button>
        </div>
        <PrivacyNote />
      </div>
    );
  }

  // ---------- Step 1: how to export + pick a file ----------
  return (
    <div className="space-y-6">
      <p className="text-[0.9375rem] leading-relaxed text-muted">
        Already recorded it? Export the workout from your app, then add the file here. You&apos;ll see a preview before
        anything is shared.
      </p>

      <ol className="space-y-2.5">
        {HOW_TO_EXPORT.map(({ app, steps }, i) => (
          <li key={app} className="flex gap-3 rounded-2xl bg-surface-2/60 p-4">
            <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted shadow-sm">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-text">
              <span className="font-semibold">{app}: </span>
              <span className="text-muted">{steps}</span>
            </p>
          </li>
        ))}
      </ol>

      {/* The whole area is a <label> for the hidden file input: click, tap or drop a file onto it */}
      <label
        htmlFor="import-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-busy={reading}
        className={
          "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-8 text-center transition duration-200 " +
          "focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent " +
          (dragging ? "scale-[1.01] border-accent bg-accent-soft" : "border-line bg-surface-2/40 hover:border-muted/40 hover:bg-surface-2/70")
        }
      >
        <input
          ref={inputRef}
          id="import-file"
          type="file"
          accept=".gpx,.tcx,.fit"
          className="sr-only"
          disabled={reading}
          onChange={(e: ChangeEvent<HTMLInputElement>) => void handleFile(e.target.files?.[0])}
        />
        {reading ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-surface text-accent-text shadow-sm motion-safe:animate-pulse">
              <FileIcon width={26} height={26} />
            </span>
            <span className="text-base font-semibold text-text">Reading your workout…</span>
            <span className="max-w-full truncate text-sm text-muted">{fileName}</span>
          </>
        ) : (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-surface text-accent-text shadow-sm">
              <UploadIcon width={26} height={26} />
            </span>
            <span className="text-base font-semibold text-text">
              {dragging ? "Drop it here" : "Choose a file or drag it here"}
            </span>
            <span className="text-sm text-muted">GPX, TCX, or FIT · up to 5 MB</span>
          </>
        )}
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-[0.9375rem] text-danger-text">
          {error}
        </p>
      )}

      <PrivacyNote />
    </div>
  );
}
