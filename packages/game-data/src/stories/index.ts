/**
 * 스토리 데이터 - 다이노 파크 타이쿤
 * 프롤로그 ~ 챕터 6 + 에필로그
 */

import type { StoryChapter, StoryScene } from '@dino-park/shared';

// ============================================================
// 프롤로그: 유산
// ============================================================

const PROLOGUE_SCENES: StoryScene[] = [
  {
    id: 'prologue-scene-1',
    title: '편지',
    dialogues: [
      {
        speaker: 'narrator',
        text: '황혼이 지는 도시의 작은 아파트. 책상 위에 놓인 한 통의 편지.',
        emotion: 'neutral',
      },
      {
        speaker: 'narrator',
        text: '낡은 봉투에 왁스 인장 - 공룡 문양.',
        emotion: 'neutral',
      },
      {
        speaker: 'arthur',
        text: '친애하는 알렉스에게,\n\n우리는 만난 적이 없지만, 나는 자네를 오랫동안 지켜봐 왔다네.',
        emotion: 'warm',
      },
      {
        speaker: 'arthur',
        text: '자네가 어릴 적 우리 파크 영상을 보며 눈을 반짝이던 모습을... 생물학을 전공하고, 동물원에서 일하며 생명을 존중하는 법을 배운 것을...',
        emotion: 'warm',
      },
      {
        speaker: 'arthur',
        text: '나는 이제 늙었어. 내 꿈을 완성할 시간이 얼마 남지 않았지. 하지만 자네라면... 내가 이루지 못한 꿈을 완성할 수 있을 거야.',
        emotion: 'hopeful',
      },
      {
        speaker: 'arthur',
        text: '이슬라 소르나. 그 섬이 자네를 기다리고 있어.\n\n꿈이 있다면, 길은 열린다네.\n\n- 아서 해먼드',
        emotion: 'warm',
      },
    ],
    choices: [],
  },
  {
    id: 'prologue-scene-2',
    title: '도착',
    dialogues: [
      {
        speaker: 'narrator',
        text: '작은 배가 안개 속을 헤치며 나아간다. 서서히 모습을 드러내는 섬.',
        emotion: 'neutral',
      },
      {
        speaker: 'narrator',
        text: '무성한 정글, 솟아오른 절벽, 그리고 멀리 보이는 건물의 윤곽. 15년간 방치된 파크.',
        emotion: 'neutral',
      },
      {
        speaker: 'jin',
        text: '드디어 왔군! 아서 회장님한테 자네 얘기 많이 들었어.',
        emotion: 'excited',
      },
      {
        speaker: 'jin',
        text: '나는 진. 이 섬의 유전공학 책임자... 음, 아니, "였던" 사람이지.',
        emotion: 'neutral',
      },
      {
        speaker: 'jin',
        text: '15년 만에 이 섬에 돌아왔어. 자네와 함께 다시 시작하려고.',
        emotion: 'hopeful',
      },
    ],
    choices: [
      {
        id: 'prologue-choice-1a',
        text: '반갑습니다. 잘 부탁드려요.',
        effect: { jinAffinity: 10 },
        nextSceneId: 'prologue-scene-3',
      },
      {
        id: 'prologue-choice-1b',
        text: '15년 전... 무슨 일이 있었죠?',
        effect: { jinAffinity: 0, storyFlag: 'asked_about_past' },
        nextSceneId: 'prologue-scene-3',
      },
      {
        id: 'prologue-choice-1c',
        text: '(묵묵히 악수만 한다)',
        effect: { jinAffinity: 5 },
        nextSceneId: 'prologue-scene-3',
      },
    ],
  },
  {
    id: 'prologue-scene-3',
    title: '폐허',
    dialogues: [
      {
        speaker: 'narrator',
        text: '닥터 진과 함께 폐허가 된 파크 본관을 탐색한다.',
        emotion: 'neutral',
      },
      {
        speaker: 'narrator',
        text: '풀이 무성하게 자란 길, 덩굴에 뒤덮인 건물, 깨진 유리, 녹슨 철제...',
        emotion: 'sad',
      },
      {
        speaker: 'jin',
        text: '15년이라... 그때 여기는 정말 천국이었어.',
        emotion: 'nostalgic',
      },
      {
        speaker: 'jin',
        text: '수천 명의 관람객, 행복한 아이들, 그리고... 살아있는 공룡들.',
        emotion: 'nostalgic',
      },
      {
        speaker: 'narrator',
        text: '멀리서 울려 퍼지는 소리... 뿌우우웅...',
        emotion: 'surprised',
      },
      {
        speaker: 'jin',
        text: '...저 소리.',
        emotion: 'surprised',
      },
    ],
    choices: [],
  },
  {
    id: 'prologue-scene-4',
    title: '첫 만남',
    dialogues: [
      {
        speaker: 'narrator',
        text: '덤불을 헤치고 나타나는 거대한 존재. 길이 25미터, 높이 13미터. 목이 하늘을 향해 뻗어 있다.',
        emotion: 'awe',
      },
      {
        speaker: 'narrator',
        text: '브라키오사우루스.',
        emotion: 'awe',
      },
      {
        speaker: 'jin',
        text: '저 녀석... 살아있었어.',
        emotion: 'amazed',
      },
      {
        speaker: 'narrator',
        text: '브라키오가 천천히 고개를 숙인다. 주인공과 눈이 마주친다. 거대하지만, 온순한 눈빛.',
        emotion: 'warm',
      },
      {
        speaker: 'jin',
        text: '이 섬엔 아직 생명이 있어. 15년을 버텨낸 생명들이.',
        emotion: 'hopeful',
      },
      {
        speaker: 'jin',
        text: '우리가 할 일은... 이 생명들에게 다시 집을 만들어 주는 거야.',
        emotion: 'determined',
      },
    ],
    choices: [],
  },
];

const PROLOGUE: StoryChapter = {
  id: 'prologue',
  title: 'Legacy',
  titleKo: '유산',
  order: 0,
  scenes: PROLOGUE_SCENES,
  unlockCondition: { type: 'none' },
  rewards: [
    { type: 'gold', amount: 5000 },
    { type: 'character', id: 'jin' },
  ],
};

// ============================================================
// 챕터 1: 새로운 시작
// ============================================================

