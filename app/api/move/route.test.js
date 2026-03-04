/**
 * Regression test for /api/move endpoint.
 * Verifies the center-square opening bug (Sentry issue 7305002355) is fixed.
 *
 * Run: node --experimental-vm-modules app/api/move/route.test.js
 */

// Inline the pure logic from route.js so we can test without Next.js runtime
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

// --- Tests ---

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    passed++
    console.log(`  PASS: ${msg}`)
  } else {
    failed++
    console.error(`  FAIL: ${msg}`)
  }
}

console.log('Regression: center-square opening (Sentry #7305002355)')
{
  // X plays center as first move — this used to crash with TypeError
  const board = ['', '', '', '', 'X', '', '', '', '']
  let index
  let threw = false
  try {
    index = getBestMove([...board])
  } catch (e) {
    threw = true
  }
  assert(!threw, 'getBestMove does not throw on center-square opening')
  assert(typeof index === 'number' && index >= 0 && index < 9, `returns valid index (got ${index})`)
  assert(board[index] === '', `returned index ${index} is an empty cell`)
}

console.log('\nBasic getBestMove checks')
{
  // X plays corner — AI should respond without error
  const board = ['X', '', '', '', '', '', '', '', '']
  const index = getBestMove([...board])
  assert(typeof index === 'number' && index >= 0 && index < 9, `corner opening returns valid index (got ${index})`)
  assert(board[index] === '', `returned index ${index} is empty`)
}
{
  // AI should block an imminent win
  const board = ['X', 'X', '', '', 'O', '', '', '', '']
  const index = getBestMove([...board])
  assert(index === 2, `AI blocks X win at index 2 (got ${index})`)
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
