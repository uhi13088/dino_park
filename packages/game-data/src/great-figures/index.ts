/**
 * 위인 데이터
 * 참조: docs/dino_park_great_figures.md
 * 총 50명: 과학자(10), 건축가(7), 사업가(7), 탐험가(6), 조련사(7), 수의사(5), 보안(4), 특수(4)
 */

import {
  GreatFigureType,
  GreatFigureJob,
  Rarity,
} from '@dino-park/shared';

// === 영입 비용 ===
const RECRUIT_COST = {
  [Rarity.COMMON]: 300,     // 노멀
  [Rarity.UNCOMMON]: 500,   // 언커먼 (마르코 등 특수 케이스)
  [Rarity.RARE]: 800,       // 레어
  [Rarity.EPIC]: 2000,      // 에픽
  [Rarity.LEGENDARY]: 5000, // 레전더리
} as const;

// === 과학자 (10명) ===
const SCIENTISTS: GreatFigureType[] = [
  {
    id: 'gf-001',
    name: 'Dr. Jin',
    nameKo: '닥터 진',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: 'DNA 조합 시간 -10%', bonus: '' },
      { level: 5, passive: 'DNA 조합 시간 -25%', bonus: '성공률 +8%' },
      { level: 10, passive: 'DNA 조합 시간 -50%', bonus: '성공률 +20%, 인도미누스 해금' },
    ],
    synergies: [
      { partnerId: 'gf-004', name: '스승과 제자', effect: '미아와 함께 배치 시', bonus: { dnaYield: 0.25 } },
      { partnerId: 'gf-010', name: '천재들의 경쟁', effect: '헨리와 함께 배치 시', bonus: { hybridSuccess: 0.15 } },
    ],
    unlockCondition: { type: 'tutorial', value: 'complete', description: '튜토리얼 완료 시 자동 획득' },
    recruitCost: 0,
    description: '30대 남성, 안경, 흰 연구복, DNA 모형. 열정적이며 미친 과학자 기질을 가진 유전공학 천재.',
    quote: '불가능? 그건 아직 시도 안 한 거야!',
  },
  {
    id: 'gf-002',
    name: 'Dr. Helen Park',
    nameKo: '헬렌 박사',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '화석 분석 +20%', bonus: '' },
      { level: 5, passive: '화석 분석 +50%', bonus: '희귀 화석 +15%' },
      { level: 10, passive: '화석 분석 +100%', bonus: '희귀 화석 +35%, 복원실 해금' },
    ],
    synergies: [
      { partnerId: 'gf-008', name: '고생물학의 거장들', effect: '앨런과 함께 배치 시', bonus: { fossilAnalysis: 0.30 } },
    ],
    unlockCondition: { type: 'story', value: 'chapter-3', description: '챕터 3 클리어' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 여성, 탐험복, 화석 브러시. 침착하고 학구적이며 모성애가 있는 고생물학자.',
    quote: '7천만 년의 역사가 우리를 기다려요.',
  },
  {
    id: 'gf-003',
    name: 'Thomas Wright',
    nameKo: '토마스',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '부화 시간 -15%', bonus: '' },
      { level: 5, passive: '부화 시간 -35%', bonus: '등급 상향 +10%' },
      { level: 10, passive: '부화 시간 -60%', bonus: '등급 상향 +30%, 쌍둥이 10%' },
    ],
    synergies: [
      { partnerId: 'gf-001', name: '라이벌 의식', effect: '닥터 진과 함께 배치 시', bonus: { hatchSpeed: 0.20 } },
    ],
    unlockCondition: { type: 'level', value: 'dna-lab-15', description: 'DNA 연구소 Lv.15' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '50대 남성, 흰머리, 정장+연구복. 완벽주의자이며 윤리적인 닥터 진의 라이벌 생물공학 박사.',
    quote: '자연을 거스르는 건 대가가 따라.',
  },
  {
    id: 'gf-004',
    name: 'Mia Chen',
    nameKo: '미아',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: 'DNA 획득량 +10%', bonus: '' },
      { level: 5, passive: 'DNA 획득량 +25%', bonus: '탐험 DNA +12%' },
      { level: 10, passive: 'DNA 획득량 +40%', bonus: '탐험 DNA +25%, DNA 복제' },
    ],
    synergies: [
      { partnerId: 'gf-001', name: '스승과 제자', effect: '닥터 진과 함께 배치 시', bonus: { dnaYield: 0.25 } },
    ],
    unlockCondition: { type: 'achievement', value: 'first-dna-combine', description: '첫 DNA 조합' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '20대 여성, 트윈테일, 캐주얼 실험복. 밝고 호기심 많은 닥터 진의 제자, 유전학 신동.',
    quote: '우와! 이거 진짜 대박이에요!',
  },
  {
    id: 'gf-005',
    name: 'Prof. Ian Malcolm',
    nameKo: '이안 교수',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '사고 예방 +20%', bonus: '' },
      { level: 5, passive: '사고 예방 +45%', bonus: '탈출 피해 -35%' },
      { level: 10, passive: '사고 예방 +70%', bonus: '탈출 피해 -70%, 카오스 컨트롤' },
    ],
    synergies: [
      { partnerId: 'gf-008', name: '쥬라기의 생존자들', effect: '앨런과 함께 배치 시', bonus: { accidentPrevention: 0.25 } },
      { partnerId: 'gf-009', name: '쥬라기의 생존자들', effect: '엘리와 함께 배치 시', bonus: { accidentPrevention: 0.25 } },
    ],
    unlockCondition: { type: 'collection', value: 'dinosaur-30', description: '공룡 30종 수집' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '40대 남성, 올블랙, 선글라스, 지팡이. 냉소적이지만 현명한 예언자, 카오스 이론 수학자.',
    quote: '생명은... 길을 찾아.',
  },
  {
    id: 'gf-006',
    name: 'Sarah Harding',
    nameKo: '사라',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '공룡 행동 분석 +15%', bonus: '' },
      { level: 5, passive: '공룡 행동 분석 +35%', bonus: '스트레스 감소 +20%' },
      { level: 10, passive: '공룡 행동 분석 +60%', bonus: '스트레스 감소 +40%, 행동 예측' },
    ],
    synergies: [
      { partnerId: 'gf-005', name: '현장 연구팀', effect: '이안과 함께 배치 시', bonus: { behaviorAnalysis: 0.20 } },
    ],
    unlockCondition: { type: 'collection', value: 'dinosaur-20', description: '공룡 20종 수집' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 여성, 야외복, 카메라. 대담하고 열정적인 동물 보호 행동생태학자.',
    quote: '공룡도 감정이 있어요. 존중해야 해요.',
  },
  {
    id: 'gf-007',
    name: 'Lewis Dodgson',
    nameKo: '루이스',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '연구 비용 -10%', bonus: '' },
      { level: 5, passive: '연구 비용 -25%', bonus: '연구 속도 +15%' },
      { level: 10, passive: '연구 비용 -40%', bonus: '연구 속도 +30%, 비밀 프로젝트' },
    ],
    synergies: [],
    unlockCondition: { type: 'story', value: 'chapter-6-redemption', description: '챕터 6 클리어 + 루이스 개심 루트 선택' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '50대 남성, 고급 정장, 서류가방. 야심가이자 실용주의자. 적대에서 조건부 동료로 전환 가능.',
    quote: '결과만 좋으면 되는 거 아닌가?',
  },
  {
    id: 'gf-008',
    name: 'Alan Grant',
    nameKo: '앨런',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '모든 연구 효율 +10%', bonus: '' },
      { level: 5, passive: '모든 연구 효율 +25%', bonus: '공룡 지식 보너스 +15%' },
      { level: 10, passive: '모든 연구 효율 +45%', bonus: '공룡 지식 보너스 +35%, 전설 발굴' },
    ],
    synergies: [
      { partnerId: 'gf-009', name: '발굴의 파트너', effect: '엘리와 함께 배치 시', bonus: { researchEfficiency: 0.25 } },
      { partnerId: 'gf-002', name: '고생물학의 거장들', effect: '헬렌과 함께 배치 시', bonus: { fossilAnalysis: 0.30 } },
    ],
    unlockCondition: { type: 'story', value: 'chapter-5', description: '챕터 5 클리어' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '50대 남성, 모자, 야외복, 발굴 도구. 진지하고 아이들에게 친절한 전설의 고생물학자.',
    quote: '공룡은 조류의 조상이야. 존중해야 해.',
  },
  {
    id: 'gf-009',
    name: 'Ellie Sattler',
    nameKo: '엘리',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '식물 성장 +15%', bonus: '' },
      { level: 5, passive: '식물 성장 +35%', bonus: '초식 먹이 비용 -15%' },
      { level: 10, passive: '식물 성장 +60%', bonus: '초식 먹이 비용 -30%, 특수 식물' },
    ],
    synergies: [
      { partnerId: 'gf-008', name: '발굴의 파트너', effect: '앨런과 함께 배치 시', bonus: { researchEfficiency: 0.25 } },
    ],
    unlockCondition: { type: 'building', value: 'botanical-garden', description: '식물원 건설' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 여성, 실용적 복장, 식물 도감. 용감하고 실용적인 문제 해결사, 고식물학자.',
    quote: '식물이 건강해야 공룡도 건강해요.',
  },
  {
    id: 'gf-010',
    name: 'Henry Wu',
    nameKo: '헨리',
    job: GreatFigureJob.SCIENTIST,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '하이브리드 성공률 +15%', bonus: '' },
      { level: 5, passive: '하이브리드 성공률 +35%', bonus: '하이브리드 능력 +20%' },
      { level: 10, passive: '하이브리드 성공률 +60%', bonus: '하이브리드 능력 +40%, 비밀 레시피' },
    ],
    synergies: [
      { partnerId: 'gf-001', name: '천재들의 경쟁', effect: '닥터 진과 함께 배치 시', bonus: { hybridSuccess: 0.15 } },
    ],
    unlockCondition: { type: 'achievement', value: 'hybrid-3', description: '하이브리드 3종 제작' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '50대 아시아계 남성, 깔끔한 연구복. 천재적이고 야심가인 수석 유전공학자.',
    quote: '우리는 신이 아니야. 하지만 창조할 수 있어.',
  },
];

