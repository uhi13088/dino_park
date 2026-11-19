#!/usr/bin/env python3
"""Generate a readable design view from canonical follow-up tables, not game config."""
from __future__ import annotations
import argparse, hashlib, json
from fractions import Fraction as F
from pathlib import Path
import followup_content_model_v06 as m

ROOT=m.ROOT
OUTPUT=ROOT/'docs/current/followup-content-tables.md'
MATERIAL={'dna':'DNA 샘플','culture':'배양액','catalyst':'합성 촉매','stabilizer':'안정제','mutation_cell':'변이세포'}
QUALITY={1:'하급',2:'중급',3:'상급'}
AREA={'fossil-valley':'화석 계곡','primal-swamp':'원시 습지','abandoned-lab':'버려진 연구소','mineral-cave':'광물 동굴','mutation-crater':'변이 분화구'}
RARITY={'common':'일반','uncommon':'고급','rare':'희귀','epic':'영웅','legendary':'전설'}
FAC={k:v['건물'] for k,v in m.building.BUILD.items()}|{k:v['name'] for k,v in m.SPECIAL.items()}

def number(x):
    if isinstance(x,F) and x.denominator != 1:return f'{float(x):,.2f}'
    return f'{int(x):,}'

def duration(n):
    n=int(n)
    units=[(86400,'일'),(3600,'시간'),(60,'분'),(1,'초')];out=[]
    for scale,label in units:
        a,n=divmod(n,scale)
        if a:out.append(f'{a}{label}')
    return ' '.join(out) or '즉시'

def mdtable(headers,rows):
    return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |',
                      *['| '+' | '.join(str(v).replace('|','&#124;').replace('\n',' ') for v in row)+' |' for row in rows]])

def research(ref):
    if ref=='previous_registration':return '해당 종의 영구 도감 등록 이력'
    if ref=='first_hero':return '첫 지정 영웅 수령 후'
    if ref=='analysis2_lab5_park15':return '분석2·연구소5·파크15'
    node,rank=ref.rsplit(':',1)
    return f'{m.effect.cost.NODES[node]["항목"]} Lv.{rank}'


def supply_case(requirements,quality,choices,collection_rank=0,supply_rank=0):
    missions=m.material_missions();details=[]
    totals={'runs':0,'fuel':0,'gold':0,'conversion_gold':0,'active_seconds':0}
    for material,needed in requirements.items():
        if not needed:continue
        row=missions[choices[material]];r=row['reward'];assert r['material']==material
        factor=int(m.building.P['quality_upgrade_ratio'])**max(0,quality-r['quality'])
        per_run=int(r['quantity'])
        # The optional DNA bonus remains low quality; only this explicit case uses it.
        if material=='dna' and r['quality']==1:per_run+=int(m.effect.value('exp-collection',collection_rank))
        needed_raw=needed*factor;runs=m.building.ceil(F(needed_raw,per_run))
        conversion=0
        for q in range(quality,r['quality'],-1):
            target_count=needed*int(m.building.P['quality_upgrade_ratio'])**(quality-q)
            conversion+=target_count*int(m.building.P['quality_high_gold'] if q==3 else m.building.P['quality_mid_gold'])
        fuel=(max(5,row['fuel']-int(m.effect.value('exp-expedition-supply',supply_rank))) if row['fuel']==10 else row['fuel'])
        values={'runs':runs,'fuel':runs*fuel,'gold':runs*row['gold'],'conversion_gold':conversion,
                'active_seconds':runs*int(m.PLAY[row['play']]['arithmetic_seconds'])}
        for key in totals:totals[key]+=values[key]
        details.append({'material':material,'needed':needed,'mission':row['id'],**values})
    return {'totals':totals,'materials':details}


