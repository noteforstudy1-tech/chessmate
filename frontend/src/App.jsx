/**
 * App.jsx
 * Root component: orchestrates lobby vs. game view, feeds the useWebRTCChess hook.
 * Also manages theme (dark/light) toggling.
 */
import React, { useState, useEffect } from 'react';
import { useWebRTCChess, STATUS } from './hooks/useWebRTCChess';
import LobbyScreen from './components/LobbyScreen';
import ChessGame from './components/ChessGame';
import ConnectionOverlay from './components/ConnectionOverlay';

export default function App() {
  // ── Theme ────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('chessmate-theme');
    return saved !== 'light'; // default dark
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('light');
      html.classList.add('dark');
      localStorage.setItem('chessmate-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('chessmate-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // ── WebRTC Chess Hook ─────────────────────────────────────────────────────
  const {
    // Connection state
    connectionStatus,
    statusMessage,
    errorMessage,
    myPeerId,
    remotePeerId,
    roomCode,
    playerRole,

    // Game state
    fen,
    game,
    chatMessages,
    gameOver,

    // Clock
    whiteTime,
    blackTime,
    activeColor,

    // Voice
    isMuted,
    micVolume,
    remoteStream,
    voiceActive,
    remoteAudioRef,

    // Actions
    createRoom,
    joinRoom,
    makeMove,
    sendChatMessage,
    toggleMute,
    resign,
    disconnect,
    startVoice,
  } = useWebRTCChess();

  // Determine which screen to show
  const inGame = playerRole !== null && connectionStatus !== STATUS.IDLE;
  const isLoading = [STATUS.INITIALIZING, STATUS.CONNECTING].includes(connectionStatus);

  return (
    <div className="h-full w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Lobby */}
      {!inGame && (
        <LobbyScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isLoading={isLoading}
          errorMessage={connectionStatus === STATUS.ERROR ? errorMessage : ''}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Game */}
      {inGame && (
        <ChessGame
          fen={fen}
          game={game}
          playerRole={playerRole}
          onMove={makeMove}
          gameOver={gameOver}
          myPeerId={myPeerId}
          remotePeerId={remotePeerId}
          whiteTime={whiteTime}
          blackTime={blackTime}
          activeColor={activeColor}
          chatMessages={chatMessages}
          onSendChat={sendChatMessage}
          isMuted={isMuted}
          micVolume={micVolume}
          voiceActive={voiceActive}
          remoteAudioRef={remoteAudioRef}
          onToggleMute={toggleMute}
          onStartVoice={startVoice}
          connectionStatus={connectionStatus}
          roomCode={roomCode}
          onResign={resign}
          onDisconnect={disconnect}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Connection overlay (shown on top of game when not yet connected) */}
      {inGame && (
        <ConnectionOverlay
          status={connectionStatus}
          statusMessage={statusMessage}
          errorMessage={errorMessage}
          roomCode={roomCode}
          onDisconnect={disconnect}
        />
      )}
    </div>
  );
}
