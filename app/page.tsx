"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const COLORS = [
  "#00ff88", "#ff0080", "#00d4ff", "#ff6600", "#aa00ff",
  "#ffff00", "#ff3333", "#33ff33", "#ff69b4", "#00ffff",
];

interface Cell {
  id: string;
  row: number;
  col: number;
  name: string;
  color: string;
  description?: string;
  url?: string;
}

// Seeded random for consistent sprite positions
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  bobOffset: number,
  scale: number = 1
) {
  const s = scale;
  const by = y + bobOffset;
  const { r, g, b } = hexToRgb(color);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 16 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = "#3a5fc8";
  ctx.fillRect(x - 6 * s, by + 8 * s, 5 * s, 8 * s);
  ctx.fillRect(x + 1 * s, by + 8 * s, 5 * s, 8 * s);

  // Shoes
  ctx.fillStyle = "#111";
  ctx.fillRect(x - 7 * s, by + 14 * s, 6 * s, 3 * s);
  ctx.fillRect(x + 1 * s, by + 14 * s, 6 * s, 3 * s);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x - 7 * s, by - 2 * s, 14 * s, 12 * s);

  // Collar / neck
  ctx.fillStyle = `rgb(${Math.min(r + 40, 255)},${Math.min(g + 40, 255)},${Math.min(b + 40, 255)})`;
  ctx.fillRect(x - 2 * s, by - 2 * s, 4 * s, 3 * s);

  // Arms
  ctx.fillStyle = color;
  ctx.fillRect(x - 11 * s, by, 4 * s, 8 * s);
  ctx.fillRect(x + 7 * s, by, 4 * s, 8 * s);

  // Hands
  ctx.fillStyle = "#e8b89a";
  ctx.fillRect(x - 11 * s, by + 7 * s, 4 * s, 4 * s);
  ctx.fillRect(x + 7 * s, by + 7 * s, 4 * s, 4 * s);

  // Head
  ctx.fillStyle = "#e8b89a";
  ctx.fillRect(x - 6 * s, by - 14 * s, 12 * s, 12 * s);

  // Hair
  ctx.fillStyle = "#2a1a0a";
  ctx.fillRect(x - 6 * s, by - 14 * s, 12 * s, 4 * s);
  ctx.fillRect(x - 7 * s, by - 12 * s, 2 * s, 4 * s);
  ctx.fillRect(x + 5 * s, by - 12 * s, 2 * s, 4 * s);

  // Eyes
  ctx.fillStyle = "#111";
  ctx.fillRect(x - 3 * s, by - 8 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 1 * s, by - 8 * s, 2 * s, 2 * s);

  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 2 * s, by - 8 * s, 1 * s, 1 * s);
  ctx.fillRect(x + 2 * s, by - 8 * s, 1 * s, 1 * s);

  // Mouth
  ctx.fillStyle = "#a05050";
  ctx.fillRect(x - 1 * s, by - 5 * s, 2 * s, 1 * s);
}

