#!/usr/bin/env python3
"""Deterministic design scenarios; not live gameplay or a server economy implementation.
Run from any directory: python3 docs/models/check_balance_v04.py
Historical numeric inputs are read from archive/0.4/balance.md; species/recipe from built game-data.
"""
import json
import hashlib
import math
import re
import subprocess
from fractions import Fraction
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/archive/0.4/balance.md'


def check_source_maps():
    """Stop on stale package builds rather than read old catalog data."""
    provenance={}
    for package in ['game-data','shared']:
        map_path=ROOT/'packages'/package/'dist/index.js.map'
        source_map=json.loads(map_path.read_text())
        sources=source_map['sources']
        included=source_map['sourcesContent']
        assert len(sources)==len(included)
        digest=hashlib.sha256()
        for relative, content in zip(sources,included):
            source=(map_path.parent/(source_map.get('sourceRoot') or '')/relative).resolve()
            assert source.read_text()==content, f'Stale {package} build: {source}'
            digest.update(relative.encode())
            digest.update(content.encode())
        provenance[package]={'matching_sources':len(sources),'source_content_sha256':digest.hexdigest()}
    return provenance


def table(name):
    text = SOURCE.read_text().split('<!-- model:' + name + ' -->')[1].split('<!-- /model:' + name + ' -->')[0]
    rows = [[v.strip() for v in row.strip().strip('|').split('|')] for row in text.splitlines() if row.startswith('|')]
    return {row[0]: dict(zip(rows[0], row)) for row in rows[2:]}


PROVENANCE=check_source_maps()
PARAM = {k: float(v['value']) for k, v in table('params').items()}
PROD = {k: {f: int(v[f]) for f in ['buy', 'batch_cost', 'batch_qty', 'seconds', 'max_lots']} for k, v in table('production').items()}
BUILD = {k: {f: int(v[f]) for f in ['level', 'gold', 'wood', 'stone', 'metal', 'seconds', 'upkeep', 'capacity']} for k, v in table('buildings').items()}
MISSION = table('missions')
XP = {k: int(v['amount']) for k, v in table('xp').items()}
CATALOG = json.loads(subprocess.check_output(['node', '-e', "const d=require('./packages/game-data/dist/index.js'),s=require('./packages/shared/dist/index.js'); console.log(JSON.stringify({species:d.DINOSAUR_DATA,buildings:d.BUILDING_DATA,recipe:d.getSynthesisRecipe('stegoceratops'),starter:d.STARTER_PARK,status:{happinessDecay:s.HAPPINESS_DECAY_PER_HOUR,hungerIncrease:s.HUNGER_INCREASE_PER_HOUR}}));"], cwd=ROOT, text=True))
SPECIES = {d['id']: d for d in CATALOG['species']}
RECIPE = CATALOG['recipe']
PARENTS = RECIPE['parentSpeciesIds']
REQUIRED = {i['material']: i['amount'] for i in RECIPE['ingredients']}
BASE_UPKEEP = sum(b['baseStats']['maintenanceCost'] for b in CATALOG['buildings'] if b['id'] in {entry['typeId'] for entry in CATALOG['starter']['buildings']})
BASE_QUEUE = ['platform', 'hatchery', 'platform2', 'lab', 'carnivore', 'security', 'hybrid']
PRODUCERS = {'wood': 'lumber', 'stone': 'quarry', 'metal': 'metalshop', 'feed': 'feedmill'}


