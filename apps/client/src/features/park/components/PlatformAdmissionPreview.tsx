import type { ParkOperationsResponse } from '@dino-park/shared';

export type PlatformImpact = NonNullable<
  NonNullable<ParkOperationsResponse['admission']>['platformImpact']
>;

export default function PlatformAdmissionPreview({
  impact,
  exhibitName,
  isParkOpen,
  admissionPaused = false,
}: {
  impact: PlatformImpact;
  exhibitName?: string;
  isParkOpen: boolean;
  admissionPaused?: boolean;
}) {
  const { before, after } = impact;
  if (!before || !after) {
    return <p>관람대와 공룡이 전시된 서식지를 관람길로 연결하면 효과를 볼 수 있어요.</p>;
  }

  const exhibit = exhibitName ?? '연결된 전시 구역';
  const timing = !isParkOpen
    ? '개장 시 예상'
    : admissionPaused
      ? '입장 재개 시 예상'
      : '운영 기준 예상';

  return (
    <div>
      <p>
        {exhibit} 관람 효과 · {timing}
      </p>
      <p>
        혼잡도{' '}
        <strong>
          {before.crowdingPercent}% → {after.crowdingPercent}%
        </strong>
        {' · '}
        만족도{' '}
        <strong>
          {before.satisfactionPercent}% → {after.satisfactionPercent}%
        </strong>
      </p>
    </div>
  );
}
