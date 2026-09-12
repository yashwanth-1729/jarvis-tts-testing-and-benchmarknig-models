import Link from "next/link";
import type { ModelVariant } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { AudioPlayer } from "./AudioPlayer";
import { SIZE_CLASS_LABEL } from "@/lib/status";
import { hasPlayableSample } from "@/lib/status";
import { primarySampleForVariant, familyById } from "@/lib/data";
import { WarningCircle, MicrophoneStage } from "@phosphor-icons/react/dist/ssr";
import { formatMB } from "@/lib/format";

export function ModelCard({ variant }: { variant: ModelVariant }) {
  const family = familyById(variant.familyId);
  const primarySample = primarySampleForVariant(variant.id);
  const playable = hasPlayableSample(variant.status) && primarySample;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {family?.name ?? variant.familyId}
          </p>
          <Link
            href={`/models/${variant.id}`}
            className="block text-base font-semibold leading-snug text-foreground hover:text-accent-green"
          >
            {variant.name}
          </Link>
          {variant.voice && (
            <p className="truncate text-xs text-muted-foreground">{variant.voice}</p>
          )}
        </div>
        <StatusBadge status={variant.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Architecture</dt>
          <dd className="truncate text-right font-medium">{variant.architecture}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Size class</dt>
          <dd className="text-right font-medium">{SIZE_CLASS_LABEL[variant.sizeClass]}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Precision</dt>
          <dd className="text-right font-medium uppercase">{variant.precision}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Framework</dt>
          <dd className="truncate text-right font-medium">{variant.framework}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Download</dt>
          <dd className="text-right font-medium">{formatMB(variant.downloadSizeMB)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Peak RAM</dt>
          <dd className="whitespace-nowrap text-right font-medium">
            {formatMB(primarySample?.peakRamMB)}
          </dd>
        </div>
      </dl>
      {primarySample?.peakRamMB && primarySample.peakRamIsInformal ? (
        <p className="-mt-2 text-right text-[10px] text-muted-foreground">
          Peak RAM figure is informal (single run), not the formal benchmark
        </p>
      ) : null}

      <div className="min-h-[52px] rounded-xl bg-surface-muted p-3">
        {playable && primarySample ? (
          <AudioPlayer src={primarySample.audioPath} label={variant.name} />
        ) : variant.status === "failed" ? (
          <p className="flex items-center gap-2 text-xs text-[var(--status-failed)]">
            <WarningCircle size={16} weight="bold" />
            {variant.failureReason ?? "Installation or inference failed."}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <MicrophoneStage size={16} />
            No sample yet
          </p>
        )}
      </div>
    </div>
  );
}
