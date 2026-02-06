import React from 'react';
import type { Building, BuildingStatus } from '@dino-park/shared';
import { useBuildingStore } from '../stores/useBuildingStore';

interface BuildingCardProps {
  building: Building;
  buildingType?: {
    id: string;
    name: string;
    nameKo: string;
    category: string;
    maxLevel: number;
    baseStats: {
      capacity: number;
      revenue: number;
      maintenanceCost: number;
      space: number;
    };
  };
  onClick?: () => void;
}

// 카테고리별 아이콘 및 색상
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  dinosaur: { icon: '🦕', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  visitor: { icon: '🎟️', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  amenity: { icon: '🍔', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  production: { icon: '⚙️', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  research: { icon: '🔬', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  operation: { icon: '🏢', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  decoration: { icon: '🌳', color: 'text-green-600', bgColor: 'bg-green-100' },
};

// 상태별 배지
const STATUS_CONFIG: Record<BuildingStatus, { label: string; color: string }> = {
  constructing: { label: '건설중', color: 'bg-yellow-500' },
  active: { label: '가동중', color: 'bg-green-500' },
  upgrading: { label: '업그레이드', color: 'bg-blue-500' },
  inactive: { label: '비활성', color: 'bg-gray-400' },
};

function BuildingCard({ building, buildingType, onClick }: BuildingCardProps) {
  const { showUpgradeModal, showAssignModal } = useBuildingStore();

  // typeId에서 카테고리 추출
  const getCategoryFromTypeId = (typeId: string): string => {
    const prefix = typeId.split('-')[0];
    const categoryMap: Record<string, string> = {
      habitat: 'dinosaur',
      visitor: 'visitor',
      food: 'amenity',
      souvenir: 'amenity',
      rest: 'amenity',
      dna: 'research',
      fossil: 'research',
      incubator: 'production',
      generator: 'operation',
      decoration: 'decoration',
    };
    return categoryMap[prefix] || 'operation';
  };

  const category = buildingType?.category || getCategoryFromTypeId(building.typeId);
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.operation;
  const statusConfig = STATUS_CONFIG[building.status as BuildingStatus] || STATUS_CONFIG.active;
  const maxLevel = buildingType?.maxLevel || 25;
  const canUpgrade = building.level < maxLevel && building.status === 'active';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 상단: 아이콘 + 정보 */}
      <div className="flex items-start gap-3">
        {/* 건물 아이콘 */}
        <div className={`h-14 w-14 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <span className="text-2xl">{config.icon}</span>
        </div>

        {/* 건물 정보 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-gray-800">
              {buildingType?.nameKo || building.typeId}
            </h3>
            <span className={`rounded-full px-1.5 py-0.5 text-xs text-white ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Lv.{building.level} / {maxLevel}
          </p>
        </div>

        {/* 레벨 진행 바 */}
        <div className="w-16 text-right">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="bg-primary-500 h-full transition-all"
              style={{ width: `${(building.level / maxLevel) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 스탯 정보 */}
      {buildingType && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {buildingType.baseStats.capacity > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <span>🦕</span>
              <span>수용: {buildingType.baseStats.capacity}</span>
            </div>
          )}
          {buildingType.baseStats.revenue > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <span>🪙</span>
              <span>수익: {buildingType.baseStats.revenue}/h</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-600">
            <span>💰</span>
            <span>유지: {buildingType.baseStats.maintenanceCost}/h</span>
          </div>
        </div>
      )}

      {/* 위인 배정 정보 */}
      {building.assignedGreatFigureId && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-purple-50 p-2">
          <span className="text-lg">👤</span>
          <span className="text-sm text-purple-700">위인 배정됨</span>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mt-3 flex gap-2">
        {canUpgrade && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              showUpgradeModal(building.id);
            }}
            className="bg-primary-500 hover:bg-primary-600 flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors"
          >
            ⬆️ 업그레이드
          </button>
        )}
        {!building.assignedGreatFigureId && building.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              showAssignModal(building.id);
            }}
            className="flex-1 rounded-lg bg-purple-500 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            👤 위인 배정
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(BuildingCard);
