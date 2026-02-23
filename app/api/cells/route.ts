import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "cells.json");

interface Cell {
  id: string; // "row-col"
  row: number;
  col: number;
  name: string;
  color: string;
  description?: string;
  url?: string;
  claimedAt: string;
}

function readCells(): Cell[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCells(cells: Cell[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(cells, null, 2));
}

export async function GET() {
  const cells = readCells();
  return NextResponse.json({ cells, total: 2500 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { row, col, name, color, description, url } = body;

  if (row == null || col == null || !name || !color) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (row < 0 || row >= 50 || col < 0 || col >= 50) {
    return NextResponse.json({ error: "Invalid cell position" }, { status: 400 });
  }

  if (name.length > 30) {
    return NextResponse.json({ error: "Name too long (max 30)" }, { status: 400 });
  }

  const cells = readCells();
  const id = `${row}-${col}`;

  if (cells.find((c) => c.id === id)) {
    return NextResponse.json({ error: "Cell already claimed" }, { status: 409 });
  }

  const cell: Cell = {
    id,
    row,
    col,
    name: name.trim(),
    color,
    description: description?.trim() || undefined,
    url: url?.trim() || undefined,
    claimedAt: new Date().toISOString(),
  };

  cells.push(cell);
  writeCells(cells);

  return NextResponse.json({ cell }, { status: 201 });
}
