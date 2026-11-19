# 🎬 다이노 파크 타이쿤 - 에셋 프롬프트 (컷신 & 스토리 UI편)

<!-- legacy-reference: 2026-11-15 -->
> **구버전 자료 · 2026-11-15 분리**
> 구버전 기획·설계 자료입니다. 최신 구현 기준으로 사용하지 말고, 필요한 내용은 최신 기획에 승계한 뒤 사용합니다. 문서 내 버전 번호는 이 자료 자체의 과거 버전입니다.
> 최신 기준과 실제 구현 상태는 [기획 문서 안내](README.md)에서 확인합니다.

## 컷신 10종 + 스토리 UI + 특수 연출

---

# 📖 사용 가이드

> 인물 관계와 이야기의 정본은 [스토리 시나리오](dino_park_story_scenario.md)다. 아서는 주인공에게 편지를 보낸 파크 창립자다. 정본에 주인공의 조부로 명시되어 있지 않으므로 에셋에서도 ‘창립자’로 표기한다. 아래 컷신 번호는 기존 에셋 식별자이므로 실제 스토리 챕터·씬과의 대응은 정본 기준으로 확인한다.

## 파일명 규칙

### 컷신 이미지

```
cutscene_{챕터}_{번호}_{장면명}.png
cutscene_{챕터}_{번호}_{장면명}_frame{프레임번호}.png
```

**예시:**

```
cutscene_01_01_letter.png
cutscene_01_02_first_meeting.png
cutscene_02_01_storm_night_frame01.png
cutscene_02_01_storm_night_frame02.png
```

### 스토리 UI

```
story_ui_{요소명}.png
story_ui_{요소명}_{상태}.png
```

**예시:**

```
story_ui_dialog_box.png
story_ui_choice_button_normal.png
story_ui_choice_button_selected.png
```

## 폴더 구조

```
apps/client/src/assets/
├── cutscenes/
│   ├── chapter_01/
│   │   ├── cutscene_01_01_letter.png
│   │   ├── cutscene_01_02_first_meeting.png
│   │   └── ...
│   ├── chapter_02/
│   ├── chapter_03/
│   ├── chapter_04/
│   ├── chapter_05/
│   └── chapter_06/
│
└── ui/
    └── story/
        ├── story_ui_dialog_box.png
        ├── story_ui_narrator_box.png
        ├── story_ui_choice_button_normal.png
        └── ...
```

---

# 📋 목차

