import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getBestMove } from './engine.js'

// Regression: X opening in the center used to crash getBestMove with a
// TypeError (null dereference), causing /api/move to return a 500 with an
// empty body and the client to throw "Unexpected end of JSON input".
test('returns a valid move when X opens in the center square', () => {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const index = getBestMove(board)
  assert.ok(index >= 0 && index < 9, `expected a board index, got ${index}`)
  assert.equal(board[index], '', 'chosen square must be empty')
})

test('returns a valid move for an empty board', () => {
  const board = Array(9).fill('')
  const index = getBestMove(board)
  assert.ok(index >= 0 && index < 9)
})

test('takes the winning move when available', () => {
  // O can win by playing index 2.
  const board = ['O', 'O', '', 'X', 'X', '', '', '', '']
  assert.equal(getBestMove(board), 2)
})
