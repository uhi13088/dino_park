TASK.md를 확인하고 다음 작업을 진행해줘.

## 실행 로직

### 1. 현재 상태 확인

- tasks/lessons.md 확인 (같은 실수 반복 방지)
- IN_PROGRESS에 티켓이 있는가?
  - 있으면 → 해당 티켓 계속 진행
  - 없으면 → QUEUE 최상단 티켓을 IN_PROGRESS로 이동

### 2. Plan 수립 및 검증

- AC(Acceptance Criteria) 확인
- Plan 작성 (구현 전)
- **Plan이 AC를 충족하는지 스스로 검증** 후 구현 시작

### 3. 작업 진행

- 단계별로 구현
- 각 단계마다 테스트 실행
- 진행 중 막히면 → **즉시 멈추고 재계획** (밀어붙이지 않기)

### 4. 완료 처리

- 모든 AC 충족 + 테스트 PASS 확인
- "Staff Engineer가 승인할 코드인가?" 자문
- TASK.md 업데이트:
  ```
  - [x] **T#: 티켓제목** ✅ 날짜
    - 변경: 파일 목록
    - 테스트: PASS (n/n)
  ```
- IN_PROGRESS → DONE으로 이동

### 5. 막힘 처리

- 테스트 FAIL 또는 요구사항 불명확 시
- TASK.md에 기록:
  ```
  - [ ] **T#: 티켓제목** 🚫
    - 원인:
    - 필요:
  ```
- IN_PROGRESS → BLOCKED로 이동
- 멈추고 사용자에게 보고

## 참조 문서

- 기능별 참조: CLAUDE.md의 "문서 참조 규칙" 섹션 확인
- 교훈 기록: tasks/lessons.md
- 수치: docs/dino_park_balance_simulation.md
- API: docs/dino_park_technical_design.md

## 출력

- 현재 진행 중인 티켓
- 다음 액션
- (완료 시) 변경 요약