// === 건축가 & 엔지니어 (7명) ===
const ARCHITECTS: GreatFigureType[] = [
  {
    id: 'gf-011',
    name: 'Marco Rossi',
    nameKo: '마르코',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '건설 시간 -10%', bonus: '' },
      { level: 5, passive: '건설 시간 -28%', bonus: '건설 비용 -12%' },
      { level: 10, passive: '건설 시간 -50%', bonus: '건설 비용 -25%, 마스터피스' },
    ],
    synergies: [
      { partnerId: 'gf-012', name: '완벽한 설계', effect: '레이첼과 함께 배치 시', bonus: { buildSpeed: 0.15 } },
    ],
    unlockCondition: { type: 'tutorial', value: 'complete', description: '튜토리얼' },
    recruitCost: 500,
    description: '40대 이탈리아 남성, 콧수염, 안전모, 청사진. 장인정신과 완벽주의를 가진 천재 건축가.',
    quote: '건물은 영혼을 담는 그릇이야!',
  },
  {
    id: 'gf-012',
    name: 'Rachel Kim',
    nameKo: '레이첼',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '건물 내구도 +15%', bonus: '' },
      { level: 5, passive: '건물 내구도 +35%', bonus: '유지비 -12%' },
      { level: 10, passive: '건물 내구도 +60%', bonus: '유지비 -25%, 자동 수리' },
    ],
    synergies: [
      { partnerId: 'gf-011', name: '완벽한 설계', effect: '마르코와 함께 배치 시', bonus: { buildSpeed: 0.15 } },
    ],
    unlockCondition: { type: 'level', value: 'building-10', description: '첫 건물 Lv.10' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 한국계 여성, 헬멧, 태블릿. 실용적이고 효율 중시, 데이터 기반 구조공학 전문가.',
    quote: '데이터로 증명할게요.',
  },
  {
    id: 'gf-013',
    name: 'Victor Schmidt',
    nameKo: '빅터',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '전기 효율 +15%', bonus: '' },
      { level: 5, passive: '전기 효율 +40%', bonus: '정전 확률 -50%' },
      { level: 10, passive: '전기 효율 +70%', bonus: '정전 확률 -90%, 비상 발전기' },
    ],
    synergies: [],
    unlockCondition: { type: 'story', value: 'chapter-4', description: '챕터 4 (전력 위기)' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '50대 독일 남성, 대머리, 두꺼운 안경. 과묵하고 신뢰감 있는 위기 대응 전문 전력 시스템 엔지니어.',
    quote: '전력이 끊기면 모든 게 끝이야.',
  },
  {
    id: 'gf-014',
    name: 'Javier Santos',
    nameKo: '하비에르',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '장식 효과 +20%', bonus: '' },
      { level: 5, passive: '장식 효과 +45%', bonus: '장식 비용 -15%' },
      { level: 10, passive: '장식 효과 +80%', bonus: '장식 비용 -30%, 특수 장식' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'decoration-10', description: '장식 10개 배치' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 멕시코계 남성, 정원사 복장. 예술적이고 자연을 사랑하는 조경 건축가.',
    quote: '자연과 건축의 조화가 중요해!',
  },
  {
    id: 'gf-015',
    name: 'Naomi Tanaka',
    nameKo: '나오미',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '해양 시설 효율 +15%', bonus: '' },
      { level: 5, passive: '해양 시설 효율 +35%', bonus: '해양 공룡 만족도 +15%' },
      { level: 10, passive: '해양 시설 효율 +60%', bonus: '해양 공룡 만족도 +35%, 심해 수조' },
    ],
    synergies: [
      { partnerId: 'gf-034', name: '바다의 전문가들', effect: '메이와 함께 배치 시', bonus: { marineEfficiency: 0.25 } },
    ],
    unlockCondition: { type: 'building', value: 'aquarium', description: '해양관 건설' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 일본 여성, 전문가 복장. 꼼꼼한 해양 생물 전문가, 수족관 설계사.',
    quote: '바다 생물에겐 완벽한 환경이 필요해요.',
  },
  {
    id: 'gf-016',
    name: 'Omar Hassan',
    nameKo: '오마르',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '익룡 시설 효율 +15%', bonus: '' },
      { level: 5, passive: '익룡 시설 효율 +35%', bonus: '익룡 탈출 -20%' },
      { level: 10, passive: '익룡 시설 효율 +60%', bonus: '익룡 탈출 -50%, 하늘 돔 확장' },
    ],
    synergies: [
      { partnerId: 'gf-035', name: '하늘의 마스터', effect: '제이크와 함께 배치 시', bonus: { pterosaurEfficiency: 0.20 } },
    ],
    unlockCondition: { type: 'building', value: 'aviary', description: '조류관 건설' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 중동계 남성, 건축가 복장. 혁신적이고 도전적인 돔 건축 전문가.',
    quote: '하늘을 담는 건축을 해보자고!',
  },
  {
    id: 'gf-017',
    name: 'Ted Morrison',
    nameKo: '테드',
    job: GreatFigureJob.ARCHITECT,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '자원 운반 속도 +15%', bonus: '' },
      { level: 5, passive: '자원 운반 속도 +35%', bonus: '건설 자원 -10%' },
      { level: 10, passive: '자원 운반 속도 +60%', bonus: '건설 자원 -25%, 동시 건설 +1' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'building-20', description: '건물 20개 건설' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '50대 미국 남성, 작업복, 헬멧. 투박하지만 성실하게 묵묵히 일하는 중장비 기사.',
    quote: '말보다 행동이지!',
  },
];

