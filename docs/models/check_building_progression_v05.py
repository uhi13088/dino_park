#!/usr/bin/env python3
"""Design arithmetic, not runtime configuration or live gameplay.

Inputs: frozen docs/archive/0.5/balance.md only; built catalog is read to verify preserved
anchors and calculate an explicitly theoretical demand bound.
Run: python3 docs/models/check_building_progression_v05.py [--write]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/archive/0.5/balance.md"
OUTPUT = ROOT / "docs/archive/0.5/building-upgrade-tables.md"
ANCHORS = [1, 5, 10, 15, 20, 25]


def table(name):
    block = SOURCE.read_text().split(f"<!-- plan:{name} -->")[1].split(f"<!-- /plan:{name} -->")[0]
    rows = [[v.strip() for v in line.strip().strip("|").split("|")]
            for line in block.splitlines() if line.startswith("|")]
    return [dict(zip(rows[0], row)) for row in rows[2:]]


P = {row["id"]: F(row["value"]) for row in table("params")}
BUILD = {row["id"]: row for row in table("construction")}
PROFILE = {row["id"]: row for row in table("profiles")}
LEVEL = {int(row["level"]): row for row in table("levels")}
EFFECT = {row["id"]: row for row in table("effects")}
EXCEPT = {(row["id"], int(row["level"])): row for row in table("exceptions")}
PROD = {row["id"]: row for row in table("production")}


def ceil(value, quantum=1):
    value = F(value) / quantum
    return (-(-value.numerator // value.denominator)) * quantum


def interpolate(building, level):
    points = {n: F(EFFECT[building][f"L{n}"]) for n in ANCHORS}
    for (bid, n), row in EXCEPT.items():
        if bid == building:
            points[n] = F(row["effect"])
    if level in points:
        return points[level]
    low = max(n for n in points if n < level)
    high = min(n for n in points if n > level)
    return points[low] + (points[high] - points[low]) * F(level-low, high-low)


def primary(building, level):
    value = interpolate(building, level)
    if EFFECT[building]["kind"].endswith("_percent"):
        return value
    return value.numerator // value.denominator


def active_anchor(building, level):
    eligible = [(n, row) for (bid, n), row in EXCEPT.items() if bid == building and n <= level]
    return max(eligible, key=lambda item: item[0]) if eligible else (1, BUILD[building])


def upgrade(building, level):
    base = BUILD[building]
    prof = PROFILE[building]
    if level == 1:
        result = {k: int(base[k]) for k in ["gold", "wood", "stone", "metal", "seconds", "upkeep", "park"]}
        if building == "grassland":
            result.update(gold=0, wood=0, stone=0, metal=0, seconds=0)
    elif (building, level) in EXCEPT:
        result = {k: int(EXCEPT[building, level][k]) for k in ["gold", "wood", "stone", "metal", "seconds", "upkeep", "park"]}
    else:
        anchor_level, anchor = active_anchor(building, level)
        factor = (1 + P["material_level_growth"] * (level-2)) * (1 + P["material_milestone_growth"] * (level//5))
        result = {
            "gold": ceil(primary("vault", level-1) * P["vault_upgrade_ratio"], 50)
                    if building == "vault" else ceil(F(prof["gold2"]) * F(LEVEL[level]["gold_factor"]), 50),
            "seconds": int(F(prof["final_days"])*86400) if level == 25 else
                       max(ceil(F(LEVEL[level]["seconds"]) * F(prof["time_factor"]), 15),
                           int(anchor["seconds"]) if anchor_level > 1 else 0),
            "upkeep": ceil(F(anchor["upkeep"]) * (1 + P["upkeep_growth"] * (level-anchor_level))),
            "park": max(int(base["park"]), 3, int(anchor["park"]) if anchor_level > 1 else 1),
        }
        for material in ["wood", "stone", "metal"]:
            amount = ceil(F(prof[material+"2"]) * factor)
            if material == "metal" and level < int(prof["metal_from"]):
                amount = 0
            result[material] = max(amount, int(anchor[material]) if anchor_level > 1 else 0)
    result["effect"] = primary(building, level)
    result["after_hero"] = bool(int(base["after_hero"]) or result["metal"] or (building == "platform" and level >= 3))
    result["level"] = level
    return result


def effective_seconds(building, level, admin_level):
    """Ordinary construction speed only; do not apply the admin's target level to itself."""
    if building == "admin":
        admin_level = min(admin_level, max(1, level-1))
    reduction = primary("admin", admin_level)/100
    seconds = ceil(upgrade(building, level)["seconds"] * (1-reduction),15)
    return max(int(P["final_upgrade_min_seconds"]),seconds) if level == 25 else seconds


