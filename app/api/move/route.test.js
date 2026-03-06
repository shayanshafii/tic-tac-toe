/**
 * Regression test for the AI move logic.
 *
 * Duplicates the pure functions from route.js so we can run without Next.js.
 * Guards against the specific Sentry bug (center-square opening crash).
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

// ---------- helpers ----------

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (!condition) {
    console.error('FAIL:', msg)
    failed++
  } else {
    console.log('PASS:', msg)
    passed++
  }
}

function assertValidMove(board, description) {
  const boardCopy = [...board]
  const index = getBestMove(boardCopy)

  assert(
    typeof index === 'number' && index >= 0 && index <= 8,
    `${description}: returns valid index (got ${index})`,
  )
  assert(
    board[index] === '',
    `${description}: AI picks an empty cell (index ${index})`,
  )
}

// ---------- tests ----------

// Regression: center-square opening previously crashed with TypeError
assertValidMove(
  ['', '', '', '', 'X', '', '', '', ''],
  'center-square opening',
)

// Corner opening
assertValidMove(
  ['X', '', '', '', '', '', '', '', ''],
  'corner opening',
)

// Mid-game board
assertValidMove(
  ['X', 'O', 'X', '', 'O', '', '', '', ''],
  'mid-game board',
)

// Only one cell left
assertValidMove(
  ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', ''],
  'single empty cell',
)

// Full board returns -1 (no valid move)
const fullBoard = ['X', 'O', 'X', 'O', 'X', 'X', 'O', 'X', 'O']
const fullResult = getBestMove([...fullBoard])
assert(fullResult === -1, `full board returns -1 (got ${fullResult})`)

// ---------- summary ----------

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