// === 사업가 & 경영인 (7명) ===
const MANAGERS: GreatFigureType[] = [
  {
    id: 'gf-018',
    name: 'Alex Chandler',
    nameKo: '알렉스',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '입장료 수익 +10%', bonus: '' },
      { level: 5, passive: '입장료 수익 +28%', bonus: '광고 수익 +15%' },
      { level: 10, passive: '입장료 수익 +50%', bonus: '광고 수익 +35%, VIP 시스템' },
    ],
    synergies: [
      { partnerId: 'gf-022', name: '퍼펙트 마케팅', effect: '에밀리와 함께 배치 시', bonus: { revenue: 0.20 } },
    ],
    unlockCondition: { type: 'revenue', value: 'total-1m', description: '총 수익 100만 골드' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 남성, 세련된 정장, 스마트폰. 야심가이며 숫자에 민감한 쇼맨, 마케팅 천재.',
    quote: '돈이 되는 건 다 좋아!',
  },
  {
    id: 'gf-019',
    name: 'Sophia Green',
    nameKo: '소피아',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '공룡 만족도 +10%', bonus: '' },
      { level: 5, passive: '공룡 만족도 +30%', bonus: '유지비 -12%' },
      { level: 10, passive: '공룡 만족도 +55%', bonus: '유지비 -25%, 행복한 파크' },
    ],
    synergies: [],
    unlockCondition: { type: 'collection', value: 'dinosaur-50', description: '공룡 50종 수집' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '40대 여성, 친환경 의상. 이상주의적이고 지속 가능성을 중시하는 환경 경영 컨설턴트.',
    quote: '공룡이 행복해야 우리도 행복해요.',
  },
  {
    id: 'gf-020',
    name: 'Jackie Lopez',
    nameKo: '재키',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '이벤트 수익 +15%', bonus: '' },
      { level: 5, passive: '이벤트 수익 +40%', bonus: '이벤트 쿨다운 -25%' },
      { level: 10, passive: '이벤트 수익 +70%', bonus: '이벤트 쿨다운 -50%, 스페셜 이벤트' },
    ],
    synergies: [
      { partnerId: 'gf-037', name: '쇼 비즈니스', effect: '맥스와 함께 배치 시', bonus: { eventRevenue: 0.25 } },
    ],
    unlockCondition: { type: 'achievement', value: 'first-show', description: '첫 공룡 쇼' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '20대 라틴계 여성, 화려한 의상. 파티 피플, 창의적이고 에너지 넘치는 이벤트 플래너.',
    quote: '파티 시간이야!',
  },
  {
    id: 'gf-021',
    name: 'David Park',
    nameKo: '데이비드',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '지출 -8%', bonus: '' },
      { level: 5, passive: '지출 -18%', bonus: '세금 감면 +10%' },
      { level: 10, passive: '지출 -30%', bonus: '세금 감면 +25%, 재정 최적화' },
    ],
    synergies: [],
    unlockCondition: { type: 'revenue', value: 'daily-50k', description: '일일 수익 5만 달성' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 한국계 남성, 안경, 정장. 보수적이고 신중한 숫자 전문가, 재무 관리자.',
    quote: '수입과 지출의 균형이 중요해요.',
  },
  {
    id: 'gf-022',
    name: 'Emily Stone',
    nameKo: '에밀리',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '파크 평판 +10%', bonus: '' },
      { level: 5, passive: '파크 평판 +25%', bonus: '부정적 사건 영향 -20%' },
      { level: 10, passive: '파크 평판 +45%', bonus: '부정적 사건 영향 -50%, 위기 관리' },
    ],
    synergies: [
      { partnerId: 'gf-018', name: '퍼펙트 마케팅', effect: '알렉스와 함께 배치 시', bonus: { revenue: 0.20 } },
    ],
    unlockCondition: { type: 'achievement', value: 'park-score-10k', description: '파크 점수 10,000' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 여성, 비즈니스 캐주얼. 소통 전문가이자 친화력 있는 PR 매니저.',
    quote: '이미지가 전부예요!',
  },
  {
    id: 'gf-023',
    name: 'Michael Torres',
    nameKo: '마이클',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '상점 수익 +15%', bonus: '' },
      { level: 5, passive: '상점 수익 +35%', bonus: '상품 다양성 +20%' },
      { level: 10, passive: '상점 수익 +60%', bonus: '상품 다양성 +45%, 한정판 상품' },
    ],
    synergies: [],
    unlockCondition: { type: 'building', value: 'gift-shop', description: '기념품샵 건설' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 남성, 캐주얼, 공룡 티셔츠. 상인 기질의 친절한 기념품샵 매니저.',
    quote: '기념품 하나 어때요?',
  },
  {
    id: 'gf-024',
    name: 'Victoria Hayes',
    nameKo: '빅토리아',
    job: GreatFigureJob.MANAGER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '후원금 +15%', bonus: '' },
      { level: 5, passive: '후원금 +35%', bonus: '스폰서 보너스 +20%' },
      { level: 10, passive: '후원금 +60%', bonus: '스폰서 보너스 +45%, 대형 투자 유치' },
    ],
    synergies: [],
    unlockCondition: { type: 'level', value: 'park-20', description: '파크 레벨 20' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 여성, 고급 정장. 프로페셔널한 협상의 달인, 투자 유치 전문가.',
    quote: '투자는 미래를 사는 거예요.',
  },
];

