import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// We can't import the route directly (NextResponse dependency),
// so we extract and test the pure logic inline.

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
  it('should not crash when X opens with center square (regression)', () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const index = getBestMove(board)
    assert.ok(typeof index === 'number', 'index should be a number')
    assert.ok(index >= 0 && index < 9, 'index should be in range 0-8')
    assert.notEqual(index, 4, 'AI should not pick an occupied cell')
    assert.equal(board[index], '', 'AI should pick an empty cell')
  })

  it('should return a valid move for corner opening', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const index = getBestMove(board)
    assert.ok(index >= 0 && index < 9)
    assert.equal(board[index], '')
  })

  it('should return a valid move for a mid-game board', () => {
    const board = ['X', 'O', 'X', '', '', '', '', '', '']
    const index = getBestMove(board)
    assert.ok(index >= 3 && index < 9)
    assert.equal(board[index], '')
  })
})
