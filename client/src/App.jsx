import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGrid } from './hooks/useGrid';
import { Grid } from './components/Grid';
import { Minimap } from './components/Minimap';
import { Header } from './components/Header';
import { Leaderboard } from './components/Leaderboard';
import { UserPanel } from './components/UserPanel';
import './styles/index.css';

function App() {
  const { isConnected, user, onlineCount, gridSize, emit, on, onInit } = useSocket();
  const { grid, claimCell, cooldownRemaining, hoveredCell, setHoveredCell, score, recentClaims } = useGrid({ on, emit, onInit, user });

  const handleCellClick = useCallback((row, col) => {
    claimCell(row, col);
  }, [claimCell]);

  const handleCellHover = useCallback((cell) => {
    setHoveredCell(cell);
  }, [setHoveredCell]);

  return (
    <div className="app">
      <Header
        user={user}
        onlineCount={onlineCount}
        isConnected={isConnected}
        cooldownRemaining={cooldownRemaining}
      />
      <main className="main-content">
        <div className="grid-container">
          <Grid
            grid={grid}
            gridSize={gridSize}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            userColor={user?.color}
            recentClaims={recentClaims}
          />
          <Minimap grid={grid} gridSize={gridSize} />
        </div>
        <aside className="sidebar">
          <UserPanel
            user={user}
            score={score}
            hoveredCell={hoveredCell}
            cooldownRemaining={cooldownRemaining}
          />
          <Leaderboard
            on={on}
            emit={emit}
            userId={user?.id}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
