# 🏗️ 다이노 파크 타이쿤 - 에셋 프롬프트 (건물 업그레이드편)
## 건물 50종 × 레벨 5단계 (Lv.5/10/15/20/25) 업그레이드 가이드

---

# 📖 사용 가이드

## 업그레이드 레벨 시스템

| 레벨 | 외형 변화 | 키워드 |
|------|----------|--------|
| **Lv.1-3** | 기본 | basic design, simple structure |
| **Lv.5** | 확장 | expanded, additional features |
| **Lv.10** | 고급화 | advanced, premium materials |
| **Lv.15** | 특수 | specialized, unique elements |
| **Lv.20** | 최고급 | elite, luxurious details |
| **Lv.25** | 전설 | legendary, maximum upgrade, golden trim |

## 파일명 규칙

```
building_{id}_{영문이름}_lv{레벨}.png
```

**예시:**
```
building_001_hatchery_lv1.png
building_001_hatchery_lv5.png
building_001_hatchery_lv10.png
building_001_hatchery_lv15.png
building_001_hatchery_lv20.png
building_001_hatchery_lv25.png
```

## 폴더 구조

```
apps/client/src/assets/buildings/
├── core/
│   ├── building_001_hatchery_lv1.png
│   ├── building_001_hatchery_lv5.png
│   ├── building_001_hatchery_lv10.png
│   ├── building_001_hatchery_lv15.png
│   ├── building_001_hatchery_lv20.png
│   ├── building_001_hatchery_lv25.png
│   └── ...
└── ...
```

---

# 📋 목차

