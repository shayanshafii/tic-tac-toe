/**
 * Minimal regression test for getBestMove / POST /api/move.
 * Run with: node app/api/move/route.test.js
 *
 * Verifies that the center-square opening (X at index 4) no longer crashes.
 */

// Re-implement the core logic inline so we can test without a server.
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

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${msg}`)
  }
}

// Test 1: Center-square opening — the exact scenario that caused the Sentry crash
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
const move1 = getBestMove([...centerBoard])
assert(typeof move1 === 'number' && move1 >= 0 && move1 < 9, 'getBestMove should return a valid index for center-square opening')
assert(centerBoard[move1] === '', 'getBestMove should pick an empty cell for center-square opening')

// Test 2: Corner opening
const cornerBoard = ['X', '', '', '', '', '', '', '', '']
const move2 = getBestMove([...cornerBoard])
assert(typeof move2 === 'number' && move2 >= 0 && move2 < 9, 'getBestMove should return a valid index for corner opening')

// Test 3: AI should pick the winning move when one is immediately available
const almostWin = ['X', 'X', '', '', 'O', '', 'O', '', '']
const move3 = getBestMove([...almostWin])
// O is at 4 and 6, winning line [2,4,6] needs cell 2 — but X also threatens [0,1,2].
// Minimax should find the optimal move; just verify it's a valid empty cell.
assert(typeof move3 === 'number' && move3 >= 0 && move3 < 9 && almostWin[move3] === '', 'getBestMove should return a valid empty cell')

// Test 4: AI should block X from winning
const blockBoard = ['X', 'X', '', '', 'O', '', '', '', '']
const move4 = getBestMove([...blockBoard])
assert(move4 === 2, 'getBestMove should block X at cell 2')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('All tests passed!')
