# ClearSpeak AI - Audio-Only Pronunciation Coaching System

ClearSpeak AI is an advanced English pronunciation coaching system. It records or uploads spoken audio, transcribes the voice using OpenAI's Whisper model, performs grapheme-to-phoneme (G2P) alignment to map out phoneme timing bounds, and generates expert articulation tips and practice drills using Google Gemini AI.

The interface is styled with a premium, warm light-theme **Beige & Brown** minimal aesthetic.

---

## 🚀 Key Features

* 🎙️ **Microphone & Upload Options**: Record speech directly inside the browser or upload clean WAV/MP3 files.
* 📈 **Clarity Scoring**: Receive immediate overall pronunciation clarity feedback powered by acoustic model probabilities.
* ⏱️ **Interactive Phoneme Alignment**: Inspect aligned timing boundaries for every individual sound (phoneme) inside words.
* 🤖 **AI Coaching Reports**: Receive customized speech-therapy feedback, tongue/lip positioning guidance, vocabulary tags, and sentence drill recommendations powered by Gemini.
* 🗃️ **Practice History**: Track historical scores and attempts in a unified dashboard with session recovery options.
* 💾 **Dual-Database Architecture**: Automatically connects to local MongoDB, with an instant local JSON file fallback for lightweight database-free execution.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), Tailwind CSS (Play CDN), Lucide Icons, custom Glassmorphism styles.
* **Backend**: FastAPI, Uvicorn, PyMongo, Librosa, Soundfile, gTTS, g2p-en, OpenAI Whisper.
* **Database**: MongoDB (with local JSON fallback).

---

## 📂 Project Structure

```
├── backend/                  # FastAPI Application
│   ├── database/             # MongoDB connection & history_fallback.json
│   ├── models/               # Pydantic validation schemas
│   ├── routes/               # API endpoints (upload, analysis, history)
│   ├── services/             # Audio, Whisper, G2P, and Gemini services
│   └── uploads/              # Uploaded and normalized audio files
├── frontend/                 # React + Vite Application
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/       # AudioRecorder, ScoreCard, PhonemeVisualizer
│   │   ├── pages/            # Dashboard, History Page
│   │   ├── services/         # API fetch module
│   │   ├── App.jsx           # Nav routing and logo
│   │   └── index.css         # Beige/brown styling variables
│   └── index.html            # Tailwind config & header scripts
├── Dockerfile                # Production Docker configuration for Render
├── requirements.txt          # Backend Python dependencies
└── README.md                 # Project documentation
```

---

## 💻 Local Setup & Execution

### Prerequisites
* Python 3.9+
* Node.js (including NPM)
* MongoDB (optional; falls back to local JSON file if not running)

### 1. Backend Server Setup
1. Open a terminal in the root project folder.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate       # On Windows
   source .venv/bin/activate    # On macOS/Linux
   ```
3. Install the dependencies:
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   copy .env.example .env       # On Windows
   cp .env.example .env         # On macOS/Linux
   ```
5. *(Optional)* Add your `GEMINI_API_KEY` inside `.env` to unlock live Gemini feedback. If left blank, the app runs on a smart local rules-based engine.
6. Run the FastAPI application:
   ```bash
   python backend/main.py
   ```
   The backend API will start at **http://localhost:8000**.

### 2. Frontend Client Setup
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will start at **http://localhost:5173**.

---

## 🌐 Production Deployment

### Backend (Render)
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Select **Docker** as the Runtime. (Render will automatically detect the root `Dockerfile` and install all required system packages, including `ffmpeg`).
4. Under **Advanced**, add your environment variables:
   * `GEMINI_API_KEY`: *Your Google Gemini API Key*
   * `MONGO_URI`: *Your MongoDB Atlas Connection String* (optional)

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and import the repository.
2. Select **`frontend`** as the **Root Directory**.
3. Under **Framework Preset**, select **Vite**.
4. Add the environment variable:
   * **Key**: `VITE_API_URL`
   * **Value**: *Paste the URL of your deployed Render backend* (e.g. `https://clearspeak-api.onrender.com`)
5. Click **Deploy**.
