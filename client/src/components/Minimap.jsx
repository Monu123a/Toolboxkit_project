import { useRef, useEffect } from 'react';

const MINIMAP_SIZE = 160;

export function Minimap({ grid, gridSize }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_SIZE * dpr;
    canvas.height = MINIMAP_SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellW = MINIMAP_SIZE / gridSize.cols;
    const cellH = MINIMAP_SIZE / gridSize.rows;

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw cells
    for (let r = 0; r < gridSize.rows; r++) {
      for (let c = 0; c < gridSize.cols; c++) {
        const cell = grid.get(`${r},${c}`);
        if (cell && cell.owner_id) {
          ctx.fillStyle = cell.owner_color;
        } else {
          ctx.fillStyle = '#1a1f35';
        }
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
  }, [grid, gridSize]);

  if (!grid) return null;

  return (
    <div className="minimap-container">
      <div className="minimap-label">MINIMAP</div>
      <canvas
        ref={canvasRef}
        style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE, borderRadius: 4 }}
      />
    </div>
  );
}
