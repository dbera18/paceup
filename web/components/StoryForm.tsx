"use client";

import { FormEvent, useState } from "react";
import { createStory, MAX_BODY_LENGTH, MAX_NAME_LENGTH, Purpose, PURPOSES } from "@/lib/api";
import { fieldErrorClass, hintClass, inputClass, labelClass, primaryButtonClass } from "./ui";

type Props = {
  onPosted: (message: string) => void;
};

export default function StoryForm({ onPosted }: Props) {
  const [purpose, setPurpose] = useState<Purpose>(PURPOSES[0].value);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser from reloading the page
    setFormError(null);
    if (!body.trim()) {
      setBodyError("Write a few words about why you move.");
      return;
    }
    setBodyError(null);
    setSubmitting(true);
    try {
      await createStory({
        purpose,
        body: body.trim(),
        display_name: name.trim() || null, // blank name → Anonymous
      });
      setBody("");
      onPosted("Thanks for sharing your story! 💛");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <div className="space-y-2">
        <label htmlFor="purpose" className={labelClass}>
          Why do you move?
        </label>
        <select
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as Purpose)}
          className={inputClass}
        >
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className={labelClass}>
          Your story
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_BODY_LENGTH}
          rows={5}
          placeholder="I run every morning because…"
          aria-invalid={!!bodyError}
          className={inputClass + " resize-y"}
        />
        <div className="flex items-start justify-between gap-3">
          <p className={fieldErrorClass}>{bodyError}</p>
          <p className="shrink-0 text-sm text-muted">
            {body.length}/{MAX_BODY_LENGTH}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className={labelClass}>
          Your name <span className={hintClass}>(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Anonymous"
          className={inputClass}
        />
      </div>

      {formError && (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-base text-danger-text">
          {formError}
        </p>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Sharing…" : "Share story"}
      </button>
    </form>
  );
}
