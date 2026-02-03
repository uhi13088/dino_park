# 🏗️ 다이노 파크 타이쿤 - 에셋 프롬프트 (건물 & 위인편)

## 건물 50종 + 위인 50명 개별 특성 + MVP 완전한 프롬프트

---

# 📋 목차

0. [📖 사용 가이드](#-사용-가이드)
1. [건물 MVP 프롬프트](#1-건물-mvp-프롬프트)
2. [건물 50종 특성표](#2-건물-50종-특성표)
3. [위인 MVP 프롬프트](#3-위인-mvp-프롬프트)
4. [위인 50명 특성표](#4-위인-50명-특성표)
5. [환경 & 타일](#5-환경--타일)
6. [UI 에셋](#6-ui-에셋)

---

# 📖 사용 가이드

## Step 1: AI 이미지 생성

### 권장 도구

- **Midjourney** (v6 추천) - 프롬프트가 Midjourney 문법으로 작성됨
- **Leonardo AI** - `--ar`, `--v`, `--s`, `--q` 파라미터 제거 후 사용
- **Stable Diffusion** - 파라미터 제거 후 사용

### Midjourney 사용법

```
/imagine prompt: [프롬프트 전체 복사]
```

### 다른 도구 사용 시

프롬프트 끝의 파라미터 제거:

```
❌ --ar 4:5 --v 6 --s 250 --q 2
```

## Step 2: 파일명 규칙

### 건물 파일명

#### 기본 형식

```
building_{id}_{영문이름}_lv{레벨}.png
```

#### 예시

```
building_001_hatchery_lv1.png
building_001_hatchery_lv2.png
building_001_hatchery_lv3.png
building_002_dna_lab_lv1.png
building_010_gift_shop_lv1.png
```

### 위인 파일명

#### 기본 형식

```
figure_{id}_{영문이름}_{상태}.png
```

#### 상태 접미사

```
_idle     - 서있는 기본 상태
_work     - 일하는 상태
_happy    - 기쁜 상태
_portrait - 초상화 (UI용)
```

#### 예시

```
figure_001_charles_darwin_idle.png
figure_001_charles_darwin_portrait.png
figure_002_mary_anning_idle.png
figure_010_marie_curie_portrait.png
```

## Step 3: 폴더 구조

```
apps/client/src/assets/
├── buildings/
│   ├── core/                         # 핵심 시설
│   │   ├── building_001_hatchery_lv1.png
│   │   ├── building_001_hatchery_lv2.png
│   │   ├── building_001_hatchery_lv3.png
│   │   ├── building_002_dna_lab_lv1.png
│   │   └── ...
│   ├── habitats/                     # 서식지
│   │   ├── building_010_grassland_lv1.png
│   │   └── ...
│   ├── research/                     # 연구 시설
│   │   ├── building_020_fossil_center_lv1.png
│   │   └── ...
│   ├── viewing/                      # 관람 시설
│   │   ├── building_030_observation_lv1.png
│   │   └── ...
│   ├── amenities/                    # 편의 시설
│   │   ├── building_035_restroom_lv1.png
│   │   └── ...
│   ├── production/                   # 생산 시설
│   │   ├── building_040_food_factory_lv1.png
│   │   └── ...
│   ├── operations/                   # 운영 시설
│   │   ├── building_045_ranger_station_lv1.png
│   │   └── ...
│   └── decorations/                  # 장식물
│       ├── building_050_statue_lv1.png
│       └── ...
│
└── characters/
    ├── great_figures/
    │   ├── scientists/               # 과학자
    │   │   ├── figure_001_charles_darwin_idle.png
    │   │   ├── figure_001_charles_darwin_portrait.png
    │   │   └── ...
    │   ├── trainers/                 # 조련사
    │   │   ├── figure_010_owen_grady_idle.png
    │   │   └── ...
    │   ├── management/               # 경영진
    │   │   ├── figure_020_john_hammond_idle.png
    │   │   └── ...
    │   ├── explorers/                # 탐험가
    │   │   ├── figure_030_alan_grant_idle.png
    │   │   └── ...
    │   └── special/                  # 특별 인물
    │       ├── figure_045_time_traveler_idle.png
    │       └── ...
    │
    ├── visitors/                     # 방문객 → asset_items_environment.md 참조
    │
    └── staff/                        # 직원 → asset_items_environment.md 참조
```

## Step 4: 권장 크기

### 건물

| 건물 크기 | 그리드 | 픽셀    | 대상                    |
| --------- | ------ | ------- | ----------------------- |
| S         | 1×1    | 64×96   | 소형 (장식, 울타리)     |
| M         | 2×2    | 128×160 | 중형 (부화장, 연구소)   |
| L         | 3×3    | 192×240 | 대형 (서식지, 관람시설) |
| XL        | 4×4    | 256×320 | 초대형 (메인 시설)      |

### 캐릭터

| 용도           | 픽셀    | 비율 |
| -------------- | ------- | ---- |
| 미니 (파크 내) | 48×64   | 3:4  |
| 표준           | 96×128  | 3:4  |
| 초상화 (UI)    | 256×320 | 4:5  |

## Step 5: 이미지 후처리

### 필수 작업

1. **배경 제거** - 투명 PNG로 저장
2. **크기 조정** - 프롬프트에 명시된 픽셀 크기로 리사이즈
3. **파일 형식** - PNG-24 (투명도 포함)

### 건물 주의사항

- 건물은 아래 정렬 (bottom-aligned) - 바닥면이 이미지 하단에 위치
- 그림자 없음 - 게임에서 동적 그림자 처리

## 🔖 빠른 참조: 전체 ID 목록

### 건물 (50종)

#### 핵심 시설 (001-005)

```
building_001_hatchery
building_002_dna_lab
building_003_fossil_center
building_004_research_center
building_005_expedition_center
```

#### 서식지 (006-015)

```
building_006_grassland_habitat
building_007_forest_habitat
building_008_desert_habitat
building_009_tropical_habitat
building_010_aquatic_habitat
building_011_volcanic_habitat
building_012_ice_habitat
building_013_swamp_habitat
building_014_aviary
building_015_petting_zoo
```

#### 연구 시설 (016-020)

```
building_016_genetics_lab
building_017_paleontology_lab
building_018_behavior_lab
building_019_medical_center
building_020_archives
```

#### 관람 시설 (021-030)

```
building_021_observation_deck
building_022_safari_tour
building_023_underwater_tunnel
building_024_vr_experience
building_025_photo_spot
building_026_amphitheater
building_027_museum
building_028_education_center
building_029_playground
building_030_mini_train
```

#### 편의 시설 (031-035)

```
building_031_restaurant
building_032_cafe
building_033_gift_shop
building_034_restroom
building_035_first_aid
```

#### 생산 시설 (036-040)

```
building_036_food_factory
building_037_egg_storage
building_038_dna_storage
building_039_power_plant
building_040_water_treatment
```

#### 운영 시설 (041-045)

```
building_041_ranger_station
building_042_security_center
building_043_staff_center
building_044_warehouse
building_045_helipad
```

#### 장식물 (046-050)

```
building_046_fountain
building_047_statue
building_048_flower_garden
building_049_bench
building_050_lamp_post
```

### 위인 (50명)

#### 과학자 (001-015)

```
figure_001_charles_darwin
figure_002_mary_anning
figure_003_richard_owen
figure_004_gideon_mantell
figure_005_othniel_marsh
figure_006_edward_cope
figure_007_barnum_brown
figure_008_jack_horner
figure_009_paul_sereno
figure_010_xu_xing
figure_011_marie_curie
figure_012_albert_einstein
figure_013_isaac_newton
figure_014_jane_goodall
figure_015_david_attenborough
```

#### 조련사 (016-025)

```
figure_016_owen_grady
figure_017_claire_dearing
figure_018_alan_grant
figure_019_ellie_sattler
figure_020_ian_malcolm
figure_021_muldoon
figure_022_wu_henry
figure_023_roland_tembo
figure_024_billy_brennan
figure_025_sarah_harding
```

#### 경영진 (026-035)

```
figure_026_john_hammond
figure_027_simon_masrani
figure_028_benjamin_lockwood
figure_029_eli_mills
figure_030_peter_ludlow
figure_031_henry_wu_ceo
figure_032_mills_corporate
figure_033_ingen_director
figure_034_masrani_executive
figure_035_park_manager
```

#### 탐험가 (036-045)

```
figure_036_adventurer_01
figure_037_adventurer_02
figure_038_fossil_hunter_01
figure_039_fossil_hunter_02
figure_040_expedition_leader
figure_041_jungle_guide
figure_042_marine_explorer
figure_043_cave_diver
figure_044_aerial_scout
figure_045_tracker
```

#### 특별 인물 (046-050)

```
figure_046_time_traveler
figure_047_future_scientist
figure_048_dino_whisperer
figure_049_legend_tamer
figure_050_ultimate_keeper
```

---

# 1. 건물 MVP 프롬프트

> 바로 복사해서 Midjourney에 붙여넣기!

---

## 건물\_01 부화장 (Hatchery) - M, Lv.1

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, blend of modern and natural materials, cozy inviting atmosphere, miniature diorama feel, Hatchery building level 1, egg incubation facility, dome structure with glass panels, eggs visible inside, warm interior lighting, scientific equipment, green accent #4CAF50, basic design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

## 건물\_02 부화장 Lv.3

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, blend of modern and natural materials, cozy inviting atmosphere, miniature diorama feel, Hatchery building level 3 maximum upgrade, egg incubation facility, large elaborate dome structure with multiple glass panels, many eggs visible inside, advanced scientific equipment, golden trim decorations, green accent #4CAF50, subtle glow effect, premium quality, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 건물\_03 초원 서식지 (Grassland Habitat) - L, Lv.1

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, natural environment features, Grassland Habitat enclosure level 1, dinosaur enclosure with wooden fence perimeter, lush green grass interior, small trees, feeding trough, water pond, green accent #4CAF50, welcoming natural space, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 건물\_04 DNA 연구소 (DNA Lab) - M, Lv.1

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, modern scientific facility, DNA Research Lab level 1, modern laboratory building, glass windows, DNA helix logo on building, scientific equipment visible inside, blue accent #2196F3, clean professional design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 건물\_05 푸드코트 (Food Court) - M, Lv.1

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, visitor service building, Food Court level 1, outdoor dining area with umbrella tables, food stalls, dinosaur-themed decorations, colorful signage, orange accent #FF9800, welcoming atmosphere, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 건물\_06 입구 게이트 (Entrance Gate) - XL, Lv.1

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, grand entrance, Park Entrance Gate level 1, large stone archway with DINO PARK text, wooden doors, torch decorations, dinosaur skull ornaments, prehistoric theme, green and brown natural colors, welcoming grand entrance, building size 256x320 pixels, 4x4 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 건물\_07 기념품샵 (Gift Shop) - S, Lv.1

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell and Clash of Clans art style, theme park architecture, retail building, Gift Shop level 1, small cute shop building, large display windows with plushies visible, dinosaur logo sign, colorful awning, amber gold accent #FFC107, inviting retail space, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

# 2. 건물 50종 특성표

> 마스터 스타일 + 건물 스타일 + 아래 특성 + 레벨 + 사이즈 조합

## 공룡 서식지 (8종)

| #   | 이름        | 크기 | 개별 특성                                                                                                                                                                |
| --- | ----------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 초원 서식지 | L    | `Grassland Habitat, dinosaur enclosure, wooden fence perimeter, lush green grass, small trees, feeding trough, water pond, green accent #4CAF50,`                        |
| 2   | 숲 서식지   | L    | `Forest Habitat, dense tree coverage enclosure, tall trees inside, shaded areas, forest floor, brown and green natural colors,`                                          |
| 3   | 육식 서식지 | L    | `Carnivore Habitat, reinforced steel fence enclosure, rocky terrain inside, meat feeding station, warning signs, red accent #F44336,`                                    |
| 4   | 익룡 돔     | XL   | `Pterosaur Dome, large glass dome aviary, tall interior space, perching platforms at various heights, flying space, blue sky visible through dome, blue accent #2196F3,` |
| 5   | 해양관      | XL   | `Marine Aquarium, large glass tank structure, underwater viewing area, blue water interior, coral decorations, fish visible, teal accent #00BCD4,`                       |
| 6   | 사막 서식지 | L    | `Desert Habitat, sandy terrain enclosure, cacti and rocks, shade structures, water oasis, orange and tan colors #FF9800,`                                                |
| 7   | 화산 서식지 | L    | `Volcanic Habitat, dark rocky terrain, lava accents, heat-resistant fencing, smoke effects, red and black colors #D84315,`                                               |
| 8   | 빙하 서식지 | L    | `Glacier Habitat, snowy terrain enclosure, ice formations, heated shelters, cool blue lighting, white and blue colors #B3E5FC,`                                          |

## 연구 시설 (6종)

| #   | 이름        | 크기 | 개별 특성                                                                                                                                                       |
| --- | ----------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | 부화장      | M    | `Hatchery, egg incubation facility, dome structure with glass panels, eggs visible inside, warm interior lighting, scientific equipment, green accent #4CAF50,` |
| 10  | DNA 연구소  | M    | `DNA Research Lab, modern laboratory building, glass windows, DNA helix logo, scientific equipment visible, blue accent #2196F3,`                               |
| 11  | 화석 연구소 | M    | `Fossil Research Lab, archaeological building, fossil displays visible, excavation tools, amber and brown colors #8D6E63,`                                      |
| 12  | 유전자 센터 | L    | `Genetics Center, advanced research facility, multiple lab sections, high-tech equipment, purple accent #9C27B0,`                                               |
| 13  | 진화 연구소 | L    | `Evolution Lab, specialized research building, evolution charts visible, specimen jars, green and blue scientific colors,`                                      |
| 14  | 행동 연구소 | M    | `Behavior Research Lab, observation facility, one-way glass windows, monitoring equipment, gray and green colors #607D8B,`                                      |

## 관람 시설 (6종)

| #   | 이름       | 크기 | 개별 특성                                                                                                                      |
| --- | ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 15  | 관람대     | S    | `Viewing Platform, elevated wooden platform, safety railings, binocular stations, scenic overlook, brown wood colors #8D6E63,` |
| 16  | 관람 열차  | M    | `Tour Train, small train station, cute locomotive visible, passenger cars, track visible, colorful train design,`              |
| 17  | 관람 지프  | S    | `Safari Jeep Station, jeep garage structure, safari jeeps visible, adventure equipment, khaki and green colors,`               |
| 18  | 수중 터널  | L    | `Underwater Tunnel, glass tunnel structure, underwater viewing, fish swimming around, blue lighting, teal accent #00BCD4,`     |
| 19  | 스카이워크 | M    | `Skywalk, elevated glass walkway, tree-top level, panoramic views, modern design, transparent elements,`                       |
| 20  | 포토존     | S    | `Photo Zone, decorative backdrop area, dinosaur statue props, camera spot markers, colorful and fun design,`                   |

## 편의 시설 (12종)

| #   | 이름          | 크기 | 개별 특성                                                                                                                          |
| --- | ------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 21  | 푸드코트      | M    | `Food Court, outdoor dining area with umbrella tables, food stalls, dinosaur-themed decorations, orange accent #FF9800,`           |
| 22  | 기념품샵      | S    | `Gift Shop, small cute shop, large display windows with plushies, dinosaur logo sign, colorful awning, amber gold accent #FFC107,` |
| 23  | 화장실        | S    | `Restroom, small utility building, male and female symbols, clean modern design, gray and white colors,`                           |
| 24  | 음수대        | XS   | `Drinking Fountain, small fountain fixture, dinosaur-shaped spout, stone base, blue water accent,`                                 |
| 25  | 벤치          | XS   | `Park Bench, wooden bench, comfortable seating, dinosaur footprint decorations, brown wood color,`                                 |
| 26  | 디노 카페     | M    | `Dino Cafe, coffee shop building, outdoor seating, dinosaur-themed cups logo, cozy atmosphere, brown accent #795548,`              |
| 27  | 아이스크림샵  | S    | `Ice Cream Shop, small cute shop, ice cream cone sign, colorful decorations, pink and white colors #E91E63,`                       |
| 28  | 디노 레스토랑 | L    | `Dino Restaurant, large dining establishment, dinosaur skeleton decoration, elegant design, warm amber lighting,`                  |
| 29  | 구급소        | S    | `First Aid Station, medical facility, red cross symbol, clean white building, emergency equipment, red accent #F44336,`            |
| 30  | 정보센터      | M    | `Information Center, visitor services building, large info sign, maps available, helpful staff visible, blue accent #2196F3,`      |
| 31  | 물품보관소    | S    | `Locker Storage, small utility building, numbered lockers visible, secure storage, gray metal colors,`                             |
| 32  | ATM           | XS   | `ATM Machine, small kiosk structure, screen visible, card slot, bank logo, gray and blue colors,`                                  |

## 생산 시설 (6종)

| #   | 이름        | 크기 | 개별 특성                                                                                                                 |
| --- | ----------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 33  | 사료 공장   | M    | `Feed Factory, industrial building, silos visible, conveyor elements, production facility, brown and gray colors,`        |
| 34  | 육류 저장소 | M    | `Meat Storage, cold storage facility, refrigeration units, meat hanging visible, steel structure, cool blue-gray colors,` |
| 35  | 어류 양식장 | M    | `Fish Farm, aquaculture facility, fish tanks visible, water filtration, blue and silver colors #03A9F4,`                  |
| 36  | 발전소      | L    | `Power Plant, electrical facility, power lines, generator building, industrial design, yellow warning accents #FFC107,`   |
| 37  | 저수지      | L    | `Water Reservoir, large water tank, pump station, pipe network, blue water, industrial clean design,`                     |
| 38  | 창고        | M    | `Storage Warehouse, large storage building, loading dock, boxes and crates visible, brown and gray industrial,`           |

## 운영 시설 (6종)

| #   | 이름        | 크기 | 개별 특성                                                                                                                               |
| --- | ----------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 39  | 관리사무소  | M    | `Admin Office, office building, professional design, STAFF sign, parking area, gray and blue colors,`                                   |
| 40  | 보안센터    | M    | `Security Center, monitoring facility, security cameras, guard station, warning lights, dark blue accent #1A237E,`                      |
| 41  | 동물병원    | M    | `Veterinary Hospital, medical facility for dinosaurs, large entrance for dinosaurs, medical equipment, white and green colors,`         |
| 42  | 직원 숙소   | M    | `Staff Quarters, dormitory building, multiple rooms, residential design, comfortable appearance, warm colors,`                          |
| 43  | 입구 게이트 | XL   | `Entrance Gate, large stone archway with DINO PARK text, wooden doors, torch decorations, dinosaur skull ornaments, prehistoric theme,` |
| 44  | 주차장      | L    | `Parking Lot, paved parking area, car spaces marked, entry booth, directional signs, gray asphalt,`                                     |

## 장식 (6종)

| #   | 이름      | 크기 | 개별 특성                                                                                                       |
| --- | --------- | ---- | --------------------------------------------------------------------------------------------------------------- |
| 45  | 공룡 동상 | S    | `Dinosaur Statue, bronze or stone dinosaur sculpture, dramatic pose, decorative pedestal, impressive landmark,` |
| 46  | 분수대    | M    | `Fountain, decorative water fountain, dinosaur or prehistoric theme, water jets, circular pool, blue water,`    |
| 47  | 화단      | XS   | `Flower Bed, colorful flowers arrangement, prehistoric fern accents, stone border, vibrant colors,`             |
| 48  | 가로등    | XS   | `Street Lamp, decorative lamp post, dinosaur-themed design, warm light glow, bronze or iron material,`          |
| 49  | 울타리    | XS   | `Fence Section, decorative fence, wooden or stone material, path border, natural colors,`                       |
| 50  | 길        | XS   | `Path Tile, stone or wooden walkway, pathway section, natural integration, gray or brown,`                      |

---

# 3. 위인 MVP 프롬프트

---

## 위인\_01 닥터 진 (Dr. Jin) - 수석 유전학자

### Portrait

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Dr. Jin character, lead geneticist, female Korean scientist, white lab coat, round glasses, holding DNA helix model, short black hair, confident intellectual expression, green trim accent #4CAF50, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

### Sprite

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left 315 degrees, transparent PNG background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Dr. Jin character, lead geneticist, female Korean scientist, white lab coat, round glasses, short black hair, confident smile, green trim accent #4CAF50, standing idle pose, character sprite 96x128 pixels, --ar 3:4 --v 6 --s 250 --q 2
```

---

## 위인\_02 아서 해먼드 (Arthur Hammond) - 창립자/회장

### Portrait

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Arthur Hammond character, park founder and chairman, elderly man with white beard, safari outfit with hat, walking cane with amber top, kind grandfatherly smile, visionary expression, amber gold accent #FFC107, legendary golden rim glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 위인\_03 올리비아 (Olivia) - 수석 조련사

### Portrait

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Olivia character, head dinosaur trainer, athletic woman, khaki safari uniform, utility belt with tools, ponytail hair, confident brave expression, whistle around neck, orange accent #FF7043, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 위인\_04 헬렌 박사 (Dr. Helen) - 고생물학자

### Portrait

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Dr. Helen character, paleontologist, middle-aged woman, field vest over shirt, magnifying glass in hand, gray streaked hair in bun, wise scholarly expression, fossil brush tools, brown and tan colors #8D6E63, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 위인\_05 헨리 우 (Dr. Henry Wu) - 수석 유전학자

### Portrait

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Dr. Henry Wu character, chief geneticist legendary scientist, Asian man, pristine white lab coat, high-tech tablet in hand, neat black hair, calculating intelligent expression, mysterious genius aura, purple accent #9C27B0, legendary golden rim glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

# 4. 위인 50명 특성표

> 마스터 스타일 + 캐릭터 스타일 + 아래 특성 + 상태 + 사이즈 조합

## 과학자 (15명)

| #   | 이름      | 직업          | 등급       | 개별 특성                                                                                                                                                              |
| --- | --------- | ------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 닥터 진   | 유전학자      | ⭐⭐⭐     | `Dr. Jin, lead geneticist, female Korean scientist, white lab coat, round glasses, holding DNA model, short black hair, confident intellectual, green accent #4CAF50,` |
| 2   | 헬렌 박사 | 고생물학자    | ⭐⭐⭐     | `Dr. Helen, paleontologist, middle-aged woman, field vest, magnifying glass, gray hair in bun, wise scholarly, fossil tools, brown accent #8D6E63,`                    |
| 3   | 아키라    | 생물학자      | ⭐⭐       | `Akira, biologist, young Japanese man, lab coat with nature patches, binoculars, messy black hair, curious enthusiastic, green accent #4CAF50,`                        |
| 4   | 엘레나    | 유전공학자    | ⭐⭐⭐     | `Elena, genetic engineer, Eastern European woman, modern lab coat, tablet with gene sequences, blonde ponytail, precise focused, blue accent #2196F3,`                 |
| 5   | 사이먼    | 화학자        | ⭐⭐       | `Simon, chemist, British man, lab coat with goggles, test tubes, ginger hair, cautious meticulous, teal accent #00BCD4,`                                               |
| 6   | 미라      | 진화생물학자  | ⭐⭐⭐     | `Mira, evolutionary biologist, Indian woman, casual lab attire, evolution chart, long dark hair, thoughtful analytical, purple accent #7E57C2,`                        |
| 7   | 헨리 우   | 수석 유전학자 | ⭐⭐⭐⭐⭐ | `Dr. Henry Wu, chief geneticist, Asian man, pristine white lab coat, high-tech tablet, neat black hair, calculating genius, purple accent #9C27B0, legendary glow,`    |
| 8   | 그레이스  | 수의생물학자  | ⭐⭐       | `Grace, veterinary biologist, friendly woman, medical scrubs, stethoscope, curly brown hair, caring gentle, teal accent #26A69A,`                                      |
| 9   | 마르코    | 해양생물학자  | ⭐⭐⭐     | `Marco, marine biologist, Italian man, wetsuit top, underwater tablet, short dark hair, adventurous passionate, blue accent #0097A7,`                                  |
| 10  | 소피아    | 행동학자      | ⭐⭐       | `Sophia, behavioral scientist, young woman, casual smart attire, observation notebook, auburn hair, patient observant, green accent #8BC34A,`                          |
| 11  | 빅터      | 생체공학자    | ⭐⭐⭐     | `Victor, biomedical engineer, Eastern European man, tech lab coat, cybernetic tools, gray temples, innovative brilliant, silver accent #607D8B,`                       |
| 12  | 로즈      | 식물학자      | ⭐⭐       | `Rose, botanist, older woman, gardening apron over lab coat, plant samples, white hair, nurturing knowledgeable, green accent #689F38,`                                |
| 13  | 레오      | 영양학자      | ⭐⭐       | `Leo, nutritionist, young man, chef coat hybrid, food analysis tools, blonde hair, health-focused friendly, orange accent #FF9800,`                                    |
| 14  | 에이다    | AI 연구원     | ⭐⭐⭐     | `Ada, AI researcher, young woman, modern tech wear, holographic interface, short purple-dyed hair, futuristic innovative, cyan accent #00BCD4,`                        |
| 15  | 오스카    | 기상학자      | ⭐⭐       | `Oscar, meteorologist, middle-aged man, weather station uniform, radar tablet, receding brown hair, analytical precise, blue accent #1976D2,`                          |

## 조련사 (10명)

| #   | 이름     | 전문              | 등급     | 개별 특성                                                                                                                                             |
| --- | -------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16  | 올리비아 | 수석 조련사       | ⭐⭐⭐⭐ | `Olivia, head trainer, athletic woman, khaki safari uniform, utility belt, ponytail hair, confident brave, whistle, orange accent #FF7043,`           |
| 17  | 잭       | 육식 전문         | ⭐⭐⭐   | `Jack, carnivore specialist, rugged man, reinforced gear, protective gloves, stubble beard, fearless tough, red accent #E53935,`                      |
| 18  | 유나     | 초식 전문         | ⭐⭐⭐   | `Yuna, herbivore specialist, Korean woman, soft colored uniform, treat bag, long black hair, gentle patient, green accent #66BB6A,`                   |
| 19  | 카를로스 | 익룡 전문         | ⭐⭐⭐   | `Carlos, pterosaur specialist, Hispanic man, climbing gear, wing-shaped whistle, dark curly hair, agile daring, blue accent #42A5F5,`                 |
| 20  | 마리나   | 해양 전문         | ⭐⭐⭐   | `Marina, marine specialist, woman, wetsuit, underwater communication device, wet hair, aquatic graceful, teal accent #00ACC1,`                        |
| 21  | 데릭     | 조련 보조         | ⭐⭐     | `Derek, training assistant, young man, basic trainer uniform, clipboard, short brown hair, eager learning, khaki colors,`                             |
| 22  | 니나     | 하이브리드 전문가 | ⭐⭐⭐⭐ | `Nina, hybrid specialist, mysterious woman, specialized containment gear, scanner device, silver-white hair, cautious expert, purple accent #9C27B0,` |
| 23  | 톰       | 야간 조련사       | ⭐⭐     | `Tom, night trainer, man with night vision goggles, dark uniform, flashlight, tired but alert expression, dark blue accent #1A237E,`                  |
| 24  | 아이샤   | 부화 전문         | ⭐⭐⭐   | `Aisha, hatching specialist, African woman, incubation technician uniform, egg monitoring device, warm smile, amber accent #FFB300,`                  |
| 25  | 루이스   | 수석 수의사       | ⭐⭐⭐   | `Dr. Louis, head veterinarian, older man, vet coat, medical bag, gray hair, compassionate skilled, white and green colors,`                           |

## 운영진 (10명)

| #   | 이름        | 직위        | 등급       | 개별 특성                                                                                                                                                                          |
| --- | ----------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 26  | 아서 해먼드 | 창립자/회장 | ⭐⭐⭐⭐⭐ | `Arthur Hammond, park founder chairman, elderly man, white beard, safari outfit with hat, walking cane with amber top, kind visionary, amber gold accent #FFC107, legendary glow,` |
| 27  | 캐서린      | CEO         | ⭐⭐⭐⭐   | `Catherine, CEO, professional woman, executive suit, tablet, elegant updo hair, decisive leader, navy blue accent #1A237E,`                                                        |
| 28  | 제임스      | COO         | ⭐⭐⭐     | `James, COO, business man, suit with operations badge, walkie-talkie, neat brown hair, efficient organized, gray accent #546E7A,`                                                  |
| 29  | 나탈리      | 마케팅      | ⭐⭐⭐     | `Natalie, marketing director, creative woman, stylish business casual, presentation tablet, trendy hairstyle, enthusiastic persuasive, pink accent #E91E63,`                       |
| 30  | 마이클      | 재무        | ⭐⭐⭐     | `Michael, finance director, conservative man, formal suit, calculator and charts, glasses, analytical careful, green money accent #4CAF50,`                                        |
| 31  | 에밀리      | HR          | ⭐⭐       | `Emily, HR manager, friendly woman, professional attire, employee files, warm smile, approachable supportive, light blue accent #64B5F6,`                                          |
| 32  | 다니엘      | 보안        | ⭐⭐⭐     | `Daniel, security chief, serious man, security uniform, radio earpiece, military bearing, protective vigilant, dark blue accent #1A237E,`                                          |
| 33  | 사라        | 고객서비스  | ⭐⭐       | `Sarah, guest services, cheerful woman, park uniform with name tag, info tablet, bright smile, helpful welcoming, orange accent #FF9800,`                                          |
| 34  | 로버트      | 시설        | ⭐⭐       | `Robert, facilities manager, practical man, maintenance uniform, tool belt, hardhat, reliable handy, yellow accent #FFC107,`                                                       |
| 35  | 앤젤라      | 이벤트      | ⭐⭐⭐     | `Angela, events coordinator, energetic woman, creative business casual, event planner tablet, colorful accessories, festive organized, purple accent #7E57C2,`                     |

## 탐험가 (10명)

| #   | 이름     | 전문          | 등급     | 개별 특성                                                                                                                                            |
| --- | -------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 36  | 인디아나 | 전설의 탐험가 | ⭐⭐⭐⭐ | `Indiana, legendary explorer, rugged man, classic fedora hat, leather jacket, whip on belt, stubble beard, adventurous brave, brown accent #795548,` |
| 37  | 라라     | 고고학자      | ⭐⭐⭐   | `Lara, archaeologist, athletic woman, exploration gear, dual holsters, braid hair, determined resourceful, teal accent #009688,`                     |
| 38  | 알렉스   | 정글 탐험가   | ⭐⭐⭐   | `Alex, jungle explorer, young man, safari gear, machete, compass, wild hair, fearless curious, green accent #388E3C,`                                |
| 39  | 에바     | 극지 탐험가   | ⭐⭐⭐   | `Eva, polar explorer, Nordic woman, cold weather gear, ice pick, fur-lined hood, resilient tough, ice blue accent #B3E5FC,`                          |
| 40  | 한       | 동굴 탐험가   | ⭐⭐     | `Han, cave explorer, Asian man, caving helmet with light, climbing gear, rope, cautious methodical, gray accent #757575,`                            |
| 41  | 이사벨   | 해저 탐험가   | ⭐⭐⭐   | `Isabel, deep sea explorer, woman, advanced diving suit, underwater camera, collected hair, daring aquatic, deep blue accent #0D47A1,`               |
| 42  | 닐       | 사막 탐험가   | ⭐⭐     | `Neil, desert explorer, weathered man, desert gear, water canteen, sun hat, enduring patient, sand tan accent #D7CCC8,`                              |
| 43  | 미카     | 화산 탐험가   | ⭐⭐⭐   | `Mika, volcano explorer, woman, heat-resistant suit, temperature scanner, tied-back hair, bold scientific, orange red accent #FF5722,`               |
| 44  | 조지     | 신입 탐험가   | ⭐       | `George, rookie explorer, young eager man, basic exploration gear, map and notebook, messy hair, enthusiastic nervous, khaki colors,`                |
| 45  | 빅토리아 | 전설 사냥꾼   | ⭐⭐⭐⭐ | `Victoria, legendary hunter, elegant mature woman, refined expedition wear, antique rifle, silver streak hair, precise deadly, gold accent #FFC107,` |

## 특수 (5명)

| #   | 이름       | 역할          | 등급       | 개별 특성                                                                                                                                                                      |
| --- | ---------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 46  | 타임키퍼   | 시간 관리자   | ⭐⭐⭐⭐⭐ | `Timekeeper, time manager, mystical androgynous figure, clock-themed robes, hourglass staff, ageless appearance, ethereal glow, gold accent #FFC107, legendary glow,`          |
| 47  | 포춘       | 행운의 신     | ⭐⭐⭐⭐⭐ | `Fortune, luck deity, playful figure, four-leaf clover motifs, golden coin accessories, shimmering appearance, lucky aura, green gold accent #8BC34A #FFC107, legendary glow,` |
| 48  | 가이아     | 자연의 수호자 | ⭐⭐⭐⭐⭐ | `Gaia, nature guardian, earth mother figure, living plant dress, flower crown, nature integrated appearance, nurturing powerful, green accent #4CAF50, legendary glow,`        |
| 49  | 아틀라스   | 힘의 화신     | ⭐⭐⭐⭐⭐ | `Atlas, strength embodiment, muscular giant figure, stone skin accents, carrying world pose, powerful eternal, stone gray accent #607D8B, legendary glow,`                     |
| 50  | 알케미스트 | 연금술사      | ⭐⭐⭐⭐⭐ | `Alchemist, mystical scientist, robed figure, potion bottles, transmutation circles, mysterious wise, purple gold accent #9C27B0 #FFC107, legendary glow,`                     |

---

# 5. 환경 & 타일

## 기본 타일 (64×32 아이소메트릭)

| #   | 이름              | 특성                                                                                       |
| --- | ----------------- | ------------------------------------------------------------------------------------------ |
| 1   | 잔디 (밝음)       | `bright grass tile, lush green #4CAF50, isometric diamond,`                                |
| 2   | 잔디 (어두움)     | `dark grass tile, deep green #388E3C, isometric diamond,`                                  |
| 3   | 잔디 (꽃)         | `grass tile with flowers, green with colorful flowers, isometric diamond,`                 |
| 4   | 흙길              | `dirt path tile, brown earth #8D6E63, worn path texture, isometric diamond,`               |
| 5   | 돌길              | `stone path tile, gray cobblestone #9E9E9E, paved texture, isometric diamond,`             |
| 6   | 나무길            | `wooden boardwalk tile, brown planks #795548, isometric diamond,`                          |
| 7   | 물 (얕음)         | `shallow water tile, light blue #4FC3F7, transparent ripples, isometric diamond,`          |
| 8   | 물 (깊음)         | `deep water tile, dark blue #0288D1, depth visible, isometric diamond,`                    |
| 9   | 모래              | `sand tile, tan beach sand #FFE0B2, fine texture, isometric diamond,`                      |
| 10  | 화산암            | `volcanic rock tile, dark gray #424242, rough texture, isometric diamond,`                 |
| 11  | 눈                | `snow tile, white #FFFFFF, pristine snow, isometric diamond,`                              |
| 12  | 얼음              | `ice tile, light blue transparent #B3E5FC, frozen surface, isometric diamond,`             |
| 13  | 늪지              | `swamp tile, murky green #558B2F, wet muddy, isometric diamond,`                           |
| 14  | 그리드 하이라이트 | `grid highlight tile, green glow outline #4CAF50, placement indicator, isometric diamond,` |
| 15  | 그리드 블로킹     | `grid blocking tile, red glow outline #F44336, cannot place indicator, isometric diamond,` |

## 자연 소품

| 카테고리 | 소품 목록                                            |
| -------- | ---------------------------------------------------- |
| 나무     | 참나무, 침엽수, 야자수, 선사시대 양치류, 고대 침엽수 |
| 바위     | 작은 돌, 중간 바위, 큰 바위, 이끼 바위, 화산 바위    |
| 식물     | 덤불, 꽃, 양치류, 선인장, 습지 식물                  |

---

# 6. UI 에셋

## 아이콘 사이즈

| 용도 | 사이즈 | 스타일                                           |
| ---- | ------ | ------------------------------------------------ |
| 메뉴 | 32×32  | `flat icon, rounded corners, vibrant color,`     |
| 재화 | 32×32  | `currency icon, shiny metallic, distinct shape,` |
| 액션 | 48×48  | `action button icon, bold clear, single color,`  |
| 상태 | 24×24  | `status icon, simple indicator, color-coded,`    |

## 재화 아이콘

| 재화   | 특성                                                                    |
| ------ | ----------------------------------------------------------------------- |
| 골드   | `gold coin icon, shiny yellow #FFC107, coin shape with dinosaur stamp,` |
| 다이아 | `diamond icon, sparkling blue #2196F3, gem cut shape,`                  |
| DNA    | `DNA icon, double helix green #4CAF50, science symbol,`                 |
| 에너지 | `energy icon, lightning bolt orange #FF9800, power symbol,`             |

## 버튼 스타일

| 타입      | 특성                                                          |
| --------- | ------------------------------------------------------------- |
| Primary   | `primary button, green #4CAF50, rounded rectangle, shadow,`   |
| Secondary | `secondary button, blue #2196F3, rounded rectangle, lighter,` |
| Warning   | `warning button, orange #FF9800, rounded rectangle,`          |
| Danger    | `danger button, red #F44336, rounded rectangle,`              |

---

# 7. 건물 완전한 프롬프트 (43종)

> MVP 7종을 제외한 나머지 43종의 완전한 프롬프트입니다.

---

## 7.1 공룡 서식지 (7종)

---

### 건물\_02 숲 서식지 (Forest Habitat) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, natural environment features, Forest Habitat dinosaur enclosure, dense tree coverage enclosure, tall trees inside, shaded areas, forest floor with leaves, brown and green natural colors, welcoming natural space, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_03 육식 서식지 (Carnivore Habitat) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, secure enclosure features, Carnivore Habitat dinosaur enclosure, reinforced steel fence enclosure, rocky terrain inside, meat feeding station, warning signs, red accent #F44336, high security design, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_04 익룡 돔 (Pterosaur Dome) - XL

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, aviary structure, Pterosaur Dome large glass dome aviary, tall interior space, perching platforms at various heights, flying space, blue sky visible through dome, blue accent #2196F3, impressive dome structure, building size 256x320 pixels, 4x4 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_05 해양관 (Marine Aquarium) - XL

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, aquarium structure, Marine Aquarium large glass tank structure, underwater viewing area, blue water interior, coral decorations, fish visible, teal accent #00BCD4, impressive aquatic facility, building size 256x320 pixels, 4x4 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_06 사막 서식지 (Desert Habitat) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, desert environment features, Desert Habitat dinosaur enclosure, sandy terrain enclosure, cacti and rocks, shade structures, water oasis, orange and tan colors #FF9800, warm desert atmosphere, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_07 화산 서식지 (Volcanic Habitat) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, volcanic environment features, Volcanic Habitat dinosaur enclosure, dark rocky terrain, lava accents, heat-resistant fencing, smoke effects, red and black colors #D84315, dramatic volcanic atmosphere, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_08 빙하 서식지 (Glacier Habitat) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, arctic environment features, Glacier Habitat dinosaur enclosure, snowy terrain enclosure, ice formations, heated shelters, cool blue lighting, white and blue colors #B3E5FC, cold atmospheric design, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 7.2 연구 시설 (4종)

---

### 건물\_11 화석 연구소 (Fossil Research Lab) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, research facility, Fossil Research Lab archaeological building, fossil displays visible, excavation tools, amber and brown colors #8D6E63, scientific discovery atmosphere, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_12 유전자 센터 (Genetics Center) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, advanced research facility, Genetics Center advanced research building, multiple lab sections, high-tech equipment visible, purple accent #9C27B0, cutting-edge science design, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_13 진화 연구소 (Evolution Lab) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, research facility, Evolution Lab specialized research building, evolution charts visible through windows, specimen jars, green and blue scientific colors, educational atmosphere, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_14 행동 연구소 (Behavior Research Lab) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, research facility, Behavior Research Lab observation facility, one-way glass windows, monitoring equipment visible, gray and green colors #607D8B, scientific observation design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 7.3 관람 시설 (6종)

---

### 건물\_15 관람대 (Viewing Platform) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, viewing structure, Viewing Platform elevated wooden platform, safety railings, binocular stations, scenic overlook design, brown wood colors #8D6E63, tourist-friendly design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_16 관람 열차 (Tour Train) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, transportation station, Tour Train Station small train station building, cute locomotive visible, passenger cars on track, colorful train design, fun transportation, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_17 관람 지프 (Safari Jeep Station) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, vehicle station, Safari Jeep Station jeep garage structure, safari jeeps visible, adventure equipment, khaki and green colors, outdoor adventure design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_18 수중 터널 (Underwater Tunnel) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, underwater viewing structure, Underwater Tunnel glass tunnel structure, underwater viewing area, fish swimming around, blue lighting, teal accent #00BCD4, immersive aquatic experience, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_19 스카이워크 (Skywalk) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, elevated walkway, Skywalk elevated glass walkway structure, tree-top level, panoramic views, modern design, transparent glass elements, scenic viewing design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_20 포토존 (Photo Zone) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, photo opportunity area, Photo Zone decorative backdrop area, dinosaur statue props, camera spot markers, colorful and fun design, tourist attraction, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 7.4 편의 시설 (10종)

---

### 건물\_23 화장실 (Restroom) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, utility building, Restroom small utility building, male and female symbols on door, clean modern design, gray and white colors, functional clean design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_24 음수대 (Drinking Fountain) - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, water fixture, Drinking Fountain small fountain fixture, dinosaur-shaped spout, stone base, blue water accent, cute functional design, building size 32x48 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_25 벤치 (Park Bench) - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, seating, Park Bench wooden bench, comfortable seating design, dinosaur footprint decorations, brown wood color #795548, welcoming rest spot, building size 32x48 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_26 디노 카페 (Dino Cafe) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, food service building, Dino Cafe coffee shop building, outdoor seating area, dinosaur-themed cups logo, cozy warm atmosphere, brown accent #795548, inviting cafe design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_27 아이스크림샵 (Ice Cream Shop) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, treat shop, Ice Cream Shop small cute shop building, ice cream cone sign on roof, colorful decorations, pink and white colors #E91E63, sweet inviting design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_28 디노 레스토랑 (Dino Restaurant) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, dining establishment, Dino Restaurant large dining building, dinosaur skeleton decoration inside, elegant design, warm amber interior lighting, premium dining atmosphere, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_29 구급소 (First Aid Station) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, medical facility, First Aid Station medical facility building, red cross symbol on front, clean white building, emergency equipment visible, red accent #F44336, safety focused design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_30 정보센터 (Information Center) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, visitor services, Information Center visitor services building, large info sign, maps available display, helpful staff silhouette visible, blue accent #2196F3, welcoming information hub, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_31 물품보관소 (Locker Storage) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, storage facility, Locker Storage small utility building, numbered lockers visible, secure storage design, gray metal colors #757575, practical secure design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_32 ATM - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, financial kiosk, ATM Machine small kiosk structure, screen visible, card slot, bank logo, gray and blue colors, modern banking design, building size 32x48 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 7.5 생산 시설 (6종)

---

### 건물\_33 사료 공장 (Feed Factory) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, industrial building, Feed Factory industrial production building, silos visible, conveyor elements, production facility design, brown and gray colors, functional industrial design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_34 육류 저장소 (Meat Storage) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, cold storage facility, Meat Storage cold storage building, refrigeration units on exterior, meat hanging visible through window, steel structure, cool blue-gray colors, industrial cold storage design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_35 어류 양식장 (Fish Farm) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, aquaculture facility, Fish Farm aquaculture building, fish tanks visible, water filtration systems, blue and silver colors #03A9F4, aquatic production design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_36 발전소 (Power Plant) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, power facility, Power Plant electrical facility building, power lines extending, generator building structure, industrial design, yellow warning accents #FFC107, energy production design, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_37 저수지 (Water Reservoir) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, water facility, Water Reservoir large water tank structure, pump station, pipe network visible, blue water tank, industrial clean design, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_38 창고 (Storage Warehouse) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, storage facility, Storage Warehouse large storage building, loading dock, boxes and crates visible, brown and gray industrial colors, functional storage design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 7.6 운영 시설 (5종)

---

### 건물\_39 관리사무소 (Admin Office) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, office building, Admin Office professional office building, STAFF sign on front, parking area, gray and blue colors, professional management design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_40 보안센터 (Security Center) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, security facility, Security Center monitoring facility building, security cameras on exterior, guard station, warning lights, dark blue accent #1A237E, secure vigilant design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_41 동물병원 (Veterinary Hospital) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, medical facility, Veterinary Hospital medical facility for dinosaurs, large entrance for big dinosaurs, medical equipment visible, white and green colors, caring medical design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_42 직원 숙소 (Staff Quarters) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, residential building, Staff Quarters dormitory building, multiple room windows, residential design, comfortable appearance, warm friendly colors, homey staff housing design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_44 주차장 (Parking Lot) - L

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park architecture, parking facility, Parking Lot paved parking area, car spaces marked, entry booth, directional signs, gray asphalt, functional parking design, building size 192x240 pixels, 3x3 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 7.7 장식 (6종)

---

### 건물\_45 공룡 동상 (Dinosaur Statue) - S

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park decoration, Dinosaur Statue bronze or stone dinosaur sculpture, dramatic pose, decorative pedestal, impressive landmark design, building size 64x96 pixels, 1x1 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_46 분수대 (Fountain) - M

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park decoration, Fountain decorative water fountain, dinosaur or prehistoric theme sculpture, water jets, circular pool, blue water, beautiful centerpiece design, building size 128x160 pixels, 2x2 grid, bottom-aligned, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_47 화단 (Flower Bed) - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park decoration, Flower Bed colorful flowers arrangement, prehistoric fern accents, stone border, vibrant flower colors, beautiful garden element, building size 32x48 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_48 가로등 (Street Lamp) - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park decoration, Street Lamp decorative lamp post, dinosaur-themed design elements, warm light glow, bronze or iron material, atmospheric lighting element, building size 32x64 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_49 울타리 (Fence Section) - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park decoration, Fence Section decorative fence segment, wooden or stone material, path border, natural colors #795548, functional decorative element, building size 32x32 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 건물\_50 길 (Path Tile) - XS

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell art style, theme park path element, Path Tile stone or wooden walkway segment, pathway section, natural integration, gray cobblestone or brown wood, functional path element, building size 32x32 pixels, decorative item, centered, --ar 4:5 --v 6 --s 250 --q 2
```

---

# 8. 위인 완전한 프롬프트 (45명)

> MVP 5명을 제외한 나머지 45명의 완전한 프롬프트입니다.

---

## 8.1 과학자 (12명)

---

### 위인\_03 아키라 (Akira) - 생물학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Akira character, biologist, young Japanese man, lab coat with nature patches, binoculars around neck, messy black hair, curious enthusiastic expression, green accent #4CAF50, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_04 엘레나 (Elena) - 유전공학자 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Elena character, genetic engineer, Eastern European woman, modern white lab coat, tablet with gene sequences, blonde ponytail, precise focused expression, blue accent #2196F3, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_05 사이먼 (Simon) - 화학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Simon character, chemist, British man, lab coat with safety goggles on head, holding test tubes, ginger hair, cautious meticulous expression, teal accent #00BCD4, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_06 미라 (Mira) - 진화생물학자 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Mira character, evolutionary biologist, Indian woman, casual lab attire, evolution chart in background, long dark hair, thoughtful analytical expression, purple accent #7E57C2, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_08 그레이스 (Grace) - 수의생물학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Grace character, veterinary biologist, friendly woman, medical scrubs, stethoscope around neck, curly brown hair, caring gentle expression, teal accent #26A69A, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_09 마르코 (Marco) - 해양생물학자 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Marco character, marine biologist, Italian man, wetsuit top, underwater tablet device, short dark hair, adventurous passionate expression, blue accent #0097A7, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_10 소피아 (Sophia) - 행동학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Sophia character, behavioral scientist, young woman, casual smart attire, observation notebook in hand, auburn hair, patient observant expression, green accent #8BC34A, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_11 빅터 (Victor) - 생체공학자 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Victor character, biomedical engineer, Eastern European man, tech-enhanced lab coat, cybernetic tools, gray temples hair, innovative brilliant expression, silver accent #607D8B, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_12 로즈 (Rose) - 식물학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Rose character, botanist, older woman, gardening apron over lab coat, holding plant samples, white hair, nurturing knowledgeable expression, green accent #689F38, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_13 레오 (Leo) - 영양학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Leo character, nutritionist, young man, chef coat hybrid uniform, food analysis tools, blonde hair, health-focused friendly expression, orange accent #FF9800, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_14 에이다 (Ada) - AI 연구원 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Ada character, AI researcher, young woman, modern tech wear, holographic interface visual, short purple-dyed hair, futuristic innovative expression, cyan accent #00BCD4, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_15 오스카 (Oscar) - 기상학자 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Oscar character, meteorologist, middle-aged man, weather station uniform, radar tablet device, receding brown hair, analytical precise expression, blue accent #1976D2, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 8.2 조련사 (9명)

---

### 위인\_17 잭 (Jack) - 육식 전문 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Jack character, carnivore specialist trainer, rugged man, reinforced protective gear, protective gloves, stubble beard, fearless tough expression, red accent #E53935, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_18 유나 (Yuna) - 초식 전문 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Yuna character, herbivore specialist trainer, Korean woman, soft colored safari uniform, treat bag on belt, long black hair, gentle patient expression, green accent #66BB6A, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_19 카를로스 (Carlos) - 익룡 전문 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Carlos character, pterosaur specialist trainer, Hispanic man, climbing gear vest, wing-shaped whistle, dark curly hair, agile daring expression, blue accent #42A5F5, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_20 마리나 (Marina) - 해양 전문 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Marina character, marine specialist trainer, athletic woman, wetsuit, underwater communication device, collected wet hair, daring aquatic expression, teal accent #00ACC1, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_21 데릭 (Derek) - 조련 보조 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Derek character, training assistant, young eager man, basic khaki trainer uniform, clipboard in hand, short brown hair, eager learning expression, khaki colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_22 니나 (Nina) - 하이브리드 전문가 ⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Nina character, hybrid specialist, mysterious woman, specialized containment gear, scanner device in hand, silver-white hair, cautious expert expression, purple accent #9C27B0, premium quality subtle glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_23 톰 (Tom) - 야간 조련사 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Tom character, night trainer, man with night vision goggles on forehead, dark uniform, flashlight, tired but alert expression, dark blue accent #1A237E, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_24 아이샤 (Aisha) - 부화 전문 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Aisha character, hatching specialist, African woman, incubation technician uniform, egg monitoring device in hand, warm caring smile, amber accent #FFB300, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_25 루이스 박사 (Dr. Louis) - 수석 수의사 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Dr. Louis character, head veterinarian, older man, veterinarian white coat, medical bag, gray distinguished hair, compassionate skilled expression, white and green colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 8.3 운영진 (9명)

---

### 위인\_27 캐서린 (Catherine) - CEO ⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Catherine character, CEO, professional woman, elegant executive suit, tablet device, elegant updo hair, decisive leader expression, navy blue accent #1A237E, premium quality subtle glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_28 제임스 (James) - COO ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, James character, COO, business man, suit with operations badge, walkie-talkie, neat brown hair, efficient organized expression, gray accent #546E7A, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_29 나탈리 (Natalie) - 마케팅 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Natalie character, marketing director, creative woman, stylish business casual outfit, presentation tablet, trendy hairstyle, enthusiastic persuasive expression, pink accent #E91E63, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_30 마이클 (Michael) - 재무 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Michael character, finance director, conservative man, formal business suit, calculator and financial charts, glasses, analytical careful expression, green money accent #4CAF50, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_31 에밀리 (Emily) - HR ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Emily character, HR manager, friendly woman, professional attire, employee files folder, warm welcoming smile, approachable supportive expression, light blue accent #64B5F6, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_32 다니엘 (Daniel) - 보안 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Daniel character, security chief, serious man, security uniform, radio earpiece, military bearing stance, protective vigilant expression, dark blue accent #1A237E, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_33 사라 (Sarah) - 고객서비스 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Sarah character, guest services representative, cheerful woman, park uniform with name tag, info tablet, bright welcoming smile, helpful friendly expression, orange accent #FF9800, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_34 로버트 (Robert) - 시설 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Robert character, facilities manager, practical man, maintenance uniform, tool belt, hardhat, reliable handy expression, yellow accent #FFC107, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_35 앤젤라 (Angela) - 이벤트 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Angela character, events coordinator, energetic woman, creative business casual, event planner tablet, colorful accessories, festive organized expression, purple accent #7E57C2, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 8.4 탐험가 (10명)

---

### 위인\_36 인디아나 (Indiana) - 전설의 탐험가 ⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Indiana character, legendary explorer, rugged man, classic fedora hat, leather jacket, whip on belt, stubble beard, adventurous brave expression, brown accent #795548, premium quality subtle glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_37 라라 (Lara) - 고고학자 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Lara character, archaeologist adventurer, athletic woman, exploration gear, dual holsters, braid hair, determined resourceful expression, teal accent #009688, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_38 알렉스 (Alex) - 정글 탐험가 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Alex character, jungle explorer, young adventurous man, safari gear, machete, compass, wild messy hair, fearless curious expression, green accent #388E3C, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_39 에바 (Eva) - 극지 탐험가 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Eva character, polar explorer, Nordic woman, cold weather insulated gear, ice pick, fur-lined hood, resilient tough expression, ice blue accent #B3E5FC, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_40 한 (Han) - 동굴 탐험가 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Han character, cave explorer, Asian man, caving helmet with headlamp light, climbing gear, rope coiled, cautious methodical expression, gray accent #757575, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_41 이사벨 (Isabel) - 해저 탐험가 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Isabel character, deep sea explorer, athletic woman, advanced diving suit, underwater camera, collected tied hair, daring aquatic expression, deep blue accent #0D47A1, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_42 닐 (Neil) - 사막 탐험가 ⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Neil character, desert explorer, weathered man, desert gear, water canteen, sun hat, enduring patient expression, sand tan accent #D7CCC8, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_43 미카 (Mika) - 화산 탐험가 ⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Mika character, volcano explorer, brave woman, heat-resistant suit, temperature scanner, tied-back hair, bold scientific expression, orange red accent #FF5722, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_44 조지 (George) - 신입 탐험가 ⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, George character, rookie explorer, young eager man, basic exploration gear, map and notebook, messy hair, enthusiastic nervous expression, khaki colors, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_45 빅토리아 (Victoria) - 전설 사냥꾼 ⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, Victoria character, legendary hunter, elegant mature woman, refined expedition wear, antique rifle, silver streak hair, precise deadly expression, gold accent #FFC107, premium quality subtle glow, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

## 8.5 특수 (5명)

---

### 위인\_46 타임키퍼 (Timekeeper) - 시간 관리자 ⭐⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, mystical appearance, Timekeeper character, time manager mystical being, androgynous ethereal figure, clock-themed robes with gear patterns, hourglass staff, ageless timeless appearance, ethereal cosmic glow, gold accent #FFC107, golden rim light majestic aura, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_47 포춘 (Fortune) - 행운의 신 ⭐⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, mystical appearance, Fortune character, luck deity mystical being, playful mischievous figure, four-leaf clover motifs on outfit, golden coin accessories, shimmering lucky appearance, magical aura, green gold accent #8BC34A #FFC107, golden rim light majestic aura, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_48 가이아 (Gaia) - 자연의 수호자 ⭐⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, mystical appearance, Gaia character, nature guardian divine being, earth mother figure, living plant dress with flowing vines, flower crown, nature integrated organic appearance, nurturing powerful expression, green accent #4CAF50, golden rim light majestic aura, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_49 아틀라스 (Atlas) - 힘의 화신 ⭐⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, mythical appearance, Atlas character, strength embodiment divine being, muscular giant figure, stone skin texture accents, carrying world sphere pose suggested, powerful eternal expression, stone gray accent #607D8B, golden rim light majestic aura, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

### 위인\_50 알케미스트 (Alchemist) - 연금술사 ⭐⭐⭐⭐⭐

**Portrait**

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, soft gradient background, chibi style character, 2.5 head to body proportion, big round expressive eyes, mystical appearance, Alchemist character, mystical scientist legendary being, robed mysterious figure, potion bottles accessories, transmutation circle patterns, mysterious wise expression, magical scholarly aura, purple gold accent #9C27B0 #FFC107, golden rim light majestic aura, front-facing portrait, upper body centered, portrait 256x320 pixels, --ar 4:5 --v 6 --s 250 --q 2
```

---

# 📊 진행 체크리스트

| 카테고리 | 수량       | 완료             |
| -------- | ---------- | ---------------- |
| 건물     | 50종       | ✅ 50 / 50       |
| 위인     | 50명       | ✅ 50 / 50       |
| 타일     | 15종       | ✅ 15 / 15       |
| 소품     | 15종       | ✅ 15 / 15       |
| UI       | ~50종      | ✅ 50 / 50       |
| **총합** | **~180종** | **✅ 180 / 180** |

**모든 에셋 프롬프트 작성 완료! ✅**

---

_다이노 파크 타이쿤 - 에셋 프롬프트 (건물 & 위인편) v3.0_
_최종 업데이트: 2026년 2월_
