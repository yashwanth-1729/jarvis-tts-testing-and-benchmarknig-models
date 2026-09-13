import json
import os
import time
import wave
from pathlib import Path

os.environ.setdefault("HF_HOME", "D:\\hf-cache")

import numpy as np
import soundfile as sf
import torch

# The IndicF5 model's remote code unconditionally wraps its vocoder in
# torch.compile(), which crashes under fake-tensor tracing on this torch/CPU
# combination (mixing meta and cpu tensors in torchaudio's melscale_fbanks).
# torch.compile is a pure performance optimization; disabling it just runs
# eager mode, which is what we want for a benchmark anyway.
torch.compile = lambda model, *args, **kwargs: model

# The IndicF5 remote code's INF5Model.__init__ calls f5_tts's load_model()
# without a ckpt_path argument (its own local weight-loading code is
# commented out in the published model.py), relying on an older f5-tts
# release where ckpt_path had a default. The installed f5-tts (1.1.22) made
# it a required positional argument. Patch load_model to auto-download the
# model's own checkpoint (the same file INF5Config's ckpt_path default
# points at: checkpoints/model_best.pt) when called without one.
from huggingface_hub import hf_hub_download
from safetensors.torch import load_file as _load_safetensors
import f5_tts.infer.utils_infer as _f5_utils_infer

_original_load_checkpoint = _f5_utils_infer.load_checkpoint


def _patched_load_checkpoint(model, ckpt_path, device, dtype=None, use_ema=True):
    # The published checkpoint's keys are all prefixed with "_orig_mod."
    # (it was saved from a torch.compile-wrapped model). IndicF5's own
    # remote code relies on the outer torch.compile(load_model(...)) call
    # to re-wrap the live model the same way before this ever mattered, but
    # we've disabled torch.compile entirely (it crashes under fake-tensor
    # tracing on this torch/CPU build), so the live model has no such
    # wrapper and the prefixed keys no longer match. Strip the prefix.
    if dtype is None:
        dtype = torch.float32
    model = model.to(dtype)
    checkpoint = _load_safetensors(ckpt_path, device=str(device))
    checkpoint = {
        k.replace("_orig_mod.", ""): v
        for k, v in checkpoint.items()
        if not k.replace("_orig_mod.", "").startswith("vocoder.")
    }
    if use_ema:
        checkpoint = {"ema_model_state_dict": checkpoint}
        checkpoint["model_state_dict"] = {
            k.replace("ema_model.", ""): v
            for k, v in checkpoint["ema_model_state_dict"].items()
            if k not in ["initted", "step"]
        }
        for key in ["mel_spec.mel_stft.mel_scale.fb", "mel_spec.mel_stft.spectrogram.window"]:
            checkpoint["model_state_dict"].pop(key, None)
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
    return model.to(device)


_f5_utils_infer.load_checkpoint = _patched_load_checkpoint
_original_load_model = _f5_utils_infer.load_model


def _patched_load_model(model_cls, model_cfg, ckpt_path=None, **kwargs):
    if not ckpt_path:
        # The published model.py's own weight-loading code is commented out
        # and its config default (checkpoints/model_best.pt) does not exist
        # in the repo; the real weights are model.safetensors at repo root.
        ckpt_path = hf_hub_download("ai4bharat/IndicF5", filename="model.safetensors")
    # f5-tts 1.1.22's load_checkpoint does `"cuda" in device`, which raises
    # TypeError when device is a torch.device object (as IndicF5's model.py
    # passes it) rather than a string. Pass a plain string instead.
    if "device" in kwargs:
        kwargs["device"] = str(kwargs["device"])
    return _original_load_model(model_cls, model_cfg, ckpt_path, **kwargs)


_f5_utils_infer.load_model = _patched_load_model

from transformers import AutoModel

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
VARIANT_ID = "indicf5-ai4bharat"
REFERENCE_AUDIO = str(AUDIO_DIR / "piper-te-padmavathi-medium" / "primary.wav")


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    model = AutoModel.from_pretrained(
        "ai4bharat/IndicF5",
        trust_remote_code=True,
        low_cpu_mem_usage=False,
        _fast_init=False,
    )
    load_sec = time.perf_counter() - load_start

    synth_start = time.perf_counter()
    audio = model(
        text,
        ref_audio_path=REFERENCE_AUDIO,
        ref_text=text,
    )
    synth_sec = time.perf_counter() - synth_start

    out_dir = AUDIO_DIR / VARIANT_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"

    audio = np.asarray(audio, dtype=np.float32)
    if audio.dtype in (np.int16,):
        pass
    sf.write(str(out_path), audio, samplerate=24000, subtype="PCM_16")

    with wave.open(str(out_path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        duration_sec = frames / float(rate)

    file_size_kb = out_path.stat().st_size / 1024.0

    result = {
        "variantId": VARIANT_ID,
        "audioPath": f"/audio/{VARIANT_ID}/primary.wav",
        "sampleRateHz": rate,
        "durationSec": round(duration_sec, 3),
        "synthesisTimeSec": round(synth_sec, 3),
        "loadSec": round(load_sec, 3),
        "fileSizeKB": round(file_size_kb, 1),
        "referenceAudioPath": "/audio/piper-te-padmavathi-medium/primary.wav",
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
