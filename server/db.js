const Database = require('better-sqlite3');
const path = require('path');

const ROWS = 40;
const COLS = 40;

let db;

function initDB() {
  db = new Database(path.join(__dirname, 'gridwars.db'));

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      last_claim_at INTEGER DEFAULT 0,
      connected_at INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cells (
      id INTEGER PRIMARY KEY,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      owner_id TEXT,
      owner_name TEXT,
      owner_color TEXT,
      claimed_at INTEGER
    )
  `);

  // Initialize all 1600 cells (40x40) on first run
  const insertCell = db.prepare(
    'INSERT OR IGNORE INTO cells (id, row, col) VALUES (?, ?, ?)'
  );

  const insertMany = db.transaction(() => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        insertCell.run(r * COLS + c, r, c);
      }
    }
  });

  insertMany();

  console.log('[DB] Database initialized with WAL mode');
  return db;
}

function getFullGrid() {
  const rows = db.prepare('SELECT * FROM cells ORDER BY id').all();
  return rows;
}

function getCell(row, col) {
  return db.prepare('SELECT * FROM cells WHERE row = ? AND col = ?').get(row, col);
}

function claimCell(row, col, userId, userName, userColor) {
  const cellId = row * COLS + col;
  const now = Date.now();

  // Get the previous owner to adjust scores
  const previousCell = db.prepare('SELECT owner_id FROM cells WHERE id = ?').get(cellId);

  const updateTransaction = db.transaction(() => {
    // Update the cell
    db.prepare(`
      UPDATE cells
      SET owner_id = ?, owner_name = ?, owner_color = ?, claimed_at = ?
      WHERE id = ?
    `).run(userId, userName, userColor, now, cellId);

    // Decrement previous owner's score if there was one (and it's not the same user)
    if (previousCell && previousCell.owner_id && previousCell.owner_id !== userId) {
      db.prepare('UPDATE users SET score = MAX(0, score - 1) WHERE id = ?').run(previousCell.owner_id);
    }

    // Increment new owner's score (only if claiming from someone else or unclaimed)
    if (!previousCell || !previousCell.owner_id || previousCell.owner_id !== userId) {
      db.prepare('UPDATE users SET score = score + 1 WHERE id = ?').run(userId);
    }

    // Update last claim time
    db.prepare('UPDATE users SET last_claim_at = ? WHERE id = ?').run(now, userId);
  });

  updateTransaction();

  return db.prepare('SELECT * FROM cells WHERE id = ?').get(cellId);
}

function createUser(id, name, color) {
  const now = Date.now();
  db.prepare(
    'INSERT INTO users (id, name, color, score, last_claim_at, connected_at) VALUES (?, ?, ?, 0, 0, ?)'
  ).run(id, name, color, now);
  return { id, name, color, score: 0, last_claim_at: 0, connected_at: now };
}

function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getLeaderboard(limit = 10) {
  return db.prepare(
    'SELECT id, name, color, score FROM users WHERE score > 0 ORDER BY score DESC LIMIT ?'
  ).all(limit);
}

function getUserScore(userId) {
  const user = db.prepare('SELECT score FROM users WHERE id = ?').get(userId);
  return user ? user.score : 0;
}

module.exports = {
  initDB,
  getFullGrid,
  getCell,
  claimCell,
  createUser,
  getUser,
  getLeaderboard,
  getUserScore,
  ROWS,
  COLS,
};
