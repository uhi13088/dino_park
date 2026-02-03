/**
 * 건물 데이터
 * 참조: docs/dino_park_asset_buildings_characters.md
 * 총 50종: 서식지(8), 연구(6), 관람(6), 편의(12), 생산(6), 운영(6), 장식(6)
 */

import { BuildingType, BuildingCategory } from '@dino-park/shared';

// === 크기별 사이즈 ===
const SIZE = {
  XS: { width: 1, height: 1 },
  S: { width: 1, height: 1 },
  M: { width: 2, height: 2 },
  L: { width: 3, height: 3 },
  XL: { width: 4, height: 4 },
} as const;

// === 공룡 서식지 (8종) ===
const DINOSAUR_HABITATS: BuildingType[] = [
  {
    id: 'habitat-grassland',
    name: 'Grassland Habitat',
    nameKo: '초원 서식지',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 4,
      revenue: 0,
      maintenanceCost: 50,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 5000 },
    },
    description:
      '초식 공룡들이 서식할 수 있는 넓은 초원. 나무 울타리와 먹이통, 작은 연못이 있습니다.',
  },
  {
    id: 'habitat-forest',
    name: 'Forest Habitat',
    nameKo: '숲 서식지',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 4,
      revenue: 0,
      maintenanceCost: 60,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 5,
      cost: { gold: 8000 },
    },
    description: '울창한 나무가 있는 서식지. 그늘과 은신처를 선호하는 공룡에게 적합합니다.',
  },
  {
    id: 'habitat-carnivore',
    name: 'Carnivore Habitat',
    nameKo: '육식 서식지',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 3,
      revenue: 0,
      maintenanceCost: 100,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 10,
      cost: { gold: 15000 },
    },
    description: '강화된 철제 울타리로 둘러싸인 육식 공룡 전용 서식지. 경고 표지판이 있습니다.',
  },
  {
    id: 'habitat-pterosaur-dome',
    name: 'Pterosaur Dome',
    nameKo: '익룡 돔',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 5,
      revenue: 0,
      maintenanceCost: 150,
      space: 16,
    },
    size: SIZE.XL,
    unlockCondition: {
      parkLevel: 15,
      cost: { gold: 30000 },
    },
    description: '거대한 유리 돔 구조의 익룡 서식지. 높은 횃대와 비행 공간이 있습니다.',
  },
  {
    id: 'habitat-marine-aquarium',
    name: 'Marine Aquarium',
    nameKo: '해양관',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 4,
      revenue: 0,
      maintenanceCost: 200,
      space: 16,
    },
    size: SIZE.XL,
    unlockCondition: {
      parkLevel: 20,
      cost: { gold: 50000 },
    },
    description: '거대한 유리 수조가 있는 해양 생물 서식지. 수중 관람 구역이 포함됩니다.',
  },
  {
    id: 'habitat-desert',
    name: 'Desert Habitat',
    nameKo: '사막 서식지',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 4,
      revenue: 0,
      maintenanceCost: 70,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 8,
      cost: { gold: 10000 },
    },
    description: '선인장과 바위가 있는 건조한 사막 환경. 오아시스가 있습니다.',
  },
  {
    id: 'habitat-volcanic',
    name: 'Volcanic Habitat',
    nameKo: '화산 서식지',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 3,
      revenue: 0,
      maintenanceCost: 120,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 25,
      cost: { gold: 40000 },
    },
    description: '어두운 화산암과 용암 장식이 있는 특수 서식지. 내열성 울타리가 있습니다.',
  },
  {
    id: 'habitat-glacier',
    name: 'Glacier Habitat',
    nameKo: '빙하 서식지',
    category: BuildingCategory.DINOSAUR,
    maxLevel: 25,
    baseStats: {
      capacity: 4,
      revenue: 0,
      maintenanceCost: 100,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 22,
      cost: { gold: 35000 },
    },
    description: '눈과 얼음이 있는 극지방 환경. 온열 쉘터가 포함됩니다.',
  },
];

