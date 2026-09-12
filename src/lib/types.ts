export type ModelStatus =
  | "not_started"
  | "downloading"
  | "installing"
  | "ready"
  | "generating_sample"
  | "sample_available"
  | "benchmarking"
  | "completed"
  | "failed";

export type SizeClass = "tiny" | "small" | "medium" | "large" | "very_large" | "unknown";

export type Precision = "fp32" | "fp16" | "int8" | "int4" | "mixed" | "unknown";

export type Framework =
  | "piper"
  | "onnx"
  | "pytorch"
  | "transformers"
  | "coqui-tts"
  | "sherpa-onnx"
  | "espnet"
  | "other";

export type DeviceKind = "cpu" | "gpu";

export interface ModelFamily {
  id: string;
  name: string;
  org: string;
  category:
    | "piper"
    | "meta-mms"
    | "ai4bharat-indic-tts"
    | "vakyansh"
    | "ai4bharat-indicf5"
    | "chiluka"
    | "chatterbox"
    | "ai4bharat-indic-parler"
    | "mahatts"
    | "discovered";
  homepage?: string;
  license?: string;
  notes?: string;
}

export interface ModelVariant {
  id: string;
  familyId: string;
  name: string;
  voice?: string;
  version?: string;
  architecture: string;
  paramCount?: string;
  downloadSizeMB?: number;
  installedDiskMB?: number;
  precision: Precision;
  requiresVocoder: boolean;
  vocoderName?: string;
  framework: Framework;
  source: string;
  license: string;
  cpuSupport: "yes" | "no" | "untested";
  gpuSupport: "yes" | "no" | "untested";
  mobileRelevant: boolean;
  sizeClass: SizeClass;
  supportsReferenceAudio: boolean;
  status: ModelStatus;
  failureReason?: string;
  lastUpdated?: string;
  notes?: string;
  verified: boolean;
}

export interface BenchmarkSentence {
  id: string;
  category:
    | "primary"
    | "telugu_short"
    | "telugu_conversational"
    | "telugu_medium"
    | "telugu_long"
    | "telugu_question"
    | "telugu_statement"
    | "telugu_numbers"
    | "telugu_dates"
    | "telugu_time"
    | "telugu_currency"
    | "telugu_names"
    | "telugu_uncommon"
    | "tenglish"
    | "tenglish_technical"
    | "difficult_pronunciation";
  text: string;
  isPrimary: boolean;
  notes?: string;
}

export interface AudioSample {
  id: string;
  variantId: string;
  sentenceId: string;
  audioPath: string;
  sampleRateHz?: number;
  durationSec?: number;
  synthesisTimeSec?: number;
  peakRamMB?: number;
  peakRamIsInformal?: boolean;
  device: DeviceKind | "unknown";
  runtime?: string;
  generationParams?: Record<string, unknown>;
  referenceAudioPath?: string;
  generatedAt: string;
}

export interface HardwareProfile {
  id: string;
  label: string;
  os: string;
  cpu: string;
  physicalCores: number;
  logicalCores: number;
  totalRamGB: number;
  gpu?: string;
  vramGB?: number;
  pythonVersion?: string;
  onnxProviders?: string[];
}

export interface BenchmarkRun {
  id: string;
  variantId: string;
  hardwareProfileId: string;
  device: DeviceKind;
  sentenceId: string;
  coldLoadSec?: number | null;
  warmLoadSec?: number | null;
  peakRamMB?: number | null;
  stableRamMB?: number | null;
  synthesisSec?: number | null;
  audioDurationSec?: number | null;
  rtf?: number | null;
  ttfaSec?: number | null;
  charsPerSec?: number | null;
  peakCpuPct?: number | null;
  avgCpuPct?: number | null;
  threadCount?: number | null;
  gpuUtilPct?: number | null;
  gpuMemMB?: number | null;
  outputSampleRateHz?: number | null;
  audioFileSizeKB?: number | null;
  repetitions?: number;
  stdDevSec?: number | null;
  timestamp: string;
}

export interface HumanRating {
  id: string;
  variantId: string;
  sampleId: string;
  pronunciation?: number;
  consistency?: number;
  naturalness?: number;
  tenglishHandling?: number;
  expressiveness?: number;
  pleasantness?: number;
  overall?: number;
  notes?: string;
  ratedAt: string;
}

export interface FailureRecord {
  id: string;
  variantId: string;
  stage: "download" | "install" | "load" | "inference" | "benchmark";
  message: string;
  timestamp: string;
}
