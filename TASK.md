# DINO PARK TYCOON - TASK QUEUE

> **이 파일이 작업의 유일한 진실(Single Source of Truth)입니다.**
> 모든 작업은 이 큐를 기준으로 진행합니다.

---

## 📋 QUEUE (대기)

### 🔴 높음 (핵심 누락)

- [ ] **C02: Building Feature 생성 (Frontend)**
  - 위치: `apps/client/src/features/building/`
  - AC: BuildingPage.tsx, BuildingCard.tsx, BuildingList.tsx, useBuildingStore.ts 생성
  - 기능: 건물 목록, 건물 배치, 건물 업그레이드, 위인 배정
  - 참조: `docs/dino_park_ui_art_guide.md` 섹션 5

- [ ] **C03: Economy Feature 생성 (Frontend)**
  - 위치: `apps/client/src/features/economy/`
  - AC: EconomyPage.tsx, CurrencyPanel.tsx, TransactionHistory.tsx, useEconomyStore.ts 생성
  - 기능: 재화 표시, 수입/지출 내역, 오프라인 수익 수령
  - 참조: `docs/dino_park_balance_simulation.md`

### 🟠 중간 (서비스 보강)

- [ ] **C04: Story Service 보강**
  - 위치: `apps/server/src/modules/story/story.service.ts`
  - AC: 현재 45줄 → 200줄+ (CRUD + 진행 로직)
  - 기능: 챕터 시작, 선택지 처리, 보상 지급, 호감도 시스템
  - 참조: `docs/dino_park_story_scenario.md`

- [ ] **C05: GreatFigure Service 보강**
  - 위치: `apps/server/src/modules/great-figure/great-figure.service.ts`
  - AC: 현재 35줄 → 200줄+ (CRUD + 배정 로직)
  - 기능: 위인 영입, 건물 배정, 레벨업, 시너지 계산
  - 참조: `docs/dino_park_great_figures.md`

- [ ] **C06: Shop Service 보강**
  - 위치: `apps/server/src/modules/shop/shop.service.ts`
  - AC: 현재 64줄 → 200줄+ (구매 로직)
  - 기능: 상품 목록, 구매 처리, 영수증 검증, 일일 상점
  - 참조: `docs/dino_park_revenue_model.md`

- [ ] **C07: Season Service 보강**
  - 위치: `apps/server/src/modules/season/season.service.ts`
  - AC: 현재 76줄 → 200줄+ (시즌 로직)
  - 기능: 시즌 패스 진행, 보상 수령, 프리미엄 패스
  - 참조: `docs/dino_park_season_content.md`

### 🟡 낮음 (프론트엔드 완성)

- [ ] **C08: Season Feature 생성 (Frontend)**
  - 위치: `apps/client/src/features/season/`
  - AC: SeasonPage.tsx, SeasonPassTrack.tsx, SeasonReward.tsx 생성
  - 기능: 시즌 패스 UI, 보상 트랙, 미션 목록

- [ ] **C09: Social Feature 생성 (Frontend)**
  - 위치: `apps/client/src/features/social/`
  - AC: SocialPage.tsx, FriendList.tsx, FriendParkVisit.tsx 생성
  - 기능: 친구 목록, 친구 추가, 파크 방문

- [ ] **C10: Dinosaur Feature 보강 (Frontend)**
  - 위치: `apps/client/src/features/dinosaur/`
  - AC: DinosaurDetail.tsx, DinosaurFeed.tsx, useDinosaurStore.ts 추가
  - 기능: 공룡 상세, 먹이주기, 레벨업

- [ ] **C11: Exploration Feature 보강 (Frontend)**
  - 위치: `apps/client/src/features/exploration/`
  - AC: ExplorationDetail.tsx, ExplorationReward.tsx, useExplorationStore.ts 추가
  - 기능: 탐험 상세, 보상 수령

- [ ] **C12: GreatFigure Feature 보강 (Frontend)**
  - 위치: `apps/client/src/features/greatFigure/`
  - AC: GreatFigureDetail.tsx, GreatFigureAssign.tsx, useGreatFigureStore.ts 추가
  - 기능: 위인 상세, 건물 배정

