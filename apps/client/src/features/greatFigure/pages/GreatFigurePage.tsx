import { useState } from 'react';
import {
  useGreatFigures,
  useAvailableGreatFigures,
  useGreatFigurePoints,
  useRecruitGreatFigure,
  useLevelUpGreatFigure,
} from '@/api/queries';
import type {
  GreatFigureResponse,
  GreatFigureTypeResponse,
} from '@dino-park/shared';
import { Modal, Button, Badge } from '@/components/ui';

/**
 * 위인 페이지
 */
export default function GreatFigurePage() {
  const [activeTab, setActiveTab] = useState<'owned' | 'recruit'>('owned');
  const [selectedFigure, setSelectedFigure] = useState<GreatFigureResponse | GreatFigureTypeResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: figuresData, isLoading: figuresLoading } = useGreatFigures();
  const { data: availableData } = useAvailableGreatFigures();
  const { data: pointsData } = useGreatFigurePoints();

  const recruitMutation = useRecruitGreatFigure();
  const levelUpMutation = useLevelUpGreatFigure();

  const ownedFigures = figuresData?.greatFigures ?? [];
  const availableFigures = availableData?.greatFigures ?? [];
  const points = pointsData?.points ?? 0;

  const handleRecruit = async (figureId: string) => {
    try {
      await recruitMutation.mutateAsync({ figureId });
      setShowDetailModal(false);
    } catch (error) {
      console.error('영입 실패:', error);
    }
  };

  const handleLevelUp = async (figureId: string) => {
    try {
      await levelUpMutation.mutateAsync(figureId);
    } catch (error) {
      console.error('레벨업 실패:', error);
    }
  };

  if (figuresLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 위인 포인트 표시 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-sm text-gray-500">위인 포인트</p>
              <p className="font-bold text-lg text-purple-600">{points.toLocaleString()} P</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">보유 위인</p>
            <p className="font-bold">{ownedFigures.length}명</p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('owned')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'owned'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          보유 위인
        </button>
        <button
          onClick={() => setActiveTab('recruit')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'recruit'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          영입하기
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'owned' ? (
          <OwnedFiguresList
            figures={ownedFigures}
            onSelect={(figure) => {
              setSelectedFigure(figure);
              setShowDetailModal(true);
            }}
          />
        ) : (
          <RecruitFiguresList
            figures={availableFigures}
            currentPoints={points}
            onSelect={(figure) => {
              setSelectedFigure(figure);
              setShowDetailModal(true);
            }}
          />
        )}
      </div>

      {/* 상세 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={isOwnedFigure(selectedFigure) ? selectedFigure.nameKo : (selectedFigure as GreatFigureTypeResponse)?.nameKo ?? '위인 상세'}
      >
        {selectedFigure && (
          isOwnedFigure(selectedFigure) ? (
            <OwnedFigureDetail
              figure={selectedFigure}
              onLevelUp={handleLevelUp}
              isLevelingUp={levelUpMutation.isPending}
            />
          ) : (
            <RecruitFigureDetail
              figure={selectedFigure as GreatFigureTypeResponse}
              currentPoints={points}
              onRecruit={handleRecruit}
              isRecruiting={recruitMutation.isPending}
            />
          )
        )}
      </Modal>
    </div>
  );
}

function isOwnedFigure(figure: GreatFigureResponse | GreatFigureTypeResponse | null): figure is GreatFigureResponse {
  return figure !== null && 'level' in figure && 'exp' in figure;
}

/**
 * 보유 위인 목록
 */
function OwnedFiguresList({
  figures,
  onSelect,
}: {
  figures: GreatFigureResponse[];
  onSelect: (figure: GreatFigureResponse) => void;
}) {
  if (figures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <span className="text-5xl mb-4">👤</span>
        <p>아직 영입한 위인이 없습니다</p>
        <p className="text-sm mt-1">영입하기 탭에서 위인을 영입해보세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {figures.map((figure) => (
        <FigureCard
          key={figure.id}
          name={figure.nameKo}
          job={figure.job}
          rarity={figure.rarity}
          level={figure.level}
          isAssigned={!!figure.assignedBuildingId}
          onClick={() => onSelect(figure)}
        />
      ))}
    </div>
  );
}

/**
 * 영입 가능 위인 목록
 */
function RecruitFiguresList({
  figures,
  currentPoints,
  onSelect,
}: {
  figures: GreatFigureTypeResponse[];
  currentPoints: number;
  onSelect: (figure: GreatFigureTypeResponse) => void;
}) {
  const recruitableFigures = figures.filter(f => !f.isOwned);

  if (recruitableFigures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <span className="text-5xl mb-4">🎉</span>
        <p>모든 위인을 영입했습니다!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {recruitableFigures.map((figure) => (
        <FigureCard
          key={figure.id}
          name={figure.nameKo}
          job={figure.job}
          rarity={figure.rarity}
          recruitCost={figure.recruitCost}
          canAfford={currentPoints >= figure.recruitCost}
          onClick={() => onSelect(figure)}
        />
      ))}
    </div>
  );
}

/**
 * 위인 카드
 */
function FigureCard({
  name,
  job,
  rarity,
  level,
  recruitCost,
  isAssigned,
  canAfford,
  onClick,
}: {
  name: string;
  job: string;
  rarity: string;
  level?: number;
  recruitCost?: number;
  isAssigned?: boolean;
  canAfford?: boolean;
  onClick: () => void;
}) {
  const rarityColors: Record<string, string> = {
    common: 'bg-gray-100 border-gray-300',
    uncommon: 'bg-green-50 border-green-300',
    rare: 'bg-blue-50 border-blue-300',
    epic: 'bg-purple-50 border-purple-300',
    legendary: 'bg-yellow-50 border-yellow-400',
  };

  const jobEmojis: Record<string, string> = {
    scientist: '🔬',
    architect: '🏗️',
    manager: '📊',
    explorer: '🧭',
    trainer: '🦖',
    vet: '💉',
    security: '🛡️',
    special: '⭐',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 ${rarityColors[rarity] ?? 'bg-gray-50 border-gray-200'} text-left transition-transform active:scale-95`}
    >
      {/* 아바타 */}
      <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">
        {jobEmojis[job] ?? '👤'}
      </div>

      {/* 이름 */}
      <h3 className="font-bold text-center text-gray-800 truncate">{name}</h3>

      {/* 레벨 또는 비용 */}
      {level !== undefined ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          <Badge variant={isAssigned ? 'success' : 'default'} size="sm">
            Lv.{level}
          </Badge>
          {isAssigned && (
            <Badge variant="primary" size="sm">배치됨</Badge>
          )}
        </div>
      ) : recruitCost !== undefined ? (
        <div className={`mt-2 text-center text-sm font-medium ${canAfford ? 'text-purple-600' : 'text-gray-400'}`}>
          {recruitCost.toLocaleString()} P
        </div>
      ) : null}
    </button>
  );
}

/**
 * 보유 위인 상세
 */
function OwnedFigureDetail({
  figure,
  onLevelUp,
  isLevelingUp,
}: {
  figure: GreatFigureResponse;
  onLevelUp: (figureId: string) => void;
  isLevelingUp: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* 아바타 */}
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-5xl">
        👤
      </div>

      {/* 정보 */}
      <div className="text-center">
        <Badge variant="primary">Lv.{figure.level}</Badge>
        <p className="mt-2 text-sm text-gray-500">{figure.description}</p>
        <p className="mt-2 text-sm italic text-gray-400">"{figure.quote}"</p>
      </div>

      {/* 상태 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">직업</span>
          <span className="font-medium capitalize">{figure.job}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">등급</span>
          <span className="font-medium capitalize">{figure.rarity}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">배치</span>
          <span className="font-medium">
            {figure.assignedBuildingId ? '배치됨' : '대기중'}
          </span>
        </div>
      </div>

      {/* 레벨업 버튼 */}
      <Button
        variant="primary"
        className="w-full"
        onClick={() => onLevelUp(figure.id)}
        disabled={isLevelingUp || figure.level >= 10}
      >
        {isLevelingUp ? '레벨업 중...' : figure.level >= 10 ? '최대 레벨' : '레벨업'}
      </Button>
    </div>
  );
}

/**
 * 영입 가능 위인 상세
 */
function RecruitFigureDetail({
  figure,
  currentPoints,
  onRecruit,
  isRecruiting,
}: {
  figure: GreatFigureTypeResponse;
  currentPoints: number;
  onRecruit: (figureId: string) => void;
  isRecruiting: boolean;
}) {
  const canAfford = currentPoints >= figure.recruitCost;

  return (
    <div className="space-y-4">
      {/* 아바타 */}
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-5xl">
        👤
      </div>

      {/* 정보 */}
      <div className="text-center">
        <Badge variant={figure.rarity as 'default' | 'primary' | 'success' | 'warning' | 'danger'}>
          {figure.rarity}
        </Badge>
        <p className="mt-2 text-sm text-gray-500">{figure.description}</p>
        <p className="mt-2 text-sm italic text-gray-400">"{figure.quote}"</p>
      </div>

      {/* 비용 */}
      <div className="bg-purple-50 rounded-lg p-4 text-center">
        <p className="text-sm text-purple-600">영입 비용</p>
        <p className="text-2xl font-bold text-purple-700">{figure.recruitCost.toLocaleString()} P</p>
        <p className={`text-sm mt-1 ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
          보유: {currentPoints.toLocaleString()} P
        </p>
      </div>

      {/* 영입 버튼 */}
      <Button
        variant="primary"
        className="w-full"
        onClick={() => onRecruit(figure.id)}
        disabled={isRecruiting || !canAfford}
      >
        {isRecruiting ? '영입 중...' : !canAfford ? '포인트 부족' : '영입하기'}
      </Button>
    </div>
  );
}
