"""Finite Park 5→50 achievement plan; reads canonical Markdown, never gameplay.

The source owns goal selection and XP, while existing building/research/acquisition
models retain their costs, permissions and rewards. No runtime configuration.
"""
from __future__ import annotations
import hashlib
import json
import math
import re
import sys
from pathlib import Path
sys.dont_write_bytecode = True
import dinosaur_acquisition_model_v06 as acquisition
import research_cost_model_v06 as research

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/current/park-progression.md'
OUTPUT = ROOT / 'docs/current/park-progression-tables.md'
followup = acquisition.followup
building = followup.building
MAX_PARK_LEVEL = 50
TRACKS = ('facility', 'research', 'field', 'operation')
TRACK_LABELS = {'facility': '시설 준비', 'research': '연구 적용', 'field': '현장 발견', 'operation': '운영 실적'}
SOURCE_PATHS = [
    'docs/current/park-progression.md', 'docs/current/balance.md',
    'docs/current/research-trees.md', 'docs/current/research-effects.md',
    'docs/current/buildings.md', 'docs/current/dinosaur-acquisition.md',
    'docs/current/dna-and-collection.md', 'docs/current/story-progression.md',
    'docs/current/story-and-characters.md',
    'packages/shared/src/constants/park.constants.ts',
    'packages/shared/src/constants/balance.constants.ts',
    'docs/models/park_progression_model_v06.py',
    'docs/models/research_cost_model_v06.py',
    'docs/models/dinosaur_acquisition_model_v06.py',
]
CLAIM_POLICY = {
    'owner': 'park', 'mode': 'manual_once', 'idempotency_key': ['park_id', 'goal_id'],
    'accept_prior_history': True, 'consume_evidence': False,
    'rewards_from_source_activity': 'unchanged', 'new_daily_gate': False,
    'requires_purchase': False, 'auto_xp': False, 'infinite_repeat_xp': False,
}


def source_sha256():
    return {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in SOURCE_PATHS}


def experience(level):
    """Same literal curve as shared getParkLevelExperience; no 50→51 award."""
    assert 1 <= level < MAX_PARK_LEVEL
    return math.floor(200 * level ** 1.8)


def early_xp():
    return sum(int(row['amount']) for row in building.table('xp'))


def marked(name):
    return followup.rows(SOURCE, 'progression', name)


def parse_condition(value):
    parts = value.split(':')
    kind = parts[0]
    if kind in {'building', 'research'}:
        return {'kind': kind + '_completed', 'ref': parts[1], 'rank': int(parts[2])}
    if kind in {'egg', 'material'}:
        return {'kind': 'mission_reward_claimed', 'mission_kind': kind, 'ref': ':'.join(parts[1:]), 'amount': 1}
    if kind == 'paid':
        return {'kind': 'paid_admissions', 'ref': 'Park.totalVisitors', 'amount': int(parts[1])}
    if kind in {'owned', 'recipe', 'exhibit', 'story'}:
        kinds = {'owned': 'owned_individual', 'recipe': 'recipe_received',
                 'exhibit': 'exhibition_confirmed', 'story': 'story_completed'}
        return {'kind': kinds[kind], 'ref': ':'.join(parts[1:]), 'amount': 1}
    raise ValueError(value)


