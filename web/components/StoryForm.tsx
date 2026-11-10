"use client";

import { FormEvent, useState } from "react";
import { createStory, MAX_BODY_LENGTH, MAX_NAME_LENGTH, Purpose, PURPOSES } from "@/lib/api";

type Props = {
  onPosted: () => void;
};

export default function StoryForm({ onPosted }: Props) {
  const [purpose, setPurpose] = useState<Purpose>(PURPOSES[0].value);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser from reloading the page
    if (!body.trim()) {
      setError("Please write a few words about why you move.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createStory({
        purpose,
        body: body.trim(),
        display_name: name.trim() || null, // blank name → Anonymous
      });
      setBody("");
      setName("");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-stone-900">Share your purpose</h2>

      <div className="space-y-1.5">
        <label htmlFor="purpose" className="block text-sm font-medium text-stone-700">
          Why do you move?
        </label>
        <select
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as Purpose)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        >
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="block text-sm font-medium text-stone-700">
          Your story
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_BODY_LENGTH}
          rows={4}
          placeholder="I run every morning because…"
          className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
        <p className="text-right text-xs text-stone-500">
          {body.length}/{MAX_BODY_LENGTH}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          Name <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Anonymous"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sharing…" : "Share story"}
      </button>
    </form>
  );
}
