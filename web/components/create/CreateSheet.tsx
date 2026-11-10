"use client";

import { ComponentType, SVGProps } from "react";
import { useApp, CreateKind } from "@/components/shell/AppProvider";
import { BackIcon, ChevronIcon, PenIcon, PulseIcon, QuestionIcon } from "@/components/ui/Icons";
import Sheet from "@/components/ui/Sheet";
import ActivityForm from "./ActivityForm";
import StoryForm from "./StoryForm";

type Choice = {
  kind: CreateKind | "question";
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  comingSoon?: boolean;
};

const CHOICES: Choice[] = [
  { kind: "story", title: "Share a story", description: "Tell us why you move.", Icon: PenIcon },
  { kind: "question", title: "Ask a question", description: "Get advice from the community.", Icon: QuestionIcon, comingSoon: true },
  { kind: "activity", title: "Log an activity", description: "A run, ride, swim, walk or workout.", Icon: PulseIcon },
];

const TITLES: Record<CreateKind, string> = { story: "Share a story", activity: "Log an activity" };

export default function CreateSheet() {
  const { createOpen, createKind, closeCreate, setCreateKind, notifyPosted } = useApp();

  return (
    <Sheet
      open={createOpen}
      onClose={closeCreate}
      title={createKind ? TITLES[createKind] : "Create"}
      leading={
        createKind && (
          <button
            type="button"
            onClick={() => setCreateKind(null)}
            aria-label="Back to choices"
            className="flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text active:scale-95"
          >
            <BackIcon width={22} height={22} />
          </button>
        )
      }
    >
      {/* key={createKind} gives each form a fresh, empty state every time it opens */}
      {createKind === "story" && <StoryForm key="story" onPosted={notifyPosted} />}
      {createKind === "activity" && <ActivityForm key="activity" onPosted={notifyPosted} />}

      {!createKind && (
        <ul className="space-y-3 pb-2">
          {CHOICES.map(({ kind, title, description, Icon, comingSoon }) => (
            <li key={kind}>
              <button
                type="button"
                disabled={comingSoon}
                onClick={() => kind !== "question" && setCreateKind(kind)}
                className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 text-left transition duration-200 enabled:hover:border-muted/30 enabled:hover:bg-surface-2/50 enabled:active:scale-[0.98] disabled:cursor-not-allowed"
              >
                <span
                  className={
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl " +
                    (comingSoon ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent-text")
                  }
                >
                  <Icon width={22} height={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-base font-semibold text-text">
                    {title}
                    {comingSoon && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
                        Soon
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{description}</span>
                </span>
                {!comingSoon && (
                  <ChevronIcon width={20} height={20} className="text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
