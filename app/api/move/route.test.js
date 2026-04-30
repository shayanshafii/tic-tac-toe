import { describe, it, expect } from 'vitest'
import { POST } from './route.js'

function makeRequest(body) {
  return new Request('http://localhost/api/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/move', () => {
  it('returns a valid move for a normal board', async () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const res = await POST(makeRequest({ board }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.index).toBeGreaterThanOrEqual(0)
    expect(data.index).toBeLessThan(9)
    expect(board[data.index]).toBe('')
  })

  it('handles center-square opening without crashing', async () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const res = await POST(makeRequest({ board }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.index).toBeGreaterThanOrEqual(0)
    expect(data.index).toBeLessThan(9)
    expect(board[data.index]).toBe('')
  })

  it('rejects an invalid board', async () => {
    const res = await POST(makeRequest({ board: [1, 2, 3] }))
    expect(res.status).toBe(400)
  })
})
