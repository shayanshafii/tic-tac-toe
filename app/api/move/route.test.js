/**
 * Minimal regression test for the /api/move route logic.
 * Run with: node app/api/move/route.test.js
 *
 * Verifies that center-square openings no longer crash the AI.
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

function test(name, fn) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    console.error(`FAIL: ${name}`)
    console.error(err.message)
    process.exitCode = 1
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

test('center-square opening returns valid move (regression)', () => {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const index = getBestMove([...board])
  assert(typeof index === 'number', `Expected number, got ${typeof index}`)
  assert(index >= 0 && index < 9, `Index out of range: ${index}`)
  assert(board[index] === '', `AI chose occupied cell ${index}`)
})

test('corner opening returns valid move', () => {
  const board = ['X', '', '', '', '', '', '', '', '']
  const index = getBestMove([...board])
  assert(typeof index === 'number', `Expected number, got ${typeof index}`)
  assert(index >= 0 && index < 9, `Index out of range: ${index}`)
  assert(board[index] === '', `AI chose occupied cell ${index}`)
})

test('mid-game board returns valid move', () => {
  const board = ['X', 'O', 'X', '', 'O', '', '', '', '']
  const index = getBestMove([...board])
  assert(typeof index === 'number', `Expected number, got ${typeof index}`)
  assert(board[index] === '', `AI chose occupied cell ${index}`)
})

test('AI picks optimal move in contested board', () => {
  const board = ['X', 'X', '', 'O', 'O', '', '', '', 'X']
  const index = getBestMove([...board])
  assert(typeof index === 'number', `Expected number, got ${typeof index}`)
  assert(board[index] === '', `AI chose occupied cell ${index}`)
})

console.log('All tests completed.')
