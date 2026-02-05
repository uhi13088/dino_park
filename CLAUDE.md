# CLAUDE.md - 다이노 파크 타이쿤 자동 개발 가이드

> **이 파일은 Claude Code가 자동으로 읽고 따르는 프로젝트 컨텍스트입니다.**
> **모든 개발 작업에서 이 규칙을 준수하고, 매 작업 완료 후 자동 검증을 수행하세요.**

---

# 🎯 프로젝트 개요

| 항목           | 내용                                     |
| -------------- | ---------------------------------------- |
| **프로젝트명** | 다이노 파크 타이쿤 (Dino Park Tycoon)    |
| **플랫폼**     | 토스 앱스 (Toss Apps)                    |
| **장르**       | 타이쿤/경영 시뮬레이션 + 방치형 + 스토리 |
| **목표**       | 8개월 개발, MAU 300K                     |

---

# 🔄 작업 관리 (TASK.md)

> **TASK.md가 모든 작업의 유일한 진실(Single Source of Truth)입니다.**

## 작업 흐름

```
┌─────────┐     ┌──────────────┐     ┌──────┐
│  QUEUE  │ ──► │ IN_PROGRESS  │ ──► │ DONE │
└─────────┘     └──────────────┘     └──────┘
                       │
                       ▼ (실패/불명확)
                ┌─────────┐
                │ BLOCKED │ ← 사람 개입 필요
                └─────────┘
```

## 규칙

1. **한 번에 1개 티켓만** IN_PROGRESS
2. **AC(Acceptance Criteria)** 기준으로 완료 판단
3. **완료 즉시** DONE으로 이동 + 기록
4. **막히면** BLOCKED로 이동 + 사용자에게 보고

## 커스텀 명령어

| 명령어      | 설명                                        |
| ----------- | ------------------------------------------- |
| `/next`     | QUEUE 최상단 티켓 작업 시작                 |
| `/status`   | 현재 프로젝트 상태 요약                     |
| `/validate` | 전체 검증 (typecheck + lint + test + build) |
| `/pr`       | PR 설명 자동 생성                           |

---

# 📚 필수 참조 문서

> ⚠️ **모든 개발 작업 전에 관련 문서를 반드시 확인하세요.**

| 문서                   | 경로                                                  | 핵심 용도                              |
| ---------------------- | ----------------------------------------------------- | -------------------------------------- |
| **GDD**                | `docs/dino_park_tycoon_gdd.md`                        | 전체 기획, 기능 명세, 시스템 규칙      |
| **밸런스**             | `docs/dino_park_balance_simulation.md`                | 모든 수치, 공식, 경제 설정             |
| **UI/UX**              | `docs/dino_park_ui_art_guide.md`                      | 화면 구조, 컴포넌트, 플로우            |
| **공룡 도감**          | `docs/dino_park_dinosaur_codex.md`                    | 공룡 82종 상세 스펙                    |
| **위인 도감**          | `docs/dino_park_great_figures.md`                     | 위인 50명 상세 스펙, 시너지            |
| **스토리**             | `docs/dino_park_story_scenario.md`                    | 스토리 6챕터, 전체 대사                |
| **기술 설계**          | `docs/dino_park_technical_design.md`                  | 아키텍처, DB, API 설계                 |
| **사운드**             | `docs/dino_park_sound_guide.md`                       | BGM 31곡, SFX 500개                    |
| **수익 모델**          | `docs/dino_park_revenue_model.md`                     | IAP 상품, 가격, ARPU                   |
| **시즌**               | `docs/dino_park_season_content.md`                    | 시즌 1~4 스토리, 보상                  |
| **액션 플랜**          | `docs/dino_park_action_plan.md`                       | 개발 순서, Phase별 작업                |
| **UI & 아트 가이드**   | `docs/dino_park_ui_art_guide.md`                      | 픽셀 설계, 와이어프레임, 그래픽 스타일 |
| **에셋 - 메인**        | `docs/assets/dino_park_asset_main.md`                 | 마스터 스타일, Placeholder             |
| **에셋 - 공룡**        | `docs/assets/dino_park_asset_dinosaurs.md`            | 공룡 82종 + AI 프롬프트                |
| **에셋 - 건물/캐릭터** | `docs/assets/dino_park_asset_buildings_characters.md` | 건물 50종, 위인 50명, 환경, UI         |

