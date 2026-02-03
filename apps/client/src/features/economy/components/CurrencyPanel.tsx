import { useEconomyStore, CURRENCY_CONFIG } from '../stores/useEconomyStore';

interface CurrencyPanelProps {
  compact?: boolean;
  showEnergy?: boolean;
}

export default function CurrencyPanel({ compact = false, showEnergy = true }: CurrencyPanelProps) {
  const { gold, diamond, dna, explorationEnergy, maxExplorationEnergy, hourlyRevenue } =
    useEconomyStore();

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <CurrencyItem icon="🪙" amount={gold} />
        <CurrencyItem icon="💎" amount={diamond} />
        {showEnergy && (
          <CurrencyItem icon="⚡" amount={explorationEnergy} max={maxExplorationEnergy} />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      {/* 메인 재화 */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <CurrencyCard icon="🪙" name="골드" amount={gold} color="bg-yellow-50 text-yellow-600" />
        <CurrencyCard icon="💎" name="다이아" amount={diamond} color="bg-blue-50 text-blue-600" />
      </div>

      {/* 서브 재화 */}
      <div className="grid grid-cols-2 gap-4">
        <CurrencyCard icon="🧬" name="DNA" amount={dna} color="bg-purple-50 text-purple-600" />
        {showEnergy && (
          <CurrencyCard
            icon="⚡"
            name="에너지"
            amount={explorationEnergy}
            max={maxExplorationEnergy}
            color="bg-orange-50 text-orange-600"
          />
        )}
      </div>

      {/* 시간당 수익 */}
      {hourlyRevenue > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">시간당 수익</span>
            <span className="font-bold text-yellow-600">
              🪙 +{hourlyRevenue.toLocaleString()}/h
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// 간단한 재화 표시 (헤더용)
function CurrencyItem({ icon, amount, max }: { icon: string; amount: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg">{icon}</span>
      <span className="font-bold">
        {amount.toLocaleString()}
        {max !== undefined && <span className="text-xs text-gray-400">/{max}</span>}
      </span>
    </div>
  );
}

// 재화 카드
function CurrencyCard({
  icon,
  name,
  amount,
  max,
  color,
}: {
  icon: string;
  name: string;
  amount: number;
  max?: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="text-xl font-bold">
        {amount.toLocaleString()}
        {max !== undefined && <span className="text-sm font-normal opacity-70">/{max}</span>}
      </div>
      {max !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/50">
          <div
            className="h-full bg-current transition-all"
            style={{ width: `${(amount / max) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
