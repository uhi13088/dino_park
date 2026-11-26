#!/usr/bin/env python3
"""Render the 0.6 planning research costs; never change canonical inputs.

Without --write, compare the existing derived Markdown with current inputs.
Only the cost library computes prices, lab requirements and duration floors.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs/current/research-cost-tables.md"
INPUTS = [
    ROOT / "docs/current/balance.md",
    ROOT / "docs/current/research-trees.md",
    ROOT / "docs/models/research_cost_model_v06.py",
    ROOT / "docs/models/check_building_progression_v06.py",
    Path(__file__).resolve(),
]
FAMILIES = [("ops", "운영"), ("care", "사육"), ("exp", "탐험"), ("gene", "유전")]
ROLES = {
    "I": "I 입문 권한",
    "F": "F 선택 효율",
    "A": "A 수동 행동·운용",
    "U": "U 콘텐츠 해금",
    "K": "K 주요 성장·최상위 해금",
}
EXAMPLES = [
    ("ops-entry", 1),
    ("ops-land", 1),
    ("ops-engineering", 1),
    ("ops-engineering", 2),
    ("ops-engineering", 3),
    ("care-glacier", 1),
    ("gene-combination-legendary", 1),
    ("gene-combination-legendary", 2),
    ("gene-combination-legendary", 3),
    ("exp-apex-tracking", 3),
]


def fingerprints():
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in INPUTS}


def duration(seconds):
    """Show exact whole durations without suggesting calendar completion dates."""
    remaining = int(seconds)
    parts = []
    for size, unit in [(86400, "일"), (3600, "시간"), (60, "분"), (1, "초")]:
        count, remaining = divmod(remaining, size)
        if count:
            parts.append(f"{count:,}{unit}")
    return " ".join(parts) or "0초"


def floor_text(seconds):
    return duration(seconds) if seconds else "별도 없음"


def role_text(row, nodes):
    if row["role"] == "legacy":
        return f"승계 {nodes[row['id']]['비용군']}"
    return ROLES[row["role"]]


def money_material_cells(row):
    return [f"{row[k]:,}" for k in ["gold", "wood", "stone", "metal"]]


def table(headers, rows):
    return [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
        *["| " + " | ".join(str(cell) for cell in row) + " |" for row in rows],
    ]


def validate(nodes, costs, day):
    assert len(nodes) == 69, "expected 69 technologies"
    assert len(costs) == 239, "expected 239 research operations"
    indexed = {(r["id"], r["level"]): r for r in costs}
    assert len(indexed) == len(costs), "duplicate research stage"
    assert Counter(n["계열"] for n in nodes.values()) == Counter({name: 15 if prefix == "exp" else 18 for prefix, name in FAMILIES})
    for node_id, node in nodes.items():
        maximum = int(node["max"])
        assert maximum in (3, 5)
        assert {r["level"] for r in costs if r["id"] == node_id} == set(range(1, maximum + 1))
        assert len(node["연구소단계"].split(",")) == maximum
    for row in costs:
        assert row["required_lab"] >= row["declared_lab"]
        assert row["required_lab"] in range(1, 26)
        assert row["min_seconds"] in {0, 7 * day, 14 * day, 21 * day, 28 * day}
        assert row["seconds"] >= max(1, row["min_seconds"])
        assert all(isinstance(row[k], int) and row[k] >= 0 for k in ["gold", "wood", "stone", "metal"])
        assert row["role"] == "legacy" or row["role"] in ROLES
    return indexed


def render(model):
    nodes, costs = model.NODES, model.all_costs()
    indexed = validate(nodes, costs, model.DAY)
    lines = [
        "# 기술 연구 자원·시간 상세표 0.6",
        "",
        "상태: **기획 산출표·게임 미적용**. 69개 기술의 Lv.1 최초 연구와 이후 강화를 합한 **239회 연구**를 표시한다.",
        "",
        "[연구트리](research-trees.md)가 항목·최대레벨·선행·연구소 조건을, [밸런스 14~15절](balance.md)이 자원·시간 산식을 소유한다. 이 표는 두 원천과 [계산 라이브러리](../models/research_cost_model_v06.py)에서 생성하며 별도 설정값을 소유하지 않는다.",
        "",
        "## 표를 읽는 방법",
        "",
        "- 목표 Lv.1은 최초 연구, Lv.2 이상은 직전 레벨에서 다음 레벨로 올리는 한 번의 작업이다. 각 행의 자원은 그 작업에서 지불할 양이며 누적 비용이 아니다.",
        "- 골드는 **할인 전 기본 지출**이다. 실제 시작 시 이미 완료한 연구예산 효과를 적용하며 목재·석재·금속은 할인하지 않는다. 사료·합성재료·다이아는 연구 작업 재료로 쓰지 않는다.",
        "- 기본시간에 완공 연구소와 이미 완료한 실험절차의 단축을 적용한 뒤 **최종시간 하한**을 지킨다. 자기 다음 레벨이나 아직 얻지 못한 미래 효과를 미리 적용하지 않는다. 시작한 작업의 완료시각은 고정한다.",
        "- 요구 연구소는 항목 자체 조건과 선행 기술의 조건을 함께 반영한 레벨이다. 항목별 ‘단계별 연구소’는 원천에 선언된 각 목표레벨 조건이다. 선행 기술의 완료레벨과 첫 영웅 이후 조건도 별도로 충족해야 한다.",
        "- 시작 연구원은 무료 1명이다. 다이아로 추가한 연구원은 서로 다른 기술을 병렬 진행하며 한 작업의 시간을 나누지 않는다. 최대레벨은 기술의 기획 상한이며 플레이어의 현재 연구 현황을 뜻하지 않는다.",
        "",
        "첫 입장 수속은 기본 1분·500골드·목재5·석재5를 유지한다. 첫 지정 스테고케라톱스 합성에 기술 연구를 새 필수조건으로 붙이지 않는다. 기본 12개와 상세 57개 기술의 단계별 효과를 정의했으며 [효과 상세](research-effects.md)를 함께 읽는다. 일부 기능은 후속 콘텐츠도 필요하다. 이 표의 가격 설정만으로 해당 기능이 구현되지는 않는다.",
        "",
        "## 계열별 전체 투자량",
        "",
        "모든 기술을 최대레벨까지 연구했을 때의 기본 지출과 연구원 점유시간 합이다. **실제 플레이 완료기간이 아니다.** 시간 할인·연구원 병렬 진행·자원 수급 대기·연구소 공사·스토리 진행은 이 합계에 반영하지 않는다. 모든 자원을 동시에 보유해야 한다는 뜻도 아니다.",
        "",
    ]
    totals = {}
    summary_rows = []
    for prefix, family in FAMILIES:
        selected = [r for r in costs if r["family"] == family]
        total = {k: sum(r[k] for r in selected) for k in ["gold", "wood", "stone", "metal", "seconds"]}
        family_nodes = len({row["id"] for row in selected})
        totals[family] = {"technologies": family_nodes, "operations": len(selected), **total}
        summary_rows.append([family, family_nodes, len(selected), *money_material_cells(total), duration(total["seconds"])])
    grand = {k: sum(r[k] for r in costs) for k in ["gold", "wood", "stone", "metal", "seconds"]}
    summary_rows.append(["전체", len(nodes), len(costs), *money_material_cells(grand), duration(grand["seconds"])])
    lines += table(["계열", "기술 수", "연구 횟수", "기본 골드", "목재", "석재", "금속", "기본 연구원 점유시간 합"], summary_rows)
    floors = Counter(r["min_seconds"] for r in costs)
    lines += ["", "## 최종시간 하한 분포", "", "단축을 모두 적용한 뒤에도 지켜야 하는 하한별 횟수다. ‘별도 없음’도 기본시간에 따른 연구시간은 발생하며 즉시 완료를 뜻하지 않는다. 각 행은 가장 큰 하한 한 곳에만 센다.", ""]
    lines += table(["최종시간 하한", "연구 횟수"], [[floor_text(v), floors[v]] for v in [0, 7 * model.DAY, 14 * model.DAY, 21 * model.DAY, 28 * model.DAY]] + [["합계", len(costs)]])
    lines += ["", "## 주요 연구 예시", "", "모두 해당 단계 한 번의 기본 비용·시간이다. 전설 조합 설계는 Lv.1~2의 최상위 해금과 Lv.3의 선택 효율이 달라 가격과 하한도 달라진다.", ""]
    example_rows = []
    for key in EXAMPLES:
        row = indexed[key]
        example_rows.append([f"{row['name']} Lv.{row['level']}", role_text(row, nodes), f"Lv.{row['required_lab']}", *money_material_cells(row), duration(row["seconds"]), floor_text(row["min_seconds"])])
    lines += table(["연구", "단계 역할", "요구 연구소", "기본 골드", "목재", "석재", "금속", "기본시간", "최종시간 하한"], example_rows)
    rendered_stages = 0
    for prefix, family in FAMILIES:
        lines += ["", f"## {family} {totals[family]['technologies']}개 기술", ""]
        for node_id, node in nodes.items():
            if node_id.split("-")[0] != prefix:
                continue
            own_labs = " / ".join(f"Lv.{v}" for v in node["연구소단계"].split(","))
            parents = "없음" if node["선행"] == "-" else " · ".join(f"`{v}`" for v in node["선행"].split(","))
            hero_ranks = [f"Lv.{rank}" for rank in range(1, int(node["max"]) + 1) if indexed[node_id, rank]["after_hero"]]
            hero = " / ".join(hero_ranks) if hero_ranks else "없음"
            lines += [f"### {node['항목']} · `{node_id}`", "", f"분야: {node['분야']} · 최대 Lv.{node['max']}  ", f"선행: {parents}  ", f"첫 영웅 이후 조건이 있는 목표레벨: {hero}  ", f"목표 Lv.1부터 단계별 연구소: {own_labs}", "", f"<!-- research-costs:node:{node_id} -->"]
            stage_rows = []
            for rank in range(1, int(node["max"]) + 1):
                row = indexed[node_id, rank]
                stage_rows.append([f"Lv.{rank}", role_text(row, nodes), f"Lv.{row['required_lab']}", *money_material_cells(row), duration(row["seconds"]), floor_text(row["min_seconds"])])
                rendered_stages += 1
            lines += table(["목표 레벨", "단계 역할", "요구 연구소", "기본 골드", "목재", "석재", "금속", "기본시간", "최종시간 하한"], stage_rows)
            lines += [f"<!-- /research-costs:node:{node_id} -->", ""]
    assert rendered_stages == len(costs)
    document = "\n".join(lines).rstrip() + "\n"
    # Count only full detail tables, excluding repeated examples and summaries.
    detail_count = 0
    for node_id in nodes:
        block = document.split(f"<!-- research-costs:node:{node_id} -->")[1].split(f"<!-- /research-costs:node:{node_id} -->")[0]
        detail_count += sum(line.startswith("| Lv.") for line in block.splitlines())
    assert detail_count == len(costs)
    document += "\n## 재생성과 검산 범위\n\n"
    document += "`python3 -B docs/models/render_research_costs_v06.py --write`로 재생성하고, `--write` 없이 실행하면 현재 원천으로 계산한 결과와 파일의 일치를 검사한다. 69항목·239개 고유 연구행·계열별 합계·하한별 횟수를 확인한다. 실제 게임 실행, 데이터베이스 저장, 전체 성장기간이나 미션 재미를 검증한 결과는 아니다.\n"
    return document, {"technologies": len(nodes), "research_operations": rendered_stages, "families": totals, "total": grand, "floor_counts_days": {str(v // model.DAY): floors[v] for v in sorted(floors)}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="write the derived Markdown instead of checking it")
    args = parser.parse_args()
    before = fingerprints()
    import research_cost_model_v06 as model
    document, result = render(model)
    assert before == fingerprints(), "source changed while rendering; rerun using stable inputs"
    if args.write:
        OUTPUT.write_text(document, encoding="utf-8")
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != document:
        raise SystemExit("FAIL: research-cost-tables.md differs from current sources; regenerate with --write")
    result.update({"result": "PASS", "mode": "write" if args.write else "check", "output": str(OUTPUT.relative_to(ROOT)), "source_sha256": before})
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
