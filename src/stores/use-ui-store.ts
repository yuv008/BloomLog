"use client";

import { create } from "zustand";
import type { Mood } from "@/lib/types";

interface UiState {
  sessionCount: number;
  viewedShelf: boolean;
  activeWhisper: string | null;
  showPetalBurst: boolean;
  previewMood: Mood | null;
  incrementSession: () => void;
  setViewedShelf: (v: boolean) => void;
  setActiveWhisper: (key: string | null) => void;
  triggerPetalBurst: () => void;
  clearPetalBurst: () => void;
  setPreviewMood: (mood: Mood | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sessionCount: 1,
  viewedShelf: false,
  activeWhisper: null,
  showPetalBurst: false,
  previewMood: null,
  incrementSession: () =>
    set((s) => ({ sessionCount: s.sessionCount + 1 })),
  setViewedShelf: (viewedShelf) => set({ viewedShelf }),
  setActiveWhisper: (activeWhisper) => set({ activeWhisper }),
  triggerPetalBurst: () => set({ showPetalBurst: true }),
  clearPetalBurst: () => set({ showPetalBurst: false }),
  setPreviewMood: (previewMood) => set({ previewMood }),
}));
