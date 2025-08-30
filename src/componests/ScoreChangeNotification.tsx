"use client";

interface ScoreChange {
  player: number;
  points: number;
  reason: string;
  timestamp: number;
}

interface Player {
  name: string;
  score: number;
  wordsPlayed: number;
  longestWord: string;
}

interface ScoreChangeNotificationProps {
  scoreChange: ScoreChange | null;
  players: Player[];
}

export default function ScoreChangeNotification({
  scoreChange,
  players,
}: ScoreChangeNotificationProps) {
  if (!scoreChange) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg font-bold text-white ${
          scoreChange.points > 0 ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {players[scoreChange.player].name}: {scoreChange.points > 0 ? "+" : ""}
        {scoreChange.points}
        <div className="text-xs opacity-90">{scoreChange.reason}</div>
      </div>
    </div>
  );
}
