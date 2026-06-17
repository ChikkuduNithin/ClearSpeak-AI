from typing import Dict, Any, List
from backend.services.whisper_service import whisper_service
from backend.services.phoneme_service import phoneme_service

class PronunciationService:
    def evaluate_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Runs the complete speech-to-text forced alignment evaluation pipeline:
        1. Transcribes the audio using Whisper to get text, timings, and word confidences.
        2. Aligns phonemes dynamically for each transcribed word.
        3. Computes the overall score as the average word confidence.
        """
        try:
            # 1. Run Whisper transcription and word extraction
            result = whisper_service.transcribe_audio(audio_path)
            transcript = result.get("transcript", "")
            words = result.get("words", [])
            
            # 2. Iterate through words and align phonemes
            word_alignments = []
            word_scores = []
            
            for w in words:
                word_text = w["word"]
                start = w["start_time"]
                end = w["end_time"]
                conf = w["confidence"]
                
                word_scores.append(conf)
                
                # Perform linear time-alignment of phonemes
                aligned_phonemes = phoneme_service.forced_align_phonemes(
                    word=word_text,
                    start_time=start,
                    end_time=end,
                    word_confidence=conf
                )
                
                word_alignments.append({
                    "word": word_text,
                    "start_time": round(start, 3),
                    "end_time": round(end, 3),
                    "confidence": conf,
                    "phonemes": aligned_phonemes
                })
                
            # 3. Compute overall score (average of word confidence probabilities)
            if word_scores:
                overall_score = int(sum(word_scores) / len(word_scores))
            else:
                overall_score = 100 if transcript else 0
                
            return {
                "transcript": transcript,
                "overall_score": overall_score,
                "words": word_alignments
            }
            
        except Exception as e:
            print(f"Error in PronunciationService.evaluate_audio: {e}")
            # Fallback error record
            return {
                "transcript": "[UNABLE TO TRANSCRIBE - ERROR]",
                "overall_score": 0,
                "words": []
            }

# Singleton instance
pronunciation_service = PronunciationService()
