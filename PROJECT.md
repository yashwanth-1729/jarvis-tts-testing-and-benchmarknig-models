# Telugu TTS Arena

An independent (not-JARVIS) website for comparing locally-run Telugu text-to-speech
models by listening to the same sentence from each model, then comparing technical
benchmarks. Audio comparison is the primary goal; benchmarking is secondary and
happens after a model's sample is already published.

## Status

Phase 1 (website) is built and deployed. Phase 3/4 (model catalog investigation and
size classification) is seeded with placeholder/unverified entries for the candidate
model list. No models have been installed or benchmarked yet: this happens
progressively, one model at a time, per the audio-first pipeline below.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4
- Phosphor Icons
- Data layer: flat JSON files under `data/` (no external DB) so the site can be
  regenerated and redeployed as models progress. See `src/lib/types.ts` for the
  schema and `src/lib/data.ts` for the data-access layer.
- Deployment: Vercel

## Data layer

- `data/families.json` - model families/orgs (Piper, Meta MMS, AI4Bharat Indic-TTS,
  Vakyansh, IndicF5, Chiluka, Chatterbox, Indic Parler-TTS, MahaTTS, Discovered).
- `data/variants.json` - each individually playable model variant/voice, with full
  metadata (architecture, precision, size class, license, CPU/GPU support, etc.) and
  a `status` field driving the UI (`not_started` -> `downloading` -> `installing` ->
  `ready` -> `generating_sample` -> `sample_available` -> `benchmarking` ->
  `completed`, or `failed` at any point).
- `data/corpus.json` - benchmark sentences. `primary` is the fixed sentence used
  identically across every model; do not change it once samples exist.
- `data/samples.json` - generated audio sample records (path, duration, device,
  generation params, timestamps).
- `data/benchmarks.json` - benchmark run records (RTF, load times, RAM/CPU, etc.).
- `data/hardware-profiles.json` - hardware profiles benchmark runs reference.
- `data/ratings.json` - human ratings (populated later, manually).
- `data/failures.json` - recorded install/inference/benchmark failures, never hidden.

Audio files live under `public/audio/<variant-id>/<sentence-id>.wav` and are
referenced by `audioPath` in `data/samples.json`.

## Updating the site as models progress

1. Run inference for the model, save the WAV under `public/audio/<variant-id>/`.
2. Add a record to `data/samples.json` (and update the variant's `status` in
   `data/variants.json` to `sample_available`).
3. Commit and push to `main`. Vercel redeploys automatically and the new sample
   becomes playable immediately, without waiting on other models or benchmarks.
4. Once benchmarked, append to `data/benchmarks.json` and set `status` to
   `completed`.

## Local development

```bash
npm install
npm run dev
```

## Maintenance and latest changes

- 2026-09-12: Initial build. Site scaffolded, data layer defined, model candidate
  catalog seeded (unverified placeholders per the investigation plan), primary
  benchmark sentence fixed, deployed to Vercel. No models installed yet.
- 2026-09-12: Piper Telugu (Maya, Padmavathi, Venkatesh, all `medium`) verified
  against Hugging Face (exact repo paths, sizes ~63-64 MB, license corrected from
  a placeholder "MIT" to the actual IIT Madras Indic TTS license that governs the
  voice weights). Installed in an isolated venv at `pipelines/piper/.venv` via
  `pip install piper-tts`, ran on CPU with no GPU. Primary sentence synthesized
  for all three voices and published to `public/audio/<variant-id>/primary.wav`;
  all three now show `sample_available` and are playable on the live site.
  Fixed an `AudioPlayer` bug where the duration label stayed at 0:00 when the
  underlying `<audio>` element's metadata was already loaded before the
  listeners attached. Not yet benchmarked (Phase 4 of the pipeline);
  `pipelines/piper/generate_primary.py` recorded informal CPU synthesis
  times (0.53-5.2s for an ~9-11s clip) but this is not the formal benchmark run.
- 2026-09-13: Meta MMS Telugu investigated and installed in an isolated venv at
  `pipelines/mms/.venv`. Three variants: (1) the official `facebook/mms-tts-tel`
  checkpoint via `transformers.VitsModel` (36.3M params, CC-BY-NC 4.0, 16kHz) -
  succeeded on CPU, sample published. (2) A generic ONNX export
  (`willwade/mms-tts-multilingual-models-onnx`) run via plain `onnxruntime`,
  reusing the official tokenizer's `input_ids` since it is exported from the
  same checkpoint - succeeded, sample published. (3) A sherpa-onnx-formatted
  community ONNX export (`sriram09764/itantra-tts-onnx`) - failed: `sherpa-onnx`
  1.13.8's `OfflineTts.generate()` segfaults during synthesis, reproduced even
  with a single word, so it is marked `failed` with the crash documented rather
  than hidden or silently retried. No official k2-fsa sherpa-onnx release exists
  for Telugu MMS (confirmed against the `tts-models` GitHub release asset list),
  so the catalog now documents this substitution explicitly instead of using
  the original placeholder identifier. All three variants' catalog entries were
  corrected from "to be located" placeholders to verified sources/sizes/licenses.
