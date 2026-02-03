import {
  useBuildingStore,
  useFilteredBuildings,
  type BuildingFilter,
} from '../stores/useBuildingStore';
import BuildingCard from './BuildingCard';

// 필터 옵션
const FILTER_OPTIONS: Array<{ value: BuildingFilter; label: string; icon: string }> = [
  { value: 'all', label: '전체', icon: '🏛️' },
  { value: 'dinosaur', label: '서식지', icon: '🦕' },
  { value: 'visitor', label: '관람', icon: '🎟️' },
  { value: 'amenity', label: '편의', icon: '🍔' },
  { value: 'production', label: '생산', icon: '⚙️' },
  { value: 'research', label: '연구', icon: '🔬' },
  { value: 'operation', label: '운영', icon: '🏢' },
  { value: 'decoration', label: '장식', icon: '🌳' },
];

export default function BuildingList() {
  const { filter, setFilter, selectBuilding, isLoading } = useBuildingStore();
  const buildings = useFilteredBuildings();

  return (
    <div className="flex h-full flex-col">
      {/* 필터 탭 */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* 건물 목록 */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : buildings.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <span className="mb-2 text-4xl">🏗️</span>
            <p className="font-medium">건물이 없습니다</p>
            <p className="text-sm">아래에서 새 건물을 건설하세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                onClick={() => selectBuilding(building.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 건물 개수 표시 */}
      <div className="border-t border-gray-200 bg-white px-4 py-2 text-center text-sm text-gray-500">
        총 {buildings.length}개 건물
      </div>
    </div>
  );
}
