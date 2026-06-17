import whisper
import librosa
from typing import List, Dict, Any

class WhisperService:
    def __init__(self):
        self.model_name = "tiny"
        self.model = None

    def _lazy_load(self):
        if self.model is None:
            print(f"Loading Whisper model '{self.model_name}' (this might take a few seconds on first run)...")
            self.model = whisper.load_model(self.model_name)
            print("Whisper model loaded successfully.")

    def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Loads audio file into a NumPy array using librosa, then feeds it directly
        to Whisper model to bypass local system FFmpeg requirements.
        Returns the parsed segments containing words, timestamps, and confidence.
        """
        self._lazy_load()
        try:
            # Load the normalized audio as a 16kHz float32 mono numpy array
            print(f"[WhisperService] Loading audio file: {audio_path}")
            y, sr = librosa.load(audio_path, sr=16000, mono=True)
            
            # Pass numpy array directly to the Whisper transcribe method
            print("[WhisperService] Initiating transcribe process with word-level timestamps...")
            result = self.model.transcribe(y, word_timestamps=True)
            
            # Extract word-level details
            words_list = []
            segments = result.get("segments", [])
            
            for segment in segments:
                # Some versions of whisper may put word timings under segment["words"]
                segment_words = segment.get("words", [])
                for sw in segment_words:
                    word_text = sw.get("word", "").strip()
                    # Filter punctuation from the word for clean phonetic conversion
                    word_clean = "".join(c for c in word_text if c.isalnum() or c == "'")
                    if not word_clean:
                        continue
                    
                    # Probability value (0.0 to 1.0)
                    prob = sw.get("probability", 1.0)
                    confidence = int(prob * 100)
                    
                    words_list.append({
                        "word": word_clean,
                        "start_time": sw.get("start", 0.0),
                        "end_time": sw.get("end", 0.0),
                        "confidence": confidence
                    })
            
            return {
                "transcript": result.get("text", "").strip(),
                "words": words_list
            }
            
        except Exception as e:
            print(f"Error in WhisperService transcribe: {e}")
            raise RuntimeError(f"Whisper transcription failed: {str(e)}")

# Singleton instance
whisper_service = WhisperService()
