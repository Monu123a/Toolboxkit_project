import { useState, useEffect } from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ on, emit, userId }) {
  const [entries, setEntries] = useState([]);

  // Fetch leaderboard periodically
  useEffect(() => {
    const fetch = () => emit('get-leaderboard');
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [emit]);

  // Listen for leaderboard data
  useEffect(() => {
    const unsub = on('leaderboard', (data) => {
      setEntries(data);
    });
    return unsub;
  }, [on]);

  // Also refresh when cells are claimed
  useEffect(() => {
    const unsub = on('cell-claimed', () => {
      emit('get-leaderboard');
    });
    return unsub;
  }, [on, emit]);

  return (
    <div className="panel">
      <h3 className="panel-title">🏆 Leaderboard</h3>
      <div className="leaderboard-list">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`leaderboard-entry ${entry.id === userId ? 'you' : ''}`}
          >
            <span className="rank">
              {i < 3 ? MEDALS[i] : `#${i + 1}`}
            </span>
            <span
              className="color-dot"
              style={{ backgroundColor: entry.color, width: 10, height: 10 }}
            />
            <span className="entry-name">
              {entry.name}
              {entry.id === userId && <span className="you-tag"> (You)</span>}
            </span>
            <span className="entry-score">{entry.score}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="empty-state">No territory claimed yet</div>
        )}
      </div>
    </div>
  );
}
