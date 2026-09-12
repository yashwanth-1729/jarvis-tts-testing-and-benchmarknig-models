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
