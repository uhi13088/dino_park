"""Design scenarios for Park 15/25/35/50. Run from the repo root for JSON.

Each scenario starts with a completed park snapshot. Sources provide costs,
permissions and caps. A visit schedule, species, and zero-stock estimates are
scenario inputs. These scenarios do not forecast the date a player reaches a level.
"""
from __future__ import annotations

from collections import Counter
from fractions import Fraction as F
import json
import math
import re
import sys

sys.dont_write_bytecode = True

import park_progression_model_v06 as progression

acquisition = progression.acquisition
followup = progression.followup
building = progression.building
research = progression.research
effect = followup.effect

HALF_DAY_MINUTES = 12 * 60
ONLINE_MINUTES = 30
MATERIALS = ("wood", "stone", "metal")
ENVIRONMENT = {
    "desert": "care-desert", "volcanic": "care-volcanic", "glacier": "care-glacier",
    "aerial": "care-aerial", "marine": "care-marine",
}
COMMON_EXHIBITS = {
    "parasaurolophus": "grassland", "iguanodon": "grassland", "triceratops": "grassland",
    "stegosaurus": "grassland", "gallimimus": "grassland", "velociraptor": "carnivore",
    "stegoceratops": "hybrid_herb",
}
AERIAL_EXHIBITS = {
    **COMMON_EXHIBITS, "ankylosaurus": "grassland", "allosaurus": "carnivore", "pteranodon": "aerial",
}
MID_EXHIBITS = {**AERIAL_EXHIBITS, "plesiosaurus": "marine"}
LATE_EXHIBITS = {
    **MID_EXHIBITS, "brachiosaurus": "grassland", "tyrannosaurus-rex": "carnivore",
    "dimorphodon": "aerial",
}


def facilities(rank, *, lab, vault, warehouse, security, marine=0, aerial=0):
    return {
        **dict.fromkeys(("gate", "platform", "grassland", "lumber", "quarry", "feedmill",
                         "metalshop", "admin", "restroom", "foodcourt", "info"), rank),
        "lab": lab, "vault": vault, "warehouse": warehouse, "security": security,
        "carnivore": 5, "hybrid_herb": 5, "hatchery": 5,
        **({"marine": marine} if marine else {}),
        **({"aerial": aerial} if aerial else {}),
    }


SCENARIOS = {
    15: {
        "buildings": facilities(5, lab=10, vault=5, warehouse=3, security=5),
        "exhibits": COMMON_EXHIBITS,
        "tech": {"ops-engineering": 2, "ops-offline": 1, "ops-entry": 2},
        "building_goal": ("lab", 11),
        "research_goal": ("gene-analysis", 2),
        "field_goal": ("egg", "gene-target-brachiosaurus"),
        "story": "3장과 첫 영웅 수령 후 브라키오사우루스 알 확보·부화 또는 파라 룩스 합성 준비.",
        "allow_benefits": 0,
    },
    25: {
        "buildings": facilities(10, lab=20, vault=12, warehouse=6, security=8, aerial=1),
        "exhibits": AERIAL_EXHIBITS,
        "unexhibited": ("brachiosaurus",),
        "tech": {"gene-analysis": 2, "ops-offline": 2, "ops-land": 4, "ops-flow": 1,
                 "ops-processing": 2},
        "building_goal": ("marine", 1),
        "research_goal": ("care-marine", 1),
        "field_goal": ("material", "mission.primal-swamp.watermark-compare.v1"),
        "story_exhibit_goal": "natural-target-plesiosaurus",
        "story": "해양 생물 사육 → 해양관 완공·호환종 전시 → 수위 대조 수령 → 4장 완료. 익룡 사육은 완료 가정.",
        "allow_benefits": 1,
    },
    35: {
        "buildings": facilities(15, lab=20, vault=15, warehouse=13, security=10, marine=3, aerial=1),
        "exhibits": LATE_EXHIBITS,
        "tech": {"gene-analysis": 2, "ops-offline": 3, "ops-land": 5, "ops-flow": 2,
                 "ops-processing": 3},
        "building_goal": ("security", 11),
        "research_goal": ("exp-deep-expedition", 1),
        "field_goal": ("material", "mission.mutation-crater.thermal-pattern.v1"),
        "story": "5장 완료를 가정. 열흔 조사 수령 후 6장의 선택 분기 한 개를 마무리.",
        "allow_benefits": 2,
    },
    50: {
        "buildings": facilities(20, lab=25, vault=24, warehouse=20, security=15, marine=5, aerial=3),
        "exhibits": LATE_EXHIBITS,
        "unexhibited": ("livyatan",),
        "tech": {"gene-analysis": 2, "ops-offline": 3, "ops-land": 5, "ops-flow": 3,
                 "ops-processing": 4},
        "building_goal": ("vault", 25),
        "research_goal": ("exp-deep-expedition", 3),
        "field_goal": ("material", "mission.mutation-crater.deep-fissure-survey.v1"),
        "story": "본편 결말 이후 수집·심부 탐험을 선택. 추가 파크 경험치 단계 없음.",
        "allow_benefits": 3,
    },
}

