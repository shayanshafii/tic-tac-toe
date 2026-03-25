/**
 * Regression test for the /api/move route logic.
 * Runs with plain Node.js — no test framework required.
 *
 *   node app/api/move/route.test.js
 */

// ---- inline copies of the pure functions under test ----

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

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

// Regression: center-square opening must not crash
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
const centerMove = getBestMove([...centerBoard])
assert(typeof centerMove === 'number' && centerMove >= 0 && centerMove <= 8, 'center-square opening returns valid index')
assert(centerBoard[centerMove] === '', 'center-square opening returns an empty cell')

// Corner opening
const cornerBoard = ['X', '', '', '', '', '', '', '', '']
const cornerMove = getBestMove([...cornerBoard])
assert(typeof cornerMove === 'number' && cornerMove >= 0 && cornerMove <= 8, 'corner opening returns valid index')

// Empty board (AI goes first edge case)
const emptyBoard = Array(9).fill('')
const emptyMove = getBestMove([...emptyBoard])
assert(typeof emptyMove === 'number' && emptyMove >= 0 && emptyMove <= 8, 'empty board returns valid index')

// Mid-game board
const midBoard = ['X', 'O', 'X', '', 'O', '', '', '', '']
const midMove = getBestMove([...midBoard])
assert(typeof midMove === 'number' && midBoard[midMove] === '', 'mid-game returns an empty cell')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
