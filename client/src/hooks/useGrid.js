import { useState, useEffect, useCallback, useRef } from 'react';

export function useGrid({ on, emit, onInit, user }) {
  const [grid, setGrid] = useState(null);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [score, setScore] = useState(0);
  const [recentClaims, setRecentClaims] = useState([]);

  // Initialize grid from server data
  useEffect(() => {
    onInit((data) => {
      const gridMap = new Map();
      data.grid.forEach(cell => {
        gridMap.set(`${cell.row},${cell.col}`, cell);
      });
      setGrid(gridMap);
      // Calculate initial score
      if (data.user) {
        let s = 0;
        data.grid.forEach(cell => {
          if (cell.owner_id === data.user.id) s++;
        });
        setScore(s);
      }
    });
  }, [onInit]);

  // Listen for cell claims from other users
  useEffect(() => {
    const unsub = on('cell-claimed', (data) => {
      setGrid(prev => {
        if (!prev) return prev;
        const newGrid = new Map(prev);
        newGrid.set(`${data.row},${data.col}`, {
          row: data.row,
          col: data.col,
          owner_id: data.ownerId,
          owner_name: data.ownerName,
          owner_color: data.ownerColor,
        });
        return newGrid;
      });
      // Track recent claims for animation
      const claimKey = `${data.row},${data.col}`;
      setRecentClaims(prev => [...prev, { key: claimKey, time: Date.now(), color: data.ownerColor }]);
      setTimeout(() => {
        setRecentClaims(prev => prev.filter(c => c.key !== claimKey));
      }, 800);
    });
    return unsub;
  }, [on]);

  // Listen for claim results
  useEffect(() => {
    const unsub = on('claim-result', (data) => {
      if (data.success) {
        setScore(data.score);
        setCooldownEnd(Date.now() + (data.cooldownRemaining || 500));
      }
    });
    return unsub;
  }, [on]);

  // Listen for user updates
  useEffect(() => {
    const unsub = on('user-updated', (data) => {
      setGrid(prev => {
        if (!prev) return prev;
        const newGrid = new Map(prev);
        newGrid.forEach((cell, key) => {
          if (cell.owner_id === data.id) {
            newGrid.set(key, { ...cell, owner_name: data.name });
          }
        });
        return newGrid;
      });
      
      setHoveredCell(prev => {
        if (prev && prev.owner_id === data.id) {
          return { ...prev, owner_name: data.name };
        }
        return prev;
      });
    });
    return unsub;
  }, [on]);

  // Cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, cooldownEnd - Date.now());
      setCooldownRemaining(remaining);
    }, 50);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const claimCell = useCallback((row, col) => {
    if (cooldownRemaining > 0) return;
    if (!user) return;
    emit('claim-cell', { row, col });
    // Optimistic update
    setGrid(prev => {
      if (!prev) return prev;
      const newGrid = new Map(prev);
      newGrid.set(`${row},${col}`, {
        row, col,
        owner_id: user.id,
        owner_name: user.name,
        owner_color: user.color,
      });
      return newGrid;
    });
    setCooldownEnd(Date.now() + 500);
  }, [emit, user, cooldownRemaining]);

  return { grid, claimCell, cooldownRemaining, hoveredCell, setHoveredCell, score, recentClaims };
}
