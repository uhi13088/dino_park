# Lessons Learned

> 사용자로부터 수정 지시를 받을 때마다 여기에 기록한다.
> 세션 시작 시 반드시 이 파일을 읽고 같은 실수를 반복하지 않는다.

---

## 규칙

1. 사용자가 수정을 지시하면 → 즉시 이 파일에 패턴 추가
2. 기록 형식: `[날짜] 카테고리: 구체적 교훈`
3. 모호한 교훈 금지 → "조심하기" (X) / "fetch 대신 lib/http.ts의 httpClient 사용" (O)

---

## 교훈 목록

- [2026-02-05] 타입: shared types의 position 필드는 Prisma 스키마 기준 positionX/positionY 사용
- [2026-02-05] 보안: IAP 영수증 검증은 프로덕션에서 반드시 실제 검증 구현 필요 (항상 true 금지)
- [2026-02-05] 동시성: 재화 차감은 반드시 $transaction 안에서 atomic하게 처리
- [2026-02-05] 빌드: game-data에서 balance와 shop 모듈 간 export 이름 충돌 주의
- [2026-02-05] 밸런스: DINOSAUR_STATUS.maxIntimacy는 1000 (100이 아님)
