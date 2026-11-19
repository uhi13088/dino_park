# 플레이 가이드 제작 원천

2026-11-19 첫 전시 뒤 파크 Lv.6 플레이 가이드. 입력 152개의 전체 지문은 manifest.json이 관리한다. 게임 구현 상태와 검증은 TASK.md와 document-qa.md에 남긴다.

Word의 장과 항목은 content.py와 navigation.py에서 구성한다. build_guidebook.py와 flow_pages.py가 화면용 Word, 인쇄용 PDF와 두 파일의 실제 이동 쪽수를 맞춘다.

첫 개장·리더·재건·경매장·야시장·장터의 플레이 흐름은 production-direction.md에 있다. 심층 주행과 경험치 아이템은 exploration-play.md, 추가 레시피와 개체의 관계는 dna-and-collection.md, 대회와 2.5D 제작 명세는 production-and-services.md에서 읽는다.

첫 전시 뒤 Lv.5에서 Lv.6으로 올라가는 플레이 안내와 Park Lv.5~50의 180개 목표는 park-progression.md, 후반 본편 17장면의 실제 조건은 story-progression.md가 소유한다. 운영·시설·수급 정본과 첫 주 사례는 기존 담당 문서를 따른다. 관람대의 그림은 게임에 적용한 WebP 두 장을 Word에 투명 PNG로 담는다.

