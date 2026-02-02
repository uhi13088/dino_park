# 에셋 폴더 구조

이미지와 사운드 에셋을 아래 폴더에 넣어주세요.

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
- **건물**: `{building_id}.png` (예: `entrance.png`, `dna_lab.png`)
- **위인**: `{figure_id}.png` (예: `darwin.png`, `curie.png`)
- **아이콘**: `{name}.png` (예: `gold.png`, `diamond.png`, `energy.png`)

## 권장 사양

| 타입 | 크기 | 포맷 |
|------|------|------|
| 공룡 스프라이트 | 128x128 ~ 256x256 | PNG (투명) |
| 건물 | 64x64 ~ 256x256 | PNG (투명) |
| 위인 초상화 | 128x128 | PNG (투명) |
| UI 아이콘 | 32x32 ~ 64x64 | PNG (투명) |
| 타일 | 64x64 | PNG |
| BGM | - | MP3/OGG |
| SFX | - | MP3/WAV |