ASSUMPTIONS = [
    "이미 첫 영웅을 수령한 4개 독립 파크의 하루를 계산했다. 해당 파크까지 성장한 기간을 합산하지 않았다.",
    "12시간 간격으로 30분 접속한다. 각 11시간30분 비접속 구간의 첫8시간에 해당 정보센터·연구의 적립 계수를 적용한다.",
    "호환 공룡을 전시한 서식지마다 관람길이 닿는다고 가정한다. 같은 서식지에 사는 종들은 전시 구역 한 곳을 공유한다. 12시간마다 영양 급식 2의 사료 1개로 행복 최대24와 허기 최대100을 회복한다. 매 회차 행복100·허기0 회복 가능 여부를 확인했으며 비전시 보유종은 골드 유지비를 계산한다.",
    "분 단위로 정산하며 같은 분의 유지비를 먼저 차감한다. 금고가 작거나 잔액이 많으면 입장을 거절하고 미수입 및 미납 유지비를 쌓지 않는다.",
    "기준 수입일은 골드 잔액 0에서 시작하고 지출 없이 유지비만 정산한다. 급식 사료는 미리 확보했다고 가정한다. 당일 사료 보충비를 다음 투자 여력에서 별도로 뺀다.",
    "건설자2명과 연구원1명을 사용한다. 유료 고용·광고·가속·위인·테마 전시·별도 보너스 수입은 계산에서 제외한다.",
    "시설·기술·탐험은 해당 단계의 대표 목표다. 빈 창고에서 시작해 직접 구매와 수동 생산에 필요한 비용을 비교한다.",
]


def building_cost(identifier, level):
    if identifier in followup.SPECIAL:
        return followup.special_upgrade(identifier, level)
    return building.upgrade(identifier, level)


def completed_research(park, snapshot, routes, mission, skills):
    buildings, exhibits = snapshot["buildings"], snapshot["exhibits"]
    lab = buildings["lab"]
    next_building, next_level = snapshot["building_goal"]
    next_research, next_rank = snapshot["research_goal"]
    target = ("tech", next_research, next_rank)
    events = {("lab", lab), *research.event_dependencies(target)}
    events |= {("tech", name, rank) for name, rank in skills.items()}
    field_research = mission.get("research") or mission.get("required_research")
    # The same 28-day research opens the final checkpoint's follow-on mission.
    if field_research != f"{next_research}:{next_rank}":
        events |= refs_to_events([field_research, *mission.get("required_additional_technology", [])])
    if mission.get("area_id") == "mutation-crater":
        events |= refs_to_events(["gene-analysis:2"])
        assert park >= 15
    for species, habitat in exhibits.items():
        info = routes[species]
        assert any(a["facility"] == habitat and buildings[habitat] >= a["min_level"]
                   for a in json.loads(info["housing"]["alternatives"]))
        events |= refs_to_events([info["first"].get("required_research"), info["housing"]["giant_permission"]])
    for species in snapshot.get("unexhibited", ()):
        events |= refs_to_events([routes[species]["first"].get("required_research")])
    for identifier in {*buildings, next_building} & followup.SPECIAL.keys():
        ref = followup.SPECIAL[identifier]["research"]
        if identifier != next_building or ref != f"{next_research}:{next_rank}":
            events |= refs_to_events([ref])
    top_level = max(next_level, *buildings.values())
    rank = next(r for r, _, cap in research.CAPS if cap >= top_level)
    if rank:
        events.add(("tech", "ops-engineering", rank))
    closure = {dep for item in events for dep in research.event_closure(item)}
    assert target not in closure, (park, "target is a prerequisite of starting state")
    higher = sorted(e for e in closure if e[0] == "lab" and e[1] > lab)
    assert not higher, (park, "research above snapshot lab", lab, higher)
    assert all(building_cost(identifier, level)["park"] <= park for identifier, level in buildings.items())
    assert building_cost(next_building, next_level)["park"] <= park
    tech = {}
    for event in closure:
        if event[0] == "tech":
            _, name, rank = event
            tech[name] = max(tech.get(name, 0), rank)
    risk = sum(int(routes[species]["housing"]["security_points"]) for species in exhibits)
    assert risk <= building.primary("security", buildings["security"])
    for habitat, count in Counter(exhibits.values()).items():
        cap = (followup.special_capacity(habitat, buildings[habitat]) if habitat in followup.SPECIAL
               else building.primary(habitat, buildings[habitat]))
        assert count <= cap, (park, habitat, count, cap)
    return dict(sorted(tech.items()))


