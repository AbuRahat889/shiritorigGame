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

interface WordDefinitionModalProps {
  selectedWord: WordEntry | null;
  players: Player[];
  onClose: () => void;
}

export default function WordDefinitionModal({
  selectedWord,
  players,
  onClose,
}: WordDefinitionModalProps) {
  if (!selectedWord) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        role="dialog"
        aria-labelledby="word-definition-title"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3
              id="word-definition-title"
              className="text-2xl font-bold text-gray-800 capitalize"
            >
              {selectedWord.word}
            </h3>
            <div className="text-sm text-gray-500">
              Turn {selectedWord.turn} • {players[selectedWord.player].name} • +
              {selectedWord.points} points
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Close definition"
          >
            ×
          </button>
        </div>
        <div className="text-gray-700">
          <div className="font-semibold mb-2">Definition:</div>
          <div className="text-sm leading-relaxed">
            {selectedWord.definition}
          </div>
        </div>
      </div>
    </div>
  );
}
