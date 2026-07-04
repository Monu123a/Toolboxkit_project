import { useRef, useEffect, useState, useCallback } from 'react';

const BASE_CELL_SIZE = 18;

export function Grid({ grid, gridSize, onCellClick, onCellHover, userColor, recentClaims }) {
  const canvasRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hoveredPos, setHoveredPos] = useState(null);
  const animFrameRef = useRef(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const { rows, cols } = gridSize;

  // Center grid on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const gridWidth = cols * BASE_CELL_SIZE;
    const gridHeight = rows * BASE_CELL_SIZE;
    setTransform({
      x: (rect.width - gridWidth) / 2,
      y: (rect.height - gridHeight) / 2,
      scale: 1,
    });
  }, [rows, cols]);

  // Convert screen coords to grid coords
  const screenToGrid = useCallback((screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    const t = transformRef.current;
    const gridX = (x - t.x) / t.scale;
    const gridY = (y - t.y) / t.scale;
    const col = Math.floor(gridX / BASE_CELL_SIZE);
    const row = Math.floor(gridY / BASE_CELL_SIZE);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col };
    }
    return null;
  }, [rows, cols]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const t = transformRef.current;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      const cellSize = BASE_CELL_SIZE;

      // Draw cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid.get(`${r},${c}`);
          const x = c * cellSize;
          const y = r * cellSize;

          if (cell && cell.owner_id) {
            ctx.fillStyle = cell.owner_color;
          } else {
            ctx.fillStyle = '#e2e8f0';
          }
          ctx.fillRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
        }
      }

      // Draw grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(cols * cellSize, r * cellSize);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, rows * cellSize);
        ctx.stroke();
      }

      // Draw hover highlight
      if (hoveredPos) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          hoveredPos.col * cellSize + 1,
          hoveredPos.row * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      }

      // Draw recent claim animations (ripple effect)
      const now = Date.now();
      recentClaims?.forEach(claim => {
        const [cr, cc] = claim.key.split(',').map(Number);
        const elapsed = now - claim.time;
        const progress = Math.min(elapsed / 800, 1);
        const alpha = 1 - progress;
        const expand = progress * 8;
        ctx.strokeStyle = claim.color + Math.round(alpha * 80).toString(16).padStart(2, '0');
        ctx.lineWidth = 2 * (1 - progress);
        ctx.strokeRect(
          cc * cellSize - expand,
          cr * cellSize - expand,
          cellSize + expand * 2,
          cellSize + expand * 2
        );
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [grid, rows, cols, hoveredPos, recentClaims]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(false);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragStart) {
      const dx = Math.abs(e.clientX - dragStart.x - transform.x);
      const dy = Math.abs(e.clientY - dragStart.y - transform.y);
      if (dx > 3 || dy > 3) {
        setIsDragging(true);
        setTransform(prev => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }));
      }
    }
    const pos = screenToGrid(e.clientX, e.clientY);
    setHoveredPos(pos);
    if (pos && grid) {
      const cell = grid.get(`${pos.row},${pos.col}`);
      onCellHover?.(cell || { row: pos.row, col: pos.col });
    } else {
      onCellHover?.(null);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDragging && dragStart) {
      const pos = screenToGrid(e.clientX, e.clientY);
      if (pos) {
        onCellClick?.(pos.row, pos.col);
      }
    }
    setDragStart(null);
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * zoom, 0.3), 4);
      const scaleChange = newScale / prev.scale;
      return {
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange,
        scale: newScale,
      };
    });
  };

  const handleMouseLeave = () => {
    setHoveredPos(null);
    setDragStart(null);
    onCellHover?.(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`grid-canvas ${isDragging ? 'grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onMouseLeave={handleMouseLeave}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
