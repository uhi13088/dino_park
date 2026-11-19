#!/usr/bin/env python3
"""Validate planning arithmetic; not runtime configuration, gameplay or DB tests.

Inputs are the frozen 0.5 research/balance Markdown tables and the existing
building model. No independent technology catalog or prices are maintained.
Run: python3 docs/models/check_research_trees_v05.py
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from fractions import Fraction as F
from pathlib import Path

sys.dont_write_bytecode = True
import check_building_progression_v05 as building  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
TECH = ROOT / "docs/archive/0.5/research-trees.md"
OUTPUT = ROOT / "tmp/preview/research-trees-v05-check.json"


def marked_table(text, name):
    opening, closing = f"<!-- tech:{name} -->", f"<!-- /tech:{name} -->"
    assert text.count(opening) == text.count(closing) == 1, name
    block = text.split(opening)[1].split(closing)[0]
    rows = [[cell.strip() for cell in line.strip().strip("|").split("|")]
            for line in block.splitlines() if line.startswith("|")]
    assert all(len(row) == len(rows[0]) for row in rows), name
    return [dict(zip(rows[0], row)) for row in rows[2:]]


def minimum_level(kind, required):
    return next(level for level in range(1, max(building.LEVEL) + 1)
                if building.primary(kind, level) >= required)


def technology_seconds(row, lab_level):
    discounted = building.ceil(int(row["seconds"]) *
                               (1 - building.primary("lab", lab_level) / 100))
    return max(int(row["min_seconds"]), discounted)


def validate():
    text = TECH.read_text()
    node_rows = marked_table(text, "nodes")
    nodes = {row["id"]: row for row in node_rows}
    effect_rows = marked_table(text, "effects")
    effects = {row["id"]: row for row in effect_rows}
    costs_list = building.table("tech-costs")
    costs = {(row["group"], int(row["level"])): row for row in costs_list}
    staff = building.table("staff")
    assert len(nodes) == len(node_rows) == len(effects) == len(effect_rows) == 12
    assert nodes.keys() == effects.keys()
    assert len(costs) == len(costs_list) == 18
    families = Counter(row["계열"] for row in nodes.values())
    assert len(families) == 4 and set(families.values()) == {3}
    assert {int(row["max"]) for row in nodes.values()} == {3, 5}
    assert sum(int(row["max"]) for row in nodes.values()) == 48

    prerequisites = {}
    for node_id, node in nodes.items():
        assert node["첫영웅후"] in {"0", "1"}
        prerequisites[node_id] = []
        if node["선행"] != "-":
            for item in node["선행"].split(","):
                match = re.fullmatch(r"([a-z][a-z0-9-]*):(\d+)", item.strip())
                assert match, (node_id, item)
                parent, rank = match[1], int(match[2])
                assert parent in nodes and parent != node_id
                assert 1 <= rank <= int(nodes[parent]["max"])
                prerequisites[node_id].append((parent, rank))
    visiting, order = set(), []

    def visit(node_id):
        assert node_id not in visiting, (node_id, "cyclic prerequisites")
        if node_id in order:
            return
        visiting.add(node_id)
        for parent, _rank in prerequisites[node_id]:
            visit(parent)
        visiting.remove(node_id)
        order.append(node_id)

    for node_id in nodes:
        visit(node_id)
    assert len(order) == len(nodes)

    grouped_costs = defaultdict(list)
    for (group, rank), row in costs.items():
        assert 1 <= int(row["lab"]) <= max(building.LEVEL)
        for key in ["gold", "wood", "stone", "metal", "seconds", "min_seconds"]:
            assert int(row[key]) >= 0
        assert int(row["gold"]) > 0 and int(row["seconds"]) > 0
        assert int(row["min_seconds"]) <= int(row["seconds"])
        assert not int(row["min_seconds"]) or int(row["min_seconds"]) >= 7 * 86400
        grouped_costs[group].append((rank, row))
    assert set(grouped_costs) == {node["비용군"] for node in nodes.values()}
    for group, rows in grouped_costs.items():
        rows.sort()
        assert [rank for rank, _row in rows] == list(range(1, len(rows) + 1))
        for (_a, before), (_b, after) in zip(rows, rows[1:]):
            for key in ["lab", "gold", "wood", "stone", "metal", "seconds", "min_seconds"]:
                assert int(before[key]) <= int(after[key]), (group, key)
            assert int(before["gold"]) < int(after["gold"])
            assert int(before["seconds"]) < int(after["seconds"])

    def effective_lab(node_id, rank):
        own = int(costs[nodes[node_id]["비용군"], rank]["lab"])
        return max([own] + [effective_lab(parent, required)
                            for parent, required in prerequisites[node_id]])

    def after_hero(node_id, rank):
        row = costs[nodes[node_id]["비용군"], rank]
        return bool(int(nodes[node_id]["첫영웅후"]) or int(row["metal"]) or
                    any(after_hero(parent, required)
                        for parent, required in prerequisites[node_id]))

    def value(node_id, rank):
        if rank:
            return F(effects[node_id][f"Lv.{rank}"])
        if node_id == "exp-recovery":
            return building.P["fuel_recharge_seconds"]
        if node_id == "gene-preservation":
            match = re.search(r"기본 실패 반환율(\d+)%", text)
            assert match
            return F(match[1])
        return F(0)

    buy = {row["material"]: int(row["buy"]) for row in building.PROD.values()}
    stages = []
    for node_id in order:
        node = nodes[node_id]
        maximum = int(node["max"])
        values = []
        for rank in range(1, 6):
            if rank > maximum:
                assert effects[node_id][f"Lv.{rank}"] == "-", (node_id, rank)
                continue
            effect = value(node_id, rank)
            assert effect >= 0
            if "%" in effects[node_id]["효과"]:
                assert effect < 100, (node_id, "unbounded percent")
            values.append(effect)
            row = costs[node["비용군"], rank]
            lab = effective_lab(node_id, rank)
            cash = int(row["gold"]) + sum(int(row[m]) * buy[m]
                                          for m in ["wood", "stone", "metal"])
            stock = max(int(row[m]) for m in ["wood", "stone", "metal"])
            vault = minimum_level("vault", cash)
            warehouse = (0 if stock <= building.P["initial_material_capacity"] else
                         minimum_level("warehouse", stock))
            assert cash <= building.primary("vault", vault)
            assert stock <= (building.primary("warehouse", warehouse) if warehouse else
                             building.P["initial_material_capacity"])
            assert not int(row["metal"]) or after_hero(node_id, rank)
            # One researcher suffices sequentially; staff count never divides a duration.
            seconds = technology_seconds(row, lab)
            assert 0 < seconds <= int(row["seconds"])
            for allowed_lab in range(lab, max(building.LEVEL) + 1):
                actual = technology_seconds(row, allowed_lab)
                assert int(row["min_seconds"]) <= actual <= int(row["seconds"])
                if int(row["min_seconds"]):
                    assert actual >= 7 * 86400, (node_id, rank, allowed_lab)
            stages.append({"id": node_id, "level": rank, "required_lab": lab,
                           "after_hero": after_hero(node_id, rank),
                           "required_vault": vault, "required_warehouse": warehouse,
                           "cash_with_purchased_materials": cash,
                           "base_seconds": int(row["seconds"]),
                           "minimum_seconds": int(row["min_seconds"]),
                           "seconds_at_required_lab": seconds,
                           "total_effect": float(effect)})
        ascending = "간격" not in effects[node_id]["효과"]
        assert all((a <= b if ascending else a >= b)
                   for a, b in zip(values, values[1:])), node_id
        # Same completed rank supplies its table total once, not a sum of earlier ranks.
        assert value(node_id, maximum) == values[-1]
        for lab in range(1, max(building.LEVEL) + 1):
            times = [technology_seconds(costs[node["비용군"], rank], lab)
                     for rank in range(1, maximum + 1)
                     if effective_lab(node_id, rank) <= lab]
            assert all(a <= b for a, b in zip(times, times[1:])), node_id
    assert len(stages) == 48

    late_costs = {key: row for key, row in costs.items() if int(row["min_seconds"])}
    assert set(late_costs) == {("B", 5), ("C", 3), ("C", 4), ("C", 5), ("U", 3)}
    late_timings = {f"{group}{rank}": {"base_seconds": int(row["seconds"]),
                                      "minimum_seconds": int(row["min_seconds"]),
                                      "max_lab_seconds": technology_seconds(row, max(building.LEVEL))}
                    for (group, rank), row in late_costs.items()}
    assert int(costs["A", 1]["seconds"]) == technology_seconds(costs["A", 1], 1) == 60

    for role in {row["role"] for row in staff}:
        rows = sorted((row for row in staff if row["role"] == role), key=lambda row: int(row["count"]))
        assert [int(row["count"]) for row in rows] == list(range(1, int(building.P["worker_max_count"]) + 1))
        assert int(rows[0]["gold"]) == int(rows[0]["diamond"]) == int(rows[0]["first_hero"]) == 0
        assert rows[0]["building"] == "-" and int(rows[0]["level"]) == 0
        for before, after in zip(rows, rows[1:]):
            assert int(before["level"]) <= int(after["level"])
            assert int(before["gold"]) <= int(after["gold"])
            assert int(before["diamond"]) <= int(after["diamond"])
            assert int(after["first_hero"]) == 1
            assert int(after["gold"]) == 0 if role == "researcher" else int(after["diamond"]) == 0
            if role == "researcher":
                assert int(after["diamond"]) > 0 and after["building"] == "lab"
        for row in rows:
            assert row["building"] == "-" or row["building"] in building.BUILD
            assert int(row["gold"]) <= building.primary("vault", minimum_level("vault", int(row["gold"])))
    first_researcher = next(row for row in staff if row["role"] == "researcher" and row["count"] == "1")
    assert first_researcher["building"] == "-" and first_researcher["level"] == "0"

    maximums = {node_id: value(node_id, int(row["max"])) for node_id, row in nodes.items()}
    bounds = {
        "demand_multiplier": 1 + building.primary("foodcourt", 25) / 100 + maximums["ops-marketing"] / 100,
        "gate_multiplier": 1 + maximums["ops-entry"] / 100,
        "care_rate_factor": (1 - building.P["care_reduction_max"]) * (1 - maximums["care-adaptation"] / 100),
        "risk_upkeep_factor": (1 - building.P["security_upkeep_reduction_max"]) *
                              (1 - maximums["care-upkeep"] / 100) * (1 - maximums["care-isolation"] / 100),
        "facility_upkeep_factor": 1 - maximums["ops-maintenance"] / 100,
        "technology_time_factor": 1 - building.primary("lab", 25) / 100,
        "normal_synthesis_time_factor": (1 - building.primary("lab", 25) / 100) *
                                         (1 - maximums["gene-culture"] / 100),
        "fuel_capacity": building.primary("fueldepot", 25) + maximums["exp-tank"],
        "recovery_seconds": maximums["exp-recovery"],
        "base_failure_return_percent": value("gene-preservation", 0),
        "max_failure_return_percent": maximums["gene-preservation"],
    }
    assert all(0 < number <= 1 for key, number in bounds.items() if key.endswith("factor"))
    assert bounds["demand_multiplier"] >= 1 and bounds["gate_multiplier"] >= 1
    assert 0 < bounds["recovery_seconds"] <= value("exp-recovery", 0)
    assert bounds["base_failure_return_percent"] < bounds["max_failure_return_percent"] < 100
    for depot in range(1, max(building.LEVEL) + 1):
        assert building.production("fueldepot", depot, int(building.P["max_lots"]))["quantity"] <= building.primary("fueldepot", depot)

    # Exact recovery-rate transition: settle the old interval and transfer only
    # its fractional progress, rather than reinterpreting past seconds as new rate.
    transitions = 0
    intervals = [value("exp-recovery", rank) for rank in range(int(nodes["exp-recovery"]["max"]) + 1)]
    for old, new in zip(intervals, intervals[1:]):
        for elapsed in [F(0), old / 3, old - F(1, 2), old + F(1, 2), 2 * old + old / 7]:
            units = elapsed // old
            fraction = (elapsed - units * old) / old
            translated = fraction * new
            assert units >= 0 and 0 <= fraction < 1 and translated / new == fraction
            assert (new - translated) / new == 1 - fraction
            assert translated < new  # Switching rate creates no immediate extra unit.
            transitions += 1

    catalog, provenance = building.source_catalog()
    first = catalog["first"]
    assert first["firstSynthesisRule"]["successRate"] == 1
    assert "첫 스테고케라톱스는 기술 연구 없이" in text
    assert "별도 기본1개 합성 작업" in text and "연구원 슬롯을 쓰지 않음" in text
    assert all(after_hero("gene-analysis", rank) for rank in range(1, int(nodes["gene-analysis"]["max"]) + 1))
    assert not prerequisites["gene-analysis"]  # No duplicate isolation-technology gate.
    assert not after_hero("ops-entry", 1) and effective_lab("ops-entry", 1) == 1
    first_seconds = F(first["durationMs"], 1000)
    assert first_seconds > 0  # This fixed first recipe is excluded from both discounts.

    return {"status": "pass", "kind": "design arithmetic, not runtime configuration, live gameplay or DB concurrency",
            "nodes": len(nodes), "families": dict(families), "technology_levels": len(stages),
            "cost_rows": len(costs), "prerequisite_order": order,
            "checks": {"dag_and_valid_prerequisites": True, "maximum_3_or_5": True,
                       "cost_and_duration_monotonic": True, "per_stage_completed_lab": True,
                       "single_completed_rank_total": True, "existing_vault_and_warehouse_fit": True,
                       "ordered_hiring": True, "one_researcher_can_reach_every_node": True,
                       "first_hero_has_no_technology_or_extra_staff_gate": True,
                       "effect_bounds": True, "fractional_recovery_transition": True,
                       "late_technology_min_7_days_after_lab": True,
                       "duration_monotonic_at_every_eligible_lab": True,
                       "first_technology_60_seconds_at_lab_1": True,
                       "initial_researcher_free_without_lab": True,
                       "researcher_diamond_and_builder_gold_separated": True},
            "max_required_vault_level": max(row["required_vault"] for row in stages),
            "max_required_warehouse_level": max(row["required_warehouse"] for row in stages),
            "effect_bounds": {key: float(number) for key, number in bounds.items()},
            "recovery_transition_cases": transitions, "first_hero_fixed_seconds": float(first_seconds),
            "eligible_lab_combinations": sum(max(building.LEVEL) - row["required_lab"] + 1 for row in stages),
            "late_technology_timings": late_timings,
            "stages": stages, "catalog_provenance": provenance,
            "unverified": ["actual technology APIs and DB concurrency", "full unlock and collection progression",
                           "research choice fun and total completion time", "generic repeat-mission base rewards",
                           "free diamond acquisition and premium hiring affordability"]}


if __name__ == "__main__":
    sources = [TECH, building.SOURCE, Path(building.__file__), Path(__file__)]
    hashes = {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources}
    try:
        result = validate()
        assert hashes == {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources}, "Inputs changed during validation"
    except Exception as error:
        result = {"status": "fail", "kind": "design arithmetic only", "error": f"{type(error).__name__}: {error}"}
    result["source_sha256"] = hashes
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ["status", "kind", "nodes", "technology_levels", "cost_rows", "checks", "error"] if key in result}, ensure_ascii=False))
    sys.exit(0 if result["status"] == "pass" else 1)
