"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/data/api";
import { normalizeCurrency } from "@/lib/locale/currencies";
import { detectTimezone, normalizeTimezone } from "@/lib/locale/timezones";
import { detectDefaultCurrency } from "@/lib/locale/detect";

type UserPreferences = {
  currency: string;
  timezone: string;
  ready: boolean;
};

const UserPreferencesContext = createContext<UserPreferences>({
  currency: detectDefaultCurrency(),
  timezone: detectTimezone(),
  ready: false,
});

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    api.ensureAuth().then((session) => setUserId(session.userId));
  }, []);
  const { data: profile, isFetched } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => (userId ? api.getProfile(userId) : null),
    enabled: !!userId,
  });

  const value = useMemo(
    () => ({
      currency: normalizeCurrency(profile?.currency),
      timezone: normalizeTimezone(profile?.timezone),
      ready: !userId || isFetched,
    }),
    [profile?.currency, profile?.timezone, userId, isFetched]
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}
