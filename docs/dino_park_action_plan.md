# 🚀 다이노 파크 타이쿤 - 개발 액션 플랜

## Development Action Plan with Claude Code v1.0

---

# 📋 목차

1. [개발 전략 개요](#1-개발-전략-개요)
2. [기술 스택 결정](#2-기술-스택-결정)
3. [Phase 1: 프로젝트 셋업 (Week 1-2)](#3-phase-1-프로젝트-셋업)
4. [Phase 2: 백엔드 코어 (Week 3-6)](#4-phase-2-백엔드-코어)
5. [Phase 3: 프론트엔드 기반 (Week 7-10)](#5-phase-3-프론트엔드-기반)
6. [Phase 4: 게임 핵심 로직 (Week 11-16)](#6-phase-4-게임-핵심-로직)
7. [Phase 5: 콘텐츠 & 데이터 (Week 17-20)](#7-phase-5-콘텐츠--데이터)
8. [Phase 6: 수익화 & 소셜 (Week 21-24)](#8-phase-6-수익화--소셜)
9. [Phase 7: 테스트 & 최적화 (Week 25-28)](#9-phase-7-테스트--최적화)
10. [Phase 8: 런칭 준비 (Week 29-32)](#10-phase-8-런칭-준비)
11. [Claude Code 활용 가이드](#11-claude-code-활용-가이드)
12. [문서별 개발 매핑](#12-문서별-개발-매핑)

---

# 1. 개발 전략 개요

## 1.1 개발 철학

```
┌─────────────────────────────────────────────────────────┐
│                   개발 원칙                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1️⃣ MVP First (Minimum Viable Product)                 │
│     → 핵심 기능부터 완성, 점진적 확장                    │
│                                                         │
│  2️⃣ Vertical Slice                                     │
│     → 한 기능을 끝까지 완성 후 다음으로                  │
│                                                         │
│  3️⃣ Test Early, Test Often                             │
│     → 작은 단위로 자주 테스트                           │
│                                                         │
│  4️⃣ Claude Code = Pair Programming                     │
│     → AI와 협업, 코드 리뷰, 리팩토링                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 1.2 전체 타임라인 (32주 = 8개월)

```
[개발 타임라인]

Month 1-2: 기반 구축
├── Week 1-2: 프로젝트 셋업
├── Week 3-6: 백엔드 코어
└── Week 7-8: 프론트엔드 기반

Month 3-4: 핵심 개발
├── Week 9-10: 프론트엔드 완성
├── Week 11-14: 게임 핵심 로직
└── Week 15-16: 게임 로직 완성

Month 5-6: 콘텐츠 & 기능
├── Week 17-20: 콘텐츠 & 데이터
└── Week 21-24: 수익화 & 소셜

Month 7-8: 마무리
├── Week 25-28: 테스트 & 최적화
└── Week 29-32: 런칭 준비

🚀 런칭!
```

## 1.3 MVP 범위 정의

> **핵심 원칙**: MVP에서는 시스템 완성도 우선, 콘텐츠는 최소화
> 콘텐츠 확장은 시스템 안정화 이후 (Week 17+)

### MVP (Week 1-16)에 포함

| 기능                | 상세                    | 비고                   |
| ------------------- | ----------------------- | ---------------------- |
| ✅ 파크 기본 시스템 | 건물 배치, 업그레이드   | 건물 20종              |
| ✅ 공룡 시스템      | 부화, 배치, 먹이주기    | **20종** (상세 데이터) |
| ✅ 경제 시스템      | 골드, 다이아, 기본 수익 | 핵심 밸런스            |
| ✅ 탐험 시스템      | 기본 탐험, 보상         | 3개 지역               |
| ✅ 스토리           | 프롤로그 + 챕터 1-2     | 약 30분 분량           |
| ✅ 위인 시스템      | 기본 영입, 배치         | **10명** (상세 데이터) |
| ✅ UI/UX            | 핵심 화면               | 모든 필수 화면         |

### 위인 시스템 MVP vs Full 비교

| 항목            | MVP (10명)               | Full (50명)        |
| --------------- | ------------------------ | ------------------ |
| **포함 위인**   | GF-001~010 (핵심 캐릭터) | 전체 50명          |
| **영입 방식**   | 스토리 해금 + 기본 영입  | 다양한 해금 조건   |
| **시너지**      | 기본 시너지만            | 전체 시너지 조합   |
| **데이터 수준** | 상세 (밸런싱 완료)       | 상세 (밸런싱 완료) |
| **구현 시점**   | Week 11-16               | Week 17-18         |

### MVP 이후 (Week 17-32)에 추가

| 기능           | 상세                 | 확장 내용            |
| -------------- | -------------------- | -------------------- |
| 📋 전체 콘텐츠 | 공룡 82종, 위인 50명 | 20종→82종, 10명→50명 |
| 📋 스토리 전체 | 챕터 3-6, 엔딩       | 4시간+ 분량 추가     |
| 📋 시즌 시스템 | 시즌 1 콘텐츠        | 8주 시즌 콘텐츠      |
| 📋 수익화      | 광고, IAP            | 상점, 패스           |
| 📋 소셜        | 방문, 선물           | 친구 시스템          |
| 📋 최적화      | 성능, 로딩           | 번들링, 캐싱         |

---

# 2. 기술 스택 결정

## 2.1 권장 기술 스택

```
┌─────────────────────────────────────────────────────────┐
│                    기술 스택                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🎮 프론트엔드 (클라이언트)                              │
│  ├── Framework: React 18 + TypeScript                   │
│  ├── State: Zustand (경량 상태관리)                     │
│  ├── Styling: TailwindCSS + Framer Motion              │
│  ├── Game Engine: PixiJS (2.5D 아이소메트릭 렌더링)        │
│  └── Build: Vite                                        │
│                                                         │
│  🖥️ 백엔드 (서버)                                       │
│  ├── Runtime: Node.js 20 LTS                           │
│  ├── Framework: NestJS (TypeScript)                    │
│  ├── ORM: Prisma                                        │
│  ├── Cache: Redis                                       │
│  └── API: REST + WebSocket                             │
│                                                         │
│  🗄️ 데이터베이스                                        │
│  ├── Primary: PostgreSQL 15                            │
│  ├── Cache: Redis 7                                     │
│  └── File Storage: AWS S3 / Cloudflare R2             │
│                                                         │
│  ☁️ 인프라                                              │
│  ├── Hosting: Vercel (FE) + Railway/Render (BE)       │
│  ├── CDN: Cloudflare                                   │
│  └── Monitoring: Sentry + Grafana                      │
│                                                         │
│  🔌 토스 연동                                           │
│  ├── Toss SDK                                          │
│  ├── TossPay 결제                                      │
│  └── Toss 로그인                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 2.2 선택 이유

| 기술           | 선택 이유                                    |
| -------------- | -------------------------------------------- |
| **React + TS** | Claude Code 최적화, 타입 안정성, 생태계      |
| **PixiJS**     | WebGL 성능, 2.5D 아이소메트릭 최적화, 가벼움 |
| **NestJS**     | 구조화된 백엔드, TypeScript 통일, 확장성     |
| **Prisma**     | 타입 안전 ORM, 마이그레이션, Claude 친화적   |
| **Zustand**    | 간단한 API, 보일러플레이트 최소화            |
| **PostgreSQL** | 관계형 데이터, JSON 지원, 안정성             |

## 2.3 프로젝트 구조

```
dino-park-tycoon/
├── apps/
│   ├── client/                 # React 프론트엔드
│   │   ├── src/
│   │   │   ├── components/     # UI 컴포넌트
│   │   │   ├── features/       # 기능별 모듈
│   │   │   │   ├── park/       # 파크 관리
│   │   │   │   ├── dinosaur/   # 공룡 시스템
│   │   │   │   ├── building/   # 건물 시스템
│   │   │   │   ├── exploration/# 탐험 시스템
│   │   │   │   ├── story/      # 스토리 시스템
│   │   │   │   ├── greatFigure/# 위인 시스템
│   │   │   │   └── shop/       # 상점 시스템
│   │   │   ├── game/           # PixiJS 게임 엔진
│   │   │   ├── stores/         # Zustand 스토어
│   │   │   ├── hooks/          # 커스텀 훅
│   │   │   ├── utils/          # 유틸리티
│   │   │   ├── types/          # 타입 정의
│   │   │   └── api/            # API 클라이언트
│   │   └── public/
│   │       └── assets/         # 이미지, 사운드
│   │
│   └── server/                 # NestJS 백엔드
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/       # 인증
│       │   │   ├── user/       # 유저
│       │   │   ├── park/       # 파크
│       │   │   ├── dinosaur/   # 공룡
│       │   │   ├── building/   # 건물
│       │   │   ├── exploration/# 탐험
│       │   │   ├── story/      # 스토리
│       │   │   ├── greatFigure/# 위인
│       │   │   ├── economy/    # 경제
│       │   │   ├── shop/       # 상점
│       │   │   └── admin/      # 어드민
│       │   ├── common/         # 공통 모듈
│       │   └── prisma/         # Prisma 설정
│       └── prisma/
│           └── schema.prisma   # DB 스키마
│
├── packages/
│   ├── shared/                 # 공유 타입, 상수
│   │   ├── types/
│   │   ├── constants/
│   │   └── utils/
│   └── game-data/              # 게임 데이터
│       ├── dinosaurs/          # 공룡 데이터
│       ├── buildings/          # 건물 데이터
│       ├── greatFigures/       # 위인 데이터
│       └── stories/            # 스토리 데이터
│
├── docs/                       # 문서
│   ├── gdd.md
│   ├── api.md
│   └── ...
│
├── tools/                      # 개발 도구
│   ├── data-generator/         # 데이터 생성기
│   └── balance-simulator/      # 밸런스 시뮬레이터
│
├── turbo.json                  # Turborepo 설정
├── package.json
└── README.md
```

---

# 3. Phase 1: 프로젝트 셋업

## Week 1: 환경 구축

### Day 1-2: 모노레포 셋업

```bash
# Claude Code 프롬프트:
"Turborepo를 사용한 모노레포 프로젝트를 생성해줘.
- apps/client: React + TypeScript + Vite
- apps/server: NestJS + TypeScript
- packages/shared: 공유 타입, 유틸리티
- packages/game-data: 게임 데이터 JSON

ESLint, Prettier, Husky 설정도 포함해줘."
```

**체크리스트:**

- [ ] Turborepo 초기화
- [ ] React 클라이언트 생성 (Vite)
- [ ] NestJS 서버 생성
- [ ] 공유 패키지 설정
- [ ] ESLint + Prettier 설정
- [ ] Git 훅 설정 (Husky)
- [ ] README 작성

### Day 3-4: 데이터베이스 셋업

```bash
# Claude Code 프롬프트:
"Prisma 스키마를 작성해줘. 다음 엔티티가 필요해:

1. User (유저)
   - id, tossId, nickname, level, exp, createdAt

2. Park (파크)
   - id, userId, name, level, gridData, createdAt

3. Dinosaur (공룡)
   - id, parkId, speciesId, name, level, happiness, hunger, positionX, positionY

4. Building (건물)
   - id, parkId, typeId, level, positionX, positionY, status

5. Currency (재화)
   - id, userId, gold, diamond, dna, explorationEnergy

6. GreatFigure (위인)
   - id, userId, figureId, level, exp, assignedBuildingId

7. StoryProgress (스토리 진행)
   - id, userId, chapterId, completed, choices

8. Exploration (탐험)
   - id, userId, regionId, status, startedAt, rewards

적절한 관계와 인덱스도 설정해줘."
```

**체크리스트:**

- [ ] Prisma 설치 및 초기화
- [ ] 스키마 작성
- [ ] 마이그레이션 생성
- [ ] Seed 데이터 작성
- [ ] Prisma Client 생성

### Day 5: 개발 환경 설정

```bash
# Claude Code 프롬프트:
"Docker Compose 설정을 만들어줘:
- PostgreSQL 15
- Redis 7
- Adminer (DB 관리)

환경변수 파일(.env.example)도 작성해줘."
```

**체크리스트:**

- [ ] Docker Compose 작성
- [ ] 환경변수 템플릿
- [ ] 개발 서버 스크립트
- [ ] VSCode 설정 (.vscode/)

## Week 2: 기반 코드 작성

### Day 1-2: 공유 타입 정의

```bash
# Claude Code 프롬프트:
"packages/shared/types에 게임의 핵심 타입을 정의해줘:

1. dinosaur.types.ts
   - DinosaurSpecies, DinosaurRarity, DinosaurCategory
   - DinosaurStats, DinosaurState

2. building.types.ts
   - BuildingType, BuildingCategory
   - BuildingStats, BuildingState

3. economy.types.ts
   - CurrencyType, TransactionType
   - PriceConfig, RewardConfig

4. game.types.ts
   - GameState, GameConfig
   - Position, GridCell

GDD 문서 기반으로 상세하게 작성해줘."
```

**체크리스트:**

- [ ] 공룡 타입 정의
- [ ] 건물 타입 정의
- [ ] 경제 타입 정의
- [ ] 게임 상태 타입 정의
- [ ] API 응답 타입 정의

### Day 3-4: 게임 데이터 구조화

```bash
# Claude Code 프롬프트:
"packages/game-data에 게임 데이터 JSON 파일을 생성해줘.

dino_park_dinosaur_codex.md 문서를 참고해서
dinosaurs/species.json 파일을 만들어줘.

각 공룡은 다음 구조:
{
  id: string,
  name: string,
  nameKo: string,
  category: string,
  rarity: string,
  stats: { baseRevenue, popularity, maintenanceCost, space },
  unlockCondition: { type, value },
  passive: { name, description, effect }
}

처음 20종만 작성하고, 나머지는 구조만 맞춰서 placeholder로."
```

**체크리스트:**

- [ ] 공룡 데이터 (20종 상세, 62종 placeholder)
- [ ] 건물 데이터 (기본 건물)
- [ ] 위인 데이터 (10명 상세)
- [ ] 스토리 데이터 (챕터 1-2)
- [ ] 밸런스 상수 데이터

### Day 5: API 클라이언트 설정

```bash
# Claude Code 프롬프트:
"apps/client/src/api에 API 클라이언트를 설정해줘:

1. axios 인스턴스 설정 (인터셉터, 에러 핸들링)
2. React Query 설정
3. API 엔드포인트 상수
4. 타입 안전한 API 함수 생성

apps/server의 NestJS와 연동될 구조로 만들어줘."
```

**체크리스트:**

- [ ] Axios 인스턴스
- [ ] React Query 설정
- [ ] API 함수 기본 구조
- [ ] 에러 핸들링 유틸

---

# 4. Phase 2: 백엔드 코어

## Week 3-4: 인증 & 유저 시스템

### Day 1-3: 토스 로그인 연동

```bash
# Claude Code 프롬프트:
"NestJS에서 토스 SDK를 이용한 인증 시스템을 구현해줘:

1. AuthModule
   - TossAuthService: 토스 로그인 처리
   - JwtStrategy: JWT 토큰 검증
   - AuthGuard: 인증 가드

2. UserModule
   - UserService: 유저 CRUD
   - UserController: 유저 API

3. 엔드포인트:
   - POST /auth/toss/login
   - POST /auth/refresh
   - GET /users/me
   - PATCH /users/me

토스 SDK 문서 기반으로 구현해줘."
```

**체크리스트:**

- [ ] 토스 SDK 설치
- [ ] AuthModule 구현
- [ ] JWT 발급/검증
- [ ] UserModule 구현
- [ ] 인증 미들웨어

### Day 4-5: 유저 프로필 & 설정

```bash
# Claude Code 프롬프트:
"유저 프로필 시스템을 구현해줘:

1. 닉네임 설정/변경
2. 레벨 시스템 (EXP 계산)
3. 유저 설정 (알림, 사운드 등)
4. 튜토리얼 진행 상태

밸런스 시뮬레이션 문서의 레벨 테이블을 참고해줘."
```

**체크리스트:**

- [ ] 닉네임 시스템
- [ ] 레벨/EXP 시스템
- [ ] 유저 설정
- [ ] 튜토리얼 상태

## Week 4: 재화 시스템

### Day 1-3: 경제 시스템 구현

```bash
# Claude Code 프롬프트:
"EconomyModule을 구현해줘:

1. CurrencyService
   - 재화 조회 (골드, 다이아, DNA, 탐험 에너지)
   - 재화 추가/차감 (트랜잭션 안전)
   - 재화 변환 (다이아 → 골드)

2. TransactionService
   - 거래 기록 저장
   - 거래 히스토리 조회

3. EnergyService
   - 탐험 에너지 자동 충전 (시간 기반)
   - 에너지 구매

밸런스 시뮬레이션 문서의 경제 설정을 참고해줘.
동시성 이슈를 방지하기 위해 트랜잭션 처리 필수."
```

**체크리스트:**

- [ ] CurrencyService 구현
- [ ] 트랜잭션 처리 (Prisma transaction)
- [ ] 에너지 자동 충전 로직
- [ ] Redis 캐싱

### Day 4-5: 오프라인 수익 시스템

```bash
# Claude Code 프롬프트:
"오프라인 수익 시스템을 구현해줘:

1. 마지막 접속 시간 저장
2. 재접속 시 오프라인 수익 계산
   - 최대 8시간
   - 공룡별 수익 합산
   - 위인 보너스 적용
3. 오프라인 수익 팝업 데이터 반환

GDD의 방치형 수익 공식을 참고해줘."
```

**체크리스트:**

- [ ] 오프라인 수익 계산 로직
- [ ] 접속 시간 기록
- [ ] 수익 지급 API

## Week 5-6: 파크 & 그리드 시스템

### Day 1-4: 파크 시스템 구현

```bash
# Claude Code 프롬프트:
"ParkModule을 구현해줘:

1. ParkService
   - 파크 생성 (신규 유저)
   - 파크 정보 조회
   - 파크 레벨업
   - 그리드 데이터 관리

2. GridService
   - 그리드 크기 관리 (레벨별)
   - 셀 점유 상태 관리
   - 배치 가능 여부 검증
   - 건물/공룡 배치

그리드는 2D 배열로 관리하고,
건물/공룡의 크기(1x1, 2x2 등)를 고려해줘."
```

**체크리스트:**

- [ ] ParkService 구현
- [ ] GridService 구현
- [ ] 그리드 검증 로직
- [ ] 파크 레벨업 로직

### Day 5-7: 건물 시스템 구현

```bash
# Claude Code 프롬프트:
"BuildingModule을 구현해줘:

1. BuildingService
   - 건물 건설 (비용 차감, 그리드 점유)
   - 건물 업그레이드
   - 건물 이동
   - 건물 철거 (일부 환불)
   - 건설 대기열 관리

2. 건물 효과 계산
   - 시너지 효과
   - 범위 효과
   - 위인 배치 보너스

건물 데이터는 game-data 패키지에서 로드해줘."
```

**체크리스트:**

- [ ] BuildingService 구현
- [ ] 건설 대기열
- [ ] 건물 효과 계산
- [ ] 시너지 시스템

### Day 8-10: 공룡 시스템 구현

```bash
# Claude Code 프롬프트:
"DinosaurModule을 구현해줘:

1. DinosaurService
   - 공룡 부화 (알 → 공룡)
   - 공룡 배치
   - 공룡 먹이주기
   - 공룡 상태 관리 (행복도, 배고픔)
   - 공룡 레벨업

2. HatchingService
   - 부화 대기열
   - 부화 시간 계산
   - 부화 완료 처리

3. DinosaurStatusService
   - 상태 감소 (시간 기반)
   - 상태에 따른 수익 변동

공룡 도감 문서를 참고해줘."
```

**체크리스트:**

- [ ] DinosaurService 구현
- [ ] HatchingService 구현
- [ ] 상태 관리 시스템
- [ ] 수익 계산 로직

---

# 5. Phase 3: 프론트엔드 기반

> **Phase 3 요약**
>
> - **기간**: Week 7-10 (4주)
> - **목표**: 프론트엔드 UI 완성 및 게임 렌더링 기반 구축
> - **산출물**: 디자인 시스템, 레이아웃, 핵심 화면 전체

### Phase 3 주간 일정

| 주차        | 기간    | 핵심 작업          | 산출물                                   |
| ----------- | ------- | ------------------ | ---------------------------------------- |
| **Week 7**  | Day 1-5 | 디자인 시스템      | UI 컴포넌트, Tailwind 테마               |
| **Week 8**  | Day 1-5 | 레이아웃 & 라우팅  | GameLayout, BottomNav, Router            |
| **Week 9**  | Day 1-5 | 파크 & 공룡 화면   | ParkView, DinosaurList/Detail            |
| **Week 10** | Day 1-5 | 건물 & 상점 & 탐험 | BuildingMenu, ShopScreen, ExplorationMap |

### Phase 3 체크포인트

```
Week 7 완료 시:
✅ 디자인 시스템 완성 (Button, Modal, Card 등)
✅ Storybook 문서화

Week 8 완료 시:
✅ 레이아웃 구조 완성
✅ 모든 라우트 설정
✅ HUD/네비게이션 동작

Week 9 완료 시:
✅ 메인 파크 화면 렌더링
✅ 공룡 CRUD UI 동작
✅ PixiJS 기본 연동

Week 10 완료 시:
✅ 모든 핵심 화면 구현
✅ 화면 간 이동 정상
✅ Phase 4 진입 준비 완료
```

---

## Week 7-8: UI 프레임워크

### Day 1-3: 디자인 시스템

```bash
# Claude Code 프롬프트:
"React 디자인 시스템을 구축해줘:

1. components/ui/ 폴더에 기본 컴포넌트:
   - Button (variants: primary, secondary, ghost)
   - Input, Textarea
   - Modal, BottomSheet
   - Toast, Notification
   - Card, Panel
   - ProgressBar, Badge
   - Tabs, Accordion

2. TailwindCSS 테마 설정:
   - 게임 컬러 팔레트 (dino_park_ui_wireframe.md 참고)
   - 커스텀 폰트
   - 애니메이션

3. Framer Motion 프리셋:
   - 페이드, 슬라이드
   - 스프링 애니메이션
   - 제스처

UI 와이어프레임 문서의 디자인 가이드를 참고해줘."
```

**체크리스트:**

- [ ] 기본 UI 컴포넌트
- [ ] TailwindCSS 테마
- [ ] 애니메이션 프리셋
- [ ] 컴포넌트 스토리북

### Day 4-5: 레이아웃 & 네비게이션

```bash
# Claude Code 프롬프트:
"앱 레이아웃과 네비게이션을 구현해줘:

1. layouts/
   - GameLayout: 메인 게임 레이아웃
   - FullscreenLayout: 전체화면 (스토리, 상점)
   - ModalLayout: 모달용

2. components/navigation/
   - BottomNavBar: 하단 네비게이션
   - TopHUD: 상단 HUD (재화, 레벨)
   - FloatingMenu: FAB 메뉴

3. React Router 설정:
   - /park: 메인 파크
   - /dinosaurs: 공룡 도감
   - /buildings: 건물 메뉴
   - /exploration: 탐험
   - /story: 스토리
   - /shop: 상점

UI 와이어프레임의 화면 구조를 참고해줘."
```

**체크리스트:**

- [ ] 레이아웃 컴포넌트
- [ ] 네비게이션 컴포넌트
- [ ] 라우팅 설정
- [ ] 화면 전환 애니메이션

## Week 9-10: 핵심 화면 구현

### Day 1-3: 메인 파크 화면

```bash
# Claude Code 프롬프트:
"메인 파크 화면을 구현해줘:

1. features/park/
   - ParkView: 메인 파크 뷰
   - ParkCanvas: PixiJS 캔버스
   - ParkHUD: 파크 전용 HUD
   - BuildModePanel: 건설 모드 UI

2. game/
   - ParkRenderer: PixiJS 렌더러
   - GridRenderer: 그리드 렌더링
   - BuildingSprite: 건물 스프라이트
   - DinosaurSprite: 공룡 스프라이트

3. 인터랙션:
   - 터치/드래그로 이동
   - 핀치로 줌
   - 탭으로 선택
   - 롱프레스로 이동 모드

PixiJS로 2.5D 아이소메트릭 뷰를 구현해줘.
그래픽 가이드(dino_park_graphic_guide.md)의 카메라/뷰 시스템과
깊이 정렬(Z-Sorting) 규칙을 참고해줘."
```

**체크리스트:**

- [ ] ParkView 컴포넌트
- [ ] PixiJS 캔버스 설정
- [ ] 그리드 렌더링
- [ ] 터치 인터랙션

### Day 4-5: 공룡 관리 화면

```bash
# Claude Code 프롬프트:
"공룡 관리 화면들을 구현해줘:

1. features/dinosaur/
   - DinosaurList: 보유 공룡 목록
   - DinosaurDetail: 공룡 상세 정보
   - DinosaurCodex: 공룡 도감
   - HatchingPanel: 부화 패널

2. 공룡 카드 컴포넌트:
   - 이미지, 이름, 등급
   - 스탯 바 (행복도, 배고픔)
   - 레벨, 수익

3. 부화 UI:
   - 알 선택
   - 부화 진행 바
   - 부화 완료 연출

공룡 도감 문서를 참고해줘."
```

**체크리스트:**

- [ ] 공룡 목록/상세
- [ ] 공룡 도감
- [ ] 부화 시스템 UI
- [ ] 공룡 카드 컴포넌트

### Day 6-8: 건물 & 상점 화면

```bash
# Claude Code 프롬프트:
"건물과 상점 화면을 구현해줘:

1. features/building/
   - BuildingMenu: 건물 카테고리 메뉴
   - BuildingList: 건물 목록
   - BuildingDetail: 건물 상세/업그레이드
   - BuildQueue: 건설 대기열

2. features/shop/
   - ShopMain: 상점 메인
   - DiamondShop: 다이아 상점
   - PackageShop: 패키지 상점
   - DailyDeal: 일일 특가

3. 구매 플로우:
   - 가격 확인 팝업
   - 구매 확인
   - 결과 연출

GDD의 건물/상점 목록을 참고해줘."
```

**체크리스트:**

- [ ] 건물 메뉴/목록
- [ ] 상점 화면
- [ ] 구매 플로우
- [ ] 대기열 UI

### Day 9-10: 상태 관리 구현

```bash
# Claude Code 프롬프트:
"Zustand로 전역 상태 관리를 구현해줘:

1. stores/
   - useUserStore: 유저 정보
   - useParkStore: 파크 상태
   - useDinosaurStore: 공룡 상태
   - useBuildingStore: 건물 상태
   - useCurrencyStore: 재화 상태
   - useUIStore: UI 상태 (모달, 토스트)

2. 서버 동기화:
   - React Query와 연동
   - Optimistic Update
   - 에러 롤백

3. 로컬 저장:
   - 설정 persist
   - 오프라인 캐시

타입 안전하게 구현해줘."
```

**체크리스트:**

- [ ] Zustand 스토어 구현
- [ ] React Query 연동
- [ ] Optimistic Update
- [ ] 로컬 저장소 연동

---

# 6. Phase 4: 게임 핵심 로직

## Week 11-12: 게임 루프 & 수익 시스템

### Day 1-3: 게임 루프 구현

```bash
# Claude Code 프롬프트:
"게임의 핵심 루프를 구현해줘:

1. game/GameLoop.ts
   - 틱 기반 업데이트 (1초)
   - 공룡 상태 감소
   - 수익 누적
   - 에너지 충전

2. game/RevenueCalculator.ts
   - 공룡별 수익 계산
   - 건물 보너스 적용
   - 위인 보너스 적용
   - 최종 수익 집계

3. 백그라운드 처리:
   - 탭 비활성화 시 처리
   - 서버 동기화 주기

GDD의 수익 공식을 정확히 구현해줘."
```

**체크리스트:**

- [ ] 게임 루프 구현
- [ ] 수익 계산 로직
- [ ] 상태 감소 로직
- [ ] 백그라운드 처리

### Day 4-6: 탐험 시스템

```bash
# Claude Code 프롬프트:
"탐험 시스템을 구현해줘:

Backend (NestJS):
1. ExplorationModule
   - 탐험 시작 (에너지 소모)
   - 탐험 완료 처리
   - 보상 계산 (확률 기반)
   - 탐험 기록

Frontend (React):
2. features/exploration/
   - ExplorationMap: 탐험 지도
   - RegionCard: 지역 카드
   - ExplorationProgress: 진행 상태
   - RewardPopup: 보상 팝업

3. 탐험 보상 테이블:
   - 지역별 드롭 테이블
   - 희귀도별 확률
   - 보너스 적용

밸런스 시뮬레이션의 탐험 보상 테이블 참고."
```

**체크리스트:**

- [ ] 탐험 백엔드 구현
- [ ] 탐험 UI 구현
- [ ] 보상 시스템
- [ ] 에너지 시스템

### Day 7-10: 위인 시스템

```bash
# Claude Code 프롬프트:
"위인 시스템을 구현해줘:

Backend:
1. GreatFigureModule
   - 위인 영입 (P 소모)
   - 위인 배치 (건물에 할당)
   - 위인 레벨업
   - 시너지 계산

Frontend:
2. features/greatFigure/
   - GreatFigureList: 위인 목록
   - GreatFigureDetail: 위인 상세
   - GreatFigureCodex: 위인 도감
   - AssignmentPanel: 배치 패널

3. 시너지 시스템:
   - 위인 조합 효과
   - 건물-위인 매칭 보너스
   - 파크 전체 버프

위인 도감 문서의 시너지 테이블 참고."
```

**체크리스트:**

- [ ] 위인 백엔드 구현
- [ ] 위인 UI 구현
- [ ] 배치 시스템
- [ ] 시너지 계산

## Week 13-14: 스토리 시스템

### Day 1-5: 스토리 엔진

```bash
# Claude Code 프롬프트:
"스토리 시스템을 구현해줘:

Backend:
1. StoryModule
   - 스토리 진행 상태 관리
   - 선택지 저장
   - 해금 조건 확인
   - 보상 지급

Frontend:
2. features/story/
   - StoryPlayer: 스토리 플레이어
   - DialogueBox: 대화창
   - CharacterSprite: 캐릭터 이미지
   - ChoicePanel: 선택지 패널
   - CutscenePlayer: 컷신 플레이어

3. 스토리 데이터 구조:
   - 챕터 > 씬 > 대사
   - 분기 처리
   - 조건부 대사

스토리 시나리오 문서를 참고해줘."
```

**체크리스트:**

- [ ] 스토리 백엔드
- [ ] 스토리 플레이어
- [ ] 대화 시스템
- [ ] 선택지 시스템
- [ ] 컷신 플레이어

### Day 6-10: 스토리 콘텐츠 (MVP)

```bash
# Claude Code 프롬프트:
"MVP용 스토리 콘텐츠를 구현해줘:

1. 프롤로그 스토리 데이터
2. 챕터 1 스토리 데이터
3. 챕터 2 스토리 데이터

스토리 시나리오 문서의 대사를 JSON 형식으로 변환해줘:

{
  chapterId: 'prologue',
  scenes: [
    {
      id: 'scene_1',
      dialogues: [
        {
          character: 'narrator',
          text: '...',
          emotion: 'neutral'
        }
      ],
      choices: [...]
    }
  ]
}"
```

**체크리스트:**

- [ ] 프롤로그 데이터
- [ ] 챕터 1 데이터
- [ ] 챕터 2 데이터
- [ ] 스토리 테스트

## Week 15-16: 통합 & 밸런싱

### Day 1-5: 시스템 통합

```bash
# Claude Code 프롬프트:
"모든 시스템을 통합해줘:

1. 진행 흐름:
   - 튜토리얼 → 파크 → 탐험 → 스토리
   - 해금 조건 연결
   - 보상 지급 연결

2. 통합 테스트:
   - 신규 유저 플로우
   - 일일 루틴 플로우
   - 성장 플로우

3. 데이터 정합성:
   - 모든 참조 확인
   - 누락 데이터 확인"
```

**체크리스트:**

- [ ] 시스템 연결
- [ ] 해금 조건 연결
- [ ] 보상 연결
- [ ] 통합 테스트

### Day 6-10: 밸런스 조정

```bash
# Claude Code 프롬프트:
"밸런스 조정을 위한 도구를 만들어줘:

1. tools/balance-simulator/
   - 진행 시뮬레이터
   - 경제 시뮬레이터
   - 확률 검증기

2. Admin API:
   - 밸런스 상수 조회/수정
   - 실시간 적용

3. 로깅:
   - 플레이 데이터 수집
   - 병목 지점 분석

밸런스 시뮬레이션 문서의 수치를 기준으로."
```

**체크리스트:**

- [ ] 밸런스 시뮬레이터
- [ ] Admin API
- [ ] 밸런스 상수 적용
- [ ] 테스트 플레이

---

# 7. Phase 5: 콘텐츠 & 데이터

## Week 17-18: 전체 콘텐츠 입력

### Day 1-5: 공룡 전체 데이터

```bash
# Claude Code 프롬프트:
"공룡 전체 82종 데이터를 완성해줘:

dino_park_dinosaur_codex.md 문서를 파싱해서
packages/game-data/dinosaurs/species.json을 완성해줘.

각 공룡마다:
1. 기본 정보 (이름, 카테고리, 등급)
2. 스탯 (수익, 인기도, 유지비, 공간)
3. 해금 조건
4. 패시브 효과
5. 진화 정보 (해당 시)

JSON 스키마 검증도 추가해줘."
```

**체크리스트:**

- [ ] 초식 공룡 25종
- [ ] 육식 공룡 25종
- [ ] 익룡 12종
- [ ] 해양 파충류 10종
- [ ] 하이브리드 10종
- [ ] 데이터 검증

### Day 6-10: 위인 & 건물 데이터 확장

> **MVP→Full 확장 작업**: MVP의 10명 → 전체 50명으로 확장

```bash
# Claude Code 프롬프트:
"위인 50명, 건물 전체 데이터를 완성해줘:

1. packages/game-data/greatFigures/figures.json
   - MVP 10명(GF-001~010)은 이미 완성됨
   - 나머지 40명(GF-011~050) 데이터 추가
   - dino_park_great_figures.md 문서 기반
   - 능력치, 시너지, 해금 조건

2. packages/game-data/buildings/buildings.json
   - GDD의 건물 목록 기반
   - 스탯, 해금 조건, 업그레이드

3. 확장 시너지 테이블
   - 10명→50명으로 인한 새 조합 효과
   - 시즌별 특수 시너지

JSON 형식 통일해줘."
```

**체크리스트:**

- [ ] 위인 40명 추가 데이터 (GF-011~050)
- [ ] 건물 전체 데이터 확장
- [ ] 확장 시너지 테이블 (50명 기준)
- [ ] 데이터 검증 및 밸런싱

## Week 19-20: 스토리 전체 & 시즌 콘텐츠

### Day 1-5: 스토리 전체 데이터

```bash
# Claude Code 프롬프트:
"스토리 전체 데이터를 완성해줘:

dino_park_story_scenario.md 문서를 기반으로:
1. 챕터 3-6 스토리 데이터
2. 사이드 스토리 데이터
3. 엔딩 데이터 (4가지)

packages/game-data/stories/ 폴더에
챕터별 JSON 파일로 분리해줘."
```

**체크리스트:**

- [ ] 챕터 3 데이터
- [ ] 챕터 4 데이터
- [ ] 챕터 5 데이터
- [ ] 챕터 6 데이터
- [ ] 사이드 스토리
- [ ] 엔딩 데이터

### Day 6-10: 시즌 1 콘텐츠

```bash
# Claude Code 프롬프트:
"시즌 1 콘텐츠를 구현해줘:

dino_park_season_content.md 문서 기반:

1. SeasonModule (Backend)
   - 시즌 패스 시스템
   - 시즌 미션
   - 시즌 보상

2. Season 1 데이터:
   - 시즌 스토리 5챕터
   - 시즌 공룡 5종
   - 시즌 위인 3명
   - 시즌 패스 50레벨 보상

3. Season UI:
   - 시즌 패스 화면
   - 시즌 미션 화면
   - 시즌 상점"
```

**체크리스트:**

- [ ] 시즌 패스 시스템
- [ ] 시즌 미션 시스템
- [ ] 시즌 1 데이터
- [ ] 시즌 UI

---

# 8. Phase 6: 수익화 & 소셜

## Week 21-22: 수익화 시스템

### Day 1-4: 광고 시스템

```bash
# Claude Code 프롬프트:
"광고 시스템을 구현해줘:

1. 광고 SDK 연동 (Google AdMob / Unity Ads)
2. 리워드 광고 플로우:
   - 오프라인 수익 2배
   - 부화 시간 단축
   - 탐험 에너지 +1
3. 광고 시청 기록 및 일일 한도
4. 광고 없는 패스 처리

GDD의 광고 정책을 참고해줘."
```

**체크리스트:**

- [ ] 광고 SDK 연동
- [ ] 리워드 광고 구현
- [ ] 광고 한도 시스템
- [ ] 광고 제거 처리

### Day 5-10: IAP 시스템

```bash
# Claude Code 프롬프트:
"인앱 결제 시스템을 구현해줘:

1. 토스페이 연동:
   - 결제 요청
   - 결제 확인
   - 영수증 검증

2. 상품 관리:
   - 다이아 팩 (5종)
   - 월정액 패스
   - 시즌 패스
   - 스타터팩, 확장팩

3. 구매 플로우:
   - 상품 선택
   - 결제 진행
   - 보상 지급
   - 영수증 저장

수익 예측 모델 문서의 상품 목록 참고."
```

**체크리스트:**

- [ ] 토스페이 연동
- [ ] 상품 관리 시스템
- [ ] 구매 플로우
- [ ] 영수증 검증
- [ ] 월정액 처리

## Week 23-24: 소셜 기능

### Day 1-5: 친구 & 방문 시스템

```bash
# Claude Code 프롬프트:
"소셜 시스템을 구현해줘:

1. FriendModule (Backend)
   - 친구 추가/삭제
   - 친구 목록
   - 친구 파크 방문

2. VisitModule
   - 다른 파크 방문
   - 좋아요/선물
   - 방문 보상

3. Social UI:
   - 친구 목록 화면
   - 방문 화면
   - 선물 팝업

GDD의 소셜 시스템 참고."
```

**체크리스트:**

- [ ] 친구 시스템
- [ ] 파크 방문
- [ ] 좋아요/선물
- [ ] 방문 보상

### Day 6-10: 랭킹 & 업적

```bash
# Claude Code 프롬프트:
"랭킹과 업적 시스템을 구현해줘:

1. RankingModule
   - 파크 점수 랭킹
   - 주간/전체 랭킹
   - 랭킹 보상

2. AchievementModule
   - 업적 정의
   - 진행 상태 추적
   - 업적 달성 보상

3. UI:
   - 랭킹 화면
   - 업적 화면
   - 달성 팝업"
```

**체크리스트:**

- [ ] 랭킹 시스템
- [ ] 업적 시스템
- [ ] 보상 시스템
- [ ] UI 구현

---

# 9. Phase 7: 테스트 & 최적화

## Week 25-26: 테스트

### Day 1-5: 유닛 & 통합 테스트

```bash
# Claude Code 프롬프트:
"테스트 코드를 작성해줘:

1. Backend (Jest):
   - 각 Service 유닛 테스트
   - API 통합 테스트
   - 경제 시스템 테스트

2. Frontend (Vitest + Testing Library):
   - 컴포넌트 테스트
   - 훅 테스트
   - 스토어 테스트

3. E2E (Playwright):
   - 신규 유저 플로우
   - 구매 플로우
   - 게임 루프

커버리지 70% 이상 목표."
```

**체크리스트:**

- [ ] 백엔드 유닛 테스트
- [ ] 프론트엔드 테스트
- [ ] E2E 테스트
- [ ] 커버리지 확인

### Day 6-10: QA & 버그 수정

```bash
# Claude Code 프롬프트:
"QA 체크리스트를 만들어줘:

1. 기능별 테스트 케이스
2. 엣지 케이스 목록
3. 버그 리포트 템플릿
4. 버그 우선순위 기준

발견된 버그 수정도 진행."
```

**체크리스트:**

- [ ] QA 체크리스트
- [ ] 수동 테스트
- [ ] 버그 수정
- [ ] 리그레션 테스트

## Week 27-28: 최적화

### Day 1-5: 성능 최적화

```bash
# Claude Code 프롬프트:
"성능 최적화를 진행해줘:

1. 프론트엔드:
   - 번들 사이즈 최적화 (50MB 이하)
   - 코드 스플리팅
   - 이미지 최적화
   - 메모이제이션

2. 백엔드:
   - 쿼리 최적화
   - 캐싱 전략
   - N+1 문제 해결

3. PixiJS:
   - 스프라이트 배칭
   - 텍스처 아틀라스
   - 메모리 관리

토스 앱스 요구사항 (3초 로딩) 충족."
```

**체크리스트:**

- [ ] 번들 최적화
- [ ] 쿼리 최적화
- [ ] 렌더링 최적화
- [ ] 로딩 시간 3초 이하

### Day 6-10: 보안 & 안정성

```bash
# Claude Code 프롬프트:
"보안과 안정성을 강화해줘:

1. 보안:
   - API 인증 강화
   - Rate Limiting
   - 입력 검증
   - SQL Injection 방지

2. 안정성:
   - 에러 핸들링
   - 재시도 로직
   - 서킷 브레이커
   - 로깅/모니터링

3. 치트 방지:
   - 서버 사이드 검증
   - 시간 조작 방지
   - 비정상 데이터 감지"
```

**체크리스트:**

- [ ] 보안 강화
- [ ] 에러 핸들링
- [ ] 치트 방지
- [ ] 모니터링 설정

---

# 10. Phase 8: 런칭 준비

## Week 29-30: 인프라 & 배포

### Day 1-5: 프로덕션 환경

```bash
# Claude Code 프롬프트:
"프로덕션 환경을 구축해줘:

1. 인프라 (Terraform/Pulumi):
   - 프론트엔드: Vercel
   - 백엔드: Railway / Render
   - DB: Supabase / Railway
   - Redis: Upstash
   - CDN: Cloudflare

2. CI/CD (GitHub Actions):
   - 자동 테스트
   - 자동 배포
   - 환경별 배포

3. 모니터링:
   - Sentry (에러)
   - Grafana (메트릭)
   - 알림 설정"
```

**체크리스트:**

- [ ] 인프라 구축
- [ ] CI/CD 파이프라인
- [ ] 모니터링 설정
- [ ] 알림 설정

### Day 6-10: 토스 앱스 연동

```bash
# Claude Code 프롬프트:
"토스 앱스 연동을 완료해줘:

1. 토스 SDK 연동 마무리
2. 토스 로그인 테스트
3. 토스페이 결제 테스트
4. 토스 앱스 심사 준비
5. 스토어 메타데이터

토스 앱스 가이드라인 준수 확인."
```

**체크리스트:**

- [ ] SDK 연동 완료
- [ ] 결제 테스트
- [ ] 심사 준비
- [ ] 메타데이터 작성

## Week 31-32: 소프트 런칭 & 피드백

### Day 1-5: 소프트 런칭

```bash
# Claude Code 프롬프트:
"소프트 런칭을 준비해줘:

1. 제한된 유저 대상 오픈 (1,000명)
2. 피드백 수집 시스템
3. 핫픽스 배포 프로세스
4. 실시간 모니터링

KPI 추적 대시보드도 만들어줘."
```

**체크리스트:**

- [ ] 소프트 런칭 실행
- [ ] 피드백 수집
- [ ] 핫픽스 대응
- [ ] KPI 모니터링

### Day 6-10: 정식 런칭

```bash
# Claude Code 프롬프트:
"정식 런칭 체크리스트:

1. 최종 버그 수정
2. 서버 스케일링 준비
3. 런칭 이벤트 설정
4. 마케팅 연동 확인
5. 고객 지원 준비"
```

**체크리스트:**

- [ ] 최종 점검
- [ ] 스케일링 테스트
- [ ] 런칭 이벤트
- [ ] 고객 지원
- [ ] 🚀 정식 런칭!

---

# 11. Claude Code 활용 가이드

## 11.1 효과적인 프롬프트 작성법

### 좋은 프롬프트 예시

```markdown
# ✅ 좋은 프롬프트

"DinosaurService를 구현해줘.

## 요구사항

1. 공룡 부화 기능
   - DNA 비용 차감
   - 부화 시간 설정 (공룡별 상이)
   - 부화 완료 후 인벤토리 추가

2. 공룡 상태 관리
   - 행복도: 시간당 -2, 먹이주면 +20
   - 배고픔: 시간당 +5, 먹이주면 -100

## 참고 문서

- dino_park_dinosaur_codex.md의 공룡 스탯
- dino_park_balance_simulation.md의 상태 공식

## 기술 스택

- NestJS, Prisma, TypeScript

## 제약사항

- 동시성 처리 필수 (트랜잭션)
- 에러 핸들링 포함"
```

### 나쁜 프롬프트 예시

```markdown
# ❌ 나쁜 프롬프트

"공룡 기능 만들어줘"
→ 너무 모호함, 세부사항 없음

"전체 게임 만들어줘"
→ 범위가 너무 큼
```

## 11.2 단계별 프롬프트 전략

### Step 1: 구조 설계

```bash
"[기능명] 모듈의 전체 구조를 설계해줘.
- 필요한 파일 목록
- 각 파일의 역할
- 의존성 관계
- 인터페이스 정의"
```

### Step 2: 핵심 로직

```bash
"[기능명]의 핵심 로직을 구현해줘.
- [구체적인 함수/메서드]
- 입력/출력 명세
- 예외 처리"
```

### Step 3: 테스트

```bash
"[기능명]의 테스트 코드를 작성해줘.
- 정상 케이스
- 엣지 케이스
- 에러 케이스"
```

### Step 4: 리팩토링

```bash
"[기능명] 코드를 리팩토링해줘.
- 중복 제거
- 성능 개선
- 가독성 향상"
```

## 11.3 Claude Code 워크플로우

```
[일일 개발 워크플로우]

1️⃣ 아침: 계획
   └── 오늘 구현할 기능 목록 작성
   └── 우선순위 정하기

2️⃣ 오전: 구조 설계
   └── Claude에게 구조 설계 요청
   └── 리뷰 및 수정

3️⃣ 오후: 구현
   └── 단위별로 구현 요청
   └── 코드 리뷰 및 테스트

4️⃣ 저녁: 통합 & 정리
   └── 코드 통합
   └── 문서화
   └── 커밋
```

## 11.4 프로젝트 컨텍스트 관리

### CLAUDE.md 파일 작성

```markdown
# CLAUDE.md - 프로젝트 컨텍스트

## 프로젝트 개요

다이노 파크 타이쿤 - 토스 앱스용 공룡 테마파크 타이쿤 게임

## 기술 스택

- Frontend: React 18, TypeScript, PixiJS, Zustand
- Backend: NestJS, Prisma, PostgreSQL, Redis

## 코드 컨벤션

- 함수명: camelCase
- 컴포넌트: PascalCase
- 파일명: kebab-case
- 인터페이스: I 접두사 없이

## 폴더 구조

[프로젝트 구조 포함]

## 주요 문서

- docs/gdd.md: 게임 설계 문서
- docs/balance.md: 밸런스 문서
  ...

## 현재 진행 상황

- [x] Phase 1: 프로젝트 셋업
- [ ] Phase 2: 백엔드 코어 (진행 중)
      ...
```

---

# 12. 문서별 개발 매핑

## 12.1 문서 → 개발 단계 매핑

| 문서                   | 주요 활용 단계 | 용도                     |
| ---------------------- | -------------- | ------------------------ |
| **GDD**                | 전체           | 기획 레퍼런스, 기능 명세 |
| **밸런스 시뮬레이션**  | Phase 2, 4, 7  | 수치 설정, 경제 로직     |
| **UI/UX 와이어프레임** | Phase 3, 5     | 화면 구현, 컴포넌트      |
| **공룡 도감**          | Phase 4, 5     | 공룡 데이터, 스탯        |
| **위인 도감**          | Phase 4, 5     | 위인 데이터, 시너지      |
| **스토리 시나리오**    | Phase 4, 5     | 스토리 데이터, 대사      |
| **기술 설계**          | Phase 1, 2     | 아키텍처, DB 스키마      |
| **사운드 가이드**      | Phase 5, 7     | 사운드 구현              |
| **수익 예측 모델**     | Phase 6        | IAP 상품, 가격           |
| **시즌 콘텐츠**        | Phase 5, 6     | 시즌 시스템, 데이터      |

## 12.2 기능별 참고 문서

### 파크 시스템

- GDD: 파크 시스템 섹션
- UI/UX: 파크 화면 와이어프레임
- 밸런스: 파크 레벨, 그리드 크기

### 공룡 시스템

- GDD: 공룡 시스템 섹션
- 공룡 도감: 전체 공룡 데이터
- 밸런스: 부화 시간, 상태 공식

### 경제 시스템

- GDD: 경제 시스템 섹션
- 밸런스: 모든 수치
- 수익 예측: 상품 가격, ARPU

### 스토리 시스템

- 스토리 시나리오: 전체 대사
- GDD: 스토리 시스템 섹션
- 시즌 콘텐츠: 시즌 스토리

---

# 📊 Executive Summary

## 개발 일정 요약

| Phase       | 기간       | 주요 산출물                |
| ----------- | ---------- | -------------------------- |
| **Phase 1** | Week 1-2   | 프로젝트 셋업, DB 스키마   |
| **Phase 2** | Week 3-6   | 백엔드 API, 핵심 로직      |
| **Phase 3** | Week 7-10  | 프론트엔드 UI, 게임 렌더링 |
| **Phase 4** | Week 11-16 | 게임 핵심 기능, MVP 완성   |
| **Phase 5** | Week 17-20 | 전체 콘텐츠, 시즌 시스템   |
| **Phase 6** | Week 21-24 | 수익화, 소셜 기능          |
| **Phase 7** | Week 25-28 | 테스트, 최적화             |
| **Phase 8** | Week 29-32 | 런칭 준비, 정식 런칭       |

## 리소스 예상

| 항목                   | 예상                  |
| ---------------------- | --------------------- |
| **개발 기간**          | 8개월 (32주)          |
| **Claude Code 활용도** | 70% (코드 생성, 리뷰) |
| **일일 작업 시간**     | 6-8시간               |
| **주요 기술**          | React, NestJS, PixiJS |

## 다음 단계

```
1️⃣ 즉시 시작: Phase 1 - 프로젝트 셋업
   └── 모노레포 생성
   └── DB 스키마 작성
   └── 개발 환경 구축

2️⃣ 첫 주 목표: MVP 구조 완성
   └── 기본 API 동작
   └── 화면 라우팅
   └── PixiJS 캔버스
```

---

_다이노 파크 타이쿤 - 개발 액션 플랜 v1.0_
_작성일: 2026년 1월_
