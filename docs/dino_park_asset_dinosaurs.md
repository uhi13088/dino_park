# 🦕 다이노 파크 타이쿤 - 에셋 프롬프트 (공룡편)

<!-- legacy-reference: 2026-11-15 -->
> **구버전 자료 · 2026-11-15 분리**
> 구버전 기획·설계 자료입니다. 최신 구현 기준으로 사용하지 말고, 필요한 내용은 최신 기획에 승계한 뒤 사용합니다. 문서 내 버전 번호는 이 자료 자체의 과거 버전입니다.
> 최신 기준과 실제 구현 상태는 [기획 문서 안내](README.md)에서 확인합니다.

## 82종 공룡 개별 특성 + MVP 20종 완전한 프롬프트

---

# 📋 목차

1. [사용법](#1-사용법)
2. [MVP 20종 완전한 프롬프트](#2-mvp-20종-완전한-프롬프트)
3. [초식 공룡 25종 특성표](#3-초식-공룡-25종-특성표)
4. [육식 공룡 25종 특성표](#4-육식-공룡-25종-특성표)
5. [익룡 12종 특성표](#5-익룡-12종-특성표)
6. [해양 파충류 10종 특성표](#6-해양-파충류-10종-특성표)
7. [하이브리드 10종 특성표](#7-하이브리드-10종-특성표)

---

# 1. 사용법

## Step 1: AI 이미지 생성

### 권장 도구

- **Midjourney** (v6 추천) - 프롬프트가 Midjourney 문법으로 작성됨
- **Leonardo AI** - `--ar`, `--v`, `--s`, `--q` 파라미터 제거 후 사용
- **Stable Diffusion** - 파라미터 제거 후 사용

### MVP 공룡 (완전한 프롬프트 있음)

1. 아래 섹션 2에서 원하는 공룡 찾기
2. 원하는 상태(Idle/Walk/Portrait) 프롬프트 전체 복사
3. Midjourney에 `/imagine prompt:` 후 붙여넣기

### 나머지 공룡 (특성표만 있음)

```
Step 1: asset_main.md에서 마스터 스타일 복사
Step 2: 아래 특성표에서 해당 공룡의 "개별 특성" 복사
Step 3: 원하는 상태(Idle/Walk/Eat) 키워드 추가 (asset_main.md 참조)
Step 4: 사이즈 템플릿 추가 (asset_main.md 참조)
Step 5: --ar 1:1 --v 6 --s 250 --q 2 추가
```

## Step 2: 파일명 규칙

### 기본 형식

```
dino_{id}_{영문이름}_{상태}.png
```

### 상태 접미사

```
_idle     - 서있는 기본 상태
_walk     - 걷는 상태
_eat      - 먹는 상태
_happy    - 기쁜 상태
_portrait - 초상화 (UI용)
```

### 예시

```
dino_001_stegosaurus_idle.png
dino_001_stegosaurus_walk.png
dino_001_stegosaurus_portrait.png
dino_002_triceratops_idle.png
dino_015_tyrannosaurus_idle.png
```

## Step 3: 폴더 구조

```
apps/client/src/assets/dinosaurs/
├── herbivore/                    # 초식 공룡 25종
│   ├── dino_001_stegosaurus_idle.png
│   ├── dino_001_stegosaurus_walk.png
│   ├── dino_001_stegosaurus_portrait.png
│   ├── dino_002_triceratops_idle.png
│   └── ...
├── carnivore/                    # 육식 공룡 25종
│   ├── dino_015_tyrannosaurus_idle.png
│   └── ...
├── pterosaur/                    # 익룡 12종
│   ├── dino_040_pteranodon_idle.png
│   └── ...
├── marine/                       # 해양 파충류 10종
│   ├── dino_052_mosasaurus_idle.png
│   └── ...
└── hybrid/                       # 하이브리드 10종
    ├── dino_072_indominus_idle.png
    └── ...
```

## Step 4: 권장 크기

| 공룡 크기 | 그리드 | 픽셀    | 대상                    |
| --------- | ------ | ------- | ----------------------- |
| XS        | 1×1    | 64×64   | 소형 (콤프소그나투스)   |
| S         | 1×1    | 96×96   | 중소형 (벨로키랍토르)   |
| M         | 2×2    | 128×128 | 중형 (스테고사우루스)   |
| L         | 3×3    | 192×192 | 대형 (브라키오사우루스) |
| XL        | 4×4    | 256×256 | 초대형 (티라노사우루스) |
| XXL       | 6×6    | 384×384 | 거대형 (모사사우루스)   |

## Step 5: 이미지 후처리

### 필수 작업

1. **배경 제거** - 투명 PNG로 저장
2. **크기 조정** - 프롬프트에 명시된 픽셀 크기로 리사이즈
3. **파일 형식** - PNG-24 (투명도 포함)

## 🔖 빠른 참조: 전체 공룡 ID 목록

### 초식 공룡 (001-025)

```
dino_001_stegosaurus
dino_002_triceratops
dino_003_brachiosaurus
dino_004_parasaurolophus
dino_005_ankylosaurus
dino_006_diplodocus
dino_007_apatosaurus
dino_008_iguanodon
dino_009_pachycephalosaurus
dino_010_gallimimus
dino_011_therizinosaurus
dino_012_maiasaura
dino_013_edmontosaurus
dino_014_corythosaurus
dino_021_kentrosaurus
dino_022_styracosaurus
dino_023_protoceratops
dino_024_camarasaurus
dino_025_plateosaurus
dino_026_lambeosaurus
dino_027_ouranosaurus
dino_028_nigersaurus
dino_029_amargasaurus
dino_030_muttaburrasaurus
dino_031_psittacosaurus
```

### 육식 공룡 (015-020, 032-050)

```
dino_015_tyrannosaurus
dino_016_velociraptor
dino_017_spinosaurus
dino_018_allosaurus
dino_019_carnotaurus
dino_020_dilophosaurus
dino_032_giganotosaurus
dino_033_carcharodontosaurus
dino_034_baryonyx
dino_035_suchomimus
dino_036_acrocanthosaurus
dino_037_ceratosaurus
dino_038_megalosaurus
dino_039_herrerasaurus
dino_040_coelophysis
dino_041_compsognathus
dino_042_deinonychus
dino_043_utahraptor
dino_044_microraptor
dino_045_oviraptor
dino_046_troodon
dino_047_majungasaurus
dino_048_irritator
dino_049_metriacanthosaurus
dino_050_proceratosaurus
dino_051_monolophosaurus
```

### 익룡 (052-063)

```
dino_052_pteranodon
dino_053_quetzalcoatlus
dino_054_dimorphodon
dino_055_rhamphorhynchus
dino_056_tapejara
dino_057_pterodactylus
dino_058_tropeognathus
dino_059_anhanguera
dino_060_dsungaripterus
dino_061_ornithocheirus
dino_062_hatzegopteryx
dino_063_nyctosaurus
```

### 해양 파충류 (064-073)

```
dino_064_mosasaurus
dino_065_plesiosaurus
dino_066_elasmosaurus
dino_067_liopleurodon
dino_068_ichthyosaurus
dino_069_kronosaurus
dino_070_tylosaurus
dino_071_shonisaurus
dino_072_nothosaurus
dino_073_dakosaurus
```

### 하이브리드 (074-083)

```
dino_074_indominus_rex
dino_075_indoraptor
dino_076_stegoceratops
dino_077_spinoraptor
dino_078_ankylodocus
dino_079_carnoraptor
dino_080_pyrittator
dino_081_diplotator
dino_082_giganocephalus
dino_083_ultimasaurus
```

---

# 2. MVP 20종 완전한 프롬프트

> 바로 복사해서 Midjourney에 붙여넣기 하세요!

---

## MVP_01 스테고사우루스 (Stegosaurus) - M, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Stegosaurus dinosaur, iconic double row of orange-red back plates, green body #4CAF50, cream underbelly, four sturdy legs, spiked tail, standing idle pose, relaxed stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### Walk

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Stegosaurus dinosaur, iconic double row of orange-red back plates, green body #4CAF50, cream underbelly, four sturdy legs, spiked tail, walking pose, one leg forward, mid-stride, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### Portrait

```
2.5D game portrait, soft cel-shaded cartoon style, warm color palette, vibrant colors, clean outlines, soft lighting, gradient background, cute Stegosaurus dinosaur, big friendly eyes, green body #4CAF50, orange-red back plates, gentle expression, front-facing portrait, head and upper body, portrait 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_02 트리케라톱스 (Triceratops) - L, Epic

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Triceratops dinosaur, three prominent horns, large decorative neck frill with orange spots, brown-gray body #8D6E63, sturdy four legs, proud stance, standing idle pose, head slightly raised, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### Portrait

```
2.5D game portrait, soft cel-shaded cartoon style, warm color palette, vibrant colors, clean outlines, soft lighting, gradient background, cute Triceratops dinosaur, big friendly eyes, three horns, large frill with orange spots #FF8A65, brown-gray body #8D6E63, proud expression, front-facing portrait, head and upper body, portrait 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_03 브라키오사우루스 (Brachiosaurus) - XXL, Legendary

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Brachiosaurus dinosaur, extremely long neck reaching upward, front legs longer than back, massive body, teal blue-green body #26A69A, cream underbelly #80CBC4, gentle giant expression, standing idle pose, neck raised high, sprite size 384x384 pixels, 6x6 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_04 파라사우롤로푸스 (Parasaurolophus) - M, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Parasaurolophus dinosaur, distinctive long curved tubular crest extending backward, duck-billed mouth, green body #43A047, yellow stripe pattern and crest #FDD835, friendly curious expression, standing idle pose, crest visible, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_05 안킬로사우루스 (Ankylosaurus) - L, Epic

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Ankylosaurus dinosaur, heavily armored body with bony plates and spikes, large club tail weapon, low wide tank stance, dark brown armor #5D4037, friendly eyes peeking from armor, defensive but calm stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_06 티라노사우루스 렉스 (T-Rex) - XL, Legendary

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, powerful but approachable appearance, Tyrannosaurus Rex dinosaur, king of dinosaurs, massive powerful head with teeth in slight smile, tiny two-fingered arms, thick muscular tail, dark brown body #5D4037, orange underbelly #FFCC80, confident kingly stance, standing idle pose, royal stance, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### Walk

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, powerful but approachable appearance, Tyrannosaurus Rex dinosaur, king of dinosaurs, massive powerful head, tiny two-fingered arms, thick muscular tail, dark brown body #5D4037, orange underbelly #FFCC80, walking pose, one leg forward, powerful stride, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### Portrait

```
2.5D game portrait, soft cel-shaded cartoon style, warm color palette, vibrant colors, clean outlines, soft lighting, gradient background, cute but powerful Tyrannosaurus Rex, king of dinosaurs, big friendly eyes, massive head with teeth in slight smile, dark brown body #5D4037, orange underbelly #FFCC80, confident kingly expression, legendary golden rim light, front-facing portrait, head and upper body, portrait 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_07 벨로시랩터 (Velociraptor) - S, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Velociraptor dinosaur, sleek feathered body, large sickle claw on each foot raised, intelligent eyes, orange-brown body #FF8A65, blue feather highlights on arms #42A5F5, clever hunting pose, smart expression, standing idle pose, sickle claw raised, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_08 스피노사우루스 (Spinosaurus) - XL, Legendary

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Spinosaurus dinosaur, enormous sail on back, long crocodilian snout, blue-green body #00796B, vibrant orange sail #FF9800, paddle-like tail, majestic aquatic hunter expression, standing idle pose, massive sail displayed, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_09 알로사우루스 (Allosaurus) - L, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Allosaurus dinosaur, bony ridges above eyes, large head with sharp teeth, powerful three-fingered arms, blue-gray body #546E7A, lighter stripe accents #78909C, noble hunter expression, standing idle pose, eye ridges visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_10 카르노타우루스 (Carnotaurus) - L, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Carnotaurus dinosaur, two prominent bull-like horns above eyes, tiny vestigial arms, deep muscular body, red-brown color #BF360C, darker horn accents, fierce but charismatic expression, standing idle pose, horns visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_11 프테라노돈 (Pteranodon) - M, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Pteranodon pterosaur, iconic backward-pointing head crest, toothless long beak, large wingspan, blue-purple body #7E57C2, lighter crest and underbelly #B39DDB, graceful noble expression, soaring pose, crest visible, wings spread, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_12 케찰코아틀루스 (Quetzalcoatlus) - L, Legendary

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Quetzalcoatlus pterosaur, largest flying animal ever, giraffe-sized when standing, enormous wingspan, long toothless beak, very long neck, white body #FFFFFF, orange accent markings #FF9800, legendary sky ruler expression, soaring or standing pose, massive scale visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_13 모사사우루스 (Mosasaurus) - XL, Legendary

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Mosasaurus marine reptile, apex ocean predator, massive powerful jaws with curved teeth in slight grin, paddle-like limbs, long powerful tail with fin, dark blue body #0D47A1, lighter underbelly #64B5F6, king of the seas expression, swimming pose, massive build visible, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_14 플레시오사우루스 (Plesiosaurus) - L, Rare

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Plesiosaurus marine reptile, long graceful curved neck, four large paddle flippers, small rounded head, streamlined body, teal blue color #00796B, cream underbelly #B2DFDB, gentle sea creature expression, swimming pose, neck curved gracefully, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_15 딜로포사우루스 (Dilophosaurus) - M, Uncommon

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Dilophosaurus dinosaur, twin parallel crests on head, slender agile build, orange body #FF7043, green crest markings #4CAF50, proud theatrical expression, standing idle pose, twin crests visible, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_16 콤프소그나투스 (Compsognathus) - XS, Common

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, Compsognathus dinosaur, tiny chicken-sized theropod, slender body, long thin tail, light green color #8BC34A, lighter underbelly #DCEDC8, curious mischievous expression, standing idle pose, tiny alert stance, sprite size 64x64 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_17 인도미누스 렉스 (Indominus Rex) - XL, Legendary, Hybrid

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, Indominus Rex hybrid dinosaur, bio-engineered apex predator, white-gray body #ECEFF1, distinctive red eyes #F44336, mix of T-rex power and raptor intelligence, long arms with sharp claws, spiky back ridges, mysterious powerful stance, subtle red bioluminescent accent lines, standing idle pose, alpha stance, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_18 인도랩터 (Indoraptor) - L, Legendary, Hybrid

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but sleek dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, sleek appearance, Indoraptor hybrid dinosaur, sleek black body #212121, distinctive golden stripe along body #FFC107, raptor shape with enhanced features, intelligent yellow eyes, long sickle claws, stealthy pose, gold bioluminescent stripe accents, standing idle pose, sleek deadly stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_19 기가노토사우루스 (Giganotosaurus) - XL, Epic

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, powerful appearance, Giganotosaurus dinosaur, massive theropod rivaling T-rex, narrower skull built for slicing, three-fingered arms, gray-brown color #6D4C41, red stripe markings #E53935, powerful predator stance, apex hunter expression, subtle inner glow, standing idle pose, massive frame, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## MVP_20 테리지노사우루스 (Therizinosaurus) - L, Epic

### Idle

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but bizarre dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, Therizinosaurus dinosaur, enormous scythe-like claws longest of any animal, feathered pot-bellied body, long neck, greenish brown color #689F38, darker green feather accents #33691E, bizarre but fascinating expression, gentle herbivorous theropod despite scary claws, subtle inner glow, standing idle pose, massive claws displayed, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 3. 초식 공룡 25종 특성표

> 마스터 스타일 + 공룡 스타일 + 아래 특성 + 상태 + 사이즈 조합

| #   | 이름               | 크기 | 등급       | 개별 특성                                                                                                                                      |
| --- | ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 스테고사우루스     | M    | ⭐⭐⭐     | `Stegosaurus, double row of orange-red back plates, green body #4CAF50, cream underbelly, four sturdy legs, spiked tail,`                      |
| 2   | 켄트로사우루스     | M    | ⭐⭐       | `Kentrosaurus, paired shoulder spikes and small back plates, olive green body #689F38, brown spike highlights #8D6E63, long spiked tail,`      |
| 3   | 후아양고사우루스   | S    | ⭐         | `Huayangosaurus, primitive stegosaur, mixed small plates and spikes, light green body #7CB342, beige accents #A1887F, compact body,`           |
| 4   | 트리케라톱스       | L    | ⭐⭐⭐⭐   | `Triceratops, three prominent horns, large neck frill with orange spots #FF8A65, brown-gray body #8D6E63, proud stance,`                       |
| 5   | 스티라코사우루스   | M    | ⭐⭐⭐     | `Styracosaurus, large single nose horn, frill with multiple long spikes, reddish-brown body #A1887F, red frill accents #E57373,`               |
| 6   | 프로토케라톱스     | S    | ⭐         | `Protoceratops, parrot-like beak, small frill without horns, sandy beige body #D7CCC8, light brown frill #BCAAA4, sheep-sized,`                |
| 7   | 파키리노사우루스   | M    | ⭐⭐       | `Pachyrhinosaurus, flat bony boss on nose, ornate frill with small horns, blue-gray body #78909C, light blue markings #90CAF9,`                |
| 8   | 코스모케라톱스     | M    | ⭐⭐⭐     | `Kosmoceratops, most ornate frill with 15 horn projections, colorful frill orange #FF7043 and yellow #FDD835, brown body #6D4C41,`             |
| 9   | 안킬로사우루스     | L    | ⭐⭐⭐⭐   | `Ankylosaurus, heavily armored body with bony plates, large club tail, dark brown armor #5D4037, tank stance,`                                 |
| 10  | 노도사우루스       | M    | ⭐⭐       | `Nodosaurus, armored without tail club, rows of bony nodules, shoulder spikes, grayish-brown #757575, lighter nodules #9E9E9E,`                |
| 11  | 폴라칸투스         | M    | ⭐⭐       | `Polacanthus, spiky armored back with large shoulder spines, no tail club, greenish-gray body #607D8B, darker spines #455A64,`                 |
| 12  | 파키케팔로사우루스 | M    | ⭐⭐⭐     | `Pachycephalosaurus, thick domed skull with ring of small horns, bipedal stance, brownish-green #689F38, lighter dome #8BC34A,`                |
| 13  | 스티기몰로크       | S    | ⭐⭐       | `Stygimoloch, smaller dome with cluster of horns pointing backward, bipedal, reddish-brown #A1887F, darker horns #7B5544, punk-rock look,`     |
| 14  | 드라코렉스         | S    | ⭐⭐       | `Dracorex, flat skull with many spiky horns creating dragon-like appearance, no dome, dark green #2E7D32, darker horns #1B5E20,`               |
| 15  | 브라키오사우루스   | XXL  | ⭐⭐⭐⭐⭐ | `Brachiosaurus, extremely long neck reaching upward, front legs longer than back, massive body, teal #26A69A to #80CBC4, gentle giant,`        |
| 16  | 아파토사우루스     | XL   | ⭐⭐⭐     | `Apatosaurus, very long neck and whip-like tail, massive body, gray-green #78909C, lighter underbelly #B0BEC5, horizontal neck,`               |
| 17  | 디플로도쿠스       | XL   | ⭐⭐⭐     | `Diplodocus, extremely long thin neck and very long whip tail, slender body, olive brown #6D4C41, lighter stripe pattern #8D6E63,`             |
| 18  | 아르젠티노사우루스 | XXL  | ⭐⭐⭐⭐⭐ | `Argentinosaurus, one of the largest dinosaurs, incredibly massive body, thick column legs, gray #757575, stripe patterns #9E9E9E,`            |
| 19  | 카마라사우루스     | L    | ⭐⭐       | `Camarasaurus, shorter neck, boxy blunt skull, robust compact body, tan brown #A1887F, beige underbelly #D7CCC8,`                              |
| 20  | 니게르사우루스     | M    | ⭐⭐       | `Nigersaurus, wide straight-edged mouth like vacuum, short neck held near ground, greenish #558B2F, lighter green #8BC34A,`                    |
| 21  | 파라사우롤로푸스   | M    | ⭐⭐⭐     | `Parasaurolophus, long curved tubular crest extending backward, duck-billed, green body #43A047, yellow stripe and crest #FDD835,`             |
| 22  | 코리토사우루스     | M    | ⭐⭐       | `Corythosaurus, tall helmet-like rounded crest, duck-billed, brown body #795548, cream underbelly, orange crest #FF8A65,`                      |
| 23  | 에드몬토사우루스   | L    | ⭐⭐       | `Edmontosaurus, large hadrosaur without crest, duck-billed flat head, olive green #6B8E23, lighter underbelly #9ACD32,`                        |
| 24  | 이구아노돈         | L    | ⭐⭐       | `Iguanodon, distinctive thumb spike on each hand, quadrupedal or bipedal, green-brown #558B2F, darker accents #33691E,`                        |
| 25  | 마이아사우라       | M    | ⭐⭐       | `Maiasaura, small solid crest ridge above eyes, duck-billed hadrosaur, greenish-brown #7CB342, lighter accents #AED581, nurturing expression,` |

---

# 4. 육식 공룡 25종 특성표

| #   | 이름                 | 크기 | 등급       | 개별 특성                                                                                                                                   |
| --- | -------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 26  | 콤프소그나투스       | XS   | ⭐         | `Compsognathus, tiny chicken-sized theropod, slender body, long thin tail, light green #8BC34A, lighter underbelly #DCEDC8, mischievous,`   |
| 27  | 벨로시랩터           | S    | ⭐⭐⭐     | `Velociraptor, sleek feathered body, large sickle claw on each foot, intelligent eyes, orange-brown #FF8A65, blue feathers #42A5F5,`        |
| 28  | 데이노니쿠스         | M    | ⭐⭐⭐     | `Deinonychus, larger raptor, prominent sickle claws, feathered arms, reddish-brown #D84315, orange feather stripes #FF8A65, athletic,`      |
| 29  | 유타랩터             | L    | ⭐⭐⭐     | `Utahraptor, largest raptor, massive sickle claws, heavily feathered, dark brown #5D4037, red feather markings #E53935, powerful,`          |
| 30  | 트로오돈             | S    | ⭐⭐       | `Troodon, large brain smartest dinosaur, big forward-facing eyes for night vision, slender feathered, gray-green #607D8B, lighter #90A4AE,` |
| 31  | 오비랩터             | S    | ⭐⭐       | `Oviraptor, parrot-like toothless beak, tall crest, feathered body, colorful orange #FF7043, blue feathers #42A5F5, bird-like,`             |
| 32  | 갈리미무스           | M    | ⭐⭐       | `Gallimimus, ostrich-like body, long neck, toothless beak, long legs for running, beige-tan #D7CCC8, brown stripes #A1887F, speedy,`        |
| 33  | 테리지노사우루스     | L    | ⭐⭐⭐⭐   | `Therizinosaurus, enormous scythe-like claws, feathered pot-bellied body, long neck, greenish #689F38, darker feathers #33691E, bizarre,`   |
| 34  | 딜로포사우루스       | M    | ⭐⭐       | `Dilophosaurus, twin parallel crests on head, slender agile, orange body #FF7043, green crest markings #4CAF50, theatrical,`                |
| 35  | 케라토사우루스       | M    | ⭐⭐       | `Ceratosaurus, horn on nose, small osteoderms along back, red-brown #C62828, darker horn #8D6E63, aggressive but cute,`                     |
| 36  | 카르노타우루스       | L    | ⭐⭐⭐     | `Carnotaurus, two bull-like horns above eyes, tiny vestigial arms, deep muscular body, red-brown #BF360C, darker horns #5D4037,`            |
| 37  | 마준가사우루스       | M    | ⭐⭐       | `Majungasaurus, single horn bump on head, short snout, stocky powerful build, grayish-brown #795548, darker bump #5D4037,`                  |
| 38  | 알로사우루스         | L    | ⭐⭐⭐     | `Allosaurus, bony ridges above eyes, large head with sharp teeth, powerful three-fingered arms, blue-gray #546E7A, stripes #78909C,`        |
| 39  | 바리오닉스           | L    | ⭐⭐⭐     | `Baryonyx, long crocodile-like snout with many teeth, large thumb claw, fish-eating, gray-green #607D8B, darker claws #455A64,`             |
| 40  | 수코미무스           | L    | ⭐⭐⭐     | `Suchomimus, crocodile-like long snout, low sail ridge on back, long arms with claws, olive green #558B2F, darker sail #33691E,`            |
| 41  | 메트리아칸토사우루스 | M    | ⭐⭐       | `Metriacanthosaurus, moderate spine height creating small ridge, medium theropod, brownish-red #8D6E63, darker spines #6D4C41,`             |
| 42  | 티라노사우루스 렉스  | XL   | ⭐⭐⭐⭐⭐ | `Tyrannosaurus Rex, king of dinosaurs, massive powerful head, tiny two-fingered arms, dark brown #5D4037, orange underbelly #FFCC80,`       |
| 43  | 스피노사우루스       | XL   | ⭐⭐⭐⭐⭐ | `Spinosaurus, enormous sail on back, long crocodilian snout, semi-aquatic, blue-green #00796B, vibrant orange sail #FF9800,`                |
| 44  | 기가노토사우루스     | XL   | ⭐⭐⭐⭐   | `Giganotosaurus, massive theropod rivaling T-rex, narrower skull, three-fingered arms, gray-brown #6D4C41, red stripes #E53935,`            |
| 45  | 카르카로돈토사우루스 | XL   | ⭐⭐⭐⭐   | `Carcharodontosaurus, shark-toothed lizard, massive skull with serrated teeth, sandy brown #A1887F, darker stripes #795548,`                |
| 46  | 아크로칸토사우루스   | L    | ⭐⭐⭐     | `Acrocanthosaurus, high spines forming muscular ridge on back, powerful arms, gray #757575, darker ridge #616161,`                          |
| 47  | 알베르토사우루스     | L    | ⭐⭐⭐     | `Albertosaurus, smaller more agile tyrannosaur, lighter build, greenish-brown #558B2F, darker stripes #33691E, pack hunter,`                |
| 48  | 타르보사우루스       | XL   | ⭐⭐⭐⭐   | `Tarbosaurus, Asian tyrannosaur cousin of T-rex, massive build but narrower skull, darker brown #4E342E, lighter underbelly #8D6E63,`       |
| 49  | 다스플레토사우루스   | L    | ⭐⭐⭐     | `Daspletosaurus, tyrannosaur predecessor to T-rex, robust powerful skull, reddish-brown #8D6E63, red-orange stripes #D84315,`               |
| 50  | 고르고사우루스       | L    | ⭐⭐⭐     | `Gorgosaurus, slender agile tyrannosaur, lighter faster build, gray-green #607D8B, darker stripes #455A64, sleek,`                          |

---

# 5. 익룡 12종 특성표

| #   | 이름             | 크기 | 등급       | 개별 특성                                                                                                                                            |
| --- | ---------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 51  | 디모르포돈       | S    | ⭐⭐       | `Dimorphodon pterosaur, large head with deep beak, small body, short wings, colorful head red #F44336 and yellow #FDD835, brown body #795548,`       |
| 52  | 람포린쿠스       | S    | ⭐⭐       | `Rhamphorhynchus pterosaur, long tail with diamond vane at end, needle-like teeth, slender wings, brownish #8D6E63, darker tail #6D4C41,`            |
| 53  | 아누로그나투스   | XS   | ⭐         | `Anurognathus pterosaur, tiny frog-headed pterosaur, short wide head, very small body, fuzzy brown #795548, lighter fuzzy #A1887F, adorable,`        |
| 54  | 프테로닥틸루스   | S    | ⭐⭐       | `Pterodactylus pterosaur, classic small pterosaur, no head crest, slender pointed beak, light brown #A1887F, darker wing membrane #8D6E63,`          |
| 55  | 프테라노돈       | M    | ⭐⭐⭐     | `Pteranodon pterosaur, iconic backward-pointing head crest, toothless long beak, large wingspan, blue-purple #7E57C2, lighter crest #B39DDB,`        |
| 56  | 투판닥틸루스     | M    | ⭐⭐⭐     | `Tupandactylus pterosaur, enormous sail-like head crest much larger than head, colorful crest red #F44336 and blue #2196F3, brown body #795548,`     |
| 57  | 타페자라         | S    | ⭐⭐       | `Tapejara pterosaur, distinctive triangular sail-like head crest, toothless short beak, green body #4CAF50, orange crest #FF9800, fruit-eater,`      |
| 58  | 트로펙그나투스   | M    | ⭐⭐       | `Tropeognathus pterosaur, keeled crests on both upper and lower jaws, fish-eating, gray-blue #607D8B, darker jaw keels #455A64,`                     |
| 59  | 케찰코아틀루스   | L    | ⭐⭐⭐⭐⭐ | `Quetzalcoatlus pterosaur, largest flying animal ever, giraffe-sized standing, enormous wingspan, long neck, white #FFFFFF, orange accents #FF9800,` |
| 60  | 하체고프테릭스   | L    | ⭐⭐⭐⭐   | `Hatzegopteryx pterosaur, massive robust pterosaur, shorter stouter neck, powerful wide beak, gray-brown #795548, darker head #5D4037,`              |
| 61  | 오르니토케이루스 | M    | ⭐⭐⭐     | `Ornithocheirus pterosaur, keeled crest on snout tip, large wingspan, fish-eating, bluish-gray #546E7A, lighter accent #78909C,`                     |
| 62  | 안항게라         | M    | ⭐⭐⭐     | `Anhanguera pterosaur, twin keeled crests on upper and lower jaws, long beak, tan and gray #A1887F, darker keel accents #8D6E63,`                    |

---

# 6. 해양 파충류 10종 특성표

| #   | 이름             | 크기 | 등급       | 개별 특성                                                                                                                                                                       |
| --- | ---------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 63  | 플레시오사우루스 | L    | ⭐⭐⭐     | `Plesiosaurus marine reptile, long graceful curved neck, four large paddle flippers, small rounded head, teal blue #00796B, cream underbelly #B2DFDB,`                          |
| 64  | 엘라스모사우루스 | XL   | ⭐⭐⭐⭐   | `Elasmosaurus marine reptile, extremely long snake-like neck longest of any plesiosaur, tiny head, blue-green #0097A7, lighter underbelly #80DEEA,`                             |
| 65  | 크로노사우루스   | L    | ⭐⭐⭐⭐   | `Kronosaurus marine reptile, short-necked pliosaur, massive powerful head with long jaws, four strong flippers, dark blue-gray #37474F, lighter underbelly #78909C,`            |
| 66  | 리오플레우로돈   | L    | ⭐⭐⭐⭐   | `Liopleurodon marine reptile, short-necked pliosaur, large elongated head, powerful four flippers, dark green #2E7D32, lighter underbelly #81C784,`                             |
| 67  | 이크티오사우루스 | M    | ⭐⭐       | `Ichthyosaurus marine reptile, dolphin-shaped streamlined body, large round eyes, dorsal fin, crescent tail fin, blue-gray #546E7A, lighter underbelly #B0BEC5,`                |
| 68  | 숀이사우루스     | XL   | ⭐⭐⭐     | `Shonisaurus marine reptile, enormous whale-sized ichthyosaur, toothless jaws in adults, massive streamlined, dark gray #455A64, lighter underbelly #90A4AE,`                   |
| 69  | 템노돈토사우루스 | L    | ⭐⭐⭐     | `Temnodontosaurus marine reptile, large ichthyosaur, notably biggest eyes for deep diving, powerful swimmer, gray-blue #607D8B, big light blue eyes #B3E5FC,`                   |
| 70  | 모사사우루스     | XL   | ⭐⭐⭐⭐⭐ | `Mosasaurus marine reptile, apex ocean predator, massive powerful jaws with curved teeth, paddle limbs, powerful tail with fin, dark blue #0D47A1, lighter underbelly #64B5F6,` |
| 71  | 타일로사우루스   | L    | ⭐⭐⭐⭐   | `Tylosaurus marine reptile, streamlined mosasaur, pointed snout without teeth at tip, sleek powerful body, gray-green #455A64, lighter underbelly #78909C,`                     |
| 72  | 프로그나토돈     | L    | ⭐⭐⭐     | `Prognathodon marine reptile, robust stocky mosasaur, powerful crushing jaws for shelled prey, brownish #5D4037, lighter underbelly #8D6E63,`                                   |

---

# 7. 하이브리드 10종 특성표

> 하이브리드 추가: `bio-engineered hybrid, subtle bioluminescent glow effects,`

| #   | 이름               | 크기 | 등급       | 베이스        | 개별 특성                                                                                                                                                                                              |
| --- | ------------------ | ---- | ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 73  | 인도미누스 렉스    | XL   | ⭐⭐⭐⭐⭐ | T-Rex+Raptor  | `Indominus Rex hybrid, bio-engineered apex predator, white-gray body #ECEFF1, red eyes #F44336, T-rex power with raptor intelligence, long arms with claws, spiky ridges, red bioluminescent accents,` |
| 74  | 인도랩터           | L    | ⭐⭐⭐⭐⭐ | I-Rex+Raptor  | `Indoraptor hybrid, sleek black body #212121, distinctive golden stripe #FFC107, raptor shape enhanced, intelligent yellow eyes, long sickle claws, gold bioluminescent stripe,`                       |
| 75  | 스테고케라톱스     | L    | ⭐⭐⭐⭐   | Stego+Trike   | `Stegoceratops hybrid, Stegosaurus and Triceratops combined, back plates AND head frill with horns, green body #4CAF50, orange plate and frill highlights #FF7043,`                                    |
| 76  | 앙킬로닥틸루스     | M    | ⭐⭐⭐⭐   | Ankylo+Pteran | `Ankylodactylus hybrid, armored flying pterosaur, wings with bony armor plating, club-like tail, head crest, gray-blue armored #546E7A, darker armor #455A64,`                                         |
| 77  | 스피노랩터         | L    | ⭐⭐⭐⭐   | Spino+Raptor  | `Spinoraptor hybrid, raptor body with sail on back, elongated snout, large sickle claws, feathered arms, teal body #00796B, orange sail #FF9800,`                                                      |
| 78  | 카르노랩터         | M    | ⭐⭐⭐⭐   | Carno+Raptor  | `Carnoraptor hybrid, raptor body with bull horns, feathered with flame-colored plumage, red #D84315, orange #FF7043, yellow #FDD835, sickle claws,`                                                    |
| 79  | 파키라이노사우루스 | L    | ⭐⭐⭐⭐   | Pachy+Trike   | `Pachyrinosaurus hybrid, thick domed skull combined with frill and horns, heavily armored head, gray-brown #78909C, blue dome and frill #42A5F5,`                                                      |
| 80  | 디모르포테리움     | M    | ⭐⭐⭐⭐   | Dimor+Theriz  | `Dimorphotherium hybrid, flying creature with massive scythe claws, large head from Dimorphodon, feathered with wings, purple #7B1FA2, green plumage #4CAF50,`                                         |
| 81  | 모사렉스           | XL   | ⭐⭐⭐⭐⭐ | Mosa+T-Rex    | `Mosarex hybrid, semi-aquatic T-rex, massive powerful jaws, paddle-like limbs for swimming, powerful tail with fin, dark blue-gray #37474F, lighter underbelly #78909C, blue bioluminescent #2196F3,`  |
| 82  | 스피노렉스         | XXL  | ⭐⭐⭐⭐⭐ | Spino+T-Rex   | `Spinorex hybrid, ultimate apex predator, massive T-rex body with enormous sail, huge crushing jaws, strong functional arms, dark red-brown #BF360C, orange sail #FF9800, golden glow #FFC107,`        |

---

# 8. 나머지 62종 완전한 프롬프트

> 아래는 MVP 20종을 제외한 62종의 완전한 프롬프트입니다.

---

## 8.1 초식 공룡 (20종)

---

### #02 켄트로사우루스 (Kentrosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Kentrosaurus dinosaur, paired shoulder spikes and small back plates, olive green body #689F38, brown spike highlights #8D6E63, long spiked tail, slightly more detailed, standing idle pose, relaxed stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #03 후아양고사우루스 (Huayangosaurus) - S, Common

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Huayangosaurus dinosaur, primitive stegosaur, mixed small plates and spikes, light green body #7CB342, beige accents #A1887F, compact body, standing idle pose, relaxed stance, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #05 스티라코사우루스 (Styracosaurus) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Styracosaurus dinosaur, large single nose horn, frill with multiple long spikes, reddish-brown body #A1887F, red frill accents #E57373, polished appearance, richer colors, standing idle pose, proud stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #06 프로토케라톱스 (Protoceratops) - S, Common

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Protoceratops dinosaur, parrot-like beak, small frill without horns, sandy beige body #D7CCC8, light brown frill #BCAAA4, sheep-sized, standing idle pose, relaxed stance, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #07 파키리노사우루스 (Pachyrhinosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Pachyrhinosaurus dinosaur, flat bony boss on nose, ornate frill with small horns, blue-gray body #78909C, light blue markings #90CAF9, slightly more detailed, standing idle pose, relaxed stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #08 코스모케라톱스 (Kosmoceratops) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Kosmoceratops dinosaur, most ornate frill with 15 horn projections, colorful frill orange #FF7043 and yellow #FDD835, brown body #6D4C41, polished appearance, richer colors, standing idle pose, proud display stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #10 노도사우루스 (Nodosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Nodosaurus dinosaur, armored without tail club, rows of bony nodules, shoulder spikes, grayish-brown #757575, lighter nodules #9E9E9E, slightly more detailed, standing idle pose, defensive stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #11 폴라칸투스 (Polacanthus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Polacanthus dinosaur, spiky armored back with large shoulder spines, no tail club, greenish-gray body #607D8B, darker spines #455A64, slightly more detailed, standing idle pose, armored stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #12 파키케팔로사우루스 (Pachycephalosaurus) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Pachycephalosaurus dinosaur, thick domed skull with ring of small horns, bipedal stance, brownish-green #689F38, lighter dome #8BC34A, polished appearance, richer colors, standing idle pose, head-butt ready stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #13 스티기몰로크 (Stygimoloch) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Stygimoloch dinosaur, smaller dome with cluster of horns pointing backward, bipedal, reddish-brown #A1887F, darker horns #7B5544, punk-rock look, slightly more detailed, standing idle pose, edgy stance, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #14 드라코렉스 (Dracorex) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Dracorex dinosaur, flat skull with many spiky horns creating dragon-like appearance, no dome, dark green #2E7D32, darker horns #1B5E20, slightly more detailed, standing idle pose, dragon-like stance, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #16 아파토사우루스 (Apatosaurus) - XL, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Apatosaurus dinosaur, very long neck and whip-like tail, massive body, gray-green #78909C, lighter underbelly #B0BEC5, horizontal neck, polished appearance, richer colors, standing idle pose, gentle giant stance, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #17 디플로도쿠스 (Diplodocus) - XL, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Diplodocus dinosaur, extremely long thin neck and very long whip tail, slender body, olive brown #6D4C41, lighter stripe pattern #8D6E63, polished appearance, richer colors, standing idle pose, elegant long stance, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #18 아르젠티노사우루스 (Argentinosaurus) - XXL, Legendary

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Argentinosaurus dinosaur, one of the largest dinosaurs, incredibly massive body, thick column legs, gray #757575, stripe patterns #9E9E9E, golden rim light, majestic aura, standing idle pose, colossal titan stance, sprite size 384x384 pixels, 6x6 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #19 카마라사우루스 (Camarasaurus) - L, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Camarasaurus dinosaur, shorter neck, boxy blunt skull, robust compact body, tan brown #A1887F, beige underbelly #D7CCC8, slightly more detailed, standing idle pose, sturdy stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #20 니게르사우루스 (Nigersaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Nigersaurus dinosaur, wide straight-edged mouth like vacuum, short neck held near ground, greenish #558B2F, lighter green #8BC34A, slightly more detailed, standing idle pose, grazing stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #22 코리토사우루스 (Corythosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Corythosaurus dinosaur, tall helmet-like rounded crest, duck-billed, brown body #795548, cream underbelly, orange crest #FF8A65, slightly more detailed, standing idle pose, crest displayed, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #23 에드몬토사우루스 (Edmontosaurus) - L, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Edmontosaurus dinosaur, large hadrosaur without crest, duck-billed flat head, olive green #6B8E23, lighter underbelly #9ACD32, slightly more detailed, standing idle pose, relaxed stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #24 이구아노돈 (Iguanodon) - L, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Iguanodon dinosaur, distinctive thumb spike on each hand, quadrupedal or bipedal, green-brown #558B2F, darker accents #33691E, slightly more detailed, standing idle pose, thumb spikes visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #25 마이아사우라 (Maiasaura) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance, Maiasaura dinosaur, small solid crest ridge above eyes, duck-billed hadrosaur, greenish-brown #7CB342, lighter accents #AED581, nurturing expression, slightly more detailed, standing idle pose, caring stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 8.2 육식 공룡 (16종)

---

### #28 데이노니쿠스 (Deinonychus) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Deinonychus dinosaur, larger raptor, prominent sickle claws, feathered arms, reddish-brown #D84315, orange feather stripes #FF8A65, athletic build, polished appearance, richer colors, standing idle pose, hunting ready stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #29 유타랩터 (Utahraptor) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Utahraptor dinosaur, largest raptor, massive sickle claws, heavily feathered, dark brown #5D4037, red feather markings #E53935, powerful build, polished appearance, richer colors, standing idle pose, alpha raptor stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #30 트로오돈 (Troodon) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Troodon dinosaur, large brain smartest dinosaur, big forward-facing eyes for night vision, slender feathered, gray-green #607D8B, lighter #90A4AE, slightly more detailed, standing idle pose, intelligent alert stance, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #31 오비랩터 (Oviraptor) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Oviraptor dinosaur, parrot-like toothless beak, tall crest, feathered body, colorful orange #FF7043, blue feathers #42A5F5, bird-like appearance, slightly more detailed, standing idle pose, curious stance, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #32 갈리미무스 (Gallimimus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Gallimimus dinosaur, ostrich-like body, long neck, toothless beak, long legs for running, beige-tan #D7CCC8, brown stripes #A1887F, speedy appearance, slightly more detailed, standing idle pose, ready to run stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #35 케라토사우루스 (Ceratosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Ceratosaurus dinosaur, horn on nose, small osteoderms along back, red-brown #C62828, darker horn #8D6E63, aggressive but cute, slightly more detailed, standing idle pose, horn displayed stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #37 마준가사우루스 (Majungasaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Majungasaurus dinosaur, single horn bump on head, short snout, stocky powerful build, grayish-brown #795548, darker bump #5D4037, slightly more detailed, standing idle pose, sturdy stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #39 바리오닉스 (Baryonyx) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Baryonyx dinosaur, long crocodile-like snout with many teeth, large thumb claw, fish-eating, gray-green #607D8B, darker claws #455A64, polished appearance, richer colors, standing idle pose, fishing stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #40 수코미무스 (Suchomimus) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Suchomimus dinosaur, crocodile-like long snout, low sail ridge on back, long arms with claws, olive green #558B2F, darker sail #33691E, polished appearance, richer colors, standing idle pose, sail displayed stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #41 메트리아칸토사우루스 (Metriacanthosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Metriacanthosaurus dinosaur, moderate spine height creating small ridge, medium theropod, brownish-red #8D6E63, darker spines #6D4C41, slightly more detailed, standing idle pose, ridge displayed stance, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #45 카르카로돈토사우루스 (Carcharodontosaurus) - XL, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, powerful appearance, fierce but friendly predator, powerful stance, Carcharodontosaurus dinosaur, shark-toothed lizard, massive skull with serrated teeth, sandy brown #A1887F, darker stripes #795548, premium quality, subtle inner glow, standing idle pose, apex predator stance, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #46 아크로칸토사우루스 (Acrocanthosaurus) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Acrocanthosaurus dinosaur, high spines forming muscular ridge on back, powerful arms, gray #757575, darker ridge #616161, polished appearance, richer colors, standing idle pose, ridge displayed stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #47 알베르토사우루스 (Albertosaurus) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Albertosaurus dinosaur, smaller more agile tyrannosaur, lighter build, greenish-brown #558B2F, darker stripes #33691E, pack hunter expression, polished appearance, richer colors, standing idle pose, agile stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #48 타르보사우루스 (Tarbosaurus) - XL, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, powerful appearance, fierce but friendly predator, powerful stance, Tarbosaurus dinosaur, Asian tyrannosaur cousin of T-rex, massive build but narrower skull, darker brown #4E342E, lighter underbelly #8D6E63, premium quality, subtle inner glow, standing idle pose, dominant stance, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #49 다스플레토사우루스 (Daspletosaurus) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Daspletosaurus dinosaur, tyrannosaur predecessor to T-rex, robust powerful skull, reddish-brown #8D6E63, red-orange stripes #D84315, polished appearance, richer colors, standing idle pose, powerful stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #50 고르고사우루스 (Gorgosaurus) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, fierce but friendly predator, powerful stance, Gorgosaurus dinosaur, slender agile tyrannosaur, lighter faster build, gray-green #607D8B, darker stripes #455A64, sleek appearance, polished appearance, richer colors, standing idle pose, sleek stance, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 8.3 익룡 (10종)

---

### #51 디모르포돈 (Dimorphodon) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Dimorphodon pterosaur, large head with deep beak, small body, short wings, colorful head red #F44336 and yellow #FDD835, brown body #795548, slightly more detailed, soaring pose, wings spread, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #52 람포린쿠스 (Rhamphorhynchus) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Rhamphorhynchus pterosaur, long tail with diamond vane at end, needle-like teeth, slender wings, brownish #8D6E63, darker tail #6D4C41, slightly more detailed, soaring pose, tail vane visible, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #53 아누로그나투스 (Anurognathus) - XS, Common

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Anurognathus pterosaur, tiny frog-headed pterosaur, short wide head, very small body, fuzzy brown #795548, lighter fuzzy #A1887F, adorable appearance, soaring pose, tiny wings spread, sprite size 64x64 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #54 프테로닥틸루스 (Pterodactylus) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Pterodactylus pterosaur, classic small pterosaur, no head crest, slender pointed beak, light brown #A1887F, darker wing membrane #8D6E63, slightly more detailed, soaring pose, classic pterosaur silhouette, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #56 투판닥틸루스 (Tupandactylus) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Tupandactylus pterosaur, enormous sail-like head crest much larger than head, colorful crest red #F44336 and blue #2196F3, brown body #795548, polished appearance, richer colors, soaring pose, magnificent crest displayed, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #57 타페자라 (Tapejara) - S, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Tapejara pterosaur, distinctive triangular sail-like head crest, toothless short beak, green body #4CAF50, orange crest #FF9800, fruit-eater, slightly more detailed, soaring pose, crest displayed, sprite size 96x96 pixels, 1x1 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #58 트로펙그나투스 (Tropeognathus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Tropeognathus pterosaur, keeled crests on both upper and lower jaws, fish-eating, gray-blue #607D8B, darker jaw keels #455A64, slightly more detailed, soaring pose, jaw crests visible, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #60 하체고프테릭스 (Hatzegopteryx) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Hatzegopteryx pterosaur, massive robust pterosaur, shorter stouter neck, powerful wide beak, gray-brown #795548, darker head #5D4037, premium quality, subtle inner glow, soaring or standing pose, massive scale visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #61 오르니토케이루스 (Ornithocheirus) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Ornithocheirus pterosaur, keeled crest on snout tip, large wingspan, fish-eating, bluish-gray #546E7A, lighter accent #78909C, polished appearance, richer colors, soaring pose, snout crest visible, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #62 안항게라 (Anhanguera) - M, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic flying reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, graceful flying reptile, wings spread, Anhanguera pterosaur, twin keeled crests on upper and lower jaws, long beak, tan and gray #A1887F, darker keel accents #8D6E63, polished appearance, richer colors, soaring pose, dual keels visible, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 8.4 해양 파충류 (8종)

---

### #64 엘라스모사우루스 (Elasmosaurus) - XL, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Elasmosaurus marine reptile, extremely long snake-like neck longest of any plesiosaur, tiny head, blue-green #0097A7, lighter underbelly #80DEEA, premium quality, subtle inner glow, swimming pose, neck curved gracefully, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #65 크로노사우루스 (Kronosaurus) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Kronosaurus marine reptile, short-necked pliosaur, massive powerful head with long jaws, four strong flippers, dark blue-gray #37474F, lighter underbelly #78909C, premium quality, subtle inner glow, swimming pose, powerful jaws visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #66 리오플레우로돈 (Liopleurodon) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Liopleurodon marine reptile, short-necked pliosaur, large elongated head, powerful four flippers, dark green #2E7D32, lighter underbelly #81C784, premium quality, subtle inner glow, swimming pose, fearsome head visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #67 이크티오사우루스 (Ichthyosaurus) - M, Uncommon

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Ichthyosaurus marine reptile, dolphin-shaped streamlined body, large round eyes, dorsal fin, crescent tail fin, blue-gray #546E7A, lighter underbelly #B0BEC5, slightly more detailed, swimming pose, dolphin-like silhouette, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #68 숀이사우루스 (Shonisaurus) - XL, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Shonisaurus marine reptile, enormous whale-sized ichthyosaur, toothless jaws in adults, massive streamlined, dark gray #455A64, lighter underbelly #90A4AE, polished appearance, richer colors, swimming pose, massive whale-like form, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #69 템노돈토사우루스 (Temnodontosaurus) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Temnodontosaurus marine reptile, large ichthyosaur, notably biggest eyes for deep diving, powerful swimmer, gray-blue #607D8B, big light blue eyes #B3E5FC, polished appearance, richer colors, swimming pose, huge eyes prominent, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #71 타일로사우루스 (Tylosaurus) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Tylosaurus marine reptile, streamlined mosasaur, pointed snout without teeth at tip, sleek powerful body, gray-green #455A64, lighter underbelly #78909C, premium quality, subtle inner glow, swimming pose, sleek predator form, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #72 프로그나토돈 (Prognathodon) - L, Rare

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but majestic marine reptile, big expressive friendly eyes, slightly exaggerated proportions, smooth rounded forms, approachable appearance, streamlined aquatic body, swimming pose, Prognathodon marine reptile, robust stocky mosasaur, powerful crushing jaws for shelled prey, brownish #5D4037, lighter underbelly #8D6E63, polished appearance, richer colors, swimming pose, powerful jaws visible, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 8.5 하이브리드 (8종)

---

### #75 스테고케라톱스 (Stegoceratops) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Stegoceratops hybrid dinosaur, Stegosaurus and Triceratops combined, back plates AND head frill with horns, green body #4CAF50, orange plate and frill highlights #FF7043, premium quality, subtle inner glow, standing idle pose, both features displayed, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #76 앙킬로닥틸루스 (Ankylodactylus) - M, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Ankylodactylus hybrid dinosaur, armored flying pterosaur, wings with bony armor plating, club-like tail, head crest, gray-blue armored #546E7A, darker armor #455A64, premium quality, subtle inner glow, soaring pose, armored wings spread, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #77 스피노랩터 (Spinoraptor) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Spinoraptor hybrid dinosaur, raptor body with sail on back, elongated snout, large sickle claws, feathered arms, teal body #00796B, orange sail #FF9800, premium quality, subtle inner glow, standing idle pose, sail and claws displayed, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #78 카르노랩터 (Carnoraptor) - M, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Carnoraptor hybrid dinosaur, raptor body with bull horns, feathered with flame-colored plumage, red #D84315, orange #FF7043, yellow #FDD835, sickle claws, premium quality, subtle inner glow, standing idle pose, horns and claws visible, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #79 파키라이노사우루스 하이브리드 (Pachyrinosaurus Hybrid) - L, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Pachyrinosaurus hybrid dinosaur, thick domed skull combined with frill and horns, heavily armored head, gray-brown #78909C, blue dome and frill #42A5F5, premium quality, subtle inner glow, standing idle pose, armored head displayed, sprite size 192x192 pixels, 3x3 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #80 디모르포테리움 (Dimorphotherium) - M, Epic

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Dimorphotherium hybrid dinosaur, flying creature with massive scythe claws, large head from Dimorphodon, feathered with wings, purple #7B1FA2, green plumage #4CAF50, premium quality, subtle inner glow, soaring pose, claws extended, sprite size 128x128 pixels, 2x2 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #81 모사렉스 (Mosarex) - XL, Legendary

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Mosarex hybrid dinosaur, semi-aquatic T-rex, massive powerful jaws, paddle-like limbs for swimming, powerful tail with fin, dark blue-gray #37474F, lighter underbelly #78909C, blue bioluminescent accents #2196F3, golden rim light, majestic aura, swimming pose, apex aquatic predator, sprite size 256x256 pixels, 4x4 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### #82 스피노렉스 (Spinorex) - XXL, Legendary

**Idle**

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day art style, cute but powerful dinosaur creature, big expressive eyes, slightly exaggerated proportions, smooth rounded forms, powerful appearance, bio-engineered hybrid, subtle bioluminescent glow, Spinorex hybrid dinosaur, ultimate apex predator, massive T-rex body with enormous sail, huge crushing jaws, strong functional arms, dark red-brown #BF360C, orange sail #FF9800, golden bioluminescent accents #FFC107, golden rim light, majestic aura, standing idle pose, ultimate predator stance, sprite size 384x384 pixels, 6x6 game grid, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 📊 진행 체크리스트

| 카테고리   | 수량     | 완료           |
| ---------- | -------- | -------------- |
| 초식       | 25종     | ✅ 25 / 25     |
| 육식       | 25종     | ✅ 25 / 25     |
| 익룡       | 12종     | ✅ 12 / 12     |
| 해양       | 10종     | ✅ 10 / 10     |
| 하이브리드 | 10종     | ✅ 10 / 10     |
| **총합**   | **82종** | **✅ 82 / 82** |

**모든 82종 완전한 프롬프트 작성 완료! ✅**

---

_다이노 파크 타이쿤 - 에셋 프롬프트 (공룡편) v3.0_
_최종 업데이트: 2026년 2월_
