#!/usr/bin/env python3
"""Validate v0.6 costs/times for 239 research actions and 69 defined effects.

Reads canonical Markdown through research_cost_model_v06 and the building model.
All 69 nodes have costs/times and rank effects. Content readiness is separate. This is design arithmetic and
structural reachability, not runtime, gameplay, mission or database testing.
Run: python3 docs/models/check_research_trees_v06.py
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from fractions import Fraction as F
from functools import lru_cache
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
TECH = ROOT / "docs/current/research-trees.md"
BASELINE = ROOT / "docs/archive/0.5/research-trees.md"
OUTPUT = ROOT / "tmp/preview/research-trees-v06-check.json"
FAMILIES = {"ops": "운영", "care": "사육", "exp": "탐험", "gene": "유전"}
RETIRED_TECHNOLOGIES = {"exp-tank", "exp-recovery", "exp-expedition-supply"}
DAY = 86400


def marked_table(text, name):
    opening, closing = f"<!-- tech:{name} -->", f"<!-- /tech:{name} -->"
    assert text.count(opening) == text.count(closing) == 1, (name, "missing/duplicate marker")
    block = text.split(opening)[1].split(closing)[0]
    rows = [[cell.strip() for cell in line.strip().strip("|").split("|")]
            for line in block.splitlines() if line.startswith("|")]
    assert len(rows) >= 3 and len(set(rows[0])) == len(rows[0]), name
    assert all(len(row) == len(rows[0]) for row in rows), (name, "column count")
    return [dict(zip(rows[0], row)) for row in rows[2:]]


def research_depth_metrics(nodes, prerequisites, order):
    """Longest prerequisite chains, excluding labs, stories, time and staffing."""
    node_paths, action_paths = {}, {}
    for node_id in order:
        parents = prerequisites[node_id]
        previous = max((node_paths[parent] for parent, _rank in parents), key=len, default=[])
        node_paths[node_id] = [*previous, node_id]
        for rank in range(1, int(nodes[node_id]["max"]) + 1):
            candidates = [action_paths[parent, required] for parent, required in parents]
            if rank > 1:
                candidates.append(action_paths[node_id, rank - 1])
            previous = max(candidates, key=len, default=[])
            action_paths[node_id, rank] = [*previous, f"{node_id}:{rank}"]
    node_path = max(node_paths.values(), key=len)
    action_path = max(action_paths.values(), key=len)
    return {
        "scope": "Technology prerequisites only; these are longest chains, not total research actions or elapsed time.",
        "node_prerequisites_only": {"max_sequential_nodes": len(node_path), "witness_path": node_path},
        "including_same_node_rank_prerequisites": {
            "max_sequential_research_actions": len(action_path), "witness_path": action_path},
        "excluded": ["laboratory and other building upgrades", "story and first-hero requirements",
                     "research duration, resource gathering and staffing/parallel scheduling"],
    }


def validate():
    import check_building_progression_v06 as building
    import research_cost_model_v06 as cost_model

    text = TECH.read_text()
    baseline_text = BASELINE.read_text()
    baseline_nodes = {row["id"]: row for row in marked_table(baseline_text, "nodes")}
    baseline_effects = {row["id"]: row for row in marked_table(baseline_text, "effects")}
    node_rows = []
    subfields = {}
    for suffix, family in FAMILIES.items():
        rows = marked_table(text, f"nodes-{suffix}")
        assert len(rows) == (15 if suffix == "exp" else 18) and all(row["계열"] == family for row in rows), family
        counts = Counter(row["분야"] for row in rows)
        assert len(counts) == (5 if suffix == "exp" else 6) and set(counts.values()) == {3}, (family, counts)
        subfields[family] = dict(counts)
        node_rows.extend(rows)
    nodes = {row["id"]: row for row in node_rows}
    assert len(nodes) == len(node_rows) == 69
    assert not RETIRED_TECHNOLOGIES.intersection(nodes)
    assert nodes["exp-collection"]["선행"] == "exp-field-mapping:2"
    required_columns = {"id", "계열", "분야", "항목", "max", "비용군", "선행",
                        "연구소단계", "첫영웅후", "구분", "목적", "준비"}
    assert all(required_columns <= row.keys() for row in node_rows)
    assert all(re.fullmatch(r"[a-z][a-z0-9-]*", node_id) for node_id in nodes)
    effects_list = marked_table(text, "effects")
    effects = {row["id"]: row for row in effects_list}
    legacy_ids = set(baseline_nodes) - RETIRED_TECHNOLOGIES
    formula_ids = set(nodes) - legacy_ids
    effect_ids = set(effects)
    structured_effect_ids = set(nodes) - effect_ids
    assert len(legacy_ids) == 10 and len(formula_ids) == 59
    assert len(effects_list) == len(effect_ids) == 12 and len(structured_effect_ids) == 57
    import research_effect_model_v06 as effect_model
    assert set(effect_model.STRUCTURED) == structured_effect_ids
    assert set(effect_model.all_effects()) == set(nodes)
    assert sum(len(v["levels"]) for v in effect_model.STRUCTURED.values()) == 189
    assert effect_ids == legacy_ids | {"gene-study-budget", "gene-study-protocol"}
    assert all(effects[node_id] == baseline_effects[node_id] for node_id in legacy_ids), "Preserved effects changed"
    for node_id in ["gene-study-budget", "gene-study-protocol"]:
        assert [F(effects[node_id][f"Lv.{rank}"]) for rank in range(1, 6)] == [2, 4, 6, 8, 10]
    labs = {}
    prerequisites = {}
    for node_id, row in nodes.items():
        maximum = int(row["max"])
        assert maximum in {3, 5}, node_id
        assert row["첫영웅후"] in {"0", "1"}, node_id
        assert all(row[key] and row[key] != "-" for key in ["분야", "항목", "구분", "목적", "준비"]), node_id
        labs[node_id] = [int(value.strip()) for value in row["연구소단계"].split(",")]
        assert len(labs[node_id]) == maximum, (node_id, "lab rank count")
        assert all(1 <= value <= 25 for value in labs[node_id]), node_id
        assert labs[node_id] == sorted(labs[node_id]), (node_id, "lab ranks decrease")
        prerequisites[node_id] = []
        if row["선행"] != "-":
            for item in row["선행"].split(","):
                match = re.fullmatch(r"([a-z][a-z0-9-]*):(\d+)", item.strip())
                assert match, (node_id, item)
                parent, rank = match[1], int(match[2])
                assert parent in nodes and parent != node_id
                assert 1 <= rank <= int(nodes[parent]["max"]), (node_id, parent, rank)
                prerequisites[node_id].append((parent, rank))
        assert len(prerequisites[node_id]) == len(set(prerequisites[node_id])), node_id
        if node_id in legacy_ids:
            assert row["max"] == baseline_nodes[node_id]["max"]
            assert row["비용군"] == baseline_nodes[node_id]["비용군"]
        else:
            assert row["비용군"] == "N", (node_id, "Missing formula cost group")

    visiting, visited, order = set(), set(), []

    def visit(node_id):
        assert node_id not in visiting, (node_id, "cyclic prerequisites")
        if node_id in visited:
            return
        visiting.add(node_id)
        for parent, _rank in prerequisites[node_id]:
            visit(parent)
        visiting.remove(node_id)
        visited.add(node_id)
        order.append(node_id)

    for node_id in nodes:
        visit(node_id)
    depths = research_depth_metrics(nodes, prerequisites, order)

    @lru_cache(None)
    def ancestors(node_id):
        return frozenset(parent for parent, _rank in prerequisites[node_id]) | frozenset(
            ancestor for parent, _rank in prerequisites[node_id] for ancestor in ancestors(parent))

    costs_list = building.table("tech-costs")
    costs = {(row["group"], int(row["level"])): row for row in costs_list}
    assert len(costs_list) == len(costs) == 18
    grouped = defaultdict(list)
    for (group, rank), row in costs.items():
        assert 1 <= int(row["lab"]) <= 25
        assert all(int(row[key]) >= 0 for key in ["gold", "wood", "stone", "metal", "seconds", "min_seconds"])
        assert int(row["gold"]) > 0 and int(row["seconds"]) > 0
        assert 0 <= int(row["min_seconds"]) <= int(row["seconds"])
        assert not int(row["min_seconds"]) or int(row["min_seconds"]) >= 7 * DAY
        grouped[group].append((rank, row))
    assert set(grouped) == {nodes[node_id]["비용군"] for node_id in legacy_ids} == {"A", "B", "C", "U"}
    for group, rows in grouped.items():
        rows.sort()
        assert [rank for rank, _row in rows] == list(range(1, len(rows) + 1))
        for (_a, before), (_b, after) in zip(rows, rows[1:]):
            for key in ["lab", "gold", "wood", "stone", "metal", "seconds", "min_seconds"]:
                assert int(before[key]) <= int(after[key]), (group, key)
            assert int(before["gold"]) < int(after["gold"])
            assert int(before["seconds"]) < int(after["seconds"])

    @lru_cache(None)
    def effective_lab(node_id, rank):
        return max([labs[node_id][rank - 1]] +
                   [effective_lab(parent, required) for parent, required in prerequisites[node_id]])

    @lru_cache(None)
    def after_hero(node_id, rank):
        metal = (int(costs[nodes[node_id]["비용군"], rank]["metal"])
                 if node_id in legacy_ids else 0)
        return bool(int(nodes[node_id]["첫영웅후"]) or metal or
                    any(after_hero(parent, required) for parent, required in prerequisites[node_id]))

    # Add building-level prerequisites to the technology graph. A technology-only
    # DAG can miss a loop where upgrading the lab requires that same technology.
    engineering = "ops-engineering"
    assert engineering in formula_ids and int(nodes[engineering]["max"]) == 3
    assert labs[engineering] == [5, 10, 20]
    cap_rows = marked_table(text, "engineering-caps")
    cap_steps = [(int(row["rank"]), int(row["lab"]), int(row["cap"])) for row in cap_rows]
    assert cap_steps == [(0, 0, 5), (1, 5, 10), (2, 10, 20), (3, 20, 25)]
    assert [lab for rank, lab, _cap in cap_steps if rank] == labs[engineering]
    graph = {}
    for node_id, row in nodes.items():
        for rank in range(1, int(row["max"]) + 1):
            dependencies = [("lab", labs[node_id][rank - 1])]
            dependencies += [("tech", parent, level) for parent, level in prerequisites[node_id]]
            if rank > 1:
                dependencies.append(("tech", node_id, rank - 1))
            graph["tech", node_id, rank] = dependencies
    for level in range(1, 26):
        dependencies = [("lab", level - 1)] if level > 1 else []
        required = next(rank for rank, _lab, cap in cap_steps if level <= cap)
        if required:
            dependencies.append(("tech", engineering, required))
        graph["lab", level] = dependencies
    active, completed = set(), set()

    def reachable(key):
        assert key not in active, (key, "lab/technology self-lock")
        if key in completed:
            return
        active.add(key)
        for dependency in graph[key]:
            reachable(dependency)
        active.remove(key)
        completed.add(key)

    for key in graph:
        reachable(key)
    assert len(completed) == len(graph)

    def minimum_level(kind, required):
        return next(level for level in range(1, 26) if building.primary(kind, level) >= required)

    def value(node_id, rank):
        if rank:
            return F(effects[node_id][f"Lv.{rank}"])
        if node_id == "gene-preservation":
            match = re.search(r"반환율\s*(\d+)", nodes[node_id]["목적"])
            assert match, "Missing basic failure-return contract"
            return F(match[1])
        return F(0)

    assert cost_model.NODES == nodes and cost_model.LABS == labs and cost_model.PARENTS == prerequisites
    assert cost_model.LEGACY == costs and cost_model.CAPS == cap_steps
    assert set(cost_model.BANDS) == set(range(1, 26))
    assert set(cost_model.ROLES) == {"I", "F", "A", "U", "K"}
    assert set(cost_model.RANKS) == set(range(1, 6))
    assert set(cost_model.FAMILIES) == set(FAMILIES)
    assert set(cost_model.ASSIGN) == formula_ids
    source_table_sizes = {"research-bands": 25, "research-roles": 5, "research-ranks": 5,
                          "research-families": 4, "research-assignment": 59,
                          "research-policy": 8, "research-rounding": 4}
    for table_name, count in source_table_sizes.items():
        source_rows = building.table(table_name)
        assert len(source_rows) == count and len({tuple(row.values()) for row in source_rows}) == count
    for table_name, column, numeric, library in [
        ("research-bands", "lab", True, cost_model.BANDS),
        ("research-roles", "id", False, cost_model.ROLES),
        ("research-ranks", "rank", True, cost_model.RANKS),
        ("research-families", "id", False, cost_model.FAMILIES),
    ]:
        rows = building.table(table_name)
        parsed = {(int(row[column]) if numeric else row[column]): row for row in rows}
        assert parsed == library and len(parsed) == len(rows), table_name
    policy = {row["id"]: int(row["value"]) for row in building.table("research-policy")}
    rounding = sorted((int(row["from_seconds"]), int(row["quantum"]))
                      for row in building.table("research-rounding"))
    assert policy == cost_model.POLICY and rounding == cost_model.ROUNDING
    assert all(value > 0 for value in policy.values())
    assert rounding[0][0] == 0 and len({start for start, _q in rounding}) == len(rounding)
    assert all(start >= 0 and quantum > 0 for start, quantum in rounding)
    assert policy["new_final_min_seconds"] == 7 * DAY and policy["max_base_seconds"] == 28 * DAY
    assert policy["ultra_lab"] == 25 and policy["legacy_ultra_min_seconds"] == 14 * DAY
    for lab, band in cost_model.BANDS.items():
        expected_floor = 7 * DAY if 15 <= lab < 20 else 14 * DAY if 20 <= lab < 25 else 0
        assert int(band["min_seconds"]) == expected_floor, (lab, "Band time floor")
    for node_id in formula_ids:
        assert len(cost_model.ASSIGN[node_id]) == int(nodes[node_id]["max"])
        assert set(cost_model.ASSIGN[node_id]) <= cost_model.ROLES.keys()
    for table in [cost_model.ROLES, cost_model.RANKS, cost_model.FAMILIES]:
        for row in table.values():
            assert all(F(value) > 0 for key, value in row.items() if key.endswith("factor"))

    buy = {row["material"]: int(row["buy"]) for row in building.PROD.values()}
    stages = cost_model.all_costs()
    stage_map = {(row["id"], row["level"]): row for row in stages}
    assert len(stages) == len(stage_map) == sum(int(row["max"]) for row in nodes.values()) == 239
    role_changes = []
    for node_id in order:
        node = nodes[node_id]
        maximum = int(node["max"])
        for rank in range(1, maximum + 1):
            row = stage_map[node_id, rank]
            assert row == cost_model.base_cost(node_id, rank)
            assert all(isinstance(row[key], int) and row[key] >= 0
                       for key in ["gold", "wood", "stone", "metal", "seconds", "min_seconds", "required_lab"])
            assert row["required_lab"] == effective_lab(node_id, rank) == cost_model.effective_lab(node_id, rank)
            assert row["declared_lab"] == labs[node_id][rank - 1]
            assert row["after_hero"] == after_hero(node_id, rank)
            assert not row["metal"] or row["after_hero"], (node_id, rank, "Metal before first hero")
            assert row["name"] == node["항목"] and row["family"] == node["계열"]
            lab = row["required_lab"]
            if node_id in legacy_ids:
                original = costs[node["비용군"], rank]
                assert labs[node_id][rank - 1] == int(original["lab"])
                assert all(row[m] == int(original[m]) for m in ["gold", "wood", "stone", "metal"])
                assert row["role"] == "legacy"
                floor = int(original["min_seconds"])
                raw_seconds = int(original["seconds"])
            else:
                band = cost_model.BANDS[lab]
                factor = cost_model.RANKS[rank]
                role = cost_model.ASSIGN[node_id][rank - 1]
                importance = cost_model.ROLES[role]
                family = cost_model.FAMILIES[node_id.split("-")[0]]
                assert row["role"] == role
                assert row["gold"] == building.ceil(F(band["gold"]) * F(factor["gold_factor"]) * F(importance["gold_factor"]), policy["gold_quantum"])
                for material in ["wood", "stone", "metal"]:
                    assert row[material] == building.ceil(F(band[material]) * F(factor["material_factor"]) *
                        F(importance["material_factor"]) * F(family[material + "_factor"]), policy["material_quantum"])
                raw = F(band["seconds"]) * F(factor["time_factor"]) * F(importance["time_factor"])
                quantum = [quantum for start, quantum in rounding if start <= raw][-1]
                raw_seconds = min(policy["max_base_seconds"], building.ceil(raw, quantum))
                floor = policy["new_final_min_seconds"] if rank == maximum and after_hero(node_id, rank) else 0
            floor = max(floor, int(cost_model.BANDS[lab]["min_seconds"]))
            if lab >= policy["ultra_lab"]:
                ultra = (policy["legacy_ultra_min_seconds"] if row["role"] == "legacy" else
                         int(cost_model.ROLES[row["role"]]["ultra_min_days"]) * DAY)
                floor = max(floor, ultra)
            assert row["min_seconds"] == floor
            assert row["seconds"] == max(raw_seconds, floor)
            assert 0 < row["seconds"] <= policy["max_base_seconds"] and row["min_seconds"] <= row["seconds"]
            if rank > 1:
                before = stage_map[node_id, rank - 1]
                decreased = [key for key in ["gold", "wood", "stone", "metal", "seconds", "min_seconds"]
                             if row[key] < before[key]]
                if row["role"] == before["role"]:
                    assert not decreased, (node_id, rank, "Same-role base decrease", decreased)
                else:
                    if decreased:
                        assert (before["role"], row["role"]) in {("U", "F"), ("K", "F")}
                    role_changes.append({"id": node_id, "level": rank, "from": before["role"],
                                         "to": row["role"], "decreased_fields": decreased})
        if node_id in effect_ids:
            values = [value(node_id, rank) for rank in range(1, maximum + 1)]
            assert all(v >= 0 for v in values)
            if "%" in effects[node_id]["효과"]:
                assert all(v < 100 for v in values)
            for rank in range(maximum + 1, 6):
                assert effects[node_id][f"Lv.{rank}"] == "-"
            ascending = "간격" not in effects[node_id]["효과"]
            assert all(a <= b if ascending else a >= b for a, b in zip(values, values[1:])), node_id

    @lru_cache(None)
    def closure(event):
        return frozenset([event]) | frozenset(item for parent in graph[event] for item in closure(parent))

    def snapshot_expected(node_id, rank, lab, budget, protocol):
        if node_id == "gene-study-budget" and budget != rank - 1:
            return False
        if node_id == "gene-study-protocol" and protocol != rank - 1:
            return False
        target = ("tech", node_id, rank)
        seeds = [("lab", lab), *graph[target]]
        if budget:
            seeds.append(("tech", "gene-study-budget", budget))
        if protocol:
            seeds.append(("tech", "gene-study-protocol", protocol))
        done = frozenset(event for seed in seeds for event in closure(seed))
        return target not in done and all(
            event[1] <= lab if event[0] == "lab" else
            event[2] <= budget if event[1] == "gene-study-budget" else
            event[2] <= protocol if event[1] == "gene-study-protocol" else True
            for event in done)

    valid_actual = {}
    combinations = rejected = 0
    for (node_id, rank), row in stage_map.items():
        for lab in range(row["required_lab"], 26):
            for budget in range(6):
                for protocol in range(6):
                    expected = snapshot_expected(node_id, rank, lab, budget, protocol)
                    assert cost_model.snapshot_is_feasible(node_id, rank, lab, budget, protocol) == expected, (
                        node_id, rank, lab, budget, protocol, "Snapshot closure disagrees")
                    if not expected:
                        try:
                            cost_model.actual_cost(node_id, rank, lab, budget, protocol)
                        except AssertionError:
                            rejected += 1
                        else:
                            raise AssertionError((node_id, rank, lab, budget, protocol, "Future discount accepted"))
                        continue
                    actual = cost_model.actual_cost(node_id, rank, lab, budget, protocol)
                    assert actual["gold"] == building.ceil(row["gold"] * (1 - value("gene-study-budget", budget) / 100), policy["actual_gold_quantum"])
                    time = max(row["min_seconds"], building.ceil(row["seconds"] *
                        (1 - building.primary("lab", lab) / 100) * (1 - value("gene-study-protocol", protocol) / 100), policy["actual_time_quantum"]))
                    assert actual["seconds"] == time
                    assert 0 < actual["seconds"] <= row["seconds"] and 0 < actual["gold"] <= row["gold"]
                    assert all(actual[key] == row[key] for key in row if key not in {"gold", "seconds"})
                    valid_actual[node_id, rank, lab, budget, protocol] = (actual["gold"], actual["seconds"])
                    combinations += 1
    for node_id, node in nodes.items():
        for rank in range(2, int(node["max"]) + 1):
            before, after = stage_map[node_id, rank - 1], stage_map[node_id, rank]
            if before["role"] != after["role"]:
                continue
            for lab in range(max(before["required_lab"], after["required_lab"]), 26):
                for budget in ([0] if node_id == "gene-study-budget" else range(6)):
                    for protocol in ([0] if node_id == "gene-study-protocol" else range(6)):
                        old_budget, new_budget = (rank - 2, rank - 1) if node_id == "gene-study-budget" else (budget, budget)
                        old_protocol, new_protocol = (rank - 2, rank - 1) if node_id == "gene-study-protocol" else (protocol, protocol)
                        a = valid_actual.get((node_id, rank - 1, lab, old_budget, old_protocol))
                        b = valid_actual.get((node_id, rank, lab, new_budget, new_protocol))
                        if a is not None and b is not None:
                            assert all(x <= y for x, y in zip(a, b)), (node_id, rank, lab, "Same-role actual decrease")
    first_cost = cost_model.actual_cost("ops-entry", 1, 1, 0, 0)
    assert {key: first_cost[key] for key in ["gold", "wood", "stone", "metal", "seconds"]} == {
        "gold": 500, "wood": 5, "stone": 5, "metal": 0, "seconds": 60}
    rejection_examples = [("gene-study-budget", 1, 10, 0, 1),
                          ("gene-study-budget", 2, 12, 1, 1),
                          ("ops-engineering", 1, 5, 1, 0),
                          ("ops-engineering", 3, 20, 0, 5),
                          ("gene-study-protocol", 1, 15, 0, 0),
                          ("ops-entry", 1, 25, 0, 0)]
    for example in rejection_examples:
        assert not cost_model.snapshot_is_feasible(*example), example

    # Capacity closure is deliberately conservative: ignore every storage/gold
    # efficiency and every research discount, even after they could be earned.
    # Resources may be replenished between actions; this is not a cash-flow or
    # play-time simulation. A proof step uses only capacities already reached.
    level_state = {"vault": 1, "warehouse": 0, "lab": 0}
    learned = {node_id: 0 for node_id in nodes}
    certificate = []
    engineering_guards = []
    while True:
        progress = False
        cap = cap_steps[learned[engineering]][2]
        def prepare(row):
            bank = building.primary("vault", level_state["vault"])
            store = (building.primary("warehouse", level_state["warehouse"])
                     if level_state["warehouse"] else building.P["initial_material_capacity"])
            purchase_bill = row["gold"] + sum(row[m] * buy[m] for m in ["wood", "stone", "metal"])
            fits = row["gold"] <= bank and max(row[m] for m in ["wood", "stone", "metal"]) <= store
            return fits and purchase_bill <= bank, bank, int(store), purchase_bill
        for kind in ["vault", "warehouse", "lab"]:
            target = level_state[kind] + 1
            if target > cap:
                continue
            fee = building.upgrade(kind, target)
            fits, bank, store, purchase_bill = prepare(fee)
            if fits:
                certificate.append({"kind": "building", "id": kind, "level": target,
                    "before": dict(level_state), "facility_cap_before": cap,
                    "gold_capacity_before": bank, "material_capacity_before": store,
                    "fee": {m: fee[m] for m in ["gold", "wood", "stone", "metal"]},
                    "gold_with_all_materials_purchased": purchase_bill})
                level_state[kind] = target
                progress = True
        for node_id in order:
            target = learned[node_id] + 1
            if target > int(nodes[node_id]["max"]):
                continue
            if any(learned[parent] < rank for parent, rank in prerequisites[node_id]):
                continue
            fee = stage_map[node_id, target]
            if fee["required_lab"] > level_state["lab"]:
                continue
            fits, bank, store, purchase_bill = prepare(fee)
            if fits:
                record = {"kind": "research", "id": node_id, "level": target,
                    "before": dict(level_state), "facility_cap_before": cap,
                    "gold_capacity_before": bank, "material_capacity_before": store,
                    "fee": {m: fee[m] for m in ["gold", "wood", "stone", "metal"]},
                    "gold_with_all_materials_purchased": purchase_bill}
                certificate.append(record)
                if node_id == engineering:
                    assert cap == cap_steps[target - 1][2]
                    assert all(level <= cap for level in level_state.values())
                    engineering_guards.append(record)
                learned[node_id] = target
                cap = cap_steps[learned[engineering]][2]
                progress = True
        if not progress:
            break
    assert level_state == {"vault": 25, "warehouse": 25, "lab": 25}, ("Capacity closure stuck", level_state)
    assert all(learned[node_id] == int(node["max"]) for node_id, node in nodes.items()), (
        "Research capacity closure stuck", {node_id: level for node_id, level in learned.items()
                                           if level < int(nodes[node_id]["max"])})
    assert len(certificate) == 239 + 74 and len(engineering_guards) == 3

    staff = building.table("staff")
    assert {row["role"] for row in staff} == {"builder", "researcher"}
    for role in ["builder", "researcher"]:
        rows = sorted((row for row in staff if row["role"] == role), key=lambda row: int(row["count"]))
        assert [int(row["count"]) for row in rows] == list(range(1, int(building.P["worker_max_count"]) + 1))
        assert rows[0]["building"] == "-" and int(rows[0]["level"]) == 0
        assert int(rows[0]["gold"]) == int(rows[0]["diamond"]) == int(rows[0]["first_hero"]) == 0
        for before, after in zip(rows, rows[1:]):
            assert all(int(before[k]) <= int(after[k]) for k in ["level", "gold", "diamond"])
            assert int(after["first_hero"]) == 1
            if role == "researcher":
                assert int(after["gold"]) == 0 and int(after["diamond"]) > 0 and after["building"] == "lab"
            else:
                assert int(after["diamond"]) == 0
        for row in rows:
            assert row["building"] == "-" or row["building"] in building.BUILD
            assert int(row["gold"]) <= building.primary("vault", minimum_level("vault", int(row["gold"])))

    maxima = {node_id: value(node_id, int(nodes[node_id]["max"])) for node_id in effect_ids}
    bounds = {
        "demand_multiplier": 1 + building.primary("foodcourt", 25) / 100 + maxima["ops-marketing"] / 100,
        "gate_multiplier": 1 + maxima["ops-entry"] / 100,
        "care_rate_factor": (1 - building.P["care_reduction_max"]) * (1 - maxima["care-adaptation"] / 100),
        "risk_upkeep_factor": (1 - building.P["security_upkeep_reduction_max"]) * (1 - maxima["care-upkeep"] / 100) * (1 - maxima["care-isolation"] / 100),
        "facility_upkeep_factor": 1 - maxima["ops-maintenance"] / 100,
        "normal_synthesis_time_factor": (1 - building.primary("lab", 25) / 100) * (1 - maxima["gene-culture"] / 100),
        "base_failure_return_percent": value("gene-preservation", 0),
        "max_failure_return_percent": maxima["gene-preservation"],
    }
    assert all(0 < number <= 1 for key, number in bounds.items() if key.endswith("factor"))
    assert bounds["demand_multiplier"] >= 1 and bounds["gate_multiplier"] >= 1
    assert bounds["base_failure_return_percent"] < bounds["max_failure_return_percent"] < 100
    catalog, provenance = building.source_catalog()
    first = catalog["first"]
    assert first["firstSynthesisRule"]["successRate"] == 1
    assert "기술 연구 없이" in text and "연구원 슬롯과 공유하지 않음" in text
    assert "care-isolation" not in ancestors("gene-analysis"), "Optional isolation research became a recipe gate"
    assert all(after_hero("gene-analysis", rank) for rank in range(1, int(nodes["gene-analysis"]["max"]) + 1))
    assert not after_hero("ops-entry", 1) and effective_lab("ops-entry", 1) == 1
    assert F(first["durationMs"], 1000) == 30 * 60, "First guaranteed synthesis time changed"
    preparation = Counter(row["준비"] for row in nodes.values())
    followup_content = {word: sum("후속" in row["준비"] and word in row["준비"]
                                  for row in nodes.values()) for word in ["시설", "미션", "레시피"]}
    defined_rows = [{"id": node_id, "max": int(nodes[node_id]["max"]),
                     "lab_by_level": labs[node_id], "preparation": nodes[node_id]["준비"],
                     "effect_status": "specified_in_research_effects", "cost_status": "specified", "duration_status": "specified"}
                    for node_id in order if node_id in structured_effect_ids]
    total_actions = sum(int(row["max"]) for row in nodes.values())
    initial_actions = len(nodes)
    subsequent_actions = sum(int(row["max"]) - 1 for row in nodes.values())
    assert initial_actions + subsequent_actions == total_actions
    effect_actions = sum(int(nodes[node_id]["max"]) for node_id in effect_ids)
    totals = {key: sum(row[key] for row in stages) for key in ["gold", "wood", "stone", "metal", "seconds", "min_seconds"]}
    return {
        "status": "pass", "kind": "design cost/time arithmetic and conditional capacity reachability only",
        "nodes": len(nodes), "families": dict(Counter(row["계열"] for row in nodes.values())),
        "node_count": len(nodes), "subfields": subfields, "technology_levels": total_actions,
        "total_research_actions": total_actions,
        "count_semantics": {
            "unit": "One research action completing one rank of one technology; rank 1 is its initial research.",
            "total_research_actions": "Sum of maximum ranks of distinct technology nodes, not a linear progression or completion-day estimate.",
            "initial_research_actions": initial_actions, "subsequent_rank_research_actions": subsequent_actions,
            "legacy_technology_levels_field": "Alias of total_research_actions, not prerequisite depth.",
            "parallelism": "Researchers allow different technologies in parallel; one technology's ranks remain sequential.",
            "planning_scope": "All costs/times and all 69 rank effects are specified; follow-up content and runtime remain separate.",
        },
        "depth_metrics": depths,
        "costed_nodes": len(nodes), "costed_research_actions": len(stages),
        "legacy_cost_nodes": len(legacy_ids), "legacy_cost_research_actions": sum(int(nodes[node_id]["max"]) for node_id in legacy_ids),
        "formula_cost_nodes": len(formula_ids), "formula_cost_research_actions": sum(int(nodes[node_id]["max"]) for node_id in formula_ids),
        "numeric_effect_nodes": len(effect_ids), "numeric_effect_research_actions": effect_actions,
        "structured_effect_nodes": len(structured_effect_ids), "structured_effect_research_actions": total_actions - effect_actions,
        "defined_effect_nodes": len(nodes), "defined_effect_research_actions": total_actions, "pending_effect_nodes": 0,
        "legacy_cost_rows": len(costs), "coefficient_table_rows": source_table_sizes,
        "checks": {"four_families_with_15_expedition_and_18_each_other": True, "three_nodes_per_active_subfield": True,
                   "dag_and_valid_prerequisites": True, "maximum_3_or_5": True,
                   "monotonic_lab_ranks_1_to_25": True, "preserved_10_numeric_effects": True,
                   "two_research_discount_effects_2_to_10_percent": True,
                   "all_239_cost_rows_match_canonical_coefficients": True,
                   "same_role_base_and_common_snapshot_monotonicity": True,
                   "unlock_to_efficiency_role_changes_reported": True,
                   "all_completed_discount_snapshots_match_independent_closure": True,
                   "all_valid_lab_discount_combinations_respect_final_floors": True,
                   "all_invalid_snapshots_rejected_by_actual_cost": True,
                   "discounts_leave_materials_unchanged": True,
                   "capacity_closure_without_storage_efficiency_or_discounts": True,
                   "engineering_uses_previous_5_10_20_facility_caps": True,
                   "engineering_lab_caps_structurally_no_self_lock": True,
                   "first_technology_500_gold_60_seconds_at_lab_1": True,
                   "initial_researcher_free_without_lab": True,
                   "researcher_diamond_builder_gold_separated": True,
                   "first_hero_technology_exemption_documented": True,
                   "existing_effect_bounds": True,
                   "all_69_effects_defined_in_canonical_sources": True},
        "engineering_caps": [{"rank": rank, "lab": lab, "cap": cap} for rank, lab, cap in cap_steps],
        "reachability_scope": "Conditional resource-capacity closure with baseline buy/income routes able to replenish between actions and first-hero/story, park-level/building-unlock and available-building-site prerequisites supplied externally. No storage/gold efficiency or research discount is needed. This is not cash-flow, elapsed play time or implemented content verification.",
        "capacity_closure": {"building_levels": level_state, "research_actions": sum(learned.values()),
                             "certificate_actions": len(certificate), "engineering_guards": engineering_guards,
                             "convenience_guard": "Gold plus buying all construction materials fits the preceding wallet; this stronger preparation guard is not an API purchase restriction.",
                             "certificate": certificate},
        "discount_snapshot_scope": "New monotonic progression only; excludes grandfathered legacy unlocks. Completion levels are exact owned ranks, not hypothetical future discounts.",
        "valid_discount_combinations": combinations, "rejected_discount_combinations": rejected,
        "future_discount_rejection_examples": [list(example) for example in rejection_examples],
        "dependency_graph_vertices": len(graph), "prerequisite_order": order,
        "preparation_counts": dict(preparation), "followup_content_counts": followup_content,
        "preparation_count_note": "Literal source preparation labels, not implemented-content counts.",
        "role_changes": role_changes,
        "base_cost_totals": totals,
        "totals_scope": "Undiscounted research investment and base researcher-occupancy seconds summed over all 239 actions; excludes building work, resource waits, story and staffing schedules.",
        "max_gold_per_research": max(row["gold"] for row in stages),
        "max_material_per_research": max(row[m] for row in stages for m in ["wood", "stone", "metal"]),
        "minimum_days_distribution": dict(sorted(Counter(row["min_seconds"] // DAY for row in stages).items())),
        "existing_effect_bounds": {key: float(number) for key, number in bounds.items()},
        "first_hero_fixed_seconds": float(F(first["durationMs"], 1000)),
        "research_costs": stages, "structured_effects": defined_rows, "catalog_provenance": provenance,
        "unverified": ["follow-up content implementation and measured effect balance",
                       "follow-up facilities, regions, mission controls, species and recipes",
                       "mission and research-choice fun, full collection and sustainable resource supply",
                       "actual clear time, complete account cash flow and late-game economic balance",
                       "free diamond income and premium researcher affordability",
                       "runtime technology APIs, legacy permission migration and DB concurrency"],
    }


def main():
    sources = [TECH, BASELINE, ROOT / "docs/current/balance.md",
               ROOT / "docs/models/check_building_progression_v06.py",
               ROOT / "docs/models/research_cost_model_v06.py", ROOT / "docs/current/research-effects.md",
               ROOT / "docs/models/research_effect_model_v06.py", Path(__file__)]
    hashes = {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources}
    try:
        result = validate()
        assert hashes == {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources}, "Inputs changed during validation"
    except Exception as error:
        result = {"status": "fail", "kind": "partial design arithmetic only", "error": f"{type(error).__name__}: {error}"}
    result["source_sha256"] = hashes
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    keys = ["status", "kind", "node_count", "total_research_actions", "costed_research_actions",
            "numeric_effect_nodes", "pending_effect_nodes", "valid_discount_combinations",
            "rejected_discount_combinations", "max_gold_per_research", "max_material_per_research", "checks", "error"]
    print(json.dumps({key: result[key] for key in keys if key in result}, ensure_ascii=False))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