const CHAPTER1_SCENES: StoryScene[] = [
  {
    id: 'ch1-scene-1',
    title: '설계자의 귀환',
    dialogues: [
      {
        speaker: 'narrator',
        text: '파크 본관 앞. 먼지를 털며 서류를 살펴보는 주인공. 그때 헬리콥터 소리가 들린다.',
        emotion: 'neutral',
      },
      {
        speaker: 'marco',
        text: '아! 여기가 맞군! 마르코 로시, 건축가야. 아서 친구가 보내서 왔어!',
        emotion: 'excited',
      },
      {
        speaker: 'jin',
        text: '마르코! 오랜만이야!',
        emotion: 'happy',
      },
      {
        speaker: 'marco',
        text: '진! 자네도 돌아왔군! 후후, 이 섬이 우리를 다시 부르는 거야.',
        emotion: 'warm',
      },
      {
        speaker: 'marco',
        text: '20년 전, 내가 이 파크를 설계했지. 내 젊음을 바친 작품이었어.',
        emotion: 'nostalgic',
      },
      {
        speaker: 'marco',
        text: '폐허가 된 걸 보니... 마음이 아프지만, 더 멋지게 다시 지을 수 있어!',
        emotion: 'determined',
      },
    ],
    choices: [],
  },
  {
    id: 'ch1-scene-2',
    title: '첫 부화',
    dialogues: [
      {
        speaker: 'jin',
        text: '탐험팀이 가져온 알이야. 파라사우롤로푸스... 온순한 초식공룡이지.',
        emotion: 'excited',
      },
      {
        speaker: 'jin',
        text: '자, 직접 부화시켜 봐.',
        emotion: 'encouraging',
      },
      {
        speaker: 'narrator',
        text: '알에 금이 간다. 작은 발이 삐져나온다. 그리고...',
        emotion: 'anticipation',
      },
      {
        speaker: 'narrator',
        text: '아기 파라사우롤로푸스가 세상에 나온다. "뿌이~" 약한 울음소리.',
        emotion: 'warm',
      },
      {
        speaker: 'jin',
        text: '환영해, 꼬마야. 너의 새로운 집에 온 걸 환영해.',
        emotion: 'warm',
      },
    ],
    choices: [],
  },
  {
    id: 'ch1-scene-3',
    title: '첫 개장',
    dialogues: [
      {
        speaker: 'marco',
        text: '준비됐어! 작게 시작하지만, 의미 있는 첫걸음이야.',
        emotion: 'proud',
      },
      {
        speaker: 'narrator',
        text: '첫 관람객 도착. 작은 배에서 내리는 가족. 아이가 초원을 가리키며 소리친다.',
        emotion: 'happy',
      },
      {
        speaker: 'child',
        text: '엄마! 저기 봐! 진짜 공룡이야!',
        emotion: 'excited',
      },
      {
        speaker: 'jin',
        text: '저 표정... 20년 전과 똑같아. 우리가 왜 이 일을 하는지, 저 아이가 보여주고 있어.',
        emotion: 'moved',
      },
    ],
    choices: [],
  },
];

const CHAPTER1: StoryChapter = {
  id: 'chapter-1',
  title: 'A New Beginning',
  titleKo: '새로운 시작',
  order: 1,
  scenes: CHAPTER1_SCENES,
  unlockCondition: { type: 'chapter', value: 'prologue' },
  rewards: [
    { type: 'gold', amount: 10000 },
    { type: 'diamond', amount: 50 },
    { type: 'character', id: 'marco' },
  ],
};

// ============================================================
// 챕터 2: 포식자의 귀환
// ============================================================

const CHAPTER2_SCENES: StoryScene[] = [
  {
    id: 'ch2-scene-1',
    title: '밀림의 소리',
    dialogues: [
      {
        speaker: 'narrator',
        text: '밤, 파크 외곽. 주인공이 야간 순찰 중. 멀리서 이상한 소리가 들린다.',
        emotion: 'tense',
      },
      {
        speaker: 'narrator',
        text: '끼이이익... 카카카카...',
        emotion: 'tense',
      },
      {
        speaker: 'narrator',
        text: '풀숲에서 눈이 빛난다. 하나, 둘, 셋...',
        emotion: 'fearful',
      },
      {
        speaker: 'olivia',
        text: '움직이지 마.',
        emotion: 'calm',
      },
      {
        speaker: 'olivia',
        text: '저 소리는 랩터야. 15년간 야생에서 살아남은 녀석들. 지금 우리를 사냥감으로 보고 있어.',
        emotion: 'serious',
      },
      {
        speaker: 'narrator',
        text: '올리비아가 특이한 패턴의 휘파람을 분다. 랩터들의 눈빛이 변한다. 그리고... 물러난다.',
        emotion: 'relieved',
      },
      {
        speaker: 'olivia',
        text: '나야, 친구들. 나 돌아왔어.',
        emotion: 'warm',
      },
    ],
    choices: [],
  },
  {
    id: 'ch2-scene-2',
    title: '올리비아의 과거',
    dialogues: [
      {
        speaker: 'jin',
        text: '올리비아 브라운. 세계 최고의 공룡 조련사야.',
        emotion: 'respectful',
      },
      {
        speaker: 'jin',
        text: '그리고... 15년 전, 이 섬에서 유일하게 살아남은 어린이였지.',
        emotion: 'sad',
      },
      {
        speaker: 'olivia',
        text: '나는 여기서 자랐어. 이 섬이 내 집이었고, 공룡들이 내 가족이었어.',
        emotion: 'nostalgic',
      },
      {
        speaker: 'olivia',
        text: '그날... 많은 걸 잃었지만, 저 랩터들은 나를 지켜줬어.',
        emotion: 'sad',
      },
      {
        speaker: 'olivia',
        text: '저 녀석들을 다시 데려올 거야. 이번엔 제대로 된 집을 만들어서.',
        emotion: 'determined',
      },
    ],
    choices: [
      {
        id: 'ch2-choice-1a',
        text: '도와줄게. 함께 하자.',
        effect: { oliviaAffinity: 15 },
        nextSceneId: 'ch2-scene-3',
      },
      {
        id: 'ch2-choice-1b',
        text: '위험하지 않을까?',
        effect: { oliviaAffinity: 5 },
        nextSceneId: 'ch2-scene-3',
      },
      {
        id: 'ch2-choice-1c',
        text: '네 과거에 대해 더 알고 싶어.',
        effect: { oliviaAffinity: 10, storyFlag: 'olivia_past_interest' },
        nextSceneId: 'ch2-scene-3',
      },
    ],
  },
  {
    id: 'ch2-scene-3',
    title: '랩터 작전',
    dialogues: [
      {
        speaker: 'marco',
        text: '랩터를 위한 특별한 구역이 필요해. 높은 울타리, 이중 잠금, 관찰 통로...',
        emotion: 'thoughtful',
      },
      {
        speaker: 'olivia',
        text: '나를 따라와. 저 녀석들은 지능적이야. 힘으로 잡으려 하면 안 돼.',
        emotion: 'serious',
      },
      {
        speaker: 'narrator',
        text: '포획 성공. 랩터 3마리 확보 - 블루(알파, 가장 영리함), 델타(공격적), 에코(호기심 많음).',
        emotion: 'relieved',
      },
      {
        speaker: 'olivia',
        text: '오랜만이야, 친구들. 이제 더 이상 숨지 않아도 돼.',
        emotion: 'warm',
      },
    ],
    choices: [],
  },
  {
    id: 'ch2-scene-4',
    title: '첫 위기 - 탈출',
    dialogues: [
      {
        speaker: 'system',
        text: '경고: 구역 7 울타리 파손. 벨로시랩터 3마리 탈출.',
        emotion: 'alert',
      },
      {
        speaker: 'robert',
        text: '이건 테스트가 아니야! 랩터들이 나갔다! 모든 관람객 대피 시작!',
        emotion: 'urgent',
      },
      {
        speaker: 'jin',
        text: '어떻게 된 거야?! 울타리는 멀쩡했잖아!',
        emotion: 'panicked',
      },
      {
        speaker: 'olivia',
        text: '블루가 학습한 거야. 전기 패턴을 읽고, 약한 곳을 찾아낸 거지.',
        emotion: 'serious',
      },
    ],
    choices: [
      {
        id: 'ch2-choice-2a',
        text: '진정제로 무력화 (올리비아 추천)',
        effect: { raptorTrust: 20, casualties: 0 },
        nextSceneId: 'ch2-scene-5',
      },
      {
        id: 'ch2-choice-2b',
        text: '미끼로 유인 (다니엘 추천)',
        effect: { facilityDamage: 'medium', casualties: 1 },
        nextSceneId: 'ch2-scene-5',
      },
      {
        id: 'ch2-choice-2c',
        text: '무력 제압 (로버트 추천)',
        effect: { raptorTrust: -20, raptorInjured: true },
        nextSceneId: 'ch2-scene-5',
      },
    ],
  },
  {
    id: 'ch2-scene-5',
    title: '반성과 교훈',
    dialogues: [
      {
        speaker: 'narrator',
        text: '다음 날 아침, 회의실. 모두 지친 표정으로 앉아 있다.',
        emotion: 'tired',
      },
      {
        speaker: 'thomas',
        text: '이것이 내가 경고한 이유야. 생명을 창조하고, 가두고, 전시하는 것... 자연의 법칙을 거스르는 행위지.',
        emotion: 'stern',
      },
      {
        speaker: 'jin',
        text: '토마스 박사님...',
        emotion: 'nervous',
      },
      {
        speaker: 'thomas',
        text: '진, 자네도 알잖아. 15년 전 무슨 일이 있었는지.',
        emotion: 'stern',
      },
      {
        speaker: 'thomas',
        text: '젊은이, 자네는 선택해야 해. 이 길을 계속 갈 건지, 아니면 여기서 멈출 건지.',
        emotion: 'serious',
      },
    ],
    choices: [
      {
        id: 'ch2-choice-3a',
        text: '계속하겠습니다. 더 잘할 거예요.',
        effect: { thomasAffinity: 5, determination: 10 },
        nextSceneId: null,
      },
      {
        id: 'ch2-choice-3b',
        text: '무슨 일이 있었는지 알고 싶습니다.',
        effect: { thomasAffinity: 10, storyFlag: 'asked_thomas_truth' },
        nextSceneId: null,
      },
      {
        id: 'ch2-choice-3c',
        text: '당신 말이 맞을 수도 있어요.',
        effect: { thomasAffinity: 15 },
        nextSceneId: null,
      },
    ],
  },
];

