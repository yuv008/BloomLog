import Link from "next/link";
import { Button } from "@/components/primitives/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-blush/20 to-sage/20 flex flex-col items-center justify-center p-8 text-center">
      <p className="text-6xl mb-6">🌸</p>
      <h1 className="font-display text-4xl md:text-5xl text-ink max-w-lg">
        a pocket-sized cozy room where your day quietly blooms
      </h1>
      <p className="text-whisper mt-4 max-w-md text-sm leading-relaxed">
        mood as weather · mindful spends · tiny quests · no streak shame.
        about 60 seconds a day.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button asChild className="w-full">
          <Link href="/onboarding">join the soft list</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/dashboard">open app</Link>
        </Button>
      </div>
      <p className="text-xs text-whisper mt-12">bloomlog.app · alpha</p>
    </main>
  );
}
