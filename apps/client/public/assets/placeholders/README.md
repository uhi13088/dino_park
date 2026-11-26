# 임시 파크 에셋

첫 플레이와 스테고케라톱스 전시를 위해 제작한 SVG 15종이다. 공룡·시설 이름과 게임 수치는 `@dino-park/game-data`가 관리한다.

- `parasaurolophus.svg`: 시작 공룡. 아직 별도 그림이 없는 종의 파크 임시 대체 실루엣으로도 사용한다.
- `iguanodon.svg`: 두 번째 공룡. 파라와 다른 몸통·주둥이·앞발 실루엣으로 파크·공룡 패널·도감에 연결한다.
- `iguanodon-egg.svg`: 초원 조사 보상과 부화 안내의 이구아노돈 알.
- `parasaurolophus-lux.svg`: 도감의 발광 변종 파라 룩스. 시작 공룡의 몸체를 재사용하고 볏·무늬·색상을 구분한다.
- `habitat-grassland.svg`: 초원 서식지. 다른 시설의 임시 대체 이미지로도 사용한다.
- `operation-entrance-gate.svg` · `operation-entrance-gate-open.svg`: 입구 시제품. 지도에서는 [개장](../buildings/entrance-isometric-up-open.webp)과 [휴장](../buildings/entrance-isometric-up.webp) 정문을 울타리 방향에 맞춰 좌우 반전해 사용한다.
- `visitor-viewing-platform.svg`: 첫 관람대 시제품. 지도와 상세 화면은 [기본 관람대](../buildings/viewing-platform.webp)와 [지붕을 갖춘 Lv.5 관람대](../buildings/viewing-platform-lv5.webp)를 사용한다.
- `production-lumberyard.svg` · `production-quarry.svg`: 생산 시설 시제품. 지도와 시설 상세에는 [벌목장](../buildings/production-lumberyard.webp)과 [채석장](../buildings/production-quarry.webp) WebP를 표시한다.
- `triceratops.svg`: 첫 원종 알에서 얻는 뿔과 프릴이 있는 공룡.
- `stegosaurus.svg`: 첫 원종 알에서 얻는 골판과 꼬리 가시가 있는 공룡.
- `stegoceratops.svg`: 첫 합성으로 얻는 뿔과 골판이 있는 영웅.
- `habitat-hybrid-zone.svg`: 첫 스테고케라톱스에게 개방하는 초식 서식지.
- `research-dna-lab.svg`: 첫 배양 작업에 쓰는 시설 시제품. 지도와 시설 상세에는 [DNA 연구소](../buildings/research-dna-lab.webp) WebP를 표시한다.

파크 공룡과 시설의 이미지 목록은 `parkArtwork.ts`에서 관리하고 지도 엔진에서 미리 로드한다. 알은 탐험·부화 안내, 룩스는 도감 이미지로 사용한다. 새 시설 이미지는 기존 2:1 타일과 바닥 기준점에 맞춘 투명 WebP로 등록한다. 관람대의 두 WebP는 소품과 조명 방향을 맞추고, 강화가 끝나면 같은 위치에서 지붕이 있는 이미지로 전환한다.