### 문서 참조 규칙

```
[어떤 문서를 볼지 결정하는 로직]

공룡 기능 개발 → 공룡 도감 + 밸런스 + GDD
건물 기능 개발 → GDD + 밸런스
위인 기능 개발 → 위인 도감 + 밸런스
경제 시스템 개발 → 밸런스 + 수익 모델
스토리 개발 → 스토리 시나리오
시즌 개발 → 시즌 콘텐츠
UI 개발 → UI/UX 와이어프레임
API 개발 → 기술 설계
사운드 개발 → 사운드 가이드
```

### 🚨 문서 충돌 시 우선순위

> **문서 간 수치/내용이 다를 경우, 아래 우선순위를 따르세요.**

```
Level 1: 데이터 원천 (최우선)
├── 공룡 도감 → 공룡 수치의 정본
├── 위인 도감 → 위인 수치의 정본
├── 스토리 시나리오 → 스토리 내용의 정본
└── 시즌 콘텐츠 → 시즌 내용의 정본

Level 2: 시스템 정의
├── GDD → 게임 규칙의 정본
├── 밸런스 → 경제 수치의 정본
└── 기술 설계 → DB/API의 정본

Level 3: 구현 가이드
├── UI/UX → 화면 구조의 정본
├── 사운드 → BGM/SFX의 정본
└── 수익 모델 → 가격의 정본

Level 4: 개발 가이드
├── CLAUDE.md → 코드 규칙의 정본
└── 액션 플랜 → 개발 순서의 정본
```

**충돌 예시:**

- 공룡 수익이 GDD와 공룡 도감에서 다름 → **공룡 도감** 우선
- 시즌 위인 수가 액션 플랜과 시즌 콘텐츠에서 다름 → **시즌 콘텐츠** 우선

---

# 🔧 기술 스택

```yaml
Frontend (apps/client):
  framework: React 18 + TypeScript 5
  build: Vite
  gameEngine: PixiJS 8
  state: Zustand
  serverState: TanStack Query v5
  styling: TailwindCSS + Framer Motion
  router: React Router 6

Backend (apps/server):
  runtime: Node.js 20 LTS
  framework: NestJS 10 + TypeScript 5
  orm: Prisma 5
  database: PostgreSQL 15
  cache: Redis 7
  realtime: Socket.IO

Shared (packages/shared):
  - 공유 타입 정의
  - 공유 상수
  - 공유 유틸리티

GameData (packages/game-data):
  - 공룡 데이터 (82종)
  - 건물 데이터
  - 위인 데이터 (50명)
  - 스토리 데이터
  - 밸런스 상수
```

---

# 📁 프로젝트 구조

