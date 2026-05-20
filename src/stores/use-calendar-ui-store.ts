"use client";

import { create } from "zustand";
import type { CalendarEvent } from "@/lib/types";

type CalendarView = "day" | "week" | "month";

type CalendarUiState = {
  view: CalendarView;
  selectedDate: string;
  sheetOpen: boolean;
  editingId: string | null;
  editingEvent: CalendarEvent | null;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  openSheet: (event?: CalendarEvent | null) => void;
  closeSheet: () => void;
};

export const useCalendarUiStore = create<CalendarUiState>((set) => ({
  view: "week",
  selectedDate: "",
  sheetOpen: false,
  editingId: null,
  editingEvent: null,
  setView: (view) => set({ view }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  openSheet: (event = null) =>
    set({
      sheetOpen: true,
      editingId: event?.id ?? null,
      editingEvent: event ?? null,
    }),
  closeSheet: () =>
    set({ sheetOpen: false, editingId: null, editingEvent: null }),
}));
