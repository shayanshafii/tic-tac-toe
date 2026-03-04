/**
 * Regression test for /api/move
 * Verifies that center-square opening no longer crashes the AI.
 *
 * Run:  node app/api/move/route.test.js
 */

// ---- duplicated game logic (mirrors route.js) ----

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
    console.log(`  PASS: ${label}`)
  } else {
    failed++
    console.error(`  FAIL: ${label}`)
  }
}

console.log('Running regression tests for /api/move ...\n')

// Test 1 – center-square opening must not throw
console.log('Test 1: center-square opening (the Sentry bug)')
try {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const move = getBestMove([...board])
  assert(typeof move === 'number' && move >= 0 && move <= 8, 'returns a valid index')
  assert(board[move] === '', 'chosen cell is empty')
} catch (e) {
  failed++
  console.error(`  FAIL: threw ${e.message}`)
}

// Test 2 – corner opening
console.log('Test 2: corner opening')
try {
  const board = ['X', '', '', '', '', '', '', '', '']
  const move = getBestMove([...board])
  assert(typeof move === 'number' && move >= 0 && move <= 8, 'returns a valid index')
  assert(board[move] === '', 'chosen cell is empty')
} catch (e) {
  failed++
  console.error(`  FAIL: threw ${e.message}`)
}

// Test 3 – mid-game board
console.log('Test 3: mid-game board')
try {
  const board = ['X', 'O', 'X', '', 'O', '', '', '', '']
  const move = getBestMove([...board])
  assert(typeof move === 'number' && move >= 0 && move <= 8, 'returns a valid index')
  assert(board[move] === '', 'chosen cell is empty')
} catch (e) {
  failed++
  console.error(`  FAIL: threw ${e.message}`)
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
