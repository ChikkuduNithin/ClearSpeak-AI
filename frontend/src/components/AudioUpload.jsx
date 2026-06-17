import React, { useState, useRef } from "react";
import { Upload, FileAudio, X, RotateCcw } from "lucide-react";

export default function AudioUpload({ onAudioReady, onReset, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file) => {
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"];
    const ext = file.name.split(".").pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && ext !== "wav" && ext !== "mp3") {
      alert("Invalid file type. Please upload a WAV or MP3 file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    onAudioReady(file);
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setAudioUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onReset();
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 min-h-[200px]">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".wav,.mp3,audio/wav,audio/mpeg"
        onChange={handleChange}
        disabled={isProcessing}
      />

      {!selectedFile ? (
        <div
          className={`w-full max-w-md border-2 border-dashed rounded-16 p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive 
              ? "border-brand-600 bg-brand-50" 
              : "border-brand-300 hover:border-brand-500 bg-brand-100/20"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          style={{ borderRadius: "16px" }}
        >
          <Upload className="text-brand-600 mb-4" size={40} />
          <p className="font-semibold text-sm mb-2 text-center text-brand-900">
            Drag & drop your audio file here, or click to browse
          </p>
          <p className="text-xs text-brand-500 text-center">
            Supports WAV, MP3 (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm glass-panel p-6 flex flex-col items-center relative fade-in">
          <button
            onClick={clearSelection}
            className="absolute top-3 right-3 text-brand-500 hover:text-brand-700 transition-colors"
            title="Remove file"
            disabled={isProcessing}
          >
            <X size={18} />
          </button>

          <FileAudio className="text-brand-600 mb-2" size={36} />
          <p className="font-semibold text-sm truncate max-w-[200px] mb-1 text-brand-900" title={selectedFile.name}>
            {selectedFile.name}
          </p>
          <p className="text-xs text-brand-500 mb-4">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>

          <audio src={audioUrl} controls className="w-full mb-4" />

          <button
            onClick={clearSelection}
            className="btn-secondary text-xs py-2 px-4"
            disabled={isProcessing}
          >
            <RotateCcw size={12} /> Choose another
          </button>
        </div>
      )}
    </div>
  );
}
