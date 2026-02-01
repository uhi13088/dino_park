import { useEffect, useRef, useState } from 'react';
import { gameEngine } from '@/game';

/**
 * PixiJS 게임 엔진 훅
 */
export function useGameEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 게임 엔진 초기화
    gameEngine
      .initialize(container)
      .then(() => {
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize game engine:', err);
        setError(err);
      });

    // 클린업
    return () => {
      gameEngine.destroy();
      setIsReady(false);
    };
  }, []);

  return {
    containerRef,
    isReady,
    error,
    engine: gameEngine,
  };
}
