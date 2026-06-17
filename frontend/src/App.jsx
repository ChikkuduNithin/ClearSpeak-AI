import React, { useState } from "react";
import { Sparkles, Mic, History, Info } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/History";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'history'
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  const handleSelectRecord = (record) => {
    setActiveAnalysis(record);
    setActiveTab("dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="navbar glass-panel" style={{ borderRadius: "0 0 16px 16px", borderTop: "none" }}>
        <div className="logo-text">
          <Sparkles className="animate-pulse" size={24} />
          <span>Antigravity PronounceAI Coach</span>
        </div>
        
        <nav className="nav-links">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`nav-link border-none ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <Mic size={15} /> Dashboard
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`nav-link border-none ${activeTab === "history" ? "active" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <History size={15} /> History
            </span>
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="app-container flex-grow">
        {activeTab === "dashboard" ? (
          <Dashboard 
            activeAnalysis={activeAnalysis} 
            setActiveAnalysis={setActiveAnalysis}
          />
        ) : (
          <HistoryPage 
            onSelectRecord={handleSelectRecord}
            activeAnalysis={activeAnalysis}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-brand-200 mt-12">
        <p className="text-xs text-brand-500 flex items-center justify-center gap-1.5">
          <Info size={12} />
          Powered by Whisper Speech Recognition + Forced Phoneme Alignment + Gemini Feedback. Developed for academic demonstration.
        </p>
      </footer>
    </div>
  );
}
