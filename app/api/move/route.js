import { NextResponse } from 'next/server'
import { getBestMove } from './move.js'

export async function POST(request) {
  try {
    const data = await request.json()
    const board = data.board

    if (!Array.isArray(board) || board.length !== 9) {
      return NextResponse.json({ error: 'Invalid board' }, { status: 400 })
    }

    const boardCopy = [...board]
    const index = getBestMove(boardCopy)

    return NextResponse.json({ index })
  } catch (e) {
    throw e
  }
}
