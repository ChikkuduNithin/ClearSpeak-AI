import React, { useState } from "react";
import { Loader2, Mic, Upload, Sparkles, AlertCircle, RefreshCw, Volume2 } from "lucide-react";
import AudioRecorder from "../components/AudioRecorder";
import AudioUpload from "../components/AudioUpload";
import ScoreCard from "../components/ScoreCard";
import PhonemeVisualizer from "../components/PhonemeVisualizer";
import { uploadAudio, analyzeAudio, getAudioUrl } from "../services/api";

export default function Dashboard({ activeAnalysis, setActiveAnalysis }) {
  const [audioFile, setAudioFile] = useState(null);
  const [inputMode, setInputMode] = useState("record"); // 'record' | 'upload'
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);

  const handleAudioReady = (file) => {
    setAudioFile(file);
    setError(null);
  };

  const handleAudioReset = () => {
    setAudioFile(null);
    setError(null);
  };

  const runAnalysis = async () => {
    if (!audioFile) {
      setError("Please record speech or upload an audio file first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSelectedWordIndex(null);

    try {
      // 1. Upload audio file to backend
      console.log("Uploading audio file...");
      const uploadResult = await uploadAudio(audioFile);
      const relativeAudioPath = uploadResult.audio_path;

      // 2. Perform pronunciation analysis
      console.log("Analyzing audio path:", relativeAudioPath);
      const analysisResult = await analyzeAudio(relativeAudioPath);
      
      // Save result in parent state
      setActiveAnalysis(analysisResult);
      if (analysisResult.words && analysisResult.words.length > 0) {
        setSelectedWordIndex(0); // Select first word by default
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during speech recognition.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setAudioFile(null);
    setActiveAnalysis(null);
    setError(null);
    setSelectedWordIndex(null);
  };

  const getWordConfidenceClass = (conf) => {
    if (conf >= 80) return "word-high";
    if (conf >= 50) return "word-medium";
    return "word-low";
  };

  const getConfidenceLevel = (score) => {
    if (score >= 85) return { text: "Excellent Pronunciation Clarity", color: "#2e7d32", barColor: "linear-gradient(90deg, #C68B59 0%, #2e7d32 100%)" };
    if (score >= 65) return { text: "Good Pronunciation Confidence", color: "#8c6239", barColor: "linear-gradient(90deg, #E8DCC4 0%, #8c6239 100%)" };
    if (score >= 45) return { text: "Fair Clarity - Minor Articulation Issues", color: "#c25e00", barColor: "linear-gradient(90deg, #E8DCC4 0%, #c25e00 100%)" };
    return { text: "Acoustic Variances - Coaching Recommended", color: "#c62828", barColor: "linear-gradient(90deg, #c25e00 0%, #c62828 100%)" };
  };

  const confidence = activeAnalysis ? getConfidenceLevel(activeAnalysis.overall_score) : null;
  const selectedWord = (activeAnalysis && selectedWordIndex !== null) ? activeAnalysis.words[selectedWordIndex] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Input Section */}
      {!activeAnalysis && (
        <div className="glass-panel p-6 w-full flex flex-col gap-6 fade-in">
          <div>
            <h2 className="font-bold text-xl text-brand-900 mb-2 font-display">
              Pronunciation Coaching Input
            </h2>
            <p className="text-sm text-brand-600">
              Speak naturally into your microphone or upload a clean voice audio file. We will transcribe it, align phoneme timings, and flag pronunciation confidence automatically.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex border-b border-brand-200">
              <button
                onClick={() => { setInputMode("record"); handleAudioReset(); }}
                className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  inputMode === "record" 
                    ? "border-brand-600 text-brand-700" 
                    : "border-transparent text-brand-400 hover:text-brand-600"
                }`}
                disabled={isProcessing}
              >
                <Mic size={16} /> Record from Microphone
              </button>
              <button
                onClick={() => { setInputMode("upload"); handleAudioReset(); }}
                className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  inputMode === "upload" 
                    ? "border-brand-600 text-brand-700" 
                    : "border-transparent text-brand-400 hover:text-brand-600"
                }`}
                disabled={isProcessing}
              >
                <Upload size={16} /> Upload Audio File
              </button>
            </div>

            <div className="bg-brand-100/20 rounded-12 min-h-[160px] flex items-center justify-center">
              {inputMode === "record" ? (
                <AudioRecorder 
                  onAudioReady={handleAudioReady} 
                  onReset={handleAudioReset}
                  isProcessing={isProcessing}
                />
              ) : (
                <AudioUpload 
                  onAudioReady={handleAudioReady} 
                  onReset={handleAudioReset}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-800 bg-red-50 border border-red-200 p-4 rounded-12">
              <AlertCircle size={18} />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button
              onClick={runAnalysis}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
              disabled={isProcessing || !audioFile}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Transcribing & Aligning...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Spoken Audio
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {activeAnalysis && (
        <div className="flex flex-col gap-6 fade-in">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-200 pb-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-600">
                Evaluation Complete
              </span>
              <h2 className="font-bold text-2xl text-brand-900 font-display">
                AI Pronunciation Coaching Report
              </h2>
            </div>
            <button onClick={resetAll} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={16} /> Coach New Audio
            </button>
          </div>

          {/* Core Score & Confidence Meter row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex justify-center">
              <ScoreCard 
                score={activeAnalysis.overall_score} 
                label="Overall Clarity" 
                subtitle="Average spoken confidence"
              />
            </div>
            
            <div className="md:col-span-2 glass-panel p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-brand-700 uppercase tracking-wide">
                    Pronunciation Confidence Meter
                  </h3>
                  <span className="text-sm font-bold" style={{ color: confidence.color }}>
                    {confidence.text} ({activeAnalysis.overall_score}%)
                  </span>
                </div>
                
                <div className="w-full bg-brand-100/40 h-4 rounded-full overflow-hidden border border-brand-200 p-0.5">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${activeAnalysis.overall_score}%`,
                      background: confidence.barColor
                    }}
                  />
                </div>
                <p className="text-xs text-brand-500 mt-2">
                  Confidence scores indicate standard articulation consistency generated by the Whisper speech recognition model.
                </p>
              </div>

              <div className="border-t border-brand-200 pt-4 mt-4 flex flex-col gap-2">
                <span className="text-xs font-semibold text-brand-500 uppercase">Spoken Audio Playback</span>
                <div className="audio-player-wrapper">
                  <audio src={getAudioUrl(activeAnalysis.audio_path)} controls />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Transcript Panel */}
          <div className="glass-panel p-6 w-full">
            <h3 className="font-bold text-lg text-brand-900 mb-2">Spoken Transcript</h3>
            <p className="text-xs text-brand-500 mb-4">
              Click on any word below to view its specific phoneme forced time-alignment. Words are highlighted based on clarity.
            </p>
            
            <div className="interactive-transcript">
              {activeAnalysis.words.map((w, idx) => (
                <span
                  key={idx}
                  onClick={() => setSelectedWordIndex(idx)}
                  className={`word-node ${getWordConfidenceClass(w.confidence)} ${
                    selectedWordIndex === idx ? "selected" : ""
                  }`}
                  title={`Word: ${w.word} | Confidence: ${w.confidence}%`}
                >
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Phoneme Forced Alignment Timeline */}
          <PhonemeVisualizer selectedWord={selectedWord} />

          {/* AI Coaching Tips & Guidance */}
          <div className="glass-panel p-6 w-full flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-brand-200 pb-3">
              <Sparkles className="text-brand-600" size={22} />
              <h3 className="font-bold text-lg text-brand-900">
                AI Coach Assessment & Recommendations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="font-bold text-sm text-brand-700 uppercase tracking-wide mb-2">
                    Speech Assessment
                  </h4>
                  <p className="text-sm leading-relaxed text-brand-800" style={{ color: "#4e3622" }}>
                    {activeAnalysis.feedback.explanation}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-brand-700 uppercase tracking-wide mb-2">
                    Articulation Guide
                  </h4>
                  <p className="text-sm leading-relaxed bg-brand-100/30 border border-brand-200/60 p-4 rounded-12" style={{ color: "#4e3622" }}>
                    {activeAnalysis.feedback.tips}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="font-bold text-sm text-brand-700 uppercase tracking-wide mb-2">
                    Practice Vocabulary
                  </h4>
                  <div className="practice-tags">
                    {activeAnalysis.feedback.practice_words.map((word, index) => (
                      <span key={index} className="word-tag">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-brand-700 uppercase tracking-wide mb-2">
                    Coaching Drills
                  </h4>
                  <ul className="flex flex-col gap-2 list-none">
                    {activeAnalysis.feedback.exercises.map((exercise, index) => (
                      <li key={index} className="text-sm flex items-start gap-2" style={{ color: "#4e3622" }}>
                        <span className="text-brand-500 font-bold">•</span>
                        <span>{exercise}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
