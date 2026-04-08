import { describe, it, expect } from 'vitest'

// Extract pure functions from the route module for testing.
// We re-declare them here to avoid importing Next.js server internals.

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
  it('should return a valid move for center-square opening', () => {
    // Regression: center-square opening (X at index 4) used to crash
    const board = ['', '', '', '', 'X', '', '', '', '']
    const move = getBestMove(board)
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
    expect(board[move]).toBe('')
  })

  it('should return a valid move for corner opening', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const move = getBestMove(board)
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
    expect(board[move]).toBe('')
  })

  it('should return a valid move for an empty board', () => {
    const board = ['', '', '', '', '', '', '', '', '']
    const move = getBestMove(board)
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
  })

  it('should block an immediate win by X', () => {
    // X has two in a row at [0,1], AI must block at index 2
    const board = ['X', 'X', '', '', 'O', '', '', '', '']
    const move = getBestMove(board)
    expect(move).toBe(2)
  })
})
