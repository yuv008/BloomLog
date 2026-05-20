import type {
  CalendarCategory,
  CalendarEventKind,
  CalendarEventStatus,
} from "@/lib/types";

export type CreateCalendarEventInput = {
  ritual_date: string;
  title: string;
  notes?: string | null;
  category?: CalendarCategory;
  kind?: CalendarEventKind;
  starts_at?: string | null;
  ends_at?: string | null;
  all_day?: boolean;
  ritual_end_date?: string | null;
  priority?: number;
  linked_quest_key?: string | null;
  position_order?: number;
  source_meta?: Record<string, unknown>;
  recurrence_rule_id?: string | null;
};

export type UpdateCalendarEventInput = Partial<
  CreateCalendarEventInput & {
    status: CalendarEventStatus;
    ritual_date: string;
    completed_at: string | null;
  }
>;
