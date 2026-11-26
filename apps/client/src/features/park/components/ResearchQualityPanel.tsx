import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MATERIAL_QUALITY_LABELS,
  MaterialQuality,
  RESEARCH_MATERIAL_LABELS,
  RESEARCH_MATERIAL_UPGRADE,
  ResearchMaterial,
  type ResourcesResponse,
} from '@dino-park/shared';
import { Button } from '@/components/ui';
import { useUpgradeResearchMaterial } from '@/api/queries/resources';
import { createRequestId } from '@/utils/requestId';

export default function ResearchQualityPanel({
  resources,
  focused,
}: {
  resources: ResourcesResponse;
  focused?: boolean;
}) {
  const section = useRef<HTMLElement>(null);
  const request = useRef<{ key: string; id: string }>();
  const [material, setMaterial] = useState(ResearchMaterial.DNA);
  const [quality, setQuality] = useState<MaterialQuality.LOW | MaterialQuality.MIDDLE>(
    MaterialQuality.LOW,
  );
  const upgrade = useUpgradeResearchMaterial();
  useEffect(() => {
    if (focused) {
      section.current?.scrollIntoView?.({ block: 'nearest' });
      section.current?.focus({ preventScroll: true });
    }
  }, [focused]);
  const amount =
    resources.researchMaterials?.find((row) => row.material === material && row.quality === quality)
      ?.amount ?? 0;
  const cost = RESEARCH_MATERIAL_UPGRADE.gold[quality];
  const next = quality === MaterialQuality.LOW ? MaterialQuality.MIDDLE : MaterialQuality.HIGH;
  const disabled = amount < RESEARCH_MATERIAL_UPGRADE.ratio || resources.gold < cost;
  const makeOne = () => {
    const key = material + ':' + quality;
    if (request.current?.key !== key) request.current = { key, id: createRequestId() };
    upgrade.mutate(
      { material, fromQuality: quality, quantity: 1, requestId: request.current.id },
      {
        onSuccess: () => {
          request.current = undefined;
        },
      },
    );
  };
  return (
    <section
      ref={section}
      tabIndex={-1}
      className="resource-panel__quality"
      aria-labelledby="quality-title"
    >
      <h3 id="quality-title">연구 재료 승급</h3>
      <div className="resource-panel__quality-filters">
        <label>
          재료
          <select
            aria-label="재료"
            value={material}
            onChange={(event) => {
              setMaterial(event.target.value as ResearchMaterial);
              upgrade.reset();
            }}
            disabled={upgrade.isPending}
          >
            {Object.values(ResearchMaterial).map((item) => (
              <option key={item} value={item}>
                {RESEARCH_MATERIAL_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          품질
          <select
            aria-label="품질"
            value={quality}
            onChange={(event) => {
              setQuality(Number(event.target.value) as typeof quality);
              upgrade.reset();
            }}
            disabled={upgrade.isPending}
          >
            <option value={MaterialQuality.LOW}>하급 → 중급</option>
            <option value={MaterialQuality.MIDDLE}>중급 → 상급</option>
          </select>
        </label>
      </div>
      <p>
        {MATERIAL_QUALITY_LABELS[quality]} {RESEARCH_MATERIAL_LABELS[material]} {amount}개 보유 ·
        승급에 3개와 {cost}골드 사용
      </p>
      <Button disabled={disabled || upgrade.isPending} onClick={makeOne}>
        {MATERIAL_QUALITY_LABELS[next]} 1개 만들기
      </Button>
      {upgrade.isSuccess && (
        <p role="status">
          {MATERIAL_QUALITY_LABELS[next]} {RESEARCH_MATERIAL_LABELS[material]} 1개를 받았어요.
        </p>
      )}
      {upgrade.error && <p role="alert">{upgrade.error.message}</p>}
      {focused && <Link to="/research/hybrids">실험 합성으로 돌아가기</Link>}
    </section>
  );
}
