# 🎨 다이노 파크 타이쿤 - 에셋 프롬프트 (스킨편)

## 공룡 스킨 + 위인 스킨 체크리스트 & 기본 프롬프트

---

# 📖 사용 가이드

## 파일명 규칙

### 공룡 스킨

```
dino_{id}_{이름}_skin_{등급}_{상태}.png
```

**등급:**

- `rare` - 레어 (색상 변경)
- `epic` - 에픽 (패턴 + 이펙트)
- `legendary` - 레전드 (완전 리디자인)
- `s1` ~ `s4` - 시즌 한정

**예시:**

```
dino_001_stegosaurus_skin_rare_idle.png
dino_015_tyrannosaurus_skin_epic_portrait.png
dino_074_indominus_skin_legendary_idle.png
dino_001_stegosaurus_skin_s1_idle.png
```

### 위인 스킨

```
figure_{id}_{이름}_skin_{등급}_{상태}.png
```

**예시:**

```
figure_001_darwin_skin_rare_idle.png
figure_001_darwin_skin_s1_portrait.png
```

## 폴더 구조

```
apps/client/src/assets/
├── dinosaurs/
│   └── skins/
│       ├── rare/
│       │   ├── dino_001_stegosaurus_skin_rare_idle.png
│       │   └── ...
│       ├── epic/
│       │   └── ...
│       ├── legendary/
│       │   └── ...
│       └── seasonal/
│           ├── s1/
│           ├── s2/
│           ├── s3/
│           └── s4/
│
└── characters/
    └── great_figures/
        └── skins/
            ├── rare/
            ├── epic/
            ├── legendary/
            └── seasonal/
```

---

# 📋 목차

