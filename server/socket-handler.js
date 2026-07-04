const { nanoid } = require('nanoid');

/**
 * Set up Socket.IO event handlers for the GridWars game.
 * @param {import('socket.io').Server} io
 * @param {object} db - Database module
 * @param {object} game - Game engine module
 */
function setupSocketHandlers(io, db, game) {
  let onlineCount = 0;

  io.on('connection', (socket) => {
    try {
      onlineCount++;

      // Generate identity and create user in DB
      let identity = game.generateUserIdentity();
      const userId = nanoid();
      const user = db.createUser(userId, identity.name, identity.color);

      // Store userId on socket for later reference
      socket.userId = userId;

      console.log(`[Socket] ${identity.name} connected (${userId}) — ${onlineCount} online`);

      // Send initial state to the connected client
      socket.emit('init', {
        user: { id: userId, name: identity.name, color: identity.color },
        grid: db.getFullGrid(),
        onlineCount,
        gridSize: { rows: game.GRID_ROWS, cols: game.GRID_COLS },
      });

      // Broadcast to all clients that a new user joined
      io.emit('user-joined', { onlineCount });

      // Handle cell claim requests
      socket.on('claim-cell', (data) => {
        try {
          const { row, col } = data;

          // Validate bounds
          if (
            typeof row !== 'number' || typeof col !== 'number' ||
            row < 0 || row >= game.GRID_ROWS ||
            col < 0 || col >= game.GRID_COLS
          ) {
            socket.emit('claim-result', {
              success: false,
              reason: 'Invalid cell coordinates',
            });
            return;
          }

          // Get user from DB and check cooldown
          const dbUser = db.getUser(userId);
          if (!dbUser) {
            socket.emit('claim-result', {
              success: false,
              reason: 'User not found',
            });
            return;
          }

          if (!game.canClaim(dbUser.last_claim_at)) {
            const remaining = game.getCooldownRemaining(dbUser.last_claim_at);
            socket.emit('claim-result', {
              success: false,
              reason: 'Cooldown active',
              cooldownRemaining: remaining,
            });
            return;
          }

          // Claim the cell
          const updatedCell = db.claimCell(row, col, userId, identity.name, identity.color);
          const newScore = db.getUserScore(userId);

          // Broadcast cell claim to all clients
          io.emit('cell-claimed', {
            row,
            col,
            ownerId: userId,
            ownerName: identity.name,
            ownerColor: identity.color,
            claimedAt: updatedCell.claimed_at,
          });

          // Send success result to the claiming client
          socket.emit('claim-result', {
            success: true,
            score: newScore,
            cell: { row, col },
          });
        } catch (err) {
          console.error('[Socket] Error handling claim-cell:', err);
          socket.emit('claim-result', {
            success: false,
            reason: 'Server error',
          });
        }
      });

      // Handle leaderboard requests
      socket.on('get-leaderboard', () => {
        try {
          const leaderboard = db.getLeaderboard();
          socket.emit('leaderboard', leaderboard);
        } catch (err) {
          console.error('[Socket] Error fetching leaderboard:', err);
          socket.emit('leaderboard', []);
        }
      });

      // Handle username update requests
      socket.on('update-name', (newName) => {
        try {
          if (typeof newName !== 'string' || newName.trim().length === 0 || newName.length > 20) {
            socket.emit('update-name-result', { success: false, reason: 'Invalid name' });
            return;
          }
          const trimmedName = newName.trim();
          db.updateUserName(userId, trimmedName);
          identity.name = trimmedName;

          // Broadcast to everyone that a user updated their name
          io.emit('user-updated', { id: userId, name: trimmedName });
          
          socket.emit('update-name-result', { success: true, name: trimmedName });
          
          // Broadcast updated leaderboard
          io.emit('leaderboard', db.getLeaderboard());
        } catch (err) {
          console.error('[Socket] Error updating name:', err);
          socket.emit('update-name-result', { success: false, reason: 'Server error' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        try {
          onlineCount = Math.max(0, onlineCount - 1);
          console.log(`[Socket] ${identity.name} disconnected — ${onlineCount} online`);
          io.emit('user-left', { onlineCount });
        } catch (err) {
          console.error('[Socket] Error handling disconnect:', err);
        }
      });
    } catch (err) {
      console.error('[Socket] Error during connection setup:', err);
    }
  });
}

module.exports = { setupSocketHandlers };