```
dino-park-tycoon/
├── apps/
│   ├── client/                    # React 프론트엔드
│   │   └── src/
│   │       ├── components/        # 공통 UI
│   │       │   ├── ui/            # 기본 컴포넌트
│   │       │   └── layout/        # 레이아웃
│   │       ├── features/          # 기능별 모듈
│   │       │   ├── park/
│   │       │   ├── dinosaur/
│   │       │   ├── building/
│   │       │   ├── exploration/
│   │       │   ├── story/
│   │       │   ├── greatFigure/
│   │       │   ├── economy/
│   │       │   ├── shop/
│   │       │   ├── social/
│   │       │   └── season/
│   │       ├── game/              # PixiJS 엔진
│   │       ├── stores/            # Zustand
│   │       ├── hooks/
│   │       ├── api/
│   │       └── types/
│   │
│   └── server/                    # NestJS 백엔드
│       ├── src/
│       │   ├── modules/           # 기능별 모듈
│       │   │   ├── auth/
│       │   │   ├── user/
│       │   │   ├── park/
│       │   │   ├── dinosaur/
│       │   │   ├── building/
│       │   │   ├── exploration/
│       │   │   ├── story/
│       │   │   ├── greatFigure/
│       │   │   ├── economy/
│       │   │   ├── shop/
│       │   │   ├── social/
│       │   │   └── season/
│       │   ├── common/
│       │   └── prisma/
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── shared/
│   │   ├── types/                 # ⭐ 모든 타입의 원천
│   │   ├── constants/
│   │   └── utils/
│   └── game-data/
│       ├── dinosaurs/
│       ├── buildings/
│       ├── greatFigures/
│       ├── stories/
│       └── balance/
│
├── docs/                          # 기획 문서 (11개)
└── CLAUDE.md                      # 이 파일
```

---

# 🏷️ 네이밍 컨벤션

## 파일명

| 대상            | 규칙                        | 예시                     |
| --------------- | --------------------------- | ------------------------ |
| 컴포넌트        | PascalCase.tsx              | `DinosaurCard.tsx`       |
| 훅              | use + PascalCase.ts         | `useDinosaur.ts`         |
| 스토어          | use + PascalCase + Store.ts | `useDinosaurStore.ts`    |
| 유틸리티        | camelCase.ts                | `calculateRevenue.ts`    |
| 타입            | camelCase.types.ts          | `dinosaur.types.ts`      |
| 상수            | camelCase.constants.ts      | `balance.constants.ts`   |
| NestJS 서비스   | kebab-case.service.ts       | `dinosaur.service.ts`    |
| NestJS 컨트롤러 | kebab-case.controller.ts    | `dinosaur.controller.ts` |

## 변수/함수명

| 대상            | 규칙                  | 예시                                  |
| --------------- | --------------------- | ------------------------------------- |
| 변수            | camelCase             | `dinosaurList`, `parkLevel`           |
| 함수            | camelCase (동사 시작) | `getDinosaur()`, `calculateRevenue()` |
| 상수            | UPPER_SNAKE_CASE      | `MAX_LEVEL`, `BASE_REVENUE`           |
| 타입/인터페이스 | PascalCase            | `Dinosaur`, `DinosaurStats`           |
| Enum            | PascalCase            | `DinosaurCategory`                    |
| Enum 값         | UPPER_SNAKE_CASE      | `HERBIVORE`, `LEGENDARY`              |

## 도메인 용어 통일표

> ⚠️ **필수**: 아래 용어를 전 프로젝트에서 통일하여 사용하세요.

| 한글        | 영문 (코드)         | 복수형         |
| ----------- | ------------------- | -------------- |
| 공룡        | `dinosaur`          | `dinosaurs`    |
| 건물        | `building`          | `buildings`    |
| 위인        | `greatFigure`       | `greatFigures` |
| 파크        | `park`              | `parks`        |
| 탐험        | `exploration`       | `explorations` |
| 스토리      | `story`             | `stories`      |
| 챕터        | `chapter`           | `chapters`     |
| 시즌        | `season`            | `seasons`      |
| 재화        | `currency`          | -              |
| 골드        | `gold`              | -              |
| 다이아      | `diamond`           | -              |
| DNA         | `dna`               | -              |
| 부화        | `hatching`          | -              |
| 등급/희귀도 | `rarity`            | -              |
| 레벨        | `level`             | -              |
| 경험치      | `exp`               | -              |
| 행복도      | `happiness`         | -              |
| 배고픔      | `hunger`            | -              |
| 친밀도      | `intimacy`          | -              |
| 인기도      | `popularity`        | -              |
| 수익        | `revenue`           | -              |
| 유지비      | `maintenanceCost`   | -              |
| 탐험 에너지 | `explorationEnergy` | -              |
| 시즌 포인트 | `seasonPoint`       | -              |