1. [스킨 스타일 가이드](#1-스킨-스타일-가이드)
2. [기본 스킨 프롬프트 (MVP)](#2-기본-스킨-프롬프트-mvp)
3. [공룡 스킨 체크리스트](#3-공룡-스킨-체크리스트)
4. [위인 스킨 체크리스트](#4-위인-스킨-체크리스트)

---

# 1. 스킨 스타일 가이드

## 등급별 스타일 차이

### 레어 (Rare) ⭐

```
스타일 키워드:
- alternate color palette
- subtle color variation
- different shade tones
- minor pattern changes

효과: 없음
```

### 에픽 (Epic) ⭐⭐

```
스타일 키워드:
- unique pattern markings
- special stripe or spot patterns
- subtle magical glow
- faint aura effect

효과: soft glow, faint particles
```

### 레전드 (Legendary) ⭐⭐⭐

```
스타일 키워드:
- completely redesigned appearance
- metallic or crystalline features
- majestic royal design
- ethereal magical elements
- golden rim light, majestic aura

효과: golden glow, particle effects, light trails
```

### 시즌 한정 🌟

```
시즌 1 (봄 - 에메랄드):
- spring flower decorations
- cherry blossom patterns
- fresh green accents

시즌 2 (여름 - 딥블루):
- ocean themed accessories
- coral and seashell decorations
- tropical vibrant colors

시즌 3 (가을 - 선셋):
- autumn leaf patterns
- warm orange and red tones
- harvest festival decorations

시즌 4 (겨울 - 화이트록):
- ice crystal decorations
- snow patterns
- winter holiday accessories
```

---

# 2. 기본 스킨 프롬프트 (MVP)

> 당장 사용할 인기 공룡 10종의 레어/에픽/레전드 스킨

---

## 2.1 스테고사우루스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Stegosaurus rare skin variant, alternate blue-gray color scheme #607D8B, darker plate colors #455A64, subtle pattern variation on plates, standing idle pose neutral expression, friendly cute appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Stegosaurus epic skin variant, deep purple body color #7B1FA2, golden plate edges #FFD700, tribal stripe patterns on body, soft magical glow effect, faint purple aura, standing idle pose neutral expression, majestic appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Stegosaurus legendary skin variant, crystalline body appearance, translucent crystal plates glowing cyan #00BCD4, ethereal ice-like texture, golden rim light, majestic aura, magical particle effects around body, royal crown-like head crest, standing idle pose regal expression, mythical legendary appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.2 트리케라톱스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Triceratops rare skin variant, sandy brown body color #A1887F, darker frill edge #795548, desert camouflage pattern, standing idle pose neutral expression, friendly cute appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Triceratops epic skin variant, deep red body color #C62828, golden horn tips #FFD700, war paint tribal markings on frill, soft fiery glow effect, faint red aura, standing idle pose proud expression, warrior appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Triceratops legendary skin variant, obsidian black body with golden veins #212121, metallic gold horns and frill edge #FFD700, ancient rune patterns glowing on frill, golden rim light, majestic aura, magical particle effects, royal armored appearance, standing idle pose noble expression, mythical legendary appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.3 티라노사우루스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Tyrannosaurus Rex rare skin variant, dark slate gray body color #37474F, lighter underbelly #546E7A, subtle stripe pattern on back, standing idle pose neutral expression, intimidating yet cute appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Tyrannosaurus Rex epic skin variant, blood red body color #B71C1C, black stripe patterns, glowing red eyes, soft fiery aura effect, tribal war markings, standing idle pose fierce expression, alpha predator appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Tyrannosaurus Rex legendary skin variant, molten lava skin appearance with cracks showing inner fire glow #FF5722, obsidian armor plates on body, flaming crown-like head crest, golden rim light, majestic aura, fire particle effects around feet, volcanic king appearance, standing idle pose regal fierce expression, mythical legendary appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.4 벨로키랍토르 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Velociraptor rare skin variant, forest green body color #2E7D32, darker stripe pattern #1B5E20, jungle camouflage appearance, standing idle pose alert expression, sleek predator appearance, sprite size 96x96 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Velociraptor epic skin variant, midnight blue body color #1A237E, electric blue stripe accents #2196F3, lightning bolt patterns, soft electric glow effect, faint blue energy aura, standing idle pose fierce expression, storm hunter appearance, sprite size 96x96 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Velociraptor legendary skin variant, shadow phantom appearance with dark purple body #311B92, ethereal wisps trailing from body, glowing purple eyes, golden rim light, majestic aura, shadow particle effects, ghostly translucent edges, ninja assassin appearance, standing idle pose mysterious expression, mythical legendary appearance, sprite size 96x96 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.5 브라키오사우루스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Brachiosaurus rare skin variant, ocean teal body color #00796B, lighter underbelly #4DB6AC, subtle wave pattern markings, standing idle pose gentle expression, majestic gentle giant appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Brachiosaurus epic skin variant, sunset orange body gradient #FF7043 to #FFCA28, cloud pattern markings on body, soft golden glow effect, faint sun aura around head, standing idle pose serene expression, sky guardian appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Brachiosaurus legendary skin variant, celestial starry night body appearance #1A237E with glowing star constellation patterns, nebula swirl markings, cosmic dust particles around body, golden rim light, majestic aura, aurora borealis effect on neck, cosmic guardian appearance, standing idle pose divine expression, mythical legendary appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.6 스피노사우루스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Spinosaurus rare skin variant, swamp green body color #558B2F, muddy brown accents #5D4037, wetland camouflage pattern, standing idle pose neutral expression, river hunter appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Spinosaurus epic skin variant, deep ocean blue body color #0D47A1, bioluminescent cyan spots #00E5FF, glowing sail fin with wave patterns, soft aqua glow effect, water droplet particles, standing idle pose powerful expression, ocean lord appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Spinosaurus legendary skin variant, abyssal black body with deep sea bioluminescent patterns #00BFA5, translucent crystalline sail fin glowing cyan, ancient leviathan markings, golden rim light, majestic aura, water and mist particle effects, kraken-like tentacle patterns on body, standing idle pose commanding expression, mythical legendary appearance, sprite size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.7 프테라노돈 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Pteranodon rare skin variant, sunset pink body color #F48FB1, lighter wing membranes #FCE4EC, tropical bird appearance, perched idle pose curious expression, graceful flyer appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Pteranodon epic skin variant, storm gray body color #455A64, electric yellow lightning patterns on wings #FFEB3B, crackling energy effect, soft electric glow, wind swirl particles, perched idle pose fierce expression, storm rider appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Pteranodon legendary skin variant, phoenix-like appearance with gradient red to gold body #FF5722 to #FFD700, flaming wing edges, ethereal fire feather patterns, golden rim light, majestic aura, flame and ember particle effects, mythical firebird appearance, perched idle pose majestic expression, mythical legendary appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.8 모사사우루스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mosasaurus rare skin variant, arctic white body color #ECEFF1, light blue accents #B3E5FC, polar ice appearance, swimming idle pose calm expression, ice ocean predator appearance, sprite size 256x256 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mosasaurus epic skin variant, deep violet body color #4A148C, bioluminescent teal spots #18FFFF, glowing patterns along body, soft ethereal glow effect, bubble particles around, swimming idle pose mysterious expression, abyssal hunter appearance, sprite size 256x256 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mosasaurus legendary skin variant, ancient sea dragon appearance with jade green scales #00695C, golden ornate patterns like chinese dragon, crystalline fin ridges, golden rim light, majestic aura, mystical water and mist effects, dragon whiskers and horns, swimming idle pose divine expression, mythical legendary appearance, sprite size 256x256 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.9 안킬로사우루스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ankylosaurus rare skin variant, rust red body color #BF360C, darker armor plates #8D6E63, desert warrior appearance, standing idle pose defensive expression, armored tank appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ankylosaurus epic skin variant, volcanic black body color #212121, glowing orange crack patterns like lava #FF6D00, molten armor plates, soft fiery glow effect, ember particles around body, standing idle pose fierce expression, volcanic fortress appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ankylosaurus legendary skin variant, ancient golem appearance with stone and gold body #5D4037, embedded glowing gems in armor plates, crystalline club tail, ornate golden trim on armor edges, golden rim light, majestic aura, earth and crystal particle effects, standing idle pose noble guardian expression, mythical legendary appearance, sprite size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.10 인도미누스 렉스 스킨

### 레어 스킨 (Rare)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Indominus Rex rare skin variant, albino white body color #FAFAFA, pale blue accents #E3F2FD, ghost-like appearance, standing idle pose menacing expression, apex predator appearance, sprite size 256x256 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Indominus Rex epic skin variant, camouflage shifting body with purple to teal gradient #6A1B9A to #00897B, adaptive pattern markings, soft ethereal shimmer effect, distortion particle effects, standing idle pose calculating expression, ultimate predator appearance, sprite size 256x256 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game dinosaur sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Indominus Rex legendary skin variant, void terror appearance with pure black body absorbing light, glowing red veins and eyes #FF1744, dark matter particles swirling around, crimson crown spikes, golden rim light contrast, majestic dark aura, reality distortion particle effects, omega predator appearance, standing idle pose dominant expression, mythical legendary appearance, sprite size 256x256 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 3. 공룡 스킨 체크리스트

> 총 82종 × 3등급 × 5상태 = 1,230개 + 시즌 스킨

## 체크리스트 범례

- ✅ 프롬프트 완료
- ⬜ 미완료

---

## 3.1 초식 공룡 (25종)

| ID  | 공룡명             | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | ------------------ | ---- | ---- | --------- | --- | --- | --- | --- |
| 001 | 스테고사우루스     | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 002 | 트리케라톱스       | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 003 | 브라키오사우루스   | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 004 | 파라사우롤로푸스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 005 | 안킬로사우루스     | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 006 | 디플로도쿠스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 007 | 아파토사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 008 | 이구아노돈         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 009 | 파키케팔로사우루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 010 | 갈리미무스         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 011 | 테리지노사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 012 | 마이아사우라       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 013 | 에드몬토사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 014 | 코리토사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 021 | 켄트로사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 022 | 스티라코사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 023 | 프로토케라톱스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 024 | 카마라사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 025 | 플라테오사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 026 | 람베오사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 027 | 오우라노사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 028 | 니게르사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 029 | 아마르가사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 030 | 무타부라사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 031 | 프시타코사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

**초식 완료율:** 5/25 (20%)

---

## 3.2 육식 공룡 (25종)

| ID  | 공룡명               | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | -------------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 015 | 티라노사우루스       | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 016 | 벨로키랍토르         | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 017 | 스피노사우루스       | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 018 | 알로사우루스         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 019 | 카르노타우루스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 020 | 딜로포사우루스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 032 | 기가노토사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 033 | 카르카로돈토사우루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 034 | 바리오닉스           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 035 | 수코미무스           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 036 | 아크로칸토사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 037 | 케라토사우루스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 038 | 메갈로사우루스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 039 | 헤레라사우루스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 040 | 코엘로피시스         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 041 | 콤프소그나투스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 042 | 데이노니쿠스         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 043 | 유타랍토르           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 044 | 마이크로랍토르       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 045 | 오비랍토르           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 046 | 트로오돈             | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 047 | 마중가사우루스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 048 | 이리타토르           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 049 | 메트리아칸토사우루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 050 | 프로케라토사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

**육식 완료율:** 3/25 (12%)

---

## 3.3 익룡 (12종)

| ID  | 공룡명           | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | ---------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 052 | 프테라노돈       | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 053 | 케찰코아틀루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 054 | 디모르포돈       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 055 | 람포링쿠스       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 056 | 타페자라         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 057 | 프테로닥틸루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 058 | 트로페오그나투스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 059 | 안항게라         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 060 | 둥가립테루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 061 | 오르니토케이루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 062 | 하체곱테릭스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 063 | 닉토사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

**익룡 완료율:** 1/12 (8%)

---

## 3.4 해양 파충류 (10종)

| ID  | 공룡명           | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | ---------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 064 | 모사사우루스     | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 065 | 플레시오사우루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 066 | 엘라스모사우루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 067 | 리오플레우로돈   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 068 | 이크티오사우루스 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 069 | 크로노사우루스   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 070 | 틸로사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 071 | 쇼니사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 072 | 노토사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 073 | 다코사우루스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

**해양 완료율:** 1/10 (10%)

---

## 3.5 하이브리드 (10종)

| ID  | 공룡명          | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | --------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 074 | 인도미누스 렉스 | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 075 | 인도랍토르      | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 076 | 스테고케라톱스  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 077 | 스피노랍토르    | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 078 | 안킬로도쿠스    | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 079 | 카르노랍토르    | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 080 | 피리타토르      | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 081 | 디플로타토르    | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 082 | 기가노케팔루스  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 083 | 울티마사우루스  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

**하이브리드 완료율:** 1/10 (10%)

---

## 📊 공룡 스킨 전체 진행률

| 카테고리   | 완료   | 전체   | 비율    |
| ---------- | ------ | ------ | ------- |
| 초식       | 5      | 25     | 20%     |
| 육식       | 3      | 25     | 12%     |
| 익룡       | 1      | 12     | 8%      |
| 해양       | 1      | 10     | 10%     |
| 하이브리드 | 1      | 10     | 10%     |
| **합계**   | **11** | **82** | **13%** |

> 기본 등급(Rare/Epic/Legendary) 기준
> 시즌 스킨은 별도 진행 필요

---

# 3. 위인 스킨 프롬프트 (MVP)

> 핵심 위인 10명의 레어/에픽/레전드 스킨

---

## 3.1 찰스 다윈 스킨 (Charles Darwin)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Charles Darwin rare skin variant, Victorian explorer outfit in navy blue color scheme #1A237E, different coat pattern, silver pocket watch detail, alternate beard style slightly shorter, subtle color variation, standing idle pose thoughtful expression, distinguished scientist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Charles Darwin epic skin variant, expedition leader outfit with golden compass emblem #FFD700, weathered adventure gear, explorer hat with feathers, glowing notebook with evolution sketches, soft knowledge aura effect, standing idle pose wise expression, legendary naturalist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Charles Darwin legendary skin variant, transcendent evolution sage appearance, ethereal robes with DNA helix patterns, floating Origin of Species book glowing with golden light, tree of life symbol behind, golden rim light, majestic aura, evolution particle effects showing species transforming, mythical father of evolution appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.2 메리 애닝 스킨 (Mary Anning)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mary Anning rare skin variant, Victorian fossil hunter in deep burgundy dress #880E4F, different bonnet style, weathered geology hammer, alternate fossil specimen in hand, subtle color variation, standing idle pose determined expression, pioneer paleontologist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mary Anning epic skin variant, master fossil hunter outfit with golden tools #FFD700, glowing ammonite pendant, ichthyosaur skeleton floating beside her, discovery aura effect, cliff backdrop hints, standing idle pose triumphant expression, legendary fossil discoverer appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mary Anning legendary skin variant, prehistoric ocean queen appearance, ethereal dress made of fossilized patterns, plesiosaur and ichthyosaur spirits swirling around her, crystalline geological hammer, golden rim light, majestic aura, ancient sea creature particle effects, mythical mother of paleontology appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.3 오웬 그래디 스킨 (Owen Grady)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Owen Grady rare skin variant, tactical vest in desert tan color scheme #8D6E63, different camouflage pattern, alternate utility belt, rugged field gear, subtle color variation, standing idle pose confident expression, veteran raptor trainer appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Owen Grady epic skin variant, elite raptor squad leader outfit, black tactical gear with blue raptor claw emblems #2196F3, holographic raptor control interface on wrist, glowing clicker device, soft alpha pack aura, standing idle pose commanding expression, legendary dinosaur whisperer appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Owen Grady legendary skin variant, primal bond master appearance, tribal armor with raptor scales and feathers, ghostly Blue raptor spirit companion beside him, ancient pack leader markings glowing, golden rim light, majestic aura, raptor pack spirit particles swirling, mythical alpha of all dinosaurs appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.4 존 해먼드 스킨 (John Hammond)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, John Hammond rare skin variant, white linen suit in cream color scheme #FFF8E1, different panama hat style, silver-topped amber cane, alternate bow tie color, subtle safari elegance, standing idle pose welcoming expression, distinguished park founder appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, John Hammond epic skin variant, visionary founder formal attire, white and gold suit with amber buttons #FFD700, glowing amber cane with mosquito visible inside, holographic park map floating beside, dream realization aura, standing idle pose proud expression, legendary park creator appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, John Hammond legendary skin variant, genesis creator god-like appearance, ethereal white robes with DNA constellation patterns, glowing amber scepter of creation, miniature dinosaur park orbiting around him, golden rim light, majestic aura, life creation particle effects, mythical father of dinosaur resurrection appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.5 헨리 우 스킨 (Henry Wu)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Henry Wu rare skin variant, lab coat in dark gray color scheme #424242, different safety goggles style, alternate clipboard design, serious researcher aesthetic, subtle color variation, standing idle pose calculating expression, chief geneticist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Henry Wu epic skin variant, elite geneticist outfit with purple accents #7B1FA2, holographic DNA manipulation interface, glowing test tubes with hybrid embryos, genius scientist aura, standing idle pose ambitious expression, legendary genetic engineer appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Henry Wu legendary skin variant, mad scientist god appearance, ethereal lab coat with swirling hybrid DNA patterns, Indominus Rex silhouette shadow behind, glowing genetic manipulation gauntlets, golden rim light, majestic dark aura, hybrid creature spirits swirling around, mythical creator of monsters appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.6 앨런 그랜트 스킨 (Alan Grant)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Alan Grant rare skin variant, field work outfit in khaki tan color scheme #A1887F, different fedora style, alternate bandana color, dusty expedition gear, subtle color variation, standing idle pose observant expression, veteran paleontologist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Alan Grant epic skin variant, master paleontologist expedition leader outfit, weathered adventure gear with golden fossil badges #FFD700, raptor claw necklace glowing, field journal with living dinosaur sketches, discovery aura, standing idle pose wise expression, legendary dinosaur expert appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Alan Grant legendary skin variant, prehistoric sage appearance, tribal robes with velociraptor feather patterns, ancient bone staff with amber gem, dinosaur spirits of discovered species surrounding him, golden rim light, majestic aura, fossil-to-life transformation particles, mythical bridge between past and present appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.7 엘리 새틀러 스킨 (Ellie Sattler)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ellie Sattler rare skin variant, botanist field outfit in forest green color scheme #2E7D32, different shorts and shirt style, alternate sun hat, plant specimen samples, subtle color variation, standing idle pose curious expression, paleobotanist researcher appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ellie Sattler epic skin variant, expert paleobotanist expedition outfit, golden leaf brooch #FFD700, glowing prehistoric plant samples floating around, bioluminescent fern specimens, nature wisdom aura, standing idle pose determined expression, legendary plant scientist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ellie Sattler legendary skin variant, primordial nature guardian appearance, ethereal dress woven from prehistoric leaves and flowers, giant fern crown, ancient plant spirits blooming around her, golden rim light, majestic aura, prehistoric ecosystem particle effects, mythical mother nature of dinosaur age appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.8 이안 말콤 스킨 (Ian Malcolm)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ian Malcolm rare skin variant, all black outfit in charcoal gray scheme #37474F, different leather jacket style, alternate sunglasses design, chaos theory book in hand, subtle color variation, standing idle pose skeptical expression, mathematician consultant appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ian Malcolm epic skin variant, chaos prophet outfit with fractal pattern accents #9C27B0, glowing butterfly effect visualizations around him, holographic chaos equations, dramatic black coat billowing, wisdom aura, standing idle pose knowing expression, legendary chaos theorist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ian Malcolm legendary skin variant, avatar of chaos appearance, ethereal black robes with fractal dimension patterns, reality-bending effects around him, butterfly wings made of mathematical equations, golden rim light, majestic paradox aura, probability particle effects showing multiple outcomes, mythical prophet of nature's unpredictability appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.9 클레어 디어링 스킨 (Claire Dearing)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Claire Dearing rare skin variant, park operations outfit in navy blue scheme #1565C0, different business suit style, alternate tablet design, professional manager aesthetic, subtle color variation, standing idle pose confident expression, park operations director appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Claire Dearing epic skin variant, dinosaur sanctuary leader outfit, action-ready attire with golden DPG badge #FFD700, holographic park status displays around her, tactical radio, leadership aura, standing idle pose determined expression, legendary park savior appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Claire Dearing legendary skin variant, guardian of dinosaurs goddess appearance, ethereal armor forged from park materials, protective force field with dinosaur silhouettes, crown made of sanctuary symbol, golden rim light, majestic protective aura, rescued dinosaur spirits surrounding her, mythical defender of prehistoric life appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 3.10 아서 (할아버지) 스킨 (Arthur - Grandfather)

### 레어 스킨 (Rare)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Arthur grandfather rare skin variant, vintage scientist outfit in sepia brown scheme #795548, different old lab coat style, alternate round glasses, classic research journal, subtle nostalgic color variation, standing idle pose gentle expression, beloved grandfather scientist appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 에픽 스킨 (Epic)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Arthur grandfather epic skin variant, legendary researcher formal attire, white coat with golden achievement medals #FFD700, glowing research notes with dinosaur resurrection formula, holographic message device, legacy wisdom aura, standing idle pose proud expression, legendary park creator grandfather appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 레전드 스킨 (Legendary)

```
2.5D isometric game character sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Arthur grandfather legendary skin variant, eternal guardian angel appearance, translucent ethereal form with warm golden glow, floating research legacy books around, watching over the park from beyond, grandfather clock symbolism, golden rim light, majestic loving aura, memory particle effects of shared moments, mythical eternal guardian of the dream appearance, sprite size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

# 4. 위인 스킨 체크리스트

> 총 50명 × 3등급 × 4상태 = 600개 + 시즌 스킨

## 4.1 과학자 (15명)

| ID  | 위인명              | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | ------------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 001 | 찰스 다윈           | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 002 | 메리 애닝           | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 003 | 리처드 오웬         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 004 | 기디언 맨텔         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 005 | 오스니얼 마쉬       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 006 | 에드워드 코프       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 007 | 바넘 브라운         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 008 | 잭 호너             | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 009 | 폴 세레노           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 010 | 쉬싱                | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 011 | 마리 퀴리           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 012 | 알베르트 아인슈타인 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 013 | 아이작 뉴턴         | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 014 | 제인 구달           | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 015 | 데이비드 애튼버러   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

## 4.2 조련사 (10명)

| ID  | 위인명        | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | ------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 016 | 오웬 그래디   | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 017 | 클레어 디어링 | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 018 | 앨런 그랜트   | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 019 | 엘리 새틀러   | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 020 | 이안 말콤     | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 021 | 멀둔          | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 022 | 헨리 우       | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 023 | 롤랜드 템보   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 024 | 빌리 브레넌   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 025 | 사라 하딩     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

## 4.3 경영진 (10명)

| ID  | 위인명          | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | --------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 026 | 존 해먼드       | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |
| 027 | 사이먼 마스라니 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 028 | 벤저민 록우드   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 029 | 일라이 밀스     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 030 | 피터 루드로     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 031 | 헨리 우 (CEO)   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 032 | 밀스 코퍼레이트 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 033 | 인젠 디렉터     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 034 | 마스라니 임원   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 035 | 파크 매니저     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

## 4.4 탐험가 (10명)

| ID  | 위인명       | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | ------------ | ---- | ---- | --------- | --- | --- | --- | --- |
| 036 | 모험가 01    | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 037 | 모험가 02    | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 038 | 화석 헌터 01 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 039 | 화석 헌터 02 | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 040 | 탐험대장     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 041 | 정글 가이드  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 042 | 해양 탐험가  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 043 | 동굴 다이버  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 044 | 항공 정찰대  | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 045 | 추적자       | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |

## 4.5 특별 인물 (6명)

| ID  | 위인명          | Rare | Epic | Legendary | S1  | S2  | S3  | S4  |
| --- | --------------- | ---- | ---- | --------- | --- | --- | --- | --- |
| 046 | 타임 트래블러   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 047 | 미래 과학자     | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 048 | 공룡 위스퍼러   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 049 | 전설의 조련사   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 050 | 궁극의 관리자   | ⬜   | ⬜   | ⬜        | ⬜  | ⬜  | ⬜  | ⬜  |
| 051 | 아서 (할아버지) | ✅   | ✅   | ✅        | ⬜  | ⬜  | ⬜  | ⬜  |

---

## 📊 위인 스킨 전체 진행률

| 카테고리 | 완료   | 전체   | 비율    |
| -------- | ------ | ------ | ------- |
| 과학자   | 2      | 15     | 13%     |
| 조련사   | 6      | 10     | 60%     |
| 경영진   | 1      | 10     | 10%     |
| 탐험가   | 0      | 10     | 0%      |
| 특별     | 1      | 6      | 17%     |
| **합계** | **10** | **51** | **20%** |

---

# 📋 전체 요약

| 항목      | MVP 완료            | 체크리스트 | 전체     |
| --------- | ------------------- | ---------- | -------- |
| 공룡 스킨 | 10종 × 3등급 = 30개 | ✅         | ~1,230개 |
| 위인 스킨 | 10명 × 3등급 = 30개 | ✅         | ~600개   |
| 시즌 스킨 | 0                   | ✅         | ~500개+  |

**MVP 완료 위인 (10명):**

- 찰스 다윈, 메리 애닝 (과학자)
- 오웬 그래디, 클레어 디어링, 앨런 그랜트, 엘리 새틀러, 이안 말콤, 헨리 우 (조련사)
- 존 해먼드 (경영진)
- 아서 할아버지 (특별)

**다음 작업:**

- 나머지 공룡 72종 스킨 프롬프트
- 나머지 위인 41명 스킨 프롬프트
- 시즌별 특별 스킨 프롬프트
