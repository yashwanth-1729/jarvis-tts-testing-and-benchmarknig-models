import familiesJson from "../../data/families.json";
import variantsJson from "../../data/variants.json";
import samplesJson from "../../data/samples.json";
import benchmarksJson from "../../data/benchmarks.json";
import hardwareJson from "../../data/hardware-profiles.json";
import ratingsJson from "../../data/ratings.json";
import corpusJson from "../../data/corpus.json";
import failuresJson from "../../data/failures.json";
import type {
  ModelFamily,
  ModelVariant,
  AudioSample,
  BenchmarkRun,
  HardwareProfile,
  HumanRating,
  BenchmarkSentence,
  FailureRecord,
} from "./types";

export const families = familiesJson.families as ModelFamily[];
export const variants = variantsJson.variants as ModelVariant[];
export const samples = samplesJson.samples as AudioSample[];
export const benchmarkRuns = benchmarksJson.runs as BenchmarkRun[];
export const hardwareProfiles = hardwareJson.profiles as HardwareProfile[];
export const humanRatings = ratingsJson.ratings as HumanRating[];
export const corpusSentences = corpusJson.sentences as BenchmarkSentence[];
export const failures = failuresJson.failures as FailureRecord[];

export const primarySentence = corpusSentences.find((s) => s.isPrimary)!;

export function familyById(id: string): ModelFamily | undefined {
  return families.find((f) => f.id === id);
}

export function variantsByFamily(familyId: string): ModelVariant[] {
  return variants.filter((v) => v.familyId === familyId);
}

export function samplesForVariant(variantId: string): AudioSample[] {
  return samples.filter((s) => s.variantId === variantId);
}

export function primarySampleForVariant(variantId: string): AudioSample | undefined {
  return samples.find((s) => s.variantId === variantId && s.sentenceId === "primary");
}

export function benchmarkRunsForVariant(variantId: string): BenchmarkRun[] {
  return benchmarkRuns.filter((b) => b.variantId === variantId);
}

export function ratingsForVariant(variantId: string): HumanRating[] {
  return humanRatings.filter((r) => r.variantId === variantId);
}

export function failuresForVariant(variantId: string): FailureRecord[] {
  return failures.filter((f) => f.variantId === variantId);
}

export function hardwareProfileById(id: string): HardwareProfile | undefined {
  return hardwareProfiles.find((h) => h.id === id);
}

export function arenaStats() {
  const total = variants.length;
  const sampleAvailable = variants.filter((v) =>
    ["sample_available", "benchmarking", "completed"].includes(v.status)
  ).length;
  const completed = variants.filter((v) => v.status === "completed").length;
  const failed = variants.filter((v) => v.status === "failed").length;
  const inProgress = total - sampleAvailable - failed - variants.filter((v) => v.status === "not_started").length;
  return { total, sampleAvailable, completed, failed, inProgress };
}
