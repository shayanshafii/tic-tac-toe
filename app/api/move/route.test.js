/**
 * Regression test for the move API logic.
 * Run: node app/api/move/route.test.js
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
const move = getBestMove(centerBoard)
assert(typeof move === 'number' && move >= 0 && move < 9, 'getBestMove returns valid index for center opening')
assert(centerBoard[move] === '', 'getBestMove picks an empty cell for center opening')
assert([0, 2, 6, 8].includes(move), 'optimal response to center opening is a corner')

// Empty board
const emptyBoard = Array(9).fill('')
const emptyMove = getBestMove(emptyBoard)
assert(typeof emptyMove === 'number' && emptyMove >= 0 && emptyMove < 9, 'getBestMove returns valid index for empty board')

// Near-full board
const nearFull = ['X', 'O', 'X', 'O', 'X', '', 'O', 'X', 'O']
const lastMove = getBestMove(nearFull)
assert(lastMove === 5, 'getBestMove picks the only empty cell')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