const CHAPTER2: StoryChapter = {
  id: 'chapter-2',
  title: 'Return of the Predator',
  titleKo: '포식자의 귀환',
  order: 2,
  scenes: CHAPTER2_SCENES,
  unlockCondition: { type: 'chapter', value: 'chapter-1' },
  rewards: [
    { type: 'gold', amount: 15000 },
    { type: 'dinosaur', id: 'velociraptor' },
    { type: 'character', id: 'olivia' },
    { type: 'character', id: 'robert' },
  ],
};

// ============================================================
// 챕터 3: 금지된 실험
// ============================================================

const CHAPTER3_SCENES: StoryScene[] = [
  {
    id: 'ch3-scene-1',
    title: '지하의 문',
    dialogues: [
      {
        speaker: 'daniel',
        text: '여기 이상한 게 있어! 덩굴에 뒤덮인... 문 같은데?',
        emotion: 'curious',
      },
      {
        speaker: 'narrator',
        text: '발견: 숨겨진 입구. 녹슨 철문. 희미하게 보이는 글자: "제한 구역 - 허가된 인원 외 출입 금지 - 해먼드 재단 연구부"',
        emotion: 'mysterious',
      },
      {
        speaker: 'jin',
        text: '...여기구나.',
        emotion: 'serious',
      },
      {
        speaker: 'player',
        text: '알고 있었어?',
        emotion: 'surprised',
      },
      {
        speaker: 'jin',
        text: '...',
        emotion: 'guilty',
      },
    ],
    choices: [],
  },
  {
    id: 'ch3-scene-2',
    title: '과거의 흔적',
    dialogues: [
      {
        speaker: 'narrator',
        text: '지하 연구소 내부. 비상등만 켜진 어두운 복도. 먼지 쌓인 연구 장비. 깨진 유리, 흩어진 서류.',
        emotion: 'eerie',
      },
      {
        speaker: 'narrator',
        text: '발견: 연구 일지. "프로젝트 키메라 - 담당: 헨리 우 박사"',
        emotion: 'mysterious',
      },
      {
        speaker: 'narrator',
        text: '"Day 127: 여러 종의 DNA 결합 실험 성공. 기존 공룡보다 더 크고, 더 강하고, 더 지능적인 개체."',
        emotion: 'ominous',
      },
      {
        speaker: 'narrator',
        text: '"Day 156: 회장님이 프로젝트 중단을 명령. \'이건 공룡이 아니야\'라고 하셨다. 하지만 과학은 멈출 수 없어."',
        emotion: 'ominous',
      },
      {
        speaker: 'narrator',
        text: '"Day 189:" 이후 내용은 찢겨 있다...',
        emotion: 'mysterious',
      },
      {
        speaker: 'jin',
        text: '그때 난 막내 연구원이었어. 열정만 있고, 아무것도 몰랐지.',
        emotion: 'regretful',
      },
      {
        speaker: 'jin',
        text: '우리가 뭘 만들고 있는지... 그게 어떤 결과를 가져올지...',
        emotion: 'sad',
      },
    ],
    choices: [],
  },
  {
    id: 'ch3-scene-3',
    title: '닥터 진의 고백',
    dialogues: [
      {
        speaker: 'narrator',
        text: '연구소 중앙 홀. 닥터 진이 멈춰 선다. 그의 눈앞에 거대한 빈 케이지.',
        emotion: 'somber',
      },
      {
        speaker: 'jin',
        text: '여기서 태어났어. 인도미누스 렉스.',
        emotion: 'heavy',
      },
      {
        speaker: 'jin',
        text: '티라노사우루스의 힘, 벨로시랩터의 지능, 커틀피쉬의 위장 능력, 그리고... 더 많은 것들.',
        emotion: 'serious',
      },
      {
        speaker: 'jin',
        text: '우리가 만든 완벽한 포식자.',
        emotion: 'regretful',
      },
      {
        speaker: 'jin',
        text: '그날 밤, 그녀가 탈출했어. 위장 능력으로 온도 센서를 속이고, 지능으로 잠금장치를 분석하고, 힘으로 벽을 부쉈지.',
        emotion: 'traumatized',
      },
      {
        speaker: 'jin',
        text: '12명이 죽었어. 내 동료들, 친구들... 그리고 올리비아의 부모님도.',
        emotion: 'grief',
      },
      {
        speaker: 'jin',
        text: '나는 도망쳤어. 죄책감에 숨어 살았지. 아서 회장님이 연락했을 때, 다시 시작할 기회라고 생각했어.',
        emotion: 'guilty',
      },
      {
        speaker: 'jin',
        text: '이번엔... 제대로 하고 싶었어.',
        emotion: 'hopeful',
      },
    ],
    choices: [
      {
        id: 'ch3-choice-1a',
        text: '과거는 바꿀 수 없어. 앞으로가 중요해.',
        effect: { jinAffinity: 20 },
        nextSceneId: 'ch3-scene-4',
      },
      {
        id: 'ch3-choice-1b',
        text: '왜 지금까지 숨겼어?',
        effect: { jinAffinity: 5 },
        nextSceneId: 'ch3-scene-4',
      },
      {
        id: 'ch3-choice-1c',
        text: '올리비아는 알고 있어?',
        effect: { jinAffinity: 10, storyFlag: 'asked_about_olivia' },
        nextSceneId: 'ch3-scene-4',
      },
    ],
  },
  {
    id: 'ch3-scene-4',
    title: '찾아온 유혹',
    dialogues: [
      {
        speaker: 'narrator',
        text: '파크 본관, 며칠 후. 검은 헬기가 착륙한다.',
        emotion: 'tense',
      },
      {
        speaker: 'lewis',
        text: '아, 새로운 경영진이시군요? 저는 루이스, 바이오젠 대표입니다. 투자 제안을 하러 왔습니다.',
        emotion: 'charming',
      },
      {
        speaker: 'lewis',
        text: '귀사의 재정 상태, 잘 알고 있습니다. 재건 비용, 유지비, 인건비... 넉넉하지 않죠?',
        emotion: 'calculating',
      },
      {
        speaker: 'lewis',
        text: '저희가 전폭적으로 지원하겠습니다. 조건은 하나. 하이브리드 연구 데이터 공유.',
        emotion: 'persuasive',
      },
      {
        speaker: 'jin',
        text: '바이오젠... 15년 전에도 접근했었지.',
        emotion: 'suspicious',
      },
      {
        speaker: 'lewis',
        text: '과거의 실수는 누구에게나 있죠. 이번엔 다릅니다. 자, 어떻습니까?',
        emotion: 'confident',
      },
    ],
    choices: [
      {
        id: 'ch3-choice-2a',
        text: '거절한다',
        effect: { fundingPenalty: 30, morality: 20, thomasAffinity: 20 },
        nextSceneId: 'ch3-scene-5',
      },
      {
        id: 'ch3-choice-2b',
        text: '일단 협상한다',
        effect: { fundingBonus: 20, morality: -10 },
        nextSceneId: 'ch3-scene-5',
      },
      {
        id: 'ch3-choice-2c',
        text: '더 알아본다',
        effect: { storyFlag: 'investigate_biogen' },
        nextSceneId: 'ch3-scene-5',
      },
    ],
  },
  {
    id: 'ch3-scene-5',
    title: '선택의 무게',
    dialogues: [
      {
        speaker: 'narrator',
        text: '루이스가 떠난 후...',
        emotion: 'neutral',
      },
      {
        speaker: 'jin',
        text: '잘했어. 저자는 위험해.',
        emotion: 'relieved',
      },
      {
        speaker: 'thomas',
        text: '현명한 선택이야. 바이오젠의 목적은 무기 개발이거든. 하이브리드를 군사용으로...',
        emotion: 'serious',
      },
      {
        speaker: 'narrator',
        text: '자금 조달은 어려워지겠지만, 양심은 지킬 수 있었다.',
        emotion: 'bittersweet',
      },
    ],
    choices: [],
  },
  {
    id: 'ch3-scene-6',
    title: '첫 하이브리드',
    dialogues: [
      {
        speaker: 'jin',
        text: '하이브리드 기술을 완전히 포기할 순 없어. 하지만... 인도미누스 같은 건 안 돼.',
        emotion: 'thoughtful',
      },
      {
        speaker: 'jin',
        text: '안전하고, 아름다운 하이브리드. 스테고케라톱스.',
        emotion: 'excited',
      },
      {
        speaker: 'jin',
        text: '스테고사우루스와 트리케라톱스의 조합. 온순하고, 방어력이 높은 초식공룡.',
        emotion: 'hopeful',
      },
      {
        speaker: 'narrator',
        text: '부화장에서 첫 하이브리드 탄생. 스테고의 등판과 트리케라의 뿔을 가진 공룡.',
        emotion: 'wonder',
      },
      {
        speaker: 'jin',
        text: '이게... 우리의 새로운 시작이야.',
        emotion: 'proud',
      },
      {
        speaker: 'olivia',
        text: '아름답네요. 그날 밤의 괴물과는 달라요.',
        emotion: 'hopeful',
      },
    ],
    choices: [],
  },
];

