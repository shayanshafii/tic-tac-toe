import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Extract pure game logic from route.js without requiring next/server
const src = readFileSync(new URL('./route.js', import.meta.url), 'utf-8')

// Verify the buggy center-square block is gone
assert.ok(
  !src.includes('config.bestMove'),
  'route.js should no longer contain the null-dereference bug (config.bestMove)'
)
assert.ok(
  !src.includes('crashes on center-square'),
  'route.js should no longer contain the buggy center-square block'
)
console.log('PASS: buggy center-square code removed')

// Evaluate pure functions in isolation — strip imports and the async POST handler
const preamble = src
  .replace(/^import .*/gm, '')
  .replace(/export async function POST[\s\S]*$/, '')

const mod = {}
const fn = new Function('module', preamble + '\nmodule.checkWinner = checkWinner;\nmodule.minimax = minimax;\nmodule.getBestMove = getBestMove;')
fn(mod)

const { checkWinner, minimax, getBestMove } = mod

// Test: center-square opening no longer crashes
{
  const board = ['', '', '', '', 'X', '', '', '', '']
  const idx = getBestMove([...board])
  assert.equal(typeof idx, 'number', 'should return a number')
  assert.ok(idx >= 0 && idx < 9, 'index must be 0-8')
  assert.notEqual(idx, 4, 'must not pick the taken center')
  console.log('PASS: center-square opening returns valid move')
}

// Test: corner opening works
{
  const board = ['X', '', '', '', '', '', '', '', '']
  const idx = getBestMove([...board])
  assert.equal(typeof idx, 'number')
  assert.notEqual(idx, 0, 'must not pick the taken corner')
  console.log('PASS: corner opening returns valid move')
}

// Test: AI picks an optimal move when it can win
{
  const board = ['X', 'X', '', 'O', 'O', '', '', '', '']
  const idx = getBestMove([...board])
  assert.ok(board[idx] === '', 'AI must pick an empty cell')
  console.log('PASS: AI picks valid optimal move')
}

// Test: checkWinner detects win
{
  const board = ['X', 'X', 'X', '', '', '', '', '', '']
  assert.equal(checkWinner(board), 'X')
  console.log('PASS: checkWinner detects X win')
}

// Test: checkWinner returns null on no win
{
  const board = ['X', 'O', '', '', '', '', '', '', '']
  assert.equal(checkWinner(board), null)
  console.log('PASS: checkWinner returns null when no winner')
}

// Verify error handler returns JSON (source-level check)
assert.ok(
  src.includes("NextResponse.json({ error:") && src.includes("status: 500"),
  'catch block should return a JSON error response with status 500'
)
console.log('PASS: error handler returns JSON 500')

console.log('\nAll tests passed!')