1. [업그레이드 프롬프트 템플릿](#1-업그레이드-프롬프트-템플릿)
2. [핵심 건물 업그레이드 예시](#2-핵심-건물-업그레이드-예시)
3. [특수 건물 프롬프트](#3-특수-건물-프롬프트)
4. [전체 체크리스트](#4-전체-체크리스트)

---

# 1. 업그레이드 프롬프트 템플릿

## 템플릿 사용법

```
1. 마스터 스타일 (asset_main.md에서 복사)
2. 건물 기본 정보 (buildings_characters.md에서 복사)
3. 레벨별 업그레이드 키워드 추가 (아래 참조)
4. 사이즈 및 파라미터 추가
```

## 레벨별 업그레이드 키워드

### Lv.5 키워드
```
level 5 upgrade, expanded structure, additional wing section, improved materials, copper accent details, minor decorative elements, slightly larger footprint, enhanced functionality visible,
```

### Lv.10 키워드
```
level 10 upgrade, significantly expanded complex, premium stone and metal materials, silver trim accents #C0C0C0, decorative banners and flags, multiple operational sections visible, professional facility appearance, enhanced equipment visible,
```

### Lv.15 키워드
```
level 15 upgrade, advanced specialized facility, rare material construction, crystal accent elements #00BCD4, glowing tech panels, automated systems visible, prestigious institution appearance, unique architectural features,
```

### Lv.20 키워드
```
level 20 upgrade, elite premium facility, luxurious marble and gold materials, golden ornamental details #FFD700, holographic displays visible, state-of-the-art equipment, landmark building status, impressive scale and grandeur,
```

### Lv.25 키워드 (최대 레벨)
```
level 25 maximum upgrade, legendary ultimate facility, mythical golden architecture with gleaming surfaces, diamond and crystal embedded decorations, ethereal glow effect, floating energy particles, monument to achievement, crown jewel of the park, awe-inspiring legendary presence,
```

---

# 2. 핵심 건물 업그레이드 예시

## 2.1 부화장 (Hatchery) 업그레이드

---

### 부화장 Lv.5

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Hatchery level 5 upgrade, egg incubation facility, dome structure with expanded glass panels, additional incubation wing attached, copper pipe details, more eggs visible inside, improved heating equipment, green accent #4CAF50, enhanced design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 부화장 Lv.10

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Hatchery level 10 upgrade, premium egg incubation complex, large multi-dome structure with silver trim #C0C0C0, advanced temperature control systems visible, multiple incubation chambers, decorative egg sculptures outside, professional scientific facility, green accent #4CAF50, prestigious design, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

### 부화장 Lv.15

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Hatchery level 15 upgrade, advanced specialized incubation center, crystalline dome roof with cyan glow #00BCD4, automated robotic arms visible inside, holographic monitoring displays, rare material construction, unique spiral tower element, green accent #4CAF50, futuristic design, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

### 부화장 Lv.20

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Hatchery level 20 upgrade, elite premium incubation palace, grand marble and gold structure, ornate golden dome #FFD700, floating holographic eggs display, luxurious royal architecture, state-of-the-art bio-technology visible, green accent #4CAF50, majestic design, building size 192x224 pixels, 2x2 grid, bottom-aligned, --ar 6:7 --v 6 --s 250 --q 2
```

---

### 부화장 Lv.25 (최대)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Hatchery level 25 maximum upgrade, legendary ultimate incubation sanctum, mythical golden architecture with gleaming crystalline domes, diamond-studded ornaments, ethereal golden glow emanating, floating energy particles around structure, ancient DNA helix symbol on top, monument to genetic mastery, crown jewel facility, green accent #4CAF50, legendary awe-inspiring design, building size 192x224 pixels, 2x2 grid, bottom-aligned, --ar 6:7 --v 6 --s 250 --q 2
```

---

## 2.2 DNA 연구소 (DNA Lab) 업그레이드

---

### DNA 연구소 Lv.5

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, DNA Lab level 5 upgrade, expanded research facility, additional laboratory wing, copper piping and equipment visible, more glass windows, enhanced DNA helix logo, improved ventilation systems, blue accent #2196F3, professional design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### DNA 연구소 Lv.10

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, DNA Lab level 10 upgrade, advanced research complex, silver frame construction #C0C0C0, multiple laboratory sections, rotating DNA helix hologram on roof, advanced centrifuge equipment visible, research flags and banners, blue accent #2196F3, prestigious scientific design, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

### DNA 연구소 Lv.15

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, DNA Lab level 15 upgrade, specialized genetic engineering center, crystalline research towers with cyan glow #00BCD4, CRISPR editing stations visible, quantum computers, floating data displays, unique helix-shaped architecture, blue accent #2196F3, cutting-edge design, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

### DNA 연구소 Lv.20

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, DNA Lab level 20 upgrade, elite genetic research palace, marble and gold laboratory complex, ornate golden DNA helix monument #FFD700, holographic genome maps floating, luxury research suites, world-class facility, blue accent #2196F3, majestic scientific design, building size 192x224 pixels, 2x2 grid, bottom-aligned, --ar 6:7 --v 6 --s 250 --q 2
```

---

### DNA 연구소 Lv.25 (최대)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, DNA Lab level 25 maximum upgrade, legendary ultimate genetics sanctum, mythical golden towers intertwined like DNA helix, crystalline genome core glowing at center, ethereal blue energy streams #2196F3, diamond-embedded research chambers, floating ancient genetic archives, monument to creation itself, legendary scientific marvel, building size 192x224 pixels, 2x2 grid, bottom-aligned, --ar 6:7 --v 6 --s 250 --q 2
```

---

## 2.3 초원 서식지 (Grassland Habitat) 업그레이드

---

### 초원 서식지 Lv.5

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Grassland Habitat level 5 upgrade, expanded dinosaur enclosure, larger fenced area with improved wooden fence, more trees and vegetation, enhanced feeding station, bigger water pond, small shelter structure, green accent #4CAF50, natural improved design, building size 224x256 pixels, 3x3 grid, bottom-aligned, --ar 7:8 --v 6 --s 250 --q 2
```

---

### 초원 서식지 Lv.10

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Grassland Habitat level 10 upgrade, premium dinosaur sanctuary, reinforced stone and wood fence with silver posts #C0C0C0, diverse plant ecosystem, waterfall feature, multiple feeding areas, comfortable shade structures, visitor viewing platform, green accent #4CAF50, professional habitat design, building size 224x256 pixels, 3x3 grid, bottom-aligned, --ar 7:8 --v 6 --s 250 --q 2
```

---

### 초원 서식지 Lv.15

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Grassland Habitat level 15 upgrade, specialized biome enclosure, crystalline force field boundary with cyan shimmer #00BCD4, automated climate control visible, enrichment toys and play structures, natural stream system, rare prehistoric plants, advanced monitoring equipment, green accent #4CAF50, high-tech natural design, building size 256x288 pixels, 3x3 grid, bottom-aligned, --ar 8:9 --v 6 --s 250 --q 2
```

---

### 초원 서식지 Lv.20

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Grassland Habitat level 20 upgrade, elite dinosaur paradise, ornate golden gate entrance #FFD700, lush botanical garden integration, luxury spa pool for dinosaurs, holographic environmental projections, marble pathways, VIP viewing pavilions, green accent #4CAF50, majestic paradise design, building size 256x288 pixels, 3x3 grid, bottom-aligned, --ar 8:9 --v 6 --s 250 --q 2
```

---

### 초원 서식지 Lv.25 (최대)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Grassland Habitat level 25 maximum upgrade, legendary prehistoric eden, mythical golden boundary arch glowing with ancient power, crystalline waterfalls with rainbow mist, ethereal floating islands of vegetation, bioluminescent plants at night, dinosaur happiness paradise, sacred sanctuary aura, legendary ultimate habitat, building size 256x288 pixels, 3x3 grid, bottom-aligned, --ar 8:9 --v 6 --s 250 --q 2
```

---

# 3. 특수 건물 프롬프트

> GDD에 언급되었지만 기존 문서에 없는 특수 건물

---

## 3.1 VR 체험관 (VR Experience Center)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, VR Experience Center building, futuristic dome structure, holographic dinosaur projection on top, sleek metallic panels, glowing cyan accent lights #00BCD4, visitors wearing VR headsets visible through windows, digital displays, immersive entertainment facility, purple accent #9C27B0, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

## 3.2 수중 전망실 (Underwater Observatory)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Underwater Observatory building, glass dome structure partially submerged, aquarium tunnel entrance, marine dinosaurs visible through glass, bubble effects, coral decorations, submarine aesthetic, deep blue accent #1565C0, building size 192x160 pixels, 3x2 grid, bottom-aligned, --ar 6:5 --v 6 --s 250 --q 2
```

---

## 3.3 익룡 비행쇼장 (Pterosaur Flight Arena)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Pterosaur Flight Arena building, open-air amphitheater with tall perching towers, net canopy above, stadium seating around central stage, pterosaur silhouettes in flight, wind flags, exciting show atmosphere, sky blue accent #03A9F4, building size 224x192 pixels, 3x3 grid, bottom-aligned, --ar 7:6 --v 6 --s 250 --q 2
```

---

## 3.4 마그마 온천 시설 (Magma Spa Facility)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Magma Spa Facility building, volcanic rock construction, steaming hot spring pools, orange lava glow accent #FF5722, relaxation pavilions, wooden walkways over hot water, dinosaur-sized bathing areas, therapeutic atmosphere, building size 192x160 pixels, 3x2 grid, bottom-aligned, --ar 6:5 --v 6 --s 250 --q 2
```

---

## 3.5 비밀 프로젝트실 (Secret Project Lab)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Secret Project Lab building, hidden underground facility entrance, camouflaged bunker door, high-security locks and scanners, mysterious warning signs, dim red interior glow visible, classified research aesthetic, dark gray accent #424242, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 3.6 궁극 격리시설 (Ultimate Containment Unit)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ultimate Containment Unit building, maximum security facility, multiple reinforced walls, electric fence perimeter, observation towers at corners, heavy blast doors, warning lights, containment for dangerous hybrids, industrial military aesthetic, red accent #F44336, building size 256x224 pixels, 4x4 grid, bottom-aligned, --ar 8:7 --v 6 --s 250 --q 2
```

---

## 3.7 창조주 연구소 (Creator's Laboratory)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Creator's Laboratory building, Arthur's legendary research facility, vintage yet advanced architecture, holographic displays of DNA, grandfather's portrait visible, mysterious golden glow from within #FFD700, books and research notes, emotional legacy building, personal laboratory aesthetic, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

## 3.8 인도미누스 관측소 (Indominus Observatory)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Indominus Observatory building, high-security viewing station, reinforced glass observation deck, thermal cameras and monitoring equipment, warning signs, dramatic red accent lighting #F44336, tense atmosphere, overlooking massive containment area, thriller movie aesthetic, building size 160x192 pixels, 2x2 grid, bottom-aligned, --ar 5:6 --v 6 --s 250 --q 2
```

---

# 4. 전체 체크리스트

## 4.1 핵심 시설 (Core) - 5종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 001 | 부화장 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 002 | DNA 연구소 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 003 | 화석 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 004 | 연구 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 005 | 탐험 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.2 서식지 (Habitats) - 10종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 006 | 초원 서식지 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 007 | 숲 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 008 | 사막 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 009 | 열대 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 010 | 수중 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 011 | 화산 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 012 | 빙하 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 013 | 늪지 서식지 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 014 | 조류장 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 015 | 체험 동물원 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.3 연구 시설 (Research) - 5종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 016 | 유전학 연구소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 017 | 고생물학 연구소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 018 | 행동 연구소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 019 | 의료 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 020 | 자료 보관소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.4 관람 시설 (Viewing) - 10종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 021 | 전망대 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 022 | 사파리 투어 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 023 | 수중 터널 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 024 | VR 체험관 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 025 | 포토 스팟 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 026 | 원형 극장 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 027 | 박물관 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 028 | 교육 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 029 | 놀이터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 030 | 미니 기차 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.5 편의 시설 (Amenities) - 5종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 031 | 레스토랑 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 032 | 카페 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 033 | 기념품 가게 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 034 | 화장실 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 035 | 응급 처치소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.6 생산 시설 (Production) - 5종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 036 | 사료 공장 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 037 | 알 저장소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 038 | DNA 저장소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 039 | 발전소 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 040 | 정수 시설 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.7 운영 시설 (Operations) - 5종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 041 | 레인저 스테이션 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 042 | 보안 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 043 | 직원 센터 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 044 | 창고 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 045 | 헬리패드 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.8 장식물 (Decorations) - 5종

| ID | 건물명 | Lv.1 | Lv.5 | Lv.10 | Lv.15 | Lv.20 | Lv.25 |
|----|--------|------|------|-------|-------|-------|-------|
| 046 | 분수대 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 047 | 동상 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 048 | 꽃 정원 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 049 | 벤치 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 050 | 가로등 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## 4.9 특수 건물 (Special) - 8종 (신규)

| ID | 건물명 | 프롬프트 |
|----|--------|----------|
| S01 | VR 체험관 | ✅ |
| S02 | 수중 전망실 | ✅ |
| S03 | 익룡 비행쇼장 | ✅ |
| S04 | 마그마 온천 | ✅ |
| S05 | 비밀 프로젝트실 | ✅ |
| S06 | 궁극 격리시설 | ✅ |
| S07 | 창조주 연구소 | ✅ |
| S08 | 인도미누스 관측소 | ✅ |

---

# 📊 전체 요약

| 카테고리 | 완료 | 전체 | 비율 |
|----------|------|------|------|
| 핵심 시설 업그레이드 | 12 | 30 | 40% |
| 서식지 업그레이드 | 6 | 60 | 10% |
| 연구 시설 업그레이드 | 0 | 30 | 0% |
| 관람 시설 업그레이드 | 0 | 60 | 0% |
| 편의 시설 업그레이드 | 0 | 30 | 0% |
| 생산 시설 업그레이드 | 0 | 30 | 0% |
| 운영 시설 업그레이드 | 0 | 30 | 0% |
| 장식 업그레이드 | 0 | 30 | 0% |
| 특수 건물 | 8 | 8 | 100% |
| **총합** | **26** | **308** | **8%** |

> **참고:** 템플릿 시스템을 사용하면 나머지 282개 프롬프트를 효율적으로 생성 가능
