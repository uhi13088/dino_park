#!/usr/bin/env python3
"""Check complete acquisition coverage and preserved planning contracts.

Read-only verification. This checks neither game execution nor accounts,
concurrency, mission content quality, drop simulations, or completion dates.
"""
from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter

sys.dont_write_bytecode = True
import dinosaur_acquisition_model_v06 as model
import render_dinosaur_acquisition_v06 as renderer

EGG_51_SHA = '57cfa8be172b08eb68a61dbc176fea61f3b6f6d7c85d599443521b91cdb330ca'
COST_239_SHA = '7cc87501a8d1c36dbe8d35e46f7638eb34f755d360aaaf73f7d973f938bd6491'
# Baseline fingerprint excludes the two approved visitor-operation changes
# verified individually below.
PRESERVED_EFFECT_VALUES_SHA = '9d11bf407dbd5acca09c9175dd9b21d7607dc02df8de79562ea33aeecd3cbbb6'
RECIPES_13_SHA = 'b6de44e4c292dbf2f3d75b4afc285ec76c43179fc575c7643ad1f86aa4f00652'
EXTRA_NATURAL = {
    'dimorphodon', 'rhamphorhynchus', 'anurognathus', 'pteranodon',
    'tapejara', 'tupandactylus', 'dsungaripterus', 'tropeognathus',
    'ichthyosaurus', 'nothosaurus', 'plesiosaurus', 'kronosaurus',
    'elasmosaurus', 'mosasaurus', 'liopleurodon', 'tylosaurus', 'shonisaurus',
}
RECIPE_FIELDS = ['id', 'parents', 'rarity', 'quality', 'dna', 'catalyst',
                 'culture', 'mutation_cell', 'gold', 'seconds']


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':'), default=str).encode()).hexdigest()


def preserved_inputs():
    old = model.followup.egg_targets()
    assert len(old) == 51 and digest(old) == EGG_51_SHA, 'Existing 51 egg goals changed'
    costs = model.followup.effect.cost.all_costs()
    assert len(costs) == 239 and digest(costs) == COST_239_SHA, 'Research cost/time regression'
    effects = model.followup.effect.all_effects()
    assert len(effects) == 69
    values = {key: [{field: row[field] for field in ['level', 'value', 'unit']}
                    for row in value['levels']] for key, value in effects.items()}
    visitor_effects = {
        'ops-flow': ((110, 100, 90), '평균 관람 초'),
        'ops-comfort': ((10, 20, 30), '화장실 이용 인원 증가 %'),
    }
    for identifier, (levels, unit) in visitor_effects.items():
        expected = [{'level': rank, 'value': value, 'unit': unit}
                    for rank, value in enumerate(levels, 1)]
        assert values.pop(identifier) == expected, (identifier, 'Visitor research effect changed')
    assert len(values) == 67 and digest(values) == PRESERVED_EFFECT_VALUES_SHA, 'Preserved research effects changed'
    recipes = {key: {field: row[field] for field in RECIPE_FIELDS}
               for key, row in model.all_recipe_data().items() if key not in model.followup.VARIANTS}
    assert len(recipes) == 13 and digest(recipes) == RECIPES_13_SHA, 'Existing 13 recipe inputs changed'
    repeated = model.repeat_egg_targets()
    assert all(repeated[key] == row for key, row in old.items()), 'Legacy goal was replaced'
    return {'egg_targets_51': EGG_51_SHA, 'research_costs_239': COST_239_SHA,
            'preserved_research_effect_values_67': PRESERVED_EFFECT_VALUES_SHA, 'recipes_13': RECIPES_13_SHA}


