#!/usr/bin/env python3
"""Validate canonical v0.6 effect definitions and illustrative stack arithmetic.

This is planning verification, not runtime, DB, mission execution, migration,
player scheduling, retention, affordability over time, or end-to-end testing.
Run: python3 -B docs/models/check_research_effects_v06.py
"""
from __future__ import annotations

import hashlib
import itertools
import json
import re
import sys
from collections import Counter
from fractions import Fraction as F
from pathlib import Path

sys.dont_write_bytecode = True
import research_effect_model_v06 as model

ROOT = model.ROOT
OUTPUT = ROOT / "tmp/preview/research-effects-v06-check.json"
DNA = ROOT / "docs/current/dna-and-collection.md"
# Regression fingerprint of the 14 approved raw effect rows, not a second
# numeric configuration. Original 12 rows also compare to the v0.5 archive.
PRESERVED_14_ROWS_SHA256 = "0735f5dbdd92b9df361a8aa885ade422fe38e8a8edf2e8a2e06e7316d30ba7f2"
PUBLIC_RECIPES = {"stegoceratops", "spinoraptor", "parasaurolophus-lux", "indominus-rex"}
FIRST_SPECIES = {"parasaurolophus", "iguanodon", "stegosaurus", "triceratops", "velociraptor"}
RUNTIME_UNMIGRATED_PARENT_METADATA = {"allosinosaurus", "scorpios-rex", "azhdarcho-magnus", "megalodon-rex"}
AREA_MATERIAL = {"fossil-valley": "dna", "primal-swamp": "culture", "abandoned-lab": "catalyst",
                 "mineral-cave": "stabilizer", "mutation-crater": "mutation_cell"}


def raw_table(text, namespace, name):
    block = text.split(f"<!-- {namespace}:{name} -->")[1].split(f"<!-- /{namespace}:{name} -->")[0]
    return "\n".join(line for line in block.splitlines() if line.startswith("|")) + "\n"


def planned_dna_definitions():
    """Read the completed plan; never replace the actual 81-species snapshot."""
    text = DNA.read_text()
    species_rows = model.marked_table(text, "dna", "planned-species")
    recipe_rows = model.marked_table(text, "dna", "followup-recipes")
    species = {row["id"]: {**row, "habitats": json.loads(row["habitats"])} for row in species_rows}
    recipes = {row["id"]: {**row, "parents": json.loads(row["parents"])} for row in recipe_rows}
    assert len(species_rows) == len(species) == 2
    assert set(species) == {"sinoceratops", "megalodon"}
    assert len(recipe_rows) == len(recipes) == 9
    return species, recipes


