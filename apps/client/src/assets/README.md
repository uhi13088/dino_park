# 에셋 폴더 구조

파크 지도에서 쓰는 시설 이미지는 `public/assets/buildings/`에 두고 `src/game/parkArtwork.ts`에 등록한다. 나머지 이미지는 아래 분류를 참고한다.

## 관람대 2.5D 이미지

같은 시설의 기본형과 첫 변화 단계부터 함께 만든다. 2:1 아이소메트릭 시점과 왼쪽 위 조명을 맞추고, 배치 크기와 바닥 기준점은 파크 타일에서 확인한다. 투명 원본을 확인한 뒤 런타임용 WebP로 내보낸다. 아래 두 파일은 모두 가로 384px로 저장했다.

| 게임에서 보이는 단계 | 이미지 |
| --- | --- |
| Lv.1~4 열린 목재 데크 | [viewing-platform.webp](../../public/assets/buildings/viewing-platform.webp) |
| Lv.5 청록색 지붕과 안내 표지 | [viewing-platform-lv5.webp](../../public/assets/buildings/viewing-platform-lv5.webp) |

관람대의 두 이미지는 내장 ImageGen으로 제작했다. 다음 시설 제작 시 시점과 조명을 맞출 수 있도록 최종 수정 프롬프트를 남긴다.

<details>
<summary>지붕 있는 관람대와 열린 데크 프롬프트</summary>

**Lv.5**

> Use the supplied asset as the exact reference for the roofed viewing deck. Re-export it as a complete compact 2.5D game sprite. The most important change is to zoom out considerably and include fully transparent margins of at least fifteen percent of the canvas on every side, so the whole roof ridge, the entire wooden deck and the very front bottom corner are safely inside the canvas. The original roof peak is clipped; restore a small complete peak in the same teal painted metal. Keep the same orthographic 26.6 degree diamond-map perspective, wooden architecture, roof design, binoculars, blank sign, open railings, lighting and tightly square plot proportions. The object should occupy the center 65 to 70 percent of the canvas only. No ground plane, no terrain, no additional graphic or text and no drop shadow. The edges of the sprite and the inside of open railings must be truly alpha transparent.

**Lv.1~4**

> Create the earlier, simple upgrade stage of this exact dinosaur park viewing platform for the same 2.5D game. Preserve the same orthographic two-to-one isometric map camera, warm timber shape and ground-level raised square wooden deck, same stair placement in its near corner, same basic viewing rail, same binoculars and blank wood wayfinding sign. Remove the entire forest-teal canopy (roof and tall pillars) for this base model: the deck is completely open to the sky, with waist-high timber railings only. Railings do not close off the stairs. Keep the small plot warm, crisp and easily identifiable at 64 pixels wide. Wider 4:3 or square canvas and at least 15 percent of real transparent safety margin on every edge; the complete object including front corner is visible. Transparent holes through the railing. No ground plane, no terrain, no greenery, no additional objects, no characters, no letters or labels, no extra lighting background.

</details>

## 이미지 (`images/`)

```
images/
├── dinosaurs/          # 공룡 스프라이트
│   ├── herbivore/      # 초식 공룡 (trex.png, stego.png...)
│   ├── carnivore/      # 육식 공룡
│   ├── pterosaur/      # 익룡
│   ├── marine/         # 해양 공룡
│   └── hybrid/         # 하이브리드
│
├── buildings/          # 건물 이미지
│   ├── facilities/     # 시설 (entrance.png, shop.png...)
│   ├── decorations/    # 장식물
│   ├── habitats/       # 서식지
│   └── special/        # 특수 건물
│
├── characters/         # 캐릭터
│   ├── great-figures/  # 위인 (darwin.png, curie.png...)
│   └── npcs/           # NPC
│
├── ui/                 # UI 요소
│   ├── icons/          # 아이콘 (gold.png, diamond.png...)
│   ├── buttons/        # 버튼
│   ├── panels/         # 패널/모달
│   ├── backgrounds/    # 배경
│   └── effects/        # 이펙트
│
├── environment/        # 환경
│   ├── tiles/          # 타일 (grass.png, water.png...)
│   ├── props/          # 소품 (tree.png, rock.png...)
│   └── weather/        # 날씨 효과
│
└── items/              # 아이템
    ├── eggs/           # 알 (common_egg.png...)
    ├── food/           # 먹이
    └── boosters/       # 부스터
```

## 사운드 (`sounds/`)

```
sounds/
├── bgm/                # 배경음악 (main_theme.mp3...)
└── sfx/                # 효과음
    ├── ui/             # UI 효과음 (click.mp3, popup.mp3...)
    ├── dinosaurs/      # 공룡 효과음 (roar.mp3, eat.mp3...)
    ├── buildings/      # 건물 효과음
    ├── environment/    # 환경 효과음
    └── events/         # 이벤트 효과음
```

## 파일명 규칙

- **공룡**: `{species_id}.png` (예: `trex.png`, `stegosaurus.png`)
- **건물**: `{building_id}.webp`, 외형이 달라지는 단계는 `{building_id}-lv{level}.webp`
- **위인**: `{figure_id}.png` (예: `darwin.png`, `curie.png`)
- **아이콘**: `{name}.png` (예: `gold.png`, `diamond.png`, `energy.png`)

## 권장 사양

| 타입            | 크기              | 포맷       |
| --------------- | ----------------- | ---------- |
| 공룡 스프라이트 | 128x128 ~ 256x256 | PNG (투명) |
| 건물            | 타일 크기에 맞춰 내보내기 | WebP (투명) |
| 위인 초상화     | 128x128           | PNG (투명) |
| UI 아이콘       | 32x32 ~ 64x64     | PNG (투명) |
| 타일            | 64x64             | PNG        |
| BGM             | -                 | MP3/OGG    |
| SFX             | -                 | MP3/WAV    |
