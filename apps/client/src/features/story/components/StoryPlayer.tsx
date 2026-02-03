import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StorySceneResponse, AdvanceSceneResponse } from '@dino-park/shared';
import { Button } from '@/components/ui';

interface StoryPlayerProps {
  scene: StorySceneResponse;
  onAdvance: (choiceId?: string) => Promise<AdvanceSceneResponse>;
  onComplete: (rewards?: AdvanceSceneResponse['rewards']) => void;
  isAdvancing: boolean;
}

/**
 * 스토리 플레이어 컴포넌트
 */
export function StoryPlayer({ scene, onAdvance, onComplete, isAdvancing }: StoryPlayerProps) {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');

  const currentDialogue = scene.dialogues[currentDialogueIndex];
  const isLastDialogue = currentDialogueIndex === scene.dialogues.length - 1;
  const hasChoices = scene.choices && scene.choices.length > 0;

  // 타이핑 효과
  useEffect(() => {
    if (!currentDialogue) return;

    setDisplayedText('');
    setIsTyping(true);

    const text = currentDialogue.text;
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30); // 30ms per character

    return () => clearInterval(typingInterval);
  }, [currentDialogue]);

  // 대화 진행 핸들러
  const handleContinue = async () => {
    if (isTyping) {
      // 타이핑 중이면 즉시 전체 텍스트 표시
      setDisplayedText(currentDialogue.text);
      setIsTyping(false);
      return;
    }

    if (!isLastDialogue) {
      // 다음 대화로
      setCurrentDialogueIndex((prev) => prev + 1);
    } else if (!hasChoices) {
      // 선택지가 없으면 다음 씬으로
      const result = await onAdvance();
      if (result.isChapterComplete) {
        onComplete(result.rewards);
      }
    }
  };

  // 선택지 선택 핸들러
  const handleChoice = async (choiceId: string) => {
    const result = await onAdvance(choiceId);
    if (result.isChapterComplete) {
      onComplete(result.rewards);
    }
  };

  // 스킵 핸들러
  const handleSkip = async () => {
    const result = await onAdvance();
    if (result.isChapterComplete) {
      onComplete(result.rewards);
    }
  };

  const speakerColors: Record<string, string> = {
    narrator: 'text-gray-400',
    player: 'text-blue-400',
    hana: 'text-pink-400',
    kai: 'text-green-400',
    yuna: 'text-purple-400',
    default: 'text-yellow-400',
  };

  const speakerNames: Record<string, string> = {
    narrator: '나레이터',
    player: '나',
    hana: '하나',
    kai: '케이',
    yuna: '유나',
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      {/* 스킵 버튼 */}
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={handleSkip}
          disabled={isAdvancing}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/20"
        >
          스킵 ››
        </button>
      </div>

      {/* 캐릭터 영역 */}
      <div className="relative flex flex-1 items-end justify-center pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDialogue?.speaker}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            {/* 캐릭터 이미지 Placeholder */}
            <div className="from-primary-500/30 mx-auto flex h-64 w-48 items-end justify-center rounded-t-full bg-gradient-to-t to-transparent pb-4">
              <span className="text-8xl">{getCharacterEmoji(currentDialogue?.speaker)}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 대화 박스 */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-sm">
        {/* 화자 이름 */}
        {currentDialogue?.speaker !== 'narrator' && (
          <div className="px-6 pt-4">
            <span
              className={`text-sm font-bold ${speakerColors[currentDialogue?.speaker] ?? speakerColors.default}`}
            >
              {speakerNames[currentDialogue?.speaker] ?? currentDialogue?.speaker}
            </span>
          </div>
        )}

        {/* 대화 텍스트 */}
        <div className="min-h-[100px] cursor-pointer px-6 py-4" onClick={handleContinue}>
          <p className="text-lg leading-relaxed text-white">
            {displayedText}
            {isTyping && <span className="animate-pulse">▌</span>}
          </p>
        </div>

        {/* 선택지 또는 계속 버튼 */}
        <div className="px-6 pb-6">
          {isLastDialogue && hasChoices ? (
            <div className="space-y-2">
              {scene.choices!.map((choice) => (
                <Button
                  key={choice.id}
                  variant="secondary"
                  className="w-full justify-start text-left"
                  onClick={() => handleChoice(choice.id)}
                  disabled={isAdvancing}
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">
                {currentDialogueIndex + 1} / {scene.dialogues.length}
              </span>
              <button
                onClick={handleContinue}
                disabled={isAdvancing}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {isTyping ? '터치하여 스킵' : isLastDialogue ? '다음 씬 ▶' : '계속 ▶'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCharacterEmoji(speaker?: string): string {
  const emojis: Record<string, string> = {
    narrator: '📖',
    player: '🙂',
    hana: '👩',
    kai: '👨',
    yuna: '👧',
  };
  return emojis[speaker ?? 'narrator'] ?? '👤';
}