def check_coverage():
    species, actual, _ = model.catalogue()
    rows = model.acquisition_rows()
    assert len(rows) == len(species) == len(model.followup.HOUSES) == 83
    assert len(actual) == 83
    ids = [row['species_id'] for row in rows]
    assert len(set(ids)) == 83 and set(ids) == set(species) == set(model.followup.HOUSES)
    assert Counter(row['origin'] for row in rows) == {'natural': 68, 'hybrid': 12, 'variant': 3}
    assert not any(row['planned_only'] for row in rows)
    assert set(model.followup.ADDED_SPECIES) <= set(actual)
    repeats = model.repeat_egg_targets()
    indexed = model.egg_targets()
    natural = {row['species_id'] for row in rows if row['origin'] == 'natural'}
    assert len(repeats) == 68 and Counter(row['species'] for row in repeats.values()) == Counter(natural)
    assert len(indexed) == 69 and set(indexed) - set(repeats) == {'first-target-velociraptor'}
    extra = model.marked('extra-natural-targets')
    assert len(extra) == 17 and {r['species'] for r in extra} == EXTRA_NATURAL
    assert {r['species'] for r in repeats.values() if r.get('supplemental_natural')} == EXTRA_NATURAL
    assert set(model.all_recipe_data()) == {row['species_id'] for row in rows if row['origin'] != 'natural'}
    for row in rows:
        assert row['housing']['id'] == row['species_id']
        for route in [row['first'], row['repeat']]:
            info = renderer.route_info(route)
            assert set(info) == {'method', 'gate', 'cost', 'time', 'parents_materials', 'reward', 'claim_rule'}
            assert all(isinstance(text, str) and text for text in info.values())
    return rows


def check_egg_contracts(rows):
    species, _, _ = model.catalogue()
    indexed = model.egg_targets()
    legacy_species = {row['species'] for row in model.followup.egg_targets().values()}
    assert legacy_species.isdisjoint(EXTRA_NATURAL)
    for identifier, goal in indexed.items():
        assert model.origin(species[goal['species']]) == 'natural'
        band = model.followup.BANDS[goal['rarity']]
        assert goal['rarity'] == species[goal['species']]['rarity']
        assert goal['reward_eggs'] == 1
        assert all(goal[key] == int(band[key]) for key in ['gold', 'checks', 'hatch_seconds', 'hatch_gold'])
        assert goal['hatch_gold'] == 0
        if goal.get('supplemental_natural'):
            assert goal['area'] in {'fossil-valley', 'primal-swamp'}
            requirement = goal['research']
            model.research_requirements(requirement)
            assert requirement.split(':')[0] in {
                'gene-common-carnivore', 'gene-uncommon-carnivore',
                'gene-rare-carnivore', 'gene-epic-natural'}
            own_row = next(row for row in rows if row['species_id'] == goal['species'])
            assert all(own_row['first'][flag] is False for flag in [
                'requires_exhibition', 'requires_giant_permission', 'requires_built_habitat'])
    starters = {row['species_id']: row for row in rows if row['species_id'] in {
        'parasaurolophus', 'iguanodon', 'triceratops', 'stegosaurus', 'velociraptor'}}
    assert starters['parasaurolophus']['first']['reward_individuals'] == 1
    assert starters['parasaurolophus']['first']['reward_eggs'] == 0
    assert starters['parasaurolophus']['first']['gold'] == 0
    for sid, fee, seconds in [('iguanodon', 100, 60), ('triceratops', 250, 3600), ('stegosaurus', 400, 3600)]:
        initial = starters[sid]['first']
        assert (initial['gold'], initial['hatch_seconds']) == (fee, seconds)
        assert initial['reward_eggs'] == 1 and initial['first_only'] is True
        assert starters[sid]['repeat']['gold'] == int(model.followup.BANDS[species[sid]['rarity']]['gold'])
    raptor = starters['velociraptor']
    assert raptor['first']['gate'] == 'safety_goal_completed'
    assert raptor['first']['first_only'] and not raptor['first']['repeatable']
    assert (raptor['first']['gold'], raptor['first']['checks'], raptor['first']['hatch_seconds']) == (1000, 3, 3600)
    assert raptor['first']['extra_park_xp'] == 0 and raptor['repeat']['gate'] == 'previous_registration'
    assert raptor['repeat']['ref'] == 'return-target-velociraptor'
    return {'repeat_goals': 68, 'indexed_goals': 69, 'starter_paths': 5, 'new_first_raptor': 1}


