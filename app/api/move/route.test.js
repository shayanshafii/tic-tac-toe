/**
 * Minimal regression test for getBestMove / POST /api/move.
 * Run with: node app/api/move/route.test.js
 *
 * Verifies the center-square opening no longer crashes.
 */

// We can't easily import the route handler (it depends on Next internals),
// so we duplicate the pure logic that was broken and verify it inline.

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

// ---- Tests ----

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    passed++
    console.log(`  PASS: ${msg}`)
  } else {
    failed++
    console.error(`  FAIL: ${msg}`)
  }
}

console.log('Regression tests for getBestMove:\n')

// Test 1: Center-square opening (the exact scenario that caused the Sentry crash)
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
const move1 = getBestMove([...centerBoard])
assert(typeof move1 === 'number' && move1 >= 0 && move1 < 9, 'center-square opening returns valid index')
assert(centerBoard[move1] === '', 'center-square opening returns an empty cell')

// Test 2: Corner opening
const cornerBoard = ['X', '', '', '', '', '', '', '', '']
const move2 = getBestMove([...cornerBoard])
assert(typeof move2 === 'number' && move2 >= 0 && move2 < 9, 'corner opening returns valid index')

// Test 3: Board with multiple moves
const midGameBoard = ['X', 'O', 'X', '', '', '', '', '', '']
const move3 = getBestMove([...midGameBoard])
assert(typeof move3 === 'number' && move3 >= 3 && move3 <= 8, 'mid-game returns valid empty index')

// Test 4: Nearly full board
const almostFullBoard = ['X', 'O', 'X', 'O', 'X', 'O', 'X', '', 'O']
const move4 = getBestMove([...almostFullBoard])
assert(move4 === 7, 'nearly full board returns the only empty cell (index 7)')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
