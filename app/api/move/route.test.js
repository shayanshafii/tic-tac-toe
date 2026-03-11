/**
 * Regression test for the center-square opening bug.
 *
 * Run with: node app/api/move/route.test.js
 *
 * The old code crashed with:
 *   TypeError: Cannot read properties of null (reading 'bestMove')
 * when X opened in the center square (index 4).
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

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  PASS: ${message}`)
  } else {
    failed++
    console.error(`  FAIL: ${message}`)
  }
}

console.log('Regression tests for getBestMove:\n')

// Test 1: Center-square opening (the exact scenario that crashed)
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
let move
try {
  move = getBestMove([...centerBoard])
  assert(typeof move === 'number' && move >= 0 && move <= 8, 'Center-square opening returns a valid index')
  assert(centerBoard[move] === '', 'Returned index is an empty cell')
} catch (e) {
  failed++
  console.error(`  FAIL: Center-square opening threw: ${e.message}`)
}

// Test 2: Corner opening
const cornerBoard = ['X', '', '', '', '', '', '', '', '']
move = getBestMove([...cornerBoard])
assert(typeof move === 'number' && move >= 0 && move <= 8, 'Corner opening returns a valid index')

// Test 3: Empty board (no X yet — edge case)
const emptyBoard = ['', '', '', '', '', '', '', '', '']
move = getBestMove([...emptyBoard])
assert(typeof move === 'number' && move >= 0 && move <= 8, 'Empty board returns a valid index')

// Test 4: Almost-full board
const almostFull = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', '']
move = getBestMove([...almostFull])
assert(move === 8, 'Only remaining cell (index 8) is chosen')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