def production(building, level, lots=1):
    recipe = PROD[building]
    quantity = int(P["fuel_batch_base"] + (level-1)*P["fuel_batch_growth"]//24) if building == "fueldepot" else primary(building, level)
    discount = P["production_discount_max"] * F(level-1, 24)
    return {"quantity": quantity*lots, "gold": ceil(quantity * F(recipe["unit_gold"]) * (1-discount))*lots,
            "seconds": int(recipe["seconds"])*lots}


def number(value):
    if isinstance(value, F):
        return str(value.numerator) if value.denominator == 1 else f"{float(value):.2f}".rstrip("0").rstrip(".")
    return str(value)


def effect_text(building, level):
    row = EFFECT[building]
    value = number(primary(building, level))
    kind = row["kind"]
    if kind == "habitat":
        return f"호환 개체 {value}; 상태 악화 {number(P['care_reduction_max']*100*F(level-1,24))}% 완화"
    if kind == "production":
        batch = production(building, level)
        return f"1회 {value}개/{batch['gold']}골드; {int(batch['seconds'])//60}분"
    if kind == "hatching":
        return f"총 {value}자리; 일반 부화 {number(P['incubation_reduction_max']*100*F(level-1,24))}% 단축"
    if kind == "security":
        return f"위험 {value}점; 위험종 유지비 {number(P['security_upkeep_reduction_max']*100*F(level-1,24))}% 완화"
    if kind == "fuel_capacity":
        batch = production(building, level)
        return f"탱크 {value}; 1회 연료{batch['quantity']}/{batch['gold']}골드·10분"
    labels = {"viewing": "관람 정원", "gate": "입구 한도", "warehouse": "일반 종류별 저장",
              "research_percent": "일반 연구 단축%", "construction_percent": "건설 단축%",
              "demand_percent": "방문 수요 증가%", "offline_percent": "오프라인 계수%", "gold_capacity": "전체 골드 한도"}
    return labels[kind] + " " + value


def source_catalog():
    provenance = {}
    for package in ["game-data", "shared"]:
        path = ROOT / "packages" / package / "dist/index.js.map"
        source_map = json.loads(path.read_text())
        for name, content in zip(source_map["sources"], source_map["sourcesContent"]):
            target = (path.parent / (source_map.get("sourceRoot") or "") / name).resolve()
            assert target.read_text() == content, f"Stale package build: {target}"
        provenance[package] = {"matching_sources": len(source_map["sources"])}
    script = "const d=require('./packages/game-data/dist/index.js'); console.log(JSON.stringify({buildings:d.BUILDING_DATA,species:d.DINOSAUR_DATA,first:d.getSynthesisRecipe('stegoceratops')}));"
    catalog = json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True))
    return catalog, provenance


