"use client";

import { useMemo, useState } from "react";
import type { ModelStatus, ModelVariant, SizeClass } from "@/lib/types";
import { ModelCard } from "./ModelCard";
import { SIZE_CLASS_LABEL, STATUS_LABEL, hasPlayableSample } from "@/lib/status";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

const SIZE_ORDER: SizeClass[] = ["tiny", "small", "medium", "large", "very_large", "unknown"];
const STATUS_ORDER: ModelStatus[] = [
  "completed",
  "benchmarking",
  "sample_available",
  "ready",
  "generating_sample",
  "installing",
  "downloading",
  "not_started",
  "failed",
];

export function ArenaBoard({ variants }: { variants: ModelVariant[] }) {
  const [query, setQuery] = useState("");
  const [sizeFilter, setSizeFilter] = useState<SizeClass | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");
  const [playableOnly, setPlayableOnly] = useState(false);

  const filtered = useMemo(() => {
    return variants
      .filter((v) => (sizeFilter === "all" ? true : v.sizeClass === sizeFilter))
      .filter((v) => (statusFilter === "all" ? true : v.status === statusFilter))
      .filter((v) => (playableOnly ? hasPlayableSample(v.status) : true))
      .filter((v) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          (v.voice ?? "").toLowerCase().includes(q) ||
          v.architecture.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [variants, sizeFilter, statusFilter, playableOnly, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
          <MagnifyingGlass size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search model, voice, architecture"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value as SizeClass | "all")}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm"
        >
          <option value="all">All sizes</option>
          {SIZE_ORDER.map((s) => (
            <option key={s} value={s}>
              {SIZE_CLASS_LABEL[s]}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ModelStatus | "all")}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm">
          <input
            type="checkbox"
            checked={playableOnly}
            onChange={(e) => setPlayableOnly(e.target.checked)}
            className="accent-[var(--accent-green)]"
          />
          Playable only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No models match these filters yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <ModelCard key={v.id} variant={v} />
          ))}
        </div>
      )}
    </div>
  );
}
