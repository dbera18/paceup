"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DistanceUnit } from "@/lib/format";

export type CreateKind = "story" | "activity" | "import";

type AppState = {
  // The Create sheet
  createOpen: boolean;
  createKind: CreateKind | null;
  openCreate: (kind?: CreateKind) => void;
  closeCreate: () => void;
  setCreateKind: (kind: CreateKind | null) => void;
  // Called after a successful post: shows the toast and tells feeds to reload
  notifyPosted: (message: string) => void;
  feedVersion: number;
  toast: string | null;
  // km or miles, shared by the activity form and the cards
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
};

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppProvider>");
  return value;
}

// Shared app-wide state, so the Create button in the nav can post
// and the feed on any page refreshes afterwards.
export default function AppProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [feedVersion, setFeedVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [unit, setUnit] = useState<DistanceUnit>("km");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCreate = useCallback((kind?: CreateKind) => {
    setCreateKind(kind ?? null);
    setCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => setCreateOpen(false), []);

  const notifyPosted = useCallback((message: string) => {
    setCreateOpen(false);
    setFeedVersion((v) => v + 1);
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  return (
    <AppContext.Provider
      value={{ createOpen, createKind, openCreate, closeCreate, setCreateKind, notifyPosted, feedVersion, toast, unit, setUnit }}
    >
      {children}
    </AppContext.Provider>
  );
}