- [ ] **C13: Shop Feature 보강 (Frontend)**
  - 위치: `apps/client/src/features/shop/`
  - AC: ShopDetail.tsx, PurchaseModal.tsx, useShopStore.ts 추가
  - 기능: 상품 상세, 구매 확인

### ⚪ 인프라 (마무리)

- [ ] **C14: API Queries 작성**
  - 위치: `apps/client/src/api/queries/`
  - AC: 도메인별 TanStack Query 훅 (useDinosaurs, useBuildings, etc.)
  - 기능: 서버 상태 관리, 캐싱, 낙관적 업데이트

- [ ] **C15: Balance Constants 확장**
  - 위치: `packages/game-data/src/balance/index.ts`
  - AC: 현재 41줄 → 200줄+ (모든 밸런스 상수)
  - 참조: `docs/dino_park_balance_simulation.md`

---

## 🔄 IN_PROGRESS (진행중)
<!-- 한 번에 1개만 -->

*(없음)*

---

## ✅ DONE (완료)

### 코드 작업

- [x] **C01: Social 모듈 생성 (Backend)** ✅ 2026-02-03
  - 생성 파일:
    - `apps/server/src/modules/social/social.module.ts`
    - `apps/server/src/modules/social/social.service.ts` (1037줄)
    - `apps/server/src/modules/social/social.controller.ts` (282줄)
  - Prisma 스키마 업데이트: Friend, FriendRequest, FriendIntimacy, ParkVisit, GuestBook, Gift, SocialNotification 모델 추가
  - 기능: 친구 추가/삭제/차단, 친구 요청, 파크 방문, 방명록, 선물 시스템, 친밀도, 알림

### 문서 작업 (이전 완료)

<details>
<summary>문서 수정 12건 완료 (접기/펼치기)</summary>

- [x] **D12: 에셋 문서 수정** ✅ 2026-02-03
- [x] **D11: 시즌 콘텐츠 수정** ✅ 2026-02-03
- [x] **D10: 사운드 가이드 수정** ✅ 2026-02-03
- [x] **D9: 액션플랜 수정** ✅ 2026-02-03
- [x] **D8: 수익 모델 수정** ✅ 2026-02-03
- [x] **D7: UI 가이드 수정** ✅ 2026-02-03
- [x] **D6: 스토리 문서 수정** ✅ 2026-02-03
- [x] **D1: GDD 문서 수정** ✅ 2026-02-03
- [x] **D2: 공룡 도감 수정** ✅ 2026-02-03
- [x] **D3: 기술 설계 문서 수정** ✅ 2026-02-03
- [x] **D4: 밸런스 문서 수정** ✅ 2026-02-03
- [x] **D5: 위인 도감 수정** ✅ 2026-02-03

</details>

---

## 🚫 BLOCKED (막힘)

(없음)

---

## 📝 작업 규칙

1. **시작**: QUEUE 최상단 → IN_PROGRESS로 이동
2. **진행**: AC 기준으로 구현 → 테스트 실행
3. **완료**: PASS → DONE으로 이동 (변경파일, 테스트결과 기록)
4. **막힘**: FAIL/불명확 → BLOCKED로 이동 (원인, 필요사항 기록)

---

## 📊 진행 상황

| 우선순위 | 티켓 수 | 완료 |
|----------|---------|------|
| 🔴 높음 | 3 | 1 |
| 🟠 중간 | 4 | 0 |
| 🟡 낮음 | 6 | 0 |
| ⚪ 인프라 | 2 | 0 |
| **합계** | **15** | **1** |

---

## 📅 예상 일정

| Phase | 티켓 | 예상 |
|-------|------|------|
| 🔴 높음 | C01~C03 | 1일 |
| 🟠 중간 | C04~C07 | 1일 |
| 🟡 낮음 | C08~C13 | 1.5일 |
| ⚪ 인프라 | C14~C15 | 0.5일 |
| **총합** | **15개** | **4일** |
