import React, { useState, useEffect } from "react";
import { History, Calendar, Award, ChevronRight, RefreshCw, Search } from "lucide-react";
import { getHistory } from "../services/api";

export default function HistoryPage({ onSelectRecord, activeAnalysis }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistory();
      setHistoryItems(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Failed to load history items from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeAnalysis]);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 50) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const filteredItems = historyItems.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.transcript.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div className="flex justify-between items-center border-b border-brand-200 pb-4">
        <div>
          <h2 className="font-bold text-2xl text-brand-900 flex items-center gap-2 font-display">
            <History className="text-brand-600" size={24} />
            Practice Session History
          </h2>
          <p className="text-sm text-brand-600 mt-1">
            Browse and review your past recorded attempts and progress.
          </p>
        </div>
        
        <button 
          onClick={loadHistory}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search by words or phrases spoken..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-input pl-12"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <RefreshCw className="animate-spin text-brand-600" size={32} />
          <p className="text-sm text-brand-500">Loading session history...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-red-850 bg-red-50 border border-red-200">
          <p className="font-bold mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-12 text-center text-brand-500">
          <History className="mx-auto mb-4 text-brand-400" size={48} />
          <p className="font-semibold text-lg text-brand-600 mb-1">No session records found</p>
          <p className="text-sm">
            {searchQuery ? "Try searching for a different phrase" : "Complete your first pronunciation analysis to start building history!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectRecord(item)}
              className="glass-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card-interactive fade-in"
            >
              <div className="flex-grow flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-4 text-xs text-brand-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                
                <div>
                  <span className="text-xs uppercase font-extrabold text-brand-500 block mb-0.5">Spoken Transcript</span>
                  <p className="font-semibold text-base text-brand-900 truncate pr-4">
                    "{item.transcript}"
                  </p>
                </div>
              </div>

              {/* Scores & Actions */}
              <div className="flex items-center gap-6 self-stretch md:self-auto justify-between border-t border-brand-200 md:border-none pt-3 md:pt-0">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-brand-500">Clarity</span>
                    <span 
                      className="font-bold text-lg" 
                      style={{ color: getScoreColor(item.overall_score) }}
                    >
                      {item.overall_score}%
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-brand-500">Words</span>
                    <span 
                      className="font-bold text-lg text-brand-700"
                    >
                      {item.words ? item.words.length : 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-brand-600 hover:text-brand-800 font-semibold text-sm">
                  <span>Review Details</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
