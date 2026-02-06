import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type GreatFigure,
  type Building,
  JOB_CONFIG,
  RARITY_CONFIG,
  useGreatFigureStore,
} from '../stores/useGreatFigureStore';

interface GreatFigureAssignProps {
  isOpen: boolean;
  onClose: () => void;
  figure: GreatFigure;
}

export default function GreatFigureAssign({ isOpen, onClose, figure }: GreatFigureAssignProps) {
  const { assignFigure, isLoading, getAvailableBuildings } = useGreatFigureStore();

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  const availableBuildings = getAvailableBuildings();
  const jobConfig = JOB_CONFIG[figure.type.job];

  // 건물 타입별 추천 여부
  const isRecommendedBuilding = (building: Building) => {
    const recommendations: Record<string, string[]> = {
      scientist: ['research', 'lab', 'dna'],
      architect: ['construction', 'upgrade'],
      manager: ['visitor_center', 'shop', 'restaurant'],
      explorer: ['expedition', 'discovery'],
      trainer: ['habitat', 'nursery', 'training'],
      vet: ['clinic', 'hospital', 'care'],
      security: ['fence', 'gate', 'security'],
      special: [],
    };

    const buildingType = building.type.toLowerCase();
    return recommendations[figure.type.job]?.some((rec) => buildingType.includes(rec)) || false;
  };

  const handleAssign = async () => {
    if (!selectedBuilding) return;
    await assignFigure(figure.id, selectedBuilding);
    onClose();
  };

  // 건물 정렬: 추천 건물 먼저
  const sortedBuildings = [...availableBuildings].sort((a, b) => {
    const aRecommended = isRecommendedBuilding(a);
    const bRecommended = isRecommendedBuilding(b);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-gray-900"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* 헤더 */}
            <div className="border-b border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${jobConfig.bgColor} text-2xl`}
                  >
                    {jobConfig.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{figure.type.nameKo}</h3>
                    <p className="text-sm text-gray-400">건물 배치</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 건물 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
              {availableBuildings.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-gray-500">
                  <span className="mb-2 text-4xl">🏢</span>
                  <span>배치 가능한 건물이 없습니다</span>
                  <span className="text-sm">건물을 건설하거나 다른 위인을 해제해주세요</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedBuildings.map((building) => {
                    const isRecommended = isRecommendedBuilding(building);
                    const isSelected = selectedBuilding === building.id;

                    return (
                      <motion.button
                        key={building.id}
                        onClick={() => setSelectedBuilding(building.id)}
                        className={`
                          w-full rounded-xl p-4 text-left transition-all
                          ${
                            isSelected
                              ? 'border-2 border-purple-500 bg-purple-900/30'
                              : isRecommended
                                ? 'border-2 border-green-500/50 bg-green-900/20'
                                : 'border-2 border-transparent bg-gray-800'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 text-2xl">
                            🏢
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{building.name}</span>
                              {isRecommended && (
                                <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs">
                                  추천
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                              <span>Lv.{building.level}</span>
                              <span>•</span>
                              <span>{building.type}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              className="text-purple-400"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </div>

                        {/* 보너스 미리보기 */}
                        {isSelected && figure.type.abilities.length > 0 && (
                          <motion.div
                            className="mt-3 border-t border-gray-700 pt-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <p className="mb-2 text-xs text-gray-500">적용될 보너스</p>
                            <div className="flex flex-wrap gap-2">
                              {figure.type.abilities.map((ability, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-gray-700 px-2 py-1 text-xs text-green-400"
                                >
                                  {ability.description} +{ability.value}%
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="border-t border-gray-800 p-4">
              <button
                onClick={handleAssign}
                disabled={!selectedBuilding || isLoading}
                className={`
                  w-full rounded-xl py-3 font-semibold transition-all
                  ${
                    selectedBuilding && !isLoading
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                      : 'cursor-not-allowed bg-gray-700 text-gray-500'
                  }
                `}
              >
                {isLoading
                  ? '배치 중...'
                  : selectedBuilding
                    ? '🏢 배치하기'
                    : '건물을 선택해주세요'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 위인 카드 컴포넌트 (목록에서 사용)
export function GreatFigureCard({ figure, onClick }: { figure: GreatFigure; onClick: () => void }) {
  const jobConfig = JOB_CONFIG[figure.type.job];
  const rarityConfig = RARITY_CONFIG[figure.type.rarity];

  return (
    <motion.button
      onClick={onClick}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${rarityConfig.borderColor} ${rarityConfig.bgColor}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gray-800/50 text-3xl`}
        >
          {jobConfig.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{figure.type.nameKo}</span>
            <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
              Lv.{figure.level}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs ${rarityConfig.color}`}>
              {rarityConfig.icon} {rarityConfig.label}
            </span>
            <span className={`text-xs ${jobConfig.color}`}>{jobConfig.label}</span>
          </div>
        </div>
        {figure.assignedBuildingId && (
          <span className="rounded bg-green-600 px-2 py-1 text-xs font-medium">배치됨</span>
        )}
      </div>

      {/* 경험치 바 */}
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${(figure.exp / figure.maxExp) * 100}%` }}
          />
        </div>
      </div>
    </motion.button>
  );
}