---

# 🗄️ 데이터베이스 스키마

> 📌 **중요**: 이 스키마가 모든 타입 정의의 기준입니다.

## Prisma 스키마 표준

```prisma
// === 유저 ===
model User {
  id            String   @id @default(cuid())
  tossId        String   @unique
  nickname      String
  level         Int      @default(1)
  exp           Int      @default(0)
  tutorialStep  Int      @default(0)
  lastLoginAt   DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  park          Park?
  currency      Currency?
}

// === 재화 ===
model Currency {
  id                String   @id @default(cuid())
  userId            String   @unique
  gold              Int      @default(10000)
  diamond           Int      @default(100)
  dna               Int      @default(0)
  explorationEnergy Int      @default(30)
  energyLastRechargedAt DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// === 파크 ===
model Park {
  id        String   @id @default(cuid())
  userId    String   @unique
  name      String   @default("My Dino Park")
  level     Int      @default(1)
  exp       Int      @default(0)
  gridSizeX Int      @default(20)
  gridSizeY Int      @default(20)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User       @relation(fields: [userId], references: [id])
  dinosaurs Dinosaur[]
  buildings Building[]
}

// === 공룡 ===
model Dinosaur {
  id        String   @id @default(cuid())
  parkId    String
  speciesId String   // game-data 참조
  nickname  String?
  level     Int      @default(1)
  exp       Int      @default(0)
  happiness Int      @default(100)
  hunger    Int      @default(0)
  intimacy  Int      @default(0)
  positionX Int
  positionY Int
  isInPark  Boolean  @default(true)
  lastFedAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  park Park @relation(fields: [parkId], references: [id])
}

// === 건물 ===
model Building {
  id        String   @id @default(cuid())
  parkId    String
  typeId    String   // game-data 참조
  level     Int      @default(1)
  positionX Int
  positionY Int
  status    BuildingStatus @default(ACTIVE)
  assignedGreatFigureId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  park Park @relation(fields: [parkId], references: [id])
}

enum BuildingStatus {
  CONSTRUCTING
  ACTIVE
  UPGRADING
}

// === 위인 ===
model UserGreatFigure {
  id        String   @id @default(cuid())
  userId    String
  figureId  String   // game-data 참조
  level     Int      @default(1)
  exp       Int      @default(0)
  assignedBuildingId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// === 스토리 진행 ===
model StoryProgress {
  id        String   @id @default(cuid())
  userId    String
  chapterId String
  sceneId   String?
  completed Boolean  @default(false)
  choices   Json     @default("[]")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, chapterId])
}

// === 탐험 ===
model Exploration {
  id          String   @id @default(cuid())
  userId      String
  regionId    String
  status      ExplorationStatus @default(IN_PROGRESS)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  rewards     Json?
  createdAt   DateTime @default(now())
}

enum ExplorationStatus {
  IN_PROGRESS
  COMPLETED
  CLAIMED
}

// === 부화 ===
model HatchingQueue {
  id          String   @id @default(cuid())
  userId      String
  eggType     String
  speciesId   String?
  startedAt   DateTime @default(now())
  completesAt DateTime
  completed   Boolean  @default(false)
}

// === 거래 기록 ===
model Transaction {
  id           String   @id @default(cuid())
  userId       String
  type         TransactionType
  currencyType String
  amount       Int
  reason       String
  balanceAfter Int
  createdAt    DateTime @default(now())
}

enum TransactionType {
  EARN
  SPEND
  PURCHASE
  REWARD
}

// === 시즌 패스 ===
model SeasonPass {
  id             String   @id @default(cuid())
  userId         String
  seasonId       String
  level          Int      @default(1)
  exp            Int      @default(0)
  isPremium      Boolean  @default(false)
  claimedRewards Json     @default("[]")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([userId, seasonId])
}
```

---

