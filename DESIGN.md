---
name: "다이노 파크 타이쿤"
description: "기존 파크 세계관과 공룡 도감의 실제 구현에서 추출한 시각·상호작용 기준"
colors:
  primary: "#4caf50"
  secondary: "#ffc107"
  accent: "#00bcd4"
  codex-ink: "#193c2b"
  codex-muted: "#526859"
  codex-line: "#ccdacd"
  codex-ground: "#f6f9f3"
  codex-surface: "#fff"
  codex-action: "#275f37"
  codex-collected: "#eaf4df"
  codex-control-line: "#acbfad"
  codex-focus: "#28743f"
  codex-rarity-common-bg: "#ecefeb"
  codex-rarity-common-ink: "#435045"
  codex-rarity-uncommon-bg: "#ddedce"
  codex-rarity-uncommon-ink: "#285725"
  codex-rarity-rare-bg: "#e3edff"
  codex-rarity-rare-ink: "#234d8b"
  codex-rarity-epic-bg: "#f0e5fa"
  codex-rarity-epic-ink: "#69327e"
  codex-rarity-legendary-bg: "#fff0cc"
  codex-rarity-legendary-ink: "#865313"
typography:
  display:
    fontFamily: "Nunito, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "clamp(22px, 2.3vw, 30px)"
    fontWeight: 800
    lineHeight: 1.35
  title:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.3
  section:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 700
  body:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "14px"
    lineHeight: 1.8
  label:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  badge:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  badge: "6px"
  control: "10px"
  shell: "12px"
  card: "14px"
  pill: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  codex-action:
    backgroundColor: "{colors.codex-action}"
    textColor: "{colors.codex-surface}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  codex-search:
    backgroundColor: "{colors.codex-surface}"
    textColor: "{colors.codex-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
  codex-select:
    backgroundColor: "{colors.codex-surface}"
    textColor: "{colors.codex-ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "44px"
  codex-origin-filter:
    textColor: "#3b5944"
    rounded: "{rounded.pill}"
    padding: "0 15px"
  codex-origin-filter-selected:
    backgroundColor: "{colors.codex-action}"
    textColor: "{colors.codex-surface}"
    rounded: "{rounded.pill}"
    padding: "0 15px"
  codex-rarity-common:
    backgroundColor: "{colors.codex-rarity-common-bg}"
    textColor: "{colors.codex-rarity-common-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 8px"
  codex-card:
    backgroundColor: "{colors.codex-surface}"
    textColor: "{colors.codex-ink}"
    rounded: "{rounded.card}"
    padding: "12px"
  codex-card-collected:
    backgroundColor: "{colors.codex-collected}"
    textColor: "{colors.codex-ink}"
    rounded: "{rounded.card}"
    padding: "12px"
  shell-nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.codex-surface}"
    rounded: "{rounded.shell}"
    padding: "4px"
---

# Design System: 다이노 파크 타이쿤

## Overview

**Creative North Star: "파크 안의 수집 안내서"**

녹색 파크, 둥근 카툰 공룡, Pretendard와 Nunito가 현행 게임의 시각적 기반이다. 이 문서는 그 기반을 유지하면서 완성한 공룡 도감의 밝은 목록·읽기 화면을 기록한다. 도감은 진한 녹색 글자와 옅은 녹색 바탕, 흰 읽기 면으로 내용을 구분한다. 색과 그림은 공룡을 찾고 수집 상태를 이해하는 일을 돕는다.

적용 범위는 기존 공통 셸의 팔레트·서체와 `/dinosaur` 도감의 구현이다. `codex-` 토큰, 읽기 패널, 카드, 필터 규칙은 도감 범위다. 다른 게임 화면의 배치까지 새로 정한 기록으로 해석하지 않는다. 토큰은 현행 소스의 반복값을 추출한 문서이며 별도 런타임 설정을 추가하지 않는다.

제품·수치의 권한은 [CLAUDE.md](CLAUDE.md)와 [문서 안내](docs/README.md)를 따른다. 게임 범위는 [game-design.md](docs/current/game-design.md), 운영 수치는 [balance.md](docs/current/balance.md), 획득·레시피 규칙은 [dna-and-collection.md](docs/current/dna-and-collection.md), 자원·생산 규칙은 [resources-and-production.md](docs/current/resources-and-production.md)가 소유한다. 실제 화면의 수치와 상태는 API 및 공유 game-data가 공급한다. 이 문서는 게임 규칙이나 수치를 복제하지 않는다.

**Key Characteristics:**
- 기존 게임 셸과 녹색 정체성을 이어가는 도감.
- 목록 탐색과 상세 읽기가 분명한 정보 위계.
- 수집·보유·등급·계보를 글자로도 구분하는 상태 표현.
- 작은 화면에서 하나의 읽기 화면에 집중하는 전환.

