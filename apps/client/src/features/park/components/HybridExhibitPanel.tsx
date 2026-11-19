import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DINOSAUR_COMPETITIVE_STAT_LABELS,
  FIRST_HYBRID_SPECIES_ID,
  STEGO_BASE_COMPETITIVE_STATS,
  type DinosaurCompetitiveStats,
  type DinosaurResponse,
  type HybridExhibitPreview,
  type HybridExhibitSelection,
} from '@dino-park/shared';
import { api, queryKeys } from '@/api';
import { Button } from '@/components/ui';

const attributes = Object.keys(DINOSAUR_COMPETITIVE_STAT_LABELS) as Array<
  keyof DinosaurCompetitiveStats
>;
const formatRate = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
const rate = (value: number) => formatRate.format(value);
const stats = (dinosaur: DinosaurResponse) =>
  dinosaur.competitiveStats ?? STEGO_BASE_COMPETITIVE_STATS;
const title = (dinosaur: DinosaurResponse) => dinosaur.nickname || '스테고케라톱스';
const location = (dinosaur: DinosaurResponse) => (dinosaur.isInPark ? '전시 중' : '배치 대기');

interface HybridExhibitPanelProps {
  selected: DinosaurResponse;
  dinosaurs: DinosaurResponse[];
}

export default function HybridExhibitPanel({ selected, dinosaurs }: HybridExhibitPanelProps) {
  const [peerId, setPeerId] = useState('');
  const [notice, setNotice] = useState('');
  const selectId = useId();
  const client = useQueryClient();
  const peers = dinosaurs.filter(
    (dinosaur) => dinosaur.speciesId === FIRST_HYBRID_SPECIES_ID && dinosaur.id !== selected.id,
  );
  const peer =
    peers.find((dinosaur) => dinosaur.id === peerId) ??
    peers.find((dinosaur) => dinosaur.isInPark !== selected.isInPark) ??
    peers[0];
  const selectedIsCurrent = selected.isInPark || !peer?.isInPark;
  const current = selectedIsCurrent ? selected : peer;
  const candidate = selectedIsCurrent ? peer : selected;
  const selection = { currentId: current.id, candidateId: candidate?.id ?? '' };
  const preview = useQuery({
    queryKey: [
      ...queryKeys.dinosaurs,
      'hybrid-exhibit',
      selection.currentId,
      selection.candidateId,
      current.happiness,
      current.hunger,
      candidate?.isInPark,
      candidate?.happiness,
      candidate?.hunger,
    ],
    queryFn: ({ signal }) =>
      api.get<HybridExhibitPreview>(`/dinosaurs/hybrid-exhibit?${new URLSearchParams(selection)}`, {
        signal,
      }),
    enabled: current.isInPark && !!candidate,
    refetchInterval: 30_000,
    retry: false,
  });
  const replacement = useMutation({
    mutationFn: (selection: HybridExhibitSelection) =>
      api.patch<HybridExhibitPreview>('/dinosaurs/hybrid-exhibit', selection),
    onSuccess: async (_, selection) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.dinosaurList() }),
        client.invalidateQueries({ queryKey: queryKeys.dinosaurDetail(selection.currentId) }),
        client.invalidateQueries({ queryKey: queryKeys.dinosaurDetail(selection.candidateId) }),
        client.invalidateQueries({ queryKey: queryKeys.parkOperations() }),
      ]);
      setNotice('대표 전시를 교체했어요.');
    },
  });

  return (
    <section
      aria-labelledby={`${selectId}-title`}
      className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm"
    >
      <h3 id={`${selectId}-title`} className="font-bold text-green-950">
        {peer ? '개체 능력치 비교' : '개체 능력치'}
      </h3>
      {peer ? (
        <>
          <label htmlFor={selectId} className="mt-2 block text-xs font-medium text-green-950">
            비교할 개체
          </label>
          <select
            id={selectId}
            value={peer.id}
            disabled={replacement.isPending}
            onChange={(event) => {
              setPeerId(event.target.value);
              setNotice('');
              replacement.reset();
            }}
            className="mt-1 min-h-10 w-full rounded-lg border border-green-300 bg-white px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
          >
            {peers.map((dinosaur, index) => (
              <option key={dinosaur.id} value={dinosaur.id}>
                {index + 1}. {title(dinosaur)} · {location(dinosaur)} · 매력도{' '}
                {stats(dinosaur).appeal}
              </option>
            ))}
          </select>
          <table className="mt-3 w-full table-fixed text-right text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-green-200 text-xs text-green-950">
                <td className="w-[28%] pb-1" />
                <th scope="col" className="break-words pb-1 font-semibold">
                  {selected.nickname || '선택한 개체'}
                  <span className="block font-normal">{location(selected)}</span>
                </th>
                <th scope="col" className="break-words pb-1 font-semibold">
                  {peer.nickname || '비교 개체'}
                  <span className="block font-normal">{location(peer)}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attribute) => (
                <tr key={attribute}>
                  <th scope="row" className="py-1 text-left font-medium">
                    {DINOSAUR_COMPETITIVE_STAT_LABELS[attribute]}
                  </th>
                  <td className="font-semibold">{stats(selected)[attribute]}</td>
                  <td>{stats(peer)[attribute]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <dl className="mt-2 grid grid-cols-4 gap-1 text-center">
          {attributes.map((attribute) => (
            <div key={attribute}>
              <dt className="text-xs text-green-950">
                {DINOSAUR_COMPETITIVE_STAT_LABELS[attribute]}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums">
                {stats(selected)[attribute]}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {peer && (
        <div className="mt-3 space-y-2 border-t border-green-200 pt-3">
          {notice && (
            <p role="status" className="text-green-800">
              {notice}
            </p>
          )}
          {!current.isInPark && (
            <p className="text-xs text-slate-700">
              한 마리를 먼저 전시하면 예상 입장객을 비교할 수 있어요.
            </p>
          )}
          {preview.isLoading && (
            <p className="text-xs text-slate-700">예상 입장객을 계산하고 있어요.</p>
          )}
          {preview.isError && (
            <p role="alert" className="text-xs text-red-800">
              {preview.error.message}
            </p>
          )}
          {preview.data && (
            <>
              <h4 className="font-semibold text-green-950">대표 전시 교체 시 예상 입장객</h4>
              <dl className="space-y-1 text-xs tabular-nums">
                <div className="flex items-baseline justify-between gap-2">
                  <dt>예상 입장</dt>
                  <dd className="text-right font-semibold">
                    {rate(preview.data.current.visitorsPerMinute)}명/분
                    {preview.data.proposed &&
                      ` → ${rate(preview.data.proposed.visitorsPerMinute)}명/분`}
                  </dd>
                </div>
                {preview.data.proposed && (
                  <div className="flex items-baseline justify-between gap-2">
                    <dt>방문 수요</dt>
                    <dd className="text-right">
                      {rate(preview.data.current.demandPerMinute)} →{' '}
                      {rate(preview.data.proposed.demandPerMinute)}명/분
                    </dd>
                  </div>
                )}
              </dl>
              {preview.data.proposed &&
                (preview.data.current.demandPerMinute > preview.data.current.visitorsPerMinute ||
                  preview.data.proposed.demandPerMinute >
                    preview.data.proposed.visitorsPerMinute) && (
                  <p className="text-xs text-slate-700">
                    입장 한도는 {rate(preview.data.proposed.capacityPerMinute)}명/분이에요.
                  </p>
                )}
              {preview.data.unavailableReason && (
                <p className="text-xs text-slate-700">{preview.data.unavailableReason}</p>
              )}
              {!preview.data.unavailableReason && preview.data.proposed && (
                <Button
                  type="button"
                  className="min-h-11 w-full bg-green-700 text-sm hover:bg-green-800"
                  isLoading={replacement.isPending}
                  onClick={() => {
                    setNotice('');
                    replacement.mutate(selection);
                  }}
                >
                  {selectedIsCurrent ? '비교 개체로 교체' : '이 개체로 교체'}
                </Button>
              )}
            </>
          )}
          {replacement.isError && (
            <p role="alert" className="text-xs text-red-800">
              {replacement.error.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
