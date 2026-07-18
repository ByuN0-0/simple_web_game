export default function Home() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        미니게임에 오신 것을 환영합니다! 🎉
      </h1>
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-semibold text-purple-600 mb-4">게임 목록</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-xl font-semibold text-gray-800">🎨 원 그리기</h3>
            <p className="text-gray-600 mt-2">
              누가 가장 완벽한 원을 그릴 수 있을까요? 인원과 이름을 정하고
              순서대로 도전해보세요!
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-xl font-semibold text-gray-800">⏱️ N초 맞추기</h3>
            <p className="text-gray-600 mt-2">
              정확한 시간 감각을 테스트하세요! 타이머 없이 정확히 N초를 맞춰보는
              게임입니다.
            </p>
          </div>
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-xl font-semibold text-gray-800">🎯 숫자 감각</h3>
            <p className="text-gray-600 mt-2">
              세상의 크고 작은 숫자를 추측해보세요! 정답에 가장 가까운 사람이
              라운드 점수를 얻습니다.
            </p>
          </div>
          <div className="border-l-4 border-rose-500 pl-4">
            <h3 className="text-xl font-semibold text-gray-800">⚡ 반응속도 테스트</h3>
            <p className="text-gray-600 mt-2">
              화면이 초록색으로 바뀌는 순간 터치하세요! 가장 빠르게 반응한 사람이
              승리합니다.
            </p>
          </div>
          <div className="border-l-4 border-sky-500 pl-4">
            <h3 className="text-xl font-semibold text-gray-800">📐 각도 감각</h3>
            <p className="text-gray-600 mt-2">
              숫자 표시 없이 목표 각도와 같은 선을 그려보세요! 오차가 가장 작은
              사람이 승리합니다.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-6">
        <p className="text-gray-700">
          👈 왼쪽 사이드바에서 원하는 게임을 선택해서 즐겨보세요!
        </p>
      </div>
    </div>
  );
}
