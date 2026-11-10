import { ReactNode } from "react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "./PageHeader";

export default function ComingSoon({ title, emoji, children }: { title: string; emoji: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      <PageHeader eyebrow="Coming soon" title={title} />
      <EmptyState emoji={emoji} title="We're still building this">
        {children}
      </EmptyState>
    </main>
  );
}