const CHAPTER3: StoryChapter = {
  id: 'chapter-3',
  title: 'Forbidden Experiment',
  titleKo: '금지된 실험',
  order: 3,
  scenes: CHAPTER3_SCENES,
  unlockCondition: { type: 'chapter', value: 'chapter-2' },
  rewards: [
    { type: 'gold', amount: 20000 },
    { type: 'diamond', amount: 100 },
    { type: 'dinosaur', id: 'stegoceratops' },
    { type: 'building', id: 'underground-lab' },
  ],
};

// ============================================================
// 챕터 4: 심연의 비밀
// ============================================================

const CHAPTER4_SCENES: StoryScene[] = [
  {
    id: 'ch4-scene-1',
    title: '바다의 부름',
    dialogues: [
      {
        speaker: 'narrator',
        text: '해안 절벽. 주인공이 바다를 바라본다. 멀리서 거대한 물기둥이 솟아오른다.',
        emotion: 'awe',
      },
      {
        speaker: 'natalie',
        text: '저것 봤어요? 이 해역에 뭔가 있어요.',
        emotion: 'excited',
      },
      {
        speaker: 'natalie',
        text: '저는 나탈리, 해양 탐사 전문가예요. 아서 회장님이 보내셨어요.',
        emotion: 'friendly',
      },
      {
        speaker: 'narrator',
        text: '수면 위로 잠시 모습을 드러내는 거대한 지느러미.',
        emotion: 'awe',
      },
      {
        speaker: 'natalie',
        text: '모사사우루스. 바다의 왕. 15년간 이 해역을 지배해 온 거예요.',
        emotion: 'respectful',
      },
    ],
    choices: [],
  },
  {
    id: 'ch4-scene-2',
    title: '해양관 프로젝트',
    dialogues: [
      {
        speaker: 'marco',
        text: '해양관이라... 내 생애 가장 도전적인 프로젝트가 되겠군.',
        emotion: 'excited',
      },
      {
        speaker: 'naomi',
        text: '수압, 산소 공급, 온도 조절... 모든 게 완벽해야 해요. 저 거대한 생물을 담으려면.',
        emotion: 'serious',
      },
      {
        speaker: 'narrator',
        text: '건설 완료. 거대한 유리 터널 아래로 걸어가는 주인공. 푸른 물빛이 주위를 감싼다.',
        emotion: 'wonder',
      },
      {
        speaker: 'narrator',
        text: '모사사우루스가 천천히 지나간다. 15미터 길이의 거대한 그림자. 눈이 마주친다.',
        emotion: 'awe',
      },
      {
        speaker: 'natalie',
        text: '저 녀석... 우리를 받아들였어요.',
        emotion: 'relieved',
      },
    ],
    choices: [],
  },
  {
    id: 'ch4-scene-3',
    title: '해저 동굴',
    dialogues: [
      {
        speaker: 'natalie',
        text: '해안에서 1km 떨어진 곳에 거대한 해저 동굴이 있어요. 들어가 볼래요?',
        emotion: 'adventurous',
      },
      {
        speaker: 'narrator',
        text: '잠수정 탐사. 어둠 속을 나아가는 잠수정. 헤드라이트에 비치는 해저 생물들.',
        emotion: 'mysterious',
      },
      {
        speaker: 'narrator',
        text: '이크티오사우루스, 플레시오사우루스...',
        emotion: 'wonder',
      },
      {
        speaker: 'natalie',
        text: '이건...!',
        emotion: 'shocked',
      },
      {
        speaker: 'narrator',
        text: '발견: 해저 연구 기지. 수중 돔 구조물. 창문에서 희미하게 빛나는 불빛. 15년간 자동으로 운영되어 온 시설.',
        emotion: 'mysterious',
      },
      {
        speaker: 'narrator',
        text: '내부에 보존된 연구 자료. 해양 하이브리드 프로젝트. 그리고... 냉동 보관된 알.',
        emotion: 'ominous',
      },
      {
        speaker: 'narrator',
        text: '라벨: "프로젝트 리바이어던 - 시료 #7"',
        emotion: 'mysterious',
      },
      {
        speaker: 'jin',
        text: '그건... 전설이야. 우 박사가 마지막에 진행하던 프로젝트. 가져와. 조심해서.',
        emotion: 'serious',
      },
    ],
    choices: [],
  },
  {
    id: 'ch4-scene-4',
    title: '리바이어던',
    dialogues: [
      {
        speaker: 'narrator',
        text: '연구소. 냉동 알을 해동하는 닥터 진.',
        emotion: 'tense',
      },
      {
        speaker: 'jin',
        text: '모사사우루스와 고대 상어의 DNA... 그리고 뭔가 더 있어.',
        emotion: 'focused',
      },
      {
        speaker: 'jin',
        text: '부화시키면... 역사상 가장 거대한 해양 포식자가 태어나.',
        emotion: 'awed',
      },
      {
        speaker: 'thomas',
        text: '안 돼. 인도미누스 때와 똑같은 실수야. 파괴해야 해.',
        emotion: 'stern',
      },
      {
        speaker: 'jin',
        text: '과학적 가치가 있어! 이번엔 통제할 수 있어!',
        emotion: 'passionate',
      },
      {
        speaker: 'thomas',
        text: '통제? 15년 전에도 그렇게 말했지!',
        emotion: 'angry',
      },
    ],
    choices: [
      {
        id: 'ch4-choice-1a',
        text: '부화시킨다',
        effect: { leviathan: true, dangerLevel: 30 },
        nextSceneId: 'ch4-scene-5',
      },
      {
        id: 'ch4-choice-1b',
        text: '파괴한다',
        effect: { thomasAffinity: 30, safety: 20 },
        nextSceneId: 'ch4-scene-5',
      },
      {
        id: 'ch4-choice-1c',
        text: '보류한다',
        effect: { storyFlag: 'leviathan_pending' },
        nextSceneId: 'ch4-scene-5',
      },
    ],
  },
  {
    id: 'ch4-scene-5',
    title: '올리비아의 진실',
    dialogues: [
      {
        speaker: 'narrator',
        text: '밤, 해안가. 올리비아가 혼자 앉아 있다. 바다를 바라보며.',
        emotion: 'melancholy',
      },
      {
        speaker: 'olivia',
        text: '알고 있었어? 내 부모님이 어떻게 돌아가셨는지.',
        emotion: 'sad',
      },
      {
        speaker: 'olivia',
        text: '인도미누스. 그날 밤, 부모님은 날 지키려고...',
        emotion: 'grief',
      },
      {
        speaker: 'olivia',
        text: '닥터 진도 거기 있었어. 도망쳤지. 모두를 두고.',
        emotion: 'bitter',
      },
      {
        speaker: 'olivia',
        text: '하지만... 미워할 수 없어. 그도 어린 연구원이었을 뿐이야. 모두가 피해자였어.',
        emotion: 'understanding',
      },
      {
        speaker: 'olivia',
        text: '내가 이 섬에 돌아온 이유는... 복수가 아니야.',
        emotion: 'reflective',
      },
      {
        speaker: 'olivia',
        text: '이해하고 싶었어. 왜 이런 일이 일어났는지. 그리고... 용서할 수 있는지.',
        emotion: 'hopeful',
      },
    ],
    choices: [
      {
        id: 'ch4-choice-2a',
        text: '용서할 수 있을 거야.',
        effect: { oliviaAffinity: 15 },
        nextSceneId: null,
      },
      {
        id: 'ch4-choice-2b',
        text: '천천히 해도 돼.',
        effect: { oliviaAffinity: 20 },
        nextSceneId: null,
      },
      {
        id: 'ch4-choice-2c',
        text: '(조용히 옆에 앉는다)',
        effect: { oliviaAffinity: 30, storyFlag: 'silent_support' },
        nextSceneId: null,
      },
    ],
  },
];

