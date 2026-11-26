import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBuildingById, resolveDinosaurSpecies } from '@dino-park/game-data';
import {
  BuildingCategory,
  type DinosaurResponse,
  type ExhibitPlacementEstimate,
} from '@dino-park/shared';
import { api, queryKeys } from '@/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  placement: {
    type: 'dinosaur' | 'building' | 'entrance';
    id?: string;
    typeId?: string;
  } | null;
  tile: { x: number; y: number };
  dinosaurs: DinosaurResponse[];
  admissionPaused?: boolean;
}

const rate = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });

export default function ExhibitPlacementPreview({
  placement,
  tile,
  dinosaurs,
  admissionPaused,
}: Props) {
  const parkId = useAuthStore((state) => state.park?.id);
  const [selectedDinosaur, setSelectedDinosaur] = useState('');
  const typeId = placement?.type === 'building' ? placement.typeId : undefined;
  const dinosaurId = placement?.type === 'dinosaur' ? placement.id : undefined;
  const isHabitat = !!typeId && getBuildingById(typeId)?.category === BuildingCategory.DINOSAUR;
  const candidates = isHabitat
    ? dinosaurs.filter((dinosaur) =>
        resolveDinosaurSpecies(dinosaur)?.habitat.some((tag) => typeId === `habitat-${tag}`),
      )
    : [];
  const candidateId = candidates.some(({ id }) => id === selectedDinosaur) ? selectedDinosaur : '';
  const params = new URLSearchParams({ positionX: String(tile.x), positionY: String(tile.y) });
  if (isHabitat) params.set('typeId', typeId);
  if (candidateId) params.set('dinosaurId', candidateId);
  const endpoint = isHabitat
    ? '/buildings/exhibit-placement-preview'
    : `/dinosaurs/${dinosaurId}/placement-preview`;
  const url = `${endpoint}?${params}`;
  const estimate = useQuery({
    queryKey: [...queryKeys.exhibitPlacementPreviews, parkId, url],
    queryFn: ({ signal }) => api.get<ExhibitPlacementEstimate>(url, { signal }),
    enabled: !!parkId && (isHabitat || !!dinosaurId),
    staleTime: 0,
    retry: false,
  });
  if (!isHabitat && !dinosaurId) return null;

  const current = estimate.data?.current;
  const proposed = estimate.data?.proposed;
  const exhibit = estimate.data?.exhibit;
  const transitions =
    current && proposed
      ? ([
          ['예상 입장', current.visitorsPerMinute, proposed.visitorsPerMinute, '명/분'],
          ['관람 수요', current.demandPerMinute, proposed.demandPerMinute, '명/분'],
          ['동시 수용', current.occupancyCapacity, proposed.occupancyCapacity, '명'],
        ] as const)
      : [];

  return (
    <section
      aria-label="배치 효과"
      className="mt-2 space-y-2 border-t border-slate-200 pt-2 text-xs text-slate-700"
    >
      {isHabitat && candidates.length > 0 && (
        <label className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">전시할 공룡</span>
          <select
            className="min-h-11 rounded border border-slate-300 bg-white px-2 text-slate-900"
            value={candidateId}
            onChange={(event) => setSelectedDinosaur(event.target.value)}
          >
            <option value="">완공 직후 · 공룡 없음</option>
            {candidates.map((dinosaur) => (
              <option key={dinosaur.id} value={dinosaur.id}>
                {dinosaur.nickname ?? resolveDinosaurSpecies(dinosaur)?.nameKo ?? '공룡'}
                {dinosaur.isInPark ? ' · 기존 위치에서 이동' : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      <div aria-live="polite">
        {estimate.isPending && '관람길과 배치 효과를 확인 중이에요.'}
        {estimate.isError && '지금은 배치 효과를 계산하지 못했어요.'}
        {transitions.length > 0 && (
          <dl className="flex flex-wrap gap-x-5 gap-y-1">
            {transitions.map(([label, before, after, unit]) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dt>{label}</dt>
                <dd className="m-0 font-semibold tabular-nums text-slate-900">
                  {rate.format(before)} → {rate.format(after)}
                  {unit}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {estimate.data?.explanation && <p className="mt-1">{estimate.data.explanation}</p>}
        {admissionPaused && proposed && (
          <p className="mt-1">예상 입장은 금고에 여유가 생겨 입장을 재개했을 때의 수치예요.</p>
        )}
        {exhibit && (
          <p className="mt-1">
            이 전시 예상 관람객 {exhibit.currentVisitors} → {exhibit.proposedVisitors}명 · 혼잡도{' '}
            {exhibit.proposedCrowdingPercent}%
          </p>
        )}
        {candidateId && proposed && (
          <p className="mt-1">완공 뒤 이 공룡을 직접 배치했을 때의 예상이에요.</p>
        )}
      </div>
    </section>
  );
}
