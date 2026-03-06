import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Duplicated from route.js because the module imports Next.js internals
// that cannot be loaded outside the framework.

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
  it('does not crash on center-square opening', () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const index = getBestMove(board)
    assert.equal(typeof index, 'number')
    assert.ok(index >= 0 && index < 9, `expected valid index, got ${index}`)
    assert.equal(board[index], '', 'AI should pick an empty cell')
  })

  it('returns a valid move for corner opening', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const index = getBestMove(board)
    assert.equal(typeof index, 'number')
    assert.ok(index >= 0 && index < 9)
    assert.equal(board[index], '')
  })

  it('returns a valid move for an empty board', () => {
    const board = Array(9).fill('')
    const index = getBestMove(board)
    assert.equal(typeof index, 'number')
    assert.ok(index >= 0 && index < 9)
  })
})
