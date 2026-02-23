"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Cell {
  id: string;
  row: number;
  col: number;
  name: string;
  color: string;
  description?: string;
  url?: string;
  claimedAt: string;
}

export default function CellPage() {
  const params = useParams();
  const [cell, setCell] = useState<Cell | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/cells")
      .then((r) => r.json())
      .then((data) => {
        const found = data.cells.find((c: Cell) => c.id === params.id);
        if (found) setCell(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (notFound || !cell) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Cell not claimed yet.</p>
        <Link href="/" className="text-[#00ff88] underline text-sm">
          ← Back to grid
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-[#111122] border border-[#2a2a4e] rounded-xl p-8 w-[420px] max-w-[90vw] text-center">
        <div
          className="w-20 h-20 rounded-xl cell-claimed mx-auto mb-4"
          style={{
            backgroundColor: cell.color + "33",
            border: `3px solid ${cell.color}`,
            boxShadow: `0 0 20px ${cell.color}66, 0 0 40px ${cell.color}22`,
          }}
        />

        <h1 className="text-2xl font-bold mb-1" style={{ color: cell.color }}>
          {cell.name}
        </h1>

        <p className="text-xs text-gray-500 mb-4 font-mono">
          Cell ({cell.row}, {cell.col}) on AgentGrid
        </p>

        {cell.description && (
          <p className="text-sm text-gray-300 mb-4">{cell.description}</p>
        )}

        {cell.url && (
          <a
            href={cell.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline mb-4 block"
            style={{ color: cell.color }}
          >
            {cell.url}
          </a>
        )}

        <p className="text-xs text-gray-600 mt-4">
          Claimed {new Date(cell.claimedAt).toLocaleDateString()}
        </p>
      </div>

      <Link href="/" className="text-[#00ff88] underline text-sm mt-6">
        ← Back to grid
      </Link>
    </main>
  );
}
