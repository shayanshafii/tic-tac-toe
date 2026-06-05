import { NextResponse } from 'next/server'
import { getBestMove } from './engine.js'

export async function POST(request) {
  let data
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const board = data?.board

    const isValidBoard =
      Array.isArray(board) &&
      board.length === 9 &&
      board.every((cell) => cell === '' || cell === 'X' || cell === 'O')

    if (!isValidBoard) {
      return NextResponse.json({ error: 'Invalid board' }, { status: 400 })
    }

    const index = getBestMove([...board])

    if (index < 0) {
      return NextResponse.json({ error: 'No moves available' }, { status: 400 })
    }

    return NextResponse.json({ index })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
