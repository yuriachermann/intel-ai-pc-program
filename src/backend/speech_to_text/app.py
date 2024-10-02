from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

from ov_qwen2_audio_helper import OVQwen2AudioForConditionalGeneration
from transformers import AutoProcessor
from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path
import subprocess
import librosa
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your React app's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_dir = Path("Qwen2-Audio-7B-Instruct")
device = "GPU"  # You can change this to "AUTO" or "CPU" or "GPU" as needed
ov_model = OVQwen2AudioForConditionalGeneration(model_dir, device)
processor = AutoProcessor.from_pretrained(model_dir)


@app.post("/speech-to-text/")
async def speech_to_text(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    audio_file = Path(file.filename)
    if file.content_type == 'audio/webm':
        audio_file = audio_file.with_suffix('.webm')
    try:
        print(f"Received file: {file.filename}")
        print(f"Content type: {file.content_type}")
        print(f"Saving file to: {audio_file}")

        with open(audio_file, "wb") as buffer:
            buffer.write(await file.read())

        # Convert the audio file to WAV format using ffmpeg
        wav_file = audio_file.with_suffix('.wav')
        ffmpeg_path = r"C:\ffmpeg\bin\ffmpeg.exe"  # Update this path accordingly

        command = [
            ffmpeg_path, '-y', '-i', str(audio_file),
            '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000', str(wav_file)
        ]
        subprocess.run(command, check=True)
        print(f"Converted audio saved to: {wav_file}")

        # Load the WAV file
        audio, sr = librosa.load(wav_file, sr=None)
        print(f"Audio loaded. Sample rate: {sr}, Length: {len(audio)} samples")

        audios = [audio]

        # Prepare conversation to prompt the assistant to transcribe the audio
        conversation = [
            {"role": "system", "content": "You will be asked to give a dish name. Just answer with the dish name and nothing else in the asnwer."},
            {
                "role": "user",
                "content": [
                    {"type": "audio", "audio_url": "user_audio.wav"},
                ],
            },
        ]

        # Generate text from the conversation
        text = processor.apply_chat_template(conversation, add_generation_prompt=True, tokenize=False)
        print("Generated text template:", text)

        # Prepare inputs for the model
        inputs = processor(text=text, audios=audios, return_tensors="pt", padding=True)
        print("Model inputs prepared.")

        # Generate output using the model
        generate_ids = ov_model.generate(**inputs, max_new_tokens=1024)
        print("Output generated.")

        # Decode the output tokens to text
        decoded_output = processor.decode(generate_ids[0], skip_special_tokens=True)
        print("Decoded output:", decoded_output)

        # Extract the assistant's response (the transcription)
        transcription = decoded_output.split("assistant\n")[-1].strip()
        print("Transcription:", transcription)

        # Return the transcribed text
        return {"text": transcription}

    except Exception as e:
        print(f"Exception occurred: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup the temporary files
        for f in [audio_file, wav_file]:
            if f.exists():
                try:
                    f.unlink()
                except PermissionError:
                    pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
