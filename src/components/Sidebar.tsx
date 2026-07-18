'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const games = [
  { name: '홈', path: '/' },
  { name: '원 그리기', path: '/circle-draw' },
  { name: 'N초 맞추기', path: '/timer-challenge' },
  { name: '숫자 감각', path: '/number-sense' },
  { name: '반응속도 테스트', path: '/reaction-test' },
  { name: '각도 감각', path: '/angle-sense' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-purple-600 text-white p-3 rounded-lg shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 bg-gradient-to-b from-purple-600 to-indigo-700 text-white p-6 min-h-screen z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <h1 className="text-2xl font-bold mb-8 mt-12 md:mt-0">🎮 미니게임</h1>
        <nav className="space-y-2">
          {games.map((game) => (
            <Link
              key={game.path}
              href={game.path}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-all ${
                pathname === game.path
                  ? 'bg-white text-purple-600 font-semibold shadow-lg'
                  : 'hover:bg-purple-500 hover:pl-6'
              }`}
            >
              {game.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
