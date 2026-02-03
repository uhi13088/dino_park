# DINO PARK TYCOON - TASK QUEUE

> **이 파일이 작업의 유일한 진실(Single Source of Truth)입니다.**
> 모든 작업은 이 큐를 기준으로 진행합니다.

---

## 📋 QUEUE (대기)

### Phase 1: 프로젝트 셋업

- [ ] **T1: Monorepo 초기화**
  - AC: pnpm workspace 설정 (pnpm-workspace.yaml)
  - AC: apps/client, apps/server 폴더 생성
  - AC: packages/shared, packages/game-data 폴더 생성
  - AC: 루트 package.json 스크립트 설정

- [ ] **T2: TypeScript & 린트 설정**
  - AC: tsconfig.json (루트 + 각 패키지)
  - AC: ESLint + Prettier 설정
  - AC: .gitignore, .nvmrc 설정
  - AC: `pnpm typecheck`, `pnpm lint` 명령어 동작

- [ ] **T3: 프론트엔드 기반 (React + Vite)**
  - AC: apps/client에 React 18 + TypeScript + Vite 설정
  - AC: TailwindCSS 설정
  - AC: 기본 App.tsx 렌더링 확인
  - AC: `pnpm dev:client` 로 실행

- [ ] **T4: 백엔드 기반 (NestJS)**
  - AC: apps/server에 NestJS + TypeScript 설정
  - AC: health check API (GET /health)
  - AC: `pnpm dev:server` 로 실행

- [ ] **T5: 데이터베이스 설정 (Prisma + PostgreSQL)**
  - AC: Prisma 설치 및 schema.prisma 생성
  - AC: User, Currency, Park 기본 모델 정의
  - AC: `pnpm prisma generate` 동작
  - AC: 마이그레이션 테스트

- [ ] **T6: 공유 패키지 설정**
  - AC: packages/shared/types 기본 타입 정의
  - AC: packages/shared/constants 밸런스 상수
  - AC: packages/game-data 공룡 20종 데이터
  - AC: 클라이언트/서버에서 import 동작

---

## 🔄 IN_PROGRESS (진행중)
<!-- 한 번에 1개만 -->

(없음)

---

## ✅ DONE (완료)

<!--
완료 시 기록 형식:
- [x] **T0: 티켓 제목** ✅ 2026-02-03
  - 변경: `src/파일1.ts`, `src/파일2.ts`
  - 테스트: PASS (n/n)
  - 비고: 특이사항
-->

(없음)

---

## 🚫 BLOCKED (막힘)
<!-- 사람 확인 필요 -->

<!--
막힘 시 기록 형식:
- [ ] **T0: 티켓 제목** 🚫
  - 원인: 왜 막혔는지
  - 필요: 사용자에게 물어볼 것
  - 시도: 해본 것
-->

(없음)

---

## 📝 작업 규칙

1. **시작**: QUEUE 최상단 → IN_PROGRESS로 이동
2. **진행**: AC 기준으로 구현 → 테스트 실행
3. **완료**: PASS → DONE으로 이동 (변경파일, 테스트결과 기록)
4. **막힘**: FAIL/불명확 → BLOCKED로 이동 (원인, 필요사항 기록)

---

## 📊 Phase 진행률

```
Phase 1: 프로젝트 셋업    ░░░░░░░░░░ 0% (0/6)
Phase 2: 백엔드 코어      ░░░░░░░░░░ 0%
Phase 3: 프론트엔드       ░░░░░░░░░░ 0%
Phase 4: 게임 핵심 로직   ░░░░░░░░░░ 0%
Phase 5: 콘텐츠           ░░░░░░░░░░ 0%
Phase 6: 수익화           ░░░░░░░░░░ 0%
Phase 7: 테스트           ░░░░░░░░░░ 0%
Phase 8: 런칭             ░░░░░░░░░░ 0%
```