def refs_to_events(refs):
    events = set()
    for ref in refs:
        if ref and ref != "-":
            node, rank = ref.rsplit(":", 1)
            events.add(("tech", node, int(rank)))
    return events


def constants():
    path = progression.ROOT / "packages/shared/src/constants/balance.constants.ts"
    return {name: int(value) for name, value in re.findall(r"^export const (\w+) = (\d+);", path.read_text(), re.M)}


def income_profile(snapshot, species, routes, tech):
    facilities = snapshot["buildings"]
    exhibits = snapshot["exhibits"]
    upkeep = sum(building_cost(name, level)["upkeep"] for name, level in facilities.items())
    upkeep *= 1 - effect.ratio("ops-maintenance", tech.get("ops-maintenance", 0))
    attraction = 0
    quality_inputs = []

    for identifier, habitat in exhibits.items():
        dino = species[identifier]
        pop = dino.get("stats", {}).get("popularity", dino.get("popularity"))
        fee = dino.get("stats", {}).get("maintenanceCost", dino.get("upkeep"))
        special = ENVIRONMENT.get(habitat, "care-desert")
        environment_rank = tech.get(special, 0) if habitat in ENVIRONMENT else 0
        risky = int(routes[identifier]["housing"]["security_points"]) > 0
        upkeep += fee * effect.upkeep_ratio(
            facilities["security"], tech.get("care-upkeep", 0), tech.get("care-isolation", 0),
            special, environment_rank, risky=risky,
        )
        reduction = building.P["care_reduction_max"] * F(facilities[habitat] - 1, 24)
        decay = (1 - reduction) * (1 - effect.ratio("care-adaptation", tech.get("care-adaptation", 0)))
        attraction += pop
        quality_inputs.append((pop, decay))

    for identifier in snapshot.get("unexhibited", ()):
        item = species[identifier]
        upkeep += item["stats"]["maintenanceCost"] * (1 - effect.ratio("care-upkeep", tech.get("care-upkeep", 0)))

    stats = constants()
    # One feed at each login must fully undo the previous 12 hours of decay.
    happy_restore = stats["FEEDING_HAPPINESS_GAIN"] + effect.value(
        "care-nutrition", tech.get("care-nutrition", 0),
    )
    hunger_restore = stats["FEEDING_HUNGER_REDUCE"]
    half_day_hours = F(HALF_DAY_MINUTES, 60)
    assert all(int(half_day_hours * decay * stats["HAPPINESS_DECAY_PER_HOUR"]) <= happy_restore
               and 0 < int(half_day_hours * decay * stats["HUNGER_INCREASE_PER_HOUR"]) <= hunger_restore
               for _, decay in quality_inputs)
    base_demand = 8 + 4 * attraction + 4 * (len(exhibits) - 1)
    offline = min(F(9, 10), building.primary("info", facilities["info"]) / 100
                  + effect.ratio("ops-offline", tech.get("ops-offline", 0)))
    cap_minutes = int(building.P["offline_cap_seconds"]) // 60
    assert ONLINE_MINUTES + cap_minutes <= HALF_DAY_MINUTES
    rate_parameters = {
        "gate_level": facilities["gate"], "occupied_zones": len(set(exhibits.values())),
        "foodcourt_level": facilities["foodcourt"],
        "entry_rank": tech.get("ops-entry", 0), "marketing_rank": tech.get("ops-marketing", 0),
        "flow_rank": tech.get("ops-flow", 0),
    }
    first = effect.visitor_rate(base_demand, **rate_parameters)

    def interval(minute):
        elapsed_hours = F(minute, 60)
        weighted = 0
        for pop, decay in quality_inputs:
            happy = max(0, 100 - int(elapsed_hours * decay * stats["HAPPINESS_DECAY_PER_HOUR"]))
            hunger = min(100, int(elapsed_hours * decay * stats["HUNGER_INCREASE_PER_HOUR"]))
            q = (F(1, 2) + F(happy, 200)) * (F(1, 2) if hunger > stats["DANGER_HUNGER_THRESHOLD"] else 1)
            weighted += pop * q
        rate = effect.visitor_rate(F(base_demand) * weighted / attraction, **rate_parameters)["visitors_per_minute"]
        factor = (1 if minute < ONLINE_MINUTES else offline
                  if minute < ONLINE_MINUTES + cap_minutes else 0)
        return rate * factor, upkeep * factor / 60

    half_day = [interval(m) for m in range(ONLINE_MINUTES + cap_minutes)]
    half_day += [(F(0), F(0))] * (HALF_DAY_MINUTES - len(half_day))
    return {
        "intervals": half_day * 2, "hourly_upkeep_gold": round(float(upkeep), 2),
        "offline_rate": float(offline), "active_minutes": 2 * ONLINE_MINUTES,
        "offline_minutes": 2 * cap_minutes,
        "healthy_visitors_per_minute": round(float(first["visitors_per_minute"]), 2),
        "bottleneck": min(("demand", "gate", "exhibit_per_minute"), key=first.__getitem__),
    }


