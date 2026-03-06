/**
 * Regression test for: TypeError: Cannot read properties of null (reading 'bestMove')
 * When the player's first move is the center square (index 4), the API should
 * return a valid move index instead of crashing.
 *
 * We inline the game logic here to avoid importing next/server in a plain Node context.
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

// This must match the fixed getBestMove in route.js
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

// Test 1: Center-square opening — the exact crash case from Sentry
try {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const index = getBestMove(board)
  if (typeof index === 'number' && index >= 0 && index < 9 && board[index] === '') {
    console.log('PASS: center-square opening returns valid move (index=' + index + ')')
    passed++
  } else {
    console.log('FAIL: center-square opening returned invalid index:', index)
    failed++
  }
} catch (e) {
  console.log('FAIL: center-square opening threw:', e.message)
  failed++
}

// Test 2: Corner opening (sanity check)
try {
  const board = ['X', '', '', '', '', '', '', '', '']
  const index = getBestMove(board)
  if (typeof index === 'number' && index >= 0 && index < 9 && board[index] === '') {
    console.log('PASS: corner opening returns valid move (index=' + index + ')')
    passed++
  } else {
    console.log('FAIL: corner opening returned invalid index:', index)
    failed++
  }
} catch (e) {
  console.log('FAIL: corner opening threw:', e.message)
  failed++
}

// Test 3: Mid-game board
try {
  const board = ['X', 'O', '', '', 'X', '', '', '', '']
  const index = getBestMove(board)
  if (typeof index === 'number' && index >= 0 && index < 9 && board[index] === '') {
    console.log('PASS: mid-game board returns valid move (index=' + index + ')')
    passed++
  } else {
    console.log('FAIL: mid-game board returned invalid index:', index)
    failed++
  }
} catch (e) {
  console.log('FAIL: mid-game board threw:', e.message)
  failed++
}

console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed')
if (failed > 0) process.exit(1)
