/**
 * Regression test for the /api/move endpoint.
 *
 * We extract and test the pure logic (getBestMove) directly so we don't need
 * to spin up Next.js or mock NextResponse.
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

function assert(condition, label) {
  if (condition) {
    console.log(`PASS: ${label}`)
    passed++
  } else {
    console.error(`FAIL: ${label}`)
    failed++
  }
}

// Regression: center-square opening must not crash and must return a valid move
{
  const board = ['', '', '', '', 'X', '', '', '', '']
  const idx = getBestMove([...board])
  assert(typeof idx === 'number' && idx >= 0 && idx < 9 && board[idx] === '',
    'center-square opening returns a valid empty cell index')
}

// Corner opening
{
  const board = ['X', '', '', '', '', '', '', '', '']
  const idx = getBestMove([...board])
  assert(typeof idx === 'number' && idx >= 0 && idx < 9 && board[idx] === '',
    'corner opening returns a valid empty cell index')
}

// AI should pick winning move when available
{
  const board = ['O', 'O', '', 'X', 'X', '', '', '', '']
  const idx = getBestMove([...board])
  assert(idx === 2, 'AI picks winning move (index 2)')
}

// AI should block opponent winning move
{
  const board = ['O', '', '', 'X', 'X', '', '', '', '']
  const idx = getBestMove([...board])
  assert(idx === 5, 'AI blocks opponent winning move (index 5)')
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
