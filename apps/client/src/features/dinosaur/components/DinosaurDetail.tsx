import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type Dinosaur,
  CATEGORY_CONFIG,
  RARITY_CONFIG,
  useDinosaurStore,
} from '../stores/useDinosaurStore';
import DinosaurFeed from './DinosaurFeed';

interface DinosaurDetailProps {
  dinosaur: Dinosaur;
  onClose: () => void;
}

export default function DinosaurDetail({ dinosaur, onClose }: DinosaurDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'feed'>('info');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newNickname, setNewNickname] = useState(dinosaur.nickname || '');

  const { renameDinosaur, addExp } = useDinosaurStore();

  const categoryConfig = CATEGORY_CONFIG[dinosaur.species.category];
  const rarityConfig = RARITY_CONFIG[dinosaur.species.rarity];

  // 현재 수익 계산
  const currentRevenue = Math.floor(
    dinosaur.species.baseRevenue * dinosaur.level * (dinosaur.happiness / 100),
  );

  // 유지비
  const maintenanceCost = Math.floor(dinosaur.species.maintenanceCost * dinosaur.level);

  // 순수익
  const netRevenue = currentRevenue - maintenanceCost;

  const handleRename = () => {
    if (newNickname.trim() && newNickname !== dinosaur.nickname) {
      renameDinosaur(dinosaur.id, newNickname.trim());
    }
    setIsRenaming(false);
  };

  const tabs = [
    { id: 'info' as const, label: '정보', icon: '📋' },
    { id: 'stats' as const, label: '능력치', icon: '📊' },
    { id: 'feed' as const, label: '먹이주기', icon: '🍖' },
  ];

  return (
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
            {/* 공룡 아이콘 */}
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-800/50 text-5xl"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {dinosaur.species.category === 'carnivore' ? '🦖' : '🦕'}
            </motion.div>

            <div>
              {/* 이름 */}
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="rounded bg-gray-800 px-2 py-1 text-lg font-bold text-white"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={handleRename}
                    className="rounded bg-green-600 px-2 py-1 text-sm hover:bg-green-500"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setIsRenaming(false)}
                    className="rounded bg-gray-700 px-2 py-1 text-sm hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">
                    {dinosaur.nickname || dinosaur.species.nameKo}
                  </h2>
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="rounded bg-gray-800/50 p-1 text-sm hover:bg-gray-800"
                  >
                    ✏️
                  </button>
                </div>
              )}

              {/* 종 이름 */}
              {dinosaur.nickname && (
                <div className="text-sm text-gray-300">{dinosaur.species.nameKo}</div>
              )}

              {/* 레벨 & 등급 */}
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-gray-800 px-2 py-1 text-sm font-medium text-white">
                  Lv.{dinosaur.level}
                </span>
                <span className={`rounded px-2 py-1 text-xs ${rarityConfig.color}`}>
                  {rarityConfig.icon} {rarityConfig.label}
                </span>
                <span className={`rounded px-2 py-1 text-xs ${categoryConfig.color}`}>
                  {categoryConfig.icon} {categoryConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* 경험치 바 */}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-300">경험치</span>
              <span className="text-white">
                {dinosaur.exp.toLocaleString()} / {dinosaur.maxExp.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(dinosaur.exp / dinosaur.maxExp) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-all
                ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* 상태 게이지 */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 행복도 */}
                  <div className="rounded-xl bg-gray-800 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">행복도</span>
                      <span className="text-2xl">😊</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-yellow-400">
                      {dinosaur.happiness}%
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-400"
                        style={{ width: `${dinosaur.happiness}%` }}
                      />
                    </div>
                  </div>

                  {/* 배고픔 */}
                  <div className="rounded-xl bg-gray-800 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">배고픔</span>
                      <span className="text-2xl">{dinosaur.hunger > 70 ? '😫' : '😋'}</span>
                    </div>
                    <div
                      className={`mt-2 text-2xl font-bold ${dinosaur.hunger > 70 ? 'text-red-400' : 'text-green-400'}`}
                    >
                      {dinosaur.hunger}%
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className={`h-full ${dinosaur.hunger > 70 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${dinosaur.hunger}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 친밀도 */}
                <div className="rounded-xl bg-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400">친밀도</span>
                      <div className="mt-1 text-xl font-bold text-pink-400">
                        ❤️ {dinosaur.intimacy}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>함께한 시간</div>
                      <div>
                        {Math.floor(
                          (Date.now() - new Date(dinosaur.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}
                        일
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-red-500"
                      style={{ width: `${dinosaur.intimacy}%` }}
                    />
                  </div>
                </div>

                {/* 패시브 스킬 */}
                {dinosaur.species.passive && (
                  <div className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <span className="font-medium text-purple-300">패시브 스킬</span>
                    </div>
                    <p className="text-sm text-gray-300">{dinosaur.species.passive.description}</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* 수익 정보 */}
                <div className="rounded-xl bg-gray-800 p-4">
                  <h4 className="mb-3 font-medium text-white">💰 수익 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">기본 수익</span>
                      <span className="text-white">
                        {dinosaur.species.baseRevenue.toLocaleString()}/시간
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">레벨 보너스</span>
                      <span className="text-green-400">x{dinosaur.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">행복도 보너스</span>
                      <span className="text-yellow-400">{dinosaur.happiness}%</span>
                    </div>
                    <div className="my-2 border-t border-gray-700" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">현재 수익</span>
                      <span className="font-bold text-yellow-400">
                        🪙 {currentRevenue.toLocaleString()}/시간
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">유지비</span>
                      <span className="text-red-400">-{maintenanceCost.toLocaleString()}/시간</span>
                    </div>
                    <div className="my-2 border-t border-gray-700" />
                    <div className="flex justify-between">
                      <span className="font-medium text-white">순수익</span>
                      <span
                        className={`font-bold ${netRevenue >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {netRevenue >= 0 ? '+' : ''}
                        {netRevenue.toLocaleString()}/시간
                      </span>
                    </div>
                  </div>
                </div>

                {/* 기본 스탯 */}
                <div className="rounded-xl bg-gray-800 p-4">
                  <h4 className="mb-3 font-medium text-white">📊 기본 능력치</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">인기도</span>
                      <span className="text-blue-400">⭐ {dinosaur.species.popularity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">필요 공간</span>
                      <span className="text-white">{dinosaur.species.space} 칸</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">해금 레벨</span>
                      <span className="text-white">Lv.{dinosaur.species.unlockLevel}</span>
                    </div>
                  </div>
                </div>

                {/* 레벨업 보상 미리보기 */}
                <div className="rounded-xl bg-gray-800 p-4">
                  <h4 className="mb-3 font-medium text-white">⬆️ 다음 레벨 보너스</h4>
                  {dinosaur.level < 25 ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">수익 증가</span>
                        <span className="text-green-400">
                          +{dinosaur.species.baseRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">필요 경험치</span>
                        <span className="text-white">
                          {(dinosaur.maxExp - dinosaur.exp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">🏆 최대 레벨 달성!</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DinosaurFeed dinosaur={dinosaur} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
