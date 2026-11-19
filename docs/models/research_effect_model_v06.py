"""Read the v0.6 effect specification and perform planning arithmetic.

Markdown remains the source of truth. This helper neither configures the game
nor implements missions, account state, rewards, migrations, or concurrency.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from fractions import Fraction as F
from functools import lru_cache
from pathlib import Path

sys.dont_write_bytecode = True
import research_cost_model_v06 as cost

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/current/research-effects.md"
TEXT = SOURCE.read_text()
building = cost.building


def marked_table(text, namespace, name):
    opening, closing = f"<!-- {namespace}:{name} -->", f"<!-- /{namespace}:{name} -->"
    assert text.count(opening) == text.count(closing) == 1, (namespace, name, "marker count")
    block = text.split(opening)[1].split(closing)[0]
    lines = [line for line in block.splitlines() if line.startswith("|")]
    cells = [[cell.strip().replace(r"\|", "|") for cell in re.split(r"(?<!\\)\|", line.strip().strip("|"))]
             for line in lines]
    assert len(cells) >= 3 and len(cells[0]) == len(set(cells[0])), name
    assert all(len(row) == len(cells[0]) for row in cells), (name, "column count")
    assert all(re.fullmatch(r":?-+:?", cell) for cell in cells[1]), name
    return [dict(zip(cells[0], row)) for row in cells[2:]]


def json_cell(text):
    return json.loads(text, parse_float=F)


REGISTRY_ROWS = marked_table(TEXT, "effects", "registry")
REGISTRY = {row["id"]: {**row, "stacking": json_cell(row["stacking"]),
                         "availability": json_cell(row["availability"])} for row in REGISTRY_ROWS}
LEVELS = {}
for node_id in REGISTRY:
    LEVELS[node_id] = []
    for raw in marked_table(TEXT, "effects", "node:" + node_id):
        LEVELS[node_id].append({**raw, "level": int(raw["level"]), "value": json_cell(raw["value"]),
                               "unlocks": json_cell(raw["unlocks"]), "contract": json_cell(raw["contract"])})
BASE_ROWS = marked_table(cost.TEXT, "tech", "effects")
BASE = {row["id"]: row for row in BASE_ROWS}
STRUCTURED = {node_id: {**definition, "levels": LEVELS[node_id]} for node_id, definition in REGISTRY.items()}


def all_effects():
    """Return all 72 definitions, retaining each structured rank's original unit."""
    scalar = {node_id: {"id": node_id, "kind": "preserved_scalar", "source_type": "tech:effects",
                       "levels": [{"level": rank, "value": F(row[f"Lv.{rank}"]),
                                   "unit": row["효과"], "effect": row["효과"], "unlocks": [], "contract": {}}
                                  for rank in range(1, int(cost.NODES[node_id]["max"]) + 1)]}
              for node_id, row in BASE.items()}
    return {**scalar, **STRUCTURED}


def level(node_id, rank):
    assert node_id in LEVELS and 1 <= rank <= len(LEVELS[node_id]), (node_id, rank)
    row = LEVELS[node_id][rank - 1]
    assert row["level"] == rank
    return row


def value(node_id, rank, default=0):
    assert node_id in cost.NODES and 0 <= rank <= int(cost.NODES[node_id]["max"]), (node_id, rank)
    if not rank:
        return F(default)
    return F(level(node_id, rank)["value"] if node_id in LEVELS else BASE[node_id][f"Lv.{rank}"])


def ratio(node_id, rank):
    unit = BASE[node_id]["효과"] if node_id in BASE else level(node_id, max(1, rank))["unit"]
    assert "%" in unit, (node_id, rank, "permission/count/seconds is not a percentage")
    return value(node_id, rank) / 100


def permissions():
    """Return permission definitions with their unique declaring technology rank."""
    return [(node_id, row["level"], permission)
            for node_id, rows in LEVELS.items() for row in rows
            for permission in row["contract"].get("permissions", [])]


@lru_cache(None)
def catalog_data():
    catalog, provenance = building.source_catalog()
    script = ("const g=require('./packages/game-data/dist/index.js');"
              "const s=require('./packages/shared/dist/index.js');"
              "process.stdout.write(JSON.stringify({recipes:g.SYNTHESIS_RECIPES,rules:g.SYNTHESIS_RULES,"
              "materials:s.ResearchMaterial,qualities:s.MaterialQuality,initialGrid:s.INITIAL_GRID_SIZE}));")
    extra = json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True))
    return {**catalog, **extra}, provenance


def vault_capacity(vault_level, finance_rank=0):
    return int(building.primary("vault", vault_level) * (1 + ratio("ops-finance", finance_rank)))


def material_capacity(warehouse_level, storage_rank=0):
    if warehouse_level == 0:
        return int(building.P["initial_material_capacity"])
    return int(building.primary("warehouse", warehouse_level) * (1 + ratio("ops-storage", storage_rank)))


def batch_lots(batch_rank=0, *, fuel=False):
    return int(building.P["max_lots"] if fuel else value("ops-batch", batch_rank, building.P["max_lots"]))