## Colors

기존 게임의 녹색을 유지하고, 도감에서는 흰 면과 옅은 녹색을 넓게 사용해 내용의 대비를 확보한다. 정확한 값은 frontmatter가 소유한다.

### Primary
- **파크 그린** (`primary`): 기존 공통 액션·하단 활성 메뉴의 녹색. Tailwind의 현행 primary 램프를 유지한다.
- **도감 액션 그린** (`codex-action`): 선택된 계보 필터와 재시도·필터 초기화 액션.
- **도감 포커스 그린** (`codex-focus`): 키보드 포커스와 검색 필드의 포커스 경계.

### Secondary
- **골드** (`secondary`): 기존 게임 재화·시작 화면에 연결된 노란색 역할. 도감의 선택 색으로 확대하지 않는다.

### Tertiary
- **다이아몬드 시안** (`accent`): 기존 다이아몬드 재화 역할.

### Neutral
- **숲색 잉크** (`codex-ink`): 도감 제목·본문·중요 정보.
- **부드러운 숲색** (`codex-muted`): 보조 설명·단위·상태 라벨.
- **옅은 녹색 바탕** (`codex-ground`): 목록과 필터의 바탕.
- **흰 읽기 면** (`codex-surface`): 상세 본문·입력 필드·미수집 카드.
- **녹색 구분선** (`codex-line`, `codex-control-line`): 영역 구분과 조작 필드의 테두리.
- **수집 연두** (`codex-collected`): 수집 완료 카드의 면. 선택 테두리는 별도 상태로 유지한다.

등급 배지는 `codex-rarity-*-bg`와 `codex-rarity-*-ink`를 짝으로 사용한다. 일반은 회녹색, 고급은 녹색, 희귀는 파랑, 영웅은 보라, 전설은 금색이다. 공통 Tailwind의 등급 글자색과 도감의 배경·글자색 조합은 각각의 소스를 따른다.

sidecar의 명도 램프는 미리보기용이다. 기존 primary·secondary 램프는 Tailwind 값을 사용하고 나머지는 파생 명도이며, 새 UI의 색상 값으로 자동 승격하지 않는다.

**The State in Words Rule.** 등급·계보·수집 상태는 화면의 텍스트와 접근 가능한 설명으로 함께 남긴다. 색, 실루엣, 선택 외곽선만으로 상태를 전달하지 않는다.

## Typography

**Display Font:** Nunito, sans-serif — 기존 시작·로딩·스토리 제목의 표시 서체.
**Body Font:** Pretendard, sans-serif — 도감 전체와 게임의 한국어 UI.

**Character:** 둥근 영문 표시 서체와 읽기 쉬운 한국어 UI 서체의 기존 조합을 유지한다. 도감 제목도 Pretendard를 사용하며, 영문 학명과 보조 정보의 크기를 낮춰 한국어 이름이 먼저 읽힌다.

### Hierarchy
- **Display:** 기존 게임 진입 제목에 쓰이는 `typography.display`. 도감에 대형 브랜드 제목을 추가하는 근거로 사용하지 않는다.
- **Headline:** 상세 공룡 이름의 `typography.headline`. 긴 이름은 한국어 어절을 우선 보존하고 필요한 경우 줄바꿈한다.
- **Title:** 도감 화면 제목의 `typography.title`.
- **Section:** 상세의 서식지·획득 방법·레시피 제목에 쓰이는 `typography.section`.
- **Body:** 설명과 상세 문단의 `typography.body`. 설명 문단의 최대 폭은 (65ch).
- **Label / Badge:** 조작 필드 라벨과 등급 배지를 구분한다. 카드 이름은 본문 크기에 굵기를 더하고, 보조 이름·계보는 한 단계 작게 둔다.

**The Reading First Rule.** 상세의 한국어 이름, 설명, 사실, 획득·레시피 순서를 타이포그래피로 드러낸다. 숫자는 수집 진행·사실·재료 표에서 고정폭 숫자 형태를 사용한다.

## Layout

공통 셸은 화면 높이를 채우는 세로 구조다. 위쪽의 프로필·재화 바와 아래쪽 메뉴 사이에 콘텐츠를 둔다. 도감이 차지하는 영역 안에서 목록과 상세가 각각 스크롤되며, 페이지 전체의 스크롤로 셸을 밀어내지 않는다.

도감의 넓은 화면에서는 제목·수집 진행 다음에 검색·등급·수집 상태와 계보 필터를 둔다. 아래 작업 영역은 목록 (`1fr`)과 상세 (`0.9fr`, 최소 폭 360px)로 나뉜다. 목록은 기본 두 열이며, 화면 폭 (1400px)부터 세 열이다. 카드 간격에는 `spacing.md`, 일반 바깥 여백에는 `spacing.xl`, 읽기 본문에는 `spacing.xxl`을 사용한다.

