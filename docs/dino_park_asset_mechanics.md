# 🗺️ 다이노 파크 타이쿤 - 에셋 프롬프트 (기믹 & 탐험편)

<!-- legacy-reference: 2026-11-15 -->
> **구버전 자료 · 2026-11-15 분리**
> 구버전 기획·설계 자료입니다. 최신 구현 기준으로 사용하지 말고, 필요한 내용은 최신 기획에 승계한 뒤 사용합니다. 문서 내 버전 번호는 이 자료 자체의 과거 버전입니다.
> 최신 기준과 실제 구현 상태는 [기획 문서 안내](README.md)에서 확인합니다.

## 5개 섬 × 5개 기믹 = 25종 + 섬 UI

---

# 📖 사용 가이드

## 파일명 규칙

### 기믹 이미지

```
mechanic_{섬번호}_{번호}_{영문이름}.png
mechanic_{섬번호}_{번호}_{영문이름}_icon.png
```

**예시:**

```
mechanic_01_01_ancient_sap.png
mechanic_01_01_ancient_sap_icon.png
mechanic_03_05_canyon_tunnel.png
```

### 섬 이미지

```
island_{번호}_{영문이름}_icon.png
island_{번호}_{영문이름}_preview.png
island_{번호}_{영문이름}_bg.png
```

**예시:**

```
island_01_emerald_icon.png
island_01_emerald_preview.png
island_03_sunset_bg.png
```

## 폴더 구조

```
apps/client/src/assets/
├── exploration/
│   ├── islands/
│   │   ├── island_01_emerald_icon.png
│   │   ├── island_01_emerald_preview.png
│   │   ├── island_01_emerald_bg.png
│   │   └── ...
│   │
│   └── mechanics/
│       ├── emerald/
│       │   ├── mechanic_01_01_ancient_sap.png
│       │   ├── mechanic_01_01_ancient_sap_icon.png
│       │   └── ...
│       ├── whiterock/
│       ├── sunset/
│       ├── deepblue/
│       └── storm/
```

---

# 📋 목차

