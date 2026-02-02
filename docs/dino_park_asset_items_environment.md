# 🌿 다이노 파크 타이쿤 - 에셋 프롬프트 (환경 & 아이템 & UI편)
## 환경 35종 + 아이템 19종 + UI 30종 + NPC 10명 완전한 프롬프트

---

# 📋 목차

0. [📖 사용 가이드](#-사용-가이드)
1. [환경 에셋](#1-환경-에셋)
2. [아이템 에셋](#2-아이템-에셋)
3. [UI 에셋](#3-ui-에셋)
4. [NPC 에셋](#4-npc-에셋)

---

# 📖 사용 가이드

## Step 1: AI 이미지 생성

### 권장 도구
- **Midjourney** (v6 추천) - 프롬프트가 Midjourney 문법으로 작성됨
- **Leonardo AI** - `--ar`, `--v`, `--s`, `--q` 파라미터 제거 후 사용
- **Stable Diffusion** - 파라미터 제거 후 사용

### Midjourney 설정
```
/imagine prompt: [프롬프트 전체 복사]
```

### 다른 도구 사용 시
프롬프트 끝의 파라미터 제거:
```
❌ --ar 1:1 --v 6 --s 250 --q 2
```

## Step 2: 파일명 규칙

### 기본 형식
```
{카테고리}_{번호}_{영문이름}_{상태}.png
```

### 카테고리별 파일명

| 카테고리 | 폴더 경로 | 파일명 형식 | 예시 |
|----------|-----------|-------------|------|
| **타일** | `assets/environment/tiles/` | `tile_{번호}_{이름}.png` | `tile_01_grass_light.png` |
| **나무** | `assets/environment/trees/` | `tree_{번호}_{이름}.png` | `tree_01_oak.png` |
| **바위** | `assets/environment/rocks/` | `rock_{번호}_{이름}.png` | `rock_01_gray.png` |
| **식물** | `assets/environment/plants/` | `plant_{번호}_{이름}.png` | `plant_01_fern.png` |
| **날씨** | `assets/environment/weather/` | `weather_{이름}.png` | `weather_rain.png` |
| **알** | `assets/items/eggs/` | `egg_{등급}.png` | `egg_legendary.png` |
| **먹이** | `assets/items/food/` | `food_{이름}.png` | `food_grass.png` |
| **부스터** | `assets/items/boosters/` | `booster_{이름}.png` | `booster_speed_hatch.png` |
| **재화 아이콘** | `assets/ui/icons/currency/` | `icon_{재화명}.png` | `icon_gold.png` |
| **상태 아이콘** | `assets/ui/icons/status/` | `icon_{상태명}.png` | `icon_happiness.png` |
| **버튼** | `assets/ui/buttons/` | `btn_{이름}_{상태}.png` | `btn_primary_normal.png` |
| **패널** | `assets/ui/panels/` | `panel_{이름}.png` | `panel_dialog.png` |
| **배경** | `assets/ui/backgrounds/` | `bg_{이름}.png` | `bg_main_menu.png` |
| **이펙트** | `assets/ui/effects/` | `effect_{이름}.png` | `effect_sparkle.png` |
| **방문객** | `assets/characters/visitors/` | `visitor_{번호}_{이름}.png` | `visitor_01_family.png` |
| **직원** | `assets/characters/staff/` | `staff_{번호}_{이름}.png` | `staff_01_ranger.png` |

### 상태 접미사 (필요시)
```
_normal   - 기본 상태
_pressed  - 눌린 상태
_disabled - 비활성 상태
_hover    - 마우스 오버 (웹용)
```

## Step 3: 이미지 후처리

### 필수 작업
1. **배경 제거** - 투명 PNG로 저장
2. **크기 조정** - 프롬프트에 명시된 픽셀 크기로 리사이즈
3. **파일 형식** - PNG-24 (투명도 포함)

### 권장 크기 정리

| 에셋 타입 | 픽셀 크기 | 비율 |
|-----------|-----------|------|
| 타일 | 64×32 | 2:1 |
| 나무/바위/식물 | 96×128 | 3:4 |
| 날씨 이펙트 | 512×512 | 1:1 |
| 아이템 (알/먹이/부스터) | 64×64 | 1:1 |
| 아이콘 | 48×48 | 1:1 |
| 버튼 | 160×48 | 10:3 |
| 패널 | 다양함 | - |
| 배경 | 1920×1080 | 16:9 |
| 이펙트 | 128×128 | 1:1 |
| 캐릭터 (방문객/직원) | 64×96 | 2:3 |

## Step 4: 폴더 구조

```
apps/client/src/assets/
├── environment/
│   ├── tiles/
│   │   ├── tile_01_grass_light.png
│   │   ├── tile_02_grass_dark.png
│   │   └── ...
│   ├── trees/
│   │   ├── tree_01_oak.png
│   │   └── ...
│   ├── rocks/
│   │   ├── rock_01_gray.png
│   │   └── ...
│   ├── plants/
│   │   ├── plant_01_fern.png
│   │   └── ...
│   └── weather/
│       ├── weather_rain.png
│       └── ...
├── items/
│   ├── eggs/
│   │   ├── egg_common.png
│   │   ├── egg_rare.png
│   │   └── ...
│   ├── food/
│   │   ├── food_grass.png
│   │   └── ...
│   └── boosters/
│       ├── booster_speed_hatch.png
│       └── ...
├── ui/
│   ├── icons/
│   │   ├── currency/
│   │   │   ├── icon_gold.png
│   │   │   └── ...
│   │   └── status/
│   │       ├── icon_happiness.png
│   │       └── ...
│   ├── buttons/
│   │   ├── btn_primary_normal.png
│   │   └── ...
│   ├── panels/
│   │   ├── panel_dialog.png
│   │   └── ...
│   ├── backgrounds/
│   │   ├── bg_main_menu.png
│   │   └── ...
│   └── effects/
│       ├── effect_sparkle.png
│       └── ...
└── characters/
    ├── visitors/
    │   ├── visitor_01_family.png
    │   └── ...
    └── staff/
        ├── staff_01_ranger.png
        └── ...
```

## Step 5: 체크리스트

### 이미지 생성 전
- [ ] 프롬프트 전체 복사 (백틱 안의 내용)
- [ ] AI 도구에 붙여넣기
- [ ] 파라미터 확인 (Midjourney가 아니면 제거)

### 이미지 생성 후
- [ ] 배경 투명하게 제거
- [ ] 명시된 픽셀 크기로 리사이즈
- [ ] 파일명 규칙에 따라 저장
- [ ] 올바른 폴더에 배치

## 🔖 빠른 참조: 전체 파일명 목록

### 타일 (15종)
```
tile_01_grass_light.png
tile_02_grass_dark.png
tile_03_grass_flower.png
tile_04_dirt_path.png
tile_05_stone_path.png
tile_06_wood_path.png
tile_07_water_shallow.png
tile_08_water_deep.png
tile_09_sand.png
tile_10_volcanic.png
tile_11_snow.png
tile_12_ice.png
tile_13_swamp.png
tile_14_grid_highlight.png
tile_15_grid_blocked.png
```

### 나무/바위/식물 (15종)
```
tree_01_oak.png
tree_02_pine.png
tree_03_palm.png
tree_04_sakura.png
tree_05_dead.png
rock_01_gray.png
rock_02_moss.png
rock_03_volcanic.png
rock_04_crystal.png
rock_05_fossil.png
plant_01_fern.png
plant_02_bush.png
plant_03_flower.png
plant_04_bamboo.png
plant_05_cactus.png
```

### 날씨 (5종)
```
weather_rain.png
weather_snow.png
weather_fog.png
weather_sunny.png
weather_storm.png
```

### 알 (5종)
```
egg_common.png
egg_uncommon.png
egg_rare.png
egg_epic.png
egg_legendary.png
```

### 먹이 (8종)
```
food_grass.png
food_meat.png
food_fish.png
food_berry.png
food_premium_grass.png
food_premium_meat.png
food_premium_fish.png
food_universal.png
```

### 부스터 (6종)
```
booster_speed_hatch.png
booster_double_revenue.png
booster_happiness.png
booster_exp_boost.png
booster_lucky_hatch.png
booster_instant_complete.png
```

### 재화 아이콘 (4종)
```
icon_gold.png
icon_diamond.png
icon_dna.png
icon_energy.png
```

### 상태 아이콘 (6종)
```
icon_happiness.png
icon_hunger.png
icon_level.png
icon_exp.png
icon_time.png
icon_star.png
```

### 버튼 (4종 × 상태)
```
btn_primary_normal.png / btn_primary_pressed.png / btn_primary_disabled.png
btn_secondary_normal.png / btn_secondary_pressed.png / btn_secondary_disabled.png
btn_positive_normal.png / btn_positive_pressed.png / btn_positive_disabled.png
btn_negative_normal.png / btn_negative_pressed.png / btn_negative_disabled.png
```

### 패널 (5종)
```
panel_dialog.png
panel_tooltip.png
panel_card.png
panel_header.png
panel_footer.png
```

### 배경 (5종)
```
bg_main_menu.png
bg_park.png
bg_shop.png
bg_exploration.png
bg_story.png
```

### 이펙트 (5종)
```
effect_sparkle.png
effect_level_up.png
effect_reward.png
effect_tap.png
effect_complete.png
```

### 방문객 (5종)
```
visitor_01_family.png
visitor_02_couple.png
visitor_03_student.png
visitor_04_elderly.png
visitor_05_vip.png
```

### 직원 (5종)
```
staff_01_ranger.png
staff_02_cleaner.png
staff_03_vendor.png
staff_04_guide.png
staff_05_security.png
```

---

# 1. 환경 에셋

## 1.1 기본 타일 (15종)

> 64×32 아이소메트릭 다이아몬드 타일

---

### 타일_01 잔디 (밝음)

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, bright grass tile, lush green grass texture #4CAF50, small grass blades visible, natural ground cover, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_02 잔디 (어두움)

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, dark grass tile, deep green grass texture #388E3C, shaded forest floor feel, natural ground cover, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_03 잔디 (꽃)

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, grass tile with colorful flowers, green grass #4CAF50 with small yellow #FFC107 pink #E91E63 and white flowers scattered, cheerful meadow feel, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_04 흙길

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, dirt path tile, brown earth texture #8D6E63, worn path with subtle footprints, natural trail appearance, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_05 돌길

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, stone path tile, gray cobblestone texture #9E9E9E, neatly arranged paving stones, well-maintained pathway, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_06 나무길

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, wooden boardwalk tile, brown wood planks #795548, horizontal plank pattern, rustic park pathway, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_07 물 (얕음)

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, shallow water tile, light blue transparent water #4FC3F7, gentle ripples on surface, clear shallow pond, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_08 물 (깊음)

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, deep water tile, dark blue water #0288D1, depth gradient visible, mysterious deep pool, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_09 모래

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, sand tile, tan beach sand color #FFE0B2, fine grain texture, warm desert or beach feel, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_10 화산암

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, volcanic rock tile, dark gray basalt #424242, rough ignite texture, cooled lava surface, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_11 눈

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, snow tile, pristine white snow #FFFFFF, soft powder texture, gentle sparkle highlights, winter wonderland feel, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_12 얼음

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, ice tile, light blue transparent ice #B3E5FC, frozen cracked surface, reflective icy sheen, slippery frozen ground, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_13 늪지

```
2.5D isometric game tile, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft directional lighting from top-left, transparent PNG background, high quality mobile game artwork, isometric diamond shape tile, swamp tile, murky green water #558B2F, wet muddy texture, bubbling marsh feel, mysterious wetland, tile size 64x32 pixels, seamless tileable, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_14 그리드 하이라이트

```
2.5D isometric game tile, soft cel-shaded cartoon style, transparent background, isometric diamond shape tile, grid highlight indicator, glowing green outline #4CAF50, semi-transparent fill, placement allowed indicator, pulsing glow effect, tile size 64x32 pixels, UI element, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 타일_15 그리드 블로킹

```
2.5D isometric game tile, soft cel-shaded cartoon style, transparent background, isometric diamond shape tile, grid blocking indicator, glowing red outline #F44336, semi-transparent fill, placement blocked indicator, warning glow effect, tile size 64x32 pixels, UI element, --ar 2:1 --v 6 --s 250 --q 2
```

---

## 1.2 나무 (5종)

---

### 나무_01 참나무 (Oak Tree)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Oak Tree prop, large deciduous tree, thick brown trunk #8D6E63, lush green round canopy #4CAF50 #66BB6A, friendly park tree, natural shade provider, prop size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 나무_02 침엽수 (Pine Tree)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Pine Tree prop, tall conifer tree, straight brown trunk #6D4C41, triangular dark green foliage #2E7D32 #388E3C, forest evergreen, natural mountain feel, prop size 64x128 pixels, centered, --ar 1:2 --v 6 --s 250 --q 2
```

---

### 나무_03 야자수 (Palm Tree)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Palm Tree prop, tropical palm tree, curved brown trunk #A1887F, large fan-shaped green fronds #43A047, coconuts visible, beach tropical feel, prop size 64x128 pixels, centered, --ar 1:2 --v 6 --s 250 --q 2
```

---

### 나무_04 선사시대 양치류 (Prehistoric Fern Tree)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Prehistoric Fern Tree prop, giant tree fern, thick fibrous trunk #5D4037, large drooping fern fronds #558B2F #689F38, Jurassic era vegetation, ancient forest feel, prop size 96x128 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 나무_05 고대 침엽수 (Ancient Conifer)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Ancient Conifer prop, massive prehistoric conifer, very thick ancient trunk #5D4037, dense dark green canopy #1B5E20 #2E7D32, Mesozoic era tree, towering ancient feel, prop size 128x192 pixels, centered, --ar 2:3 --v 6 --s 250 --q 2
```

---

## 1.3 바위 (5종)

---

### 바위_01 작은 돌 (Small Stone)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Small Stone prop, small round pebbles cluster, gray stone color #9E9E9E #757575, smooth river rocks, natural decoration, prop size 32x32 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 바위_02 중간 바위 (Medium Rock)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Medium Rock prop, medium sized boulder, gray rock color #757575 #616161, weathered surface texture, natural landscape element, prop size 64x48 pixels, centered, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 바위_03 큰 바위 (Large Boulder)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Large Boulder prop, massive rock formation, dark gray stone #616161 #424242, dramatic cracks and texture, impressive natural landmark, prop size 96x80 pixels, centered, --ar 6:5 --v 6 --s 250 --q 2
```

---

### 바위_04 이끼 바위 (Mossy Rock)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Mossy Rock prop, rock covered with moss, gray stone base #757575, green moss patches #689F38 #8BC34A, aged forest rock, natural overgrown feel, prop size 64x48 pixels, centered, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 바위_05 화산 바위 (Volcanic Rock)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Volcanic Rock prop, jagged lava rock formation, dark black rock #212121 #424242, orange glow cracks #FF5722, porous volcanic texture, dramatic volcanic landscape, prop size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 1.4 식물 (5종)

---

### 식물_01 덤불 (Bush)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Bush prop, round green bush, dense leafy shrub, green foliage #4CAF50 #66BB6A, decorative garden plant, natural hedge element, prop size 48x40 pixels, centered, --ar 6:5 --v 6 --s 250 --q 2
```

---

### 식물_02 꽃 (Flowers)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Flower Cluster prop, colorful flower patch, mixed flowers pink #E91E63, yellow #FFC107, purple #9C27B0, green stems and leaves, cheerful garden decoration, prop size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 식물_03 양치류 (Fern)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Fern prop, prehistoric fern plant, large fronds spreading outward, deep green color #2E7D32 #388E3C, Jurassic era vegetation, forest floor plant, prop size 64x48 pixels, centered, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 식물_04 선인장 (Cactus)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Cactus prop, saguaro style cactus, tall green cactus #7CB342, branching arms, small spines visible, desert plant decoration, prop size 48x80 pixels, centered, --ar 3:5 --v 6 --s 250 --q 2
```

---

### 식물_05 습지 식물 (Swamp Plant)

```
2.5D isometric game prop, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, Swamp Plant prop, cattails and reeds cluster, tall thin stalks, murky green color #558B2F #689F38, brown cattail heads #8D6E63, wetland vegetation, prop size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 1.5 날씨 효과 (5종)

---

### 날씨_01 비 (Rain)

```
2.5D game weather effect, soft cel-shaded cartoon style, transparent background, Rain weather effect, falling rain drops, diagonal rain streaks, blue-white rain drops #B3E5FC, gentle rain atmosphere, overlay effect for game, tileable pattern, effect size 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 날씨_02 눈 (Snow)

```
2.5D game weather effect, soft cel-shaded cartoon style, transparent background, Snow weather effect, falling snowflakes, gentle floating snow, white snowflakes #FFFFFF with soft glow, winter atmosphere, overlay effect for game, tileable pattern, effect size 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 날씨_03 안개 (Fog)

```
2.5D game weather effect, soft cel-shaded cartoon style, semi-transparent background, Fog weather effect, misty fog layer, soft white-gray fog #ECEFF1, mysterious atmosphere, low visibility overlay, ground fog effect, overlay effect for game, effect size 256x128 pixels, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 날씨_04 번개 (Lightning)

```
2.5D game weather effect, soft cel-shaded cartoon style, transparent background, Lightning weather effect, bright lightning bolt, jagged electric bolt shape, bright yellow-white #FFEB3B with blue #2196F3 glow, dramatic storm atmosphere, flash overlay effect, effect size 128x256 pixels, --ar 1:2 --v 6 --s 250 --q 2
```

---

### 날씨_05 햇살 (Sunbeam)

```
2.5D game weather effect, soft cel-shaded cartoon style, transparent background, Sunbeam weather effect, golden light rays, diagonal sun rays from top, warm yellow #FFC107 #FFD54F with soft glow, pleasant sunny atmosphere, god rays overlay effect, effect size 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 2. 아이템 에셋

## 2.1 알 (5종)

---

### 알_01 Common 알

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Common Egg item, basic dinosaur egg, oval egg shape, cream beige color #D7CCC8 with brown #A1887F speckles, simple plain appearance, small nest of straw, item size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 알_02 Uncommon 알

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Uncommon Egg item, slightly special dinosaur egg, oval egg shape, light green color #C5E1A5 with darker #8BC34A spots, slightly more detailed pattern, cozy nest, item size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 알_03 Rare 알

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Rare Egg item, special dinosaur egg, oval egg shape, blue color #90CAF9 with darker #2196F3 stripes, polished shiny surface, richer colors, premium nest with leaves, item size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 알_04 Epic 알

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Epic Egg item, rare dinosaur egg, oval egg shape, purple color #CE93D8 with darker #9C27B0 swirl patterns, premium quality appearance, subtle inner glow, elegant nest with crystals, item size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 알_05 Legendary 알

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Legendary Egg item, legendary dinosaur egg, oval egg shape, golden color #FFD54F with amber #FFC107 metallic sheen, golden rim light, majestic aura, sparkling particles, luxurious golden nest, item size 64x64 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.2 먹이 (8종)

---

### 먹이_01 풀 (Grass Feed)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Grass Feed item, bundle of fresh grass, green grass bunch #4CAF50 #66BB6A, tied with twine, herbivore food, natural fresh look, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_02 과일 바구니 (Fruit Basket)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Fruit Basket item, woven basket with fruits, colorful fruits red #F44336, orange #FF9800, yellow #FFEB3B, herbivore food, delicious fresh appearance, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_03 나뭇잎 (Leaves)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Leaves item, pile of fresh leaves, green leaves #388E3C #43A047, various leaf shapes, herbivore food, forest foliage look, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_04 고기 (Raw Meat)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Raw Meat item, large raw steak, red meat color #E53935 #C62828, white fat marbling, carnivore food, fresh butcher appearance, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_05 뼈다귀 (Bone with Meat)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Bone with Meat item, large bone with meat attached, white bone #ECEFF1, red meat #E53935, carnivore food, prehistoric feast appearance, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_06 살코기 더미 (Meat Pile)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Meat Pile item, pile of meat chunks, mixed red meat #D32F2F #E53935, carnivore feast, large predator food, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_07 물고기 (Fish)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Fish item, fresh whole fish, silver blue fish color #90CAF9 #64B5F6, shiny scales, marine and piscivore food, ocean fresh appearance, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 먹이_08 물고기 바구니 (Fish Basket)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Fish Basket item, basket full of fish, multiple silver blue fish #64B5F6 #42A5F5, woven basket, marine food feast, abundant catch appearance, item size 48x48 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 2.3 부스터 (6종)

---

### 부스터_01 속도 부스터 (Speed Booster)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Speed Booster item, lightning bolt shaped bottle, blue potion #2196F3 #1976D2, speed lines effect, energy swirl inside, faster acceleration feel, sparkling particles, item size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 부스터_02 수익 부스터 (Revenue Booster)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Revenue Booster item, golden coin shaped bottle, gold potion #FFC107 #FFB300, coin symbols floating, money sparkles inside, wealth multiplier feel, glowing golden particles, item size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 부스터_03 행복도 부스터 (Happiness Booster)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Happiness Booster item, heart shaped bottle, pink potion #E91E63 #F06292, heart bubbles floating, joyful sparkles inside, happiness spreading feel, love particles, item size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 부스터_04 DNA 부스터 (DNA Booster)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, DNA Booster item, helix shaped bottle, green potion #4CAF50 #66BB6A, DNA strand swirl inside, scientific bubbles, genetics enhancement feel, bio particles, item size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 부스터_05 에너지 부스터 (Energy Booster)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Energy Booster item, battery shaped bottle, orange potion #FF9800 #F57C00, electric sparks inside, power surge effect, energy recharge feel, lightning particles, item size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

### 부스터_06 프리미엄 부스터 (Premium Booster)

```
2.5D isometric game item, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, transparent PNG background, high quality mobile game artwork, Premium Booster item, star shaped ornate bottle, rainbow multi-color potion, all colors swirling #F44336 #FF9800 #FFEB3B #4CAF50 #2196F3 #9C27B0, ultimate power feel, golden rim light, majestic sparkles, item size 48x64 pixels, centered, --ar 3:4 --v 6 --s 250 --q 2
```

---

# 3. UI 에셋

## 3.1 재화 아이콘 (4종)

---

### 재화_01 골드 (Gold)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Gold currency icon, shiny gold coin, bright yellow gold color #FFC107 #FFD54F, dinosaur footprint stamp on coin, metallic sheen, sparkling highlights, icon size 32x32 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 재화_02 다이아몬드 (Diamond)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Diamond currency icon, sparkling blue gem, brilliant blue color #2196F3 #64B5F6, faceted diamond cut shape, light reflections, premium sparkle effect, icon size 32x32 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 재화_03 DNA

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, DNA currency icon, double helix shape, green science color #4CAF50 #66BB6A, glowing genetic symbol, scientific feel, subtle glow effect, icon size 32x32 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 재화_04 에너지 (Energy)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Energy currency icon, lightning bolt shape, bright orange color #FF9800 #FFB300, electric power symbol, energetic feel, sparking effect, icon size 32x32 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 3.2 상태 아이콘 (6종)

---

### 상태_01 행복도 (Happiness)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Happiness status icon, smiling face emoji, yellow happy face #FFEB3B, big smile, joyful expression, mood indicator, icon size 24x24 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 상태_02 배고픔 (Hunger)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Hunger status icon, meat drumstick shape, red meat color #E53935, appetite indicator, food needed symbol, icon size 24x24 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 상태_03 레벨 (Level)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Level status icon, star badge shape, golden star #FFC107, level indicator, achievement symbol, icon size 24x24 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 상태_04 경험치 (EXP)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Experience status icon, rising arrow shape, green growth color #4CAF50, progress indicator, growth symbol, icon size 24x24 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 상태_05 별 (Star Rating)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Star Rating icon, five-pointed star, bright yellow #FFEB3B, rating indicator, quality symbol, sparkle effect, icon size 24x24 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 상태_06 하트 (Heart/Life)

```
2.5D game UI icon, soft cel-shaded cartoon style, vibrant saturated colors, clean outlines, transparent PNG background, Heart icon, heart shape, red color #E91E63 #F44336, life and love indicator, health symbol, gentle glow, icon size 24x24 pixels, centered, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 3.3 버튼 (4종)

---

### 버튼_01 Primary (초록)

```
2.5D game UI button, soft cel-shaded cartoon style, vibrant colors, clean outlines, transparent PNG background, Primary button, rounded rectangle shape, green color #4CAF50, subtle gradient, soft shadow, 3D raised effect, click-ready appearance, button size 120x48 pixels, --ar 5:2 --v 6 --s 250 --q 2
```

---

### 버튼_02 Secondary (파랑)

```
2.5D game UI button, soft cel-shaded cartoon style, vibrant colors, clean outlines, transparent PNG background, Secondary button, rounded rectangle shape, blue color #2196F3, subtle gradient, soft shadow, 3D raised effect, click-ready appearance, button size 120x48 pixels, --ar 5:2 --v 6 --s 250 --q 2
```

---

### 버튼_03 Warning (주황)

```
2.5D game UI button, soft cel-shaded cartoon style, vibrant colors, clean outlines, transparent PNG background, Warning button, rounded rectangle shape, orange color #FF9800, subtle gradient, soft shadow, 3D raised effect, attention-grabbing appearance, button size 120x48 pixels, --ar 5:2 --v 6 --s 250 --q 2
```

---

### 버튼_04 Danger (빨강)

```
2.5D game UI button, soft cel-shaded cartoon style, vibrant colors, clean outlines, transparent PNG background, Danger button, rounded rectangle shape, red color #F44336, subtle gradient, soft shadow, 3D raised effect, caution appearance, button size 120x48 pixels, --ar 5:2 --v 6 --s 250 --q 2
```

---

## 3.4 패널/모달 (5종)

---

### 패널_01 기본 패널 (Basic Panel)

```
2.5D game UI panel, soft cel-shaded cartoon style, warm color palette, clean outlines, Basic Panel, rounded rectangle frame, cream beige background #FFF8E1, brown wooden border #8D6E63, decorative corner elements, cozy inviting feel, panel size 320x240 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 패널_02 정보 패널 (Info Panel)

```
2.5D game UI panel, soft cel-shaded cartoon style, warm color palette, clean outlines, Info Panel, rounded rectangle frame, light blue background #E3F2FD, blue border #2196F3, information icon decoration, helpful feel, panel size 320x240 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 패널_03 보상 패널 (Reward Panel)

```
2.5D game UI panel, soft cel-shaded cartoon style, warm color palette, clean outlines, Reward Panel, ornate frame, golden background #FFF8E1 #FFE082, golden decorative border #FFC107, sparkle decorations, celebratory feel, treasure chest elements, panel size 320x240 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 패널_04 경고 패널 (Warning Panel)

```
2.5D game UI panel, soft cel-shaded cartoon style, warm color palette, clean outlines, Warning Panel, rounded rectangle frame, light orange background #FFF3E0, orange border #FF9800, warning icon decoration, attention-needed feel, panel size 320x240 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 패널_05 확인 패널 (Confirm Panel)

```
2.5D game UI panel, soft cel-shaded cartoon style, warm color palette, clean outlines, Confirm Panel, rounded rectangle frame, light green background #E8F5E9, green border #4CAF50, checkmark icon decoration, positive confirmation feel, panel size 320x240 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

## 3.5 배경 (5종)

---

### 배경_01 메인 화면 (Main Screen)

```
2.5D game background, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, Main Screen background, panoramic dinosaur park view, lush green landscape, distant mountains, blue sky with fluffy clouds, golden sunlight, welcoming atmosphere, Jurassic theme park entrance visible, background size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

### 배경_02 로딩 화면 (Loading Screen)

```
2.5D game background, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, Loading Screen background, simple gradient sky, soft blue #90CAF9 to warm orange #FFCC80 gradient, fluffy clouds scattered, peaceful waiting atmosphere, space for loading bar, background size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

### 배경_03 스토리 화면 (Story Screen)

```
2.5D game background, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, Story Screen background, mysterious prehistoric jungle, dense foliage framing, soft lighting through trees, atmospheric fog, narrative setting feel, space for dialogue box, background size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

### 배경_04 상점 화면 (Shop Screen)

```
2.5D game background, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, Shop Screen background, cozy market interior, wooden shelves and display cases, warm amber lighting, merchandise displays, inviting shopping atmosphere, background size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

### 배경_05 도감 화면 (Codex Screen)

```
2.5D game background, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, Codex Screen background, museum interior setting, fossil displays on walls, scientific exhibits, elegant wooden framing, educational atmosphere, scholarly feel, background size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 3.6 이펙트 (5종)

---

### 이펙트_01 별 파티클 (Star Particles)

```
2.5D game effect sprite, soft cel-shaded cartoon style, vibrant colors, transparent PNG background, Star Particles effect, multiple sparkling stars, golden yellow #FFEB3B #FFC107, various sizes, twinkling animation feel, celebration effect, sprite sheet 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 이펙트_02 코인 파티클 (Coin Particles)

```
2.5D game effect sprite, soft cel-shaded cartoon style, vibrant colors, transparent PNG background, Coin Particles effect, golden coins flying, gold color #FFC107 #FFD54F, spinning coin animation feel, reward celebration, money rain effect, sprite sheet 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 이펙트_03 레벨업 (Level Up)

```
2.5D game effect sprite, soft cel-shaded cartoon style, vibrant colors, transparent PNG background, Level Up effect, upward arrow burst, golden light rays #FFC107 #FFEB3B, star sparkles, achievement celebration, power up feel, sprite sheet 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 이펙트_04 부화 (Hatching)

```
2.5D game effect sprite, soft cel-shaded cartoon style, vibrant colors, transparent PNG background, Hatching effect, egg crack lines, light beam burst from crack, shell fragments flying, magical emergence, new life celebration, warm glow, sprite sheet 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 이펙트_05 성공 (Success)

```
2.5D game effect sprite, soft cel-shaded cartoon style, vibrant colors, transparent PNG background, Success effect, green checkmark burst, green glow #4CAF50 #66BB6A, sparkle particles, positive completion, achievement feel, sprite sheet 256x256 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

# 4. NPC 에셋

## 4.1 방문객 (5종)

---

### 방문객_01 가족 아버지 (Family Father)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute visitor appearance, Family Father NPC, middle-aged man visitor, casual tourist outfit, polo shirt and shorts, camera around neck, sunhat, excited tourist expression, khaki and blue colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 방문객_02 가족 어머니 (Family Mother)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute visitor appearance, Family Mother NPC, middle-aged woman visitor, casual summer dress, sunglasses on head, tote bag, happy tourist expression, pink and white colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 방문객_03 어린이 (Child Visitor)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute visitor appearance, Child Visitor NPC, young excited child, dinosaur t-shirt, shorts, dinosaur cap, holding toy dinosaur, amazed wonder expression, colorful clothes, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 방문객_04 학생 그룹 (Student)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute visitor appearance, Student Visitor NPC, teenage student on field trip, school uniform, backpack, notebook in hand, curious learning expression, navy and white colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 방문객_05 VIP 손님 (VIP Guest)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, elegant appearance, VIP Guest NPC, wealthy patron, elegant business casual attire, expensive accessories, premium sunglasses, distinguished sophisticated expression, gold and black colors, subtle premium glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 4.2 직원 (5종)

---

### 직원_01 매표원 (Ticket Seller)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Ticket Seller NPC, park staff member, park uniform polo shirt, name tag, welcoming smile, holding ticket scanner, friendly helpful expression, green and khaki uniform, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 직원_02 청소원 (Janitor)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Janitor NPC, park cleaning staff, maintenance uniform, cap, holding broom, hardworking cheerful expression, blue and gray uniform, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 직원_03 음식 판매원 (Food Vendor)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Food Vendor NPC, park food stall worker, apron and chef hat, food tray or spatula, appetizing smile, orange and white colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 직원_04 기념품샵 점원 (Gift Shop Clerk)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Gift Shop Clerk NPC, park retail staff, colorful vest, holding plush dinosaur toy, cheerful sales expression, amber and green colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 직원_05 가이드 (Tour Guide)

**Portrait**
```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Tour Guide NPC, park guide staff, safari style uniform, holding flag or megaphone, enthusiastic educational expression, khaki and green colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

# 📊 진행 체크리스트

| 카테고리 | 수량 | 완료 |
|----------|------|------|
| 타일 | 15종 | ✅ 15 / 15 |
| 나무 | 5종 | ✅ 5 / 5 |
| 바위 | 5종 | ✅ 5 / 5 |
| 식물 | 5종 | ✅ 5 / 5 |
| 날씨 | 5종 | ✅ 5 / 5 |
| 알 | 5종 | ✅ 5 / 5 |
| 먹이 | 8종 | ✅ 8 / 8 |
| 부스터 | 6종 | ✅ 6 / 6 |
| 재화 아이콘 | 4종 | ✅ 4 / 4 |
| 상태 아이콘 | 6종 | ✅ 6 / 6 |
| 버튼 | 4종 | ✅ 4 / 4 |
| 패널 | 5종 | ✅ 5 / 5 |
| 배경 | 5종 | ✅ 5 / 5 |
| 이펙트 | 5종 | ✅ 5 / 5 |
| 방문객 NPC | 5명 | ✅ 5 / 5 |
| 직원 NPC | 5명 | ✅ 5 / 5 |
| **총합** | **93종** | **✅ 93 / 93** |

---

*다이노 파크 타이쿤 - 에셋 프롬프트 (환경 & 아이템 & UI편) v1.0*
*최종 업데이트: 2026년 2월*
