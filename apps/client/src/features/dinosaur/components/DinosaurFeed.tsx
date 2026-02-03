import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Dinosaur, FOOD_TYPES, useDinosaurStore } from '../stores/useDinosaurStore';

interface DinosaurFeedProps {
  dinosaur: Dinosaur;
}

export default function DinosaurFeed({ dinosaur }: DinosaurFeedProps) {
  const [selectedFood, setSelectedFood] = useState<keyof typeof FOOD_TYPES | null>(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedResult, setFeedResult] = useState<{
    happinessGain: number;
    hungerReduce: number;
  } | null>(null);

  const { feedDinosaur } = useDinosaurStore();

  // 마지막으로 먹이준 시간
  const lastFedTime = new Date(dinosaur.lastFedAt);
  const timeSinceLastFed = Date.now() - lastFedTime.getTime();
  const minutesSinceLastFed = Math.floor(timeSinceLastFed / 60000);

  const formatLastFed = () => {
    if (minutesSinceLastFed < 60) {
      return `${minutesSinceLastFed}분 전`;
    }
    const hours = Math.floor(minutesSinceLastFed / 60);
    if (hours < 24) {
      return `${hours}시간 전`;
    }
    return `${Math.floor(hours / 24)}일 전`;
  };

  const handleFeed = async () => {
    if (!selectedFood || isFeeding) return;

    const food = FOOD_TYPES[selectedFood];

    setIsFeeding(true);
    await feedDinosaur(dinosaur.id, selectedFood);

    // 결과 표시
    setFeedResult({
      happinessGain: food.happinessGain,
      hungerReduce: food.hungerReduce,
    });

    // 애니메이션 후 결과 숨기기
    setTimeout(() => {
      setFeedResult(null);
      setIsFeeding(false);
      setSelectedFood(null);
    }, 2000);
  };

  // 배고픔 상태에 따른 메시지
  const getHungerMessage = () => {
    if (dinosaur.hunger >= 80) return { text: '배가 너무 고파요! 🆘', color: 'text-red-400' };
    if (dinosaur.hunger >= 50) return { text: '배가 고파요... 😢', color: 'text-orange-400' };
    if (dinosaur.hunger >= 30) return { text: '조금 배고파요 🙂', color: 'text-yellow-400' };
    return { text: '배불러요! 😊', color: 'text-green-400' };
  };

  const hungerMessage = getHungerMessage();

  return (
    <div className="space-y-4">
      {/* 공룡 상태 */}
      <div className="text-center">
        <motion.div
          className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-gray-800 text-6xl"
          animate={isFeeding ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : { y: [0, -5, 0] }}
          transition={isFeeding ? { duration: 0.5 } : { duration: 2, repeat: Infinity }}
        >
          {isFeeding ? '😋' : dinosaur.hunger >= 70 ? '😫' : '🦕'}
        </motion.div>

        <p className={`font-medium ${hungerMessage.color}`}>{hungerMessage.text}</p>
        <p className="mt-1 text-sm text-gray-500">마지막 식사: {formatLastFed()}</p>
      </div>

      {/* 먹이 결과 애니메이션 */}
      <AnimatePresence>
        {feedResult && (
          <motion.div
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.span
              className="rounded-full bg-yellow-900/50 px-3 py-1 text-sm text-yellow-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              😊 +{feedResult.happinessGain}
            </motion.span>
            <motion.span
              className="rounded-full bg-green-900/50 px-3 py-1 text-sm text-green-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              🍖 -{feedResult.hungerReduce}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 현재 상태 바 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-800 p-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-400">배고픔</span>
            <span className={dinosaur.hunger >= 70 ? 'text-red-400' : 'text-white'}>
              {dinosaur.hunger}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full transition-all ${dinosaur.hunger >= 70 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${dinosaur.hunger}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-400">행복도</span>
            <span className="text-yellow-400">{dinosaur.happiness}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 transition-all"
              style={{ width: `${dinosaur.happiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* 먹이 선택 */}
      <div className="space-y-2">
        <h4 className="font-medium text-white">🍖 먹이 선택</h4>
        <div className="grid gap-2">
          {(
            Object.entries(FOOD_TYPES) as [
              keyof typeof FOOD_TYPES,
              (typeof FOOD_TYPES)[keyof typeof FOOD_TYPES],
            ][]
          ).map(([key, food]) => (
            <motion.button
              key={key}
              onClick={() => setSelectedFood(key)}
              disabled={isFeeding}
              className={`
                  flex items-center justify-between rounded-xl p-4 transition-all
                  ${
                    selectedFood === key
                      ? 'border-2 border-blue-500 bg-blue-900/30'
                      : 'hover:bg-gray-750 border-2 border-transparent bg-gray-800'
                  }
                  ${isFeeding ? 'cursor-not-allowed opacity-50' : ''}
                `}
              whileHover={{ scale: isFeeding ? 1 : 1.02 }}
              whileTap={{ scale: isFeeding ? 1 : 0.98 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{food.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-white">{food.name}</div>
                  <div className="text-xs text-gray-400">
                    행복도 +{food.happinessGain} / 배고픔 -{food.hungerReduce}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-yellow-400">🪙 {food.cost.toLocaleString()}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 먹이주기 버튼 */}
      <motion.button
        onClick={handleFeed}
        disabled={!selectedFood || isFeeding}
        className={`
          w-full rounded-xl py-4 font-semibold transition-all
          ${
            selectedFood && !isFeeding
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
              : 'cursor-not-allowed bg-gray-700 text-gray-500'
          }
        `}
        whileHover={{ scale: selectedFood && !isFeeding ? 1.02 : 1 }}
        whileTap={{ scale: selectedFood && !isFeeding ? 0.98 : 1 }}
      >
        {isFeeding ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            먹이 주는 중...
          </motion.span>
        ) : selectedFood ? (
          `🍖 ${FOOD_TYPES[selectedFood].name} 주기`
        ) : (
          '먹이를 선택해주세요'
        )}
      </motion.button>

      {/* 팁 */}
      <div className="rounded-lg bg-gray-800/50 p-3 text-xs text-gray-400">
        <span className="mr-1">💡</span>
        배고픔이 높을수록 행복도가 떨어지고, 수익이 감소해요. 정기적으로 먹이를 주세요!
      </div>
    </div>
  );
}