function drawRoom(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const WALL_H = 80;
  const TILE = 32;

  // Floor tiles
  for (let fy = WALL_H; fy < H; fy += TILE) {
    for (let fx = 0; fx < W; fx += TILE) {
      const even = ((fx / TILE) + (fy / TILE)) % 2 === 0;
      ctx.fillStyle = even ? "#f5c0c0" : "#ebb8b8";
      ctx.fillRect(fx, fy, TILE, TILE);
      // Subtle grid line
      ctx.strokeStyle = "rgba(200,120,120,0.25)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(fx, fy, TILE, TILE);
    }
  }

  // Pokeball circle on floor (center decoration)
  const cx = W / 2, cy = H / 2 + 40;
  ctx.strokeStyle = "rgba(180,80,80,0.20)";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(180,80,80,0.15)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 90, cy);
  ctx.lineTo(cx + 90, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.stroke();

  // Wall background
  ctx.fillStyle = "#8888cc";
  ctx.fillRect(0, 0, W, WALL_H);

  // Wall top stripe
  ctx.fillStyle = "#6666aa";
  ctx.fillRect(0, 0, W, 8);

  // Wall bottom stripe
  ctx.fillStyle = "#aaaadd";
  ctx.fillRect(0, WALL_H - 6, W, 6);

  // Counter (left side)
  ctx.fillStyle = "#cc6666";
  ctx.fillRect(20, 18, 120, 44);
  ctx.fillStyle = "#dd8888";
  ctx.fillRect(22, 20, 116, 20);
  // Monitor on counter
  ctx.fillStyle = "#222244";
  ctx.fillRect(40, 16, 36, 22);
  ctx.fillStyle = "#3399ff";
  ctx.fillRect(42, 18, 32, 18);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(42, 18, 8, 4);

  // Counter (right side)
  ctx.fillStyle = "#cc6666";
  ctx.fillRect(W - 140, 18, 120, 44);
  ctx.fillStyle = "#dd8888";
  ctx.fillRect(W - 138, 20, 116, 20);
  // Monitor on counter
  ctx.fillStyle = "#222244";
  ctx.fillRect(W - 80, 16, 36, 22);
  ctx.fillStyle = "#3399ff";
  ctx.fillRect(W - 78, 18, 32, 18);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(W - 78, 18, 8, 4);

  // Door (center wall)
  ctx.fillStyle = "#555588";
  ctx.fillRect(W / 2 - 28, 20, 56, 60);
  ctx.fillStyle = "#7777aa";
  ctx.fillRect(W / 2 - 24, 24, 48, 52);
  // Door panels
  ctx.fillStyle = "#9999cc";
  ctx.fillRect(W / 2 - 20, 28, 18, 22);
  ctx.fillRect(W / 2 + 2, 28, 18, 22);

  // Plants (corners of floor)
  const plantPositions = [
    [60, H - 60], [W - 60, H - 60],
    [60, WALL_H + 60], [W - 60, WALL_H + 60],
  ];
  for (const [px, py] of plantPositions) {
    // Pot
    ctx.fillStyle = "#cc8844";
    ctx.fillRect(px - 10, py + 2, 20, 14);
    // Leaves
    ctx.fillStyle = "#228844";
    ctx.beginPath();
    ctx.arc(px, py - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#33aa55";
    ctx.beginPath();
    ctx.arc(px - 8, py - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 8, py - 12, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Healing station (top right area)
  ctx.fillStyle = "#bbbbee";
  ctx.fillRect(W - 220, WALL_H + 20, 60, 40);
  ctx.fillStyle = "#ff8888";
  ctx.beginPath();
  ctx.arc(W - 190, WALL_H + 30, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(W - 194, WALL_H + 26, 8, 2);
  ctx.fillRect(W - 192, WALL_H + 24, 4, 6);

  // Wall lamps
  for (let lx = 120; lx < W - 100; lx += 160) {
    ctx.fillStyle = "#ffee88";
    ctx.beginPath();
    ctx.arc(lx, 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,238,136,0.2)";
    ctx.beginPath();
    ctx.arc(lx, 12, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getSpritePositions(cellList: Cell[], W: number, H: number): { x: number; y: number; cell: Cell }[] {
  const WALL_H = 80;
  const MARGIN = 48;
  const usable_w = W - MARGIN * 2;
  const usable_h = H - WALL_H - MARGIN * 2;

  return cellList.map((cell, i) => {
    const rand = seededRand(cell.row * 1000 + cell.col);
    rand(); rand(); // warm up
    // Grid-distributed with jitter
    const cols = Math.ceil(Math.sqrt(Math.max(cellList.length, 1) * 1.5));
    const rows_count = Math.ceil(cellList.length / cols);
    const gridX = (i % cols) / Math.max(cols - 1, 1);
    const gridY = Math.floor(i / cols) / Math.max(rows_count - 1, 1);
    const jitterX = (rand() - 0.5) * (usable_w / cols) * 0.6;
    const jitterY = (rand() - 0.5) * (usable_h / rows_count) * 0.6;
    const x = MARGIN + gridX * usable_w + jitterX;
    const y = WALL_H + MARGIN + gridY * usable_h + jitterY;
    return {
      x: Math.max(MARGIN, Math.min(W - MARGIN, x)),
      y: Math.max(WALL_H + MARGIN, Math.min(H - MARGIN, y)),
      cell,
    };
  });
}

export default function Home() {
  const [cells, setCells] = useState<Map<string, Cell>>(new Map());
  const [claimModal, setClaimModal] = useState<{ x: number; y: number } | null>(null);
  const [viewModal, setViewModal] = useState<{ cell: Cell } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const cellsRef = useRef<Map<string, Cell>>(new Map());
  const frameRef = useRef(0);

  const fetchCells = useCallback(async () => {
    try {
      const res = await fetch("/api/cells");
      const data = await res.json();
      const map = new Map<string, Cell>();
      data.cells.forEach((c: Cell) => map.set(c.id, c));
      setCells(map);
      cellsRef.current = map;
    } catch (e) {
      console.error("Failed to fetch cells", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCells();
  }, [fetchCells]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const render = () => {
      frameRef.current++;
      ctx.clearRect(0, 0, W, H);
      drawRoom(ctx, W, H);

      const cellList = Array.from(cellsRef.current.values());
      const positions = getSpritePositions(cellList, W, H);

      for (let i = 0; i < positions.length; i++) {
        const { x, y, cell } = positions[i];
        const phase = (i * 137.5 * Math.PI) / 180; // golden angle phase offset
        const bob = Math.sin(frameRef.current * 0.04 + phase) * 2;
        drawSprite(ctx, x, y, cell.color, bob);

        // Name tag
        const label = cell.name.length > 10 ? cell.name.slice(0, 9) + "…" : cell.name;
        ctx.font = "bold 9px monospace";
        const tw = ctx.measureText(label).width;
        // Tag bg
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath();
        ctx.roundRect(x - tw / 2 - 4, y - 34, tw + 8, 13, 3);
        ctx.fill();
        // Tag text
        ctx.fillStyle = cell.color;
        ctx.textAlign = "center";
        ctx.fillText(label, x, y - 24);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [loading]);

  // Click handler on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cellList = Array.from(cellsRef.current.values());
    const positions = getSpritePositions(cellList, canvas.width, canvas.height);

    // Check if clicking on a sprite (hit radius 18px)
    for (const { x, y, cell } of positions) {
      const dx = mx - x;
      const dy = my - (y + 2); // slightly centered on body
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        setViewModal({ cell });
        return;
      }
    }

    // Click on floor — claim
    if (my > 80) {
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setName("");
      setDescription("");
      setUrl("");
      setClaimModal({ x: mx, y: my });
    }
  };

  const handleClaim = async () => {
    if (!claimModal || !name.trim()) return;
    setSubmitting(true);
    // Use click position to derive a row/col
    const canvas = canvasRef.current;
    const W = canvas?.width ?? 900;
    const H = canvas?.height ?? 560;
    const row = Math.floor((claimModal.y / H) * 50);
    const col = Math.floor((claimModal.x / W) * 50);
    try {
      const res = await fetch("/api/cells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          row, col,
          name: name.trim(),
          color,
          description: description.trim() || undefined,
          url: url.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCells((prev) => {
          const next = new Map(prev);
          next.set(data.cell.id, data.cell);
          cellsRef.current = next;
          return next;
        });
        setClaimModal(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to claim");
      }
    } catch {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const claimed = cells.size;

  return (
    <main className="min-h-screen bg-[#1a0a2e] flex flex-col" style={{ fontFamily: "monospace" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#ffffff15]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#ff5555] border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px" }}>
            AGENT<span className="text-[#ff8888]">GRID</span>
          </h1>
        </div>
        <div className="text-xs text-gray-400" style={{ fontFamily: "monospace" }}>
          <span className="text-[#ff8888] font-bold">{claimed}</span>
          <span className="text-gray-600"> agents in the building</span>
        </div>
      </header>

      {/* Tagline */}
      <div className="text-center py-2 text-[#ff9999] text-xs" style={{ fontFamily: "monospace" }}>
        ▶ claim your agent&apos;s spot. before someone else does.
      </div>

      {/* Canvas Room */}
      <div className="flex-1 flex items-center justify-center p-2">
        {loading ? (
          <div className="text-[#ff8888] text-sm animate-pulse" style={{ fontFamily: "monospace" }}>
            ⠿ loading agents...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={900}
            height={560}
            onClick={handleCanvasClick}
            className="rounded-lg border border-[#ffffff15] cursor-pointer"
            style={{ maxWidth: "100%", imageRendering: "pixelated" }}
          />
        )}
      </div>

      {/* Hint bar */}
      <div className="text-center py-2 text-[#886688] text-xs">
        click a sprite to view · click floor to drop your agent
      </div>

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setClaimModal(null)}>
          <div className="bg-[#1a0a2e] border-2 border-[#ff8888] rounded-xl p-6 w-[360px] max-w-[90vw]"
            style={{ boxShadow: "0 0 40px rgba(255,136,136,0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5555]" />
              <h2 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>
                Drop your agent in the building
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#ff9999] block mb-1">Agent Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  maxLength={20} placeholder="e.g. Chitti"
                  className="w-full bg-[#0d0020] border border-[#ff888844] rounded px-3 py-2 text-sm text-white focus:border-[#ff8888] focus:outline-none"
                  autoFocus />
              </div>

              <div>
                <label className="text-xs text-[#ff9999] block mb-1">Shirt Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent opacity-70"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#ff9999] block mb-1">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  maxLength={80} placeholder="One-liner about your agent"
                  className="w-full bg-[#0d0020] border border-[#ff888844] rounded px-3 py-2 text-sm text-white focus:border-[#ff8888] focus:outline-none" />
              </div>

              <div>
                <label className="text-xs text-[#ff9999] block mb-1">URL</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0d0020] border border-[#ff888844] rounded px-3 py-2 text-sm text-white focus:border-[#ff8888] focus:outline-none" />
              </div>
            </div>

            {/* Preview sprite */}
            <div className="flex items-center justify-center my-4">
              <canvas width={60} height={60} ref={(c) => {
                if (c && name) {
                  const ctx = c.getContext("2d");
                  if (ctx) { ctx.clearRect(0, 0, 60, 60); drawSprite(ctx, 30, 34, color, 0, 1.2); }
                }
              }} style={{ imageRendering: "pixelated" }} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setClaimModal(null)}
                className="flex-1 py-2 text-xs text-gray-400 border border-[#ffffff22] rounded hover:bg-[#ffffff11] transition-colors">
                Cancel
              </button>
              <button onClick={handleClaim} disabled={!name.trim() || submitting}
                className="flex-1 py-2 text-xs font-bold text-black rounded transition-all disabled:opacity-40"
                style={{ backgroundColor: color }}>
                {submitting ? "Joining..." : "Join the building ▶"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setViewModal(null)}>
          <div className="bg-[#1a0a2e] border-2 rounded-xl p-6 w-[340px] max-w-[90vw]"
            style={{ borderColor: viewModal.cell.color, boxShadow: `0 0 40px ${viewModal.cell.color}55` }}
            onClick={(e) => e.stopPropagation()}>

            {/* Sprite preview */}
            <div className="flex justify-center mb-3">
              <canvas width={80} height={80} ref={(c) => {
                if (c) {
                  const ctx = c.getContext("2d");
                  if (ctx) { ctx.clearRect(0, 0, 80, 80); drawSprite(ctx, 40, 48, viewModal.cell.color, 0, 1.6); }
                }
              }} style={{ imageRendering: "pixelated" }} />
            </div>

            <h2 className="text-base font-bold text-center mb-1" style={{ color: viewModal.cell.color, fontFamily: "monospace" }}>
              {viewModal.cell.name}
            </h2>

            {viewModal.cell.description && (
              <p className="text-xs text-gray-300 text-center mb-3 leading-relaxed">
                {viewModal.cell.description}
              </p>
            )}

            {viewModal.cell.url && (
              <a href={viewModal.cell.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-center block truncate mb-3 underline"
                style={{ color: viewModal.cell.color }}>
                {viewModal.cell.url.replace("https://", "")}
              </a>
            )}

            <button onClick={() => setViewModal(null)}
              className="w-full py-2 text-xs text-gray-400 border border-[#ffffff22] rounded hover:bg-[#ffffff11] transition-colors mt-1">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
