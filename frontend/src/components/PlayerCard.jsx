/**
 * PlayerCard.jsx
 * Shows player avatar, name, color badge, and chess clock.
 */
import React from 'react';
import { formatTime, peerInitials, stringToColor } from '../utils/chessUtils';

export default function PlayerCard({
  peerId,
  role,
  timeMs,
  isActive,
  isYou,
  gameOver,
}) {
  const initials = peerInitials(peerId || (isYou ? 'You' : 'Opp'));
  const avatarColor = stringToColor(peerId || 'default');
  const isLow = timeMs <= 30_000 && timeMs > 0;
  const isOut = timeMs === 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive && !gameOver
          ? 'bg-chess-accent/10 border border-chess-accent/30'
          : ''
      }`}
      style={!(isActive && !gameOver) ? {
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        opacity: 0.9,
      } : {}}
    >
      {/* Avatar */}
      <div
        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-all duration-300 ${
          isActive && !gameOver ? 'ring-2 ring-chess-accent ring-offset-2 ring-offset-chess-dark' : ''
        }`}
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
        {/* Active turn indicator dot */}
        {isActive && !gameOver && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-chess-green rounded-full border-2 border-chess-dark animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {isYou ? 'You' : 'Opponent'}
          </span>
          <span
            className={`badge text-xs ${role === 'white' ? 'badge-white' : 'badge-black'}`}
          >
            {role === 'white' ? '♔ White' : '♟ Black'}
          </span>
          {isYou && (
            <span className="badge badge-green text-xs">You</span>
          )}
        </div>
        <div className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {peerId ? peerId.slice(0, 12) + '...' : 'Waiting...'}
        </div>
      </div>

      {/* Clock */}
      <div
        className={`font-mono text-lg font-bold tabular-nums flex-shrink-0 transition-colors duration-300 ${
          isOut ? 'text-chess-red' :
          isLow ? 'text-chess-gold animate-pulse' :
          ''
        }`}
        style={!isOut && !isLow ? { color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' } : {}}
      >
        {formatTime(timeMs)}
      </div>
    </div>
  );
}
