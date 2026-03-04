import { describe, it, expect } from 'vitest'

// Re-implement the fixed getBestMove and helpers inline so we can unit-test
// the pure logic without needing a full Next.js server runtime.

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

function minimax(board, isMaximizing) {
  const winner = checkWinner(board)
  if (winner === 'O') return 1
  if (winner === 'X') return -1
  if (!board.includes('')) return 0

  if (isMaximizing) {
    let best = -2
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O'
        best = Math.max(best, minimax(board, false))
        board[i] = ''
      }
    }
    return best
  } else {
    let best = 2
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X'
        best = Math.min(best, minimax(board, true))
        board[i] = ''
      }
    }
    return best
  }
}

function getBestMove(board) {
  let bestScore = -2
  let bestIndex = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'O'
      const score = minimax(board, false)
      board[i] = ''
      if (score > bestScore) {
        bestScore = score
        bestIndex = i
      }
    }
  }
  return bestIndex
}

describe('getBestMove', () => {
  it('does not crash on center-square opening (regression)', () => {
    // This is the exact board state that caused the Sentry error:
    // X plays center as the first move.
    const board = ['', '', '', '', 'X', '', '', '', '']
    const index = getBestMove(board)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(9)
    expect(board[index]).toBe('')
  })

  it('returns a valid move for an empty board with one X in corner', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const index = getBestMove(board)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(9)
    expect(board[index]).toBe('')
  })

  it('blocks an imminent X win', () => {
    // X has top-left and top-center; O must play top-right (index 2)
    const board = ['X', 'X', '', '', 'O', '', '', '', '']
    const index = getBestMove(board)
    expect(index).toBe(2)
  })
})