def production(building_id, building_level, lots, processing_rank=0, batch_rank=0):
    fuel = building_id == "fueldepot"
    assert 1 <= lots <= batch_lots(batch_rank, fuel=fuel)
    result = dict(building.production(building_id, building_level, lots))
    if not fuel:
        result["seconds"] = building.ceil(result["seconds"] * (1 - ratio("ops-processing", processing_rank)))
    return result


def construction_seconds(building_id, target_level, admin_level=0, research_rank=0, *, first=False):
    base = building.upgrade(building_id, target_level)["seconds"]
    if first:
        return base
    if building_id == "admin":
        admin_level = min(admin_level, max(0, target_level - 1))
    admin = F(0) if not admin_level else building.primary("admin", admin_level) / 100
    seconds = building.ceil(base * (1 - admin) * (1 - ratio("ops-construction", research_rank)), 15)
    return max(int(building.P["final_upgrade_min_seconds"]), seconds) if target_level == 25 else seconds


def incubation_seconds(base, hatchery_level=0, research_rank=0, *, first=False):
    if first:
        return int(base)
    reduction = F(0) if not hatchery_level else building.P["incubation_reduction_max"] * F(hatchery_level - 1, 24)
    return max(1, building.ceil(F(base) * (1 - reduction) * (1 - ratio("care-incubation", research_rank))))


def hatching_slots(hatchery_level=0, research_rank=0):
    return (1 if not hatchery_level else building.primary("hatchery", hatchery_level)
            + int(value("care-hatch-capacity", research_rank)))


def upkeep_ratio(security_level=0, upkeep_rank=0, isolation_rank=0, environment_id="care-desert", environment_rank=0, *, risky=True):
    assert REGISTRY[environment_id]["kind"] == "environment_unlock_and_upkeep"
    result = (1 - ratio("care-upkeep", upkeep_rank)) * (1 - ratio(environment_id, environment_rank))
    if risky:
        security = F(0) if not security_level else building.P["security_upkeep_reduction_max"] * F(security_level - 1, 24)
        result *= (1 - security) * (1 - ratio("care-isolation", isolation_rank))
    return result


def visitor_rate(base_demand, gate_level, platforms, restroom_level=0, foodcourt_level=0,
                 entry_rank=0, marketing_rank=0, flow_rank=0, comfort_rank=0,
                 theme_program_rank=0, *, theme_eligible=False):
    """Illustrative rate algebra; callers supply an already validated demand."""
    food = F(0) if not foodcourt_level else building.primary("foodcourt", foodcourt_level) / 100
    theme = ratio("ops-exhibitions", theme_program_rank) if theme_eligible else F(0)
    demand = F(base_demand) * (1 + food + ratio("ops-marketing", marketing_rank) + theme)
    gate = building.primary("gate", gate_level) * (1 + ratio("ops-entry", entry_rank))
    restroom = 0 if not restroom_level else int(building.primary("restroom", restroom_level) * (1 + ratio("ops-comfort", comfort_rank)))
    capacity = building.P["base_capacity"] + sum(building.primary("platform", n) for n in platforms) + restroom
    seconds = value("ops-flow", flow_rank, building.P["visit_seconds"])
    viewing = capacity * 60 / seconds
    return {"demand": demand, "gate": gate, "viewing_per_minute": viewing,
            "visitors_per_minute": min(demand, gate, viewing), "physical_capacity": capacity}


def discounted_positive(amount, percent):
    assert amount >= 0 and 0 <= percent < 100
    return 0 if not amount else max(1, building.ceil(F(amount) * (1 - F(percent) / 100)))


def synthesis_gold(base, budget_rank=0, *, first=False):
    return base if first else discounted_positive(base, value("gene-synthesis-budget", budget_rank))


def synthesis_dna(base, result_id, quantification_rank=0, legendary_rank=0, *, first=False):
    if first:
        return base
    extra = F(0)
    if legendary_rank == int(cost.NODES["gene-combination-legendary"]["max"]):
        special = level("gene-combination-legendary", legendary_rank)
        if result_id in special["unlocks"]:
            extra = F(special["value"])
    cap = value("gene-dna-quantification", int(cost.NODES["gene-dna-quantification"]["max"])) + value("gene-combination-legendary", 3)
    return discounted_positive(base, min(cap, value("gene-dna-quantification", quantification_rank) + extra))


def failure_refund(actual_spend, percent, *, stabilized=False):
    assert actual_spend >= 0 and 0 <= percent <= 100
    return actual_spend if stabilized else int(F(actual_spend) * F(percent) / 100)


def expedition_fuel(permission, supply_rank=0):
    assert permission["kind"] == "mission_permission"
    base = permission["base_fuel"]
    if not supply_rank:
        return base
    row = level("exp-expedition-supply", supply_rank)
    contract = row["contract"]
    if permission["id"] not in contract["affected_mission_ids"]:
        return base
    option = contract["permissions"][0]
    return max(option["minimum_fuel"], base - int(row["value"]))