def bank_simulate(seconds, *, balance, capacity, period=F(5), fee_period=F(60), cuts=()):
    """Exact chronological tickets/upkeep; rejected arrivals create no money/debt.

    Constant illustrative demand/fee only, not the server's dynamic care model.
    Segment boundaries do not reset either event stream.
    """
    state = {"balance": balance, "gross": 0, "fees": 0, "paid": 0, "blocked": 0}
    ticket_at, fee_at = period, fee_period
    for stop in [*cuts, seconds]:
        while min(ticket_at, fee_at) <= stop:
            if fee_at <= ticket_at:
                fee = min(1, state["balance"])
                state["balance"] -= fee
                state["fees"] += fee
                fee_at += fee_period
            else:
                if state["balance"] + int(P["ticket"]) <= capacity:
                    state["balance"] += int(P["ticket"])
                    state["gross"] += int(P["ticket"])
                    state["paid"] += 1
                else:
                    state["blocked"] += 1
                ticket_at += period
    return state


def validate():
    catalog, provenance = source_catalog()
    assert BUILD.keys() == PROFILE.keys() == EFFECT.keys() and len(BUILD) == 21
    assert set(LEVEL) == set(range(2, 26))
    assert LEVEL[25]["seconds"] == "-"
    assert P["final_upgrade_min_seconds"] == 7*86400
    assert set(PROD) == {"lumber", "quarry", "metalshop", "feedmill", "fueldepot"}
    buy = {row["material"]: int(row["buy"]) for row in PROD.values()}
    rows, max_material, totals = [], 0, {}
    for bid in BUILD:
        schedule = [upgrade(bid, n) for n in range(1, 26)]
        for row in schedule:
            assert all(isinstance(row[k], int) and row[k] >= 0 for k in ["gold", "wood", "stone", "metal", "seconds", "upkeep"])
            if row["metal"]:
                assert row["after_hero"]
            assert row["seconds"] <= 21*86400
            max_material = max(max_material, row["wood"], row["stone"], row["metal"])
            if EFFECT[bid]["kind"] == "habitat":
                assert row["effect"] <= 9
            rows.append(row)
        for admin_level in range(1,26):
            actual = [effective_seconds(bid,n,admin_level) for n in range(2,26)]
            assert actual[-1] >= P["final_upgrade_min_seconds"], (bid,admin_level,"final below one week")
            assert all(a <= b for a,b in zip(actual,actual[1:])), (bid,admin_level,"discounted time decrease")
        assert schedule[-1]["seconds"] == int(F(PROFILE[bid]["final_days"])*86400)
        for before, after in zip(schedule[1:], schedule[2:]):
            assert after["gold"] >= before["gold"], (bid, after["level"], "gold decrease")
            assert after["seconds"] >= before["seconds"], (bid, after["level"], "time decrease")
            assert after["upkeep"] >= before["upkeep"], (bid, after["level"], "upkeep decrease")
            assert after["park"] >= before["park"], (bid, after["level"], "unlock decrease")
            assert after["effect"] >= before["effect"]
            for key in ["wood", "stone", "metal"]:
                assert after[key] >= before[key], (bid, after["level"], key)
        totals[bid] = {"gold": sum(r["gold"] for r in schedule[1:]),
                       "wood": sum(r["wood"] for r in schedule[1:]),
                       "stone": sum(r["stone"] for r in schedule[1:]),
                       "metal": sum(r["metal"] for r in schedule[1:]),
                       "seconds": sum(r["seconds"] for r in schedule[1:])}
    # No self-lock: a warehouse can hold its next required material, a vault its
    # next upgrade including buying every required construction material.
    for level in range(2, 26):
        vault = upgrade("vault", level)
        total = vault["gold"] + sum(vault[m] * buy[m] for m in ["wood", "stone", "metal"])
        assert total <= primary("vault", level-1), (level, "vault self lock")
        warehouse = upgrade("warehouse", level)
        assert max(warehouse[m] for m in ["wood", "stone", "metal"]) <= primary("warehouse", level-1)
    for bid in PROD:
        for level in range(1, 26):
            batch = production(bid, level, int(P["max_lots"]))
            cap = primary("fueldepot", level) if bid == "fueldepot" else primary("warehouse", 2)
            assert batch["quantity"] <= cap, (bid, level, "unreceivable batch")
            assert F(batch["gold"], batch["quantity"]) < int(PROD[bid]["buy"])
    assert production("lumber",25,3)["quantity"] > P["initial_material_capacity"]
    assert production("lumber",25,3)["quantity"] <= primary("warehouse",2)
    # Anchors already implemented or approved in v0.4 remain literal.
    assert upgrade("platform", 2) == {"gold":3000,"wood":20,"stone":10,"metal":0,"seconds":120,"upkeep":35,"park":3,"effect":40,"after_hero":False,"level":2}
    assert production("lumber", 1) == {"quantity":20,"gold":200,"seconds":300}
    assert production("quarry", 1) == {"quantity":20,"gold":300,"seconds":360}
    assert primary("warehouse", 2) == 400 and primary("hatchery", 1) == 3
    actual = {row["id"]:row for row in catalog["buildings"]}
    assert actual["visitor-viewing-platform"]["baseStats"]["capacity"] == primary("platform",1)
    assert actual["production-lumberyard"]["baseCost"] == int(BUILD["lumber"]["gold"])
    assert actual["production-quarry"]["unlockCondition"]["parkLevel"] == int(BUILD["quarry"]["park"])
    assert primary("grassland",1) == actual["habitat-grassland"]["baseStats"]["capacity"]
    first = catalog["first"]
    # All required initial buildings fit the free Lv.1 vault with purchased materials.
    early = ["platform","hatchery","lab","carnivore","security","hybrid_herb"]
    for bid in early:
        row = upgrade(bid,1)
        assert not row["metal"] and not row["after_hero"]
        assert row["gold"] + sum(row[m]*buy[m] for m in ["wood","stone","metal"]) <= primary("vault",1)
    missions = table("missions")
    # First-loop purchasing arithmetic only: not a schedule, story or live game test.
    first_budget = sum(upgrade(bid,1)["gold"] + sum(upgrade(bid,1)[m]*buy[m] for m in ["wood","stone","metal"]) for bid in early)
    platform2 = upgrade("platform",2)
    first_budget += platform2["gold"] + sum(platform2[m]*buy[m] for m in ["wood","stone","metal"])
    first_budget += sum(int(row["gold"]) for row in missions) + buy["feed"] + first["goldCost"]
    fuel_need = len(missions) * P["fuel_per_mission"]
    assert first_budget == 76400
    assert fuel_need == 35 and P["fuel_base_capacity"] + P["parent_hatch_seconds"]//P["fuel_recharge_seconds"] >= fuel_need
    assert P["quality_upgrade_ratio"]**2 == 9
    assert P["quality_mid_gold"]*P["quality_upgrade_ratio"] + P["quality_high_gold"] == 300
    whole = bank_simulate(7200,balance=24990,capacity=25000)
    split = bank_simulate(7200,balance=24990,capacity=25000,cuts=list(range(37,7200,37)))
    assert whole == split and whole["balance"] <= 25000 and whole["gross"] == whole["paid"] * 20
    full = bank_simulate(600,balance=25000,capacity=25000,fee_period=F(1000000))
    assert full["gross"] == 0 and full["paid"] == 0
    resumed = bank_simulate(5,balance=25000-100,capacity=25000,fee_period=F(1000000))
    assert resumed["gross"] == 20  # one new arrival, no accumulated backlog
    legacy = bank_simulate(600,balance=60000,capacity=25000,fee_period=F(1000000))
    assert legacy["balance"] == 60000 and legacy["gross"] == 0
    # Natural recovery never clips an existing over-cap balance. A ready batch
    # remains outside the spendable tank until the entire quantity fits.
    def recover(stock, cap, units):
        return stock if stock >= cap else min(cap, stock+units)
    assert recover(90,30,1) == 90 and recover(29,30,2) == 30
    assert recover(119,120,2) == 120
    tank, ready, cap = 29, 5, 30
    assert tank+ready > cap
    tank -= int(P["fuel_per_mission"])
    assert tank+ready <= cap
    tank += ready
    assert tank == 29
    # Upper bound uses actual catalog popularity; no claim all species are
    # already obtainable, compatible or simultaneously placed on the map.
    species = catalog["species"]
    demand_bound = 8 + 4*F(135,100)*sum(F(str(s["stats"]["popularity"])) for s in species) + 4*(len(species)-1)
    demand_bound *= 1 + F(primary("foodcourt",25),100)
    planned_capacity = min(primary("gate",25), P["base_capacity"] + P["platform_max_count"]*primary("platform",25) + primary("restroom",25))
    theoretical_gross = min(demand_bound,planned_capacity) * P["ticket"] * 60
    return {"kind":"design arithmetic, not live gameplay or DB concurrency", "rows":len(rows), "buildings":len(BUILD),
            "source_sha256":hashlib.sha256(SOURCE.read_bytes()).hexdigest(),"source_provenance":provenance,
            "checks":{"preserved_early_anchors":True,"monotonic_upgrades":True,"vault_next_upgrade_fits":True,
                      "warehouse_next_upgrade_fits":True,"batch_storage":True,"single_fuel_stock":True,
                      "exact_bank_partition_invariance":True,"no_full_vault_backlog":True,"legacy_overcap_preserved":True,
                      "first_hero_no_high_level_or_metal_gate":True,
                      "single_final_upgrade_min_7_days_after_admin":True,
                      "discounted_times_monotonic":True},
            "max_material_per_upgrade":max_material,"max_upgrade_seconds":max(r["seconds"] for r in rows),
            "totals":totals,"all_upgrade_gold":sum(t["gold"] for t in totals.values()),
            "all_builder_seconds":sum(t["seconds"] for t in totals.values()),
            "catalog_species":len(species),"catalog_demand_upper_per_minute":float(demand_bound),
            "planned_max_capacity":int(planned_capacity),"theoretical_gross_per_hour":float(theoretical_gross),
            "bank_example":whole,
            "first_loop_purchase_budget":first_budget,"first_loop_fuel":int(fuel_need),
            "final_upgrade_minimum_after_admin":min(effective_seconds(bid,25,25) for bid in BUILD),
            "final_timings":{bid:{"base_seconds":upgrade(bid,25)["seconds"],"max_admin_seconds":effective_seconds(bid,25,25)} for bid in BUILD},
            "unverified":["actual late-game play time and fun","full collection and map progression","server/DB concurrency","late recipes and mission rewards"]}


