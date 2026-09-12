import type { ModelStatus, SizeClass } from "./types";

export const STATUS_LABEL: Record<ModelStatus, string> = {
  not_started: "Not started",
  downloading: "Downloading",
  installing: "Installing",
  ready: "Ready",
  generating_sample: "Generating sample",
  sample_available: "Sample available",
  benchmarking: "Benchmarking",
  completed: "Completed",
  failed: "Failed",
};

type StatusTone = "neutral" | "progress" | "ready" | "failed";

const STATUS_TONE: Record<ModelStatus, StatusTone> = {
  not_started: "neutral",
  downloading: "progress",
  installing: "progress",
  ready: "progress",
  generating_sample: "progress",
  sample_available: "ready",
  benchmarking: "progress",
  completed: "ready",
  failed: "failed",
};

export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-[var(--status-not-started-soft)] text-[var(--status-not-started)]",
  progress: "bg-[var(--status-progress-soft)] text-[var(--status-progress)]",
  ready: "bg-[var(--status-ready-soft)] text-[var(--status-ready)]",
  failed: "bg-[var(--status-failed-soft)] text-[var(--status-failed)]",
};

export function statusClasses(status: ModelStatus): string {
  return STATUS_TONE_CLASSES[STATUS_TONE[status]];
}

export function hasPlayableSample(status: ModelStatus): boolean {
  return status === "sample_available" || status === "benchmarking" || status === "completed";
}

export const SIZE_CLASS_LABEL: Record<SizeClass, string> = {
  tiny: "Tiny",
  small: "Small",
  medium: "Medium",
  large: "Large",
  very_large: "Very large",
  unknown: "Unverified",
};
