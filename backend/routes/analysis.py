import os
import uuid
import shutil
import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel, Field

from backend.models.schemas import AnalysisResponse
from backend.database.connection import get_db
from backend.services.audio_service import normalize_audio
from backend.services.pronunciation_service import pronunciation_service
from backend.services.llm_service import llm_service

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
FALLBACK_DB_PATH = os.path.join(BASE_DIR, "database", "history_fallback.json")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(FALLBACK_DB_PATH), exist_ok=True)

class AnalyzeRequest(BaseModel):
    audio_path: str = Field(..., description="Path to the uploaded audio file relative to backend root")

def read_fallback_history() -> List[dict]:
    if not os.path.exists(FALLBACK_DB_PATH):
        return []
    try:
        with open(FALLBACK_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading fallback DB: {e}")
        return []

def write_fallback_history(records: List[dict]):
    try:
        with open(FALLBACK_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=4, default=str)
    except Exception as e:
        print(f"Error writing fallback DB: {e}")

@router.post("/upload-audio", status_code=status.HTTP_201_CREATED)
async def upload_audio(file: UploadFile = File(...)):
    """
    Saves an uploaded audio file to the uploads directory.
    Returns the path relative to the backend root.
    """
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".wav"
        
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        relative_path = f"uploads/{unique_filename}"
        return {"audio_path": relative_path}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

@router.post("/analyze-audio", response_model=AnalysisResponse)
async def analyze_audio(request: AnalyzeRequest):
    """
    Performs audio-only pronunciation coaching analysis:
    - Normalizes audio to 16kHz mono WAV
    - Transcribes using Whisper and aligns word timings
    - Generates phoneme sequences and timing interpolations
    - Evaluates scores and triggers LLM feedback
    - Saves results and returns response
    """
    full_audio_path = os.path.join(BASE_DIR, request.audio_path)
    
    if not os.path.exists(full_audio_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio file not found: {request.audio_path}"
        )
        
    try:
        # 1. Normalize user audio
        print(f"[Routes] Normalizing audio file: {full_audio_path}")
        normalized_path = normalize_audio(full_audio_path, filename_prefix="norm_user")
        
        # 2. Run the evaluation coordinator (Whisper + Phoneme alignment)
        analysis = pronunciation_service.evaluate_audio(normalized_path)
        
        # 3. Generate LLM Coaching Feedback
        feedback_dict = llm_service.generate_feedback(
            transcript=analysis["transcript"],
            overall_score=analysis["overall_score"],
            words=analysis["words"]
        )
        
        # 4. Construct response document
        record_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        final_record = {
            "id": record_id,
            "transcript": analysis["transcript"],
            "overall_score": analysis["overall_score"],
            "words": analysis["words"],
            "feedback": feedback_dict,
            "audio_path": request.audio_path,
            "timestamp": timestamp
        }
        
        # 5. Save to MongoDB or local JSON fallback
        db = get_db()
        if db is not None:
            try:
                mongo_record = final_record.copy()
                mongo_record["_id"] = record_id
                db.analyses.insert_one(mongo_record)
                print(f"[Routes] Saved record {record_id} to MongoDB.")
            except Exception as mongo_err:
                print(f"[Routes] MongoDB write error: {mongo_err}. Writing to local JSON fallback.")
                fallback_history = read_fallback_history()
                fallback_history.append(final_record)
                write_fallback_history(fallback_history)
        else:
            fallback_history = read_fallback_history()
            fallback_history.append(final_record)
            write_fallback_history(fallback_history)
            print(f"[Routes] Saved record {record_id} to local JSON fallback database.")

        return final_record

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline execution failed: {str(e)}"
        )

@router.get("/analysis/{id}", response_model=AnalysisResponse)
async def get_analysis(id: str):
    """
    Retrieves a specific pronunciation coaching record by ID.
    """
    db = get_db()
    if db is not None:
        try:
            record = db.analyses.find_one({"_id": id})
            if record:
                record["id"] = record.get("_id", id)
                return record
        except Exception as e:
            print(f"MongoDB read error: {e}. Searching fallback history.")

    fallback_history = read_fallback_history()
    for rec in fallback_history:
        if rec.get("id") == id:
            return rec
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Analysis record with ID '{id}' not found."
    )

@router.get("/history", response_model=List[AnalysisResponse])
async def get_history():
    """
    Retrieves all past pronunciation coaching sessions, sorted by date (newest first).
    """
    history = []
    db = get_db()
    if db is not None:
        try:
            cursor = db.analyses.find({"transcript": {"$exists": True}}).sort("timestamp", -1)
            for doc in cursor:
                doc["id"] = doc.get("_id", str(doc.get("id")))
                history.append(doc)
            return history
        except Exception as e:
            print(f"MongoDB history read failed: {e}. Returning fallback history.")

    fallback_history = read_fallback_history()
    fallback_history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return fallback_history
