import json
import os
import sys
import time
import wave
from pathlib import Path

os.environ.setdefault("HF_HOME", "D:\\hf-cache")

import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
AUDIO_DIR = ROOT / "public" / "audio"
CORPUS_PATH = ROOT / "data" / "corpus.json"
MODEL_ID = "ai4bharat/indic-parler-tts"

VOICE_DESCRIPTIONS = {
    "indic-parler-tts-prakash": "Prakash's voice is monotone yet slightly expressive in delivery, with a very close recording that has almost no background noise.",
    "indic-parler-tts-lalitha": "Lalitha's voice is monotone yet slightly expressive in delivery, with a very close recording that has almost no background noise.",
    "indic-parler-tts-kiran": "Kiran's voice is monotone yet slightly expressive in delivery, with a very close recording that has almost no background noise.",
}


def run_one(model, tokenizer, description_tokenizer, device, variant_id, description, text):
    description_input_ids = description_tokenizer(description, return_tensors="pt").to(device)
    prompt_input_ids = tokenizer(text, return_tensors="pt").to(device)

    synth_start = time.perf_counter()
    generation = model.generate(
        input_ids=description_input_ids.input_ids,
        attention_mask=description_input_ids.attention_mask,
        prompt_input_ids=prompt_input_ids.input_ids,
        prompt_attention_mask=prompt_input_ids.attention_mask,
    )
    synth_sec = time.perf_counter() - synth_start

    audio_arr = generation.cpu().numpy().squeeze()

    out_dir = AUDIO_DIR / variant_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "primary.wav"
    sf.write(str(out_path), audio_arr, model.config.sampling_rate)

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
        "fileSizeKB": round(file_size_kb, 1),
        "voiceDescription": description,
    }


def main():
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    text = next(s for s in corpus["sentences"] if s["isPrimary"])["text"]

    device = "cpu"
    load_start = time.perf_counter()
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID).to(device)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    load_sec = time.perf_counter() - load_start

    targets = sys.argv[1:] or list(VOICE_DESCRIPTIONS.keys())
    for vid in targets:
        result = run_one(model, tokenizer, description_tokenizer, device, vid, VOICE_DESCRIPTIONS[vid], text)
        result["loadSec"] = round(load_sec, 3)
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
