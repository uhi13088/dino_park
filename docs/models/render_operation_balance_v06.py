#!/usr/bin/env python3
"""Render and verify the operating scenarios in the current guidebook source."""

import argparse
from fractions import Fraction
import json
from pathlib import Path

from check_building_progression_v06 import BUILD, P, PROD, bank_simulate, upgrade
from dinosaur_acquisition_model_v06 import catalogue
from operation_checkpoints_v06 import run as simulate_checkpoints
from operation_week_v06 import simulate_week
from render_followup_content_v06 import duration


SOURCE = Path(__file__).resolve().parents[1] / 'current/operation-balance.md'
START = '<!-- BEGIN OPERATION RESULTS -->'
END = '<!-- END OPERATION RESULTS -->'
MATERIALS = ('wood', 'stone', 'metal')


def number(value):
    if isinstance(value, float):
        return f'{value:,.2f}'.rstrip('0').rstrip('.')
    return '—' if value is None else f'{value:,}'


def markdown_table(headers, rows):
    def line(values):
        return '| ' + ' | '.join(map(str, values)) + ' |'

    return '\n'.join([line(headers), line(['---'] * len(headers)), *(line(row) for row in rows)])


def recovery_check():
    species = catalogue()[0]['parasaurolophus']
    visitor_rate = (8 + 4 * species['stats']['popularity']) * Fraction(1, 4)
    upkeep = species['stats']['maintenanceCost'] + sum(upgrade(k, 1)['upkeep'] for k in ('gate', 'grassland', 'vault'))
    feed_price = int(PROD['feedmill']['buy'])
    ticket_period = 60 / visitor_rate
    sixth_ticket = 6 * ticket_period
    simulation = bank_simulate(sixth_ticket, balance=0, capacity=int(upgrade('vault', 1)['effect']),
                               period=ticket_period, fee_period=Fraction(3600, upkeep))
    assert simulation['balance'] >= feed_price and simulation['paid'] == 6
    return {'hourly_gross': int(visitor_rate * 60 * P['ticket']), 'hourly_upkeep': upkeep,
            'feed_price': feed_price, 'seconds': int(sixth_ticket), 'gold_at_end': simulation['balance']}


def results():
    week = simulate_week()
    checkpoints = simulate_checkpoints()
    assert [day['day'] for day in week['days']] == list(range(1, 8))
    opening_gold = int(P['initial_gold'])
    for day in week['days']:
        assert day['admission'] == day['paid_visitors'] * P['ticket'], day
        assert day['closing_gold'] == opening_gold + day['admission'] - day['upkeep'] - day['spending'], day
        assert min(day[key] for key in ('closing_gold', 'wood', 'stone', 'feed')) >= 0, day
        opening_gold = day['closing_gold']
    assert [row['park'] for row in checkpoints['checkpoints']] == [15, 25, 35, 50]
    for row in checkpoints['checkpoints']:
        cash = row['admissions']
        assert cash['net_gold'] == cash['gross_gold'] - cash['maintenance_gold'], row
        assert cash['gross_gold'] == cash['paid_admissions'] * P['ticket'], row
        assert cash['gross_gold'] <= cash['potential_gross_gold'], row
        assert row['staff']['researchers'] == 1, row
        assert row['research_goal']['seconds'] >= row['research_goal']['min_seconds'], row
    return week, checkpoints, recovery_check()


def cost(job):
    material = '/'.join(number(job[key]) for key in MATERIALS)
    return f'{number(job["gold"])}골드 · 자재 {material} · {duration(job["seconds"])}'


