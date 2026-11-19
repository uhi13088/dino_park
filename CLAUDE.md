# CLAUDE.md - 다이노 파크 타이쿤 자동 개발 가이드

> **이 파일은 Claude Code가 자동으로 읽고 따르는 프로젝트 컨텍스트입니다.**
> **모든 개발 작업에서 이 규칙을 준수하고, 매 작업 완료 후 자동 검증을 수행하세요.**

---

# 🎯 프로젝트 개요

| 항목           | 내용                                     |
| -------------- | ---------------------------------------- |
| **프로젝트명** | 다이노 파크 타이쿤 (Dino Park Tycoon)    |
| **현재 목표** | 장기간 공룡 파크를 계속 운영·확장하는 수집·경영 게임 |
| **초기 플랫폼 검토** | 토스 앱스 (Toss Apps). 현재 플레이 시간·접속 주기를 정하는 근거와 구별 |
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

> **2026-11-15 문서 체계 변경:** 최신 기획은 `docs/current/`다. 먼저 [문서 안내](docs/README.md)를 읽고, 구버전의 기획·수치와 실제 구현을 구별한다. 아래 규칙은 이 파일 뒤쪽에 남아 있는 과거 Phase별 문서 안내·수치 예시보다 우선한다.

| 대상 | 우선 참조 |
| --- | --- |
| 게임 규칙·구현 범위 | [게임 기획 0.6](docs/current/game-design.md) |
| 전체 자원 종류·품질·생산/사용처 | [기본 자원·생산 0.6](docs/current/resources-and-production.md) |
| 운영·생산 수치·시간·정산 | [운영·생산·초반 밸런스 0.6](docs/current/balance.md) |
| 획득·DNA·변종·하이브리드 | [공룡 획득·DNA 연구 0.6](docs/current/dna-and-collection.md) |
| 중후반 파크 성장·경험치 | [성장 정본](docs/current/park-progression.md)·[전체 공급표](docs/current/park-progression-tables.md). Park5~50·45전환·180일회성 목표/XP 소유. 실제 시설/기술/획득 권한과 비용은 기존 정본, 본편17장면 조건은story-progression§11 참조. 실제 수급/완주기간/런타임과 구별 |
| 83종 최초·반복 획득 | [획득 정본](docs/current/dinosaur-acquisition.md)·[전체 획득표](docs/current/dinosaur-acquisition-tables.md). 반복 알68종·첫 랩터 예외1·합성15종을 연결. 레시피 비용/재료는DNA, 알비용밴드는balance를 읽고 별도 수치 원천을 만들지 않음 |
| 건물 역할·25레벨 성장 | [건물 기획](docs/current/buildings.md)·[생성 상세표](docs/current/building-upgrade-tables.md). 주요25레벨/금고/연료 방향 확정, 새 수치 런타임 적용 전 |
| 기술 연구트리·연구원 역할 | [기술 연구트리](docs/current/research-trees.md). 4계열72기술/총252회 연구의 목적·선행·연구소/시설권한, 72항목의 비용·시간·레벨별 효과 정의. 기존14개는 연구트리, 신규58개는 [효과 상세](docs/current/research-effects.md)가 소유. 각 기술3~5레벨/연구원 병렬수/DNA 합성 별도 작업을 구별 |
| 후속 확장·수동 탐험 | [생성 상세표](docs/current/followup-content-tables.md)·[탐험 플레이](docs/current/exploration-play.md). 토지/특수시설/준비비는 balance16~17, 부모/레시피/추가2종은 DNA, 83종 호환은 buildings. 계획83종과 실제81종·게임 적용 여부를 구별 |
| 통합 스토리·등장인물 | [스토리 정본](docs/current/story-and-characters.md). 본편·사이드·4시즌의 단일 캐논, 아서의 마지막 여정과 유산. 초반 조건/대사와 후반17장면의 플레이 연결은 story-progression이 소유 |
| 위인 GP·능력 | [위인 통합 기획](docs/current/great-figures.md). GP 영입과 보유/배정·500레벨 수치·시너지/상한. 연구원 다이아와 구별하며 합성 확률/시간 하한 보존 |
| 제작·서비스 | [통합 명세](docs/current/production-and-services.md). 아트·사운드·시즌 운영·소셜·상점·품질 |
| 실제 완료·검증·작업 순서 | `TASK.md`와 실제 코드 |
| 종 특징·인물·서사 | 문서 안내에서 승계한 구버전 도감·시나리오 범위만 참조 |
| DB·API·에셋 존재 여부 | Prisma·서비스/컨트롤러·실물 파일. 과거 기술 설계·제작 프롬프트만으로 존재를 판단하지 않음 |

