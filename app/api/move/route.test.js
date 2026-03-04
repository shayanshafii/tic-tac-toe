/**
 * Minimal regression test for the /api/move route handler.
 * Run with: node app/api/move/route.test.js
 *
 * Verifies that getBestMove does not crash when the player opens
 * with the center square (the exact scenario from the Sentry error).
 */

// We can't import the route directly without Next.js, so we duplicate
// the pure logic here for a quick smoke-test.

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

console.log('Running regression tests...\n')

// Test 1: Center-square opening must not throw (Sentry issue #7310175638)
console.log('Test 1: Center-square opening')
try {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const move = getBestMove(board)
  assert(typeof move === 'number' && move >= 0 && move < 9, 'returns a valid index')
  assert(board[move] === '', 'chosen cell is empty')
} catch (e) {
  failed++
  console.error(`  FAIL: threw ${e.message}`)
}

// Test 2: Corner opening should still work
console.log('Test 2: Corner opening')
try {
  const board = ['X', '', '', '', '', '', '', '', '']
  const move = getBestMove(board)
  assert(typeof move === 'number' && move >= 0 && move < 9, 'returns a valid index')
  assert(board[move] === '', 'chosen cell is empty')
} catch (e) {
  failed++
  console.error(`  FAIL: threw ${e.message}`)
}

// Test 3: Nearly full board
console.log('Test 3: Nearly full board')
try {
  const board = ['X', 'O', 'X', 'X', 'O', 'O', '', 'X', '']
  const move = getBestMove(board)
  assert(move === 6 || move === 8, 'picks one of the two remaining cells')
} catch (e) {
  failed++
  console.error(`  FAIL: threw ${e.message}`)
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
