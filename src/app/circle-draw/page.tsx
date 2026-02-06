'use client';

import { useState, useRef, useEffect } from 'react';

interface Player {
  name: string;
  score: number;
  order: number;
}

export default function CircleDrawGame() {
  const [step, setStep] = useState<'setup' | 'playing' | 'results'>('setup');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [results, setResults] = useState<Player[]>([]);
  const [currentScore, setCurrentScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const newNames = Array(playerCount).fill('').map((_, i) => playerNames[i] || '');
    setPlayerNames(newNames);
  }, [playerCount]);

  const startGame = () => {
    if (playerNames.some(name => !name.trim())) {
      alert('모든 플레이어의 이름을 입력해주세요!');
      return;
    }

    // 랜덤으로 순서 정하기
    const shuffledPlayers = playerNames
      .map((name, index) => ({ name, score: 0, order: index }))
      .sort(() => Math.random() - 0.5)
      .map((player, index) => ({ ...player, order: index + 1 }));

    setPlayers(shuffledPlayers);
    setCurrentPlayerIndex(0);
    setStep('playing');
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setCurrentScore(0);
    const coords = getCoordinates(e);
    if (!coords) return;

    setPoints([coords]);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const newPoints = [...points, coords];
    setPoints(newPoints);

    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 실시간 점수 계산
    if (newPoints.length > 10) {
      const score = calculateCircleScore(newPoints);
      setCurrentScore(score);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.closePath();

    // 원형도 계산
    const score = calculateCircleScore(points);
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].score = score;
    setPlayers(updatedPlayers);

    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        clearCanvas();
        setPoints([]);
        setCurrentScore(0);
      } else {
        // 게임 종료, 결과 표시
        const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
        setResults(sortedPlayers);
        setStep('results');
      }
    }, 1500);
  };

  const calculateCircleScore = (points: { x: number; y: number }[]) => {
    if (points.length < 10) return 0;

    // 중심점 계산
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    // 각 점에서 중심까지의 거리 계산
    const distances = points.map(p =>
      Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
    );

    // 평균 반지름
    const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    // 표준편차 계산 (원에서 얼마나 벗어났는지)
    const variance =
      distances.reduce((sum, d) => sum + Math.pow(d - avgRadius, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    // 점수 계산 (표준편차가 작을수록 높은 점수)
    const score = Math.max(0, 100 - stdDev);
    return Math.round(score * 100) / 100;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  };

  const resetGame = () => {
    setStep('setup');
    setPlayerCount(2);
    setPlayerNames(['', '']);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setResults([]);
    setPoints([]);
    setCurrentScore(0);
    clearCanvas();
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">🎨 원 그리기 게임</h1>

      {step === 'setup' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-purple-600 mb-6">게임 설정</h2>

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
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            ))}
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            게임 시작
          </button>
        </div>
      )}

      {step === 'playing' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-purple-600">
                {players[currentPlayerIndex].name}님의 차례
              </h2>
              <span className="text-gray-600">
                {currentPlayerIndex + 1} / {players.length}
              </span>
            </div>
            <p className="text-gray-600">
              아래 캔버스에 최대한 완벽한 원을 그려보세요!
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="border-4 border-purple-300 rounded-lg cursor-crosshair bg-white mx-auto w-full"
              style={{ touchAction: 'none', maxWidth: '600px', aspectRatio: '1/1' }}
            />
            {/* 점수 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className={`text-8xl md:text-9xl font-bold transition-all ${
                  isDrawing
                    ? 'text-gray-400/30'
                    : players[currentPlayerIndex].score > 0
                    ? 'text-green-500/40'
                    : 'text-gray-300/30'
                }`}>
                  {isDrawing
                    ? currentScore.toFixed(0)
                    : players[currentPlayerIndex].score > 0
                    ? players[currentPlayerIndex].score.toFixed(0)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-purple-600 mb-6">🏆 게임 결과</h2>

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
                  <span className="font-semibold text-lg">{player.name}</span>
                </div>
                <span className="text-xl font-bold">{player.score}점</span>
              </div>
            ))}
          </div>

          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            다시 하기
          </button>
        </div>
      )}
    </div>
  );
}
