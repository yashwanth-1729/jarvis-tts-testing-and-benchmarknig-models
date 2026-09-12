import json
import time
import wave
from pathlib import Path

import numpy as np
import sherpa_onnx

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
HERE = Path(__file__).resolve().parent

VARIANT_ID = "mms-tts-tel-sherpa-onnx"
MODEL_DIR = HERE / "models" / "sherpa-te-src" / "te"


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
        model=str(MODEL_DIR / "model.onnx"),
        tokens=str(MODEL_DIR / "tokens.txt"),
    )
    model_config = sherpa_onnx.OfflineTtsModelConfig(vits=vits_config, num_threads=2)
    tts_config = sherpa_onnx.OfflineTtsConfig(model=model_config)
    tts = sherpa_onnx.OfflineTts(tts_config)
    load_sec = time.perf_counter() - load_start

    synth_start = time.perf_counter()
    audio = tts.generate(text, sid=0, speed=1.0)
    synth_sec = time.perf_counter() - synth_start

    out_dir = AUDIO_DIR / VARIANT_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"

    samples = np.array(audio.samples, dtype=np.float32)
    pcm16 = np.clip(samples, -1.0, 1.0)
    pcm16 = (pcm16 * 32767).astype(np.int16)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(audio.sample_rate)
        wf.writeframes(pcm16.tobytes())

    duration_sec = len(samples) / float(audio.sample_rate)
    file_size_kb = out_path.stat().st_size / 1024.0

    result = {
        "variantId": VARIANT_ID,
        "audioPath": f"/audio/{VARIANT_ID}/primary.wav",
        "sampleRateHz": audio.sample_rate,
        "durationSec": round(duration_sec, 3),
        "synthesisTimeSec": round(synth_sec, 3),
        "loadSec": round(load_sec, 3),
        "fileSizeKB": round(file_size_kb, 1),
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
