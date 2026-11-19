# 다이노 파크 타이쿤 성능 최적화 가이드

<!-- legacy-reference: 2026-11-15 -->
> **구버전 자료 · 2026-11-15 분리**
> 구버전 기획·설계 자료입니다. 최신 구현 기준으로 사용하지 말고, 필요한 내용은 최신 기획에 승계한 뒤 사용합니다. 문서 내 버전 번호는 이 자료 자체의 과거 버전입니다.
> 최신 기준과 실제 구현 상태는 [기획 문서 안내](README.md)에서 확인합니다.

> **목적**: 프론트엔드/백엔드 성능 최적화를 위한 가이드라인

---

## 1. 프론트엔드 최적화

### 1.1 코드 스플리팅

**Vite 설정 (`vite.config.ts`)**

```typescript
// 벤더 청크 분리
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'state-vendor': ['zustand', '@tanstack/react-query'],
  'pixi-vendor': ['pixi.js'],
  'ui-vendor': ['framer-motion', 'clsx', 'tailwind-merge'],
}
```

**라우트 기반 코드 스플리팅**

```typescript
// React.lazy를 사용한 동적 임포트
const ParkPage = React.lazy(() => import('@/pages/ParkPage'));
const ShopPage = React.lazy(() => import('@/pages/ShopPage'));
const StoryPage = React.lazy(() => import('@/pages/StoryPage'));
```

### 1.2 이미지 최적화

**이미지 포맷**

- PNG: 투명도가 필요한 UI, 스프라이트
- WebP: 일반 이미지 (PNG 대비 30% 용량 절감)
- AVIF: 최신 브라우저용 고압축

**스프라이트 시트**

```typescript
// 개별 이미지 대신 스프라이트 시트 사용
// 네트워크 요청 수 감소
import { Spritesheet } from 'pixi.js';

const spritesheet = new Spritesheet(baseTexture, spritesheetData);
```

**레이지 로딩**

```typescript
// 화면 밖 이미지는 지연 로딩
<img loading="lazy" src={imageSrc} />
```

### 1.3 PixiJS 렌더링 최적화

**오브젝트 풀링**

```typescript
// 자주 생성/삭제되는 오브젝트 재사용
class DinosaurPool {
  private pool: Dinosaur[] = [];

  acquire(): Dinosaur {
    return this.pool.pop() || new Dinosaur();
  }

  release(dino: Dinosaur): void {
    dino.reset();
    this.pool.push(dino);
  }
}
```

**컬링 (화면 밖 렌더링 제외)**

```typescript
// 뷰포트 밖 오브젝트 렌더링 스킵
function updateVisibility(container: Container, viewport: Rectangle) {
  container.children.forEach((child) => {
    child.visible = viewport.contains(child.x, child.y);
  });
}
```

**배치 렌더링**

```typescript
// 같은 텍스처를 사용하는 스프라이트 그룹화
const batchContainer = new ParticleContainer(10000, {
  position: true,
  rotation: true,
  scale: true,
});
```

### 1.4 상태 관리 최적화

**Zustand 선택적 구독**

```typescript
// 필요한 상태만 구독
const gold = useGameStore((state) => state.gold);

// 여러 값을 한번에 구독 (shallow 비교)
const { gold, diamond } = useGameStore(
  (state) => ({ gold: state.gold, diamond: state.diamond }),
  shallow,
);
```

**React Query 캐싱**

```typescript
// 적절한 staleTime 설정
useQuery({
  queryKey: ['dinosaurs'],
  queryFn: fetchDinosaurs,
  staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
});
```

### 1.5 React 렌더링 최적화

**메모이제이션**

```typescript
// 비용이 큰 컴포넌트 메모이제이션
const DinosaurCard = React.memo(({ dinosaur }) => {
  // ...
});

// 비용이 큰 계산 메모이제이션
const totalRevenue = useMemo(() => {
  return dinosaurs.reduce((sum, d) => sum + d.revenue, 0);
}, [dinosaurs]);

// 콜백 함수 메모이제이션
const handleFeed = useCallback(
  (dinoId: string) => {
    feedDinosaur(dinoId);
  },
  [feedDinosaur],
);
```

**가상화 (대규모 목록)**

```typescript
// react-virtual 사용
import { useVirtualizer } from '@tanstack/react-virtual';

function DinosaurList({ dinosaurs }) {
  const virtualizer = useVirtualizer({
    count: dinosaurs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div ref={parentRef}>
      {virtualizer.getVirtualItems().map(virtualRow => (
        <DinosaurCard key={virtualRow.index} {...dinosaurs[virtualRow.index]} />
      ))}
    </div>
  );
}
```

---

## 2. 백엔드 최적화

### 2.1 데이터베이스 최적화

**인덱스 설정**

```prisma
model Dinosaur {
  id        String   @id @default(cuid())
  parkId    String
  speciesId String

  @@index([parkId]) // 파크별 공룡 조회 최적화
  @@index([speciesId]) // 종별 조회 최적화
}
```

**N+1 문제 방지**