const CHAPTER4: StoryChapter = {
  id: 'chapter-4',
  title: 'Secrets of the Deep',
  titleKo: '심연의 비밀',
  order: 4,
  scenes: CHAPTER4_SCENES,
  unlockCondition: { type: 'chapter', value: 'chapter-3' },
  rewards: [
    { type: 'gold', amount: 25000 },
    { type: 'diamond', amount: 150 },
    { type: 'dinosaur', id: 'mosasaurus' },
    { type: 'building', id: 'ocean-dome' },
    { type: 'character', id: 'natalie' },
  ],
};

// ============================================================
// 챕터 5: 폭풍 전야
// ============================================================

const CHAPTER5_SCENES: StoryScene[] = [
  {
    id: 'ch5-scene-1',
    title: '경고',
    dialogues: [
      {
        speaker: 'victor',
        text: '좋지 않아. 카테고리 4 태풍이 접근 중이야. 48시간 후 섬에 상륙 예상.',
        emotion: 'worried',
      },
      {
        speaker: 'victor',
        text: '15년 전... 그때와 같은 경로야.',
        emotion: 'ominous',
      },
      {
        speaker: 'marco',
        text: '모든 시설을 점검해야 해. 울타리, 전력 시스템, 대피소...',
        emotion: 'urgent',
      },
      {
        speaker: 'robert',
        text: '관람객은?',
        emotion: 'concerned',
      },
      {
        speaker: 'player',
        text: '전원 대피시켜야 해.',
        emotion: 'determined',
      },
    ],
    choices: [],
  },
  {
    id: 'ch5-scene-2',
    title: '배신',
    dialogues: [
      {
        speaker: 'narrator',
        text: '태풍 전날 밤. 시스템 경보.',
        emotion: 'alert',
      },
      {
        speaker: 'system',
        text: '보안 위반 감지.',
        emotion: 'alert',
      },
      {
        speaker: 'robert',
        text: '누군가 보안 시스템에 접근하고 있어!',
        emotion: 'alarmed',
      },
      {
        speaker: 'narrator',
        text: '추적 결과 - 닥터 진의 보조 연구원, 제이콥. 루이스에게 매수당한 스파이.',
        emotion: 'betrayed',
      },
      {
        speaker: 'jacob',
        text: '미안해... 그쪽에서 돈을...',
        emotion: 'guilty',
      },
      {
        speaker: 'narrator',
        text: '발견: 루이스의 진짜 목적. 태풍을 틈타 데이터 탈취, 울타리 시스템 무력화, 혼란 속 하이브리드 DNA 샘플 회수.',
        emotion: 'shocking',
      },
      {
        speaker: 'jin',
        text: '루이스 그 자식... 태풍을 이용하려는 거야.',
        emotion: 'angry',
      },
    ],
    choices: [],
  },
  {
    id: 'ch5-scene-3',
    title: '폭풍 속에서',
    dialogues: [
      {
        speaker: 'narrator',
        text: '태풍 상륙. 화면이 흔들린다. 비와 바람.',
        emotion: 'chaotic',
      },
      {
        speaker: 'system',
        text: '경고: 전력 공급 불안정. 구역 3, 7 울타리 손상. 익룡관 돔 균열.',
        emotion: 'critical',
      },
      {
        speaker: 'narrator',
        text: '여러 위기 동시 발생. 전력 복구, 울타리 수리, 탈출 공룡 진정, 데이터실 방어.',
        emotion: 'urgent',
      },
      {
        speaker: 'lewis',
        text: '늦었어. 이미 데이터는 전송됐지.',
        emotion: 'triumphant',
      },
      {
        speaker: 'lewis',
        text: '협조했으면 이렇게 안 했을 텐데.',
        emotion: 'smug',
      },
    ],
    choices: [],
  },
  {
    id: 'ch5-scene-4',
    title: '진의 참회',
    dialogues: [
      {
        speaker: 'jin',
        text: '가져가. 원하는 거 다 가져가. 하지만 이 섬은 건드리지 마.',
        emotion: 'desperate',
      },
      {
        speaker: 'lewis',
        text: '후후, 감동적이군. 15년 전에도 그렇게 비굴했지?',
        emotion: 'mocking',
      },
      {
        speaker: 'lewis',
        text: '아, 다들 모르나? 이 사람이 15년 전 인도미누스 탈출을... 연구 성과 인정받으려고 안전 프로토콜을 무시했거든.',
        emotion: 'cruel',
      },
      {
        speaker: 'olivia',
        text: '...뭐라고?',
        emotion: 'shocked',
      },
      {
        speaker: 'jin',
        text: '올리비아... 나...',
        emotion: 'guilty',
      },
      {
        speaker: 'jin',
        text: '맞아. 내 탓이야. 인정받고 싶었어. 천재 소리 듣고 싶었어.',
        emotion: 'confessing',
      },
      {
        speaker: 'jin',
        text: '그래서... 모든 걸 망쳤어. 당신 부모님도... 내 친구들도... 모두...',
        emotion: 'crying',
      },
      {
        speaker: 'jin',
        text: '미안해. 정말 미안해. 용서 안 해도 돼. 그냥... 알아줬으면 했어.',
        emotion: 'broken',
      },
      {
        speaker: 'narrator',
        text: '긴 침묵. 올리비아가 천천히 다가간다.',
        emotion: 'tense',
      },
      {
        speaker: 'olivia',
        text: '...알아. 진작부터 알고 있었어.',
        emotion: 'calm',
      },
      {
        speaker: 'olivia',
        text: '15년 동안 네가 어떻게 살았는지도. 매일 악몽에 시달리면서, 죄책감에 숨어 살면서.',
        emotion: 'understanding',
      },
      {
        speaker: 'olivia',
        text: '난 네가 미웠어. 하지만... 네가 불쌍하기도 했어.',
        emotion: 'empathetic',
      },
      {
        speaker: 'olivia',
        text: '이제 됐어. 끝내자. 과거는.',
        emotion: 'forgiving',
      },
      {
        speaker: 'lewis',
        text: '감동적이군. 하지만 비즈니스는 비즈니스야.',
        emotion: 'cold',
      },
      {
        speaker: 'narrator',
        text: '그때, 천장이 무너지며 거대한 그림자가 나타난다.',
        emotion: 'dramatic',
      },
      {
        speaker: 'narrator',
        text: '블루. 알파 랩터. 올리비아의 가장 신뢰하는 파트너.',
        emotion: 'triumphant',
      },
      {
        speaker: 'olivia',
        text: '블루...',
        emotion: 'relieved',
      },
      {
        speaker: 'narrator',
        text: '블루가 루이스를 향해 으르렁거린다. 용병들 도주. 루이스, 데이터를 떨어뜨리고 도망.',
        emotion: 'victorious',
      },
      {
        speaker: 'olivia',
        text: '착한 아이야, 블루.',
        emotion: 'warm',
      },
    ],
    choices: [],
  },
];