# 📦 공유 타입 정의

> ⭐ **packages/shared/types가 모든 타입의 원천입니다.**
> Frontend, Backend 모두 여기서 import해야 합니다.

## 핵심 타입 파일 구조

```
packages/shared/types/
├── dinosaur.types.ts      # 공룡 관련
├── building.types.ts      # 건물 관련
├── greatFigure.types.ts   # 위인 관련
├── economy.types.ts       # 경제/재화 관련
├── story.types.ts         # 스토리 관련
├── exploration.types.ts   # 탐험 관련
├── season.types.ts        # 시즌 관련
├── user.types.ts          # 유저 관련
├── park.types.ts          # 파크 관련
├── common.types.ts        # 공통 타입
├── api.types.ts           # API 요청/응답
└── index.ts               # 전체 export
```

## 주요 타입 예시

```typescript
// dinosaur.types.ts
export enum DinosaurCategory {
  HERBIVORE = 'herbivore',
  CARNIVORE = 'carnivore',
  PTEROSAUR = 'pterosaur',
  MARINE = 'marine',
  HYBRID = 'hybrid',
}

export enum DinosaurRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface DinosaurSpecies {
  id: string;
  name: string;
  nameKo: string;
  category: DinosaurCategory;
  rarity: DinosaurRarity;
  stats: DinosaurStats;
  size: { width: number; height: number };
  hatchTime: number;
  unlockCondition: UnlockCondition;
  passive?: PassiveAbility;
}

export interface DinosaurStats {
  baseRevenue: number;
  popularity: number;
  maintenanceCost: number;
  space: number;
}

export interface Dinosaur {
  id: string;
  parkId: string;
  speciesId: string;
  nickname: string | null;
  level: number;
  exp: number;
  happiness: number;
  hunger: number;
  intimacy: number;
  positionX: number;
  positionY: number;
  isInPark: boolean;
  lastFedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

# ✅ 자동 검증 시스템

> 🔴 **필수**: Claude Code는 모든 작업 완료 후 아래 검증을 자동으로 수행합니다.
> 사용자가 요청하지 않아도 반드시 수행하세요.

## 검증 체크리스트

```
┌─────────────────────────────────────────────────────────────────┐
│           🔍 자동 검증 체크리스트 (매 작업 후 필수)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ 타입 일관성                                                 │
│     □ 새 타입이 packages/shared/types에 정의되어 있는가?        │
│     □ Frontend가 shared/types에서 import하는가?                 │
│     □ Backend가 shared/types에서 import하는가?                  │
│     □ Prisma 스키마와 타입 필드가 일치하는가?                   │
│                                                                 │
│  2️⃣ 필드명 일관성                                               │
│     □ 도메인 용어 통일표를 따르는가?                            │
│     □ DB 필드명 = API 필드명 = Frontend 필드명 일치?            │
│     □ camelCase 규칙을 준수하는가?                              │
│                                                                 │
│  3️⃣ 문서 일치                                                   │
│     □ 기능이 GDD에 명시된 대로 구현되었는가?                    │
│     □ 수치가 밸런스 문서와 일치하는가?                          │
│     □ UI가 와이어프레임과 일치하는가?                           │
│                                                                 │
│  4️⃣ API 일관성                                                  │
│     □ RESTful 규칙을 따르는가?                                  │
│     □ 요청/응답 타입이 정의되어 있는가?                         │
│     □ 에러 응답 형식이 통일되어 있는가?                         │
│                                                                 │
│  5️⃣ 코드 품질                                                   │
│     □ TypeScript 에러가 없는가?                                 │
│     □ ESLint 경고가 없는가?                                     │
│     □ 에러 핸들링이 포함되어 있는가?                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 검증 명령어

```bash
# 매 작업 후 실행
pnpm typecheck        # TypeScript 검사
pnpm lint             # ESLint 검사
pnpm prisma validate  # Prisma 스키마 검증
pnpm test             # 테스트 실행
```

