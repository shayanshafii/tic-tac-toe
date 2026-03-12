/**
 * Minimal regression test for getBestMove.
 * Run with: node app/api/move/move.test.js
 *
 * Duplicates the core functions so the test stays dependency-free
 * (the route file imports from 'next/server' which isn't available
 * outside the Next.js runtime).
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

// ---- Tests ----

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

// Regression: center-square opening must not throw
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
try {
  const move = getBestMove([...centerBoard])
  assert(typeof move === 'number' && move >= 0 && move < 9, 'getBestMove returns valid index for center opening')
  assert(centerBoard[move] === '', 'getBestMove returns an empty cell for center opening')
} catch (e) {
  failed++
  console.error(`FAIL: getBestMove threw on center opening: ${e.message}`)
}

// Corner opening should also work
const cornerBoard = ['X', '', '', '', '', '', '', '', '']
try {
  const move = getBestMove([...cornerBoard])
  assert(typeof move === 'number' && move >= 0 && move < 9, 'getBestMove returns valid index for corner opening')
} catch (e) {
  failed++
  console.error(`FAIL: getBestMove threw on corner opening: ${e.message}`)
}

// Empty board (edge case)
const emptyBoard = Array(9).fill('')
try {
  const move = getBestMove([...emptyBoard])
  assert(typeof move === 'number' && move >= 0 && move < 9, 'getBestMove returns valid index for empty board')
} catch (e) {
  failed++
  console.error(`FAIL: getBestMove threw on empty board: ${e.message}`)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
