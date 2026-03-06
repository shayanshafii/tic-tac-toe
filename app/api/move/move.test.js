/**
 * Regression test for the /api/move endpoint.
 *
 * Verifies that getBestMove does not crash when the player opens
 * with the center square (index 4) — the exact scenario that
 * previously caused a TypeError (null dereference).
 *
 * Run:  node --experimental-vm-modules app/api/move/move.test.js
 */

// ---------------------------------------------------------------------------
// Inline copies of the pure functions from route.js so we can test without
// importing Next.js server modules (NextResponse, etc.).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  PASS: ${message}`)
  } else {
    failed++
    console.error(`  FAIL: ${message}`)
  }
}

console.log('Running move API tests...\n')

// Regression: center-square opening must not throw
console.log('1) Center-square opening (regression)')
try {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'returns a valid index')
  assert(board[idx] === '', 'chosen cell is empty')
} catch (err) {
  failed++
  console.error(`  FAIL: threw ${err}`)
}

// Corner opening
console.log('2) Corner opening')
try {
  const board = ['X', '', '', '', '', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'returns a valid index')
  assert(board[idx] === '', 'chosen cell is empty')
} catch (err) {
  failed++
  console.error(`  FAIL: threw ${err}`)
}

// Empty board
console.log('3) Empty board')
try {
  const board = Array(9).fill('')
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'returns a valid index')
} catch (err) {
  failed++
  console.error(`  FAIL: threw ${err}`)
}

// Mid-game board
console.log('4) Mid-game board')
try {
  const board = ['X', 'O', 'X', '', 'O', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'returns a valid index')
  assert(board[idx] === '', 'chosen cell is empty')
} catch (err) {
  failed++
  console.error(`  FAIL: threw ${err}`)
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
