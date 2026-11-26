import {
  EARLY_RESOURCES,
  getBuildingById,
  getBuildingsByCategory,
  resolveDinosaurSpecies,
} from '@dino-park/game-data';
import {
  BuildingCategory,
  type BuildingResponse,
  type DinosaurResponse,
  type ParkOperationsResponse,
} from '@dino-park/shared';
import { Button } from '@/components/ui';

interface Props {
  buildings: BuildingResponse[];
  dinosaurs: DinosaurResponse[];
  operations: ParkOperationsResponse;
  onShowDinosaurs: () => void;
  onBuild: (typeId: string) => void;
}

export default function ParkExhibitManagement({
  buildings,
  dinosaurs,
  operations,
  onShowDinosaurs,
  onBuild,
}: Props) {
  const currentExhibits = operations.admission?.exhibits ?? [];
  const habitats = buildings.filter(
    ({ typeId }) => getBuildingById(typeId)?.category === BuildingCategory.DINOSAUR,
  );
  const compatibleHabitatIds = new Set(
    dinosaurs.flatMap(
      (dinosaur) => resolveDinosaurSpecies(dinosaur)?.habitat.map((tag) => `habitat-${tag}`) ?? [],
    ),
  );
  const availableHabitats = getBuildingsByCategory(BuildingCategory.DINOSAUR).filter(
    ({ id, unlockCondition }) =>
      unlockCondition.parkLevel <= operations.parkLevel && compatibleHabitatIds.has(id),
  );

  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-700">
        서식지를 완공한 뒤 공룡을 배치하고, 입구에서 이어지는 관람길을 확보하세요.
      </p>
      <ul className="divide-y divide-slate-200" aria-label="보유 서식지">
        {habitats.map((habitat) => {
          const exhibit = currentExhibits.find(({ id }) => id === habitat.id);
          const dinosaurNames = exhibit?.dinosaurIds.flatMap((id) => {
            const dinosaur = dinosaurs.find((item) => item.id === id);
            if (!dinosaur) return [];
            return [dinosaur.nickname ?? resolveDinosaurSpecies(dinosaur)?.nameKo ?? '공룡'];
          });

          return (
            <li key={habitat.id} className="py-2">
              <p className="font-semibold">
                {getBuildingById(habitat.typeId)?.nameKo ?? '서식지'}{' '}
                <span className="font-normal text-slate-600">
                  ({habitat.positionX}, {habitat.positionY})
                </span>
              </p>
              {exhibit ? (
                <>
                  {dinosaurNames?.length ? <p>{dinosaurNames.join(', ')}</p> : null}
                  <p className="text-green-900">
                    {exhibit.visitors !== undefined && `관람객 약 ${exhibit.visitors}명 · `}
                    혼잡도 {exhibit.crowdingPercent}% · 만족도 {exhibit.satisfactionPercent}%
                  </p>
                </>
              ) : (
                <p className="text-slate-700">
                  {habitat.status.toUpperCase() === 'CONSTRUCTING'
                    ? '건설 중'
                    : '공룡 배치·관람길 확인'}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <Button variant="outline" className="min-h-11 w-full" onClick={onShowDinosaurs}>
        공룡 배치 관리
      </Button>
      {availableHabitats.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <h3 className="font-semibold">새 서식지</h3>
          {availableHabitats.map((habitat) => {
            const cost = habitat.baseCost ?? habitat.unlockCondition.cost.gold;
            const materials = EARLY_RESOURCES.flatMap(({ id, name }) => {
              const quantity = habitat.unlockCondition.cost.materials?.[id];
              return quantity ? [`${name} ${quantity}개`] : [];
            });
            return (
              <div key={habitat.id} className="flex items-center justify-between gap-2">
                <div>
                  <p>{habitat.nameKo}</p>
                  <p className="text-xs text-slate-700">
                    {[`${cost.toLocaleString('ko-KR')}골드`, ...materials].join(' · ')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 shrink-0 px-2"
                  aria-label={`${habitat.nameKo} 건설 위치 선택`}
                  disabled={operations.gold < cost}
                  onClick={() => onBuild(habitat.id)}
                >
                  위치 선택
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
