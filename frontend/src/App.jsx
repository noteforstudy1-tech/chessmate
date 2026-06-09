/**
 * App.jsx
 * Root component: orchestrates lobby vs. game view, feeds the useWebRTCChess hook.
 */
import React from 'react';
import { useWebRTCChess, STATUS } from './hooks/useWebRTCChess';
import LobbyScreen from './components/LobbyScreen';
import ChessGame from './components/ChessGame';
import ConnectionOverlay from './components/ConnectionOverlay';

export default function App() {
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
    <div className="h-full w-full overflow-hidden">
      {/* Lobby */}
      {!inGame && (
        <LobbyScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isLoading={isLoading}
          errorMessage={connectionStatus === STATUS.ERROR ? errorMessage : ''}
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
