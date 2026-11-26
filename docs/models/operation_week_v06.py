#!/usr/bin/env python3
"""Seven-day planning scenarios. Run with python3 from the repository.
The source tables own costs and permissions. Session/action choices are examples.
"""
from collections import Counter
from functools import lru_cache
import json
import re

import park_progression_model_v06 as progression
import research_cost_model_v06 as research

building = progression.building
followup = progression.followup
effect = followup.effect
ROOT = progression.ROOT
HOUR, DAY, STEP = 3600, 86400, 15
P = building.P
facility_stat = lru_cache(maxsize=None)(building.primary)
facility_plan = lru_cache(maxsize=None)(building.upgrade)
MATERIALS = ('wood', 'stone', 'metal', 'feed')
MISSIONS = {r['id']: r for r in building.table('missions')}
EARLY_XP = {r['id']: int(r['amount']) for r in building.table('xp')}
PRICES = {row['material']: int(row['buy']) for row in building.PROD.values()}
PRODUCERS = {row['material']: bid for bid, row in building.PROD.items()}
CARE = (ROOT / 'packages/shared/src/constants/balance.constants.ts').read_text()
START = (ROOT / 'packages/game-data/src/starter/index.ts').read_text()
FIRST_EXPEDITION = (ROOT / 'packages/game-data/src/expedition/first-expedition.ts').read_text()
GROWTH = {int(row['park_level']): row for row in progression.marked('levels')}
PARENTS = ('triceratops', 'stegosaurus')
HERO = 'stegoceratops'
GROWTH_PATH = {
    5: ('building:lab:1', 'research:ops-entry:1', 'material:mission.abandoned-lab.basic-catalyst.v1'),
    6: ('building:platform:2', 'research:care-adaptation:1', 'material:mission.fossil-valley.basic-dna.v1'),
    7: ('building:security:2', 'research:exp-field-mapping:1', 'material:mission.fossil-valley.repeat-rim-survey.v1'),
    8: ('building:feedmill:2', 'research:gene-analysis:1', 'material:mission.mineral-cave.basic-stabilizer.v1'),
    9: ('building:lab:5', 'research:gene-common-herbivore:1', 'material:mission.primal-swamp.basic-culture.v1'),
    10: ('building:warehouse:3', 'research:care-adaptation:2', 'owned:gallimimus'),
}
SCOUT_MISSION_IDS = {
    'igua': 'first-iguanodon-v1',
    'mission.abandoned-lab.basic-catalyst.v1': 'basic-catalyst',
    'mission.fossil-valley.basic-dna.v1': 'basic-dna',
    'mission.fossil-valley.repeat-rim-survey.v1': 'repeat-rim-survey',
}
SESSION_WINDOWS = ((0, 60), (240, 330), (720, 740))
RETURN_WINDOWS = ((0, 20), (720, 740))
ASSUMPTIONS = [
    '첫날 개장 준비부터 시작해 0~60분, 240~330분, 720~740분에 접속한다. 2~7일은 0~20분과 720~740분에 접속한다.',
    '비접속 1회당 처음 8시간만 수입과 유지비를 같은 오프라인 계수로 정산한다. 돌봄 상태와 착수 작업의 시간은 비접속 때도 흐른다.',
    '입장과 유지비를 15초 단위로 상태를 갱신하고, 구간 안에서는 사건 발생 순서대로 정산한다. 유료 입장 하나마다 금고 여유를 확인한다.',
    '기본 자재·사료 재고는 0이다. 시작 전시·호환 서식지·안전시설·방문객 길은 적법하게 배치됐다고 가정한다. 초원에는 파라와 이구아노돈을 전시하고 두 부모는 보유만 한다. 첫 영웅은 하이브리드 서식지에 전시한다.',
    '원종과 합성 결과의 수령 시 건강 상태는 행복100·배고픔0 가정이다. 현행 급식 회복과 상태 악화 수치를 사용한다. 접속 중 허기50 이상 또는 출발과 합성에 조건이 필요한 때 급식한다.',
    '기본 탐험가 1명을 사용한다. 파견 시간은 게임에 설정된 목표별 시간을 적용하며, 비접속 중에 귀환하면 다음 접속에서 보고서를 받는다.',
    '프롤로그·개장은 6분, 안전 대화·동선 점검은 6분, 촉매 전후 대화는 각각 1분과 3분으로 가정한다.',
    '공사·부화·기술·합성·생산은 각자 타이머를 쓴다. 생산·부화·합성의 보상은 접속 시 수동 수령한다. 건설과 기술 결과는 비접속 중에도 완료된다.',
    '금속과 부족한 자재는 구매한다. Lv.1 생산시설 1~3회분은 수동 착수·수령하고 한 번에 들어갈 공간을 확인한다.',
    '역할별 기본 1명과 첫 영웅으로 해금하는 무료 건설자 2번째를 쓴다. 유료 가속·다이아·위인·시즌 보상은 사용하지 않는다.',
    '정산의 유지비 부족분은 추적하고 현행처럼 잔액을 넘겨 걷지 않는다. 미납에 따른 새 벌칙이나 무료 구제는 이 계산에 넣지 않는다.',
    '첫 영웅 이후 표에 명시한 Park5→11 목표만 선택한다. Park11 이후는 정해진 금고·생산 투자를 마치고 돌봄 위주로 운영하는 사례다. 상황에 따른 클리어 보장, 필수 접속 시간, 실제 지도 배치나 경제 운영의 검증 결과로 쓰지 않는다.',
]


