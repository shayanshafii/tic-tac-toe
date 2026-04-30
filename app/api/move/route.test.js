/**
 * Regression tests for the minimax move engine.
 * Extracts the pure game logic to test independently of Next.js.
 * Run with: node app/api/move/route.test.js
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

// --- Test runner ---

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (e) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg)
}

console.log('getBestMove')

test('center-square opening: returns a valid move without crashing (regression for Sentry #7310175638)', () => {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const index = getBestMove(board)
  assert(typeof index === 'number', `expected number, got ${typeof index}`)
  assert(index >= 0 && index <= 8, `index out of range: ${index}`)
  assert(index !== 4, `AI should not pick the occupied center square`)
  assert(board[index] === '', `AI picked an occupied cell: ${index}`)
})

test('corner opening: returns a valid move', () => {
  const board = ['X', '', '', '', '', '', '', '', '']
  const index = getBestMove(board)
  assert(typeof index === 'number', `expected number, got ${typeof index}`)
  assert(board[index] === '', `AI picked an occupied cell: ${index}`)
})

test('mid-game: returns a valid empty cell', () => {
  const board = ['X', 'O', 'X', '', 'O', '', '', '', '']
  const index = getBestMove(board)
  assert(typeof index === 'number', `expected number, got ${typeof index}`)
  assert(board[index] === '', `AI picked an occupied cell: ${index}`)
})

test('blocks opponent win', () => {
  // X has [0,1], needs 2 to win. AI (O) should block at index 2.
  const board = ['X', 'X', '', '', 'O', '', '', '', '']
  const index = getBestMove(board)
  assert(index === 2, `expected AI to block at 2, got ${index}`)
})

test('picks a move that guarantees a win when possible', () => {
  const board = ['O', 'X', '', 'X', 'O', '', '', '', '']
  const index = getBestMove(board)
  assert(board[index] === '', `AI picked an occupied cell: ${index}`)
  // verify the chosen move leads to a guaranteed win (minimax score 1)
  const copy = [...board]
  copy[index] = 'O'
  const score = checkWinner(copy) === 'O' ? 1 : minimax(copy, false)
  assert(score === 1, `expected winning path (score 1), got ${score}`)
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