// === 탐험가 (6명) ===
const EXPLORERS: GreatFigureType[] = [
  {
    id: 'gf-025',
    name: 'Daniel Hunter',
    nameKo: '다니엘',
    job: GreatFigureJob.EXPLORER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '탐험 보상 +15%', bonus: '' },
      { level: 5, passive: '탐험 보상 +38%', bonus: '탐험 시간 -18%' },
      { level: 10, passive: '탐험 보상 +65%', bonus: '탐험 시간 -35%, 비밀 구역' },
    ],
    synergies: [
      { partnerId: 'gf-029', name: '탐험 듀오', effect: '아마라와 함께 배치 시', bonus: { explorationReward: 0.20 } },
    ],
    unlockCondition: { type: 'achievement', value: 'exploration-100', description: '탐험 100회' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 남성, 탐험복, 모자, 흉터. 무모하지만 행운아인 낙천적 모험가, 탐험 대장.',
    quote: '모험 없이 발견도 없지!',
  },
  {
    id: 'gf-026',
    name: 'Natalie Anderson',
    nameKo: '나탈리',
    job: GreatFigureJob.EXPLORER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '해양 탐험 +25%', bonus: '' },
      { level: 5, passive: '해양 탐험 +55%', bonus: '해양 발견률 +25%' },
      { level: 10, passive: '해양 탐험 +100%', bonus: '해양 발견률 +50%, 심해 탐사' },
    ],
    synergies: [
      { partnerId: 'gf-015', name: '해양 연구팀', effect: '나오미와 함께 배치 시', bonus: { marineDiscovery: 0.30 } },
    ],
    unlockCondition: { type: 'story', value: 'chapter-4-marine', description: '챕터 4 (해양관)' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 여성, 잠수복, 짧은 머리. 침착하고 용감한 바다를 사랑하는 해양 탐사 전문가.',
    quote: '바다 밑에 답이 있어.',
  },
  {
    id: 'gf-027',
    name: 'Carlos Sanchez',
    nameKo: '카를로스',
    job: GreatFigureJob.EXPLORER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '익룡 발견률 +15%', bonus: '' },
      { level: 5, passive: '익룡 발견률 +38%', bonus: '비행 쇼 +22%' },
      { level: 10, passive: '익룡 발견률 +65%', bonus: '비행 쇼 +50%, 익룡 기수' },
    ],
    synergies: [
      { partnerId: 'gf-016', name: '하늘의 개척자들', effect: '오마르와 함께 배치 시', bonus: { pterosaurDiscovery: 0.25 } },
    ],
    unlockCondition: { type: 'building', value: 'aviary', description: '조류관 건설' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '40대 멕시코계 남성, 비행 재킷, 고글. 자유로운 영혼으로 하늘을 사랑하는 익룡 연구가 겸 파일럿.',
    quote: '하늘에서 보면 다 보여!',
  },
  {
    id: 'gf-028',
    name: 'Liam O\'Connor',
    nameKo: '리암',
    job: GreatFigureJob.EXPLORER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '동굴 탐험 보상 +20%', bonus: '' },
      { level: 5, passive: '동굴 탐험 보상 +45%', bonus: '희귀 광물 +20%' },
      { level: 10, passive: '동굴 탐험 보상 +80%', bonus: '희귀 광물 +45%, 숨겨진 동굴' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'cave-exploration-10', description: '동굴 탐험 10회' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 아일랜드 남성, 헤드램프, 등반 장비. 신중하고 인내심 있는 동굴 탐사 전문가.',
    quote: '어둠 속에 보물이 숨어있어.',
  },
  {
    id: 'gf-029',
    name: 'Amara Okafor',
    nameKo: '아마라',
    job: GreatFigureJob.EXPLORER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '정글 탐험 보상 +20%', bonus: '' },
      { level: 5, passive: '정글 탐험 보상 +45%', bonus: '위험 회피 +25%' },
      { level: 10, passive: '정글 탐험 보상 +80%', bonus: '위험 회피 +50%, 정글 비밀' },
    ],
    synergies: [
      { partnerId: 'gf-025', name: '탐험 듀오', effect: '다니엘과 함께 배치 시', bonus: { explorationReward: 0.20 } },
    ],
    unlockCondition: { type: 'achievement', value: 'jungle-unlock', description: '정글 탐험 해금' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 아프리카 여성, 정글복, 마체테. 경험 풍부하고 자연과 하나인 정글 가이드.',
    quote: '정글은 내 집이야.',
  },
  {
    id: 'gf-030',
    name: 'Yuri Volkov',
    nameKo: '유리',
    job: GreatFigureJob.EXPLORER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '빙하 탐험 보상 +20%', bonus: '' },
      { level: 5, passive: '빙하 탐험 보상 +45%', bonus: '냉동 화석 +30%' },
      { level: 10, passive: '빙하 탐험 보상 +80%', bonus: '냉동 화석 +60%, 빙하기 비밀' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'glacier-unlock', description: '빙하 지대 탐험 해금' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 러시아 남성, 방한복, 수염. 강인하고 말수 적은 생존 전문가, 극지 탐험가.',
    quote: '추위는 친구야. 두려워하지 마.',
  },
];

