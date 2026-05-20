"use client";

import { create } from "zustand";
type CalendarView = "day" | "week" | "month";

type CalendarUiState = {
  view: CalendarView;
  selectedDate: string;
  sheetOpen: boolean;
  editingId: string | null;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  openSheet: (id?: string | null) => void;
  closeSheet: () => void;
};

export const useCalendarUiStore = create<CalendarUiState>((set) => ({
  view: "week",
  selectedDate: "",
  sheetOpen: false,
  editingId: null,
  setView: (view) => set({ view }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  openSheet: (editingId = null) => set({ sheetOpen: true, editingId }),
  closeSheet: () => set({ sheetOpen: false, editingId: null }),
}));