// === 연구 시설 (6종) ===
const RESEARCH_FACILITIES: BuildingType[] = [
  {
    id: 'research-hatchery',
    name: 'Hatchery',
    nameKo: '부화장',
    category: BuildingCategory.RESEARCH,
    maxLevel: 25,
    baseStats: {
      capacity: 3,
      revenue: 0,
      maintenanceCost: 30,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 3000 },
    },
    description: '공룡 알을 부화시키는 시설. 유리 패널이 있는 돔 구조로 내부가 보입니다.',
  },
  {
    id: 'research-dna-lab',
    name: 'DNA Lab',
    nameKo: 'DNA 연구소',
    category: BuildingCategory.RESEARCH,
    maxLevel: 25,
    baseStats: {
      capacity: 1,
      revenue: 0,
      maintenanceCost: 50,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 3,
      cost: { gold: 8000 },
    },
    description: 'DNA 조합과 유전자 연구를 수행하는 현대적인 연구소. DNA 나선 로고가 있습니다.',
  },
  {
    id: 'research-fossil-lab',
    name: 'Fossil Lab',
    nameKo: '화석 연구소',
    category: BuildingCategory.RESEARCH,
    maxLevel: 25,
    baseStats: {
      capacity: 1,
      revenue: 0,
      maintenanceCost: 40,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 5,
      cost: { gold: 10000 },
    },
    description: '화석을 분석하고 복원하는 연구소. 발굴 도구와 화석 전시가 있습니다.',
  },
  {
    id: 'research-genetics-center',
    name: 'Genetics Center',
    nameKo: '유전자 센터',
    category: BuildingCategory.RESEARCH,
    maxLevel: 25,
    baseStats: {
      capacity: 2,
      revenue: 0,
      maintenanceCost: 80,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 15,
      cost: { gold: 25000 },
    },
    description: '고급 유전자 연구를 수행하는 대형 시설. 여러 연구 섹션이 있습니다.',
  },
  {
    id: 'research-evolution-lab',
    name: 'Evolution Lab',
    nameKo: '진화 연구소',
    category: BuildingCategory.RESEARCH,
    maxLevel: 25,
    baseStats: {
      capacity: 1,
      revenue: 0,
      maintenanceCost: 70,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 20,
      cost: { gold: 30000 },
    },
    description: '진화 연구 전문 시설. 진화 차트와 표본 보관소가 있습니다.',
  },
  {
    id: 'research-behavior-lab',
    name: 'Behavior Lab',
    nameKo: '행동 연구소',
    category: BuildingCategory.RESEARCH,
    maxLevel: 25,
    baseStats: {
      capacity: 1,
      revenue: 0,
      maintenanceCost: 45,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 10,
      cost: { gold: 15000 },
    },
    description: '공룡 행동을 관찰하고 연구하는 시설. 일방향 유리창과 모니터링 장비가 있습니다.',
  },
];