def _native_basic_constraints(condition):
    """Native prerequisite closure, including Lab engineering caps; no Park gate invented.

    Permission availability is not a calendar/currency simulation. Building ranks
    represent completed work, and mission evidence means a successful reward claim.
    """
    kind, ref = condition['kind'], condition['ref']
    events, park, lab = set(), 5, 1
    if kind == 'building_completed':
        rank = condition['rank']
        if ref in building.BUILD:
            costs = [building.upgrade(ref, n) for n in range(1, rank + 1)]
            park = max(park, *(row['park'] for row in costs))
        else:
            definition = followup.SPECIAL[ref]
            costs = [followup.special_upgrade(ref, n) for n in range(1, rank + 1)]
            park = max(park, *(row['park'] for row in costs))
            node, r = definition['research'].rsplit(':', 1)
            events |= set(research.event_closure(('tech', node, int(r))))
        required = next(r for r, _, cap in research.CAPS if rank <= cap)
        if required:
            events |= set(research.event_closure(('tech', 'ops-engineering', required)))
        if ref == 'lab':
            events |= set(research.event_closure(('lab', rank)))
        # Costs and hard minimums stay in their native model, never copied to this plan.
    elif kind == 'research_completed':
        events |= set(research.event_closure(('tech', ref, condition['rank'])))
    elif kind == 'mission_reward_claimed':
        missions = acquisition.egg_targets() if condition['mission_kind'] == 'egg' else followup.material_missions()
        gate = missions[ref]['research']
        if ':' in gate:
            node, rank = gate.rsplit(':', 1)
            events |= set(research.event_closure(('tech', node, int(rank))))
        elif gate == 'analysis2_lab5_park15':
            park = 15
            events |= set(research.event_closure(('tech', 'gene-analysis', 2)))
        else:
            assert gate in {'first_hero', 'safety_goal_completed'}, (ref, gate)
    else:
        assert kind == 'paid_admissions'
    lab = max([lab] + [e[1] for e in events if e[0] == 'lab'])
    return {'min_park': park, 'min_lab': lab, 'first_hero': True,
            'research_closure': sorted(f'{e[1]}:{e[2]}' for e in events if e[0] == 'tech'),
            'native_events': sorted([list(e) for e in events], key=str),
            'cost_time_policy': 'native_unchanged', 'extra_researchers_required': 0}


def story_requirements(chapter):
    """Read the approved bridge; Park recommendations are never hard gates.

    Native tech references are extracted from the actual chapter tables. The
    marine project uses the source's compatible small-species alternatives.
    """
    assert chapter in {'chapter-4', 'chapter-5', 'chapter-6'}
    number = int(chapter[-1])
    text = (ROOT / 'docs/current/story-progression.md').read_text().split('## 11.')[1]
    block = text.split(f'### {number}장 ')[1].split('\n### ')[0]
    scenes = sorted(set(re.findall(r'`(ch' + str(number) + r'-scene-[a-z0-9-]+)`', block)))
    refs = sorted(set(re.findall(r'`((?:care|exp|ops|gene)-[a-z-]+:[1-5])`', block)))
    result = {'ref': chapter, 'source_section': 'docs/current/story-progression.md#11',
              'scene_refs': scenes, 'research_refs': refs, 'park_is_recommendation': True,
              'mission_refs': sorted(set(re.findall(r'`(mission\.[a-z0-9.-]+)`', block))),
              'prior_chapter': f'chapter-{number-1}', 'all_endings_required': False}
    if number == 4:
        species, _, _ = acquisition.catalogue()
        compatible = [sid for sid, h in followup.HOUSES.items()
                      if h['group'] == 'marine' and h['giant_permission'] == '-'
                      and {'facility': 'marine', 'min_level': 1} in json.loads(h['alternatives'])]
        assert len(compatible) == 5 and all(species[s]['nameKo'] in block for s in compatible)
        result['exhibition_any_of'] = compatible
    if number == 6:
        assert all('ch6-scene-3-' + branch in scenes for branch in ['hopeful', 'realistic', 'tragic'])
        result['completion_mode'] = 'one_selected_branch'
    return result


