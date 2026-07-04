const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const game = require('./game');
const { setupSocketHandlers } = require('./socket-handler');

const PORT = process.env.PORT || 3001;

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    game: {
      gridSize: { rows: game.GRID_ROWS, cols: game.GRID_COLS },
      cooldownMs: game.COOLDOWN_MS,
    },
  });
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize database
db.initDB();

// Setup socket handlers
setupSocketHandlers(io, db, game);

// Serve static client files in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`[Server] Serving static files from ${clientDistPath}`);
}

// Start server
server.listen(PORT, () => {
  console.log(`[Server] GridWars server running on http://localhost:${PORT}`);
  console.log(`[Server] Grid size: ${game.GRID_ROWS}x${game.GRID_COLS}`);
  console.log(`[Server] Cooldown: ${game.COOLDOWN_MS}ms`);
});