// === 조련사 & 사육사 (7명) ===
const TRAINERS: GreatFigureType[] = [
  {
    id: 'gf-031',
    name: 'Olivia Brown',
    nameKo: '올리비아',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '친밀도 획득 +20%', bonus: '' },
      { level: 5, passive: '친밀도 획득 +50%', bonus: '조련 성공률 +15%' },
      { level: 10, passive: '친밀도 획득 +100%', bonus: '조련 성공률 +35%, 전 공룡 조련' },
    ],
    synergies: [
      { partnerId: 'gf-033', name: '최강 조련팀', effect: '에릭과 함께 배치 시', bonus: { intimacyGain: 0.30 } },
    ],
    unlockCondition: { type: 'level', value: 'training-facility-15', description: '조련장 Lv.15' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '30대 여성, 작업복, 갈색 포니테일, 휘파람. 공룡과 교감하지만 사람에겐 무뚝뚝한 수석 공룡 조련사.',
    quote: '공룡은 거짓말 안 해.',
  },
  {
    id: 'gf-032',
    name: 'William McGregor',
    nameKo: '윌리엄',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '초식 먹이 효율 +20%', bonus: '' },
      { level: 5, passive: '초식 먹이 효율 +45%', bonus: '초식 만족도 +22%' },
      { level: 10, passive: '초식 먹이 효율 +75%', bonus: '초식 만족도 +50%, 번식 +20%' },
    ],
    synergies: [],
    unlockCondition: { type: 'building', value: 'grassland-habitat', description: '초원 서식지 건설' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '50대 스코틀랜드 남성, 수염, 짚모자. 느긋하고 인내심 있으며 자상한 초식공룡 전문 사육사.',
    quote: '서두르면 안 돼, 친구.',
  },
  {
    id: 'gf-033',
    name: 'Eric Owen',
    nameKo: '에릭',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '육식 탈출 -15%', bonus: '' },
      { level: 5, passive: '육식 탈출 -38%', bonus: '육식 쇼 +25%' },
      { level: 10, passive: '육식 탈출 -60%', bonus: '육식 쇼 +50%, 랩터 팩 리더' },
    ],
    synergies: [
      { partnerId: 'gf-031', name: '최강 조련팀', effect: '올리비아와 함께 배치 시', bonus: { intimacyGain: 0.30 } },
    ],
    unlockCondition: { type: 'collection', value: 'carnivore-3', description: '육식 공룡 3마리' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 남성, 근육질, 팔에 흉터. 대담하고 자신감 넘치는 리더십의 육식공룡 조련 전문가.',
    quote: '두려움은 동물도 느껴.',
  },
  {
    id: 'gf-034',
    name: 'May Lin',
    nameKo: '메이',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '해양 친밀도 +20%', bonus: '' },
      { level: 5, passive: '해양 친밀도 +45%', bonus: '해양 쇼 +25%' },
      { level: 10, passive: '해양 친밀도 +80%', bonus: '해양 쇼 +55%, 돌고래 쇼' },
    ],
    synergies: [
      { partnerId: 'gf-015', name: '바다의 전문가들', effect: '나오미와 함께 배치 시', bonus: { marineEfficiency: 0.25 } },
    ],
    unlockCondition: { type: 'collection', value: 'marine-3', description: '해양 공룡 3마리' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '20대 중국계 여성, 잠수복, 밝은 미소. 활발하고 해양 생물을 사랑하는 해양 생물 조련사.',
    quote: '바다 친구들은 특별해요!',
  },
  {
    id: 'gf-035',
    name: 'Jake Miller',
    nameKo: '제이크',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '익룡 친밀도 +15%', bonus: '' },
      { level: 5, passive: '익룡 친밀도 +38%', bonus: '익룡 탈출 -20%' },
      { level: 10, passive: '익룡 친밀도 +65%', bonus: '익룡 탈출 -45%, 익룡 비행쇼' },
    ],
    synergies: [
      { partnerId: 'gf-016', name: '하늘의 마스터', effect: '오마르와 함께 배치 시', bonus: { pterosaurEfficiency: 0.20 } },
    ],
    unlockCondition: { type: 'collection', value: 'pterosaur-3', description: '익룡 3마리' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '20대 남성, 가벼운 복장, 팔 보호대. 모험적이고 새를 좋아하는 익룡 조련사.',
    quote: '하늘을 나는 건 최고야!',
  },
  {
    id: 'gf-036',
    name: 'Grace Thompson',
    nameKo: '그레이스',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '아기 공룡 성장 +15%', bonus: '' },
      { level: 5, passive: '아기 공룡 성장 +38%', bonus: '부화 성공률 +15%' },
      { level: 10, passive: '아기 공룡 성장 +65%', bonus: '부화 성공률 +35%, 쌍둥이 확률 +10%' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'first-hatch', description: '첫 공룡 부화' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '20대 여성, 부드러운 인상, 앞치마. 모성애 넘치고 섬세한 아기 공룡 전문 사육사.',
    quote: '아기들은 사랑이 필요해요.',
  },
  {
    id: 'gf-037',
    name: 'Max Rodriguez',
    nameKo: '맥스',
    job: GreatFigureJob.TRAINER,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '쇼 수익 +20%', bonus: '' },
      { level: 5, passive: '쇼 수익 +45%', bonus: '관객 만족도 +25%' },
      { level: 10, passive: '쇼 수익 +80%', bonus: '관객 만족도 +55%, 메가 쇼' },
    ],
    synergies: [
      { partnerId: 'gf-020', name: '쇼 비즈니스', effect: '재키와 함께 배치 시', bonus: { eventRevenue: 0.25 } },
    ],
    unlockCondition: { type: 'achievement', value: 'show-10', description: '쇼 10회 성공' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '40대 남성, 쇼맨 복장, 마이크. 화려하고 관객 장악력 있는 공룡 쇼 연출가.',
    quote: '쇼는 이렇게 하는 거야!',
  },
];