def native_constraints(condition):
    """Native closure including actual ownership, exhibition and story milestones."""
    kind, ref = condition['kind'], condition['ref']
    if kind in {'building_completed', 'research_completed', 'mission_reward_claimed', 'paid_admissions'}:
        result = _native_basic_constraints(condition)
        result.update(building_refs=[ref] if kind == 'building_completed' else [],
                      mission_refs=[ref] if kind == 'mission_reward_claimed' else [],
                      species_refs=[], story_refs=[], spatial_validation=False)
        return result
    pieces, species_refs, story_refs = [], set(), set()
    by_species = {r['species_id']: r for r in acquisition.acquisition_rows()}
    if kind in {'owned_individual', 'recipe_received', 'exhibition_confirmed'}:
        row = by_species[ref]
        route = row['first']
        species_refs.add(ref)
        if kind == 'recipe_received':
            assert route['kind'] == 'synthesis', ref
        if route['kind'] == 'synthesis':
            for parent in route['parents']:
                pieces.append(native_constraints({'kind': 'owned_individual', 'ref': parent, 'amount': 1}))
            if route.get('required_research'):
                node, rank = route['required_research'].rsplit(':', 1)
                pieces.append(native_constraints({'kind': 'research_completed', 'ref': node, 'rank': int(rank)}))
            if route.get('story_completion_ref'):
                story_refs.add(route['story_completion_ref'])
                pieces.append(native_constraints({'kind': 'story_completed', 'ref': route['story_completion_ref'], 'amount': 1}))
            if route.get('requires_isolation_security'):
                for facility in ['hybrid_carn', 'security']:
                    pieces.append(native_constraints({'kind': 'building_completed', 'ref': facility, 'rank': 1}))
        elif route['kind'] == 'egg_mission':
            pieces.append(native_constraints({'kind': 'mission_reward_claimed', 'mission_kind': 'egg', 'ref': route['ref'], 'amount': 1}))
        else:
            assert route['kind'] in {'starter_egg', 'initial_individual'}
        # Existing free basic incubation slot permits sequential hatching.
        # The hatchery is parallel capacity, not a new ownership prerequisite.
        if kind == 'exhibition_confirmed':
            housing = row['housing']
            # All listed facilities are legitimate alternatives, never additive purchases.
            alternatives = [native_constraints({'kind': 'building_completed', 'ref': c['facility'], 'rank': c['min_level']})
                            for c in json.loads(housing['alternatives'])]
            pieces.append(min(alternatives, key=lambda c: (c['min_lab'], c['min_park'])))
            if housing['giant_permission'] != '-':
                node, rank = housing['giant_permission'].rsplit(':', 1)
                pieces.append(native_constraints({'kind': 'research_completed', 'ref': node, 'rank': int(rank)}))
            if int(housing['security_points']):
                pieces.append(native_constraints({'kind': 'building_completed', 'ref': 'security', 'rank': 1}))
    elif kind == 'story_completed':
        info = story_requirements(ref)
        story_refs.add(ref)
        story_refs.update(info['scene_refs'])
        if info['prior_chapter'] != 'chapter-3':
            pieces.append(native_constraints({'kind': 'story_completed', 'ref': info['prior_chapter'], 'amount': 1}))
        for tech in info['research_refs']:
            node, rank = tech.rsplit(':', 1)
            pieces.append(native_constraints({'kind': 'research_completed', 'ref': node, 'rank': int(rank)}))
        for mission in info['mission_refs']:
            pieces.append(native_constraints({'kind': 'mission_reward_claimed', 'mission_kind': 'material', 'ref': mission, 'amount': 1}))
        if 'exhibition_any_of' in info:
            pieces.append(native_constraints({'kind': 'exhibition_confirmed', 'ref': info['exhibition_any_of'][0], 'amount': 1}))
        if ref == 'chapter-5':
            for facility in ['security', 'platform']:
                pieces.append(native_constraints({'kind': 'building_completed', 'ref': facility, 'rank': 1}))
    else:
        raise ValueError(kind)
    base = {'min_park': 5, 'min_lab': 1}
    if kind in {'owned_individual', 'recipe_received', 'exhibition_confirmed'}:
        base = {'min_park': max(5, route.get('min_park', 0)), 'min_lab': max(1, route.get('min_lab', 1))}
    result = {key: max([base[key]] + [p[key] for p in pieces]) for key in ['min_park', 'min_lab']}
    result.update(first_hero=True, cost_time_policy='native_unchanged', extra_researchers_required=0,
                  spatial_validation=kind in {'exhibition_confirmed', 'story_completed'})
    for key, own in [('research_closure', set()), ('native_events', set()), ('building_refs', set()),
                     ('mission_refs', set()), ('species_refs', species_refs), ('story_refs', story_refs)]:
        values = {tuple(v) if isinstance(v, list) else v for p in pieces for v in p.get(key, [])} | own
        result[key] = sorted([list(v) if isinstance(v, tuple) else v for v in values], key=str)
    return result


