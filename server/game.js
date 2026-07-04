const GRID_ROWS = 40;
const GRID_COLS = 40;
const COOLDOWN_MS = 500;

// 30+ vibrant colors for user identity
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
  '#A3E4D7', '#FAD7A0', '#A9CCE3', '#D5F5E3', '#FADBD8',
  '#E8DAEF', '#D6EAF8', '#FCF3CF', '#D4EFDF', '#FDEDEC',
  '#EAF2F8', '#FEF9E7', '#E9F7EF', '#F5EEF8', '#EBF5FB',
];

// Fun name combos: adjective + animal
const ADJECTIVES = [
  'Cosmic', 'Neon', 'Quantum', 'Shadow', 'Turbo',
  'Pixel', 'Cyber', 'Solar', 'Thunder', 'Crystal',
  'Blazing', 'Frozen', 'Golden', 'Silver', 'Phantom',
  'Mystic', 'Atomic', 'Laser', 'Hyper', 'Ultra',
];

const ANIMALS = [
  'Fox', 'Tiger', 'Panda', 'Wolf', 'Eagle',
  'Shark', 'Dragon', 'Phoenix', 'Falcon', 'Bear',
  'Cobra', 'Hawk', 'Lion', 'Panther', 'Raven',
  'Viper', 'Lynx', 'Owl', 'Stag', 'Mantis',
];

/**
 * Generate a random user identity with a fun name and vibrant color.
 * @returns {{ name: string, color: string }}
 */
function generateUserIdentity() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  return {
    name: `${adjective} ${animal}`,
    color,
  };
}

/**
 * Check if a user can claim a cell based on cooldown.
 * @param {number} lastClaimAt - Timestamp of the user's last claim
 * @returns {boolean}
 */
function canClaim(lastClaimAt) {
  return Date.now() - lastClaimAt >= COOLDOWN_MS;
}

/**
 * Get the remaining cooldown time in milliseconds.
 * @param {number} lastClaimAt - Timestamp of the user's last claim
 * @returns {number}
 */
function getCooldownRemaining(lastClaimAt) {
  return Math.max(0, COOLDOWN_MS - (Date.now() - lastClaimAt));
}

module.exports = {
  GRID_ROWS,
  GRID_COLS,
  COOLDOWN_MS,
  COLORS,
  ADJECTIVES,
  ANIMALS,
  generateUserIdentity,
  canClaim,
  getCooldownRemaining,
};
