import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Dict, Any

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Gemini API configured successfully.")
else:
    print("Warning: GEMINI_API_KEY not found. Using local rule-based coaching fallback.")

# Articulation instructions for typical English phonetic problems
PHONEME_COACHING = {
    "TH": {
        "explanation": "Voiceless 'TH' (as in 'think' or 'three'). Typically mispronounced as 'T' or 'S'.",
        "tips": "Place the tip of your tongue lightly between your front teeth. Blow air out gently without voicing from your throat.",
        "practice_words": ["think", "three", "path", "healthy", "math"],
        "exercises": ["Three thin people thought they were free.", "Math is my third class on Thursday."]
    },
    "DH": {
        "explanation": "Voiced 'TH' (as in 'this' or 'brother'). Typically mispronounced as 'D' or 'Z'.",
        "tips": "Place your tongue between your teeth just like voiceless 'TH', but vibrate your vocal cords to add voice.",
        "practice_words": ["this", "them", "father", "mother", "weather"],
        "exercises": ["This weather is better than that.", "My brother and mother walked together."]
    },
    "R": {
        "explanation": "Alveolar 'R' (as in 'red' or 'run'). Often substituted with 'W' or 'L'.",
        "tips": "Curl the tip of your tongue slightly backward without touching the roof of your mouth. Round your lips slightly.",
        "practice_words": ["red", "rain", "write", "practice", "grow"],
        "exercises": ["The red rain ruined the roses.", "Try to practice writing every single day."]
    },
    "L": {
        "explanation": "Lateral 'L' (as in 'light' or 'pull'). Often substituted with 'W' or 'R'.",
        "tips": "Press the tip of your tongue firmly against the bumpy ridge behind your upper front teeth. Let air escape on the sides.",
        "practice_words": ["light", "pull", "yellow", "clean", "glass"],
        "exercises": ["A little yellow light lit the room.", "Please pull the clean glass handle."]
    },
    "IY": {
        "explanation": "Long vowel 'IY' (as in 'sheep'). Often shortened to 'IH' (as in 'ship').",
        "tips": "Smile slightly, tense your lips, and position your tongue very high and close to the roof of your mouth.",
        "practice_words": ["meet", "green", "see", "clean", "beach"],
        "exercises": ["We see the green team meet.", "Clean the deep pool please."]
    },
    "IH": {
        "explanation": "Short vowel 'IH' (as in 'sit'). Often tensed and mispronounced as 'IY' (as in 'seat').",
        "tips": "Keep your jaw slightly open and relax your lips and tongue. Position the tongue high but completely relaxed.",
        "practice_words": ["sit", "pin", "bit", "fish", "winter"],
        "exercises": ["The big fish bit the tin pin.", "Sit in the winter cabin for a minute."]
    }
}

class LLMService:
    def generate_feedback(
        self,
        transcript: str,
        overall_score: int,
        words: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates pronunciation coaching feedback.
        Queries Gemini API if key is present; otherwise falls back to smart local rules.
        """
        if GEMINI_API_KEY:
            try:
                return self._generate_gemini_feedback(transcript, overall_score, words)
            except Exception as e:
                print(f"Gemini API call failed: {e}. Triggering local coaching fallback.")
                
        return self._generate_fallback_feedback(transcript, overall_score, words)

    def _generate_gemini_feedback(
        self,
        transcript: str,
        overall_score: int,
        words: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Simplify words payload to keep prompt token size light
        words_data = [
            {
                "word": w["word"],
                "confidence": w["confidence"],
                "phonemes": [p["phoneme"] for p in w["phonemes"]]
            }
            for w in words
        ]
        
        prompt = f"""
You are an expert English speech therapist and pronunciation coach.
Analyze the user's spoken audio transcript and its word-level confidence ratings.

Spoken Transcript: "{transcript}"
Overall Pronunciation Score: {overall_score}/100
Word-level details: {json.dumps(words_data)}

Generate a personalized coaching report in JSON format containing the following keys:
1. "explanation": A detailed, encouraging paragraph explaining which words or sounds were spoken with lower confidence and what typical mispronunciation errors might be occurring.
2. "tips": Actionable articulation instructions (tongue/lip/jaw positioning) to correct the primary problematic sounds.
3. "practice_words": A list of 5-6 practice words focusing on the problem phonemes.
4. "exercises": A list of 2-3 short practice sentences/drills.

Return ONLY the raw JSON string matching this schema. Do not enclose it in markdown code blocks like ```json or add any explanation outside the JSON.
"""
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        data = json.loads(response.text.strip())
        return data

    def _generate_fallback_feedback(
        self,
        transcript: str,
        overall_score: int,
        words: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Runs the local rules engine based on low confidence scores and phoneme mapping.
        """
        # If the overall score is high and there are no critical errors
        low_confidence_words = [w for w in words if w["confidence"] < 80]
        
        if overall_score >= 85 or not low_confidence_words:
            return {
                "explanation": f"Excellent overall pronunciation clarity for the phrase: '{transcript}'. Your speech patterns are clear and highly intelligible.",
                "tips": "To master native flow, focus on word linking (blending the end of one word into the start of the next) and natural sentence rhythm (stressing content words while reducing structure words).",
                "practice_words": ["fluidity", "connection", "rhythm", "intonation", "smooth"],
                "exercises": [
                    "Read the transcript again focusing on a continuous, flowing breath.",
                    "Practice stressing only the nouns and verbs in the sentence."
                ]
            }

        # Collect phonemes from low-confidence words
        problem_phonemes = set()
        for w in low_confidence_words:
            for p in w["phonemes"]:
                problem_phonemes.add(p["phoneme"])

        # Match problem phonemes to coaching profiles
        explanations = []
        tips = []
        practice_words = []
        exercises = []
        
        matched = False
        for ph in problem_phonemes:
            if ph in PHONEME_COACHING:
                matched = True
                profile = PHONEME_COACHING[ph]
                explanations.append(profile["explanation"])
                tips.append(f"For the [{ph}] sound: {profile['tips']}")
                practice_words.extend(profile["practice_words"])
                exercises.extend(profile["exercises"])

        if not matched:
            # General fallback if no specific phoneme rule matches
            problem_word_texts = [f"'{w['word']}'" for w in low_confidence_words[:3]]
            words_joined = ", ".join(problem_word_texts)
            
            explanation = f"Some words in your recording (like {words_joined}) had slightly lower acoustic confidence, which indicates ambiguous pronunciation."
            tips = "Focus on opening your mouth wider, articulating each consonant fully, and making sure to complete the ending sounds of each word before transitioning."
            practice_words = ["pronounce", "articulate", "consonant", "vowel", "practice"]
            exercises = [
                "Slow down your speech pace by 20% and focus on clarity.",
                "Repeat the low-confidence words three times each, exaggerating the mouth movements."
            ]
        else:
            explanation = f"We noticed lower confidence scores on specific sounds. " + " ".join(explanations)
            tips = " ".join(tips)
            practice_words = list(set(practice_words))[:6]
            exercises = list(set(exercises))[:3]

        return {
            "explanation": explanation,
            "tips": tips,
            "practice_words": practice_words,
            "exercises": exercises
        }

# Singleton instance
llm_service = LLMService()