def summary(week, checkpoints, recovery):
    days = week['days']
    parks = checkpoints['checkpoints']
    sections = ['## 첫 7일 운영표', *week['assumptions']]
    if week['hero_minutes'] is not None:
        sections.append(f'이 일정에서 첫 영웅을 수령한 시점은 시작 후 {duration(60 * week["hero_minutes"])}이다.')
    else:
        sections.append('이 일정에서는 첫 7일 안에 첫 영웅을 수령하지 못했다. 진행 상태는 일별 표에서 확인한다.')
    if week.get('continuous', {}).get('hero_minutes') is not None:
        sections.append(f'첫날 처음 330분을 이어서 접속한 사례에서는 시작 후 {duration(60 * week["continuous"]["hero_minutes"])}에 첫 영웅을 수령했다. 목표 시간 4~6시간은 파견과 귀환 보고서 수령 간격에 따라 달라진다.')
    stages = [('opening', '유료 개장'), ('platform_ready', '첫 관람대'), ('iguanodon_received', '이구아노돈 부화 수령'),
              ('parents_received', '트리케라와 스테고 수령'), ('security_ready', '보안센터 완공'),
              ('synthesis_started', '첫 합성 시작'), ('hero_received', '첫 영웅 수령')]
    sections.append(markdown_table(['초반 목표', '경과', '골드'], [
        [label, duration(state['seconds']), number(state['gold'])]
        for code, label in stages if (state := week.get('checkpoints', {}).get(code)) is not None
    ]))
    sections.append(markdown_table(['날', '주요 행동', '입장료', '유지비 / 작업 지출', '마감 골드'], [
        [d['day'], '개장·초반 목표' if d['day'] == 1 else (
            ' / '.join(row['건물'] for bid, row in BUILD.items() if bid in d['activity']) or '급식·생산 수령'),
         number(d['admission']), f'{number(d["upkeep"])} / {number(d["spending"])}', number(d['closing_gold'])]
        for d in days
    ]))
    sections.append('잔량은 그날 마지막 정산 뒤 값이다. 점유는 해당 날의 작업 분이며 건설자 두 명이 겹치면 각자의 분을 합한다.')
    sections.append(markdown_table(['날', '목재 / 석재 / 사료', '파크 Lv.', '건설 / 기술 연구 점유'], [
        [d['day'], ' / '.join(number(d[key]) for key in ('wood', 'stone', 'feed')),
         d['closing_park'], f'{number(d["builder_busy_minutes"])} / {number(d["researcher_busy_minutes"])}분']
        for d in days
    ]))
    early_fund = week.get('checkpoints', {}).get('security_ready')
    hero = week.get('checkpoints', {}).get('hero_received')
    if early_fund and hero:
        sections.append(f'안전 전시 준비에 육식 서식지와 보안센터 비용을 나눠 지불했다. 보안센터 완공 당시 골드는 {number(early_fund["gold"])}이었다. 첫 주는 선택한 성장 목표로 Lv.{days[-1]["closing_park"]}에 도달한 뒤 급식·생산과 금고 사용을 비교했다.')
    sections.extend(['## 성장 시점별 하루 운영표', *checkpoints['assumptions']])
    sections.append(markdown_table(['파크 Lv.', '잠재 / 실제 입장료', '유지비', '순수입', '유료 / 한도 거절 인원'], [
        [row['park'], f'{number(cash["potential_gross_gold"])} / {number(cash["gross_gold"])}',
         number(cash['maintenance_gold']), number(cash['net_gold']), f'{number(cash["paid_admissions"])} / {number(cash["blocked_admissions"])}']
        for row in parks for cash in [row['admissions']]
    ]))
    sections.append('같은 입장 시간이라도 금고를 가득 채운 채 시작하면 유지비로 비운 공간에 입장료가 다시 들어온다. 하루의 실제 유료 방문은 ' +
                    ' · '.join(f'Lv.{row["park"]} {number(row["admissions"]["full_start"]["paid_admissions"])}명' for row in parks) +
                    '이다. 누적 입장 실적 조건을 검산할 때는 이 차이를 반영한다.')
    sections.append('생산량은 시설당 1회분이다. 자재 수량은 목재·석재·금속 순이다. 급식과 추가 출발은 다음 작업의 비용과 별도로 부담한다.')
    sections.append(markdown_table(['파크 Lv.', '금고 한도', '종류별 창고 한도', '목재 / 석재 / 금속 생산', '사료 생산'], [
        [row['park'], number(fund['vault_capacity']), number(fund["material_capacity"]),
         ' / '.join(number(prod[key]['quantity']) for key in MATERIALS), number(prod["feed"]["quantity"])]
        for row in parks for fund, prod in [(row['funding'], row['production'])]
    ]))
    sections.extend(['## 다음 작업과 자원 준비',
                     '각 시점에서 준비할 시설·연구·탐험 사례다. 시설 한 곳을 강화하면 무료 건설자 2명 중 1명이 남는다. 기본 기술 연구원은 한 작업을 마친 다음 다른 기술을 시작한다. 그동안 자원 생산과 이미 열린 탐험을 이어간다.'])
    sections.append(markdown_table(['파크 Lv.', '시설', '기술 연구', '탐험'], [
        [row['park'], f'{building["name"]} Lv.{building["level"]} / {cost(building)}',
         f'{research["name"]} Lv.{research["level"]} / {cost(research)}',
         f'{field["name"]} / {number(field["gold"])}골드'
         + (f' · 연료 {field["fuel"]}' if field.get("fuel") else '')]
        for row in parks for building, research, field in [(row['building_goal'], row['research_goal'], row['field_goal'])]
    ]))
    if any(row['field_goal'].get('fuel') for row in parks):
        sections.append('특수 원정에 필요한 연료는 기존 재고와 자연 회복으로 마련한다고 가정한다. 위 비용 합계에는 연료 구매·생산비가 포함되지 않는다.')
    sections.append('직접 비용은 세 작업의 시작 비용 합계다. 빈 창고에서 자재를 채운다면 생산과 구매 경로의 골드를 비교할 수 있다. 표의 생산 시간은 해당 자재를 준비하는 가장 오래 걸리는 시설의 작업 시간 합계다. 작업을 시작하고 수동 수령하는 사이의 접속 대기는 별도로 걸린다.')
    sections.append(markdown_table(['파크 Lv.', '직접 비용', '자재 생산 포함', '자재 구매 포함', '최장 시설 작업 합계'], [
        [row['park'], number(fund['together_direct_gold']), number(fund['together_produced_gold']),
         number(fund['together_purchased_gold']), duration(fund['production_max_seconds'])]
        for row in parks for fund in [row['funding']]
    ]))
    sections.append(markdown_table(['파크 Lv.', '사료 하루 사용 / 생산비', '스토리와 다음 목표'], [
        [row['park'], f'{fund["daily_feed_units"]}개 / {number(fund["daily_feed_production_gold"])}골드',
         row['story']]
        for row in parks for fund in [row['funding']]
    ]))
    for row in parks:
        if exhibit := row.get('story_exhibit_goal'):
            sections.append(f'파크 Lv.{row["park"]}의 현장 경로에는 {exhibit["name"]}도 포함된다. {exhibit["departure_region"]}에서 알을 조사하는 데 {number(exhibit["gold"])}골드가 들고, 사례의 부화 시간은 {duration(exhibit["hatch_seconds"])}이다. 해양관 완공과 실제 관람 이력 확인 뒤 전시 목표를 처리한다.')
    sections.append('경험치는 성장 목표 수령 시 한 번 얻는다. 아래 유료 방문 기준은 누적값이다. Lv.25의 현장 경험치는 본편 4장 완료가 조건이다.')
    sections.append(markdown_table(['성장 전환', '목표 4개 경험치', '누적 유료 방문 기준', '이전 목표 대비 추가 인원'], [
        [f'{row["park"]}→{goal["next_park"]}', number(goal['xp']), number(goal['target_paid_admissions']),
         number(goal['extra_from_prior_target'])]
        for row in parks if (goal := row['growth_goal'])['next_park']
    ]))
    sections.append('## 병목과 조정 순서')
    for row in parks:
        park = row['park']
        funding = row['funding']
        building, research = row['building_goal'], row['research_goal']
        if not funding['research_fits_vault']:
            parts = []
            if not funding['research_fits_storage']:
                resource = max(MATERIALS, key=research.get)
                label = dict(zip(MATERIALS, ('목재', '석재', '금속')))[resource]
                parts.append(f'{label} {number(research[resource])}개도 창고 한도 {number(funding["material_capacity"])}개를 넘는다.')
            cap = funding['minimum_combined_vault_level']
            stock = funding['minimum_combined_warehouse_level']
            parts.append(f'금고를 Lv.{cap}까지, 창고를 Lv.{stock}까지 강화한 뒤 연구를 시작한다.')
            sections.append(f'파크 Lv.{park} · {research["name"]} Lv.{research["level"]}에 필요한 {number(research["gold"])}골드가 금고 한도 {number(funding["vault_capacity"])}골드를 넘는다. ' + ' '.join(parts))
            sections.append(markdown_table(['사전 시설 강화', '공사비', '자재 구매 포함', '해당 시설 공사 시간 합계'], [
                [f'{BUILD[bid]["건물"]} Lv.{row["buildings"][bid]}→{jobs[-1]["level"]}',
                 number(sum(job['gold'] for job in jobs)), number(sum(job['gold_with_bought_inputs'] for job in jobs)),
                 duration(sum(job['seconds'] for job in jobs))]
                for bid in ('vault', 'warehouse')
                if (jobs := [job for job in funding['prerequisite_upgrades'] if job['id'] == bid])
            ]))
        elif not funding['building_fits_vault']:
            sections.append(f'파크 Lv.{park} · {building["name"]} Lv.{building["level"]} 한 번에 {number(building["gold"])}골드가 든다. 사례의 금고 한도는 {number(funding["vault_capacity"])}골드다. 금고 Lv.{funding["minimum_combined_vault_level"]} 준비를 연구소 강화 안내에 앞세운다.')
        elif not funding['research_fits_storage']:
            resource = max(MATERIALS, key=research.get)
            resource_label = dict(zip(MATERIALS, ('목재', '석재', '금속')))[resource]
            min_single = next(level for level in range(1, 26) if upgrade('warehouse', level)['effect'] >= research[resource])
            sections.append(f'파크 Lv.{park} · {research["name"]} Lv.{research["level"]}의 {resource_label} {number(research[resource])}개가 창고 한도 {number(funding["material_capacity"])}개를 넘는다. 연구만 시작하려면 창고 Lv.{min_single}, 시설 자재까지 한꺼번에 쌓으려면 Lv.{funding["minimum_combined_warehouse_level"]}가 필요하다.')
        elif not funding['combined_materials_fit']:
            if row['field_goal']['after_research_goal']:
                field = f' 이 사례의 탐험은 {research["name"]} Lv.{research["level"]} 완료 뒤 열린다.'
            else:
                field = ''
            shortage = funding['together_produced_gold'] + funding['daily_feed_production_gold'] - row['admissions']['net_gold']
            if shortage > 0:
                field += f' 잔액 0에서 시작한 하루의 순수입은 사료 보충과 자재 생산을 포함한 전체 예산보다 {number(shortage)}골드 적다.'
            sections.append(f'파크 Lv.{park} · 현재 창고에는 작업 하나의 자재가 들어간다. 시설과 연구를 순서대로 시작하고 자재를 보충한다. 두 작업의 자재를 함께 보유하려면 창고를 Lv.{funding["minimum_combined_warehouse_level"]}까지 올린다.{field}')
        else:
            sections.append(f'파크 Lv.{park} · 대표 작업 비용과 자재가 사례의 금고·창고 한도에 들어간다. 잔액과 재고를 모아 {research["name"]} 연구를 시작한 뒤 {duration(research["seconds"])} 동안 탐험과 스토리를 진행하고 건설자 한 명을 다른 시설에 배정할 수 있다.')
            if sensitivity := funding.get('warehouse_10_sensitivity'):
                sections.append(f'이 시점에서 창고 Lv.10을 쓰면 한도 {number(sensitivity["capacity"])}개에 심부 원정 연구의 석재 {number(research["stone"])}개가 들어가지 않는다. 연구만 시작하려면 창고 Lv.{sensitivity["minimum_warehouse_level_for_research"]}이 필요하다.')
    sections.append('우선 금고·창고 때문에 비용을 지불할 수 없는 목표에 준비 안내를 연결한다. 하루 목표를 몰아 완성하는 사례와 짧게 나눠 접속하는 사례에서 골드와 자재가 떨어지는 시점을 다시 측정한 뒤 단가를 조정한다.')
    sections.append(
        f'기본 파라 복구 예시. 돌봄 이력이 있는 파라가 행복도 0·허기 100이고 시작 입구·초원이 연결된 상태에서 '
        f'이론 입장료는 시간당 {number(recovery["hourly_gross"])}골드, 유지비는 {number(recovery["hourly_upkeep"])}골드다. '
        f'잔액 0에서 온라인 {recovery["seconds"]}초 동안 실제 입장 6회를 받으면 '
        f'{number(recovery["gold_at_end"])}골드가 남아 사료 한 단위 {recovery["feed_price"]}골드를 마련한다.'
    )
    return '\n\n'.join(sections)


def verify_source(*, write=False):
    week, checkpoints, recovery = results()
    latest = summary(week, checkpoints, recovery)
    text = SOURCE.read_text()
    before, rest = text.split(START, 1)
    _, after = rest.split(END, 1)
    rendered = f'{before}{START}\n\n{latest}\n\n{END}{after}'
    if write:
        SOURCE.write_text(rendered)
    else:
        assert text == rendered, '운영 수급 검산표 갱신 필요. --write를 실행하세요.'
    return {'week': week, 'checkpoints': checkpoints, 'recovery': recovery}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--json', action='store_true')
    options = parser.parse_args()
    result = verify_source(write=options.write)
    print(json.dumps(result if options.json else {
        'status': 'pass', 'first_week_days': len(result['week']['days']),
        'checkpoints': [row['park'] for row in result['checkpoints']['checkpoints']],
        'recovery': result['recovery'],
    }, ensure_ascii=False, indent=2))