// === 수의사 & 의료진 (5명) ===
const VETS: GreatFigureType[] = [
  {
    id: 'gf-038',
    name: 'Claire Bennett',
    nameKo: '클레어',
    job: GreatFigureJob.VET,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '치료 속도 +20%', bonus: '' },
      { level: 5, passive: '치료 속도 +45%', bonus: '질병 예방 +25%' },
      { level: 10, passive: '치료 속도 +80%', bonus: '질병 예방 +55%, 기적의 치료' },
    ],
    synergies: [
      { partnerId: 'gf-039', name: '의료 드림팀', effect: '벤과 함께 배치 시', bonus: { healingSpeed: 0.25 } },
    ],
    unlockCondition: { type: 'level', value: 'hospital-10', description: '동물병원 Lv.10' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '30대 여성, 흰 가운, 청진기. 전문적이고 헌신적이며 침착한 수석 공룡 수의사.',
    quote: '모든 생명은 소중해요.',
  },
  {
    id: 'gf-039',
    name: 'Ben Parker',
    nameKo: '벤',
    job: GreatFigureJob.VET,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '응급 치료 +25%', bonus: '' },
      { level: 5, passive: '응급 치료 +55%', bonus: '사망률 -30%' },
      { level: 10, passive: '응급 치료 +100%', bonus: '사망률 -60%, 기적의 회복' },
    ],
    synergies: [
      { partnerId: 'gf-038', name: '의료 드림팀', effect: '클레어와 함께 배치 시', bonus: { healingSpeed: 0.25 } },
    ],
    unlockCondition: { type: 'achievement', value: 'injury-heal-5', description: '공룡 부상 5회 치료' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 남성, 응급 조끼, 의료 키트. 신속하고 차분한 위기 대응 응급 수의사.',
    quote: '시간이 생명이야!',
  },
  {
    id: 'gf-040',
    name: 'Lisa Wong',
    nameKo: '리사',
    job: GreatFigureJob.VET,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '먹이 효율 +15%', bonus: '' },
      { level: 5, passive: '먹이 효율 +38%', bonus: '공룡 건강 +20%' },
      { level: 10, passive: '먹이 효율 +65%', bonus: '공룡 건강 +45%, 특수 식단' },
    ],
    synergies: [],
    unlockCondition: { type: 'building', value: 'feeder', description: '먹이통 건설' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 아시아계 여성, 실험복. 꼼꼼하고 건강을 중시하는 영양 전문가.',
    quote: '건강한 식단이 기본이에요.',
  },
  {
    id: 'gf-041',
    name: 'Peter Schmidt',
    nameKo: '피터',
    job: GreatFigureJob.VET,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '질병 발생 -15%', bonus: '' },
      { level: 5, passive: '질병 발생 -38%', bonus: '검진 효율 +25%' },
      { level: 10, passive: '질병 발생 -65%', bonus: '검진 효율 +55%, 전염병 차단' },
    ],
    synergies: [],
    unlockCondition: { type: 'level', value: 'hospital-5', description: '동물병원 Lv.5' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '50대 독일 남성, 안경, 연구복. 체계적이고 예방을 중시하는 예방의학 전문의.',
    quote: '예방이 치료보다 낫습니다.',
  },
  {
    id: 'gf-042',
    name: 'Ana Martinez',
    nameKo: '아나',
    job: GreatFigureJob.VET,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '스트레스 해소 +20%', bonus: '' },
      { level: 5, passive: '스트레스 해소 +45%', bonus: '공격성 -25%' },
      { level: 10, passive: '스트레스 해소 +80%', bonus: '공격성 -55%, 심리 안정화' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'stress-relief-5', description: '공룡 스트레스 5회 해소' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 스페인 여성, 캐주얼. 공감 능력이 뛰어나고 부드러운 공룡 심리 전문가.',
    quote: '마음의 상처도 치료가 필요해요.',
  },
];

