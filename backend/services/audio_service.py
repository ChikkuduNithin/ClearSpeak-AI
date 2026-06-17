import os
import librosa
import soundfile as sf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Ensure the uploads directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def normalize_audio(input_path: str, filename_prefix: str = "normalized") -> str:
    """
    Loads an audio file from input_path, normalizes it to 16kHz mono,
    and saves it as a 16-bit PCM WAV file in the uploads directory.
    Returns the absolute path to the normalized file.
    """
    try:
        # Load audio using librosa at 16000 Hz, mono
        y, sr = librosa.load(input_path, sr=16000, mono=True)
        
        # Save to output WAV
        output_filename = f"{filename_prefix}_{os.path.basename(input_path)}"
        if not output_filename.endswith(".wav"):
            output_filename = os.path.splitext(output_filename)[0] + ".wav"
            
        output_path = os.path.join(UPLOAD_DIR, output_filename)
        
        # Write 16-bit PCM WAV
        sf.write(output_path, y, 16000, subtype='PCM_16')
        return output_path
    except Exception as e:
        print(f"Error normalising audio {input_path}: {e}")
        raise RuntimeError(f"Audio normalization failed: {str(e)}")