// === 관람 시설 (6종) ===
const VISITOR_FACILITIES: BuildingType[] = [
  {
    id: 'visitor-viewing-platform',
    name: 'Viewing Platform',
    nameKo: '관람대',
    category: BuildingCategory.VISITOR,
    maxLevel: 10,
    baseStats: {
      capacity: 20,
      revenue: 100,
      maintenanceCost: 20,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 2,
      cost: { gold: 2000 },
    },
    description: '높은 곳에서 서식지를 관람할 수 있는 나무 플랫폼. 안전 난간과 망원경이 있습니다.',
  },
  {
    id: 'visitor-tour-train',
    name: 'Tour Train',
    nameKo: '관람 열차',
    category: BuildingCategory.VISITOR,
    maxLevel: 15,
    baseStats: {
      capacity: 40,
      revenue: 300,
      maintenanceCost: 60,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 8,
      cost: { gold: 20000 },
    },
    description: '공원을 돌아다니는 귀여운 열차. 역사 건물과 레일이 포함됩니다.',
  },
  {
    id: 'visitor-safari-jeep',
    name: 'Safari Jeep Station',
    nameKo: '사파리 지프',
    category: BuildingCategory.VISITOR,
    maxLevel: 10,
    baseStats: {
      capacity: 12,
      revenue: 200,
      maintenanceCost: 40,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 12,
      cost: { gold: 15000 },
    },
    description: '서식지를 직접 탐험할 수 있는 지프 스테이션. 모험 장비가 있습니다.',
  },
  {
    id: 'visitor-underwater-tunnel',
    name: 'Underwater Tunnel',
    nameKo: '수중 터널',
    category: BuildingCategory.VISITOR,
    maxLevel: 15,
    baseStats: {
      capacity: 50,
      revenue: 500,
      maintenanceCost: 100,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 22,
      cost: { gold: 45000 },
    },
    description: '해양관을 통과하는 유리 터널. 물고기가 주변에서 헤엄칩니다.',
  },
  {
    id: 'visitor-skywalk',
    name: 'Skywalk',
    nameKo: '스카이워크',
    category: BuildingCategory.VISITOR,
    maxLevel: 10,
    baseStats: {
      capacity: 30,
      revenue: 250,
      maintenanceCost: 50,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 18,
      cost: { gold: 35000 },
    },
    description: '나무 위 높이에서 파크를 관람하는 유리 산책로. 파노라마 뷰가 있습니다.',
  },
  {
    id: 'visitor-photo-zone',
    name: 'Photo Zone',
    nameKo: '포토존',
    category: BuildingCategory.VISITOR,
    maxLevel: 5,
    baseStats: {
      capacity: 10,
      revenue: 50,
      maintenanceCost: 15,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 3,
      cost: { gold: 3000 },
    },
    description: '기념 사진을 찍을 수 있는 장식 구역. 공룡 조형물이 있습니다.',
  },
];

