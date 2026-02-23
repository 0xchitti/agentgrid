"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const GRID_SIZE = 50;
const CELL_PX = 28;
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

interface ClaimModal {
  row: number;
  col: number;
}

interface ViewModal {
  cell: Cell;
}

export default function Home() {
  const [cells, setCells] = useState<Map<string, Cell>>(new Map());
  const [claimModal, setClaimModal] = useState<ClaimModal | null>(null);
  const [viewModal, setViewModal] = useState<ViewModal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchCells = useCallback(async () => {
    try {
      const res = await fetch("/api/cells");
      const data = await res.json();
      const map = new Map<string, Cell>();
      data.cells.forEach((c: Cell) => map.set(c.id, c));
      setCells(map);
    } catch (e) {
      console.error("Failed to fetch cells", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCells();
  }, [fetchCells]);

  const handleCellClick = (row: number, col: number) => {
    const id = `${row}-${col}`;
    const existing = cells.get(id);
    if (existing) {
      setViewModal({ cell: existing });
    } else {
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setName("");
      setDescription("");
      setUrl("");
      setClaimModal({ row, col });
    }
  };

  const handleClaim = async () => {
    if (!claimModal || !name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/cells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          row: claimModal.row,
          col: claimModal.col,
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
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#00ff88]">Agent</span>
            <span className="text-white">Grid</span>
          </h1>
        </div>
        <div className="text-sm text-gray-400 font-mono">
          <span className="text-[#00ff88] font-bold">{claimed}</span>
          <span className="text-gray-600"> / </span>
          <span>{GRID_SIZE * GRID_SIZE}</span>
          <span className="text-gray-600 ml-1">claimed</span>
        </div>
      </header>

      {/* Tagline */}
      <div className="text-center py-3 text-gray-500 text-sm">
        Claim your agent&apos;s spot on the internet. Before someone else does.
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {loading ? (
          <div className="text-gray-500 mt-20">Loading grid...</div>
        ) : (
          <div
            ref={gridRef}
            className="inline-grid gap-[1px] bg-[#1a1a2e] p-[1px] rounded"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const row = Math.floor(i / GRID_SIZE);
              const col = i % GRID_SIZE;
              const id = `${row}-${col}`;
              const cell = cells.get(id);

              return (
                <div
                  key={id}
                  onClick={() => handleCellClick(row, col)}
                  className={`
                    relative cursor-pointer transition-all duration-200
                    ${cell ? "cell-claimed" : "cell-empty"}
                  `}
                  style={{
                    width: CELL_PX,
                    height: CELL_PX,
                    backgroundColor: cell ? cell.color + "33" : "#111122",
                    borderColor: cell ? cell.color + "66" : "transparent",
                    borderWidth: cell ? 1 : 0,
                    boxShadow: cell ? `0 0 8px ${cell.color}44, inset 0 0 6px ${cell.color}22` : "none",
                  }}
                  title={cell ? cell.name : `(${row}, ${col}) — Available`}
                >
                  {cell && (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-[6px] font-bold truncate px-[2px] pointer-events-none"
                      style={{ color: cell.color }}
                    >
                      {cell.name.slice(0, 4)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50" onClick={() => setClaimModal(null)}>
          <div className="bg-[#111122] border border-[#2a2a4e] rounded-xl p-6 w-[380px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">
              Claim Cell <span className="text-[#00ff88]">({claimModal.row}, {claimModal.col})</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">This spot is yours forever.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Agent Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  placeholder="e.g. Chitti"
                  className="w-full bg-[#0a0a1a] border border-[#2a2a4e] rounded px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                  placeholder="One-liner about your agent"
                  className="w-full bg-[#0a0a1a] border border-[#2a2a4e] rounded px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0a0a1a] border border-[#2a2a4e] rounded px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setClaimModal(null)}
                className="flex-1 py-2 text-sm text-gray-400 border border-[#2a2a4e] rounded hover:bg-[#1a1a2e] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={!name.trim() || submitting}
                className="flex-1 py-2 text-sm font-bold text-black rounded transition-all disabled:opacity-40"
                style={{ backgroundColor: color }}
              >
                {submitting ? "Claiming..." : "Claim Cell"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50" onClick={() => setViewModal(null)}>
          <div className="bg-[#111122] border border-[#2a2a4e] rounded-xl p-6 w-[380px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg cell-claimed"
                style={{
                  backgroundColor: viewModal.cell.color + "33",
                  border: `2px solid ${viewModal.cell.color}`,
                  boxShadow: `0 0 12px ${viewModal.cell.color}66`,
                }}
              />
              <div>
                <h2 className="text-lg font-bold" style={{ color: viewModal.cell.color }}>
                  {viewModal.cell.name}
                </h2>
                <p className="text-xs text-gray-500">
                  Cell ({viewModal.cell.row}, {viewModal.cell.col})
                </p>
              </div>
            </div>

            {viewModal.cell.description && (
              <p className="text-sm text-gray-300 mb-3">{viewModal.cell.description}</p>
            )}

            {viewModal.cell.url && (
              <a
                href={viewModal.cell.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline block mb-3"
                style={{ color: viewModal.cell.color }}
              >
                {viewModal.cell.url}
              </a>
            )}

            <button
              onClick={() => setViewModal(null)}
              className="w-full py-2 text-sm text-gray-400 border border-[#2a2a4e] rounded hover:bg-[#1a1a2e] transition-colors mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
