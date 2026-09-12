import { variants, arenaStats, primarySentence } from "@/lib/data";
import { StatsBar } from "@/components/StatsBar";
import { ArenaBoard } from "@/components/ArenaBoard";
import { SpeakerHigh } from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  const stats = arenaStats();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Telugu TTS Arena
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Listen to every locally-run Telugu text-to-speech model reading the same
          sentence, then compare technical benchmarks once they finish running.
        </p>
      </header>

      <section className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
        <SpeakerHigh size={20} className="mt-0.5 shrink-0 text-accent-orange" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            Primary comparison sentence, used identically by every model
          </p>
          <p className="telugu text-lg leading-relaxed">{primarySentence.text}</p>
        </div>
      </section>

      <StatsBar
        total={stats.total}
        sampleAvailable={stats.sampleAvailable}
        completed={stats.completed}
        failed={stats.failed}
      />

      <ArenaBoard variants={variants} />
    </div>
  );
}
