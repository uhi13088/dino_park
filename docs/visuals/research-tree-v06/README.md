# 연구 스킬트리 이미지 · 기획0.6

[정본 연구트리](../../current/research-trees.md)의 72개 기술과65개 선행선을 그대로 읽어 만든 구조도다. 계열당18개이며72개 카드는병렬분기한기술항목을뜻한다. 카드의최대Lv와연결선의요구선행Lv를구별한다. 시작연구소Lv는자기조건과필요선행연구소조건의최댓값이다. 기술별강화에따른추가연구소조건,스토리/첫영웅/원종조건은정본을따른다.

실제 계정의 완료/잠금 상태나 가격을 표시한 게임 화면이 아니다. 72기술 모든 레벨의 자원·시간·효과를 정의했으며 [신규58개 효과 정본](../../current/research-effects.md)을 함께 읽는다. 실제 후속 콘텐츠 연결은 구현 전이다.

- [전체 PNG](research-tree-overview.png) · [전체 SVG](research-tree-overview.svg)
- [운영 확대](research-tree-ops.png)
- [사육 확대](research-tree-care.png)
- [탐험 확대](research-tree-exp.png)
- [유전 확대](research-tree-gene.png)

프로젝트루트에서 `node docs/models/render_research_tree_v06.cjs`로다시만든다. 기존 Playwright/Chromium으로 한글을 렌더링한다. 원천해시·노드/연결수·경계/문자넘침확인은 [렌더 기록](render-check.json)에있다. PNG/SVG를직접수정해기획의경쟁원천을만들지않는다. 공룡표시는기존파라SVG에셋을재사용했다.
