import React from "react";

export default function ScoreCard({ score, label, subtitle }) {
  const getColorClasses = (val) => {
    if (val >= 80) return { stroke: "#2e7d32", shadow: "rgba(46, 125, 50, 0.15)" };
    if (val >= 50) return { stroke: "#c25e00", shadow: "rgba(216, 67, 21, 0.15)" };
    return { stroke: "#c62828", shadow: "rgba(198, 40, 40, 0.15)" };
  };

  const colors = getColorClasses(score);
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel p-6 flex flex-col items-center text-center fade-in">
      <div 
        className="score-circle mb-4"
        style={{
          filter: `drop-shadow(0 4px 12px ${colors.shadow})`
        }}
      >
        <svg className="score-svg" viewBox="0 0 120 120">
          <circle
            className="score-bg"
            cx="60"
            cy="60"
            r={radius}
          />
          <circle
            className="score-progress"
            cx="60"
            cy="60"
            r={radius}
            stroke={colors.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="score-text">
          <span className="score-num" style={{ color: colors.stroke }}>
            {score}
          </span>
          <span className="score-label" style={{ fontSize: "0.6rem" }}>
            Score
          </span>
        </div>
      </div>
      
      <h3 className="font-bold text-lg text-brand-900 tracking-wide">{label}</h3>
      {subtitle && <p className="text-xs text-brand-500 mt-1">{subtitle}</p>}
    </div>
  );
}