def supply_examples():
    para=supply_case({'dna':40,'catalyst':2,'culture':3,'mutation_cell':2},2,
                    {'dna':'mission.fossil-valley.repeat-rim-survey.v1','culture':'mission.primal-swamp.repeat-reedbank-survey.v1',
                     'catalyst':'mission.abandoned-lab.basic-catalyst.v1','mutation_cell':'mission.mutation-crater.basic-mutation-cell.v1'})
    recipe=m.synthesis_actual('indominus-rex-maximus',dna_rank=5,legendary_rank=3,lab_level=25)
    required={k:recipe[k] for k in ['dna','catalyst','culture']};required['stabilizer']=1
    direct={'dna':'mission.fossil-valley.high-repeat.v1','catalyst':'mission.abandoned-lab.high-repeat.v1',
            'culture':'mission.primal-swamp.high-repeat.v1','stabilizer':'mission.mineral-cave.high-repeat.v1'}
    legend=supply_case(required,3,direct,supply_rank=5)
    bulk=supply_case(required,3,{**direct,'dna':'mission.fossil-valley.apex-carnivore-track.v1'},collection_rank=3,supply_rank=5)
    return {'para_lux_lab5':para,'legend_direct':legend,'legend_bulk_dna':bulk}


def render():
    species,actual,provenance=m.catalogue();material=m.material_missions();eggs=m.egg_targets();recipes=m.recipe_data()
    lines=['# 연구 해금 뒤의 확장·탐험·합성 상세표 0.6','',
           '**정본에서 생성한 읽기용 표입니다. 게임 적용 완료를 뜻하지 않습니다.** 비용은 [밸런스16~17절](balance.md#16-실제-부지-확장과-특수-사육시설), 종·합성은 [DNA 기획](dna-and-collection.md), 사육은 [건물 기획](buildings.md), 조작은 [탐험 플레이](exploration-play.md)를 수정한 뒤 다시 생성합니다.','',
           '현재 실행 카탈로그는81종이며 이번에 추가하기로 한 원종2종까지 포함한 기획 목록은83종입니다. 기존21시설525행과 신규 특수5시설125행을 합친26시설650행 중, 이 문서에는 추가125행을 표시합니다. 연구72개·252회 비용/시간과 기존 첫 성장 경로는 보존합니다.','',
           '## 토지 확장','',
           '연구 권한을 얻은 뒤 아래 비용으로 별도 공사합니다. 한 건은 건설자1명을 사용하며 기존 공룡·시설은 이동하지 않습니다. 입구 위치가 바뀌어야 하면 확장 미리보기에서 무료 이동을 함께 확인합니다.','']
    land=[];previous=20
    for stage,r in m.LAND.items():
        width=int(r['width']);land.append([stage,f'{width}×{width}',number(width*width-previous*previous),research(r['research']),number(r['gold']),f'{r["wood"]}/{r["stone"]}/{r["metal"]}',duration(r['seconds'])]);previous=width
    lines += [mdtable(['단계','완공 면적','추가 칸','필요 연구','골드','목재/석재/금속','기본 공사'],land),'',
              '토지는 건축 골드·자재 할인을 적용하지 않고 공사 시간 보정만 적용합니다. 기존에 확보한 더 큰 부지와 입구·배치 이력은 보존합니다.','',
              '## 특수 사육시설의 25레벨','',
              '표의 비용은 해당 레벨을 완성하는 한 번의 기본 비용입니다. L1은 새 건설, 이후는 강화입니다. 각 시설은 같은 점유 면적을 유지하고 총 수용량은 실제9자리를 넘지 않습니다. 24→25는 일반 단축 뒤에도 최소7일입니다.','']
    for identifier,definition in m.SPECIAL.items():
        lines += [f'### {definition["name"]}','',f'필요 연구: {research(definition["research"])} · 점유 {definition["width"]}×{definition["height"]} · 상세 호환종은 아래 종별 표와 연구의 환경 호환 목록을 따릅니다.','']
        rr=[]
        for level in range(1,26):
            r=m.special_upgrade(identifier,level)
            rr.append([level,number(r['gold']),f'{r["wood"]}/{r["stone"]}/{r["metal"]}',duration(r['seconds']),r['capacity'],f'{level-1}%',number(r['upkeep'])])
        lines += [mdtable(['레벨','골드','목재/석재/금속','기본 공사','총 개체 수용','상태 악화 완화','유지비/시간'],rr),'']
    lines += ['## 재료 미션 준비비와 보상','',
              '기초5개와 연구 해금41개입니다. 보상은 성공 후 수동 수령하며, 오답·재개는 추가 비용이 없습니다. 활동시간은 설계 산술 가정이며 자동 완료 타이머가 아닙니다. 추가 하급DNA 효과와 적격 하급 미션의 추가 관측 모드는 이 표의 기본 보상과 별도입니다.','']
    rr=[]
    for identifier,r in material.items():
        reward=r['reward'];fuel='10→5' if r['fuel']==10 else str(r['fuel'])
        rr.append([r.get('name',AREA[r['area_id']]+' 기초 반복'),AREA[r['area_id']],research(r['research']),
                   f'{QUALITY[reward["quality"]]} {MATERIAL[reward["material"]]} {reward["quantity"]}',number(r['gold']),fuel,r['checks'],duration(m.PLAY[r['play']]['arithmetic_seconds'])])
    lines += [mdtable(['미션','장소','해금','기본 보상','준비 골드','연료','판단 수','숙련 산술'],rr),'',
              '연료10→5는 지정 장거리8개에만 원정 보급 계획을 적용한 범위입니다. 기본5연료 미션은 추가 감소하지 않습니다.','',
              '## 원종·추가 부모 알 목표','',
              '기존 유전 연구42목표·레시피 추가 부모4목표·시작 원종 재입수5목표입니다. 각 새 유료 회차를 성공하면 선택 종 알1개를 받습니다. 부화 뒤 보유/도감 등록이 가능하고 실제 전시에는 별도 환경·거대종·안전·빈칸 조건이 필요합니다.','']
    rr=[]
    for identifier,r in eggs.items():
        rr.append([species[r['species']]['nameKo']+(' (기획 추가)' if r['species'] not in actual else ''),RARITY[r['rarity']],AREA[r['area']],research(r['research']),number(r['gold']),r['fuel'],duration(r['hatch_seconds'])])
    lines += [mdtable(['종','등급','기본 조사 장소','목표 연구','준비 골드','연료','일반 부화'],rr),'',
              '첫 이구아노돈60초·첫 트리케라/스테고1시간은 기존 예외입니다. 새 일반 목표는 부화 수수료를 별도로 더하지 않습니다.','',
              '## 후속·보완 합성 레시피','',
              '공개 인도미누스의 비용·시간 보완1개와 후속9개·추가 변종2개입니다. 기존 스테고케라톱스·파라 룩스·스피노랩터 레시피는 DNA 정본을 그대로 따릅니다. 각 부모의 실제 개체를 보유해야 하고 성공·실패 모두 부모를 보존합니다.','']
    rr=[]
    for identifier,r in recipes.items():
        ingredients=' / '.join(f'{MATERIAL[k]} {r[k]}' for k in ['dna','catalyst','culture','mutation_cell'] if r.get(k))
        rr.append([r['name'],RARITY[r['rarity']],' + '.join(species[p]['nameKo'] for p in r['parents']),QUALITY[r['quality']]+' '+ingredients,number(r['gold']),duration(r['seconds']),research(r['required_research'])])
    lines += [mdtable(['결과','등급','실제 보유 부모','필수 재료','기본 골드','기본 합성','필요 연구'],rr),'',
              '추가 변종2개는 고급 유전자 분석2·연구소5·파크15를 요구합니다. 영웅50%·최대5번째 보호, 전설30%·최대8번째 보호를 유지합니다. 선택 안정제는 최소 품질 이상1개입니다. 보유와 전시를 구별하며, 공개 레시피가 원래 요구한 안전 선행은 보존합니다.','',
              '## 종별 기본 전시 경로','',
              '83종의 원래 서식지 경로입니다. 같은 행의 경로는 대안(또는)입니다. 관리형 화산·빙하 등 추가 전시 대안은 연구 효과의 명시 호환 목록을 따릅니다. 거대종만을 위한 새 건물을 추가하지 않습니다.','']
    rr=[]
    for identifier,r in m.HOUSES.items():
        paths=json.loads(r['alternatives'])
        rr.append([r['name']+(' (기획 추가)' if identifier not in actual else ''),' / '.join(f'{FAC[x["facility"]]} Lv.{x["min_level"]}' for x in paths),research(r['giant_permission']) if r['giant_permission']!='-' else '없음',r['security_points']])
    lines += [mdtable(['종','기본 호환 시설','거대종 허가','위험 점수'],rr),'',
              '## 재료 확보 산술 예시','',
              '아래는 시작 재고0에서 충분한 재료를 모으는 한 가지 경로이며 최적해·필수 플레이량·완료일 예측이 아닙니다. 필요한 연구/원종 접근을 갖췄다고 가정하고 부화·시설·합성 대기, 연료 구매비와 병렬 소득은 제외합니다. 추가 관측 모드는 선택하지 않은 경로입니다. 직접 상급 조사에서 생기는 추가 하급DNA는 보관하고 이 충분량 계산에는 쓰지 않습니다.','']
    cases=supply_examples();labels={'para_lux_lab5':'파라 룩스 · Lab5 기존 경로','legend_direct':'제왕종 · 상급 직접 조사','legend_bulk_dna':'제왕종 · DNA만 하급 대량 후 승급'}
    rr=[]
    for key,v in cases.items():
        r=v['totals'];rr.append([labels[key],r['runs'],duration(r['active_seconds']),r['fuel'],number(r['gold']),number(r['conversion_gold'])])
    lines += [mdtable(['예시','회차','가정 활동시간','총 연료','준비 골드','승급 골드'],rr),'',
              '제왕종 예시는 DNA 정량 배양5+전설 조합3으로 DNA160→112, 촉매8·배양액12·선택 안정제1의 상급 재료를 준비합니다. 하급 대량 경로는 정밀 채집3·원정 보급5를 가정합니다. 파라 룩스는 기존 중급40/2/3·변이2를 연구소5의 기초/지도화 경로로 모으는 예시이며 첫 지정 합성에는 이 반복 수집을 강제하지 않습니다.','',
              '연료는 자연회복과 보급소 생산·골드 구매 중 선택해 보충합니다. 자연회복만의 대기시간을 위 활동시간과 혼동하지 않습니다. 짧은 연속 미션은 보급소 생산보다 연료를 빨리 소비할 수 있으므로 연료를 사전 비축하거나 골드 구매를 선택할 수 있습니다. 실제 세션 빈도·골드 순수급·재미는 구현 후 검증합니다.','']
    return '\n'.join(lines), {'special_rows':125,'land_stages':5,'material_missions':len(material),'egg_targets':len(eggs),
                              'recipes':len(recipes),'housing_species':len(m.HOUSES),'runtime_species':len(actual),
                              'planned_species':len(species),'supply_examples':cases,'catalog_provenance':provenance}


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    text,details=render()
    if args.write:OUTPUT.write_text(text)
    else:assert OUTPUT.read_text()==text,'Generated follow-up table is stale; run --write'
    files=['docs/current/balance.md','docs/current/research-effects.md','docs/current/research-trees.md',
           'docs/current/dna-and-collection.md','docs/current/buildings.md','docs/current/exploration-play.md',
           'docs/models/followup_content_model_v06.py','docs/models/render_followup_content_v06.py']
    report={'status':'pass','kind':'generated canonical design view, not game tests','mode':'write' if args.write else 'check',
            **details,'source_sha256':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files}}
    out=ROOT/'tmp/preview/followup-content-tables-v06-check.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['supply_examples','source_sha256']},ensure_ascii=False))

if __name__=='__main__':main()
