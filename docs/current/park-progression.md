# 파크 성장과 유한 경험치 공급 정본 0.6

파크 Lv.5→50의 성장 목표와 XP 배분 원천이다. 게임의 성장 목표에서 Lv.5부터 Lv.15까지 진행할 수 있다. 건설·연구·탐험·획득의 권한과 비용은 각 기존 정본을 참조한다. 읽기용 표는 [성장 목표표](park-progression-tables.md), 계산·검사는 `docs/models/park_progression_model_v06.py`와 `check_park_progression_v06.py`가 담당한다.

## 첫 전시 뒤 파크 Lv.15까지

### 파크 레벨 5에서 6까지

첫 스테고케라톱스 전시 뒤 **Lv.6 성장 목표 보기**를 누른다. 입구 연구와 기초 촉매 회수를 비롯한 네 목표는 원하는 순서로 진행한다. 이미 지은 DNA 연구소와 누적 유료 입장객처럼 먼저 채운 조건은 바로 인정한다.

| 목표 | 화면에서 할 일 |
| --- | --- |
| 시설 준비 | DNA 연구소 Lv.1을 완공한다. 첫 영웅을 합성할 때 사용한 연구소의 완공도 인정한다. |
| 연구 적용 | **연구 시작**을 눌러 입장 수속 Lv.1을 진행한다. 500골드, 목재 5개, 석재 5개가 필요하다. 기본 연구원 한 명이 1분 뒤 연구를 마치면 입구의 분당 입장 처리 상한이 4% 높아진다. |
| 현장 발견 | ‘폐연구소로 가기’를 눌러 ‘폐연구소 기초 촉매 회수’에 출발한다. 준비비는 350골드다. 귀환 뒤 하급 합성 촉매 1개를 받고 ‘성장 목표로 돌아가기’를 누른다. |
| 입장 실적 | 파크를 개장해 누적 유료 입장객 100명을 채운다. 이미 채웠다면 경험치를 바로 받는다. |

조건을 채운 목표마다 **897 XP 받기**를 누른다. 원정에서 촉매를 받는 화면과 파크에서 경험치를 받는 화면은 따로 있다. 네 목표의 3,588 XP에 앞서 남은 35 XP를 더하면 필요한 3,623 XP를 채우고 **파크 Lv.6 달성!**이 표시된다. 성과와 수령 기록은 파크를 나갔다 돌아와도 이어진다.

연구 자재가 부족하면 **자원 시설 보기**에서 목재와 석재를 마련한다.

첫 전시 뒤 **입장 진단**에서 관람 수요, 입구 처리량과 정원을 비교한다. **금고가 찼어요**가 보이면 **기본 자원 구매**에서 필요한 자재를 산다. 25,000골드 한도에 한 명의 입장료인 20골드를 더 담을 수 있으면 입장이 재개된다.

### 파크 레벨 6에서 7까지

Lv.6 달성 화면에서 **Lv.7 성장 목표**를 누른다. 전시를 늘리거나 다음 합성에 쓸 중급 재료를 모은다. 공통 연구 1,257 XP와 경로 하나의 3,774 XP를 받아 **5,031 XP**로 Lv.7에 도달한다.

| 경로 | 화면에서 할 일 |
| --- | --- |
| 공통 연구 | **환경 적응 Lv.1**을 마치고 **1,257 XP 받기**를 누른다. 500골드, 목재 5개, 석재 5개와 1분이 든다. 호환 서식지에 전시한 공룡은 행복도와 배고픔 상태가 악화되는 속도가 2% 느려진다. |
| 운영 경로 | **전시 구역 관리**에서 관람길로 연결된 전시를 3곳 이상 운영하고 실제 동시 관람객 50명 이상을 맞이한다. 완공된 서식지에 호환 공룡이 있어야 한다. |
| 탐험 경로 | 첫 스테고케라톱스 전시 뒤 **화석 계곡 DNA 조사 1** 또는 **화석 계곡 DNA 조사 2** 중 하나와 **원시 습지 배양 시료**에 출발한다. 귀환 뒤 중급 DNA와 배양액을 수령하고 **성장 목표로 돌아가기**를 누른다. |

전시가 3곳이면 최대 64명이 머물 수 있다. 실제 인원이 모자라면 개장 상태, 금고 여유, 공룡 돌봄과 입구 처리량을 **입장 진단**에서 확인한다.

