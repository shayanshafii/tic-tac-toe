import test from 'node:test'
import assert from 'node:assert/strict'
import { getBestMove, checkWinner } from './logic.js'

// Regression: the center-square opening used to crash getBestMove with a
// "Cannot read properties of null" TypeError, which surfaced as a 500 from
// /api/move and an "Unexpected end of JSON input" error on the client.
test('getBestMove handles the center-square opening without throwing', () => {
  const board = ['', '', '', '', 'X', '', '', '', '']
  const index = getBestMove(board)
  assert.ok(index >= 0 && index < 9, 'returns a valid board index')
  assert.equal(board[index], '', 'picks an empty cell')
})

test('getBestMove returns an empty cell for every single-X opening', () => {
  for (let x = 0; x < 9; x++) {
    const board = Array(9).fill('')
    board[x] = 'X'
    const index = getBestMove(board)
    assert.ok(index >= 0 && index < 9, `valid index for X at ${x}`)
    assert.equal(board[index], '', `empty cell chosen for X at ${x}`)
  }
})

test('getBestMove blocks an immediate winning threat', () => {
  // X threatens to win on the top row (cells 0,1); O must play cell 2.
  const board = ['X', 'X', '', '', 'O', '', '', '', '']
  assert.equal(getBestMove(board), 2)
})

test('checkWinner detects a completed line', () => {
  assert.equal(checkWinner(['O', 'O', 'O', '', '', '', '', '', '']), 'O')
  assert.equal(checkWinner(['', '', '', '', '', '', '', '', '']), null)
})
