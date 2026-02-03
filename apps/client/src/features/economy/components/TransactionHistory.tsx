import {
  useEconomyStore,
  useFilteredTransactions,
  CURRENCY_CONFIG,
  type TransactionFilter,
} from '../stores/useEconomyStore';

// 필터 옵션
const FILTER_OPTIONS: Array<{ value: TransactionFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'earn', label: '획득' },
  { value: 'spend', label: '소비' },
  { value: 'purchase', label: '구매' },
  { value: 'reward', label: '보상' },
];

// 거래 타입별 설정
const TRANSACTION_TYPE_CONFIG: Record<string, { label: string; color: string; prefix: string }> = {
  earn: { label: '획득', color: 'text-green-600', prefix: '+' },
  spend: { label: '소비', color: 'text-red-600', prefix: '-' },
  purchase: { label: '구매', color: 'text-blue-600', prefix: '' },
  reward: { label: '보상', color: 'text-amber-600', prefix: '+' },
};

export default function TransactionHistory() {
  const { transactionFilter, setTransactionFilter, isLoading } = useEconomyStore();
  const transactions = useFilteredTransactions();

  return (
    <div className="flex h-full flex-col">
      {/* 필터 탭 */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setTransactionFilter(option.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              transactionFilter === option.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 거래 내역 목록 */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <span className="mb-2 text-4xl">📜</span>
            <p className="font-medium">거래 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 거래 항목
function TransactionItem({
  transaction,
}: {
  transaction: {
    id: string;
    type: string;
    currencyType: string;
    amount: number;
    reason: string;
    balanceAfter: number;
    createdAt: string | Date;
  };
}) {
  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type] || TRANSACTION_TYPE_CONFIG.earn;
  const currencyConfig = CURRENCY_CONFIG[transaction.currencyType] || CURRENCY_CONFIG.gold;

  // 시간 포맷
  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60000) {
      return '방금 전';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}분 전`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}시간 전`;
    } else {
      return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
      {/* 재화 아이콘 */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
        <span className="text-xl">{currencyConfig.icon}</span>
      </div>

      {/* 거래 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-800">{transaction.reason}</p>
        <p className="text-xs text-gray-500">
          {typeConfig.label} · {formatTime(transaction.createdAt)}
        </p>
      </div>

      {/* 금액 */}
      <div className="text-right">
        <p className={`font-bold ${typeConfig.color}`}>
          {typeConfig.prefix}
          {transaction.amount.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">잔액: {transaction.balanceAfter.toLocaleString()}</p>
      </div>
    </div>
  );
}
