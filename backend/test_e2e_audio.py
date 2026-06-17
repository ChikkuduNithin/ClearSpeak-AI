import os
import sys
from gtts import gTTS

# Add workspace directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.audio_service import normalize_audio
from backend.services.pronunciation_service import pronunciation_service
from backend.services.llm_service import llm_service

def run_e2e_test():
    print("==========================================================")
    print("   Starting End-to-End Audio Pronunciation Coaching Test")
    print("==========================================================")
    
    # Session paths
    test_text = "three thin thieves thought of a plan"
    temp_mp3 = "backend/uploads/temp_e2e.mp3"
    
    os.makedirs("backend/uploads", exist_ok=True)
    
    try:
        # 1. Generate clean synthetic speech representation
        print(f"\n[Step 1] Generating reference speech audio for: '{test_text}'")
        tts = gTTS(text=test_text, lang='en', slow=False)
        tts.save(temp_mp3)
        
        # 2. Normalize to 16kHz mono WAV (Whisper format)
        print("\n[Step 2] Normalizing speech audio to 16kHz WAV...")
        normalized_wav = normalize_audio(temp_mp3, filename_prefix="e2e_user")
        print(f"Normalized WAV path: {normalized_wav}")
        
        # 3. Run speech transcription & phoneme timing alignment
        print("\n[Step 3] Loading Whisper & running transcription + forced alignment...")
        analysis = pronunciation_service.evaluate_audio(normalized_wav)
        
        print(f"\n--- TRANSCRIPTION RESULT ---")
        print(f"Spoken Transcript: '{analysis['transcript']}'")
        print(f"Overall Clarity Score: {analysis['overall_score']}%")
        print(f"Spoken Words & Aligned Timestamps:")
        for w in analysis["words"]:
            print(f"  - Word: '{w['word']}' ({w['start_time']}s - {w['end_time']}s) | Confidence: {w['confidence']}%")
            print(f"    Phonemes: {', '.join([p['phoneme'] for p in w['phonemes']])}")
            
        # 4. Generate AI Coaching Feedback
        print("\n[Step 4] Running LLM Coaching generator...")
        feedback = llm_service.generate_feedback(
            transcript=analysis["transcript"],
            overall_score=analysis["overall_score"],
            words=analysis["words"]
        )
        
        print("\n--- AI COACH RECOMMENDATIONS ---")
        print(f"Explanation: {feedback['explanation']}")
        print(f"Tips: {feedback['tips']}")
        print(f"Practice Words: {feedback['practice_words']}")
        print(f"Coaching Drills: {feedback['exercises']}")
        
        # Assertions
        assert len(analysis["transcript"]) > 0, "Transcript should not be empty"
        assert analysis["overall_score"] > 0, "Score should be non-zero"
        assert len(analysis["words"]) > 0, "Word list should be non-empty"
        assert len(feedback["explanation"]) > 0, "Explanation feedback should not be empty"
        
        print("\n==========================================================")
        print("   SUCCESS: End-to-End Speech Coaching Pipeline Passed!")
        print("==========================================================")
        
    except Exception as e:
        print(f"\nERROR: Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    finally:
        # Cleanup
        if os.path.exists(temp_mp3):
            os.remove(temp_mp3)
            print("\nCleaned up temporary MP3 file.")

if __name__ == "__main__":
    run_e2e_test()