const CHAPTER5: StoryChapter = {
  id: 'chapter-5',
  title: 'Eve of the Storm',
  titleKo: '폭풍 전야',
  order: 5,
  scenes: CHAPTER5_SCENES,
  unlockCondition: { type: 'chapter', value: 'chapter-4' },
  rewards: [
    { type: 'gold', amount: 30000 },
    { type: 'diamond', amount: 200 },
    { type: 'building', id: 'storm-shelter' },
  ],
};

// ============================================================
// 챕터 6: 인도미누스
// ============================================================

const CHAPTER6_SCENES: StoryScene[] = [
  {
    id: 'ch6-scene-1',
    title: '그녀가 돌아왔다',
    dialogues: [
      {
        speaker: 'narrator',
        text: '태풍이 지나간 다음 날 아침. 피해 점검 중.',
        emotion: 'tired',
      },
      {
        speaker: 'robert',
        text: '이건 불가능해... 화산 지대에서 발견된 흔적...',
        emotion: 'shocked',
      },
      {
        speaker: 'robert',
        text: '인도미누스야. 15년 전 그 녀석이 살아있어.',
        emotion: 'fearful',
      },
      {
        speaker: 'jin',
        text: '불가능해! 그때 분명히...',
        emotion: 'disbelief',
      },
      {
        speaker: 'robert',
        text: '발자국, 할퀸 자국, 체온 흔적... 전부 일치해. 저 녀석, 15년간 화산 지대에 숨어 있었어.',
        emotion: 'grim',
      },
      {
        speaker: 'narrator',
        text: '원격 카메라 영상. 화산 지대 동굴 입구. 안개 사이로 보이는 거대한 흰색 실루엣. 붉은 눈이 카메라를 응시한다.',
        emotion: 'terrifying',
      },
      {
        speaker: 'thomas',
        text: '내가 경고했잖아. 저 괴물은 죽지 않아. 자연이 허락하지 않은 존재니까.',
        emotion: 'vindicated',
      },
      {
        speaker: 'olivia',
        text: '엄마, 아빠를 죽인 그 존재...',
        emotion: 'traumatized',
      },
    ],
    choices: [],
  },
  {
    id: 'ch6-scene-2',
    title: '작전 회의',
    dialogues: [
      {
        speaker: 'narrator',
        text: '작전실. 주요 인물들이 모여 있다.',
        emotion: 'serious',
      },
      {
        speaker: 'robert',
        text: '선택지는 세 가지야.',
        emotion: 'methodical',
      },
      {
        speaker: 'robert',
        text: '하나, 무력 제거. 헬기와 중화기로 사살.',
        emotion: 'cold',
      },
      {
        speaker: 'robert',
        text: '둘, 포획 후 격리. 특수 울타리와 진정제로 제압.',
        emotion: 'neutral',
      },
      {
        speaker: 'robert',
        text: '셋, 공존 시도. 올리비아가 접근해서 교감 시도.',
        emotion: 'uncertain',
      },
      {
        speaker: 'thomas',
        text: '무력 제거가 답이야. 저건 생명체가 아니야. 무기야.',
        emotion: 'adamant',
      },
      {
        speaker: 'jin',
        text: '포획이 맞아. 과학적 가치가 있어. 제대로 연구하면...',
        emotion: 'hopeful',
      },
      {
        speaker: 'olivia',
        text: '공존. 저 녀석도 희생자야. 태어나고 싶어서 태어난 게 아니잖아.',
        emotion: 'compassionate',
      },
      {
        speaker: 'olivia',
        text: '나는... 이해하고 싶어.',
        emotion: 'determined',
      },
      {
        speaker: 'robert',
        text: '결정은 자네 몫이야.',
        emotion: 'serious',
      },
    ],
    choices: [
      {
        id: 'ch6-choice-1a',
        text: '무력 제거',
        effect: { ending: 'tragic' },
        nextSceneId: 'ch6-scene-3-tragic',
      },
      {
        id: 'ch6-choice-1b',
        text: '포획 후 격리',
        effect: { ending: 'realistic' },
        nextSceneId: 'ch6-scene-3-realistic',
      },
      {
        id: 'ch6-choice-1c',
        text: '공존 시도',
        effect: { ending: 'hopeful' },
        nextSceneId: 'ch6-scene-3-hopeful',
      },
    ],
  },
  {
    id: 'ch6-scene-3-hopeful',
    title: '화산 지대 - 공존',
    dialogues: [
      {
        speaker: 'narrator',
        text: '화산 지대 접근. 올리비아가 선두에 선다. 블루와 다른 랩터들이 뒤따른다.',
        emotion: 'tense',
      },
      {
        speaker: 'olivia',
        text: '여기서부터 혼자 갈게.',
        emotion: 'calm',
      },
      {
        speaker: 'player',
        text: '위험해!',
        emotion: 'worried',
      },
      {
        speaker: 'olivia',
        text: '알아. 하지만 이건 내가 해야 해. 15년간 기다려 온 순간이야.',
        emotion: 'resolute',
      },
      {
        speaker: 'narrator',
        text: '올리비아, 동굴로 진입. 어둠 속에서 빛나는 붉은 눈.',
        emotion: 'terrifying',
      },
      {
        speaker: 'narrator',
        text: '천천히 모습을 드러내는 인도미누스 렉스. 12미터 높이. 하얀 비늘, 날카로운 발톱. 15년 전과 달라진 것 - 몸 곳곳의 흉터.',
        emotion: 'awe',
      },
      {
        speaker: 'olivia',
        text: '...너도 많이 아팠구나.',
        emotion: 'compassionate',
      },
      {
        speaker: 'narrator',
        text: '인도미누스가 으르렁거린다.',
        emotion: 'threatening',
      },
      {
        speaker: 'olivia',
        text: '알아. 무서워하는 거지. 평생 숨어 살았으니까.',
        emotion: 'understanding',
      },
      {
        speaker: 'olivia',
        text: '나도 그랬어. 네가 무서웠어. 미웠어.',
        emotion: 'honest',
      },
      {
        speaker: 'olivia',
        text: '하지만... 지금은 달라.',
        emotion: 'gentle',
      },
      {
        speaker: 'olivia',
        text: '우리 둘 다 그날 밤의 피해자야. 너는 선택의 여지없이 태어났고, 나는 선택의 여지없이 남겨졌어.',
        emotion: 'empathetic',
      },
      {
        speaker: 'olivia',
        text: '이제 새로운 선택을 하자. 함께 살아가는 선택을.',
        emotion: 'hopeful',
      },
      {
        speaker: 'narrator',
        text: '올리비아가 천천히 손을 뻗는다. 긴장되는 순간.',
        emotion: 'breathless',
      },
      {
        speaker: 'narrator',
        text: '인도미누스가 천천히 고개를 숙인다. 올리비아의 손이 그 코에 닿는다.',
        emotion: 'miraculous',
      },
      {
        speaker: 'narrator',
        text: '접촉. 인도미누스가 눈을 감는다. 처음 느끼는... 따뜻함.',
        emotion: 'touching',
      },
      {
        speaker: 'olivia',
        text: '...괜찮아. 이제 괜찮아.',
        emotion: 'crying',
      },
      {
        speaker: 'jin',
        text: '저게... 가능한 거야?',
        emotion: 'amazed',
      },
      {
        speaker: 'thomas',
        text: '...믿을 수 없군.',
        emotion: 'stunned',
      },
    ],
    choices: [],
  },
  {
    id: 'ch6-scene-3-realistic',
    title: '화산 지대 - 격리',
    dialogues: [
      {
        speaker: 'narrator',
        text: '특수 부대와 함께 화산 지대 접근. 강력한 진정제와 특수 장비 준비.',
        emotion: 'tense',
      },
      {
        speaker: 'robert',
        text: '목표 포착. 진정제 발사!',
        emotion: 'commanding',
      },
      {
        speaker: 'narrator',
        text: '격렬한 저항 끝에 인도미누스 제압. 특수 격리 시설로 이송.',
        emotion: 'relieved',
      },
      {
        speaker: 'jin',
        text: '이제 제대로 연구할 수 있어. 이번엔 실수하지 않겠어.',
        emotion: 'determined',
      },
      {
        speaker: 'olivia',
        text: '...저 녀석, 평생 갇혀 살아야 하는 거야?',
        emotion: 'sad',
      },
      {
        speaker: 'thomas',
        text: '이것이 최선의 선택이었어. 완벽하진 않지만.',
        emotion: 'resigned',
      },
    ],
    choices: [],
  },
  {
    id: 'ch6-scene-3-tragic',
    title: '화산 지대 - 제거',
    dialogues: [
      {
        speaker: 'narrator',
        text: '무장 헬기 출동. 화산 지대 폭격.',
        emotion: 'grim',
      },
      {
        speaker: 'robert',
        text: '목표 제거 완료.',
        emotion: 'professional',
      },
      {
        speaker: 'olivia',
        text: '...이게 정말 옳은 선택이었을까?',
        emotion: 'doubtful',
      },
      {
        speaker: 'thomas',
        text: '자연의 질서를 바로잡은 거야. 이것이 옳았어.',
        emotion: 'justified',
      },
      {
        speaker: 'jin',
        text: '...미안해. 너를 만든 건 우리였는데...',
        emotion: 'guilty',
      },
    ],
    choices: [],
  },
];

