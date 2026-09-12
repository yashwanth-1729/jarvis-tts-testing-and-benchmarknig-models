import json
import os
import time
import wave
from pathlib import Path

os.environ.setdefault("HF_HOME", str(Path(__file__).resolve().parent / "hf_cache"))

import torchaudio as ta
from huggingface_hub import snapshot_download
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
VARIANT_ID = "chatterbox-telugu-shankarpandala"
REFERENCE_AUDIO = str(AUDIO_DIR / "piper-te-padmavathi-medium" / "primary.wav")


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    ckpt = snapshot_download("shankarpandala/chatterbox-telugu")
    model = ChatterboxMultilingualTTS.from_local(
        ckpt, device="cpu", t3_model="t3_mtl_te.safetensors"
    )
    load_sec = time.perf_counter() - load_start

    synth_start = time.perf_counter()
    wav = model.generate(
        text,
        language_id="te",
        audio_prompt_path=REFERENCE_AUDIO,
    )
    synth_sec = time.perf_counter() - synth_start

    out_dir = AUDIO_DIR / VARIANT_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"
    ta.save(str(out_path), wav, model.sr)

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
