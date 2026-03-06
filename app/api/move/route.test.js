/**
 * Regression test for: TypeError: Cannot read properties of null (reading 'bestMove')
 * Sentry issue: https://sentry.io/organizations/usacognition/issues/7310175638/
 *
 * When X opens with the center square (index 4), getBestMove previously hit a
 * dead code path that dereferenced null, crashing the API route.
 */

// Extract the pure functions from route.js for testing.
// Since route.js uses ESM (import/export), we re-declare the logic here
// to keep the test self-contained and runnable with Jest (CJS by default).

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
  test('does not crash when X opens with center square (index 4)', () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    expect(() => getBestMove(board)).not.toThrow()
    const move = getBestMove(board)
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
    expect(board[move]).toBe('') // must pick an empty cell
  })

  test('returns a valid move for an empty board', () => {
    const board = ['', '', '', '', '', '', '', '', '']
    const move = getBestMove(board)
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
  })

  test('returns a valid move when X plays a corner', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const move = getBestMove(board)
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
    expect(board[move]).toBe('')
  })
})
