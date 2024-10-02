from pathlib import Path
import requests

if not Path("ov_qwen2_audio_helper.py").exists():
    r = requests.get(url="https://raw.githubusercontent.com/openvinotoolkit/openvino_notebooks/latest/notebooks/qwen2-audio/ov_qwen2_audio_helper.py")
    open("ov_qwen2_audio_helper.py", "w").write(r.text)

if not Path("notebook_utils.py").exists():
    r = requests.get(url="https://raw.githubusercontent.com/openvinotoolkit/openvino_notebooks/latest/utils/notebook_utils.py")
    open("notebook_utils.py", "w").write(r.text)
    
pt_model_id = "Qwen/Qwen2-Audio-7B-Instruct"

model_dir = Path(pt_model_id.split("/")[-1])

from ov_qwen2_audio_helper import convert_qwen2audio_model

# uncomment these lines to see model conversion code
# convert_qwen2audio_model??

import nncf

compression_configuration = {
    "mode": nncf.CompressWeightsMode.INT4_ASYM,
    "group_size": 128,
    "ratio": 1.0,
}

convert_qwen2audio_model(pt_model_id, model_dir, compression_configuration)