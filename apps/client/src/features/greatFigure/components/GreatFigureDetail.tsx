import { motion, AnimatePresence } from 'framer-motion';
import {
  type GreatFigure,
  type GreatFigureType,
  JOB_CONFIG,
  RARITY_CONFIG,
  useGreatFigureStore,
} from '../stores/useGreatFigureStore';

interface GreatFigureDetailProps {
  isOpen: boolean;
  onClose: () => void;
  figure: GreatFigure | GreatFigureType | null;
  mode: 'owned' | 'recruit';
  onRecruit?: (figureId: string) => void;
  onLevelUp?: (figureId: string) => void;
  onAssign?: () => void;
  onUnassign?: (figureId: string) => void;
}

function isOwnedFigure(figure: GreatFigure | GreatFigureType | null): figure is GreatFigure {
  return figure !== null && 'level' in figure && 'maxExp' in figure;
}

export default function GreatFigureDetail({
  isOpen,
  onClose,
  figure,
  mode,
  onRecruit,
  onLevelUp,
  onAssign,
  onUnassign,
}: GreatFigureDetailProps) {
  const { figurePoints, isLoading, getFigureSynergies } = useGreatFigureStore();

  if (!figure) return null;

  const figureType = isOwnedFigure(figure) ? figure.type : figure;
  const jobConfig = JOB_CONFIG[figureType.job];
  const rarityConfig = RARITY_CONFIG[figureType.rarity];

  const canAfford = figurePoints >= figureType.recruitCost;
  const activeSynergies = isOwnedFigure(figure) ? getFigureSynergies(figure.id) : [];

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
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-gray-900"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* 헤더 */}
            <div className={`relative p-6 ${rarityConfig.bgColor}`}>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-black/30 p-2 text-white transition-all hover:bg-black/50"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                {/* 아바타 */}
                <motion.div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-800/50 text-4xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {jobConfig.icon}
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-white">{figureType.nameKo}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    {isOwnedFigure(figure) && (
                      <span className="rounded bg-gray-800 px-2 py-1 text-sm font-medium text-white">
                        Lv.{figure.level}
                      </span>
                    )}
                    <span className={`rounded px-2 py-1 text-xs ${rarityConfig.color}`}>
                      {rarityConfig.icon} {rarityConfig.label}
                    </span>
                    <span className={`rounded px-2 py-1 text-xs ${jobConfig.color}`}>
                      {jobConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* 경험치 바 (보유 위인만) */}
              {isOwnedFigure(figure) && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-300">경험치</span>
                    <span className="text-white">
                      {figure.exp.toLocaleString()} / {figure.maxExp.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(figure.exp / figure.maxExp) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 설명 */}
              <div className="mb-4">
                <p className="text-gray-300">{figureType.description}</p>
                <p className="mt-2 text-sm italic text-gray-500">"{figureType.quote}"</p>
              </div>

              {/* 배치 상태 (보유 위인만) */}
              {isOwnedFigure(figure) && (
                <div className="mb-4 rounded-xl bg-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">배치 상태</span>
                    {figure.assignedBuildingId ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-400">
                          🏢 {figure.assignedBuildingName}
                        </span>
                        <button
                          onClick={() => onUnassign?.(figure.id)}
                          disabled={isLoading}
                          className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-red-900 hover:text-red-400"
                        >
                          해제
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">대기 중</span>
                        <button
                          onClick={onAssign}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium hover:bg-blue-500"
                        >
                          배치
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 능력 */}
              <div className="mb-4">
                <h4 className="mb-3 font-semibold text-white">✨ 능력</h4>
                <div className="space-y-2">
                  {figureType.abilities.map((ability, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                    >
                      <span className="text-sm text-gray-300">{ability.description}</span>
                      <span className="font-medium text-green-400">
                        +{ability.value}%
                        {isOwnedFigure(figure) && figure.level > 1 && (
                          <span className="ml-1 text-xs text-purple-400">
                            (x{(1 + (figure.level - 1) * 0.1).toFixed(1)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 시너지 */}
              {figureType.synergies.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3 font-semibold text-white">🤝 시너지</h4>
                  <div className="space-y-2">
                    {figureType.synergies.map((synergy, idx) => {
                      const isActive = activeSynergies.some(
                        (s) => s.partnerId === synergy.partnerId,
                      );
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between rounded-lg p-3 ${
                            isActive ? 'bg-purple-900/30' : 'bg-gray-800'
                          }`}
                        >
                          <div>
                            <span
                              className={`text-sm ${isActive ? 'text-purple-300' : 'text-gray-400'}`}
                            >
                              {synergy.partnerName}과(와) 함께
                            </span>
                            <p className="text-xs text-gray-500">{synergy.effect}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-medium ${isActive ? 'text-purple-400' : 'text-gray-500'}`}
                            >
                              +{synergy.bonusPercentage}%
                            </span>
                            {isActive && (
                              <span className="ml-2 rounded bg-purple-600 px-1.5 py-0.5 text-xs">
                                활성
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 영입 비용 (영입 모드만) */}
              {mode === 'recruit' && !isOwnedFigure(figure) && (
                <div className="rounded-xl bg-purple-900/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">영입 비용</span>
                    <span className="text-xl font-bold text-purple-400">
                      {figureType.recruitCost.toLocaleString()} P
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">보유 포인트</span>
                    <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                      {figurePoints.toLocaleString()} P
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="border-t border-gray-800 p-4">
              {mode === 'owned' && isOwnedFigure(figure) ? (
                <button
                  onClick={() => onLevelUp?.(figure.id)}
                  disabled={isLoading || figure.level >= 10}
                  className={`
                    w-full rounded-xl py-3 font-semibold transition-all
                    ${
                      figure.level >= 10
                        ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                    }
                  `}
                >
                  {isLoading
                    ? '레벨업 중...'
                    : figure.level >= 10
                      ? '🏆 최대 레벨 달성'
                      : `⬆️ 레벨업 (${(figure.level * 100).toLocaleString()} P)`}
                </button>
              ) : (
                <button
                  onClick={() => onRecruit?.(figureType.id)}
                  disabled={isLoading || !canAfford}
                  className={`
                    w-full rounded-xl py-3 font-semibold transition-all
                    ${
                      canAfford && !isLoading
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                        : 'cursor-not-allowed bg-gray-700 text-gray-500'
                    }
                  `}
                >
                  {isLoading ? '영입 중...' : !canAfford ? '포인트 부족' : '👤 영입하기'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
