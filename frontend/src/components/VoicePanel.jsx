/**
 * VoicePanel.jsx
 * Mic toggle button with animated volume bars and remote audio element.
 */
import React, { useEffect, useRef } from 'react';

function MicIcon({ muted }) {
  if (muted) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function VolumeBars({ volume, isMuted }) {
  // volume: 0-100
  const bars = 5;
  const heights = [30, 50, 80, 50, 30]; // relative heights

  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i / bars) * 100;
        const active = !isMuted && volume > threshold;
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              active ? 'bg-chess-green' : 'bg-chess-border'
            }`}
            style={{ height: `${active ? heights[i] : 30}%` }}
          />
        );
      })}
    </div>
  );
}

export default function VoicePanel({
  isMuted,
  micVolume,
  voiceActive,
  remoteStream,
  remoteAudioRef,
  onToggleMute,
  onStartVoice,
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 glass-panel">
      {/* Remote audio (hidden) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="hidden"
        id="remote-audio"
      />

      {/* Voice label */}
      <span className="text-xs font-semibold text-chess-muted uppercase tracking-widest">
        Voice
      </span>

      {/* Volume bars */}
      <VolumeBars volume={micVolume} isMuted={isMuted} />

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 flex-1">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            voiceActive ? 'bg-chess-green animate-pulse' : 'bg-chess-muted'
          }`}
        />
        <span className="text-xs text-chess-muted">
          {!voiceActive ? 'No voice' : isMuted ? 'Muted' : 'Live'}
        </span>
      </div>

      {/* Start voice / Mute toggle */}
      {!voiceActive ? (
        <button
          id="start-voice-btn"
          className="btn-ghost py-2 px-3 text-xs gap-1.5"
          onClick={onStartVoice}
          title="Enable voice chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Enable
        </button>
      ) : (
        <button
          id="mute-toggle-btn"
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
            isMuted
              ? 'bg-chess-red/20 border border-chess-red/40 text-chess-red hover:bg-chess-red/30'
              : 'bg-chess-green/20 border border-chess-green/40 text-chess-green hover:bg-chess-green/30'
          }`}
          onClick={onToggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <MicIcon muted={isMuted} />
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      )}
    </div>
  );
}
