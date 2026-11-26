# 에셋 폴더 구조

파크 지도에서 쓰는 시설 이미지는 `public/assets/buildings/`에 두고 `src/game/parkArtwork.ts`에 등록한다. 나머지 이미지는 아래 분류를 참고한다.

탐험의 전체 지도와 지역 10곳은 내장 ImageGen에서 만든 원경·지역 삽화를 사용한다. `public/assets/exploration/maps/`의 `overworld.webp`와 지역 ID별 WebP를 읽는다. 지도 원화에는 지명과 스팟 표시를 넣지 않는다. 스팟과 지역 버튼은 게임 데이터 좌표에 표시하며 지도 원화와 독립적으로 조정한다.

새 제작에는 [공통 아트 기준](../../../../docs/current/production-and-services.md#1-화면과-아트-방향)을 적용한다.
플레이 기능과 함께 확인할 에셋부터 제작해 게임에 적용한다. 파크의 기본 배율과 확대 화면에서 조형, 대비, 접지선, 주변 오브젝트와의 겹침을 확인한다.

파크 HUD는 [확정 가로 화면 시안](../../../../docs/assets/reference/landscape-direction.webp)을 기준으로 한다. 알렉스 초상과 건설자·재화·도감·위인·운영·탐험 아이콘은 시안에 맞춰 ImageGen으로 개별 제작한 [게임용 WebP](../../public/assets/ui/park-hud)를 사용한다. 레벨·경험치·개장 상태·재화·수확량은 화면에서 실제 게임 상태와 합성한다.

시설은 배치·이동 화면에서 같은 이미지의 좌우 반전으로 두 방향을 표현한다. 새 시설 이미지는 가로 중앙을 기준으로 바닥 위치를 맞추고, 이름이나 표지 글자는 그림과 별도로 표시한다. 회전해도 시설이 차지하는 지도 칸은 그대로다.

## 셔틀버스

셔틀버스는 [앞모습](../../public/assets/vehicles/shuttle-front.webp)과 [뒷모습](../../public/assets/vehicles/shuttle-back.webp)을 160×144 투명 WebP로 사용한다. 지도에서는 노선 진행 방향에 맞춰 앞·뒤를 고르고 좌우로 반전한다. 플레이 화면의 따뜻한 빛과 2:1 투영을 참조해 내장 ImageGen으로 제작했다.

<details>
<summary>셔틀버스 제작 프롬프트</summary>

> Use case: stylized-concept. Generate one original production game prop sprite sheet containing two fully isolated exact views of the SAME compact nature reserve shuttle minibus for the original Dino Park isometric management game. Reference image is strictly to match the fixed 2:1 orthographic diamond view and warm 2.5D miniature lighting/material world, no other items from it. The sheet is wide, exactly two uncluttered cells side by side without separator; both complete minibus drawings with equal sprite scale and plentiful clear transparent margins, even the interiors of any space around wheels. LEFT: the bus front and one side visible, front on screen bottom-right, seen looking down in a fixed orthographic 2:1 diamond map with its axle orientations aligned to the grid. RIGHT: the same bus as seen from behind and the other side, rear on screen bottom-left (front points away towards upper right), same camera. Each bus uses muted ochre-yellow and an ivory raised curved roof, rusty bronze lower trim, simple dark large windows, four small dark tires, clearly distinguishable split windscreen in the front and a pair of tiny red rear lights on the back. Chunky charming machined shapes and realistic understated surface finish, slightly exaggerated proportions for easy reading at small size, warm sunlight from upper left, no black sketch outlines, no large reflections, no writing or logos. Rectangular side proportions of compact real 12-seat minibus. Match the intrinsic proportions and angle across both sprites. Transparent alpha around both, no UI, no people, no roadway, no terrain tile, no grid, soil, or baked drop shadow. The minibus objects only. Asset will be reduced in game to 40px at main isometric screen and flipped horizontally for the other two directions.

</details>

## 사파리 물가 대치

시범 관람에서 티렉스와 스테고사우루스는 각각 Blender 5.2.3에서 모델링과 리깅, 동작 렌더를 거쳤다. [티렉스 리그](../../../../docs/assets/reference/safari-encounter/trex.blend)와 [스테고사우루스 리그](../../../../docs/assets/reference/safari-encounter/stegosaurus.blend)를 편집 원본으로 쓴다. [티렉스 제작 스크립트](../../../../docs/assets/reference/safari-encounter/render-trex.py)와 [스테고사우루스 제작 스크립트](../../../../docs/assets/reference/safari-encounter/build_stegosaurus.py)는 장면 조형·리그를 다시 만든다.

[배포 폴더](../../public/assets/safari-encounter)에서 공룡별 2.5D 투명 WebP 아틀라스와 ImageGen으로 생성한 물가 원경·지프·로봇을 읽는다. `warning.mp3`, `impact.mp3`, `intervene.mp3`는 각각 위협, 타격, 중재 타이밍에 재생하는 자체 합성음이다. [동작 구성과 파일 용량 기준](../../../../docs/current/production-and-services.md#사파리-공룡-동작의-제작-분량)에서 프레임 수, 배포 크기와 압축 해제 용량을 확인한다.

## 스테고사우루스 3D 관람

[실시간 모델 제작 스크립트](../../../../docs/assets/reference/safari-encounter/build_stegosaurus_realtime.py)는 시범 관람의 스테고사우루스 Blender 원본에서 몸통과 뼈대의 기준을 가져와 표정이 뚜렷한 얼굴과 금빛 테두리의 골판을 만든다. [편집용 Blender](../../../../docs/assets/reference/safari-encounter/stegosaurus-realtime.blend)와 [게임용 GLB](../../public/assets/safari-encounter/stegosaurus-realtime.glb)에 대기·몸 돌리기·꼬리 반격 동작이 들어 있다. 실시간 화면에서 햇빛·반사광으로 골판과 몸통의 입체를 살리고, [물가 이미지](../../public/assets/safari-encounter/field.webp) 위에 발밑 그림자를 그린다. [실시간 3D 제작 기준](../../../../docs/current/production-and-services.md#스테고사우루스-실시간-3d-시험)

## 평원·해안·숲

평원부터 숲과 물가까지 좌상단 햇빛과 2:1 카메라를 공유한다. 평소 지도는 잔디결을 보여주고 배치·이동 중에는 64×32 격자를 띄운다. 해안 띠는 섬의 해안선을 따라 이어진다. 숲과 암릉은 섬 지도에 고정하고 나무와 바위의 크기, 방향, 사이 간격을 달리한다. 정문 앞 길과 외곽 울타리는 플레이어의 파크 부지에 맞춘다.

| 게임 에셋 | 배포 해상도(px) | 지도 역할 |
| --- | ---: | --- |
| [평원](../../public/assets/environment/park-meadow.webp) | 512×512 | 부지와 바깥 평원에 이어지는 저대비 잔디결 |
| [해수면](../../public/assets/environment/coastal-water.webp) | 768×768 | 해안 아래에 반복되는 낮은 대비의 물결 |
| [연안](../../public/assets/environment/coastal-shore.webp) | 1024×256 | 모래·얕은 물·잔물결을 잇는 투명 해안 띠 |
| [활엽수](../../public/assets/environment/woodland-oak.webp) | 384×272 | 넓고 높낮이가 다른 수관과 뿌리 |
| [해안 소나무](../../public/assets/environment/woodland-pine.webp) | 384×266 | 바람에 기운 수관과 드러난 가지 |
| [암석 언덕](../../public/assets/environment/woodland-ridge.webp) | 576×171 | 뒤쪽 지역에서 눈에 띄는 낮은 암반층 |
| [내륙 암석](../../public/assets/environment/woodland-rocks.webp) | 384×229 | 암석 언덕과 숲 가장자리의 작은 바위 |
| [해안 암석](../../public/assets/environment/coastal-boulders.webp) | 384×121 | 물가에 닿는 낮고 둥근 바위 |

위 파일의 원본은 내장 ImageGen으로 제작했다. 지면과 물은 화면에 반복할 소재로 쓰고, 해안·나무·바위는 투명 WebP로 내보낸다. [숲 하층 식생](../../public/assets/environment/forest-understory.webp)은 새 숲의 아래층에 함께 쓴다. 권역 방향과 추후 확장 설계는 [공통 아트 기준](../../../../docs/current/production-and-services.md#1-화면과-아트-방향)을 따른다.

파크 뒤 초원의 바위턱·고사리·풀길은 2:1 직교 카메라로 Blender에서 제작했다. [편집 원본](../../../../docs/assets/reference/first-expedition-meadow.blend)에서 [게임용 투명 WebP](../../public/assets/environment/first-expedition-meadow.webp)를 출력한다. 바위 턱이 정문 진입로와 겹치는 방향에서는 길의 가독성을 우선한다.

<details>
<summary>평원·해안·숲 제작 프롬프트</summary>

**평원**

> Use case: stylized-concept. Create one original finished video game environment asset for the original Dino Park islands, asset type square seamless raster surface material, 1:1. The reference scene is our gameplay camera/light/style only. Use believable warm stylized miniature materials with broadly modeled shapes and gentle painterly texture, readable beside sandstone, oak and bronze buildings rather than a flat vector or hyper-real photograph. continuous close-cropped sunlit park meadow grass rendered as a material for an isometric game ground, fine clustered blades appear only as low-contrast grain, soft irregular olive-gold sunlit and sage-green areas with slight earthy ochre variation, warm bright and natural, very subtle straw flecks, keep center and corners consistent, empty turf. Invisible wrap in both axes. Camera straight down, no props, no flowers, no meadows boundaries, no tracks, no grid, no distinct cast shadows, no paths, no textbook checker marks. Texture fills canvas edge to edge, no padding. Camera-independent playable quiet midtone with natural softness.

**해수면**

> Use case: stylized-concept. Create one original finished video game environment asset for the original Dino Park islands, asset type square seamless raster surface material, 1:1. The reference scene is our gameplay camera/light/style only. Use believable warm stylized miniature materials with broadly modeled shapes and gentle painterly texture, readable beside sandstone, oak and bronze buildings rather than a flat vector or hyper-real photograph. seamless continuous calm warm morning coastal water texture viewed nearly straight down from a high isometric management game camera, rich natural medium azure and desaturated muted cyan-blue, glassy small ripples made of sparse subdued softly lit irregular reflected strokes, fine quiet texture and very low directional contrast, occasional subtle shimmer but no white broken foam. No horizon, no shore, no land, no clouds, no boats, no repeated graphic highlights or big crashing waves. Water edge-to-edge, no margin. Invisible grid repeat in both directions.

**연안**

> Use case: stylized-concept. Create one original finished video game environment asset for the original Dino Park islands, asset type very wide horizontal 4:1 continuous shore material strip. The reference scene is our gameplay camera/light/style only. Use believable warm stylized miniature materials with broadly modeled shapes and gentle painterly texture, readable beside sandstone, oak and bronze buildings rather than a flat vector or hyper-real photograph. a single low, natural subtly winding strandline, aligned straight across y=50% from left to right for use as a repeating alpha ribbon. Thin warm pale cream sand and wet beige sand, subtle flecks of sand and tiny weathered limestone pebbles, sparse thin natural arcing foam just below the sand, faint very shallow blue water reflected beneath. The green grass transition at the UPPER edge fades naturally to fully transparent; faint water at the LOWER edge also gradually fades to fully transparent over at least 30% of total strip height. Both horizontal end profiles and their values and brush grain match for repeat. Dark wet line not harsh, no large objects, no large rocks, no trees, no terrain beyond the strip, genuine transparent top and bottom, not a frame or an island. Asset is material at same miniature game scale, subtle and bright.

**활엽수**

> Use case: stylized-concept. Deliverable: new original individual transparent 2.5D tree sprite for the Dino Park Tycoon isometric operating map. Use reference image 1 as a palette/modeling reference for a sculpted game tree, and reference image 2 as the approved park identity and 2:1 ground projection reference. Follow their restrained realism and gentle warmth. Output only the specified isolated tree, as a complete object. A single mature coastal broadleaf oak. Its strong trunk is completely visible on the lower third, warm gray-brown with irregular branches and only a few sculpted brown root fingers ending in empty alpha. Its naturally uneven, wind-formed crown has several flattened, irregular moss and muted olive foliage masses, close little leaves read as textured clusters, broad and elegant and asymmetrical. Quiet sunlit greens over shaded moss green, very restrained yellow; clear gaps between key arcing branches.
> Camera: fixed 2:1 downward orthographic dimetric park camera, about 26.6 degrees above the horizontal ground plane, almost no perspective distortion; see the top planes of the canopy and roots. Soft warm daylight from the upper left. True alpha transparent background and alpha between branches. One centered grounded tree, complete silhouette, generous empty fully transparent margin of at least 12% on all sides (including highest canopy and bottom tips of roots). Roots visibly touch the invisible same ground level. Broad readable silhouette at 85-130 px and finely sculpted cohesive detail at close viewing. Natural miniature modeled boughs, restrained texture, no overlarge repetitive leaves, no dark outline. No ground or grass patch, no pedestal, no external shadow across alpha, no rocks or shrubs, no objects other than the one complete tree, no local background, border, glow, logo or text.

**해안 소나무**

> Use case: stylized-concept. Deliverable: new original individual transparent 2.5D tree sprite for the Dino Park Tycoon isometric operating map. Use reference image 1 as a palette/modeling reference for a sculpted game tree, and reference image 2 as the approved park identity and 2:1 ground projection reference. Follow their restrained realism and gentle warmth. Output only the specified isolated tree, as a complete object. A single salt-wind-sculpted coastal pine. The tapering grounded trunk curves slightly, exposed bark and several open branches silhouetted below asymmetrical needle shelves. Slant broad stepped bundles in one direction but vary their heights and ends; readable irregular natural growth, deep muted greens in internal needles and subtle brighter olive variation on lit tops. Room for air through the major branching structure. One tree with subordinate branches, fit a temperate rocky coastal nature reserve.
> Camera: fixed 2:1 downward orthographic dimetric park camera, about 26.6 degrees above the horizontal ground plane, almost no perspective distortion; see the top planes of the canopy and roots. Soft warm daylight from the upper left. True alpha transparent background and alpha between branches. One centered grounded tree, complete silhouette, generous empty fully transparent margin of at least 12% on all sides (including highest canopy and bottom tips of roots). Roots visibly touch the invisible same ground level. Broad readable silhouette at 85-130 px and finely sculpted cohesive detail at close viewing. Natural miniature modeled boughs, restrained texture, no overlarge repetitive leaves, no dark outline. No ground or grass patch, no pedestal, no external shadow across alpha, no rocks or shrubs, no objects other than the one complete tree, no local background, border, glow, logo or text.

**암석 언덕**

> Use case: stylized-concept. Create one original finished video game environment asset for the original Dino Park islands, asset type original wide shallow sculpted low ridge landmark sprite. The reference scene is our gameplay camera/light/style only. Use believable warm stylized miniature materials with broadly modeled shapes and gentle painterly texture, readable beside sandstone, oak and bronze buildings rather than a flat vector or hyper-real photograph. one short broad natural eroded rocky escarpment outcrop, visible stone ledges and soft weathered beige-gray sandstone strata with rounded tops, occasional subdued dark sage moss/tufts in cracks, unequal heights, a lower sloping end and a larger center, anchors an area of rockier landscape at the far edge of a park. Warm sun on upper left, exaggerated legible big volumes and detail like a believable stylized 3D miniature not photography, orthographic 2:1 camera high oblique like visual reference. Roughly 3:1 width to height, genuine transparency all around, no plinth, no boxed dirt chunk, no cave signs, vegetation only small anchored tufts, shadow only within contact edges. All ends and tops visible with clear padding.

**내륙 암석**

> Use case: stylized-concept. Create one original finished video game environment asset for the original Dino Park islands, asset type isolated original low rock-cluster sprite. The reference scene is our gameplay camera/light/style only. Use believable warm stylized miniature materials with broadly modeled shapes and gentle painterly texture, readable beside sandstone, oak and bronze buildings rather than a flat vector or hyper-real photograph. three or four non-uniform low chalk-sandstone and warm gray limestone boulders in a loose compact cluster with one small moss-green crevice and sparse dry grass at foot, signs of erosion and striations that are modeled only on large facets; broad calm simplified volumes at tiny zoom, strong left upper daylight, darker cooler foot-facing planes. Do not copy the whole old outcrop, which is only a material hint. Warm modelled realistic-stylized park miniature. High orthographic 2:1 camera. No sandy ground patch or thick shadow beyond rock footprint, true alpha, no text or objects. Leave room on all edges.

**해안 암석**

> Use case: stylized-concept. Create one original finished video game environment asset for the original Dino Park islands, asset type isolated original rocky-shore sprite. The reference scene is our gameplay camera/light/style only. Use believable warm stylized miniature materials with broadly modeled shapes and gentle painterly texture, readable beside sandstone, oak and bronze buildings rather than a flat vector or hyper-real photograph. a relaxed flat line of four weather-rounded low shoreline rocks of different sizes, smooth softly faceted dark brown-gray granite with warm highlighted and slightly wet tide faces; one larger broad sloping boulder, little trailing rounded pebbles. Restrained desaturated green moss at highest creases, sit in close contact with shoreline in a high orthographic 2:1 camera. Use same warm upper-left sunlight and modelled believable 2.5D park aesthetic. Purely alpha outside the group, no grass slab, base plate, water, foam, buildings, people, text, drop shadows, or sand extending beyond the rocks. Around 10% clear padding.

</details>

### 예비 숲과 해안 에셋

- [나무 세 그루](../../public/assets/environment/forest-canopy.webp)와 [숲 가장자리](../../public/assets/environment/forest-edge.webp)를 내장 ImageGen으로 제작했다.
- 너비 384px의 투명 WebP이며, 파일에 바닥 그림자를 포함하지 않는다. 접지점은 가로 50%, 세로 94%다.

<details>
<summary>숲 제작 프롬프트</summary>

> Use case: stylized-concept. Produce 1 wide transparent PNG sprite sheet of two individual warm 2.5D low-poly-but-painterly miniature woodland clump assets for the original Dino Park isometric management game.
>
> Reference image 1 guides art direction, overhead 2:1 isometric viewpoint, rounded stylized forms, warm directional sunlight from the upper left, and visual contrast. Replace the subject entirely with only woodland props, no buildings, roads or dinosaurs.
>
> Composition: against fully transparent alpha canvas, exactly two objects well apart, each filling its own half of the image, with a large empty 16% transparent separator down the center, no edge cropping. Each clump has a broad horizontal silhouette about 1.35 times wider than its height. The left clump has three overlapping native subtropical broadleaf trees, two short slim warm-brown branching trunks and a taller rounded canopy. The right clump has two wide wind-rounded broadleaf trees at different heights, one visibly lower, and two tiny fern shrubs close to base softening the trunks. Big strong coach-shaped, layered leafy masses, with very restrained detail so the grouping reads at 65–100px game size. Clear medium apple green sunlit tops, moss-olive middle green and subdued dark sage underside. Tans for branches. Keep the clumps handsome and grounded, with slight asymmetry, recognizable leafy texture, smooth foliage forms and sculpted 3D volume. Elevated three-quarter camera looking down, orthographic 2:1 diamond projection, the visible tree contact points backed by the cutout. Keep only the trees and tiny adjacent leaves. No ground chunks, grass platforms, paving, baked cast shadows or ground matte. No border frame, sky, background filling, lettering, extra objects, disconnected floating leaves or transparent-edge haze. Render professionally as game-ready cutouts.

</details>

### 해안과 숲 하층 식생

왼쪽 아래 해안에는 바위와 얕은 물을 배치한다. 정문으로 이어지는 길은 해안 위쪽을 지난다. 숲 가장자리는 큰 나무와 낮은 하층 식생이 겹치게 배치한다.

[해안 암석](../../public/assets/environment/coastal-outcrop.webp)과 [숲 하층 식생](../../public/assets/environment/forest-understory.webp)은 내장 ImageGen으로 만든 투명 WebP다. 각각 384×193px, 384×229px로 내보냈다.

<details>
<summary>해안 암석과 하층 식생 제작 프롬프트</summary>

> COASTAL OUTCROP
> Use case: stylized-concept.
> Asset type: original transparent 2.5D coastal rock sprite for the Dino Park isometric park management game. This over-the-map decoration fits a small hilly island shoreline outside a fenced park. The supplied images guide the modelled miniature finish, restrained tree-green palette, warmer midtones, light, and fixed 2:1 top-down isometric camera. Generate a new isolated rocky outcrop only.
> Shape: one broad, low and naturally irregular joined cluster with an asymmetrical brown-gray volcanic outcrop, some flat fractured shelves descending into three small connected sloping rocks, and a slightly taller stone at one side. Visible upper planes, several cozy warm sandy edges with chamfered worn corners and rounded details. A limited scattering of muted moss, olive fern and little grass tufts in one or two crevices on the upper ledges. Darker warm brown cavity shadows stay inside stone recesses. Use broad volumes for excellent readability when downsized to roughly 115 image pixels. Clean carved painted miniature 3D volumes and slight granular stone texture, side-to-side asymmetry and natural shape. Sun from upper left, camera orthographic above at 26.6-degrees (2:1 map grid), framing wide landscape 3:2, entire silhouette centered within generous fully transparent margins. Alpha channel background, silhouette visible down to the bottom touchpoints. No external ground, no base plate, no ocean or water, no external shadows, no white backdrop, no character, no text, no buildings, no island landmass.
>
> FOREST UNDERSTORY
> Use case: stylized-concept.
> Asset type: original wide, low tropical forest-understory prop on true transparent background for the outdoor forest layer of the Dino Park 2.5D park management game. The supplied prop guides the approved isometric scale, sculpted forms and lighting. The second reference guides the island visual style. Generate a new isolated plant cluster only.
> Shape: one dense asymmetric coastal subtropical understory grouping composed of broadleaf ground shrubs, several strong wide individual curled fern fronds, two compact cycads and a modestly taller young canopy sapling toward one end. Leaves overlap with organic asymmetry and visibly tiered heights. Deep moss-green interior, fairly subdued medium emerald and olive greens that remain behind sunlit canopy sprites, tiny sage-green sun-facing highlights, a few visible warm ochre stems near the touchpoints. Forest-floor shape forms a wide horizontal silhouette over an implied plane, with no ground visible between plants. Elevated 2:1 overhead orthographic game camera, warm soft late-morning daylight from upper left, crisp painted 3D volume, broad readable leaf masses, no black stroke. Framing wide landscape 3:2 with fully transparent margins and the entire isolated grouping. Small scale asset meant to occupy 80–130 pixels in the game. Alpha background continues between leaf tips and into small silhouette gaps. No external shadows, no platform base, no scenery, no soil, no grassy patch, no freestanding decorative elements, no added rocks, no flowers, no dinosaurs, no signs or lettering.

</details>

## 입구·연구소·생산 시설

정문은 사암 기둥과 참나무 아치, 황동 발자국 표식으로 구성한다. 오른쪽 아래를 향할 때는 원본을 쓰고, 왼쪽 아래를 향할 때는 두 기둥의 가운데를 기준으로 같은 그림을 좌우 반전한다. 개장과 휴장 이미지는 접지점을 공유한다.

<details>
<summary>정문 제작 프롬프트</summary>

내장 ImageGen으로 제작했다.

**열린 정문**

> Use case: precise-object-edit. Re-render an ORIGINAL Dino Park gate sprite in true orthographic 2:1 isometric. OUTPUT THE OPEN GATE ONLY. Reference 1 defines the canvas, camera and physical placement only: LEFT stone pier is clearly closer and lower on the screen, RIGHT stone pier farther and higher, at the same existing positions, with both shafts exactly vertical. Maintain the exact same approximately negative-one-half slope between the left and right floor contact points. Put the piers and central badge in the same frame locations as reference 1. Reference 2 is the exact object identity, material and architecture to model from this other camera angle: beveled squat ASH-SANDSTONE pyramidal upper caps with a flat top, thin band of muted riveted brass halfway up the cap above a broader stone collar, pale clean stacked rectangular masonry courses on square-column shaft, slim lower projecting brass molding above tapered chamfered stepping base, small inset sage-green plaques on the projecting visible faces of both piers with narrow brass rim and amber footprint. Replace the solid copper arch of Reference 1 with Reference 2's warm smooth curved oak beam in the camera's natural gate plane, simple large brass brackets with small bolts, muted sage shield with a small amber three-toe dinosaur footprint emblem. Match the wood, stone and metal palette and the thickness/scale of masonry as actually seen in reference 2. Open matching oak gate leaves with simple dark straps recessed and swung behind the piers; empty center passage. Keep both fitted bases separate and align all original ground contacts. Render real independent volumes of the two piers in the genuine up-right isometric view. True alpha where ground and backdrop would be; no pavement, no shared plinth or slab, no baked shadows, text, guide marks, plants or other architecture. Preserve complete silhouettes, ample margin, antialiased clean alpha.

**닫힌 정문**

> Use case: precise-object-edit. Fully close the two oak gate leaves in this exact approved Dino Park isometric gate sprite. ONLY replace the positions of the doors, without moving, scaling, reframing, rotating or redrawing any other feature. Keep the original left-lower and right-higher stone pier floor contours exactly matching the supplied image pixel positions, and retain exactly the original camera projection, overall asset scale and true-alpha padding. Preserve the original doorway arch, sage badge, stone pyramidal caps, brass bands and inset sage plaques. In the passage between the piers, show the two fully shut oak leaves with vertical boards, dark iron straps, subtle wood frame and a centered small fixture. Their bottom edges are in this genuine gate plane, thus slanting toward the upper right parallel with the line between the column bases. Keep the whole passage physically blocked and unmistakably closed at small scale. Use the same shading, amber wood tone and isometric depth as the reference. No stone slab between piers, no floor, no cast shadows, no new ornament, no text, no background. True alpha around the sprite. Open or closed are two states of the exact same mesh and framing.

</details>

아래 시설은 따뜻한 조명을 공유한다. 시설 상세에도 표의 이미지를 사용한다. 배치와 충돌 판정에는 시설 데이터의 점유 칸을 사용한다.

| 시설 | 지도 면적 | 실루엣과 이미지 |
| --- | --- | --- |
| 입구 게이트 | 4×4칸 | 사암 기둥, 참나무 아치와 황동 발자국 표식. 512×476px [개장](../../public/assets/buildings/entrance-isometric-up-open.webp) · [휴장](../../public/assets/buildings/entrance-isometric-up.webp) |
| DNA 연구소 | 2×2칸 | 둥근 청록 지붕, 유리 표본 용기. [연구소](../../public/assets/buildings/research-dna-lab.webp) |
| 벌목장 | 2×2칸 | 올리브색 목재 지붕, 둥근 통나무 단면. [벌목장](../../public/assets/buildings/production-lumberyard.webp) |
| 채석장 | 2×2칸 | 밝은 석재 계단, 구릿빛 윈치. [채석장](../../public/assets/buildings/production-quarry.webp) |
| 탐험 연료 보급소 | 2×2칸 | 황토색 탱크, 목재 받침대와 수동 펌프. 채석장과 같은 시점의 2.5D 이미지. [탐험 연료 보급소](../../public/assets/buildings/production-fuel-depot.webp) |
| 육식 서식지 | 3×3칸 | 사암 기둥, 전기철망과 낮은 앞쪽 난간. [육식 서식지](../../public/assets/buildings/habitat-carnivore-electric.webp) |
| 보안센터 | 2×2칸 | 적갈색 지붕, 황동 방패와 감시창. [보안센터](../../public/assets/buildings/operation-security-center.webp) |

<details>
<summary>육식 서식지와 보안센터 제작 프롬프트</summary>

두 이미지는 내장 ImageGen으로 제작했다.

**육식 서식지**

> Use case: stylized-concept. Create one original finished 2.5D building sprite for the Dino Park mobile isometric management game: the starter CARNIVORE HABITAT, a 3-by-3-tile open-air enclosure. References show only surface workmanship, fixed ground projection and lighting. Exact orthographic diamond projection for an existing 64-by-32 tile grid: square ground diamond with 2:1 projected width-to-height, long axis horizontal, all ground edges rise 1 for every 2 horizontal, both flanks equal, nearest corner centered. The whole diamond visible. Silhouette: pale warm sandstone pier bases, sturdy weathered brown and muted dark iron safety fence, a substantial rust-orange wooden service gate with bronze hinges on the far edge, and a couple of small natural gray rocks at the far corner. Fence top height is about one-third of an adult dinosaur's height, with BOTH nearest edges much lower, a modest rust-brown/bronze open rail on stone bases, the near corner unobtrusive. Keep the central 75% of the enclosure flat and empty, broad warm olive grass over gentle ochre packed dirt, playable for later dinosaur overlays. Read as a credible early predator enclosure at tiny game map size, warm daylight from upper left, chunky modeled forms, painted subsurface and stone microtexture, true 2.5D stylized believable miniature. Asset alone, genuinely transparent alpha outside its footprint including beneath open rails, centered with space around all edges, no cast shadow extending outside the footprint, no UI, surrounding scene, words, letterforms, watermark, people, dinosaurs, skeletons, trees, tall platforms or roof. The front silhouette of the ground diamond must be clearly visible and clean.

**보안센터**

> Use case: stylized-concept. Create one original finished 2.5D building sprite for the Dino Park mobile isometric management game: the starter SECURITY CENTER, a tiny functional ranger guard station when shown at phone map scale. References are strictly for miniature workmanship, ground projection and lighting. On a compact square 2-by-2-tile ground pad (orthographic centered 2:1 diamond, projected 64x32 game grid, edges rise 1 for every 2 horizontal, front corner centered). Warm sandstone knee wall, deep umber timber joinery, one low square corner observation turret with wraparound smoked honey-colored glass, one simple squat wooden checkpoint booth merging with the turret, and a muted terracotta pitched roof with a small bronze roof finial. Make the lowest silhouette unmistakably a park ranger security station without making the turret tall, spacious or larger than the laboratory. Single miniature footprint, readable door facing the near left-ground axis, optional small blank bronze shield symbol as its sole emblem, steps contained on the base. Stylized believable 3D park miniature, sculpted forms, restrained detail, rich sunlit warm colors, upper-left daylight matching references, clear contrasting materials and generous transparent framing of the entire 2:1 foundation. Asset alone with genuinely transparent alpha outside the silhouette, no extra ground or cast shadow beyond the pad, no text, no characters, no UI, no watermark, no garish color.

</details>

## 시설 기본 외형

시설 49종의 기본 이미지를 지도, 배치 미리보기, 시설 상세에서 쓴다. 기존 이미지 8종과 아래 신규 41종을 같은 타일 크기로 연결한다. 지도의 길·울타리 등 장식 6종은 환경 에셋에 포함된다.

신규 시설 이미지는 내장 ImageGen을 사용했다. 부화장은 DNA 연구소, 생산·교통 시설은 연료 보급소와 채석장, 편의·운영 시설은 보안센터와 벌목장, 서식지는 육식 서식지의 조명과 재질을 참고했다. 가로 2 대 세로 1인 지도 타일에 가깝도록 시설 하단의 두 사선과 앞 모서리를 확인한다. 투명 PNG의 여백을 잘라 1×1은 너비 256px, 2×2와 3×3은 384px, 4×4는 512px WebP로 내보낸다.

<details>
<summary>시설 41종 제작 프롬프트</summary>

> Use case: stylized-concept. Create one original production-ready asset for Dino Park, a 2.5D mobile isometric park management game. Supplied artwork is for exact camera, upper-left daylight, carved miniature detail and material study only. Use believable stylized 3D forms with strong readable shapes at tiny map scale, natural lively warm colors, warm sandstone and crafted timber or brushed bronze where appropriate. Camera is orthographic fixed 2:1 diamond-map with equal isometric horizontal axes, two equal flanks, ground edges rise exactly 1 for 2 horizontally, ground front tip centered below distant tip. Use one complete square ground diamond of the specified footprint, with a clean thin sandstone or appropriate natural foundation, no perspective foreshortening, no ground or cast shadow outside the tile, no horizontal base edges. Keep vertical forms centered within foundation, the object and entire base surrounded by genuine transparent alpha. No HUD, labels, text, logos, people, animals, or backdrop.

시설별 모델 설명과 실제 내부 점유 크기를 공통 프롬프트에 더한다. 각 시설은 하나의 완전한 스프라이트로 생성한다. 각도 수정본은 앞서 제작한 외형과 2:1 타일을 참조하고 바닥 양쪽 사선의 기울기 0.5, 지붕과 사암 받침의 투명 여백을 요청했다.

| 분류 | 이미지 | 점유 칸 | Model |
| --- | --- | --- | --- |
| 서식지 | [초원 서식지](../../public/assets/buildings/habitat-grassland.webp) | 3×3 | starter grassland dinosaur pen, green meadows, light honey timber fence on stone peg bases, tiny oval blue pond and feeding trough along far edges, a low bush far left, center kept wide open. The two near sides use only an especially low sparse split timber rail so the dinosaur silhouette is readable |
| 서식지 | [초식 하이브리드 서식지](../../public/assets/buildings/habitat-hybrid-zone.webp) | 3×3 | herbivore hybrid dinosaur enclosure with low copper rail on sandstone wall footing, bright mossy grass, one shallow kidney-shaped pool and feeder on far side, simple bronze survey marker at far corner, generous empty center, both near sides only very low single copper rail |
| 서식지 | [숲 서식지](../../public/assets/buildings/habitat-forest.webp) | 3×3 | forest dinosaur enclosure with wooden perimeter rail, leafy sculpted tree clump ONLY along the back edge, high ferns only in far corner, layered moss and dirt, clear walkable center, both near sides low sparse timber rails |
| 서식지 | [익룡 돔](../../public/assets/buildings/habitat-pterosaur-dome.webp) | 4×4 | pterosaur aviary with a broad domed bronze lattice shell and CLEAR softly shaded warm gray-blue translucent glazing, sandstone plinth, visible high perches toward back, empty inside, foreground pane is extremely clear and light to leave room for dynamic creatures |
| 서식지 | [해양관](../../public/assets/buildings/habitat-marine-aquarium.webp) | 4×4 | marine reptile aquarium, stocky rectangular clear glass tank with rich natural blue water and bright underwater view through front glass, thick sandstone piers at corners, small olive service roof at far corner, pale rocks and coral far behind, clear open center water with no animal |
| 서식지 | [사막 서식지](../../public/assets/buildings/habitat-desert.webp) | 3×3 | desert dinosaur pen in terracotta sand, low ocher sandstone and iron rail enclosure, tiny oasis along a back edge, two upright cactus arms and a stack of eroded stones far back, wide empty walkable center, low open front railing |
| 서식지 | [화산 서식지](../../public/assets/buildings/habitat-volcanic.webp) | 3×3 | volcanic habitat enclosure on deep charcoal basalt and earth with scattered salt-gray stones, a contained glowing ember-orange magma trench against only far edge with proper solid barriers, dark iron back fence, both front railings low, broad open walkable center, no smoke |
| 서식지 | [빙하 서식지](../../public/assets/buildings/habitat-glacier.webp) | 3×3 | glacier habitat enclosed by low cool gray stone and timber rails, pale powder blue snow floor, chunky cyan ice slabs far back, one low heated timber shelter in rear corner with warm amber hatch, broad empty level center, low sparse front railings |
| 연구 | [부화장](../../public/assets/buildings/research-hatchery.webp) | 2×2 | dinosaur egg hatchery, one squashed half-dome greenhouse made of pale honey-green glass panes and cream stone ribs, two large softly lit eggs unmistakably visible through the clear front glass, incubator stands, low stone entrance |
| 연구 | [화석 연구소](../../public/assets/buildings/research-fossil-lab.webp) | 2×2 | fossil research workshop of sandstone, asymmetrical olive green utility roof, broad amber glass display with unmistakable cream ammonite fossil relief, fossil preparation bench under a compact awning |
| 연구 | [유전자 센터](../../public/assets/buildings/research-genetics-center.webp) | 3×3 | advanced genetics center, three connected low laboratory wings with slate-lavender metal roof, cream stone foundation, double connected lavender cylindrical sample tubes visible through golden framed windows at back, distinctive broad symmetric roof footprint |
| 연구 | [진화 연구소](../../public/assets/buildings/research-evolution-lab.webp) | 3×3 | evolution research laboratory, broad rounded facade copper-and-olive scientific halls with stepped roof and three bright tall amber specimen windows side by side, subtle triple bone silhouettes visible in glazing, warmly lit practical design |
| 연구 | [행동 연구소](../../public/assets/buildings/research-behavior-lab.webp) | 2×2 | dinosaur behavior lab, deliberately low squat moss-gray single-storey building, dominant slanted continuous strip of smoked blue-gray observation windows, one short tracking sensor on roof, central sandstone base and simple timber door |
| 관람 | [관람 열차](../../public/assets/buildings/visitor-tour-train.webp) | 2×2 | mini park rail station, tiny red-and-brass narrow gauge locomotive and one extremely short coach stopped on built-in short rails with all track contained on pad beside an ochre-roof timber boarding shelter |
| 관람 | [사파리 지프](../../public/assets/buildings/visitor-safari-jeep.webp) | 1×1 | tiny safari jeep station prop, olive olive-drab open-top sturdy park tour rover with tan canvas sunshade and chunky dark wheels, simple short wood service post at rear of vehicle, one fitted sandstone footprint |
| 관람 | [수중 터널](../../public/assets/buildings/visitor-underwater-tunnel.webp) | 3×3 | park underwater observation tunnel attraction, show a short arched glass tube crossing a contained turquoise water basin, visible golden piers, one low sandstone stair entrance and copper ribs. Tunnel unmistakable and entirely atop the small foundation |
| 관람 | [스카이워크](../../public/assets/buildings/visitor-skywalk.webp) | 2×2 | treetop skywalk station, shallow elevated L-shaped walk, staircase and a short glass-sided observation bridge between two warm sandstone supports, small leafy patch behind it contained on foundation, a bright blue-gray rail edge tracing silhouette |
| 관람 | [포토존](../../public/assets/buildings/visitor-photo-zone.webp) | 1×1 | dinosaur theme park photo spot, small warm timber open picture frame with bronze hoof motif, tiny sculpted stone dinosaur egg prop attached on one side and round inset brass floor marker on the sandstone pad |
| 편의 | [푸드코트](../../public/assets/buildings/amenity-food-court.webp) | 2×2 | compact outdoor theme park food court, two small timber counter booths with terracotta and cream awnings, two ochre parasols shading small tables, one large central terracotta tile square pad, bright but restrained |
| 편의 | [기념품샵](../../public/assets/buildings/amenity-gift-shop.webp) | 1×1 | tiny dinosaur gift shop compact front display bay with two readable plush dinosaur silhouettes through window, one muted golden striped awning over door, squat timber and sandstone miniature shop |
| 편의 | [화장실](../../public/assets/buildings/amenity-restroom.webp) | 1×1 | compact park restroom kiosk with two doors and two simple human pictogram plaques, cream limestone and gray-green low pitched roof, small footprint, functional cleanliness |
| 편의 | [음수대](../../public/assets/buildings/amenity-drinking-fountain.webp) | 1×1 | single park drinking water tap, sculpted small matte bronze dinosaur-head spout with slight water trickle into deep blue ceramic drinking basin, low sandstone pedestal as part of game tile, practical single-person size, no decorative splash pool |
| 편의 | [벤치](../../public/assets/buildings/amenity-bench.webp) | 1×1 | one park bench with broad amber wooden slats, stone scroll side supports, one subtle fossil footprint cast on end support, recognizable open back and seat, centered on restrained thin stone pad |
| 편의 | [디노 카페](../../public/assets/buildings/amenity-dino-cafe.webp) | 2×2 | dinosaur park coffee house, wood and sandstone single cafe, chestnut roof, sage fabric shade across terrace, one outdoor table and cup-and-footprint circular emblem on facade, warm light |
| 편의 | [아이스크림샵](../../public/assets/buildings/amenity-ice-cream-shop.webp) | 1×1 | tiny ice cream kiosk with terracotta wood trim, muted rose and ivory awning, one prominent model cream-colored ice cream cone fixed to roof, sandstone pad, cohesive miniature park materials |
| 편의 | [디노 레스토랑](../../public/assets/buildings/amenity-dino-restaurant.webp) | 3×3 | upscale dinosaur park restaurant, dark timber and glowing cream sandstone, broad three-bay build with amber window glow; one simplified pale fossil rib arch visible behind glass, warm copper ridge and covered doorway |
| 편의 | [구급소](../../public/assets/buildings/amenity-first-aid.webp) | 1×1 | small park first-aid kiosk, warm ivory masonry, terracotta red awning with simple ivory first-aid kit pictogram, clean greenish front door and first aid supplies just inside the clear window |
| 편의 | [정보센터](../../public/assets/buildings/amenity-info-center.webp) | 2×2 | visitor park information center, upright large wooden map board showing a few abstract park paths on a cream surface, wide front counter with short sandstone steps, muted ochre roof with broad blue-green trim |
| 편의 | [물품보관소](../../public/assets/buildings/amenity-locker.webp) | 1×1 | compact open front park guest locker shelter, two rows of muted blue painted steel doors with embossed brass key circles, thin slate roof and sandstone base, entire shelter exactly one tile |
| 편의 | [ATM](../../public/assets/buildings/amenity-atm.webp) | 1×1 | single visitor cash access kiosk, bronze wood-sided ATM machine with one wide muted blue glowing screen, card slot and coin relief under a tiny built-in sage rain hood, no signage, centered on small low sandstone pad |
| 생산 | [창고](../../public/assets/buildings/production-warehouse.webp) | 2×2 | park materials warehouse, broad timber gable and slate olive roof, open loading bay with a tidy stack of square crates and a bundle of lumber on the pad |
| 생산 | [사료 공장](../../public/assets/buildings/production-feed-factory.webp) | 2×2 | dinosaur feed mill with an earthy moss-brown workshop, one upright muted brass grain silo, short covered open conveyor and two sacks of dry feed at the loading hatch, distinguish it from a fuel tank |
| 생산 | [육류 저장소](../../public/assets/buildings/production-meat-storage.webp) | 2×2 | cold meat storage, sandstone footing with simple dusty blue corrugated insulated shed, an oversized rectangular steel cold-room door and bulky refrigeration coil on the roof, tiny pictogram snowflake, one insulated crate |
| 생산 | [어류 양식장](../../public/assets/buildings/production-fish-farm.webp) | 2×2 | park aquaculture facility with two low round open blue fish nursery vats linked by short copper pipes, one small shaded timber filtration cabinet behind and few tiny reflected ripples, all on a small sandstone square pad |
| 생산 | [발전소](../../public/assets/buildings/production-power-plant.webp) | 3×3 | compact park electrical generating plant. Low dark bronze turbine hall with squat sandstone walls, one horizontal alternator with fins, short insulated copper conduits and chunky contained transformer, discreet brass lightning symbol, no tall pylons |
| 생산 | [저수지](../../public/assets/buildings/production-water-reservoir.webp) | 3×3 | park water reservoir, one broad shallow circular exposed fresh-water cistern with pale stone ring and muted blue water, low sandstone-and-timber pump house and bronze pipes on one back corner, no tower |
| 운영 | [파크 금고](../../public/assets/buildings/operation-vault.webp) | 1×1 | Park gold vault, a squat compact sandstone strong-room, huge round blackened bronze safe door with brass spokes, restrained upper shield of three coins, stone reinforcements |
| 운영 | [동물병원](../../public/assets/buildings/operation-vet-hospital.webp) | 2×2 | dinosaur veterinary hospital, white sandstone and broad arch large enough for an animal, sage-green clerestory roof and ramps, tiny green abstract paw emblem above entrance, one small awning bay |
| 운영 | [관리사무소](../../public/assets/buildings/operation-admin-office.webp) | 2×2 | tiny park administration lodge, orderly symmetrical ocher sandstone entrance with double doors, muted olive hipped roof, clipboard symbol etched in tiny bronze plate, dry stone foundation and clean steps |
| 운영 | [직원 숙소](../../public/assets/buildings/operation-staff-quarters.webp) | 2×2 | park staff quarters, low long cream stone and warm brown timber bunkhouse, understated rust red shingled roof, little covered porch with three sleeping-room windows and a short step, less monumental than office |
| 운영 | [주차장](../../public/assets/buildings/operation-parking-lot.webp) | 3×3 | compact square 2:1 diamond park parking lot tile with understated charcoal gray pavers and short ivory parking slot lines on both near axes, two little understated sand and olive vehicles and one small entry booth at rear corner |

</details>

## 서식지 울타리 강화

야외 서식지 7종은 지도·시설 상세·목록·이동 미리보기에서 완공된 레벨을 기준으로 같은 외형을 쓴다. 첫 외형 교체는 Lv.5다. 육식 서식지는 기본형부터 전기철망을 쓰며, 강화형에는 보강 기둥과 무거운 잠금장치를 더한다.

| 시설 | 기본형 | 첫 강화형 | 울타리 변화 |
| --- | --- | --- | --- |
| 초원 서식지 | [기본 외형](../../public/assets/buildings/habitat-grassland.webp) | [Lv.5](../../public/assets/buildings/habitat-grassland-lv5.webp) | 밤색 목재 이중 가로대와 석재 기둥 |
| 숲 서식지 | [기본 외형](../../public/assets/buildings/habitat-forest.webp) | [Lv.5](../../public/assets/buildings/habitat-forest-lv5.webp) | 목재 격자와 편평한 사암 기둥 |
| 육식 서식지 | [기본 외형](../../public/assets/buildings/habitat-carnivore-electric.webp) | [Lv.5](../../public/assets/buildings/habitat-carnivore-lv5.webp) | 두꺼운 전기철망, 보강 기둥과 양문 잠금장치 |
| 초식 하이브리드 서식지 | [기본 외형](../../public/assets/buildings/habitat-hybrid-zone.webp) | [Lv.5](../../public/assets/buildings/habitat-hybrid-zone-lv5.webp) | 구릿빛 격자와 금속 띠를 두른 사암 기둥 |
| 사막 서식지 | [기본 외형](../../public/assets/buildings/habitat-desert.webp) | [Lv.5](../../public/assets/buildings/habitat-desert-lv5.webp) | 밝은 사암 기둥과 통풍형 철망 |
| 화산 서식지 | [기본 외형](../../public/assets/buildings/habitat-volcanic.webp) | [Lv.5](../../public/assets/buildings/habitat-volcanic-lv5.webp) | 현무암 기둥과 구릿빛 보강재 |
| 빙하 서식지 | [기본 외형](../../public/assets/buildings/habitat-glacier.webp) | [Lv.5](../../public/assets/buildings/habitat-glacier-lv5.webp) | 눈 덮인 기둥과 낮은 목재 울타리 |

내장 ImageGen에서 기존 서식지의 재질·배치를 유지하고 울타리만 바꾸는 방식으로 생성했다. 참고 격자의 64×32 타일과 3×3 사각 바닥, 2:1 투영을 맞춘다. 앞 두 변의 난간을 낮게 두고 주변을 투명하게 비운다. Lv.1 육식 철망에는 절연 표식과 옅은 청색 띠, Lv.5에는 두꺼운 철제 격자와 보강 기둥을 적용한다. 여백을 잘라 너비 384px의 알파 WebP로 내보낸다.

## 추가 제작 목록

| 범위 | 연결 상태와 추가 제작 대상 |
| --- | --- |
| 길과 장식 | 길·울타리·공룡 동상·분수대·화단·가로등 6종의 전용 배치 이미지가 필요하다. 지도 관람길과 외곽 울타리는 엔진이 따로 그린다. |
| 가변 전시장 | 블록형 초원·해양관에 쓸 직선·안쪽 모서리·바깥 모서리·출입문과 바닥 연결부가 필요하다. 익룡 돔 5단계와 해양관 확대 외형은 시안에서 비교했다. |
| 7개 야외 서식지 | Lv.10·15·20·25의 추가 강화 외형이 필요하다. |
| 다른 시설 | 관람대 Lv.10·15·20·25와 아래 36개 강화 가능 시설의 전용 강화 외형이 필요하다. 익룡 돔·해양관의 기본 이미지도 현재 레벨과 관계없이 한 장씩 연결돼 있다. |
| 공룡 | 기본 도감 83종 가운데 4종의 전용 2.5D 대기 이미지가 연결돼 있다. 나머지 79종의 대기 이미지와 파라 외 공룡의 전용 걷기 프레임이 필요하다. |

<details>
<summary>강화 외형이 필요한 일반 시설 36종</summary>

부화장, DNA 연구소, 화석 연구소, 유전자 센터, 진화 연구소, 행동 연구소, 관람 열차, 사파리 지프, 수중 터널, 스카이워크, 포토존, 푸드코트, 기념품샵, 화장실, 음수대, 벤치, 디노 카페, 아이스크림샵, 디노 레스토랑, 구급소, 정보센터, 물품보관소, ATM, 사료 공장, 육류 저장소, 어류 양식장, 발전소, 저수지, 창고, 파크 금고, 관리사무소, 보안센터, 동물병원, 직원 숙소, 입구 게이트, 주차장.

</details>

## 관람대 2.5D 이미지

같은 시설의 기본형과 첫 변화 단계부터 함께 만든다. 2:1 아이소메트릭 시점과 왼쪽 위 조명을 맞추고, 배치 크기와 바닥 기준점은 파크 타일에서 확인한다. 투명 원본을 확인한 뒤 런타임용 WebP로 내보낸다. 아래 두 파일은 모두 가로 384px로 저장했다.

| 게임에서 보이는 단계 | 이미지 |
| --- | --- |
| Lv.1~4 열린 목재 데크 | [viewing-platform.webp](../../public/assets/buildings/viewing-platform.webp) |
| Lv.5 청록색 지붕과 안내 표지 | [viewing-platform-lv5.webp](../../public/assets/buildings/viewing-platform-lv5.webp) |

관람대의 두 이미지는 내장 ImageGen으로 제작했다. 다음 시설 제작 시 시점과 조명을 맞출 수 있도록 최종 수정 프롬프트를 남긴다.

<details>
<summary>지붕 있는 관람대와 열린 데크 프롬프트</summary>

**Lv.5**

> Use the supplied asset as the exact reference for the roofed viewing deck. Re-export it as a complete compact 2.5D game sprite. The most important change is to zoom out considerably and include fully transparent margins of at least fifteen percent of the canvas on every side, so the whole roof ridge, the entire wooden deck and the very front bottom corner are safely inside the canvas. The original roof peak is clipped; restore a small complete peak in the same teal painted metal. Keep the same orthographic 26.6 degree diamond-map perspective, wooden architecture, roof design, binoculars, blank sign, open railings, lighting and tightly square plot proportions. The object should occupy the center 65 to 70 percent of the canvas only. No ground plane, no terrain, no additional graphic or text and no drop shadow. The edges of the sprite and the inside of open railings must be truly alpha transparent.

**Lv.1~4**

> Create the earlier, simple upgrade stage of this exact dinosaur park viewing platform for the same 2.5D game. Preserve the same orthographic two-to-one isometric map camera, warm timber shape and ground-level raised square wooden deck, same stair placement in its near corner, same basic viewing rail, same binoculars and blank wood wayfinding sign. Remove the entire forest-teal canopy (roof and tall pillars) for this base model: the deck is completely open to the sky, with waist-high timber railings only. Railings do not close off the stairs. Keep the small plot warm, crisp and easily identifiable at 64 pixels wide. Wider 4:3 or square canvas and at least 15 percent of real transparent safety margin on every edge; the complete object including front corner is visible. Transparent holes through the railing. No ground plane, no terrain, no greenery, no additional objects, no characters, no letters or labels, no extra lighting background.

</details>

## 초반 공룡 2.5D 이미지

[승인된 스테고사우루스 조형 시안](../../../../docs/assets/reference/stegosaurus-character-direction.webp)의 둥근 몸체, 표정이 또렷한 얼굴, 큼직한 무늬와 따뜻한 좌상단 빛을 따른다. 아래 네 종의 대기 이미지는 파크 지도와 도감에서 함께 사용한다. 대기 이미지와 파라 걷기는 384×256 투명 WebP이며, 발밑 기준선은 아래에서 28픽셀 위다. 지도에서는 이동 방향에 맞춰 그림을 좌우 반전하고 발밑 그림자를 따로 그린다.

### 파라사우롤로푸스 대기와 걷기

굵고 길게 휘어진 주황색 볏과 올리브색 몸통의 무늬를 대기 자세와 걷기 한 주기에 함께 쓴다. [대기 원본](images/dinosaurs/herbivore/parasaurolophus/idle-source.png)과 [걷기 시트 원본](images/dinosaurs/herbivore/parasaurolophus/walk-sheet-source.png)에서 [게임 대기 이미지](../../public/assets/dinosaurs/parasaurolophus/idle.webp) 및 `walk-01.webp`부터 `walk-06.webp`까지 내보냈다. 지도 기준 그림 폭은 66픽셀이다.

### 스테고케라톱스

굵은 뿔과 붉은 프릴, 주황색 등판을 한 화면에서 구별할 수 있도록 잡았다. [대기 원본](images/dinosaurs/hybrid/stegoceratops/idle-source.png)과 [게임 이미지](../../public/assets/dinosaurs/stegoceratops/idle.webp)를 연결한다. 지도 기준 그림 폭은 86픽셀이다.

### 트리케라톱스

넓고 둥근 프릴과 세 뿔이 기본 배율에서 먼저 보인다. [대기 원본](images/dinosaurs/herbivore/triceratops/idle-source.png)과 [게임 이미지](../../public/assets/dinosaurs/triceratops/idle.webp)를 연결한다. 지도 기준 그림 폭은 78픽셀이다.

### 이구아노돈

앞발의 짧은 엄지 가시와 완만히 올라간 목, 옆구리의 적갈색 줄무늬로 구별한다. [대기 원본](images/dinosaurs/herbivore/iguanodon/idle-source.png)과 [게임 이미지](../../public/assets/dinosaurs/iguanodon/idle.webp)를 연결한다. 지도 기준 그림 폭은 76픽셀이다.

### 사파리의 스테고사우루스와 티라노사우루스

스테고사우루스는 승인 시안의 올리브색 띠와 주황색 골판을 살렸다. 티라노사우루스는 따뜻한 적갈색, 넓은 머리와 굵은 뒷다리로 구별한다. 같은 시안을 참고해 ImageGen으로 대기 자세를 만든 뒤 384×256 투명 WebP로 정리했다. 발밑 기준선과 조명 방향은 초반 공룡과 맞췄다.

| 공룡 | 제작 원본 | 게임 이미지 | 파크 지도 폭 |
| --- | --- | --- | --- |
| 스테고사우루스 | [원본 PNG](images/dinosaurs/herbivore/stegosaurus/idle-source.png) | [대기 WebP](../../public/assets/dinosaurs/stegosaurus/idle.webp) | 96픽셀 |
| 티라노사우루스 | [원본 PNG](images/dinosaurs/carnivore/tyrannosaurus-rex/idle-source.png) | [대기 WebP](../../public/assets/dinosaurs/tyrannosaurus-rex/idle.webp) | 112픽셀 |

### 육식 우리의 차량 출입문

기존 보안센터의 석재와 따뜻한 조명을 기준으로, 콘크리트 기초와 강철 힌지, 황색 경광등을 갖춘 기둥 한 개를 ImageGen으로 제작했다. 좌우 반전해 양쪽에 세운다. 철문과 철망은 지도에서 우리 모양과 접근 방향에 맞춰 조립하고, 공룡의 그림자는 지면에 따로 그린다. [기둥 원본 PNG](images/buildings/habitats/safari-security-pylon/pylon-source.png) · [256×384 투명 게임 이미지](../../public/assets/buildings/safari-security-pylon.webp)

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
- **건물**: `{building_id}.webp`, 외형이 달라지는 단계는 `{building_id}-lv{level}.webp`
- **위인**: `{figure_id}.png` (예: `darwin.png`, `curie.png`)
- **아이콘**: `{name}.png` (예: `gold.png`, `diamond.png`)

## 권장 사양

| 타입            | 크기              | 포맷       |
| --------------- | ----------------- | ---------- |
| 공룡 스프라이트 | 128x128 ~ 256x256 | PNG (투명) |
| 건물            | 타일 크기에 맞춰 내보내기 | WebP (투명) |
| 위인 초상화     | 128x128           | PNG (투명) |
| UI 아이콘       | 32x32 ~ 64x64     | PNG (투명) |
| 타일            | 64x64             | PNG        |
| BGM             | -                 | MP3/OGG    |
| SFX             | -                 | MP3/WAV    |
