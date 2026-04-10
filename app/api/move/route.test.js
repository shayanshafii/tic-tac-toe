import { describe, it, expect } from 'vitest'
import { POST } from './route.js'

function makeRequest(body) {
  return {
    json: async () => body,
  }
}

describe('POST /api/move', () => {
  it('returns a valid move for a center-square opening', async () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const res = await POST(makeRequest({ board }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.index).toBeGreaterThanOrEqual(0)
    expect(data.index).toBeLessThan(9)
    expect(board[data.index]).toBe('')
  })

  it('returns a valid move for a corner opening', async () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const res = await POST(makeRequest({ board }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.index).toBeGreaterThanOrEqual(0)
    expect(data.index).toBeLessThan(9)
    expect(board[data.index]).toBe('')
  })

  it('returns 400 for an invalid board', async () => {
    const res = await POST(makeRequest({ board: [1, 2, 3] }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid board')
  })

  it('always returns a JSON response even on unexpected errors', async () => {
    const badRequest = { json: async () => { throw new Error('bad body') } }
    const res = await POST(badRequest)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})
