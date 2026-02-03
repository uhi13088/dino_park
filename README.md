# 🦕 다이노 파크 타이쿤 (Dino Park Tycoon)

토스 앱스를 위한 타이쿤/방치형 게임

## 프로젝트 구조

```
dino-park-tycoon/
├── apps/
│   ├── client/          # React 프론트엔드 (Vite + PixiJS)
│   └── server/          # NestJS 백엔드 (Prisma + PostgreSQL)
├── packages/
│   ├── shared/          # 공유 타입, 상수, 유틸리티
│   └── game-data/       # 게임 데이터 (공룡, 건물, 위인)
├── docs/                # 기획 문서
└── CLAUDE.md            # 개발 가이드
```

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite + PixiJS 8 + Zustand + TailwindCSS
- **Backend**: NestJS 10 + TypeScript + Prisma 5 + PostgreSQL 15 + Redis 7
- **Monorepo**: Turborepo + pnpm

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm typecheck

# 린트
pnpm lint
```

## 문서

- [GDD](docs/dino_park_tycoon_gdd.md) - 게임 기획 문서
- [기술 설계](docs/dino_park_technical_design.md) - 기술 아키텍처
- [공룡 도감](docs/dino_park_dinosaur_codex.md) - 82종 공룡 스펙
- [위인 도감](docs/dino_park_great_figures.md) - 50명 위인 스펙
- [밸런스](docs/dino_park_balance_simulation.md) - 경제 시뮬레이션

## 라이선스

Private - All Rights Reserved
