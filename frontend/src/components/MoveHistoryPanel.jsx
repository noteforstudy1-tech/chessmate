/**
 * MoveHistoryPanel.jsx
 * Displays move history in algebraic notation and captured pieces per side.
 */
import React, { useEffect, useRef } from 'react';

// Piece unicode symbols
const PIECE_SYMBOLS = {
  wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕', wK: '♔',
  bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛', bK: '♚',
};

// Piece material values for sorting display
const PIECE_VALUES = { q: 9, r: 5, b: 3, n: 3, p: 1 };

function getCapturedPieces(game) {
  const history = game.history({ verbose: true });
  const captured = { white: [], black: [] }; // captured BY white, BY black

  history.forEach((move) => {
    if (move.captured) {
      const capturingColor = move.color === 'w' ? 'white' : 'black';
      captured[capturingColor].push(move.captured);
    }
  });

  return captured;
}

function CapturedPieces({ pieces, capturer, label }) {
  // capturer='white' means white made captures so they captured black pieces (symbolKey='b')
  const symbolKey = capturer === 'white' ? 'b' : 'w';
  const sorted = [...pieces].sort((a, b) => (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0));

  if (sorted.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-chess-muted font-semibold uppercase tracking-wider w-14 flex-shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5">
        {sorted.map((p, i) => (
          <span key={i} className="text-base leading-none">
            {PIECE_SYMBOLS[`${symbolKey}${p.toUpperCase()}`] || p}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MoveHistoryPanel({ game }) {
  const scrollRef = useRef(null);
  const history = game.history({ verbose: true });
  const captured = getCapturedPieces(game);

  // Build move pairs: [[w1, b1], [w2, b2], ...]
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const whiteCaptured = captured.white;
  const blackCaptured = captured.black;

  // Material advantage
  const whiteMaterial = whiteCaptured.reduce((s, p) => s + (PIECE_VALUES[p] || 0), 0);
  const blackMaterial = blackCaptured.reduce((s, p) => s + (PIECE_VALUES[p] || 0), 0);
  const whiteAdv = whiteMaterial - blackMaterial;

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-chess-border flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-chess-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-sm font-semibold text-chess-light">Move History</span>
        <span className="ml-auto text-xs text-chess-muted font-mono">
          {Math.ceil(history.length / 2)} moves
        </span>
      </div>

      {/* Captured pieces section */}
      {(whiteCaptured.length > 0 || blackCaptured.length > 0) && (
        <div className="px-4 py-2.5 border-b border-chess-border flex-shrink-0 flex flex-col gap-1.5">
          {/* White captured black pieces */}
          <div className="flex items-center gap-1 flex-wrap">
            {whiteCaptured.length > 0 && (
              <CapturedPieces pieces={whiteCaptured} capturer="white" label="White +" />
            )}
            {whiteAdv > 0 && (
              <span className="text-xs text-chess-green font-bold ml-1">+{whiteAdv}</span>
            )}
          </div>
          {/* Black captured white pieces */}
          <div className="flex items-center gap-1 flex-wrap">
            {blackCaptured.length > 0 && (
              <CapturedPieces pieces={blackCaptured} capturer="black" label="Black +" />
            )}
            {whiteAdv < 0 && (
              <span className="text-xs text-chess-green font-bold ml-1">+{Math.abs(whiteAdv)}</span>
            )}
          </div>
        </div>
      )}

      {/* Move list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5"
      >
        {movePairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-chess-muted">
            <span className="text-3xl opacity-30">♟</span>
            <p className="text-xs text-center">No moves yet</p>
          </div>
        ) : (
          movePairs.map(([white, black], idx) => {
            const isLastPair = idx === movePairs.length - 1;
            const lastMoveIdx = history.length - 1;
            const whiteIsLast = lastMoveIdx === idx * 2;
            const blackIsLast = lastMoveIdx === idx * 2 + 1;

            return (
              <div
                key={idx}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
                  isLastPair ? 'bg-chess-accent/10' : 'hover:bg-chess-panel/60'
                }`}
              >
                {/* Move number */}
                <span className="text-chess-muted text-xs font-mono w-6 flex-shrink-0">
                  {idx + 1}.
                </span>

                {/* White move */}
                <span
                  className={`flex-1 text-xs font-mono font-semibold px-1.5 py-0.5 rounded transition-colors ${
                    whiteIsLast
                      ? 'bg-chess-accent/25 text-chess-accent'
                      : 'text-chess-light'
                  }`}
                >
                  {white?.san || ''}
                </span>

                {/* Black move */}
                <span
                  className={`flex-1 text-xs font-mono font-semibold px-1.5 py-0.5 rounded transition-colors ${
                    blackIsLast
                      ? 'bg-chess-accent/25 text-chess-accent'
                      : 'text-chess-muted'
                  }`}
                >
                  {black?.san || ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