def integer(source, pattern):
    return int(re.search(pattern, source).group(1))


HAPPINESS_DECAY = integer(CARE, r'HAPPINESS_DECAY_PER_HOUR = (\d+);')
HUNGER_GROWTH = integer(CARE, r'HUNGER_INCREASE_PER_HOUR = (\d+);')
FEED_HAPPINESS = integer(CARE, r'FEEDING_HAPPINESS_GAIN = (\d+);')
FEED_HUNGER = integer(CARE, r'FEEDING_HUNGER_REDUCE = (\d+);')
START_HAPPINESS = integer(START, r'happiness: (\d+)')
START_HUNGER = integer(START, r'hunger: (\d+)')
FIRST_HATCH = integer(FIRST_EXPEDITION, r'hatchSeconds: (\d+)')
FIRST_VISITORS = integer(
    (ROOT / 'packages/shared/src/constants/park.constants.ts').read_text(),
    r'firstVisitorsTarget: (\d+)',
)


@lru_cache(maxsize=1)
def catalog_inputs():
    catalog, _ = building.source_catalog()
    return {row['id']: row for row in catalog['species']}, catalog['first'], catalog['scoutSeconds']


@lru_cache(maxsize=1)
def material_missions():
    return followup.material_missions()


@lru_cache(maxsize=1)
def egg_missions():
    return progression.acquisition.egg_targets()


def settle(carry, per_second, seconds):
    """Return events and the corresponding fractional remainder for a fixed-rate slice."""
    total = carry + per_second * seconds
    count = int(total + 1e-10)
    events = [(i - carry) / per_second for i in range(1, count + 1)] if count else []
    return events, max(0.0, total - count)


