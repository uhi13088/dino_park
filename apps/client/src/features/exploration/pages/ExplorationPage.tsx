import { useGameStore } from '@/stores/useGameStore';

/**
 * 탐험 페이지 - 탐험 시스템
 */
export default function ExplorationPage() {
  const { explorationEnergy } = useGameStore();

  // Placeholder: 탐험 지역 데이터
  const regions = [
    {
      id: 'fossil_plains',
      name: '화석 평원',
      description: '초보자 탐험 지역',
      energyCost: 5,
      rewards: ['커먼 공룡', '골드'],
      unlocked: true,
    },
    {
      id: 'volcanic_valley',
      name: '화산 계곡',
      description: '희귀 공룡 출현',
      energyCost: 10,
      rewards: ['언커먼~레어 공룡', 'DNA'],
      unlocked: true,
    },
    {
      id: 'frozen_tundra',
      name: '얼어붙은 툰드라',
      description: '에픽 공룡 서식지',
      energyCost: 15,
      rewards: ['레어~에픽 공룡', '특수 아이템'],
      unlocked: false,
    },
    {
      id: 'ancient_ruins',
      name: '고대 유적',
      description: '전설의 공룡이 잠든 곳',
      energyCost: 20,
      rewards: ['에픽~레전더리 공룡', '위인 조각'],
      unlocked: false,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 에너지 표시 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm text-gray-500">탐험 에너지</p>
              <p className="font-bold text-lg">{explorationEnergy} / 30</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-secondary-500 text-white rounded-lg text-sm font-medium">
            + 충전
          </button>
        </div>

        {/* 에너지 바 */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
            style={{ width: `${(explorationEnergy / 30) * 100}%` }}
          />
        </div>
      </div>

      {/* 지역 목록 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {regions.map((region) => (
          <RegionCard key={region.id} region={region} />
        ))}
      </div>
    </div>
  );
}

interface Region {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  rewards: string[];
  unlocked: boolean;
}

function RegionCard({ region }: { region: Region }) {
  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-sm ${
        !region.unlocked ? 'opacity-60' : ''
      }`}
    >
      {/* 지역 이미지 Placeholder */}
      <div className="h-32 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center relative">
        <span className="text-5xl">{getRegionEmoji(region.id)}</span>
        {!region.unlocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
        )}
      </div>

      {/* 지역 정보 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-800">{region.name}</h3>
            <p className="text-sm text-gray-500">{region.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-600">
              <span>⚡</span>
              <span className="font-bold">{region.energyCost}</span>
            </div>
          </div>
        </div>

        {/* 보상 미리보기 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {region.rewards.map((reward, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
            >
              {reward}
            </span>
          ))}
        </div>

        {/* 탐험 버튼 */}
        <button
          disabled={!region.unlocked}
          className={`w-full mt-4 py-3 rounded-lg font-bold transition-colors ${
            region.unlocked
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {region.unlocked ? '탐험 시작' : '잠김'}
        </button>
      </div>
    </div>
  );
}

function getRegionEmoji(regionId: string): string {
  const emojis: Record<string, string> = {
    fossil_plains: '🏜️',
    volcanic_valley: '🌋',
    frozen_tundra: '🏔️',
    ancient_ruins: '🏛️',
  };
  return emojis[regionId] || '🗺️';
}