// === 편의 시설 (12종) ===
const AMENITY_FACILITIES: BuildingType[] = [
  {
    id: 'amenity-food-court',
    name: 'Food Court',
    nameKo: '푸드코트',
    category: BuildingCategory.AMENITY,
    maxLevel: 15,
    baseStats: {
      capacity: 50,
      revenue: 400,
      maintenanceCost: 80,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 2,
      cost: { gold: 5000 },
    },
    description: '파라솔 테이블과 음식 부스가 있는 야외 식당. 공룡 테마 장식이 있습니다.',
  },
  {
    id: 'amenity-gift-shop',
    name: 'Gift Shop',
    nameKo: '기념품샵',
    category: BuildingCategory.AMENITY,
    maxLevel: 10,
    baseStats: {
      capacity: 15,
      revenue: 300,
      maintenanceCost: 30,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 3000 },
    },
    description: '인형과 기념품을 판매하는 작은 상점. 공룡 로고 간판이 있습니다.',
  },
  {
    id: 'amenity-restroom',
    name: 'Restroom',
    nameKo: '화장실',
    category: BuildingCategory.AMENITY,
    maxLevel: 5,
    baseStats: {
      capacity: 10,
      revenue: 0,
      maintenanceCost: 20,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 1500 },
    },
    description: '깨끗한 현대식 화장실. 남녀 구분 표시가 있습니다.',
  },
  {
    id: 'amenity-drinking-fountain',
    name: 'Drinking Fountain',
    nameKo: '음수대',
    category: BuildingCategory.AMENITY,
    maxLevel: 3,
    baseStats: {
      capacity: 5,
      revenue: 0,
      maintenanceCost: 5,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 500 },
    },
    description: '공룡 모양의 물 분수대. 돌 받침대가 있습니다.',
  },
  {
    id: 'amenity-bench',
    name: 'Bench',
    nameKo: '벤치',
    category: BuildingCategory.AMENITY,
    maxLevel: 3,
    baseStats: {
      capacity: 3,
      revenue: 0,
      maintenanceCost: 3,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 300 },
    },
    description: '공룡 발자국 장식이 있는 나무 벤치. 편안한 휴식 공간입니다.',
  },
  {
    id: 'amenity-dino-cafe',
    name: 'Dino Cafe',
    nameKo: '디노 카페',
    category: BuildingCategory.AMENITY,
    maxLevel: 15,
    baseStats: {
      capacity: 30,
      revenue: 350,
      maintenanceCost: 60,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 5,
      cost: { gold: 8000 },
    },
    description: '야외 좌석이 있는 아늑한 카페. 공룡 테마 컵 로고가 있습니다.',
  },
  {
    id: 'amenity-ice-cream-shop',
    name: 'Ice Cream Shop',
    nameKo: '아이스크림샵',
    category: BuildingCategory.AMENITY,
    maxLevel: 10,
    baseStats: {
      capacity: 15,
      revenue: 200,
      maintenanceCost: 25,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 3,
      cost: { gold: 4000 },
    },
    description: '아이스크림 콘 간판이 있는 귀여운 상점. 분홍색과 흰색 컬러입니다.',
  },
  {
    id: 'amenity-dino-restaurant',
    name: 'Dino Restaurant',
    nameKo: '디노 레스토랑',
    category: BuildingCategory.AMENITY,
    maxLevel: 20,
    baseStats: {
      capacity: 60,
      revenue: 600,
      maintenanceCost: 120,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 15,
      cost: { gold: 25000 },
    },
    description: '공룡 골격 장식이 있는 고급 레스토랑. 따뜻한 조명이 있습니다.',
  },
  {
    id: 'amenity-first-aid',
    name: 'First Aid Station',
    nameKo: '구급소',
    category: BuildingCategory.AMENITY,
    maxLevel: 10,
    baseStats: {
      capacity: 10,
      revenue: 0,
      maintenanceCost: 40,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 5,
      cost: { gold: 5000 },
    },
    description: '적십자 표시가 있는 의료 시설. 응급 장비가 있습니다.',
  },
  {
    id: 'amenity-info-center',
    name: 'Information Center',
    nameKo: '정보센터',
    category: BuildingCategory.AMENITY,
    maxLevel: 10,
    baseStats: {
      capacity: 20,
      revenue: 0,
      maintenanceCost: 30,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 2,
      cost: { gold: 4000 },
    },
    description: '큰 안내 표지판과 지도가 있는 방문객 서비스 건물입니다.',
  },
  {
    id: 'amenity-locker',
    name: 'Locker Storage',
    nameKo: '물품보관소',
    category: BuildingCategory.AMENITY,
    maxLevel: 5,
    baseStats: {
      capacity: 30,
      revenue: 50,
      maintenanceCost: 15,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 4,
      cost: { gold: 2500 },
    },
    description: '번호가 매겨진 보관함이 있는 시설. 안전한 보관 공간입니다.',
  },
  {
    id: 'amenity-atm',
    name: 'ATM',
    nameKo: 'ATM',
    category: BuildingCategory.AMENITY,
    maxLevel: 3,
    baseStats: {
      capacity: 3,
      revenue: 20,
      maintenanceCost: 10,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 3,
      cost: { gold: 2000 },
    },
    description: '화면과 카드 슬롯이 있는 ATM 키오스크입니다.',
  },
];

// === 생산 시설 (6종) ===
const PRODUCTION_FACILITIES: BuildingType[] = [
  {
    id: 'production-feed-factory',
    name: 'Feed Factory',
    nameKo: '사료 공장',
    category: BuildingCategory.PRODUCTION,
    maxLevel: 20,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 100,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 5,
      cost: { gold: 15000 },
    },
    description: '사일로와 컨베이어가 있는 사료 생산 시설입니다.',
  },
  {
    id: 'production-meat-storage',
    name: 'Meat Storage',
    nameKo: '육류 저장소',
    category: BuildingCategory.PRODUCTION,
    maxLevel: 20,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 80,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 12,
      cost: { gold: 20000 },
    },
    description: '냉장 장치가 있는 육류 보관 시설. 철제 구조입니다.',
  },
  {
    id: 'production-fish-farm',
    name: 'Fish Farm',
    nameKo: '어류 양식장',
    category: BuildingCategory.PRODUCTION,
    maxLevel: 20,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 70,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 18,
      cost: { gold: 25000 },
    },
    description: '어류 탱크와 여과 시스템이 있는 양식 시설입니다.',
  },
  {
    id: 'production-power-plant',
    name: 'Power Plant',
    nameKo: '발전소',
    category: BuildingCategory.PRODUCTION,
    maxLevel: 25,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 150,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 10,
      cost: { gold: 30000 },
    },
    description: '전력선과 발전기가 있는 전기 시설. 노란색 경고 표시가 있습니다.',
  },
  {
    id: 'production-water-reservoir',
    name: 'Water Reservoir',
    nameKo: '저수지',
    category: BuildingCategory.PRODUCTION,
    maxLevel: 20,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 60,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 8,
      cost: { gold: 18000 },
    },
    description: '대형 물탱크와 펌프장, 배관 네트워크가 있는 시설입니다.',
  },
  {
    id: 'production-warehouse',
    name: 'Warehouse',
    nameKo: '창고',
    category: BuildingCategory.PRODUCTION,
    maxLevel: 15,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 50,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 6,
      cost: { gold: 12000 },
    },
    description: '적재대와 상자가 있는 대형 저장 건물입니다.',
  },
];

