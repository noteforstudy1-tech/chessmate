/**
 * chessUtils.js
 * Utility helpers for chess move validation and formatting.
 */

/**
 * Returns the file letter and rank number label for a square.
 * @param {string} square - e.g. "e4"
 */
export function squareLabel(square) {
  return square;
}

/**
 * Format milliseconds as MM:SS
 * @param {number} ms
 */
export function formatTime(ms) {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get the winner from chess.js game state
 * @param {Chess} game
 * @returns {'white'|'black'|'draw'|null}
 */
export function getGameResult(game) {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? 'black' : 'white';
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return 'draw';
  }
  return null;
}

/**
 * Get last move squares from chess.js history
 * @param {Chess} game
 * @returns {{ from: string, to: string } | null}
 */
export function getLastMove(game) {
  const history = game.history({ verbose: true });
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  return { from: last.from, to: last.to };
}

/**
 * Build square styles for last move highlighting
 * @param {{ from: string, to: string } | null} lastMove
 * @returns {object}
 */
export function buildLastMoveStyles(lastMove) {
  if (!lastMove) return {};
  return {
    [lastMove.from]: { background: 'rgba(108, 99, 255, 0.3)' },
    [lastMove.to]: { background: 'rgba(108, 99, 255, 0.5)' },
  };
}

/**
 * Generate initials from a peer ID (first 2 chars, uppercase)
 * @param {string} peerId
 */
export function peerInitials(peerId) {
  if (!peerId) return '??';
  return peerId.slice(0, 2).toUpperCase();
}

/**
 * Generate a deterministic color from a string (for avatars)
 * @param {string} str
 */
export function stringToColor(str) {
  const palette = [
    '#6c63ff', '#f0b429', '#22c55e', '#ec4899',
    '#06b6d4', '#f97316', '#a78bfa', '#34d399',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
