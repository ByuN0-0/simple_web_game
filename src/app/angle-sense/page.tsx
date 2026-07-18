'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface Player {
  id: string;
  name: string;
  angle: number | null;
  difference: number | null;
}

type GameStep = 'setup' | 'handoff' | 'drawing' | 'roundResult' | 'finalResult';

const ORIGIN_X = 300;
const ORIGIN_Y = 315;
const RAY_LENGTH = 245;

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function createTargetAngle(): number {
  return (Math.floor(Math.random() * 31) + 3) * 5;
}

function getRayEnd(angle: number, length = RAY_LENGTH) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: ORIGIN_X + Math.cos(radians) * length,
    y: ORIGIN_Y - Math.sin(radians) * length,
  };
}

export default function AngleSenseGame() {
  const [step, setStep] = useState<GameStep>('setup');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [targetAngle, setTargetAngle] = useState(45);
  const [currentAngle, setCurrentAngle] = useState(90);
  const [hasAdjusted, setHasAdjusted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [setupError, setSetupError] = useState('');

  const surfaceRef = useRef<SVGSVGElement>(null);
  const currentPlayer = players[currentPlayerIndex];
  const leaderboard = [...players].sort(
    (left, right) =>
      (left.difference ?? Number.POSITIVE_INFINITY) -
      (right.difference ?? Number.POSITIVE_INFINITY),
  );

  const playerRayEnd = getRayEnd(currentAngle);
  const targetRayEnd = getRayEnd(targetAngle);

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);
    setPlayerNames((currentNames) =>
      Array.from({ length: count }, (_, index) => currentNames[index] ?? ''),
    );
    setSetupError('');
  };

  const startGame = () => {
    const names = playerNames.map((name) => name.trim());

    if (names.some((name) => name.length === 0)) {
      setSetupError('모든 플레이어의 이름을 입력해주세요.');
      return;
    }

    const normalizedNames = names.map((name) => name.toLocaleLowerCase('ko-KR'));
    if (new Set(normalizedNames).size !== names.length) {
      setSetupError('플레이어 이름은 서로 다르게 입력해주세요.');
      return;
    }

    const gamePlayers = shuffle(
      names.map((name, index) => ({
        id: `player-${index + 1}`,
        name,
        angle: null,
        difference: null,
      })),
    );

    setPlayers(gamePlayers);
    setTargetAngle(createTargetAngle());
    setCurrentPlayerIndex(0);
    setCurrentAngle(90);
    setHasAdjusted(false);
    setSetupError('');
    setStep('handoff');
  };

  const beginDrawing = () => {
    setCurrentAngle(90);
    setHasAdjusted(false);
    setStep('drawing');
  };

  const updateAngleFromPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 600;
    const y = ((event.clientY - rect.top) / rect.height) * 360;
    const angle = (Math.atan2(ORIGIN_Y - y, x - ORIGIN_X) * 180) / Math.PI;
    const normalizedAngle = Math.max(0, Math.min(180, angle < 0 ? 0 : angle));

    setCurrentAngle(Math.round(normalizedAngle * 10) / 10);
    setHasAdjusted(true);
  };

  const startDragging = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateAngleFromPointer(event);
  };

  const dragRay = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateAngleFromPointer(event);
  };

  const stopDragging = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateAngleFromPointer(event);
    setIsDragging(false);
  };

  const submitAngle = () => {
    if (!hasAdjusted) return;

    const roundedAngle = Math.round(currentAngle * 10) / 10;
    const difference = Math.round(Math.abs(roundedAngle - targetAngle) * 10) / 10;

    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) =>
        index === currentPlayerIndex
          ? { ...player, angle: roundedAngle, difference }
          : player,
      ),
    );
    setStep('roundResult');
  };

  const moveToNextPlayer = () => {
    if (currentPlayerIndex === players.length - 1) {
      setStep('finalResult');
      return;
    }

    setCurrentPlayerIndex((index) => index + 1);
    setCurrentAngle(90);
    setHasAdjusted(false);
    setStep('handoff');
  };

  const replayWithSamePlayers = () => {
    setPlayers((currentPlayers) =>
      shuffle(
        currentPlayers.map((player) => ({
          ...player,
          angle: null,
          difference: null,
        })),
      ),
    );
    setTargetAngle(createTargetAngle());
    setCurrentPlayerIndex(0);
    setCurrentAngle(90);
    setHasAdjusted(false);
    setStep('handoff');
  };

  const resetGame = () => {
    setStep('setup');
    setPlayerCount(2);
    setPlayerNames(['', '']);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setTargetAngle(45);
    setCurrentAngle(90);
    setHasAdjusted(false);
    setIsDragging(false);
    setSetupError('');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="mb-2 text-sm font-bold tracking-widest text-sky-600">ANGLE SENSE</p>
        <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">📐 각도 감각</h1>
      </div>

      {step === 'setup' && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-7 text-white md:px-8">
            <h2 className="text-2xl font-bold">눈대중으로 각도를 맞혀보세요</h2>
            <p className="mt-2 text-sky-50">
              숫자 표시 없이 선을 움직여 목표 각도에 가장 가깝게 맞히면 승리!
            </p>
          </div>

          <div className="p-6 md:p-8">
            <label className="mb-2 block font-semibold text-gray-700">
              플레이어 수: {playerCount}명
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={playerCount}
              onChange={(event) => updatePlayerCount(Number(event.target.value))}
              className="mb-7 h-2 w-full cursor-pointer appearance-none rounded-lg bg-sky-100 accent-sky-500"
            />

            <div className="mb-6 space-y-3">
              {playerNames.map((name, index) => (
                <input
                  key={index}
                  type="text"
                  value={name}
                  onChange={(event) => {
                    const nextNames = [...playerNames];
                    nextNames[index] = event.target.value;
                    setPlayerNames(nextNames);
                    setSetupError('');
                  }}
                  placeholder={`플레이어 ${index + 1} 이름`}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-800 outline-none transition focus:border-sky-400"
                />
              ))}
            </div>

            {setupError && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {setupError}
              </p>
            )}

            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 py-4 font-bold text-white shadow-lg transition hover:from-sky-600 hover:to-blue-700"
            >
              게임 시작
            </button>
          </div>
        </section>
      )}

      {step === 'handoff' && currentPlayer && (
        <section className="rounded-2xl bg-white p-6 text-center shadow-lg md:p-8">
          <p className="text-sm font-bold tracking-widest text-sky-500">
            {currentPlayerIndex + 1} / {players.length}
          </p>
          <div className="my-6 text-7xl">📱</div>
          <h2 className="text-3xl font-bold text-gray-800">{currentPlayer.name}님에게 넘겨주세요</h2>
          <p className="mt-3 text-gray-500">준비되면 목표 각도가 공개됩니다.</p>
          <button
            type="button"
            onClick={beginDrawing}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-lg font-bold text-white shadow-lg"
          >
            준비 완료
          </button>
        </section>
      )}

      {(step === 'drawing' || step === 'roundResult') && currentPlayer && (
        <section className="rounded-2xl bg-white p-4 shadow-lg md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-sky-500">{currentPlayer.name}님의 도전</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-800">
                목표 각도 <span className="text-sky-600">{targetAngle}°</span>
              </h2>
            </div>
            <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              {step === 'drawing' ? '선을 드래그하세요' : '정답 공개'}
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border-2 border-sky-100 bg-gradient-to-b from-sky-50 to-white">
            <svg
              ref={surfaceRef}
              viewBox="0 0 600 360"
              role="img"
              aria-label="각도를 그리는 영역"
              onPointerDown={step === 'drawing' ? startDragging : undefined}
              onPointerMove={step === 'drawing' ? dragRay : undefined}
              onPointerUp={step === 'drawing' ? stopDragging : undefined}
              onPointerCancel={() => setIsDragging(false)}
              className={`block aspect-[5/3] w-full select-none ${
                step === 'drawing' ? 'cursor-crosshair touch-none' : ''
              }`}
            >
              <line
                x1={ORIGIN_X}
                y1={ORIGIN_Y}
                x2="570"
                y2={ORIGIN_Y}
                stroke="#94a3b8"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {step === 'roundResult' && (
                <line
                  x1={ORIGIN_X}
                  y1={ORIGIN_Y}
                  x2={targetRayEnd.x}
                  y2={targetRayEnd.y}
                  stroke="#22c55e"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="14 10"
                />
              )}

              <line
                x1={ORIGIN_X}
                y1={ORIGIN_Y}
                x2={playerRayEnd.x}
                y2={playerRayEnd.y}
                stroke="#0284c7"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <circle cx={ORIGIN_X} cy={ORIGIN_Y} r="13" fill="#0f172a" />
              <circle
                cx={playerRayEnd.x}
                cy={playerRayEnd.y}
                r="18"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="8"
              />
              <text x="485" y="345" fill="#64748b" fontSize="18" fontWeight="700">
                기준선 0°
              </text>
            </svg>
          </div>

          {step === 'drawing' ? (
            <>
              <p className="mt-4 text-center text-sm text-gray-500">
                파란 선이나 빈 공간을 누른 채 움직이세요. 현재 각도 숫자는 결과에서 공개됩니다.
              </p>
              <button
                type="button"
                onClick={submitAngle}
                disabled={!hasAdjusted}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-lg font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
              >
                이 각도로 결정
              </button>
            </>
          ) : (
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
                <div className="rounded-xl bg-gray-100 p-3 sm:p-4">
                  <p className="text-xs font-semibold text-gray-500 sm:text-sm">목표</p>
                  <p className="mt-1 text-2xl font-black text-gray-800">{targetAngle}°</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold text-sky-600 sm:text-sm">내 각도</p>
                  <p className="mt-1 text-2xl font-black text-sky-700">{currentPlayer.angle}°</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold text-emerald-600 sm:text-sm">오차</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">{currentPlayer.difference}°</p>
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-gray-600">
                초록 점선이 목표 각도입니다.
              </p>
              <button
                type="button"
                onClick={moveToNextPlayer}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 font-bold text-white shadow-lg"
              >
                {currentPlayerIndex === players.length - 1 ? '최종 결과 보기' : '다음 플레이어'}
              </button>
            </div>
          )}
        </section>
      )}

      {step === 'finalResult' && (
        <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
          <div className="text-center">
            <div className="text-6xl">🏆</div>
            <h2 className="mt-3 text-3xl font-bold text-gray-800">각도 감각 순위</h2>
            <p className="mt-2 text-gray-500">
              목표 {targetAngle}° · 오차가 작을수록 높은 순위입니다.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-xl p-4 ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                  </span>
                  <div>
                    <p className="font-bold">{player.name}</p>
                    <p className="text-xs opacity-80">선택 {player.angle}°</p>
                  </div>
                </div>
                <span className="text-xl font-black">오차 {player.difference}°</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={replayWithSamePlayers}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 font-bold text-white shadow-lg"
            >
              같은 멤버로 다시 하기
            </button>
            <button
              type="button"
              onClick={resetGame}
              className="rounded-xl bg-gray-200 py-4 font-bold text-gray-700 transition hover:bg-gray-300"
            >
              처음으로
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
