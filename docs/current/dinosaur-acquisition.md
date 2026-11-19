# 공룡 83종 획득 경로 기획 0.6

기준일: 2026-11-18 · 상태: 전체 획득 경로와 비육상 보완 목표의 설계 기준안 · 실제 게임 적용 전

이 문서는 기본 공룡83종의 최초 획득·반복 획득 연결, 빠졌던 자연종17종의 종 지정 알 목표, 첫 벨로시랩터 수령 경로를 소유한다. 추가 변종2종의 부모·재료·가격·시간은 [DNA 기획](dna-and-collection.md)의 `dna:variant-recipes`를 읽는다. 기존 [51개 알 목표와 후속 레시피](followup-content-tables.md), [연구 권한](research-effects.md), [희귀도별 알 비용](balance.md#173-자연종-알-회수와-부화), [전시 호환](buildings.md#83-호환-판정격리거대종)을 다시 설정하지 않는다.

기본 목록은 자연종68종·하이브리드12종·변종3종, 합계83종이다. 현재 실행81종과 계획 추가 시노케라톱스·메갈로돈2종의 공개 상태를 구별한다. 실제 공개 전 도감의 실행 분모를 먼저 바꾸지 않는다. 전체 표는 [83종 획득표](dinosaur-acquisition-tables.md)에서 종별 한 행으로 확인한다.

## 1. 획득과 전시의 분리

자연종은 종 지정 알 목표를 직접 완료해 알1개를 확정 수령하고, 수동 부화 시작과 완료 개체 수령을 거쳐 보유·영구 도감 등록으로 이어진다. 목표마다 새 유료 회차를 시작하면 같은 종 알1개를 다시 얻을 수 있다. 회차의 중복 수령, 연구 완료만으로 알 지급, 알만 보유한 상태의 도감 수집 완료는 허용하지 않는다.

기존 42개 유전 원종 목표, 추가 부모4개, 시작 원종 재입수5개는 미션ID·권한·장소·준비비·연료·판단 수·부화 밴드를 보존한다. 새17개는 같은 유전 연구의 완료 단계에 연결되는 **비육상 보완 명단**이며, 기존42명단의 `mission_bindings`나 누적 개수를 덮어쓰지 않는다. 연구는 총72개·252회이며 새 노드나 연구 비용·효과 수치를 추가하지 않는다.

보완 목표의 유전 연구 완료는 해당 종 알 조사로만 연다. 익룡 사육·해양 생물 사육·거대종 사육이나 실제 돔·해양관·보안센터 완공을 알 회수·부화·배치 대기 보유의 추가 선행으로 붙이지 않는다. 필요한 전시 조건은 출발 전부터 안내하고, 실제 전시할 때 사육·거대종·호환 시설·안전점수·빈칸·관람 연결을 검사한다.

첫 부화·합성의 기존 예외와 정상 보유·도감·알·진행 작업·권한은 보존한다. 이번 명세가 기존 계정에 재청구하거나 같은 최초 보상을 다시 주는 근거가 되지 않는다.

## 2. 자연종17종의 보완 알 목표

모든 새 목표의 보상은 선택한 종의 알1개다. 준비 골드·출발 연료·성공 판단 수·일반 부화시간·부화 수수료는 그 종의 실제 희귀도를 읽어 밸런스의 `plan:natural-expedition-bands` 한 행에서 가져온다. 별도 확률 분포·알 등급 추첨·재료·장소·보상 통화를 만들지 않는다. 오답·무료 도움·재접속·명시적 포기는 [탐험 플레이](exploration-play.md)의 공통 계약을 따른다.

익룡 목표는 화석 계곡에 연결된 해안 절벽의 둥지를, 해양 목표는 원시 습지 수로에 연결된 해안 만을 조사한다. 이는 기존 다섯 장소 안의 목표 배경이며 별도 여섯 번째 장소나 일반 재료/심부 미션 해금이 아니다. 종별 외형·흔적·기록의 비교와 회수 판단은 같은 수동 탐험 조작을 사용한다. 기본/간이·집중/장기 관측 보상 변형은 알 목표에 적용하지 않는다.

<!-- acquisition:extra-natural-targets -->
| species | name | mission_id | required_research | area | scene |
| --- | --- | --- | --- | --- | --- |
| dimorphodon | 딤로포돈 | natural-target-dimorphodon | gene-common-carnivore:1 | fossil-valley | 절벽 낮은 둥지의 흔적 대조 |
| rhamphorhynchus | 람포린쿠스 | natural-target-rhamphorhynchus | gene-common-carnivore:2 | fossil-valley | 긴 꼬리 익룡 둥지의 기록 대조 |
| anurognathus | 아누로그나투스 | natural-target-anurognathus | gene-common-carnivore:3 | fossil-valley | 작은 익룡 은신처의 단서 대조 |
| pteranodon | 프테라노돈 | natural-target-pteranodon | gene-uncommon-carnivore:1 | fossil-valley | 절벽 관찰로의 볏 흔적 조사 |
| tapejara | 타페자라 | natural-target-tapejara | gene-uncommon-carnivore:2 | fossil-valley | 높은 볏 둥지의 형태 비교 |
| tupandactylus | 투판닥틸루스 | natural-target-tupandactylus | gene-uncommon-carnivore:2 | fossil-valley | 큰 볏 둥지의 교차 기록 비교 |
| dsungaripterus | 준가립테루스 | natural-target-dsungaripterus | gene-uncommon-carnivore:3 | fossil-valley | 해안 바위 둥지의 먹이 흔적 대조 |
| tropeognathus | 트로페오그나투스 | natural-target-tropeognathus | gene-rare-carnivore:2 | fossil-valley | 해안 절벽 끝 회수 경로 조사 |
| ichthyosaurus | 이크티오사우루스 | natural-target-ichthyosaurus | gene-common-carnivore:2 | primal-swamp | 해안 만의 유선형 흔적 조사 |
| nothosaurus | 노토사우루스 | natural-target-nothosaurus | gene-common-carnivore:3 | primal-swamp | 수로와 바위 사이 회수 지점 조사 |
| plesiosaurus | 플레시오사우루스 | natural-target-plesiosaurus | gene-uncommon-carnivore:1 | primal-swamp | 긴 목 해양종의 보존 알 조사 |
| kronosaurus | 크로노사우루스 | natural-target-kronosaurus | gene-uncommon-carnivore:2 | primal-swamp | 큰 턱 해양종의 보존 기록 대조 |
| elasmosaurus | 엘라스모사우루스 | natural-target-elasmosaurus | gene-uncommon-carnivore:3 | primal-swamp | 해안 만의 긴 목 흔적 대조 |
| mosasaurus | 모사사우루스 | natural-target-mosasaurus | gene-rare-carnivore:1 | primal-swamp | 해안 만 대형 포식자의 알 회수 |
| liopleurodon | 리오플레우로돈 | natural-target-liopleurodon | gene-rare-carnivore:2 | primal-swamp | 해안 만 바깥 보존 흔적 조사 |
| tylosaurus | 틸로사우루스 | natural-target-tylosaurus | gene-rare-carnivore:3 | primal-swamp | 수로 끝 대형 해양종의 기록 대조 |
| shonisaurus | 숀이사우루스 | natural-target-shonisaurus | gene-epic-natural:3 | primal-swamp | 깊은 만의 초대형 보존 알 조사 |
<!-- /acquisition:extra-natural-targets -->

일반 익룡·해양종도 유전 연구의 동일 희귀도 단계에 연결하며, 이 명단 때문에 기존 육상 목표나 사육 연구의 역할을 바꾸지 않는다. 숀이사우루스는 영웅 자연종이므로 영웅 원종 계통 조사3에 연결한다. 기존 케찰코아틀루스·하츠에곱테릭스의 추가 부모 목표는 중복 신설하지 않는다.

모사사우루스 목표는 희귀 육식 원종 조사1에서 열린다. 메가로돈 렉스의 부모는 이 목표의 모사사우루스, 기존 추가 부모 목표의 메갈로돈, 기존 원종 목표의 티라노사우루스 렉스로 모두 확보한다. 모사 목표를 열기 위해 메가로돈 렉스나 메갈로돈을 먼저 보유할 필요는 없다.

## 3. 시작 원종5종의 최초 획득과 재입수

첫 파라는 시작 개체, 나머지 네 종은 아래 최초 경로와 재입수 경로를 구분한다. 최초 보상은 정상 수령 이력과 기존 영구 도감·보유 이력을 확인해 중복 지급하지 않는다. 같은 계정에서 도감을 유지한 채 방생한 경우 최초 경로를 다시 열지 않고 해당 재입수 목표를 이용한다.

<!-- acquisition:starter-paths -->
| species | first_ref | first_gate | repeat_ref |
| --- | --- | --- | --- |
| parasaurolophus | initial-parasaurolophus | new_park_initial_grant | return-target-parasaurolophus |
| iguanodon | igua | first_platform_completed | return-target-iguanodon |
| triceratops | trike | chapter1_and_iguanodon_goal_completed | return-target-triceratops |
| stegosaurus | stego | chapter1_and_iguanodon_goal_completed | return-target-stegosaurus |
| velociraptor | first-target-velociraptor | safety_goal_completed | return-target-velociraptor |
<!-- /acquisition:starter-paths -->

파라의 시작 개체1마리 무료 지급은 기존 시작 이력을 사용한다. 이구아노돈의 `igua`, 트리케라의 `trike`, 스테고의 `stego`는 밸런스의 기존 초반 목표 행과 스토리 완료 조건을 그대로 참조한다. 첫 이구아노돈 부화60초, 첫 트리케라·스테고 부화3600초는 고정 예외다. 최초 준비비를 반복 재입수 밴드로 올리거나 첫 부화에 수수료·새 연구를 붙이지 않는다.

### 첫 벨로시랩터 알 회수

`safety_goal_completed`는2장 안전 목표의 실제 완료 기록이다. 이 기록 뒤 탐험 화면에서 `first-target-velociraptor`를 선택할 수 있다. 기존 다섯 장소 중 화석 계곡의 숲 가장자리 조사로에서 흔적·둥지·회수 경로를 대조해 벨로시랩터 지정 알1개를 확정 수령한다. 준비비·연료·판단 수·부화는 고급 자연종 밴드를 읽는다. 별도 XP·골드 보상은 추가하지 않는다.

이 최초 목표는 파크당 알1개를 한 번 수령하며, 알이 부화하기 전에는 같은 최초 보상을 재수령할 수 없다. 성공 미수령은 보존하고 출발·진행·수령의 중복은 같은 회차와 최초 수령 이력으로 막는다. 처음 받은 알은 기본 부화 자리로 수동 부화하고 실제 개체 수령·도감 등록 뒤 기존 `return-target-velociraptor`로 반복 확보한다. 이미 정상 개체를 보유했거나 영구 도감 등록 이력이 있는 계정에는 최초 알을 다시 지급하지 않는다. 기존에 시작한 정상 알·부화·원종 목표의 이력도 보존한다.

블루·델타·에코는 이야기 속 동료 개체이며 플레이어에게 무료3마리를 주는 경로가 아니다. 첫 벨로시랩터 획득이나 실제 전시를2장 안전 목표·첫 스테고케라톱스의 필수조건으로 만들지 않는다. 안전 목표를 먼저 마친 뒤 선택적으로 랩터를 얻을 수 있으므로 순환 선행이 없다.

## 4. 총수와 재수령 규칙

- 자연종별 반복 알 목표는 기존51개에 새17개를 더한68개다. 모든 자연종에 정확히 한 경로가 대응한다.
- 조회 모델의 알 목표69개는 반복68개와 새 초기 예외 `first-target-velociraptor`1개다. 기존 `igua`·`trike`·`stego` 초반 미션은 기존 초반 목표 표를 별도로 참조하며 새69개에 중복 가산하지 않는다.
- 전체 획득 요약은83종 한 행씩이다. 자연종68종과 합성 결과15종을 합하며, 합성은 기존13레시피와 DNA 정본의 보완 변종2레시피를 읽는다.
- 알 목표의 보상은 항상 해당 종 알1개이고, 부화·합성 결과 개체와 도감 등록을 한 번 처리한다. 연구 완료·도감 재열람·첫 보장 재사용으로 중복 지급하지 않는다.
- 새 목표의 비용·기본 부화는 희귀도 밴드를 따르며, 일반 부화 단축·첫 부화 예외·첫 합성100%·부모 보존·등급별50/30% 및5/8번째 보호는 각 담당 정본을 보존한다.

## 5. 모델과 생성표

[획득 모델](../models/dinosaur_acquisition_model_v06.py)은 이 문서의17개 연결과 시작 경로를 기존51개 목표·카탈로그·DNA 레시피에 합친다. [렌더러](../models/render_dinosaur_acquisition_v06.py)는 읽기용 전체표를 만들고 [체커](../models/check_dinosaur_acquisition_v06.py)는83종 단일 대응·68개 반복/69개 조회목표·15합성 결과·부모 경로·기존51/13/252 보존을 확인한다.

모델은 정적 기획을 읽고 검산하는 도구다. 비용·작업·알·개체를 실제 계정에 반영하거나 게임 API·DB·미션·배치·획득률·전체 성장 기간을 검증하지 않는다. 생성표를 별도 설정으로 직접 고치지 않고 담당 원천을 수정한 뒤 다시 생성한다.

## 변경 기록

- 2026-11-18: 자연종17개 보완 목표와 첫 벨로시랩터 지정 알 경로를 추가하고, 기존51개 반복 목표·기존13레시피·72기술252회 비용효과를 보존하면서83종 최초/반복 획득의 연결을 정리했다. 자연종 획득은 종 지정 알1개 확정 미션이며 기존 희귀도 밴드를 사용한다. 실제 게임 적용은 후속이다.

