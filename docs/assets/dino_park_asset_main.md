# 🎨 다이노 파크 타이쿤 - 에셋 프롬프트 시스템

<!-- legacy-reference: 2026-11-15 -->
> **구버전 자료 · 2026-11-15 분리**
> 구버전 기획·설계 자료입니다. 최신 구현 기준으로 사용하지 말고, 필요한 내용은 최신 기획에 승계한 뒤 사용합니다. 문서 내 버전 번호는 이 자료 자체의 과거 버전입니다.
> 최신 기준과 실제 구현 상태는 [기획 문서 안내](../README.md)에서 확인합니다.
> 새 제작의 카메라·조명·재질·조형은 [현행 화면과 아트 방향](../current/production-and-services.md#1-화면과-아트-방향)을 사용합니다. 아래 템플릿은 대상의 특징과 필요한 상태를 찾는 참고 자료입니다.

## AI 이미지 생성을 위한 마스터 템플릿 v2.0

---

# 📋 목차

0. [파일명 & 경로 규칙](#0-파일명--경로-규칙) _(신규)_
1. [프롬프트 조합 공식](#1-프롬프트-조합-공식)
2. [마스터 스타일](#2-마스터-스타일)
3. [사이즈 템플릿](#3-사이즈-템플릿)
4. [카테고리 스타일](#4-카테고리-스타일)
5. [상태별 포즈](#5-상태별-포즈)
6. [컬러 팔레트](#6-컬러-팔레트)
7. [등급 효과](#7-등급-효과)
8. [조합 예시](#8-조합-예시)

---

# 0. 파일명 & 경로 규칙

> **모든 에셋 파일은 아래 규칙을 따라 명명하고 저장합니다.**

## 0.1 폴더 구조

```
assets/
├── dinosaurs/              # 공룡 에셋
│   ├── herbivore/          # 초식 공룡
│   │   ├── idle/
│   │   ├── walk/
│   │   └── portrait/
│   ├── carnivore/          # 육식 공룡
│   ├── pterosaur/          # 익룡
│   ├── marine/             # 해양 파충류
│   └── hybrid/             # 하이브리드
│
├── buildings/              # 건물 에셋
│   ├── production/         # 생산 건물
│   ├── entertainment/      # 오락 건물
│   ├── infrastructure/     # 인프라 건물
│   └── decoration/         # 장식
│
├── characters/             # 캐릭터/위인 에셋
│   ├── portrait/           # 초상화
│   ├── fullbody/           # 전신
│   └── emotion/            # 감정 표현
│
├── ui/                     # UI 에셋
│   ├── icons/              # 아이콘
│   ├── buttons/            # 버튼
│   ├── cards/              # 카드
│   ├── backgrounds/        # 배경
│   └── effects/            # 이펙트
│
├── environment/            # 환경 에셋
│   ├── tiles/              # 타일
│   ├── props/              # 소품
│   └── weather/            # 날씨 효과
│
└── audio/                  # 오디오 (별도 관리)
```

## 0.2 파일명 규칙

```
┌─────────────────────────────────────────────────────────────────┐
│                    파일명 형식                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  {카테고리}_{ID}_{이름}_{상태}_{크기}_{등급}.png                │
│                                                                 │
│  예시:                                                          │
│  dino_001_stegosaurus_idle_M_rare.png                          │
│  dino_041_trex_roar_XL_legendary.png                           │
│  building_prod_hatchery_lv2_L.png                              │
│  char_gf001_dr_jin_portrait_epic.png                           │
│  ui_icon_gold.png                                              │
│  ui_btn_primary_normal.png                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 카테고리 접두사

| 접두사      | 카테고리    | 예시                   |
| ----------- | ----------- | ---------------------- |
| `dino_`     | 공룡        | dino_001_stegosaurus   |
| `building_` | 건물        | building_prod_hatchery |
| `char_`     | 캐릭터/위인 | char_gf001_dr_jin      |
| `ui_`       | UI 요소     | ui_icon_gold           |
| `env_`      | 환경        | env_tile_grass         |
| `fx_`       | 이펙트      | fx_sparkle_gold        |

### 상태 접미사

| 접미사      | 공룡 상태 | 건물 상태 | 캐릭터 감정 |
| ----------- | --------- | --------- | ----------- |
| `_idle`     | 기본      | -         | -           |
| `_walk`     | 걷기      | -         | -           |
| `_eat`      | 먹기      | -         | -           |
| `_sleep`    | 수면      | -         | -           |
| `_happy`    | 행복      | -         | 기쁨        |
| `_angry`    | 화남      | -         | 화남        |
| `_lv1~5`    | -         | 레벨      | -           |
| `_normal`   | -         | -         | 기본        |
| `_portrait` | 초상화    | -         | 초상화      |

### 크기 접미사

| 접미사 | 크기   | 픽셀    |
| ------ | ------ | ------- |
| `_XS`  | 초소형 | 64×64   |
| `_S`   | 소형   | 96×96   |
| `_M`   | 중형   | 128×128 |
| `_L`   | 대형   | 192×192 |
| `_XL`  | 초대형 | 256×256 |
| `_XXL` | 최대형 | 320×320 |

### 등급 접미사

| 접미사       | 등급     |
| ------------ | -------- |
| `_common`    | 커먼     |
| `_uncommon`  | 언커먼   |
| `_rare`      | 레어     |
| `_epic`      | 에픽     |
| `_legendary` | 레전더리 |

## 0.3 스프라이트 시트 규칙

```
애니메이션이 있는 에셋은 스프라이트 시트로 관리

파일명: {기본명}_sheet_{프레임수}f.png

예시:
dino_001_stegosaurus_walk_sheet_6f.png  (6프레임 걷기)
dino_041_trex_roar_sheet_8f.png         (8프레임 포효)

레이아웃:
┌────┬────┬────┬────┬────┬────┐
│ F1 │ F2 │ F3 │ F4 │ F5 │ F6 │  (가로 배열)
└────┴────┴────┴────┴────┴────┘

메타데이터 (JSON):
{
  "frames": 6,
  "frameWidth": 128,
  "frameHeight": 128,
  "fps": 10
}
```

## 0.4 버전 관리

```
수정된 에셋은 버전 접미사 추가

v1 (기본): dino_001_stegosaurus_idle.png
v2: dino_001_stegosaurus_idle_v2.png
v3: dino_001_stegosaurus_idle_v3.png

프로덕션 배포 시 버전 없는 파일이 최종 버전
```

---

# 1. 프롬프트 조합 공식

```
┌─────────────────────────────────────────────────────────────────┐
│  [완전한 프롬프트] =                                            │
│                                                                 │
│    ① 마스터 스타일 (필수)                                      │
│    + ② 카테고리 스타일 (공룡/건물/위인)                        │
│    + ③ 개별 특성 (이름, 색상, 특징)                            │
│    + ④ 상태/포즈                                               │
│    + ⑤ 사이즈 지정                                             │
│    + ⑥ --ar 1:1 --v 6 --s 250 --q 2                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 2. 마스터 스타일

> ⚠️ **필수**: 모든 프롬프트 앞에 복사하세요!

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day and Clash of Clans art style,
```

---

# 3. 사이즈 템플릿

## 3.1 공룡

| 크기    | 그리드 | 픽셀    | 템플릿                                                           |
| ------- | ------ | ------- | ---------------------------------------------------------------- |
| **XS**  | 1×1    | 64×64   | `sprite size 64x64 pixels, 1x1 game grid, centered on canvas,`   |
| **S**   | 1×1    | 96×96   | `sprite size 96x96 pixels, 1x1 game grid, centered on canvas,`   |
| **M**   | 2×2    | 128×128 | `sprite size 128x128 pixels, 2x2 game grid, centered on canvas,` |
| **L**   | 3×3    | 192×192 | `sprite size 192x192 pixels, 3x3 game grid, centered on canvas,` |
| **XL**  | 4×4    | 256×256 | `sprite size 256x256 pixels, 4x4 game grid, centered on canvas,` |
| **XXL** | 6×6    | 384×384 | `sprite size 384x384 pixels, 6x6 game grid, centered on canvas,` |

## 3.2 건물

| 크기   | 픽셀    | 템플릿                                                    |
| ------ | ------- | --------------------------------------------------------- |
| **S**  | 64×96   | `building size 64x96 pixels, 1x1 grid, bottom-aligned,`   |
| **M**  | 128×160 | `building size 128x160 pixels, 2x2 grid, bottom-aligned,` |
| **L**  | 192×240 | `building size 192x240 pixels, 3x3 grid, bottom-aligned,` |
| **XL** | 256×320 | `building size 256x320 pixels, 4x4 grid, bottom-aligned,` |

## 3.3 캐릭터/초상화

| 용도   | 픽셀    | 템플릿                                          |
| ------ | ------- | ----------------------------------------------- |
| 미니   | 48×64   | `chibi sprite 48x64 pixels,`                    |
| 표준   | 96×128  | `character sprite 96x128 pixels,`               |
| 초상화 | 256×320 | `portrait 256x320 pixels, upper body centered,` |

## 3.4 UI

| 용도      | 픽셀    |
| --------- | ------- |
| 아이콘 S  | 24×24   |
| 아이콘 M  | 32×32   |
| 아이콘 L  | 48×48   |
| 재화 HUD  | 32×32   |
| 재화 보상 | 64×64   |
| 썸네일    | 240×240 |
| 카드      | 336×400 |

---

# 4. 카테고리 스타일

## 4.1 공룡 스타일

```
cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance,
```

**타입별 추가:**

| 타입       | 추가 키워드                                          |
| ---------- | ---------------------------------------------------- |
| 초식       | `gentle herbivore expression, peaceful stance,`      |
| 육식       | `fierce but friendly predator, powerful stance,`     |
| 익룡       | `graceful flying reptile, wings spread,`             |
| 해양       | `streamlined aquatic body, swimming pose,`           |
| 하이브리드 | `bio-engineered hybrid, subtle bioluminescent glow,` |

## 4.2 건물 스타일

```
theme park architecture, blend of modern and natural materials, wood stone and glass, cozy inviting atmosphere, miniature diorama feel,
```

## 4.3 캐릭터 스타일

```
chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance, distinctive costume,
```

---

# 5. 상태별 포즈

## 5.1 공룡

| 상태         | 키워드                                                  |
| ------------ | ------------------------------------------------------- |
| **Idle**     | `standing idle pose, relaxed stance, looking forward,`  |
| **Walk**     | `walking pose, one leg forward, mid-stride movement,`   |
| **Eat**      | `eating pose, head lowered toward food,`                |
| **Happy**    | `happy excited pose, slight jump, joyful expression,`   |
| **Portrait** | `front-facing portrait, head and upper body, centered,` |

## 5.2 건물

| 상태       | 키워드                                            |
| ---------- | ------------------------------------------------- |
| **Lv.1**   | `level 1 basic, simple design,`                   |
| **Lv.2**   | `level 2 upgraded, improved details,`             |
| **Lv.3**   | `level 3 maximum, elaborate design, subtle glow,` |
| **건설중** | `under construction, scaffolding visible,`        |

## 5.3 캐릭터

| 상태      | 키워드                           |
| --------- | -------------------------------- |
| **Idle**  | `standing idle, friendly smile,` |
| **Walk**  | `walking pose, casual stride,`   |
| **Work**  | `working pose, holding tools,`   |
| **Happy** | `celebrating pose, arms raised,` |

---

# 6. 컬러 팔레트

## 6.1 브랜드 컬러

| 이름         | HEX     | 용도             |
| ------------ | ------- | ---------------- |
| Dino Green   | #4CAF50 | 자연, 초식       |
| Amber Gold   | #FFC107 | 보상, 레전더리   |
| Ocean Blue   | #2196F3 | 다이아, 해양     |
| Warm Coral   | #FF7043 | 육식, 에너지     |
| Magic Purple | #9C27B0 | 에픽, 하이브리드 |

## 6.2 등급 컬러

| 등급                 | HEX     |
| -------------------- | ------- |
| ⭐ Common            | #9E9E9E |
| ⭐⭐ Uncommon        | #8BC34A |
| ⭐⭐⭐ Rare          | #2196F3 |
| ⭐⭐⭐⭐ Epic        | #9C27B0 |
| ⭐⭐⭐⭐⭐ Legendary | #FFC107 |

---

# 7. 등급 효과

| 등급      | 추가 키워드                           |
| --------- | ------------------------------------- |
| Common    | (없음)                                |
| Uncommon  | `slightly more detailed,`             |
| Rare      | `polished appearance, richer colors,` |
| Epic      | `premium quality, subtle inner glow,` |
| Legendary | `golden rim light, majestic aura,`    |

---

# 8. 조합 예시

## 예시 1: 스테고사우루스 Idle (M, Rare)

```
2.5D isometric game sprite, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork, inspired by Supercell Hay Day and Clash of Clans art style,

cute but majestic dinosaur creature, big expressive friendly eyes, slightly exaggerated proportions with larger head, smooth rounded forms, approachable appearance, gentle herbivore expression, peaceful stance,

Stegosaurus dinosaur, iconic double row of back plates, green body #4CAF50, orange-red plates #FF7043, cream underbelly, four sturdy legs, spiked tail,

polished appearance, richer colors,

standing idle pose, relaxed stance, looking forward,

sprite size 128x128 pixels, 2x2 game grid, centered on canvas,

--ar 1:1 --v 6 --s 250 --q 2
```

## 예시 2: 티라노사우루스 Portrait (XL, Legendary)

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting from top-left, gradient background,

cute but majestic dinosaur creature, big expressive friendly eyes, powerful appearance,

Tyrannosaurus Rex, king of dinosaurs, massive powerful head, teeth visible in slight smile, dark brown body #5D4037, orange underbelly #FFCC80, tiny arms, confident expression,

golden rim light, majestic aura,

front-facing portrait, head and upper body, centered,

portrait 256x256 pixels,

--ar 1:1 --v 6 --s 250 --q 2
```

## 예시 3: 부화장 Lv.2 (M)

```
2.5D isometric game building, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines with soft rounded edges, gentle gradients and highlights, soft directional lighting from top-left 315 degrees, facing southwest direction three-quarter view, 45 degree top-down camera angle, transparent PNG background, high quality mobile game artwork,

theme park architecture, blend of modern and natural materials, cozy inviting atmosphere, miniature diorama feel,

Hatchery building, egg incubation facility, dome structure with glass panels, eggs visible inside, warm interior lighting, scientific equipment, green accent #4CAF50,

level 2 upgraded, improved details,

building size 128x160 pixels, 2x2 grid, bottom-aligned,

--ar 4:5 --v 6 --s 250 --q 2
```

## 예시 4: 닥터 진 Portrait

```
2.5D game character portrait, soft cel-shaded cartoon style, warm and friendly color palette, vibrant colors, clean outlines, soft lighting, gradient background,

chibi style character, 2.5 head to body proportion, big round expressive eyes, cute professional appearance,

Dr. Jin, lead geneticist, female Korean scientist, white lab coat, round glasses, holding DNA model, short black hair, confident intellectual expression, green accent #4CAF50,

front-facing portrait, upper body centered,

portrait 256x320 pixels,

--ar 4:5 --v 6 --s 250 --q 2
```

---

# 📋 빠른 체크리스트

```
□ 마스터 스타일 복사
□ 카테고리 스타일 추가
□ 개별 특성 작성 (이름, 색상, 특징)
□ 상태/포즈 추가
□ 사이즈 지정 (픽셀 명시!)
□ 등급 효과 추가 (필요시)
□ --ar 1:1 --v 6 --s 250 --q 2 추가
```

---

_다이노 파크 타이쿤 - 에셋 프롬프트 시스템 v2.0_
_최종 업데이트: 2026년 1월_