// === 운영 시설 (6종) ===
const OPERATION_FACILITIES: BuildingType[] = [
  {
    id: 'operation-admin-office',
    name: 'Admin Office',
    nameKo: '관리사무소',
    category: BuildingCategory.OPERATION,
    maxLevel: 15,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 40,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 3,
      cost: { gold: 8000 },
    },
    description: '전문적인 디자인의 사무실 건물. STAFF 표지판이 있습니다.',
  },
  {
    id: 'operation-security-center',
    name: 'Security Center',
    nameKo: '보안센터',
    category: BuildingCategory.OPERATION,
    maxLevel: 20,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 80,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 8,
      cost: { gold: 20000 },
    },
    description: '보안 카메라와 경비실이 있는 모니터링 시설. 경고등이 있습니다.',
  },
  {
    id: 'operation-vet-hospital',
    name: 'Veterinary Hospital',
    nameKo: '동물병원',
    category: BuildingCategory.OPERATION,
    maxLevel: 25,
    baseStats: {
      capacity: 5,
      revenue: 0,
      maintenanceCost: 100,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 5,
      cost: { gold: 15000 },
    },
    description: '공룡용 대형 입구와 의료 장비가 있는 의료 시설입니다.',
  },
  {
    id: 'operation-staff-quarters',
    name: 'Staff Quarters',
    nameKo: '직원 숙소',
    category: BuildingCategory.OPERATION,
    maxLevel: 15,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 50,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 10,
      cost: { gold: 18000 },
    },
    description: '여러 방이 있는 기숙사 건물. 편안한 외관입니다.',
  },
  {
    id: 'operation-entrance-gate',
    name: 'Entrance Gate',
    nameKo: '입구 게이트',
    category: BuildingCategory.OPERATION,
    maxLevel: 10,
    baseStats: {
      capacity: 100,
      revenue: 0,
      maintenanceCost: 30,
      space: 16,
    },
    size: SIZE.XL,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 10000 },
    },
    description: 'DINO PARK 문구가 있는 대형 석조 아치. 나무 문과 공룡 해골 장식이 있습니다.',
  },
  {
    id: 'operation-parking-lot',
    name: 'Parking Lot',
    nameKo: '주차장',
    category: BuildingCategory.OPERATION,
    maxLevel: 10,
    baseStats: {
      capacity: 100,
      revenue: 100,
      maintenanceCost: 40,
      space: 9,
    },
    size: SIZE.L,
    unlockCondition: {
      parkLevel: 2,
      cost: { gold: 8000 },
    },
    description: '주차 구역과 입구 부스가 있는 포장 주차장입니다.',
  },
];

