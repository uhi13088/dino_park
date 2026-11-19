#!/usr/bin/env python3
"""Generate the reader-facing 58-technology/194-rank effect tables.

The editable specification is research-effects.md, with research-trees.md
owning requirements. This renderer only labels and presents those inputs.
--write updates the derived Markdown; --check (the default) checks equality.
The JSON report is stdout only; no separate report artifact is written.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs/current/research-effect-tables.md"
SOURCES = [
    ROOT / "docs/current/research-effects.md",
    ROOT / "docs/current/dna-and-collection.md",
    ROOT / "docs/current/research-trees.md",
    ROOT / "docs/current/balance.md",
    ROOT / "docs/models/research_effect_model_v06.py",
    ROOT / "docs/models/research_cost_model_v06.py",
    ROOT / "docs/models/check_building_progression_v06.py",
    ROOT / "packages/game-data/src/dinosaurs/index.ts",
    ROOT / "packages/game-data/src/buildings/index.ts",
    Path(__file__).resolve(),
]
FAMILIES = [("ops", "운영"), ("care", "사육"), ("exp", "탐험"), ("gene", "유전")]
MATERIAL_NAMES = {
    "mutation_cell": "변이세포", "stabilizer": "안정제", "catalyst": "합성촉매",
    "culture": "배양액", "dna": "DNA 샘플",
}
PERMISSION_NAMES = {
    "permission:care.group-feeding": "단체 급식 행동",
    "permission:care.group-interaction": "단체 교감 행동",
    "permission:care.environment.desert": "사막 환경 사육 허가",
    "permission:care.environment.volcanic": "화산 환경 사육 허가",
    "permission:care.environment.glacier": "빙하 환경 사육 허가",
    "permission:care.environment.aerial": "익룡 환경 사육 허가",
    "permission:care.environment.marine": "해양 환경 사육 허가",
    "permission:care.giant.terrestrial-herbivore": "육상 초식 거대종 사육 허가",
    "permission:care.giant.terrestrial-carnivore": "육상 육식 거대종 사육 허가",
    "permission:care.giant.aerial-marine-hybrid": "익룡·해양·하이브리드 거대종 사육 허가",
    "permission:care.group-transfer": "집단 이동 행동",
    "permission:care.feeding-plans": "수동 급식 계획 저장",
}


def hashes():
    return {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in SOURCES}


def table(headers, rows):
    def cell(value):
        return str(value).replace("|", r"\|").replace("\n", " ")
    return ["| " + " | ".join(headers) + " |",
            "| " + " | ".join("---" for _ in headers) + " |",
            *["| " + " | ".join(cell(v) for v in row) + " |" for row in rows]]


def unique(items):
    return list(dict.fromkeys(items))


class Labels:
    def __init__(self, model, catalog):
        self.model = model
        dna_text = (ROOT / "docs/current/dna-and-collection.md").read_text()
        self.planned_species = model.marked_table(dna_text, "dna", "planned-species")
        self.planned_recipes = {row["id"]: {**row, "parents": json.loads(row["parents"])}
                                for row in model.marked_table(dna_text, "dna", "followup-recipes")}
        assert len(self.planned_species) == 2 and len(self.planned_recipes) == 9
        self.names = {row["id"]: row["nameKo"] for key in ["species", "buildings"] for row in catalog[key]}
        self.names.update({row["id"]: row["name"] for row in self.planned_species})
        self.names.update({key: row["항목"] for key, row in model.cost.NODES.items()})
        self.names.update(PERMISSION_NAMES)
        for _node, _rank, permission in model.permissions():
            self.names[permission["id"]] = permission["name"]
            if permission.get("kind") == "region_permission":
                self.names[permission["base_region_permission"]] = permission["name"].split(" · ")[0] + " 기본 구역"
        for node_id, levels in model.LEVELS.items():
            for row in levels:
                program = row["contract"].get("contract", {})
                if "program_id" in program:
                    self.names["exhibition:" + program["program_id"]] = program["title"]
                for binding in row["contract"].get("mission_bindings", []):
                    self.names[binding["mission_permission_id"]] = self.names[binding["species_id"]] + " 지정 알 회수 목표"
                for recipe in row["contract"].get("recipe_targets", []):
                    self.names[recipe["recipe_permission_id"]] = self.names[recipe["result_species_id"]] + " 합성 설계"
        # These are display labels for source permission IDs, not new permissions.
        for rows in model.LEVELS.values():
            for row in rows:
                for identifier in row["unlocks"]:
                    if match := re.fullmatch(r"build:(.+):count-(\d+)", identifier):
                        self.names[identifier] = self.names[match[1]] + f" 총{match[2]}개 건설"
                    elif match := re.fullmatch(r"expand:park:(\d+)x(\d+)", identifier):
                        self.names[identifier] = f"부지 {match[1]}×{match[2]} 확장 권한"
                    elif match := re.fullmatch(r"upgrade:major-building:max-(\d+)", identifier):
                        self.names[identifier] = f"주요 시설 Lv.{match[1]} 강화 권한"
                    assert identifier in self.names, (node_id, identifier, "Missing Korean permission name")
        replacements = {**self.names, **MATERIAL_NAMES,
                        "base_quantity": "기본수량", "base": "기본수량",
                        "MAX_GRID_SIZE": "이전 지도 최대 크기", "Currency.gold": "전체 골드 잔액",
                        "lastFedAt": "마지막 급식 시각", "lastInteractedAt": "마지막 교감 시각",
                        "maintenanceRemainder": "유지비 소수 나머지", "GIANT": "거대", "LARGE": "대형",
                        "DinosaurSize.GIANT": "거대 크기 분류", "DinosaurSize.LARGE": "대형 크기 분류",
                        "Rarity.COMMON": "일반 등급", "Rarity.UNCOMMON": "고급 등급",
                        "Rarity.RARE": "희귀 등급", "Rarity.EPIC": "영웅 등급", "Rarity.LEGENDARY": "전설 등급",
                        "research-trees": "연구트리", "engineering-caps": "시설 강화 상한",
                        "dinosaur.service.ts interact": "현재 개별 교감 행동", "shared": "공통",
                        "catalog": "카탈로그", "unlocks": "해금 목록", "new_unlocks": "이번 추가 해금",
                        "parent_species_ids": "기존 실행 부모 매핑", "null": "런타임 매핑 미이관",
                        "planned_recipe_ref": "DNA 정본 참조",
                        "explorationEnergy": "탐험 연료", "long-range": "장거리",
                        "dna-combine": "부모 미기록 DNA 조합", "AND": "모두 충족",
                        "natural": "자연종", "hybrid": "하이브리드", "habitat": "서식지",
                        "desert": "사막", "volcanic": "화산", "glacier": "빙하",
                        "aviary": "익룡 사육장", "sky-dome": "익룡 돔",
                        "aquarium": "수족관", "marine-hall": "해양관", "large-marine": "거대 해양관",
                        "giant-plains": "거대 평원", "trex": "티라노 격리구역",
                        "large-carnivore": "대형 육식구역", "special-isolation": "특수 격리구역"}
        self.replacements = replacements
        # One simultaneous substitution avoids changing words inside Korean names.
        alternatives = "|".join(re.escape(key) for key in sorted(replacements, key=len, reverse=True))
        self.pattern = re.compile(r"(?<![A-Za-z0-9_-])(?:" + alternatives + r")(?![A-Za-z0-9_-])")

    def text(self, value):
        text = str(value)
        for node_id, node in self.model.cost.NODES.items():
            text = re.sub(r"(?<![a-z0-9-])" + re.escape(node_id) + r":(\d+)",
                          lambda match: f"{node['항목']} Lv.{match[1]}", text)
        text = self.pattern.sub(lambda match: self.replacements[match[0]], text)
        text = re.sub(r"\bfloor\(", "내림(", text)
        text = re.sub(r"\bceil\(", "올림(", text)
        return text

    def name(self, identifier):
        assert identifier in self.names, (identifier, "Unknown display name")
        return self.names[identifier]


def requirements(node_id, model, labels):
    parents = model.cost.PARENTS[node_id]
    return "없음" if not parents else " · ".join(f"{labels.name(parent)} Lv.{rank}" for parent, rank in parents)


def level_limits(node_id, row, model, labels):
    parts = [f"연구소 Lv.{model.cost.effective_lab(node_id, row['level'])}"]
    if model.cost.after_hero(node_id, row["level"]):
        parts.append("첫 영웅 이후")
    contract = row["contract"]
    program = contract.get("contract", {})
    if program.get("required_species"):
        parts.append("전시 대상: " + "·".join(labels.name(k) for k in program["required_species"]))
        parts.append(f"동시 {program['maximum_simultaneous_programs']}개 선택")
    missions = [p for p in contract.get("permissions", []) if p["kind"] == "mission_permission"]
    for permission in missions:
        constraints = []
        if regions := permission.get("required_region_permissions"):
            constraints.append("진입: " + "·".join(labels.name(k) for k in regions))
        if permission.get("manual_successful_checks") is not None:
            constraints.append(f"성공 판단 {permission['manual_successful_checks']}구간")
        if permission.get("reward_claims_per_completion") is not None:
            constraints.append(f"성공당 수령 {permission['reward_claims_per_completion']}회")
        parts.append(labels.name(permission["id"]) + ": " + ", ".join(constraints))
    for permission in contract.get("permissions", []):
        if permission["kind"] != "optional_mission_action_permission":
            continue
        if permission.get("correct_answer_reveal") is False:
            parts.append("정답 공개 없음")
        if permission.get("extra_resource_reward") == 0:
            parts.append("추가 재료 보상 없음")
        if permission.get("extra_observations") == 0:
            parts.append("새 단서 생성 없음")
        if permission.get("mutually_exclusive"):
            parts.append("출발 때 모드 하나 선택")
        if permission.get("base_fuel_unchanged"):
            parts.append("기본 연료 유지")
    if contract.get("affected_mission_ids"):
        parts.append(f"지정 장거리 미션 {len(contract['affected_mission_ids'])}개만 적용")
    bindings = contract.get("mission_bindings", [])
    if bindings:
        amounts = {b["first_verified_clear_egg_amount"] for b in bindings}
        assert len(amounts) == 1
        parts.append(f"각 목표 최초 성공 수령: 종 지정 알 {next(iter(amounts))}개 · 수동 부화")
    for recipe in contract.get("recipe_targets", []):
        title = labels.name(recipe["result_species_id"])
        assert recipe["parent_data_scope"] == "runtime snapshot metadata"
        planned = labels.planned_recipes[recipe["planned_recipe_ref"]]
        assert planned["id"] == recipe["result_species_id"]
        parts.append(title + " 기획 부모: " + " + ".join(labels.name(k) for k in planned["parents"]))
        parts.append("부모·비용·시간 계획 완료 · 실제 미션/합성 연결 전 비활성")
    return " / ".join(unique(parts))


def preparation(definition, labels):
    value = definition["availability"]
    if isinstance(value, str):
        return labels.text(value)
    keys = ["runtime_status", "runtime", "content_status", "content", "dependencies", "economy"]
    parts = [labels.text(value[key]) for key in keys if isinstance(value.get(key), str)]
    assert parts, (definition["id"], "Missing human-readable preparation status")
    return " / ".join(unique(parts))


def source_notes(node_id, model, labels):
    """Keep authored plain-language exceptions; never expose JSON contracts."""
    end = f"<!-- /effects:node:{node_id} -->"
    tail = model.TEXT.split(end)[1]
    boundary = re.search(r"\n(?:<a id=|### |## )", tail)
    block = tail[:boundary.start()] if boundary else tail
    if "**세부 계약:**" not in block:
        return []
    notes = [labels.text(line[2:].strip()) for line in block.split("**세부 계약:**", 1)[1].splitlines()
             if line.startswith("- ")]
    # Per-rank lab gates already appear in the table. Their removal here lets
    # otherwise identical authored restrictions appear once per technology.
    notes = [re.sub(r"연구소\s*Lv\.\d+ 및 정본 선행을 따른다\.\s*", "", note) for note in notes]
    stacking = labels.text(model.REGISTRY[node_id]["stacking"])
    return unique([note for note in notes if note != stacking])


def render(model):
    nodes, registry = model.cost.NODES, model.REGISTRY
    assert len(registry) == 58 and set(registry) == set(nodes) - set(model.BASE)
    assert len(model.BASE) == 14
    catalog, provenance = model.catalog_data()
    labels = Labels(model, catalog)
    counts = {family: {"technologies": 0, "levels": 0} for _, family in FAMILIES}
    for node_id in registry:
        rows = model.LEVELS[node_id]
        assert [r["level"] for r in rows] == list(range(1, int(nodes[node_id]["max"]) + 1))
        counts[nodes[node_id]["계열"]]["technologies"] += 1
        counts[nodes[node_id]["계열"]]["levels"] += len(rows)
    assert sum(value["levels"] for value in counts.values()) == 194
    lines = ["# 연구 효과 한눈에 보기 0.6", "",
             "**신규 58개 기술·194개 레벨의 생성표입니다.** [효과 기획 원천](research-effects.md)과 [연구트리](research-trees.md)를 읽어 만들며 별도 수정 원천으로 사용하지 않습니다. 효과값을 바꿀 때는 원천을 수정하고 이 표를 다시 생성합니다.", "",
             "후속 레시피의 부모·재료·비용·시간은 [DNA 정본](dna-and-collection.md)을 읽어 표시합니다. 현재 실행 카탈로그81종과 신규 계획2종을 구분하며, 부모 계획 완료를 실제 합성 실행 가능 상태로 표시하지 않습니다.", "",
             "기존 14개 기술·58개 레벨은 [연구트리 효과표](research-trees.md#5-기본-연구-효과-수치)를 따릅니다. 두 범위를 합하면 72개 기술·252회 연구입니다. 아래 내용은 기획이며 게임에 적용됐다는 뜻이 아닙니다.", "",
             "- 각 행은 해당 완료레벨의 총효과입니다. 이전 레벨의 수치를 더하지 않습니다. ‘이번 레벨 해금’에는 이번에 새로 열린 권한만 적고 이전 권한은 유지합니다.",
             "- 연구소·선행 조건 외에 실제 시설·미션·레시피가 준비돼야 합니다. 후속 콘텐츠가 준비되지 않은 단계는 연구 시작도 활성화하지 않습니다.",
             "- 연구 완료 자체는 재료·알·공룡 지급이 아닙니다. 탐험 성공·수동 수령·부화·실제 합성을 거칩니다. 첫 부화와 첫 지정 합성의 기존 조건은 보존합니다.",
             "- 비용과 연구시간은 [252회 비용표](research-cost-tables.md)를, 정확한 전체 중첩·보존 규칙은 [공통 계산과 상한](research-effects.md#3-공통-계산과-상한)을 따릅니다.", ""]
    lines += table(["계열", "신규 기술", "표시 레벨"],
                   [[family, counts[family]["technologies"], counts[family]["levels"]] for _, family in FAMILIES]
                   + [["합계", 58, 194]])
    rendered = []
    for prefix, family in FAMILIES:
        lines += ["", f"## {family}", ""]
        for node_id, node in nodes.items():
            if node_id not in registry or node_id.split("-")[0] != prefix:
                continue
            definition = registry[node_id]
            lines += [f"### {node['항목']} · 최대 Lv.{node['max']}", "",
                      f"선행: {requirements(node_id, model, labels)} · [상세 원천](research-effects.md#{node_id})", "",
                      "**적용·중첩:** " + labels.text(definition["stacking"]), ""]
            rows = []
            previously_opened = set()
            for row in model.LEVELS[node_id]:
                opened = [key for key in row["unlocks"] if key not in previously_opened]
                previously_opened.update(row["unlocks"])
                if "new_unlocks" in row["contract"]:
                    assert opened == row["contract"]["new_unlocks"], (node_id, row["level"], "new-unlock discrepancy")
                new_names = " · ".join(labels.name(k) for k in opened) or "추가 해금 없음"
                rows.append([f"Lv.{row['level']}", labels.text(row["effect"]), new_names,
                             level_limits(node_id, row, model, labels)])
                rendered.append((node_id, row["level"]))
            lines += [f"<!-- effect-view:{node_id} -->"]
            lines += table(["레벨", "효과", "이번 레벨 해금", "적용·제한"], rows)
            lines += [f"<!-- /effect-view:{node_id} -->", ""]
            for note in source_notes(node_id, model, labels):
                lines += ["**제한:** " + note, ""]
            lines += ["**후속 준비:** " + preparation(definition, labels), ""]
    assert len(rendered) == len(set(rendered)) == 194
    document = "\n".join(lines).rstrip() + "\n"
    detail_rows = 0
    for node_id in registry:
        block = document.split(f"<!-- effect-view:{node_id} -->")[1].split(f"<!-- /effect-view:{node_id} -->")[0]
        detail_rows += sum(line.startswith("| Lv.") for line in block.splitlines())
    assert detail_rows == 194
    assert '"permissions":' not in document and '"contract":' not in document and "| contract |" not in document
    # Every source unlock has a display name and no untranslated material tokens remain.
    for token in MATERIAL_NAMES:
        assert not re.search(r"(?<![A-Za-z0-9_-])" + token + r"(?![A-Za-z0-9_-])", document), token
    document += "\n## 생성·확인\n\n"
    document += "`python3 -B docs/models/render_research_effects_v06.py --write`로 재생성하고 `--check`로 원천 일치와58기술·194레벨 커버를 확인합니다. 실행 결과는 원천 파일의 SHA-256을 함께 출력합니다. 실제 게임 실행·DB 저장·후속 콘텐츠 완성·전체 수급과 재미를 검증하는 도구는 아닙니다.\n"
    return document, {"technologies": len(registry), "levels": len(rendered), "families": counts,
                      "named_catalog_species": len(catalog["species"]), "additional_planned_species": len(labels.planned_species),
                      "named_planned_total_species": len(catalog["species"]) + len(labels.planned_species),
                      "catalog_provenance": provenance}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    flags = parser.add_mutually_exclusive_group()
    flags.add_argument("--write", action="store_true", help="write the derived reader-facing Markdown")
    flags.add_argument("--check", action="store_true", help="check equality against current sources (default)")
    args = parser.parse_args()
    before = hashes()
    import research_effect_model_v06 as model
    document, report = render(model)
    assert hashes() == before, "Sources changed during rendering; rerun using stable inputs"
    if args.write:
        OUTPUT.write_text(document, encoding="utf-8")
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != document:
        raise SystemExit("FAIL: research-effect-tables.md differs from current sources; regenerate with --write")
    report.update({"result": "PASS", "mode": "write" if args.write else "check",
                   "output": str(OUTPUT.relative_to(ROOT)), "source_sha256": before})
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