화면 폭 (899px) 이하에서는 검색을 독립된 줄에, 등급·수집 상태를 나란히 둔다. 목록은 두 열을 유지한다. 항목을 명시적으로 선택하면 제목·필터·목록을 숨기고 같은 상세 패널을 전체 읽기 영역으로 표시한다. 목록으로 돌아가는 버튼과 공통 셸은 유지한다. 이 전환은 모달이 아니며 별도 중복 상세를 만들지 않는다.

도감의 반응형 구조와 방문 목적은 [도감 surface brief](.impeccable/surfaces/lient-src-features-dinosaur-pages-dinosaurpage-tsx.md)에 한정한다.

`/park`에서는 공통 셸 안에 작은 운영 패널, 남은 높이를 채우는 아이소메트릭 지도, 지도 작업 메뉴를 세로로 둔다. 배치 중에는 운영 패널 자리를 배치 안내·취소·확정 영역이 대신한다. 화면 폭 (600px) 이하에서는 운영 지표의 라벨과 값을 위아래로 놓고 패널 여백을 줄인다. 지도는 최초 표시 때 저장된 파크 크기를 화면에 맞추며, 전체 보기와 최소 (44px) 확대·축소 버튼을 제공한다. 이 화면의 배치·경계·상태 규칙은 [파크 surface brief](.impeccable/surfaces/apps-client-src-features-park-pages-parkpage-tsx.md)에 한정한다.

## Elevation & Depth

도감은 평면의 밝은 면, 얇은 구분선, 상태별 바탕으로 깊이를 만든다. 카드의 호버는 면과 선 색을 바꾸고, 선택은 안쪽 외곽선으로 표시한다. 기존 공통 셸의 반투명 어두운 바·배경 흐림·프로필 그림자는 셸의 구현으로 유지된다.

**The Flat Reader Rule.** 도감의 카드와 읽기 면에는 그림자를 추가하지 않는다. 구분선은 목록·상세 및 본문 섹션의 실제 경계를 드러내는 데 사용한다.

카드의 색 전환은 (150ms)이며 이동·확대 효과를 넣지 않는다. 줄인 동작 설정에서는 이 전환을 제거한다. 공통 메뉴의 활성 배경은 기존 spring 전환을 유지한다. 세부 값과 포커스 선은 `.impeccable/design.json`에 기록한다.

## Shapes

둥근 모서리의 정도를 역할에 따라 구분한다. 등급 배지는 `rounded.badge`, 검색·선택 필드와 도감 액션은 `rounded.control`, 공통 활성 메뉴는 `rounded.shell`, 목록 카드는 `rounded.card`, 계보 필터는 `rounded.pill`을 사용한다. 상세 본문은 추가 카드에 넣지 않고 넓은 흰 면으로 이어진다.

입력 필드와 목록 카드는 얇은 테두리를 사용한다. 공룡 그림은 비율을 보존하고 잘라내지 않는다. 기존 시작 공룡과 룩스 SVG는 같은 viewBox·크기·바닥 기준점을 공유한다.

## Components

### Buttons

재시도와 빈 결과 복구에는 채운 도감 액션을 사용한다. 새로고침은 이름이 있는 아이콘 버튼, 원종 이동은 밑줄 텍스트 버튼이다. 도감의 일반 조작 영역은 최소 높이 (44px), 모바일 목록 복귀 버튼은 최소 높이 (48px)를 유지한다. 모든 도감 조작에는 보이는 포커스 경계가 있다. 새로고침 중에는 버튼을 비활성화한다.

### Chips / Badges

계보 필터는 감싼 버튼 행이며 `aria-pressed`로 선택을 드러낸다. 선택은 진한 녹색 면과 흰 글자, 호버는 옅은 녹색 면이다. 등급 배지는 작은 사각 배지로 구분하고, 자연종·변종·하이브리드의 계보 라벨을 등급 옆에 별도로 둔다.

### Cards / Containers

카드는 등급·계보, 그림, 한국어 이름, 수집·보유 상태의 순서다. 수집 완료 면과 선택 외곽선을 독립적으로 적용한다. 카드의 접근 가능한 이름은 상세 보기 목적을 말하고, `aria-describedby`는 등급·계보·수집 상태를 연결한다. 카드의 기본 패딩은 frontmatter의 `codex-card`이며, 작은 화면에서는 (10px)로 줄인다.

### Inputs / Fields

검색은 돋보기와 이름이 있는 검색 입력으로 구성한다. 등급·수집 상태는 명시적 라벨과 native select를 사용한다. 흰 면과 제어용 테두리를 유지하며, 검색 필드 전체는 `focus-within`으로 표시한다. 결과가 없으면 원인을 설명하고 전체 목록으로 복구하는 액션을 제공한다.

