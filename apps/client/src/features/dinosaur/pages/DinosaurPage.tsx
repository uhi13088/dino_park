import { useState } from 'react';
import { useDinosaurs } from '../../../api/queries';

/**
 * 공룡 페이지 - 공룡 도감/관리 화면
 */
export default function DinosaurPage() {
  const [activeTab, setActiveTab] = useState<'collection' | 'codex'>('collection');
  const { data: dinosaursData, isLoading } = useDinosaurs();

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <TabButton active={activeTab === 'collection'} onClick={() => setActiveTab('collection')}>
            🦕 보유 공룡
          </TabButton>
          <TabButton active={activeTab === 'codex'} onClick={() => setActiveTab('codex')}>
            📖 도감
          </TabButton>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'collection' ? (
          <CollectionView dinosaurs={dinosaursData?.dinosaurs || []} isLoading={isLoading} />
        ) : (
          <CodexView />
        )}
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
          ? 'text-primary-600 border-primary-600 border-b-2'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

interface DinosaurData {
  id: string;
  speciesId: string;
  nickname: string | null;
  level: number;
  happiness: number;
}

function CollectionView({
  dinosaurs,
  isLoading,
}: {
  dinosaurs: DinosaurData[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🦕</span>
          <p className="mt-2 text-gray-500">공룡 목록 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (dinosaurs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <span className="text-6xl">🥚</span>
        <p className="mt-4 text-lg font-medium">보유한 공룡이 없습니다</p>
        <p className="mt-1 text-sm">탐험을 통해 공룡을 부화시켜 보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dinosaurs.map((dino) => (
        <div key={dino.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
          {/* 공룡 썸네일 */}
          <div className="bg-dino-herbivore flex h-16 w-16 items-center justify-center rounded-lg">
            <span className="text-2xl">🦕</span>
          </div>

          {/* 공룡 정보 */}
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">{dino.nickname || dino.speciesId}</h3>
            <p className="text-sm text-gray-500">Lv.{dino.level}</p>
          </div>

          {/* 상태 */}
          <div className="text-right">
            <div className="text-sm text-gray-600">행복도</div>
            <div className="text-primary-600 font-bold">{dino.happiness}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CodexView() {
  // Placeholder: 도감 카테고리
  const categories = [
    { id: 'herbivore', name: '초식 공룡', icon: '🌿', count: '25/25', color: 'bg-dino-herbivore' },
    { id: 'carnivore', name: '육식 공룡', icon: '🥩', count: '18/20', color: 'bg-dino-carnivore' },
    { id: 'pterosaur', name: '익룡', icon: '🦅', count: '8/12', color: 'bg-dino-pterosaur' },
    { id: 'marine', name: '해양 파충류', icon: '🌊', count: '5/15', color: 'bg-dino-marine' },
    { id: 'hybrid', name: '하이브리드', icon: '🧬', count: '2/10', color: 'bg-dino-hybrid' },
  ];

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className="flex w-full items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={`h-12 w-12 rounded-lg ${cat.color} flex items-center justify-center`}>
            <span className="text-xl">{cat.icon}</span>
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-gray-800">{cat.name}</h3>
            <p className="text-sm text-gray-500">{cat.count} 발견</p>
          </div>
          <span className="text-gray-400">›</span>
        </button>
      ))}
    </div>
  );
}
