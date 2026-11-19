"""Read follow-up planning tables; this module never configures the running game."""
from __future__ import annotations
import json
import sys
from fractions import Fraction as F
from pathlib import Path
sys.dont_write_bytecode = True
import research_effect_model_v06 as effect

ROOT = Path(__file__).resolve().parents[2]
building = effect.building
BALANCE = ROOT / 'docs/current/balance.md'
DNA = ROOT / 'docs/current/dna-and-collection.md'
HOUSING = ROOT / 'docs/current/buildings.md'


def rows(path, namespace, name):
    return effect.marked_table(path.read_text(), namespace, name)


def keyed(path, namespace, name, key='id'):
    data = rows(path, namespace, name)
    result = {r[key]: r for r in data}
    assert len(data) == len(result), (path, name, 'duplicate keys')
    return result


LAND = keyed(BALANCE, 'plan', 'land-expansions', 'stage')
SPECIAL = keyed(BALANCE, 'plan', 'special-construction')
SPECIAL_CAPACITY = keyed(BALANCE, 'plan', 'special-capacity')
FEES = keyed(BALANCE, 'plan', 'expedition-fees', 'mission')
BASIC = keyed(BALANCE, 'plan', 'basic-repeat-missions', 'mission')
PLAY = keyed(ROOT / 'docs/current/exploration-play.md', 'play', 'profiles')
BANDS = keyed(BALANCE, 'plan', 'natural-expedition-bands', 'rarity')
AREAS = keyed(BALANCE, 'plan', 'natural-target-areas', 'mission')
PLANNED = keyed(DNA, 'dna', 'planned-species')
RECIPES = keyed(DNA, 'dna', 'followup-recipes')
VARIANTS = keyed(DNA, 'dna', 'variant-recipes')
PUBLIC_COMPLETION = keyed(DNA, 'dna', 'public-recipe-completion')
PARENT_TARGETS = keyed(DNA, 'dna', 'parent-targets', 'mission_id')
RETURN_TARGETS = keyed(DNA, 'dna', 'starter-return-targets', 'mission_id')
HOUSES = keyed(HOUSING, 'housing', 'species')


def catalogue():
    raw, provenance = effect.catalog_data()
    actual = {d['id']: dict(d) for d in raw['species']}
    planned = {k: {**r, 'nameKo': r['name'], 'habitats': json.loads(r['habitats']),
                   'origin': 'natural', 'planned_only': True,
                   **{key: int(r[key]) for key in ['popularity', 'upkeep', 'hatch_seconds']}}
               for k, r in PLANNED.items()}
    assert set(actual).isdisjoint(planned)
    return {**actual, **planned}, actual, provenance


def required_lab(requirement):
    node, rank = requirement.rsplit(':', 1)
    return effect.cost.base_cost(node, int(rank))['required_lab']


def special_capacity(identifier, level):
    anchors = {n: F(SPECIAL_CAPACITY[identifier][f'L{n}']) for n in building.ANCHORS}
    if level in anchors:
        return int(anchors[level])
    low = max(n for n in anchors if n < level)
    high = min(n for n in anchors if n > level)
    return int(anchors[low] + (anchors[high] - anchors[low]) * F(level-low, high-low))