### 충돌 시 우선순위

1. 사용자가 확정한 요구와 현재 대화의 수정.
2. 최신 기획의 담당 문서. 자원 종류·품질·생산/사용 규칙은 resources-and-production, 구매·생산·25레벨 성능/시설·금고 한도·연료·미션·승급 수치는 balance, 개별 합성 레시피의 재료·제작비·시간은 dna-and-collection, 기술 항목·선행과 기존14효과는 research-trees, 신규58효과는 하위 research-effects, 기술 연구 비용/시간은 balance, 첫 영웅 이후 Park5~50 목표·경험치는 park-progression이 소유하며 다른 문서에서 별도 수치를 만들지 않는다.
3. 최신 기획에 명시적으로 승계한 도감의 종/원종 조합, 시나리오의 서사. 과거 직접 수익·합성 성공률·부속 경제 수치는 제외한다.
4. 나머지 구버전 자료는 아이디어·설계 참고다. 최신 문서에 없는 기능을 자동으로 구현 범위에 넣지 않는다.

**기획과 구현의 차이:** 최신 기획은 적용 예정 내용도 포함한다. 실제 게임은 코드를 확인한다. 예를 들어 현재 초기 골드는 10,000이며, 입장료·첫 시설 연결 없이 신규 자금을 먼저 낮추지 않는다. 기존 계정의 골드·공용 DNA·배치를 덮어쓰지 않는다. 0.6의 전체 금고/동적 연료 한도는 기존 초과분을 보존하며, 현재 탐험 에너지와 별도 연료 잔액을 병행하지 않는다.

구버전 경로는 링크 호환을 위해 유지한다. 앞으로 새 설계는 `docs/current/`의 소유 문서에 반영하고 TASK에 변경과 검증을 기록한다. 런타임 수치 반영 시 기존 shared/game-data의 소유권을 정리해 서버·클라이언트가 같은 상수를 사용한다.

---

# 페이지형 가이드북 동시 갱신

사용자 요청에 따라 기획을 조정할 때 [가이드북 관리](docs/guidebook/README.md)를 함께 따른다. 스토리·인물·위인·자원·경제·건물·연구·공룡·레시피·구현 상태가 바뀌면 같은 작업에서 기준 Word 가이드북과 인쇄용 PDF를 갱신한다.

- 가이드 본문은 하나의 현재 통합 기획이다. 과거 버전의 별도 장/비교 페이지를 만들지 않고 현행 규칙에 합친다. 구현 상태와 미정 조건은 명시하며 폐기된 수치를 활성화하지 않는다.
- 도메인 규칙은 기존 담당 원천을 수정한다. 가이드북에 경쟁 수치 원천을 만들지 않는다.
- `editorial`의 출처가 바뀌면 요약을 실제로 대조하고 갱신한다. 지문만 자동 갱신하지 않는다.
- `bash docs/guidebook/update_guidebook.sh`로 페이지·목차·색인·북마크를 함께 생성한다. 달라진 렌더 페이지를 검토한다.
- 완료 기록을 정리한 뒤 `bash docs/guidebook/update_guidebook.sh --check`를 통과시킨다. 최신성 검사가 실패한 상태로 가이드북 갱신 완료를 보고하지 않는다.
- 최종 파일은 `docs/guidebook/output/`의 고정 이름을 사용한다. 실행 코드·DB 변경이나 외부 게시를 가이드북 갱신만으로 승인한 것으로 해석하지 않는다.

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
  - 공룡 데이터 (실제 카탈로그 81종)
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

> 📌 수치는 `docs/current/balance.md`의 적용 순서에 따라 공유 상수로 관리하세요. 아래 코드는 과거 구현 예시이며 최신 목표값을 덮어쓰는 정본이 아닙니다.

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
