import os
import sys
import uvicorn
from dotenv import load_dotenv

# Inject parent directory into path so imports of 'backend' resolve correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables at startup
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.analysis import router as analysis_router
from backend.database.connection import get_db, close_db

app = FastAPI(
    title="Audio-Only Pronunciation Coaching System API",
    description="Backend API for automatic Whisper transcription, G2P forced alignment, and AI coaching feedback.",
    version="2.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the uploads directory exists relative to backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the uploads directory statically so frontend can play back recorded audios
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def startup_db_client():
    get_db()

@app.on_event("shutdown")
def shutdown_db_client():
    close_db()

# Register routes
app.include_router(analysis_router, tags=["Analysis"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Audio-Only Pronunciation Coaching API is running",
        "transcription_model": "openai-whisper-tiny"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
