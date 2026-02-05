import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonStore, useClaimableRewardsCount } from '../stores/useSeasonStore';
import SeasonPassTrack from '../components/SeasonPassTrack';
import SeasonChapterList from '../components/SeasonChapterList';
import { SeasonEventsList } from '../components/SeasonEventCard';

export default function SeasonPage() {
  const {
    currentSeason,
    seasonPass,
    chapters,
    events,
    activeTab,
    setActiveTab,
    setCurrentSeason,
    setSeasonPass,
    setChapters,
    setEvents,
    setLoading,
    isLoading,
    claimFreeReward,
    claimPremiumReward,
    upgradeToPremium,
  } = useSeasonStore();

  const claimableCount = useClaimableRewardsCount();

  // 데이터 로드 (TODO: API 연동)
  useEffect(() => {
    loadSeasonData();
  }, []);

  const loadSeasonData = async () => {
    setLoading(true);

    // Mock 데이터 (TODO: API 연동)
    try {
      // 현재 시즌
      setCurrentSeason({
        id: 'season-1',
        name: 'Return of the Founder',
        nameKo: '창립자의 귀환',
        theme: 'founder',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        maxLevel: 50,
        isActive: true,
      });

      // 시즌 패스 Mock 데이터
      const mockRewards = Array.from({ length: 50 }, (_, i) => ({
        level: i + 1,
        freeReward: {
          type: i % 3 === 0 ? 'diamond' : i % 3 === 1 ? 'gold' : 'dna',
          quantity: (i + 1) * (i % 3 === 0 ? 10 : i % 3 === 1 ? 1000 : 50),
        },
        premiumReward: {
          type:
            (i + 1) % 10 === 0
              ? 'dinosaur'
              : (i + 1) % 5 === 0
                ? 'skin'
                : i % 3 === 0
                  ? 'diamond'
                  : 'gold',
          quantity: (i + 1) * (i % 3 === 0 ? 20 : 2000),
          id: (i + 1) % 10 === 0 ? 'velociraptor-misty' : undefined,
        },
        canClaimFree: i < 15 && i >= 10,
        canClaimPremium: false,
        isFreeClaimed: i < 10,
        isPremiumClaimed: false,
      }));

      setSeasonPass({
        id: 'pass-1',
        level: 15,
        exp: 750,
        isPremium: false,
        seasonName: '창립자의 귀환',
        maxLevel: 50,
        nextLevelExp: 1600,
        expProgress: 0.47,
        daysRemaining: 58,
        rewards: mockRewards,
      });

      // 시즌 챕터 Mock 데이터
      setChapters([
        {
          id: 's1-ch1',
          order: 1,
          title: 'The Hidden Journal',
          titleKo: '숨겨진 일지',
          isUnlocked: true,
          isCompleted: true,
          sceneCount: 3,
          rewards: [
            { type: 'seasonPoint', amount: 500 },
            { type: 'gold', amount: 50000 },
          ],
        },
        {
          id: 's1-ch2',
          order: 2,
          title: 'Beyond the Mist',
          titleKo: '안개 너머',
          isUnlocked: true,
          isCompleted: false,
          sceneCount: 3,
          rewards: [
            { type: 'seasonPoint', amount: 700 },
            { type: 'dinosaur', amount: 1, id: 'protoceratops-alpha' },
          ],
        },
        {
          id: 's1-ch3',
          order: 3,
          title: "Noah's Ark",
          titleKo: '노아의 방주',
          isUnlocked: false,
          isCompleted: false,
          sceneCount: 3,
          rewards: [
            { type: 'seasonPoint', amount: 1000 },
            { type: 'diamond', amount: 200 },
          ],
        },
        {
          id: 's1-ch4',
          order: 4,
          title: 'Heart of Eden',
          titleKo: '에덴의 심장',
          isUnlocked: false,
          isCompleted: false,
          sceneCount: 2,
          rewards: [
            { type: 'seasonPoint', amount: 1500 },
            { type: 'item', amount: 1, id: 'eden-crystal-shard' },
          ],
        },
        {
          id: 's1-ch5',
          order: 5,
          title: 'The Founder',
          titleKo: '창립자',
          isUnlocked: false,
          isCompleted: false,
          sceneCount: 3,
          rewards: [
            { type: 'seasonPoint', amount: 3000 },
            { type: 'greatFigure', amount: 1, id: 'arthur-hammond' },
          ],
        },
      ]);

      // 시즌 이벤트 Mock 데이터
      setEvents([
        {
          id: 's1-event-1',
          name: "Founder's Legacy Collection",
          nameKo: '창립자의 유산 컬렉션',
          type: 'collection',
          daysRemaining: 7,
          description: '아서 해먼드의 연구 기록 조각을 수집하세요.',
          rewards: [
            { type: 'gold', quantity: 100000 },
            { type: 'diamond', quantity: 200 },
          ],
        },
        {
          id: 's1-event-2',
          name: 'Mist Explorer Challenge',
          nameKo: '안개 탐험가 챌린지',
          type: 'challenge',
          daysRemaining: 2,
          description: '안개 지역 탐험을 완료하고 특별 보상을 획득하세요.',
          rewards: [
            { type: 'dna', quantity: 1000 },
            { type: 'dinosaur', quantity: 1, id: 'velociraptor-misty' },
          ],
        },
      ]);
    } catch (error) {
      console.error('Failed to load season data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 무료 보상 수령
  const handleClaimFree = async (level: number) => {
    // TODO: API 호출
    claimFreeReward(level);
  };

  // 프리미엄 보상 수령
  const handleClaimPremium = async (level: number) => {
    // TODO: API 호출
    claimPremiumReward(level);
  };

  // 프리미엄 업그레이드
  const handleUpgradePremium = () => {
    // TODO: 구매 모달 또는 상점으로 이동
    upgradeToPremium();
  };

  // 챕터 선택
  const handleSelectChapter = (chapterId: string) => {
    // TODO: 스토리 플레이어로 이동
    console.log('Select chapter:', chapterId);
  };

  // 이벤트 참여
  const handleParticipateEvent = (eventId: string) => {
    // TODO: 이벤트 상세 페이지로 이동
    console.log('Participate event:', eventId);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-4xl">🌟</div>
          <div className="text-white">시즌 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!currentSeason || !seasonPass) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900">
        <div className="mb-4 text-6xl">🦕</div>
        <h2 className="mb-2 text-xl font-semibold text-white">시즌이 없습니다</h2>
        <p className="text-gray-400">새로운 시즌을 기대해 주세요!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* 헤더 배너 */}
      <div className="relative h-40 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex h-full flex-col justify-end p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <h1 className="text-2xl font-bold text-white">{currentSeason.nameKo}</h1>
          </div>
          <p className="text-sm text-gray-300">Season {currentSeason.id.replace('season-', '')}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="flex">
          <TabButton
            label="시즌 패스"
            icon="🏆"
            isActive={activeTab === 'pass'}
            onClick={() => setActiveTab('pass')}
            badge={claimableCount.free + claimableCount.premium}
          />
          <TabButton
            label="스토리"
            icon="📖"
            isActive={activeTab === 'story'}
            onClick={() => setActiveTab('story')}
            badge={chapters.filter((c) => c.isUnlocked && !c.isCompleted).length}
          />
          <TabButton
            label="이벤트"
            icon="🎪"
            isActive={activeTab === 'events'}
            onClick={() => setActiveTab('events')}
            badge={events.length}
          />
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'pass' && (
            <motion.div
              key="pass"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SeasonPassTrack
                onClaimFree={handleClaimFree}
                onClaimPremium={handleClaimPremium}
                onUpgradePremium={handleUpgradePremium}
              />
            </motion.div>
          )}

          {activeTab === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SeasonChapterList onSelectChapter={handleSelectChapter} />
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SeasonEventsList events={events} onParticipate={handleParticipateEvent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 탭 버튼 컴포넌트
interface TabButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

function TabButton({ label, icon, isActive, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-1 items-center justify-center gap-2 py-3 transition-all
        ${isActive ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}
      `}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
