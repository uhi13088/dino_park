# 플레이 가이드 제작 원천

2026-11-25 시설 배치와 전시 운영, 사파리 우리와 지프 관람, 탐험가 파견과 성장, 후속 스토리, 실험 합성과 연구자료 거래를 반영한 플레이 가이드다. 전체 입력 지문은 manifest.json이 관리한다. 게임 구현 상태와 검증은 TASK.md와 document-qa.md에 남긴다.

Word의 장과 항목은 content.py와 navigation.py에서 구성한다. build_guidebook.py와 flow_pages.py가 화면용 Word, 인쇄용 PDF와 두 파일의 실제 이동 쪽수를 맞춘다.

첫 개장·리더·재건·공개 경매장·야시장 연구자료 거래의 플레이 흐름은 production-direction.md에 있다. 탐험가 파견과 외벽 보관동의 조사 보고서는 exploration-spots.md, 실험 합성 견적과 계통 재현은 dna-and-collection.md, 대회와 2.5D 제작 명세는 production-and-services.md에서 읽는다.

관람객 동선과 전시 확장·관람대 강화, 배치 효과와 입장 진단은 game-design.md에서 설명한다. 첫 전시 뒤 성장 목표, Lv.6→8의 운영·탐험 경로, Lv.8→15의 단계별 목표와 변이세포 조사, 전체 45전환의 성장 경험치는 park-progression.md에서 읽는다. 후반 본편 17장면의 실제 조건은 story-progression.md에 있다. 운영·시설·수급 정본과 첫 주 사례는 기존 담당 문서를 따른다. 관람대의 그림은 게임에 적용한 WebP 두 장을 Word에 투명 PNG로 담는다.

셔틀버스 구매와 노선 조작은 buildings.md, 운행비·배차·수송과 만족도는 balance.md에서 읽는다. 화면에 표시되는 버튼과 지도 이동, 운행과 정산 규칙은 게임의 셔틀버스 구현과 대조한다.

새 육식 우리의 면적과 차량 출입문을 통과하는 지프 관람은 buildings.md, 구역별 구매 비용과 재사용은 balance.md에서 확인한다. 우리 규격, 지프길과 공룡 자리의 분리, 물가·수풀에 따른 시야는 게임의 사파리 관리 및 저장 규칙과 대조한다.

사파리 시범 관람의 조작과 결과는 buildings.md, 공룡별 리그·프레임 수와 장면 용량은 production-and-services.md에서 읽는다. Blender 리그와 렌더 스크립트, 게임의 프리뷰 동작 및 실제 배포 에셋을 제작 원천으로 기록한다.

스테고사우루스 3D 관람의 진입과 조작은 buildings.md에서, 리그와 배경·그림자 제작 기준은 production-and-services.md에서 확인한다. 게임의 관람 화면, GLB와 Blender 원본을 대조한다.

2.5D 파크 공룡과 시설 외형은 [승인된 스테고사우루스 조형 시안](../assets/reference/stegosaurus-character-direction.webp)을 기준으로 한다. 파라·이구아노돈·트리케라톱스·스테고케라톱스의 대기 이미지와 파라 걷기 여섯 장은 게임용 WebP와 편집용 PNG를 대조한다.

6장의 시설 점유 칸은 건물 카탈로그의 `size`에서, 배치 칸의 기준 치수는 `IsometricGrid.ts`에서 읽는다. 공룡의 지도 기준 폭은 `parkArtwork.ts`, 게임 이미지의 투명 캔버스 크기는 연결된 WebP에서 읽는다.

