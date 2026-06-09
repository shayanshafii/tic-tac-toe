import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getBestMove } from './logic.js'

const EMPTY = ''

// Regression: X opening with the center square previously threw
// "TypeError: Cannot read properties of null (reading 'bestMove')".
test('returns a valid move when X opens with the center square', () => {
  const board = [EMPTY, EMPTY, EMPTY, EMPTY, 'X', EMPTY, EMPTY, EMPTY, EMPTY]
  const index = getBestMove(board)
  assert.ok(index >= 0 && index < 9, 'index should be within the board')
  assert.equal(board[index], EMPTY, 'chosen square should be empty')
})

test('returns a valid move on an empty board', () => {
  const board = Array(9).fill(EMPTY)
  const index = getBestMove(board)
  assert.ok(index >= 0 && index < 9)
})

test('takes the winning move when one is available', () => {
  // O can win by playing index 2.
  const board = ['O', 'O', EMPTY, 'X', 'X', EMPTY, EMPTY, EMPTY, EMPTY]
  assert.equal(getBestMove(board), 2)
})

test('blocks the opponent from winning', () => {
  // X threatens to win at index 2; O must block there.
  const board = ['X', 'X', EMPTY, EMPTY, 'O', EMPTY, EMPTY, EMPTY, EMPTY]
  assert.equal(getBestMove(board), 2)
})