### Navigation

기존 상단 프로필·재화 바와 하단 메뉴를 이어 쓴다. 하단 메뉴는 균등한 너비의 항목, 현재 경로의 녹색 활성 면, 작은 텍스트 라벨로 구성한다. 링크는 native 경로 탐색과 현재 페이지 의미를 유지한다. 셸의 이모지 아이콘은 현행 구현의 보존 범위이며 재사용 아이콘 체계로 채택하지 않는다. sidecar의 메뉴 예시는 레이블과 활성 면만 추출한다.

### Collection Reader

상세는 그림·보유 상태, 등급·계보, 한국어·영문 이름, 설명, 사실, 서식지, 획득 방법, 합성 레시피 순서다. 명시적 항목·원종 선택으로 대상이 바뀌면 두 화면 크기 모두 읽기 패널을 맨 위로 되돌리고 제목에 포커스를 옮긴다. 모바일의 목록 복귀 또는 Escape는 직전에 선택한 카드로 포커스를 복원한다.

목록의 미수집 항목은 실루엣으로, 상세의 알려진 이미지는 수집 여부와 무관하게 정상 미리보기로 보여준다. 실물 이미지가 없는 종은 분류별 선 그림을 사용한다. 실제 아트 범위와 임시 자산 교체 규약은 [placeholder README](apps/client/public/assets/placeholders/README.md)와 실물 SVG를 따른다.

레시피는 원종 이동과 현재 보유 상태, 재료·최소 품질·수량 표, 서버가 공급하는 연구 정보를 읽는 구조다. 숫자는 오른쪽 정렬과 고정폭 숫자를 사용한다. 미개방 연구는 예정 안내로 표시하며 실행 버튼을 만들지 않는다. 미정 정보는 미정 상태를 유지한다. 로딩은 status, 불러오기 실패는 alert와 재시도, 필터 결과 수는 status로 전달한다.

### Park Operations

운영 패널은 옅은 녹색 면과 아래 구분선 위에 개장 상태·개장/휴장 조작, 입장 지표, 현재 목표와 필요한 액션 하나를 놓는다. 목표 아래에는 정원·예상 입장·유지비를 작은 글자로 표시한다. 개장 준비가 부족하면 이유를 글자로 연결하고, 저장·건설 대기·골드 부족은 해당 조작의 비활성 상태로 드러낸다. 운영 지표는 API의 실제 집계이며 화면 속 보행자 수와 구별한다. 목표·가격·보상·건설 시간은 API와 공유 game-data를 읽고 이 문서에 수치로 복제하지 않는다.

지도는 기존 잔디·공룡·서식지·게이트 SVG의 아이소메트릭 세계를 유지한다. 저장된 파크 크기의 바깥 울타리는 개별 공룡 서식지 울타리와 구별하고 입구 위치를 비워 연결한다. 개장/휴장 때는 같은 게이트의 열린/닫힌 SVG와 텍스트 라벨을 함께 바꾼다. 관람길과 방문객은 서버 상태를 따라 그리며 방문객 연출은 재화를 지급하지 않는다.

입구 이동과 관람대 건설은 지도 미리보기 뒤 확정·취소로 마무리한다. 지도 클릭과 방향키·Enter·Escape를 함께 지원하고, 유효성·저장 중·실패 상태를 글자로 전달한다. 기존 시설을 보존하며 기존 입구를 경계의 다른 유효 위치로 무료로 옮기는 조작도 같은 흐름을 따른다. 새 아트 방향이나 다른 화면의 배치 규칙으로 확대하지 않는다.

## Do's and Don'ts

### Do:
- **Do** 공통 셸의 녹색·서체를 유지하고 도감 전용 토큰은 도감에 적용한다.
- **Do** 선택·수집·현재 보유 상태를 각각의 면·선·텍스트로 표현한다.
- **Do** 상세 선택 시 스크롤 초기화·제목 포커스·목록 복귀의 연결을 함께 유지한다.
- **Do** API·공유 데이터의 실제 상태를 읽고 예정·미정 정보를 그대로 표시한다.
- **Do** 그림의 비율과 placeholder의 기준점을 유지한다.

### Don't:
- **Don't** 도감의 밝은 읽기 구조를 다른 게임 화면의 의무 레이아웃으로 확대한다.
- **Don't** 계보를 등급 색상에 합치거나 색·실루엣만으로 상태를 전달한다.
- **Don't** 도감 카드에 입체 그림자·호버 이동·반복 확대 효과를 추가한다.
- **Don't** 임시 분류 선 그림이나 셸의 이모지를 최종 종별 아트·아이콘 체계로 정한다.
- **Don't** 게임 수치·레시피를 이 문서에 복제하거나 예정 연구를 실행 가능한 기능처럼 표시한다.