---

# 🔄 작업 완료 프로토콜

> 🤖 Claude Code는 모든 작업 완료 시 아래 형식으로 보고합니다.

## 작업 완료 보고 템플릿

```markdown
## ✅ 작업 완료 보고

### 1. 완료한 작업

- [작업 내용]

### 2. 변경/생성된 파일

- `path/to/file1.ts` - [변경 내용]
- `path/to/file2.tsx` - [변경 내용]

### 3. 자동 검증 결과

#### 타입 일관성

- [x] Shared Types 정의 완료
- [x] Frontend 연동 완료
- [x] Backend 연동 완료
- [x] Prisma 스키마 일치

#### 필드명 일관성

- [x] 도메인 용어 통일
- [x] DB/API/FE 필드명 일치

#### 문서 일치

- 참조 문서: `[문서명]`
- [x] 기능 스펙 일치
- [x] 수치 일치

#### 코드 품질

- [x] TypeScript 에러 없음
- [x] ESLint 통과

### 4. ⚠️ 주의사항 (있는 경우)

- [주의할 점]

### 5. 📌 다음 작업

- [후속 작업 제안]
```

## 불일치 발견 시 처리

```markdown
## ⚠️ 불일치 발견 및 자동 수정

### 발견된 문제

- [문제 설명]

### 수정 내용

| 위치         | Before            | After       |
| ------------ | ----------------- | ----------- |
| `file.ts:10` | `happiness_level` | `happiness` |

### 영향받는 파일

- `apps/client/...` - 수정 완료
- `apps/server/...` - 수정 완료
```

---

# 📊 밸런스 상수 참조

> 📌 밸런스 문서의 수치를 하드코딩하지 말고, 상수로 관리하세요.

```typescript
// packages/shared/constants/balance.constants.ts

// === 레벨 시스템 ===
export const MAX_PARK_LEVEL = 50;
export const MAX_DINOSAUR_LEVEL = 25;
export const MAX_GREAT_FIGURE_LEVEL = 10;

// === 초기 재화 ===
export const INITIAL_GOLD = 10000;
export const INITIAL_DIAMOND = 100;

// === 에너지 ===
export const MAX_EXPLORATION_ENERGY = 30;
export const ENERGY_RECHARGE_MINUTES = 10;
export const ENERGY_PER_EXPLORATION = 5;

// === 공룡 상태 ===
export const MAX_HAPPINESS = 100;
export const MAX_HUNGER = 100;
export const HAPPINESS_DECAY_PER_HOUR = 2;
export const HUNGER_INCREASE_PER_HOUR = 5;
export const FEEDING_HAPPINESS_GAIN = 20;
export const FEEDING_HUNGER_REDUCE = 100;

// === 오프라인 수익 ===
export const MAX_OFFLINE_HOURS = 8;
export const OFFLINE_REVENUE_RATE = 0.5;

// === 그리드 ===
export const INITIAL_GRID_SIZE = 20;
export const GRID_SIZE_PER_LEVEL = 2;
export const MAX_GRID_SIZE = 100;
```

---

# 🔗 API 엔드포인트 표준

```
# RESTful 규칙
GET    /api/{resource}          # 목록
GET    /api/{resource}/:id      # 단일
POST   /api/{resource}          # 생성
PATCH  /api/{resource}/:id      # 수정
DELETE /api/{resource}/:id      # 삭제
POST   /api/{resource}/:id/{action}  # 액션

# 주요 API
POST   /api/auth/toss/login
GET    /api/users/me
GET    /api/parks/me
GET    /api/dinosaurs
POST   /api/dinosaurs/:id/feed
GET    /api/buildings
POST   /api/buildings
GET    /api/great-figures
POST   /api/great-figures/:id/recruit
GET    /api/explorations
POST   /api/explorations
GET    /api/stories/progress
POST   /api/stories/:chapterId/choice
GET    /api/shop/products
POST   /api/shop/purchase
GET    /api/seasons/current
```

