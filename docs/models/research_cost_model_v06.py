"""Planning cost/time calculation only. Canonical inputs are current Markdown.
No runtime configuration, wallet mutation or gameplay scheduling is performed.
"""
from __future__ import annotations
from pathlib import Path
from fractions import Fraction as F
from functools import lru_cache
import re
import sys
sys.dont_write_bytecode=True
import check_building_progression_v06 as building

ROOT=Path(__file__).resolve().parents[2]
TECH=ROOT/'docs/current/research-trees.md'
BALANCE=ROOT/'docs/current/balance.md'
DAY=86400

def marked(text,kind,name):
    block=text.split(f'<!-- {kind}:{name} -->')[1].split(f'<!-- /{kind}:{name} -->')[0]
    a=[[v.strip() for v in line.strip().strip('|').split('|')] for line in block.splitlines() if line.startswith('|')]
    assert all(len(x)==len(a[0]) for x in a)
    return [dict(zip(a[0],x)) for x in a[2:]]

TEXT=TECH.read_text()
NODES={r['id']:r for group in ['ops','care','exp','gene'] for r in marked(TEXT,'tech','nodes-'+group)}
LABS={k:list(map(int,r['연구소단계'].split(','))) for k,r in NODES.items()}
PARENTS={k:[] if r['선행']=='-' else [(v.split(':')[0],int(v.split(':')[1])) for v in r['선행'].split(',')] for k,r in NODES.items()}
LEGACY={(r['group'],int(r['level'])):r for r in building.table('tech-costs')}
BANDS={int(r['lab']):r for r in building.table('research-bands')}
ROLES={r['id']:r for r in building.table('research-roles')}
RANKS={int(r['rank']):r for r in building.table('research-ranks')}
FAMILIES={r['id']:r for r in building.table('research-families')}
ASSIGN={r['id']:r['roles'].split(',') for r in building.table('research-assignment')}
EFFECTS={r['id']:r for r in marked(TEXT,'tech','effects')}
POLICY={r['id']:int(r['value']) for r in building.table('research-policy')}
ROUNDING=sorted((int(r['from_seconds']),int(r['quantum'])) for r in building.table('research-rounding'))
CAPS=[(int(r['rank']),int(r['lab']),int(r['cap'])) for r in marked(TEXT,'tech','engineering-caps')]

@lru_cache(None)
def effective_lab(node_id,rank):
    return max([LABS[node_id][rank-1]]+[effective_lab(p,n) for p,n in PARENTS[node_id]])

@lru_cache(None)
def after_hero(node_id,rank):
    # Preserve legacy A4/5's metal gate even on the three initial basic nodes.
    legacy=NODES[node_id]['비용군']!='N'
    metal=int(LEGACY[NODES[node_id]['비용군'],rank]['metal']) if legacy else 0
    return bool(int(NODES[node_id]['첫영웅후']) or metal or any(after_hero(p,n) for p,n in PARENTS[node_id]))

def round_base_time(raw):
    raw=F(raw)
    quantum=max((start,quantum) for start,quantum in ROUNDING if raw>=start)[1]
    return min(POLICY['max_base_seconds'],building.ceil(raw,quantum))

def base_cost(node_id,rank):
    node=NODES[node_id];lab=effective_lab(node_id,rank)
    assert 1<=rank<=int(node['max'])
    if node['비용군']!='N':
        row=LEGACY[node['비용군'],rank]
        data={k:int(row[k]) for k in ['gold','wood','stone','metal','seconds']}
        role='legacy';floor=int(row['min_seconds'])
    else:
        row=BANDS[lab];factor=RANKS[rank];role=ASSIGN[node_id][rank-1];importance=ROLES[role];family=FAMILIES[node_id.split('-')[0]]
        data={'gold':building.ceil(F(row['gold'])*F(factor['gold_factor'])*F(importance['gold_factor']),POLICY['gold_quantum'])}
        for m in ['wood','stone','metal']:
            data[m]=building.ceil(F(row[m])*F(factor['material_factor'])*F(importance['material_factor'])*F(family[m+'_factor']),POLICY['material_quantum'])
        data['seconds']=round_base_time(F(row['seconds'])*F(factor['time_factor'])*F(importance['time_factor']))
        floor=POLICY['new_final_min_seconds'] if rank==int(node['max']) and after_hero(node_id,rank) else 0
    floor=max(floor,int(BANDS[lab]['min_seconds']))
    if lab>=POLICY['ultra_lab']:floor=max(floor,int(ROLES[role]['ultra_min_days'])*DAY if role!='legacy' else POLICY['legacy_ultra_min_seconds'])
    data['seconds']=max(data['seconds'],floor)
    return {'id':node_id,'name':node['항목'],'family':node['계열'],'level':rank,'required_lab':lab,'declared_lab':LABS[node_id][rank-1],
            'role':role,'min_seconds':floor,'after_hero':after_hero(node_id,rank),**data}

def effect(node_id,completed):
    assert 0<=completed<=int(NODES[node_id]['max'])
    return F(0) if completed==0 else F(EFFECTS[node_id][f'Lv.{completed}'])/100

@lru_cache(None)
def event_dependencies(event):
    if event[0]=='lab':
        level=event[1]
        deps=[('lab',level-1)] if level>1 else []
        required=next(rank for rank,_lab,cap in CAPS if level<=cap)
        if required:deps.append(('tech','ops-engineering',required))
        return tuple(deps)
    _,node_id,rank=event
    deps=[('lab',LABS[node_id][rank-1])]+[('tech',p,n) for p,n in PARENTS[node_id]]
    if rank>1:deps.append(('tech',node_id,rank-1))
    return tuple(deps)

@lru_cache(None)
def event_closure(event):
    return frozenset([event])|frozenset(d for p in event_dependencies(event) for d in event_closure(p))

def snapshot_is_feasible(node_id,rank,lab,budget_level=0,protocol_level=0):
    """New-progression snapshots, excluding any grandfathered legacy rights."""
    if not (effective_lab(node_id,rank)<=lab<=25 and 0<=budget_level<=5 and 0<=protocol_level<=5):return False
    if node_id=='gene-study-budget' and budget_level!=rank-1:return False
    if node_id=='gene-study-protocol' and protocol_level!=rank-1:return False
    target=('tech',node_id,rank)
    completed=[('lab',lab),*event_dependencies(target)]
    if budget_level:completed.append(('tech','gene-study-budget',budget_level))
    if protocol_level:completed.append(('tech','gene-study-protocol',protocol_level))
    closure=frozenset(d for event in completed for d in event_closure(event))
    if target in closure:return False
    for event in closure:
        if event[0]=='lab' and event[1]>lab:return False
        if event[0]=='tech' and event[1]=='gene-study-budget' and event[2]>budget_level:return False
        if event[0]=='tech' and event[1]=='gene-study-protocol' and event[2]>protocol_level:return False
    return True

def actual_cost(node_id,rank,lab,budget_level=0,protocol_level=0):
    assert snapshot_is_feasible(node_id,rank,lab,budget_level,protocol_level),'Invalid completed snapshot or future/cross-dependent discount'
    row=base_cost(node_id,rank)
    row['gold']=building.ceil(row['gold']*(1-effect('gene-study-budget',budget_level)),POLICY['actual_gold_quantum'])
    row['seconds']=max(row['min_seconds'],building.ceil(row['seconds']*(1-building.primary('lab',lab)/100)*(1-effect('gene-study-protocol',protocol_level)),POLICY['actual_time_quantum']))
    return row

def all_costs():return [base_cost(k,rank) for k,n in NODES.items() for rank in range(1,int(n['max'])+1)]