1. [스토리 UI](#1-스토리-ui)
2. [챕터 1 컷신](#2-챕터-1-컷신)
3. [챕터 2 컷신](#3-챕터-2-컷신)
4. [챕터 3-6 컷신](#4-챕터-3-6-컷신)
5. [특수 연출 이펙트](#5-특수-연출-이펙트)

---

# 1. 스토리 UI

## 1.1 대화 시스템

---

### 대화창 (Dialog Box)

```
2D game UI panel, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, dialog box panel for visual novel style conversation, rounded rectangle shape, semi-transparent dark background #37474F with 80% opacity, thin golden border frame #FFD700, speech bubble tail at bottom left, space for character portrait on left, text area on right, modern clean aesthetic, panel size 800x200 pixels, --ar 4:1 --v 6 --s 250 --q 2
```

---

### 나레이션 박스 (Narrator Box)

```
2D game UI panel, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, narrator text box for story narration, wide rectangular shape, semi-transparent dark purple background #311B92 with 85% opacity, elegant silver border frame #B0BEC5, no character portrait space, centered text area, subtle star sparkle decorations, mysterious storyteller aesthetic, panel size 900x150 pixels, --ar 6:1 --v 6 --s 250 --q 2
```

---

### 캐릭터 이름표 (Name Tag)

```
2D game UI element, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, character name tag label, small rounded rectangle, gradient fill from #4CAF50 to #66BB6A, white text area, subtle shadow, compact elegant design, tag size 200x40 pixels, --ar 5:1 --v 6 --s 250 --q 2
```

---

### 선택지 버튼 (Choice Button) - Normal

```
2D game UI button, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, story choice button normal state, wide rounded rectangle, gradient fill from #1E88E5 to #42A5F5, thin white border, space for choice text, slight 3D depth effect, interactive look, button size 600x60 pixels, --ar 10:1 --v 6 --s 250 --q 2
```

---

### 선택지 버튼 (Choice Button) - Hover/Selected

```
2D game UI button, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, story choice button selected state, wide rounded rectangle, gradient fill from #FFB300 to #FFC107, golden glow border effect, space for choice text, elevated 3D depth effect, highlighted appearance, button size 600x60 pixels, --ar 10:1 --v 6 --s 250 --q 2
```

---

### 초상화 프레임 (Portrait Frame)

```
2D game UI frame, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, character portrait frame for dialog, circular or rounded square shape, ornate golden border #FFD700, inner shadow for depth, vintage photograph frame aesthetic, fits 200x200 portrait, frame size 220x220 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 1.2 스토리 진행 UI

---

### 챕터 타이틀 카드 (Chapter Title Card)

```
2D game UI element, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, chapter title card for story introduction, large decorative banner shape, ancient scroll aesthetic with modern clean lines, golden trim decorations #FFD700, dinosaur fossil silhouette accents, dramatic presentation style, card size 800x400 pixels, --ar 2:1 --v 6 --s 250 --q 2
```

---

### 스토리 진행 표시 (Story Progress Bar)

```
2D game UI element, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, story chapter progress indicator, horizontal bar with dinosaur footprint markers, filled portion glowing green #4CAF50, unfilled portion muted gray #9E9E9E, current position marked with star, 6 chapter nodes visible, bar size 600x40 pixels, --ar 15:1 --v 6 --s 250 --q 2
```

---

### 회상 효과 프레임 (Flashback Frame)

```
2D game UI overlay, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, flashback memory effect frame, vignette border with sepia-toned edges, old photograph aesthetic, soft blur corners, dreamy nostalgic atmosphere, time travel visual cue, frame size 1920x1080 pixels with transparent center, --ar 16:9 --v 6 --s 250 --q 2
```

---

### 홀로그램 인터페이스 (Hologram Interface)

```
2D game UI element, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, futuristic hologram display interface, translucent cyan panels #00BCD4, scan line effects, digital glitch aesthetic, floating UI elements, sci-fi technology feel, Arthur's message display, interface size 600x400 pixels, --ar 3:2 --v 6 --s 250 --q 2
```

---

### 아서 홀로그램 (Arthur Hologram)

```
2.5D isometric game character, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, transparent PNG background, high quality mobile game artwork, Arthur Hammond park founder hologram projection, elderly kind man figure, translucent cyan hologram effect #00BCD4, gentle smile, lab coat silhouette, digital glitch distortion, ghostly presence, emotional connection, character size 256x384 pixels, --ar 2:3 --v 6 --s 250 --q 2
```

---

## 1.3 알림 & 팝업

---

### 공룡 발견 알림 (Dinosaur Discovery)

```
2D game UI popup, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, new dinosaur discovery notification, exciting celebration popup, starburst background effect #FFD700, "NEW" badge, dinosaur silhouette placeholder, confetti particles, achievement unlocked aesthetic, popup size 400x300 pixels, --ar 4:3 --v 6 --s 250 --q 2
```

---

### 퀘스트 완료 알림 (Quest Complete)

```
2D game UI popup, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, quest complete notification, success celebration popup, green checkmark icon #4CAF50, golden ribbon banner, reward preview area, sparkle effects, accomplishment aesthetic, popup size 400x250 pixels, --ar 8:5 --v 6 --s 250 --q 2
```

---

### 스토리 잠금 표시 (Story Lock)

```
2D game UI element, soft cel-shaded cartoon style, warm and friendly color palette, clean design, transparent PNG background, high quality mobile game artwork, locked story content indicator, padlock icon with chain, muted gray color scheme #9E9E9E, requirement text area, mysterious unrevealed content, unlock condition display, element size 300x200 pixels, --ar 3:2 --v 6 --s 250 --q 2
```

---

# 2. 챕터 1 컷신

> "새로운 시작" - 유산과 첫 만남

---

## 컷신\_01_01 창립자의 편지 (The Letter)

### 장면 설명

주인공이 파크 창립자 아서 해먼드의 편지를 읽는 장면. 감정적 시작점.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, high quality mobile game artwork, emotional scene of protagonist reading park founder Arthur Hammond's letter, warm golden afternoon light through window, old wooden desk with scattered papers, vintage envelope and handwritten letter in hands, photograph of the old dinosaur park visible, dust particles in sunlight, bittersweet hopeful atmosphere, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_01_02 브라키오사우루스와의 첫 만남 (First Meeting)

### 장면 설명

주인공이 처음으로 살아있는 공룡 (브라키오사우루스)를 마주하는 경이로운 순간.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, high quality mobile game artwork, awe-inspiring first dinosaur encounter scene, protagonist looking up in wonder at gentle Brachiosaurus, massive dinosaur silhouette against golden sunrise, lush green prehistoric vegetation, morning mist and light rays, sense of scale and wonder, magical discovery moment, emotional breakthrough scene, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_01_03 마르코의 등장 (Marco Arrives)

### 장면 설명

가이드 마르코가 처음 등장하는 장면.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, high quality mobile game artwork, introduction of guide character Marco, confident adventurer arriving at park entrance, jeep vehicle in background, explorer outfit with hat, friendly welcoming gesture, tropical park gate visible, exciting adventure partner arrival, character introduction scene, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_01_04 첫 부화 성공 (First Hatching)

### 장면 설명

처음으로 공룡 알이 부화하는 감동적인 순간.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, high quality mobile game artwork, miraculous first dinosaur hatching scene, egg cracking open with golden light emanating, baby dinosaur emerging, protagonist and Marco watching in amazement, incubator equipment in hatchery background, warm emotional lighting, birth of new life moment, tears of joy aesthetic, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_01_05 첫 관람객 도착 (First Visitors)

### 장면 설명

파크에 첫 관람객이 도착하는 뿌듯한 순간.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, high quality mobile game artwork, park grand opening scene, excited family of visitors entering through main gate, children pointing at dinosaurs in wonder, proud protagonist welcoming guests, festive decorations and balloons, dream becoming reality moment, achievement celebration atmosphere, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

# 3. 챕터 2 컷신

> "시련" - 태풍의 밤

---

## 컷신\_02_01 태풍의 밤 - 폭풍 시작 (Storm Begins)

### 장면 설명

거대한 태풍이 파크를 덮치는 위기의 시작.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, dramatic lighting, high quality mobile game artwork, terrifying storm approaching scene, dark ominous clouds covering sky, lightning illuminating park silhouette, palm trees bending in strong wind, rain starting to pour, dinosaurs looking anxious, tension building atmosphere, disaster movie aesthetic, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_02_02 태풍의 밤 - 위기 (Crisis Peak)

### 장면 설명

폭풍 속에서 공룡들과 파크를 지키려는 필사적인 노력.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, dramatic lighting, high quality mobile game artwork, intense storm crisis scene, protagonist and staff working desperately in pouring rain, securing dinosaur enclosures, lightning strikes in background, fallen trees and debris, heroic determination in faces, life or death tension, action sequence aesthetic, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_02_03 태풍의 밤 - 새벽 (Dawn After Storm)

### 장면 설명

폭풍이 지나간 후 새벽의 희망찬 장면.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, soft lighting, high quality mobile game artwork, hopeful dawn after storm scene, sun breaking through clearing clouds, rainbow in sky, exhausted but relieved protagonist surveying park, dinosaurs emerging safely, damage visible but spirit unbroken, rebirth and hope aesthetic, emotional relief moment, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

# 4. 챕터 3-6 컷신

> 주요 전환점 장면들

---

## 컷신\_03_01 인도미누스 대면 (Indominus Confrontation)

### 장면 설명

인도미누스 렉스와의 첫 긴장감 있는 대면.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, dramatic lighting, high quality mobile game artwork, tense Indominus Rex encounter scene, protagonist face to face with massive hybrid dinosaur, red menacing eyes glowing, size comparison emphasizing danger, containment facility setting, fear and determination in protagonist expression, thriller movie tension, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_04_01 아서의 비밀 연구실 (Arthur's Secret Lab)

### 장면 설명

파크 창립자 아서의 비밀 연구실을 발견하는 장면.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, mysterious lighting, high quality mobile game artwork, discovery of secret laboratory scene, protagonist finding hidden underground lab, dusty equipment and old research notes, hologram of park founder Arthur Hammond activating, DNA samples and dinosaur data, revelation moment, the park founder's legacy uncovered, wonder and emotion mixed, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_05_01 최후의 결전 (Final Battle)

### 장면 설명

모든 공룡들과 함께 파크를 지키는 클라이맥스.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, epic lighting, high quality mobile game artwork, climactic final battle scene, protagonist leading dinosaurs to protect park, T-Rex and other dinosaurs united, epic showdown composition, dramatic sunset lighting, all great figures supporting, ultimate teamwork moment, heroic last stand aesthetic, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_06_01 엔딩 - 번영 (Prosperity Ending)

### 장면 설명

파크가 번영하는 해피 엔딩.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, golden hour lighting, high quality mobile game artwork, prosperous park ending scene, thriving dinosaur park overview, happy visitors everywhere, protagonist overlooking from hill, all dinosaur species living harmoniously, park founder Arthur Hammond statue in park, dream fulfilled aesthetic, emotional happy ending, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_06_02 엔딩 - 균형 (Balance Ending)

### 장면 설명

자연과 조화를 이룬 엔딩.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, peaceful lighting, high quality mobile game artwork, harmonious balance ending scene, park integrated with natural environment, dinosaurs roaming freely in expanded habitat, protagonist releasing dinosaur to wild, sustainable coexistence achieved, nature and technology harmony, bittersweet fulfillment, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 컷신\_06_03 엔딩 - 탐구 (Discovery Ending)

### 장면 설명

새로운 탐험을 떠나는 엔딩.

```
2D game cutscene illustration, soft cel-shaded cartoon style, warm and friendly color palette, vibrant saturated colors, clean outlines, adventurous lighting, high quality mobile game artwork, new adventure ending scene, protagonist and team departing for new expedition, ship sailing toward mysterious island on horizon, dinosaur companions following, spirit of exploration, park founder Arthur Hammond's journal in hand, journey continues aesthetic, hopeful open ending, widescreen cinematic composition, cutscene size 1920x1080 pixels, --ar 16:9 --v 6 --s 250 --q 2
```

---

# 5. 특수 연출 이펙트

## 5.1 화면 전환 효과

---

### 페이드 인/아웃 오버레이 (Fade Overlay)

```
2D game UI overlay, clean design, simple solid color, high quality, fade transition overlay, pure black color #000000, full screen coverage, for opacity animation, overlay size 1920x1080 pixels, --ar 16:9 --v 6 --s 100 --q 2
```

---

### 화이트 플래시 (White Flash)

```
2D game UI overlay, clean design, simple solid color, high quality, flash transition overlay, pure white color #FFFFFF, full screen coverage, for dramatic moment transitions, overlay size 1920x1080 pixels, --ar 16:9 --v 6 --s 100 --q 2
```

---

### 회상 비네트 (Flashback Vignette)

```
2D game UI overlay, soft cel-shaded cartoon style, warm sepia tones, transparent center, high quality mobile game artwork, flashback memory effect overlay, heavy vignette darkening edges, sepia color grading, soft focus blur at corners, nostalgic dream-like atmosphere, old memory aesthetic, overlay size 1920x1080 pixels with transparent center, --ar 16:9 --v 6 --s 250 --q 2
```

---

## 5.2 감정 이펙트

---

### 감동 눈물 이펙트 (Emotional Tears)

```
2D game UI particle effect, soft cel-shaded cartoon style, warm and friendly color palette, transparent PNG background, high quality mobile game artwork, emotional tear drop particles, sparkling water drops, light refraction in tears, floating upward gently, touching moment visual, sprite sheet 4 frames, effect size 64x256 pixels total, --ar 1:4 --v 6 --s 250 --q 2
```

---

### 분노 이펙트 (Anger Effect)

```
2D game UI particle effect, soft cel-shaded cartoon style, warm and friendly color palette, transparent PNG background, high quality mobile game artwork, anger emotion visual effect, red vein-like marks, steam puffs from head, sharp angular shapes, intense emotion indicator, sprite sheet 4 frames, effect size 128x128 pixels total, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 놀람 이펙트 (Surprise Effect)

```
2D game UI particle effect, soft cel-shaded cartoon style, warm and friendly color palette, transparent PNG background, high quality mobile game artwork, surprise emotion visual effect, exclamation marks popping, starburst shapes, yellow highlight color #FFEB3B, shock and awe indicator, sprite sheet 4 frames, effect size 128x128 pixels total, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 사랑/행복 이펙트 (Love/Happy Effect)

```
2D game UI particle effect, soft cel-shaded cartoon style, warm and friendly color palette, transparent PNG background, high quality mobile game artwork, love and happiness visual effect, floating pink hearts #E91E63, sparkles and stars, warm glow, joyful emotion indicator, sprite sheet 4 frames, effect size 128x128 pixels total, --ar 1:1 --v 6 --s 250 --q 2
```

---

## 5.3 환경 이펙트

---

### 비 내리는 효과 (Rain Effect)

```
2D game weather effect, soft cel-shaded cartoon style, transparent PNG background, high quality mobile game artwork, rain drops falling animation, diagonal rain streaks, blue-gray water drops #78909C, storm atmosphere, tileable seamless pattern, sprite sheet for animation, effect size 512x512 pixels, --ar 1:1 --v 6 --s 250 --q 2
```

---

### 번개 플래시 (Lightning Flash)

```
2D game weather effect, soft cel-shaded cartoon style, transparent PNG background, high quality mobile game artwork, lightning bolt strike effect, bright white electric bolt #FFFFFF, branching lightning shape, dramatic flash illumination, storm sequence element, effect size 512x768 pixels, --ar 2:3 --v 6 --s 250 --q 2
```

---

### 먼지/바람 이펙트 (Dust Wind)

```
2D game weather effect, soft cel-shaded cartoon style, transparent PNG background, high quality mobile game artwork, dust and wind particles effect, brown dust clouds #8D6E63, swirling wind patterns, desert storm atmosphere, debris particles, seamless tileable, effect size 512x256 pixels, --ar 2:1 --v 6 --s 250 --q 2
```

---

# 📋 파일명 빠른 참조

## 스토리 UI

```
story_ui_dialog_box.png
story_ui_narrator_box.png
story_ui_name_tag.png
story_ui_choice_button_normal.png
story_ui_choice_button_selected.png
story_ui_portrait_frame.png
story_ui_chapter_title.png
story_ui_progress_bar.png
story_ui_flashback_frame.png
story_ui_hologram_interface.png
story_ui_arthur_hologram.png
story_ui_dino_discovery_popup.png
story_ui_quest_complete_popup.png
story_ui_story_lock.png
```

## 챕터 1 컷신

```
cutscene_01_01_letter.png
cutscene_01_02_first_meeting.png
cutscene_01_03_marco_arrives.png
cutscene_01_04_first_hatching.png
cutscene_01_05_first_visitors.png
```

## 챕터 2 컷신

```
cutscene_02_01_storm_begins.png
cutscene_02_02_crisis_peak.png
cutscene_02_03_dawn_after_storm.png
```

## 챕터 3-6 컷신

```
cutscene_03_01_indominus_confrontation.png
cutscene_04_01_secret_lab.png
cutscene_05_01_final_battle.png
cutscene_06_01_ending_prosperity.png
cutscene_06_02_ending_balance.png
cutscene_06_03_ending_discovery.png
```

## 특수 이펙트

```
effect_fade_overlay.png
effect_white_flash.png
effect_flashback_vignette.png
effect_tears.png
effect_anger.png
effect_surprise.png
effect_love_happy.png
effect_rain.png
effect_lightning.png
effect_dust_wind.png
```

---

# 📊 전체 요약

| 카테고리      | 항목 수  | 상태    |
| ------------- | -------- | ------- |
| 스토리 UI     | 14       | ✅ 완료 |
| 챕터 1 컷신   | 5        | ✅ 완료 |
| 챕터 2 컷신   | 3        | ✅ 완료 |
| 챕터 3-6 컷신 | 6        | ✅ 완료 |
| 특수 이펙트   | 10       | ✅ 완료 |
| **총합**      | **38개** | ✅      |
