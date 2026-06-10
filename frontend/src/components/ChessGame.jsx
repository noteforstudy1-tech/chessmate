/**
 * ChessGame.jsx
 * Main game layout: board center, tabbed sidebar (chat + moves), player cards.
 * Fixes: proper rematch (no disconnect), board sizing, reactive move history.
 */
import React, { useState } from 'react';
import ChessBoard from './ChessBoard';
import ChatSidebar from './ChatSidebar';
import PlayerCard from './PlayerCard';
import VoicePanel from './VoicePanel';
import MoveHistoryPanel from './MoveHistoryPanel';
import { STATUS } from '../hooks/useWebRTCChess';

// ── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      id="theme-toggle-btn"
      className="btn-ghost py-2 px-3"
      onClick={onToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m8.485-8.485h-1M4.515 12h-1m14.142-5.657-.707.707M6.05 17.95l-.707.707M17.95 17.95l-.707-.707M6.05 6.05l-.707-.707M12 5a7 7 0 100 14A7 7 0 0012 5z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

// ── Game Over Modal ───────────────────────────────────────────────────────────
function GameOverModal({ gameOver, playerRole, onRematch, onLeave }) {
  if (!gameOver) return null;

  const isWinner = gameOver.result === playerRole;
  const isDraw = gameOver.result === 'draw';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in"
      style={{ backgroundColor: 'rgba(8,8,15,0.80)' }}
    >
      <div className="glass-panel p-8 max-w-sm w-full mx-4 text-center animate-slide-up">
        <div className="text-6xl mb-4">
          {isDraw ? '🤝' : isWinner ? '🏆' : '💀'}
        </div>
        <h2 className={`text-3xl font-bold mb-2 ${
          isDraw ? 'text-chess-gold' : isWinner ? 'text-chess-green' : 'text-chess-red'
        }`}>
          {isDraw ? 'Draw!' : isWinner ? 'You Win!' : 'You Lose'}
        </h2>
        <p className="text-chess-muted text-sm mb-6 capitalize">
          by {gameOver.reason}
        </p>
        <div className="flex gap-3">
          <button
            id="rematch-btn"
            className="btn-primary flex-1"
            onClick={onRematch}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rematch
          </button>
          <button id="leave-game-btn" className="btn-ghost flex-1" onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChessGame({
  fen,
  game,
  playerRole,
  onMove,
  gameOver,
  myPeerId,
  remotePeerId,
  whiteTime,
  blackTime,
  activeColor,
  chatMessages,
  onSendChat,
  isMuted,
  micVolume,
  voiceActive,
  remoteAudioRef,
  onToggleMute,
  onStartVoice,
  connectionStatus,
  roomCode,
  onResign,
  onRematch,
  onDisconnect,
  isDark,
  onToggleTheme,
}) {
  // Sidebar always visible on xl+; toggle-able on smaller screens
  const [showSidebar, setShowSidebar] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280
  );
  const [activePanel, setActivePanel] = useState('chat'); // 'chat' | 'moves'

  const isConnected = connectionStatus === STATUS.CONNECTED;
  const isDisabled = !isConnected || !!gameOver;

  const opponentRole = playerRole === 'white' ? 'black' : 'white';
  const opponentTime = opponentRole === 'white' ? whiteTime : blackTime;
  const myTime = playerRole === 'white' ? whiteTime : blackTime;

  return (
    <div
      className="flex h-full w-full relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* ── Left: Board + Player Cards ─────────────────────────────────── */}
      {/*
        CRITICAL LAYOUT RULES:
        - No overflow-y on this column; everything must fit in the viewport
        - Board uses flex-1 + min-h-0 so it shrinks to available space
        - Board inner div uses maxHeight:'100%' + aspect-ratio to stay square
      */}
      <div className="flex flex-col flex-1 min-w-0 h-full p-2 sm:p-3 gap-2 overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 glass-panel px-3 py-1.5">
            <span className="text-chess-muted text-xs uppercase tracking-widest">Room</span>
            <span className="font-mono text-sm font-bold text-chess-accent">{roomCode}</span>
          </div>

          <div className="flex items-center gap-1.5 glass-panel px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-chess-green animate-pulse' : 'bg-chess-red'}`} />
            <span className="text-xs text-chess-muted">{isConnected ? 'Connected' : 'Offline'}</span>
          </div>

          <div className="flex-1" />

          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

          {!gameOver && isConnected && (
            <button id="resign-btn" className="btn-danger py-1.5 px-3 text-xs" onClick={onResign}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Resign
            </button>
          )}

          <button id="leave-btn" className="btn-ghost py-1.5 px-3" onClick={onDisconnect} title="Leave game">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          <button
            id="toggle-sidebar-btn"
            className="btn-ghost py-1.5 px-3 xl:hidden"
            onClick={() => setShowSidebar(s => !s)}
            title="Toggle panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* ── Opponent card ── */}
        <PlayerCard
          peerId={remotePeerId}
          role={opponentRole}
          timeMs={opponentTime}
          isActive={activeColor === opponentRole && isConnected && !gameOver}
          isYou={false}
          gameOver={gameOver}
        />

        {/* ── Chess Board ── */}
        {/*
          The board must be square and fit in the remaining vertical space.
          Strategy: cap the width with min(100%, calc(100vh - Xpx)) where X
          accounts for topbar + both player cards + voice panel + padding.
          At 730px viewport: 730 - 310 = 420px board. Width is always >> height
          on desktop, so the height constraint drives the square size.
        */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden py-1">
          <div
            className="aspect-square"
            style={{ width: 'min(100%, calc(100vh - 310px))' }}
          >
            <ChessBoard
              fen={fen}
              game={game}
              playerRole={playerRole}
              onMove={onMove}
              disabled={isDisabled}
              isDark={isDark}
            />
          </div>
        </div>

        {/* ── My card + Voice ── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <PlayerCard
            peerId={myPeerId}
            role={playerRole}
            timeMs={myTime}
            isActive={activeColor === playerRole && isConnected && !gameOver}
            isYou={true}
            gameOver={gameOver}
          />
          <VoicePanel
            isMuted={isMuted}
            micVolume={micVolume}
            voiceActive={voiceActive}
            remoteAudioRef={remoteAudioRef}
            onToggleMute={onToggleMute}
            onStartVoice={onStartVoice}
          />
        </div>
      </div>

      {/* ── Right: Tabbed Sidebar ─────────────────────────────────────── */}
      <div
        className={`
          fixed xl:static inset-y-0 right-0 z-30
          w-80 xl:w-72 2xl:w-80
          flex flex-col
          p-3 xl:pl-0
          transition-transform duration-300
          shadow-2xl xl:shadow-none
          ${showSidebar ? 'translate-x-0' : 'translate-x-full xl:translate-x-0 xl:hidden'}
        `}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Mobile close button */}
        <button
          className="self-end btn-ghost p-2 xl:hidden mb-1"
          onClick={() => setShowSidebar(false)}
          title="Close"
        >✕</button>

        {/* Tab switcher */}
        <div className="glass-panel flex p-1 gap-1 flex-shrink-0 mb-2">
          <button
            id="tab-chat-btn"
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activePanel === 'chat' ? 'bg-chess-accent text-white shadow-md' : ''
            }`}
            style={activePanel !== 'chat' ? { color: 'var(--text-muted)' } : {}}
            onClick={() => setActivePanel('chat')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </button>
          <button
            id="tab-moves-btn"
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activePanel === 'moves' ? 'bg-chess-accent text-white shadow-md' : ''
            }`}
            style={activePanel !== 'moves' ? { color: 'var(--text-muted)' } : {}}
            onClick={() => setActivePanel('moves')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Moves
          </button>
        </div>

        {/* Panel content — takes remaining sidebar height */}
        <div className="flex-1 min-h-0">
          {activePanel === 'chat' ? (
            <ChatSidebar
              messages={chatMessages}
              onSend={onSendChat}
              disabled={!isConnected}
            />
          ) : (
            <MoveHistoryPanel
              game={game}
              fen={fen}
            />
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-20 xl:hidden animate-fade-in backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Game over modal */}
      <GameOverModal
        gameOver={gameOver}
        playerRole={playerRole}
        onRematch={onRematch}
        onLeave={onDisconnect}
      />
    </div>
  );
}
