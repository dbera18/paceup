"use client";

import { FormEvent, useState } from "react";
import { createStory, MAX_BODY_LENGTH, MAX_NAME_LENGTH, Purpose } from "@/lib/api";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { input } from "@/components/ui/styles";
import PurposePicker from "./PurposePicker";

export default function StoryForm({ onPosted }: { onPosted: (message: string) => void }) {
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ purpose?: string; body?: string; form?: string }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser from reloading the page
    const found: typeof errors = {};
    if (!purpose) found.purpose = "Choose what you move for.";
    if (!body.trim()) found.body = "Write a few words about why you move.";
    setErrors(found);
    if (Object.keys(found).length > 0 || !purpose) return;

    setSubmitting(true);
    try {
      await createStory({ purpose, body: body.trim(), display_name: name.trim() || null }); // blank name → Anonymous
      onPosted("Thank you for sharing your story");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <PurposePicker
        legend="Who or what do you move for?"
        value={purpose}
        onChange={(value) => {
          setPurpose(value);
          setErrors((e) => ({ ...e, purpose: undefined }));
        }}
        error={errors.purpose}
      />

      <Field
        id="story-body"
        label="Your story"
        error={errors.body}
        footer={<p className="ml-auto shrink-0 text-sm tabular-nums text-muted">{body.length}/{MAX_BODY_LENGTH}</p>}
      >
        <textarea
          id="story-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_BODY_LENGTH}
          rows={6}
          placeholder="The first time I laced up, it was because…"
          aria-invalid={!!errors.body}
          aria-describedby="story-body-error"
          className={input + " resize-y font-serif text-lg leading-relaxed"}
        />
      </Field>

      <Field id="story-name" label="Your name" optional>
        <input
          id="story-name"
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
        {submitting ? "Sharing…" : "Share story"}
      </Button>
    </form>
  );
}
