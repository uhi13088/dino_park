import { useState } from 'react';
import { useBuildingStore } from '../stores/useBuildingStore';
import BuildingList from '../components/BuildingList';

// 탭 타입
type TabType = 'owned' | 'shop';

/**
 * 건물 페이지 - 건물 관리 및 상점
 */
export default function BuildingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('owned');
  const { startPlacement } = useBuildingStore();

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <TabButton active={activeTab === 'owned'} onClick={() => setActiveTab('owned')}>
            🏛️ 보유 건물
          </TabButton>
          <TabButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')}>
            🏪 건물 상점
          </TabButton>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'owned' ? <BuildingList /> : <BuildingShop onBuild={startPlacement} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-center font-medium transition-colors ${
        active
          ? 'border-primary-600 text-primary-600 border-b-2'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// 건물 상점
function BuildingShop({ onBuild }: { onBuild: (typeId: string) => void }) {
  const [category, setCategory] = useState<string>('all');

  // 건물 카테고리
  const categories = [
    { id: 'all', name: '전체', icon: '🏛️' },
    { id: 'dinosaur', name: '서식지', icon: '🦕' },
    { id: 'visitor', name: '관람', icon: '🎟️' },
    { id: 'amenity', name: '편의', icon: '🍔' },
    { id: 'production', name: '생산', icon: '⚙️' },
    { id: 'research', name: '연구', icon: '🔬' },
    { id: 'operation', name: '운영', icon: '🏢' },
    { id: 'decoration', name: '장식', icon: '🌳' },
  ];

  // Placeholder 건물 데이터
  const buildings = [
    {
      id: 'habitat-grassland',
      nameKo: '초원 서식지',
      category: 'dinosaur',
      cost: 5000,
      parkLevel: 1,
      description: '초식 공룡용 서식지',
    },
    {
      id: 'habitat-forest',
      nameKo: '숲 서식지',
      category: 'dinosaur',
      cost: 8000,
      parkLevel: 5,
      description: '숲을 좋아하는 공룡용',
    },
    {
      id: 'habitat-carnivore',
      nameKo: '육식 서식지',
      category: 'dinosaur',
      cost: 15000,
      parkLevel: 10,
      description: '육식 공룡 전용',
    },
    {
      id: 'visitor-center',
      nameKo: '방문자 센터',
      category: 'visitor',
      cost: 10000,
      parkLevel: 1,
      description: '파크의 중심 시설',
    },
    {
      id: 'observation-deck',
      nameKo: '전망대',
      category: 'visitor',
      cost: 20000,
      parkLevel: 8,
      description: '공룡을 가까이서 관람',
    },
    {
      id: 'food-burger',
      nameKo: '버거샵',
      category: 'amenity',
      cost: 3000,
      parkLevel: 1,
      description: '맛있는 버거 판매',
    },
    {
      id: 'food-cafe',
      nameKo: '카페',
      category: 'amenity',
      cost: 5000,
      parkLevel: 3,
      description: '커피와 디저트',
    },
    {
      id: 'dna-lab',
      nameKo: 'DNA 연구소',
      category: 'research',
      cost: 50000,
      parkLevel: 15,
      description: 'DNA 연구 및 합성',
    },
    {
      id: 'incubator',
      nameKo: '부화장',
      category: 'production',
      cost: 20000,
      parkLevel: 5,
      description: '공룡 알 부화',
    },
    {
      id: 'power-plant',
      nameKo: '발전소',
      category: 'operation',
      cost: 30000,
      parkLevel: 10,
      description: '전력 공급',
    },
    {
      id: 'decoration-fountain',
      nameKo: '분수',
      category: 'decoration',
      cost: 2000,
      parkLevel: 1,
      description: '아름다운 분수',
    },
    {
      id: 'decoration-statue',
      nameKo: '공룡 동상',
      category: 'decoration',
      cost: 5000,
      parkLevel: 5,
      description: '티라노 동상',
    },
  ];

  // 필터링
  const filteredBuildings =
    category === 'all' ? buildings : buildings.filter((b) => b.category === category);

  // 카테고리별 색상
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      dinosaur: 'bg-emerald-100',
      visitor: 'bg-blue-100',
      amenity: 'bg-orange-100',
      production: 'bg-purple-100',
      research: 'bg-indigo-100',
      operation: 'bg-gray-100',
      decoration: 'bg-green-100',
    };
    return colors[cat] || 'bg-gray-100';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      dinosaur: '🦕',
      visitor: '🎟️',
      amenity: '🍔',
      production: '⚙️',
      research: '🔬',
      operation: '🏢',
      decoration: '🌳',
    };
    return icons[cat] || '🏛️';
  };

  return (
    <div className="flex h-full flex-col">
      {/* 카테고리 필터 */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              category === cat.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 건물 목록 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredBuildings.map((building) => (
            <div key={building.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              {/* 건물 이미지 Placeholder */}
              <div
                className={`flex h-24 items-center justify-center ${getCategoryColor(building.category)}`}
              >
                <span className="text-4xl">{getCategoryIcon(building.category)}</span>
              </div>

              {/* 건물 정보 */}
              <div className="p-3">
                <h3 className="truncate font-bold text-gray-800">{building.nameKo}</h3>
                <p className="text-xs text-gray-500">{building.description}</p>

                {/* 요구 레벨 */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Lv.{building.parkLevel} 필요</span>
                </div>

                {/* 건설 버튼 */}
                <button
                  onClick={() => onBuild(building.id)}
                  className="bg-primary-500 hover:bg-primary-600 mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-white"
                >
                  <span>🪙</span>
                  <span>{building.cost.toLocaleString()}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