1. [섬 선택 화면](#1-섬-선택-화면)
2. [에메랄드 섬 기믹](#2-에메랄드-섬-기믹)
3. [화이트록 섬 기믹](#3-화이트록-섬-기믹)
4. [선셋 섬 기믹](#4-선셋-섬-기믹)
5. [딥블루 섬 기믹](#5-딥블루-섬-기믹)
6. [스톰 섬 기믹](#6-스톰-섬-기믹)

---

# 1. 섬 선택 화면

## 1.1 섬 아이콘 (5종)

---

### 섬\_01 에메랄드 섬 아이콘

```
2.5D isometric game icon, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting, transparent PNG background, high quality mobile game artwork, Emerald Island icon, tropical jungle island silhouette, lush green vegetation #4CAF50, palm trees and dense forest, mysterious ancient ruins visible, warm golden sunlight, adventure destination marker, icon size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 섬\_02 화이트록 섬 아이콘

```
2.5D isometric game icon, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting, transparent PNG background, high quality mobile game artwork, Whiterock Island icon, frozen arctic island silhouette, snow-covered peaks #ECEFF1, ice glaciers and frozen tundra, aurora borealis hints, cold blue atmosphere #B3E5FC, winter expedition destination, icon size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 섬\_03 선셋 섬 아이콘

```
2.5D isometric game icon, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting, transparent PNG background, high quality mobile game artwork, Sunset Island icon, desert canyon island silhouette, warm orange and red sandstone #FF7043, rock formations and canyons, golden sunset glow, oasis hints with palm trees, desert adventure destination, icon size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 섬\_04 딥블루 섬 아이콘

```
2.5D isometric game icon, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting, transparent PNG background, high quality mobile game artwork, Deep Blue Island icon, ocean archipelago silhouette, deep blue water #1565C0, coral reefs visible underwater, tropical beaches, shipwreck hints, marine exploration destination, icon size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 섬\_05 스톰 섬 아이콘

```
2.5D isometric game icon, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting, transparent PNG background, high quality mobile game artwork, Storm Island icon, volcanic island silhouette, dark volcanic rock #37474F, active volcano with orange lava glow #FF5722, smoke and ash clouds, lightning storm atmosphere, dangerous expedition destination, icon size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 1.2 섬 미리보기 (5종)

---

### 에메랄드 섬 미리보기

```
2.5D isometric game environment, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, high quality mobile game artwork, Emerald Island full view, tropical jungle landscape, dense green forest #4CAF50 #66BB6A, ancient stone ruins covered in vines, waterfalls cascading down cliffs, exotic colorful flowers, misty atmosphere, mysterious adventure location, preview size 512x384 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 화이트록 섬 미리보기

```
2.5D isometric game environment, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, high quality mobile game artwork, Whiterock Island full view, arctic frozen landscape, snow-covered mountains #ECEFF1, ice glaciers and frozen lakes #B3E5FC, pine trees with snow, aurora borealis in sky, mammoth fossils visible, polar expedition location, preview size 512x384 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 선셋 섬 미리보기

```
2.5D isometric game environment, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, high quality mobile game artwork, Sunset Island full view, desert canyon landscape, red sandstone formations #FF7043 #E64A19, deep canyons and mesas, oasis with palm trees, ancient petroglyphs on rocks, golden hour lighting, desert adventure location, preview size 512x384 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 딥블루 섬 미리보기

```
2.5D isometric game environment, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, high quality mobile game artwork, Deep Blue Island full view, tropical ocean landscape, crystal clear blue water #1565C0 #42A5F5, coral reefs with colorful fish visible underwater, white sand beaches, sunken ship wreckage, underwater ruins hints, marine exploration location, preview size 512x384 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 스톰 섬 미리보기

```
2.5D isometric game environment, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, high quality mobile game artwork, Storm Island full view, volcanic landscape, dark basalt rock formations #37474F, active volcano with lava rivers #FF5722, obsidian fields, geothermal vents with steam, lightning in dark clouds, dangerous expedition location, preview size 512x384 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

## 1.3 섬 선택 UI

---

### 섬 선택 배경

```
2D game UI background, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, high quality mobile game artwork, island selection map screen, world map view with ocean, five islands visible as destinations, compass rose decoration, old treasure map aesthetic with modern clean style, parchment texture hints #FFF8E1, blue ocean #1565C0, adventure travel theme, background size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

### 탐험 출발 버튼

```
2D game UI button, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, expedition start button, adventure departure theme, golden border frame #FFD700, green gradient fill #4CAF50 to #66BB6A, compass icon embedded, exciting call to action, button size 200x60 pixels, --ar 10:3 --v 6 --s 250 --q 2
```

---

# 2. 에메랄드 섬 기믹

> 열대 정글 테마 - 초록빛 자연과 고대 유적

---

## 기믹\_01_01 고대 수액 (Ancient Sap)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Ancient Sap discovery, massive ancient tree trunk with glowing amber sap dripping, golden honey-like substance #FFB300, mystical glow effect, prehistoric tree with thick bark, jungle setting hints, DNA extraction point, discoverable resource, prop size 128x160 pixels, centered, --ar 4:5 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Ancient Sap icon, amber droplet shape #FFB300, golden glow, tree bark texture hint, DNA resource symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_01_02 치유 온천 (Healing Hot Spring)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Healing Hot Spring discovery, natural hot spring pool with steam rising, turquoise mineral-rich water #26C6DA, smooth rocks surrounding pool, tropical plants around edges, mystical healing aura, relaxing spa atmosphere, dinosaur recovery location, prop size 160x128 pixels, centered, --ar 5:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Healing Hot Spring icon, steaming pool symbol #26C6DA, heart health symbol, steam wisps rising, recovery resource, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_01_03 밀림 터널 (Jungle Tunnel)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Jungle Tunnel discovery, natural tunnel formed by intertwined giant tree roots, archway covered in vines and moss #4CAF50, mysterious dark passage, glowing fireflies inside, ancient pathway, secret shortcut location, exploration destination, prop size 160x192 pixels, centered, --ar 5:6 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Jungle Tunnel icon, dark archway with vine frame #4CAF50, mysterious passage symbol, exploration route, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_01_04 거대 폭포 (Giant Waterfall)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Giant Waterfall discovery, massive waterfall cascading down cliff, crystal clear blue water #42A5F5, misty spray effect, rainbow in mist, lush green vegetation on rocks, hidden cave behind waterfall hints, majestic natural wonder, prop size 192x256 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Giant Waterfall icon, cascading water symbol #42A5F5, cliff edge, mist spray, natural wonder, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_01_05 고대 거목 (Ancient Giant Tree)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Ancient Giant Tree discovery, colossal prehistoric tree reaching into clouds, massive trunk with ancient carvings, sprawling root system, bioluminescent mushrooms growing on trunk, mystical ancient atmosphere, world tree vibes, legendary landmark, prop size 256x320 pixels, centered, --ar 4:5 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Ancient Giant Tree icon, massive tree silhouette #4CAF50, ancient trunk, legendary landmark symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 3. 화이트록 섬 기믹

> 빙하 & 극지방 테마 - 얼음과 눈의 세계

---

## 기믹\_02_01 영구 동토층 (Permafrost Layer)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Permafrost Layer discovery, exposed frozen ground cross-section, layers of ice and frozen soil visible, perfectly preserved fossils embedded #B3E5FC, ice crystals glittering, archaeological dig site, rare specimen location, prop size 160x128 pixels, centered, --ar 5:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Permafrost icon, frozen layers symbol #B3E5FC, ice crystal, fossil embedded, rare resource, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_02_02 얼음 화석 (Ice Fossil)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Ice Fossil discovery, large ice block with perfectly preserved dinosaur fossil inside, transparent cyan ice #00BCD4, visible skeleton details, frost crystals on surface, glowing preservation, museum-quality specimen, rare DNA source, prop size 128x160 pixels, centered, --ar 4:5 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Ice Fossil icon, frozen bone in ice block #00BCD4, preserved specimen, rare DNA symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_02_03 온열 지대 (Thermal Zone)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Thermal Zone discovery, geothermal heated area in frozen landscape, warm steam vents rising, green grass patch in snow #8BC34A, hot springs bubbling, contrast of warm and cold, safe dinosaur habitat zone, survival oasis, prop size 160x128 pixels, centered, --ar 5:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Thermal Zone icon, steam vent with warmth waves #FF7043, heat in cold symbol, safe zone indicator, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_02_04 빙하 동굴 (Glacier Cave)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Glacier Cave discovery, majestic ice cave entrance, translucent blue ice walls #81D4FA, icicles hanging from ceiling, crystal formations inside, ethereal blue glow from within, mysterious frozen passage, exploration destination, prop size 192x160 pixels, centered, --ar 6:5 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Glacier Cave icon, ice cave entrance #81D4FA, icicle frame, mysterious passage, exploration symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_02_05 오로라 전망대 (Aurora Observatory)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Aurora Observatory discovery, wooden observation platform on snowy peak, northern lights dancing in sky green and purple #69F0AE #E040FB, telescope equipment, warm lantern lights, breathtaking view location, special event spot, prop size 160x192 pixels, centered, --ar 5:6 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Aurora Observatory icon, northern lights waves #69F0AE #E040FB, observation symbol, special location, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 4. 선셋 섬 기믹

> 사막 & 협곡 테마 - 붉은 황야와 오아시스

---

## 기믹\_03_01 지하수맥 (Underground Spring)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Underground Spring discovery, natural spring emerging from desert rock, crystal clear water #4FC3F7, wet rocks glistening, small pool forming, life-giving oasis source, rare water resource in desert, precious discovery, prop size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Underground Spring icon, water droplet emerging from rock #4FC3F7, desert water source, precious resource symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_03_02 사암 광산 (Sandstone Mine)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Sandstone Mine discovery, carved mine entrance in red sandstone cliff #E64A19, wooden support beams, mine cart tracks, glittering minerals visible inside, fossil-rich layers exposed, resource extraction site, prop size 160x128 pixels, centered, --ar 5:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Sandstone Mine icon, mine entrance with pickaxe #E64A19, mineral resource, excavation symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_03_03 신기루 숲 (Mirage Forest)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Mirage Forest discovery, shimmering heat haze effect, ghostly trees appearing and fading, translucent phantom vegetation, mysterious desert phenomenon, reality distortion visual, special exploration zone, magical atmosphere, prop size 192x128 pixels, centered, --ar 3:2 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Mirage Forest icon, shimmering tree silhouette, heat wave distortion effect, mysterious phenomenon, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_03_04 고대 오아시스 (Ancient Oasis)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Ancient Oasis discovery, lush green oasis surrounded by desert #66BB6A, clear blue pond #42A5F5, palm trees providing shade, ancient stone well structure, prehistoric petroglyphs on rocks, life in the desert, hidden paradise, prop size 192x160 pixels, centered, --ar 6:5 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Ancient Oasis icon, palm tree with water symbol #66BB6A #42A5F5, desert paradise, life source, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_03_05 협곡 터널 (Canyon Tunnel)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Canyon Tunnel discovery, natural arch tunnel through red rock canyon #BF360C, wind-carved sandstone walls, dramatic lighting through opening, ancient riverbed path, shortcut through mountains, scenic exploration route, prop size 160x192 pixels, centered, --ar 5:6 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Canyon Tunnel icon, rock arch passage #BF360C, canyon route symbol, shortcut indicator, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 5. 딥블루 섬 기믹

> 해양 & 수중 테마 - 바다와 산호초

---

## 기믹\_04_01 난파선 (Shipwreck)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Shipwreck discovery, old wooden ship partially submerged, barnacles and coral growing on hull #795548, treasure chest visible, fish swimming around, mysterious underwater atmosphere, salvage location, historical artifact site, prop size 192x160 pixels, centered, --ar 6:5 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Shipwreck icon, sunken ship silhouette #795548, anchor symbol, treasure location, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_04_02 해저 유적 (Underwater Ruins)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Underwater Ruins discovery, ancient temple structure submerged, stone columns covered in seaweed #78909C, mysterious glowing symbols, coral and sea life around, lost civilization vibes, archaeological wonder, deep sea exploration site, prop size 192x192 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Underwater Ruins icon, sunken temple pillar #78909C, ancient symbol, lost civilization, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_04_03 진주 양식장 (Pearl Farm)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Pearl Farm discovery, underwater oyster beds, giant clams with shimmering pearls #F5F5F5, rope and net structures for cultivation, gentle ocean current, valuable resource location, marine treasure site, prop size 160x128 pixels, centered, --ar 5:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Pearl Farm icon, open clam with pearl #F5F5F5, valuable resource, marine treasure symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_04_04 산호 정원 (Coral Garden)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Coral Garden discovery, vibrant coral reef ecosystem, colorful corals pink orange purple #E91E63 #FF7043 #9C27B0, tropical fish swimming, sea anemones swaying, biodiversity hotspot, beautiful underwater garden, marine sanctuary, prop size 192x128 pixels, centered, --ar 3:2 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Coral Garden icon, colorful coral branch #E91E63 #FF7043, marine life, biodiversity symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_04_05 심해 동굴 (Deep Sea Cave)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Deep Sea Cave discovery, underwater cave entrance in dark depths, bioluminescent organisms lighting path #00E5FF, mysterious dark passage, rare deep sea creatures, pressure-resistant entrance, abyssal exploration site, forbidden zone vibes, prop size 160x192 pixels, centered, --ar 5:6 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Deep Sea Cave icon, dark cave with bioluminescent glow #00E5FF, abyssal depths, dangerous exploration, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 6. 스톰 섬 기믹

> 화산 & 폭풍 테마 - 용암과 번개

---

## 기믹\_05_01 지열 발전소 (Geothermal Plant)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Geothermal Plant discovery, industrial structure harnessing volcanic energy, steam pipes and turbines, orange heat glow #FF5722, advanced technology mixed with natural elements, power generation facility, energy resource location, prop size 160x192 pixels, centered, --ar 5:6 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Geothermal Plant icon, steam turbine with heat symbol #FF5722, energy generation, power resource, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_05_02 화산재 광물 (Volcanic Ash Mineral)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Volcanic Ash Mineral discovery, deposit of valuable volcanic minerals, glittering obsidian and pumice, ash layers with rare crystals embedded #616161, geological wonder, valuable material extraction site, mining opportunity, prop size 128x128 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Volcanic Ash Mineral icon, dark crystal with sparkle #616161, rare material, valuable resource, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_05_03 용암 터널 (Lava Tunnel)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Lava Tunnel discovery, natural volcanic tunnel formed by lava flow, cooled basalt walls with glowing cracks #FF5722, extreme heat visible, dangerous passage, shortcut through volcano, high-risk exploration route, prop size 160x192 pixels, centered, --ar 5:6 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Lava Tunnel icon, tunnel with lava glow #FF5722, dangerous path, volcanic route, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_05_04 마그마 온천 (Magma Hot Spring)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Magma Hot Spring discovery, extremely hot volcanic pool, bubbling orange-red water #FF6D00, steam and sulfur vents, obsidian rocks surrounding, dangerous but valuable, rare mineral deposits, extreme environment location, prop size 160x128 pixels, centered, --ar 5:4 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Magma Hot Spring icon, bubbling hot pool #FF6D00, extreme heat, volcanic bath symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 기믹\_05_05 흑요석 광산 (Obsidian Mine)

### 메인 이미지

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Obsidian Mine discovery, volcanic glass mine entrance, shiny black obsidian surfaces reflecting light #212121, valuable crafting material deposits, sharp crystal formations, ancient tool-making resource, premium material location, prop size 160x160 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

### 아이콘

```
2D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Obsidian Mine icon, black obsidian crystal #212121, volcanic glass, premium resource symbol, icon size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 📋 파일명 빠른 참조

## 섬 에셋

```
island_01_emerald_icon.png
island_01_emerald_preview.png
island_02_whiterock_icon.png
island_02_whiterock_preview.png
island_03_sunset_icon.png
island_03_sunset_preview.png
island_04_deepblue_icon.png
island_04_deepblue_preview.png
island_05_storm_icon.png
island_05_storm_preview.png
island_selection_bg.png
btn_expedition_start.png
```

## 에메랄드 섬 기믹

```
mechanic_01_01_ancient_sap.png
mechanic_01_01_ancient_sap_icon.png
mechanic_01_02_healing_spring.png
mechanic_01_02_healing_spring_icon.png
mechanic_01_03_jungle_tunnel.png
mechanic_01_03_jungle_tunnel_icon.png
mechanic_01_04_giant_waterfall.png
mechanic_01_04_giant_waterfall_icon.png
mechanic_01_05_ancient_tree.png
mechanic_01_05_ancient_tree_icon.png
```

## 화이트록 섬 기믹

```
mechanic_02_01_permafrost.png
mechanic_02_01_permafrost_icon.png
mechanic_02_02_ice_fossil.png
mechanic_02_02_ice_fossil_icon.png
mechanic_02_03_thermal_zone.png
mechanic_02_03_thermal_zone_icon.png
mechanic_02_04_glacier_cave.png
mechanic_02_04_glacier_cave_icon.png
mechanic_02_05_aurora_observatory.png
mechanic_02_05_aurora_observatory_icon.png
```

## 선셋 섬 기믹

```
mechanic_03_01_underground_spring.png
mechanic_03_01_underground_spring_icon.png
mechanic_03_02_sandstone_mine.png
mechanic_03_02_sandstone_mine_icon.png
mechanic_03_03_mirage_forest.png
mechanic_03_03_mirage_forest_icon.png
mechanic_03_04_ancient_oasis.png
mechanic_03_04_ancient_oasis_icon.png
mechanic_03_05_canyon_tunnel.png
mechanic_03_05_canyon_tunnel_icon.png
```

## 딥블루 섬 기믹

```
mechanic_04_01_shipwreck.png
mechanic_04_01_shipwreck_icon.png
mechanic_04_02_underwater_ruins.png
mechanic_04_02_underwater_ruins_icon.png
mechanic_04_03_pearl_farm.png
mechanic_04_03_pearl_farm_icon.png
mechanic_04_04_coral_garden.png
mechanic_04_04_coral_garden_icon.png
mechanic_04_05_deep_sea_cave.png
mechanic_04_05_deep_sea_cave_icon.png
```

## 스톰 섬 기믹

```
mechanic_05_01_geothermal_plant.png
mechanic_05_01_geothermal_plant_icon.png
mechanic_05_02_volcanic_mineral.png
mechanic_05_02_volcanic_mineral_icon.png
mechanic_05_03_lava_tunnel.png
mechanic_05_03_lava_tunnel_icon.png
mechanic_05_04_magma_spring.png
mechanic_05_04_magma_spring_icon.png
mechanic_05_05_obsidian_mine.png
mechanic_05_05_obsidian_mine_icon.png
```

---

# 📊 전체 요약

| 카테고리      | 항목 수  | 상태    |
| ------------- | -------- | ------- |
| 섬 아이콘     | 5        | ✅ 완료 |
| 섬 미리보기   | 5        | ✅ 완료 |
| 섬 선택 UI    | 2        | ✅ 완료 |
| 에메랄드 기믹 | 5 (×2)   | ✅ 완료 |
| 화이트록 기믹 | 5 (×2)   | ✅ 완료 |
| 선셋 기믹     | 5 (×2)   | ✅ 완료 |
| 딥블루 기믹   | 5 (×2)   | ✅ 완료 |
| 스톰 기믹     | 5 (×2)   | ✅ 완료 |
| **총합**      | **62개** | ✅      |

> 기믹은 메인 이미지 + 아이콘 = 2개씩
