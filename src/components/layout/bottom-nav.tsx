"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Image, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "today", icon: Home },
  { href: "/calendar", label: "calendar", icon: Calendar },
  { href: "/shelf", label: "shelf", icon: Image },
  { href: "/nourish", label: "nourish", icon: UtensilsCrossed },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card rounded-none border-t border-beige/40 safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors",
                active ? "text-ink" : "text-whisper"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span>{label}</span>
              {active && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-blush" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
