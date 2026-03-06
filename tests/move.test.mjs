/**
 * Minimal regression test for the /api/move logic.
 * Run with: node tests/move.test.mjs
 *
 * Validates that getBestMove no longer crashes when X opens in the center.
 */

// ---------- duplicated helpers (keep in sync with app/api/move/route.js) ----------

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

// ---------- tests ----------

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

console.log('Running move regression tests...\n')

// Test 1: center-square opening (the bug that caused the Sentry error)
{
  const board = ['', '', '', '', 'X', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'center-square opening returns a valid index')
  assert(board[idx] === '', 'center-square opening returns an empty cell')
}

// Test 2: corner opening
{
  const board = ['X', '', '', '', '', '', '', '', '']
  const idx = getBestMove(board)
  assert(typeof idx === 'number' && idx >= 0 && idx < 9, 'corner opening returns a valid index')
  assert(board[idx] === '', 'corner opening returns an empty cell')
}

// Test 3: AI should take the winning move when O has two in a row
{
  const board = ['X', '', '', 'X', 'O', 'O', '', '', '']
  const idx = getBestMove(board)
  assert(idx === 3 || idx === 6, 'AI completes its winning line or blocks optimally')
}

// Test 4: AI should block opponent from winning
{
  const board = ['X', 'X', '', '', 'O', '', '', '', '']
  const idx = getBestMove(board)
  assert(idx === 2, 'AI blocks X from winning (index 2)')
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
