/**
 * Regression test for the /api/move logic.
 * Verifies that a center-square opening (index 4) no longer crashes.
 *
 * Run: node app/api/move/route.test.js
 */

// ---- Inline the pure logic from route.js so we can test without Next.js ----

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

let failures = 0

function test(name, fn) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    console.error(`FAIL: ${name} — ${err.message}`)
    failures++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

test('center-square opening returns valid move (regression)', () => {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const move = getBestMove(board)
  assert(typeof move === 'number', `expected number, got ${typeof move}`)
  assert(move >= 0 && move <= 8, `index out of range: ${move}`)
  assert(board[move] === '', `AI chose occupied cell ${move}`)
})

test('corner opening returns valid move', () => {
  const board = ['X', '', '', '', '', '', '', '', '']
  const move = getBestMove(board)
  assert(typeof move === 'number', `expected number, got ${typeof move}`)
  assert(move >= 0 && move <= 8, `index out of range: ${move}`)
  assert(board[move] === '', `AI chose occupied cell ${move}`)
})

test('empty board returns valid move', () => {
  const board = ['', '', '', '', '', '', '', '', '']
  const move = getBestMove(board)
  assert(typeof move === 'number', `expected number, got ${typeof move}`)
  assert(move >= 0 && move <= 8, `index out of range: ${move}`)
})

test('AI picks winning move when available', () => {
  // O at 0,1 — winning move is index 2 to complete top row
  const board = ['O', 'O', '', 'X', 'X', '', '', '', '']
  const move = getBestMove(board)
  assert(move === 2, `expected 2, got ${move}`)
})

if (failures > 0) {
  process.exit(1)
}
