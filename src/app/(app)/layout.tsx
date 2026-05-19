"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useUserId, useProfile } from "@/hooks/use-bloom-data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useUserId();
  const { data: profile, isLoading } = useProfile(userId);

  useEffect(() => {
    if (isLoading || !userId) return;
    if (profile && !profile.onboarding_complete && !pathname.startsWith("/onboarding")) {
      router.replace("/onboarding");
    }
    if (profile?.onboarding_complete && pathname.startsWith("/onboarding")) {
      router.replace("/dashboard");
    }
  }, [profile, isLoading, userId, pathname, router]);

  return (
    <>
      <div className="mx-auto min-h-screen max-w-lg px-4 pt-6 pb-28">{children}</div>
      {profile?.onboarding_complete && <BottomNav />}
    </>
  );
}
