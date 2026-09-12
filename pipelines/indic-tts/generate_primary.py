import json
import sys
import time
import wave
from pathlib import Path

from TTS.utils.synthesizer import Synthesizer

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
CKPT_DIR = Path(__file__).resolve().parent / "checkpoints" / "te"

SPEAKERS = {
    "indic-tts-te-fastpitch-female": "female",
    "indic-tts-te-fastpitch-male": "male",
}


def run_one(variant_id: str, speaker_name: str) -> dict:
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    load_start = time.perf_counter()
    synth = Synthesizer(
        tts_checkpoint=str(CKPT_DIR / "fastpitch" / "best_model.pth"),
        tts_config_path=str(CKPT_DIR / "fastpitch" / "config.json"),
        tts_speakers_file=str(CKPT_DIR / "fastpitch" / "speakers.pth"),
        vocoder_checkpoint=str(CKPT_DIR / "hifigan" / "best_model.pth"),
        vocoder_config=str(CKPT_DIR / "hifigan" / "config.json"),
        use_cuda=False,
    )
    load_sec = time.perf_counter() - load_start

    synth_start = time.perf_counter()
    wav = synth.tts(text=text, speaker_name=speaker_name)
    synth_sec = time.perf_counter() - synth_start

    out_dir = AUDIO_DIR / variant_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"
    synth.save_wav(wav, str(out_path))

    with wave.open(str(out_path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        duration_sec = frames / float(rate)

    file_size_kb = out_path.stat().st_size / 1024.0

    return {
        "variantId": variant_id,
        "audioPath": f"/audio/{variant_id}/primary.wav",
        "sampleRateHz": rate,
        "durationSec": round(duration_sec, 3),
        "synthesisTimeSec": round(synth_sec, 3),
        "loadSec": round(load_sec, 3),
        "fileSizeKB": round(file_size_kb, 1),
    }


def main():
    if len(sys.argv) == 3:
        result = run_one(sys.argv[1], sys.argv[2])
        print(json.dumps(result, ensure_ascii=False))
        return
    for vid, speaker in SPEAKERS.items():
        print(json.dumps(run_one(vid, speaker), ensure_ascii=False))


if __name__ == "__main__":
    main()
