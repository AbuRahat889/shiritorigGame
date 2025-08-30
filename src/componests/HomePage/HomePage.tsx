"use client";

import { useState, useEffect } from "react";
import { GameState, ScoreChange, WordEntry } from "@/types/Home";
import ScoreChangeNotification from "../ScoreChangeNotification";
import WordDefinitionModal from "../WordDefinitionModal";
import GameTimer from "../GameTimer";
import PlayerSection from "../PlayerSection";
import WordHistory from "../WordHistory";

export default function HomePage() {
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 0,
    players: [
      { name: "Player 1", score: 0, wordsPlayed: 0, longestWord: "" },
      { name: "Player 2", score: 0, wordsPlayed: 0, longestWord: "" },
    ],
    currentWord: "",
    lastLetter: "",
    usedWords: [],
    wordHistory: [],
    gameStarted: false,
    timeLeft: 30,
    gameOver: false,
    winner: null,
    scoreHistory: [],
    turnNumber: 0,
  });

  const [inputWord1, setInputWord1] = useState("");
  const [inputWord2, setInputWord2] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [recentScoreChange, setRecentScoreChange] =
    useState<ScoreChange | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const getCurrentInputWord = () => {
    return gameState.currentPlayer === 0 ? inputWord1 : inputWord2;
  };

  const clearCurrentInput = () => {
    if (gameState.currentPlayer === 0) {
      setInputWord1("");
    } else {
      setInputWord2("");
    }
  };

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      timeLeft: 30,
    }));
  };

  const resetGame = () => {
    setGameState({
      currentPlayer: 0,
      players: [
        { name: "Player 1", score: 0, wordsPlayed: 0, longestWord: "" },
        { name: "Player 2", score: 0, wordsPlayed: 0, longestWord: "" },
      ],
      currentWord: "",
      lastLetter: "",
      usedWords: [],
      wordHistory: [],
      gameStarted: false,
      timeLeft: 30,
      gameOver: false,
      winner: null,
      scoreHistory: [],
      turnNumber: 0,
    });
    setInputWord1("");
    setInputWord2("");
    setValidationMessage("");
    setRecentScoreChange(null);
    setSelectedWord(null);
    setNetworkError(false);
  };

  const skipTurn = () => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((player, index) =>
        index === prev.currentPlayer
          ? { ...player, score: Math.max(0, player.score - 1) }
          : player
      ),
      currentPlayer: prev.currentPlayer === 0 ? 1 : 0,
      timeLeft: 30,
      turnNumber: prev.turnNumber + 1,
    }));
    addScoreChange(gameState.currentPlayer, -1, "Turn skipped");
    clearCurrentInput();
    setValidationMessage("Turn skipped! -1 point");
  };

  const handleTurnTimeout = () => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((player, index) =>
        index === prev.currentPlayer
          ? { ...player, score: Math.max(0, player.score - 2) }
          : player
      ),
      currentPlayer: prev.currentPlayer === 0 ? 1 : 0,
      timeLeft: 30,
      turnNumber: prev.turnNumber + 1,
    }));
    addScoreChange(gameState.currentPlayer, -2, "Time's up!");
    clearCurrentInput();
    setValidationMessage("Time's up! -2 points");
  };

  const checkGameEnd = () => {
    const maxScore = Math.max(...gameState.players.map((p) => p.score));
    const minScore = Math.min(...gameState.players.map((p) => p.score));

    // End game if score difference is 10 or more, or if a player reaches 20 points
    if (maxScore - minScore >= 10 || maxScore >= 20) {
      const winner = gameState.players.find((p) => p.score === maxScore);
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        winner: winner?.name || null,
      }));
    }
  };

  const submitWord = async () => {
    const inputWord = getCurrentInputWord();
    if (!inputWord.trim() || isValidating) return;

    setIsValidating(true);
    setValidationMessage("");
    setNetworkError(false);

    const word = inputWord.trim().toLowerCase();

    // Input validation
    if (!/^[a-zA-Z]+$/.test(word)) {
      setValidationMessage("Word must contain only letters!");
      setIsValidating(false);
      return;
    }

    // Check minimum length
    if (word.length < 4) {
      setValidationMessage("Word must be at least 4 letters long!");
      setIsValidating(false);
      return;
    }

    // Check if word starts with correct letter
    if (
      gameState.lastLetter &&
      word[0] !== gameState.lastLetter.toLowerCase()
    ) {
      setValidationMessage(
        `Word must start with "${gameState.lastLetter.toUpperCase()}"!`
      );
      setIsValidating(false);
      return;
    }

    // Check if word has been used before
    if (gameState.usedWords.includes(word)) {
      setValidationMessage("This word has already been used!");
      setIsValidating(false);
      return;
    }

    // Validate word exists using Dictionary API with retry logic
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          setValidationMessage("Word not found in dictionary!");
          setGameState((prev) => ({
            ...prev,
            players: prev.players.map((player, index) =>
              index === prev.currentPlayer
                ? { ...player, score: Math.max(0, player.score - 1) }
                : player
            ),
            currentPlayer: prev.currentPlayer === 0 ? 1 : 0,
            timeLeft: 30,
            turnNumber: prev.turnNumber + 1,
          }));
          addScoreChange(gameState.currentPlayer, -1, "Invalid word");
          clearCurrentInput();
          setIsValidating(false);
          setTimeout(checkGameEnd, 100);
          return;
        }

        const data = await response.json();
        const points = calculatePoints(word, gameState.timeLeft);
        const newLastLetter = word[word.length - 1];
        const newUsedWords = [...gameState.usedWords, word];

        // Extract definition from API response with better error handling
        const definition =
          data[0]?.meanings?.[0]?.definitions?.[0]?.definition ||
          data[0]?.meanings?.[1]?.definitions?.[0]?.definition ||
          "No definition available";

        let bonusMessage = "";
        if (word.length >= 7) bonusMessage += " +2 length bonus!";
        else if (word.length >= 6) bonusMessage += " +1 length bonus!";
        if (gameState.timeLeft >= 25) bonusMessage += " +1 speed bonus!";
        else if (gameState.timeLeft >= 20) bonusMessage += " +0.5 speed bonus!";

        const wordEntry: WordEntry = {
          word,
          player: gameState.currentPlayer,
          points,
          turn: gameState.turnNumber + 1,
          definition,
        };

        setGameState((prev) => ({
          ...prev,
          currentWord: word,
          lastLetter: newLastLetter,
          usedWords: newUsedWords,
          wordHistory: [...prev.wordHistory, wordEntry],
          players: prev.players.map((player, index) =>
            index === prev.currentPlayer
              ? {
                  ...player,
                  score: player.score + points,
                  wordsPlayed: player.wordsPlayed + 1,
                  longestWord:
                    word.length > player.longestWord.length
                      ? word
                      : player.longestWord,
                }
              : player
          ),
          currentPlayer: prev.currentPlayer === 0 ? 1 : 0,
          timeLeft: 30,
          turnNumber: prev.turnNumber + 1,
        }));

        addScoreChange(
          gameState.currentPlayer,
          points,
          `"${word}"${bonusMessage}`
        );
        setValidationMessage(
          `Valid word! +${points} points${bonusMessage} Next word must start with "${newLastLetter.toUpperCase()}"`
        );
        clearCurrentInput();
        setTimeout(checkGameEnd, 100);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount > maxRetries) {
          console.error("Dictionary API error:", error);
          setNetworkError(true);
          setValidationMessage(
            "Network error. Please check your connection and try again."
          );
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    setIsValidating(false);
  };

  const calculatePoints = (word: string, timeLeft: number) => {
    let points = 1; // Base point for valid word

    // Bonus for longer words
    if (word.length >= 7) points += 2;
    else if (word.length >= 6) points += 1;

    // Speed bonus
    if (timeLeft >= 25) points += 1; // Very fast (5 seconds or less used)
    else if (timeLeft >= 20) points += 0.5; // Fast (10 seconds or less used)

    return Math.floor(points);
  };

  const addScoreChange = (player: number, points: number, reason: string) => {
    const scoreChange: ScoreChange = {
      player,
      points,
      reason,
      timestamp: Date.now(),
    };

    setGameState((prev) => ({
      ...prev,
      scoreHistory: [...prev.scoreHistory, scoreChange],
    }));

    setRecentScoreChange(scoreChange);
    setTimeout(() => setRecentScoreChange(null), 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStarted && !gameState.gameOver) {
        if (e.key === "Escape" && !isValidating) {
          skipTurn();
        }
      }
      if (selectedWord && e.key === "Escape") {
        setSelectedWord(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.gameStarted, gameState.gameOver, isValidating, selectedWord]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      gameState.gameStarted &&
      !gameState.gameOver &&
      gameState.timeLeft > 0
    ) {
      interval = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            // Time's up, handle timeout
            setTimeout(() => {
              handleTurnTimeout();
              setTimeout(checkGameEnd, 100);
            }, 0);
            return prev;
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.gameStarted, gameState.gameOver, gameState.currentPlayer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Shiritori Game
          </h1>
          <p className="text-gray-600">
            Take turns making words that start with the last letter of the
            previous word!
          </p>
        </div>

        {/* Network Error Banner */}
        {networkError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <strong>Network Error:</strong> Unable to validate words. Please
                check your internet connection.
              </div>
              <button
                onClick={() => setNetworkError(false)}
                className="text-red-700 hover:text-red-900 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Score Change Notification */}
        <ScoreChangeNotification
          scoreChange={recentScoreChange}
          players={gameState.players}
        />

        {/* Word Definition Modal */}
        <WordDefinitionModal
          selectedWord={selectedWord}
          players={gameState.players}
          onClose={() => setSelectedWord(null)}
        />

        {/* Game Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="text-lg font-semibold text-gray-700 text-center sm:text-left">
              {!gameState.gameStarted
                ? "Ready to Play?"
                : gameState.gameOver
                ? `Game Over - ${gameState.winner} Wins!`
                : `${
                    gameState.players[gameState.currentPlayer].name
                  }'s Turn (Turn ${gameState.turnNumber + 1})`}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Game Timer */}
              <GameTimer
                timeLeft={gameState.timeLeft}
                gameStarted={gameState.gameStarted}
                gameOver={gameState.gameOver}
              />
              {!gameState.gameStarted ? (
                <button
                  onClick={startGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Start Game
                </button>
              ) : (
                <button
                  onClick={resetGame}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Reset Game
                </button>
              )}
            </div>
          </div>

          {/* Current Word Display */}
          {gameState.currentWord && (
            <div className="text-center mb-4">
              <div className="text-sm text-gray-500 mb-1">Current Word</div>
              <div className="text-3xl font-bold text-indigo-600">
                {gameState.currentWord}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Next word must start with:{" "}
                <span className="font-bold text-red-600 text-lg">
                  {gameState.lastLetter.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Player Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {gameState.players.map((player, index) => (
            <PlayerSection
              key={index}
              player={player}
              playerIndex={index}
              isCurrentPlayer={gameState.currentPlayer === index}
              gameStarted={gameState.gameStarted}
              gameOver={gameState.gameOver}
              inputValue={index === 0 ? inputWord1 : inputWord2}
              onInputChange={(value) => {
                if (index === 0) {
                  setInputWord1(value);
                } else {
                  setInputWord2(value);
                }
              }}
              onSubmitWord={submitWord}
              onSkipTurn={skipTurn}
              isValidating={isValidating}
              lastLetter={gameState.lastLetter}
            />
          ))}
        </div>

        {validationMessage && gameState.gameStarted && !gameState.gameOver && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg text-center font-semibold ${
                validationMessage.includes("Valid")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
              role="alert"
            >
              {validationMessage}
            </div>
          </div>
        )}

        {gameState.gameStarted && !gameState.gameOver && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="text-sm text-gray-600 text-center">
              <div className="font-semibold mb-1">Scoring & Controls:</div>
              <div>
                • Base: +1 point • 6+ letters: +1 bonus • 7+ letters: +2 bonus
              </div>
              <div>
                • Speed bonus: +1 (≤5s used) or +0.5 (≤10s used) • Press ESC to
                skip turn
              </div>
            </div>
          </div>
        )}

        {/* Word History */}
        <WordHistory
          wordHistory={gameState.wordHistory}
          players={gameState.players}
          onWordClick={setSelectedWord}
        />

        {/* Game Rules */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            How to Play
          </h3>
          <ul className="space-y-2 text-gray-600 ">
            <li className="list-disc">Players take turns entering words</li>
            <li className="list-disc">
              Each word must start with the last letter of the previous word
            </li>
            <li className="list-disc">
              Words must be at least 4 letters long and contain only letters
            </li>
            <li className="list-disc">Words cannot be repeated</li>
            <li className="list-disc">You have 30 seconds per turn</li>
            <li className="list-disc">
              Base scoring: +1 point for valid words, -1 for invalid, -1 for
              skip, -2 for timeout
            </li>
            <li className="list-disc">
              Bonus points: +1 for 6+ letters, +2 for 7+ letters, speed bonuses
              for quick answers
            </li>
            <li className="list-disc">
              Game ends when score difference reaches 10 or someone gets 20
              points
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
