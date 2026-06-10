/**
 * MoveHistoryPanel.jsx
 * Displays move history in algebraic notation and captured pieces per side.
 * Accepts `fen` prop so React re-renders whenever a move is made.
 */
import React, { useEffect, useRef } from 'react';

// Unicode piece symbols  (color + type key)
const PIECE_SYMBOLS = {
  bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛', bK: '♚',
  wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕', wK: '♔',
};

// Material value for sorting captured pieces display (highest first)
const PIECE_VALUE = { q: 9, r: 5, b: 3, n: 3, p: 1 };

// Derive captured pieces from game history
function getCaptured(game) {
  const history = game.history({ verbose: true });
  const byWhite = []; // pieces captured by white (i.e. black pieces)
  const byBlack = []; // pieces captured by black (i.e. white pieces)

  history.forEach((m) => {
    if (!m.captured) return;
    if (m.color === 'w') byWhite.push(m.captured);
    else byBlack.push(m.captured);
  });

  return { byWhite, byBlack };
}

// Render a row of captured pieces with material score
function CapturedRow({ label, pieces, symbolColor }) {
  if (pieces.length === 0) return null;
  const sorted = [...pieces].sort((a, b) => (PIECE_VALUE[b] || 0) - (PIECE_VALUE[a] || 0));
  const score = pieces.reduce((s, p) => s + (PIECE_VALUE[p] || 0), 0);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0 w-12"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
        {sorted.map((p, i) => (
          <span key={i} className="text-sm leading-none select-none" title={p.toUpperCase()}>
            {PIECE_SYMBOLS[`${symbolColor}${p.toUpperCase()}`] || p}
          </span>
        ))}
      </div>
      {score > 0 && (
        <span className="text-xs font-bold text-chess-green flex-shrink-0">+{score}</span>
      )}
    </div>
  );
}

export default function MoveHistoryPanel({ game, fen }) {
  // `fen` is only used as a reactive trigger — every time a move is made,
  // fen changes, React re-renders this component, and we re-read game.history()
  const scrollRef = useRef(null);
  const history = game.history({ verbose: true });
  const { byWhite, byBlack } = getCaptured(game);

  // Build move pairs [[whiteMove, blackMove], ...]
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push([history[i], history[i + 1] || null]);
  }

  const lastIdx = history.length - 1;

  // Auto-scroll to latest move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  return (
    <div
      className="glass-panel flex flex-col h-full overflow-hidden"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-chess-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Move History
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {pairs.length} {pairs.length === 1 ? 'move' : 'moves'}
        </span>
      </div>

      {/* ── Captured pieces ── */}
      {(byWhite.length > 0 || byBlack.length > 0) && (
        <div
          className="px-4 py-2 flex flex-col gap-1 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          {/* White captured black pieces → show black symbols */}
          <CapturedRow label="White +" pieces={byWhite} symbolColor="b" />
          {/* Black captured white pieces → show white symbols */}
          <CapturedRow label="Black +" pieces={byBlack} symbolColor="w" />
        </div>
      )}

      {/* ── Move list ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-1.5">
        {pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-4xl opacity-20 select-none">♟</span>
            <p className="text-xs">Game not started</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="w-8 text-left pb-1 pl-2 font-semibold">#</th>
                <th className="text-left pb-1 font-semibold">White</th>
                <th className="text-left pb-1 font-semibold">Black</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(([white, black], idx) => {
                const whiteGlobalIdx = idx * 2;
                const blackGlobalIdx = idx * 2 + 1;
                const isLastRow = idx === pairs.length - 1;

                return (
                  <tr
                    key={idx}
                    className="rounded-lg"
                    style={{
                      backgroundColor: isLastRow ? 'rgba(108,99,255,0.08)' : 'transparent',
                    }}
                  >
                    {/* Move number */}
                    <td
                      className="pl-2 py-1 font-mono rounded-l-lg"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {idx + 1}.
                    </td>

                    {/* White move */}
                    <td className="py-1 pr-1">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded font-mono font-semibold"
                        style={{
                          backgroundColor: lastIdx === whiteGlobalIdx ? 'rgba(108,99,255,0.25)' : 'transparent',
                          color: lastIdx === whiteGlobalIdx ? '#8b82ff' : 'var(--text-primary)',
                        }}
                      >
                        {white?.san || ''}
                      </span>
                    </td>

                    {/* Black move */}
                    <td className="py-1 rounded-r-lg">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded font-mono font-semibold"
                        style={{
                          backgroundColor: black && lastIdx === blackGlobalIdx ? 'rgba(108,99,255,0.25)' : 'transparent',
                          color: black && lastIdx === blackGlobalIdx
                            ? '#8b82ff'
                            : black
                            ? 'var(--text-muted)'
                            : 'transparent',
                        }}
                      >
                        {black?.san || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
