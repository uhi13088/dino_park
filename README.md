# 🦕 다이노 파크 타이쿤 (Dino Park Tycoon)

장기간 공룡 파크를 운영·확장하는 수집·경영 게임

앱인토스는 초기 플랫폼 검토 배경이다. 현재 기획은 장기 파크 운영을 목표로 하며, 접속 시간이나 주기를 짧게 제한하는 방향으로 해석하지 않는다.

게임을 플레이하는 순서와 콘텐츠를 찾으려면 [Word 플레이 가이드](docs/guidebook/output/dino-park-guidebook.docx)를 연다. [인쇄용 PDF](docs/guidebook/output/dino-park-guidebook.pdf)도 함께 제공한다. 기획 원천과 갱신 방법은 [가이드북 관리](docs/guidebook/README.md)에 있다.

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

## 로컬 미리보기 실행

Node.js 20 이상과 Docker가 필요합니다. 아래 명령은 프로젝트에 지정된 pnpm 9를 사용합니다.

```bash
corepack pnpm@9.0.0 install --frozen-lockfile
docker compose -p dino-park up -d postgres redis
cp -n apps/server/.env.example apps/server/.env
corepack pnpm@9.0.0 --filter @dino-park/shared build
corepack pnpm@9.0.0 --filter @dino-park/game-data build
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/dino_park?schema=public' corepack pnpm@9.0.0 --filter @dino-park/server exec prisma db push
```

환경 파일 복사는 최초 설정 시에만 수행합니다. 위 명령은 Docker의 기본 로컬 DB를 준비합니다. 서버의 `.env` 또는 `.env.local`에 다른 DB를 지정했다면 실행 대상이 일치하는지 확인합니다. `prisma db push`는 새 로컬 개발 DB를 준비하는 용도이며 운영 DB에 사용하지 않습니다.

기존 개발 DB를 올릴 때는 현재 적용된 단계 이후의 SQL 패치만 아래 순서대로 한 번씩 적용합니다. 이전 `main`의 Prisma 스키마로 만든 DB는 1번부터, 현재 스키마로 새로 만든 DB는 패치 없이 시작합니다. 명령은 서버 작업 디렉터리에서 `prisma db execute --schema prisma/schema.prisma --file prisma/patches/<파일명>` 형식으로 실행합니다. 적용한 후 서버용 Prisma 클라이언트를 다시 생성합니다.

1. [파크 입장·공룡 도감·시설 타이머](apps/server/prisma/patches/20261115_park_admission_catalog.sql)
2. [첫 조사·부화·자원 생산](apps/server/prisma/patches/20261116_first_expedition_resources.sql)
3. [육상 주행 탐험](apps/server/prisma/patches/20261119_early_driving.sql)
4. [첫 스테고케라톱스 합성](apps/server/prisma/patches/20261119_first_synthesis.sql)
5. [공룡 개체 능력치](apps/server/prisma/patches/20261119_dinosaur_competitive_stats.sql)
6. [반복 합성](apps/server/prisma/patches/20261119_repeat_synthesis.sql)
7. [파크 성장 목표와 기술 연구](apps/server/prisma/patches/20261119_park_growth.sql)

패치는 기존 잔액·공룡·시설·좌표·경험치를 보존합니다. 새 입장 실적은 0명부터 계산되고, 도감을 열면 기존에 보유한 공룡이 실제 획득 시각으로 등록됩니다. 개체별 능력치가 비어 있으면 종별 인기도와 기본 능력치를 사용합니다.

서로 다른 터미널에서 서버와 클라이언트를 실행합니다.

```bash
corepack pnpm@9.0.0 --filter @dino-park/server dev
corepack pnpm@9.0.0 --filter @dino-park/client dev --host 127.0.0.1
```

게임은 <http://127.0.0.1:3000>, API 문서는 <http://localhost:4000/api/docs>에서 확인합니다. 현재 시작 버튼은 개발용 로그인으로 새 계정을 생성합니다.

빈 파크에는 파라사우롤로푸스 1마리, 초원 서식지, 경계 입구가 한 번 지급됩니다. **초원에 공룡 배치 → 먹이 주기 → 파크 개장 → 유료 입장객10명 → 첫 관람대 건설** 순서로 플레이합니다. 첫 관람대는1,500골드·30초이며 정원이12명에서32명으로 늘어납니다. 건설은 위치 미리보기 뒤 확정하고 취소하면 차감하지 않습니다. 배치 중 방향키·Enter·Esc를 사용할 수 있고 전체 보기·확대·축소도 지원합니다. 배치·상태·골드·입장 실적·시설은 DB에 저장됩니다. 기존 파크의 재화/개체/시설은 보존하며 중앙에 있는 입구는 무료로 옮길 수 있습니다. 이미 돌본 공룡의 과거 이력도 인정하고 시작 콘텐츠를 반복 지급하지 않습니다.

입구가 없는 기존 파크에는 공룡과 시설을 유지하면서 통로가 확보된 경계의 빈자리에 입구를 무료로 설치합니다. 배치할 공간이 부족하면 경계 공간을 확보한 뒤 파크 화면에서 **입구 다시 찾기**를 누릅니다.

첫 관람대 다음에는 **초원 정찰 → 세 단서 조사 → 이구아노돈 알 획득 → 60초 부화 → 수령·도감 등록 → 초원 배치**로 이어집니다. 정찰은100골드·에너지5이며 잘못 조사하거나 다시 접속해도 추가로 차감하지 않습니다. 기본 부화 한 자리가 있어 첫 알을 위해 부화장을 구매할 필요는 없습니다. 보상과 경험치는 한 번만 지급하고 기존 보유·수집 이력을 인정합니다.

