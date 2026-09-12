import json
import time
import wave
from pathlib import Path

import torch
from transformers import VitsModel, AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"

VARIANT_ID = "mms-tts-tel-pytorch"
MODEL_ID = "facebook/mms-tts-tel"


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    model = VitsModel.from_pretrained(MODEL_ID)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    load_sec = time.perf_counter() - load_start

    inputs = tokenizer(text, return_tensors="pt")

    synth_start = time.perf_counter()
    with torch.no_grad():
        output = model(**inputs).waveform
    synth_sec = time.perf_counter() - synth_start

    waveform = output.squeeze().numpy()
    rate = model.config.sampling_rate

    out_dir = AUDIO_DIR / VARIANT_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"

    import numpy as np

    pcm16 = np.clip(waveform, -1.0, 1.0)
    pcm16 = (pcm16 * 32767).astype(np.int16)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(pcm16.tobytes())

    duration_sec = len(waveform) / float(rate)
    file_size_kb = out_path.stat().st_size / 1024.0

    result = {
        "variantId": VARIANT_ID,
        "audioPath": f"/audio/{VARIANT_ID}/primary.wav",
        "sampleRateHz": rate,
        "durationSec": round(duration_sec, 3),
        "synthesisTimeSec": round(synth_sec, 3),
        "loadSec": round(load_sec, 3),
        "fileSizeKB": round(file_size_kb, 1),
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
