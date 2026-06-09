/**
 * ChessBoard.jsx
 * Wraps react-chessboard with:
 *  - last-move highlighting
 *  - check-square glow
 *  - click-to-move fallback (works for touch & when drag fails)
 *  - drag restricted to own pieces via arePiecesDraggable + isDraggablePiece
 *  - promotion modal shown ONLY when a pawn reaches the last rank
 */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { buildLastMoveStyles, getLastMove } from '../utils/chessUtils';

// Piece symbols indexed by role + piece type
const PROMO_PIECES = ['q', 'r', 'b', 'n'];
const SYMBOLS = {
  white: { q: '♕', r: '♖', b: '♗', n: '♘' },
  black: { q: '♛', r: '♜', b: '♝', n: '♞' },
};

function PromotionModal({ playerRole, onSelect, onCancel }) {
  const symbols = SYMBOLS[playerRole] || SYMBOLS.white;
  const labels = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-chess-darker/75 backdrop-blur-sm animate-fade-in rounded-xl">
      <div className="glass-panel p-5 flex flex-col items-center gap-4 animate-slide-up">
        <p className="text-sm font-semibold text-chess-muted uppercase tracking-widest">
          Promote pawn to…
        </p>
        <div className="flex gap-3">
          {PROMO_PIECES.map((p) => (
            <button
              key={p}
              id={`promo-modal-${p}-btn`}
              onClick={() => onSelect(p)}
              className="flex flex-col items-center gap-1 w-14 h-16 rounded-xl
                         bg-chess-darker border border-chess-border
                         hover:border-chess-accent hover:bg-chess-accent/10
                         transition-all duration-150 active:scale-95 cursor-pointer"
              title={labels[p]}
            >
              <span className="text-3xl mt-2">{symbols[p]}</span>
              <span className="text-[10px] text-chess-muted font-semibold">{labels[p]}</span>
            </button>
          ))}
        </div>
        <button
          id="promo-cancel-btn"
          onClick={onCancel}
          className="text-xs text-chess-muted hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ChessBoard({
  fen,
  game,
  playerRole,
  onMove,
  disabled,
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState({});
  // pendingPromotion: { from, to } — set when a move needs promotion choice
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // Keep mutable values in refs so drag callbacks are never stale
  const playerRoleRef = useRef(playerRole);
  playerRoleRef.current = playerRole;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  // Keep game ref for callbacks
  const gameRef = useRef(game);
  gameRef.current = game;

  const boardOrientation = playerRole === 'black' ? 'black' : 'white';

  // ── Last-move highlight ─────────────────────────────────────────────────
  const lastMove = useMemo(() => getLastMove(game), [fen]);
  const lastMoveStyles = useMemo(() => buildLastMoveStyles(lastMove), [lastMove]);

  // ── King-in-check glow ──────────────────────────────────────────────────
  const isInCheck = game.inCheck();
  const kingSquare = useMemo(() => {
    if (!isInCheck) return null;
    const color = game.turn();
    for (const row of game.board()) {
      for (const sq of row) {
        if (sq && sq.type === 'k' && sq.color === color) return sq.square;
      }
    }
    return null;
  }, [fen, isInCheck]);

  // ── Square styles (last move + check + selection + legal targets) ────────
  const customSquareStyles = useMemo(() => {
    const styles = { ...lastMoveStyles };
    if (kingSquare) {
      styles[kingSquare] = {
        background: 'radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(239,68,68,0.2) 70%)',
      };
    }
    if (selectedSquare) {
      styles[selectedSquare] = { background: 'rgba(108, 99, 255, 0.65)', borderRadius: '4px' };
    }
    Object.keys(possibleMoves).forEach(sq => {
      styles[sq] = {
        background: 'radial-gradient(circle, rgba(108,99,255,0.55) 30%, transparent 70%)',
        borderRadius: '50%',
      };
    });
    return styles;
  }, [lastMoveStyles, kingSquare, selectedSquare, possibleMoves]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  function isOwnPiece(square) {
    const piece = gameRef.current.get(square);
    if (!piece) return false;
    const role = playerRoleRef.current;
    return (role === 'white' && piece.color === 'w') ||
           (role === 'black' && piece.color === 'b');
  }

  function getLegalTargets(square) {
    try {
      const moves = gameRef.current.moves({ square, verbose: true });
      const targets = {};
      moves.forEach(m => { targets[m.to] = true; });
      return targets;
    } catch {
      return {};
    }
  }

  function isPromoMove(from, to) {
    const piece = gameRef.current.get(from);
    if (!piece || piece.type !== 'p') return false;
    const rank = to[1];
    return (piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1');
  }

  function clearSelection() {
    setSelectedSquare(null);
    setPossibleMoves({});
  }

  // ── Attempt a move, intercepting promotion ───────────────────────────────
  function attemptMove(from, to) {
    if (isPromoMove(from, to)) {
      // Pause and show the modal instead of moving immediately
      setPendingPromotion({ from, to });
      clearSelection();
      return false; // don't complete the move yet
    }
    const moved = onMove({ from, to });
    if (moved) clearSelection();
    return moved;
  }

  // ── Promotion modal callbacks ────────────────────────────────────────────
  function handlePromoSelect(piece) {
    if (!pendingPromotion) return;
    onMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
    setPendingPromotion(null);
    clearSelection();
  }

  function handlePromoCancel() {
    setPendingPromotion(null);
    clearSelection();
  }

  // ── Click-to-move ────────────────────────────────────────────────────────
  const onSquareClick = useCallback((square) => {
    if (disabledRef.current || pendingPromotion) return;

    if (selectedSquare) {
      if (possibleMoves[square]) {
        // Valid target — attempt move (handles promotion intercept internally)
        attemptMove(selectedSquare, square);
      } else if (isOwnPiece(square)) {
        // Re-select a different own piece
        setSelectedSquare(square);
        setPossibleMoves(getLegalTargets(square));
      } else {
        clearSelection();
      }
    } else {
      if (isOwnPiece(square)) {
        setSelectedSquare(square);
        setPossibleMoves(getLegalTargets(square));
      }
    }
  }, [selectedSquare, possibleMoves, pendingPromotion, onMove]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const isDraggablePiece = useCallback(({ piece }) => {
    if (disabledRef.current) return false;
    const role = playerRoleRef.current;
    return (role === 'white' && piece[0] === 'w') ||
           (role === 'black' && piece[0] === 'b');
  }, []);

  const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
    if (disabledRef.current) return false;
    return attemptMove(sourceSquare, targetSquare);
  }, [onMove]);

  const onPieceDragBegin = useCallback((piece, sourceSquare) => {
    if (disabledRef.current) return;
    setSelectedSquare(sourceSquare);
    setPossibleMoves(getLegalTargets(sourceSquare));
  }, []);

  const onPieceDragEnd = useCallback(() => {
    clearSelection();
  }, []);

  return (
    <div className="relative w-full board-shadow rounded-xl overflow-hidden select-none">
      <Chessboard
        id="main-board"
        position={fen}
        boardOrientation={boardOrientation}
        onPieceDrop={onPieceDrop}
        onPieceDragBegin={onPieceDragBegin}
        onPieceDragEnd={onPieceDragEnd}
        onSquareClick={onSquareClick}
        isDraggablePiece={isDraggablePiece}
        arePiecesDraggable={!disabled}
        customSquareStyles={customSquareStyles}
        customBoardStyle={{ borderRadius: '8px' }}
        customDarkSquareStyle={{ backgroundColor: '#312e6d' }}
        customLightSquareStyle={{ backgroundColor: '#b8b1ff' }}
        animationDuration={150}
        arePremovesAllowed={false}
      />

      {/* Promotion modal — only appears when a pawn reaches the last rank */}
      {pendingPromotion && (
        <PromotionModal
          playerRole={playerRole}
          onSelect={handlePromoSelect}
          onCancel={handlePromoCancel}
        />
      )}
    </div>
  );
}
