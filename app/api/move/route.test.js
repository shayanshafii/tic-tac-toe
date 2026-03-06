/**
 * Regression tests for the move API game logic.
 *
 * The core functions (checkWinner, minimax, getBestMove) are duplicated here
 * so we can test without importing next/server. They must stay in sync with
 * route.js — any divergence is itself a signal to update the test.
 */

// ---- duplicated game logic (must match route.js) ----

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

// ---- tests ----

function assertValidMove(label, board) {
  const index = getBestMove([...board])
  if (typeof index !== 'number' || index < 0 || index > 8 || board[index] !== '') {
    throw new Error(`${label}: expected valid empty index, got ${index}`)
  }
  console.log(`PASS: ${label} (move=${index})`)
}

// Regression: center-square opening previously caused TypeError
assertValidMove('center-square opening', ['', '', '', '', 'X', '', '', '', ''])

// Other openings
assertValidMove('corner opening',        ['X', '', '', '', '', '', '', '', ''])
assertValidMove('edge opening',          ['', 'X', '', '', '', '', '', '', ''])
assertValidMove('empty board',           ['', '', '', '', '', '', '', '', ''])

// Mid-game states
assertValidMove('mid-game 1', ['X', 'O', 'X', '', '', '', '', '', ''])
assertValidMove('mid-game 2', ['X', '', '', '', 'O', '', '', '', 'X'])

console.log('\nAll tests passed')
