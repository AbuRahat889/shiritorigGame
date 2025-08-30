


export interface Player {
  name: string
  score: number
  wordsPlayed: number
  longestWord: string
}

export interface ScoreChange {
  player: number
  points: number
  reason: string
  timestamp: number
}

export interface WordEntry {
  word: string
  player: number
  points: number
  turn: number
  definition?: string
}

 export interface GameState {
  currentPlayer: number
  players: Player[]
  currentWord: string
  lastLetter: string
  usedWords: string[]
  wordHistory: WordEntry[]
  gameStarted: boolean
  timeLeft: number
  gameOver: boolean
  winner: string | null
  scoreHistory: ScoreChange[]
  turnNumber: number
}