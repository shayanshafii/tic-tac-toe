import { describe, it, expect } from 'vitest'
import { getBestMove, checkWinner } from './move.js'

describe('getBestMove', () => {
  it('does not crash when X opens with center square', () => {
    const board = ['', '', '', '', 'X', '', '', '', '']
    // This used to throw: TypeError: Cannot read properties of null
    const index = getBestMove(board)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(9)
    expect(board[index]).toBe('')
  })

  it('returns a valid move for an empty board with one X', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const index = getBestMove(board)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(9)
    expect(board[index]).toBe('')
  })

  it('returns -1 when the board is full', () => {
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    const index = getBestMove(board)
    expect(index).toBe(-1)
  })
})

describe('checkWinner', () => {
  it('detects a row win', () => {
    const board = ['X', 'X', 'X', '', '', '', '', '', '']
    expect(checkWinner(board)).toBe('X')
  })

  it('returns null when no winner', () => {
    const board = ['X', 'O', '', '', '', '', '', '', '']
    expect(checkWinner(board)).toBeNull()
  })
})
