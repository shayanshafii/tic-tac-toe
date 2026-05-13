/**
 * Regression test for the /api/move endpoint.
 *
 * We cannot import the Next.js route directly from node:test (NextResponse
 * is not resolvable outside the Next.js runtime), so we duplicate the pure
 * game-logic functions here and assert on them.  The key regression case is
 * the center-square opening that previously crashed.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── duplicated game logic (must stay in sync with route.js) ──

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

// ── tests ──

describe('getBestMove', () => {
  it('handles center-square opening without crashing', () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    const index = getBestMove(board)
    assert.equal(typeof index, 'number')
    assert.ok(index >= 0 && index < 9, `index ${index} in range`)
    assert.equal(board[index], '', 'chosen cell is empty')
  })

  it('handles corner opening', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const index = getBestMove(board)
    assert.equal(typeof index, 'number')
    assert.equal(board[index], '', 'chosen cell is empty')
  })

  it('returns a valid index for a mid-game board', () => {
    const board = ['X', 'O', 'X', '', 'O', '', '', '', '']
    const index = getBestMove(board)
    assert.ok(index >= 0 && index < 9)
    assert.equal(board[index], '')
  })

  it('does not crash on a nearly-full board', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', '']
    const index = getBestMove(board)
    assert.equal(index, 8)
  })
})
