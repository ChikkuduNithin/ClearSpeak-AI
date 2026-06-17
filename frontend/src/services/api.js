const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Uploads audio recording or selector file to the backend uploads directory.
 * Returns relative file path {"audio_path": "uploads/..."}.
 */
export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-audio`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Audio upload failed");
  }

  return response.json();
}

/**
 * Initiates the audio-only transcription, timing alignment, and coaching feedback.
 */
export async function analyzeAudio(audioPath) {
  const response = await fetch(`${API_BASE_URL}/analyze-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_path: audioPath
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Pronunciation analysis failed");
  }

  return response.json();
}

/**
 * Fetches all past coaching sessions.
 */
export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/history`);

  if (!response.ok) {
    throw new Error("Failed to load history");
  }

  return response.json();
}

/**
 * Fetches details of a specific coaching session by ID.
 */
export async function getAnalysisDetails(id) {
  const response = await fetch(`${API_BASE_URL}/analysis/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load analysis details");
  }

  return response.json();
}

/**
 * Returns static server URL for playing audio.
 */
export function getAudioUrl(audioPath) {
  if (!audioPath) return "";
  if (audioPath.startsWith("http")) return audioPath;
  return `${API_BASE_URL}/${audioPath}`;
}