// === 장식물 (6종) ===
const DECORATIONS: BuildingType[] = [
  {
    id: 'decoration-dino-statue',
    name: 'Dinosaur Statue',
    nameKo: '공룡 동상',
    category: BuildingCategory.DECORATION,
    maxLevel: 5,
    baseStats: {
      capacity: 0,
      revenue: 50,
      maintenanceCost: 10,
      space: 1,
    },
    size: SIZE.S,
    unlockCondition: {
      parkLevel: 3,
      cost: { gold: 5000 },
    },
    description: '청동 또는 석재 공룡 조각품. 장식 받침대 위에 있습니다.',
  },
  {
    id: 'decoration-fountain',
    name: 'Fountain',
    nameKo: '분수대',
    category: BuildingCategory.DECORATION,
    maxLevel: 10,
    baseStats: {
      capacity: 0,
      revenue: 100,
      maintenanceCost: 20,
      space: 4,
    },
    size: SIZE.M,
    unlockCondition: {
      parkLevel: 8,
      cost: { gold: 15000 },
    },
    description: '공룡 또는 선사시대 테마의 장식용 분수. 물 분사와 원형 풀이 있습니다.',
  },
  {
    id: 'decoration-flower-bed',
    name: 'Flower Bed',
    nameKo: '화단',
    category: BuildingCategory.DECORATION,
    maxLevel: 3,
    baseStats: {
      capacity: 0,
      revenue: 20,
      maintenanceCost: 5,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 500 },
    },
    description: '선사시대 양치류와 다채로운 꽃이 있는 화단. 돌 테두리가 있습니다.',
  },
  {
    id: 'decoration-street-lamp',
    name: 'Street Lamp',
    nameKo: '가로등',
    category: BuildingCategory.DECORATION,
    maxLevel: 3,
    baseStats: {
      capacity: 0,
      revenue: 10,
      maintenanceCost: 3,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 300 },
    },
    description: '공룡 테마 디자인의 장식용 가로등. 따뜻한 빛이 납니다.',
  },
  {
    id: 'decoration-fence',
    name: 'Fence',
    nameKo: '울타리',
    category: BuildingCategory.DECORATION,
    maxLevel: 3,
    baseStats: {
      capacity: 0,
      revenue: 5,
      maintenanceCost: 2,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 200 },
    },
    description: '나무 또는 돌 재질의 장식용 울타리. 경로 경계용입니다.',
  },
  {
    id: 'decoration-path',
    name: 'Path',
    nameKo: '길',
    category: BuildingCategory.DECORATION,
    maxLevel: 5,
    baseStats: {
      capacity: 0,
      revenue: 0,
      maintenanceCost: 1,
      space: 1,
    },
    size: SIZE.XS,
    unlockCondition: {
      parkLevel: 1,
      cost: { gold: 100 },
    },
    description: '돌 또는 나무 산책로 타일. 자연스러운 통합 디자인입니다.',
  },
];

// === 전체 건물 데이터 ===
export const BUILDING_DATA: BuildingType[] = [
  ...DINOSAUR_HABITATS,
  ...RESEARCH_FACILITIES,
  ...VISITOR_FACILITIES,
  ...AMENITY_FACILITIES,
  ...PRODUCTION_FACILITIES,
  ...OPERATION_FACILITIES,
  ...DECORATIONS,
];

// === 헬퍼 함수 ===
export function getBuildingById(id: string): BuildingType | undefined {
  return BUILDING_DATA.find((b) => b.id === id);
}

export function getBuildingsByCategory(category: BuildingCategory): BuildingType[] {
  return BUILDING_DATA.filter((b) => b.category === category);
}

export function getBuildingsUnlockedAtLevel(parkLevel: number): BuildingType[] {
  return BUILDING_DATA.filter((b) => b.unlockCondition.parkLevel <= parkLevel);
}

// === 통계 ===
export const BUILDING_STATS = {
  total: BUILDING_DATA.length,
  byCategory: {
    [BuildingCategory.DINOSAUR]: DINOSAUR_HABITATS.length,
    [BuildingCategory.RESEARCH]: RESEARCH_FACILITIES.length,
    [BuildingCategory.VISITOR]: VISITOR_FACILITIES.length,
    [BuildingCategory.AMENITY]: AMENITY_FACILITIES.length,
    [BuildingCategory.PRODUCTION]: PRODUCTION_FACILITIES.length,
    [BuildingCategory.OPERATION]: OPERATION_FACILITIES.length,
    [BuildingCategory.DECORATION]: DECORATIONS.length,
  },
};