파크 Lv.2부터 **자원 시설**에서 벌목장·채석장을 각각1,500골드·60초로 건설할 수 있습니다. 목재·석재를 골드로 구매하거나 시설당1~3회분을 생산한 뒤 직접 수령합니다. 종류별 기본 보관 한도는100개이며, 가득 차면 완성된 생산품을 보존합니다. 파크 Lv.3의 첫 관람대 확장은3,000골드·목재20·석재10·120초, 완공 후 파크 정원이52명입니다. 생산시설은 첫 탐험의 필수 조건이 아닙니다.

이구아노돈 이후 육상 주행에서 트리케라톱스·스테고사우루스 알과 중급 합성 재료를 회수합니다. 첫 지정 합성은 스테고케라톱스를 100% 지급하고, 첫 전시 뒤에는 재료를 다시 모아 성향을 골라 합성할 수 있습니다. 전시 교체 전에는 개체 능력치와 예상 입장객을 비교합니다.

첫 전시를 마치면 파크의 **성장 목표**에서 DNA 연구소 완공, 입장 수속 연구, 폐연구소 기초 촉매 회수, 유료 입장객 누적 100명의 경험치를 수령합니다. 네 목표는 각각 897 XP를 지급하며 정상 초반 진행에서 모두 받으면 파크 Lv.6에 도달합니다. 첫 영웅을 수령하면 금속을 구매할 수 있고, 관람대는 Lv.5까지 강화할 수 있습니다. 관람대 기본형과 Lv.5 외형은 투명 WebP를 사용합니다.

하단 **도감**은 실제 카탈로그 81종의 등급·계보·수집 상태·상세·획득 경로를 보여줍니다. [최신 83종 획득표](docs/current/dinosaur-acquisition-tables.md)는 계획된 시노케라톱스와 메갈로돈을 포함합니다. 방생 후에도 이미 얻은 도감 기록은 남습니다. 입장료는 서버에서 정산하고, 지도 속 방문객은 이를 시각적으로 표현합니다.

서버와 클라이언트를 실행한 상태에서 첫 플레이 흐름을 검증할 수 있습니다.

```bash
corepack pnpm@9.0.0 exec playwright install chromium
corepack pnpm@9.0.0 exec playwright test e2e/starter-park.spec.ts --project=chromium
```

탐험·합성·도감 E2E는 테스트 계정을 생성하고 정리합니다. 해당 테스트를 실행하려면 `DINO_PARK_E2E_DATABASE_URL`에 스키마를 준비한 로컬 `dino_park_*_qa` 데이터베이스를 지정하고, 같은 DB를 사용하는 API를 `DINO_PARK_E2E_API_PORT`에서 실행합니다. 기본 API 포트는 4400입니다. 테스트 DB 변수를 비워 두면 이 세 테스트 파일을 건너뜁니다.

## 기획 문서

**[문서 안내](docs/README.md)부터 읽습니다.** 최신 기획 0.6와 구버전 자료, 실제 구현 상태를 구분합니다. 기획 버전은 앱의 출시 버전이 아닙니다.

- [최신 게임 기획](docs/current/game-design.md): 파크 운영·첫 플레이·구현 범위
- [기본 자원·생산](docs/current/resources-and-production.md): 일반 4종+연구 5종, 필요성·품질·획득/생산·사용처와 구버전 통합
- [운영·생산·초반 밸런스](docs/current/balance.md): 입장료·자원 생산·시설·미션의 비용/시간과 검산 상태
- [공룡 획득·DNA 연구](docs/current/dna-and-collection.md): 탐험·변종·하이브리드
- [기술 연구트리](docs/current/research-trees.md): 4계열72항목·각3~5단계·연구원 병렬 작업과 DNA 합성 분리. 72항목의 자원·시간·레벨별 효과 정의 완료안. [나머지58항목 레벨별 효과표](docs/current/research-effect-tables.md)
- [확장·탐험·후속 합성 상세](docs/current/followup-content-tables.md): 토지5단계·특수시설125레벨·재료/알목표·계획83종과 후속 레시피. [탐험 플레이](docs/current/exploration-play.md)와 함께 읽는 구현 전 기획안
- [연구별 자원·시간 전체표](docs/current/research-cost-tables.md):72기술의각레벨총252회연구자원·기본시간·최종하한
- [건물 성장 기획](docs/current/buildings.md): 주요25레벨·5레벨 외형/기능 변화, 금고와 연료 보급소. 기존52종 통합 분류
- [건물별 1~25 상세표](docs/current/building-upgrade-tables.md): 21시설525행의 효과·자원·골드·시간과 누적 투자
- [파크 성장과 경험치](docs/current/park-progression.md): 파크 Lv.5→6 실행 경로와 이후 레벨별 성장 기획
- [TASK](TASK.md): 실제 완료·검증과 다음 구현 순서

전체 골드 한도와 금고, 연료 보급소, 관람대 Lv.6 이후의 시설 성장, 전체 연구트리는 0.6 기획에 따라 단계적으로 적용합니다.

기존 GDD·도감·시나리오·기술 설계는 원자료로 보존합니다. 새 기획은 `docs/current/`에 반영하며, 미구현 내용과 현재 실행 동작을 혼용하지 않습니다.

## 라이선스

Private - All Rights Reserved
