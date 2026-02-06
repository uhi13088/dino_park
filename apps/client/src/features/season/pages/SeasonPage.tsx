import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSeasonStore,
  useClaimableRewardsCount,
  type SeasonChapter,
  type SeasonEvent,
} from '../stores/useSeasonStore';
import SeasonPassTrack from '../components/SeasonPassTrack';
import SeasonChapterList from '../components/SeasonChapterList';
import { SeasonEventsList } from '../components/SeasonEventCard';
import {
  useCurrentSeason,
  useSeasonPass,
  useSeasonChapters,
  useSeasonEvents,
  useClaimSeasonReward,
  useUpgradeSeasonPass,
} from '../../../api/queries';

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
    claimFreeReward,
    claimPremiumReward,
    upgradeToPremium,
  } = useSeasonStore();

  const claimableCount = useClaimableRewardsCount();

  // API 쿼리
  const { data: seasonData, isLoading: seasonLoading } = useCurrentSeason();
  const { data: passData, isLoading: passLoading } = useSeasonPass();
  const { data: chaptersData, isLoading: chaptersLoading } = useSeasonChapters();
  const { data: eventsData, isLoading: eventsLoading } = useSeasonEvents();

  // API 뮤테이션
  const claimRewardMutation = useClaimSeasonReward();
  const upgradePassMutation = useUpgradeSeasonPass();

  const isLoading = seasonLoading || passLoading || chaptersLoading || eventsLoading;

  // API 데이터를 스토어에 동기화
  useEffect(() => {
    if (seasonData?.season) {
      const season = seasonData.season as {
        id: string;
        name: string;
        nameKo?: string;
        theme: string;
        startDate: string;
        endDate: string;
        maxLevel: number;
        isActive: boolean;
      };
      setCurrentSeason({
        id: season.id,
        name: season.name,
        nameKo: season.nameKo || season.name,
        theme: season.theme,
        startDate: season.startDate,
        endDate: season.endDate,
        maxLevel: season.maxLevel,
        isActive: season.isActive,
      });
    }
  }, [seasonData, setCurrentSeason]);

  useEffect(() => {
    if (passData && seasonData?.season) {
      const pass = passData as {
        level: number;
        exp: number;
        isPremium: boolean;
        claimedRewards: number[];
      };
      const season = seasonData.season as { maxLevel: number; nameKo?: string; name: string };

      // 기본 보상 데이터 생성
      const rewards = Array.from({ length: season.maxLevel }, (_, i) => ({
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
        canClaimFree: i < pass.level && !pass.claimedRewards.includes(i + 1),
        canClaimPremium:
          pass.isPremium && i < pass.level && !pass.claimedRewards.includes(-(i + 1)),
        isFreeClaimed: pass.claimedRewards.includes(i + 1),
        isPremiumClaimed: pass.claimedRewards.includes(-(i + 1)),
      }));

      setSeasonPass({
        id: `pass-${season.maxLevel}`,
        level: pass.level,
        exp: pass.exp,
        isPremium: pass.isPremium,
        seasonName: season.nameKo || season.name,
        maxLevel: season.maxLevel,
        nextLevelExp: pass.level * 100 + 500,
        expProgress: pass.exp / (pass.level * 100 + 500),
        daysRemaining: seasonData?.daysRemaining || 0,
        rewards,
      });
    }
  }, [passData, seasonData, setSeasonPass]);

  useEffect(() => {
    if (chaptersData?.chapters) {
      const mappedChapters: SeasonChapter[] = (
        chaptersData.chapters as Array<{
          id: string;
          order: number;
          title: string;
          titleKo?: string;
          isUnlocked: boolean;
          isCompleted: boolean;
          sceneCount: number;
          rewards: Array<{ type: string; amount: number; id?: string }>;
        }>
      ).map((c) => ({
        id: c.id,
        order: c.order,
        title: c.title,
        titleKo: c.titleKo || c.title,
        isUnlocked: c.isUnlocked,
        isCompleted: c.isCompleted,
        sceneCount: c.sceneCount,
        rewards: c.rewards,
      }));
      setChapters(mappedChapters);
    }
  }, [chaptersData, setChapters]);

  useEffect(() => {
    if (eventsData?.events) {
      const mappedEvents: SeasonEvent[] = (
        eventsData.events as Array<{
          id: string;
          name: string;
          nameKo?: string;
          type: string;
          daysRemaining: number;
          description: string;
          rewards: Array<{ type: string; quantity: number; id?: string }>;
        }>
      ).map((e) => ({
        id: e.id,
        name: e.name,
        nameKo: e.nameKo || e.name,
        type: e.type,
        daysRemaining: e.daysRemaining,
        description: e.description,
        rewards: e.rewards,
      }));
      setEvents(mappedEvents);
    }
  }, [eventsData, setEvents]);

  // 무료 보상 수령
  const handleClaimFree = async (level: number) => {
    try {
      await claimRewardMutation.mutateAsync({ level, isPremium: false });
      claimFreeReward(level);
    } catch (error) {
      console.error('Failed to claim free reward:', error);
    }
  };

  // 프리미엄 보상 수령
  const handleClaimPremium = async (level: number) => {
    try {
      await claimRewardMutation.mutateAsync({ level, isPremium: true });
      claimPremiumReward(level);
    } catch (error) {
      console.error('Failed to claim premium reward:', error);
    }
  };

  // 프리미엄 업그레이드
  const handleUpgradePremium = async () => {
    try {
      await upgradePassMutation.mutateAsync();
      upgradeToPremium();
    } catch (error) {
      console.error('Failed to upgrade to premium:', error);
    }
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