---

# 🧠 행동 원칙

## Plan Mode

- **3단계 이상** 또는 아키텍처 결정이 필요한 작업 → 반드시 Plan 먼저
- 진행 중 막히면 → **즉시 멈추고 재계획** (밀어붙이지 않기)
- Plan에 검증 단계도 포함할 것

## 검증 기준

- "Staff Engineer가 승인할 코드인가?" 자문 후 완료 처리
- main 브랜치와 diff 확인, 테스트/로그로 동작 증명
- 증명 없이 완료 처리 금지

## 자기 개선

- 사용자로부터 수정 지시를 받으면 → **즉시 `tasks/lessons.md`에 기록**
- 세션 시작 시 `tasks/lessons.md` 확인 필수

## 핵심 원칙

- **Simplicity First**: 최소한의 변경으로 해결. 과도한 추상화 금지
- **No Laziness**: 임시 fix 금지. 근본 원인 해결
- **Minimal Impact**: 필요한 곳만 수정. 부수 버그 방지
- **자율적 버그 수정**: 버그 리포트 → 로그/에러 확인 → 직접 해결 (질문 최소화)

---

# 🚨 최우선 규칙

```
┌─────────────────────────────────────────────────────────────────┐
│                      🚨 최우선 규칙                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 코드 작성 전 반드시 관련 문서를 확인한다                    │
│                                                                 │
│  2. 모든 타입은 packages/shared/types에 정의한다               │
│                                                                 │
│  3. Frontend/Backend/DB 필드명을 반드시 일치시킨다             │
│                                                                 │
│  4. 매 작업 완료 후 자동 검증을 수행한다 (요청 없어도!)        │
│                                                                 │
│  5. 수치는 하드코딩하지 않고 상수/game-data에서 가져온다       │
│                                                                 │
│  6. 불일치 발견 시 즉시 수정하고 보고한다                      │
│                                                                 │
│  7. 작업 완료 시 검증 결과를 포함한 보고서를 출력한다          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🎨 에셋 & Placeholder 규칙

## 에셋이 없을 때 (Placeholder 사용)

```
⚠️ 중요: 이미지 에셋이 없어도 개발을 멈추지 않는다!

에셋 없을 때 처리:
1. Placeholder 색상 박스 + 텍스트 라벨 사용
2. 기능 개발 완료 후 실제 에셋으로 교체
3. 에셋 필요 시 체크리스트에 기록만 하고 진행
```

## Placeholder 색상 규칙

```typescript
// 카테고리별 Placeholder 색상
DINOSAUR_HERBIVORE: '#4CAF50'; // 초식 - 녹색
DINOSAUR_CARNIVORE: '#F44336'; // 육식 - 빨강
DINOSAUR_PTEROSAUR: '#9C27B0'; // 익룡 - 보라
DINOSAUR_MARINE: '#2196F3'; // 해양 - 파랑
BUILDING: '#8BC34A'; // 건물 - 연두
CHARACTER: '#E91E63'; // 캐릭터 - 분홍
UI: '#9E9E9E'; // UI - 회색
```

## 에셋 요청 시 처리

```
Claude Code가 에셋이 필요할 때:

1. ❌ 개발 중단하고 사용자에게 요청하지 않는다
2. ✅ Placeholder로 대체하고 개발 계속 진행
3. ✅ 작업 완료 보고서에 "필요한 에셋" 목록 포함
4. ✅ 에셋 체크리스트 문서 참조 안내

예시 보고서:
"### 📦 필요한 에셋
- [ ] 티라노사우루스 Idle 애니메이션
- [ ] DNA 연구소 Lv.2 이미지
→ 에셋 체크리스트(dino_park_asset_checklist.md) 참조"
```

## 에셋 교체 시

```
실제 에셋이 준비되면:

