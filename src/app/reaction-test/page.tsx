'use client';

import { useEffect, useRef, useState } from 'react';

interface Player {
  id: string;
  name: string;
  reactionMs: number | null;
  falseStart: boolean;
}

type GameStep =
  | 'setup'
  | 'ready'
  | 'waiting'
  | 'signal'
  | 'roundResult'
  | 'finalResult';

const FALSE_START_PENALTY = 1500;

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

export default function ReactionTestGame() {
  const [step, setStep] = useState<GameStep>('setup');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [setupError, setSetupError] = useState('');

  const signalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signalStartedAtRef = useRef(0);

  const currentPlayer = players[currentPlayerIndex];
  const leaderboard = [...players].sort(
    (left, right) =>
      (left.reactionMs ?? Number.POSITIVE_INFINITY) -
      (right.reactionMs ?? Number.POSITIVE_INFINITY),
  );

  useEffect(() => {
    return () => {
      if (signalTimeoutRef.current) {
        clearTimeout(signalTimeoutRef.current);
      }
    };
  }, []);

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
        reactionMs: null,
        falseStart: false,
      })),
    );

    setPlayers(gamePlayers);
    setCurrentPlayerIndex(0);
    setSetupError('');
    setStep('ready');
  };

  const beginAttempt = () => {
    setStep('waiting');
    const delay = 1800 + Math.random() * 3200;

    signalTimeoutRef.current = setTimeout(() => {
      signalStartedAtRef.current = performance.now();
      setStep('signal');
      signalTimeoutRef.current = null;
    }, delay);
  };

  const saveAttempt = (reactionMs: number, falseStart: boolean) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) =>
        index === currentPlayerIndex
          ? { ...player, reactionMs, falseStart }
          : player,
      ),
    );
    setStep('roundResult');
  };

  const pressReactionArea = () => {
    if (step === 'waiting') {
      if (signalTimeoutRef.current) {
        clearTimeout(signalTimeoutRef.current);
        signalTimeoutRef.current = null;
      }
      saveAttempt(FALSE_START_PENALTY, true);
      return;
    }

    if (step === 'signal') {
      saveAttempt(Math.round(performance.now() - signalStartedAtRef.current), false);
    }
  };

  const moveToNextPlayer = () => {
    if (currentPlayerIndex === players.length - 1) {
      setStep('finalResult');
      return;
    }

    setCurrentPlayerIndex((index) => index + 1);
    setStep('ready');
  };

  const replayWithSamePlayers = () => {
    setPlayers((currentPlayers) =>
      shuffle(
        currentPlayers.map((player) => ({
          ...player,
          reactionMs: null,
          falseStart: false,
        })),
      ),
    );
    setCurrentPlayerIndex(0);
    setStep('ready');
  };

  const resetGame = () => {
    if (signalTimeoutRef.current) {
      clearTimeout(signalTimeoutRef.current);
      signalTimeoutRef.current = null;
    }
    setStep('setup');
    setPlayerCount(2);
    setPlayerNames(['', '']);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setSetupError('');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="mb-2 text-sm font-bold tracking-widest text-rose-600">REACTION TEST</p>
        <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">⚡ 반응속도 테스트</h1>
      </div>

      {step === 'setup' && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-7 text-white md:px-8">
            <h2 className="text-2xl font-bold">누가 가장 빠를까요?</h2>
            <p className="mt-2 text-rose-50">
              화면이 초록색으로 바뀌는 순간 터치하세요. 먼저 누르면 1,500ms 페널티!
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
              className="mb-7 h-2 w-full cursor-pointer appearance-none rounded-lg bg-rose-100 accent-rose-500"
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
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-800 outline-none transition focus:border-rose-400"
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
              className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 py-4 font-bold text-white shadow-lg transition hover:from-rose-600 hover:to-orange-600"
            >
              게임 시작
            </button>
          </div>
        </section>
      )}

      {step === 'ready' && currentPlayer && (
        <section className="rounded-2xl bg-white p-6 text-center shadow-lg md:p-8">
          <p className="text-sm font-bold tracking-widest text-rose-500">
            {currentPlayerIndex + 1} / {players.length}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-800">
            {currentPlayer.name}님의 차례
          </h2>
          <div className="mx-auto my-8 max-w-lg rounded-2xl bg-rose-50 p-6 text-gray-700">
            <p className="text-lg font-semibold">손가락을 준비하세요.</p>
            <p className="mt-2 text-sm text-gray-500">
              시작 후에는 화면이 초록색으로 바뀔 때까지 기다려야 합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={beginAttempt}
            className="w-full rounded-xl bg-gray-900 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-gray-800"
          >
            준비 완료
          </button>
        </section>
      )}

      {(step === 'waiting' || step === 'signal') && currentPlayer && (
        <button
          type="button"
          onPointerDown={pressReactionArea}
          className={`flex min-h-[480px] w-full touch-manipulation flex-col items-center justify-center rounded-2xl p-8 text-center text-white shadow-xl transition-colors select-none ${
            step === 'signal'
              ? 'bg-gradient-to-br from-emerald-400 to-green-600'
              : 'bg-gradient-to-br from-slate-700 to-slate-900'
          }`}
        >
          <span className="text-7xl md:text-8xl">{step === 'signal' ? '⚡' : '✋'}</span>
          <span className="mt-6 text-4xl font-black md:text-5xl">
            {step === 'signal' ? '지금 터치!' : '기다리세요...'}
          </span>
          <span className="mt-3 text-lg opacity-80">
            {step === 'signal' ? '최대한 빠르게!' : '초록색이 되기 전에 누르면 안 돼요'}
          </span>
        </button>
      )}

      {step === 'roundResult' && currentPlayer && (
        <section className="rounded-2xl bg-white p-6 text-center shadow-lg md:p-8">
          <p className="text-sm font-bold tracking-widest text-rose-500">
            {currentPlayer.name}님의 기록
          </p>
          {currentPlayer.falseStart ? (
            <>
              <div className="my-6 text-7xl">😅</div>
              <h2 className="text-3xl font-black text-red-500">너무 빨랐어요!</h2>
              <p className="mt-3 text-lg text-gray-600">
                페널티 기록 <strong>{FALSE_START_PENALTY.toLocaleString()}ms</strong>
              </p>
            </>
          ) : (
            <>
              <div className="my-6 text-7xl">🎯</div>
              <p className="text-6xl font-black text-rose-500">
                {currentPlayer.reactionMs}ms
              </p>
              <p className="mt-3 text-gray-500">
                {(currentPlayer.reactionMs ?? 1000) < 250
                  ? '번개처럼 빨라요!'
                  : (currentPlayer.reactionMs ?? 1000) < 350
                    ? '아주 좋은 반응속도예요!'
                    : '다음에는 더 빠르게 도전해보세요!'}
              </p>
            </>
          )}
          <button
            type="button"
            onClick={moveToNextPlayer}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 py-4 font-bold text-white shadow-lg"
          >
            {currentPlayerIndex === players.length - 1 ? '최종 결과 보기' : '다음 플레이어'}
          </button>
        </section>
      )}

      {step === 'finalResult' && (
        <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
          <div className="text-center">
            <div className="text-6xl">🏆</div>
            <h2 className="mt-3 text-3xl font-bold text-gray-800">반응속도 순위</h2>
            <p className="mt-2 text-gray-500">기록이 낮을수록 빠릅니다.</p>
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
                    {player.falseStart && <p className="text-xs opacity-80">성급한 터치</p>}
                  </div>
                </div>
                <span className="text-xl font-black">{player.reactionMs}ms</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={replayWithSamePlayers}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 py-4 font-bold text-white shadow-lg"
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
