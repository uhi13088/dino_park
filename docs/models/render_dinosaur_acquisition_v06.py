#!/usr/bin/env python3
"""Render the canonical acquisition view; also share display helpers with the guide."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import dinosaur_acquisition_model_v06 as model

ROOT = model.ROOT
OUTPUT = ROOT / 'docs/current/dinosaur-acquisition-tables.md'
AREA = {'fossil-valley': '화석 계곡', 'primal-swamp': '원시 습지',
        'abandoned-lab': '버려진 연구소', 'mineral-cave': '광물 동굴', 'mutation-crater': '변이 분화구'}
ORIGIN = {'natural': '자연종', 'hybrid': '하이브리드', 'variant': '변종'}
RARITY = {'common': '일반', 'uncommon': '고급', 'rare': '희귀', 'epic': '영웅', 'legendary': '전설'}
QUALITY = {1: '하급', 2: '중급', 3: '상급'}
MATERIAL = {'dna': 'DNA', 'catalyst': '촉매', 'culture': '배양액', 'mutation_cell': '변이세포'}


def number(value):
    return f'{int(value):,}'


def duration(seconds):
    seconds = int(seconds)
    parts = []
    for value, label in [(86400, '일'), (3600, '시간'), (60, '분'), (1, '초')]:
        count, seconds = divmod(seconds, value)
        if count:
            parts.append(f'{count}{label}')
    return ' '.join(parts) or '즉시'


def gate_text(route):
    """Only human-readable conditions; never infer exhibition requirements for eggs."""
    if route['kind'] != 'synthesis':
        label = route['gate_label']
        details = []
        if route.get('min_lab'):
            details.append(f'연구소 Lv.{route["min_lab"]}')
        if route.get('after_first_hero'):
            details.append('첫 영웅 수령 후')
        if route.get('first_only'):
            details.append('최초 수령 1회')
        return label + (' · ' + ' · '.join(details) if details else '')
    conditions = []
    if route.get('required_research'):
        conditions.append(model.research_label(route['required_research']))
    if route.get('min_lab'):
        conditions.append(f'DNA연구소 Lv.{route["min_lab"]}')
    if route.get('min_park'):
        conditions.append(f'파크 Lv.{route["min_park"]}')
    if route.get('story_gate'):
        conditions.append(route['story_gate'])
    if route.get('requires_isolation_security'):
        conditions.append('호환 격리 서식지·보안/위험점수 조건')
    if route.get('after_first_hero'):
        conditions.append('첫 영웅 수령 후')
    if route.get('first_only_guarantee'):
        conditions.append('첫 지정100%·파크당 1회')
    return ' · '.join(conditions)


def route_info(route):
    """Reusable display fields for the generated table and guide profiles.

    method, gate, cost, time, parents_materials, reward, claim_rule are all
    derived from the same route object; callers need no gate/value constants.
    """
    species, _, _ = model.catalogue()
    kind = route['kind']
    if kind == 'initial_individual':
        return {'method': '시작 개체1마리', 'gate': gate_text(route), 'cost': '무료',
                'time': '즉시', 'parents_materials': '없음', 'reward': '개체1',
                'claim_rule': '기존 시작 지급 이력으로 한 번'}
    if kind in {'starter_egg', 'egg_mission'}:
        first = route.get('first_only', False)
        return {'method': ('첫 지정 알 목표' if first else '종 지정 알 목표') + ' · ' + AREA[route['area']],
                'gate': gate_text(route),
                'cost': f'{number(route["gold"])}골드 · 연료{route["fuel"]}',
                'time': '부화 ' + duration(route['hatch_seconds']),
                'parents_materials': '보유 부모·합성 재료 불필요', 'reward': '지정 알1 → 부화 개체1',
                'claim_rule': '최초 알1개 한 번; 등록 뒤 반복 목표' if first else '새 유료 회차마다 알1개'}
    ingredients = ' + '.join(f'{QUALITY[route["quality"]]} {MATERIAL[key]} {route[key]}'
                             for key in model.MATERIALS if route.get(key))
    parents = ' + '.join(species[sid]['nameKo'] for sid in route['parents'])
    guaranteed = route.get('first_only_guarantee', False)
    return {'method': '부모 보존 합성', 'gate': gate_text(route),
            'cost': number(route['gold']) + '골드', 'time': '합성 ' + duration(route['seconds']),
            'parents_materials': f'부모: {parents} / {ingredients}', 'reward': '성공 개체1',
            'claim_rule': ('첫 지정100%·파크당 1회' if guaranteed else
                           f'기본{int(route["success_rate"] * 100)}% · 최대{route["guaranteed_attempt"]}번째 확정')}


def route_summary(route):
    info = route_info(route)
    return ' · '.join(info[key] for key in ['method', 'gate', 'cost', 'time'])


def mdtable(headers, rows):
    def cell(value):
        return str(value).replace('|', '&#124;').replace('\n', ' ')
    return '\n'.join(['| ' + ' | '.join(headers) + ' |',
                       '| ' + ' | '.join('---' for _ in headers) + ' |',
                       *['| ' + ' | '.join(cell(c) for c in row) + ' |' for row in rows]])


def render():
    rows = model.acquisition_rows()
    counts = model.summary()
    lines = ['# 공룡 83종 최초·반복 획득표 0.6', '',
             '**담당 정본에서 생성한 읽기용 표입니다. 실제 게임 적용을 뜻하지 않습니다.** '
             '[획득 정본](dinosaur-acquisition.md)은 전체 연결과 보완17목표·첫 랩터를, '
             '[DNA](dna-and-collection.md)는15레시피를, [밸런스](balance.md)는 기존 알 밴드를 소유합니다.', '',
             '자연종68·하이브리드12·변종3으로83종입니다. 반복 알 목표68개와 새 첫 벨로시랩터 예외1개를 합친 조회목표는69개입니다. '
             '기존 igua·trike·stego 초반 미션은 원래 목표를 참조하며69개에 다시 가산하지 않습니다. '
             '시작 개체·알·부화 완료 개체·합성 결과를 구별합니다.', '',
             '아래 비용과 시간은 한 회차의 기본값입니다. 일반 부화·합성의 완료 연구/시설 보정은 해당 정본을 따릅니다. '
             '첫 부화 예외와 첫 지정 스테고100%·30분은 고정입니다. 합성 재료·부모 상세는 같은 문서의15레시피 표에서 확인합니다.', '',
             '## 83종 전체 경로', '']
    overview = []
    for row in rows:
        first, repeat = route_info(row['first']), route_info(row['repeat'])
        repeat_description = ('같은 목표·새 유료 회차' if row['origin'] == 'natural' and row['first']['ref'] == row['repeat']['ref'] else
                              route_summary(row['repeat']) if row['origin'] == 'natural' else
                              repeat['claim_rule'])
        overview.append([row['name'] + (' (계획 추가)' if row['planned_only'] else ''),
                         ORIGIN[row['origin']] + ' · ' + RARITY[row['rarity']], first['method'], first['gate'],
                         first['cost'], first['time'], repeat_description])
    lines += [mdtable(['종', '분류·등급', '최초 획득', '최초 조건', '기본 비용', '기본 대기', '재획득'], overview), '',
              '## 새 자연종17개 목표', '',
              '현재 연구의 유전 완료 단계에 연결된 비육상 보완 목록입니다. 실제 돔·해양관·거대종 허가·전시 안전을 알 회수에 요구하지 않습니다. '
              '표의 판정 수를 직접 완료하고 알1개를 확정 수령합니다. 장소는 기존 화석 계곡·원시 습지 안의 해안 구획입니다.', '']
    species, _, _ = model.catalogue()
    extra = []
    for goal in model.repeat_egg_targets().values():
        if not goal.get('supplemental_natural'):
            continue
        extra.append([species[goal['species']]['nameKo'], RARITY[goal['rarity']], goal['id'],
                      AREA[goal['area']], model.research_label(goal['research']),
                      number(goal['gold']), goal['fuel'], goal['checks'], duration(goal['hatch_seconds'])])
    lines += [mdtable(['종', '등급', '목표 ID', '장소', '필요 연구', '준비 골드', '연료', '판단 수', '일반 부화'], extra), '',
              '## 최초5종과 반복의 차이', '',
              '첫 파라는 무료 개체1마리이며 부화 미션이 아닙니다. 첫 이구아노돈·트리케라·스테고는 기존 초반 목표의 비용·부화를 사용합니다. '
              '첫 벨로시랩터는2장 안전 목표 완료 뒤 선택하는 고급밴드 유료 목표이며 첫 영웅의 필수조건이 아닙니다. '
              '최초 수령 또는 기존 정상 보유·영구등록을 인정하고 같은 최초 보상을 다시 주지 않습니다.', '']
    starters = []
    for row in rows:
        if row['species_id'] not in {r['species'] for r in model.marked('starter-paths')}:
            continue
        first, repeat = route_info(row['first']), route_info(row['repeat'])
        starters.append([row['name'], row['first']['ref'], first['gate'], first['cost'], first['time'],
                         row['repeat']['ref'], repeat['cost'], repeat['time']])
    lines += [mdtable(['종', '최초 참조', '최초 조건', '최초 비용', '첫 대기', '재입수 목표', '반복 비용', '반복 대기'], starters), '',
              '## 합성 결과15종의 원종·재료·비용', '',
              '부모는 실제 개체를 보유하며 성공·실패 모두 보존합니다. 합성 결과에는 별도 부화시간을 더하지 않습니다. '
              '영웅은 중급, 전설은 상급 이상이며 선택 안정제1개·실패 반환·확정 보호는DNA 정본을 따릅니다.', '']
    syntheses = []
    for row in rows:
        if row['origin'] == 'natural':
            continue
        route = row['first']; info = route_info(route)
        syntheses.append([row['name'], info['parents_materials'], info['gate'], info['cost'], info['time'],
                          info['claim_rule'] + (' / 반복50%·최대5번째' if row['species_id'] == 'stegoceratops' else '')])
    lines += [mdtable(['결과', '실제 부모·필수 재료', '해금', '기본 골드', '기본 합성', '성공·보호'], syntheses), '',
              '## 검산 범위', '',
              '83종 중복·누락, 자연종68개 반복 목표·조회69개,15개 합성 결과, 부모 경로의 순환 부재와 기존51개 목표·13레시피·252연구비용/효과의 보존을 확인합니다. '
              '실제 미션·재고·원자 수령·동시성·시설/DB·실플레이·성장기간은 이 표 생성으로 검증되지 않습니다.', '']
    return '\n'.join(lines), counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    text, counts = render()
    if args.write:
        OUTPUT.write_text(text)
    else:
        assert OUTPUT.read_text() == text, '획득 생성표 갱신 필요: render_dinosaur_acquisition_v06.py --write'
    print(json.dumps({'status': 'pass', 'mode': 'write' if args.write else 'check',
                      'scope': 'canonical design view; no game execution', **counts}, ensure_ascii=False))


if __name__ == '__main__':
    main()
