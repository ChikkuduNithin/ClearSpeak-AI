import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, RotateCcw, Volume2 } from "lucide-react";

export default function AudioRecorder({ onAudioReady, onReset, isProcessing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      stopRecordingResources();
    };
  }, []);

  const startTimer = () => {
    setRecordTime(0);
    timerRef.current = setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Could not access microphone. Please check site permissions.");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    stopTimer();
    setIsRecording(false);
    stopRecordingResources();

    const chunks = audioChunksRef.current;
    if (chunks.length === 0) return;

    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    const flatBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (let chunk of chunks) {
      flatBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
    const wavBlob = bufferToWav(flatBuffer, sampleRate);
    const wavUrl = URL.createObjectURL(wavBlob);

    setAudioBlob(wavBlob);
    setAudioUrl(wavUrl);

    const audioFile = new File([wavBlob], "recording.wav", { type: "audio/wav" });
    onAudioReady(audioFile);
  };

  const stopRecordingResources = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const resetRecording = () => {
    stopRecordingResources();
    stopTimer();
    setIsRecording(false);
    setRecordTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    onReset();
  };

  // Inline WAV Encoder
  const bufferToWav = (buffer, sampleRate) => {
    const bufferLength = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + bufferLength * 2);
    const view = new DataView(arrayBuffer);

    const writeUTFBytes = (dataview, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        dataview.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeUTFBytes(view, 0, "RIFF");
    view.setUint32(4, 36 + bufferLength * 2, true);
    writeUTFBytes(view, 8, "WAVE");
    writeUTFBytes(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, "data");
    view.setUint32(40, bufferLength * 2, true);

    let offset = 44;
    for (let i = 0; i < bufferLength; i++) {
      let sample = Math.max(-1, Math.min(1, buffer[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  };

  return (
    <div className="recorder-container">
      {!audioBlob ? (
        <>
          <div className="flex flex-col items-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`record-btn ${isRecording ? "recording" : ""}`}
              disabled={isProcessing}
              title={isRecording ? "Stop Recording" : "Start Recording"}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {isRecording ? <Square size={28} /> : <Mic size={28} />}
            </button>
            <p className="mt-4 font-semibold text-sm tracking-wide" style={{ color: isRecording ? "#c62828" : "#7e5a3c" }}>
              {isRecording ? `Recording... ${formatTime(recordTime)}` : "Click to record your speech"}
            </p>
          </div>
          
          {isRecording && (
            <div className="waveform-anim">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center w-full max-w-sm fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="text-brand-600" size={20} />
            <span className="text-sm font-medium text-brand-900">Preview Recording</span>
          </div>
          
          <audio src={audioUrl} controls className="w-full mb-6" />
          
          <div className="flex gap-4">
            <button
              onClick={resetRecording}
              className="btn-secondary"
              disabled={isProcessing}
            >
              <RotateCcw size={16} /> Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