def condition_label(condition, *, include_id=True):
    kind, ref = condition['kind'], condition['ref']
    suffix = f' [{ref}]' if include_id else ''
    if kind == 'building_completed':
        name = building.BUILD[ref]['건물'] if ref in building.BUILD else followup.SPECIAL[ref]['name']
        return f'{name} Lv.{condition["rank"]} 완공' + suffix
    if kind == 'research_completed':
        return f'{research.NODES[ref]["항목"]} Lv.{condition["rank"]} 완료' + suffix
    if kind == 'mission_reward_claimed':
        if condition['mission_kind'] == 'egg':
            target = acquisition.egg_targets()[ref]
            species, _, _ = acquisition.catalogue()
            name = species[target['species']]['nameKo']
            return f'{name} 지정 알 목표 성공·알 보상 1회 수령' + suffix
        target = followup.material_missions()[ref]
        reward = target['reward']
        material = {'dna': 'DNA', 'culture': '배양액', 'catalyst': '촉매',
                    'mutation_cell': '변이세포', 'stabilizer': '안정제'}.get(reward['material'], reward['material'])
        return f'현장 조사 성공·품질{reward["quality"]} {material} 보상 1회 수령' + suffix
    if kind in {'owned_individual', 'recipe_received', 'exhibition_confirmed'}:
        name = acquisition.catalogue()[0][ref]['nameKo']
        action = {'owned_individual': '실제 부화·합성 개체 1마리 수령 이력',
                  'recipe_received': '합성 성공 개체 1마리 수령 이력',
                  'exhibition_confirmed': '실제 전시·관람 확인 이력(호환·위험·수용·동선 검증)'}[kind]
        return name + ' ' + action + suffix
    if kind == 'story_completed':
        return ref[-1] + '장 완료 이력' + ('(선택한 분기 한 개)' if ref == 'chapter-6' else '') + suffix
    assert kind == 'paid_admissions'
    return f'실제 유료 입장 누적 {condition["amount"]:,}명 이상 (기존 totalVisitors)'


def goal_label(row, *, include_id=True):
    return ' 또는 '.join(condition_label(c, include_id=include_id) for c in row['conditions']['any_of'])


def condition_gate_label(condition):
    """Short native preparation label; full recursive prerequisites remain in refs."""
    gate = native_constraints(condition)
    parts = [f'Park{gate["min_park"]} 이상', f'연구소 Lv.{gate["min_lab"]} 준비']
    ref = condition['ref']
    if condition['kind'] == 'mission_reward_claimed':
        missions = acquisition.egg_targets() if condition['mission_kind'] == 'egg' else followup.material_missions()
        permission = missions[ref]['research']
        if ':' in permission:
            parts.append(acquisition.research_label(permission))
        elif permission == 'analysis2_lab5_park15':
            parts.append(acquisition.research_label('gene-analysis:2'))
    elif condition['kind'] == 'building_completed' and ref in followup.SPECIAL:
        parts.append(acquisition.research_label(followup.SPECIAL[ref]['research']))
    if gate.get('story_refs') and condition['kind'] != 'story_completed':
        parts += ['6장 선택분기 완료'] if 'chapter-6' in gate['story_refs'] else []
    return ' · '.join(parts)


