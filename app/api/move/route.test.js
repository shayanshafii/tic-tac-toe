import { describe, it, expect } from 'vitest'
import { POST } from './route.js'

function makeRequest(board) {
  return new Request('http://localhost/api/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board }),
  })
}

describe('POST /api/move', () => {
  it('returns a valid move when X opens in center (index 4)', async () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const res = await POST(makeRequest(board))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.index).toBeGreaterThanOrEqual(0)
    expect(data.index).toBeLessThanOrEqual(8)
    expect(board[data.index]).toBe('')
  })

  it('returns a valid move for an empty board with X in corner', async () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const res = await POST(makeRequest(board))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.index).toBeGreaterThanOrEqual(0)
    expect(board[data.index]).toBe('')
  })

  it('returns 400 for an invalid board', async () => {
    const res = await POST(makeRequest([1, 2, 3]))
    expect(res.status).toBe(400)
  })
})