const CHAPTER6: StoryChapter = {
  id: 'chapter-6',
  title: 'Indominus',
  titleKo: '인도미누스',
  order: 6,
  scenes: CHAPTER6_SCENES,
  unlockCondition: { type: 'chapter', value: 'chapter-5' },
  rewards: [
    { type: 'gold', amount: 50000 },
    { type: 'diamond', amount: 300 },
    { type: 'dinosaur', id: 'indominus-rex' },
  ],
};

// ============================================================
// 에필로그
// ============================================================

const EPILOGUE_SCENES: StoryScene[] = [
  {
    id: 'epilogue-scene-hopeful',
    title: '희망의 새벽',
    dialogues: [
      {
        speaker: 'narrator',
        text: '6개월 후. 파크 전경. 초원에서 평화롭게 풀을 뜯는 초식공룡들. 하늘을 나는 익룡들.',
        emotion: 'peaceful',
      },
      {
        speaker: 'narrator',
        text: '해양관에서 헤엄치는 모사사우루스. 그리고... 특별 구역에서 조용히 쉬고 있는 인도미누스 렉스.',
        emotion: 'serene',
      },
      {
        speaker: 'narrator',
        text: '올리비아가 옆에서 책을 읽고 있다. 인도미누스가 눈을 뜨고 올리비아를 바라본다. 더 이상 적대적이지 않은, 평온한 눈빛.',
        emotion: 'warm',
      },
      {
        speaker: 'narrator',
        text: '파크 입구. "다이노 파크 타이쿤: 그랜드 오픈" 수천 명의 관람객. 아이들의 환호성.',
        emotion: 'joyful',
      },
      {
        speaker: 'arthur',
        text: '해냈군. 내가 꿈꿨던 것 이상이야.',
        emotion: 'proud',
      },
      {
        speaker: 'arthur',
        text: '공룡과 인간이 공존하는 세상. 불가능하다고 생각했는데...',
        emotion: 'moved',
      },
      {
        speaker: 'arthur',
        text: '자네 덕분이야. 내 유산은 이 섬이 아니었어. 자네 같은 사람을 찾는 것. 꿈을 이어갈 사람을.',
        emotion: 'grateful',
      },
      {
        speaker: 'arthur',
        text: '이제 이 섬은 자네 거야. 잘 부탁하네.',
        emotion: 'warm',
      },
      {
        speaker: 'player',
        text: '15년간 닫혀 있던 문이 열렸다. 과거의 실수는 되돌릴 수 없지만, 미래는 우리가 만들어 갈 수 있다.',
        emotion: 'hopeful',
      },
      {
        speaker: 'player',
        text: '이 섬은 더 이상 "잃어버린 세계"가 아니다. 새로운 시작. 공존의 증거. 그리고... 우리 모두의 집.',
        emotion: 'triumphant',
      },
    ],
    choices: [],
  },
  {
    id: 'epilogue-scene-realistic',
    title: '새장 속 평화',
    dialogues: [
      {
        speaker: 'narrator',
        text: '6개월 후. 파크는 성공적으로 운영 중. 하지만 한쪽에는 철저히 격리된 구역.',
        emotion: 'bittersweet',
      },
      {
        speaker: 'narrator',
        text: '인도미누스는 특수 격리 시설에서 혼자 지내고 있다.',
        emotion: 'sad',
      },
      {
        speaker: 'arthur',
        text: '이것도 하나의 답이야. 완벽하지 않지만... 현실적인 답이지.',
        emotion: 'accepting',
      },
      {
        speaker: 'olivia',
        text: '가끔 저 녀석을 보러 와요. 눈을 마주치면... 외로워 보여요.',
        emotion: 'melancholy',
      },
      {
        speaker: 'player',
        text: '우리는 최선의 선택을 했다. 완벽하지 않더라도.',
        emotion: 'reflective',
      },
    ],
    choices: [],
  },
  {
    id: 'epilogue-scene-tragic',
    title: '필요악',
    dialogues: [
      {
        speaker: 'narrator',
        text: '6개월 후. 파크는 안전하게 운영 중. 하지만 무언가 부족한 느낌.',
        emotion: 'hollow',
      },
      {
        speaker: 'thomas',
        text: '이것이 옳은 선택이었어. 자연의 질서를 바로잡은 거야.',
        emotion: 'firm',
      },
      {
        speaker: 'olivia',
        text: '...정말 그럴까요?',
        emotion: 'doubtful',
      },
      {
        speaker: 'jin',
        text: '우리가 만들고, 우리가 없앴어. 이게 인간이 할 일인지...',
        emotion: 'regretful',
      },
      {
        speaker: 'player',
        text: '때로는 어려운 결정을 내려야 한다. 그것이 리더의 책임이다.',
        emotion: 'resolved',
      },
    ],
    choices: [],
  },
];

