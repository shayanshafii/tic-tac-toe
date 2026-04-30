import { describe, it, expect, vi } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body, init) => ({ body, status: init?.status ?? 200 }),
  },
}))

const { POST } = await import('./route.js')

function makeRequest(body) {
  return { json: async () => body }
}

describe('POST /api/move', () => {
  it('returns a valid move for a center-square opening', async () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const res = await POST(makeRequest({ board }))

    expect(res.status).toBe(200)
    expect(res.body.index).toBeGreaterThanOrEqual(0)
    expect(res.body.index).toBeLessThan(9)
    expect(board[res.body.index]).toBe('')
  })

  it('returns a valid move for a corner opening', async () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const res = await POST(makeRequest({ board }))

    expect(res.status).toBe(200)
    expect(res.body.index).toBeGreaterThanOrEqual(0)
    expect(board[res.body.index]).toBe('')
  })

  it('returns 400 for an invalid board', async () => {
    const res = await POST(makeRequest({ board: [1, 2] }))
    expect(res.status).toBe(400)
  })

  it('returns 500 with JSON body on unexpected errors', async () => {
    const res = await POST({ json: async () => { throw new Error('bad') } })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('bad')
  })
})
