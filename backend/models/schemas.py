from pydantic import BaseModel, Field
from typing import List, Dict

class PhonemeAlignment(BaseModel):
    phoneme: str = Field(..., description="The ARPAbet representation of the phoneme")
    start_time: float = Field(..., description="Start timestamp of the phoneme in seconds")
    end_time: float = Field(..., description="End timestamp of the phoneme in seconds")
    confidence: int = Field(..., description="Confidence score out of 100")

class WordAlignment(BaseModel):
    word: str = Field(..., description="The spoken word text")
    start_time: float = Field(..., description="Start timestamp of the word in seconds")
    end_time: float = Field(..., description="End timestamp of the word in seconds")
    confidence: int = Field(..., description="Confidence probability score out of 100")
    phonemes: List[PhonemeAlignment] = Field(..., description="Time-aligned phonemes for this word")

class LLMFeedback(BaseModel):
    explanation: str = Field(..., description="Overall assessment of the pronunciation clarity and mistakes")
    tips: str = Field(..., description="Actionable articulation advice (e.g. tongue/lip position)")
    practice_words: List[str] = Field(..., description="Target vocabulary words containing the difficult sounds")
    exercises: List[str] = Field(..., description="Specific sentences or practicing drills")

class AnalysisResponse(BaseModel):
    id: str = Field(..., description="Unique database analysis session identifier")
    transcript: str = Field(..., description="The complete text transcript of the spoken audio")
    overall_score: int = Field(..., description="The overall pronunciation accuracy score out of 100")
    words: List[WordAlignment] = Field(..., description="Spoken words list with forced timestamps and phoneme details")
    feedback: LLMFeedback = Field(..., description="AI feedback coach recommendations")
    audio_path: str = Field(..., description="Path to the uploaded audio file relative to backend root")
    timestamp: str = Field(..., description="ISO 8601 formatting of analysis time")