### 파크 레벨 7에서 8까지

Lv.7 달성 화면에서 **Lv.8 성장 목표**를 누른다. 네 번째 전시를 열거나 현장 지도화로 화석 계곡의 새 조사 구간을 열어 **6,640 XP**를 받는다.

| 경로 | 화면에서 할 일 |
| --- | --- |
| 운영 경로 | 관람길로 연결된 전시를 4곳 이상 운영하고 실제 동시 관람객 70명 이상을 맞이한다. 전시가 4곳이면 최대 84명이 머물 수 있다. 공룡마다 필요한 서식지와 보안 조건을 확인한다. |
| 탐험 경로 | **현장 지도화 Lv.1**을 연구하고 **화석 계곡 재조사**를 마쳐 하급 DNA 샘플 5개를 수령한다. 첫 전시 뒤의 **화석 계곡 DNA 조사 1·2**, **원시 습지 배양 시료**, **버려진 연구소 촉매 회수** 네 보상도 수령한다. 먼저 받은 보상은 이어서 인정한다. |

탐험 경로의 현장 지도화 연구에는 400골드, 목재 5개, 석재 5개와 1분이 든다. 화석 계곡 재조사는 기슭 화석층에 탐험가를 파견한다. 준비비는 150골드다. 귀환 보고서에서 하급 DNA를 수령하고 **성장 목표로 돌아가기**를 누른다.

두 레벨 모두 전시와 동시 관람객 조건을 함께 달성하면 손님이 퇴장한 뒤에도 그 운영 성과가 기록된다. 중급 재료는 첫 전시 뒤 출발한 원정에서 받아야 한다. 재료를 사용해도 수령 이력은 남는다.

같은 레벨의 경로 XP는 한 번 받는다. 보상을 고른 뒤에도 다른 경로의 활동을 계속할 수 있다. 앞서 같은 레벨에서 받은 성장 XP를 반영해 남은 경험치만 받는다. 누적 유료 입장객은 운영 기록에서 계속 확인할 수 있다.

탐험 경로의 각 원정에서 **수령 완료** 여부를 확인할 수 있다. Lv.8 달성 화면에서 **Lv.9 성장 목표**를 열거나 **반복 합성 보러 가기**로 이동해 다른 성향의 스테고케라톱스를 준비한다.

### 파크 레벨 8에서 15까지

파크 Lv.8부터 시설·연구·현장·누적 유료 입장 네 분야의 목표를 원하는 순서로 달성한다. 한 분야의 대안 중 하나를 완료한 뒤 경험치를 한 번 받는다. 공사·연구·파견을 기다리는 동안 개장한 파크에서 손님을 받아 입장 실적을 쌓을 수 있다. 해당 단계가 열리기 전에 완료한 시설·연구·현장 보상도 인정한다.

| 파크 | 시설 예시 | 연구 예시 | 현장 예시 |
| --- | --- | --- | --- |
| Lv.8→9 | DNA 연구소 Lv.4 | 고급 유전자 분석 Lv.1 | 광물 동굴에서 기초 안정제 보고서 수령 |
| Lv.9→10 | DNA 연구소 Lv.5 | 토지 개발 Lv.1 | 원시 습지에서 기초 배양액 보고서 수령 |
| Lv.10→11 | DNA 연구소 Lv.6 | 시설 고도화 Lv.1 | 갈리미무스 알을 부화시키고 개체 수령 |
| Lv.11→12 | DNA 연구소 Lv.7 | 일반 초식 원종 조사 Lv.2 | 현장 지도화 Lv.2를 마치고 갈대 수로변 보고서 수령 |
| Lv.12→13 | DNA 연구소 Lv.8 | 환경 적응 Lv.3 | 사막에서 코엘로피시스 지정 알 보고서 수령 |
| Lv.13→14 | DNA 연구소 Lv.9 | 입장 수속 Lv.2 | 초원에서 코리토사우루스 지정 알 보고서 수령 |
| Lv.14→15 | DNA 연구소 Lv.10 | 일반 육식 원종 조사 Lv.2 | 화석 계곡에서 파키케팔로사우루스 지정 알 보고서 수령 |

