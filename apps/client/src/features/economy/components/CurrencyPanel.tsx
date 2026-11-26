import { useEconomyStore } from '../stores/useEconomyStore';

interface CurrencyPanelProps {
  compact?: boolean;
}

export default function CurrencyPanel({ compact = false }: CurrencyPanelProps) {
  const { gold, diamond, dna, hourlyRevenue } = useEconomyStore();

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <CurrencyItem icon="🪙" amount={gold} />
        <CurrencyItem icon="💎" amount={diamond} />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <CurrencyCard icon="🪙" name="골드" amount={gold} color="bg-yellow-50 text-yellow-600" />
        <CurrencyCard icon="💎" name="다이아" amount={diamond} color="bg-blue-50 text-blue-600" />
        <CurrencyCard icon="🧬" name="DNA" amount={dna} color="bg-purple-50 text-purple-600" />
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
function CurrencyItem({ icon, amount }: { icon: string; amount: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg">{icon}</span>
      <span className="font-bold">{amount.toLocaleString()}</span>
    </div>
  );
}

// 재화 카드
function CurrencyCard({
  icon,
  name,
  amount,
  color,
}: {
  icon: string;
  name: string;
  amount: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="text-xl font-bold">{amount.toLocaleString()}</div>
    </div>
  );
}