class Scenario:
    def __init__(self, name, strategy, visit_period=0, visit_length=300, mission_multiplier=1):
        self.name, self.strategy = name, strategy
        self.period, self.visit_length = visit_period, visit_length
        self.multiplier = mission_multiplier
        self.cash = int(PARAM['initial_gold'])
        self.minimum_cash = self.cash
        self.energy = int(PARAM['energy_max'])
        self.minimum_energy = self.energy
        self.energy_clock = 0
        self.owned = {'parasaurolophus': {'born': 0, 'happy': 75, 'hunger': 45, 'placed': False, 'cared': False}}
        self.collections = {'parasaurolophus'}
        self.active, self.constructing, self.production = {}, {}, {}
        self.eggs, self.hatches, self.missions = [], {}, {}
        self.stock, self.materials = Counter(), Counter()
        self.xp, self.level, self.awards = 0, 1, set()
        self.events, self.spent, self.gross, self.maintenance = [], Counter(), 0, 0
        self.visitors, self.visitor_carry, self.upkeep_carry = 0, 0.0, 0.0
        self.action, self.opened, self.research = None, False, None
        self.story = {'safety': 0, 'research': 0}
        self.story_done, self.first_claims, self.manual_seconds = set(), 0, 0
        self.queue = list(BASE_QUEUE)
        if strategy == 'produce':
            self.queue[3:3] = ['lumber', 'quarry']
        self.t = 0

    def event(self, kind, **details):
        self.events.append({'second': self.t, 'kind': kind, **details})

    def online(self, t):
        return not self.period or t < 900 or t % self.period < self.visit_length

    def room(self, seconds):
        return self.online(self.t) and (not self.period or all(self.online(t) for t in range(self.t, self.t + int(seconds) + 1)))

    def start_action(self, name, seconds, callback):
        if self.action or not self.room(seconds):
            return False
        self.action = (self.t + int(seconds), name, callback)
        self.manual_seconds += int(seconds)
        return True

    def spend(self, amount, kind):
        assert amount >= 0 and self.cash >= amount, (self.name, self.t, kind, self.cash, amount)
        self.cash -= amount
        self.spent[kind] += amount
        self.minimum_cash = min(self.minimum_cash, self.cash)

    def award(self, key):
        assert key not in self.awards
        self.awards.add(key)
        self.xp += XP[key]
        while self.level < 50 and self.xp >= math.floor(200 * self.level ** 1.8):
            self.xp -= math.floor(200 * self.level ** 1.8)
            self.level += 1
        self.event('xp', target=key, level=self.level, remaining=self.xp)

    def state(self, dino):
        age = max(0, self.t - dino['born']) / 3600
        return max(0, dino['happy'] - math.floor(CATALOG['status']['happinessDecay'] * age)), min(100, dino['hunger'] + math.floor(CATALOG['status']['hungerIncrease'] * age))

    def produce_income(self):
        if not self.opened:
            return
        groups = Counter()
        weights = []
        for sid, dino in self.owned.items():
            if not dino['placed']:
                continue
            # The three story raptors are represented individually by suffix keys.
            species_id = sid.split('#')[0]
            rank = groups[species_id]
            groups[species_id] += 1
            if rank >= 3:
                continue
            weight = SPECIES[species_id]['stats']['popularity'] * [1, .25, .1][rank]
            happy, hunger = self.state(dino)
            quality = (.5 + .5 * happy / 100) * (.5 if hunger > 80 else 1)
            weights.append((weight, quality))
        attraction = sum(v[0] for v in weights)
        quality = sum(w*q for w,q in weights)/attraction if attraction else 0
        demand = (8 + 4*attraction + 4*max(0,len(groups)-1))*quality
        capacity = min(PARAM['gate_capacity'], PARAM['base_capacity'] + max([b['capacity'] for k,b in self.active.items() if k.startswith('platform')] or [0]))
        rate = min(demand,capacity*60/PARAM['visit_seconds']) if groups else 0
        factor = 1 if self.online(self.t) else PARAM['offline_rate']
        self.visitor_carry += rate/60*factor
        count = math.floor(self.visitor_carry + 1e-10)
        self.visitor_carry -= count
        self.visitors += count
        self.gross += count * int(PARAM['ticket'])
        self.cash += count * int(PARAM['ticket'])
        upkeep = BASE_UPKEEP + sum(SPECIES[sid.split('#')[0]]['stats']['maintenanceCost'] for sid in self.owned)
        upkeep += sum(b['upkeep'] for k,b in self.active.items() if not (k == 'platform' and 'platform2' in self.active))
        self.upkeep_carry += upkeep/3600*factor
        debit = math.floor(self.upkeep_carry + 1e-10)
        self.upkeep_carry -= debit
        paid = min(self.cash,debit)
        self.cash -= paid
        self.maintenance += paid
        if self.visitors >= 10 and 'visitors' not in self.awards:
            self.award('visitors')

    def try_build(self):
        if self.constructing:
            return False
        key = next((k for k in self.queue if k not in self.active), None)
        if key is None:
            return False
        building = BUILD[key]
        if self.level < building['level'] or key == 'hybrid' and 'safety' not in self.story_done:
            return False
        missing = {m: max(0,building[m]-self.stock[m]) for m in ['wood','stone','metal']}
        if any(missing.values()):
            if self.strategy == 'produce' and any(n and PRODUCERS[m] in self.active for m,n in missing.items()):
                return False
            cost = sum(PROD[m]['buy'] * n for m,n in missing.items())
            if self.cash < cost + building['gold'] or any(self.stock[m]+n > PARAM['initial_capacity'] for m,n in missing.items()):
                return False
            def buy():
                self.spend(cost,'basic_purchase')
                self.stock.update(missing)
                self.event('buy_materials', resources=missing)
            return self.start_action('buy_materials',PARAM['action_seconds'],buy)
        if self.cash < building['gold']:
            return False
        def construct():
            self.spend(building['gold'],'construction')
            for m in missing:
                self.stock[m] -= building[m]
            self.constructing[key] = self.t + building['seconds']
            self.event('build_start',id=key,ready_at=self.constructing[key])
        return self.start_action('build_'+key,PARAM['action_seconds'],construct)

    def try_mission(self):
        key = None
        if 'platform' in self.active and 'igua' not in self.missions:
            key='igua'
        elif 'iguanodon' in self.awards and 'hatchery' in self.active:
            if 'trike' not in self.missions:
                key='trike'
            elif self.missions.get('trike') == 'claimed' and 'stego' not in self.missions:
                key='stego'
        if not key and all(p in self.awards for p in PARENTS) and 'lab' in self.active:
            key = next((m for m in ['dna1','dna2','culture'] if m not in self.missions),None)
            if key is None and 'research' in self.story_done and 'catalyst' not in self.missions:
                key='catalyst'
        if not key or self.energy < PARAM['energy_cost'] or self.cash < int(MISSION[key]['gold']):
            return False
        duration = int(PARAM['tutorial_mission_seconds' if key == 'igua' else 'mission_seconds'] * self.multiplier)
        if not self.room(duration):
            return False
        self.spend(int(MISSION[key]['gold']),'mission')
        self.energy -= int(PARAM['energy_cost'])
        self.minimum_energy=min(self.minimum_energy,self.energy)
        self.missions[key]='playing'
        def finish():
            self.missions[key]='ready'
            self.event('mission_ready',id=key)
        self.event('mission_start',id=key)
        return self.start_action('mission_'+key,duration,finish)

    def try_production(self):
        if self.strategy != 'produce':
            return False
        remaining = [k for k in self.queue if k not in self.active and k not in self.constructing]
        for material in ['wood','stone']:
            factory=PRODUCERS[material]
            recipe=PROD[material]
            required=sum(BUILD[k][material] for k in remaining)
            if factory not in self.active or material in self.production or self.stock[material] >= required or self.stock[material]+recipe['batch_qty'] > PARAM['initial_capacity'] or self.cash < recipe['batch_cost']:
                continue
            lots=min(recipe['max_lots'],math.ceil((required-self.stock[material])/recipe['batch_qty']),int((PARAM['initial_capacity']-self.stock[material])//recipe['batch_qty']),self.cash//recipe['batch_cost'])
            def start(material=material,recipe=recipe,lots=lots):
                self.spend(recipe['batch_cost']*lots,'production')
                self.production[material]={'ready':self.t+recipe['seconds']*lots,'quantity':recipe['batch_qty']*lots}
                self.event('production_start',material=material,lots=lots,quantity=self.production[material]['quantity'],ready_at=self.production[material]['ready'])
            return self.start_action('production_'+material,PARAM['action_seconds'],start)
        return False

    def choose_action(self):
        d=int(PARAM['action_seconds'])
        starter=self.owned['parasaurolophus']
        if not starter['cared']:
            if self.cash < PROD['feed']['buy']:
                return False
            def feed():
                self.spend(PROD['feed']['buy'],'feeding')
                starter.update(happy=95,hunger=0,born=self.t,cared=True)
                self.event('starter_fed')
            return self.start_action('starter_feed',d,feed)
        if not starter['placed']:
            def place():
                starter['placed']=True
                self.event('starter_placed')
            return self.start_action('place_starter',d,place)
        if not self.opened:
            def opening():
                self.opened=True
                self.event('opened')
            return self.start_action('open',d,opening)
        # Claiming is always a distinct manual action, never timer auto-awarding.
        for material, job in self.production.items():
            quantity=job['quantity']
            if job['ready'] <= self.t and self.stock[material]+quantity <= PARAM['initial_capacity']:
                def claim(material=material,quantity=quantity):
                    self.stock[material]+=quantity
                    self.production.pop(material)
                    self.event('production_claim',material=material,quantity=quantity)
                return self.start_action('claim_production',d,claim)
        for key,status in self.missions.items():
            if status == 'ready':
                def claim(key=key):
                    m=MISSION[key]
                    if m['species'] != '-': self.eggs.append((m['species'],PARAM['tutorial_hatch'] if key=='igua' else PARAM['parent_hatch']))
                    else: self.materials[m['material']]+=int(m['quantity'])
                    self.missions[key]='claimed'
                    self.event('mission_claim',id=key)
                return self.start_action('claim_mission',d,claim)
        for species,ready in self.hatches.items():
            if ready <= self.t:
                def hatch(species=species):
                    self.hatches.pop(species)
                    self.owned[species]={'born':self.t,'happy':100,'hunger':0,'placed':False,'cared':False}
                    self.collections.add(species)
                    self.event('hatch_claim',id=species)
                return self.start_action('claim_hatch',d,hatch)
        slots=3 if 'hatchery' in self.active else 1
        if self.eggs and len(self.hatches) < slots:
            def hatch_start():
                species,duration=self.eggs.pop(0)
                self.hatches[species]=self.t+duration
                self.event('hatch_start',id=species,ready_at=self.hatches[species])
            return self.start_action('start_hatch',d,hatch_start)
        for species,dino in self.owned.items():
            if not dino['cared']:
                happy,hunger=self.state(dino)
                assert happy>=80 and hunger<=20, (self.name,species,'newborn state must qualify, not force food')
                def care(species=species,dino=dino):
                    dino['cared']=True
                    if species in XP: self.award(species)
                    self.event('care_confirm',id=species,feed_used=0)
                return self.start_action('care',d,care)
            if not dino['placed']:
                if species == 'stegoceratops' and 'hybrid' not in self.active: continue
                if '#' in species and 'safety' not in self.story_done: continue
                def place(species=species,dino=dino):
                    dino['placed']=True
                    self.event('place',id=species)
                return self.start_action('place',d,place)
        if self.research is not None and self.research <= self.t:
            def claim_research():
                assert self.first_claims==0
                self.first_claims+=1
                self.owned['stegoceratops']={'born':self.t,'happy':100,'hunger':0,'placed':False,'cared':False}
                self.collections.add('stegoceratops')
                self.research=None
                self.event('synthesis_claim',rarity='epic',first_guaranteed=True)
            return self.start_action('claim_synthesis',d,claim_research)
        if self.try_mission() or self.try_build():
            return True
        if all(p in self.awards for p in PARENTS) and all(b in self.active for b in ['carnivore','security']):
            for chapter,needed in [('safety','safety_reading'),('research','research_reading')]:
                if chapter in self.story_done: continue
                chunk=min(60,int(PARAM[needed])-self.story[chapter])
                def read(chapter=chapter,needed=needed,chunk=chunk):
                    self.story[chapter]+=chunk
                    if self.story[chapter] >= PARAM[needed]:
                        self.story_done.add(chapter)
                        self.event('story_complete',chapter=chapter)
                        if chapter=='safety':
                            self.award('safety')
                            for i in range(3): self.owned['velociraptor#'+str(i)]={'born':self.t,'happy':100,'hunger':0,'placed':False,'cared':True}
                if self.start_action('story_'+chapter,chunk,read): return True
        if not self.first_claims and self.research is None and 'research' in self.story_done and 'hybrid' in self.active and all(self.materials[k]>=v for k,v in REQUIRED.items()) and self.cash >= RECIPE['goldCost']:
            assert all(p in self.owned for p in PARENTS)
            assert all(self.state(self.owned[p])[0]>=30 and self.state(self.owned[p])[1]<=80 for p in PARENTS)
            def synthesis():
                self.spend(RECIPE['goldCost'],'research')
                for material,amount in REQUIRED.items(): self.materials[material]-=amount
                self.research=self.t+RECIPE['durationMs']//1000
                self.event('synthesis_start',success_rate=1,ready_at=self.research)
            return self.start_action('synthesis',d,synthesis)
        return self.try_production()

    def run(self):
        for self.t in range(12*3600):
            self.produce_income()
            if self.energy < PARAM['energy_max']:
                self.energy_clock+=1
                if self.energy_clock>=PARAM['energy_recharge']:
                    self.energy+=1
                    self.energy_clock-=int(PARAM['energy_recharge'])
            else: self.energy_clock=0
            for key,ready in list(self.constructing.items()):
                if ready<=self.t:
                    self.active[key]=BUILD[key]
                    del self.constructing[key]
                    self.event('build_complete',id=key)
            if self.action and self.action[0]<=self.t:
                _,_,callback=self.action
                self.action=None
                callback()
            if self.first_claims and self.owned['stegoceratops']['placed']:
                assert self.cash == int(PARAM['initial_gold']) + self.gross - self.maintenance - sum(self.spent.values())
                assert all(v>=0 for v in self.stock.values()) and all(v>=0 for v in self.materials.values())
                assert self.collections >= {'stegoceratops',*PARENTS}
                assert self.first_claims==1
                assert sum(e['kind']=='synthesis_claim' for e in self.events)==1
                assert self.minimum_energy>=0
                return self.report()
            if not self.action and self.online(self.t): self.choose_action()
        raise AssertionError((self.name,'not completed',self.level,self.cash,self.stock,self.active.keys(),self.story,self.missions))

    def report(self):
        def time(kind, id=None):
            return next((e['second'] for e in self.events if e['kind']==kind and (id is None or e.get('id')==id)),None)
        return {'name':self.name,'strategy':self.strategy,'elapsed_seconds':self.t,'manual_seconds':self.manual_seconds,'first_platform_start':time('build_start','platform'),'second_dinosaur_placed':time('place','iguanodon'),'synthesis_start':time('synthesis_start'),'synthesis_claim':time('synthesis_claim'),'cash':self.cash,'minimum_cash_after_actions':self.minimum_cash,'energy':self.energy,'minimum_energy':self.minimum_energy,'visitors':self.visitors,'gross_gold':self.gross,'maintenance_gold':self.maintenance,'spending':dict(self.spent),'total_cost':sum(self.spent.values()),'final_stock':dict(self.stock),'research_remaining':dict(self.materials),'park_level':self.level,'xp_remaining':self.xp,'owned_count':len(self.owned),'species_count':len({key.split('#')[0] for key in self.owned}),'production_claims':sum(e['kind']=='production_claim' for e in self.events),'events':self.events}


def model_edge_checks():
    # A full warehouse leaves the completed output untouched until space exists.
    example=Scenario('warehouse-check','produce')
    example.opened=True
    example.owned['parasaurolophus'].update(cared=True,placed=True,happy=95,hunger=0)
    example.stock['wood']=int(PARAM['initial_capacity'])
    quantity=PROD['wood']['batch_qty']*PROD['wood']['max_lots']
    example.production['wood']={'ready':0,'quantity':quantity}
    example.choose_action()
    assert example.stock['wood']==PARAM['initial_capacity'] and 'wood' in example.production
    example.action=None
    example.stock['wood']-=quantity
    assert example.choose_action()
    _,name,claim=example.action
    assert name=='claim_production'
    claim()
    assert example.stock['wood']==PARAM['initial_capacity'] and 'wood' not in example.production
    assert not example.spent and example.energy==PARAM['energy_max']
    # Invariant for a constant-state interval, with carry across arbitrary polling partitions.
    popularity=sum(SPECIES[k]['stats']['popularity'] for k in ['parasaurolophus','iguanodon'])
    rate=Fraction(str((8+4*popularity+4)*.975))
    upkeep=BASE_UPKEEP+sum(SPECIES[k]['stats']['maintenanceCost'] for k in ['parasaurolophus','iguanodon'])+BUILD['platform']['upkeep']
    def settle(parts,factor):
        visitors=fees=0;vcarry=Fraction(0);mcarry=Fraction(0)
        for seconds in parts:
            vcarry+=rate*seconds*factor/60
            count=int(vcarry);vcarry-=count;visitors+=count
            mcarry+=Fraction(upkeep)*seconds*factor/3600
            debit=int(mcarry);mcarry-=debit;fees+=debit
        return visitors*int(PARAM['ticket']),fees,vcarry,mcarry
    for factor in [Fraction(1),Fraction(str(PARAM['offline_rate']))]:
        assert settle([9999],factor)==settle([17]*588+[3],factor)
    return {'completed_batch_preserved_when_full':True,'manual_claim_once':True,'constant_state_partition_invariance_online_and_offline':True}


def main():
    assert RECIPE['firstSynthesisRule']['successRate']==1 and SPECIES['stegoceratops']['rarity']=='epic'
    rewards=Counter()
    for m in MISSION.values():
        if m['material']!='-':
            assert int(m['quality'])==2
            rewards[m['material']]+=int(m['quantity'])
    assert dict(rewards)==REQUIRED
    assert sum(int(m['gold']) for m in MISSION.values())==1900
    assert sum(BUILD[k]['wood'] for k in BASE_QUEUE)==170
    assert sum(BUILD[k]['stone'] for k in BASE_QUEUE)==150
    assert all(BUILD[k][m] <= PARAM['initial_capacity'] for k in BASE_QUEUE for m in ['wood','stone','metal'])
    levels=[]
    xp=0; level=1
    for key in ['visitors','iguanodon','triceratops','stegosaurus','safety']:
        xp+=XP[key]
        while xp>=math.floor(200*level**1.8):
            xp-=math.floor(200*level**1.8);level+=1
        levels.append(level)
    assert levels==[2,3,3,4,5],levels
    edge_checks=model_edge_checks()
    rows=[Scenario('continuous-buy','buy').run(),Scenario('continuous-produce','produce').run(),Scenario('20min-return-buy','buy',1200,300).run(),Scenario('20min-return-produce','produce',1200,300).run(),Scenario('30min-return-slower','buy',1800,420,1.5).run()]
    payback={}
    for material,recipe in PROD.items():
        factory=BUILD[PRODUCERS[material]]
        investment=factory['gold']+sum(factory[m]*PROD[m]['buy'] for m in ['wood','stone','metal'])
        saving=recipe['batch_qty']*recipe['buy']-recipe['batch_cost']
        assert saving>0 and factory['upkeep']==0
        batches=math.ceil(investment/saving)
        payback[material]={'investment_at_purchase_material_prices':investment,'savings_per_unit':recipe['buy']-recipe['batch_cost']/recipe['batch_qty'],'linear_allocation_units_to_break_even':investment/(saving/recipe['batch_qty']),'whole_batches':batches,'equal_output_units':batches*recipe['batch_qty'],'continuous_production_seconds':batches*recipe['seconds']}
    report={'kind':'deterministic design model, not live gameplay','source':'docs/current/balance.md model tables and built game-data','assumptions':['one-second accumulation','manual inputs follow deterministic priority, not an optimal strategy proof','first 15 minutes online; return scenarios then online first 5/7 minutes of each 20/30 minute period','missions consume actual online input time; first tutorial 90 seconds, other normal missions 120 seconds; slower scenario 1.5 times','story reading/targets assumed 10 minutes per chapter; not measured content length','newborns use current creation defaults 100 happiness/0 hunger; no mandatory food charge','one manually started production job per facility, combining up to three base lots with linear cost/time/output','constructing becomes active at timer end; production/egg/synthesis rewards require manual claim','offline cap is not exercised: return gaps are under 30 minutes','grid paths, API concurrency and actual mission fun are outside model'], 'source_provenance':PROVENANCE,'model_edge_checks':edge_checks,'xp_milestone_levels':levels,'production_payback':payback,'scenarios':rows}
    output=ROOT/'tmp/preview/balance-v04-check.json'
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    for row in rows: print(json.dumps({k:v for k,v in row.items() if k!='events'},ensure_ascii=False))
    print(json.dumps({'payback':payback,'xp_levels':levels},ensure_ascii=False))

if __name__=='__main__':
    main()
