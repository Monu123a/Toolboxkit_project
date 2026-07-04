export function Header({ user, onlineCount, isConnected, cooldownRemaining }) {
  const cooldownPercent = Math.min(cooldownRemaining / 500 * 100, 100);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">⚔ GridWars</h1>
      </div>
      <div className="header-center">
        <div className="online-badge">
          <span className="online-dot" />
          <span>{onlineCount} online</span>
        </div>
      </div>
      <div className="header-right">
        {user && (
          <div className="user-badge">
            <span
              className="color-dot"
              style={{ backgroundColor: user.color, width: 12, height: 12 }}
            />
            <span>{user.name}</span>
          </div>
        )}
        <div
          className="connection-dot"
          style={{ backgroundColor: isConnected ? '#10b981' : '#ef4444' }}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>
      {cooldownPercent > 0 && (
        <div className="cooldown-bar">
          <div
            className="cooldown-fill"
            style={{ width: `${cooldownPercent}%` }}
          />
        </div>
      )}
    </header>
  );
}
