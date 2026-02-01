# 🎵 다이노 파크 타이쿤 - 사운드 & 음악 가이드
## Sound Design & Music Guide v1.0

---

# 📋 목차

1. [사운드 디자인 철학](#1-사운드-디자인-철학)
2. [음악 컨셉](#2-음악-컨셉)
3. [BGM 목록](#3-bgm-목록)
4. [효과음 분류](#4-효과음-분류)
5. [공룡 사운드 시스템](#5-공룡-사운드-시스템)
6. [환경음](#6-환경음)
7. [UI/UX 사운드](#7-uiux-사운드)
8. [스토리 연출 사운드](#8-스토리-연출-사운드)
9. [적응형 오디오 시스템](#9-적응형-오디오-시스템)
10. [기술 사양](#10-기술-사양)

---

# 1. 사운드 디자인 철학

## 1.1 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **몰입감** | 플레이어가 진짜 공룡 섬에 있는 듯한 느낌 |
| **정서적 연결** | 공룡과 캐릭터에 감정 이입 유도 |
| **피드백** | 모든 액션에 명확한 청각적 반응 |
| **편안함** | 장시간 플레이해도 피로하지 않은 사운드 |
| **브랜드 정체성** | 다이노 파크만의 시그니처 사운드 |

## 1.2 사운드 무드

```
[사운드 무드 스펙트럼]

긴장감 ◄──────────────────────────────► 평화로움
        │                            │
        ├─ 위기 이벤트                ├─ 평상시 파크
        ├─ 탈출 사고                  ├─ 초식 공룡 구역
        ├─ 보스전                     ├─ 힐링 정원
        └─ 스토리 클라이맥스          └─ 해변/밤

장엄함 ◄──────────────────────────────► 귀여움
        │                            │
        ├─ 대형 공룡 등장             ├─ 아기 공룡
        ├─ 스토리 감동 장면           ├─ 캐릭터 대화
        ├─ 전설 공룡 해금             ├─ 수집 완료
        └─ 엔딩 크레딧               └─ UI 인터랙션
```

## 1.3 참고 레퍼런스

| 작품 | 참고 요소 |
|------|----------|
| **쥬라기 공원 OST** | 장엄함, 공포, 경이로움 |
| **젤다 야생의 숨결** | 환경음, 적응형 음악 |
| **동물의 숲** | 귀여운 UI 사운드, 편안함 |
| **Alto's Odyssey** | 몽환적 앰비언트 |
| **Monument Valley** | 미니멀 + 감성적 |

---

# 2. 음악 컨셉

## 2.1 음악 스타일

### 메인 스타일: 오케스트라 + 일렉트로닉 하이브리드

```
[레이어 구성]

Layer 1: 오케스트라 기반
├── 현악 (Strings) - 감정선
├── 목관 (Woodwinds) - 자연의 신비
├── 금관 (Brass) - 장엄함, 위기
└── 타악기 (Percussion) - 리듬, 긴장

Layer 2: 일렉트로닉 요소
├── 신스 패드 (Synth Pad) - 몽환적 분위기
├── 플럭 (Pluck) - 귀여운 포인트
├── 베이스 (Bass) - 무게감
└── 아르페지오 (Arpeggio) - 진행감

Layer 3: 민속/월드 뮤직
├── 퍼커션 (World Percussion) - 원시적 느낌
├── 플루트/피리 (Ethnic Flute) - 신비로움
└── 합창 (Choir) - 장엄한 순간
```

## 2.2 감정 팔레트

| 감정 | 악기/기법 | 사용 상황 |
|------|----------|----------|
| **경이로움** | 현악 트레몰로 + 합창 | 공룡 첫 발견 |
| **평화로움** | 어쿠스틱 기타 + 피아노 | 평상시 파크 |
| **긴장감** | 저음 현악 + 타악 | 탈출 이벤트 |
| **슬픔** | 솔로 피아노 + 첼로 | 이별 장면 |
| **희망** | 현악 상승 + 하프 | 스토리 해결 |
| **귀여움** | 마림바 + 플럭 | 아기 공룡 |
| **모험** | 금관 + 스네어 | 탐험 시작 |
| **미스터리** | 피아노 아르페지오 + 패드 | 비밀 발견 |

## 2.3 시그니처 사운드

### 메인 테마 모티프

```
[메인 테마 - "공룡의 섬" 모티프]

   4/4 | D Major | ♩=100 BPM

   │ D    │ A/C# │ Bm   │ G    │
   │ ♩ ♩ ♫│ ♪ ♫ ♩│ ♩ ♩ ♪│ 𝄽 ♩ ♪│
   
   멜로디: D - F# - A - B - A - G - F# - E - D
   
   ※ 이 모티프가 게임 전체에 변주되어 등장
```

### 시그니처 요소

| 요소 | 설명 | 사용 |
|------|------|------|
| **공룡 발자국 리듬** | 쿵-쿵-쿵 (느린 3연음) | 대형 공룡 테마 |
| **새소리 트릴** | 플루트 트릴 | 평화로운 순간 |
| **미스터리 화음** | Dm7 → Em7 → F△7 | 비밀 발견 |
| **승리 팡파레** | D → A → D (옥타브) | 업적 달성 |

---

# 3. BGM 목록

## 3.1 메인 BGM (11곡)

### 🏠 파크 테마

| ID | 제목 | 분위기 | 길이 | 사용 |
|----|------|--------|------|------|
| **BGM-001** | "Welcome to Dino Park" | 밝음, 기대감 | 3:30 | 파크 메인 화면 (낮) |
| **BGM-002** | "Twilight Safari" | 차분함, 낭만 | 4:00 | 파크 메인 화면 (저녁) |
| **BGM-003** | "Moonlit Sanctuary" | 평화, 신비 | 4:30 | 파크 메인 화면 (밤) |

### 🌴 구역별 테마

| ID | 제목 | 분위기 | 길이 | 사용 |
|----|------|--------|------|------|
| **BGM-004** | "Gentle Giants" | 평화, 웅장 | 3:00 | 초식 공룡 구역 |
| **BGM-005** | "Predator's Domain" | 긴장, 카리스마 | 3:30 | 육식 공룡 구역 |
| **BGM-006** | "Wings of the Past" | 자유, 경이 | 3:00 | 익룡 돔 |
| **BGM-007** | "Ocean Depths" | 신비, 몽환 | 4:00 | 해양관 |

### 🗺️ 탐험 테마

| ID | 제목 | 분위기 | 길이 | 사용 |
|----|------|--------|------|------|
| **BGM-008** | "Into the Unknown" | 모험, 기대 | 3:00 | 탐험 중 |
| **BGM-009** | "Volcanic Pressure" | 긴장, 위험 | 2:30 | 화산 지대 탐험 |
| **BGM-010** | "Frozen Echoes" | 고독, 신비 | 3:00 | 빙하 지대 탐험 |

### 🎪 이벤트 테마

| ID | 제목 | 분위기 | 길이 | 사용 |
|----|------|--------|------|------|
| **BGM-011** | "Dino Show Time!" | 흥겨움, 서커스 | 2:00 | 공룡 쇼 |

## 3.2 스토리 BGM (15곡)

### 📖 챕터별 테마

| ID | 제목 | 챕터 | 분위기 | 길이 |
|----|------|------|--------|------|
| **BGM-S01** | "A New Beginning" | 프롤로그 | 희망, 신비 | 2:30 |
| **BGM-S02** | "First Steps" | 챕터 1 | 호기심, 탐험 | 3:00 |
| **BGM-S03** | "The Hunter Returns" | 챕터 2 | 긴장, 위기 | 3:30 |
| **BGM-S04** | "Forbidden Research" | 챕터 3 | 불안, 미스터리 | 4:00 |
| **BGM-S05** | "Secrets of the Deep" | 챕터 4 | 신비, 발견 | 3:30 |
| **BGM-S06** | "Storm Approaching" | 챕터 5 | 긴박, 결의 | 3:00 |
| **BGM-S07** | "Indominus" | 챕터 6 | 장엄, 공포, 희망 | 5:00 |

### 🎭 감정 테마

| ID | 제목 | 분위기 | 사용 |
|----|------|--------|------|
| **BGM-E01** | "Bonds" | 따뜻함, 우정 | 캐릭터 호감도 이벤트 |
| **BGM-E02** | "Farewell" | 슬픔, 그리움 | 이별/비극 장면 |
| **BGM-E03** | "Revelation" | 충격, 미스터리 | 진실 공개 |
| **BGM-E04** | "Confrontation" | 대립, 긴장 | 악역 대면 |
| **BGM-E05** | "Hope Rising" | 희망, 결의 | 역전 장면 |

### 🏆 엔딩 테마

| ID | 제목 | 엔딩 | 분위기 | 길이 |
|----|------|------|--------|------|
| **BGM-END01** | "Dawn of Coexistence" | 희망의 새벽 | 장엄, 감동 | 4:00 |
| **BGM-END02** | "Peaceful Cage" | 새장 속 평화 | 비터스윗 | 3:30 |
| **BGM-END03** | "Necessary Sacrifice" | 필요악 | 씁쓸, 평화 | 3:30 |
| **BGM-END04** | "True Heir" | 히든 엔딩 | 감동, 장엄 | 5:00 |

## 3.3 UI/메뉴 BGM (5곡)

| ID | 제목 | 분위기 | 사용 |
|----|------|--------|------|
| **BGM-UI01** | "Title Theme" | 장엄, 기대 | 타이틀 화면 |
| **BGM-UI02** | "Collection Room" | 평화, 성취 | 도감/컬렉션 |
| **BGM-UI03** | "Research Lab" | 집중, 신비 | 연구소 메뉴 |
| **BGM-UI04** | "Staff Room" | 따뜻함 | 위인 관리 |
| **BGM-UI05** | "Shop Street" | 활기 | 상점 |

## 3.4 시즌/이벤트 BGM (시즌별 추가)

| 시즌 | 테마 | 분위기 |
|------|------|--------|
| **봄** | 벚꽃 축제 | 화사, 경쾌 |
| **여름** | 해변 파티 | 트로피컬, 신남 |
| **가을** | 할로윈 | 유령의 집, 재미 |
| **겨울** | 크리스마스 | 따뜻함, 축제 |

---

# 4. 효과음 분류

## 4.1 효과음 카테고리

```
[SFX 분류 체계]

SFX/
├── UI/              # UI 인터랙션 사운드
│   ├── Button/      # 버튼 클릭
│   ├── Popup/       # 팝업 등장/퇴장
│   ├── Tab/         # 탭 전환
│   └── Feedback/    # 성공/실패/알림
│
├── Dino/            # 공룡 관련 사운드
│   ├── Voice/       # 울음소리
│   ├── Movement/    # 움직임
│   ├── Eating/      # 먹는 소리
│   └── Action/      # 행동 (잠, 놀기 등)
│
├── Building/        # 건물 관련
│   ├── Construct/   # 건설
│   ├── Upgrade/     # 업그레이드
│   └── Operate/     # 가동 사운드
│
├── Gameplay/        # 게임플레이
│   ├── Tap/         # 탭 액션
│   ├── Collect/     # 수집
│   ├── Achieve/     # 달성
│   └── Event/       # 이벤트
│
├── Ambient/         # 환경음
│   ├── Nature/      # 자연 (바람, 물, 새)
│   ├── Weather/     # 날씨
│   └── Park/        # 파크 (관광객, 차량)
│
└── Story/           # 스토리 연출
    ├── Cinematic/   # 시네마틱 효과
    ├── Emotion/     # 감정 강조
    └── Transition/  # 전환 효과
```

## 4.2 UI 효과음 상세

### 버튼/터치

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-UI-001 | Button_Click | 일반 버튼 클릭 | button_click.wav |
| SFX-UI-002 | Button_Confirm | 확인/결정 버튼 | button_confirm.wav |
| SFX-UI-003 | Button_Cancel | 취소 버튼 | button_cancel.wav |
| SFX-UI-004 | Button_Back | 뒤로가기 | button_back.wav |
| SFX-UI-005 | Tab_Switch | 탭 전환 | tab_switch.wav |
| SFX-UI-006 | Slider_Move | 슬라이더 이동 | slider_move.wav |
| SFX-UI-007 | Toggle_On | 토글 켜기 | toggle_on.wav |
| SFX-UI-008 | Toggle_Off | 토글 끄기 | toggle_off.wav |

### 팝업/모달

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-UI-010 | Popup_Open | 팝업 열기 | popup_open.wav |
| SFX-UI-011 | Popup_Close | 팝업 닫기 | popup_close.wav |
| SFX-UI-012 | Modal_Slide | 모달 슬라이드 | modal_slide.wav |
| SFX-UI-013 | Menu_Expand | 메뉴 확장 | menu_expand.wav |

### 피드백

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-UI-020 | Success_Ding | 성공 알림 | success_ding.wav |
| SFX-UI-021 | Error_Buzz | 실패/에러 | error_buzz.wav |
| SFX-UI-022 | Warning_Bell | 경고 | warning_bell.wav |
| SFX-UI-023 | Notification | 알림 | notification.wav |
| SFX-UI-024 | Level_Up | 레벨업 팡파레 | level_up.wav |
| SFX-UI-025 | Achievement | 업적 달성 | achievement.wav |
| SFX-UI-026 | Reward_Open | 보상 획득 | reward_open.wav |

## 4.3 게임플레이 효과음

### 수집/획득

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-GP-001 | Coin_Collect | 골드 수집 | coin_collect.wav |
| SFX-GP-002 | Gem_Collect | 다이아 수집 | gem_collect.wav |
| SFX-GP-003 | DNA_Collect | DNA 획득 | dna_collect.wav |
| SFX-GP-004 | Item_Pickup | 아이템 획득 | item_pickup.wav |
| SFX-GP-005 | Fossil_Discover | 화석 발견 | fossil_discover.wav |

### 건설/건물

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-GP-010 | Build_Place | 건물 배치 | build_place.wav |
| SFX-GP-011 | Build_Hammer | 건설 중 | build_hammer.wav |
| SFX-GP-012 | Build_Complete | 건설 완료 | build_complete.wav |
| SFX-GP-013 | Upgrade_Start | 업그레이드 시작 | upgrade_start.wav |
| SFX-GP-014 | Upgrade_Complete | 업그레이드 완료 | upgrade_complete.wav |

### 공룡 관련 게임플레이

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-GP-020 | Egg_Hatch_Start | 부화 시작 | egg_hatch_start.wav |
| SFX-GP-021 | Egg_Crack | 알 깨지는 소리 | egg_crack.wav |
| SFX-GP-022 | Egg_Hatch_Complete | 부화 완료 | egg_hatch_complete.wav |
| SFX-GP-023 | Feed_Give | 먹이 주기 | feed_give.wav |
| SFX-GP-024 | Pet_Stroke | 쓰다듬기 | pet_stroke.wav |
| SFX-GP-025 | Photo_Snap | 사진 촬영 | photo_snap.wav |

### 탐험

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-GP-030 | Explore_Start | 탐험 출발 | explore_start.wav |
| SFX-GP-031 | Explore_Footstep | 발걸음 | explore_footstep.wav |
| SFX-GP-032 | Explore_Discover | 발견 | explore_discover.wav |
| SFX-GP-033 | Explore_Complete | 탐험 완료 | explore_complete.wav |
| SFX-GP-034 | Map_Open | 지도 펼치기 | map_open.wav |

### 이벤트

| ID | 이름 | 설명 | 파일 |
|----|------|------|------|
| SFX-GP-040 | Event_Alert | 이벤트 알림 | event_alert.wav |
| SFX-GP-041 | Escape_Warning | 탈출 경고 | escape_warning.wav |
| SFX-GP-042 | Escape_Siren | 탈출 사이렌 | escape_siren.wav |
| SFX-GP-043 | Crisis_Resolved | 위기 해결 | crisis_resolved.wav |
| SFX-GP-044 | Visitor_Cheer | 관광객 환호 | visitor_cheer.wav |

---

# 5. 공룡 사운드 시스템

## 5.1 공룡 카테고리별 사운드 컨셉

### 🦕 초식 공룡

| 특성 | 사운드 컨셉 |
|------|-----------|
| **음역대** | 중저음 ~ 중음 |
| **특징** | 부드럽고 온화한 울음 |
| **참고** | 코끼리, 소, 고래 |

### 🦖 육식 공룡

| 특성 | 사운드 컨셉 |
|------|-----------|
| **음역대** | 저음 ~ 중저음 |
| **특징** | 위협적, 날카로움 |
| **참고** | 사자, 악어, 호랑이 |

### 🦅 익룡

| 특성 | 사운드 컨셉 |
|------|-----------|
| **음역대** | 고음 ~ 중음 |
| **특징** | 날카로운 울음, 날개짓 |
| **참고** | 독수리, 박쥐, 펠리컨 |

### 🦈 해양 파충류

| 특성 | 사운드 컨셉 |
|------|-----------|
| **음역대** | 저음 (물속 울림) |
| **특징** | 에코, 수중 왜곡 |
| **참고** | 고래, 돌고래, 물개 |

## 5.2 공룡별 사운드 리스트 (대표 종)

### 브라키오사우루스 (초식 대표)

| ID | 이름 | 설명 |
|----|------|------|
| SFX-D-BRA-001 | Brachio_Call_01 | 일반 울음소리 |
| SFX-D-BRA-002 | Brachio_Call_Long | 긴 울음 (인사) |
| SFX-D-BRA-003 | Brachio_Happy | 기쁨 표현 |
| SFX-D-BRA-004 | Brachio_Eat | 나뭇잎 먹기 |
| SFX-D-BRA-005 | Brachio_Walk | 걸음 (쿵쿵) |
| SFX-D-BRA-006 | Brachio_Sleep | 잠자는 숨소리 |

### 티라노사우루스 (육식 대표)

| ID | 이름 | 설명 |
|----|------|------|
| SFX-D-TRX-001 | TRex_Roar_01 | 기본 포효 |
| SFX-D-TRX-002 | TRex_Roar_Distant | 먼 거리 포효 |
| SFX-D-TRX-003 | TRex_Growl | 으르렁 |
| SFX-D-TRX-004 | TRex_Hunt | 사냥 소리 |
| SFX-D-TRX-005 | TRex_Stomp | 발걸음 (진동) |
| SFX-D-TRX-006 | TRex_Eat | 먹는 소리 |

### 프테라노돈 (익룡 대표)

| ID | 이름 | 설명 |
|----|------|------|
| SFX-D-PTR-001 | Ptero_Screech | 기본 울음 |
| SFX-D-PTR-002 | Ptero_Call | 동료 부름 |
| SFX-D-PTR-003 | Ptero_Wing_Flap | 날개짓 |
| SFX-D-PTR-004 | Ptero_Dive | 급강하 |
| SFX-D-PTR-005 | Ptero_Land | 착지 |

### 모사사우루스 (해양 대표)

| ID | 이름 | 설명 |
|----|------|------|
| SFX-D-MOS-001 | Mosa_Call | 기본 울음 (수중) |
| SFX-D-MOS-002 | Mosa_Surface | 수면 위로 |
| SFX-D-MOS-003 | Mosa_Dive | 잠수 |
| SFX-D-MOS-004 | Mosa_Eat | 먹이 사냥 |
| SFX-D-MOS-005 | Mosa_Splash | 물보라 |

### 인도미누스 렉스 (하이브리드 보스)

| ID | 이름 | 설명 |
|----|------|------|
| SFX-D-IND-001 | Indo_Roar_Intro | 등장 포효 (5초) |
| SFX-D-IND-002 | Indo_Roar_Power | 파워 포효 |
| SFX-D-IND-003 | Indo_Growl_Low | 낮은 으르렁 |
| SFX-D-IND-004 | Indo_Cloak | 위장 활성화 |
| SFX-D-IND-005 | Indo_Walk | 위압적 발걸음 |
| SFX-D-IND-006 | Indo_Calm | 진정 상태 |

## 5.3 상태별 사운드 시스템

```
[공룡 상태 사운드 매핑]

상태           │ 사운드 유형
───────────────┼──────────────────────
기본 (IDLE)    │ _Idle, _Breath
행복 (HAPPY)   │ _Happy, _Chirp
배고픔 (HUNGRY)│ _Hungry, _Whine
스트레스       │ _Stress, _Growl
아픔 (SICK)    │ _Sick, _Weak
수면 (SLEEP)   │ _Sleep, _Snore
놀이 (PLAY)    │ _Play, _Excited
먹기 (EAT)     │ _Eat, _Chew
이동 (WALK)    │ _Walk, _Footstep
달리기 (RUN)   │ _Run, _Sprint
```

---

# 6. 환경음

## 6.1 자연 환경음

### 시간대별

| 시간대 | 주요 요소 | 분위기 |
|--------|----------|--------|
| **낮** | 새소리, 곤충, 바람 | 활기참 |
| **저녁** | 매미, 귀뚜라미, 저녁노을 | 차분함 |
| **밤** | 풀벌레, 부엉이, 밤바람 | 고요함 |

### 날씨별

| 날씨 | 주요 요소 | 파일 |
|------|----------|------|
| **맑음** | 새소리 + 미풍 | weather_clear.wav |
| **흐림** | 바람 + 낮은 새소리 | weather_cloudy.wav |
| **비** | 빗소리 + 천둥 | weather_rain.wav |
| **폭풍** | 강풍 + 번개 | weather_storm.wav |
| **눈** | 바람 + 고요 | weather_snow.wav |

## 6.2 구역별 환경음

### 초원/사바나

```
[Ambient Layer - Grassland]

Layer 1 (Base): 바람 소리, 풀 스치는 소리
Layer 2 (Life): 새소리, 곤충
Layer 3 (Dino): 초식공룡 울음 (먼 거리)
```

### 정글/삼림

```
[Ambient Layer - Jungle]

Layer 1 (Base): 나뭇잎 바스락, 습한 공기
Layer 2 (Life): 열대 새, 원숭이 (먼 거리)
Layer 3 (Water): 계곡물 소리 (옵션)
Layer 4 (Dino): 랩터 울음 (먼 거리)
```

### 해안/해변

```
[Ambient Layer - Beach]

Layer 1 (Base): 파도, 모래바람
Layer 2 (Life): 갈매기, 바닷새
Layer 3 (Dino): 익룡 울음 (먼 거리)
```

### 해양관

```
[Ambient Layer - Aquarium]

Layer 1 (Base): 수중 울림, 기포
Layer 2 (Muffled): 외부 소리 먹먹하게
Layer 3 (Dino): 해양파충류 울음 (에코)
```

### 화산 지대

```
[Ambient Layer - Volcano]

Layer 1 (Base): 용암 부글, 열기
Layer 2 (Danger): 암석 무너짐, 가스 분출
Layer 3 (Dino): 대형 육식공룡 포효 (먼 거리)
```

## 6.3 파크 환경음

| 요소 | 설명 | 파일 |
|------|------|------|
| **관광객 웅성** | 멀리서 들리는 대화 | crowd_murmur.wav |
| **아이들 웃음** | 놀이터 근처 | children_laugh.wav |
| **사파리 차량** | 지나가는 소리 | safari_car.wav |
| **분수** | 물 떨어지는 소리 | fountain.wav |
| **안내방송** | 파크 안내 | announce_loop.wav |

---

# 7. UI/UX 사운드

## 7.1 인터랙션 사운드 설계

### 버튼 터치 피드백

```
[버튼 사운드 레이어]

Primary Button (확인, 구매 등)
├── Attack: 짧은 "띵" (하이)
├── Body: 가벼운 "퉁" (미드)
└── Release: 미세한 에코

Secondary Button (취소, 닫기)
├── Attack: 부드러운 "틱"
└── Body: 낮은 톤

Disabled Button
└── 먹먹한 "툭" (볼륨 -6dB)
```

### 성공/실패 피드백

| 상황 | 사운드 컨셉 | 요소 |
|------|-----------|------|
| **성공** | 밝고 경쾌 | 글로켄슈필 상승 |
| **대성공** | 화려한 팡파레 | 금관 + 심벌 |
| **실패** | 낮고 짧음 | 저음 "뿡" |
| **에러** | 경고음 | 불협화음 짧게 |
| **경고** | 주의 환기 | 벨 2회 |

## 7.2 화면 전환 사운드

| 전환 | 설명 | 사운드 |
|------|------|--------|
| **메인 → 파크** | 게임 진입 | 짧은 팡파레 + 새소리 |
| **파크 → 메뉴** | 메뉴 열기 | 부드러운 스와이프 |
| **화면 슬라이드** | 좌우 전환 | 우쉬~ (swoosh) |
| **팝업 등장** | 모달 오픈 | 퐁 (pop) + 슬라이드 |
| **컬렉션 열기** | 도감 진입 | 책 넘기는 소리 |

## 7.3 보상/획득 사운드

### 보상 등급별

| 등급 | 사운드 특징 | 길이 |
|------|-----------|------|
| **커먼** | 단순 "짤랑" | 0.5초 |
| **언커먼** | "짤랑" + 작은 심벌 | 0.8초 |
| **레어** | 상승 아르페지오 | 1.2초 |
| **에픽** | 오케스트라 스팅 | 1.5초 |
| **레전더리** | 풀 팡파레 + 합창 | 2.5초 |

### 특수 획득

| 상황 | 사운드 |
|------|--------|
| **공룡 부화** | 알 깨짐 + 아기 울음 + 반짝임 |
| **신규 공룡 발견** | 미스터리 화음 + 등장 음 |
| **위인 영입** | 인사 팡파레 + 발걸음 |
| **업적 달성** | 메달 획득 + 환호 |

---

# 8. 스토리 연출 사운드

## 8.1 컷신 사운드 카테고리

### 감정 강조 (Stinger)

| ID | 이름 | 사용 상황 |
|----|------|----------|
| STING-001 | Shock_Reveal | 충격적 진실 공개 |
| STING-002 | Heartfelt | 감동적 순간 |
| STING-003 | Tension_Rise | 긴장 고조 |
| STING-004 | Resolution | 해결/안도 |
| STING-005 | Danger_Close | 위험 임박 |
| STING-006 | Hope_Spark | 희망 싹트다 |

### 시네마틱 효과

| ID | 이름 | 설명 |
|----|------|------|
| CIN-001 | Time_Slow | 슬로모션 (저음 울림) |
| CIN-002 | Flashback_In | 회상 진입 |
| CIN-003 | Flashback_Out | 회상 종료 |
| CIN-004 | Scene_Fade | 장면 전환 |
| CIN-005 | Impact_Big | 큰 충격/폭발 |
| CIN-006 | Heartbeat | 심장 박동 |

## 8.2 캐릭터 보이스 가이드라인

### 주인공 (플레이어)

```
[Voice Direction]
성별: 선택 가능 (남/여)
톤: 밝고 호기심 많음, 용감함
이모티콘 스타일: 가벼운 감탄사
예시: "와!", "음...", "그렇군!", "잠깐!"
```

### 닥터 진

```
[Voice Direction]
성별: 남성
톤: 열정적, 약간 과학자 느낌, 따뜻함
이모티콘 스타일: 학구적, 감탄
예시: "놀라워!", "이론적으로...", "드디어!"
```

### 마르코

```
[Voice Direction]
성별: 남성
톤: 활달, 낙천적, 유쾌함
이모티콘 스타일: 감탄, 농담
예시: "하하!", "걱정 마!", "내가 해결해볼게!"
```

### 올리비아

```
[Voice Direction]
성별: 여성
톤: 차분하고 전문적, 공룡에 대한 애정
이모티콘 스타일: 진지, 부드러움
예시: "조심해.", "괜찮아, 애들아.", "믿어."
```

## 8.3 대사 연출

### 텍스트 표시 사운드

| 상황 | 사운드 |
|------|--------|
| **일반 대화** | 가벼운 타이핑 (톡톡톡) |
| **강조 대사** | 타이핑 + 끝에 강조음 |
| **속삭임** | 부드러운 타이핑 (낮은 볼륨) |
| **외침** | 빠른 타이핑 + 임팩트 |
| **생각** | 에코 효과 + 느린 타이핑 |

---

# 9. 적응형 오디오 시스템

## 9.1 다이내믹 음악 시스템

### 레이어 기반 음악

```
[Music Layer System]

Layer 0: Ambient Pad (항상 재생)
    │
Layer 1: Main Melody (상황에 따라)
    │    ├── Calm: 평화로운 멜로디
    │    ├── Active: 활동적 멜로디
    │    └── Tense: 긴장 멜로디
    │
Layer 2: Rhythm Section (활동도에 따라)
    │    ├── None: 리듬 없음 (0%)
    │    ├── Light: 가벼운 리듬 (1~30%)
    │    └── Full: 풀 리듬 (30%+)
    │
Layer 3: Accent (이벤트 시)
         ├── Success: 성공 악센트
         ├── Danger: 위험 악센트
         └── Discover: 발견 악센트
```

### 트리거 조건

| 트리거 | 음악 변화 |
|--------|----------|
| 건물 건설 중 | Layer 2 활성화 |
| 공룡 탈출 | 긴장 모드 전환 |
| 희귀 공룡 발견 | 발견 악센트 |
| 스토리 이벤트 | 스토리 BGM 전환 |
| AFK 5분 | Layer 1, 2 페이드 아웃 |

## 9.2 시간대 음악 전환

```
[Time-based Music Transition]

05:00 - 07:00: Dawn (새벽)
    └── BGM 페이드: Night → Morning
    └── 새소리 증가

07:00 - 17:00: Day (낮)
    └── BGM-001 "Welcome to Dino Park"
    └── 풀 레이어 활성

17:00 - 19:00: Evening (저녁)
    └── BGM 페이드: Day → Evening
    └── BGM-002 "Twilight Safari"

19:00 - 05:00: Night (밤)
    └── BGM 페이드: Evening → Night
    └── BGM-003 "Moonlit Sanctuary"
    └── 레이어 2 비활성화
```

## 9.3 사운드 오클루전

### 실내/실외 전환

```
[Occlusion System]

실외 (Open Air)
├── 환경음: 100%
├── 리버브: Room (작은 공간감)
└── 공룡 소리: 100%

실내 (Building/Cave)
├── 환경음: 30% (머플드)
├── 리버브: Hall (큰 공간감)
└── 공룡 소리: 50% (먼 느낌)

수중 (Underwater)
├── 환경음: 물속 왜곡
├── 리버브: 큰 에코
├── 로우패스 필터: 2kHz
└── 공룡 소리: 에코 처리
```

---

# 10. 기술 사양

## 10.1 오디오 포맷

| 용도 | 포맷 | 비트레이트 | 샘플레이트 |
|------|------|-----------|-----------|
| **BGM** | AAC/OGG | 192kbps | 44.1kHz |
| **SFX** | WAV/OGG | 256kbps | 44.1kHz |
| **Voice** | AAC | 128kbps | 44.1kHz |
| **Ambient** | OGG (루프) | 128kbps | 44.1kHz |

## 10.2 용량 예산

| 카테고리 | 예상 용량 | 파일 수 |
|----------|----------|---------|
| BGM | 80MB | ~40곡 |
| SFX | 40MB | ~500개 |
| 공룡 사운드 | 50MB | ~400개 |
| 환경음 | 20MB | ~50개 |
| Voice | 30MB | ~200개 |
| **총합** | **~220MB** | |

## 10.3 스트리밍 전략

```
[Audio Streaming Strategy]

초기 로딩 (필수):
├── UI SFX (5MB)
├── 기본 BGM 1곡 (3MB)
└── 핵심 공룡 사운드 (10MB)
= 약 18MB

백그라운드 다운로드:
├── 나머지 BGM (77MB)
├── 나머지 SFX (25MB)
├── 환경음 (20MB)
└── 스토리 사운드 (30MB)
= 약 152MB (플레이 중 다운로드)

On-Demand:
├── 특수 이벤트 BGM
├── 시즌 사운드
└── 콜라보 사운드
= 필요 시 다운로드
```

## 10.4 오디오 미들웨어

### 권장 미들웨어

| 옵션 | 장점 | 단점 |
|------|------|------|
| **FMOD** | 강력한 기능, 무료 Tier | 러닝 커브 |
| **Wwise** | 업계 표준 | 라이선스 비용 |
| **Unity Native** | 별도 연동 불필요 | 기능 제한 |

### 권장: FMOD (인디 라이선스 무료)

## 10.5 오디오 믹싱 가이드

### 채널 볼륨 밸런스

| 채널 | 기본 볼륨 | 상대적 크기 |
|------|----------|------------|
| Master | 0dB | - |
| BGM | -6dB | 60% |
| SFX | -3dB | 80% |
| 공룡 | -4dB | 70% |
| 환경음 | -9dB | 40% |
| Voice | 0dB | 100% |
| UI | -2dB | 85% |

### 덕킹 (Ducking) 설정

```
[Ducking Rules]

트리거: 중요 대사 재생 시
├── BGM: -6dB (500ms fade)
├── 환경음: -9dB (500ms fade)
└── 공룡: -3dB (300ms fade)

트리거: 컷신 재생 시
├── BGM: 전환 또는 -12dB
├── SFX: -6dB
└── 환경음: Mute
```

---

# 📊 사운드 체크리스트

## 제작 우선순위

### Phase 1: 필수 (런칭 전)

- [ ] 메인 테마 BGM (3곡: 낮/저녁/밤)
- [ ] UI 기본 SFX (20개)
- [ ] 주요 공룡 사운드 (20종 × 5개 = 100개)
- [ ] 기본 환경음 (5종)
- [ ] 튜토리얼 음성/사운드

### Phase 2: 핵심 (런칭 후 1개월)

- [ ] 구역별 BGM (4곡)
- [ ] 탐험 BGM (3곡)
- [ ] 추가 공룡 사운드 (30종)
- [ ] 스토리 BGM (챕터 1~3)
- [ ] 이벤트 SFX

### Phase 3: 확장 (런칭 후 3개월)

- [ ] 스토리 BGM (챕터 4~6)
- [ ] 엔딩 BGM (4곡)
- [ ] 전체 공룡 사운드 (82종)
- [ ] 시즌 BGM
- [ ] 캐릭터 보이스 (옵션)

---

*다이노 파크 타이쿤 - 사운드 & 음악 가이드 v1.0*
*작성일: 2026년 1월*
