#!/usr/bin/env python3
"""Export the approved Park Lv.8–15 growth goals for the game."""
from __future__ import annotations

import argparse
import json
import sys

sys.dont_write_bytecode = True
import park_progression_model_v06 as model

OUTPUT = model.ROOT / 'packages/game-data/src/research/park-growth.generated.json'
STAGES = range(8, 15)
BUILDING_TYPES = {
    'lab': 'research-dna-lab',
    'feedmill': 'production-feed-factory',
    'warehouse': 'production-warehouse',
    'platform': 'visitor-viewing-platform',
    'security': 'operation-security-center',
}


def runtime_condition(source):
    parsed = model.parse_condition(source)
    kind, ref = parsed['kind'], parsed['ref']
    if kind == 'building_completed':
        return {
            'kind': 'building',
            'typeId': BUILDING_TYPES[ref],
            'level': parsed['rank'],
            'name': model.building.BUILD[ref]['건물'],
        }
    if kind == 'research_completed':
        assert parsed['rank'] <= int(model.research.NODES[ref]['max'])
        return {'kind': 'research', 'technologyId': ref, 'level': parsed['rank']}
    if kind == 'mission_reward_claimed':
        return {'kind': 'dispatch', 'missionId': ref, 'reward': parsed['mission_kind']}
    if kind == 'owned_individual':
        return {'kind': 'owned', 'speciesId': ref}
    if kind == 'paid_admissions':
        return {'kind': 'paid', 'amount': parsed['amount']}
    raise ValueError(f'Unsupported growth goal: {source}')


def render():
    stages = []
    for row in model.level_rows():
        stage = row['park_level']
        if stage not in STAGES:
            continue
        goals = [
            {
                'id': track,
                'rewardXp': row['xp_by_track'][track],
                'alternatives': [runtime_condition(source) for source in row['source'][track].split(';')],
            }
            for track in model.TRACKS
        ]
        assert sum(goal['rewardXp'] for goal in goals) == model.experience(stage)
        stages.append({
            'stage': stage, 'targetLevel': row['next_park_level'],
            'labPreparation': row['recommended_lab'], 'goals': goals,
        })
    assert [row['stage'] for row in stages] == list(STAGES)
    return stages


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--write', action='store_true', help='write the generated runtime growth goals')
    mode.add_argument('--check', action='store_true', help='verify the runtime export (default)')
    options = parser.parse_args()
    output = json.dumps(render(), ensure_ascii=False, indent=2) + '\n'
    if options.write:
        OUTPUT.write_text(output, encoding='utf-8')
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != output:
        raise SystemExit('Runtime park growth differs from the approved plan. Re-run with --write.')
    print('Verified seven Park Lv.8–15 transitions and their 28 goals.')
