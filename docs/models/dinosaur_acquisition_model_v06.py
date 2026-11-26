"""Read the 83-species acquisition plan; never configure or run gameplay.

Existing catalogue, 51 egg goals, research, and synthesis definitions remain
owned by their original sources. This module joins those inputs to the newly
owned 17 natural goals and five starter paths without replacing them.
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import followup_content_model_v06 as followup

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/current/dinosaur-acquisition.md'
DNA = followup.DNA
SOURCE_PATHS = [
    'docs/current/dinosaur-acquisition.md',
    'docs/current/dna-and-collection.md',
    'docs/current/balance.md',
    'docs/current/research-effects.md',
    'docs/current/research-trees.md',
    'docs/current/story-progression.md',
    'docs/current/buildings.md',
    'docs/models/dinosaur_acquisition_model_v06.py',
]
PUBLIC_IDS = ['stegoceratops', 'parasaurolophus-lux', 'spinoraptor', 'indominus-rex']
MATERIALS = ['dna', 'catalyst', 'culture', 'mutation_cell']
STARTER_GATE_LABELS = {
    'new_park_initial_grant': '신규 파크 시작 지급 이력',
    'first_platform_completed': '첫 관람대 완공',
    'chapter1_and_iguanodon_goal_completed': '1장·이구아노돈 목표 완료',
    'safety_goal_completed': '2장 안전 목표 완료',
    'previous_registration': '해당 종 영구 도감 등록 이력',
}


def catalogue():
    return followup.catalogue()


def marked(name):
    return followup.rows(SOURCE, 'acquisition', name)


def source_sha256():
    return {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in SOURCE_PATHS}


def origin(species):
    return species.get('origin') or ('hybrid' if species['category'] == 'hybrid' else 'natural')


def research_label(ref):
    if ref in STARTER_GATE_LABELS:
        return STARTER_GATE_LABELS[ref]
    node, rank = ref.rsplit(':', 1)
    return f'{followup.effect.cost.NODES[node]["항목"]} Lv.{rank}'


def research_requirements(ref):
    node, rank_text = ref.rsplit(':', 1)
    rank = int(rank_text)
    entry = followup.effect.cost.NODES[node]
    assert 1 <= rank <= int(entry['max']), ref
    return {'required_research': ref,
            'min_lab': followup.required_lab(ref),
            'after_first_hero': followup.effect.cost.after_hero(node, rank)}


def repeat_egg_targets():
    """68 goals: preserve the existing 51 verbatim, append exactly 17."""
    species, _, _ = catalogue()
    result = copy.deepcopy(followup.egg_targets())
    for row in marked('extra-natural-targets'):
        sid, identifier = row['species'], row['mission_id']
        assert identifier not in result and sid in species
        rarity = species[sid]['rarity']
        band = followup.BANDS[rarity]
        result[identifier] = {
            'id': identifier, 'species': sid, 'research': row['required_research'],
            'area': row['area'], 'rarity': rarity, 'additional_parent': False,
            'supplemental_natural': True, 'scene': row['scene'],
            'reward_eggs': 1,
            **{k: int(band[k]) for k in ['gold', 'checks', 'hatch_seconds', 'hatch_gold']},
        }
    return result


def egg_targets():
    """69 indexed goals; the extra first raptor goal is not another species."""
    result = repeat_egg_targets()
    starter = next(r for r in marked('starter-paths') if r['species'] == 'velociraptor')
    species, _, _ = catalogue()
    band = followup.BANDS[species['velociraptor']['rarity']]
    result[starter['first_ref']] = {
        'id': starter['first_ref'], 'species': 'velociraptor',
        'research': starter['first_gate'], 'area': 'fossil-valley',
        'rarity': species['velociraptor']['rarity'], 'additional_parent': False,
        'starter_first': True, 'repeatable': False, 'reward_eggs': 1,
        **{k: int(band[k]) for k in ['gold', 'checks', 'hatch_seconds', 'hatch_gold']},
    }
    return result


def _plain_table(block):
    lines = [line for line in block.splitlines() if line.startswith('|')]
    cells = [[cell.strip() for cell in line.strip('|').split('|')] for line in lines]
    assert len(cells) >= 3
    return [dict(zip(cells[0], row)) for row in cells[2:]]


def _context(text):
    """Read constraints from DNA prose/table cells, without a second value table."""
    compact = re.sub(r'\s+', '', text)
    def rank(pattern):
        hit = re.search(pattern + r'(?:Lv\.)?(\d+)', compact)
        return int(hit[1]) if hit else 0
    analysis = rank('고급유전자분석')
    return {'required_research': f'gene-analysis:{analysis}' if analysis else None,
            'min_lab': rank('DNA연구소'), 'min_park': rank('파크'), 'context': text}


def all_recipe_data():
    """15 results, including all four public rows with their actual constraints."""
    raw, _ = followup.effect.catalog_data()
    public = {r['resultSpeciesId']: r for r in raw['recipes']}
    dna_text = DNA.read_text()
    public_block = dna_text.split('## 7. 우선 레시피', 1)[1].split('### 공개 레시피', 1)[0]
    public_rows = _plain_table(public_block)
    assert len(public_rows) == len(PUBLIC_IDS) == 4
    species, _, _ = catalogue()
    result = {}
    for sid, row in zip(PUBLIC_IDS, public_rows):
        source = public[sid]
        ingredients = source['ingredients']
        record = {'id': sid, 'name': species[sid]['nameKo'],
                  'rarity': species[sid]['rarity'],
                  'parents': list(source['parentSpeciesIds']),
                  'quality': min(i['quality'] for i in ingredients),
                  **{m: sum(i['amount'] for i in ingredients if i['material'] == m) for m in MATERIALS},
                  'gold': source['goldCost'], 'seconds': source['durationMs'] // 1000 if source['durationMs'] else None,
                  **_context(row['해금']), 'source_kind': 'public'}
        if sid == 'stegoceratops':
            first_lab = re.search(r'첫 지정 영웅은\s*DNA연구소Lv\.(\d+)', dna_text)
            assert first_lab, 'DNA first-synthesis laboratory condition missing'
            record['min_lab'] = int(first_lab[1])
        result[sid] = record
    # This provider owns nine follow-ups, the public indominus completion,
    # and the two newly approved variant definitions. Do not duplicate them.
    for sid, definition in followup.recipe_data().items():
        previous = result.get(sid, {})
        result[sid] = {**previous, **copy.deepcopy(definition),
                       'source_kind': previous.get('source_kind', 'variant' if sid in followup.VARIANTS else 'followup'),
                       'min_park': previous.get('min_park', 0),
                       'context': previous.get('context', '')}
        requirements = research_requirements(result[sid]['required_research'])
        result[sid]['min_lab'] = max(previous.get('min_lab', 0), requirements['min_lab'])
    variant_block = dna_text.split('### 변종 2종의 합성 레시피', 1)[1].split('<!-- dna:variant-recipes -->', 1)[0]
    requirements = _context(variant_block)
    for sid in followup.VARIANTS:
        result[sid].update({k: requirements[k] for k in ['min_lab', 'min_park', 'context']})
    for sid, record in result.items():
        record.setdefault('mutation_cell', 0)
        record.setdefault('min_park', 0)
        record.setdefault('context', '')
        record['min_lab'] = max(record.get('min_lab', 0),
                               research_requirements(record['required_research'])['min_lab'] if record.get('required_research') else 0)
        record['after_first_hero'] = (research_requirements(record['required_research'])['after_first_hero']
                                      if record.get('required_research') else False)
        story_gate = re.search(r'챕터\s*(\d+(?:-\d+)?)(?:\s*선택분기)?(?:\s*완료)?(?:\s*이후)?', record['context'])
        record['story_gate'] = story_gate[0] if story_gate else None
        record['story_completion_ref'] = ('chapter-'+story_gate[1] if story_gate and '완료' in story_gate[0] and '-' not in story_gate[1] else None)
        record['requires_isolation_security'] = '격리' in record['context'] and '보안' in record['context']
        record['parents_preserved'] = True
        rule = raw['rules'][record['rarity']]
        record['success_rate'] = rule['successRate']
        record['guaranteed_attempt'] = rule['guaranteedAttempt']
        assert record['gold'] is not None and record['seconds'] is not None, sid
    return result


def _egg_route(target):
    result = {**copy.deepcopy(target), 'kind': 'egg_mission', 'ref': target['id'],
              'gate': target['research'], 'gate_label': research_label(target['research']),
              'reward_individuals': 0, 'repeatable': not target.get('starter_first', False),
              'first_only': target.get('starter_first', False), 'extra_park_xp': 0,
              'requires_exhibition': False, 'requires_giant_permission': False,
              'requires_built_habitat': False}
    if ':' in target['research']:
        result.update(research_requirements(target['research']))
    return result


def _starter_first(row, targets):
    sid, ref = row['species'], row['first_ref']
    if sid == 'parasaurolophus':
        return {'kind': 'initial_individual', 'ref': ref, 'gate': row['first_gate'],
                'gate_label': research_label(row['first_gate']), 'gold': 0,
                'checks': 0, 'hatch_seconds': 0, 'hatch_gold': 0,
                'reward_eggs': 0, 'reward_individuals': 1, 'first_only': True,
                'repeatable': False, 'extra_park_xp': 0, 'requires_exhibition': False}
    if sid == 'velociraptor':
        return _egg_route(targets[ref])
    original = next(r for r in followup.building.table('missions') if r['id'] == ref)
    assert original['species'] == sid
    # First hatch exceptions are read from the existing DNA/balance narrative.
    if sid == 'iguanodon':
        match = re.search(r'첫 부화는\s*(\d+)초', DNA.read_text())
        assert match, 'DNA first iguanodon hatch exception missing'
        hatch_seconds = int(match[1])
    else:
        hatch_seconds = int(followup.building.P['parent_hatch_seconds'])
    return {'kind': 'starter_egg', 'ref': ref, 'gate': row['first_gate'],
            'gate_label': research_label(row['first_gate']), 'area': 'fossil-valley',
            'gold': int(original['gold']),
            'checks': int(followup.BANDS[catalogue()[0][sid]['rarity']]['checks']),
            'hatch_seconds': hatch_seconds, 'hatch_gold': 0,
            'reward_eggs': int(original['quantity']), 'reward_individuals': 0,
            'first_only': True, 'repeatable': False, 'extra_park_xp': 0,
            'existing_goal_xp_ref': sid, 'requires_exhibition': False}


def acquisition_rows():
    """Exactly one row per catalogue/planned species in the housing order."""
    species, actual, _ = catalogue()
    repeats = repeat_egg_targets()
    indexed = egg_targets()
    by_species = {r['species']: r for r in repeats.values()}
    assert len(by_species) == len(repeats)
    starters = {r['species']: r for r in marked('starter-paths')}
    recipes = all_recipe_data()
    result = []
    for sid, housing in followup.HOUSES.items():
        entry = species[sid]
        kind = origin(entry)
        if kind == 'natural':
            repeat = _egg_route(by_species[sid])
            first = _starter_first(starters[sid], indexed) if sid in starters else copy.deepcopy(repeat)
        else:
            recipe = copy.deepcopy(recipes[sid])
            repeat = {**recipe, 'kind': 'synthesis', 'ref': sid, 'recipe_id': sid,
                      'gate': recipe.get('required_research'),
                      'gate_label': research_label(recipe['required_research']) if recipe.get('required_research') else recipe['context'],
                      'checks': 0, 'hatch_seconds': 0, 'hatch_gold': 0,
                      'reward_eggs': 0, 'reward_individuals': 1, 'extra_park_xp': 0,
                      'first_only': False, 'repeatable': True}
            first = copy.deepcopy(repeat)
            if sid == 'stegoceratops':
                first.update(success_rate=1.0, guaranteed_attempt=1,
                             first_only_guarantee=True, first_guarantee_scope='park_once')
        result.append({'species_id': sid, 'name': entry['nameKo'], 'origin': kind,
                       'rarity': entry['rarity'], 'first': first, 'repeat': repeat,
                       'housing': copy.deepcopy(housing), 'planned_only': sid not in actual})
    return result


def parent_graph():
    return {sid: list(r['parents']) for sid, r in all_recipe_data().items()}


def summary():
    rows = acquisition_rows()
    return {'species': len(rows),
            'natural_species': sum(r['origin'] == 'natural' for r in rows),
            'hybrid_species': sum(r['origin'] == 'hybrid' for r in rows),
            'variant_species': sum(r['origin'] == 'variant' for r in rows),
            'repeat_egg_targets': len(repeat_egg_targets()), 'indexed_egg_targets': len(egg_targets()),
            'legacy_egg_targets': len(followup.egg_targets()), 'supplemental_natural_targets': len(marked('extra-natural-targets')),
            'new_first_raptor_targets': 1, 'recipes': len(all_recipe_data())}
