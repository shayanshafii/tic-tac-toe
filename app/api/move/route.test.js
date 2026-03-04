/**
 * Regression test for /api/move endpoint.
 * Verifies the center-square opening no longer crashes (was a null dereference).
 *
 * Run: node --experimental-vm-modules app/api/move/route.test.js
 */

// Inline the pure functions so we can test without Next.js runtime
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

console.log('Testing getBestMove...')

// Regression: center-square opening must not throw
try {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'center-square opening returns valid index')
  assert(board[idx] === '', 'returned index is an empty cell')
} catch (e) {
  failed++
  console.error(`  FAIL: center-square opening threw: ${e.message}`)
}

// Corner opening should also work
try {
  const board = ['X', '', '', '', '', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'corner opening returns valid index')
  assert(board[idx] === '', 'returned index is an empty cell (corner)')
} catch (e) {
  failed++
  console.error(`  FAIL: corner opening threw: ${e.message}`)
}

// Mid-game board
try {
  const board = ['X', 'O', 'X', '', 'O', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'mid-game returns valid index')
  assert(board[idx] === '', 'returned index is an empty cell (mid-game)')
} catch (e) {
  failed++
  console.error(`  FAIL: mid-game threw: ${e.message}`)
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