시설 고도화 Lv.1은 DNA 연구소 Lv.5에서 연구한다. 완료하면 연구소·금고·창고의 Lv.6~10 강화를 시작할 수 있다. 누적 유료 입장 실적은 입장료를 실제로 받은 입장 건수다. 금고가 가득 차면 시설이나 연구에 골드를 쓰거나 금고를 강화해 새 손님을 받는다.

현장 목표는 종류별로 완료 시점이 다르다. Lv.10의 갈리미무스나 안킬로사우루스 목표는 부화해 개체를 수령했을 때 인정한다. 지정 알이나 재료의 보고서를 요구하는 목표는 보고서를 수령하면 완료된다. 실행 가능한 대안과 진행 상태는 게임의 성장 목표에서 확인한다.

### Lv.15에서 열리는 현장과 이야기

파크 Lv.15 달성 화면에서 **기초 변이세포 조사**를 누르면 변이 분화구의 **외곽 온천 표본대**로 이동한다. 완공된 DNA 연구소 Lv.5와 고급 유전자 분석 Lv.2를 갖추고 준비비 450골드를 사용한다. 귀환 보고서에서 중급 변이세포 1개를 받는다.

같은 연구 조건을 갖추고 첫 스테고케라톱스를 전시했다면 DNA 연구소에서 **실험 합성**을 열 수 있다. 육상 원종 두 종과 성향을 고르고 중급 재료를 모아 첫 영웅 계통에 도전한다. 새 조합의 견적과 연구자료를 쓰는 방법은 [새 하이브리드 실험](dna-and-collection.md#새-하이브리드-실험)에서 확인한다.

3장을 완료한 파크는 이어서 **4장 심연의 비밀**의 첫 장면 **바다의 부름**을 읽을 수 있다. 다음 장면 **해양관 프로젝트**는 해양 생물 사육 연구와 해양관 완공, 유료 관람 기록으로 이어진다. 해양관은 파크 Lv.20에 건설할 수 있다. 세부 조건은 [후속 스토리 진행](story-progression.md#11-첫-합성-이후-본편의-성장-연결)에서 확인한다.

## 1. 고정값과 도달 계산

공유 상한은 Park50이다. 레벨 L에서 다음 레벨까지 필요한 XP는 `floor(200 × L^1.8)`이다. 초반 다섯 목표의 4,800 XP로 Lv.5에 도달하고 35 XP가 남는다. 이후 45번의 레벨 전환에 3,964,614 XP를 배분했다. 초반과 합친 파크 Lv.50 누적 경험치는 3,969,414 XP다.

Lv.5→6은 보상 3,588 XP에 남은 35 XP를 더해 필요한 3,623 XP를 채운다. Lv.6→7과 Lv.7→8에서 받는 XP는 위의 운영·탐험 경로를 따른다. 이후 단계의 장기 성장표는 시설·연구·현장·운영 네 분야에 다음 레벨에 필요한 경험치를 나누어 배분한다.

## 2. 소유권·한 번 수령·이력 인정

새 보상은 파크 소유의 성장 성취 보상이다. 모든 목표는 첫 영웅 **개체 수령 이력**과 해당 행 Park레벨 이상을 확인한 뒤 사용자가 수동으로 한 번 수령한다. 원천의 성공·완공·보상수령과 성장XP 지급은 별개다. `(park_id, goal_id)` 유일키로 파크레벨·수령기록·XP를 한 트랜잭션에서 확정한다. 재시도·재접속·동시요청은 이미 수령한 결과를 반환한다. 탐험 실패·진행중·미수령 상태는 증거가 아니다. 성장 보상은 탐험의 `extra_park_xp=0`을 바꾸지 않는다.

시설은 해당 파크의 건물 완공 이력, 연구는 기술 완료 이력, 탐험은 성공 보상을 수령한 이력을 확인한다. Lv.6과 Lv.7의 운영 경로에서 전시 구역과 실제 동시 관람객 기준을 함께 만족하면 성과를 저장한다. 그 밖의 단계에서 누적 유료 입장객을 요구하면 실제로 입장료를 낸 손님의 누적 기록을 사용한다. 정상적으로 먼저 완료한 조건과 이미 받은 XP는 파크에 남는다.

장기 성장표의 시설·연구·일반 현장 목표에 대안이 있으면 하나를 완료한다. Park25·30·35의 현장 목표는 각각 본편 4·5·6장 완료다. 6장은 선택한 분기 하나를 완료한다. 해당 단계에서 진행할 수 있는 작업을 원하는 순서로 마치고 보상을 받는다.

## 3. 장기 운영과 보존 범위

파크 Lv.5→6에는 누적 유료 입장객 100명 목표가 있다. Lv.6→8의 누적 유료 입장객 400명과 900명은 운영 성과를 비교하는 기준이다. 이후 장기 성장표의 유한한 누적 실적 목표는 마지막 202,500명까지다. 실제로 입장료를 낸 손님만 누적 실적에 포함한다. 성장 보상은 해당 목표를 완료한 뒤 한 번 수령한다.

현금·다이아·가속 구매와 추가 유료 연구원을 선행으로 삼지 않는다. 무료 기본 연구원1명과 기존 생산·유료입장·자재구매·탐험 경로로 수행할 **권한**이 있다. 원천69기술239단계·25시설625단계·83종획득·15합성과7/14/21/28일 하한·인원·자재비·첫영웅 조건은 보존한다. 전체 기술 최대·83종 전수집·15합성 전부·전 결말 관람은 Park50 필수가 아니다. 실제 수급·연구원 점유·배치·동선·완주기간은 실플레이 미검증이다. 최단 달력일이나 한 줄 진행순서를 약속하지 않는다. Park50 이후에도 운영·확장·선택 수집을 계속한다.

## 4. Park·연구소·기술과 토지

Park는 파크 성장 수치, DNA연구소는 시설Lv1~25, 기술은 각각 원천 최대Lv3~5다. `lab_preparation`은 선택지 준비를 위한 **권장 안내**이며 Park와 연구소를 동일 레벨로 묶거나 새 해금을 만들지 않는다. 준비를 미리 완료해도 된다. 연구소6~10은 고도화1,11~20은 고도화2,21~25는 고도화3의 기존 선행폐쇄를 따른다.

초기 정형 부지는 토지 개발 연구와 유료 공사를 거쳐 한 변이 20칸에서 24·28·32·36·40칸으로 넓어진다. 중반에는 인접 필지 구매 기능이 열리고, 이후 플레이어가 기존 경계에 붙은 구매 가능 필지를 직접 골라 산다. 필지마다 파크 레벨을 다시 올릴 필요 없이 위치와 가격을 비교해 결정할 수 있다. 구매할 수 있는 시점과 배치 규칙은 [건물과 부지](buildings.md#81-토지의-유료-확장과-입구-미리보기)를 따른다.

알 목표는 지정 mission ID의 알 보상 수령 이력이며 전시 허가·거대종 허가·보유 부모를 새로 요구하지 않는다. 실제 전시에는 호환 서식지·위험·보안·수용·거대종 허가를 별도 적용한다. 합성과 변종의 기존 Park15·부모·챕터6완료 조건은 그대로다. 획득과 전시 조건을 합치지 않는다.

## 5. 단계와 스토리 연결

Park구간은 권장 목표 묶음이다. 스토리 하드 조건을 대체하지 않고 정상 선완료 기록을 인정한다. 장면은 새로운XP를 중복 지급하지 않는다. 아래 `story_refs`는 내비게이션 연결이다. 각 행의 `field`에 명시한 본편 완료 조건 외에 추가 AND 조건을 만들지 않는다. 상세 장면·분기는 [스토리 진행](story-progression.md) §11의 정본을 따른다.

4장은 `care-aerial:1`→`care-marine:1`·연구소20·해양관1과 작은 해양종 관람 준비에 연결한다. 이크티오·노토·플레시오·크로노·엘라스모 중 호환1종을 이용할 수 있다. 모사 알은 추천 수집이고 모사·리바이어던의 보유·전시는 성장XP 필수가 아니다. 해양 준비가 늦으면 다른 대안을 먼저 쓴다. 5장은 기존 보안·수용·관람길 재확인에 연결하며 아직 없는 수리·대피 기능을 필수로 삼지 않는다. 6장은 야생 개체 대면과 선택한 한 결말 완료에 연결한다. 인도미누스 계열 소유를6장 입장·완료 선행에 두지 않는다. 챕터6완료 뒤 합성과 같은 분기 에필로그를 잇는다. Park35 이후에도 일반 수집·연구·시설·운영을 이어 간다.

<!-- progression:milestones -->
| id | park_from | park_to | label | focus | story_refs |
| --- | ---: | ---: | --- | --- | --- |
| foundation | 5 | 9 | 첫 영웅 이후 운영 기반 | 연구소1~5·기초조사·생산/저장·토지연구 준비 | - |
| regional | 10 | 14 | 지역 조사와 연구소 확장 | 고도화1·연구소6~10·희귀 원종 접근 | - |
| specialization | 15 | 19 | 특수 환경 준비 | 연구소11~15·익룡/거대종 입문·Park15 변종은 선택수집 | - |
| responsibility | 20 | 25 | 해양관과 생명의 책임 | 해양준비·습지 연계조사·4장 선택 | ch4-scene-1,ch4-scene-2,ch4-scene-3,ch4-scene-4,ch4-scene-5 |
| crisis | 26 | 31 | 중후반 시설과 위기 대응 | 보안/수용/관람길 확인·5장 | ch5-scene-1,ch5-scene-2,ch5-scene-3,ch5-scene-4 |
| conclusion | 32 | 35 | 화산 조사와 선택한 결말 | 분화구 연계조사·6장 선택완료·같은 에필로그 | ch6-scene-1,ch6-scene-2,ch6-scene-3-hopeful,ch6-scene-3-realistic,ch6-scene-3-tragic,epilogue-scene-hopeful,epilogue-scene-realistic,epilogue-scene-tragic |
| legacy | 36 | 50 | 유산을 이어 가는 장기 운영 | 선택수집·시설개선·연구적용·유한 운영성취;50이후 운영계속 | - |
<!-- /progression:milestones -->


실제 개체·전시·본편 마일스톤은 Park10 자연종 보유(갈리미무스/안킬로사우루스),15 파라룩스 합성수령 또는 브라키오사우루스 보유,20 프테라노돈/타페자라 전시,25 본편4장,30 본편5장,35 본편6장 선택분기 한 개,40 인도미누스/리바이어던 보유로 연결한다. 새 개체의 이름만 도감에 보이는 상태나 알 수령만으로는 보유 완료가 아니다. 실제 부화·합성 결과 개체수령을 검증한다. 전시는 호환 시설·환경기술·위험·수용·빈칸·관람동선이 유효한 실제 확인을 요구한다. Park15의 브라키오사우루스 보유 대안은 거대종 **전시**를 요구하지 않으며, Park40 자연 전설 대안은 지정알100%·기존 부화 경로로 합성 무작위 성공만 필수로 만들지 않는다. 장 완료와 개체수령은 별개라6장이 소유 인도미누스를 먼저 요구하지 않는다. 본편 장의 권장Park는 여전히 새 하드 게이트가 아니다.

## 6. 45전환의 선택지·정확 보상 원천

Lv.6→7과 Lv.7→8의 현재 플레이 조건은 상단의 운영·탐험 경로를 따른다. 이 절의 두 행은 장기 수급을 비교하는 데 쓰는 투자·방문객 기준과 전환당 XP 총량을 보존한다.

`building:id:rank`=완공, `research:id:rank`=연구완료, `egg:mission`=지정알 목표성공 보상수령, `material:mission`=재료조사성공 보상수령, `paid:n`=실제유료입장누적n명, `owned:sid`=실제 개체수령·보유 이력, `recipe:sid`=해당 합성 성공 개체수령 이력, `exhibit:sid`=실제 전시·관람검증 이력, `story:chapter-n`=본편 장 완료 이력이다. `;`는OR이고 횟수합산이 아니다. 각XP열은 해당 트랙 한 번의 고정 보상이며 모든 행의 공통조건은2절이다.

<!-- progression:levels -->
| park_level | facility | research | field | operation | lab_preparation | facility_xp | research_xp | field_xp | operation_xp | story_refs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | building:lab:1;building:warehouse:2 | research:ops-entry:1;research:exp-clue-comparison:1 | egg:gene-target-compsognathus;material:mission.abandoned-lab.basic-catalyst.v1 | paid:100 | 1 | 897 | 897 | 897 | 897 | - |
| 6 | building:lab:2;building:platform:2 | research:care-adaptation:1 | egg:gene-target-dilophosaurus;material:mission.fossil-valley.basic-dna.v1 | paid:400 | 2 | 1257 | 1257 | 1257 | 1260 | - |
| 7 | building:lab:3;building:security:2 | research:exp-field-mapping:1;research:gene-common-carnivore:1 | egg:gene-target-edmontosaurus;material:mission.fossil-valley.repeat-rim-survey.v1 | paid:900 | 3 | 1660 | 1660 | 1660 | 1660 | - |
| 8 | building:lab:4;building:feedmill:2 | research:gene-analysis:1;research:care-isolation:1 | egg:gene-target-gallimimus;material:mission.mineral-cave.basic-stabilizer.v1 | paid:1600 | 4 | 2111 | 2111 | 2111 | 2111 | - |
| 9 | building:lab:5 | research:ops-land:1;research:gene-common-herbivore:1 | egg:natural-target-dimorphodon;material:mission.primal-swamp.basic-culture.v1 | paid:2500 | 5 | 2609 | 2609 | 2609 | 2612 | - |
| 10 | building:lab:6;building:warehouse:3 | research:ops-engineering:1;research:care-adaptation:2 | owned:gallimimus;owned:ankylosaurus | paid:3600 | 6 | 3154 | 3154 | 3154 | 3157 | - |
| 11 | building:lab:7;building:platform:3 | research:gene-common-herbivore:2 | egg:gene-target-ankylosaurus;material:mission.primal-swamp.repeat-reedbank-survey.v1 | paid:4900 | 7 | 3745 | 3745 | 3745 | 3745 | - |
| 12 | building:lab:8;building:security:3 | research:ops-processing:1;research:care-adaptation:3 | egg:gene-target-carnotaurus;egg:gene-target-coelophysis | paid:6400 | 8 | 4380 | 4380 | 4380 | 4380 | - |
| 13 | building:lab:9;building:feedmill:3 | research:care-incubation:1;research:ops-entry:2 | egg:gene-target-corythosaurus;egg:gene-target-dracorex | paid:8100 | 9 | 5059 | 5059 | 5059 | 5059 | - |
| 14 | building:lab:10 | research:gene-common-carnivore:2 | egg:gene-target-pachycephalosaurus;material:mission.abandoned-lab.repeat-wall-store-survey.v1 | paid:10000 | 10 | 5780 | 5780 | 5780 | 5783 | - |
| 15 | building:lab:11;building:warehouse:4 | research:gene-analysis:2;research:ops-entry:3 | recipe:parasaurolophus-lux;owned:brachiosaurus | paid:12100 | 11 | 6545 | 6545 | 6545 | 6546 | - |
| 16 | building:lab:12;building:platform:4 | research:gene-combination-foundation:1;research:care-adaptation:4 | egg:natural-target-ichthyosaurus;material:mission.fossil-valley.middle-repeat.v1 | paid:14400 | 12 | 7351 | 7351 | 7351 | 7353 | - |
| 17 | building:lab:13;building:security:4 | research:exp-risk-reading:1;research:ops-entry:4 | egg:natural-target-plesiosaurus;material:mission.fossil-valley.outer-terrace-survey.v1 | paid:16900 | 13 | 8199 | 8199 | 8199 | 8200 | - |
| 18 | building:lab:14;building:feedmill:4 | research:exp-cave-strata:1;research:care-interaction:1 | egg:natural-target-pteranodon;material:mission.mineral-cave.dark-junction.v1 | paid:19600 | 14 | 9087 | 9087 | 9087 | 9090 | - |
| 19 | building:lab:15 | research:ops-engineering:2;research:care-nutrition:1 | egg:natural-target-rhamphorhynchus;material:mission.primal-swamp.middle-repeat.v1 | paid:22500 | 15 | 10016 | 10016 | 10016 | 10018 | - |
| 20 | building:lab:16;building:warehouse:5 | research:care-aerial:1 | exhibit:pteranodon;exhibit:tapejara | paid:25600 | 16 | 10985 | 10985 | 10985 | 10987 | ch4-scene-1 |
| 21 | building:lab:17;building:platform:5 | research:care-giant:1;research:gene-culture:1 | egg:gene-target-brachiosaurus;material:mission.primal-swamp.outer-delta-survey.v1 | paid:28900 | 17 | 11994 | 11994 | 11994 | 11994 | ch4-scene-2 |
| 22 | building:lab:18;building:security:5 | research:exp-wetland-crossing:2;research:care-upkeep:1 | egg:gene-target-ceratosaurus;material:mission.primal-swamp.watermark-compare.v1 | paid:32400 | 18 | 13041 | 13041 | 13041 | 13043 | ch4-scene-3 |
| 23 | building:lab:19;building:feedmill:5 | research:exp-crater-reading:1;research:gene-uncommon-carnivore:1 | egg:gene-target-diplodocus;material:mission.abandoned-lab.middle-repeat.v1 | paid:36100 | 19 | 14127 | 14127 | 14127 | 14130 | ch4-scene-4 |
| 24 | building:lab:20 | research:care-marine:1;research:gene-uncommon-herbivore:1 | egg:gene-target-kentrosaurus;material:mission.abandoned-lab.outer-yard-survey.v1 | paid:40000 | 20 | 15252 | 15252 | 15252 | 15255 | ch4-scene-5 |
| 25 | building:desert:1;building:warehouse:6 | research:ops-land:5;research:care-isolation:2 | story:chapter-4 | paid:44100 | 21 | 16415 | 16415 | 16415 | 16418 | - |
| 26 | building:aerial:1;building:platform:6 | research:gene-rare-carnivore:1;research:ops-flow:1 | egg:gene-target-majungasaurus;material:mission.mineral-cave.cavern-contour.v1 | paid:48400 | 21 | 17616 | 17616 | 17616 | 17618 | - |
| 27 | building:marine:1;building:security:6 | research:care-desert:1;research:ops-maintenance:1 | egg:gene-target-muttaburrasaurus;material:mission.mineral-cave.middle-repeat.v1 | paid:52900 | 22 | 18854 | 18854 | 18854 | 18857 | - |
| 28 | building:volcanic:1;building:feedmill:6 | research:care-volcanic:1;research:ops-materials:1 | egg:gene-target-saurolophus;material:mission.mutation-crater.vent-trace.v1 | paid:57600 | 22 | 20130 | 20130 | 20130 | 20131 | ch5-scene-1,ch5-scene-2 |
| 29 | building:lab:21 | research:exp-crater-reading:2;research:ops-procurement:1 | egg:gene-target-spinosaurus;material:mission.mineral-cave.outer-vein-survey.v1 | paid:62500 | 23 | 21443 | 21443 | 21443 | 21443 | ch5-scene-3 |
| 30 | building:lab:22;building:warehouse:7 | research:exp-ruin-containment:2;research:ops-view-facilities:1 | story:chapter-5 | paid:67600 | 23 | 22792 | 22792 | 22792 | 22793 | ch5-scene-4 |
| 31 | building:lab:23;building:platform:7 | research:gene-combination-special:2;research:exp-clue-comparison:2 | egg:gene-target-tyrannosaurus-rex;material:mission.fossil-valley.crossdated-layer.v1 | paid:72900 | 24 | 24178 | 24178 | 24178 | 24178 | - |
| 32 | building:lab:24;building:security:7 | research:care-isolation:3;research:exp-field-mapping:2 | egg:natural-target-anurognathus;material:mission.mutation-crater.thermal-pattern.v1 | paid:78400 | 24 | 25600 | 25600 | 25600 | 25600 | ch6-scene-1 |
| 33 | building:lab:25;building:feedmill:7 | research:ops-engineering:3;research:care-adaptation:5 | egg:natural-target-kronosaurus;material:mission.fossil-valley.deep-fault-survey.v1 | paid:84100 | 25 | 27057 | 27057 | 27057 | 27060 | ch6-scene-2 |
| 34 | building:glacier:1 | research:exp-highgrade-sampling:3;research:ops-entry:5 | egg:natural-target-mosasaurus;material:mission.fossil-valley.high-repeat.v1 | paid:90000 | 25 | 28551 | 28551 | 28551 | 28553 | ch6-scene-3-hopeful,ch6-scene-3-realistic,ch6-scene-3-tragic |
| 35 | building:security:11;building:warehouse:8 | research:exp-deep-expedition:1;research:care-incubation:2 | story:chapter-6 | paid:96100 | 25 | 30081 | 30081 | 30081 | 30081 | epilogue-scene-hopeful,epilogue-scene-realistic,epilogue-scene-tragic |
| 36 | building:platform:11;building:platform:8 | research:gene-legend-natural:1;research:care-interaction:2 | egg:natural-target-tapejara;material:mission.mutation-crater.outer-rim-survey.v1 | paid:102400 | 25 | 31645 | 31645 | 31645 | 31647 | - |
| 37 | building:hatchery:10;building:security:8 | research:care-glacier:1 | egg:natural-target-tupandactylus;material:mission.primal-swamp.channel-link.v1 | paid:108900 | 25 | 33245 | 33245 | 33245 | 33247 | - |
| 38 | building:forest:15;building:feedmill:8 | research:gene-epic-natural:3;research:care-nutrition:2 | egg:gene-target-acrocanthosaurus;material:mission.primal-swamp.deep-oldwood-survey.v1 | paid:115600 | 25 | 34880 | 34880 | 34880 | 34881 | - |
| 39 | building:hybrid_herb:15 | research:ops-exhibitions:3;research:care-upkeep:2 | egg:gene-target-apatosaurus;material:mission.primal-swamp.high-repeat.v1 | paid:122500 | 25 | 36549 | 36549 | 36549 | 36552 | - |
| 40 | building:warehouse:9 | research:care-transfer:1;research:gene-culture:2 | owned:indominus-rex;owned:livyatan | paid:129600 | 25 | 38254 | 38254 | 38254 | 38254 | - |
| 41 | building:warehouse:15;building:platform:9 | research:care-group-interaction:2;research:ops-land:2 | egg:gene-target-camarasaurus;material:mission.abandoned-lab.high-repeat.v1 | paid:136900 | 25 | 39992 | 39992 | 39992 | 39994 | - |
| 42 | building:admin:15;building:security:9 | research:care-feeding-plans:1;research:ops-maintenance:2 | egg:gene-target-deinonychus;material:mission.mineral-cave.deep-cavern-survey.v1 | paid:144400 | 25 | 41765 | 41765 | 41765 | 41767 | - |
| 43 | building:feedmill:15;building:feedmill:9 | research:exp-evidence-validation:2;research:ops-materials:2 | egg:gene-target-giganotosaurus;material:mission.mineral-cave.high-repeat.v1 | paid:152100 | 25 | 43572 | 43572 | 43572 | 43574 | - |
| 44 | building:lumber:20 | research:gene-preservation:4;research:ops-processing:2 | egg:gene-target-megalosaurus;material:mission.primal-swamp.sample-point-crosscheck.v1 | paid:160000 | 25 | 45413 | 45413 | 45413 | 45414 | - |
| 45 | building:quarry:20;building:warehouse:10 | research:gene-dna-quantification:4;research:care-incubation:3 | egg:gene-target-ouranosaurus;material:mission.abandoned-lab.reactor-exit.v1 | paid:168100 | 25 | 47288 | 47288 | 47288 | 47288 | - |
| 46 | building:metalshop:20;building:platform:10 | research:care-hatch-capacity:2 | egg:gene-target-utahraptor;material:mission.abandoned-lab.record-crosscheck.v1 | paid:176400 | 25 | 49196 | 49196 | 49196 | 49197 | - |
| 47 | building:vault:20;building:security:10 | research:gene-study-protocol:4;research:care-interaction:3 | egg:natural-target-dsungaripterus;material:mission.fossil-valley.apex-carnivore-track.v1 | paid:184900 | 25 | 51138 | 51138 | 51138 | 51139 | - |
| 48 | building:gate:20;building:feedmill:10 | research:care-nutrition:3 | egg:natural-target-elasmosaurus;material:mission.fossil-valley.giant-herbivore-track.v1 | paid:193600 | 25 | 53113 | 53113 | 53113 | 53114 | - |
| 49 | building:info:20 | research:ops-comfort:3;research:care-upkeep:3 | egg:natural-target-liopleurodon;material:mission.fossil-valley.titanosaur-track.v1 | paid:202500 | 25 | 55121 | 55121 | 55121 | 55123 | - |
<!-- /progression:levels -->

## 7. 정적 검증과 구현 경계

검사는 공유 상한·곡선·초반35잔여·45전환180개·정수XP·누적 합계, 대안별 원천ID·연구소/기술/시설고도화 선행폐쇄·현재Park 해금 충족, 중복goal/대안/알목표·재료목표,83/15/72/252/26/650 유지와 생성표 동기화를 확인한다. 권한 DAG 폐쇄는 기본 연구원1명으로 순차 수행할 권한의 존재를 뜻하며 골드·생산속도·점유·건설대기·실제경로·동시성의 완주 증명은 아니다. 게임에서 실제로 진행한 경로와 검증 범위는 [작업 기록](../../TASK.md)을 참조한다.
