/**
 * Regression tests for the AI move logic.
 * Run with: node --experimental-vm-modules app/api/move/move.test.js
 *
 * These tests import the pure game-logic helpers (duplicated here to stay
 * independent of the Next.js runtime) and verify the fix for the
 * center-square-opening crash (Sentry issue #7305002355).
 */

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

// ---- Test helpers ----
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

// ---- Tests ----

console.log('Regression: center-square opening (X plays index 4)')
{
  const board = ['', '', '', '', 'X', '', '', '', '']
  let error = null
  let result
  try {
    result = getBestMove(board)
  } catch (e) {
    error = e
  }
  assert(error === null, 'getBestMove does not throw')
  assert(typeof result === 'number' && result >= 0 && result <= 8, `returns valid index (got ${result})`)
  assert(board[result] === '', `chosen cell is empty (index ${result})`)
}

console.log('Corner opening (X plays index 0)')
{
  const board = ['X', '', '', '', '', '', '', '', '']
  const result = getBestMove(board)
  assert(typeof result === 'number' && result >= 0 && result <= 8, `returns valid index (got ${result})`)
  assert(board[result] === '', `chosen cell is empty (index ${result})`)
}

console.log('All first-move openings produce a valid response')
{
  for (let i = 0; i < 9; i++) {
    const board = Array(9).fill('')
    board[i] = 'X'
    let error = null
    let result
    try {
      result = getBestMove(board)
    } catch (e) {
      error = e
    }
    assert(error === null, `opening at index ${i} does not throw`)
    assert(typeof result === 'number' && result >= 0 && result <= 8, `opening at index ${i} returns valid index (got ${result})`)
  }
}

// ---- Summary ----
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
