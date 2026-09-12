from pathlib import Path

from huggingface_hub import hf_hub_download

HERE = Path(__file__).resolve().parent

# sherpa-onnx compatible community conversion
for fname in ["te/model.onnx", "te/tokens.txt", "te/config.json"]:
    hf_hub_download(
        repo_id="sriram09764/itantra-tts-onnx",
        filename=fname,
        local_dir=str(HERE / "models" / "sherpa-te-src"),
    )

# generic ONNX community conversion
for fname in ["tel/model.onnx", "tel/tokens.txt"]:
    hf_hub_download(
        repo_id="willwade/mms-tts-multilingual-models-onnx",
        filename=fname,
        local_dir=str(HERE / "models" / "onnx-tel-src"),
    )

print("done")
