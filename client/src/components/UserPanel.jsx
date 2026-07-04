export function UserPanel({ user, score, hoveredCell, cooldownRemaining }) {
  if (!user) return null;

  return (
    <div className="panel">
      <h3 className="panel-title">Your Territory</h3>
      <div className="user-info">
        <span
          className="color-dot large"
          style={{ backgroundColor: user.color, width: 24, height: 24 }}
        />
        <div>
          <div className="user-name">{user.name}</div>
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