def special_upgrade(identifier, level):
    assert identifier in SPECIAL and 1 <= level <= 25
    definition = SPECIAL[identifier]
    profile = building.PROFILE[definition['profile']]
    if level == 1:
        row = {k: int(definition[k]) for k in ['gold', 'wood', 'stone', 'metal', 'seconds', 'upkeep', 'park']}
    else:
        factor = ((1 + building.P['material_level_growth'] * (level-2)) *
                  (1 + building.P['material_milestone_growth'] * (level//5)))
        row = {'gold': building.ceil(F(profile['gold2']) * F(building.LEVEL[level]['gold_factor']), 50),
               'seconds': (int(F(profile['final_days']) * 86400) if level == 25 else
                           building.ceil(F(building.LEVEL[level]['seconds']) * F(profile['time_factor']), 15)),
               'upkeep': building.ceil(F(definition['upkeep']) * (1 + building.P['upkeep_growth'] * (level-1))),
               'park': int(definition['park'])}
        for material in ['wood', 'stone', 'metal']:
            row[material] = (0 if material == 'metal' and level < int(profile['metal_from']) else
                             building.ceil(F(profile[material+'2']) * factor))
    return {**row, 'level': level, 'capacity': special_capacity(identifier, level),
            'care_reduction_percent': F(level-1), 'after_hero': True}


def construction_actual(row, admin_level=0, construction_rank=0, building_budget=0,
                        material_rank=0, *, target_level=1, land=False):
    result = dict(row)
    admin = F(0) if not admin_level else building.primary('admin', admin_level) / 100
    result['seconds'] = building.ceil(F(row['seconds']) * (1-admin) *
                                     (1-effect.ratio('ops-construction', construction_rank)), 15)
    if target_level == 25 and not land:
        result['seconds'] = max(int(building.P['final_upgrade_min_seconds']), result['seconds'])
    if not land:
        result['gold'] = max(1, building.ceil(F(row['gold']) * (1-effect.ratio('ops-building-budget', building_budget)))) if row['gold'] else 0
        for key in ['wood', 'stone', 'metal']:
            result[key] = max(1, building.ceil(F(row[key]) * (1-effect.ratio('ops-materials', material_rank)))) if row[key] else 0
    return result


def land_actual(stage, **discounts):
    row = LAND[str(stage)]
    return construction_actual({k: int(row[k]) for k in ['gold', 'wood', 'stone', 'metal', 'seconds']},
                               land=True, **discounts)


def material_missions():
    result = {}
    for node, rank, p in effect.permissions():
        if p['kind'] != 'mission_permission':
            continue
        fee = FEES[p['id']]
        result[p['id']] = {**p, 'gold': int(fee['gold']), 'play': fee['play'],
                           'checks': p['manual_successful_checks'], 'fuel': p['base_fuel'],
                           'research': f'{node}:{rank}', 'source_type': 'research_effect'}
    for identifier, row in BASIC.items():
        if row['reward_ref'] != '-':
            base = effect.REGISTRY[row['reward_ref']]['availability']['preserved_base_access']
            reward, fuel = base['reward'], base['fuel']
        else:
            reward = {k: int(row[k]) if k != 'material' else row[k] for k in ['material', 'quality', 'quantity']}
            fuel = int(row['fuel'])
        result[identifier] = {'id': identifier, 'area_id': row['area'], 'gold': int(row['gold']),
                              'reward': reward, 'fuel': fuel, 'checks': int(row['checks']),
                              'play': row['play'], 'research': row['gate'], 'source_type': 'basic'}
    return result


def egg_targets():
    species, _, _ = catalogue()
    result = {}
    for node, levels in effect.LEVELS.items():
        for row in levels:
            for b in row['contract'].get('mission_bindings', []):
                identifier = b['mission_permission_id']; sid = b['species_id']
                result[identifier] = {'id': identifier, 'species': sid, 'research': f'{node}:{row["level"]}',
                                      'area': AREAS[identifier]['area'], 'rarity': species[sid]['rarity'],
                                      'additional_parent': False}
    for identifier, row in PARENT_TARGETS.items():
        sid = row['species']
        result[identifier] = {'id': identifier, 'species': sid, 'research': row['required_research'],
                              'area': row['area'], 'rarity': species[sid]['rarity'], 'additional_parent': True}
    for identifier, row in RETURN_TARGETS.items():
        sid = row['species']
        result[identifier] = {'id': identifier, 'species': sid, 'research': row['gate'],
                              'area': row['area'], 'rarity': species[sid]['rarity'],
                              'additional_parent': False, 'starter_return': True}
    for row in result.values():
        band = BANDS[row['rarity']]
        row.update({k: int(band[k]) for k in ['gold', 'fuel', 'checks', 'hatch_seconds', 'hatch_gold']})
        row['reward_eggs'] = 1
    return result


def recipe_data():
    result = {k: {**r, 'parents': json.loads(r['parents']),
                  **{n: int(r[n]) for n in ['quality', 'dna', 'catalyst', 'culture', 'mutation_cell', 'gold', 'seconds']}}
              for k, r in {**RECIPES, **VARIANTS}.items()}
    # Only the previously missing gold/time are new here. Public ingredients and
    # parents remain game-data's already approved recipe, independently checked.
    raw, _ = effect.catalog_data()
    for identifier, row in PUBLIC_COMPLETION.items():
        original = next(r for r in raw['recipes'] if r['id'] == identifier)
        result[identifier] = {'id': identifier, 'name': '인도미누스 렉스', 'rarity': 'legendary',
                              'parents': original['parentSpeciesIds'], 'quality': 3,
                              'required_research': 'gene-analysis:3', 'mutation_cell': 0,
                              **{x['material']: x['amount'] for x in original['ingredients']},
                              'gold': int(row['gold']), 'seconds': int(row['seconds'])}
    return result


def synthesis_actual(identifier, budget_rank=0, dna_rank=0, legendary_rank=0, lab_level=1, culture_rank=0):
    recipe = recipe_data()[identifier]
    extra = (F(10, 100) if identifier in {'indominus-rex-maximus', 'megalodon-rex'} and legendary_rank == 3 else F(0))
    reduction = min(F(30, 100), effect.ratio('gene-dna-quantification', dna_rank) + extra)
    return {**recipe, 'gold': max(1, building.ceil(recipe['gold'] * (1-effect.ratio('gene-synthesis-budget', budget_rank)))),
            'dna': max(1, building.ceil(recipe['dna'] * (1-reduction))),
            'seconds': building.ceil(recipe['seconds'] * (1-building.primary('lab', lab_level)/100) *
                                     (1-effect.ratio('gene-culture', culture_rank)))}


def expected_attempts(rarity):
    p, limit = (F(1, 2), 5) if rarity == 'epic' else (F(3, 10), 8)
    return sum((1-p)**n for n in range(limit))
