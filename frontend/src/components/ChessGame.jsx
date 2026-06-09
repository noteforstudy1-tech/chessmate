/**
 * ChessGame.jsx
 * Main game layout: board center, chat sidebar, player cards, voice panel.
 */
import React, { useState } from 'react';
import ChessBoard from './ChessBoard';
import ChatSidebar from './ChatSidebar';
import PlayerCard from './PlayerCard';
import VoicePanel from './VoicePanel';
import { STATUS } from '../hooks/useWebRTCChess';

function GameOverModal({ gameOver, playerRole, onPlayAgain, onLeave }) {
  if (!gameOver) return null;

  const isWinner = gameOver.result === playerRole;
  const isDraw = gameOver.result === 'draw';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-chess-darker/80 backdrop-blur-sm animate-fade-in">
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
          <button id="leave-game-btn" className="btn-ghost flex-1" onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChessGame({
  // Board
  fen,
  game,
  playerRole,
  onMove,
  gameOver,

  // Players
  myPeerId,
  remotePeerId,
  whiteTime,
  blackTime,
  activeColor,

  // Chat
  chatMessages,
  onSendChat,

  // Voice
  isMuted,
  micVolume,
  voiceActive,
  remoteAudioRef,
  onToggleMute,
  onStartVoice,

  // Meta
  connectionStatus,
  roomCode,
  onResign,
  onDisconnect,
}) {
  const [showSidebar, setShowSidebar] = useState(true);
  const isConnected = connectionStatus === STATUS.CONNECTED;
  const isDisabled = !isConnected || !!gameOver;

  const opponentRole = playerRole === 'white' ? 'black' : 'white';
  const opponentTime = opponentRole === 'white' ? whiteTime : blackTime;
  const myTime = playerRole === 'white' ? whiteTime : blackTime;

  return (
    <div className="flex h-full w-full bg-chess-darker">
      {/* ── Left: Board + Player Cards ── */}
      <div className="flex flex-col flex-1 min-w-0 p-4 gap-3">
        {/* Top bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Room info */}
          <div className="flex items-center gap-2 glass-panel px-3 py-2">
            <span className="text-chess-muted text-xs uppercase tracking-widest">Room</span>
            <span className="font-mono text-sm font-bold text-chess-accent">{roomCode}</span>
          </div>

          {/* Status dot */}
          <div className={`flex items-center gap-1.5 glass-panel px-3 py-2`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-chess-green animate-pulse' : 'bg-chess-red'}`} />
            <span className="text-xs text-chess-muted">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Resign */}
          {!gameOver && isConnected && (
            <button
              id="resign-btn"
              className="btn-danger"
              onClick={onResign}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Resign
            </button>
          )}

          {/* Leave */}
          <button
            id="leave-btn"
            className="btn-ghost py-2 px-3"
            onClick={onDisconnect}
            title="Leave game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* Toggle sidebar on mobile */}
          <button
            id="toggle-sidebar-btn"
            className="btn-ghost py-2 px-3 xl:hidden"
            onClick={() => setShowSidebar(s => !s)}
            title="Toggle chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>

        {/* Opponent card */}
        <PlayerCard
          peerId={remotePeerId}
          role={opponentRole}
          timeMs={opponentTime}
          isActive={activeColor === opponentRole && isConnected && !gameOver}
          isYou={false}
          gameOver={gameOver}
        />

        {/* Chess Board */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full max-w-[min(100%,calc(100vh-280px))] aspect-square">
            <ChessBoard
              fen={fen}
              game={game}
              playerRole={playerRole}
              onMove={onMove}
              disabled={isDisabled}
            />
          </div>
        </div>

        {/* My card + Voice */}
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

      {/* ── Right: Chat Sidebar ── */}
      <div
        className={`flex-shrink-0 w-80 p-4 pl-0 transition-all duration-300 ${
          showSidebar ? 'block' : 'hidden xl:block'
        }`}
      >
        <ChatSidebar
          messages={chatMessages}
          onSend={onSendChat}
          disabled={!isConnected}
        />
      </div>

      {/* Game over modal */}
      <GameOverModal
        gameOver={gameOver}
        playerRole={playerRole}
        onLeave={onDisconnect}
      />
    </div>
  );
}
