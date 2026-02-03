# DINO PARK TYCOON - TASK QUEUE

> **이 파일이 작업의 유일한 진실(Single Source of Truth)입니다.**
> 모든 작업은 이 큐를 기준으로 진행합니다.

---

## 📋 QUEUE (대기)

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

_(없음)_

---

## ✅ DONE (완료)

### 코드 작업

- [x] **C07: Season Service 보강** ✅ 2026-02-03
  - 수정 파일:
    - `apps/server/src/modules/season/season.service.ts` (76줄 → 715줄)
    - `apps/server/src/modules/season/season.controller.ts` (31줄 → 182줄)
  - 기능:
    - 시즌 정보: 현재 시즌, 전체 시즌 목록, 시즌 상세
    - 시즌 패스: 조회, 경험치 추가 + 레벨업, 무료/프리미엄 보상 수령, 일괄 수령
    - 프리미엄 업그레이드
    - 시즌 챕터: 목록, 상세, 완료 처리 + 보상 지급
    - 시즌 이벤트: 활성 이벤트 조회
    - 통계: 레벨, 수령 현황, 챕터 완료, 남은 일수

- [x] **C06: Shop Service 보강** ✅ 2026-02-03
  - 수정 파일:
    - `apps/server/src/modules/shop/shop.service.ts` (64줄 → 962줄)
    - `apps/server/src/modules/shop/shop.controller.ts` (25줄 → 182줄)
  - 기능:
    - IAP 상품: 다이아팩, 구독, 스타터팩, 프리미엄 콘텐츠 조회
    - 골드샵: 인게임 재화 구매, 일일 한도 관리
    - 일일 상점: 유저별 랜덤 아이템, 할인, 시드 기반 선택
    - IAP 구매: 영수증 검증 (스텁), 보상 지급
    - 광고 보상: 설정 조회, 쿨다운, 일일 제한, 보상 수령
    - 특별 패키지: 트리거 조건별 패키지 (레벨업, 첫구매, 복귀)
    - 구매 내역, 통계

- [x] **C05: GreatFigure Service 보강** ✅ 2026-02-03
  - 수정 파일:
    - `apps/server/src/modules/great-figure/great-figure.service.ts` (35줄 → 656줄)
    - `apps/server/src/modules/great-figure/great-figure.controller.ts` (25줄 → 143줄)
  - 기능: 위인 CRUD, 영입 (조건 검사 + 비용 차감), 건물 배정/해제, 경험치 추가, 골드 레벨업, 시너지 계산, 건물 보너스 계산, 통계

- [x] **C01: Social 모듈 생성 (Backend)** ✅ 2026-02-03
  - 생성 파일:
    - `apps/server/src/modules/social/social.module.ts`
    - `apps/server/src/modules/social/social.service.ts` (1037줄)
    - `apps/server/src/modules/social/social.controller.ts` (282줄)
  - Prisma 스키마 업데이트: Friend, FriendRequest, FriendIntimacy, ParkVisit, GuestBook, Gift, SocialNotification 모델 추가
  - 기능: 친구 추가/삭제/차단, 친구 요청, 파크 방문, 방명록, 선물 시스템, 친밀도, 알림

- [x] **C02: Building Feature 생성 (Frontend)** ✅ 2026-02-03
  - 생성 파일:
    - `apps/client/src/features/building/pages/BuildingPage.tsx`
    - `apps/client/src/features/building/components/BuildingCard.tsx`
    - `apps/client/src/features/building/components/BuildingList.tsx`
    - `apps/client/src/features/building/stores/useBuildingStore.ts`
    - `apps/client/src/features/building/index.ts`
  - 기능: 건물 목록, 카테고리 필터, 건물 상점, 건설, 업그레이드 모달, 위인 배정 모달

- [x] **C03: Economy Feature 생성 (Frontend)** ✅ 2026-02-03
  - 생성 파일:
    - `apps/client/src/features/economy/pages/EconomyPage.tsx`
    - `apps/client/src/features/economy/components/CurrencyPanel.tsx`
    - `apps/client/src/features/economy/components/TransactionHistory.tsx`
    - `apps/client/src/features/economy/stores/useEconomyStore.ts`
    - `apps/client/src/features/economy/index.ts`
  - 기능: 재화 표시 (골드/다이아/DNA/에너지), 거래 내역 필터, 오프라인 수익 수령

- [x] **C04: Story Service 보강** ✅ 2026-02-03
  - 수정 파일:
    - `apps/server/src/modules/story/story.service.ts` (45줄 → 707줄)
    - `apps/server/src/modules/story/story.controller.ts` (30줄 → 157줄)
    - `apps/server/prisma/schema.prisma` (CharacterAffinity, StoryFlag 모델 추가)
  - 기능: 챕터 시작/진행, 씬 전환, 선택지 처리 + 효과 적용, 보상 지급, 캐릭터 호감도 시스템, 스토리 플래그

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

| 우선순위  | 티켓 수 | 완료  |
| --------- | ------- | ----- |
| 🔴 높음   | 3       | 3 ✅  |
| 🟠 중간   | 4       | 4 ✅  |
| 🟡 낮음   | 6       | 0     |
| ⚪ 인프라 | 2       | 0     |
| **합계**  | **15**  | **7** |

---

## 📅 예상 일정

| Phase     | 티켓     | 예상    |
| --------- | -------- | ------- |
| 🔴 높음   | C01~C03  | 1일     |
| 🟠 중간   | C04~C07  | 1일     |
| 🟡 낮음   | C08~C13  | 1.5일   |
| ⚪ 인프라 | C14~C15  | 0.5일   |
| **총합**  | **15개** | **4일** |
