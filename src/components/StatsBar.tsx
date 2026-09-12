function Stat({ value, label, tone }: { value: number; label: string; tone: "neutral" | "green" | "orange" }) {
  const toneClass =
    tone === "green"
      ? "text-accent-green"
      : tone === "orange"
        ? "text-accent-orange"
        : "text-foreground";
  return (
    <div className="flex flex-col gap-1">
      <span className={`font-mono text-2xl font-semibold ${toneClass}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function StatsBar({
  total,
  sampleAvailable,
  completed,
  failed,
}: {
  total: number;
  sampleAvailable: number;
  completed: number;
  failed: number;
}) {
  return (
    <div className="flex flex-wrap gap-8 rounded-2xl border border-border bg-surface-muted px-6 py-5">
      <Stat value={total} label="Models tracked" tone="neutral" />
      <Stat value={sampleAvailable} label="Samples playable" tone="green" />
      <Stat value={completed} label="Fully benchmarked" tone="green" />
      <Stat value={failed} label="Failed" tone="orange" />
    </div>
  );
}
