import Link from "next/link";
import { notFound } from "next/navigation";
import {
  variants,
  familyById,
  samplesForVariant,
  primarySampleForVariant,
  benchmarkRunsForVariant,
  failuresForVariant,
  corpusSentences,
} from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { AudioPlayer } from "@/components/AudioPlayer";
import { SIZE_CLASS_LABEL } from "@/lib/status";
import { formatMB } from "@/lib/format";
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react/dist/ssr";

export function generateStaticParams() {
  return variants.map((v) => ({ id: v.id }));
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default async function ModelDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const variant = variants.find((v) => v.id === id);
  if (!variant) notFound();

  const family = familyById(variant.familyId);
  const samples = samplesForVariant(variant.id);
  const primarySample = primarySampleForVariant(variant.id);
  const runs = benchmarkRunsForVariant(variant.id);
  const variantFailures = failuresForVariant(variant.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to arena
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {variant.name}
            {variant.voice ? ` · ${variant.voice}` : ""}
          </h1>
          <StatusBadge status={variant.status} />
        </div>
        <p className="text-sm text-muted-foreground">{family?.name}</p>
      </header>

      {variant.status === "failed" && (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--status-failed)]/30 bg-[var(--status-failed-soft)] p-4 text-sm text-[var(--status-failed)]">
          <WarningCircle size={18} weight="bold" className="mt-0.5 shrink-0" />
          <span>{variant.failureReason ?? "This model failed during setup."}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold">Model metadata</h2>
          <div className="divide-y divide-border">
            <MetaRow label="Architecture" value={variant.architecture} />
            <MetaRow label="Version" value={variant.version ?? "N/A"} />
            <MetaRow label="Parameter count" value={variant.paramCount ?? "N/A"} />
            <MetaRow label="Precision" value={variant.precision.toUpperCase()} />
            <MetaRow label="Framework" value={variant.framework} />
            <MetaRow
              label="Vocoder"
              value={variant.requiresVocoder ? (variant.vocoderName ?? "Required, unspecified") : "Not required"}
            />
            <MetaRow label="Size class" value={SIZE_CLASS_LABEL[variant.sizeClass]} />
            <MetaRow label="Download size" value={formatMB(variant.downloadSizeMB)} />
            <MetaRow label="Installed disk usage" value={formatMB(variant.installedDiskMB)} />
            <MetaRow
              label="Peak RAM to run"
              value={
                primarySample?.peakRamMB
                  ? `${formatMB(primarySample.peakRamMB)}${primarySample.peakRamIsInformal ? " (informal)" : ""}`
                  : "N/A (not yet benchmarked)"
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold">Runtime and provenance</h2>
          <div className="divide-y divide-border">
            <MetaRow label="CPU support" value={variant.cpuSupport} />
            <MetaRow label="GPU support" value={variant.gpuSupport} />
            <MetaRow label="Mobile relevant" value={variant.mobileRelevant ? "Yes" : "No"} />
            <MetaRow label="Reference audio support" value={variant.supportsReferenceAudio ? "Yes" : "No"} />
            <MetaRow label="License" value={variant.license} />
            <MetaRow label="Source" value={variant.source} />
            <MetaRow label="Verified" value={variant.verified ? "Yes" : "Pending investigation"} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          Audio samples ({samples.length} / {corpusSentences.length})
        </h2>
        {samples.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No samples generated yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {samples.map((s) => {
              const sentence = corpusSentences.find((c) => c.id === s.sentenceId);
              return (
                <div key={s.id} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="telugu mb-3 text-sm text-foreground">{sentence?.text}</p>
                  <AudioPlayer src={s.audioPath} label={sentence?.id} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Benchmark runs</h2>
        {runs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Not benchmarked yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map((r) => (
              <div key={r.id} className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 text-sm sm:grid-cols-4">
                <MetaRow label="Device" value={r.device} />
                <MetaRow label="RTF" value={r.rtf?.toFixed(3) ?? "N/A"} />
                <MetaRow label="Synthesis" value={r.synthesisSec ? `${r.synthesisSec.toFixed(2)}s` : "N/A"} />
                <MetaRow label="Peak RAM" value={r.peakRamMB ? `${r.peakRamMB} MB` : "N/A"} />
              </div>
            ))}
          </div>
        )}
      </section>

      {variantFailures.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Failure history</h2>
          {variantFailures.map((f) => (
            <div key={f.id} className="rounded-2xl border border-border bg-surface-muted p-4 text-sm">
              <p className="font-medium capitalize">{f.stage}</p>
              <p className="text-muted-foreground">{f.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.timestamp}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