// === 보안 & 경비 (4명) ===
const SECURITY: GreatFigureType[] = [
  {
    id: 'gf-043',
    name: 'Robert Muldoon',
    nameKo: '로버트',
    job: GreatFigureJob.SECURITY,
    rarity: Rarity.EPIC,
    abilities: [
      { level: 1, passive: '탈출 감지 +25%', bonus: '' },
      { level: 5, passive: '탈출 감지 +55%', bonus: '대응 속도 +30%' },
      { level: 10, passive: '탈출 감지 +90%', bonus: '대응 속도 +60%, 즉각 진압' },
    ],
    synergies: [
      { partnerId: 'gf-045', name: '철벽 보안', effect: '사라와 함께 배치 시', bonus: { securityEfficiency: 0.30 } },
    ],
    unlockCondition: { type: 'achievement', value: 'escape-response-3', description: '탈출 사건 3회 대응' },
    recruitCost: RECRUIT_COST[Rarity.EPIC],
    description: '50대 남성, 사파리 복장, 선글라스. 경험 풍부하고 냉철하며 존경받는 보안 책임자.',
    quote: '영리한 녀석들이야...',
  },
  {
    id: 'gf-044',
    name: 'Nick Barnes',
    nameKo: '닉',
    job: GreatFigureJob.SECURITY,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '울타리 내구도 +20%', bonus: '' },
      { level: 5, passive: '울타리 내구도 +45%', bonus: '수리 속도 +25%' },
      { level: 10, passive: '울타리 내구도 +80%', bonus: '수리 속도 +55%, 고압 울타리' },
    ],
    synergies: [],
    unlockCondition: { type: 'building', value: 'fence', description: '울타리 건설' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '30대 남성, 기술자 복장. 기술적이고 꼼꼼한 전기 울타리 관리자.',
    quote: '울타리가 생명이야.',
  },
  {
    id: 'gf-045',
    name: 'Sarah Cole',
    nameKo: '사라 콜',
    job: GreatFigureJob.SECURITY,
    rarity: Rarity.RARE,
    abilities: [
      { level: 1, passive: '비상 대응 +20%', bonus: '' },
      { level: 5, passive: '비상 대응 +45%', bonus: '피해 최소화 +30%' },
      { level: 10, passive: '비상 대응 +80%', bonus: '피해 최소화 +60%, 즉시 대피' },
    ],
    synergies: [
      { partnerId: 'gf-043', name: '철벽 보안', effect: '로버트와 함께 배치 시', bonus: { securityEfficiency: 0.30 } },
    ],
    unlockCondition: { type: 'achievement', value: 'emergency-5', description: '비상 상황 5회 해결' },
    recruitCost: RECRUIT_COST[Rarity.RARE],
    description: '30대 여성, 전술 복장. 결단력 있고 리더십을 갖춘 비상 대응 팀장.',
    quote: '침착하게, 순서대로!',
  },
  {
    id: 'gf-046',
    name: 'Marcus Johnson',
    nameKo: '마커스',
    job: GreatFigureJob.SECURITY,
    rarity: Rarity.COMMON,
    abilities: [
      { level: 1, passive: '야간 안전 +20%', bonus: '' },
      { level: 5, passive: '야간 안전 +45%', bonus: '야간 탈출 -25%' },
      { level: 10, passive: '야간 안전 +80%', bonus: '야간 탈출 -55%, 야간 순찰' },
    ],
    synergies: [],
    unlockCondition: { type: 'achievement', value: 'night-mode', description: '야간 운영 해금' },
    recruitCost: RECRUIT_COST[Rarity.COMMON],
    description: '40대 흑인 남성, 경비 복장, 손전등. 신뢰감 있고 책임감 강한 야간 경비대장.',
    quote: '밤에도 안전은 지켜져야 해.',
  },
];

