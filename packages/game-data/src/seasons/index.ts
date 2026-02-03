/**
 * 시즌 콘텐츠 데이터 - 다이노 파크 타이쿤
 * 시즌 1: 창립자의 귀환
 */

import type { Season, SeasonChapter, SeasonPassReward, SeasonEvent } from '@dino-park/shared';

// ============================================================
// 시즌 1 챕터 데이터
// ============================================================

const SEASON1_CHAPTERS: SeasonChapter[] = [
  {
    id: 's1-ch1',
    order: 1,
    title: 'The Hidden Journal',
    titleKo: '숨겨진 일지',
    unlockCondition: { type: 'seasonStart' },
    scenes: [
      {
        id: 's1-ch1-scene1',
        title: '발견',
        dialogues: [
          {
            speaker: 'marco',
            text: '이 벽 뒤에 뭔가 있어. 소리가 다르게 울려.',
            emotion: 'curious',
          },
          {
            speaker: 'narrator',
            text: '벽을 부수자 숨겨진 공간이 발견된다.',
            emotion: 'neutral',
          },
          {
            speaker: 'jin',
            text: '이건... 금고?',
            emotion: 'surprised',
          },
          {
            speaker: 'player',
            text: '아서 해먼드의 개인 일지...',
            emotion: 'amazed',
          },
          {
            speaker: 'marco',
            text: '날짜가... 15년 전이야. 파크가 폐쇄되기 직전까지 기록되어 있어.',
            emotion: 'serious',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch1-scene2',
        title: '일지의 내용',
        dialogues: [
          {
            speaker: 'arthur',
            text: '1월 15일. 오늘 섬에서 놀라운 발견을 했다. 단순한 공룡 복원이 아니다. 이 섬 자체가... 살아있다.',
            emotion: 'excited',
          },
          {
            speaker: 'arthur',
            text: '지하에서 발견한 이상한 에너지원. 이걸 "에덴의 심장"이라 부르기로 했다.',
            emotion: 'mysterious',
          },
          {
            speaker: 'arthur',
            text: '이 에너지가 있는 한, 이 섬의 생명체들은 절대 멸종하지 않는다.',
            emotion: 'hopeful',
          },
          {
            speaker: 'arthur',
            text: '하지만 이 힘을 탐내는 자들이 있다. 바이오젠의 루이스... 그는 이 힘을 무기로 만들려 한다.',
            emotion: 'worried',
          },
          {
            speaker: 'arthur',
            text: '나는 이 비밀을 지켜야 한다. 설령 내 목숨을 바쳐서라도.',
            emotion: 'determined',
          },
        ],
        choices: [
          {
            id: 's1-ch1-choice1a',
            text: '일지를 계속 읽는다',
            effect: { additionalInfo: true },
            nextSceneId: 's1-ch1-scene3',
          },
          {
            id: 's1-ch1-choice1b',
            text: '닥터 진의 의견을 묻는다',
            effect: { jinAffinity: 20 },
            nextSceneId: 's1-ch1-scene3',
          },
          {
            id: 's1-ch1-choice1c',
            text: '마르코와 장소를 조사한다',
            effect: { hiddenItem: true },
            nextSceneId: 's1-ch1-scene3',
          },
        ],
      },
      {
        id: 's1-ch1-scene3',
        title: '마지막 페이지',
        dialogues: [
          {
            speaker: 'arthur',
            text: '만약 이 일지를 읽고 있다면, 넌 이미 이 섬의 새 주인이겠지.',
            emotion: 'warm',
          },
          {
            speaker: 'arthur',
            text: '섬의 북쪽, 안개 낀 절벽 너머에 내가 마지막으로 숨어든 곳이 있다.',
            emotion: 'mysterious',
          },
          {
            speaker: 'arthur',
            text: '"노아의 방주"라 불렀지. 거기서... 기다리고 있을게.',
            emotion: 'hopeful',
          },
          {
            speaker: 'player',
            text: '기다리고 있다고? 설마... 아서가 살아있는 건가?',
            emotion: 'shocked',
          },
        ],
        choices: [],
      },
    ],
    rewards: [
      { type: 'seasonPoint', amount: 500 },
      { type: 'gold', amount: 50000 },
      { type: 'diamond', amount: 100 },
      { type: 'item', id: 'arthur-journal', amount: 1 },
    ],
  },
  {
    id: 's1-ch2',
    order: 2,
    title: 'Beyond the Mist',
    titleKo: '안개 너머',
    unlockCondition: { type: 'previousChapter', value: 's1-ch1' },
    scenes: [
      {
        id: 's1-ch2-scene1',
        title: '안개 절벽 탐험',
        dialogues: [
          {
            speaker: 'daniel',
            text: '시야가 거의 없어. 조심해서 가자.',
            emotion: 'cautious',
          },
          {
            speaker: 'olivia',
            text: '잠깐... 저 소리 들려?',
            emotion: 'alert',
          },
          {
            speaker: 'narrator',
            text: '안개 사이로 거대한 그림자가 나타난다.',
            emotion: 'tense',
          },
          {
            speaker: 'unknown',
            text: '크아아아앙!',
            emotion: 'fierce',
          },
          {
            speaker: 'player',
            text: '저건... 본 적 없는 공룡이야!',
            emotion: 'amazed',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch2-scene2',
        title: '프로토케라톱스 알파 발견',
        dialogues: [
          {
            speaker: 'narrator',
            text: '안개 속에서 진화한 특별한 개체. 뿔이 은빛으로 빛난다.',
            emotion: 'awe',
          },
          {
            speaker: 'jin',
            text: '믿을 수 없어... 이런 변이 개체가 야생에서 살아남다니.',
            emotion: 'amazed',
          },
          {
            speaker: 'olivia',
            text: '조심해. 우리를 경계하고 있어.',
            emotion: 'cautious',
          },
        ],
        choices: [
          {
            id: 's1-ch2-choice1a',
            text: '천천히 다가간다',
            effect: { dinosaurTrust: 20 },
            nextSceneId: 's1-ch2-scene3',
          },
          {
            id: 's1-ch2-choice1b',
            text: '먹이를 건넨다',
            effect: { dinosaurTrust: 30 },
            nextSceneId: 's1-ch2-scene3',
          },
          {
            id: 's1-ch2-choice1c',
            text: '거리를 유지한다',
            effect: { safety: 10 },
            nextSceneId: 's1-ch2-scene3',
          },
        ],
      },
      {
        id: 's1-ch2-scene3',
        title: '노아의 방주 발견',
        dialogues: [
          {
            speaker: 'narrator',
            text: '절벽 끝, 숨겨진 시설. 거대한 돔 형태의 건물이 자연과 완전히 동화되어 있다.',
            emotion: 'awe',
          },
          {
            speaker: 'marco',
            text: '이건... 내가 설계한 적 없어. 아서가 혼자 만든 건가?',
            emotion: 'surprised',
          },
          {
            speaker: 'narrator',
            text: '입구에 새겨진 문구: "모든 생명에게 두 번째 기회를" - A. Hammond',
            emotion: 'meaningful',
          },
          {
            speaker: 'jin',
            text: '노아의 방주... 멸종 동물의 마지막 피난처라는 뜻인가?',
            emotion: 'thoughtful',
          },
        ],
        choices: [],
      },
    ],
    rewards: [
      { type: 'seasonPoint', amount: 700 },
      { type: 'gold', amount: 75000 },
      { type: 'dinosaur', id: 'protoceratops-alpha', amount: 1 },
    ],
  },
  {
    id: 's1-ch3',
    order: 3,
    title: "Noah's Ark",
    titleKo: '노아의 방주',
    unlockCondition: { type: 'previousChapter', value: 's1-ch2' },
    scenes: [
      {
        id: 's1-ch3-scene1',
        title: '방주 내부',
        dialogues: [
          {
            speaker: 'narrator',
            text: '거대한 돔 안에 펼쳐진 광경. 수십 개의 캡슐이 줄지어 있다. 그 안에는... 알. 공룡 알들이 보존되어 있다.',
            emotion: 'awe',
          },
          {
            speaker: 'jin',
            text: '이건... 믿을 수 없어. 멸종된 공룡들의 유전자 보관소야.',
            emotion: 'amazed',
          },
          {
            speaker: 'olivia',
            text: '저기 봐. 아직 불이 들어와 있어. 누군가 관리하고 있다는 뜻이야.',
            emotion: 'observant',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch3-scene2',
        title: '홀로그램 아서',
        dialogues: [
          {
            speaker: 'narrator',
            text: '홀로그램 장치가 활성화된다.',
            emotion: 'neutral',
          },
          {
            speaker: 'arthur_ai',
            text: '환영하네, 방문자여.',
            emotion: 'warm',
          },
          {
            speaker: 'player',
            text: '아서... 해먼드 씨?',
            emotion: 'hopeful',
          },
          {
            speaker: 'arthur_ai',
            text: '나는 아서의 기억과 지식을 담은 AI야. 진짜 아서는... 글쎄, 그건 직접 확인해야겠지.',
            emotion: 'mysterious',
          },
          {
            speaker: 'arthur_ai',
            text: '넌 이 섬의 새 주인이라고? 그렇다면 시험을 통과해야 해.',
            emotion: 'serious',
          },
          {
            speaker: 'arthur_ai',
            text: '이 방주의 비밀을 이해하고, 섬의 진정한 수호자가 될 자격이 있는지.',
            emotion: 'challenging',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch3-scene3',
        title: '연구 기록',
        dialogues: [
          {
            speaker: 'arthur',
            text: '6월 23일. 인도미누스 프로젝트는 실패했다. 우 박사의 야망이 괴물을 만들어냈어.',
            emotion: 'regretful',
          },
          {
            speaker: 'arthur',
            text: '하지만 나는 다른 길을 찾았다. "공존"의 가능성.',
            emotion: 'hopeful',
          },
          {
            speaker: 'arthur',
            text: '에덴의 심장 에너지를 이용하면, 인간과 공룡이 진정으로 이해할 수 있는 유대 관계를 만들 수 있어.',
            emotion: 'excited',
          },
          {
            speaker: 'arthur',
            text: '이걸 "프로젝트 에덴"이라 부르겠다. 인도미누스가 "완벽한 무기"라면, 에덴은 "완벽한 친구"야.',
            emotion: 'determined',
          },
        ],
        choices: [],
      },
    ],
    rewards: [
      { type: 'seasonPoint', amount: 1000 },
      { type: 'gold', amount: 100000 },
      { type: 'diamond', amount: 200 },
      { type: 'item', id: 'ark-blueprint', amount: 1 },
    ],
  },
  {
    id: 's1-ch4',
    order: 4,
    title: 'Heart of Eden',
    titleKo: '에덴의 심장',
    unlockCondition: { type: 'previousChapter', value: 's1-ch3' },
    scenes: [
      {
        id: 's1-ch4-scene1',
        title: '지하 동굴',
        dialogues: [
          {
            speaker: 'arthur_ai',
            text: '시험을 통과했군. 이제 진실을 보여주지.',
            emotion: 'approving',
          },
          {
            speaker: 'narrator',
            text: '지하로 내려가는 엘리베이터. 깊이: 100m... 200m... 500m...',
            emotion: 'tense',
          },
          {
            speaker: 'narrator',
            text: '문이 열린다. 푸른 빛이 동굴 전체를 채운다.',
            emotion: 'mystical',
          },
          {
            speaker: 'jin',
            text: '세상에...',
            emotion: 'breathless',
          },
          {
            speaker: 'narrator',
            text: '거대한 크리스탈이 빛나고 있다.',
            emotion: 'awe',
          },
          {
            speaker: 'arthur_ai',
            text: '이것이 에덴의 심장. 이 섬의 모든 생명의 원천이야.',
            emotion: 'reverent',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch4-scene2',
        title: '에덴의 비밀',
        dialogues: [
          {
            speaker: 'arthur_ai',
            text: '수만 년 전, 이 크리스탈이 운석과 함께 떨어졌어. 그 에너지가 이 섬의 생태계를 특별하게 만들었지.',
            emotion: 'explanatory',
          },
          {
            speaker: 'arthur_ai',
            text: '공룡들이 살아남은 것도, 새로운 종이 계속 탄생하는 것도, 모두 이 심장 덕분이야.',
            emotion: 'meaningful',
          },
          {
            speaker: 'arthur_ai',
            text: '하지만 이 힘은 양날의 검이야. 올바르게 사용하면 생명을 살리지만, 탐욕에 사로잡히면 파괴를 부르지.',
            emotion: 'warning',
          },
          {
            speaker: 'arthur_ai',
            text: '루이스... 그는 이 힘을 원했어. 바이오젠의 생체 무기 프로젝트에 사용하려고.',
            emotion: 'dark',
          },
          {
            speaker: 'arthur_ai',
            text: '그래서 나는 모든 것을 숨겼어. 그리고... 사라졌지.',
            emotion: 'sad',
          },
        ],
        choices: [
          {
            id: 's1-ch4-choice1a',
            text: '준비됐어요. 어디로 가면 되죠?',
            effect: { finalChapterUnlock: true },
            nextSceneId: null,
          },
          {
            id: 's1-ch4-choice1b',
            text: '조금 더 준비할 시간이 필요해요',
            effect: { bonusQuest: true },
            nextSceneId: null,
          },
          {
            id: 's1-ch4-choice1c',
            text: '에덴의 심장에 대해 더 알고 싶어요',
            effect: { hiddenLore: true },
            nextSceneId: null,
          },
        ],
      },
    ],
    rewards: [
      { type: 'seasonPoint', amount: 1500 },
      { type: 'gold', amount: 150000 },
      { type: 'diamond', amount: 300 },
      { type: 'item', id: 'eden-crystal-shard', amount: 1 },
    ],
  },
  {
    id: 's1-ch5',
    order: 5,
    title: 'The Founder',
    titleKo: '창립자',
    unlockCondition: { type: 'passLevel', value: 40 },
    scenes: [
      {
        id: 's1-ch5-scene1',
        title: '최종 여정',
        dialogues: [
          {
            speaker: 'arthur_ai',
            text: '가장 깊은 곳에 작은 오두막이 있어. 거기서 기다리고 있을게.',
            emotion: 'guiding',
          },
          {
            speaker: 'narrator',
            text: '좁은 통로를 지나자 크리스탈 빛이 점점 강해진다.',
            emotion: 'anticipation',
          },
          {
            speaker: 'olivia',
            text: '저기... 불빛이야.',
            emotion: 'hopeful',
          },
          {
            speaker: 'narrator',
            text: '작은 오두막이 보인다. 그리고 그 앞에...',
            emotion: 'breathless',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch5-scene2',
        title: '재회',
        dialogues: [
          {
            speaker: 'narrator',
            text: '백발의 노인이 앉아 있다. 눈가에 주름이 깊지만, 눈빛은 여전히 빛난다.',
            emotion: 'emotional',
          },
          {
            speaker: 'arthur',
            text: '드디어 왔군. 오래 기다렸어.',
            emotion: 'warm',
          },
          {
            speaker: 'player',
            text: '아서 해먼드... 씨. 살아계셨군요.',
            emotion: 'moved',
          },
          {
            speaker: 'arthur',
            text: '살아있다고 할 수 있을까? 이 심장의 에너지가 나를 살려두고 있지.',
            emotion: 'gentle',
          },
          {
            speaker: 'arthur',
            text: '하지만 이제 충분해. 내 꿈을 이어갈 사람을 찾았으니까.',
            emotion: 'satisfied',
          },
        ],
        choices: [],
      },
      {
        id: 's1-ch5-scene3',
        title: '유산',
        dialogues: [
          {
            speaker: 'arthur',
            text: '내 진정한 유산은 이 섬이 아니야. 공룡도, 기술도 아니야.',
            emotion: 'wise',
          },
          {
            speaker: 'arthur',
            text: '그건 바로... 꿈을 꾸는 용기. 불가능에 도전하는 마음.',
            emotion: 'passionate',
          },
          {
            speaker: 'arthur',
            text: '자네에게 그게 있다는 걸 알아. 그래서 선택했어.',
            emotion: 'trusting',
          },
          {
            speaker: 'arthur',
            text: '이제 이 섬은 자네 거야. 에덴의 심장을 지키고, 공존의 꿈을 이어가줘.',
            emotion: 'hopeful',
          },
          {
            speaker: 'player',
            text: '약속합니다. 당신의 꿈을 반드시 이룰게요.',
            emotion: 'determined',
          },
          {
            speaker: 'arthur',
            text: '고맙네... 이제 편히 쉴 수 있겠어.',
            emotion: 'peaceful',
          },
          {
            speaker: 'narrator',
            text: '아서가 미소를 짓는다. 에덴의 빛이 그를 감싼다. 그리고... 조용히 눈을 감는다.',
            emotion: 'bittersweet',
          },
          {
            speaker: 'narrator',
            text: '위대한 창립자의 마지막 여정이 끝났다. 하지만 그의 꿈은 이제 막 시작된다.',
            emotion: 'hopeful',
          },
        ],
        choices: [],
      },
    ],
    rewards: [
      { type: 'seasonPoint', amount: 3000 },
      { type: 'gold', amount: 300000 },
      { type: 'diamond', amount: 500 },
      { type: 'greatFigure', id: 'arthur-hammond', amount: 1 },
      { type: 'dinosaur', id: 'eden-brachiosaurus', amount: 1 },
      { type: 'title', id: 'heir-of-eden', amount: 1 },
    ],
  },
];

// ============================================================
// 시즌 1 패스 보상 (50레벨)
// ============================================================

const SEASON1_PASS_REWARDS: SeasonPassReward[] = [
  // Level 1-10: 기본 보상
  {
    level: 1,
    freeReward: { type: 'gold', quantity: 5000 },
    premiumReward: { type: 'gold', quantity: 10000 },
  },
  {
    level: 2,
    freeReward: { type: 'dna', quantity: 50 },
    premiumReward: { type: 'dna', quantity: 100 },
  },
  {
    level: 3,
    freeReward: { type: 'gold', quantity: 7500 },
    premiumReward: { type: 'diamond', quantity: 50 },
  },
  {
    level: 4,
    freeReward: { type: 'dna', quantity: 75 },
    premiumReward: { type: 'dna', quantity: 150 },
  },
  {
    level: 5,
    freeReward: { type: 'diamond', quantity: 30 },
    premiumReward: { type: 'skin', id: 'trex-founder', quantity: 1 },
  },
  {
    level: 6,
    freeReward: { type: 'gold', quantity: 10000 },
    premiumReward: { type: 'gold', quantity: 25000 },
  },
  {
    level: 7,
    freeReward: { type: 'dna', quantity: 100 },
    premiumReward: { type: 'dna', quantity: 200 },
  },
  {
    level: 8,
    freeReward: { type: 'gold', quantity: 12500 },
    premiumReward: { type: 'diamond', quantity: 75 },
  },
  {
    level: 9,
    freeReward: { type: 'dna', quantity: 125 },
    premiumReward: { type: 'dna', quantity: 250 },
  },
  {
    level: 10,
    freeReward: { type: 'diamond', quantity: 50 },
    premiumReward: { type: 'dinosaur', id: 'velociraptor-misty', quantity: 1 },
  },

  // Level 11-20: 중급 보상
  {
    level: 11,
    freeReward: { type: 'gold', quantity: 15000 },
    premiumReward: { type: 'gold', quantity: 35000 },
  },
  {
    level: 12,
    freeReward: { type: 'dna', quantity: 150 },
    premiumReward: { type: 'dna', quantity: 300 },
  },
  {
    level: 13,
    freeReward: { type: 'gold', quantity: 17500 },
    premiumReward: { type: 'diamond', quantity: 100 },
  },
  {
    level: 14,
    freeReward: { type: 'dna', quantity: 175 },
    premiumReward: { type: 'dna', quantity: 350 },
  },
  {
    level: 15,
    freeReward: { type: 'diamond', quantity: 75 },
    premiumReward: { type: 'skin', id: 'brachio-eden', quantity: 1 },
  },
  {
    level: 16,
    freeReward: { type: 'gold', quantity: 20000 },
    premiumReward: { type: 'gold', quantity: 50000 },
  },
  {
    level: 17,
    freeReward: { type: 'dna', quantity: 200 },
    premiumReward: { type: 'dna', quantity: 400 },
  },
  {
    level: 18,
    freeReward: { type: 'gold', quantity: 22500 },
    premiumReward: { type: 'diamond', quantity: 125 },
  },
  {
    level: 19,
    freeReward: { type: 'dna', quantity: 225 },
    premiumReward: { type: 'dna', quantity: 450 },
  },
  {
    level: 20,
    freeReward: { type: 'diamond', quantity: 100 },
    premiumReward: { type: 'dinosaur', id: 'gallimimus-silver', quantity: 1 },
  },

  // Level 21-30: 고급 보상
  {
    level: 21,
    freeReward: { type: 'gold', quantity: 25000 },
    premiumReward: { type: 'gold', quantity: 65000 },
  },
  {
    level: 22,
    freeReward: { type: 'dna', quantity: 250 },
    premiumReward: { type: 'dna', quantity: 500 },
  },
  {
    level: 23,
    freeReward: { type: 'gold', quantity: 27500 },
    premiumReward: { type: 'diamond', quantity: 150 },
  },
  {
    level: 24,
    freeReward: { type: 'dna', quantity: 275 },
    premiumReward: { type: 'dna', quantity: 550 },
  },
  {
    level: 25,
    freeReward: { type: 'diamond', quantity: 125 },
    premiumReward: { type: 'building', id: 'eden-crystal-lamp', quantity: 1 },
  },
  {
    level: 26,
    freeReward: { type: 'gold', quantity: 30000 },
    premiumReward: { type: 'gold', quantity: 80000 },
  },
  {
    level: 27,
    freeReward: { type: 'dna', quantity: 300 },
    premiumReward: { type: 'dna', quantity: 600 },
  },
  {
    level: 28,
    freeReward: { type: 'gold', quantity: 32500 },
    premiumReward: { type: 'diamond', quantity: 175 },
  },
  {
    level: 29,
    freeReward: { type: 'dna', quantity: 325 },
    premiumReward: { type: 'dna', quantity: 650 },
  },
  {
    level: 30,
    freeReward: { type: 'diamond', quantity: 150 },
    premiumReward: { type: 'dinosaur', id: 'protoceratops-alpha', quantity: 1 },
  },

  // Level 31-40: 에픽 보상
  {
    level: 31,
    freeReward: { type: 'gold', quantity: 35000 },
    premiumReward: { type: 'gold', quantity: 100000 },
  },
  {
    level: 32,
    freeReward: { type: 'dna', quantity: 350 },
    premiumReward: { type: 'dna', quantity: 700 },
  },
  {
    level: 33,
    freeReward: { type: 'gold', quantity: 37500 },
    premiumReward: { type: 'diamond', quantity: 200 },
  },
  {
    level: 34,
    freeReward: { type: 'dna', quantity: 375 },
    premiumReward: { type: 'dna', quantity: 750 },
  },
  {
    level: 35,
    freeReward: { type: 'diamond', quantity: 175 },
    premiumReward: { type: 'skin', id: 'stego-crystal', quantity: 1 },
  },
  {
    level: 36,
    freeReward: { type: 'gold', quantity: 40000 },
    premiumReward: { type: 'gold', quantity: 125000 },
  },
  {
    level: 37,
    freeReward: { type: 'dna', quantity: 400 },
    premiumReward: { type: 'dna', quantity: 800 },
  },
  {
    level: 38,
    freeReward: { type: 'gold', quantity: 42500 },
    premiumReward: { type: 'diamond', quantity: 225 },
  },
  {
    level: 39,
    freeReward: { type: 'dna', quantity: 425 },
    premiumReward: { type: 'dna', quantity: 850 },
  },
  {
    level: 40,
    freeReward: { type: 'diamond', quantity: 200 },
    premiumReward: { type: 'greatFigure', id: 'marco-founder', quantity: 1 },
  },

  // Level 41-50: 레전더리 보상
  {
    level: 41,
    freeReward: { type: 'gold', quantity: 45000 },
    premiumReward: { type: 'gold', quantity: 150000 },
  },
  {
    level: 42,
    freeReward: { type: 'dna', quantity: 450 },
    premiumReward: { type: 'dna', quantity: 900 },
  },
  {
    level: 43,
    freeReward: { type: 'gold', quantity: 47500 },
    premiumReward: { type: 'diamond', quantity: 250 },
  },
  {
    level: 44,
    freeReward: { type: 'dna', quantity: 475 },
    premiumReward: { type: 'dna', quantity: 950 },
  },
  {
    level: 45,
    freeReward: { type: 'diamond', quantity: 225 },
    premiumReward: { type: 'skin', id: 'indominus-ghost', quantity: 1 },
  },
  {
    level: 46,
    freeReward: { type: 'gold', quantity: 50000 },
    premiumReward: { type: 'gold', quantity: 200000 },
  },
  {
    level: 47,
    freeReward: { type: 'dna', quantity: 500 },
    premiumReward: { type: 'dna', quantity: 1000 },
  },
  {
    level: 48,
    freeReward: { type: 'gold', quantity: 55000 },
    premiumReward: { type: 'diamond', quantity: 300 },
  },
  {
    level: 49,
    freeReward: { type: 'dna', quantity: 550 },
    premiumReward: { type: 'dna', quantity: 1100 },
  },
  {
    level: 50,
    freeReward: { type: 'diamond', quantity: 300 },
    premiumReward: { type: 'dinosaur', id: 'eden-brachiosaurus', quantity: 1 },
  },
];

// ============================================================
// 시즌 1 이벤트
// ============================================================

const SEASON1_EVENTS: SeasonEvent[] = [
  {
    id: 's1-event-1',
    name: "Founder's Legacy Collection",
    nameKo: '창립자의 유산 컬렉션',
    type: 'collection',
    startDay: 7,
    durationDays: 14,
    description: '아서 해먼드의 연구 기록 조각을 수집하세요.',
    rewards: [
      { type: 'gold', quantity: 100000 },
      { type: 'diamond', quantity: 200 },
      { type: 'item', id: 'arthur-portrait', quantity: 1 },
    ],
  },
  {
    id: 's1-event-2',
    name: 'Mist Explorer Challenge',
    nameKo: '안개 탐험가 챌린지',
    type: 'challenge',
    startDay: 28,
    durationDays: 14,
    description: '안개 지역 탐험을 완료하고 특별 보상을 획득하세요.',
    rewards: [
      { type: 'dna', quantity: 1000 },
      { type: 'dinosaur', id: 'velociraptor-misty', quantity: 1 },
    ],
  },
  {
    id: 's1-event-3',
    name: 'Ark Restoration Raid',
    nameKo: '방주 복원 레이드',
    type: 'raid',
    startDay: 49,
    durationDays: 14,
    description: '다른 플레이어들과 협력하여 노아의 방주를 복원하세요.',
    rewards: [
      { type: 'gold', quantity: 200000 },
      { type: 'building', id: 'ark-monument', quantity: 1 },
    ],
  },
  {
    id: 's1-event-4',
    name: 'Eden Championship',
    nameKo: '에덴 챔피언십',
    type: 'competition',
    startDay: 70,
    durationDays: 14,
    description: '시즌 1 최종 대회! 최고의 파크를 가진 플레이어에게 특별 보상.',
    rewards: [
      { type: 'diamond', quantity: 500 },
      { type: 'title', id: 'eden-champion', quantity: 1 },
      { type: 'skin', id: 'trex-golden', quantity: 1 },
    ],
  },
];

// ============================================================
// 시즌 1 전체 데이터
// ============================================================

export const SEASON_1: Season = {
  id: 'season-1',
  name: 'Return of the Founder',
  nameKo: '창립자의 귀환',
  theme: 'founder',
  description: '아서 해먼드의 과거와 파크의 진정한 기원을 밝히는 미스터리 스토리',
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  maxLevel: 50,
  unlockCondition: {
    type: 'chapter',
    value: 'chapter-4',
  },
  dinosaurs: [
    'protoceratops-alpha',
    'velociraptor-misty',
    'gallimimus-silver',
    'eden-brachiosaurus',
    'parasaurolophus-crystal',
  ],
  greatFigures: ['arthur-hammond', 'marco-founder', 'helen-ark'],
  chapters: SEASON1_CHAPTERS,
  passRewards: SEASON1_PASS_REWARDS,
  specialEvents: SEASON1_EVENTS,
};

// ============================================================
// 전체 시즌 목록
// ============================================================

export const ALL_SEASONS: Season[] = [SEASON_1];

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * ID로 시즌 조회
 */
export function getSeasonById(id: string): Season | undefined {
  return ALL_SEASONS.find((season) => season.id === id);
}

/**
 * 현재 활성화된 시즌 조회
 */
export function getCurrentSeason(currentDate: Date = new Date()): Season | undefined {
  return ALL_SEASONS.find((season) => {
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return currentDate >= start && currentDate <= end;
  });
}

/**
 * 시즌 챕터 조회
 */
export function getSeasonChapter(seasonId: string, chapterId: string): SeasonChapter | undefined {
  const season = getSeasonById(seasonId);
  return season?.chapters.find((ch) => ch.id === chapterId);
}

/**
 * 시즌 패스 보상 조회
 */
export function getSeasonPassReward(seasonId: string, level: number): SeasonPassReward | undefined {
  const season = getSeasonById(seasonId);
  return season?.passRewards.find((r) => r.level === level);
}

// ============================================================
// 시즌 통계
// ============================================================

export const SEASON_STATS = {
  totalSeasons: ALL_SEASONS.length,
  season1: {
    chapters: SEASON1_CHAPTERS.length,
    passLevels: SEASON1_PASS_REWARDS.length,
    events: SEASON1_EVENTS.length,
    dinosaurs: SEASON_1.dinosaurs.length,
    greatFigures: SEASON_1.greatFigures.length,
  },
};
