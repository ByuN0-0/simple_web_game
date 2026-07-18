'use client';

import { FormEvent, useMemo, useState } from 'react';
import { NUMBER_QUESTIONS, NumberQuestion } from './questions';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface RoundAnswer {
  playerId: string;
  value: number;
  difference: number;
}

type GameStep = 'setup' | 'handoff' | 'answering' | 'roundResult' | 'finalResult';

const DEFAULT_ROUND_COUNT = 5;
const MIN_ROUND_COUNT = 1;
const MAX_ROUND_COUNT = 20;
const TIE_TOLERANCE = 1e-9;

function shuffle<T>(items: T[]): T[] {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

function pickQuestions(count: number): NumberQuestion[] {
  const questionsByCategory = new Map<
    NumberQuestion['category'],
    NumberQuestion[]
  >();

  for (const question of NUMBER_QUESTIONS) {
    const categoryQuestions = questionsByCategory.get(question.category) ?? [];
    categoryQuestions.push(question);
    questionsByCategory.set(question.category, categoryQuestions);
  }

  const categoryQueues = new Map(
    [...questionsByCategory].map(([category, questions]) => [category, shuffle(questions)]),
  );
  const categories = shuffle([...categoryQueues.keys()]);
  const selectedQuestions: NumberQuestion[] = [];
  let categoryIndex = 0;

  while (selectedQuestions.length < count) {
    const category = categories[categoryIndex % categories.length];
    const categoryQuestions = categoryQueues.get(category);
    const nextQuestion = categoryQuestions?.pop();

    if (nextQuestion) {
      selectedQuestions.push(nextQuestion);
    }

    categoryIndex += 1;

    if ([...categoryQueues.values()].every((questions) => questions.length === 0)) {
      break;
    }
  }

  return selectedQuestions;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 6,
  }).format(value);
}

function isSameDifference(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIE_TOLERANCE;
}