1. assets/{category}/{id}/ 폴더에 파일 배치
2. 파일명 규칙: {type}_{id}_{name}_{state}_{frame}.png
3. assetLoader가 자동으로 Placeholder 대신 실제 에셋 로드
4. 코드 수정 불필요 (경로만 맞으면 자동 적용)
```

---

# 📋 Phase별 참조 문서

| Phase               | 참조 문서                           |
| ------------------- | ----------------------------------- |
| Phase 1: 셋업       | 기술 설계, 액션 플랜                |
| Phase 2: 백엔드     | 기술 설계, 밸런스                   |
| Phase 3: 프론트엔드 | **UI & 아트 가이드**, GDD           |
| Phase 4: 게임 로직  | 공룡 도감, 위인 도감, 밸런스        |
| Phase 5: 콘텐츠     | 스토리, 시즌, 사운드, **에셋 문서** |
| Phase 6: 수익화     | 수익 모델, GDD                      |
| Phase 7: 테스트     | 전체 문서                           |
| Phase 8: 런칭       | 액션 플랜                           |

---

# 🤝 협업 가이드

## 효율적인 요청 방법

```
✅ 좋은 요청:
"공룡 서비스를 만들어줘.
- 참조: 공룡 도감, 밸런스 문서, 기술 설계
- 기능: CRUD + 먹이주기 + 상태 관리
- 위치: apps/server/src/modules/dinosaur/
- 타입: packages/shared/types/dinosaur.types.ts 사용"

❌ 나쁜 요청:
"공룡 기능 만들어줘"
```

## 작업 단위

```
✅ 적절한 크기 (1-2시간):
- 모듈 1개 (Service + Controller + DTO)
- 화면 1개 (컴포넌트 + 스토어 + API)
- 기능 1개 (부화 시스템, 먹이주기 등)

❌ 너무 큼: "전체 백엔드 만들어줘"
❌ 너무 작음: "변수명 바꿔줘"
```

## 프롬프트 템플릿

### 세션 시작

```
"다이노 파크 타이쿤 개발 시작해.
현재: Phase [N], Week [N]
완료: [모듈 목록]
오늘 목표: [작업 목록]
참조: CLAUDE.md, [관련 문서]"
```

### 모듈 생성

```
"[모듈명] 모듈을 만들어줘.
참조: CLAUDE.md, [관련 도감/문서]
구현: Prisma, types, Service, Controller, DTO
위치: apps/server/src/modules/[name]/
기존 패턴 따라서 만들어줘."
```

### 검증 요청

```
"전체 검증 수행해줘.
- TypeScript 에러
- 타입 일관성
- 필드명 일관성
- 문서 일치 여부
문제 있으면 수정하고 보고해줘."
```

---

# 📊 진행 상황

> **사용법**: 매 세션 시작 시 이 섹션을 업데이트하여 컨텍스트 유지

## 현재 상태

| 항목      | 값            |
| --------- | ------------- |
| **Phase** | 0 (기획 완료) |
| **Week**  | 0             |
| **날짜**  | 2026-01-31    |

## Phase 진행률

```
Phase 1: 프로젝트 셋업    ░░░░░░░░░░ 0%
Phase 2: 백엔드 코어      ░░░░░░░░░░ 0%
Phase 3: 프론트엔드       ░░░░░░░░░░ 0%
Phase 4: 게임 로직        ░░░░░░░░░░ 0%
Phase 5: 콘텐츠           ░░░░░░░░░░ 0%
Phase 6: 수익화           ░░░░░░░░░░ 0%
Phase 7: 테스트           ░░░░░░░░░░ 0%
Phase 8: 런칭             ░░░░░░░░░░ 0%
```

## 최근 완료

- (없음)

## 진행 중

- 기획 문서 완성

## 다음 작업

- Phase 1: 프로젝트 셋업 시작

---

_이 문서는 Claude Code가 자동으로 참조하며, 모든 개발 작업의 기준입니다._
_최종 업데이트: 2026년 1월_
