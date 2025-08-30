"use client"

import { useRef, useEffect } from "react"

interface Player {
  name: string
  score: number
  wordsPlayed: number
  longestWord: string
}

interface PlayerSectionProps {
  player: Player
  playerIndex: number
  isCurrentPlayer: boolean
  gameStarted: boolean
  gameOver: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onSubmitWord: () => void
  onSkipTurn: () => void
  isValidating: boolean
  lastLetter: string
}

export default function PlayerSection({
  player,
  playerIndex,
  isCurrentPlayer,
  gameStarted,
  gameOver,
  inputValue,
  onInputChange,
  onSubmitWord,
  onSkipTurn,
  isValidating,
  lastLetter,
}: PlayerSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCurrentPlayer && gameStarted && !gameOver && !isValidating) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isCurrentPlayer, gameStarted, gameOver, isValidating])

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 border-2 transition-all ${
        isCurrentPlayer && gameStarted && !gameOver ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{player.name}</h3>
        <div className="text-3xl font-bold text-indigo-600 mb-2">{player.score}</div>
        <div className="text-sm text-gray-500 mb-3">Points</div>

        <div className="space-y-1 text-xs text-gray-600">
          <div>Words: {player.wordsPlayed}</div>
          {player.longestWord && (
            <div>
              Longest: {player.longestWord} ({player.longestWord.length})
            </div>
          )}
        </div>

        {isCurrentPlayer && gameStarted && !gameOver && (
          <div className="mt-2 text-sm font-semibold text-blue-600">Your Turn!</div>
        )}
      </div>

      {gameStarted && !gameOver && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value.toLowerCase())}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey && isCurrentPlayer) {
                onSubmitWord()
              }
            }}
            placeholder={
              lastLetter ? `Word starting with "${lastLetter.toUpperCase()}"` : "Enter your word (4+ letters)"
            }
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-all ${
              isCurrentPlayer
                ? "border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                : "border-gray-200 bg-gray-50 cursor-not-allowed"
            }`}
            disabled={!isCurrentPlayer || isValidating}
            autoComplete="off"
            spellCheck="false"
            aria-label={`${player.name} word input`}
          />

          {isCurrentPlayer && (
            <div className="flex gap-2">
              <button
                onClick={onSubmitWord}
                disabled={isValidating || !inputValue.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {isValidating ? "Checking..." : "Submit"}
              </button>
              <button
                onClick={onSkipTurn}
                disabled={isValidating}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                title="Skip turn (ESC)"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