def duration(seconds):
    if seconds == 0:return "즉시"
    if seconds < 60:return f"{seconds}초"
    days, tail = divmod(seconds,86400)
    h, tail = divmod(tail,3600)
    m, s = divmod(tail,60)
    return (f"{days}일 " if days else "") + (f"{h}시간 " if h else "") + (f"{m}분 " if m else "") + (f"{s}초" if s else "")


def render(result):
    text = ["# 주요 건물 25레벨 강화 상세표", "",
            "기준: 기획0.5 · 설계 수치이며 런타임 적용 전 · [밸런스 원천](balance.md) · [역할과 외형](buildings.md)", "",
            "525행은 원천 표에서 자동 생성했다. 각 행의 골드·자재·시간은 그 레벨로 올리는 한 번의 비용이며 누적이 아니다. 시간은 관리사무소 보정 전 기본값, 효과는 완료 후 총값이다. **24→25 한 번의 일반 강화는 관리사무소 보정 뒤에도 최소7일**이다. 금속 행은 첫 영웅 이후다. 같은 부지·단일 재고·수동 수령 규칙은 밸런스 원천을 따른다. 표를 직접 수정하지 않는다.", "",
            "시작 초원·입구·금고Lv.1은 무료 제공이다. 추가 초원은 원천의 건설 비용을 사용한다. 부화장 자리에는 기본 무료 자리가 포함된다. 기본 창고/연료 한도는 각 시설 미건설 상태에도 제공된다.", ""]
    for bid, base in BUILD.items():
        text += [f"## {base['건물']}", "", f"최초 해금 파크Lv.{base['park']}" + ("·첫 영웅 이후" if int(base['after_hero']) else "") + ".", "",
                 "| 목표 Lv. | 골드 | 목재 | 석재 | 금속 | 기본 시간 | 유지비/시간 | 완료 효과 |",
                 "| ---: | ---: | ---: | ---: | ---: | --- | ---: | --- |"]
        for level in range(1,26):
            r=upgrade(bid,level)
            text.append(f"| {level} | {r['gold']:,} | {r['wood']:,} | {r['stone']:,} | {r['metal']:,} | {duration(r['seconds']).strip()} | {r['upkeep']:,} | {effect_text(bid,level)} |")
        t=result["totals"][bid]
        final=result["final_timings"][bid]
        text += ["", f"24→25 한 번: 기본 **{duration(final['base_seconds']).strip()}**, 가능한 최고 관리사무소 보정 후 **{duration(final['max_admin_seconds']).strip()}**. 최소7일 하한 적용; 관리사무소 자신은 직전 완공 레벨의 효과만 적용."]
        text += ["", f"Lv.1→25 강화 누적: **{t['gold']:,}골드 · 목재{t['wood']:,} · 석재{t['stone']:,} · 금속{t['metal']:,} · 기본 타이머 {duration(t['seconds']).strip()}**. 최초 건설 비용은 별도.", ""]
    text += ["## 검산 결과", "", f"21종×25레벨={result['rows']}행. 초반 앵커·단조성·금고/창고 다음 강화·생산/연료 수령·분할 정산·기존 초과분 보존 검사 통과.", "",
             f"21종 전체 Lv.1→25 강화 골드 합은 {result['all_upgrade_gold']:,}, 기본 건설자 점유는 {duration(result['all_builder_seconds']).strip()}이다. 동시 작업·관리사무소 할인·자재/골드 수급·접속 공백을 제외한 산술 합이다. 21시설×관리사무소1~25 모든 조합에서 최종 강화7일 하한과 할인 후 시간 단조성을 검사했다.", "",
             f"기술0 기준으로 현재 카탈로그 {result['catalog_species']}종의 인기도로 계산한 후기 수요 상한은 분당 {result['catalog_demand_upper_per_minute']:.2f}명이다. 계획 입구 한도 {result['planned_max_capacity']}와 수요를 함께 제한한 이론 최대 입장료는 시간당 {result['theoretical_gross_per_hour']:,.0f}골드다. 실제 종 획득·맵 수용/동선·돌봄·금고·유지비·오프라인은 별도 제약이다.", "",
             "후기 수집/실플레이 시간·미션 재미·DB 동시성·새 런타임 이관은 검증하지 않았다. 재현: `python3 docs/models/check_building_progression_v05.py --write`.", ""]
    return "\n".join(text)


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--write",action="store_true")
    args=parser.parse_args()
    result=validate()
    report='<!-- archive-banner -->\n> **기획 0.5 보관본 · 2026-11-16** — 연구 중심 성장/24항목 확장 직전 기록이다. 구현 기준은 [최신 기획](../../current/game-design.md)을 따른다.\n<!-- /archive-banner -->\n\n'+render(result)
    if args.write:
        OUTPUT.write_text(report)
    else:
        assert OUTPUT.exists() and OUTPUT.read_text()==report, "Generated schedule is stale; run --write"
    out=ROOT/"tmp/preview/building-progression-v05-check.json"
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({k:result[k] for k in ["kind","rows","buildings","checks","max_material_per_upgrade","max_upgrade_seconds","all_upgrade_gold","all_builder_seconds","theoretical_gross_per_hour"]},ensure_ascii=False,indent=2))
