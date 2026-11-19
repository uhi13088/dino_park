#!/usr/bin/env python3
"""Independently check follow-up design definitions and arithmetic.

This does not run the game, mutate accounts, validate geometry/concurrency,
measure fun, or prove resource income, laboratory reach dates or calendar time.
Run: python3 -B docs/models/check_followup_content_v06.py
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
import followup_content_model_v06 as model

ROOT = model.ROOT
OUTPUT = ROOT / 'tmp/preview/followup-content-v06-check.json'
COST_252_SHA256 = 'c7a7d19e208556cbcd3d9adccf9811e1c8ad726b7c655d3cd42fb187e81bc7c9'
SCALAR_14_SHA256 = '0735f5dbdd92b9df361a8aa885ade422fe38e8a8edf2e8a2e06e7316d30ba7f2'
MISSION_41_SHA256 = '961aa22b0c4600928a63c24e89deaff06a669c1770bf27cc13d16fc72b3b9fc1'
MISSION_FIELDS = ['id', 'area_id', 'primary_research', 'required_region_permissions',
                  'required_additional_technology', 'reward', 'base_fuel', 'manual_successful_checks']
AREA_MATERIAL = {'fossil-valley': 'dna', 'primal-swamp': 'culture', 'abandoned-lab': 'catalyst',
                 'mineral-cave': 'stabilizer', 'mutation-crater': 'mutation_cell'}
MATERIALS = ['wood', 'stone', 'metal']
MANAGED_HERBIVORES = {'stegoceratops', 'ankylodocus', 'parasaurolophus-lux'}


def ceil(value, quantum=1):
    ratio = F(value) / quantum
    return -(-ratio.numerator // ratio.denominator) * quantum


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def raw_table(path, namespace, name):
    text = path.read_text()
    opening, closing = f'<!-- {namespace}:{name} -->', f'<!-- /{namespace}:{name} -->'
    assert text.count(opening) == text.count(closing) == 1
    return '\n'.join(line for line in text.split(opening)[1].split(closing)[0].splitlines()
                     if line.startswith('|')) + '\n'


def table(path, namespace, name):
    return model.effect.marked_table(path.read_text(), namespace, name)


def origin(species):
    return species.get('origin') or ('hybrid' if species['category'] == 'hybrid' else 'natural')


def optional_json(path):
    return json.loads(path.read_text()) if path.exists() else None


def preserved_inputs():
    costs = model.effect.cost.all_costs()
    assert len(costs) == 252 and digest(costs) == COST_252_SHA256
    snapshot_path = ROOT / 'tmp/preview/plan09c-before.json'
    before = optional_json(snapshot_path)
    if before is not None:
        assert costs == before['research_costs']
    archive = ROOT / 'docs/archive/0.5/balance.md'
    old_tables = ['params', 'construction', 'profiles', 'effects', 'levels', 'exceptions', 'production', 'missions']
    for name in old_tables:
        assert table(archive, 'plan', name) == table(model.BALANCE, 'plan', name), (name, 'preserved building/first mission table changed')
    assert len(model.building.BUILD) == 21
    old_rows = [model.building.upgrade(bid, level) for bid in model.building.BUILD for level in range(1, 26)]
    assert len(old_rows) == 525
    assert hashlib.sha256(raw_table(ROOT / 'docs/current/research-trees.md', 'tech', 'effects').encode()).hexdigest() == SCALAR_14_SHA256
    missions = [p for _node, _rank, p in model.effect.permissions() if p['kind'] == 'mission_permission']
    reward_contracts = sorted([{k: p.get(k) for k in MISSION_FIELDS} for p in missions], key=lambda p: p['id'])
    assert len(reward_contracts) == 41 and digest(reward_contracts) == MISSION_41_SHA256
    old_exp = optional_json(Path('/tmp/plan09b-exp-effects.json'))
    if old_exp is not None:
        prior = sorted([{k: p.get(k) for k in MISSION_FIELDS} for node in old_exp for rank in node['levels']
                        for p in rank.get('permissions', []) if p['kind'] == 'mission_permission'], key=lambda p: p['id'])
        assert reward_contracts == prior
    # Preserve the three fully priced public rows; indominus only gains its two missing values.
    current_dna = model.DNA.read_text()
    old_dna = ROOT / 'docs/archive/0.5/dna-and-collection.md'
    public_rows = ['| 스테고케라톱스 ·', '| 스피노랩터 ·', '| 파라 룩스 ·']
    for label in public_rows:
        old = [x for x in old_dna.read_text().splitlines() if x.startswith(label)]
        new = [x for x in current_dna.splitlines() if x.startswith(label)]
        # GUIDE-04 moved this migration note from the recipe cell to section9;
        # keep every parent/material/price/time/gate character under comparison.
        note='; 기존 유전자센터 해금 권한 보존 이관'
        assert len(old) == len(new) == 1 and [v.replace(note,'') for v in old] == [v.replace(note,'') for v in new], (label, 'public recipe regression')
        if note in old[0]:assert '이미 얻은 권한은 보존' in current_dna
    return {'research_costs': 252, 'research_cost_digest': digest(costs), 'building_tables': len(old_tables),
            'old_building_rows': len(old_rows), 'first_missions': 7, 'scalar_effects': 14,
            'research_material_missions': 41, 'snapshot_comparison_performed': before is not None,
            'staged_mission_contract_comparison_performed': old_exp is not None}


def check_construction(catalog):
    assert set(model.LAND) == {str(n) for n in range(1, 6)}
    assert set(model.SPECIAL) == set(model.SPECIAL_CAPACITY) == {'desert', 'volcanic', 'glacier', 'aerial', 'marine'}
    actual_buildings, _ = model.building.source_catalog()
    buildings = {x['id']: x for x in actual_buildings['buildings']}
    purchase = {r['material']: int(r['buy']) for r in model.building.PROD.values()}
    land_cases = 0
    for stage, expected_width in enumerate([24, 28, 32, 36, 40], 1):
        raw = model.LAND[str(stage)]
        assert int(raw['width']) == expected_width and raw['research'] == f'ops-land:{stage}'
        assert model.effect.value('ops-land', stage) == expected_width
        bill = {k: int(raw[k]) for k in ['gold', *MATERIALS, 'seconds']}
        assert all(v >= 0 for v in bill.values()) and bill['gold'] > 0 and bill['seconds'] > 0
        assert bill['gold'] + sum(bill[k] * purchase[k] for k in MATERIALS) <= model.building.primary('vault', 25)
        assert max(bill[k] for k in MATERIALS) <= model.building.primary('warehouse', 25)
        for admin, construction, budget, material in itertools.product([0, 5, 25], [0, 1, 3], [0, 3], [0, 5]):
            actual = model.land_actual(stage, admin_level=admin, construction_rank=construction,
                                       building_budget=budget, material_rank=material)
            factor = (1 - (model.building.primary('admin', admin) / 100 if admin else 0)) * (1-model.effect.value('ops-construction', construction)/100)
            assert actual['seconds'] == ceil(bill['seconds'] * factor, 15)
            assert all(actual[k] == bill[k] for k in ['gold', *MATERIALS])
            assert 0 < actual['seconds'] <= bill['seconds'] < 7*86400
            land_cases += 1
        if stage > 1:
            before = model.LAND[str(stage-1)]
            assert all(int(before[k]) <= int(raw[k]) for k in ['gold', *MATERIALS, 'seconds'])
    proposed = optional_json(Path('/tmp/plan09c-land-facilities.json'))
    if proposed:
        for row in proposed['land_expansions']:
            current = model.LAND[str(row['stage'])]
            assert int(current['width']) == row['target_width']
            assert all(int(current[k]) == value for k, value in row['cost'].items())
    special_rows = []
    special_cases = 0
    for identifier, definition in model.SPECIAL.items():
        cat = buildings[definition['catalog']]
        assert int(definition['gold']) == cat['unlockCondition']['cost']['gold']
        assert int(definition['upkeep']) == cat['baseStats']['maintenanceCost']
        assert int(model.SPECIAL_CAPACITY[identifier]['L1']) == cat['baseStats']['capacity']
        assert [int(definition[k]) for k in ['width', 'height']] == [cat['size']['width'], cat['size']['height']]
        assert int(definition['slots']) == 9 and int(definition['width']) * int(definition['height']) >= 9
        assert definition['research'] in {f'{n}:1' for n in ['care-desert', 'care-volcanic', 'care-glacier', 'care-aerial', 'care-marine']}
        profile = model.building.PROFILE[definition['profile']]
        anchors = model.SPECIAL_CAPACITY[identifier]
        previous = None
        for level in range(1, 26):
            row = model.special_upgrade(identifier, level)
            assert row['after_hero'] is True
            if level == 1:
                expected = {k: int(definition[k]) for k in ['gold', *MATERIALS, 'seconds', 'upkeep']}
            else:
                factor = (1+F(1,4)*(level-2)) * (1+F(3,10)*(level//5))
                expected = {'gold': ceil(F(profile['gold2']) * F(model.building.LEVEL[level]['gold_factor']), 50),
                            'seconds': int(F(profile['final_days'])*86400) if level == 25 else ceil(F(model.building.LEVEL[level]['seconds'])*F(profile['time_factor']), 15),
                            'upkeep': ceil(F(definition['upkeep'])*(1+F(2,25)*(level-1)))}
                for key in MATERIALS:
                    expected[key] = 0 if key == 'metal' and level < int(profile['metal_from']) else ceil(F(profile[key+'2']) * factor)
            assert all(row[k] == v for k, v in expected.items()), (identifier, level, 'cost/time formula')
            if level in model.building.ANCHORS:
                expected_cap = int(anchors[f'L{level}'])
            else:
                lo = max(n for n in model.building.ANCHORS if n < level)
                hi = min(n for n in model.building.ANCHORS if n > level)
                expected_cap = int(F(anchors[f'L{lo}']) + (F(anchors[f'L{hi}'])-F(anchors[f'L{lo}']))*F(level-lo, hi-lo))
            assert row['capacity'] == expected_cap and 1 <= expected_cap <= 9
            assert row['care_reduction_percent'] == level-1 <= 24
            assert row['gold'] + sum(row[k]*purchase[k] for k in MATERIALS) <= model.building.primary('vault', 25)
            assert max(row[k] for k in MATERIALS) <= model.building.primary('warehouse', 25)
            if previous is not None and level >= 3:
                assert all(previous[k] <= row[k] for k in ['gold', *MATERIALS, 'seconds', 'upkeep', 'capacity'])
            previous = row
            for admin, construction, budget, material in itertools.product([0, 5, 25], [0, 1, 3], [0, 1, 3], [0, 1, 5]):
                actual = model.construction_actual(row, admin, construction, budget, material, target_level=level)
                factor = (1-(model.building.primary('admin', admin)/100 if admin else 0)) * (1-model.effect.value('ops-construction', construction)/100)
                expected_seconds = ceil(row['seconds']*factor, 15)
                if level == 25:
                    expected_seconds = max(7*86400, expected_seconds)
                    assert actual['seconds'] >= 7*86400
                assert actual['seconds'] == expected_seconds and actual['seconds'] % 15 == 0
                for key, tech in [('gold', 'ops-building-budget'), *[(m, 'ops-materials') for m in MATERIALS]]:
                    rank = budget if key == 'gold' else material
                    expected_fee = max(1, ceil(row[key]*(1-model.effect.value(tech, rank)/100))) if row[key] else 0
                    assert actual[key] == expected_fee
                special_cases += 1
            special_rows.append({'id': identifier, **row})
    assert len(special_rows) == 125
    # Compare every derived proposal row after omitting review-only annotations.
    if proposed:
        index = {(r['id'], r['level']): r for r in special_rows}
        for definition in proposed['special_facilities']:
            for old in definition['level_rows']:
                now = index[definition['plan_id'], old['level']]
                assert all(now[k] == old[k] for k in ['gold', *MATERIALS, 'seconds', 'upkeep', 'capacity', 'care_reduction_percent'])
    return {'land_rows': 5, 'land_discount_cases': land_cases, 'special_rows': 125,
            'special_discount_cases': special_cases,
            'max_special_gold': max(r['gold'] for r in special_rows),
            'max_special_material': max(r[k] for r in special_rows for k in MATERIALS),
            'max_special_base_seconds': max(r['seconds'] for r in special_rows)}


def check_housing(planned, actual):
    assert len(actual) == 81 and len(planned) == len(model.HOUSES) == 83
    assert set(model.PLANNED) == set(planned)-set(actual) == {'sinoceratops', 'megalodon'}
    assert set(model.HOUSES) == set(planned)
    assert Counter(x['size'] for x in actual.values())['giant'] == 28
    assert Counter(x['size'] for x in planned.values())['giant'] == 29
    defaults = {'grassland':'grassland', 'forest':'forest', 'giant-plains':'grassland',
                'wetland':'diet', 'rocky':'forest', 'desert':'desert', 'special':'forest',
                'carnivore-zone':'carnivore', 'forest-isolation':'carnivore', 'raptor-zone':'carnivore',
                'large-carnivore-zone':'carnivore', 'riverside':'carnivore', 'trex-isolation':'carnivore',
                'large-carnivore-isolation':'carnivore', 'special-isolation':'origin-carnivore',
                'aviary':'aerial', 'sky-dome':'aerial', 'marine-connection':'aerial', 'sky-dome-special':'aerial',
                'aquarium':'marine', 'marine-hall':'marine', 'large-marine':'marine',
                'hybrid-zone':'hybrid_herb', 'hybrid-zone-isolation':'hybrid_carn'}
    aliases = set()
    actual_giant_levels = {}
    for rank in [1,2,3]:
        for sid in model.effect.level('care-giant', rank)['unlocks']:
            if sid in actual:
                assert sid not in actual_giant_levels
                actual_giant_levels[sid] = f'care-giant:{rank}'
    assert len(actual_giant_levels) == 28
    for sid, species in planned.items():
        house = model.HOUSES[sid]
        assert house['name'] == species['nameKo'] and house['size'] == species['size'] and house['origin'] == origin(species)
        choices = json.loads(house['alternatives'])
        assert choices and len(choices) == len({(c['facility'], c['min_level']) for c in choices})
        assert all(c['facility'] in set(model.building.BUILD)|set(model.SPECIAL) and 1 <= c['min_level'] <= 25 for c in choices)
        if sid in actual:
            expected = []
            for tag in species['habitat']:
                aliases.add(tag)
                match = re.fullmatch(r'(.*)-lv(\d+)', tag)
                base, minimum = (match[1], int(match[2])) if match else (tag, 1)
                facility = defaults[base]
                if facility == 'diet':
                    facility = 'carnivore' if species['category'] == 'carnivore' else 'grassland'
                if facility == 'origin-carnivore':
                    facility = 'hybrid_carn' if origin(species) == 'hybrid' else 'carnivore'
                if sid == 'gigaspinus':
                    assert tag == 'hybrid-zone-lv18'
                    facility = 'hybrid_carn'
                route = {'facility':facility, 'min_level':minimum}
                if route not in expected:
                    expected.append(route)
            assert choices == expected, (sid, choices, expected)
        expected_giant = actual_giant_levels.get(sid, 'care-giant:3' if sid == 'megalodon' else '-')
        assert house['giant_permission'] == expected_giant
        assert (house['giant_permission'] != '-') == (species['size'] == 'giant')
        if sid in MANAGED_HERBIVORES:
            group, risk = 'managed_herbivore', 0
        elif origin(species) == 'hybrid':
            group, risk = 'hybrid_carnivore', 3
        elif species['category'] == 'herbivore':
            group, risk = 'herbivore', 0
        else:
            group, risk = species['category'], 1
        assert house['group'] == group and int(house['security_points']) == risk, sid
    assert len(aliases) == 36
    assert json.loads(model.HOUSES['sinoceratops']['alternatives']) == [{'facility':'grassland','min_level':1}, {'facility':'forest','min_level':1}]
    assert json.loads(model.HOUSES['megalodon']['alternatives']) == [{'facility':'marine','min_level':1}]
    for sid, row in model.PLANNED.items():
        assert int(row['hatch_seconds']) == int(model.BANDS[row['rarity']]['hatch_seconds'])
        assert planned[sid]['planned_only'] is True and sid not in actual
    body = model.HOUSING.read_text()
    assert 'OR 조건' in body and '고정 호환목록' in body and '별도의 사용자 입력' in body
    return {'actual_species':81, 'planned_species':83, 'planned_additions':2,
            'original_giants':28, 'planned_giants':29, 'old_aliases':36,
            'safety_groups':dict(Counter(r['group'] for r in model.HOUSES.values()))}


def check_missions(planned):
    permissions = [(node, rank, p) for node, rank, p in model.effect.permissions() if p['kind']=='mission_permission']
    assert len(permissions) == len(model.FEES) == 41
    assert {p['id'] for _, _, p in permissions} == set(model.FEES)
    material = model.material_missions()
    assert len(model.BASIC) == 5 and len(material) == 46
    for node, rank, p in permissions:
        row = material[p['id']]
        assert p['primary_research'] == row['research'] == f'{node}:{rank}'
        assert p['required_additional_technology'] == []
        assert row['reward'] == p['reward'] and row['fuel'] == p['base_fuel'] and row['checks'] == p['manual_successful_checks']
        assert p['reward']['material'] == AREA_MATERIAL[p['area_id']]
    for identifier, row in material.items():
        assert row['area_id'] in AREA_MATERIAL and row['reward']['material'] == AREA_MATERIAL[row['area_id']]
        assert row['reward']['quality'] in {1,2,3} and row['reward']['quantity'] >= 1
        assert row['gold'] > 0 and row['fuel'] in {5,10} and row['checks'] in {3,4,5,6}
        assert row['play'] in model.PLAY and 'deadline' not in row
    assert set(model.PLAY) == {'guided','routine','advanced'}
    for row in model.PLAY.values():
        assert 0 < int(row['target_min_seconds']) <= int(row['arithmetic_seconds']) <= int(row['target_max_seconds'])
    basic_mutation = material['mission.mutation-crater.basic-mutation-cell.v1']
    assert basic_mutation['research']=='analysis2_lab5_park15' and basic_mutation['reward']=={'material':'mutation_cell','quality':2,'quantity':1}
    assert all(m['research']=='first_hero' for m in material.values() if m['source_type']=='basic' and m is not basic_mutation)
    eggs = model.egg_targets()
    assert len(model.AREAS) == 42 and len(model.PARENT_TARGETS) == 4 and len(model.RETURN_TARGETS) == 5 and len(eggs) == 51
    binding_ids=[]
    for node, levels in model.effect.LEVELS.items():
        for rank in levels:
            for binding in rank['contract'].get('mission_bindings', []):
                binding_ids.append(binding['mission_permission_id'])
                assert binding['species_id']==binding['reward_species_id'] and binding['first_verified_clear_egg_amount']==1
                egg=eggs[binding['mission_permission_id']]
                assert egg['species']==binding['species_id'] and egg['research']==f'{node}:{rank["level"]}'
    assert len(binding_ids)==len(set(binding_ids))==42 and set(binding_ids)==set(model.AREAS)
    assert set(binding_ids).isdisjoint(model.PARENT_TARGETS)
    for identifier,row in eggs.items():
        assert row['species'] in planned and origin(planned[row['species']])=='natural'
        assert row['area'] in AREA_MATERIAL and row['reward_eggs']==1
        assert row['rarity']==planned[row['species']]['rarity']
        if row.get('starter_return'):
            assert row['research']=='previous_registration' and row['species'] in {'parasaurolophus','iguanodon','triceratops','stegosaurus','velociraptor'}
        else:
            assert row['research'].startswith('gene-') and model.required_lab(row['research'])<=25
        assert all(row[key]==int(model.BANDS[row['rarity']][key]) for key in ['gold','fuel','checks','hatch_seconds','hatch_gold'])
        assert row['hatch_gold']==0 and row['fuel']==5
    staged=optional_json(Path('/tmp/plan09c-exploration.json'))
    if staged:
        assert set(model.FEES)=={r['mission_id'] for r in staged['existing_mission_prices']}
        for row in staged['existing_mission_prices']:
            assert int(model.FEES[row['mission_id']]['gold'])==row['gold']
        for row in staged['natural_price_bands']:
            assert all(int(model.BANDS[row['rarity']][k])==row[k] for k in ['gold','fuel','checks','hatch_seconds','hatch_gold'])
        for row in staged['natural_targets']:
            now=eggs[row['mission_id']]
            assert now['species']==row['species_id'] and now['research']==row['primary_research'] and now['area']==row['display_area']
            assert row['required_additional_technology']==[] and row['extra_expedition_technology'] is None and row['required_housing_for_egg_or_hatch'] is False
    assert {r['species'] for r in model.RETURN_TARGETS.values()}=={'parasaurolophus','iguanodon','triceratops','stegosaurus','velociraptor'}
    assert all(r['gate']=='previous_registration' for r in model.RETURN_TARGETS.values())
    assert set(model.RETURN_TARGETS).isdisjoint(set(binding_ids)|set(model.PARENT_TARGETS))
    assert set(eggs).isdisjoint(material) and len(set(eggs)|set(material))==97
    assert '현재 부모 보유' in model.DNA.read_text() or '현재 보유' in model.DNA.read_text()
    return {'material_research_missions':41, 'basic_material_missions':5, 'all_material_missions':46,
            'natural_egg_targets':42, 'additional_parent_targets':4, 'starter_return_targets':5, 'all_egg_targets':51, 'all_mission_ids':97,
            'material_areas':5, 'first_mutation_cell_base_path_preserved':True,
            'staged_design_comparison_performed':staged is not None}


def check_genetics(planned, raw):
    # Keep the previously approved 10-recipe checks unchanged. The two new
    # one-parent variants have separate coverage in check_dinosaur_acquisition_v06.
    recipes={k:v for k,v in model.recipe_data().items() if k not in model.VARIANTS}
    assert set(raw['materials'].values())==set(AREA_MATERIAL.values())
    assert {v for v in raw['qualities'].values() if isinstance(v,int)}=={1,2,3}
    assert raw['rules']['epic']=={'successRate':0.5,'guaranteedAttempt':5}
    assert raw['rules']['legendary']=={'successRate':0.3,'guaranteedAttempt':8}
    assert len(model.RECIPES)==9 and len(model.PUBLIC_COMPLETION)==1 and len(recipes)==10
    assert set(model.RECIPES)<=set(planned)
    approved_parents={'allosinosaurus':['allosaurus','sinoceratops'],
                      'megalodon-rex':['mosasaurus','megalodon','tyrannosaurus-rex'],
                      'scorpios-rex':['carnotaurus','dilophosaurus'],
                      'azhdarcho-magnus':['quetzalcoatlus','hatzegopteryx']}
    for sid,parents in approved_parents.items():
        assert recipes[sid]['parents']==parents
    assert {r['species'] for r in model.PARENT_TARGETS.values()}=={'sinoceratops','megalodon','quetzalcoatlus','hatzegopteryx'}
    seen,active=set(),set()
    def visit(identifier):
        assert identifier not in active, (identifier,'parent recipe cycle')
        if identifier in seen:return
        active.add(identifier)
        for parent in recipes[identifier]['parents']:
            assert parent in planned and parent!=identifier
            if parent in recipes:visit(parent)
        active.remove(identifier);seen.add(identifier)
    for identifier in recipes:visit(identifier)
    for identifier,row in recipes.items():
        assert row['rarity']==planned[identifier]['rarity'] and row['rarity'] in {'epic','legendary'}
        assert len(row['parents']) in {2,3} and len(row['parents'])==len(set(row['parents']))
        assert row['quality']==(2 if row['rarity']=='epic' else 3)
        assert all(row[k]>0 for k in ['gold','seconds','dna','catalyst','culture']) and row['mutation_cell']==0
        assert model.required_lab(row['required_research'])<=25
        assert row['gold']<=model.building.primary('vault',25)
    public={r['id']:r for r in raw['recipes']}
    assert set(public)=={'stegoceratops','spinoraptor','parasaurolophus-lux','indominus-rex'}
    first=public['stegoceratops']
    assert first['goldCost']==4000 and first['durationMs']==1800000 and first['firstSynthesisRule']=={'successRate':1,'guaranteedAttempt':1}
    assert {r['material']:(r['quality'],r['amount']) for r in first['ingredients']}=={'dna':(2,20),'catalyst':(2,1),'culture':(2,2)}
    indom=recipes['indominus-rex'];original=public['indominus-rex']
    assert indom['parents']==original['parentSpeciesIds'] and indom['quality']==3
    assert all(indom[i['material']]==i['amount'] and i['quality']==3 for i in original['ingredients'])
    staged=optional_json(Path('/tmp/plan09c-genetics.json'))
    if staged:
        for old in staged['recipes']:
            now=recipes[old['id']]
            assert now['parents']==old['parent_species_ids'] and now['required_research']==old['required_recipe_permission']
            assert now['gold']==old['gold'] and now['seconds']==old['seconds']
            assert all(now[i['material']]==i['amount'] and now['quality']==i['quality'] for i in old['ingredients'])
    cases=refund_cases=0
    for identifier,row in recipes.items():
        for budget,dna_rank,legendary,lab,culture in itertools.product(range(6),range(6),range(4),[1,10,25],[0,2,5]):
            actual=model.synthesis_actual(identifier,budget,dna_rank,legendary,lab,culture)
            percent=min(F(3,10), model.effect.value('gene-dna-quantification',dna_rank)/100 + (F(1,10) if legendary==3 and identifier in {'indominus-rex-maximus','megalodon-rex'} else F(0)))
            assert actual['dna']==max(1,ceil(row['dna']*(1-percent)))
            assert actual['gold']==max(1,ceil(row['gold']*(1-model.effect.value('gene-synthesis-budget',budget)/100)))
            assert actual['seconds']==ceil(row['seconds']*(1-model.building.primary('lab',lab)/100)*(1-model.effect.value('gene-culture',culture)/100))
            assert actual['parents']==row['parents'] and all(actual[k]==row[k] for k in ['quality','catalyst','culture','mutation_cell'])
            for preservation,stabilized,material in itertools.product([80,82,84,86,88,90],[False,True],['dna','catalyst','culture']):
                spent=actual[material]
                refund=model.effect.failure_refund(spent,preservation,stabilized=stabilized)
                expected=spent if stabilized else (spent*preservation)//100
                assert refund==expected and 0<=refund<=spent
                refund_cases+=1
            cases+=1
    for budget,dna_rank,legendary in itertools.product(range(6),range(6),range(4)):
        assert model.effect.synthesis_gold(4000,budget,first=True)==4000
        assert model.effect.synthesis_dna(20,'stegoceratops',dna_rank,legendary,first=True)==20
    for base,dna_rank,legendary in itertools.product([1,2,3],range(6),range(4)):
        for identifier in recipes:
            paid=model.effect.synthesis_dna(base,identifier,dna_rank,legendary)
            percent=min(F(3,10),model.effect.value('gene-dna-quantification',dna_rank)/100+(F(1,10) if legendary==3 and identifier in {'indominus-rex-maximus','megalodon-rex'} else 0))
            assert paid==max(1,ceil(base*(1-percent))) and paid>=1
    assert model.synthesis_actual('megalodon-rex')['dna']==180>model.building.P['initial_material_capacity']
    pity={}
    for rarity,p,limit in [('epic',F(1,2),5),('legendary',F(3,10),8)]:
        probabilities=[(1-p)**(n-1)*p for n in range(1,limit)]+[(1-p)**(limit-1)]
        expected=sum(n*probability for n,probability in enumerate(probabilities,1))
        assert sum(probabilities)==1 and model.expected_attempts(rarity)==expected
        pity[rarity]={'success_probability':str(p),'guaranteed_attempt':limit,'expected_attempts':str(expected)}
    text=model.DNA.read_text()
    # The unified guide omits historical-version labels. Verify the active
    # holding/exhibition contract; exact parent/price/time checks remain above.
    assert '배치 대기의 부모도 합성에 배정' in text and '원종 개체는 성공·실패 모두 유지' in text
    assert '스피노랩터는 호환 격리 서식지·보안/위험점수 조건' in text
    return {'followup_recipes':9,'public_price_time_completion':1,'all_checked_recipes':10,
            'parent_graph_acyclic':True,'minimum_qualities':[2,3], 'research_material_types':5, 'quality_grades':3, 'minimum_dna_edge_cases':720, 'synthesis_arithmetic_cases':cases,
            'refund_arithmetic_cases':refund_cases,'pity':pity,
            'staged_design_comparison_performed':staged is not None,
            'warehouse_limit_not_applied_to_synthesis_inventory':True}


def validate():
    planned,actual,provenance=model.catalogue()
    raw,_=model.effect.catalog_data()
    results={'preservation':preserved_inputs(), 'construction':check_construction(planned),
             'housing':check_housing(planned,actual), 'missions':check_missions(planned),
             'genetics':check_genetics(planned,raw)}
    sources=[model.BALANCE,model.DNA,model.HOUSING,ROOT/'docs/current/exploration-play.md',
             ROOT/'docs/current/research-trees.md',ROOT/'docs/current/research-effects.md',
             ROOT/'docs/models/followup_content_model_v06.py',Path(__file__).resolve()]
    report={'status':'pass','kind':'canonical planning definitions and independent arithmetic only',
            **results,'catalogue_provenance':provenance,
            'source_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
            'unverified':['Runtime missions, APIs, rewards, database transactions and migrations.',
                          'Actual placement geometry, path routing, gate reservations or atomic transitions.',
                          'Resource income, XP/story availability, real progression scheduling or calendar reach dates.',
                          'Player enjoyment, retention, accessibility and purchased researcher affordability.'],
            'scenario_scope':'Discount combinations are arithmetic inputs, not proof that every rank combination is a reachable account snapshot.'}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'kind':report['kind'],
                      **{k:results[k] for k in ['construction','housing','missions','genetics']}},ensure_ascii=False))
    return report


if __name__=='__main__':
    validate()
