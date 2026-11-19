#!/usr/bin/env python3
"""Check finite XP arithmetic and native permission closure; no live-play claims."""
from __future__ import annotations
import itertools
import json
import re
import sys
sys.dont_write_bytecode = True
import park_progression_model_v06 as model
import render_park_progression_v06 as renderer


def validate():
    source_before = model.source_sha256()
    shared = (model.ROOT / 'packages/shared/src/constants/park.constants.ts').read_text()
    assert re.search(r'Math.floor\(200\s*\*\s*Math.pow\(level,\s*1\.8\)\)', shared), 'Shared XP curve changed'
    for path in ['packages/shared/src/constants/balance.constants.ts', 'packages/game-data/src/balance/index.ts']:
        assert re.search(r'MAX_PARK_LEVEL\s*=\s*50\b', (model.ROOT / path).read_text()), (path, 'cap changed')
    levels, goals, summary = model.level_rows(), model.goal_rows(), model.summary()
    assert len(levels) == 45 and [r['park_level'] for r in levels] == list(range(5, 50))
    assert len(goals) == len({g['id'] for g in goals}) == 180
    assert summary['early_goal_xp'] == 4800 and summary['park5_carry_xp'] == 35
    assert summary['new_goal_xp'] == 3964614 and summary['cumulative_to_park50'] == 3969414
    assert goals[-1]['cumulative_park_xp'] == summary['cumulative_to_park50']
    assert len(model.research.NODES) == 72
    assert len(model.research.all_costs()) == 252
    assert len(model.building.BUILD) + len(model.followup.SPECIAL) == 26
    assert (len(model.building.BUILD) + len(model.followup.SPECIAL)) * 25 == 650
    counts = model.acquisition.summary()
    assert counts['species'] == 83 and counts['recipes'] == 15
    assert counts['indexed_egg_targets'] == 69 and counts['repeat_egg_targets'] == 68
    assert all(r['first']['extra_park_xp'] == r['repeat']['extra_park_xp'] == 0
               for r in model.acquisition.acquisition_rows())
    assert {r['min_seconds'] // 86400 for r in model.research.all_costs() if r['min_seconds'] >= 7*86400} >= {7, 14, 21, 28}
    evidence = {track: set() for track in model.TRACKS}
    branch_count, closed_events = 0, set()
    for level in levels:
        park = level['park_level']
        local = [g for g in goals if g['park_level'] == park]
        assert [g['track'] for g in local] == list(model.TRACKS)
        assert all(type(g['xp']) is int and g['xp'] > 0 for g in local)
        expected = model.experience(park) - (35 if park == 5 else 0)
        assert sum(g['xp'] for g in local) == level['new_xp'] == expected
        # All four orders close the same transition; no earlier XP is needed to
        # open another goal's native permission in this same Park band.
        for order in itertools.permutations(local):
            actual_level, xp = park, 35 if park == 5 else 0
            for i, goal in enumerate(order):
                assert actual_level >= goal['park_level']
                xp += goal['xp']
                if xp >= model.experience(park):
                    xp -= model.experience(park)
                    actual_level += 1
                assert actual_level == park + (i == 3), (park, 'premature transition')
            assert actual_level == park + 1 and xp == 0
        for goal in local:
            assert goal['claim_policy'] == model.CLAIM_POLICY
            assert goal['claim_policy']['mode'] == 'manual_once'
            assert goal['claim_policy']['idempotency_key'] == ['park_id', 'goal_id']
            conditions = goal['conditions']['any_of']
            expected_choices = 1 if goal['track'] == 'operation' or (goal['track'] == 'field' and park in {25, 30, 35}) else 2
            assert len(conditions) == expected_choices
            assert len({json.dumps(c, sort_keys=True) for c in conditions}) == len(conditions)
            for condition in conditions:
                native = model.native_constraints(condition)
                assert native['min_park'] <= park, (goal['id'], condition, 'future Park gate')
                assert native['min_lab'] <= level['recommended_lab'] <= 25, (goal['id'], condition, 'preparation envelope')
                assert native['extra_researchers_required'] == 0
                assert native['cost_time_policy'] == 'native_unchanged'
                for event in native['native_events']:
                    closed_events.add(tuple(event))
                    # event_closure recursively traverses Lab cap/tech rank/parent
                    # edges; missing IDs and circular definitions cannot pass.
                    closure = model.research.event_closure(tuple(event))
                    assert all(e[1] <= native['min_lab'] for e in closure if e[0] == 'lab')
                key = json.dumps(condition, sort_keys=True)
                assert key not in evidence[goal['track']], (goal['id'], 'duplicate condition in track')
                evidence[goal['track']].add(key)
                branch_count += 1
                assert model.condition_label(condition) and model.condition_gate_label(condition)
            assert model.goal_label(goal) == goal['label']
    operation = [g['conditions']['any_of'][0] for g in goals if g['track'] == 'operation']
    assert [c['amount'] for c in operation] == [100*n*n for n in range(1, 46)]
    assert all(c['kind'] == 'paid_admissions' and c['ref'] == 'Park.totalVisitors' for c in operation)
    # Explicit integration milestones cannot regress to eggs-only evidence.
    kinds = {10: {'owned_individual'}, 15: {'recipe_received', 'owned_individual'},
             20: {'exhibition_confirmed'}, 25: {'story_completed'}, 30: {'story_completed'},
             35: {'story_completed'}, 40: {'owned_individual'}}
    for park, required in kinds.items():
        field = next(g for g in goals if g['park_level'] == park and g['track'] == 'field')
        assert {c['kind'] for c in field['conditions']['any_of']} == required
    at15 = next(g for g in goals if g['park_level'] == 15 and g['track'] == 'field')
    assert at15['conditions']['any_of'][0]['ref'] == 'parasaurolophus-lux'
    assert model.native_constraints(at15['conditions']['any_of'][0])['min_park'] == 15
    at40 = next(g for g in goals if g['park_level'] == 40 and g['track'] == 'field')
    natural = next(c for c in at40['conditions']['any_of'] if c['ref'] == 'livyatan')
    assert model.native_constraints(natural)['min_lab'] == 25
    livyatan = next(r for r in model.acquisition.acquisition_rows() if r['species_id'] == 'livyatan')
    assert livyatan['first']['kind'] == 'egg_mission' and livyatan['first']['reward_eggs'] == 1
    indom = next(c for c in at40['conditions']['any_of'] if c['ref'] == 'indominus-rex')
    assert 'chapter-6' in model.native_constraints(indom)['story_refs']
    for chapter in ['chapter-4', 'chapter-5', 'chapter-6']:
        info = model.story_requirements(chapter)
        assert info['park_is_recommendation'] and not info['all_endings_required']
        closure = model.native_constraints({'kind': 'story_completed', 'ref': chapter, 'amount': 1})
        assert 'indominus-rex' not in closure['species_refs'] and 'livyatan' not in closure['species_refs']
        assert closure['min_lab'] == 20
    assert model.story_requirements('chapter-6')['completion_mode'] == 'one_selected_branch'
    # A concrete witness selects the second research alternative. Even all
    # native tech ancestors in that witness do not require every maxed node.
    witness = set()
    for g in goals:
        if g['track'] == 'research':
            witness |= {tuple(e) for e in model.native_constraints(g['conditions']['any_of'][1])['native_events'] if e[0] == 'tech'}
    assert len(witness) < 252
    assert len({e[1] for e in witness}) < 72
    assert len(model.milestones()) == 7
    assert model.OUTPUT.read_text() == renderer.render(), 'Generated growth table is stale; run renderer --write'
    assert source_before == model.source_sha256(), 'Source changed during check; rerun after authors finish'
    return {'status': 'pass', **summary, 'condition_branches_checked': branch_count,
            'native_dependency_events': len(closed_events), 'xp_claim_orders_checked': 45*24,
            'research_witness_ranks': len(witness), 'research_witness_nodes': len({e[1] for e in witness}),
            'story_milestones': [25, 30, 35], 'source_sha256': source_before,
            'verification_limits': ['no_runtime_mutation', 'no_live_play', 'economy_and_calendar_duration_unverified']}


if __name__ == '__main__':
    print(json.dumps(validate(), ensure_ascii=False, indent=2))
