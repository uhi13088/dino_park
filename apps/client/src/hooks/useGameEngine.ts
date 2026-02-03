import { useEffect, useRef, useState, useCallback } from 'react';
import { gameEngine, type GameEngineEvents } from '@/game';
import { useGameStore, useUIStore } from '@/stores';
import { useDinosaurs, useBuildings } from '@/api';

/**
 * PixiJS 게임 엔진 훅
 */
export function useGameEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 스토어
  const { selectEntity, mode, placementData } = useGameStore();
  const { openModal } = useUIStore();

  // API 데이터
  const { data: dinosaursData } = useDinosaurs();
  const { data: buildingsData } = useBuildings();

  // 타일 클릭 핸들러
  const handleTileClick = useCallback(
    ({ gridX, gridY }: GameEngineEvents['tile:click']) => {
      console.log(`Tile clicked: (${gridX}, ${gridY})`);

      // 배치 모드일 때
      if (mode === 'place_dinosaur' && placementData) {
        // TODO: 공룡 배치 API 호출
        console.log('Place dinosaur at:', gridX, gridY, placementData);
      } else if (mode === 'place_building' && placementData) {
        // TODO: 건물 배치 API 호출
        console.log('Place building at:', gridX, gridY, placementData);
      } else {
        // 선택 해제
        selectEntity(null);
      }
    },
    [mode, placementData, selectEntity]
  );

  // 엔티티 클릭 핸들러
  const handleEntityClick = useCallback(
    ({ type, id }: GameEngineEvents['entity:click']) => {
      console.log(`Entity clicked: ${type} - ${id}`);
      selectEntity({ type, id });

      // 모달 열기
      if (type === 'dinosaur') {
        openModal('dinosaur_detail', { dinosaurId: id });
      } else if (type === 'building') {
        openModal('building_detail', { buildingId: id });
      }
    },
    [selectEntity, openModal]
  );

  // 게임 엔진 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gameEngine
      .initialize(container)
      .then(() => {
        setIsReady(true);

        // 이벤트 리스너 등록
        gameEngine.on('tile:click', handleTileClick);
        gameEngine.on('entity:click', handleEntityClick);
      })
      .catch((err) => {
        console.error('Failed to initialize game engine:', err);
        setError(err);
      });

    // 클린업
    return () => {
      gameEngine.off('tile:click', handleTileClick);
      gameEngine.off('entity:click', handleEntityClick);
      gameEngine.destroy();
      setIsReady(false);
    };
  }, []); // 빈 의존성 - 초기화는 한 번만

  // 이벤트 핸들러 업데이트
  useEffect(() => {
    if (!isReady) return;

    gameEngine.off('tile:click', handleTileClick);
    gameEngine.on('tile:click', handleTileClick);

    return () => {
      gameEngine.off('tile:click', handleTileClick);
    };
  }, [handleTileClick, isReady]);

  useEffect(() => {
    if (!isReady) return;

    gameEngine.off('entity:click', handleEntityClick);
    gameEngine.on('entity:click', handleEntityClick);

    return () => {
      gameEngine.off('entity:click', handleEntityClick);
    };
  }, [handleEntityClick, isReady]);

  // 공룡 데이터 동기화
  useEffect(() => {
    if (!isReady || !dinosaursData?.dinosaurs) return;

    // 기존 공룡 제거 후 새로 추가
    dinosaursData.dinosaurs.forEach((dino) => {
      gameEngine.addDinosaur(
        dino.id,
        dino.positionX,
        dino.positionY,
        0x4CAF50 // TODO: 카테고리별 색상
      );
    });
  }, [isReady, dinosaursData]);

  // 건물 데이터 동기화
  useEffect(() => {
    if (!isReady || !buildingsData?.buildings) return;

    buildingsData.buildings.forEach((building) => {
      gameEngine.addBuilding(
        building.id,
        building.positionX,
        building.positionY,
        0x795548 // TODO: 타입별 색상
      );
    });
  }, [isReady, buildingsData]);

  return {
    containerRef,
    isReady,
    error,
    engine: gameEngine,
  };
}
