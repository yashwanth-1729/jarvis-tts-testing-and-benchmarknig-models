# JARVIS Voice Arena

A website for comparing locally-run text-to-speech models by listening to the same
sentence from each model, then comparing technical benchmarks. Audio comparison is
the primary goal; benchmarking is secondary and happens after a model's sample is
already published. Started as a Telugu-only comparison (`telugu-tts-arena`); the
name and scope were generalized once English-model benchmarking was added
alongside it. Deployed independently of the JARVIS app itself, though its findings
are meant to eventually inform which TTS engines JARVIS uses.

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
- 2026-09-13: Investigated and catalog-verified the remaining reference-audio
  and gated families. `ai4bharat/IndicF5` and `ai4bharat/indic-parler-tts`
  (Prakash/Lalitha/Kiran) are both real, correctly documented (MIT / Apache
  2.0, architecture, sizes), but both are gated on Hugging Face and need the
  project owner's own account + `HF_TOKEN` to download; not something this
  session can do on its own. `Seemanth/chiluka-tts` returns HTTP 401 for
  anonymous access and could not be corroborated via search; recorded as
  unverifiable rather than substituted with an unrelated model. Chatterbox
  (`shankarpandala/chatterbox-telugu`, `reenigne314/chatterbox-indic-lora`)
  and `Dubverse/MahaTTSv2` were all confirmed real, public, and
  Telugu-capable.
  **Disk-space safety finding:** this host's system drive (C:) was already
  down to roughly 1-2GB free purely from earlier installs (Python 3.11,
  several venvs' package caches). Starting to load the
  shankarpandala/chatterbox-telugu checkpoint (~3GB) pushed Windows to grow
  its pagefile.sys (also on C:) enough to briefly drop free space to
  ~250MB, a real risk to the host machine, not just this project. That load
  was killed deliberately and the partial download cleaned up. Chatterbox
  (both variants) and MahaTTSv2 (4.6GB, the largest checkpoint in the whole
  catalog) are deferred until the host has more disk headroom; freed ~1.6GB
  via `pip cache purge` as an immediate mitigation, but that is not durable
  headroom. This is a host resource constraint, not a defect in any model.
- 2026-09-13: User confirmed the C: drive constraint directly and asked that
  everything install to D: going forward. Fixed durably: set persistent user
  environment variables (`TEMP`, `TMP` -> `D:\tmp`; `PIP_CACHE_DIR` ->
  `D:\pip-cache`; `HF_HOME` -> `D:\hf-cache`), migrated the existing Hugging
  Face cache from C: to D:, and cleared the old C: pip cache. Also killed
  roughly 30 orphaned node/python processes left over from several session
  restarts earlier in the day, which had caused a Turbopack build to fail
  outright with a Windows "insufficient system resources" error; the build
  succeeded immediately after cleanup. Retried `shankarpandala/chatterbox-telugu`
  with the fixed caches (C: recovered to 2.3-3.3GB free); the checkpoint
  loaded further this time but the process then stalled (CPU time advanced
  only ~4-5 seconds over the final 3 minutes of an over 10-minute run) and
  was killed rather than left running indefinitely. Deferred that variant,
  its LoRA sibling (`reenigne314/chatterbox-indic-lora`, same base model),
  and MahaTTSv2 (a still-larger 4.6GB checkpoint) rather than repeat the
  same risk. 8 models remain installed and published (Piper x3, MMS x2,
  AI4Bharat Indic-TTS x2 out of the attempted candidates); the deferred and
  blocked ones are all visible and explained on the live site, not hidden.
