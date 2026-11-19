# 건물 역할·25레벨 성장 기획 0.6

기준일: 2026-11-17 · 상태: 주요 시설 25레벨·주요 변화 구간·금고·연료 방향 확정, 상세 수치는 설계 기준안이며 런타임 적용 전 · [문서 안내](../README.md)

주요 건물은 **최대 25레벨**, **5·10·15·20·25레벨마다 큰 외형 또는 기능 변화**를 준다. 일반 레벨에서는 해당 시설의 수용량·생산량·효율이 점진적으로 개선된다. 별도 건물 등급이나 승급 재료를 추가하지 않고 플레이어에게는 건물 레벨 하나로 보여준다. 순수 장식은 강화 없이 배치·외형을 선택한다.

이전의 최대 5단계 제안은 이번 사용자 결정으로 대체했다. 원문은 [건물 기획 0.4 보관본](../archive/0.4/buildings.md)에 남기며 현재 구현 지시로 사용하지 않는다. 기존 52종의 유지·통합·후속 분류는 별도 검토안이므로, 25레벨 결정이 52종 전체의 구현·통합·삭제를 승인했다는 뜻은 아니다.


72개 기술의 모든 레벨에 필요한 자원·기본시간·최종하한은 [전체 비용표](research-cost-tables.md), 레벨별 효과는 기존14개의 [연구트리 효과표](research-trees.md#5-기본-연구-효과-수치)와 나머지58개의 [효과 상세](research-effects.md)에 정리했다. 252회 연구의 효과 정의를 마쳤으며 후속 시설·미션·레시피와 실제 게임 적용은 별도 작업이다.


## 1. 수치 원천과 현재 구현

| 구분 | 현재 기준 |
| --- | --- |
| 확정 방향 | 방문객 입장료를 시설·공룡·탐험·연구에 재투자. 주요 시설 25레벨, 5레벨마다 큰 변화, 전체 골드의 금고 한도, 기존 탐험 에너지와 연료의 단일 재고 |
| 실제 카탈로그 | [건물 데이터](../../packages/game-data/src/buildings/index.ts)에 53종. 통합 분류의 기준 ID를 제공. 현재 적용 상태는 구현·이관 절에서 확인 |
| 현재 동작·검증 범위 | 경계·입장료·관람대 Lv.5까지의 확장과 초기 생산, 부화장·연구소·안전 시설·첫 하이브리드 전시. 실제 검증은 [TASK](../../TASK.md)를 따름 |
| 주요 성장시설 수치 범위 | 기존 독립 기능 시설 16종과 신규 후보 5종, 총 21종의 25레벨 성장과 기존525행을 보존. 금고·연료 보급소와 전체 레벨 효과는 후속 |
| 추가 설계 범위 | 기존 카탈로그의 특수환경5종에25레벨 설계를 추가해 총26시설·650레벨. 기존21종525행과 특수환경5종125행을 구분하며, 추가 수치는 밸런스 §16을 따름 |
| 역할·외형 소유자 | 이 문서. 시설별 주효과·표현·도입 순서·기존 건물 통합 방향 |
| 수치 소유자 | [밸런스 0.6](balance.md). 최초 건설·단계별 효과·골드·자재·유지비·작업비·시간·금고/연료 정산 규칙 |
| 상세 조회 | [기본21시설 × 25레벨 상세표](building-upgrade-tables.md)는 기존525행. 추가5시설125행의 원천은 [밸런스 §16](balance.md). 합쳐650레벨이며 생성표를 직접 편집하거나 별도 설정으로 운영하지 않음 |

[게임 기획](game-design.md)은 진행과 범위, [자원 기획](resources-and-production.md)은 자원 종류·수급/사용 규칙, [DNA 기획](dna-and-collection.md)은 개별 합성 레시피와 연구 조건을 소유한다. 이 문서에 독립 가격식이나 새로운 연구 레시피를 만들지 않는다.

## 2. 파크 레벨·건물 레벨·강화 조작

**파크 레벨**은 시설·지역·기능의 해금 조건이고, **건물 레벨**은 이미 지은 한 시설의 성능이다. 공룡의 희귀도·개체 레벨·연구 재료 품질과도 구별한다. 건물 25레벨이 파크 Lv.25의 동의어이거나 전설 공룡을 자동 지급하는 조건은 아니다.

건설·강화는 선택 → 전체 골드·자재·개선 효과·완료 시각 확인 → 수동 시작 → 완공으로 진행한다. 새 건물은 위치 미리보기·확정 뒤 착공한다. 건설과 강화는 같은 건설자 슬롯을 사용하며, 강화 중에는 직전 완공 레벨의 성능으로 계속 운영한다. 완공 뒤 새 성능으로 교체하고 그 시점 이전 경제 구간을 먼저 정산한다.

목표 레벨의 비용은 해당 단계로 올리는 **한 번의 비용**이며, 상세표의 누적 합계와 구별한다. 최초 건설과 강화의 고정 앵커·일반식·관리사무소 보정은 [밸런스의 비용·시간 계산](balance.md#4-강화-비용과-시간-계산)을 따른다. 현재 관람대 Lv.2와 창고의 초반 앵커를 일반 성장식으로 덮어쓰지 않는다.

**24→25 한 번의 일반 강화는 최소7일**이며 중요도에 따라 더 오래 걸린다. 관리사무소 보정 후에도 이 하한을 적용하고, 단계별 기본 일수/실제 보정은 밸런스 원천과 생성 표를 따른다. 건설자는 한 명당 공사 한 건을 맡고 추가 고용으로 병렬 작업한다. 무료 초반 인원과 추가 고용 기준은 밸런스의 인력 표를 따른다. 연구원은 [기술 연구트리](research-trees.md)의 각 기술 항목을 담당하며 DNA 합성과 별도 인원/작업 한도를 사용한다.

강화는 같은 부지에서 성능과 외형을 바꾼다. 이번 자연종·하이브리드 서식지는 3×3의 한 칸 한 개체를 유지하며 수용량이 실제 빈칸을 초과하지 않는다. 다른 시설도 강화만으로 점유 면적을 늘리거나 주변 공룡·건물을 자동 이동하지 않는다. 서식지의 개체 수용량과 입구·관람대의 방문객 정원은 서로 다른 값이다.

### 연구소·기술과 건물의 목적 연결

0.6에서는 연구소가 기술 범위를 열고, [72항목 연구트리](research-trees.md)의 시설 고도화가 연구소·서식지를 포함한 주요 건물의 강화 구간을 연다. 기본상한5 → 연구소5에서고도화1/상한10 → 연구소10에서고도화2/상한20 → 연구소20에서고도화3/상한25다. 기존 완공/진행 건물의 레벨과 권한은 보존한다. 현재 게임에 이 연구 잠금을 적용했다는 뜻은 아니다.

토지 개발은 추가 건물을 놓을 부지의 확장 권한, 관람시설 설계는 추가 관람대, 사육 환경 연구는 후속 특수 서식지의 호환 허가다. 연구가 시설을 무료 건설하거나 공룡을 지급하지 않는다. 토지 면적·관람대 상한·환경별 호환종은 [연구 효과 상세](research-effects.md)에 정의했다. 별도 확장비와 특수환경5시설의 건설·성능·시간은 [밸런스 §16](balance.md), 종별 호환과 실제 확장 조작은 이 문서8절을 따른다. 기존21종의525행을 바꾸지 않고 추가5종125행과 구분한다. 시설/재료/연구의 목적 연결은 연구트리 목적표를 따른다.

## 3. 주요 21종의 역할과 변화 구간

다음 표는 25레벨 설계 대상의 명시적 매핑이다. 각 이름은 **그 건물의 모든 레벨별 효과·필요 골드/자재·시간·유지비**를 조회하는 파생표로 연결한다. 일반 레벨의 보간·비율·고정 앵커는 [성능 원천](balance.md#5-건물별-성능)을 따르며, 이 표에는 수치를 다시 복제하지 않는다.

| 계획 ID | 건물·현재/후보 ID | 강화의 주효과 | 외형 계열 |
| --- | --- | --- | --- |
| `grassland` | [초원 서식지](building-upgrade-tables.md#초원-서식지) · `habitat-grassland` | 호환 개체 수·상태 악화 완화 | 자연 서식지 |
| `forest` | [숲 서식지](building-upgrade-tables.md#숲-서식지) · `habitat-forest` | 숲 호환 개체 수·상태 악화 완화 | 자연 서식지 |
| `carnivore` | [육식 서식지](building-upgrade-tables.md#육식-서식지) · `habitat-carnivore` | 자연 육식 수용·상태 악화 완화 | 위험 전시 |
| `hybrid_herb` | [초식 하이브리드 서식지](building-upgrade-tables.md#초식-하이브리드-서식지) · `habitat-hybrid-herbivore` 후보 | 첫 영웅부터 호환 개체 수용·상태 악화 완화 | 초식 하이브리드 |
| `hybrid_carn` | [육식 하이브리드 격리 서식지](building-upgrade-tables.md#육식-하이브리드-격리-서식지) · `habitat-hybrid-carnivore` 후보 | 격리 수용·상태 악화 완화 | 위험 전시 |
| `platform` | [관람대](building-upgrade-tables.md#관람대) · `visitor-viewing-platform` | 해당 시설의 총 관람 정원 | 관람 동선 |
| `gate` | [입구 게이트](building-upgrade-tables.md#입구-게이트) · `operation-entrance-gate` | 유료 입장 처리 한도 | 관람 동선 |
| `lumber` | [벌목장](building-upgrade-tables.md#벌목장) · `production-lumberyard` | 목재 회분 생산량·단위 작업비 효율 | 생산 작업장 |
| `quarry` | [채석장](building-upgrade-tables.md#채석장) · `production-quarry` | 석재 회분 생산량·단위 작업비 효율 | 생산 작업장 |
| `feedmill` | [사료 공장](building-upgrade-tables.md#사료-공장) · `production-feed-factory` | 공용 사료 회분 생산량·단위 작업비 효율 | 생산 작업장 |
| `metalshop` | [금속 공방](building-upgrade-tables.md#금속-공방) · `production-metal-workshop` 후보 | 금속 회분 생산량·단위 작업비 효율 | 생산 작업장 |
| `warehouse` | [창고](building-upgrade-tables.md#창고) · `production-warehouse` | 일반 자원 종류별 저장 한도 | 보관 시설 |
| `hatchery` | [부화장](building-upgrade-tables.md#부화장) · `research-hatchery` | 기본 자리 포함 총 부화 슬롯·일반 부화 시간 | 부화·연구 |
| `lab` | [DNA 연구소](building-upgrade-tables.md#dna-연구소) · `research-dna-lab` | 기술/합성 분기·일반 작업 시간 | 부화·연구 |
| `security` | [보안센터](building-upgrade-tables.md#보안센터) · `operation-security-center` | 위험 전시 허용 점수·위험 종 유지비 완화 | 운영 관리 |
| `admin` | [관리사무소](building-upgrade-tables.md#관리사무소) · `operation-admin-office` | 착공 시점의 건설·강화 시간 보정 | 운영 관리 |
| `foodcourt` | [푸드코트](building-upgrade-tables.md#푸드코트) · `amenity-food-court` | 기존 방문 수요 보완 | 방문 편의 |
| `restroom` | [화장실](building-upgrade-tables.md#화장실) · `amenity-restroom` | 편의 관람 정원 가산 | 방문 편의 |
| `info` | [정보센터](building-upgrade-tables.md#정보센터) · `amenity-info-center` | 오프라인 운영 계수 개선 | 방문 편의 |
| `vault` | [파크 금고](building-upgrade-tables.md#파크-금고) · `operation-vault` 후보 | 실제 전체 골드 잔액 한도 | 보관 시설 |
| `fueldepot` | [탐험 연료 보급소](building-upgrade-tables.md#탐험-연료-보급소) · `production-fuel-depot` 후보 | 단일 연료 탱크 한도·회분 보급량·작업비 효율 | 연료 보급 |

기본 외형을 Lv.1에 제공하고 다음 변화 구간에서 같은 시설임을 알아볼 수 있는 실루엣을 유지하며 장비·구조를 크게 바꾼다. 표의 내부 구획·안내·장비는 기존 점유 안의 표현이다. 새 길·추가 전력/용수 재고·별도 직원 수·임의의 자동 작업을 해금하지 않는다.

| 외형 계열·위 표의 적용 시설 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
| --- | --- | --- | --- | --- | --- |
| 자연 서식지 · 초원/숲 | 울타리·먹이통 보강 | 쉼터·그늘 구조 확장 | 연못·식생 구획 정돈 | 관찰·돌봄 장비 일체화 | 완성된 생태 전시 외형 |
| 위험 전시 · 육식/육식 하이브리드 | 출입부·안전 표식 보강 | 이중문·관찰창 표현 | 내부 격리 장비 정돈 | 감시·차단 장비 일체화 | 통합 격리 전시 외형 |
| 초식 하이브리드 · 초식 하이브리드 | 복합종 전용 먹이대 | 넓은 쉼터 표현 | 보호 구획 정돈 | 돌봄 장비 일체화 | 대표 영웅 전시 외형 |
| 관람 동선 · 관람대/입구 | 지붕·안내 표지 확대 | 관찰·입장 설비 보강 | 동선 안내와 대기 구조 정돈 | 조명·운영 설비 일체화 | 파크 대표 관람/입구 외형 |
| 생산 작업장 · 벌목/채석/사료/금속 | 작업대·제품 더미 정돈 | 주력 생산 장비 교체 | 지붕·작업 구획 보강 | 장비·제품 보관 일체화 | 완성형 전문 작업장 |
| 보관 시설 · 창고/금고 | 선반·보관문 보강 | 적재·금고 잠금 장비 교체 | 내부 보관 구획 정돈 | 보관·관리 표시 일체화 | 대형 창고/중앙 금고 외형 |
| 부화·연구 · 부화장/DNA 연구소 | 부화 장비 보강·변종 연구 모듈 | 부화 장비 교체·전설 연구 모듈 | 정밀 관찰 장비 | 실험·관찰 공간 일체화 | 완성형 배양/연구 외형 |
| 운영 관리 · 보안센터/관리사무소 | 감시대·업무대 보강 | 관제·공사 계획 장비 | 운영 구획 정돈 | 상황판·업무 설비 일체화 | 통합 보안/관리 외형 |
| 방문 편의 · 푸드코트/화장실/정보센터 | 서비스 창구·설비 정돈 | 주력 편의 설비 교체 | 이용 구획·안내 보강 | 설비·안내 일체화 | 대표 방문객 서비스 외형 |
| 연료 보급 · 탐험 연료 보급소 | 탱크·보급대 보강 | 탱크·계량 장비 교체 | 보급 구획 정돈 | 탱크·보급 설비 일체화 | 완성형 탐험 보급 외형 |

연구 분기는 별도 챕터·원종·품질·레시피 조건도 만족해야 열린다. 첫 지정 영웅은 낮은 시설 단계에서 가능하며, 고레벨 시설이 전설 공룡을 자동 지급하거나 합성 성공률·실패 보호를 바꾸지 않는다. 외형 변화와 기능 변화의 정확한 적용 구분은 [연구/시설 성능](balance.md#5-건물별-성능)을 따른다.

## 4. 시설과 기능의 통합 분류

시설은 독립 성장시설, 기존 시설의 통합 기능, 관련 지역에서 도입하는 확장 콘텐츠, 장식으로 구분한다. 같은 역할의 생산·연구 시설을 중복 건설하는 대신 중심 시설의 기능과 연구 단계로 연결한다.

시설 역할은 유지22종(장식6종 포함), 기능 통합14종, 단계별 확장15종, 추가하지 않는 기능1종으로 정리한다. 금고·연료 보급소·하이브리드 서식지·금속 공방은 해당 역할에 연결하며, 주요 성장시설26종의 성능·비용은 전 단계 표를 따른다.

주요 성장시설은25레벨이며 장식은 강화하지 않는다. 통합 기능에는 독립 건물 레벨을 부여하지 않는다. 확장 콘텐츠의 도입은 해당 연구·지역·종 획득 조건을 따른다.

### 서식지 8종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `habitat-grassland` | 초원 서식지 | 독립 시설·장식 | 시작 파라·이구아노돈과 초반 초식 원종의 전시. 기본 지급을 유지 |
| `habitat-forest` | 숲 서식지 | 독립 시설·장식 | 숲 호환 자연종을 얻은 뒤 환경 선택 확대. 첫 탐험의 선행 구매는 아님 |
| `habitat-carnivore` | 육식 서식지 | 독립 시설·장식 | 안전 챕터의 육식 전시 기반. 첫 연구 전 시설 확장 단계와 연결 |
| `habitat-pterosaur-dome` | 익룡 돔 | 확장 콘텐츠 | 익룡 수집·비행 관람이 실제로 열릴 때 도입 |
| `habitat-marine-aquarium` | 해양관 | 확장 콘텐츠 | 해양종·수중 관람이 준비된 이후. 물 재고를 새로 요구하지 않음 |
| `habitat-desert` | 사막 서식지 | 확장 콘텐츠 | 사막 호환 종과 해당 탐험의 도입에 맞춤 |
| `habitat-volcanic` | 화산 서식지 | 확장 콘텐츠 | 후반 특수 환경·관련 공룡이 필요할 때 도입 |
| `habitat-glacier` | 빙하 서식지 | 확장 콘텐츠 | 극지 종·지역 확장과 함께 도입. 얼음 재고는 추가하지 않음 |

서식지의 수용량은 파크 전체 개체 한도가 아니다. 입구와 연결된 관람 지점·종 호환·시설 수용량을 함께 충족해야 전시 수요에 기여한다. 종별 원래 서식지의 정규화 결과는8절의83종 호환표를 따른다. 기존81종과 계획추가2종을 구분하며, 현재 서버가 이 호환표를 읽는다는 뜻은 아니다.

### 연구 시설 6종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `research-hatchery` | 부화장 | 독립 시설·장식 | 기본 부화 슬롯 이후 원종 확보 단계의 병렬 부화 확장. 기본 1자리와 별도로 첫 알부터 구매를 강제하지 않음 |
| `research-dna-lab` | DNA 연구소 | 독립 시설·장식 | 실제 보유 원종·탐험 재료로 합성하는 중심 시설. 첫 합성 전 준비 |
| `research-fossil-lab` | 화석 연구소 | 중심 시설의 기능 | DNA 연구소의 분석 기능·연구 분기로 정리. 화석→DNA의 별도 상시 재고/자동 추출망은 만들지 않음 |
| `research-genetics-center` | 유전자 센터 | 중심 시설의 기능 | DNA 연구소의 고급 유전자 분석2로 정리하는 상세안. 파라 룩스의 기존 해금은 DNA 원천/기술트리 매핑에 따라 구현 때 이관하고 기존 권한 보존 |
| `research-evolution-lab` | 진화 연구소 | 중심 시설의 기능 | DNA 연구소의 상위 연구 분기로 정리. 공룡 등급을 건물 강화만으로 올리는 기능은 넣지 않음 |
| `research-behavior-lab` | 행동 연구소 | 확장 콘텐츠 | 돌봄·관찰 플레이를 실제로 확장할 때 검토. 기본 합성의 중복 선행 건물은 아님 |

부화장을 지었을 때의 초기 확장은 **기본 포함 총 3자리**이며 기본 1자리에 3자리를 더하는 뜻이 아니다. 이후 레벨별 총 슬롯과 일반 부화 시간 개선은 [밸런스의 성능 원천](balance.md#5-건물별-성능)과 [전 레벨 상세표](building-upgrade-tables.md#부화장)를 따른다. 합성 연구는 배양·탄생 시간을 포함하므로 같은 결과에 알 부화를 다시 붙이지 않는다.

### 관람 시설 6종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `visitor-viewing-platform` | 관람대 | 독립 시설·장식 | 첫 입장료 투자·관람 정원 확장. 현재 Lv.1~2 연결을 유지. Lv.3~25는 0.5 상세 설계이며 런타임 적용 대기 |
| `visitor-tour-train` | 관람 열차 | 확장 콘텐츠 | 넓어진 파크의 관람 동선·수용 문제를 해결할 때 도입. 별도 관람 열차용 연료 재고는 만들지 않음. 탐험 연료와 운영 유지비를 구별 |
| `visitor-safari-jeep` | 사파리 지프 | 확장 콘텐츠 | 별도 관람 경험이 정해진 뒤 도입. 장소별 재료 탐험을 대신하는 자동 보상 시설로 쓰지 않음 |
| `visitor-underwater-tunnel` | 수중 터널 | 확장 콘텐츠 | 해양관의 실제 관람 지점 확장으로 검토. 해양관 없이 먼저 요구하지 않음 |
| `visitor-skywalk` | 스카이워크 | 확장 콘텐츠 | 숲·고저차 전시의 관람 지점으로 검토. 관람대와 효과가 같다면 외형/확장으로 통합 |
| `visitor-photo-zone` | 포토존 | 중심 시설의 기능 | 공룡 동상·촬영용 장식 배치의 외형 선택으로 정리. 별도 골드 생성 시설로 두지 않음 |

관람 정원을 늘려도 관람할 공룡과 방문 수요가 부족하면 정원이 모두 차지는 않는다. 입구·관람 시설·종 다양성·돌봄을 함께 보되 상세 공식과 수용량은 밸런스가 소유한다.

### 편의 시설 12종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `amenity-food-court` | 푸드코트 | 독립 시설·장식 | 방문 수요를 보완하는 식음료 편의 시설. 첫 영웅 이후 선택 도입 |
| `amenity-gift-shop` | 기념품샵 | 확장 콘텐츠 | 수집·관람 경험을 보완하는 방문객 서비스. 별도 직접 골드 수익 없이 역할을 먼저 검토 |
| `amenity-restroom` | 화장실 | 독립 시설·장식 | 관람 정원을 보완하는 편의 시설. 첫 영웅 이후 선택 도입하며 미설치 처벌 없음 |
| `amenity-drinking-fountain` | 음수대 | 중심 시설의 기능 | 휴게 구역의 외형·배치 요소로 정리. 물 재고나 공급망은 만들지 않음 |
| `amenity-bench` | 벤치 | 중심 시설의 기능 | 강화 없는 휴게 장식/배치 요소로 정리 |
| `amenity-dino-cafe` | 디노 카페 | 중심 시설의 기능 | 푸드코트의 외형·서비스 확장 선택. 별도 생산 재료는 추가하지 않음 |
| `amenity-ice-cream-shop` | 아이스크림샵 | 중심 시설의 기능 | 푸드코트의 외형 선택. 같은 편의 기능의 중복 건설을 피함 |
| `amenity-dino-restaurant` | 디노 레스토랑 | 중심 시설의 기능 | 푸드코트 상위 외형/서비스 단계로 검토. 레스토랑을 따로 지어야 진행되는 잠금은 정리 |
| `amenity-first-aid` | 구급소 | 확장 콘텐츠 | 방문객 건강·안전 운영이 실제 콘텐츠가 된 뒤 검토. 공룡 동물병원과는 대상이 다름 |
| `amenity-info-center` | 정보센터 | 독립 시설·장식 | 방문객 안내와 오프라인 운영 효율 개선. 기본 목표 카드·필수 UI는 항상 제공 |
| `amenity-locker` | 물품보관소 | 중심 시설의 기능 | 정보센터의 방문객 서비스 확장으로 정리. 별도 보관 물품 재고는 만들지 않음 |
| `amenity-atm` | ATM | 추가하지 않음 | 첫 성장과 후속 신규 해금에서 제외. 직접 골드 생성이나 별도 은행 재화 체계를 추가하지 않음 |

0.5에서 푸드코트는 방문 수요, 화장실은 관람 정원, 정보센터는 오프라인 운영 계수를 개선하는 설계를 정했다. 세 시설의 레벨별 수치는 [밸런스](balance.md#5-건물별-성능)가 소유하며 현재 런타임에는 적용 전이다. 기존 카탈로그의 `revenue` 값을 새 운영 수입으로 되살리지 않는다. 입장료 외 매출을 추가하려면 현재 경제 원칙을 바꾸는 별도 결정과 검산이 먼저 필요하다.

### 생산과 저장 시설 8종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `production-lumberyard` | 벌목장 | 독립 시설·장식 | 목재 공급. 파크 Lv.2부터 급한 구매와 장기 생산 중 선택 |
| `production-quarry` | 채석장 | 독립 시설·장식 | 석재 공급. 벌목장과 함께 배울 수 있지만 두 시설 모두 첫 탐험 필수는 아님 |
| `production-feed-factory` | 사료 공장 | 독립 시설·장식 | 모든 종의 공용 사료 공급. 실제 급식 수요가 커진 뒤 선택 투자 |
| `production-meat-storage` | 육류 저장소 | 중심 시설의 기능 | 공용 사료 시설의 육식 테마·보관 외형으로 정리. 고기 재고를 별도로 만들지 않음 |
| `production-fish-farm` | 어류 양식장 | 중심 시설의 기능 | 공용 사료 시설의 해양 테마·외형으로 정리. 생선 재고를 별도로 만들지 않음 |
| `production-power-plant` | 발전소 | 확장 콘텐츠 | 운영비 절감 시설 후보. 전력 충전·발전 재고·전력망 필수 잠금은 제외 |
| `production-water-reservoir` | 저수지 | 확장 콘텐츠 | 운영비 절감 시설 후보. 물 수급을 매일 반복하는 기본 부담은 넣지 않음 |
| `production-warehouse` | 창고 | 독립 시설·장식 | 일반 자원 종류별 저장 한도 확장. 기본 한도로 시작하며 첫 구매를 강제하지 않음 |

생산 시설을 짓기 위해 자기 생산품을 먼저 요구하는 순환 조건을 만들지 않는다. 공용 사료 공장에 육류·어류 테마를 적용하더라도 결과 재고는 사료 하나다. 연구 재료 5종은 각 장소의 미션 보상으로 얻으며 생산 시설과 DNA 연구소에서 자동 생성하지 않는다.

### 운영 시설 6종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `operation-admin-office` | 관리사무소 | 독립 시설·장식 | 건설·강화 시간의 선택적 개선. 추가 건설자 채용 자격과 시간 단축을 구별하며 기본 운영 UI는 항상 제공 |
| `operation-security-center` | 보안센터 | 독립 시설·장식 | 위험 전시 허용량과 위험 종 유지비 개선. 첫 안전 경로는 목재·석재로 준비 |
| `operation-vet-hospital` | 동물병원 | 확장 콘텐츠 | 공룡 건강·치료 콘텐츠를 실제로 도입할 때 검토. 기본 급식에 약품 재고를 더하지 않음 |
| `operation-staff-quarters` | 직원 숙소 | 중심 시설의 기능 | 관리사무소의 운영 확장/외형으로 정리. 별도 직원 주거 재료 공급망은 만들지 않음 |
| `operation-entrance-gate` | 입구 게이트 | 독립 시설·장식 | 시작 지급·개장·입장료·입구 처리량. 0.5의 레벨별 처리 한도는 관람 정원과 함께 적용 |
| `operation-parking-lot` | 주차장 | 중심 시설의 기능 | 입구의 접근성/외형 확장으로 검토. 첫 유료 입장 전의 추가 구매 조건은 아님 |

### 장식 6종

| 기준 ID | 시설 | 운영 방식 | 역할과 도입 |
| --- | --- | --- | --- |
| `decoration-dino-statue` | 공룡 동상 | 유지·무강화 | 선택 장식·포토존 외형. 관람·연구의 필수 조건은 아님 |
| `decoration-fountain` | 분수대 | 유지·무강화 | 선택 장식. 물·펌프 재료를 새로 요구하지 않음 |
| `decoration-flower-bed` | 화단 | 유지·무강화 | 선택 장식·녹지 외형 |
| `decoration-street-lamp` | 가로등 | 유지·무강화 | 조명 외형. 야간 연구 해금이 조명 강화 구매와 같은 뜻은 아님 |
| `decoration-fence` | 울타리 | 유지·무강화 | 선택 울타리 외형. 기본 파크 경계·필수 서식지 안전을 다시 과금하지 않음 |
| `decoration-path` | 길 | 유지·무강화 | 선택 길 외형. 입구와 서식지를 잇는 자동 기본길은 계속 무료 |

기본 경계와 관람길은 운영을 시작하는 기반이다. 장식 울타리·길을 팔더라도 이미 제공한 안전 경계·동선의 사용료로 중복 청구하지 않는다. 자동 동선 재탐색과 장식 외형의 관계, 기존 유료 길의 저장·충돌 처리도 적용 전에 정리한다.


## 5. 첫 전시 시설과 확장 후보

주요 시설 21종 중 초식 하이브리드 서식지는 첫 전시에 사용한다. 나머지 네 종의 역할과 ID는 확장 설계 기준이다. 최초 건설 해금·자재·시간은 [건설 원천](balance.md#3-최초-건설과-도입)을 따른다.

| 시설 | ID 후보 | 역할·도입 |
| --- | --- | --- |
| 초식 하이브리드 서식지 | `habitat-hybrid-zone` | 첫 영웅 스테고케라톱스를 받기 전에 안전한 전시 기반 준비. 첫 합성에 금속 잠금을 추가하지 않음 |
| 육식 하이브리드 격리 서식지 | `habitat-hybrid-carnivore` | 첫 영웅 이후 해당 육식 연구를 열 때 격리 수용·보안과 함께 도입 |
| 금속 공방 | `production-metal-workshop` | 첫 영웅 이후 상위 건설용 금속 공급. 최초 공방이 자기 생산품을 먼저 요구하지 않음 |
| 파크 금고 | `operation-vault` | 시작 무료 기본 시설. 전체 보유 골드의 한도를 확장하며 기존 잔액·실적과 구별 |
| 탐험 연료 보급소 | `production-fuel-depot` | 탐험 에너지와 통합한 연료의 선택 생산·탱크 확장. 보급소가 없어도 자연 회복/기본 구매로 탐험 가능 |

현재 종 데이터의 `hybrid-zone`, `hybrid-zone-isolation`, `carnivore-zone` 등은8절의 종별 호환표로 명시 매핑한다. 접두어 하나를 일괄 치환해 서로 다른 식성·안전 그룹을 합치지 않는다. 종별 호환·격리·위험 점수·실제 빈칸·관람길을 함께 이관하고, 첫 합성 결과를 받은 뒤 둘 곳이 없어지는 진행 막힘을 막는다.

### 금고·누적 입장료의 구분

누적 입장료는 실제 수납한 평생 실적이고, 금고 한도는 지금 사용할 수 있는 **골드 잔액 하나**의 상한이다. 금고에 별도 예금·이자·대출 잔액을 만들지 않는다. 무료 기본 금고를 제공하고 유효한 무료 배치 안내 중에도 기본 한도를 보장한다.

금고가 차면 추가 유료 입장만 멈추고, 기존 관람·돌봄·생산·탐험·지출은 이어진다. 지출로 여유가 생기면 새 유료 입장을 재개한다. 받지 않은 입장료나 대기 손님을 미수금·숨은 재고로 쌓지 않으므로 나중에 한꺼번에 밀린 골드를 지급하지 않는다. 오프라인도 같은 전체 한도를 사용한다. 시간순 정산·한 명분 여유·유지비·보상/환불 예외의 정확한 규칙은 [금고 정산 원천](balance.md#7-입장료와-전체-금고-한도)을 따른다.

### 탐험 연료의 구분

기존 탐험 에너지의 재고·회복 시각을 보존해 연료로 통합한다. 자동 회복과 보급소 생산·구매는 같은 단일 탱크를 읽고, 별도 에너지 비용이나 열 번째 재료 재고를 만들지 않는다. 출발 시 한 번 소비하며 잘못 고른 흔적·재접속에 추가 차감하지 않는다.

보급소는 시설당 한 작업·선택 회분·수동 수령을 유지한다. 자동 회복으로 탱크가 가득 찼다면 생산 완료분을 온전히 미수령 보존하고 연료를 사용한 뒤 받는다. 회복 시간의 무제한 저축이나 원유·가공유 공급망을 추가하지 않는다. [연료·생산 원천](balance.md#6-생산-단가와-연료)이 수량·단가·시간을 소유한다.

## 6. 초반부터 장기 성장까지의 도입 순서

| 진행 단계 | 필요한 시설·성장 | 선택 투자와 진행 보장 |
| --- | --- | --- |
| 파라와 재개장 | 시작 초원·입구·기본 금고·자동 관람길 | 무료 기본 기능으로 개장. 별도 경계·길·관리사무소·주차장 구매를 요구하지 않음 |
| 첫 입장료 투자 | 첫 관람대 | 자재 시스템을 배우기 전 기존 골드 전용 건설 앵커 유지 |
| 첫 탐험·이구아노돈 | 기본 부화 자리·기존 초원 | 신규 부화장이나 연료 보급소 선구매 없이 조사·알·수동 부화/수령·배치 |
| 초반 생산 소개 | 벌목장·채석장·연료 보급소 선택 가능 | 급한 물량은 기본 구매와 자연 회복으로 보완. 첫 탐험 선행 필수 아님 |
| 트리케라·스테고 확보 | 부화장·관람대 확장, 목재·석재 수급 | 창고·사료 공장·관리사무소는 필요한 수요에 맞춰 선택. 모두 최고 레벨로 만들지 않음 |
| 첫 연구 재료와 안전 챕터 | DNA 연구소·육식 서식지·보안센터 | 첫 연구·안전 경로는 낮은 건물 레벨과 목재·석재로 준비 |
| 첫 지정 영웅 연구·전시 | 초식 하이브리드 서식지·실제 보유 원종·연구 재료 | 첫 스테고케라톱스 100%를 유지. 연구·부화·안전·초식 하이브리드 시설 최고 레벨이나 금고 강화/연료 보급소 구매를 요구하지 않음 |
| 첫 영웅 이후 | 금속 공방·추가 관람대·상위 안전/연구·방문 편의 | 실제 수요·저장·입구·정원 중 병목을 보고 투자 대상을 선택 |
| 장기 수집·운영 | 필요 시설의 주요 변화 구간과 25레벨 완성 | 전 시설을 순서대로 모두 강화하는 의무 목록으로 만들지 않음. 특수 서식지·대형 관람은 관련 콘텐츠와 함께 후속 도입 |

첫 영웅까지의 시간은 초반 성장 속도를 검토할 설계 기준안이며 금고·연료·시설의 최신 연결을 함께 검증한다. 진행 목표와 새로운 검산 범위는 [밸런스](balance.md#8-진행-목표와-보존-계약), 원종·품질·레시피·첫 성공 보장은 [DNA 기획](dna-and-collection.md)을 따른다.

## 7. 구현·이관과 보존 계약

현재 카탈로그의 분포는 다음과 같다. 기존 저장 건물의 레벨·좌표·구입 이력을 이 문서만으로 바꾸지 않는다.

| 현재 카테고리 | 수록 수 | 카탈로그의 최대 레벨 값 |
| --- | ---: | --- |
| 서식지 | 8 | 25 |
| 연구 | 6 | 25 |
| 관람 | 6 | 2·5·10·15 |
| 편의 | 12 | 3·5·10·15·20 |
| 생산·저장 | 8 | 1·15·20·25 |
| 운영 | 6 | 10·15·20·25 |
| 장식 | 6 | 3·5·10 |
| 합계 | 52 | 전 건물 공통 상한이 아직 아님 |


주요 시설의 25레벨 방향과 상세 설계는 정했지만, 실행 시에는 기존 shared/game-data·서버·클라이언트가 같은 원천을 읽도록 이관해야 한다. 문서 표를 UI에 복사해 두 번째 설정으로 쓰지 않는다. 현재 관람대 Lv.1~2와 생산시설 Lv.1의 검증 범위를 새 25레벨 전체 검증으로 확대하지 않는다.

| 적용 시 확인할 항목 | 보존·검증 기준 |
| --- | --- |
| 기존 시설·배치 | 저장 레벨·효과·좌표·구입 이력 보존. 기존 고레벨을 낮추거나 통합 대상 건물을 자동 삭제하지 않음 |
| 과거 구입·소비 | 새 자재 비용을 소급 청구하지 않음. 원래 없던 전력·물·고기·생선 재고를 부채로 만들지 않음 |
| 전체 골드 한도 | 기존 한도 초과 잔액과 정상 취소/환불을 전액 보존하고 새 적립만 제한. 새 기본 금고 배치 때문에 기존 건물을 옮기지 않음 |
| 연료 단일 재고 | 기존 에너지·회복 시각 보존. 한도 감소·이관으로 초과한 연료는 삭제하지 않고 새 회복/수령만 제한 |
| 생산·수령 | 창고/탱크 재고와 미수령 배치의 이중 계산 금지. 자동 회복·수령 경쟁과 중복 차감/수령을 서버에서 처리 |
| 강화·정산 | 강화 중 기존 성능, 완료 이후 새 성능. 비용·한도·시간 보정의 적용 구간과 하나의 건설 슬롯 검증 |
| 서식지·보안 | 기존 수용 상한 초과 개체는 유지하고 새 배치부터 여유를 검사. 실제 부지·호환·격리·위험 점수·빈칸·입구/관람길을 함께 검사. 같은 종 반복 배치와 수요 가중치를 구별 |
| 연구 분기 통합 | 파라 룩스 등의 기존 해금을 새 DNA 연구 분기로 버전 매핑하며 이미 열린 권한 보존. 원종·품질·성공률·실패 보호는 유지 |
| 누적 실적 | 실제 수납한 방문객·입장료만 통계로 증가. 장기 정수 범위와 API 정밀도 이관은 잔액 한도와 별도로 처리 |
| 장식·통합 대상 | 무강화·외형 통합의 적용 매핑과 기존 유료 길/울타리·시설 이력 보존. 제안만으로 저장 데이터를 변경하지 않음 |

원천 수치의 검산·파생표 생성은 [밸런스의 검산 범위](balance.md#9-검산-범위)와 [상세표 결과](building-upgrade-tables.md#검산-결과)를 따른다. 이 설계 문서 변경으로 계정·돈·연료·공룡·시설·게임 코드를 변경하지 않는다.

## 8. 연구 해금 뒤의 실제 확장·사육

이 절은 토지·특수환경과 종별 사육을 연결하는 기획이다. **기본21시설525행 + 기존 카탈로그의 특수환경5시설125행 = 총26시설650레벨**로 구분한다. 기존 카탈로그52종 전체를25레벨 설계·구현 대상으로 바꾸거나 새5건물을 발명하는 작업이 아니다. 토지별 골드·자재·시간과 추가시설의 비용·성능은 [밸런스 §16](balance.md)이 소유하며 여기서 별도 가격을 만들지 않는다.

### 8.1 토지의 유료 확장과 입구 미리보기

토지 개발 연구는 확장할 권한을 연다. 실제 확장은 다음 미소유 구간을 선택하고 **추가 면적·전체 비용·자재·건설자 점유·완공 시각·새 테두리·입구 연결**을 미리 본 뒤 한 번 확정한다. 공사는 일반 건설자 한 명을 쓰며 한 파크에서 토지 공사 한 건만 진행한다. 연구원 작업과는 별개다. 시간 보정과 별도 토지 비용의 적용 범위는 밸런스 원천을 따른다.

좌표 원점과 기존 공룡·다른 시설은 그대로 두고 동쪽·남쪽으로 영역을 늘린다. 북쪽·서쪽 경계의 입구는 계속 유효하다. 현재 동쪽·남쪽 입구가 확장 뒤 내부로 들어갈 때는, **미리보기에서 사용자가 새 경계의 무료 이동 위치를 함께 확정**해야 착공할 수 있다. 입구의 새 점유 칸·출구 칸을 예약하고 기존 전시까지 통행 가능한지도 확인한다. 공사 중에는 기존 테두리·입구로 운영하며 새 영역을 미리 사용하지 않는다.

완공 시각까지 기존 입장료·유지비를 먼저 정산하고, 지도 크기와 이미 확정한 입구 위치를 같은 처리에서 전환한다. 관람길은 새 입구와 실제 장애물을 기준으로 다시 계산한다. 별도 길 재료·자동 보상·밀린 입장료를 만들지 않는다. 새 경계에 입구를 둘 수 없거나 연결 경로가 유효하지 않으면 비용을 받기 전에 미리보기 단계에서 막고 부족한 공간을 안내한다.

기존 큰 계정의 소유 면적은 줄이거나 다시 청구하지 않는다. 이미 양축 모두 소유한 확장 구간은 구매 완료로 보고, 직사각형 기존 부지는 목표 한 변과 각 현재 크기의 큰 쪽을 유지해 어느 축도 축소하지 않는다. 토지 소유와 기술 완료를 같은 값으로 역산하지 않으며, 기존 열린 콘텐츠와 선행 권한의 이관은 별도로 명시한다. 기존 시설·개체를 자동 이동하거나 과거 최대100칸의 합법 부지를 새40칸 기준으로 자르지 않는다.

### 8.2 기존 특수환경5시설의 역할과 외형

다섯 시설은 모두 현재52종 카탈로그에 ID가 존재한다. 최초 수용량·건설골드·유지비·점유 면적의 관찰값을 보존하고, 추가25레벨 비용·성능은 밸런스 §16의 기존 성장 프로필 참조로 정한다. 사육 허가는 획득 미션·알·원종 보유나 합성 레시피를 대신하지 않는다.

| 계획 ID | 기존 카탈로그 ID·시설 | 점유 면적 | 사육 연구와 역할 |
| --- | --- | --- | --- |
| desert | `habitat-desert` · 사막 서식지 | 3×3 | 건조 환경 사육Lv.1. 원래 사막 호환종의 선택 전시 환경 |
| volcanic | `habitat-volcanic` · 화산 서식지 | 3×3 | 화산 환경 사육Lv.1. 온도제어 쉼터를 둔 관리형 테마 전시 |
| glacier | `habitat-glacier` · 빙하 서식지 | 3×3 | 극지 환경 사육Lv.1. 온열 쉼터를 둔 관리형 테마 전시 |
| aerial | `habitat-pterosaur-dome` · 익룡 돔 | 4×4 | 익룡 사육Lv.1. 실제 익룡·해당 변종/하이브리드의 전용 전시 |
| marine | `habitat-marine-aquarium` · 해양관 | 4×4 | 해양 생물 사육Lv.1. 실제 해양 자연종·해당 하이브리드의 전용 전시 |

익룡 돔·해양관의 카탈로그4×4 점유를3×3으로 줄이지 않는다. 동물 배치 칸은 지정된 최대9칸이며, 나머지는 구조·통행·돌봄 공간으로 표현한다. 실제 수용량은 밸런스의 현재 완공레벨과9칸 중 작은 값이다. 한 칸에 한 개체를 놓고 건물 강화나 거대종 연구로 점유를 자동 축소하지 않는다. 강화로 외부 점유가 커지거나 이웃 시설을 밀어내지 않는다.

| 환경 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
| --- | --- | --- | --- | --- | --- |
| 사막 | 그늘·급식대 보강 | 오아시스 장식·쉼터 | 모래·암석 구획 정돈 | 관찰·돌봄 장비 일체화 | 완성된 건조 환경 전시 |
| 화산 | 안전 표식·방호부 | 온도제어 쉼터 | 화산암·관찰창 정돈 | 감시·돌봄 설비 일체화 | 완성된 화산 테마 전시 |
| 빙하 | 온열 쉼터 보강 | 눈·바위 외형 정돈 | 보호·관찰 구획 | 온열·돌봄 설비 일체화 | 완성된 극지 테마 전시 |
| 익룡 | 횃대·출입부 보강 | 돔·관찰창 표현 | 비행 관찰 장비 | 출입·돌봄 설비 일체화 | 완성형 익룡 돔 |
| 해양 | 수조·안내 보강 | 관찰창·쉼터 표현 | 수중 관찰 장비 | 수조·돌봄 설비 일체화 | 완성형 해양관 |

이 변화는 같은 점유 안의 외형·운영 성능 표현이다. 전력·물·얼음·고기·생선 등 새 재고를 만들지 않는다. 화산·빙하의 호환은 실제 동물의 내열·내한성 주장이 아니라 명시적으로 지정한 관리형 게임 환경이다.

### 8.3 호환 판정·격리·거대종

아래83종 표가 **원래 사육 경로의 정본**이다. 현재 런타임 카탈로그81종을 보존하고, 사용자 확정 계획추가2종인 시노케라톱스·메갈로돈을 별도로 포함한다. 따라서 기획83종·GIANT29종과 현재 카탈로그81종·기존 연구효과의 GIANT28종을 구분한다. 이 문서만으로 새 종이 게임에 등록되지는 않는다.

`alternatives`의 원소는 **OR 조건**이다. 원소 하나의 해당 시설·최소 완공레벨과 공통 사육 조건을 충족하면 되며, 나열한 모든 서식지를 지을 필요는 없다. 시설ID는 이 문서의 계획ID다. 원래36개 서식지 별칭은 종별로 정규화했으며 원본 `-lvN`의 최소레벨은 표에 보존했다. `hybrid-zone-lv18`인 기가스피누스는 실제 육식 조합이므로 **육식 하이브리드 시설Lv.18**로 명시한다. 접두어만 보고 초식 시설로 연결하지 않는다.

사막·화산·빙하 등의 **추가 관리형 환경 대안**은 [연구 효과 상세의 환경별 고정 호환목록](research-effects.md#care-desert)을 원천으로 읽는다. 아래83표에 그 추가 대안을 중복 입력하지 않는다. 실제 선택 가능 경로는 원래 경로와 해당 환경의 명시적 추가 경로의 합집합이며, 선택한 환경 연구·완공시설·안전·빈칸·수용량을 함께 검사한다. 환경별 추가 유지비 할인도 실제 배치된 호환 환경 한 곳에만 적용한다. 계획추가 메갈로돈은 해양관·해양 생물 사육Lv.1·거대종 사육Lv.3을 사용한다.

거대종 허가는 **실제 `size=giant`**에만 적용한다. 원래 태그에 giant라는 글자가 있다는 이유로 대형 에드몬토사우루스·트리케라톱스 등을 재잠그지 않는다. 기존 GIANT28종의 세 단계 분류는 연구효과 정본을 유지하며, 새 계획종 메갈로돈 한 종은 같은 비육상 거대종 규칙으로Lv.3을 요구한다. 기존 초원·육식·하이브리드 시설에 호환 구획을 연결하므로 별도 유료 ‘거대 평원’ 건물을 추가하지 않는다. 거대종을 위한 전시 구획·배치 검증 구현은 여전히 필요하다.

같은 시설 인스턴스 안에서는 아래 `group`이 같은 종끼리만 수용한다. 빈 시설의 첫 실제 입주 개체를 기준으로 현재 입주종을 검사하며, 별도의 사용자 입력 ‘사육모드’를 중복 저장하지 않는다. 자연 초식·자연/변종 육식·합성 초식·위험 하이브리드·자연/변종 익룡·자연 해양은 서로 다른 그룹이다. 예를 들어 사막의 초식과 육식, 빙하의 초식과 유타랩터, 자연 익룡과 육식 하이브리드는 같은 시설에 혼거하지 않는다. 같은 환경 시설을 별도로 지어 분리한다.

위험 전시 점수의 단위는 기존 보안 규칙을 사용한다. 자연/변종 육식·익룡·해양은 개체당1점, 위험 하이브리드는3점, 자연 초식·합성 초식은0점이다. `security_points`는 종별 적용값이며 기존 분류와 신규 비육상 분류를 명시한다. 추가 배치 후의 총 위험점수가 최고 완공 보안센터 허용값 이내여야 하며, 큰 몸집 자체로 점수를 추가하지 않는다. [밸런스 §16](balance.md)이 수치·성능을 소유한다. 보유·합성 부모 배정과 실제 파크 전시는 다른 상태이므로, 이미 소유한 부모를 반드시 전시해야 합성에 배정할 수 있다는 새 조건을 붙이지 않는다.

원종·레시피·개별 합성 조건은 [DNA 기획](dna-and-collection.md)이 소유한다. 실제 전시는 이 표의 호환 경로, 필요한 환경·거대종 허가, 현재 완공레벨, 소유권, 작업 잠금, 안전점수, 실제 빈칸과 입구에서의 관람 연결을 모두 확인한다. 기존 합법 배치·보유권한은 이관 때 강제로 이동·회수하지 않고 새 배치부터 명시 규칙을 사용한다.

<!-- housing:species -->
| id | name | origin | size | group | security_points | giant_permission | alternatives |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| parasaurolophus | 파라사우롤로푸스 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1},{"facility":"forest","min_level":1}] |
| parasaurolophus-lux | 파라사우롤로푸스 룩스 | variant | large | managed_herbivore | 0 | - | [{"facility":"hybrid_herb","min_level":1}] |
| iguanodon | 이구아노돈 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1},{"facility":"forest","min_level":1}] |
| gallimimus | 갈리미무스 | natural | small | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| edmontosaurus | 에드몬토사우루스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| dracorex | 드라코렉스 | natural | small | herbivore | 0 | - | [{"facility":"forest","min_level":1},{"facility":"grassland","min_level":1}] |
| corythosaurus | 코리토사우루스 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| maiasaura | 마이아사우라 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| muttaburrasaurus | 무타부라사우루스 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1},{"facility":"forest","min_level":1}] |
| triceratops | 트리케라톱스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| stegosaurus | 스테고사우루스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1},{"facility":"forest","min_level":1}] |
| ankylosaurus | 안킬로사우루스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| pachycephalosaurus | 파키케팔로사우루스 | natural | medium | herbivore | 0 | - | [{"facility":"forest","min_level":1}] |
| kentrosaurus | 켄트로사우루스 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1},{"facility":"forest","min_level":1}] |
| saurolophus | 사우롤로푸스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| ouranosaurus | 오우라노사우루스 | natural | large | herbivore | 0 | - | [{"facility":"desert","min_level":1},{"facility":"grassland","min_level":1}] |
| brachiosaurus | 브라키오사우루스 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":1}] |
| diplodocus | 디플로도쿠스 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":1}] |
| apatosaurus | 아파토사우루스 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":1}] |
| camarasaurus | 카마라사우루스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| therizinosaurus | 테리지노사우루스 | natural | large | herbivore | 0 | - | [{"facility":"forest","min_level":1}] |
| nigersaurus | 니게르사우루스 | natural | medium | herbivore | 0 | - | [{"facility":"grassland","min_level":1}] |
| argentinosaurus | 아르젠티노사우루스 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":15}] |
| patagotitan | 파타고티탄 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":1}] |
| dreadnoughtus | 드레드노투스 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":18}] |
| titanosaurus | 티타노사우루스 | natural | giant | herbivore | 0 | care-giant:1 | [{"facility":"grassland","min_level":20}] |
| dilophosaurus | 딜로포사우루스 | natural | small | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| compsognathus | 콤프소그나투스 | natural | small | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| coelophysis | 코엘로피시스 | natural | small | carnivore | 1 | - | [{"facility":"carnivore","min_level":1},{"facility":"desert","min_level":1}] |
| procompsognathus | 프로콤프소그나투스 | natural | small | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| ceratosaurus | 케라토사우루스 | natural | medium | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| majungasaurus | 마준가사우루스 | natural | medium | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| velociraptor | 벨로시랩터 | natural | small | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| allosaurus | 알로사우루스 | natural | large | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| carnotaurus | 카르노타우루스 | natural | large | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| baryonyx | 바리오닉스 | natural | medium | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| suchomimus | 수코미무스 | natural | large | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| deinonychus | 데이노니쿠스 | natural | medium | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| utahraptor | 유타랩터 | natural | medium | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| megalosaurus | 메갈로사우루스 | natural | large | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| tyrannosaurus-rex | 티라노사우루스 렉스 | natural | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":1}] |
| spinosaurus | 스피노사우루스 | natural | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":1}] |
| giganotosaurus | 기가노토사우루스 | natural | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":1}] |
| acrocanthosaurus | 아크로칸토사우루스 | natural | large | carnivore | 1 | - | [{"facility":"carnivore","min_level":1}] |
| tarbosaurus | 타르보사우루스 | natural | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":1}] |
| carcharodontosaurus | 카르카로돈토사우루스 | natural | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":1}] |
| indominus-rex | 인도미누스 렉스 | hybrid | giant | hybrid_carnivore | 3 | care-giant:3 | [{"facility":"hybrid_carn","min_level":1}] |
| indoraptor | 인도랩터 | hybrid | medium | hybrid_carnivore | 3 | - | [{"facility":"hybrid_carn","min_level":1}] |
| scorpios-rex | 스코르피오스 렉스 | hybrid | large | hybrid_carnivore | 3 | - | [{"facility":"hybrid_carn","min_level":1}] |
| allosaurus-maximus | 알로사우루스 막시무스 | variant | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":1}] |
| bahariasaurus | 바하리아사우루스 | natural | giant | carnivore | 1 | care-giant:2 | [{"facility":"carnivore","min_level":20}] |
| dimorphodon | 딤로포돈 | natural | small | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| rhamphorhynchus | 람포린쿠스 | natural | small | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| anurognathus | 아누로그나투스 | natural | small | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| pteranodon | 프테라노돈 | natural | medium | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| tapejara | 타페자라 | natural | medium | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| tupandactylus | 투판닥틸루스 | natural | medium | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| dsungaripterus | 준가립테루스 | natural | medium | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| quetzalcoatlus | 케찰코아틀루스 | natural | giant | pterosaur | 1 | care-giant:3 | [{"facility":"aerial","min_level":15}] |
| hatzegopteryx | 하츠에곱테릭스 | natural | giant | pterosaur | 1 | care-giant:3 | [{"facility":"aerial","min_level":1}] |
| tropeognathus | 트로페오그나투스 | natural | large | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| nyctosaurus-rex | 니크토사우루스 제왕종 | variant | large | pterosaur | 1 | - | [{"facility":"aerial","min_level":1}] |
| azhdarcho-magnus | 아즈다르코 제왕종 | hybrid | giant | hybrid_carnivore | 3 | care-giant:3 | [{"facility":"aerial","min_level":18}] |
| ichthyosaurus | 이크티오사우루스 | natural | medium | marine | 1 | - | [{"facility":"marine","min_level":1}] |
| nothosaurus | 노토사우루스 | natural | small | marine | 1 | - | [{"facility":"marine","min_level":1}] |
| plesiosaurus | 플레시오사우루스 | natural | large | marine | 1 | - | [{"facility":"marine","min_level":1}] |
| kronosaurus | 크로노사우루스 | natural | large | marine | 1 | - | [{"facility":"marine","min_level":1}] |
| elasmosaurus | 엘라스모사우루스 | natural | large | marine | 1 | - | [{"facility":"marine","min_level":1}] |
| mosasaurus | 모사사우루스 | natural | giant | marine | 1 | care-giant:3 | [{"facility":"marine","min_level":15}] |
| liopleurodon | 리오플레우로돈 | natural | giant | marine | 1 | care-giant:3 | [{"facility":"marine","min_level":1}] |
| tylosaurus | 틸로사우루스 | natural | giant | marine | 1 | care-giant:3 | [{"facility":"marine","min_level":1}] |
| shonisaurus | 숀이사우루스 | natural | giant | marine | 1 | care-giant:3 | [{"facility":"marine","min_level":18}] |
| livyatan | 리바이어던 | natural | giant | marine | 1 | care-giant:3 | [{"facility":"marine","min_level":20}] |
| ankylodocus | 안키로덕터 | hybrid | giant | managed_herbivore | 0 | care-giant:3 | [{"facility":"hybrid_herb","min_level":1}] |
| stegoceratops | 스테고케라톱스 | hybrid | large | managed_herbivore | 0 | - | [{"facility":"hybrid_herb","min_level":1}] |
| carnoraptor | 카르노랩터 | hybrid | medium | hybrid_carnivore | 3 | - | [{"facility":"hybrid_carn","min_level":1}] |
| spinoraptor | 스피노랩터 | hybrid | large | hybrid_carnivore | 3 | - | [{"facility":"hybrid_carn","min_level":1}] |
| allosinosaurus | 알로사이노 | hybrid | giant | hybrid_carnivore | 3 | care-giant:3 | [{"facility":"hybrid_carn","min_level":1}] |
| gigaspinus | 기가스피누스 | hybrid | giant | hybrid_carnivore | 3 | care-giant:3 | [{"facility":"hybrid_carn","min_level":18}] |
| indominus-rex-maximus | 인도미누스 렉스 제왕종 | hybrid | giant | hybrid_carnivore | 3 | care-giant:3 | [{"facility":"hybrid_carn","min_level":22}] |
| megalodon-rex | 메가로돈 렉스 | hybrid | giant | hybrid_carnivore | 3 | care-giant:3 | [{"facility":"marine","min_level":22}] |
| sinoceratops | 시노케라톱스 | natural | large | herbivore | 0 | - | [{"facility":"grassland","min_level":1},{"facility":"forest","min_level":1}] |
| megalodon | 메갈로돈 | natural | giant | marine | 1 | care-giant:3 | [{"facility":"marine","min_level":1}] |
<!-- /housing:species -->

### 8.4 에셋·실행 상태

실제 게임의 [임시 에셋 목록](../../apps/client/public/assets/placeholders/README.md)은 SVG 15종이다. 초식 하이브리드 서식지·DNA 연구소, 원종 두 종과 스테고케라톱스를 추가했다. 다른 환경의 전용 아트와 25레벨 외형은 후속 제작 범위다. 실제 점유·선택·충돌은 시설 격자와 저장 위치를 기준으로 판정한다.

첫 전시의 건설·서식지 호환·관람 동선과 결과 수령 뒤 건설자 2명은 게임에서 확인했다. 토지 확장 결제, 전 종 호환표 적용, 상위 특수 환경 기능은 후속 범위다. 전체 플레이 시간도 별도로 측정한다.

## 변경 기록

- 0.6 후속 실행 설계 / 2026-11-17: 토지 유료 확장·입구 동시 전환과 큰 계정 보존, 기존 특수환경5시설의25레벨 역할/외형·점유, 현재81+계획2의83종 호환 정본을 연결. 기가스피누스 육식 격리Lv.18·별도그룹/안전·원래경로OR·관리형환경 원천 분담을 명시. 기존21종525행은 보존하고 추가5종125행·총26종650레벨을 구분. 비용·시간·성능은 밸런스 §16, 런타임·DB는 미변경.

- 0.6 효과 상세화 / 2026-11-17: 기존14개와 신규58개를 합쳐72기술252회 연구의 레벨별 효과·해금 대상·중첩 정의. 신규58개의 정본은 research-effects, 자원·시간은 기존 원천을 보존. 후속 콘텐츠 실행과 전체 수급/재미는 별도 검증.

- **0.5 / 2026-11-16:** 사용자 결정으로 주요 건물 최대 25레벨·5레벨마다 큰 외형/기능 변화를 채택하고 이전 최대 5단계 제안을 대체. 기존 16종과 신규 후보 5종의 주요 21시설을 명시적으로 매핑. 가격·효과·자재·시간은 밸런스 원천과 525행 파생표로 연결하고, 이 문서는 역할·외형·도입·보존을 소유한다. 전체 골드 한도의 무료 기본 금고와 탐험 에너지 통합 연료/보급소, 누적 통계 분리·미수금 없음·초과 잔액/연료 보존을 반영. 실행 코드·DB 적용은 후속이다.
- **0.4 보관:** 기존 52종의 22유지/14통합/15후속/1신규제외와 최대 5단계 제안은 [보관본](../archive/0.4/buildings.md)에 남긴다. 현재 전수표는 관찰한 52종·기존 상한·정리 제안을 보존하며 통합/후속을 일괄 확정하지 않는다.