| 입력 | 역할 | 지문 앞12자리 |
| --- | --- | --- |
| `CLAUDE.md` | 작업·생성·검산 원천 | `a22ee7c64741` |
| `TASK.md` | 작업·생성·검산 원천 | `5b81bad58114` |
| `apps/client/public/assets/buildings/viewing-platform-lv5.webp` | 관람대 실제 배치 이미지 | `660fc106c29e` |
| `apps/client/public/assets/buildings/viewing-platform.webp` | 관람대 실제 배치 이미지 | `a344ecf19c27` |
| `apps/client/public/assets/placeholders/habitat-grassland.svg` | 실행 코드·타입·실물 에셋 관찰 | `790cb95df76c` |
| `apps/client/public/assets/placeholders/habitat-hybrid-zone.svg` | 실행 코드·타입·실물 에셋 관찰 | `316c4f4361e8` |
| `apps/client/public/assets/placeholders/iguanodon-egg.svg` | 실행 코드·타입·실물 에셋 관찰 | `a2a7d87d1289` |
| `apps/client/public/assets/placeholders/iguanodon.svg` | 실행 코드·타입·실물 에셋 관찰 | `4f8162e77f4b` |
| `apps/client/public/assets/placeholders/operation-entrance-gate-open.svg` | 실행 코드·타입·실물 에셋 관찰 | `20a285c61b89` |
| `apps/client/public/assets/placeholders/operation-entrance-gate.svg` | 실행 코드·타입·실물 에셋 관찰 | `35f404b24716` |
| `apps/client/public/assets/placeholders/parasaurolophus-lux.svg` | 실행 코드·타입·실물 에셋 관찰 | `7de0eebfe820` |
| `apps/client/public/assets/placeholders/parasaurolophus.svg` | 실행 코드·타입·실물 에셋 관찰 | `e692dfef5220` |
| `apps/client/public/assets/placeholders/production-lumberyard.svg` | 실행 코드·타입·실물 에셋 관찰 | `0cbcfe147ea1` |
| `apps/client/public/assets/placeholders/production-quarry.svg` | 실행 코드·타입·실물 에셋 관찰 | `8456d6b12c80` |
| `apps/client/public/assets/placeholders/research-dna-lab.svg` | 실행 코드·타입·실물 에셋 관찰 | `442336101921` |
| `apps/client/public/assets/placeholders/stegoceratops.svg` | 실행 코드·타입·실물 에셋 관찰 | `4ca36f3af95a` |
| `apps/client/public/assets/placeholders/stegosaurus.svg` | 실행 코드·타입·실물 에셋 관찰 | `9c092dbdb929` |
| `apps/client/public/assets/placeholders/triceratops.svg` | 실행 코드·타입·실물 에셋 관찰 | `65ac6be5171b` |
| `apps/client/public/assets/placeholders/visitor-viewing-platform.svg` | 실행 코드·타입·실물 에셋 관찰 | `d18a6e332c8e` |
| `apps/server/prisma/schema.prisma` | 실행 코드·타입·실물 에셋 관찰 | `85affbb17256` |
| `apps/server/src/modules/great-figure/great-figure.controller.ts` | 실행 코드·타입·실물 에셋 관찰 | `4b0c15516424` |
| `apps/server/src/modules/great-figure/great-figure.service.ts` | 실행 코드·타입·실물 에셋 관찰 | `60094a958337` |
| `docs/README.md` | 작업·생성·검산 원천 | `2ad21b1f6e53` |
| `docs/assets/dino_park_asset_buildings_characters.md` | 구버전 에셋 프롬프트 참고 | `af3454ffd489` |
| `docs/assets/dino_park_asset_dinosaurs.md` | 구버전 에셋 프롬프트 참고 | `89415e3aca50` |
| `docs/assets/dino_park_asset_main.md` | 구버전 에셋 프롬프트 참고 | `66cc235c5ea2` |
| `docs/current/balance.md` | 현행 기획·정본 파생표 | `009db7aef939` |
| `docs/current/building-upgrade-tables.md` | 현행 기획·정본 파생표 | `3af28c8f96db` |
| `docs/current/buildings.md` | 현행 기획·정본 파생표 | `ab4d80c7eeab` |
| `docs/current/dinosaur-acquisition-tables.md` | 현행 기획·정본 파생표 | `8eba323a5684` |
| `docs/current/dinosaur-acquisition.md` | 현행 기획·정본 파생표 | `1a76d557763a` |
| `docs/current/dna-and-collection.md` | 현행 기획·정본 파생표 | `35388face750` |
| `docs/current/exploration-play.md` | 현행 기획·정본 파생표 | `0b251ebdcdae` |
| `docs/current/followup-content-tables.md` | 현행 기획·정본 파생표 | `723bdde99891` |
| `docs/current/game-design.md` | 현행 기획·정본 파생표 | `76ccc67e7c71` |
| `docs/current/great-figures.md` | 현행 기획·정본 파생표 | `7b598c86fcf8` |
| `docs/current/operation-balance.md` | 현행 기획·검산표 | `94b424af65a3` |
| `docs/current/park-progression-tables.md` | 현행 기획·정본 파생표 | `014c3b960761` |
| `docs/current/park-progression.md` | 현행 기획·정본 파생표 | `d4f89f794e60` |
| `docs/current/production-and-services.md` | 현행 기획·정본 파생표 | `d4dbb06acfb8` |
| `docs/current/production-direction.md` | 제작 완료 기준과 후속 기획 | `49bd395d3ea9` |
| `docs/current/research-cost-tables.md` | 현행 기획·정본 파생표 | `6ada7b9ad77f` |
| `docs/current/research-effect-tables.md` | 현행 기획·정본 파생표 | `cf532a9a3853` |
| `docs/current/research-effects.md` | 현행 기획·정본 파생표 | `b0da4b8f14b7` |
| `docs/current/research-trees.md` | 현행 기획·정본 파생표 | `7d1389bcc51b` |
| `docs/current/resources-and-production.md` | 현행 기획·정본 파생표 | `810dac83fbc7` |
| `docs/current/story-and-characters.md` | 현행 기획·정본 파생표 | `89a1fc78400c` |
| `docs/current/story-progression.md` | 현행 기획·정본 파생표 | `3dc9475940e9` |
| `docs/dino_park_action_plan.md` | 승계 원자료·대조 근거 | `25ca3314c01e` |
| `docs/dino_park_asset_buildings_characters.md` | 승계 원자료·대조 근거 | `fcd19c81c535` |
| `docs/dino_park_asset_cutscenes.md` | 승계 원자료·대조 근거 | `ad8a8f1efffc` |
| `docs/dino_park_asset_dinosaurs.md` | 승계 원자료·대조 근거 | `e0e630b6372e` |
| `docs/dino_park_asset_items_environment.md` | 승계 원자료·대조 근거 | `78ba3501d072` |
| `docs/dino_park_asset_mechanics.md` | 승계 원자료·대조 근거 | `4bdb366cbe62` |
| `docs/dino_park_asset_skins.md` | 승계 원자료·대조 근거 | `b88d66ce421b` |
| `docs/dino_park_asset_upgrades.md` | 승계 원자료·대조 근거 | `0c61363e931f` |
| `docs/dino_park_balance_simulation.md` | 승계 원자료·대조 근거 | `f278617ace0e` |
| `docs/dino_park_dinosaur_codex.md` | 승계 원자료·대조 근거 | `c75611cb50c9` |
| `docs/dino_park_great_figures.md` | 승계 원자료·대조 근거 | `d86b2b01b4e4` |
| `docs/dino_park_performance_guide.md` | 승계 원자료·대조 근거 | `f55c5421ce40` |
| `docs/dino_park_qa_checklist.md` | 승계 원자료·대조 근거 | `ae0d6ddb9c58` |
| `docs/dino_park_revenue_model.md` | 승계 원자료·대조 근거 | `c98b1ea09243` |
| `docs/dino_park_season_content.md` | 승계 원자료·대조 근거 | `32112490a35e` |
| `docs/dino_park_sound_guide.md` | 승계 원자료·대조 근거 | `bbf1f774b58f` |
| `docs/dino_park_story_scenario.md` | 승계 원자료·대조 근거 | `185bd19a155d` |
| `docs/dino_park_technical_design.md` | 승계 원자료·대조 근거 | `5f72fab078b1` |
| `docs/dino_park_tycoon_gdd.md` | 승계 원자료·대조 근거 | `1158c4f02d29` |
| `docs/dino_park_ui_art_guide.md` | 승계 원자료·대조 근거 | `343c567c10f4` |
| `docs/guidebook/README.md` | 책 편집·디자인·검사 | `f4c797b25994` |
| `docs/guidebook/artwork/park-cover.png` | 책 편집·디자인·검사 | `84ac4807754a` |
| `docs/guidebook/build_guidebook.py` | 책 편집·디자인·검사 | `64412b538bed` |
| `docs/guidebook/check_guidebook.py` | 책 편집·디자인·검사 | `196c40c5e145` |
| `docs/guidebook/content.py` | 책 편집·디자인·검사 | `cb0a01250f37` |
| `docs/guidebook/create_cover_art.mjs` | 책 편집·디자인·검사 | `0358cb4e1db5` |
| `docs/guidebook/editorial/figures.json` | 책 편집·디자인·검사 | `b9790624ce7f` |
| `docs/guidebook/editorial/reference-detail.json` | 책 편집·디자인·검사 | `9ef00dfa04f2` |
| `docs/guidebook/editorial/reference.json` | 책 편집·디자인·검사 | `107700472e0b` |
| `docs/guidebook/editorial/story-people.json` | 책 편집·디자인·검사 | `4f1cf14a5020` |
| `docs/guidebook/flow_pages.py` | 실제 북마크와 물리 쪽수 검사 | `5a1f8551d9c4` |
| `docs/guidebook/navigation.py` | 책 편집·디자인·검사 | `32b2a892eb59` |
| `docs/models/check_building_progression_v06.py` | 작업·생성·검산 원천 | `6b18446cbb49` |
| `docs/models/check_dinosaur_acquisition_v06.py` | 작업·생성·검산 원천 | `06ebe8aebb20` |
| `docs/models/check_followup_content_v06.py` | 작업·생성·검산 원천 | `0c89a16e8df0` |
| `docs/models/check_park_progression_v06.py` | 작업·생성·검산 원천 | `39bcbfe34158` |
| `docs/models/check_research_effects_v06.py` | 작업·생성·검산 원천 | `76940cf9c9e5` |
| `docs/models/check_research_trees_v06.py` | 작업·생성·검산 원천 | `f38dbfd4ea63` |
| `docs/models/dinosaur_acquisition_model_v06.py` | 작업·생성·검산 원천 | `922132d4dd25` |
| `docs/models/followup_content_model_v06.py` | 작업·생성·검산 원천 | `cd665f33ad23` |
| `docs/models/operation_checkpoints_v06.py` | 작업·생성·검산 원천 | `ff15df6c1a94` |
| `docs/models/operation_week_v06.py` | 작업·생성·검산 원천 | `3326728cb742` |
| `docs/models/park_progression_model_v06.py` | 작업·생성·검산 원천 | `6fcfc7ee52ac` |
| `docs/models/render_dinosaur_acquisition_v06.py` | 작업·생성·검산 원천 | `25267b4ca525` |
| `docs/models/render_followup_content_v06.py` | 작업·생성·검산 원천 | `2c26eb36a8e0` |
| `docs/models/render_operation_balance_v06.py` | 작업·생성·검산 원천 | `bf53a9ca5108` |
| `docs/models/render_park_progression_v06.py` | 작업·생성·검산 원천 | `eb21f5cd86f5` |
| `docs/models/render_research_costs_v06.py` | 작업·생성·검산 원천 | `8b1686a07959` |
| `docs/models/render_research_effects_v06.py` | 작업·생성·검산 원천 | `4cd7bc79aa0a` |
| `docs/models/render_research_tree_v06.cjs` | 작업·생성·검산 원천 | `0b8da99b2425` |
| `docs/models/research_cost_model_v06.py` | 작업·생성·검산 원천 | `f16010b9a3fb` |
| `docs/models/research_effect_model_v06.py` | 작업·생성·검산 원천 | `64ae4eec69b4` |
| `docs/visuals/research-tree-v06/research-tree-care.png` | 연구트리 구조도 | `fa0a59e24ed3` |
| `docs/visuals/research-tree-v06/research-tree-exp.png` | 연구트리 구조도 | `b59e006f5cb3` |
| `docs/visuals/research-tree-v06/research-tree-gene.png` | 연구트리 구조도 | `650c59375329` |
| `docs/visuals/research-tree-v06/research-tree-ops.png` | 연구트리 구조도 | `0c572274dcbb` |
| `docs/visuals/research-tree-v06/research-tree-overview.png` | 연구트리 구조도 | `13f0aa0f8c87` |
| `packages/game-data/src/balance/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `8134bc6bbced` |
| `packages/game-data/src/buildings/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `ee317826b757` |
| `packages/game-data/src/buildings/viewing-platform.ts` | 실행 코드·타입·실물 에셋 관찰 | `ac2c233e2e2e` |
| `packages/game-data/src/codex/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `183f5ecfc0f9` |
| `packages/game-data/src/dinosaurs/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `a42ab9e8fb71` |
| `packages/game-data/src/expedition/early-drive.ts` | 실행 코드·타입·실물 에셋 관찰 | `27890d3cb5b5` |
| `packages/game-data/src/expedition/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `8cc24fd83ad1` |
| `packages/game-data/src/great-figures/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `1e8905a25912` |
| `packages/game-data/src/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `cf74b40a1e55` |
| `packages/game-data/src/production/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `9e0cf6bef9df` |
| `packages/game-data/src/research/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `e96d28fff8d8` |
| `packages/game-data/src/research/park-growth.ts` | 실행 코드·타입·실물 에셋 관찰 | `577bd3476244` |
| `packages/game-data/src/seasons/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `c9e1502e201d` |
| `packages/game-data/src/shop/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `ab294353a5f0` |
| `packages/game-data/src/social/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `9c1dbc8c0cf3` |
| `packages/game-data/src/starter/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `6021f4c264cf` |
| `packages/game-data/src/stories/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `14ee7bdfdf14` |
| `packages/shared/src/constants/balance.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `e806127400f3` |
| `packages/shared/src/constants/codex.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `92d5d9b47a5f` |
| `packages/shared/src/constants/game.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `4db98673bf7d` |
| `packages/shared/src/constants/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `79ddd0f5b8de` |
| `packages/shared/src/constants/park.constants.ts` | 실행 코드·타입·실물 에셋 관찰 | `552e4429c38a` |
| `packages/shared/src/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `9c3f12ae8726` |
| `packages/shared/src/types/api.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `5e871ad9f7c8` |
| `packages/shared/src/types/building.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `aac1bc7a1419` |
| `packages/shared/src/types/codex.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `09177e327728` |
| `packages/shared/src/types/common.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `372422a1512e` |
| `packages/shared/src/types/dinosaur.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `e225ed92aa82` |
| `packages/shared/src/types/drive-expedition.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `8fed0230fc49` |
| `packages/shared/src/types/economy.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `41d0b14bd1d8` |
| `packages/shared/src/types/exploration.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `5eb7afffc474` |
| `packages/shared/src/types/first-expedition.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `8363b4675c3a` |
| `packages/shared/src/types/great-figure.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `9f746ccd8204` |
| `packages/shared/src/types/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `79e41b8fdfaa` |
| `packages/shared/src/types/milestone-synthesis.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `bcd091850301` |
| `packages/shared/src/types/park.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `4e2ae47aa232` |
| `packages/shared/src/types/repeat-synthesis.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `4a3e4c410d63` |
| `packages/shared/src/types/resources.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `8b03c2ee2f5f` |
| `packages/shared/src/types/season.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `5327d0ae591a` |
| `packages/shared/src/types/shop.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `a22d8075e4dd` |
| `packages/shared/src/types/social.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `96a3b54b4a9b` |
| `packages/shared/src/types/story.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `c4eb389a39e6` |
| `packages/shared/src/types/user.types.ts` | 실행 코드·타입·실물 에셋 관찰 | `543ae38e2c42` |
| `packages/shared/src/utils/expedition-drive.utils.ts` | 실행 코드·타입·실물 에셋 관찰 | `b2d64eb2655b` |
| `packages/shared/src/utils/format.utils.ts` | 실행 코드·타입·실물 에셋 관찰 | `6d7ce00afdfc` |
| `packages/shared/src/utils/index.ts` | 실행 코드·타입·실물 에셋 관찰 | `c97f7a1a6da0` |
| `packages/shared/src/utils/time.utils.ts` | 실행 코드·타입·실물 에셋 관찰 | `6b1b35c2cf9a` |
