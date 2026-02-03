# 🔧 다이노 파크 타이쿤 - 기술 설계 문서
## Technical Design Document (TDD) v1.0

---

# 📋 목차

1. [기술 개요](#1-기술-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [핵심 게임 로직](#4-핵심-게임-로직)
5. [API 설계](#5-api-설계)
6. [실시간 시스템](#6-실시간-시스템)
7. [오프라인 & 동기화](#7-오프라인--동기화)
8. [보안 & 치트 방지](#8-보안--치트-방지)
9. [성능 최적화](#9-성능-최적화)
10. [배포 & 인프라](#10-배포--인프라)

---

# 1. 기술 개요

## 1.1 기술 스택

### 클라이언트 (토스 앱스)

| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| **프레임워크** | React + TypeScript | 토스 앱스 권장, 타입 안정성 |
| **상태 관리** | Zustand + React Query | 가볍고 직관적, 서버 상태 분리 |
| **렌더링** | PixiJS + React-Pixi | 2.5D 아이소메트릭, WebGL 가속 |
| **애니메이션** | Spine Runtime | 공룡 스켈레톤 애니메이션 |
| **UI** | Tailwind CSS | 빠른 스타일링, 토스 디자인 호환 |
| **로컬 저장** | IndexedDB (Dexie.js) | 오프라인 데이터 캐싱 |

### 서버

| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| **런타임** | Node.js + TypeScript | 프론트와 타입 공유 |
| **프레임워크** | NestJS | 구조화된 아키텍처, DI |
| **실시간** | Socket.IO | 이벤트 알림, 실시간 동기화 |
| **ORM** | Prisma | 타입 안전 쿼리, 마이그레이션 |
| **캐시** | Redis | 세션, 랭킹, 실시간 데이터 |
| **큐** | Bull (Redis 기반) | 백그라운드 작업, 오프라인 계산 |

### 데이터베이스

| 용도 | 기술 | 이유 |
|------|------|------|
| **메인 DB** | PostgreSQL | 복잡한 관계, 트랜잭션 |
| **캐시/세션** | Redis | 빠른 읽기, TTL 관리 |
| **분석** | ClickHouse | 대용량 로그, 통계 |
| **파일** | AWS S3 | 이미지, 에셋 저장 |

---

## 1.2 핵심 기술 요구사항

| 게임 특성 | 기술 요구사항 | 해결 방안 |
|-----------|--------------|----------|
| **82종 공룡 실시간 시뮬레이션** | 대량 엔티티 상태 관리 | ECS 패턴 + 청크 기반 업데이트 |
| **DNA 조합 (복잡한 레시피)** | 조합 규칙 엔진 | 룰 엔진 + 캐싱 |
| **스토리 분기 (3+ 엔딩)** | 선택 히스토리 추적 | 이벤트 소싱 패턴 |
| **50명 위인 버프 스택** | 다중 버프 계산 | 버프 시스템 + 메모이제이션 |
| **오프라인 진행** | 시간 기반 계산 | 델타 타임 시뮬레이션 |
| **탈출/사고 이벤트** | 확률 기반 이벤트 | 이벤트 스케줄러 + 랜덤 시드 |

---

# 2. 시스템 아키텍처

## 2.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 (토스 앱스)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  React UI   │  │  PixiJS     │  │  Zustand    │              │
│  │  Components │  │  Game       │  │  State      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              Game Controller                   │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │           API Client / Socket Client           │              │
│  └──────────────────────┬────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS / WSS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│       Rate Limit │ Auth Verify │ Load Balancer                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Game Server  │ │  Event Server │ │  Admin Server │
│ - 게임 로직   │ │ - 실시간 알림 │ │ - 운영 도구   │
│ - 상태 관리   │ │ - 이벤트 처리 │ │ - 통계 조회   │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  PostgreSQL   │ │    Redis      │ │  ClickHouse   │
│  (메인 DB)    │ │  (캐시/세션)  │ │  (분석 로그)  │
└───────────────┘ └───────────────┘ └───────────────┘
```

## 2.2 서버 모듈 구조

```
src/
├── modules/
│   ├── auth/                 # 인증/인가
│   ├── park/                 # 파크 관리
│   ├── dinosaur/             # 공룡 시스템
│   │   ├── dna.service.ts          # DNA 조합
│   │   ├── behavior.service.ts     # 행동 AI
│   │   └── hatch.service.ts        # 부화
│   ├── figure/               # 위인 시스템
│   │   ├── buff.service.ts         # 버프 계산
│   │   └── synergy.service.ts      # 시너지
│   ├── building/             # 건물 시스템
│   ├── exploration/          # 탐험 시스템
│   ├── story/                # 스토리 시스템
│   │   └── choice.service.ts       # 선택 분기
│   ├── economy/              # 경제 시스템
│   │   └── income.calculator.ts    # 수익 계산
│   ├── event/                # 이벤트 시스템
│   │   └── scheduler.service.ts    # 이벤트 스케줄러
│   └── simulation/           # 시뮬레이션 엔진
│       ├── offline.service.ts      # 오프라인 계산
│       └── tick.processor.ts       # 틱 처리
│
├── common/                   # 공통 유틸리티
├── core/                     # 핵심 인프라
│   ├── database/
│   ├── redis/
│   └── queue/
│
└── shared/
    └── game-data/            # 게임 데이터 (공룡, 위인 스펙)
```

---

# 3. 데이터베이스 설계

## 3.1 ERD 개요

```
┌──────────────────────────────────────────────────────────────┐
│                         USERS & PARKS                        │
├──────────────────────────────────────────────────────────────┤
│  users ──── parks ───┬── dinosaurs                          │
│                      ├── buildings                          │
│                      ├── figures                            │
│                      ├── story_progress                     │
│                      └── currencies                         │
└──────────────────────────────────────────────────────────────┘
```

## 3.2 핵심 테이블 스키마

### 사용자 & 파크

```sql
-- 사용자 테이블
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toss_user_id    VARCHAR(100) UNIQUE NOT NULL,
    nickname        VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    last_login_at   TIMESTAMP,
    is_premium      BOOLEAN DEFAULT FALSE
);

-- 파크 테이블 (1 유저 = 1 파크)
CREATE TABLE parks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    level           INT DEFAULT 1,
    exp             INT DEFAULT 0,

    -- 그리드 크기
    grid_size_x     INT DEFAULT 20,
    grid_size_y     INT DEFAULT 20,

    -- 파크 상태
    satisfaction    DECIMAL(5,2) DEFAULT 50.00,

    -- 시간 관련
    last_calc_at    TIMESTAMP DEFAULT NOW(),  -- 마지막 수익 계산 시점
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

-- 재화 테이블 (별도 관리)
CREATE TABLE currencies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    gold                BIGINT DEFAULT 10000,
    diamond             INT DEFAULT 100,
    dna                 INT DEFAULT 0,
    figure_point        INT DEFAULT 0,

    -- 탐험 에너지
    exploration_energy  INT DEFAULT 30,
    energy_last_recharged_at TIMESTAMP DEFAULT NOW(),

    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### 공룡 시스템

```sql
-- 공룡 정의 (게임 데이터, 읽기 전용)
CREATE TABLE dinosaur_definitions (
    id              VARCHAR(20) PRIMARY KEY,  -- "DINO_001"
    name_ko         VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100) NOT NULL,
    category        VARCHAR(20) NOT NULL,     -- herbivore, carnivore, pterosaur, marine, hybrid
    rarity          VARCHAR(20) NOT NULL,     -- common, uncommon, rare, epic, legendary
    
    -- 기본 스탯
    base_income     INT NOT NULL,
    base_popularity INT NOT NULL,
    base_upkeep     INT NOT NULL,
    
    -- 서식지 요구사항
    habitat_type    VARCHAR(50) NOT NULL,
    space_required  INT NOT NULL,
    
    -- 특수 능력 (JSON)
    passive_ability JSONB,
    
    -- 하이브리드 조합 레시피
    is_hybrid       BOOLEAN DEFAULT FALSE,
    recipe          JSONB,
    
    -- 시너지 태그
    synergy_tags    VARCHAR[] DEFAULT '{}'
);

-- 플레이어 소유 공룡
CREATE TABLE dinosaurs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    park_id         UUID REFERENCES parks(id) ON DELETE CASCADE,
    definition_id   VARCHAR(20) REFERENCES dinosaur_definitions(id),
    
    -- 개체 정보
    nickname        VARCHAR(50),
    gender          VARCHAR(10),
    
    -- 상태
    health          INT DEFAULT 100,
    happiness       INT DEFAULT 100,
    hunger          INT DEFAULT 100,
    stress          INT DEFAULT 0,
    
    -- 배치 정보
    habitat_id      UUID,
    
    -- 친밀도
    intimacy        INT DEFAULT 0,
    
    -- 유전자 변이
    genetics        JSONB DEFAULT '{}',
    
    obtained_at     TIMESTAMP DEFAULT NOW()
);

-- DNA 인벤토리
CREATE TABLE dna_inventory (
    park_id         UUID REFERENCES parks(id) ON DELETE CASCADE,
    definition_id   VARCHAR(20) REFERENCES dinosaur_definitions(id),
    amount          INT DEFAULT 0,
    PRIMARY KEY (park_id, definition_id)
);

-- 부화 중인 알
CREATE TABLE incubating_eggs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    park_id         UUID REFERENCES parks(id) ON DELETE CASCADE,
    definition_id   VARCHAR(20),
    started_at      TIMESTAMP DEFAULT NOW(),
    duration_sec    INT NOT NULL,
    status          VARCHAR(20) DEFAULT 'incubating'
);
```

### 위인 시스템

```sql
-- 위인 정의 (게임 데이터)
CREATE TABLE figure_definitions (
    id              VARCHAR(20) PRIMARY KEY,  -- "GF-001"
    name_ko         VARCHAR(100) NOT NULL,
    role            VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    rarity          VARCHAR(20) NOT NULL,
    
    -- 영입 정보
    recruit_cost    INT NOT NULL,
    unlock_condition JSONB,
    
    -- 능력 (레벨별) - JSON 구조
    abilities       JSONB NOT NULL,
    /*
    {
        "passive": {"type": "dna_combine_time", "base": -0.10, "per_level": -0.04},
        "bonus": {"type": "combine_success", "unlock_level": 3, "base": 0.02},
        "ultimate": {"type": "unlock_indominus", "unlock_level": 10}
    }
    */
    
    -- 시너지
    synergy_pairs   JSONB
);

-- 플레이어 보유 위인
CREATE TABLE park_figures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    park_id         UUID REFERENCES parks(id) ON DELETE CASCADE,
    definition_id   VARCHAR(20) REFERENCES figure_definitions(id),
    
    level           INT DEFAULT 1,
    affection       INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    
    obtained_at     TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(park_id, definition_id)
);
```

### 스토리 시스템

```sql
-- 플레이어 스토리 진행
CREATE TABLE story_progress (
    park_id         UUID PRIMARY KEY REFERENCES parks(id) ON DELETE CASCADE,
    
    current_chapter VARCHAR(20),
    current_scene   VARCHAR(50),
    
    -- 완료 목록
    completed_chapters VARCHAR[] DEFAULT '{}',
    
    -- 선택 히스토리 (이벤트 소싱)
    choice_history  JSONB DEFAULT '[]',
    /*
    [
        {"choice_id": "ch3_lewis_deal", "selected": "A", "timestamp": "..."},
        ...
    ]
    */
    
    -- 스토리 플래그
    flags           JSONB DEFAULT '{}',
    
    -- 엔딩 포인트
    ending_points   JSONB DEFAULT '{"hope": 0, "cage": 0, "necessary": 0}',
    
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 건물 시스템

```sql
-- 건물 정의 (게임 데이터)
CREATE TABLE building_definitions (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_ko         VARCHAR(100) NOT NULL,
    category        VARCHAR(30) NOT NULL,  -- 'dinosaur', 'viewing', 'show', 'convenience', 'production', 'research', 'operation', 'decoration'

    -- 건설 비용
    cost_gold       INTEGER NOT NULL DEFAULT 0,
    cost_wood       INTEGER NOT NULL DEFAULT 0,
    cost_stone      INTEGER NOT NULL DEFAULT 0,
    cost_metal      INTEGER NOT NULL DEFAULT 0,
    cost_glass      INTEGER NOT NULL DEFAULT 0,
    cost_diamond    INTEGER NOT NULL DEFAULT 0,

    -- 크기 및 배치
    size_x          INTEGER NOT NULL DEFAULT 1,
    size_y          INTEGER NOT NULL DEFAULT 1,

    -- 효과
    revenue_per_hour    INTEGER DEFAULT 0,
    production_type     VARCHAR(30),
    production_amount   INTEGER DEFAULT 0,
    buff_type           VARCHAR(50),
    buff_value          DECIMAL(5,2),

    -- 업그레이드 정보
    max_level       INTEGER NOT NULL DEFAULT 5,

    -- 해금 조건
    unlock_park_level   INTEGER DEFAULT 1,
    unlock_chapter      VARCHAR(20),
    unlock_figure_id    VARCHAR(50),

    created_at      TIMESTAMP DEFAULT NOW()
);

-- 파크 내 배치된 건물
CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    park_id         UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    definition_id   VARCHAR(50) NOT NULL REFERENCES building_definitions(id),

    -- 배치 정보
    position_x      INTEGER NOT NULL,
    position_y      INTEGER NOT NULL,

    -- 상태
    level           INTEGER NOT NULL DEFAULT 1,
    status          VARCHAR(20) DEFAULT 'active',  -- 'constructing', 'active', 'upgrading'

    -- 위인 배치
    assigned_figure_id  UUID REFERENCES park_figures(id),

    -- 건설/업그레이드 타이머
    construction_ends_at    TIMESTAMP,

    -- 생산 시설용
    last_collected_at       TIMESTAMP DEFAULT NOW(),

    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buildings_park ON buildings(park_id);
```

### 탐험 시스템

```sql
-- 탐험 지역 정의
CREATE TABLE exploration_regions (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_ko         VARCHAR(100) NOT NULL,

    -- 지역 정보
    tier            INTEGER NOT NULL DEFAULT 1,  -- 1~5
    energy_cost     INTEGER NOT NULL DEFAULT 5,
    duration_minutes INTEGER NOT NULL DEFAULT 60,

    -- 해금 조건
    unlock_park_level   INTEGER DEFAULT 1,
    unlock_chapter      VARCHAR(20),

    -- 보상 테이블 (JSON)
    reward_pool     JSONB NOT NULL,
    /*
    {
        "common": [{"type": "dinosaur", "id": "001", "weight": 30}, ...],
        "uncommon": [...],
        "rare": [...],
        "resources": [{"type": "gold", "min": 100, "max": 500}, ...]
    }
    */

    created_at      TIMESTAMP DEFAULT NOW()
);

-- 탐험 기록
CREATE TABLE explorations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    park_id         UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    region_id       VARCHAR(50) NOT NULL REFERENCES exploration_regions(id),

    -- 상태
    status          VARCHAR(20) DEFAULT 'in_progress',  -- 'in_progress', 'completed', 'claimed'

    -- 타이밍
    started_at      TIMESTAMP DEFAULT NOW(),
    ends_at         TIMESTAMP NOT NULL,
    claimed_at      TIMESTAMP,

    -- 보상 (탐험 완료 시 결정)
    rewards         JSONB,
    /*
    {
        "dinosaurs": [{"definition_id": "001", "rarity": "common"}],
        "resources": {"gold": 350, "dna": 50},
        "items": []
    }
    */

    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_explorations_park ON explorations(park_id);
CREATE INDEX idx_explorations_status ON explorations(status);
```

## 3.3 Redis 스키마

```yaml
# 세션 관리
session:{user_id}:
  type: hash
  ttl: 24h

# 파크 실시간 상태 (캐시)
park:{park_id}:state:
  type: hash
  ttl: 1h

# 활성 버프 (계산된 총합)
park:{park_id}:buffs:
  type: hash
  ttl: 10m

# 진행 중 작업
park:{park_id}:tasks:
  type: sorted_set
  score: completion_timestamp
  
# 랭킹
ranking:weekly:income:
  type: sorted_set
```

---

# 4. 핵심 게임 로직

## 4.1 수익 계산 시스템

```typescript
// income.calculator.ts

class IncomeCalculator {
  /**
   * 파크의 시간당 총 수익 계산
   * 
   * 공식:
   * 총수익 = Σ(공룡별 기본수익) × (1 + 위인버프) × (1 + 시너지버프) × 만족도계수
   */
  calculateHourlyIncome(park: Park): IncomeResult {
    // 1. 공룡별 기본 수익 합산
    const baseIncome = this.sumDinosaurIncome(park.dinosaurs);
    
    // 2. 버프 수집 및 적용
    const figureBuffs = this.getFigureBuffs(park.figures);
    const synergyBuffs = this.getSynergyBuffs(park.dinosaurs);
    const facilityBuffs = this.getFacilityBuffs(park.buildings);
    
    // 3. 버프 계산 (가산 → 승산 순서)
    let multiplier = 1.0;
    multiplier += this.sumAdditiveBuffs([...figureBuffs, ...synergyBuffs, ...facilityBuffs]);
    multiplier *= this.applyMultiplicativeBuffs(facilityBuffs);
    
    // 4. 만족도 계수 (50% → 1.0x, 100% → 1.5x)
    const satisfactionCoef = 0.5 + (park.satisfaction / 100);
    multiplier *= satisfactionCoef;
    
    return {
      base: baseIncome,
      multiplier,
      total: Math.floor(baseIncome * multiplier)
    };
  }
  
  /**
   * 공룡별 수익 계산
   */
  private sumDinosaurIncome(dinosaurs: Dinosaur[]): number {
    return dinosaurs
      .filter(d => d.habitatId && d.health > 0)
      .reduce((sum, dino) => {
        let income = dino.definition.baseIncome;
        
        // 친밀도 보너스 (100당 +5%)
        income *= (1 + Math.floor(dino.intimacy / 100) * 0.05);
        
        // 건강 페널티
        if (dino.health < 50) income *= 0.5;
        else if (dino.health < 80) income *= 0.8;
        
        // 행복도 보너스/페널티 (±15%)
        income *= (1 + (dino.happiness - 50) / 100 * 0.3);
        
        return sum + income;
      }, 0);
  }
}
```

## 4.2 오프라인 수익 계산

```typescript
// offline.service.ts

class OfflineService {
  private readonly MAX_OFFLINE_HOURS = 24;
  private readonly OFFLINE_EFFICIENCY = 0.5;  // 50%
  
  async calculateOfflineProgress(parkId: string, lastCalcAt: Date): Promise<OfflineResult> {
    const elapsedHours = Math.min(
      (Date.now() - lastCalcAt.getTime()) / (1000 * 60 * 60),
      this.MAX_OFFLINE_HOURS
    );
    
    if (elapsedHours < 0.01) return { income: 0, events: [] };
    
    // 1. 시점 기준 파크 상태 로드
    const parkSnapshot = await this.loadParkState(parkId);
    
    // 2. 시간당 수익 계산
    const hourlyIncome = this.incomeCalculator.calculateHourlyIncome(parkSnapshot);
    
    // 3. 오프라인 효율 적용
    const totalIncome = Math.floor(
      hourlyIncome.total * elapsedHours * this.OFFLINE_EFFICIENCY
    );
    
    // 4. 완료된 작업 처리 (부화, 건설 등)
    const completedTasks = await this.processCompletedTasks(parkId);
    
    // 5. 공룡 상태 변화 (배고픔 등)
    const dinoChanges = this.simulateDinoStateChanges(parkSnapshot.dinosaurs, elapsedHours);
    
    return {
      elapsedHours,
      income: totalIncome,
      completedTasks,
      dinoChanges
    };
  }
}
```

## 4.3 DNA 조합 시스템

```typescript
// dna.service.ts

class DNAService {
  async startCombine(parkId: string, recipeId: string): Promise<CombineTask> {
    const recipe = await this.getRecipe(recipeId);
    const inventory = await this.getDNAInventory(parkId);
    
    // 1. 재료 검증
    for (const ingredient of recipe.ingredients) {
      if ((inventory.get(ingredient.dinoId) || 0) < ingredient.amount) {
        throw new InsufficientDNAError(ingredient.dinoId);
      }
    }
    
    // 2. 재료 차감
    await this.deductDNA(parkId, recipe.ingredients);
    
    // 3. 성공률 계산 (위인 버프 적용)
    const buffs = await this.getBuffs(parkId);
    const successRate = Math.min(0.95, 
      recipe.baseSuccessRate + (buffs.combineSuccess || 0)
    );
    
    // 4. 소요 시간 계산
    const duration = Math.floor(
      recipe.baseDuration * (1 - (buffs.combineTimeReduction || 0))
    );
    
    // 5. 작업 생성
    return this.createTask({
      parkId,
      recipeId,
      successRate,
      duration,
      seed: this.generateSeed()  // 결과 재현용
    });
  }
  
  async completeCombine(taskId: string): Promise<CombineResult> {
    const task = await this.getTask(taskId);
    const rng = this.createRNG(task.seed);
    
    if (rng.random() <= task.successRate) {
      const dino = await this.createDinosaur(task.parkId, task.recipeId);
      return { success: true, dinosaur: dino };
    } else {
      await this.refundDNA(task.parkId, task.recipeId, 0.2);  // 20% 환불
      return { success: false };
    }
  }
}
```

## 4.4 스토리 분기 시스템

```typescript
// story.service.ts

class StoryService {
  async processChoice(parkId: string, choiceId: string, option: string): Promise<ChoiceResult> {
    const choiceDef = await this.getChoiceDefinition(choiceId);
    const selected = choiceDef.options.find(o => o.id === option);
    
    // 1. 선택 기록 (이벤트 소싱)
    await this.recordChoice(parkId, { choiceId, option, timestamp: new Date() });
    
    // 2. 효과 적용
    if (selected.effects.affection) {
      await this.applyAffectionChanges(parkId, selected.effects.affection);
    }
    
    if (selected.effects.flags) {
      await this.setFlags(parkId, selected.effects.flags);
    }
    
    if (selected.effects.endingPoints) {
      await this.addEndingPoints(parkId, selected.effects.endingPoints);
    }
    
    // 3. 엔딩 루트 재계산 (major 선택지일 경우)
    if (choiceDef.impact === 'major' || choiceDef.impact === 'ending') {
      await this.recalculateEndingRoute(parkId);
    }
    
    return { nextScene: selected.nextScene, effects: selected.effects };
  }
  
  async calculateEndingRoute(parkId: string): Promise<string> {
    const progress = await this.getProgress(parkId);
    
    // 히든 엔딩 조건 체크
    if (await this.checkTrueHeirConditions(parkId)) {
      return 'true_heir';
    }
    
    // 포인트 기반 엔딩
    const { hope, cage, necessary } = progress.endingPoints;
    if (hope >= cage && hope >= necessary) return 'hope';
    if (cage >= necessary) return 'cage';
    return 'necessary';
  }
}
```

## 4.5 버프 시스템

```typescript
// buff.service.ts

class BuffService {
  private cache: Map<string, { buffs: BuffMap, timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000;  // 10분
  
  async getAllBuffs(parkId: string): Promise<BuffMap> {
    // 캐시 체크
    const cached = this.cache.get(parkId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.buffs;
    }
    
    // 버프 수집
    const allBuffs: Buff[] = [];
    
    // 1. 위인 버프
    const figures = await this.getFigures(parkId);
    for (const figure of figures.filter(f => f.isActive)) {
      allBuffs.push(...this.calculateFigureBuffs(figure));
    }
    
    // 2. 위인 시너지
    allBuffs.push(...this.calculateFigureSynergies(figures));
    
    // 3. 공룡 패시브
    const dinosaurs = await this.getDinosaurs(parkId);
    for (const dino of dinosaurs.filter(d => d.habitatId)) {
      allBuffs.push(...this.calculateDinoPassive(dino));
    }
    
    // 4. 공룡 시너지
    allBuffs.push(...this.calculateDinoSynergies(dinosaurs));
    
    // 5. 건물 버프
    const buildings = await this.getBuildings(parkId);
    allBuffs.push(...this.calculateBuildingBuffs(buildings));
    
    // 6. 합산
    const aggregated = this.aggregateBuffs(allBuffs);
    
    // 캐시 저장
    this.cache.set(parkId, { buffs: aggregated, timestamp: Date.now() });
    
    return aggregated;
  }
  
  private aggregateBuffs(buffs: Buff[]): BuffMap {
    const result = new Map<BuffType, number>();
    
    for (const buff of buffs) {
      const current = result.get(buff.type) || 0;
      
      if (buff.stackable) {
        result.set(buff.type, current + buff.value);
      } else {
        result.set(buff.type, Math.max(current, buff.value));
      }
    }
    
    return result;
  }
}
```

---

# 5. API 설계

## 5.1 기본 규칙

```yaml
Base URL: https://api.dinopark.game/v1

인증: Bearer Token (JWT)

응답 형식:
  성공: { "success": true, "data": {...} }
  실패: { "success": false, "error": {"code": "...", "message": "..."} }
```

## 5.2 주요 엔드포인트

### 인증

```yaml
POST /auth/toss-login     # 토스 로그인
POST /auth/refresh        # 토큰 갱신
```

### 파크

```yaml
GET  /park                # 파크 정보 (+ 오프라인 수익 적용)
GET  /park/stats          # 파크 통계
PATCH /park               # 파크 수정
```

### 공룡

```yaml
GET  /dinosaurs           # 공룡 목록
GET  /dinosaurs/:id       # 공룡 상세
POST /dinosaurs/hatch     # 부화 시작
POST /dinosaurs/hatch/:id/complete  # 부화 완료
PATCH /dinosaurs/:id      # 공룡 수정 (배치, 이름 등)

GET  /dna                 # DNA 인벤토리
POST /dna/combine         # DNA 조합 시작
POST /dna/combine/:id/complete  # 조합 완료
```

### 위인

```yaml
GET  /figures             # 보유 위인 목록
GET  /figures/available   # 영입 가능 위인
POST /figures/recruit     # 위인 영입
POST /figures/:id/levelup # 레벨업
POST /figures/:id/gift    # 선물
```

### 건물

```yaml
GET  /buildings           # 건물 목록
POST /buildings           # 건물 건설
POST /buildings/:id/upgrade  # 업그레이드
POST /buildings/:id/move  # 이동
DELETE /buildings/:id     # 철거
```

### 스토리

```yaml
GET  /story               # 스토리 진행 상태
POST /story/choice        # 선택지 선택
GET  /story/chapters      # 챕터 목록
```

### 탐험

```yaml
GET  /expeditions         # 탐험 목록
POST /expeditions/start   # 탐험 시작
POST /expeditions/:id/complete  # 탐험 완료
```

### 상점

```yaml
GET  /shop                # 상점 목록
POST /shop/purchase       # 구매
POST /shop/iap/verify     # 인앱 결제 검증
```

## 5.3 요청/응답 DTO

### 공통

```typescript
// 성공 응답
interface ApiResponse<T> {
  success: true;
  data: T;
}

// 에러 응답
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// 페이지네이션
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
```

### 파크 API

```typescript
// GET /park 응답
interface GetParkResponse {
  park: {
    id: string;
    name: string;
    level: number;
    exp: number;
    gridSizeX: number;
    gridSizeY: number;
    satisfaction: number;
    lastCalcAt: string;
  };
  currency: {
    gold: number;
    diamond: number;
    dna: number;
    figurePoint: number;
    explorationEnergy: number;
  };
  offlineReward?: {
    gold: number;
    duration: number;  // 분
  };
}
```

### 공룡 API

```typescript
// GET /dinosaurs 응답
interface GetDinosaursResponse {
  dinosaurs: Dinosaur[];
}

interface Dinosaur {
  id: string;
  definitionId: string;
  nickname: string | null;
  level: number;
  exp: number;
  happiness: number;
  hunger: number;
  intimacy: number;
  positionX: number;
  positionY: number;
  isInPark: boolean;
  lastFedAt: string;
}

// POST /dinosaurs/hatch 요청
interface HatchDinosaurRequest {
  eggType: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  slotIndex: number;
}

// POST /dinosaurs/:id/feed 요청
interface FeedDinosaurRequest {
  foodType: 'basic' | 'premium';
}

// POST /dinosaurs/:id/feed 응답
interface FeedDinosaurResponse {
  dinosaur: Dinosaur;
  currencyChange: {
    gold: number;  // 음수 (비용)
  };
}
```

### 건물 API

```typescript
// POST /buildings 요청
interface BuildBuildingRequest {
  definitionId: string;
  positionX: number;
  positionY: number;
}

// POST /buildings/:id/upgrade 응답
interface UpgradeBuildingResponse {
  building: Building;
  currencyChange: {
    gold?: number;
    wood?: number;
    stone?: number;
  };
}
```

### 탐험 API

```typescript
// POST /expeditions/start 요청
interface StartExpeditionRequest {
  regionId: string;
  dinosaurIds?: string[];  // 탐험에 보낼 공룡 (선택)
}

// POST /expeditions/:id/complete 응답
interface CompleteExpeditionResponse {
  rewards: {
    dinosaurs: { definitionId: string; rarity: string }[];
    resources: { gold?: number; dna?: number; };
    items: { id: string; amount: number }[];
  };
  currencyChange: {
    gold: number;
    dna: number;
  };
}
```

## 5.4 에러 코드

```typescript
enum ErrorCode {
  // 인증 (1xxx)
  AUTH_INVALID_TOKEN = 'AUTH_1001',
  AUTH_EXPIRED_TOKEN = 'AUTH_1002',
  AUTH_TOSS_FAILED = 'AUTH_1003',

  // 파크 (2xxx)
  PARK_NOT_FOUND = 'PARK_2001',
  PARK_GRID_OCCUPIED = 'PARK_2002',
  PARK_LEVEL_REQUIRED = 'PARK_2003',

  // 공룡 (3xxx)
  DINO_NOT_FOUND = 'DINO_3001',
  DINO_ALREADY_IN_PARK = 'DINO_3002',
  DINO_HATCH_SLOT_FULL = 'DINO_3003',
  DINO_INSUFFICIENT_DNA = 'DINO_3004',

  // 건물 (4xxx)
  BUILDING_NOT_FOUND = 'BUILDING_4001',
  BUILDING_CONSTRUCTION_IN_PROGRESS = 'BUILDING_4002',
  BUILDING_MAX_LEVEL = 'BUILDING_4003',

  // 재화 (5xxx)
  CURRENCY_INSUFFICIENT_GOLD = 'CURRENCY_5001',
  CURRENCY_INSUFFICIENT_DIAMOND = 'CURRENCY_5002',
  CURRENCY_INSUFFICIENT_ENERGY = 'CURRENCY_5003',

  // 탐험 (6xxx)
  EXPEDITION_NOT_FOUND = 'EXPEDITION_6001',
  EXPEDITION_ALREADY_ACTIVE = 'EXPEDITION_6002',
  EXPEDITION_REGION_LOCKED = 'EXPEDITION_6003',
}
```

---

# 6. 실시간 시스템

## 6.1 WebSocket 이벤트

```typescript
// 서버 → 클라이언트
interface ServerEvents {
  'dinosaur:escaped': { dinosaurId: string };
  'dinosaur:sick': { dinosaurId: string; disease: string };
  'task:completed': { taskType: string; taskId: string; result: any };
  'visitor:surge': { count: number; reason: string };
  'income:collected': { amount: number };
  'story:unlock': { chapterId: string };
}
```

## 6.2 이벤트 스케줄러

```typescript
// event-scheduler.service.ts

class EventScheduler {
  async scheduleRandomEvents(parkId: string) {
    const park = await this.getPark(parkId);
    
    // 탈출 이벤트 (육식공룡)
    for (const dino of park.dinosaurs.filter(d => d.category === 'carnivore')) {
      const escapeChance = this.calculateEscapeChance(dino, park);
      if (Math.random() < escapeChance) {
        await this.scheduleEvent(parkId, 'dinosaur_escape', { dinosaurId: dino.id });
      }
    }
    
    // 질병 이벤트
    if (Math.random() < 0.02) {  // 2%
      const victim = this.selectRandomDino(park.dinosaurs);
      await this.scheduleEvent(parkId, 'disease_outbreak', { dinosaurId: victim.id });
    }
  }
  
  private calculateEscapeChance(dino: Dinosaur, park: Park): number {
    let chance = 0.001;  // 기본 0.1%
    chance += dino.stress * 0.0001;  // 스트레스 100 → +1%
    if (dino.hunger < 30) chance += 0.005;  // 배고프면 +0.5%
    
    // 위인 버프 적용
    chance *= (1 - (park.buffs.escapePreventoion || 0));
    
    return chance;
  }
}
```

---

# 7. 오프라인 & 동기화

## 7.0 게임 데이터 로드 (game-data)

### 정적 게임 데이터 구조

```
packages/game-data/
├── dinosaurs/
│   ├── index.ts           # 전체 공룡 데이터 export
│   ├── herbivores.ts      # 초식 25종
│   ├── carnivores.ts      # 육식 25종
│   ├── pterosaurs.ts      # 익룡 12종
│   ├── marines.ts         # 해양 10종
│   └── hybrids.ts         # 하이브리드 10종
├── buildings/
│   └── index.ts           # 건물 50종
├── greatFigures/
│   └── index.ts           # 위인 50명
├── explorations/
│   └── regions.ts         # 탐험 지역
├── stories/
│   └── index.ts           # 스토리 챕터
└── balance/
    └── constants.ts       # 밸런스 상수
```

### 로드 방식

```typescript
// 1. 빌드 타임에 번들링 (권장)
// vite.config.ts
export default {
  optimizeDeps: {
    include: ['@dino-park/game-data']
  }
}

// 2. 클라이언트에서 사용
import { DINOSAURS, getDinosaurById } from '@dino-park/game-data';

const trex = getDinosaurById('026');  // 티라노사우루스

// 3. 서버에서 사용
import { BUILDINGS, getUnlockableFigures } from '@dino-park/game-data';

const availableFigures = getUnlockableFigures(parkLevel, completedChapters);
```

### 데이터 버전 관리

```typescript
// game-data 버전 (클라이언트-서버 동기화 확인용)
export const GAME_DATA_VERSION = '1.0.0';

// 클라이언트 시작 시 버전 확인
const serverVersion = await api.getGameDataVersion();
if (serverVersion !== GAME_DATA_VERSION) {
  // 클라이언트 업데이트 필요 알림
}
```

## 7.1 클라이언트 IndexedDB 스키마

```typescript
// client/db/schema.ts
import Dexie from 'dexie';

interface DinoParkDB extends Dexie {
  // 사용자 데이터 캐시
  park: Dexie.Table<ParkCache, string>;
  dinosaurs: Dexie.Table<DinosaurCache, string>;
  buildings: Dexie.Table<BuildingCache, string>;
  figures: Dexie.Table<FigureCache, string>;
  currency: Dexie.Table<CurrencyCache, string>;

  // 오프라인 액션 큐
  pendingActions: Dexie.Table<PendingAction, string>;

  // 메타데이터
  syncMeta: Dexie.Table<SyncMeta, string>;
}

const db = new Dexie('DinoParkDB') as DinoParkDB;

db.version(1).stores({
  // 기본 키: id, 인덱스: updatedAt
  park: 'id, updatedAt',
  dinosaurs: 'id, parkId, definitionId, updatedAt',
  buildings: 'id, parkId, definitionId, status, updatedAt',
  figures: 'id, definitionId, assignedBuildingId, updatedAt',
  currency: 'userId, updatedAt',

  // 오프라인 액션
  pendingActions: 'id, timestamp, synced, actionType',

  // 동기화 메타
  syncMeta: 'key'
});

// 캐시 타입
interface ParkCache {
  id: string;
  name: string;
  level: number;
  exp: number;
  gridSizeX: number;
  gridSizeY: number;
  updatedAt: number;  // timestamp
}

interface PendingAction {
  id: string;
  actionType: 'feed_dinosaur' | 'build' | 'upgrade' | 'move' | 'collect';
  payload: Record<string, any>;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

interface SyncMeta {
  key: string;  // 'lastSync', 'gameDataVersion', etc.
  value: any;
  updatedAt: number;
}

export { db, DinoParkDB };
```

## 7.2 클라이언트 오프라인 처리

```typescript
// client/offline.manager.ts

class OfflineManager {
  private pendingActions: Action[] = [];
  
  async queueAction(action: Action) {
    await this.db.pendingActions.add({
      id: generateId(),
      action,
      timestamp: Date.now(),
      synced: false
    });
    
    // 낙관적 업데이트 (로컬 즉시 반영)
    this.applyOptimistically(action);
  }
  
  async syncPendingActions() {
    const pending = await this.db.pendingActions
      .where('synced').equals(false)
      .sortBy('timestamp');
    
    for (const item of pending) {
      const result = await this.api.syncAction(item.action);
      
      if (result.corrections) {
        this.applyCorrections(result.corrections);
      }
      
      await this.db.pendingActions.update(item.id, { synced: true });
    }
  }
}
```

## 7.2 서버 동기화 API

```typescript
// sync.controller.ts

@Post('/sync')
async sync(@Body() body: SyncRequest) {
  const { lastSyncAt, pendingActions } = body;
  
  // 1. 오프라인 수익 계산
  const offlineResult = await this.offlineService.calculate(parkId, lastSyncAt);
  
  // 2. 클라이언트 액션 적용
  const actionResults = await this.processActions(pendingActions);
  
  // 3. 현재 상태 반환
  const currentState = await this.getParkState(parkId);
  
  return { offlineResult, actionResults, currentState };
}
```

---

# 8. 보안 & 치트 방지

## 8.1 서버 권한 검증

```typescript
// validators/action.validator.ts

class ActionValidator {
  validateCurrencyAction(park: Park, action: CurrencyAction): boolean {
    if (action.type === 'spend_gold' && park.gold < action.amount) {
      throw new InsufficientFundsError();
    }
    if (action.amount < 0 || action.amount > MAX_TRANSACTION) {
      throw new InvalidAmountError();
    }
    return true;
  }
  
  validateTimeAction(action: TimeAction, lastCalcAt: Date): boolean {
    // 미래 시간 조작 방지
    if (action.timestamp > Date.now() + TIME_TOLERANCE) {
      throw new FutureTimestampError();
    }
    // 이미 계산된 시간 방지
    if (action.timestamp < lastCalcAt.getTime()) {
      throw new OutdatedRequestError();
    }
    return true;
  }
}
```

## 8.2 치트 감지

```typescript
// anticheat.service.ts

class AntiCheatService {
  async detectAbnormalProgress(parkId: string) {
    const account = await this.getAccount(parkId);
    const ageHours = (Date.now() - account.createdAt) / (1000 * 60 * 60);
    
    // 예상 진행도
    const expectedLevel = Math.floor(Math.sqrt(ageHours) * 2);
    const expectedDinos = Math.floor(ageHours / 2);
    
    if (account.level > expectedLevel * 2 || account.dinoCount > expectedDinos * 3) {
      await this.flagSuspicious(parkId, 'abnormal_progress');
    }
  }
}
```

---

# 9. 성능 최적화

## 9.1 클라이언트 최적화

```typescript
// 청크 기반 렌더링
class ParkRenderer {
  updateVisibleChunks() {
    const visible = this.getVisibleChunkIds();
    
    // 안 보이는 청크 언로드
    for (const [id, chunk] of this.chunks) {
      if (!visible.includes(id)) {
        this.unloadChunk(chunk);
      }
    }
    
    // 새로 보이는 청크 로드
    for (const id of visible) {
      if (!this.chunks.has(id)) {
        this.loadChunk(id);
      }
    }
  }
}

// 오브젝트 풀링
class SpritePool {
  private pools: Map<string, Sprite[]> = new Map();
  
  get(type: string): Sprite {
    const pool = this.pools.get(type) || [];
    return pool.pop() || this.create(type);
  }
  
  release(type: string, sprite: Sprite) {
    sprite.visible = false;
    const pool = this.pools.get(type) || [];
    pool.push(sprite);
  }
}
```

## 9.2 서버 최적화

```typescript
// 쿼리 최적화 - 단일 쿼리로 관계 데이터 로드
async loadParkWithRelations(parkId: string) {
  return prisma.park.findUnique({
    where: { id: parkId },
    include: {
      dinosaurs: { where: { habitatId: { not: null } }, include: { definition: true } },
      figures: { where: { isActive: true }, include: { definition: true } },
      buildings: { where: { status: 'completed' } }
    }
  });
}

// 캐싱 전략
class CachingStrategy {
  // 정적 게임 데이터: 메모리 + Redis 24시간
  async getDefinition(id: string) {
    return this.memoryCache.get(id) 
        || await this.redis.get(`def:${id}`)
        || await this.loadAndCache(id);
  }
  
  // 동적 파크 상태: Redis 1분 + 무효화
  async getParkState(parkId: string) {
    const cached = await this.redis.get(`park:${parkId}`);
    if (cached) return JSON.parse(cached);
    
    const state = await this.loadState(parkId);
    await this.redis.setex(`park:${parkId}`, 60, JSON.stringify(state));
    return state;
  }
}
```

---

# 10. 배포 & 인프라

## 10.1 Kubernetes 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dinopark-api
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api
          image: dinopark/api:latest
          resources:
            requests: { memory: "512Mi", cpu: "250m" }
            limits: { memory: "1Gi", cpu: "500m" }
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dinopark-hpa
spec:
  scaleTargetRef:
    name: dinopark-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
```

## 10.2 모니터링 알림

```typescript
const alerts = [
  { name: 'High Error Rate', condition: 'error_rate > 1%', severity: 'critical' },
  { name: 'High Latency', condition: 'p99_latency > 500ms', severity: 'warning' },
  { name: 'DB Pool Exhausted', condition: 'db_pool < 5', severity: 'critical' }
];
```

---

# 📊 부록: 기술 요약

## 핵심 시스템별 기술 선택

| 시스템 | 기술 | 이유 |
|--------|------|------|
| **수익 계산** | Redis 캐싱 + 델타 계산 | 실시간 + 오프라인 효율 |
| **DNA 조합** | 룰 엔진 + 시드 기반 랜덤 | 재현 가능한 결과 |
| **스토리 분기** | 이벤트 소싱 + 플래그 | 완벽한 히스토리 |
| **버프 시스템** | 메모이제이션 + 캐시 | 복잡한 계산 최적화 |
| **실시간** | Socket.IO + Redis Pub/Sub | 확장 가능 |
| **오프라인** | 낙관적 업데이트 + 충돌 해결 | UX 최적화 |

## 예상 리소스

| 항목 | 수치 |
|------|------|
| DB 용량 (유저당) | ~50KB |
| 일일 API 호출 (유저당) | ~500회 |
| 동시 접속 | DAU의 30% |

## 확장 계획

| DAU | 인프라 |
|-----|--------|
| ~10K | 서버 3대, DB 1대 |
| ~100K | 서버 10대, DB 리플리카 |
| ~500K | 오토스케일링, 샤딩 |

---

*© 2025 Dino Park Tycoon - Technical Design Document v1.0*
