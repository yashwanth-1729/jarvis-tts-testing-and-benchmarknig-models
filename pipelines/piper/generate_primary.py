import json
import sys
import time
import wave
from pathlib import Path

from piper import PiperVoice

ROOT = Path(__file__).resolve().parents[2]
VOICES_DIR = Path(__file__).resolve().parent / "voices"
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"

VOICE_IDS = {
    "piper-te-maya-medium": "te_IN-maya-medium",
    "piper-te-padmavathi-medium": "te_IN-padmavathi-medium",
    "piper-te-venkatesh-medium": "te_IN-venkatesh-medium",
}


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    primary = next(s for s in corpus["sentences"] if s["isPrimary"])
    text = primary["text"]

    results = []
    for variant_id, onnx_name in VOICE_IDS.items():
        onnx_path = VOICES_DIR / f"{onnx_name}.onnx"
        out_dir = AUDIO_DIR / variant_id
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "primary.wav"

        voice = PiperVoice.load(str(onnx_path))

        start = time.perf_counter()
        with wave.open(str(out_path), "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)
        synthesis_sec = time.perf_counter() - start

        with wave.open(str(out_path), "rb") as wav_file:
            frames = wav_file.getnframes()
            rate = wav_file.getframerate()
            duration_sec = frames / float(rate)

        file_size_kb = out_path.stat().st_size / 1024.0

        result = {
            "variantId": variant_id,
            "audioPath": f"/audio/{variant_id}/primary.wav",
            "sampleRateHz": rate,
            "durationSec": round(duration_sec, 3),
            "synthesisTimeSec": round(synthesis_sec, 3),
            "fileSizeKB": round(file_size_kb, 1),
        }
        results.append(result)
        print(json.dumps(result, ensure_ascii=False))

    (Path(__file__).resolve().parent / "primary_results.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