```typescript
// BAD: N+1 쿼리
const parks = await prisma.park.findMany();
for (const park of parks) {
  const dinosaurs = await prisma.dinosaur.findMany({
    where: { parkId: park.id },
  });
}

// GOOD: Include 사용
const parks = await prisma.park.findMany({
  include: { dinosaurs: true },
});
```

**페이지네이션**

```typescript
// 커서 기반 페이지네이션 (대규모 데이터셋에 효율적)
const dinosaurs = await prisma.dinosaur.findMany({
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { createdAt: 'desc' },
});
```

### 2.2 캐싱

**Redis 캐싱**

```typescript
// 자주 조회되는 데이터 캐싱
async function getDinosaurWithCache(id: string) {
  const cacheKey = `dinosaur:${id}`;

  // 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // DB 조회
  const dinosaur = await prisma.dinosaur.findUnique({ where: { id } });

  // 캐시 저장 (5분)
  await redis.setex(cacheKey, 300, JSON.stringify(dinosaur));

  return dinosaur;
}
```

**응답 캐싱 (HTTP)**

```typescript
// NestJS 캐시 인터셉터
@UseInterceptors(CacheInterceptor)
@CacheTTL(60) // 60초
@Get('dinosaurs')
async getDinosaurs() {
  return this.dinosaurService.findAll();
}
```

### 2.3 API 최적화

**응답 압축**

```typescript
// main.ts
import compression from 'compression';
app.use(compression());
```

**GraphQL DataLoader (N+1 방지)**

```typescript
// DataLoader 사용
const dinosaurLoader = new DataLoader(async (parkIds) => {
  const dinosaurs = await prisma.dinosaur.findMany({
    where: { parkId: { in: parkIds } },
  });

  return parkIds.map((parkId) => dinosaurs.filter((d) => d.parkId === parkId));
});
```

### 2.4 오프라인 수익 계산 최적화

```typescript
// 클라이언트에서 계산하고 서버에서 검증
// 서버 부하 감소

// Client: 오프라인 수익 미리 계산
const offlineRevenue = calculateOfflineRevenue(
  lastLoginTime,
  dinosaurs,
  buildings
);

// Server: 클라이언트 계산 검증
async collectOfflineRevenue(userId: string, clientCalculation: number) {
  const serverCalculation = await this.calculateOfflineRevenue(userId);

  // 10% 오차 허용
  if (Math.abs(clientCalculation - serverCalculation) / serverCalculation > 0.1) {
    throw new BadRequestException('계산 불일치');
  }

  return this.addGold(userId, serverCalculation);
}
```

---

## 3. 네트워크 최적화

### 3.1 요청 최소화

**배치 요청**

```typescript
// 여러 요청을 하나로 묶기
POST /api/batch
{
  "requests": [
    { "method": "GET", "path": "/dinosaurs" },
    { "method": "GET", "path": "/buildings" },
    { "method": "GET", "path": "/currency" }
  ]
}
```

**WebSocket 활용**

```typescript
// 실시간 업데이트는 WebSocket으로
socket.on('dinosaur:update', (data) => {
  updateDinosaur(data);
});
```

### 3.2 페이로드 최적화

**필요한 필드만 요청**

```typescript
// GraphQL 스타일 필드 선택
GET /api/dinosaurs?fields=id,name,level,happiness
```

**압축**

- gzip/brotli 압축 활성화
- JSON 대신 MessagePack 고려 (바이너리 직렬화)

---

## 4. 성능 모니터링

### 4.1 프론트엔드

**Web Vitals**

```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log); // Cumulative Layout Shift
getFID(console.log); // First Input Delay
getLCP(console.log); // Largest Contentful Paint
```

**React Profiler**

```typescript
<Profiler id="DinosaurList" onRender={onRenderCallback}>
  <DinosaurList dinosaurs={dinosaurs} />
</Profiler>
```

### 4.2 백엔드

**쿼리 로깅**

```typescript
// Prisma 쿼리 로깅
const prisma = new PrismaClient({
  log: ['query', 'warn', 'error'],
});
```

**APM (Application Performance Monitoring)**

- Sentry Performance
- Datadog
- New Relic

---

## 5. 성능 목표

| 항목                | 목표    | 측정 방법 |
| ------------------- | ------- | --------- |
| **초기 로딩**       | < 3초   | LCP       |
| **상호작용 지연**   | < 100ms | FID       |
| **레이아웃 시프트** | < 0.1   | CLS       |
| **API 응답**        | < 200ms | 서버 로그 |
| **프레임레이트**    | 60fps   | DevTools  |
| **메모리**          | < 100MB | DevTools  |

---

## 6. 체크리스트

### 릴리즈 전 성능 체크

- [ ] 번들 크기 분석 (`pnpm build:analyze`)
- [ ] Lighthouse 점수 80+ (Performance)
- [ ] 메모리 누수 테스트 (Chrome DevTools)
- [ ] 네트워크 스로틀링 테스트 (3G 환경)
- [ ] 저사양 기기 테스트
- [ ] 대량 데이터 테스트 (공룡 100마리+)

---

_최종 업데이트: 2026-02-02_
