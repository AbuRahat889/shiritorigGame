"use client"

interface GameTimerProps {
  timeLeft: number
  gameStarted: boolean
  gameOver: boolean
}

export default function GameTimer({ timeLeft, gameStarted, gameOver }: GameTimerProps) {
  const getTimerColor = () => {
    if (timeLeft <= 5) return "bg-red-500 text-white animate-pulse"
    if (timeLeft <= 10) return "bg-orange-100 text-orange-700"
    return "bg-green-100 text-green-700"
  }

  const getProgressWidth = () => {
    return (timeLeft / 30) * 100
  }

  if (!gameStarted || gameOver) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold transition-all ${getTimerColor()}`}>
        Time: {timeLeft}s
      </div>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-orange-500" : "bg-green-500"
          }`}
          style={{ width: `${getProgressWidth()}%` }}
        />
      </div>
    </div>
  )
}
