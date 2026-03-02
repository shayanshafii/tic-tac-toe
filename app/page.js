'use client'

import { useState, useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], cells: [a, b, c] }
    }
  }
  return null
}

export default function Page() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [gameStatus, setGameStatus] = useState('playing')
  const [winningCells, setWinningCells] = useState([])
  const [isThinking, setIsThinking] = useState(false)

  const reset = useCallback(() => {
    setBoard(Array(9).fill(''))
    setGameStatus('playing')
    setWinningCells([])
    setIsThinking(false)
  }, [])

  const handleClick = useCallback(async (i) => {
    if (board[i] || gameStatus !== 'playing' || isThinking) return

    const next = [...board]
    next[i] = 'X'
    setBoard(next)

    const result = checkWinner(next)
    if (result) {
      setGameStatus('won')
      setWinningCells(result.cells)
      return
    }

    if (!next.includes('')) {
      setGameStatus('draw')
      return
    }

    setIsThinking(true)
    try {
      const res = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: next }),
      })
      const data = await res.json()
      const afterAI = [...next]
      afterAI[data.index] = 'O'
      setBoard(afterAI)

      const aiResult = checkWinner(afterAI)
      if (aiResult) {
        setGameStatus('lost')
        setWinningCells(aiResult.cells)
      } else if (!afterAI.includes('')) {
        setGameStatus('draw')
      }
    } catch (err) {
      Sentry.captureException(err)
    } finally {
      setIsThinking(false)
    }
  }, [board, gameStatus, isThinking])

  const statusText = {
    playing: isThinking ? 'thinking...' : 'your turn',
    won: 'you won',
    lost: 'you lost',
    draw: 'draw',
  }[gameStatus]

  return (
    <div className="container">
      <h1>tic tac toe</h1>
      <p className="subtitle">
        play tic tac toe against a minimax AI. you are X, the computer is O.
      </p>
      <div className="board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={[
              'cell',
              cell ? 'taken' : '',
              winningCells.includes(i) ? 'winning' : '',
              gameStatus !== 'playing' || isThinking ? 'disabled' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleClick(i)}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="status">{statusText}</div>
      {gameStatus !== 'playing' && (
        <button className="reset" onClick={reset}>
          play again
        </button>
      )}
    </div>
  )
}