// === 특수 & 레전더리 (4명) ===
const SPECIAL: GreatFigureType[] = [
  {
    id: 'gf-047',
    name: 'Arthur Hammond',
    nameKo: '아서 해먼드',
    job: GreatFigureJob.SPECIAL,
    rarity: Rarity.LEGENDARY,
    abilities: [
      { level: 1, passive: '파크 전체 수익 +10%', bonus: '' },
      { level: 5, passive: '파크 전체 수익 +25%', bonus: '관람객 +25%' },
      { level: 10, passive: '파크 전체 수익 +45%', bonus: '관람객 +50%, 해먼드의 유산' },
    ],
    synergies: [
      { partnerId: 'gf-050', name: '해먼드 가문', effect: '존 주니어와 함께 배치 시', bonus: { allEffects: 0.20 } },
    ],
    unlockCondition: { type: 'season', value: 'season-1-final', description: '시즌 1 최종 보상' },
    recruitCost: RECRUIT_COST[Rarity.LEGENDARY],
    description: '70대 노신사, 흰 수염, 지팡이, 모험가 복장. 꿈을 쫓는 이상가이자 카리스마 있는 전설의 파크 창립자.',
    quote: '꿈이 있다면 길은 열려.',
  },
  {
    id: 'gf-048',
    name: 'Elizabeth Wu',
    nameKo: '엘리자베스 우',
    job: GreatFigureJob.SPECIAL,
    rarity: Rarity.LEGENDARY,
    abilities: [
      { level: 1, passive: '모든 연구 시간 -15%', bonus: '' },
      { level: 5, passive: '모든 연구 시간 -38%', bonus: 'DNA 품질 +25%' },
      { level: 10, passive: '모든 연구 시간 -65%', bonus: 'DNA 품질 +55%, 비밀 레시피' },
    ],
    synergies: [
      { partnerId: 'gf-001', name: '스승과 제자들', effect: '닥터 진과 함께 배치 시', bonus: { researchSpeed: 0.25 } },
    ],
    unlockCondition: { type: 'season', value: 'season-2-final', description: '시즌 2 최종 보상' },
    recruitCost: RECRUIT_COST[Rarity.LEGENDARY],
    description: '60대 아시아계 여성, 우아한 연구복, 날카로운 눈매. 냉철하지만 공룡에 깊은 애정을 가진 닥터 진의 스승, 전설의 유전공학자.',
    quote: '생명은 존중해야 해.',
  },
  {
    id: 'gf-049',
    name: 'Rex',
    nameKo: '렉스',
    job: GreatFigureJob.SPECIAL,
    rarity: Rarity.LEGENDARY,
    abilities: [
      { level: 1, passive: '공룡 교감 (사고 알림)', bonus: '' },
      { level: 5, passive: '탈출 1분 전 경고', bonus: '탈출 피해 -40%' },
      { level: 10, passive: '완전 교감', bonus: '모든 탈출 사전 방지, 렉스의 비밀 해금' },
    ],
    synergies: [],
    unlockCondition: { type: 'event', value: 'rex-secret', description: '특별 이벤트 "렉스의 비밀"' },
    recruitCost: 0,
    description: '정체불명, 후드+마스크, 공룡 발톱 목걸이. 말이 적고 신비로우며 공룡과 소통하는 미스터리한 존재.',
    quote: '...그들이 말하고 있어.',
  },
  {
    id: 'gf-050',
    name: 'John Hammond Jr.',
    nameKo: '존 해먼드 주니어',
    job: GreatFigureJob.SPECIAL,
    rarity: Rarity.LEGENDARY,
    abilities: [
      { level: 1, passive: '모든 효과 +5%', bonus: '' },
      { level: 5, passive: '모든 효과 +15%', bonus: '특별 후원 +30%' },
      { level: 10, passive: '모든 효과 +30%', bonus: '특별 후원 +60%, 진정한 계승자' },
    ],
    synergies: [
      { partnerId: 'gf-047', name: '해먼드 가문', effect: '아서와 함께 배치 시', bonus: { allEffects: 0.20 } },
    ],
    unlockCondition: { type: 'story', value: 'ending', description: '파크 완전 복원 (엔딩)' },
    recruitCost: 0,
    description: '40대 남성, 현대적 정장, 아버지를 닮은 인상. 아버지의 꿈을 계승하며 현실적이면서도 이상적인 해먼드 재단 후계자.',
    quote: '아버지의 꿈을 완성하겠습니다.',
  },
];

// === 전체 위인 데이터 ===
export const GREAT_FIGURE_DATA: GreatFigureType[] = [
  ...SCIENTISTS,
  ...ARCHITECTS,
  ...MANAGERS,
  ...EXPLORERS,
  ...TRAINERS,
  ...VETS,
  ...SECURITY,
  ...SPECIAL,
];

// === 헬퍼 함수 ===
export function getGreatFigureById(id: string): GreatFigureType | undefined {
  return GREAT_FIGURE_DATA.find((f) => f.id === id);
}

export function getGreatFiguresByJob(job: GreatFigureJob): GreatFigureType[] {
  return GREAT_FIGURE_DATA.filter((f) => f.job === job);
}

export function getGreatFiguresByRarity(rarity: Rarity): GreatFigureType[] {
  return GREAT_FIGURE_DATA.filter((f) => f.rarity === rarity);
}

export function getGreatFiguresWithSynergy(figureId: string): GreatFigureType[] {
  return GREAT_FIGURE_DATA.filter((f) =>
    f.synergies.some((s) => s.partnerId === figureId)
  );
}

// === 통계 ===
export const GREAT_FIGURE_STATS = {
  total: GREAT_FIGURE_DATA.length,
  byJob: {
    [GreatFigureJob.SCIENTIST]: SCIENTISTS.length,
    [GreatFigureJob.ARCHITECT]: ARCHITECTS.length,
    [GreatFigureJob.MANAGER]: MANAGERS.length,
    [GreatFigureJob.EXPLORER]: EXPLORERS.length,
    [GreatFigureJob.TRAINER]: TRAINERS.length,
    [GreatFigureJob.VET]: VETS.length,
    [GreatFigureJob.SECURITY]: SECURITY.length,
    [GreatFigureJob.SPECIAL]: SPECIAL.length,
  },
  byRarity: {
    [Rarity.COMMON]: GREAT_FIGURE_DATA.filter((f) => f.rarity === Rarity.COMMON).length,
    [Rarity.UNCOMMON]: GREAT_FIGURE_DATA.filter((f) => f.rarity === Rarity.UNCOMMON).length,
    [Rarity.RARE]: GREAT_FIGURE_DATA.filter((f) => f.rarity === Rarity.RARE).length,
    [Rarity.EPIC]: GREAT_FIGURE_DATA.filter((f) => f.rarity === Rarity.EPIC).length,
    [Rarity.LEGENDARY]: GREAT_FIGURE_DATA.filter((f) => f.rarity === Rarity.LEGENDARY).length,
  },
};
