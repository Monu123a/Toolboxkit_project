import { useState } from 'react';

export function UserPanel({ user, score, hoveredCell, cooldownRemaining, emit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!user) return null;

  const handleEditClick = () => {
    setEditName(user.name);
    setIsEditing(true);
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== user.name) {
      emit('update-name', trimmed.substring(0, 20));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="panel">
      <h3 className="panel-title">Your Territory</h3>
      <div className="user-info">
        <span
          className="color-dot large"
          style={{ backgroundColor: user.color, width: 24, height: 24 }}
        />
        <div>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={20}
                style={{ 
                  background: 'var(--surface-hover)', 
                  border: '1px solid var(--border-hover)', 
                  color: 'var(--text-primary)', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  outline: 'none',
                  width: '140px'
                }}
              />
            </div>
          ) : (
            <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {user.name}
              <button 
                onClick={handleEditClick} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px', fontSize: '0.85rem' }}
                title="Edit name"
              >
                ✎
              </button>
            </div>
          )}
          <div className="user-id">ID: {user.id.slice(0, 8)}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{score}</div>
          <div className="stat-label">Cells Owned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {cooldownRemaining > 0 ? `${(cooldownRemaining / 1000).toFixed(1)}s` : '✓'}
          </div>
          <div className="stat-label">Cooldown</div>
        </div>
      </div>

      <div className="cell-info-section">
        <h4 className="panel-title">Hovered Cell</h4>
        {hoveredCell ? (
          <div className="cell-info">
            <div className="cell-coords">({hoveredCell.row}, {hoveredCell.col})</div>
            {hoveredCell.owner_id ? (
              <div className="cell-owner">
                <span
                  className="color-dot"
                  style={{ backgroundColor: hoveredCell.owner_color, width: 10, height: 10 }}
                />
                <span>{hoveredCell.owner_name}</span>
              </div>
            ) : (
              <div className="cell-unclaimed">Unclaimed — Click to capture!</div>
            )}
          </div>
        ) : (
          <div className="cell-info">
            <div className="cell-unclaimed">Hover over the grid</div>
          </div>
        )}
      </div>
    </div>
  );
}