export default function NumberSenseGame() {
  const [step, setStep] = useState<GameStep>('setup');
  const [playerCount, setPlayerCount] = useState(2);
  const [roundCount, setRoundCount] = useState(DEFAULT_ROUND_COUNT);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<NumberQuestion[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [roundAnswers, setRoundAnswers] = useState<RoundAnswer[]>([]);
  const [setupError, setSetupError] = useState('');
  const [answerError, setAnswerError] = useState('');

  const currentQuestion = questions[roundIndex];
  const currentPlayer = players[playerIndex];

  const sortedRoundAnswers = useMemo(() => {
    return [...roundAnswers].sort((left, right) => left.difference - right.difference);
  }, [roundAnswers]);

  const leaderboard = useMemo(() => {
    return [...players].sort((left, right) => right.score - left.score);
  }, [players]);

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);
    setPlayerNames((currentNames) =>
      Array.from({ length: count }, (_, index) => currentNames[index] ?? ''),
    );
    setSetupError('');
  };

  const beginGame = (gamePlayers: Player[]) => {
    setPlayers(gamePlayers);
    setQuestions(pickQuestions(roundCount));
    setRoundIndex(0);
    setPlayerIndex(0);
    setRoundAnswers([]);
    setAnswerInput('');
    setAnswerError('');
    setStep('handoff');
  };

  const startGame = () => {
    const names = playerNames.map((name) => name.trim());

    if (names.some((name) => name.length === 0)) {
      setSetupError('모든 플레이어의 이름을 입력해주세요.');
      return;
    }

    const normalizedNames = names.map((name) => name.toLocaleLowerCase('ko-KR'));
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      setSetupError('플레이어 이름은 서로 다르게 입력해주세요.');
      return;
    }

    const newPlayers = names.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      score: 0,
    }));

    setSetupError('');
    beginGame(newPlayers);
  };

  const showAnswerForm = () => {
    setAnswerInput('');
    setAnswerError('');
    setStep('answering');
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (answerInput.trim() === '') {
      setAnswerError('답을 입력해주세요.');
      return;
    }

    const value = Number(answerInput);
    if (!Number.isFinite(value) || value < 0) {
      setAnswerError('0 이상의 유한한 숫자를 입력해주세요.');
      return;
    }

    const completedAnswers = [
      ...roundAnswers,
      {
        playerId: currentPlayer.id,
        value,
        difference: Math.abs(value - currentQuestion.answer),
      },
    ];

    setRoundAnswers(completedAnswers);
    setAnswerInput('');
    setAnswerError('');

    if (playerIndex < players.length - 1) {
      setPlayerIndex((currentIndex) => currentIndex + 1);
      setStep('handoff');
      return;
    }

    const smallestDifference = Math.min(
      ...completedAnswers.map((answer) => answer.difference),
    );
    const winnerIds = new Set(
      completedAnswers
        .filter((answer) => isSameDifference(answer.difference, smallestDifference))
        .map((answer) => answer.playerId),
    );

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => ({
        ...player,
        score: player.score + (winnerIds.has(player.id) ? 1 : 0),
      })),
    );
    setStep('roundResult');
  };

  const moveToNextRound = () => {
    if (roundIndex === questions.length - 1) {
      setStep('finalResult');
      return;
    }

    setRoundIndex((currentIndex) => currentIndex + 1);
    setPlayerIndex(0);
    setRoundAnswers([]);
    setAnswerInput('');
    setAnswerError('');
    setStep('handoff');
  };

  const replayWithSamePlayers = () => {
    beginGame(players.map((player) => ({ ...player, score: 0 })));
  };

  const resetGame = () => {
    setStep('setup');
    setPlayerCount(2);
    setRoundCount(DEFAULT_ROUND_COUNT);
    setPlayerNames(['', '']);
    setPlayers([]);
    setQuestions([]);
    setRoundIndex(0);
    setPlayerIndex(0);
    setAnswerInput('');
    setRoundAnswers([]);
    setSetupError('');
    setAnswerError('');
  };

  const getPlayerName = (playerId: string) =>
    players.find((player) => player.id === playerId)?.name ?? '';

  const getRoundRank = (answerIndex: number) => {
    if (answerIndex === 0) return 1;

    const currentDifference = sortedRoundAnswers[answerIndex].difference;
    const previousDifference = sortedRoundAnswers[answerIndex - 1].difference;

    if (isSameDifference(currentDifference, previousDifference)) {
      return getRoundRank(answerIndex - 1);
    }

    return answerIndex + 1;
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="mb-2 text-sm font-bold tracking-widest text-emerald-600">NUMBER SENSE</p>
        <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">🎯 숫자 감각 게임</h1>
      </div>

      {step === 'setup' && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-7 text-white md:px-8">
            <h2 className="text-2xl font-bold">누가 숫자에 가장 가까울까요?</h2>
            <p className="mt-2 text-emerald-50">
              원하는 만큼 문제를 풀고, 정답에 가장 가까운 사람이 라운드 점수를 얻습니다.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="player-count" className="font-bold text-gray-700">
                  플레이어 수
                </label>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                  {playerCount}명
                </span>
              </div>
              <input
                id="player-count"
                type="range"
                min="2"
                max="8"
                value={playerCount}
                onChange={(event) => updatePlayerCount(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-emerald-100 accent-emerald-600"
              />
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>2명</span>
                <span>8명</span>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="round-count" className="font-bold text-gray-700">
                  문제 수
                </label>
                <span className="rounded-full bg-teal-100 px-3 py-1 font-bold text-teal-700">
                  {roundCount}문제
                </span>
              </div>
              <input
                id="round-count"
                type="range"
                min={MIN_ROUND_COUNT}
                max={MAX_ROUND_COUNT}
                value={roundCount}
                onChange={(event) => setRoundCount(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-teal-100 accent-teal-600"
              />
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>{MIN_ROUND_COUNT}문제</span>
                <span>{MAX_ROUND_COUNT}문제</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                지리·과학·스포츠·생활·문화·음식 문제가 최대한 골고루 나옵니다.
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-3 font-bold text-gray-700">플레이어 이름</p>
              <div className="grid gap-3 md:grid-cols-2">
                {playerNames.map((name, index) => (
                  <label key={index} className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      maxLength={16}
                      placeholder={`플레이어 ${index + 1}`}
                      aria-label={`플레이어 ${index + 1} 이름`}
                      onChange={(event) => {
                        const nextNames = [...playerNames];
                        nextNames[index] = event.target.value;
                        setPlayerNames(nextNames);
                        setSetupError('');
                      }}
                      className="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                ))}
              </div>
            </div>

            {setupError && (
              <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {setupError}
              </p>
            )}

            <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-bold">한 기기를 돌아가며 플레이해요</p>
              <p className="mt-1 text-amber-700">
                답은 제출 즉시 가려집니다. 게임 기록은 브라우저에만 머물며 새로고침하면 초기화됩니다.
              </p>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              {roundCount}라운드 시작하기
            </button>
          </div>
        </section>
      )}

      {step === 'handoff' && currentQuestion && currentPlayer && (
        <section className="rounded-2xl bg-white p-6 text-center shadow-lg md:p-10">
          <div className="mb-8 flex items-center justify-between text-sm font-semibold text-gray-500">
            <span>{roundIndex + 1} / {questions.length} 라운드</span>
            <span>{playerIndex + 1} / {players.length}명</span>
          </div>

          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-5xl">
            🙈
          </div>
          <p className="text-gray-500">기기를 다음 플레이어에게 건네주세요</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">{currentPlayer.name}님 차례!</h2>
          <p className="mt-4 text-sm text-gray-500">
            다른 사람의 답을 보지 않도록 혼자 화면을 보고 시작하세요.
          </p>

          <button
            type="button"
            onClick={showAnswerForm}
            className="mt-8 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700 md:max-w-md"
          >
            준비됐어요
          </button>
        </section>
      )}

      {step === 'answering' && currentQuestion && currentPlayer && (
        <section className="rounded-2xl bg-white p-6 shadow-lg md:p-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-600">ROUND {roundIndex + 1}</p>
              <p className="mt-1 font-bold text-gray-700">{currentPlayer.name}님의 답</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
              {currentQuestion.category}
            </span>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-10 text-center md:px-10">
            <h2 className="text-2xl font-bold leading-relaxed text-gray-800 md:text-3xl">
              {currentQuestion.question}
            </h2>
          </div>

          <form onSubmit={submitAnswer} className="mx-auto mt-7 max-w-lg">
            <label htmlFor="answer" className="mb-2 block font-bold text-gray-700">
              예상 숫자
            </label>
            <div className="flex overflow-hidden rounded-xl border-2 border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
              <input
                id="answer"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                autoFocus
                value={answerInput}
                onChange={(event) => {
                  setAnswerInput(event.target.value);
                  setAnswerError('');
                }}
                placeholder="숫자를 입력하세요"
                className="min-w-0 flex-1 px-4 py-4 text-xl font-bold text-gray-800 outline-none"
              />
              <span className="flex items-center bg-gray-100 px-4 font-bold text-gray-600">
                {currentQuestion.unit}
              </span>
            </div>

            {answerError && (
              <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
                {answerError}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700"
            >
              답 제출하고 가리기
            </button>
          </form>
        </section>
      )}

      {step === 'roundResult' && currentQuestion && (
        <section className="rounded-2xl bg-white p-5 shadow-lg md:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-bold tracking-wider text-emerald-600">ROUND {roundIndex + 1} RESULT</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-800">정답 공개!</h2>
          </div>

          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-center text-white">
            <p className="text-sm text-emerald-50">{currentQuestion.question}</p>
            <p className="mt-3 text-4xl font-black md:text-5xl">
              {formatNumber(currentQuestion.answer)} <span className="text-2xl">{currentQuestion.unit}</span>
            </p>
            <p className="mt-3 text-sm text-emerald-50">{currentQuestion.explanation}</p>
          </div>

          <div className="space-y-3">
            {sortedRoundAnswers.map((answer, index) => {
              const rank = getRoundRank(index);
              const isWinner = rank === 1;

              return (
                <div
                  key={answer.playerId}
                  className={`grid grid-cols-[auto_1fr] gap-3 rounded-xl p-4 md:grid-cols-[auto_1fr_auto] md:items-center ${
                    isWinner ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-gray-50'
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${
                    isWinner ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isWinner ? '🏆' : rank}
                  </span>
                  <div>
                    <p className="font-bold text-gray-800">{getPlayerName(answer.playerId)}</p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(answer.value)} {currentQuestion.unit}
                    </p>
                  </div>
                  <p className="col-start-2 text-sm font-bold text-gray-600 md:col-start-auto md:text-right">
                    오차 {formatNumber(answer.difference)} {currentQuestion.unit}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={moveToNextRound}
            className="mt-7 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700"
          >
            {roundIndex === questions.length - 1 ? '최종 결과 보기' : '다음 문제'}
          </button>
        </section>
      )}

      {step === 'finalResult' && leaderboard.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 px-6 py-9 text-center text-white">
            <p className="text-6xl">🏆</p>
            <p className="mt-4 text-sm font-bold tracking-widest text-amber-50">FINAL RESULT</p>
            <h2 className="mt-2 text-3xl font-black">
              {leaderboard
                .filter((player) => player.score === leaderboard[0].score)
                .map((player) => player.name)
                .join(', ')}
            </h2>
            <p className="mt-2 text-amber-50">
              {leaderboard.filter((player) => player.score === leaderboard[0].score).length > 1
                ? '공동 우승입니다!'
                : '숫자 감각 왕입니다!'}
            </p>
          </div>

          <div className="p-5 md:p-8">
            <div className="space-y-3">
              {leaderboard.map((player, index) => {
                const rank =
                  index > 0 && player.score === leaderboard[index - 1].score
                    ? leaderboard.findIndex((item) => item.score === player.score) + 1
                    : index + 1;

                return (
                  <div key={player.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${
                        rank === 1 ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {rank === 1 ? '👑' : rank}
                      </span>
                      <span className="font-bold text-gray-800">{player.name}</span>
                    </div>
                    <span className="text-lg font-black text-emerald-600">{player.score}점</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={replayWithSamePlayers}
                className="rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-700"
              >
                같은 멤버로 다시 하기
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="rounded-xl border-2 border-gray-200 py-4 font-bold text-gray-700 transition hover:border-emerald-500 hover:text-emerald-600"
              >
                처음부터 하기
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