def account_day(intervals, capacity, balance):
    opening = balance
    visitors_left = fees_left = F(0)
    collected = payable = paid = 0
    first_full_at = None
    ticket = int(building.P["ticket"])
    for minute, (visitors, fees) in enumerate(intervals, start=1):
        fees_left += fees
        due = int(fees_left)
        fees_left -= due
        payable += due
        charge = min(balance, due)
        balance -= charge
        collected += charge

        visitors_left += visitors
        arrival = int(visitors_left)
        visitors_left -= arrival
        admitted = min(arrival, (capacity - balance) // ticket)
        paid += admitted
        balance += admitted * ticket
        if capacity - balance < ticket:
            visitors_left = F(0)
            if first_full_at is None:
                first_full_at = minute

    potential = int(sum(visitors for visitors, _ in intervals))
    assert balance == opening + paid * ticket - collected
    assert 0 <= balance <= capacity
    return {
        "potential_gross_gold": potential * ticket, "gross_gold": paid * ticket,
        "maintenance_gold": collected, "scheduled_maintenance_gold": payable,
        "net_gold": paid * ticket - collected, "paid_admissions": paid,
        "blocked_admissions": potential - paid, "ending_gold": balance,
        "no_room_for_ticket_first_seconds": None if first_full_at is None else first_full_at * 60,
    }


def work_goals(scenario, raw_mission, species, tech):
    facilities = scenario["buildings"]
    bid, level = scenario["building_goal"]
    node, rank = scenario["research_goal"]
    bcost = followup.construction_actual(
        building_cost(bid, level), admin_level=facilities["admin"],
        construction_rank=tech.get("ops-construction", 0), building_budget=tech.get("ops-building-budget", 0),
        material_rank=tech.get("ops-materials", 0), target_level=level,
    )
    owner = building.BUILD[bid] if bid in building.BUILD else followup.SPECIAL[bid]
    bcost = {**{key: int(bcost[key]) for key in ("gold", *MATERIALS, "seconds")},
             "id": bid, "name": owner.get("건물") or owner.get("name"), "level": level,
             "after_research_goal": owner.get("research") == f"{node}:{rank}"}
    rcost = research.actual_cost(
        node, rank, facilities["lab"], tech.get("gene-study-budget", 0), tech.get("gene-study-protocol", 0),
    )
    return bcost, rcost, field_goal(raw_mission, facilities, species, tech, (node, rank))


def field_goal(raw_mission, facilities, species, tech, research_goal):
    node, rank = research_goal
    scout = {key: raw_mission[key] for key in ("id", "gold", "checks")}
    routes = [row for row in followup.scout_dispatches() if row["id"] == scout["id"]]
    if routes:
        departure = min(routes, key=lambda row: row["fuel"])
        scout["departure_region"] = departure["region"]
        scout["fuel"] = departure["fuel"]
    scout["required_research"] = raw_mission["research"]
    scout["after_research_goal"] = scout["required_research"] == f"{node}:{rank}"
    if "species" in raw_mission:
        dino = species[raw_mission["species"]]
        scout["name"] = f"{dino['nameKo']} 알 목표"
        scout["gold"] += raw_mission["hatch_gold"]
        scout["hatch_seconds"] = effect.incubation_seconds(
            raw_mission["hatch_seconds"], facilities["hatchery"], tech.get("care-incubation", 0),
        )
    else:
        scout["name"] = raw_mission["name"]
        scout["reward"] = raw_mission["reward"]
    scout["activity_seconds"] = int(followup.PLAY[raw_mission.get("play", "routine")]["arithmetic_seconds"])
    return scout


def resources(facilities, tech, bcost, rcost, scouts, exhibit_count):
    processing = tech.get("ops-processing", 0)
    batches = tech.get("ops-batch", 0)
    production = {}
    storage = effect.material_capacity(facilities["warehouse"], tech.get("ops-storage", 0))
    for identifier, rule in building.PROD.items():
        mat = rule["material"]
        level = facilities[identifier]
        production[mat] = effect.production(identifier, level, 1, processing, batches)
        max_lots = min(effect.batch_lots(batches), storage // production[mat]["quantity"])
        assert max_lots >= 1
        production[mat].update(
            max_lots=max_lots, building=identifier,
            purchase_gold=effect.discounted_positive(int(rule["buy"]),
                                                     effect.value("ops-procurement", tech.get("ops-procurement", 0))),
        )

    quantities = {m: bcost[m] + rcost[m] for m in MATERIALS}
    batch_plan = {}
    for mat, need in {**quantities, "feed": 2 * exhibit_count}.items():
        recipe = production[mat]
        lots = math.ceil(need / recipe["quantity"])
        full, tail = divmod(lots, recipe["max_lots"])
        batches_used = [recipe["max_lots"]] * full + ([tail] if tail else [])
        overlap_jobs = [effect.production(recipe["building"], facilities[recipe["building"]],
                                          size, processing, batches) for size in batches_used]
        batch_plan[mat] = {
            "needed": need, "lots": lots, "jobs": len(batches_used),
            "produced": lots * recipe["quantity"], "gold": sum(job["gold"] for job in overlap_jobs),
            "seconds": sum(job["seconds"] for job in overlap_jobs),
            "purchase_gold": need * recipe["purchase_gold"],
        }

    direct = bcost["gold"] + rcost["gold"] + sum(goal["gold"] for goal in scouts)
    produced = sum(batch_plan[mat]["gold"] for mat in MATERIALS)
    purchased = sum(batch_plan[mat]["purchase_gold"] for mat in MATERIALS)
    finance = tech.get("ops-finance", 0)
    vault = effect.vault_capacity(facilities["vault"], finance)
    v_capacity = lambda n: effect.vault_capacity(n, finance)
    w_capacity = lambda n: effect.material_capacity(n, tech.get("ops-storage", 0))
    target_vault_level = capacity_level(v_capacity, direct, facilities["vault"])
    target_storage_level = capacity_level(w_capacity, max(quantities.values()), facilities["warehouse"])
    funding = {
        "vault_capacity": vault, "material_capacity": storage,
        "together_direct_gold": direct, "production_gold": produced, "purchase_gold": purchased,
        "together_produced_gold": direct + produced, "together_purchased_gold": direct + purchased,
        "production_max_seconds": max(batch_plan[mat]["seconds"] for mat in MATERIALS),
        "production_jobs": sum(batch_plan[mat]["jobs"] for mat in MATERIALS),
        "direct_currency_fits": vault >= direct, "combined_materials_fit": storage >= max(quantities.values()),
        "building_fits_vault": bcost["gold"] <= vault, "research_fits_vault": rcost["gold"] <= vault,
        "building_fits_storage": storage >= max(bcost[m] for m in MATERIALS),
        "research_fits_storage": storage >= max(rcost[m] for m in MATERIALS),
        "minimum_combined_vault_level": target_vault_level,
        "minimum_combined_warehouse_level": target_storage_level,
        "minimum_building_vault_level": capacity_level(v_capacity, bcost["gold"], facilities["vault"]),
        "minimum_research_vault_level": capacity_level(v_capacity, rcost["gold"], facilities["vault"]),
        "minimum_research_warehouse_level": capacity_level(w_capacity, max(rcost[m] for m in MATERIALS),
                                                            facilities["warehouse"]),
        "minimum_research_vault_capacity": rcost["gold"],
        "minimum_research_material_capacity": max(rcost[m] for m in MATERIALS),
    }
    # Rounded-up full lots may not fit a mostly full warehouse. Preserve the
    # material remainder for the existing one-unit purchase fallback.
    for mat in MATERIALS:
        batch_plan[mat]["produced_combined_fits_current_storage"] = batch_plan[mat]["produced"] <= storage
    return production, batch_plan, funding


def capacity_level(capacity, amount, current_level):
    return next(n for n in range(current_level, 26) if capacity(n) >= amount)


def preparation_upgrades(facilities, tech, funding, production):
    """Each gate upgrade must fit the previous cap even with store-bought inputs."""
    target_vault = max(funding["minimum_research_vault_level"], funding["minimum_building_vault_level"])
    target_warehouse = funding["minimum_research_warehouse_level"]
    current_vault = facilities["vault"]
    current_warehouse = facilities["warehouse"]
    cap = lambda n: effect.vault_capacity(n, tech.get("ops-finance", 0))
    wcap = lambda n: effect.material_capacity(n, tech.get("ops-storage", 0))
    steps = []
    for identifier, levels in (
        ("vault", range(current_vault + 1, target_vault + 1)),
        ("warehouse", range(current_warehouse + 1, target_warehouse + 1)),
    ):
        for level in levels:
            row = followup.construction_actual(
                building.upgrade(identifier, level), admin_level=facilities["admin"],
                construction_rank=tech.get("ops-construction", 0),
                building_budget=tech.get("ops-building-budget", 0),
                material_rank=tech.get("ops-materials", 0), target_level=level,
            )
            with_bought_inputs = row["gold"] + sum(row[m] * production[m]["purchase_gold"] for m in MATERIALS)
            assert with_bought_inputs <= cap(current_vault)
            assert max(row[m] for m in MATERIALS) <= wcap(current_warehouse)
            if identifier == "vault":
                current_vault = level
            else:
                current_warehouse = level
            steps.append({
                "id": identifier, "level": level, "seconds": row["seconds"], "gold": row["gold"],
                "wood": row["wood"], "stone": row["stone"], "metal": row["metal"],
                "gold_with_bought_inputs": with_bought_inputs, "vault_capacity_after": cap(current_vault),
                "material_capacity_after": wcap(current_warehouse),
            })
    return steps


def check_snapshot_funding(facilities, tech, funding):
    # A prior investment must be possible at the stated cap levels even without
    # the current discount. This checks individual inputs, not elapsed history.
    for identifier, top in facilities.items():
        for rank in range(1, top + 1):
            row = building_cost(identifier, rank)
            assert row["gold"] <= funding["vault_capacity"], (identifier, rank, "existing building cash")
            assert max(row[m] for m in MATERIALS) <= funding["material_capacity"], (identifier, rank, "existing building goods")
    for identifier, top in tech.items():
        for rank in range(1, top + 1):
            row = research.base_cost(identifier, rank)
            assert row["gold"] <= funding["vault_capacity"], (identifier, rank, "existing research cash")
            assert max(row[m] for m in MATERIALS) <= funding["material_capacity"], (identifier, rank, "existing research goods")


def run():
    species, _, _ = acquisition.catalogue()
    routes = {row["species_id"]: row for row in acquisition.acquisition_rows()}
    growth = {row["park_level"]: row for row in progression.level_rows()}
    eggs, materials = acquisition.egg_targets(), followup.material_missions()
    staff = {role + "s": max(int(row["count"]) for row in building.table("staff")
                            if row["role"] == role and not (int(row["gold"]) or int(row["diamond"])))
             for role in ("builder", "researcher")}
    staff.update({f"parallel_{role}_left": staff[role] - 1 for role in ("builders", "researchers")})
    checkpoints = []
    for park, scenario in SCENARIOS.items():
        buildings = scenario["buildings"]
        field_type, field_id = scenario["field_goal"]
        raw_mission = (eggs if field_type == "egg" else materials)[field_id]
        selected = {**scenario["tech"], "care-nutrition": 2,
                    "gene-study-budget": scenario["allow_benefits"], "gene-study-protocol": scenario["allow_benefits"]}
        tech = completed_research(park, scenario, routes, raw_mission, {k: v for k, v in selected.items() if v})
        bcost, rcost, scout = work_goals(scenario, raw_mission, species, tech)
        story_exhibit_goal = None
        scouts = [scout]
        if park == 25:
            egg = eggs[scenario["story_exhibit_goal"]]
            assert egg["species"] in progression.story_requirements("chapter-4")["exhibition_any_of"]
            assert all(tech.get(name, 0) >= rank for _, name, rank in refs_to_events([egg["research"]]))
            story_exhibit_goal = field_goal(egg, buildings, species, tech, scenario["research_goal"])
            scouts.append(story_exhibit_goal)
        production, batch_plan, funding = resources(buildings, tech, bcost, rcost, scouts, len(scenario["exhibits"]))
        check_snapshot_funding(buildings, tech, funding)
        funding["prerequisite_upgrades"] = preparation_upgrades(buildings, tech, funding, production)
        if park == 35:
            level10 = effect.material_capacity(10, tech.get("ops-storage", 0))
            funding["warehouse_10_sensitivity"] = {
                "capacity": level10,
                "deep_expedition_alone_fits": level10 >= max(rcost[m] for m in MATERIALS),
                "minimum_warehouse_level_for_research": capacity_level(
                    lambda level: effect.material_capacity(level, tech.get("ops-storage", 0)),
                    max(rcost[m] for m in MATERIALS), 10),
            }
        profile = income_profile(scenario, species, routes, tech)
        intervals = profile.pop("intervals")
        vault = funding["vault_capacity"]
        admissions = {**profile, **account_day(intervals, vault, 0),
                      "half_full_start": account_day(intervals, vault, vault // 2),
                      "full_start": account_day(intervals, vault, vault)}
        # Against the same day with headroom, express a workload equivalent.
        # Material starts, receipts and expenses would alter the actual timeline.
        expected_daily = account_day(intervals, 10**12, 0)["net_gold"]
        net_after_feed = expected_daily - batch_plan["feed"]["gold"]
        funding["daily_feed_units"] = batch_plan["feed"]["needed"]
        funding["daily_feed_production_gold"] = batch_plan["feed"]["gold"]
        funding["net_day_after_feed_with_headroom"] = net_after_feed
        funding["gold_budget_operating_days"] = round(funding["together_produced_gold"] / net_after_feed, 2)
        if park in growth:
            row, prior = growth[park], growth[park - 1]
            target = int(row["source"]["operation"].split(":")[1])
            prev = int(prior["source"]["operation"].split(":")[1])
            if park == 25:
                assert row["source"]["field"] == "story:chapter-4"
                bridge = progression.story_requirements("chapter-4")
                assert f"{rcost['id']}:{rcost['level']}" in bridge["research_refs"]
                assert scout["id"] in bridge["mission_refs"]
            else:
                assert f"building:{bcost['id']}:{bcost['level']}" in row["source"]["facility"]
                assert f"research:{rcost['id']}:{rcost['level']}" in row["source"]["research"]
            growth_goal = {
                "next_park": row["next_park_level"], "xp": row["new_xp"],
                "target_paid_admissions": target, "extra_from_prior_target": target - prev,
                "new_paid_in_one_sample_day": admissions["paid_admissions"],
                "xp_conditions": {kind: row["source"][kind] for kind in ("facility", "research", "field")},
                "additional_story_prep": park == 25,
            }
        else:
            growth_goal = {"next_park": None, "xp": 0}
        checkpoints.append({
            "park": park, "story": scenario["story"], "buildings": buildings,
            "species": {i: {"name": species[i]["nameKo"], "habitat": h} for i, h in scenario["exhibits"].items()},
            "unexhibited": [species[i]["nameKo"] for i in scenario.get("unexhibited", ())],
            "research_levels": tech, "admissions": admissions, "production": production,
            "building_goal": bcost, "research_goal": rcost, "field_goal": scout,
            "story_exhibit_goal": story_exhibit_goal, "batch_plan": batch_plan,
            "funding": funding, "staff": staff, "growth_goal": growth_goal,
        })
    return {"assumptions": ASSUMPTIONS, "checkpoints": checkpoints}


if __name__ == "__main__":
    print(json.dumps(run(), ensure_ascii=False, indent=2))
