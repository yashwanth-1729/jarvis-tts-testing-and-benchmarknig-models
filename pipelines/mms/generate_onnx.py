import json
import time
import wave
from pathlib import Path

import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
HERE = Path(__file__).resolve().parent

VARIANT_ID = "mms-tts-tel-onnx"
ONNX_PATH = HERE / "models" / "onnx-tel-src" / "tel" / "model.onnx"
TOKENIZER_ID = "facebook/mms-tts-tel"


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_ID)
    sess = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    load_sec = time.perf_counter() - load_start

    inputs = tokenizer(text, return_tensors="np")
    x = inputs["input_ids"].astype(np.int64)
    x_length = np.array([x.shape[1]], dtype=np.int64)

    onnx_inputs = {
        "x": x,
        "x_length": x_length,
        "noise_scale": np.array([0.667], dtype=np.float32),
        "length_scale": np.array([1.0], dtype=np.float32),
        "noise_scale_w": np.array([0.8], dtype=np.float32),
    }

    synth_start = time.perf_counter()
    outputs = sess.run(["y"], onnx_inputs)
    synth_sec = time.perf_counter() - synth_start

    waveform = np.squeeze(outputs[0])
    rate = 16000

    out_dir = AUDIO_DIR / VARIANT_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"

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
