/**
 * Minimal regression test for the move API logic.
 * Duplicates the pure functions to avoid importing next/server.
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

function assert(name, condition) {
  if (condition) {
    console.log('PASS: ' + name)
    passed++
  } else {
    console.error('FAIL: ' + name)
    failed++
  }
}

// Regression: center-square opening must not crash and must return a valid move
{
  const board = ['', '', '', '', 'X', '', '', '', '']
  const idx = getBestMove(board)
  assert('center-square opening returns valid index', typeof idx === 'number' && idx >= 0 && idx < 9 && board[idx] === '')
}

// Corner opening should work
{
  const board = ['X', '', '', '', '', '', '', '', '']
  const idx = getBestMove(board)
  assert('corner opening returns valid index', typeof idx === 'number' && idx >= 0 && idx < 9 && board[idx] === '')
}

// Mid-game board should work
{
  const board = ['X', 'O', 'X', '', '', '', '', '', '']
  const idx = getBestMove(board)
  assert('mid-game returns valid index', typeof idx === 'number' && idx >= 0 && idx < 9 && board[idx] === '')
}

console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed')
if (failed > 0) process.exit(1)