class Week:
    def __init__(self, first_windows):
        self.first_windows = first_windows
        self.species, self.recipe, self.scout_seconds = catalog_inputs()
        self.gold = int(P['initial_gold'])
        self.stock, self.ingredients = Counter(), Counter()
        self.facilities = {'gate': 1, 'grassland': 1, 'vault': 1}
        self.tech = Counter()
        self.dinos = {'parasaurolophus': (START_HAPPINESS, START_HUNGER, 0)}
        self.exhibits = set()
        self.care_rates = [(0, 0.0)]
        self.jobs = []
        self.claims = set()
        self.level = 1
        self.xp = 0
        self.visitors = 0
        self.last_online = None
        self.visitor_carry = self.upkeep_carry = 0.0
        self.records = []
        self.events = []
        self.checkpoints = {}
        self.day = {}
        self.t = 0
        self.open = False
        self.waits = set()

    @property
    def gold_capacity(self):
        return int(facility_stat('vault', self.facilities['vault']))

    def event(self, kind, name):
        self.events.append({'second': self.t, 'kind': kind, 'name': name})

    def checkpoint(self, name):
        self.checkpoints[name] = {
            'seconds': self.t, 'gold': self.gold, 'paid_visitors': self.visitors,
            'park': self.level,
            'admission': sum(row['admission'] for row in self.records),
            'upkeep': sum(row['upkeep'] for row in self.records),
            'spending': sum(sum(row['spending_by_type'].values()) for row in self.records),
        }

    def spend(self, amount, kind):
        if self.gold < amount:
            self.waits.add('gold')
            return False
        self.gold -= amount
        self.day['spending_by_type'][kind] += amount
        self.day['minimum_gold'] = min(self.day['minimum_gold'], self.gold)
        return True

    def pay(self, cost, kind):
        shortages = {m: max(0, cost.get(m, 0) - self.stock[m]) for m in MATERIALS[:3]}
        if any(amount and self.pending('produce', material) for material, amount in shortages.items()):
            self.waits.add('production')
            return False
        purchase = sum(PRICES[m] * amount for m, amount in shortages.items())
        if self.gold < purchase + cost['gold']:
            self.waits.add('gold')
            return False
        assert all(cost.get(m, 0) <= effect.material_capacity(self.facilities.get('warehouse', 0))
                   for m in MATERIALS[:3])
        self.spend(purchase, 'materials')
        self.spend(cost['gold'], kind)
        self.day['purchased'].update(shortages)
        for m in MATERIALS[:3]:
            self.stock[m] += shortages[m] - cost.get(m, 0)
        return True

    def grant(self, name, amount):
        if name in self.claims:
            return
        self.claims.add(name)
        self.xp += amount
        if self.xp >= progression.experience(self.level):
            self.xp -= progression.experience(self.level)
            self.level += 1
            self.checkpoint(f'park_{self.level}')
            self.event('growth', f'Park {self.level}')

    def pending(self, kind, name=None):
        return any(j[0] == kind and (name is None or j[1] == name) for j in self.jobs)

    def active(self, kind):
        return sum(job[0] == kind and job[2] > self.t for job in self.jobs)

    def schedule(self, kind, name, seconds, payload):
        self.jobs.append((kind, name, self.t + seconds, payload))
        self.event(kind, name)

    def complete_jobs(self, online):
        for job in self.jobs.copy():
            kind, name, end, payload = job
            if end > self.t or (not online and kind not in ('build', 'research')):
                continue
            if kind == 'produce':
                if self.stock[name] + payload > effect.material_capacity(self.facilities.get('warehouse', 0)):
                    continue
                self.stock[name] += payload
                self.day['produced'][name] += payload
            elif kind == 'build':
                self.facilities[name] = payload
                if name in {'platform', 'lab', 'hatchery', 'carnivore', 'security', 'hybrid_herb'} and payload == 1:
                    self.checkpoint(f'{name}_ready')
            elif kind == 'research':
                self.tech[name] = payload
                if name == 'care-adaptation':
                    self.care_rates.append((self.t, float(research.effect(name, payload))))
            elif kind == 'mission':
                self.claims.add(name)
                if 'species' in payload:
                    self.claims.add('egg:' + payload['species'])
                else:
                    reward = payload['reward']
                    self.ingredients[(reward['material'], reward['quality'])] += reward['quantity']
            elif kind in ('hatch', 'synthesis'):
                self.dinos[name] = (100, 0, self.t)
                if name in EARLY_XP:
                    self.grant(name, EARLY_XP[name])
                if name == 'iguanodon':
                    self.exhibits.add(name)
                    self.checkpoint('iguanodon_received')
                if name in PARENTS and all(parent in self.dinos for parent in PARENTS):
                    self.checkpoint('parents_received')
                if name == HERO:
                    self.checkpoint('hero_received')
            else:
                assert kind == 'scene'
                self.checkpoint(name)
            self.jobs.remove(job)
            self.event('complete', name)

    def build(self, name, rank):
        if self.facilities.get(name, 0) != rank - 1 or self.pending('build', name):
            return
        if self.active('build') >= (2 if HERO in self.dinos else 1):
            self.waits.add('builder')
            return
        row = facility_plan(name, rank)
        # This week's route uses only the starting 1–5 facility band.
        assert rank <= research.CAPS[0][2]
        if row['park'] > self.level or (row['after_hero'] and HERO not in self.dinos):
            return
        if self.pay(row, 'construction'):
            self.schedule('build', name, row['seconds'], rank)

    def produce(self):
        for material, bid in PRODUCERS.items():
            if bid not in self.facilities or self.pending('produce', material):
                continue
            if self.stock[material] >= (10 if material == 'feed' else 25):
                continue
            batch = building.production(bid, self.facilities[bid], 2)
            if (self.stock[material] + batch['quantity']
                    <= effect.material_capacity(self.facilities.get('warehouse', 0))):
                if self.spend(batch['gold'], 'production'):
                    self.schedule('produce', material, batch['seconds'], batch['quantity'])

    def state(self, name):
        happiness, hunger, fed = self.dinos[name]
        seconds = self.t - fed
        if name in self.exhibits:
            for (start, reduction), (end, _) in zip(self.care_rates, self.care_rates[1:] + [(self.t, 0)]):
                seconds -= max(0, end - max(start, fed)) * reduction
        return max(0, happiness - int(seconds * HAPPINESS_DECAY / HOUR)), min(
            100, hunger + int(seconds * HUNGER_GROWTH / HOUR),
        )

    def feed(self, name):
        if not self.stock['feed'] and not self.spend(PRICES['feed'], 'feed_purchase'):
            return False
        if self.stock['feed']:
            self.stock['feed'] -= 1
        else:
            self.day['purchased']['feed'] += 1
        happiness, hunger = self.state(name)
        self.dinos[name] = (min(100, happiness + FEED_HAPPINESS), max(0, hunger - FEED_HUNGER), self.t)
        self.day['feeds'] += 1
        return True

    def accounting(self, factor):
        if not factor:
            return
        self.day['settled_minutes'] += STEP / 60
        if not self.open:
            return
        stats = [(self.species[name]['stats']['popularity'], self.state(name)) for name in sorted(self.exhibits)]
        popularity = sum(p for p, _ in stats)
        quality = sum(p * (0.5 + h / 200) * (0.5 if hunger > 80 else 1) for p, (h, hunger) in stats) / popularity
        # In this scenario Para and Iguanodon share a grassland. The hero is
        # exhibited in the second, compatible hybrid zone.
        occupied_zones = len({('hybrid_herb' if name == HERO else 'grassland') for name in self.exhibits})
        capacity = building.exhibit_capacity(occupied_zones)
        gate = facility_stat('gate', self.facilities['gate']) * (1 + research.effect('ops-entry', self.tech['ops-entry']))
        visitors = min((8 + 4 * popularity + 4 * (len(stats) - 1)) * quality,
                       float(gate), capacity * 60 / float(P['visit_seconds']))
        fee = sum(self.species[name]['stats']['maintenanceCost'] for name in self.dinos)
        fee += sum(facility_plan(name, rank)['upkeep'] for name, rank in self.facilities.items())
        tickets, self.visitor_carry = settle(self.visitor_carry, visitors * factor / 60, STEP)
        fees, self.upkeep_carry = settle(self.upkeep_carry, fee * factor / HOUR, STEP)
        rejected = 0
        ticket = int(P['ticket'])
        capacity = self.gold_capacity
        for _, arrival in sorted([(t, True) for t in tickets] + [(t, False) for t in fees]):
            if not arrival:
                if self.gold > 0:
                    self.gold -= 1
                    self.day['upkeep'] += 1
                else:
                    self.day['upkeep_unpaid'] += 1
            elif self.gold + ticket <= capacity:
                self.gold += ticket
                self.day['admission'] += ticket
                self.day['paid_visitors'] += 1
                self.visitors += 1
            else:
                rejected += 1
        self.day['rejected_visitors'] += rejected
        self.day['cap_minutes'] += STEP / 60 if rejected else 0
        self.day['minimum_gold'] = min(self.day['minimum_gold'], self.gold)

    def begin_mission(self, name):
        if name in self.claims or self.pending('mission') or self.pending('scene'):
            return
        if name in MISSIONS:
            row = MISSIONS[name]
            payload = ({'species': row['species']} if row['species'] != '-' else
                       {'reward': {'material': row['material'], 'quality': int(row['quality']),
                                   'quantity': int(row['quantity'])}})
            gold = int(row['gold'])
        else:
            row = material_missions().get(name) or egg_missions()[name]
            gate = row['research']
            if gate == 'first_hero':
                assert HERO in self.dinos
            elif ':' in gate:
                tech, rank = gate.rsplit(':', 1)
                if self.tech[tech] < int(rank):
                    return
            else:
                raise ValueError(gate)
            payload = row
            gold = row['gold']
        dispatch_id = SCOUT_MISSION_IDS.get(name, name)
        seconds = self.scout_seconds[dispatch_id]
        if self.spend(gold, 'expedition'):
            self.schedule('mission', name, seconds, payload)

    def hatch(self, name, seconds, gold=0):
        if (name in self.dinos or 'egg:' + name not in self.claims
                or self.pending('hatch', name)):
            return
        cap = facility_stat('hatchery', self.facilities['hatchery']) if 'hatchery' in self.facilities else 1
        if self.active('hatch') < cap and self.spend(gold, 'hatch'):
            self.schedule('hatch', name, seconds, None)

    def scene(self, name, minutes):
        if name in self.checkpoints:
            return True
        if not self.pending('scene', name) and self.t + minutes * 60 < self.session_end():
            self.schedule('scene', name, minutes * 60, None)
        return False

    def first_hero(self):
        if not self.scene('opening', 6):
            return
        if not self.open:
            if self.feed('parasaurolophus'):
                self.exhibits.add('parasaurolophus')
                self.open = True
                self.checkpoint('opening')
            return
        if self.visitors >= FIRST_VISITORS:
            self.grant('visitors', EARLY_XP['visitors'])
        if self.level < 2:
            return
        self.build('platform', 1)
        if 'platform' not in self.facilities:
            return
        self.begin_mission('igua')
        self.hatch('iguanodon', FIRST_HATCH)
        for bid in ('lumber', 'quarry'):
            self.build(bid, 1)
        if 'iguanodon' not in self.dinos:
            return
        self.build('hatchery', 1)
        self.build('lab', 1)
        self.begin_mission('trike')
        self.begin_mission('stego')
        for name in PARENTS:
            # Wait for the optional hatchery before taking its parallel-hatch path.
            if 'hatchery' in self.facilities:
                self.hatch(name, int(P['parent_hatch_seconds']))
        if not all(name in self.dinos for name in PARENTS):
            return
        self.build('carnivore', 1)
        self.build('security', 1)
        if not all(name in self.facilities for name in ('carnivore', 'security')):
            return
        if not self.scene('safety_checked', 6):
            return
        self.grant('safety', EARLY_XP['safety'])
        self.build('hybrid_herb', 1)
        for name in ('dna1', 'dna2', 'culture'):
            self.begin_mission(name)
        if not all(name in self.claims for name in ('dna1', 'dna2', 'culture')):
            return
        if not self.scene('ch3_scene1', 1):
            return
        self.begin_mission('catalyst')
        if 'catalyst' not in self.claims or 'lab' not in self.facilities:
            return
        if not self.scene('ch3_scene6', 3):
            return
        if self.pending('synthesis', HERO):
            return
        for name in self.recipe['parentSpeciesIds']:
            if self.state(name)[0] < 30 or self.state(name)[1] > 80:
                if not self.feed(name):
                    return
        assert self.recipe['firstSynthesisRule']['successRate'] == 1
        assert all(self.ingredients[(i['material'], i['quality'])] >= i['amount'] for i in self.recipe['ingredients'])
        if self.spend(self.recipe['goldCost'], 'synthesis'):
            for item in self.recipe['ingredients']:
                self.ingredients[(item['material'], item['quality'])] -= item['amount']
            self.schedule('synthesis', HERO, self.recipe['durationMs'] // 1000, None)
            self.checkpoint('synthesis_started')

    def study(self, name, rank):
        if self.tech[name] >= rank:
            return
        assert rank == self.tech[name] + 1
        for dependency in research.event_dependencies(('tech', name, rank)):
            if dependency[0] == 'lab':
                self.build('lab', dependency[1])
                if self.facilities.get('lab', 0) < dependency[1]:
                    return
            elif self.tech[dependency[1]] < dependency[2]:
                self.study(*dependency[1:])
                return
        if self.pending('research'):
            self.waits.add('researcher')
            return
        row = research.actual_cost(name, rank, self.facilities['lab'])
        assert not row['after_hero'] or HERO in self.dinos
        if self.pay(row, 'research'):
            self.schedule('research', name, row['seconds'], rank)

    def growth(self):
        if 'hybrid_herb' not in self.facilities:
            self.build('hybrid_herb', 1)
            return
        if HERO not in self.exhibits:
            self.exhibits.add(HERO)
            self.checkpoint('chapter3_completed')
            self.event('exhibit', HERO)
        # Save for the vault after first hero and avoid buying optional projects first.
        target_vault = min(4, self.day['day'])
        if self.facilities['vault'] < target_vault:
            if not self.pending('build', 'vault'):
                self.build('vault', self.facilities['vault'] + 1)
        for name, day in (('feedmill', 2), ('warehouse', 2), ('metalshop', 4)):
            if self.day['day'] >= day and name not in self.facilities:
                self.build(name, 1)
        if self.level not in GROWTH_PATH:
            return
        row = GROWTH[self.level]
        facility, tech, field = GROWTH_PATH[self.level]
        assert all(selection in row[track].split(';') for selection, track in
                   zip((facility, tech, field), ('facility', 'research', 'field')))
        bid, blevel = facility.split(':')[1:]
        blevel = int(blevel)
        current_level = self.facilities.get(bid, 0)
        if current_level < blevel:
            self.build(bid, current_level + 1)
        nid, rank = tech.split(':')[1:]
        rank = int(rank)
        self.study(nid, rank)
        kind, field_id = field.split(':', 1)
        if kind == 'owned':
            egg = next(r for r in egg_missions().values() if r['species'] == field_id
                       and r['id'] == 'gene-target-' + field_id)
            self.begin_mission(egg['id'])
            self.hatch(field_id, egg['hatch_seconds'], egg['hatch_gold'])
            field_done = field_id in self.dinos
        else:
            self.begin_mission(field_id)
            field_done = field_id in self.claims
        reached = (self.facilities.get(bid, 0) >= blevel, self.tech[nid] >= rank,
                   field_done, self.visitors >= int(row['operation'].split(':')[1]))
        for track, done in zip(progression.TRACKS, reached):
            if done:
                self.grant(f'{row["park_level"]}:{track}', int(row[f'{track}_xp']))

    def session_end(self):
        day, seconds = divmod(self.t, DAY)
        windows = self.first_windows if day == 0 else RETURN_WINDOWS
        return next((day * DAY + end * 60 for start, end in windows
                     if start * 60 <= seconds < end * 60), 0)

    def run(self):
        for self.t in range(0, 7 * DAY, STEP):
            if self.t % DAY == 0:
                self.day = {'day': 1 + self.t // DAY, 'opening_gold': self.gold, 'minimum_gold': self.gold,
                            'admission': 0, 'paid_visitors': 0, 'upkeep': 0, 'upkeep_unpaid': 0,
                            'cap_minutes': 0.0, 'rejected_visitors': 0, 'online_minutes': 0.0,
                            'settled_minutes': 0.0, 'builder_busy_minutes': 0.0, 'researcher_busy_minutes': 0.0,
                            'feeds': 0, 'purchased': Counter(),
                            'spending_by_type': Counter(), 'produced': Counter(), 'wait_minutes': Counter()}
                self.records.append(self.day)
            online = bool(self.session_end())
            factor = 0.0
            if online:
                self.last_online = self.t + STEP
                factor = 1.0
                self.day['online_minutes'] += STEP / 60
            elif self.last_online is not None and self.t - self.last_online < P['offline_cap_seconds']:
                factor = float(P['offline_rate'])
            self.complete_jobs(online)
            if online:
                for name in sorted(self.dinos):
                    if self.state(name)[1] >= 50:
                        self.feed(name)
                if HERO in self.dinos:
                    self.growth()
                else:
                    self.first_hero()
                self.produce()
            self.day['builder_busy_minutes'] += sum(min(STEP, max(0, end - self.t)) for kind, _, end, _
                                                       in self.jobs if kind == 'build') / 60
            self.day['researcher_busy_minutes'] += sum(min(STEP, max(0, end - self.t)) for kind, _, end, _
                                                           in self.jobs if kind == 'research') / 60
            for wait in self.waits:
                self.day['wait_minutes'][wait] += STEP / 60
            self.waits.clear()
            self.accounting(factor)
            if (self.t + STEP) % DAY == 0:
                spent = sum(self.day['spending_by_type'].values())
                assert self.gold == self.day['opening_gold'] + self.day['admission'] - self.day['upkeep'] - spent
                assert 0 <= self.gold <= self.gold_capacity
                assert all(value >= 0 for value in self.stock.values())
                self.day.update({
                    'closing_gold': self.gold, 'gold_capacity': self.gold_capacity,
                    'closing_park': self.level, 'paid_visitors_total': self.visitors,
                    'spending': spent, **{name: self.stock[name] for name in MATERIALS},
                    'activity': sorted({e['name'] for e in self.events if self.t + STEP - DAY <= e['second']
                                        and e['kind'] == 'complete'}),
                })
        return self


def simulate_week():
    primary = Week(SESSION_WINDOWS).run()
    continuous = Week(((0, 330), (720, 740))).run()

    def summary(scenario):
        def elapsed_minutes(checkpoint):
            result = scenario.checkpoints.get(checkpoint)
            return result['seconds'] / 60 if result else None

        return {'hero_minutes': elapsed_minutes('hero_received'),
                'chapter3_minutes': elapsed_minutes('chapter3_completed'),
                'checkpoints': scenario.checkpoints, 'days': scenario.records}

    return {**summary(primary), 'continuous': summary(continuous), 'assumptions': ASSUMPTIONS}


if __name__ == '__main__':
    print(json.dumps(simulate_week(), ensure_ascii=False, indent=2))
