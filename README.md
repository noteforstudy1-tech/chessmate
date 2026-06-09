# ♟ ChessMate — Real-Time Multiplayer Chess

A production-quality **real-time multiplayer chess** platform built with **React + Vite**, **Tailwind CSS**, **PeerJS (WebRTC)**, and a minimal **Node.js/Express** signaling backend.

![ChessMate](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)
![PeerJS](https://img.shields.io/badge/PeerJS-WebRTC-00b4d8)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| ♟ **Chess engine** | Full rule validation via `chess.js` (check, checkmate, stalemate, en passant, castling) |
| ⚡ **P2P real-time moves** | Zero-latency move sync via PeerJS WebRTC DataChannel |
| 🎙️ **Voice chat** | Live audio via PeerJS MediaConnection + Web Audio API volume meter |
| 💬 **Text chat** | In-game messaging sidebar over the same data channel |
| 🏠 **Room system** | Create/Join rooms with a 6-character code — no account needed |
| 🔌 **Connection overlay** | "Waiting…", "Connecting…", "Player 2 Joined!" states with animated spinner |
| 🖱️ **Click-to-move** | Legal move dots shown on click; works on touch screens too |
| 🏅 **Pawn promotion modal** | Appears only when a pawn reaches the last rank |
| ⏱️ **Chess clocks** | 10-minute countdown per player with low-time warning |
| 🎨 **Premium UI** | Glassmorphism, purple-lavender board, floating chess piece animations |

---

## 🗂️ Project Structure

```
chess-making/
├── backend/          # Node.js/Express signaling server
│   ├── server.js     # Room create/join/delete endpoints
│   └── package.json
└── frontend/         # React + Vite app
    ├── src/
    │   ├── hooks/
    │   │   └── useWebRTCChess.js   # Core PeerJS + chess.js hook
    │   ├── components/
    │   │   ├── LobbyScreen.jsx
    │   │   ├── ChessGame.jsx
    │   │   ├── ChessBoard.jsx
    │   │   ├── ChatSidebar.jsx
    │   │   ├── VoicePanel.jsx
    │   │   ├── ConnectionOverlay.jsx
    │   │   └── PlayerCard.jsx
    │   └── utils/
    │       └── chessUtils.js
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### 1. Clone the repo
```bash
git clone https://github.com/noteforstudy1-tech/chessmate.git
cd chessmate
```

### 2. Start the signaling backend
```bash
cd backend
npm install
node server.js
# → 🚀 Running on http://localhost:3001
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 4. Play!
1. Open **two browser windows** at `http://localhost:5173`
2. **Window 1** → Click **"✦ Create New Room"** → copy the 6-char code
3. **Window 2** → Click **"→ Join Room"** → enter the code → Join
4. Game starts — White moves first!

---

## 🏗️ Architecture

```
Browser (P1)  ──WebRTC P2P──  Browser (P2)
      ↕   signaling only   ↕
   Express Server (localhost:3001)
   stores roomCode → peerId mapping
```

The Express server is used **only** to exchange PeerJS IDs via a room code. All game data (moves, chat, voice) flows **directly peer-to-peer** via WebRTC.

### Message Protocol (DataChannel)
```js
{ type: 'move',   payload: { from, to, promotion } }
{ type: 'chat',   payload: { sender, text, time } }
{ type: 'sync',   payload: { fen } }    // board sync on join
{ type: 'resign', payload: {} }
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3
- **Chess:** `chess.js` (validation), `react-chessboard` (UI)
- **P2P:** PeerJS 1.5 (WebRTC DataChannel + MediaStream)
- **Backend:** Node.js, Express, uuid

---

## 📄 License

MIT
