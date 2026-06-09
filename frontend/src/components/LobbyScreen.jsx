/**
 * LobbyScreen.jsx
 * Beautiful landing screen where players create or join rooms.
 */
import React, { useState } from 'react';

const FEATURES = [
  { icon: '⚡', label: 'P2P Real-Time', desc: 'Zero-latency moves via WebRTC' },
  { icon: '🎙️', label: 'Voice Chat', desc: 'Talk with your opponent live' },
  { icon: '💬', label: 'Text Chat', desc: 'In-game messaging sidebar' },
  { icon: '♟', label: 'Full Chess Rules', desc: 'Powered by chess.js engine' },
];

export default function LobbyScreen({ onCreateRoom, onJoinRoom, isLoading, errorMessage }) {
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      onJoinRoom(joinCode.trim());
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 relative overflow-auto">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-chess-darker via-chess-dark to-[#0a0a1a] pointer-events-none" />
      <div className="fixed inset-0 noise-bg pointer-events-none" />

      {/* Floating chess pieces */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        {['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛'].map((piece, i) => (
          <span
            key={i}
            className="float-piece absolute text-white font-bold"
            style={{
              fontSize: `${60 + (i % 3) * 30}px`,
              left: `${(i * 13) % 90}%`,
              top: `${(i * 17 + 5) % 80}%`,
            }}
          >
            {piece}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center gap-8">

        {/* Hero */}
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-chess-accent/10 border border-chess-accent/30 text-chess-accent text-xs font-semibold mb-4 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-chess-green animate-pulse" />
            WebRTC Powered
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gradient leading-none mb-4">
            ChessMate
          </h1>
          <p className="text-chess-muted text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Real-time multiplayer chess with P2P voice chat. No account needed — just share a code.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-chess-panel/80 border border-chess-border hover:border-chess-accent/40 transition-colors duration-200"
            >
              <span className="text-xl">{f.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">{f.label}</div>
                <div className="text-xs text-chess-muted">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="glass-panel w-full max-w-md p-1 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden m-1 bg-chess-darker">
            <button
              id="tab-create"
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 rounded-xl ${
                activeTab === 'create'
                  ? 'bg-chess-accent text-white shadow-lg'
                  : 'text-chess-muted hover:text-white'
              }`}
              onClick={() => setActiveTab('create')}
            >
              ✦ Create Room
            </button>
            <button
              id="tab-join"
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 rounded-xl ${
                activeTab === 'join'
                  ? 'bg-chess-accent text-white shadow-lg'
                  : 'text-chess-muted hover:text-white'
              }`}
              onClick={() => setActiveTab('join')}
            >
              → Join Room
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'create' ? (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="text-center">
                  <div className="text-4xl mb-2">♔</div>
                  <h2 className="text-xl font-bold text-white">Host a Game</h2>
                  <p className="text-chess-muted text-sm mt-1">
                    You'll play as <span className="text-white font-semibold">White</span> and get a room code to share.
                  </p>
                </div>
                <button
                  id="create-room-btn"
                  className={`btn-primary w-full py-4 text-base ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
                  onClick={onCreateRoom}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>✦ Create New Room</>
                  )}
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-5 animate-fade-in" onSubmit={handleJoin}>
                <div className="text-center">
                  <div className="text-4xl mb-2">♟</div>
                  <h2 className="text-xl font-bold text-white">Join a Game</h2>
                  <p className="text-chess-muted text-sm mt-1">
                    You'll play as <span className="text-white font-semibold">Black</span>. Enter the room code.
                  </p>
                </div>
                <div>
                  <input
                    id="join-code-input"
                    type="text"
                    className="input-field text-center font-bold uppercase py-4 tracking-widest text-lg"
                    placeholder="Room code or Peer ID"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.trim())}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <p className="text-chess-muted/60 text-xs text-center mt-2">6-char code (local) or full Peer ID (GitHub Pages)</p>
                </div>
                <button
                  id="join-room-btn"
                  type="submit"
                  className={`btn-primary w-full py-4 text-base ${
                    isLoading || joinCode.length !== 6 ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  disabled={isLoading || joinCode.length < 6}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Joining...
                    </>
                  ) : (
                    <>→ Join Room</>
                  )}
                </button>
              </form>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-chess-red/10 border border-chess-red/30 text-chess-red text-sm text-center animate-fade-in">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-chess-muted/40 text-xs text-center animate-fade-in">
          Powered by WebRTC • No server stores your game data • Peer-to-peer encryption
        </p>
      </div>
    </div>
  );
}
