'use client';

import { useState, useRef, useEffect } from 'react';

interface Player {
  name: string;
  time: number;
  difference: number;
  order: number;
}

export default function TimerChallengeGame() {
  const [step, setStep] = useState<'setup' | 'playing' | 'results'>('setup');
  const [targetSeconds, setTargetSeconds] = useState(5);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<Player[]>([]);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newNames = Array(playerCount).fill('').map((_, i) => playerNames[i] || '');
    setPlayerNames(newNames);
  }, [playerCount]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startGame = () => {
    if (playerNames.some(name => !name.trim())) {
      alert('모든 플레이어의 이름을 입력해주세요!');
      return;
    }

    // 랜덤으로 순서 정하기
    const shuffledPlayers = playerNames
      .map((name, index) => ({ name, time: 0, difference: 0, order: index }))
      .sort(() => Math.random() - 0.5)
      .map((player, index) => ({ ...player, order: index + 1 }));

    setPlayers(shuffledPlayers);
    setCurrentPlayerIndex(0);
    setStep('playing');
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setShowResult(false);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
    }, 10);
  };

  const stopTimer = () => {
    if (!isTimerRunning) return;

    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalTime = (Date.now() - startTimeRef.current) / 1000;
    const difference = Math.abs(finalTime - targetSeconds);

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].time = finalTime;
    updatedPlayers[currentPlayerIndex].difference = difference;
    setPlayers(updatedPlayers);

    setElapsedTime(finalTime);
    setShowResult(true);

    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setShowResult(false);
        setElapsedTime(0);
      } else {
        // 게임 종료, 결과 표시
        const sortedPlayers = [...updatedPlayers].sort((a, b) => a.difference - b.difference);
        setResults(sortedPlayers);
        setStep('results');
      }
    }, 2500);
  };

  const resetGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStep('setup');
    setTargetSeconds(5);
    setPlayerCount(2);
    setPlayerNames(['', '']);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setIsTimerRunning(false);
    setElapsedTime(0);
    setShowResult(false);
    setResults([]);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">⏱️ N초 맞추기 게임</h1>

      {step === 'setup' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-6">게임 설정</h2>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              목표 시간: {targetSeconds}초
            </label>
            <input
              type="range"
              min="3"
              max="30"
              value={targetSeconds}
              onChange={(e) => setTargetSeconds(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              플레이어 수: {playerCount}명
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-3 mb-6">
            {playerNames.map((name, index) => (
              <input
                key={index}
                type="text"
                placeholder={`플레이어 ${index + 1} 이름`}
                value={name}
                onChange={(e) => {
                  const newNames = [...playerNames];
                  newNames[index] = e.target.value;
                  setPlayerNames(newNames);
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            ))}
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            게임 시작
          </button>
        </div>
      )}

      {step === 'playing' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-indigo-600">
                {players[currentPlayerIndex].name}님의 차례
              </h2>
              <span className="text-gray-600">
                {currentPlayerIndex + 1} / {players.length}
              </span>
            </div>
            <p className="text-gray-600 mb-2">
              목표: <span className="font-bold text-indigo-600">{targetSeconds}초</span>를 정확히 맞춰보세요!
            </p>
            <p className="text-sm text-gray-500">
              시작 버튼을 누른 후, 타이머를 보지 않고 {targetSeconds}초가 지났다고 생각되면 정지 버튼을 누르세요.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-12 mb-6">
            <div className="text-center">
              {!isTimerRunning && !showResult && (
                <button
                  onClick={startTimer}
                  className="px-12 py-6 bg-gradient-to-r from-green-500 to-green-600 text-white text-2xl font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg transform hover:scale-105"
                >
                  시작
                </button>
              )}

              {isTimerRunning && (
                <div>
                  <div className="mb-8 text-6xl font-bold text-gray-400 animate-pulse">
                    ???
                  </div>
                  <button
                    onClick={stopTimer}
                    className="px-12 py-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-2xl font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg transform hover:scale-105"
                  >
                    정지!
                  </button>
                </div>
              )}

              {showResult && (
                <div>
                  <div className="mb-4">
                    <div className="text-6xl font-bold text-indigo-600 mb-2">
                      {elapsedTime.toFixed(2)}초
                    </div>
                    <div className="text-2xl text-gray-600">
                      오차: {players[currentPlayerIndex].difference.toFixed(2)}초
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${
                    players[currentPlayerIndex].difference < 0.5
                      ? 'text-green-600'
                      : players[currentPlayerIndex].difference < 1
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {players[currentPlayerIndex].difference < 0.5
                      ? '완벽해요! 🎉'
                      : players[currentPlayerIndex].difference < 1
                      ? '좋아요! 👍'
                      : '아쉬워요! 💪'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-6">🏆 게임 결과</h2>

          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <p className="text-center text-gray-700">
              목표 시간: <span className="font-bold text-indigo-600">{targetSeconds}초</span>
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {results.map((player, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                  </span>
                  <div>
                    <div className="font-semibold text-lg">{player.name}</div>
                    <div className="text-sm opacity-90">
                      {player.time.toFixed(2)}초
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    ±{player.difference.toFixed(2)}초
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            다시 하기
          </button>
        </div>
      )}
    </div>
  );
}
