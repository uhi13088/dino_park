import React from 'react';
import { motion } from 'framer-motion';
import { type Dinosaur, CATEGORY_CONFIG, RARITY_CONFIG } from '../stores/useDinosaurStore';

interface DinosaurCardProps {
  dinosaur: Dinosaur;
  onClick: () => void;
}

export default function DinosaurCard({ dinosaur, onClick }: DinosaurCardProps) {
  const categoryConfig = CATEGORY_CONFIG[dinosaur.species.category];
  const rarityConfig = RARITY_CONFIG[dinosaur.species.rarity];

  // 현재 수익 계산
  const currentRevenue = Math.floor(
    dinosaur.species.baseRevenue * dinosaur.level * (dinosaur.happiness / 100),
  );

  // 상태 경고
  const hasWarning = dinosaur.hunger >= 70 || dinosaur.happiness <= 30;

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full rounded-xl border bg-gray-800 p-4 text-left transition-all
        ${hasWarning ? 'border-red-500/50' : 'border-gray-700'}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {/* 공룡 아이콘 */}
        <div
          className={`relative flex h-16 w-16 items-center justify-center rounded-xl ${categoryConfig.bgColor}`}
        >
          <span className="text-3xl">
            {dinosaur.species.category === 'carnivore' ? '🦖' : '🦕'}
          </span>
          {/* 등급 표시 */}
          <span
            className={`absolute -right-1 -top-1 text-sm ${rarityConfig.color}`}
            title={rarityConfig.label}
          >
            {rarityConfig.icon}
          </span>
          {/* 경고 표시 */}
          {hasWarning && (
            <motion.span
              className="absolute -bottom-1 -right-1 text-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ⚠️
            </motion.span>
          )}
        </div>

        {/* 정보 */}
        <div className="min-w-0 flex-1">
          {/* 이름 */}
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold text-white">
              {dinosaur.nickname || dinosaur.species.nameKo}
            </h4>
            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
              Lv.{dinosaur.level}
            </span>
          </div>

          {/* 종 이름 */}
          {dinosaur.nickname && (
            <div className="mt-0.5 truncate text-xs text-gray-500">{dinosaur.species.nameKo}</div>
          )}

          {/* 상태 바 */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {/* 행복도 */}
            <div>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="text-gray-500">행복도</span>
                <span className={dinosaur.happiness <= 30 ? 'text-red-400' : 'text-yellow-400'}>
                  {dinosaur.happiness}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                <div
                  className={`h-full ${dinosaur.happiness <= 30 ? 'bg-red-500' : 'bg-yellow-500'}`}
                  style={{ width: `${dinosaur.happiness}%` }}
                />
              </div>
            </div>

            {/* 배고픔 */}
            <div>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="text-gray-500">배고픔</span>
                <span className={dinosaur.hunger >= 70 ? 'text-red-400' : 'text-green-400'}>
                  {dinosaur.hunger}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                <div
                  className={`h-full ${dinosaur.hunger >= 70 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${dinosaur.hunger}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 수익 */}
        <div className="text-right">
          <div className="text-xs text-gray-500">수익</div>
          <div className="font-semibold text-yellow-400">🪙 {currentRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">/시간</div>
        </div>
      </div>

      {/* 경험치 바 */}
      <div className="mt-3">
        <div className="mb-0.5 flex justify-between text-xs text-gray-500">
          <span>EXP</span>
          <span>
            {dinosaur.exp.toLocaleString()} / {dinosaur.maxExp.toLocaleString()}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${(dinosaur.exp / dinosaur.maxExp) * 100}%` }}
          />
        </div>
      </div>
    </motion.button>
  );
}
