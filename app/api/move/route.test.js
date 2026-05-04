import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Inline the logic from route.js so we can test without Next.js runtime
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
  it('should not crash when X opens with center square', () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const move = getBestMove(board)
    assert.ok(move >= 0 && move <= 8, `expected valid index, got ${move}`)
    assert.strictEqual(board[move], '', 'AI must pick an empty cell')
  })

  it('should return a valid move for an empty board', () => {
    const board = Array(9).fill('')
    const move = getBestMove(board)
    assert.ok(move >= 0 && move <= 8, `expected valid index, got ${move}`)
  })

  it('should pick the winning move when one is available', () => {
    // O has two in a row at 0,1 — should complete at 2
    const board = ['O', 'O', '', 'X', 'X', '', '', '', '']
    const move = getBestMove(board)
    assert.strictEqual(move, 2, 'AI should take the winning cell')
  })

  it('should block X from winning', () => {
    // X has two in a row at 3,4 — AI should block at 5
    const board = ['O', '', '', 'X', 'X', '', '', '', '']
    const move = getBestMove(board)
    assert.strictEqual(move, 5, 'AI should block X at cell 5')
  })
})
