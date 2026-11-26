import type { DinosaurSpecies } from '@dino-park/shared';
import { DinosaurCategory, DinosaurOrigin } from '@dino-park/shared';
import { getSynthesisRecipe } from '../research';
import { STARTER_PARK } from '../starter';

const HABITAT_NAMES: Record<string, string> = {
  grassland: '초원 서식지',
  forest: '숲 서식지',
  'giant-plains': '거대 평원',
  wetland: '습지 서식지',
  rocky: '바위 지대',
  desert: '사막 서식지',
  special: '특수 서식지',
  'carnivore-zone': '육식 서식지',
  'forest-isolation': '숲 격리 구역',
  'raptor-zone': '랩터 구역',
  'large-carnivore-zone': '대형 육식 구역',
  riverside: '강가 서식지',
  'trex-isolation': '티라노 격리 구역',
  'large-carnivore-isolation': '대형 육식 격리 구역',
  'special-isolation': '특수 격리 구역',
  aviary: '조류관',
  'sky-dome': '하늘 돔',
  'marine-connection': '해양관 연결 구역',
  'sky-dome-special': '특수 하늘 돔',
  aquarium: '수족관',
  'marine-aquarium': '해양관',
  'marine-hall': '해양관',
  'large-marine': '대형 해양관',
  'hybrid-zone': '초식 하이브리드 서식지',
  'hybrid-zone-isolation': '하이브리드 격리 구역',
};

export function getDinosaurOrigin(species: DinosaurSpecies): DinosaurOrigin {
  return (
    species.origin ??
    (species.category === DinosaurCategory.HYBRID ? DinosaurOrigin.HYBRID : DinosaurOrigin.NATURAL)
  );
}

export function getCodexHabitatName(habitat: string): string {
  const match = habitat.match(/^(.*)-lv(\d+)$/);
  const key = match ? match[1] : habitat;
  const name = HABITAT_NAMES[key] ?? key;
  return match ? `${name} Lv.${match[2]} 이상` : name;
}

export function getCodexImageUrl(speciesId: string): string | null {
  if (
    [
      'parasaurolophus',
      'parasaurolophus-lux',
      'iguanodon',
      'triceratops',
      'stegosaurus',
      'stegoceratops',
    ].includes(speciesId)
  ) {
    return `/assets/placeholders/${speciesId}.svg`;
  }
  return null;
}

export function getCodexAcquisition(species: DinosaurSpecies): {
  title: string;
  description: string;
} {
  const recipe = getSynthesisRecipe(species.id);
  if (recipe) return { title: 'DNA 합성', description: recipe.unlockDescription };
  if (getDinosaurOrigin(species) !== DinosaurOrigin.NATURAL) {
    return {
      title: 'DNA 연구',
      description:
        '필요한 원종을 보유하고 탐험 재료로 연구합니다. 상세 레시피는 아직 공개되지 않았어요.',
    };
  }
  const unlock = species.unlockCondition;
  if (unlock.type === 'story') {
    const chapter = String(unlock.value).match(/^chapter-(\d+)$/);
    const isStarter = species.id === STARTER_PARK.dinosaur.speciesId;
    const title = isStarter ? '시작 공룡' : '스토리 보상';
    const description = isStarter
      ? '파크를 처음 시작할 때 한 번 만나는 공룡이에요.'
      : `${chapter ? `챕터 ${chapter[1]}` : '스토리'} 진행 보상으로 만나거나 알을 부화해 얻을 수 있어요.`;
    return { title, description };
  }
  if (unlock.type === 'season' || unlock.type === 'event') {
    return {
      title: unlock.type === 'season' ? '시즌 보상' : '이벤트 보상',
      description: unlock.description,
    };
  }
  // 실제 자연종의 구버전 'DNA 조합' 보조 획득 경로를 미확정 합성 레시피로 만들지 않는다.
  if (unlock.type === 'dna')
    return {
      title: '탐험·알 부화',
      description: '탐험에서 얻는 희귀 알을 부화해 만나는 자연종이에요.',
    };
  return {
    title: '탐험·알 부화',
    description: `${unlock.description}. 탐험에서 알을 얻은 뒤 부화해 만날 수 있어요.`,
  };
}