def sample_ranks(node_id):
    maximum = int(model.cost.NODES[node_id]["max"])
    return sorted({0, max(1, maximum // 2), maximum})


def validate_definitions(catalog):
    cost = model.cost
    assert len(cost.NODES) == 72 and sum(int(n["max"]) for n in cost.NODES.values()) == 252
    assert len(model.REGISTRY_ROWS) == len(model.STRUCTURED) == 58
    assert sum(len(rows) for rows in model.LEVELS.values()) == 194
    assert len(model.BASE_ROWS) == len(model.BASE) == 14
    assert sum(int(cost.NODES[n]["max"]) for n in model.BASE) == 58
    assert set(model.BASE).isdisjoint(model.STRUCTURED)
    assert set(model.all_effects()) == set(cost.NODES)
    raw = raw_table(cost.TEXT, "tech", "effects")
    assert hashlib.sha256(raw.encode()).hexdigest() == PRESERVED_14_ROWS_SHA256, "Approved 14 effect rows changed"
    archive = ROOT / "docs/archive/0.5/research-trees.md"
    old_rows = model.marked_table(archive.read_text(), "tech", "effects")
    assert len(old_rows) == 12
    assert all(model.BASE[row["id"]] == row for row in old_rows)
    current_lines = set(raw.splitlines())
    assert all(line in current_lines for line in raw_table(archive.read_text(), "tech", "effects").splitlines()[2:])
    assert model.BASE == cost.EFFECTS, "Effect and cost consumers disagree"
    all_levels = []
    for node_id, definition in model.STRUCTURED.items():
        assert definition["kind"] and definition["stacking"] and definition["availability"], node_id
        assert node_id in cost.NODES and cost.NODES[node_id]["비용군"] == "N"
        rows = definition["levels"]
        assert len(rows) == int(cost.NODES[node_id]["max"])
        assert [r["level"] for r in rows] == list(range(1, len(rows) + 1))
        previous_by_unit = {}
        for row in rows:
            assert isinstance(row["value"], (int, F)) and not isinstance(row["value"], bool), (node_id, row)
            assert row["value"] >= 0 and row["unit"] and row["effect"] not in {"", "-", "미정"}
            assert isinstance(row["contract"], dict) and isinstance(row["unlocks"], list)
            assert len(row["unlocks"]) == len(set(row["unlocks"]))
            assert all(isinstance(v, str) and v for v in row["unlocks"])
            if "%" in row["unit"]:
                assert row["value"] < 100, node_id
            # The legendary node changes from recipe-count to DNA-percent.
            # Compare only values with the same unit; do not add the units.
            if row["unit"] in previous_by_unit:
                old = previous_by_unit[row["unit"]]
                assert row["value"] <= old if definition["kind"] == "visit_duration_seconds" else row["value"] >= old
            previous_by_unit[row["unit"]] = row["value"]
            assert cost.base_cost(node_id, row["level"])["required_lab"] >= 1
            all_levels.append((node_id, row))
    assert len(all_levels) == 194
    try:
        model.ratio("gene-combination-legendary", 1)
    except AssertionError:
        pass
    else:
        raise AssertionError("Recipe permission count must not be interpreted as a percentage")
    assert model.ratio("gene-combination-legendary", 3) == F(".10")
    assert Counter(node["계열"] for node in cost.NODES.values()) == {"운영": 18, "사육": 18, "탐험": 18, "유전": 18}
    assert [int(model.value("ops-engineering", rank)) for rank in range(1, 4)] == [cap for rank, _lab, cap in cost.CAPS if rank]
    species = {d["id"]: d for d in catalog["species"]}
    assert len(species) == 81
    for d in species.values():
        if d["category"] == "hybrid" or d.get("origin") in {"hybrid", "variant"}:
            assert d["rarity"] in {"epic", "legendary"}, d["id"]
    return species, all_levels


def validate_species_and_permissions(species, all_levels):
    new_planned_species, planned_recipes = planned_dna_definitions()
    assert set(new_planned_species).isdisjoint(species)
    planned_species_ids = set(species) | set(new_planned_species)
    assert len(planned_species_ids) == 83
    future_habitats = {"habitat-desert", "habitat-volcanic", "habitat-glacier", "habitat-pterosaur-dome", "habitat-marine-aquarium"}
    permission_rows = model.permissions()
    permission_index = {p["id"]: (node, rank, p) for node, rank, p in permission_rows}
    assert len(permission_rows) == len(permission_index) == 68
    natural_missions, recipe_targets, programs = {}, {}, {}
    for node_id, row in all_levels:
        kind = model.REGISTRY[node_id]["kind"]
        for identifier in row["unlocks"]:
            if identifier in species or identifier in future_habitats or identifier in permission_index:
                continue
            if identifier.startswith("permission:care."):
                assert node_id.startswith("care-") and row["level"] == 1 or node_id == "care-giant"
            elif node_id == "ops-view-facilities":
                assert re.fullmatch(r"build:visitor-viewing-platform:count-[234]", identifier)
            elif node_id == "ops-land":
                assert re.fullmatch(r"expand:park:(24x24|28x28|32x32|36x36|40x40)", identifier)
            elif node_id == "ops-engineering":
                assert identifier == f"upgrade:major-building:max-{row['value']}"
            elif node_id == "ops-exhibitions":
                assert identifier.startswith("exhibition:")
            else:
                raise AssertionError((node_id, "unknown catalog or planned permission ID", identifier))
        if kind == "natural_species_mission_unlock":
            assert set(row["unlocks"]) <= species.keys() and len(row["unlocks"]) == row["value"]
            assert not (set(row["unlocks"]) & FIRST_SPECIES)
            previous = set(model.level(node_id, row["level"] - 1)["unlocks"]) if row["level"] > 1 else set()
            new = set(row["contract"]["new_unlocks"])
            assert previous | new == set(row["unlocks"]) and previous.isdisjoint(new)
            rarity = ("epic" if node_id == "gene-epic-natural" else "legendary" if node_id == "gene-legend-natural"
                      else node_id.split("-")[1])
            for identifier in row["unlocks"]:
                d = species[identifier]
                assert d["rarity"] == rarity and d["category"] != "hybrid"
                assert d.get("origin") not in {"hybrid", "variant"}
                if node_id.endswith("herbivore"):
                    assert d["category"] == "herbivore"
                elif node_id.endswith("carnivore"):
                    assert d["category"] == "carnivore"
            bindings = row["contract"]["mission_bindings"]
            assert {b["species_id"] for b in bindings} == new
            for binding in bindings:
                assert binding["reward_species_id"] == binding["species_id"]
                assert binding["first_verified_clear_egg_amount"] == 1
                assert "not-implemented" in binding["status"]
                identifier = binding["mission_permission_id"]
                assert identifier not in natural_missions
                natural_missions[identifier] = binding
        if kind in {"followup_recipe_unlock", "legendary_recipe_unlock_then_dna_efficiency"}:
            assert not (set(row["unlocks"]) & PUBLIC_RECIPES)
            for identifier in row["unlocks"]:
                d = species[identifier]
                assert d["rarity"] == ("legendary" if node_id.endswith("legendary") else "epic")
                assert d["category"] == "hybrid" or d.get("origin") == "hybrid"
            for target in row["contract"].get("recipe_targets", []):
                identifier = target["result_species_id"]
                assert identifier in row["unlocks"] and identifier not in recipe_targets
                assert target["recipe_permission_id"] == "recipe-" + identifier
                for parent in (target.get("parent_species_ids") or []) + target.get("known_catalog_parent_species_ids", []):
                    assert parent in species, (identifier, "unknown parent", parent)
                assert target["parent_data_scope"] == "runtime snapshot metadata"
                assert target["planned_recipe_ref"] == identifier
                assert target["status"] == "runtime-blocked-planning-complete"
                plan = planned_recipes[target["planned_recipe_ref"]]
                assert plan["required_research"] == f"{node_id}:{row['level']}"
                assert plan["rarity"] == species[identifier]["rarity"]
                assert int(plan["quality"]) == (3 if plan["rarity"] == "legendary" else 2)
                assert len(plan["parents"]) >= 2 and len(plan["parents"]) == len(set(plan["parents"]))
                assert set(plan["parents"]) <= planned_species_ids, (identifier, "planned parent missing")
                assert set(target.get("known_catalog_parent_species_ids", [])) <= set(plan["parents"])
                assert all(int(plan[key]) > 0 for key in ["dna", "catalyst", "culture", "gold", "seconds"])
                assert int(plan["mutation_cell"]) >= 0
                if target["parent_species_ids"] is None:
                    assert identifier in RUNTIME_UNMIGRATED_PARENT_METADATA
                else:
                    # Five already known snapshots must agree exactly with the
                    # authoritative plan; null snapshots remain non-executable.
                    assert len(target["parent_species_ids"]) >= 2
                    assert target["parent_species_ids"] == plan["parents"]
                recipe_targets[identifier] = target
        if kind == "active_exhibition_demand_bonus_percent":
            program = row["contract"]["contract"]
            assert len(set(program["required_species"])) == 3
            assert set(program["required_species"]) <= species.keys()
            assert program["demand_bonus_percent"] == row["value"]
            assert program["maximum_simultaneous_programs"] == 1 and program["free_reward"] is False
            assert "exhibition:" + program["program_id"] in row["unlocks"]
            assert program["program_id"] not in programs
            programs[program["program_id"]] = program
        if node_id == "care-aerial":
            assert {v for v in row["unlocks"] if v in species} <= {k for k, d in species.items() if d["category"] == "pterosaur"}
        if node_id == "care-marine":
            assert {v for v in row["unlocks"] if v in species} <= {k for k, d in species.items() if d["category"] == "marine" or k == "megalodon-rex"}
    assert len(natural_missions) == 42 and len(recipe_targets) == 9 and len(programs) == 3
    assert {k for k, v in recipe_targets.items() if v["parent_species_ids"] is None} == RUNTIME_UNMIGRATED_PARENT_METADATA
    assert set(recipe_targets) == set(planned_recipes)
    approved_completed_parents = {
        "allosinosaurus": ["allosaurus", "sinoceratops"],
        "scorpios-rex": ["carnotaurus", "dilophosaurus"],
        "azhdarcho-magnus": ["quetzalcoatlus", "hatzegopteryx"],
        "megalodon-rex": ["mosasaurus", "megalodon", "tyrannosaurus-rex"],
    }
    assert set(approved_completed_parents) == RUNTIME_UNMIGRATED_PARENT_METADATA
    assert all(planned_recipes[key]["parents"] == parents for key, parents in approved_completed_parents.items())
    giant_groups = [{v for v in row["unlocks"] if v in species} for row in model.LEVELS["care-giant"]]
    assert all(species[k]["size"] == "giant" for group in giant_groups for k in group)
    assert all(giant_groups[i].isdisjoint(giant_groups[j]) for i in range(3) for j in range(i))
    giants = {k for k, d in species.items() if d["size"] == "giant"}
    assert set.union(*giant_groups) == giants, ("GIANT coverage", giants - set.union(*giant_groups))
    assert all(species[k]["category"] == "herbivore" for k in giant_groups[0])
    assert all(species[k]["category"] == "carnivore" for k in giant_groups[1])
    assert {k for k, d in species.items() if d["category"] == "pterosaur" and d["size"] == "giant"} <= giant_groups[2]
    assert not set.union(*giant_groups) & (FIRST_SPECIES | {"stegoceratops", "parasaurolophus-lux"})
    return permission_index, {"natural_target_missions": len(natural_missions), "followup_recipe_targets": len(recipe_targets),
                              "runtime_unmigrated_parent_metadata_recipes": sorted(RUNTIME_UNMIGRATED_PARENT_METADATA),
                              "runtime_unregistered_followup_recipes": sorted(recipe_targets),
                              "planned_parent_definitions_complete": True, "planned_dna_recipes": len(planned_recipes),
                              "additional_planned_species": len(new_planned_species), "planned_total_species": len(planned_species_ids),
                              "giant_species": len(giants), "exhibitions": len(programs)}


def validate_expeditions(index, catalog):
    materials = set(catalog["materials"].values())
    qualities = {v for v in catalog["qualities"].values() if isinstance(v, int)}
    assert len(materials) == 5 and qualities == {1, 2, 3}
    base_regions = {"region." + name + ".base" for name in AREA_MATERIAL}
    protected = {r["id"] for r in model.building.table("missions")} | {"first-iguanodon-v1"}
    missions = []
    for identifier, (node_id, rank, p) in index.items():
        assert p["primary_research"] == f"{node_id}:{rank}"
        assert p["required_additional_technology"] == []
        assert identifier in model.level(node_id, rank)["unlocks"]
        assert p.get("required_advanced_region_permissions", []) == []
        if p["kind"] == "region_permission":
            assert p["base_region_permission"] in base_regions
        elif p["kind"] == "mission_permission":
            missions.append(p)
            area = p["area_id"]
            assert area in AREA_MATERIAL and p["reward"]["material"] == AREA_MATERIAL[area]
            assert p["reward"]["material"] in materials and p["reward"]["quality"] in qualities
            assert isinstance(p["reward"]["quantity"], int) and p["reward"]["quantity"] > 0
            assert p["reward_claims_per_completion"] == 1 and p["manual_successful_checks"] >= 2
            assert p["unlocks_codex_or_species_permission"] is False and p["egg_or_dinosaur_reward"] is False
            assert p["base_fuel"] in {5, 10}
            assert ("long-range" in p["tags"]) == (p["base_fuel"] == 10)
            for ref in p["required_region_permissions"]:
                assert ref in base_regions or ref in index
                if ref in index:
                    owner, owner_rank, region = index[ref]
                    assert region["kind"] == "region_permission"
                    assert ("tech", owner, owner_rank) in model.cost.event_closure(("tech", node_id, rank)), (identifier, "hidden extra research", ref)
            if "themed_species_id" in p:
                assert p["themed_species_id"] in {d["id"] for d in catalog["species"]}
        else:
            assert p["kind"] == "optional_mission_action_permission"
            assert p.get("correct_answer_reveal", False) is False
            assert p.get("extra_resource_reward", 0) == 0 and p.get("extra_observations", 0) == 0
            if node_id == "exp-objective-choice":
                assert p["mutually_exclusive"] and p["base_fuel_unchanged"]
                assert p["eligibility"]["quality"] == 1 and p["eligibility"]["egg_or_dinosaur_reward"] is False
                assert protected <= set(p["eligibility"]["excludes_protected_ids"])
    long_range = {p["id"] for p in missions if "long-range" in p["tags"]}
    assert len(long_range) == 8
    for rank in range(1, 6):
        row = model.level("exp-expedition-supply", rank)
        assert set(row["contract"]["affected_mission_ids"]) == long_range
        assert row["contract"]["final_fuel"] == 10 - row["value"] >= 5
        for p in missions:
            fuel = model.expedition_fuel(p, rank)
            assert fuel == (10 - rank if p["id"] in long_range else p["base_fuel"])
            assert fuel >= 5
    assert {p["reward"]["material"] for p in missions} == materials
    assert {p["reward"]["quality"] for p in missions} == qualities
    return {"permission_definitions": len(index), "mission_definitions": len(missions), "long_range_missions": len(long_range),
            "primary_research_per_permission": 1, "additional_technology_requirements": 0}


def validate_arithmetic(catalog):
    b = model.building
    assert model.vault_capacity(25, 3) == 26000000 and model.vault_capacity(1, 3) == 32500
    assert model.material_capacity(25, 3) == 5850 and model.material_capacity(0, 3) == 100
    assert model.production("lumber", 25, 6, 5, 3)["quantity"] == 720
    assert model.production("quarry", 25, 6, 5, 3)["quantity"] == 720
    assert model.batch_lots(3, fuel=True) == 3
    assert model.hatching_slots(25, 3) == 11 and model.hatching_slots(0, 3) == 1
    assert (1 - b.P["incubation_reduction_max"]) * (1 - model.ratio("care-incubation", 5)) == F(".608")
    assert (1 - b.P["research_reduction_max"]) * (1 - model.ratio("gene-culture", 5)) == F(".684")
    assert model.upkeep_ratio(25, 3, 3, environment_rank=3) == F(".64152")
    assert model.upkeep_ratio(upkeep_rank=3, environment_rank=3, risky=False) == F(".81")
    assert 1 + b.primary("foodcourt", 25) / 100 + model.ratio("ops-marketing", 3) + model.ratio("ops-exhibitions", 3) == F("1.32")
    for building_id, definition in b.EFFECT.items():
        if definition["kind"] == "habitat":
            assert all(1 <= b.primary(building_id, rank) <= 9 for rank in range(1, 26))
    for node in ["care-group-feeding", "care-group-interaction", "care-transfer"]:
        assert max(model.value(node, rank) for rank in range(1, 4)) == 9
    counts = Counter()
    for level, storage in itertools.product([1, 10, 25], sample_ranks("ops-storage")):
        cap = model.material_capacity(level, storage)
        assert b.primary("warehouse", level) <= cap <= 5850
        counts["storage_stacks"] += 1
    for base, gate, entry, flow, theme in itertools.product([0, 20, 100000], [1, 10, 25], [0, 2, 5], [0, 1, 3], [0, 1, 3]):
        result = model.visitor_rate(base, gate, [1, 10], 25, 25, entry, 3, flow, 3, theme, theme_eligible=True)
        rate = result["visitors_per_minute"]
        assert 0 <= rate <= result["gate"] and rate <= result["demand"] and rate <= result["viewing_per_minute"]
        counts["visitor_stacks"] += 1
        # Independent gate bound: a shorter visit must never multiply the
        # admission gate's own per-minute throughput.
        assert rate <= b.primary("gate", gate) * (1 + model.ratio("ops-entry", entry))
        without_theme = model.visitor_rate(base, gate, [1, 10], 25, 25, entry, 3, flow, 3, theme, theme_eligible=False)
        assert without_theme["demand"] == F(base) * (1 + b.primary("foodcourt", 25) / 100 + model.ratio("ops-marketing", 3))
    for security, care, isolation, environment in itertools.product([0, 10, 25], [0, 1, 3], [0, 1, 3], [0, 1, 3]):
        assert F(".64152") <= model.upkeep_ratio(security, care, isolation, environment_rank=environment) <= 1
        counts["upkeep_stacks"] += 1
    for hatchery, rank in itertools.product([0, 1, 10, 25], [0, 2, 5]):
        assert 1 <= model.incubation_seconds(3600, hatchery, rank) <= 3600
        assert model.incubation_seconds(60, hatchery, rank, first=True) == 60
        counts["incubation_stacks"] += 1
    for building_id, admin, research in itertools.product(b.BUILD, [0, 10, 25], [0, 1, 3]):
        seconds = model.construction_seconds(building_id, 25, admin, research)
        assert seconds >= 7 * 86400 and seconds % 15 == 0
        counts["final_building_stacks"] += 1
    assert model.construction_seconds("grassland", 2, 5, 1) == 120
    recipes = {r["id"]: r for r in catalog["recipes"]}
    assert set(recipes) == PUBLIC_RECIPES
    first = recipes["stegoceratops"]
    assert first["parentSpeciesIds"] == ["stegosaurus", "triceratops"]
    assert first["firstSynthesisRule"] == {"successRate": 1, "guaranteedAttempt": 1}
    assert first["goldCost"] == 4000 and first["durationMs"] == 30 * 60000
    assert [(r["material"], r["quality"], r["amount"]) for r in first["ingredients"]] == [("dna", 2, 20), ("catalyst", 2, 1), ("culture", 2, 2)]
    assert catalog["rules"]["epic"] == {"successRate": .5, "guaranteedAttempt": 5}
    assert catalog["rules"]["legendary"] == {"successRate": .3, "guaranteedAttempt": 8}
    for recipe in recipes.values():
        assert set(recipe["parentSpeciesIds"]) <= {d["id"] for d in catalog["species"]}
    special = set(model.level("gene-combination-legendary", 3)["unlocks"])
    assert special == {"indominus-rex-maximus", "megalodon-rex"}
    for base, quant, legendary, result in itertools.product([1, 2, 3, 20, 40, 45, 80, 1000], range(6), range(4), ["stegoceratops", "indominus-rex", *sorted(special)]):
        used = model.synthesis_dna(base, result, quant, legendary)
        pct = min(F(30), model.value("gene-dna-quantification", quant) + (10 if legendary == 3 and result in special else 0))
        assert used == max(1, b.ceil(F(base) * (1 - pct / 100))) and 1 <= used <= base
        assert model.synthesis_dna(base, result, quant, legendary, first=True) == base
        for refund in [80, *[model.value("gene-preservation", n) for n in range(1, 6)]]:
            assert 0 <= model.failure_refund(used, refund) <= used
            assert model.failure_refund(used, refund, stabilized=True) == used
        counts["dna_refund_stacks"] += 1
    for rank in range(1, 6):
        row = model.level("gene-dna-quantification", rank)
        for base, name in [(20, "preview_repeat_dna20"), (40, "preview_dna40"), (45, "preview_dna45"), (80, "preview_dna80")]:
            assert row["contract"][name] == model.synthesis_dna(base, "stegoceratops", rank)
        row = model.level("gene-synthesis-budget", rank)
        assert row["contract"]["preview_repeat_stegoceratops_gold"] == model.synthesis_gold(4000, rank)
        assert model.synthesis_gold(4000, rank, first=True) == 4000
    for ordinary in ["lumber", "quarry", "metalshop", "feedmill"]:
        for production_level, processing_rank, batch_rank in itertools.product([1, 10, 25], [0, 2, 5], [0, 1, 3]):
            lots = model.batch_lots(batch_rank)
            result = model.production(ordinary, production_level, lots, processing_rank, batch_rank)
            assert result["quantity"] == b.primary(ordinary, production_level) * lots
            assert 0 < result["seconds"] <= b.production(ordinary, production_level, lots)["seconds"]
            assert result["quantity"] <= model.material_capacity(25, 3)
            counts["production_stacks"] += 1
    # Nursery/instant care are state-bound effects, not new currencies or a
    # change to the hunger clock. Check only their arithmetic ceilings here.
    for happiness, nutrition, interaction in itertools.product([0, 50, 99, 100], [0, 2, 5], [0, 2, 5]):
        fed = min(100, happiness + 20 + model.value("care-nutrition", nutrition))
        played = min(100, happiness + 5 + model.value("care-interaction", interaction))
        assert happiness <= fed <= 100 and happiness <= played <= 100
        counts["instant_care_bounds"] += 1
    return dict(counts)


def validate_cost_linkage():
    cost, b = model.cost, model.building
    rows = cost.all_costs()
    assert len(rows) == 252
    buys = {row["material"]: int(row["buy"]) for row in b.PROD.values()}
    snapshots = 0
    for row in rows:
        node_id, rank, required = row["id"], row["level"], row["required_lab"]
        assert model.value(node_id, rank) >= 0
        closure = cost.event_closure(("tech", node_id, rank))
        assert all(event[1] <= required for event in closure if event[0] == "lab")
        available_cap = next(cap for _n, _lab, cap in cost.CAPS if required <= cap)
        stock = max(row[m] for m in ["wood", "stone", "metal"])
        cash = row["gold"] + sum(row[m] * buys[m] for m in ["wood", "stone", "metal"])
        assert stock <= b.primary("warehouse", available_cap) and cash <= b.primary("vault", available_cap), (node_id, rank, "pre-effect access")
        possible = False
        choices = sorted({0, 2, 5, rank - 1})
        for lab, budget, protocol in itertools.product(range(required, 26), choices, choices):
            if not cost.snapshot_is_feasible(node_id, rank, lab, budget, protocol):
                continue
            possible = True
            actual = cost.actual_cost(node_id, rank, lab, budget, protocol)
            assert 0 < actual["gold"] <= row["gold"] and 0 < actual["seconds"] <= row["seconds"]
            assert actual["seconds"] >= row["min_seconds"]
            if 15 <= required < 20:
                assert actual["seconds"] >= 7 * 86400
            elif 20 <= required < 25:
                assert actual["seconds"] >= 14 * 86400
            elif required == 25:
                minimum = (14 if row["role"] == "legacy" else int(cost.ROLES[row["role"]]["ultra_min_days"]))
                assert minimum in {14, 21, 28} and actual["seconds"] >= minimum * 86400
            snapshots += 1
        assert possible, (node_id, rank, "no permitted completed-discount snapshot")
    assert cost.actual_cost("ops-entry", 1, 1)["seconds"] == 60
    assert not cost.snapshot_is_feasible("gene-study-budget", 2, 12, 2, 0)
    assert not cost.snapshot_is_feasible("gene-study-protocol", 2, 18, 2, 2)
    return {"cost_actions": len(rows), "feasible_cost_time_snapshots": snapshots,
            "pre_effect_storage_and_cash_guard": True, "self_future_discount_rejected": True}


def validate():
    catalog, provenance = model.catalog_data()
    species, levels = validate_definitions(catalog)
    permission_index, content = validate_species_and_permissions(species, levels)
    expedition = validate_expeditions(permission_index, catalog)
    combinations = validate_arithmetic(catalog)
    costs = validate_cost_linkage()
    inputs = [model.SOURCE, model.cost.TECH, model.cost.BALANCE, DNA,
              ROOT / "docs/archive/0.5/research-trees.md", Path(model.__file__), Path(__file__),
              Path(model.cost.__file__), Path(model.building.__file__)]
    return {"status": "pass", "kind": "canonical planning definitions and arithmetic only",
            "technologies": 72, "research_actions": 252, "preserved_scalar_technologies": 14,
            "structured_technologies": 58, "structured_levels": 194, "catalog_species": len(species),
            "source_sha256": {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},
            "compiled_catalog_source_provenance": provenance,
            "checks": {"preserved_14_original_effect_rows": True, "all_levels_defined_and_cost_linked": True,
                       "units_and_monotonicity": True, "catalog_species_rarity_origin_size_and_parent_ids": True,
                       "completed_dna_plan_9_recipes_2_species_and_snapshot_separation": True,
                       "one_primary_expedition_permission_no_extra_technology_toll": True,
                       "first_hatch_and_first_guaranteed_synthesis_excluded": True,
                       "unchanged_synthesis_success_and_protection": True,
                       "storage_housing_fuel_visitor_and_duration_bounds": True,
                       "dna_30_percent_cap_actual_spend_refund_conservation": True},
            "content": content, "expedition": expedition, "combination_cases": combinations, "costs": costs,
            "maxima": {"gold_capacity": model.vault_capacity(25, 3), "ordinary_material_capacity": model.material_capacity(25, 3),
                       "ordinary_batch_quantity": model.production("lumber", 25, 6, 5, 3)["quantity"],
                       "hatching_slots": model.hatching_slots(25, 3), "incubation_residual_ratio": ".608",
                       "risky_upkeep_residual_ratio": str(model.upkeep_ratio(25, 3, 3, environment_rank=3)),
                       "demand_multiplier": "1.32", "general_dna_reduction_percent": 20,
                       "target_legendary_dna_reduction_percent": 30},
            "unverified": ["runtime/API/DB integration, atomic state changes and concurrency", "mission implementation and live rewards",
                           "runtime implementation of planned habitats/recipes, expansion and construction", "player schedules, real acquisition time and retention",
                           "profitability and payback of late optional efficiency research"]}


def json_default(value):
    if isinstance(value, F):
        return value.numerator if value.denominator == 1 else float(value)
    raise TypeError(type(value).__name__)


def main():
    try:
        result = validate()
    except (AssertionError, KeyError, ValueError, TypeError, RecursionError) as exc:
        result = {"status": "fail", "kind": "planning validation only", "error": repr(exc)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2, default=json_default) + "\n")
    keys = ["status", "kind", "technologies", "research_actions", "structured_technologies", "structured_levels", "checks", "error"]
    print(json.dumps({key: result[key] for key in keys if key in result}, ensure_ascii=False, default=json_default))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