| 입력 | 역할 | 지문 앞12자리 |
| --- | --- | --- |
| `CLAUDE.md` | 작업·생성·검산 원천 | `5e3f231dabae` |
| `TASK.md` | 작업·생성·검산 원천 | `fdc8fa8eef33` |
| `apps/client/public/assets/buildings/amenity-atm.webp` | 시설과 서식지의 게임용 배치 외형 | `94902e3c0c7d` |
| `apps/client/public/assets/buildings/amenity-bench.webp` | 시설과 서식지의 게임용 배치 외형 | `37d914f3f155` |
| `apps/client/public/assets/buildings/amenity-dino-cafe.webp` | 시설과 서식지의 게임용 배치 외형 | `a032a28babb1` |
| `apps/client/public/assets/buildings/amenity-dino-restaurant.webp` | 시설과 서식지의 게임용 배치 외형 | `59f44fc79665` |
| `apps/client/public/assets/buildings/amenity-drinking-fountain.webp` | 시설과 서식지의 게임용 배치 외형 | `958998e7459c` |
| `apps/client/public/assets/buildings/amenity-first-aid.webp` | 시설과 서식지의 게임용 배치 외형 | `25aa3a0c8f63` |
| `apps/client/public/assets/buildings/amenity-food-court.webp` | 시설과 서식지의 게임용 배치 외형 | `024cd39ead96` |
| `apps/client/public/assets/buildings/amenity-gift-shop.webp` | 시설과 서식지의 게임용 배치 외형 | `3318e2a476c4` |
| `apps/client/public/assets/buildings/amenity-ice-cream-shop.webp` | 시설과 서식지의 게임용 배치 외형 | `ec967b11ef86` |
| `apps/client/public/assets/buildings/amenity-info-center.webp` | 시설과 서식지의 게임용 배치 외형 | `bacd18b032df` |
| `apps/client/public/assets/buildings/amenity-locker.webp` | 시설과 서식지의 게임용 배치 외형 | `0f32274e6bb6` |
| `apps/client/public/assets/buildings/amenity-restroom.webp` | 시설과 서식지의 게임용 배치 외형 | `098bd9d1502e` |
| `apps/client/public/assets/buildings/habitat-carnivore-electric.webp` | 시설과 서식지의 게임용 배치 외형 | `42cf27568601` |
| `apps/client/public/assets/buildings/habitat-carnivore-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `65b1247ffb3b` |
| `apps/client/public/assets/buildings/habitat-desert-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `c82bbbc3151a` |
| `apps/client/public/assets/buildings/habitat-desert.webp` | 시설과 서식지의 게임용 배치 외형 | `88e40e6c4828` |
| `apps/client/public/assets/buildings/habitat-forest-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `5eb5470d2bb6` |
| `apps/client/public/assets/buildings/habitat-forest.webp` | 시설과 서식지의 게임용 배치 외형 | `a59da0319343` |
| `apps/client/public/assets/buildings/habitat-glacier-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `6b2376a1d29c` |
| `apps/client/public/assets/buildings/habitat-glacier.webp` | 시설과 서식지의 게임용 배치 외형 | `c3d815cb6b39` |
| `apps/client/public/assets/buildings/habitat-grassland-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `e27d4798c74f` |
| `apps/client/public/assets/buildings/habitat-grassland.webp` | 시설과 서식지의 게임용 배치 외형 | `fb22ed10aae6` |
| `apps/client/public/assets/buildings/habitat-hybrid-zone-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `185cccf26075` |
| `apps/client/public/assets/buildings/habitat-hybrid-zone.webp` | 시설과 서식지의 게임용 배치 외형 | `0b2720911d1b` |
| `apps/client/public/assets/buildings/habitat-marine-aquarium.webp` | 시설과 서식지의 게임용 배치 외형 | `87aa1ce08ecc` |
| `apps/client/public/assets/buildings/habitat-pterosaur-dome.webp` | 시설과 서식지의 게임용 배치 외형 | `00b23af12cd3` |
| `apps/client/public/assets/buildings/habitat-volcanic-lv5.webp` | 시설과 서식지의 게임용 배치 외형 | `31b057326af8` |
| `apps/client/public/assets/buildings/habitat-volcanic.webp` | 시설과 서식지의 게임용 배치 외형 | `bd7b37cb71a5` |
| `apps/client/public/assets/buildings/operation-admin-office.webp` | 시설과 서식지의 게임용 배치 외형 | `90f4f44fa38a` |
| `apps/client/public/assets/buildings/operation-entrance-gate.webp` | 시설과 서식지의 게임용 배치 외형 | `5221e16eda9e` |
| `apps/client/public/assets/buildings/operation-parking-lot.webp` | 시설과 서식지의 게임용 배치 외형 | `fef9c369ea86` |
| `apps/client/public/assets/buildings/operation-security-center.webp` | 시설과 서식지의 게임용 배치 외형 | `6e5487586ab5` |
| `apps/client/public/assets/buildings/operation-staff-quarters.webp` | 시설과 서식지의 게임용 배치 외형 | `7bbad83e3ab1` |
| `apps/client/public/assets/buildings/operation-vault.webp` | 시설과 서식지의 게임용 배치 외형 | `e8f61f3a6cf3` |
| `apps/client/public/assets/buildings/operation-vet-hospital.webp` | 시설과 서식지의 게임용 배치 외형 | `bb654a4dcf4f` |
| `apps/client/public/assets/buildings/production-feed-factory.webp` | 시설과 서식지의 게임용 배치 외형 | `f181e44ca95f` |
| `apps/client/public/assets/buildings/production-fish-farm.webp` | 시설과 서식지의 게임용 배치 외형 | `1465a03b67fa` |
| `apps/client/public/assets/buildings/production-fuel-depot.webp` | 시설과 서식지의 게임용 배치 외형 | `a242676c7405` |
| `apps/client/public/assets/buildings/production-lumberyard.webp` | 시설과 서식지의 게임용 배치 외형 | `f36dee58ec28` |
| `apps/client/public/assets/buildings/production-meat-storage.webp` | 시설과 서식지의 게임용 배치 외형 | `a5746173bc3f` |
| `apps/client/public/assets/buildings/production-power-plant.webp` | 시설과 서식지의 게임용 배치 외형 | `20377cacbe23` |
| `apps/client/public/assets/buildings/production-quarry.webp` | 시설과 서식지의 게임용 배치 외형 | `8e3940062816` |
| `apps/client/public/assets/buildings/production-warehouse.webp` | 시설과 서식지의 게임용 배치 외형 | `36e8559363b3` |
| `apps/client/public/assets/buildings/production-water-reservoir.webp` | 시설과 서식지의 게임용 배치 외형 | `abc6f1d3d362` |
| `apps/client/public/assets/buildings/research-behavior-lab.webp` | 시설과 서식지의 게임용 배치 외형 | `6ce2a04475a0` |
| `apps/client/public/assets/buildings/research-dna-lab.webp` | 시설과 서식지의 게임용 배치 외형 | `fd8942c6e877` |
| `apps/client/public/assets/buildings/research-evolution-lab.webp` | 시설과 서식지의 게임용 배치 외형 | `bac403fe3785` |
| `apps/client/public/assets/buildings/research-fossil-lab.webp` | 시설과 서식지의 게임용 배치 외형 | `fb83cce21889` |
| `apps/client/public/assets/buildings/research-genetics-center.webp` | 시설과 서식지의 게임용 배치 외형 | `ccac8c4bf3d9` |
| `apps/client/public/assets/buildings/research-hatchery.webp` | 시설과 서식지의 게임용 배치 외형 | `3d095e5a02bb` |
| `apps/client/public/assets/buildings/safari-security-pylon.webp` | 차량 출입문 기둥의 게임용 투명 WebP | `274abe822cbd` |
| `apps/client/public/assets/buildings/viewing-platform-lv5.webp` | 관람대 실제 배치 이미지 | `660fc106c29e` |
| `apps/client/public/assets/buildings/viewing-platform.webp` | 관람대 실제 배치 이미지 | `a344ecf19c27` |
| `apps/client/public/assets/buildings/visitor-photo-zone.webp` | 시설과 서식지의 게임용 배치 외형 | `97614d2562d7` |
| `apps/client/public/assets/buildings/visitor-safari-jeep.webp` | 사파리 편집·관람과 파크 지도 표시 | `9b1349105cdb` |
| `apps/client/public/assets/buildings/visitor-skywalk.webp` | 시설과 서식지의 게임용 배치 외형 | `76862782ce3c` |
| `apps/client/public/assets/buildings/visitor-tour-train.webp` | 시설과 서식지의 게임용 배치 외형 | `262fbcc97d16` |
| `apps/client/public/assets/buildings/visitor-underwater-tunnel.webp` | 시설과 서식지의 게임용 배치 외형 | `829b581b6385` |
| `apps/client/public/assets/dinosaurs/iguanodon/idle.webp` | 파크·도감 공용 2.5D 대기 이미지 | `5348e43d353c` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/idle.webp` | 파크·도감 공용 2.5D 대기 이미지 | `db6b0eab367c` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/walk-01.webp` | 파라 걷기 1번째 자세 | `a985ace2d117` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/walk-02.webp` | 파라 걷기 2번째 자세 | `ce57ac7ee2d1` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/walk-03.webp` | 파라 걷기 3번째 자세 | `d5693373e64e` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/walk-04.webp` | 파라 걷기 4번째 자세 | `ea4ffbfcd468` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/walk-05.webp` | 파라 걷기 5번째 자세 | `5d35a595bbe6` |
| `apps/client/public/assets/dinosaurs/parasaurolophus/walk-06.webp` | 파라 걷기 6번째 자세 | `fb3daa394a5c` |
| `apps/client/public/assets/dinosaurs/stegoceratops/idle.webp` | 파크·도감 공용 2.5D 대기 이미지 | `26ee880987bf` |
| `apps/client/public/assets/dinosaurs/stegosaurus/idle.webp` | 사파리 공룡 게임용 투명 WebP | `08c7e6702dda` |
| `apps/client/public/assets/dinosaurs/triceratops/idle.webp` | 파크·도감 공용 2.5D 대기 이미지 | `1f348bae7251` |
| `apps/client/public/assets/dinosaurs/tyrannosaurus-rex/idle.webp` | 사파리 공룡 게임용 투명 WebP | `b1a9ca7f22e2` |
| `apps/client/public/assets/environment/coastal-boulders.webp` | 파크 지형과 환경의 게임용 이미지 | `3b43e3682bc3` |
| `apps/client/public/assets/environment/coastal-outcrop.webp` | 파크 지형과 환경의 게임용 이미지 | `9597dfc0ad33` |
| `apps/client/public/assets/environment/coastal-shore.webp` | 파크 지형과 환경의 게임용 이미지 | `b050e358fcb5` |
| `apps/client/public/assets/environment/coastal-water.webp` | 파크 지형과 환경의 게임용 이미지 | `1d6aa36962d4` |
| `apps/client/public/assets/environment/first-expedition-meadow.webp` | 파크 지형과 환경의 게임용 이미지 | `21702c750593` |
| `apps/client/public/assets/environment/forest-canopy.webp` | 파크 지형과 환경의 게임용 이미지 | `faa1d97450db` |
| `apps/client/public/assets/environment/forest-edge.webp` | 파크 지형과 환경의 게임용 이미지 | `c17dd0fb9b87` |
| `apps/client/public/assets/environment/forest-understory.webp` | 파크 지형과 환경의 게임용 이미지 | `9abe0c2bab2f` |
| `apps/client/public/assets/environment/park-meadow.webp` | 파크 지형과 환경의 게임용 이미지 | `851eb357e30d` |
| `apps/client/public/assets/environment/woodland-oak.webp` | 파크 지형과 환경의 게임용 이미지 | `011f4a18a900` |
| `apps/client/public/assets/environment/woodland-pine.webp` | 파크 지형과 환경의 게임용 이미지 | `c72b84ef8fc7` |
| `apps/client/public/assets/environment/woodland-ridge.webp` | 파크 지형과 환경의 게임용 이미지 | `e54b5af11502` |
| `apps/client/public/assets/environment/woodland-rocks.webp` | 파크 지형과 환경의 게임용 이미지 | `afe13bf0488e` |
| `apps/client/public/assets/placeholders/habitat-grassland.svg` | 실행 코드·타입·실물 에셋 관찰 | `790cb95df76c` |
| `apps/client/public/assets/placeholders/habitat-hybrid-zone.svg` | 실행 코드·타입·실물 에셋 관찰 | `316c4f4361e8` |
| `apps/client/public/assets/placeholders/iguanodon-egg.svg` | 실행 코드·타입·실물 에셋 관찰 | `a2a7d87d1289` |
| `apps/client/public/assets/placeholders/iguanodon.svg` | 실행 코드·타입·실물 에셋 관찰 | `4f8162e77f4b` |
| `apps/client/public/assets/placeholders/operation-entrance-gate-open.svg` | 실행 코드·타입·실물 에셋 관찰 | `20a285c61b89` |
| `apps/client/public/assets/placeholders/operation-entrance-gate.svg` | 실행 코드·타입·실물 에셋 관찰 | `35f404b24716` |
| `apps/client/public/assets/placeholders/parasaurolophus-lux.svg` | 실행 코드·타입·실물 에셋 관찰 | `7de0eebfe820` |
| `apps/client/public/assets/placeholders/parasaurolophus.svg` | 실행 코드·타입·실물 에셋 관찰 | `e692dfef5220` |
| `apps/client/public/assets/placeholders/production-lumberyard.svg` | 실행 코드·타입·실물 에셋 관찰 | `0cbcfe147ea1` |
| `apps/client/public/assets/placeholders/production-quarry.svg` | 실행 코드·타입·실물 에셋 관찰 | `8456d6b12c80` |
| `apps/client/public/assets/placeholders/research-dna-lab.svg` | 실행 코드·타입·실물 에셋 관찰 | `442336101921` |
| `apps/client/public/assets/placeholders/stegoceratops.svg` | 실행 코드·타입·실물 에셋 관찰 | `4ca36f3af95a` |
| `apps/client/public/assets/placeholders/stegosaurus.svg` | 실행 코드·타입·실물 에셋 관찰 | `9c092dbdb929` |
| `apps/client/public/assets/placeholders/triceratops.svg` | 실행 코드·타입·실물 에셋 관찰 | `65ac6be5171b` |
| `apps/client/public/assets/placeholders/visitor-viewing-platform.svg` | 실행 코드·타입·실물 에셋 관찰 | `d18a6e332c8e` |
| `apps/client/public/assets/safari-encounter/field.webp` | 스테고사우루스 3D 관람의 물가 이미지 | `9f7587a52017` |
| `apps/client/public/assets/safari-encounter/impact.mp3` | 시범 관람 타격음 | `e837542334be` |
| `apps/client/public/assets/safari-encounter/intervene.mp3` | 시범 관람 중재음 | `6ec6565cb047` |
| `apps/client/public/assets/safari-encounter/jeep.webp` | 사파리 관람 지프 | `8f331e585e36` |
| `apps/client/public/assets/safari-encounter/robot.webp` | 로봇 중재 소품 | `64f66c482978` |
| `apps/client/public/assets/safari-encounter/stegosaurus-realtime.glb` | 스테고사우루스 실시간 모델과 3개 동작 | `b5d83828548b` |
| `apps/client/public/assets/safari-encounter/stegosaurus.webp` | 스테고사우루스 64프레임 WebP 아틀라스 | `dcc7a781069f` |
| `apps/client/public/assets/safari-encounter/trex.webp` | 티렉스 60프레임 WebP 아틀라스 | `ccf4386bbe84` |
| `apps/client/public/assets/safari-encounter/warning.mp3` | 시범 관람 위협음 | `5b39495a8742` |
| `apps/client/public/assets/safari-encounter/waterhole.webp` | 시험용 고정 물가 배경 | `d30b1c63f399` |
| `apps/client/public/assets/ui/park-hud/alex.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `5ac9c49b99d9` |
| `apps/client/public/assets/ui/park-hud/book.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `46fd59079544` |
| `apps/client/public/assets/ui/park-hud/build.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `7a35536fd986` |
| `apps/client/public/assets/ui/park-hud/explore.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `b1b4f8050108` |
| `apps/client/public/assets/ui/park-hud/figures.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `2064eadcee4e` |
| `apps/client/public/assets/ui/park-hud/gold.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `29571cb66bbb` |
| `apps/client/public/assets/ui/park-hud/metal.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `04d84fdd4fe6` |
| `apps/client/public/assets/ui/park-hud/operations.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `2756d96d8631` |
| `apps/client/public/assets/ui/park-hud/stone.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `0d89f4c45efe` |
| `apps/client/public/assets/ui/park-hud/wood.webp` | 파크 메뉴와 재화의 게임용 아이콘 | `20193cd313f4` |
| `apps/client/public/assets/vehicles/shuttle-back.webp` | 셔틀버스 뒤 방향 이미지 | `b62ce42c9126` |
| `apps/client/public/assets/vehicles/shuttle-front.webp` | 셔틀버스 앞 방향 이미지 | `80ab5ad3c667` |
| `apps/client/src/App.tsx` | 사파리 관리·시범 및 실시간 3D 관람 주소 | `4cbead66d120` |
| `apps/client/src/api/queries/safari.ts` | 사파리 편집·관람과 파크 지도 표시 | `2644ca0b9f91` |
| `apps/client/src/assets/README.md` | 게임 에셋 제작 원본과 배포 파일 | `9b662afca3b0` |
| `apps/client/src/assets/images/buildings/habitats/safari-security-pylon/pylon-source.png` | 차량 출입문 기둥의 제작 원본 | `49f74614c827` |
| `apps/client/src/assets/images/dinosaurs/carnivore/tyrannosaurus-rex/idle-source.png` | 사파리 공룡 2.5D 대기 이미지 제작 원본 | `9c31f9409f8c` |
| `apps/client/src/assets/images/dinosaurs/herbivore/iguanodon/idle-source.png` | 2.5D 대기 이미지 제작 원본 | `bfe9b03d294d` |
| `apps/client/src/assets/images/dinosaurs/herbivore/parasaurolophus/idle-source.png` | 2.5D 대기 이미지 제작 원본 | `f2991f788843` |
| `apps/client/src/assets/images/dinosaurs/herbivore/parasaurolophus/walk-sheet-source.png` | 파라의 걷기 여섯 자세 제작 원본 | `e9b9e3aa5926` |
| `apps/client/src/assets/images/dinosaurs/herbivore/stegosaurus/idle-source.png` | 사파리 공룡 2.5D 대기 이미지 제작 원본 | `0e9fa90edd46` |
| `apps/client/src/assets/images/dinosaurs/herbivore/triceratops/idle-source.png` | 2.5D 대기 이미지 제작 원본 | `20253ed9f29e` |
| `apps/client/src/assets/images/dinosaurs/hybrid/stegoceratops/idle-source.png` | 2.5D 대기 이미지 제작 원본 | `ab60b2d25597` |
| `apps/client/src/features/exploration/pages/ExplorationPage.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `be0999e72f8d` |
| `apps/client/src/features/park/components/ParkHarvestFeedback.css` | 실제 게임 동작·표시 및 공통 규칙 | `22ab2725cc46` |
| `apps/client/src/features/park/components/ParkHarvestMarkers.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `802802e50eaa` |
| `apps/client/src/features/park/components/ParkHud.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `a358bd501ae3` |
| `apps/client/src/features/park/components/ParkMeadowLink.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `b179769960d7` |
| `apps/client/src/features/park/components/ParkOperationsPanel.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `0c53bac98a8b` |
| `apps/client/src/features/park/components/ParkPanel.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `dec80cb6fafe` |
| `apps/client/src/features/park/components/ParkShuttlePanel.tsx` | 셔틀버스 구매와 배차 화면 | `373466296c0e` |
| `apps/client/src/features/park/components/ResourcePanel.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `75817e5da7a6` |
| `apps/client/src/features/park/components/useParkHarvest.tsx` | 실제 게임 동작·표시 및 공통 규칙 | `9f7db34c5780` |
| `apps/client/src/features/park/components/useParkMapPin.ts` | 실제 게임 동작·표시 및 공통 규칙 | `5a708780c4cf` |
| `apps/client/src/features/park/pages/ParkHud.css` | 실제 게임 동작·표시 및 공통 규칙 | `40c8356eee23` |
| `apps/client/src/features/park/pages/ParkPage.tsx` | 파크의 더 보기 메뉴와 관람 화면 연결 | `cb2e9ea3d105` |
| `apps/client/src/features/park/pages/ParkSafariPage.css` | 사파리 편집·관람과 파크 지도 표시 | `f17fee70783d` |
| `apps/client/src/features/park/pages/ParkSafariPage.tsx` | 사파리 편집·관람과 파크 지도 표시 | `c5f45c05b809` |
| `apps/client/src/features/park/pages/SafariMap.tsx` | 사파리 편집·관람과 파크 지도 표시 | `a2ce004afc90` |
| `apps/client/src/features/park/pages/SafariPreview.css` | 가로 화면의 시범 관람 배치 | `d0dc7f6bc1e2` |
| `apps/client/src/features/park/pages/SafariPreviewPage.tsx` | 시범 관람의 재생·중재·지프 시점 조작 | `21ce69f63180` |
| `apps/client/src/features/park/pages/StegosaurusRealtimePage.css` | 가로 화면 3D 관람의 배치와 조작 영역 | `e70e536070d2` |
| `apps/client/src/features/park/pages/StegosaurusRealtimePage.tsx` | 스테고사우루스 관람 조작과 파크 복귀 | `ea254e47c885` |
| `apps/client/src/features/park/pages/drawSafariPark.ts` | 사파리 편집·관람과 파크 지도 표시 | `68750173144a` |
| `apps/client/src/features/park/pages/safariEditor.ts` | 사파리 편집·관람과 파크 지도 표시 | `e362b7137883` |
| `apps/client/src/game/buildingRasterManifest.json` | 실제 게임 동작·표시 및 공통 규칙 | `1c1a491aeab0` |
| `apps/client/src/game/engine/DinosaurShadow.ts` | 파크와 사파리의 공룡 발밑 그림자 | `b08878181121` |
| `apps/client/src/game/engine/GameEngine.ts` | 실제 게임 동작·표시 및 공통 규칙 | `0bfefe4dfd90` |
| `apps/client/src/game/engine/IslandWorld.ts` | 실제 게임 동작·표시 및 공통 규칙 | `a4b032a2025b` |
| `apps/client/src/game/engine/IsometricGrid.ts` | 지도 배치 칸의 가로·세로 기준 | `824f089af7fe` |
| `apps/client/src/game/engine/ParkExterior.ts` | 실제 게임 동작·표시 및 공통 규칙 | `15588b0f4495` |
| `apps/client/src/game/engine/ParkSafariScenery.ts` | 사파리 편집·관람과 파크 지도 표시 | `8b57227f72d4` |
| `apps/client/src/game/engine/ParkScenery.ts` | 실제 게임 동작·표시 및 공통 규칙 | `8e312309a89b` |
| `apps/client/src/game/engine/ParkShuttles.ts` | 셔틀버스 지도 경로와 운행 표현 | `bfa4f2a90979` |
| `apps/client/src/game/parkArtwork.ts` | 지도 공룡 그림의 종별 폭과 파일 경로 | `d590694adfcf` |
| `apps/client/src/game/safari/StegosaurusRealtimeScene.ts` | 실시간 3D 동작, 직교 카메라와 지면 그림자 | `46ceda983577` |
| `apps/client/src/game/safari/drawSafariEncounter.ts` | 2.5D 관람 카메라와 공룡 프레임 합성 | `74c438197f46` |
| `apps/client/src/game/safari/safariEncounter.ts` | 15초 관람의 분기와 동작 프레임 | `0be56ce15269` |
| `apps/server/prisma/schema.prisma` | 실행 코드·타입·실물 에셋 관찰 | `5250ca98545a` |
| `apps/server/src/modules/great-figure/great-figure.controller.ts` | 실행 코드·타입·실물 에셋 관찰 | `4b0c15516424` |
| `apps/server/src/modules/great-figure/great-figure.service.ts` | 실행 코드·타입·실물 에셋 관찰 | `60094a958337` |
| `apps/server/src/modules/park/park-safari-state.ts` | 사파리 배치·비용·관람 저장 규칙 | `feab78e8ac57` |
| `apps/server/src/modules/park/park-safari.service.ts` | 사파리 배치·비용·관람 저장 규칙 | `7bb08a013dc7` |
| `apps/server/src/modules/park/park-shuttle.logic.ts` | 셔틀버스 경로 및 운행 지표 | `f00b207f9505` |
| `apps/server/src/modules/park/park-shuttle.service.ts` | 차량 구매 및 노선 배정 | `4e7853de2ad8` |
| `docs/README.md` | 작업·생성·검산 원천 | `99c4b87793e3` |
| `docs/assets/dino_park_asset_buildings_characters.md` | 구버전 에셋 프롬프트 참고 | `4d724b163fa6` |
| `docs/assets/dino_park_asset_dinosaurs.md` | 구버전 에셋 프롬프트 참고 | `a83bbcc8495a` |
| `docs/assets/dino_park_asset_main.md` | 구버전 에셋 프롬프트 참고 | `92e24f7276b1` |
| `docs/assets/reference/character-direction.webp` | 실시간 3D 시범의 입체 공룡 조형 시안 | `9d195179c30d` |
| `docs/assets/reference/safari-encounter/build_stegosaurus.py` | 스테고사우루스 조형·리그·렌더 원천 | `9b60240897c4` |
| `docs/assets/reference/safari-encounter/build_stegosaurus_realtime.py` | 스테고사우루스 실시간 모델 제작·내보내기 | `21441a499162` |
| `docs/assets/reference/safari-encounter/render-trex.py` | 티렉스 조형·리그·렌더 원천 | `7b9bc60e9d0d` |
| `docs/assets/reference/safari-encounter/stegosaurus-realtime.blend` | 스테고사우루스 실시간 모델 Blender 편집 원본 | `ae3f08b9653a` |
| `docs/assets/reference/safari-encounter/stegosaurus.blend` | 편집용 스테고사우루스 Blender 리그 | `428a79fb1fae` |
| `docs/assets/reference/safari-encounter/trex.blend` | 편집용 티렉스 Blender 리그 | `c124e05f00fd` |
| `docs/assets/reference/stegosaurus-character-direction.webp` | 승인된 2.5D 공룡·시설 조형 시안 | `7b7c00b9e430` |
| `docs/current/balance.md` | 현행 기획·정본 파생표 | `f625f4c3026d` |
| `docs/current/building-upgrade-tables.md` | 현행 기획·정본 파생표 | `07e46a98e624` |
| `docs/current/buildings.md` | 현행 기획·정본 파생표 | `3d3d0d99b030` |
| `docs/current/dinosaur-acquisition-tables.md` | 현행 기획·정본 파생표 | `3fcae03a2d71` |
| `docs/current/dinosaur-acquisition.md` | 현행 기획·정본 파생표 | `c7e62f23c018` |
| `docs/current/dna-and-collection.md` | 현행 기획·정본 파생표 | `52eae44d31af` |
| `docs/current/exploration-play.md` | 현행 기획·정본 파생표 | `6aca0449ca83` |
| `docs/current/exploration-spots.md` | 탐험가 파견 스팟과 별 난도·보상·조건 원천 | `3b2bd994cdc1` |
| `docs/current/followup-content-tables.md` | 현행 기획·정본 파생표 | `4217a04fd60e` |
| `docs/current/game-design.md` | 현행 기획·정본 파생표 | `0fec23ad7a45` |
| `docs/current/great-figures.md` | 현행 기획·정본 파생표 | `f887d8de620f` |
| `docs/current/operation-balance.md` | 현행 기획·검산표 | `d5de9b480c89` |
| `docs/current/park-progression-tables.md` | 현행 기획·정본 파생표 | `f8b3959605b4` |
| `docs/current/park-progression.md` | 현행 기획·정본 파생표 | `e682d84e9f79` |
| `docs/current/production-and-services.md` | 현행 기획·정본 파생표 | `e9974c9679bb` |
| `docs/current/production-direction.md` | 제작 완료 기준과 후속 기획 | `f301a7c5afa7` |
| `docs/current/research-cost-tables.md` | 현행 기획·정본 파생표 | `89abc0a7fa88` |
| `docs/current/research-effect-tables.md` | 현행 기획·정본 파생표 | `231d34747040` |
| `docs/current/research-effects.md` | 현행 기획·정본 파생표 | `6ccefe4ed9ed` |
| `docs/current/research-trees.md` | 현행 기획·정본 파생표 | `c882185dc155` |
| `docs/current/resources-and-production.md` | 현행 기획·정본 파생표 | `c2b23f043c76` |
| `docs/current/story-and-characters.md` | 현행 기획·정본 파생표 | `5495cdce429b` |
| `docs/current/story-progression.md` | 현행 기획·정본 파생표 | `7d40ce5bf290` |
| `docs/dino_park_action_plan.md` | 승계 원자료·대조 근거 | `25ca3314c01e` |
| `docs/dino_park_asset_buildings_characters.md` | 승계 원자료·대조 근거 | `fcd19c81c535` |
| `docs/dino_park_asset_cutscenes.md` | 승계 원자료·대조 근거 | `ad8a8f1efffc` |
| `docs/dino_park_asset_dinosaurs.md` | 승계 원자료·대조 근거 | `e0e630b6372e` |
| `docs/dino_park_asset_items_environment.md` | 승계 원자료·대조 근거 | `78ba3501d072` |
| `docs/dino_park_asset_mechanics.md` | 승계 원자료·대조 근거 | `4bdb366cbe62` |
| `docs/dino_park_asset_skins.md` | 승계 원자료·대조 근거 | `b88d66ce421b` |
| `docs/dino_park_asset_upgrades.md` | 승계 원자료·대조 근거 | `0c61363e931f` |
| `docs/dino_park_balance_simulation.md` | 승계 원자료·대조 근거 | `f278617ace0e` |
| `docs/dino_park_dinosaur_codex.md` | 승계 원자료·대조 근거 | `c75611cb50c9` |
| `docs/dino_park_great_figures.md` | 승계 원자료·대조 근거 | `d86b2b01b4e4` |
| `docs/dino_park_performance_guide.md` | 승계 원자료·대조 근거 | `f55c5421ce40` |
| `docs/dino_park_qa_checklist.md` | 승계 원자료·대조 근거 | `ae0d6ddb9c58` |
| `docs/dino_park_revenue_model.md` | 승계 원자료·대조 근거 | `c98b1ea09243` |
| `docs/dino_park_season_content.md` | 승계 원자료·대조 근거 | `32112490a35e` |
| `docs/dino_park_sound_guide.md` | 승계 원자료·대조 근거 | `bbf1f774b58f` |
| `docs/dino_park_story_scenario.md` | 승계 원자료·대조 근거 | `185bd19a155d` |
| `docs/dino_park_technical_design.md` | 승계 원자료·대조 근거 | `5f72fab078b1` |
| `docs/dino_park_tycoon_gdd.md` | 승계 원자료·대조 근거 | `1158c4f02d29` |
| `docs/dino_park_ui_art_guide.md` | 승계 원자료·대조 근거 | `343c567c10f4` |
| `docs/guidebook/README.md` | 책 편집·디자인·검사 | `6502928ff6ad` |
| `docs/guidebook/artwork/park-cover.png` | 책 편집·디자인·검사 | `84ac4807754a` |
| `docs/guidebook/build_guidebook.py` | 책 편집·디자인·검사 | `2a1cfa62093b` |
| `docs/guidebook/check_guidebook.py` | 책 편집·디자인·검사 | `c9959c8893f7` |
| `docs/guidebook/content.py` | 책 편집·디자인·검사 | `fbdcec7e82d2` |
| `docs/guidebook/create_cover_art.mjs` | 책 편집·디자인·검사 | `0358cb4e1db5` |
| `docs/guidebook/editorial/figures.json` | 책 편집·디자인·검사 | `6afbdee74c2c` |
| `docs/guidebook/editorial/reference-detail.json` | 책 편집·디자인·검사 | `aeb3a959bee0` |
| `docs/guidebook/editorial/reference.json` | 책 편집·디자인·검사 | `aecd2f32f3cb` |
| `docs/guidebook/editorial/story-people.json` | 책 편집·디자인·검사 | `0e4034aea9a6` |
| `docs/guidebook/flow_pages.py` | 실제 북마크와 물리 쪽수 검사 | `5a1f8551d9c4` |
| `docs/guidebook/navigation.py` | 책 편집·디자인·검사 | `d231653599d7` |
| `docs/models/check_building_progression_v06.py` | 작업·생성·검산 원천 | `1df229ac0663` |
| `docs/models/check_dinosaur_acquisition_v06.py` | 작업·생성·검산 원천 | `3c2c755a69cf` |
| `docs/models/check_followup_content_v06.py` | 작업·생성·검산 원천 | `9d361b898012` |
| `docs/models/check_park_progression_v06.py` | 작업·생성·검산 원천 | `847bd1808034` |
| `docs/models/check_research_effects_v06.py` | 작업·생성·검산 원천 | `8e0fe99a9a06` |
| `docs/models/check_research_trees_v06.py` | 작업·생성·검산 원천 | `199b9a2c65d9` |
| `docs/models/dinosaur_acquisition_model_v06.py` | 작업·생성·검산 원천 | `aa5c24a78f0a` |
| `docs/models/followup_content_model_v06.py` | 작업·생성·검산 원천 | `b6b684aa4171` |
| `docs/models/operation_checkpoints_v06.py` | 작업·생성·검산 원천 | `385bcd1e325f` |
| `docs/models/operation_week_v06.py` | 작업·생성·검산 원천 | `0d556ad67a34` |
| `docs/models/park_progression_model_v06.py` | 작업·생성·검산 원천 | `c7263438ee4d` |
| `docs/models/render_dinosaur_acquisition_v06.py` | 작업·생성·검산 원천 | `9551618f1d34` |
| `docs/models/render_followup_content_v06.py` | 작업·생성·검산 원천 | `e8134c8da4ad` |
| `docs/models/render_operation_balance_v06.py` | 작업·생성·검산 원천 | `10daf523b41f` |
| `docs/models/render_park_progression_v06.py` | 작업·생성·검산 원천 | `282c2311e211` |
| `docs/models/render_research_costs_v06.py` | 작업·생성·검산 원천 | `745aa65bc007` |
| `docs/models/render_research_effects_v06.py` | 작업·생성·검산 원천 | `d181abc24abb` |
| `docs/models/render_research_tree_v06.cjs` | 작업·생성·검산 원천 | `0322d154885c` |
| `docs/models/render_runtime_park_growth_v06.py` | 기획에서 게임 데이터로 이어지는 생성 원천 | `7271f0eb57d2` |
| `docs/models/render_runtime_research_v06.py` | 기획에서 게임 데이터로 이어지는 생성 원천 | `6cc01e50bd94` |
| `docs/models/research_cost_model_v06.py` | 작업·생성·검산 원천 | `f16010b9a3fb` |
| `docs/models/research_effect_model_v06.py` | 작업·생성·검산 원천 | `a5bbe48b6335` |
| `docs/visuals/research-tree-v06/research-tree-care.png` | 연구트리 구조도 | `fa0a59e24ed3` |
| `docs/visuals/research-tree-v06/research-tree-exp.png` | 연구트리 구조도 | `ba45a09c0467` |
| `docs/visuals/research-tree-v06/research-tree-gene.png` | 연구트리 구조도 | `650c59375329` |
| `docs/visuals/research-tree-v06/research-tree-ops.png` | 연구트리 구조도 | `0c572274dcbb` |
| `docs/visuals/research-tree-v06/research-tree-overview.png` | 연구트리 구조도 | `a638cad1386b` |
| `packages/game-data/src/balance/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `f347c128b29c` |
| `packages/game-data/src/buildings/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `837e042715ad` |
| `packages/game-data/src/buildings/security-center.ts` | 보안센터 Lv.2 실행 수치 | `a9a85fc0ab86` |
| `packages/game-data/src/buildings/viewing-platform.ts` | 실행 코드·타입·실물 에셋 관찰 | `ac2c233e2e2e` |
| `packages/game-data/src/codex/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `0d7e0b2521ce` |
| `packages/game-data/src/dinosaurs/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `18c1d477fd53` |
| `packages/game-data/src/expedition/early-drive.ts` | 실행 코드·타입·실물 에셋 관찰 | `7e61d1d8db8a` |
| `packages/game-data/src/expedition/first-expedition.ts` | 탐험가 파견 실행 데이터·타입 | `37e83d20a618` |
| `packages/game-data/src/expedition/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `2a459356d4b9` |
| `packages/game-data/src/expedition/scout-catalog.ts` | 탐험가 파견 실행 데이터·타입 | `401cf1e351de` |
| `packages/game-data/src/expedition/scout-layout.ts` | 탐험가 파견 실행 데이터·타입 | `d489ea5ce0d1` |
| `packages/game-data/src/expedition/scout-target-data.ts` | 탐험가 파견 실행 데이터·타입 | `be1cf48e981c` |
| `packages/game-data/src/experimental-hybrid.ts` | 실제 게임 동작·표시 및 공통 규칙 | `fa5e8d7e4989` |
| `packages/game-data/src/great-figures/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `1e8905a25912` |
| `packages/game-data/src/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `485552381a7e` |
| `packages/game-data/src/production/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `861f34d5030e` |
| `packages/game-data/src/research/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `6427a63017df` |
| `packages/game-data/src/research/park-growth.generated.json` | 파크 Lv.8→15 성장 목표 실행 데이터 | `005831f2020f` |
| `packages/game-data/src/research/park-growth.ts` | 실행 코드·타입·실물 에셋 관찰 | `92647a9f241c` |
| `packages/game-data/src/research/progression.generated.json` | 후반 탐험 연구와 시설 강화 실행 데이터 | `50fdf75ec2f9` |
| `packages/game-data/src/research/progression.ts` | 실제 게임 동작·표시 및 공통 규칙 | `cb3b00a5a149` |
| `packages/game-data/src/seasons/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `c9e1502e201d` |
| `packages/game-data/src/shop/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `15bd438d74bf` |
| `packages/game-data/src/social/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `9c1dbc8c0cf3` |
| `packages/game-data/src/starter/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `6021f4c264cf` |
| `packages/game-data/src/stories/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `14ee7bdfdf14` |
| `packages/shared/src/constants/balance.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `5d07b139bdd6` |
| `packages/shared/src/constants/codex.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `92d5d9b47a5f` |
| `packages/shared/src/constants/game.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `ac1d817d9c2d` |
| `packages/shared/src/constants/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `11e17ef2f4e0` |
| `packages/shared/src/constants/park.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `4649ad396e89` |
| `packages/shared/src/constants/safari.constants.ts` | 우리 확장과 관람의 공통 조건 | `b531f2da5d71` |
| `packages/shared/src/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `9c3f12ae8726` |
| `packages/shared/src/types/api.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `17c456bf5056` |
| `packages/shared/src/types/building.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `aac1bc7a1419` |
| `packages/shared/src/types/codex.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `5047f1a2fb86` |
| `packages/shared/src/types/common.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `372422a1512e` |
| `packages/shared/src/types/dinosaur.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `e225ed92aa82` |
| `packages/shared/src/types/drive-expedition.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `8af7cd7152ac` |
| `packages/shared/src/types/economy.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `5666ca1e18a6` |
| `packages/shared/src/types/exhibit-placement.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `0efa61962182` |
| `packages/shared/src/types/experimental-hybrid.types.ts` | 실제 게임 동작·표시 및 공통 규칙 | `0e81112e8215` |
| `packages/shared/src/types/exploration.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `58e2e6b062b6` |
| `packages/shared/src/types/first-expedition.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `62f7aeeb53e5` |
| `packages/shared/src/types/great-figure.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `9f746ccd8204` |
| `packages/shared/src/types/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `d26b42853620` |
| `packages/shared/src/types/milestone-synthesis.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `bcd091850301` |
| `packages/shared/src/types/park.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `59bd6f925e20` |
| `packages/shared/src/types/repeat-synthesis.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `4a3e4c410d63` |
| `packages/shared/src/types/resources.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `d676e9e9da1a` |
| `packages/shared/src/types/safari.types.ts` | 우리 확장과 관람의 공통 조건 | `e4e291e0ae3f` |
| `packages/shared/src/types/scout-expedition.types.ts` | 탐험가 파견 실행 데이터·타입 | `b9d8cb436e42` |
| `packages/shared/src/types/season.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `5327d0ae591a` |
| `packages/shared/src/types/shop.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `a22d8075e4dd` |
| `packages/shared/src/types/social.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `96a3b54b4a9b` |
| `packages/shared/src/types/story.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `c4eb389a39e6` |
| `packages/shared/src/types/technology.types.ts` | 실제 게임 동작·표시 및 공통 규칙 | `0191cbe23d52` |
| `packages/shared/src/types/user.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `543ae38e2c42` |
| `packages/shared/src/utils/format.utils.ts` | 실행 코드·타입·실물 에셋 관찰 | `6d7ce00afdfc` |
| `packages/shared/src/utils/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `7c499fadafd2` |
| `packages/shared/src/utils/park-entrance.utils.ts` | 정문이 닿는 경계와 방향 판정 | `828d754bb2a5` |
| `packages/shared/src/utils/park-safari.utils.ts` | 우리 확장과 관람의 공통 조건 | `c042f9d0c6b4` |
| `packages/shared/src/utils/park-shuttle.utils.ts` | 셔틀버스 운행 수치와 만족도 | `ad509b3b1504` |
| `packages/shared/src/utils/time.utils.ts` | 실행 코드·타입·실물 에셋 관찰 | `dd7c9c6eb8f6` |
