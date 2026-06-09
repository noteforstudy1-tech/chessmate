/**
 * useWebRTCChess.js
 *
 * Core custom hook that abstracts ALL PeerJS lifecycle management:
 *   - Room creation and joining (via signaling backend)
 *   - DataConnection for moves, chat, and game state sync
 *   - MediaConnection for real-time voice chat
 *   - chess.js game state management
 *   - Graceful cleanup and disconnection handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { Chess } from 'chess.js';

// ─── Message Types ───────────────────────────────────────────────────────────
export const MSG = {
  MOVE: 'move',
  CHAT: 'chat',
  SYNC: 'sync',
  RESIGN: 'resign',
  PING: 'ping',
  PONG: 'pong',
};

// ─── Connection Status ────────────────────────────────────────────────────────
export const STATUS = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  WAITING: 'waiting',       // Host: waiting for opponent
  CONNECTING: 'connecting', // Joiner: connecting to host
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

const SIGNALING_BASE = '/api';
const INITIAL_TIME_MS = 10 * 60 * 1000; // 10 minutes per player

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWebRTCChess() {
  // ── Refs (no re-render needed) ────────────────────────────────────────────
  const peerRef = useRef(null);
  const dataConnRef = useRef(null);
  const mediaConnRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null); // <audio> element ref
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const clockRef = useRef(null);
  const gameRef = useRef(new Chess());
  const playerRoleRef = useRef(null); // mirror of playerRole state — always current

  // ── State ────────────────────────────────────────────────────────────────
  const [connectionStatus, setConnectionStatus] = useState(STATUS.IDLE);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [myPeerId, setMyPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerRole, setPlayerRole] = useState(null); // 'white' | 'black'

  // Keep playerRoleRef in sync so callbacks never have a stale closure
  useEffect(() => { playerRoleRef.current = playerRole; }, [playerRole]);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [chatMessages, setChatMessages] = useState([]);
  const [gameOver, setGameOver] = useState(null); // { result, reason }

  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // 0-100
  const [remoteStream, setRemoteStream] = useState(null);
  const [voiceActive, setVoiceActive] = useState(false);

  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME_MS);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME_MS);
  const [activeColor, setActiveColor] = useState('white');

  // ── Clock management ──────────────────────────────────────────────────────
  const startClock = useCallback(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = setInterval(() => {
      setActiveColor(prev => {
        if (prev === 'white') {
          setWhiteTime(t => Math.max(0, t - 1000));
        } else {
          setBlackTime(t => Math.max(0, t - 1000));
        }
        return prev;
      });
    }, 1000);
  }, []);

  const stopClock = useCallback(() => {
    if (clockRef.current) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }
  }, []);

  // ── Cleanup everything ────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    stopClock();

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (mediaConnRef.current) {
      mediaConnRef.current.close();
      mediaConnRef.current = null;
    }

    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setRemoteStream(null);
    setVoiceActive(false);
    setMicVolume(0);
  }, [stopClock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ── Mic volume metering ───────────────────────────────────────────────────
  const startMicMeter = useCallback((stream) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn('Mic meter error:', e);
    }
  }, []);

  // ── Send helper ───────────────────────────────────────────────────────────
  const sendData = useCallback((type, payload = {}) => {
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send({ type, payload });
    }
  }, []);

  // ── Handle incoming data messages ─────────────────────────────────────────
  const handleData = useCallback((data) => {
    if (!data || !data.type) return;

    switch (data.type) {
      case MSG.MOVE: {
        const { from, to, promotion } = data.payload;
        const result = gameRef.current.move({ from, to, promotion });
        if (result) {
          const newFen = gameRef.current.fen();
          setFen(newFen);
          // Switch active clock
          setActiveColor(gameRef.current.turn() === 'w' ? 'white' : 'black');
          // Check game over
          checkGameOver();
        }
        break;
      }

      case MSG.SYNC: {
        // Full FEN sync from host on join
        try {
          gameRef.current.load(data.payload.fen);
          setFen(data.payload.fen);
          setActiveColor(gameRef.current.turn() === 'w' ? 'white' : 'black');
        } catch (e) {
          console.warn('FEN sync error:', e);
        }
        break;
      }

      case MSG.CHAT: {
        const msg = {
          ...data.payload,
          own: false,
          id: Date.now() + Math.random(),
        };
        setChatMessages(prev => [...prev, msg]);
        break;
      }

      case MSG.RESIGN: {
        setGameOver({ result: playerRole === 'white' ? 'white' : 'black', reason: 'resignation' });
        stopClock();
        break;
      }

      case MSG.PING: {
        sendData(MSG.PONG);
        break;
      }

      default:
        break;
    }
  }, [playerRole, sendData, stopClock]);

  // ── Check game over ───────────────────────────────────────────────────────
  const checkGameOver = useCallback(() => {
    const game = gameRef.current;
    if (!game.isGameOver()) return;

    stopClock();
    let result = null;
    let reason = '';

    if (game.isCheckmate()) {
      result = game.turn() === 'w' ? 'black' : 'white';
      reason = 'checkmate';
    } else if (game.isDraw()) {
      result = 'draw';
      reason = game.isStalemate() ? 'stalemate'
        : game.isThreefoldRepetition() ? 'threefold repetition'
        : game.isInsufficientMaterial() ? 'insufficient material'
        : 'fifty-move rule';
    }

    setGameOver({ result, reason });
  }, [stopClock]);

  // ── Attach data connection handlers ──────────────────────────────────────
  const attachDataHandlers = useCallback((conn) => {
    conn.on('open', () => {
      console.log('[DataConn] Open');
      dataConnRef.current = conn;
      setConnectionStatus(STATUS.CONNECTED);
      setStatusMessage('Connected! Game starting...');
      // Start clock when both connected
      startClock();
    });

    conn.on('data', (data) => {
      handleData(data);
    });

    conn.on('close', () => {
      console.log('[DataConn] Closed');
      setConnectionStatus(STATUS.DISCONNECTED);
      setStatusMessage('Opponent disconnected.');
      stopClock();
    });

    conn.on('error', (err) => {
      console.error('[DataConn] Error:', err);
      setConnectionStatus(STATUS.DISCONNECTED);
      setStatusMessage('Connection error.');
      stopClock();
    });
  }, [handleData, startClock, stopClock]);

  // ── Attach media connection handlers ──────────────────────────────────────
  const attachMediaHandlers = useCallback((call, stream) => {
    call.answer(stream);

    call.on('stream', (remoteStr) => {
      console.log('[MediaConn] Remote stream received');
      setRemoteStream(remoteStr);
      setVoiceActive(true);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStr;
        remoteAudioRef.current.play().catch(() => {});
      }
    });

    call.on('close', () => {
      console.log('[MediaConn] Closed');
      setRemoteStream(null);
      setVoiceActive(false);
    });

    call.on('error', (err) => {
      console.error('[MediaConn] Error:', err);
      setVoiceActive(false);
    });
  }, []);

  // ── Initialize PeerJS instance ─────────────────────────────────────────────
  const initPeer = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Destroy any existing peer
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log('[Peer] Open, ID:', id);
        setMyPeerId(id);
        resolve(id);
      });

      peer.on('error', (err) => {
        console.error('[Peer] Error:', err);
        setConnectionStatus(STATUS.ERROR);
        setErrorMessage(`Connection error: ${err.type || err.message}`);
        reject(err);
      });

      peer.on('disconnected', () => {
        console.warn('[Peer] Disconnected from broker');
        // Attempt reconnect
        if (!peer.destroyed) {
          peer.reconnect();
        }
      });
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * HOST: Create a room.
   * 1. Init PeerJS → get peerId
   * 2. POST to backend → get roomCode
   * 3. Wait for incoming DataConnection from joiner
   * 4. Optionally answer incoming MediaConnection (voice)
   */
  const createRoom = useCallback(async () => {
    setConnectionStatus(STATUS.INITIALIZING);
    setStatusMessage('Initializing peer...');
    setErrorMessage('');
    setGameOver(null);
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setChatMessages([]);
    setWhiteTime(INITIAL_TIME_MS);
    setBlackTime(INITIAL_TIME_MS);

    try {
      const peerId = await initPeer();

      // Register with signaling server
      const res = await fetch(`${SIGNALING_BASE}/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId }),
      });
      if (!res.ok) throw new Error('Failed to create room on server');
      const { roomCode: code } = await res.json();

      setRoomCode(code);
      setPlayerRole('white');
      playerRoleRef.current = 'white'; // set ref immediately (don't wait for useEffect)
      setConnectionStatus(STATUS.WAITING);
      setStatusMessage('Waiting for opponent to join...');

      // Listen for incoming connections
      peerRef.current.on('connection', (conn) => {
        console.log('[Host] Incoming data connection from:', conn.peer);
        setRemotePeerId(conn.peer);
        setConnectionStatus(STATUS.CONNECTING);
        setStatusMessage('Opponent connecting...');
        attachDataHandlers(conn);

        // When data conn opens, send sync
        conn.on('open', () => {
          conn.send({
            type: MSG.SYNC,
            payload: { fen: gameRef.current.fen() },
          });
        });
      });

      // Listen for incoming voice calls
      peerRef.current.on('call', (call) => {
        console.log('[Host] Incoming call from:', call.peer);
        mediaConnRef.current = call;
        if (localStreamRef.current) {
          attachMediaHandlers(call, localStreamRef.current);
        } else {
          // Get mic if not already acquired
          navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((stream) => {
              localStreamRef.current = stream;
              startMicMeter(stream);
              attachMediaHandlers(call, stream);
            })
            .catch((err) => {
              console.warn('[Voice] Mic not available:', err);
              call.answer(); // answer without stream
            });
        }
      });

    } catch (err) {
      console.error('[createRoom]', err);
      setConnectionStatus(STATUS.ERROR);
      setErrorMessage(err.message || 'Failed to create room');
    }
  }, [initPeer, attachDataHandlers, attachMediaHandlers, startMicMeter]);

  /**
   * JOINER: Join a room by room code.
   * 1. Fetch host peerId from backend
   * 2. Init PeerJS
   * 3. Open DataConnection to host
   * 4. Make voice call to host
   */
  const joinRoom = useCallback(async (code) => {
    const upperCode = code.trim().toUpperCase();
    if (!upperCode) return;

    setConnectionStatus(STATUS.INITIALIZING);
    setStatusMessage('Looking up room...');
    setErrorMessage('');
    setGameOver(null);
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setChatMessages([]);
    setWhiteTime(INITIAL_TIME_MS);
    setBlackTime(INITIAL_TIME_MS);

    try {
      // Fetch host peer ID from signaling server
      const res = await fetch(`${SIGNALING_BASE}/join-room/${upperCode}`);
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Room not found');
      }
      const { peerId: hostPeerId } = await res.json();

      setRoomCode(upperCode);
      setRemotePeerId(hostPeerId);
      setPlayerRole('black');
      playerRoleRef.current = 'black'; // set ref immediately (don't wait for useEffect)
      setConnectionStatus(STATUS.CONNECTING);
      setStatusMessage('Connecting to opponent...');

      const myId = await initPeer();

      // Open data connection to host
      const conn = peerRef.current.connect(hostPeerId, {
        reliable: true,
        metadata: { role: 'black' },
      });
      attachDataHandlers(conn);

      // Acquire mic and place voice call
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        startMicMeter(stream);

        const call = peerRef.current.call(hostPeerId, stream);
        mediaConnRef.current = call;

        call.on('stream', (remoteStr) => {
          console.log('[Joiner] Remote voice stream');
          setRemoteStream(remoteStr);
          setVoiceActive(true);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStr;
            remoteAudioRef.current.play().catch(() => {});
          }
        });

        call.on('close', () => {
          setRemoteStream(null);
          setVoiceActive(false);
        });

        call.on('error', (err) => {
          console.error('[Voice call] Error:', err);
        });
      } catch (micErr) {
        console.warn('[Voice] Mic unavailable:', micErr);
        // Continue without voice
      }

    } catch (err) {
      console.error('[joinRoom]', err);
      setConnectionStatus(STATUS.ERROR);
      setErrorMessage(err.message || 'Failed to join room');
    }
  }, [initPeer, attachDataHandlers, startMicMeter]);

  /**
   * Make a chess move (validates locally, then syncs over data channel)
   * @param {{ from: string, to: string, promotion?: string }} move
   * @returns {boolean} - true if valid
   */
  const makeMove = useCallback((move) => {
    if (gameRef.current.isGameOver()) return false;

    // Use ref (never stale) to guard turn order
    const role = playerRoleRef.current;
    const isWhiteTurn = gameRef.current.turn() === 'w';
    if (role === 'white' && !isWhiteTurn) return false;
    if (role === 'black' && isWhiteTurn) return false;

    try {
      const result = gameRef.current.move(move);
      if (!result) return false;

      const newFen = gameRef.current.fen();
      setFen(newFen);
      setActiveColor(gameRef.current.turn() === 'w' ? 'white' : 'black');

      // Send move to opponent
      sendData(MSG.MOVE, { from: move.from, to: move.to, promotion: move.promotion });

      checkGameOver();
      return true;
    } catch (e) {
      console.warn('[makeMove] rejected:', e.message);
      return false;
    }
  }, [sendData, checkGameOver]); // playerRole removed — using ref instead

  /**
   * Send a chat message to the opponent
   * @param {string} text
   */
  const sendChatMessage = useCallback((text) => {
    if (!text.trim()) return;
    const msg = {
      sender: myPeerId.slice(0, 8) || 'You',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      own: true,
      id: Date.now() + Math.random(),
    };
    setChatMessages(prev => [...prev, msg]);
    sendData(MSG.CHAT, { sender: msg.sender, text: msg.text, time: msg.time });
  }, [myPeerId, sendData]);

  /**
   * Toggle local mic mute/unmute
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, []);

  /**
   * Resign the game
   */
  const resign = useCallback(() => {
    sendData(MSG.RESIGN);
    const winner = playerRole === 'white' ? 'black' : 'white';
    setGameOver({ result: winner, reason: 'resignation' });
    stopClock();
  }, [sendData, playerRole, stopClock]);

  /**
   * Disconnect and reset everything
   */
  const disconnect = useCallback(async () => {
    // Notify backend to delete room
    if (roomCode) {
      try {
        await fetch(`${SIGNALING_BASE}/room/${roomCode}`, { method: 'DELETE' });
      } catch (e) {
        // Non-critical
      }
    }
    cleanup();
    setConnectionStatus(STATUS.IDLE);
    setStatusMessage('');
    setErrorMessage('');
    setMyPeerId('');
    setRemotePeerId('');
    setRoomCode('');
    setPlayerRole(null);
    playerRoleRef.current = null;
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setChatMessages([]);
    setGameOver(null);
    setWhiteTime(INITIAL_TIME_MS);
    setBlackTime(INITIAL_TIME_MS);
    setActiveColor('white');
  }, [cleanup, roomCode]);

  /**
   * Start voice chat (request mic if not already done)
   */
  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      startMicMeter(stream);
      setVoiceActive(true);
    } catch (err) {
      console.error('[Voice] getUserMedia error:', err);
    }
  }, [startMicMeter]);

  return {
    // State
    connectionStatus,
    statusMessage,
    errorMessage,
    myPeerId,
    remotePeerId,
    roomCode,
    playerRole,
    fen,
    chatMessages,
    gameOver,
    isMuted,
    micVolume,
    remoteStream,
    voiceActive,
    whiteTime,
    blackTime,
    activeColor,
    game: gameRef.current,

    // Refs to pass to components
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
  };
}
