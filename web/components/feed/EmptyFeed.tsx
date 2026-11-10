"use client";

import { CreateKind, useApp } from "@/components/shell/AppProvider";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function EmptyFeed({ emoji, title, text, action, kind }: { emoji: string; title: string; text: string; action: string; kind: CreateKind }) {
  const { openCreate } = useApp();
  return (
    <EmptyState
      emoji={emoji}
      title={title}
      action={
        <Button variant="accent" size="lg" onClick={() => openCreate(kind)}>
          {action}
        </Button>
      }
    >
      {text}
    </EmptyState>
  );
}
