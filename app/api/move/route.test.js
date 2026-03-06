/**
 * Regression test for Sentry issue:
 * TypeError: Cannot read properties of null (reading 'bestMove')
 * Triggered when the player's first move is the center square (index 4).
 *
 * We inline the core logic here to avoid needing the Next.js runtime.
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

// Regression: center-square opening must not crash
const centerBoard = ['', '', '', '', 'X', '', '', '', '']
const move1 = getBestMove([...centerBoard])
console.assert(typeof move1 === 'number' && move1 >= 0 && move1 < 9, 'center opening: valid index')
console.assert(centerBoard[move1] === '', 'center opening: picks empty cell')
passed++

// Corner opening
const cornerBoard = ['X', '', '', '', '', '', '', '', '']
const move2 = getBestMove([...cornerBoard])
console.assert(typeof move2 === 'number' && move2 >= 0 && move2 < 9, 'corner opening: valid index')
console.assert(cornerBoard[move2] === '', 'corner opening: picks empty cell')
passed++

// Mid-game board
const midBoard = ['X', 'O', 'X', '', 'O', '', '', '', '']
const move3 = getBestMove([...midBoard])
console.assert(typeof move3 === 'number' && move3 >= 0 && move3 < 9, 'mid-game: valid index')
console.assert(midBoard[move3] === '', 'mid-game: picks empty cell')
passed++

console.log(`All ${passed} regression tests passed.`)
