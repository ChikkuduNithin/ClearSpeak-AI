import React from "react";
import { Clock, ShieldAlert } from "lucide-react";

export default function PhonemeVisualizer({ selectedWord }) {
  if (!selectedWord) {
    return (
      <div className="glass-panel p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[150px] fade-in">
        <Clock className="text-gray-600 mb-2" size={32} />
        <p className="font-semibold text-sm">Phonetic Forced Alignment Timeline</p>
        <p className="text-xs text-gray-600 mt-1">
          Click any word in the transcript above to inspect its aligned phoneme timestamps.
        </p>
      </div>
    );
  }

  const { word, start_time, end_time, confidence, phonemes } = selectedWord;
  const duration = Math.max(0.01, end_time - start_time);

  const getConfidenceClass = (score) => {
    if (score >= 80) return "block-high";
    if (score >= 50) return "block-medium";
    return "block-low";
  };

  const getTextColorClass = (score) => {
    if (score >= 80) return "text-emerald-700";
    if (score >= 50) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="glass-panel p-6 w-full fade-in">
      <div className="flex justify-between items-start border-b border-brand-200 pb-3 mb-4">
        <div>
          <span className="text-xs uppercase font-extrabold text-brand-600 tracking-wider">
            Forced Alignment details
          </span>
          <h3 className="font-bold text-xl text-brand-900 font-display">
            Word: "{word.toUpperCase()}"
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-brand-500 block">Clarity</span>
          <span className={`font-bold text-lg ${getTextColorClass(confidence)}`}>
            {confidence}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Word Timeline Stats */}
        <div className="flex gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Time Bounds: {start_time.toFixed(2)}s – {end_time.toFixed(2)}s</span>
          </div>
          <div>
            <span>Duration: {duration.toFixed(2)}s</span>
          </div>
        </div>

        {/* Aligned Track */}
        <div className="timeline-container">
          <div className="timeline-row">
            <div className="timeline-label">Phonemes</div>
            <div className="timeline-track relative">
              {phonemes.map((ph, idx) => {
                const left = ((ph.start_time - start_time) / duration) * 100;
                const width = ((ph.end_time - ph.start_time) / duration) * 100;
                
                return (
                  <div
                    key={idx}
                    className={`alignment-block ${getConfidenceClass(ph.confidence)}`}
                    style={{
                      left: `${Math.max(0, Math.min(99, left))}%`,
                      width: `${Math.max(1, Math.min(100, width))}%`
                    }}
                    title={`Phoneme: ${ph.phoneme} | Timing: ${ph.start_time}s - ${ph.end_time}s | Confidence: ${ph.confidence}%`}
                  >
                    {ph.phoneme}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-brand-500 border-t border-brand-200 pt-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-600/80"></div>
            <span>High Confidence (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-600/80"></div>
            <span>Medium Confidence (50-79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-650/80"></div>
            <span>Low Confidence (&lt;50%)</span>
          </div>
        </div>

        {/* Granular details list */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {phonemes.map((ph, idx) => (
            <div key={idx} className="bg-brand-100/20 border border-brand-200/60 p-3 rounded-8 flex flex-col gap-1">
              <span className="text-xs text-brand-500 uppercase font-extrabold">Sound {idx + 1}</span>
              <span className="font-bold text-lg text-brand-700 font-display">{ph.phoneme}</span>
              <span className="text-2xs text-brand-600">
                {ph.start_time.toFixed(2)}s – {ph.end_time.toFixed(2)}s
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