def goal_condition_label(row, *, include_id=True):
    return ' 또는 '.join(condition_label(c, include_id=include_id) + ' (' + condition_gate_label(c) + ')'
                       for c in row['conditions']['any_of'])


def level_rows():
    result, cumulative = [], 0
    for row in marked('levels'):
        level = int(row['park_level'])
        rewards = {track: int(row[track + '_xp']) for track in TRACKS}
        result.append({'park_level': level, 'next_park_level': level + 1,
                       'recommended_lab': int(row['lab_preparation']),
                       'xp_by_track': rewards, 'new_xp': sum(rewards.values()),
                       'cumulative_new_xp': cumulative + sum(rewards.values()),
                       'cumulative_park_xp': early_xp() + cumulative + sum(rewards.values()),
                       'story_refs': [] if row['story_refs'] == '-' else row['story_refs'].split(','),
                       'source': row})
        cumulative += sum(rewards.values())
    return result


def goal_rows():
    result, cumulative = [], 0
    eggs = acquisition.egg_targets()
    for level in level_rows():
        source, park = level['source'], level['park_level']
        for track in TRACKS:
            choices = [parse_condition(v) for v in source[track].split(';')]
            native = [native_constraints(c) for c in choices]
            xp = level['xp_by_track'][track]
            cumulative += xp
            refs = lambda kind: sorted({c['ref'] for c in choices if c['kind'] == kind})
            species = sorted({eggs[c['ref']]['species'] for c in choices if c.get('mission_kind') == 'egg'} |
                             {r for n in native for r in n['species_refs']})
            row = {'id': f'park-growth-{park:02d}-{track}', 'park_level': park,
                   'track': track, 'xp': xp, 'cumulative_new_xp': cumulative,
                   'cumulative_park_xp': early_xp() + cumulative,
                   'next_park_level': park + 1, 'track': track, 'track_label': TRACK_LABELS[track],
                   'xp': xp, 'cumulative_new_xp': cumulative, 'cumulative_park_xp': early_xp() + cumulative,
                   'conditions': {'all_of': [{'kind': 'first_hero_received'},
                                            {'kind': 'park_level_at_least', 'amount': park}],
                                  'any_of': choices}, 'native_constraints': native,
                   'building_refs': sorted({r for n in native for r in n['building_refs']}),
                   'research_refs': sorted({r for n in native for r in n['research_closure']}),
                   'mission_refs': sorted({r for n in native for r in n['mission_refs']}), 'species_refs': species,
                   'story_refs': sorted(set(level['story_refs']) | {r for n in native for r in n['story_refs']}),
                   'claim_policy': dict(CLAIM_POLICY),
                   'source_ref': f'docs/current/park-progression.md#Park{park}'}
            row['label'] = goal_label(row)
            result.append(row)
    return result


def milestones():
    return [{'id': r['id'], 'park_from': int(r['park_from']), 'park_to': int(r['park_to']),
             'label': r['label'], 'focus': r['focus'], 'story_refs': r['story_refs'].split(',') if r['story_refs'] != '-' else []}
            for r in marked('milestones')]


def summary():
    levels = level_rows()
    return {'max_park_level': MAX_PARK_LEVEL, 'early_goal_xp': early_xp(),
            'park5_threshold_cumulative': sum(experience(n) for n in range(1, 5)),
            'park5_carry_xp': early_xp() - sum(experience(n) for n in range(1, 5)),
            'transitions': len(levels), 'goals': len(levels) * len(TRACKS),
            'new_goal_xp': sum(r['new_xp'] for r in levels),
            'cumulative_to_park50': sum(experience(n) for n in range(1, 50)),
            'remaining_at_park50': 0, 'implementation': 'planning_only',
            'duration_status': 'economy_and_live_play_unverified',
            'requires_all_72_research_max': False, 'requires_all_83_species': False,
            'requires_all_15_recipes': False, 'new_repeat_xp': False}
