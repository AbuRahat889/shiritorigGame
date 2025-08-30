"use client";

interface Player {
  name: string;
  score: number;
  wordsPlayed: number;
  longestWord: string;
}

interface WordEntry {
  word: string;
  player: number;
  points: number;
  turn: number;
  definition?: string;
}

interface WordHistoryProps {
  wordHistory: WordEntry[];
  players: Player[];
  onWordClick: (word: WordEntry) => void;
}

export default function WordHistory({
  wordHistory,
  players,
  onWordClick,
}: WordHistoryProps) {
  if (wordHistory.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Word History ({wordHistory.length} words)
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {wordHistory.map((entry, index) => (
          <div
            key={index}
            onClick={() => onWordClick(entry)}
            onKeyPress={(e) => e.key === "Enter" && onWordClick(entry)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            tabIndex={0}
            role="button"
            aria-label={`View definition for ${entry.word}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 font-mono w-8">
                #{entry.turn}
              </div>
              <div className="font-semibold text-gray-800 capitalize">
                {entry.word}
              </div>
              <div className="text-xs text-gray-500">
                ({entry.word.length} letters)
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  entry.player === 0
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {players[entry.player].name}
              </div>
              <div className="text-sm font-semibold text-indigo-600">
                +{entry.points}
              </div>
              <div className="text-gray-400 text-sm">→</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center">
        Click on any word to see its definition
      </div>
    </div>
  );
}