const EPILOGUE: StoryChapter = {
  id: 'epilogue',
  title: 'Epilogue',
  titleKo: '에필로그',
  order: 7,
  scenes: EPILOGUE_SCENES,
  unlockCondition: { type: 'chapter', value: 'chapter-6' },
  rewards: [
    { type: 'gold', amount: 100000 },
    { type: 'diamond', amount: 500 },
    { type: 'title', id: 'park-master' },
  ],
};

// ============================================================
// 전체 스토리 챕터 배열
// ============================================================

export const STORY_CHAPTERS: StoryChapter[] = [
  PROLOGUE,
  CHAPTER1,
  CHAPTER2,
  CHAPTER3,
  CHAPTER4,
  CHAPTER5,
  CHAPTER6,
  EPILOGUE,
];

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * ID로 챕터 조회
 */
export function getChapterById(id: string): StoryChapter | undefined {
  return STORY_CHAPTERS.find((chapter) => chapter.id === id);
}

/**
 * 순서로 챕터 조회
 */
export function getChapterByOrder(order: number): StoryChapter | undefined {
  return STORY_CHAPTERS.find((chapter) => chapter.order === order);
}

/**
 * 챕터 내 씬 조회
 */
export function getSceneById(
  chapterId: string,
  sceneId: string
): StoryScene | undefined {
  const chapter = getChapterById(chapterId);
  return chapter?.scenes.find((scene) => scene.id === sceneId);
}

/**
 * 총 씬 수 계산
 */
export function getTotalSceneCount(): number {
  return STORY_CHAPTERS.reduce(
    (total, chapter) => total + chapter.scenes.length,
    0
  );
}

/**
 * 총 선택지 수 계산
 */
export function getTotalChoiceCount(): number {
  return STORY_CHAPTERS.reduce((total, chapter) => {
    return (
      total +
      chapter.scenes.reduce((sceneTotal, scene) => {
        return sceneTotal + (scene.choices?.length || 0);
      }, 0)
    );
  }, 0);
}

// ============================================================
// 스토리 통계
// ============================================================

export const STORY_STATS = {
  totalChapters: STORY_CHAPTERS.length,
  totalScenes: getTotalSceneCount(),
  totalChoices: getTotalChoiceCount(),
  mainStoryChapters: 6,
  hasMultipleEndings: true,
  endingCount: 3,
};