def check_parents_and_protection(rows):
    by_id = {row['species_id']: row for row in rows}
    graph = model.parent_graph()
    visited, visiting = set(), set()
    def visit(sid):
        assert sid in by_id, ('Missing parent acquisition', sid)
        assert sid not in visiting, ('Acquisition cycle', sid)
        if sid in visited:
            return
        visiting.add(sid)
        for parent in graph.get(sid, []):
            assert parent != sid
            visit(parent)
        visiting.remove(sid)
        visited.add(sid)
    for sid in by_id:
        visit(sid)
    assert len(visited) == 83
    assert graph['megalodon-rex'] == ['mosasaurus', 'megalodon', 'tyrannosaurus-rex']
    assert by_id['mosasaurus']['repeat']['gate'] == 'gene-rare-carnivore:1'
    assert by_id['megalodon']['repeat']['ref'] == 'parent-target-megalodon'
    assert graph['allosaurus-maximus'] == ['allosaurus']
    assert graph['nyctosaurus-rex'] == ['pteranodon']
    assert by_id['pteranodon']['repeat']['gate'] == 'gene-uncommon-carnivore:1'
    assert by_id['indominus-rex']['first']['story_completion_ref'] == 'chapter-6'
    assert '선택분기 완료' in by_id['indominus-rex']['first']['story_gate']
    for sid, recipe in model.all_recipe_data().items():
        assert recipe['parents_preserved'] is True
        assert all(parent in by_id for parent in recipe['parents'])
        assert recipe['quality'] == (3 if recipe['rarity'] == 'legendary' else 2)
        assert recipe['gold'] > 0 and recipe['seconds'] > 0
        assert recipe['success_rate'] == (0.1 if recipe['rarity'] == 'legendary' else 0.5)
        assert recipe['guaranteed_attempt'] == (8 if recipe['rarity'] == 'legendary' else 5)
        if sid in model.followup.VARIANTS:
            assert recipe['required_research'] == 'gene-analysis:2'
            assert recipe['min_lab'] == 5 and recipe['min_park'] == 15
            assert recipe['seconds'] == 28800 and recipe['mutation_cell'] == 4
    first, repeat = by_id['stegoceratops']['first'], by_id['stegoceratops']['repeat']
    assert first['success_rate'] == 1 and first['guaranteed_attempt'] == 1
    assert first['first_guarantee_scope'] == 'park_once' and first['seconds'] == 1800
    assert repeat['success_rate'] == 0.5 and repeat['guaranteed_attempt'] == 5
    # The first hero's parents remain starter paths without a first-hero gate.
    assert set(first['parents']) == {'triceratops', 'stegosaurus'}
    assert all(not by_id[parent]['first'].get('after_first_hero', False) for parent in first['parents'])
    assert first.get('required_research') is None
    return {'acyclic_species': len(visited), 'synthesis_results': len(graph),
            'megalodon_rex_parent_chain': 'complete', 'first_hero_gate_cycle': False}


def main():
    preserved = preserved_inputs()
    rows = check_coverage()
    egg_checks = check_egg_contracts(rows)
    parent_checks = check_parents_and_protection(rows)
    text, counts = renderer.render()
    assert renderer.OUTPUT.read_text() == text, 'Generated acquisition table is stale'
    print(json.dumps({'status': 'pass', 'scope': 'read-only design validation; no gameplay/DB execution',
                      **counts, 'egg_checks': egg_checks, 'parent_checks': parent_checks,
                      'preserved_sha256': preserved, 'source_sha256': model.source_sha256()},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
