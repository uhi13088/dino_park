#!/usr/bin/env python3
"""Export research and its required facilities from the canonical design tables."""
from __future__ import annotations

import argparse
import json
import re
import sys

sys.dont_write_bytecode = True
import research_cost_model_v06 as model

OUTPUT = model.ROOT / 'packages/game-data/src/research/progression.generated.json'
BUILDING_IDS = {
    'lab': 'research-dna-lab',
    'vault': 'operation-vault',
    'warehouse': 'production-warehouse',
}
COST_KEYS = ('gold', 'wood', 'stone', 'metal')
MAX_FACILITY_LEVEL = model.CAPS[-1][-1]


def rank(technology_id, level):
    source = model.base_cost(technology_id, level)
    return {
        'level': level,
        'labLevel': source['required_lab'],
        'afterFirstHero': source['after_hero'],
        'costs': {key: source[key] for key in COST_KEYS},
        'durationSeconds': source['seconds'],
        'minimumDurationSeconds': source['min_seconds'],
    }


def facility(building_id, level):
    source = model.building.upgrade(building_id, level)
    engineering = next(needed for needed, _, cap in model.CAPS if level <= cap)
    return {
        'level': level,
        'costs': {key: source[key] for key in COST_KEYS},
        'durationSeconds': source['seconds'],
        'minimumDurationSeconds': int(model.building.P['final_upgrade_min_seconds'])
        if level == MAX_FACILITY_LEVEL else 0,
        'parkLevel': source['park'],
        'afterFirstHero': source['after_hero'],
        'effect': float(source['effect']),
        'upkeep': source['upkeep'],
        **({'prerequisite': {'technologyId': 'ops-engineering', 'level': engineering}} if engineering else {}),
    }


def render():
    technology = [
        {
            'id': identifier,
            'name': node['항목'],
            'description': re.sub(r'\s+\[레벨별 효과\]\([^)]+\)\.?$', '', node['목적']),
            'family': identifier.split('-', 1)[0],
            'prerequisites': [
                {'technologyId': required, 'level': level}
                for required, level in model.PARENTS[identifier]
            ],
            'ranks': [rank(identifier, level) for level in range(1, int(node['max']) + 1)],
        }
        for identifier, node in model.NODES.items()
    ]
    assert len(technology) == 69 and sum(len(node['ranks']) for node in technology) == 239
    facilities = {
        blueprint: [facility(identifier, level) for level in range(1, MAX_FACILITY_LEVEL + 1)]
        for identifier, blueprint in BUILDING_IDS.items()
    }
    def research_effects(identifier):
        levels = int(model.NODES[identifier]['max'])
        return [int(model.EFFECTS[identifier][f'Lv.{level}']) for level in range(1, levels + 1)]

    return {
        'technology': technology,
        'facilities': facilities,
        'researchPolicy': {
            'goldQuantum': model.POLICY['actual_gold_quantum'],
            'timeQuantumSeconds': model.POLICY['actual_time_quantum'],
            'defaultResearcherCount': min(int(row['count']) for row in model.building.table('staff')
                                          if row['role'] == 'researcher'),
            'budgetPercent': research_effects('gene-study-budget'),
            'protocolPercent': research_effects('gene-study-protocol'),
            'entryBonusPercent': research_effects('ops-entry'),
            'careAdaptationPercent': research_effects('care-adaptation'),
        },
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--write', action='store_true', help='write the generated runtime catalog')
    mode.add_argument('--check', action='store_true', help='verify the generated runtime catalog (default)')
    options = parser.parse_args()
    output = json.dumps(render(), ensure_ascii=False, indent=2) + '\n'
    if options.write:
        OUTPUT.write_text(output, encoding='utf-8')
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != output:
        raise SystemExit('Runtime research catalog differs from canonical tables. Re-run with --write.')
    print('Verified 69 technologies, 239 ranks and 75 facility levels.')
