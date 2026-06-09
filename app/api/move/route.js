import { NextResponse } from 'next/server'
import { getBestMove } from './logic.js'

const VALID_CELLS = new Set(['', 'X', 'O'])

export async function POST(request) {
  let data
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const board = data?.board

  if (
    !Array.isArray(board) ||
    board.length !== 9 ||
    !board.every((cell) => VALID_CELLS.has(cell))
  ) {
    return NextResponse.json({ error: 'Invalid board' }, { status: 400 })
  }

  if (!board.includes('')) {
    return NextResponse.json({ error: 'No legal moves available' }, { status: 400 })
  }

  const boardCopy = [...board]
  const index = getBestMove(boardCopy)

  return NextResponse.json({ index })
}
