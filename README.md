# ⚔ GridWars — Real-time Territory Control

A real-time multiplayer grid game where users compete to capture territory. Built with React.js, Node.js, Socket.IO, and SQLite.

![GridWars](https://img.shields.io/badge/Status-Live-brightgreen) ![Node](https://img.shields.io/badge/Node.js-v18+-green) ![React](https://img.shields.io/badge/React-19-blue) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black)

## 🎮 What It Does

- **40×40 Grid** (1,600 blocks) — shared board that anyone can interact with
- **Real-time sync** — every click is instantly visible to all connected users via WebSockets
- **Claim territory** — click any cell to own it; steal from other players
- **Live leaderboard** — top 10 players ranked by cells owned
- **Auto-identity** — each user gets a unique color + fun name (e.g., "Cosmic Fox")
- **Cooldown system** — 500ms between claims to prevent spam

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React.js + Vite | Fast dev, HMR, modern tooling |
| **Styling** | Vanilla CSS | Full control, glassmorphism dark theme |
| **Backend** | Node.js + Express | Same language, lightweight |
| **Real-time** | Socket.IO | WebSocket abstraction, auto-reconnect, fallbacks |
| **Database** | SQLite (better-sqlite3) | Zero-config, persistent, no external deps |

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd toolboxkit

# Install all dependencies
npm run install:all

# Install root dependencies (for concurrently)
npm install
```

### Running in Development

```bash
# Start both server (port 3001) and client (port 5173)
npm run dev
```

Or run them separately:

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Then open **http://localhost:5173** in your browser.

### Production Build

```bash
# Build the client
npm run build

# Start the server (serves client from /client/dist)
npm start
```

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│           Client (React + Vite)             │
│  ┌─────────┐ ┌────────────┐ ┌───────────┐  │
│  │  Canvas  │ │ Leaderboard│ │ User Panel│  │
│  │  Grid    │ │            │ │           │  │
│  └────┬─────┘ └─────┬──────┘ └─────┬─────┘  │
│       └─────────┬───┴──────────────┘        │
│                 │ Socket.IO Client           │
└─────────────────┼───────────────────────────┘
                  │ WebSocket
┌─────────────────┼───────────────────────────┐
│                 │ Socket.IO Server           │
│  ┌──────────────▼─────────────┐             │
│  │     Socket Handler         │             │
│  │  • init (full grid)        │             │
│  │  • claim-cell (delta)      │             │
│  │  • get-leaderboard         │             │
│  └──────────────┬─────────────┘             │
│  ┌──────────────▼─────────────┐             │
│  │     Game Engine            │             │
│  │  • Cooldown (500ms)        │             │
│  │  • Score tracking          │             │
│  │  • Identity generation     │             │
│  └──────────────┬─────────────┘             │
│  ┌──────────────▼─────────────┐             │
│  │     SQLite Database        │             │
│  │  • users table             │             │
│  │  • cells table (1,600)     │             │
│  └────────────────────────────┘             │
│            Node.js + Express                │
└─────────────────────────────────────────────┘
```

## ⚡ How Real-time Updates Work

1. **Initial Load**: Client connects → server sends full grid state (1,600 cells) via `init` event
2. **Cell Claims**: Client emits `claim-cell(row, col)` → server validates → broadcasts **delta** to ALL clients
3. **Delta Updates**: Only the changed cell `{ row, col, ownerId, ownerColor, ownerName }` is sent — not the full grid
4. **Optimistic UI**: Client immediately shows the claim locally for instant feedback, then reconciles with server response
5. **Conflict Resolution**: Server is authoritative — last valid write wins, cooldown prevents rapid spam
6. **Reconnection**: Socket.IO auto-reconnects and re-fetches full grid state on reconnect

## 🎯 Trade-offs

| Decision | Trade-off |
|----------|-----------|
| **SQLite vs Redis** | Simpler setup + persistent data, but single-server only (no horizontal scaling) |
| **Canvas vs DOM** | Better performance at 1,600+ cells, but more complex hit detection |
| **Last-write-wins** | Simple conflict model, but cells can flip rapidly between users |
| **500ms cooldown** | Prevents spam, but limits speed of fast players |
| **Server-authoritative** | Prevents cheating, but adds ~50ms latency per claim |
| **In-memory grid on client** | Fast reads + renders, but memory usage grows with grid size |

## ✨ Bonus Features

| Feature | Description |
|---------|-------------|
| 🎨 **User Colors** | Each user gets a unique vibrant color from a curated palette |
| 🏷 **User Names** | Auto-generated fun names (e.g., "Neon Tiger", "Quantum Panda") |
| ⏱ **Cooldown** | 500ms between claims with visual progress indicator |
| 🏆 **Leaderboard** | Live top-10 with medal emojis (🥇🥈🥉) |
| 🔍 **Zoom/Pan** | Mouse wheel zoom + drag to pan the canvas grid |
| 🗺 **Minimap** | Corner overview of the full grid territory distribution |
| ✨ **Animations** | Ripple effect on claim, pulse on hover, smooth transitions |
| 👥 **Online Counter** | Live count of connected users |
| ⚡ **Optimistic UI** | Instant visual feedback before server confirmation |

## 📂 Project Structure

```
toolboxkit/
├── package.json          # Root scripts (dev, build, start)
├── README.md             # This file
├── server/
│   ├── package.json      # Server dependencies
│   ├── index.js          # Express + Socket.IO entry point
│   ├── db.js             # SQLite database layer
│   ├── game.js           # Game engine (rules, cooldown, identity)
│   └── socket-handler.js # WebSocket event handlers
└── client/
    ├── package.json      # Client dependencies
    ├── vite.config.js    # Vite config with proxy
    ├── index.html        # HTML entry with Google Fonts
    └── src/
        ├── main.jsx      # React entry point
        ├── App.jsx       # Root component
        ├── styles/
        │   └── index.css # Premium dark theme
        ├── hooks/
        │   ├── useSocket.js # Socket.IO connection hook
        │   └── useGrid.js   # Grid state management
        └── components/
            ├── Grid.jsx        # Canvas grid with pan/zoom
            ├── Minimap.jsx     # Grid overview
            ├── Header.jsx      # App header
            ├── Leaderboard.jsx # Live rankings
            └── UserPanel.jsx   # User stats & cell info
```

## 📝 License

MIT
