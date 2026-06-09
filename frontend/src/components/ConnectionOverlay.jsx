/**
 * ConnectionOverlay.jsx
 * Full-screen overlay shown during connecting/waiting/disconnected states.
 */
import React from 'react';
import { STATUS } from '../hooks/useWebRTCChess';

const statusConfig = {
  [STATUS.INITIALIZING]: {
    icon: '⚙️',
    color: 'text-chess-muted',
    ring: 'border-chess-muted/40',
    title: 'Initializing...',
  },
  [STATUS.WAITING]: {
    icon: '♟',
    color: 'text-chess-accent',
    ring: 'border-chess-accent/60',
    title: 'Waiting for Opponent',
  },
  [STATUS.CONNECTING]: {
    icon: '⚡',
    color: 'text-chess-gold',
    ring: 'border-chess-gold/60',
    title: 'Connecting to Peer',
  },
  [STATUS.DISCONNECTED]: {
    icon: '⚠️',
    color: 'text-chess-red',
    ring: 'border-chess-red/60',
    title: 'Disconnected',
  },
  [STATUS.ERROR]: {
    icon: '✕',
    color: 'text-chess-red',
    ring: 'border-chess-red/60',
    title: 'Connection Error',
  },
};

const SHOW_ON = [STATUS.INITIALIZING, STATUS.WAITING, STATUS.CONNECTING, STATUS.DISCONNECTED, STATUS.ERROR];

export default function ConnectionOverlay({
  status,
  statusMessage,
  errorMessage,
  roomCode,
  onDisconnect,
}) {
  if (!SHOW_ON.includes(status)) return null;

  const cfg = statusConfig[status] || statusConfig[STATUS.INITIALIZING];
  const isSpinning = [STATUS.INITIALIZING, STATUS.WAITING, STATUS.CONNECTING].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-chess-darker/90 backdrop-blur-md animate-fade-in">
      {/* Floating decorative pieces */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {['♔', '♕', '♖', '♗', '♘', '♙'].map((piece, i) => (
          <span
            key={i}
            className="float-piece absolute text-7xl md:text-9xl text-white"
            style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
          >
            {piece}
          </span>
        ))}
      </div>

      {/* Card */}
      <div className="relative glass-panel p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-slide-up">
        {/* Spinner / Icon */}
        <div className="relative">
          {isSpinning && (
            <svg
              className={`connecting-ring w-24 h-24 ${cfg.color}`}
              viewBox="0 0 96 96"
              fill="none"
            >
              <circle
                cx="48" cy="48" r="42"
                stroke="currentColor"
                strokeWidth="4"
                strokeOpacity="0.15"
              />
              <circle
                cx="48" cy="48" r="42"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="150"
                strokeDashoffset="100"
              />
            </svg>
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center text-4xl ${
              !isSpinning ? 'relative' : ''
            }`}
          >
            {cfg.icon}
          </span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${cfg.color}`}>{cfg.title}</h2>
          {statusMessage && (
            <p className="mt-2 text-chess-muted text-sm">{statusMessage}</p>
          )}
          {errorMessage && (
            <p className="mt-2 text-chess-red text-sm">{errorMessage}</p>
          )}
        </div>

        {/* Room code display (while waiting) */}
        {status === STATUS.WAITING && roomCode && (
          <div className="w-full">
            <p className="text-chess-muted text-xs text-center mb-2 uppercase tracking-widest">
              Share this with your opponent
            </p>
            {roomCode.length <= 8 ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center py-3 px-4 rounded-xl bg-chess-darker border border-chess-accent/40 font-mono text-2xl font-bold tracking-widest text-chess-accent glow-accent">
                  {roomCode}
                </div>
                <button
                  id="copy-room-code-btn"
                  className="btn-ghost py-3 px-3"
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="py-2 px-3 rounded-xl bg-chess-darker border border-chess-accent/40 font-mono text-xs text-chess-accent break-all leading-relaxed text-center">
                  {roomCode}
                </div>
                <button
                  id="copy-room-code-btn"
                  className="btn-primary w-full py-2.5 text-sm"
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Peer ID
                </button>
              </div>
            )}
            <div className="mt-3 flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-chess-accent/60"
                  style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error / Disconnected actions */}
        {(status === STATUS.ERROR || status === STATUS.DISCONNECTED) && (
          <button
            id="overlay-back-btn"
            className="btn-ghost w-full"
            onClick={onDisconnect}
          >
            ← Back to Lobby
          </button>
        )}
      </div>
    </div>
  );
}
