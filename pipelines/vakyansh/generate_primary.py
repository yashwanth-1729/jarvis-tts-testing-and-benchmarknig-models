import json
import sys
import time
import wave
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parent / "repo"
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / "src" / "glow_tts"))

from tts_infer.tts import TextToMel, MelToWav  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
CKPT_DIR = Path(__file__).resolve().parent / "checkpoints"

VOICES = {
    "vakyansh-te-glow-female": CKPT_DIR / "glow_female" / "glow",
    "vakyansh-te-glow-male": CKPT_DIR / "glow_male" / "glow",
}
HIFI_DIR = CKPT_DIR / "hifi" / "hifi"


def run_one(variant_id: str, glow_dir: Path) -> dict:
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    text_to_mel = TextToMel(glow_model_dir=str(glow_dir), device="cpu")
    mel_to_wav = MelToWav(hifi_model_dir=str(HIFI_DIR), device="cpu")
    load_sec = time.perf_counter() - load_start

    final_text = " " + text.strip() + " "

    synth_start = time.perf_counter()
    mel = text_to_mel.generate_mel(final_text)
    audio, sr = mel_to_wav.generate_wav(mel)
    synth_sec = time.perf_counter() - synth_start

    out_dir = AUDIO_DIR / variant_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"

    audio = np.asarray(audio, dtype=np.float32)
    peak = np.max(np.abs(audio)) or 1.0
    pcm16 = np.clip(audio / peak, -1.0, 1.0)
    pcm16 = (pcm16 * 32767).astype(np.int16)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(int(sr))
        wf.writeframes(pcm16.tobytes())

    duration_sec = len(pcm16) / float(sr)
    file_size_kb = out_path.stat().st_size / 1024.0

    return {
        "variantId": variant_id,
        "audioPath": f"/audio/{variant_id}/primary.wav",
        "sampleRateHz": int(sr),
        "durationSec": round(duration_sec, 3),
        "synthesisTimeSec": round(synth_sec, 3),
        "loadSec": round(load_sec, 3),
        "fileSizeKB": round(file_size_kb, 1),
    }


def main():
    if len(sys.argv) == 2:
        vid = sys.argv[1]
        print(json.dumps(run_one(vid, VOICES[vid]), ensure_ascii=False))
        return
    for vid, glow_dir in VOICES.items():
        print(json.dumps(run_one(vid, glow_dir), ensure_ascii=False))


if __name__ == "__main__":
    main()
