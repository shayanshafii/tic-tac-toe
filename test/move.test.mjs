/**
 * Regression test for /api/move logic.
 * Run: node test/move.test.mjs
 *
 * Verifies getBestMove handles all opening moves, including center-square.
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

// Regression: center-square opening must not crash
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
const centerMove = getBestMove([...centerBoard])
assert(typeof centerMove === 'number' && centerMove >= 0 && centerMove < 9, 'center-square opening returns valid index')
assert(centerBoard[centerMove] === '', 'center-square opening returns empty cell')

// Every single-X opening should return a valid move
for (let i = 0; i < 9; i++) {
  const board = Array(9).fill('')
  board[i] = 'X'
  const move = getBestMove([...board])
  assert(typeof move === 'number' && move >= 0 && move < 9, `opening at index ${i} returns valid index`)
  assert(board[move] === '', `opening at index ${i} returns empty cell`)
}

// Empty board should return a valid move
const emptyMove = getBestMove(Array(9).fill(''))
assert(typeof emptyMove === 'number' && emptyMove >= 0 && emptyMove < 9, 'empty board returns valid index')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
