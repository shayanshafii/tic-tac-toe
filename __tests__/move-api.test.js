import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Extract the pure game-logic functions from the API route so we can
 * unit-test them without spinning up Next.js.  We duplicate only the
 * small helpers here to keep the test zero-dependency.
 */

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
    assert.ok(move >= 0 && move < 9, `expected valid index, got ${move}`)
    assert.equal(board[move], '', 'AI should pick an empty cell')
  })

  it('should return a valid move for an empty board after one X', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const move = getBestMove(board)
    assert.ok(move >= 0 && move < 9)
    assert.equal(board[move], '')
  })

  it('should block an imminent X win', () => {
    const board = ['X', 'X', '', '', 'O', '', '', '', '']
    const move = getBestMove(board)
    assert.equal(move, 2, 'AI must block at index 2')
  })

  it('should take a winning move when available', () => {
    // O at 1,3,4 — only winning move is index 5 (row 3,4,5)
    const board = ['X', 'O', 'X', 'O', 'O', '', 'X', '', 'X']
    const move = getBestMove(board)
    assert.equal(move, 5, 'AI should win at index 5')
  })
})
