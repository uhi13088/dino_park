#!/usr/bin/env python3
"""Verify the book's currentness, coverage, pagination, internal links and glyph bounds."""
import copy, hashlib, json, re
from collections import Counter
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from pypdf import PdfReader
import pdfplumber
import build_guidebook as gb

ROOT=gb.ROOT;TMP=gb.TMP

def verify_scout_guide(plan, document):
 """Verify the published dispatch rules and navigation after a gameplay replacement."""
 pages=plan['pages'];numbers=plan['numbers']
 spot_targets={'scout-'+region for region,_ in gb.content.SCOUT_REGIONS}
 assert spot_targets<=numbers.keys() and 'scout-expedition' in numbers
 spots=[block for page in pages if page['id'] in spot_targets
        for block in page['blocks'] if block.get('headers')==['스팟','난도','획득','바로 파견할 조건']]
 assert len(spots)==10 and all(len(block['rows'])==8 for block in spots)
 assert {'expedition-play','deep-expedition'}.isdisjoint(numbers)
 headings=''.join(document.xpath('//w:t/text()',namespaces=document.nsmap))
 retired=('주행','미니게임','육상원정조작','좌우조향','좌우로끌','세단서를직접','오답','탐험에너지')
 plain=re.sub(r'\s+','',headings)
 assert not any(term in plain for term in retired),'Retired exploration instructions in Word'
 deep_survey=gb.content.model.material_missions()['mission.fossil-valley.high-repeat.v1']
 amount=deep_survey['reward']['quantity']
 cells=document.xpath('//w:tr[count(w:tc)=4 and w:tc[1]//w:t="심층 보존층"]/w:tc',namespaces=document.nsmap)
 assert len(cells)==4,'Deep preserved bed row missing from Word'
 reward,conditions=[''.join(cell.xpath('.//w:t/text()',namespaces=document.nsmap)) for cell in cells[2:]]
 assert reward==f'상급 DNA 샘플 {amount}개','Deep preserved bed reward differs from source'
 assert f"{deep_survey['gold']:,}골드" in conditions,'Deep preserved bed dispatch cost differs from source'
 assert '연료' not in conditions,'Deep preserved bed must remain a regular dispatch'
 fuel_topics=('scout-long-range-fuel','special-expedition-fuel','scout-deep-sea')
 links=document.xpath('//w:hyperlink/@w:anchor',namespaces=document.nsmap)
 assert all(target in numbers and gb.anchor(target) in links for target in fuel_topics)
 meadow_topic='first-meadow-dispatch'
 meadow_anchor=gb.anchor(meadow_topic)
 assert meadow_topic in numbers and links.count(meadow_anchor)>=4
 meadow_intro=''.join(document.xpath(
     '//w:p[w:bookmarkStart/@w:name=$anchor]/following-sibling::w:p[.//w:t][1]//w:t/text()',
     namespaces=document.nsmap,anchor=meadow_anchor))
 assert all(phrase in meadow_intro for phrase in ('운영 안내를 닫고','파크 뒤 초원',
     '첫 관람대를 완공','첫 탐험가 파견','이구아노돈 알을 받으면'))
 paid=[r for r in gb.content.model.scout_dispatches() if r['fuel']==10]
 long_range_rows=[['지역','조사 목표','필요 연료'],*[[r['region'],r['title'],str(r['fuel'])] for r in paid]]
 tables=document.xpath('//w:tbl[w:tr[1]/w:tc[3]//w:t="필요 연료"]',namespaces=document.nsmap)
 assert len(tables)==1,'Long-range fuel table missing from Word'
 actual=[[''.join(cell.xpath('.//w:t/text()',namespaces=document.nsmap))
          for cell in row.xpath('./w:tc',namespaces=document.nsmap)]
         for row in tables[0].xpath('./w:tr',namespaces=document.nsmap)]
 assert actual==long_range_rows,'Long-range dispatch fuel quantities differ from source'
 assert len(paid)==7 and all(phrase in plain for phrase in ('모든스팟에서준비비와연료5','10분마다1이자동으로','개당100골드','연료5를만드는한회분은300골드'))
 return {'regions':len(spots),'spots':sum(len(block['rows']) for block in spots),'deep_preserved_bed_dna':amount,
         'long_range_fuel_goals':len(paid),'fuel_topics':{target:numbers[target] for target in fuel_topics},
         'first_meadow_page':numbers[meadow_topic]}

def verify_habitat_space_guide(plan, document):
 """Match the space proposal and its links against the generated Word content."""
 heads, rows, _costs = gb.content.aviary_space_display()
 namespaces = document.nsmap
 tables = document.xpath('//w:tbl[w:tr[1]/w:tc[1]//w:t="공간 단계"]', namespaces=namespaces)
 assert len(tables) == 1, 'Aviary physical space table missing or duplicated'
 actual = [[''.join(cell.xpath('.//w:t/text()', namespaces=namespaces))
            for cell in row.xpath('./w:tc', namespaces=namespaces)]
           for row in tables[0].xpath('./w:tr', namespaces=namespaces)]
 assert actual == [heads, *[list(map(str, row)) for row in rows]], 'Wrong aviary space limits in Word'
 links = document.xpath('//w:hyperlink/@w:anchor', namespaces=namespaces)
 assert links.count(gb.anchor('habitat-space-design')) >= 8
 text = ''.join(document.xpath('//w:t/text()', namespaces=namespaces))
 assert '아래는 서식지 편집 설계다.' in text
 assert '거대 익룡은 5단계에서 돔당 한 마리까지 전시' in text
 return {'aviary_space_rows': len(rows), 'habitat_design_page': plan['numbers']['habitat-space-design']}

def verify_habitat_fence_guide(plan, document):
 """Verify that the current fence instructions, comparison and links reached Word."""
 target='habitat-fence-upgrade'
 bookmark=gb.anchor(target)
 ns=document.nsmap
 heading=document.xpath('//w:p[w:bookmarkStart/@w:name=$bookmark]',namespaces=ns,bookmark=bookmark)
 assert len(heading)==1
 paragraphs=heading[0].xpath('following-sibling::w:p[.//w:t or .//w:drawing][position() <= 4]',namespaces=ns)
 text=lambda para:''.join(para.xpath('.//w:t/text()',namespaces=ns))
 assert all(habitat in text(paragraphs[0]) for habitat in ('초원','숲','육식','초식 하이브리드','사막','화산','빙하'))
 assert 'Lv.5 강화' in text(paragraphs[0]) and '이전 울타리' in text(paragraphs[0])
 assert 'Lv.1부터 전기 울타리' in text(paragraphs[1]) and '허용 점수' in text(paragraphs[1])
 assert len(paragraphs[2].xpath('.//w:drawing',namespaces=ns))==2
 assert text(paragraphs[3])=='육식 서식지 · Lv.1(왼쪽)과 Lv.5(오른쪽)'
 assert document.xpath('//w:hyperlink/@w:anchor',namespaces=ns).count(bookmark)>=4
 return {'fence_upgrades':len(gb.content.park_artwork_preview()['habitatFences']),
         'fence_guide_page':plan['numbers'][target]}


def verify_experimental_hybrid_guide(plan, document):
 """Confirm the new experiment cost table and its player navigation reach Word."""
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 targets=('experimental-hybrids','hybrid-research-notes','hybrid-research-market','research-material-upgrades',
          'dangerous-dinosaur-exhibit')
 assert all(target in plan['numbers'] for target in targets)
 links=document.xpath('//w:hyperlink/@w:anchor',namespaces=ns)
 assert all(gb.anchor(target) in links for target in targets)
 source=next(block for block in gb.content.narrative('docs/current/dna-and-collection.md')
             if block.get('headers',[])[0:1]==['결과와 방식'])
 expected=[source['headers'],*source['rows']]
 assert len(expected)==5
 for table in document.xpath('//w:tbl',namespaces=ns):
  cells=[[''.join(cell.xpath('.//w:t/text()',namespaces=ns))
          for cell in row.findall('w:tc',ns)] for row in table.findall('w:tr',ns)]
  if cells[:1]==[expected[0]]:
   assert cells==expected, 'Experimental hybrid costs differ between source and Word'
   break
 else:raise AssertionError('Experimental hybrid cost table missing from Word')
 payout_copy='금고에 공간을 만든 뒤 판매 대금 수령을 누른다.'
 body=[''.join(p.xpath('.//w:t/text()',namespaces=ns))
       for p in document.xpath('//w:body/w:p',namespaces=ns)]
 assert any(payout_copy in paragraph for paragraph in body),'Market payout guidance missing from Word'
 safety_copy='완공된 호환 서식지에 들어간 위험 공룡은 관람길을 잇기 전에도 점수를 쓴다.'
 assert any(safety_copy in paragraph for paragraph in body),'Shared security guidance missing from Word'
 return {'cost_rows':len(expected)-1,'topics':{target:plan['numbers'][target] for target in targets},
         'market_payout_copy':True,'shared_security_copy':True}

def verify_dinosaur_acquisition(plan, document):
 """Check source coverage, parent paths, and the plan's actual Word content."""
 import dinosaur_acquisition_model_v06 as acq
 from render_dinosaur_acquisition_v06 import route_info, route_summary
 rows=acq.acquisition_rows();source={r['species_id']:r for r in rows}
 catalogue,_,_=acq.catalogue();repeat_eggs=acq.repeat_egg_targets();indexed_eggs=acq.egg_targets();recipes=acq.all_recipe_data()
 assert len(rows)==len(source)==83 and set(source)==set(catalogue),'Acquisition source/catalogue coverage'
 natural={sid for sid,r in source.items() if r['origin']=='natural'}
 assert len(natural)==68 and len(repeat_eggs)==68 and len(indexed_eggs)==69
 assert len({r['species'] for r in repeat_eggs.values()})==68
 assert {r['species'] for r in repeat_eggs.values()}==natural,'Natural species without repeat acquisition'
 assert set(repeat_eggs)<set(indexed_eggs)
 extra=[r for mid,r in indexed_eggs.items() if mid not in repeat_eggs]
 assert len(extra)==1 and extra[0]['species']=='velociraptor' and extra[0].get('starter_first'),'First raptor goal is not a repeat species'
 assert len(recipes)==15 and set(recipes)==set(source)-natural,'Recipe result coverage'
 for sid in natural:
  route=source[sid]['repeat'];target=repeat_eggs.get(route['ref'])
  assert route['kind']=='egg_mission' and target and target['species']==sid,('Repeat acquisition target mismatch',sid)
 seen=set();active=set()
 def visit(sid):
  assert sid in source,('Recipe parent has no acquisition source',sid)
  assert sid not in active,('Acquisition parent cycle',sid)
  if sid in seen:return
  if sid in recipes:
   active.add(sid);parents=recipes[sid]['parents']
   assert parents and len(parents)==len(set(parents)),('Invalid recipe parents',sid)
   for parent in parents:visit(parent)
   active.remove(sid)
  else:assert sid in natural,('Parent acquisition does not terminate in a natural route',sid)
  seen.add(sid)
 for sid in recipes:visit(sid)
 pages=plan['pages'];numbers=plan['numbers'];counts=plan['counts']
 assert counts['species']==83 and counts['recipes']==15 and counts['egg_targets']==69,'Guide acquisition totals differ from source'
 assert {a.removeprefix('dino-') for a in numbers if a.startswith('dino-')}==set(source),'Guide species/source IDs differ'
 recipe_pages={sid:[p for p in pages if p['id']=='recipe-'+sid or p['id'].startswith('recipe-'+sid+'-cont-')] for sid in recipes}
 assert {p['id'] for p in pages if p['id'].startswith('recipe-') and '-cont-' not in p['id']}=={'recipe-'+sid for sid in recipes},'Guide recipe/source IDs differ'
 table_ids=[];routes={};selected_pages=set();current_profile=None
 normalize=lambda value:re.sub(r'\s+','',str(value))
 for page in pages:
  if not page['id'].startswith('dinosaurs-'):current_profile=None
  for block in page.get('blocks',[]):
   if block.get('anchor','').startswith('dino-'):current_profile=block['anchor'].removeprefix('dino-')
   if 'acquisition_species_ids' in block:
    assert block['type']=='table' and len(block['acquisition_species_ids'])==len(block['rows']),('Acquisition table row metadata mismatch',page['id'])
    selected_pages.add(page['id'])
    for sid,values in zip(block['acquisition_species_ids'],block['rows']):
     assert sid in source and normalize(source[sid]['name']) in normalize(' '.join(map(str,values))),('Acquisition row name/source mismatch',sid)
     row=source[sid];first=route_info(row['first']);repeat=route_info(row['repeat'])
     if row['origin']=='natural':
      assert len(values)==5,('Natural acquisition table column count',sid)
      for label,info,cells in [('first',first,values[1:3]),('repeat',repeat,values[3:5])]:
       text=normalize(' '.join(map(str,cells)))
       assert all(normalize(info[field]) in text for field in ('method','gate','cost','time')),('Natural acquisition table source values changed',sid,label)
     else:
      assert len(values)==4,('Synthesis acquisition table column count',sid)
      text=normalize(' '.join(map(str,values[1:])))
      assert all(normalize(source[parent]['name']) in normalize(values[1]) for parent in recipes[sid]['parents']),('Acquisition table parent names changed',sid)
      ingredients=first['parents_materials'].split(' / ',1)[1]
      assert all(normalize(value) in text for value in (first['gate'],ingredients,first['cost'],first['time'],first['claim_rule'],repeat['claim_rule'])),('Synthesis acquisition table source values changed',sid)
     table_ids.append(sid)
   if 'acquisition_species_id' in block:
    sid=block['acquisition_species_id'];route=block.get('acquisition_route');key=(sid,route)
    assert block['type']=='p' and sid in source and route in {'first','repeat'},('Invalid acquisition paragraph metadata',page['id'],key)
    assert current_profile==sid,('Acquisition route attached to a different species profile',page['id'],sid,current_profile)
    assert key not in routes,('Duplicate acquisition profile route',key)
    assert normalize(block['text']) and not re.search(r'기존\s*획득\s*참고|기존\s*스토리/알/이벤트',block['text']),('Legacy acquisition fallback',key)
    expected=('최초 ' if route=='first' else '반복 ')+route_summary(source[sid][route])
    assert normalize(block['text'])==normalize(gb.content.clean(expected)),('Profile acquisition source values changed',key)
    routes[key]=block['text'];selected_pages.add(page['id'])
 assert len(table_ids)==len(set(table_ids))==83 and set(table_ids)==set(source),'Acquisition table does not cover each species exactly once'
 assert set(routes)=={(sid,route) for sid in source for route in ('first','repeat')},'Missing first/repeat profile acquisition route'
 # Recipe values must come from the acquisition provider, including the four
 # public recipes; metadata coverage alone would not detect changed parents.
 for sid,recipe in recipes.items():
  own=recipe_pages[sid];assert own,('Missing recipe page',sid)
  selected_pages.update(p['id'] for p in own)
  blocks=[b for p in own for b in p.get('blocks',[])]
  parents=[b['text'] for b in blocks if b['type']=='p' and b['text'].startswith('실제 보유 부모 ')]
  expected='실제 보유 부모 '+' + '.join(source[parent]['name'] for parent in recipe['parents'])
  assert list(map(normalize,parents))==[normalize(expected)],('Guide recipe parent values changed',sid)
  actual=[row for b in blocks if b['type']=='table' and b['headers']==['항목','기본값'] for row in b['rows']]
  expected=[[gb.content.MATERIAL[k],recipe[k]] for k in gb.content.MATERIAL if recipe.get(k)]+[['골드',f'{recipe["gold"]:,}'],['합성 시간',gb.content.duration(recipe['seconds'])]]
  assert [[normalize(v) for v in row] for row in actual]==[[normalize(v) for v in row] for row in expected],('Guide recipe resource/time values changed',sid)
 # Compare selected page tables and route paragraphs to the actual Word body,
 # using page bookmarks rather than assuming one table per physical page.
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 boundaries={gb.anchor(p['id']):p['id'] for p in pages};written_tables={pid:[] for pid in selected_pages};written_text={pid:[] for pid in selected_pages};current=None
 for node in document.find('w:body',ns):
  if node.tag=='{'+ns['w']+'}p':
   marks=node.xpath('.//w:bookmarkStart/@w:name',namespaces=ns)
   matches=[boundaries[m] for m in marks if m in boundaries]
   if matches:current=matches[0]
   if current in written_text:written_text[current].append(normalize(''.join(node.xpath('.//w:t/text()',namespaces=ns))))
  elif node.tag=='{'+ns['w']+'}tbl' and current in written_tables:
   written_tables[current].append([[normalize(''.join(tc.xpath('.//w:t/text()',namespaces=ns))) for tc in tr.findall('w:tc',ns)] for tr in node.findall('w:tr',ns)])
 for page in pages:
  pid=page['id']
  if pid not in selected_pages:continue
  expected_tables=[[[normalize(v) for v in row] for row in [b['headers'],*b['rows']]] for b in page.get('blocks',[]) if b['type']=='table']
  assert written_tables[pid]==expected_tables,('Acquisition/recipe Word table values changed',pid)
  expected_text=Counter(normalize(b['text']) for b in page.get('blocks',[]) if b['type']=='p' and ('acquisition_species_id' in b or b['text'].startswith('실제 보유 부모 ')))
  assert not expected_text-Counter(written_text[pid]),('Acquisition/recipe paragraph missing in Word',pid)
 return {'species':83,'first_routes':83,'repeat_routes':83,'repeat_egg_species':68,'indexed_egg_goals':69,'recipes':15,'parent_paths_covered':True,'acquisition_table_rows':len(table_ids),'word_tables_and_routes_preserved':True}

def verify_park_progression(plan, document):
 """Trace all finite growth goals from their source through plan and Word cells."""
 import park_progression_model_v06 as progression
 import dinosaur_acquisition_model_v06 as acquisition
 levels=progression.level_rows();goals=progression.goal_rows();summary=progression.summary()
 expected_levels=list(range(5,50));source={r['id']:r for r in goals}
 assert [r['park_level'] for r in levels]==expected_levels,'Park progression source transition range'
 assert len(goals)==len(source)==180 and summary['transitions']==45 and summary['goals']==180,'Park progression source goal coverage'
 assert summary['early_goal_xp']==4800 and summary['park5_carry_xp']==35,'Early Park XP/carry changed'
 assert summary['new_goal_xp']==3964614 and sum(r['xp'] for r in goals)==3964614,'Finite Park XP total changed'
 assert summary['max_park_level']==50 and summary['remaining_at_park50']==0,'Park level cap/carry changed'
 assert summary['cumulative_to_park50']==summary['early_goal_xp']+summary['new_goal_xp'],'Park 50 XP accounting'
 for level in levels:
  own=[r for r in goals if r['park_level']==level['park_level']]
  assert len(own)==4 and {r['track'] for r in own}==set(progression.TRACKS),('Park source four-track coverage',level['park_level'])
  assert all(r['next_park_level']==level['park_level']+1 and type(r['xp']) is int and r['xp']>0 for r in own),('Invalid Park source goal',level['park_level'])
  assert sum(r['xp'] for r in own)==level['new_xp'],('Park source per-level XP',level['park_level'])
 pages=plan['pages'];numbers=plan['numbers'];headers=['성장 목표','완료 조건','Park XP']
 strategy_levels=set(progression.CURRENT_STRATEGY_LEVELS)
 published_goals={gid for gid,goal in source.items() if goal['park_level'] not in strategy_levels}
 def normalized(value):return re.sub(r'\s+','',gb.content.clean(value))
 def xp_value(value):
  raw=normalized(value).replace(',','')
  assert re.fullmatch(r'\d+',raw),('Invalid Park XP cell',value)
  return int(raw)
 def page_level(page):
  values=[page['progression_level']] if 'progression_level' in page else []
  values.extend(b['progression_level'] for b in page.get('blocks',[]) if 'progression_level' in b)
  assert values and all(type(v) is int and v in expected_levels for v in values),('Missing/invalid progression level metadata',page['id'])
  assert len(set(values))==1,('Conflicting progression level metadata',page['id'],values)
  return values[0]
 planned={};planned_levels=set();selected=set()
 for page in pages:
  pid=page['id'];growth_page=re.fullmatch(r'park-level-(\d+)(?:-cont-\d+)?',pid)
  tagged='progression_level' in page or any('progression_level' in b or 'progression_goal_ids' in b for b in page.get('blocks',[]))
  if growth_page or tagged:
   park=page_level(page);planned_levels.add(park);selected.add(pid)
   if growth_page:assert int(growth_page[1])==park,('Park page/metadata mismatch',pid,park)
  else:park=None
  if pid=='park-growth-walkthrough' or pid.startswith('park-growth-walkthrough-cont-'):
   selected.add(pid)
  for block in page.get('blocks',[]):
   is_table=block['type']=='table' and block['headers']==headers
   if 'progression_goal_ids' not in block:
    assert not is_table,('Growth table without source goal IDs',pid)
    continue
   assert is_table and park is not None,('Invalid growth table metadata',pid)
   goal_ids=block['progression_goal_ids'];rows=block['rows']
   assert len(goal_ids)==len(rows) and rows,('Growth table chunk goal metadata not sliced',pid)
   for gid,row in zip(goal_ids,rows):
    assert gid in published_goals and gid not in planned,('Unknown or unpublished Park goal',pid,gid)
    own=source[gid]
    assert own['park_level']==park and len(row)==3,('Park goal table owner/columns',pid,gid)
    expected_condition=' 또는 '.join(progression.condition_label(c) for c in own['conditions']['any_of'])
    assert normalized(progression.goal_label(own))==normalized(expected_condition),('Inconsistent Park source label',gid)
    assert normalized(row[0]).startswith(normalized(own['track_label'])),('Park goal track label changed',gid)
    assert normalized(row[1])==normalized(expected_condition),('Park goal condition changed',gid)
    assert xp_value(row[2])==own['xp'],('Park goal XP changed',gid)
    planned[gid]=pid
 assert planned_levels==set(expected_levels),'Guide Park transition coverage'
 assert set(planned)==published_goals,'Guide Park goals missing/duplicated'
 for level in strategy_levels:
  page=next(p for p in pages if p['id']==f'park-level-{level}')
  target=gb.content.STRATEGY_TOPICS[level]
  assert target in numbers and any(b.get('target')==target for b in page['blocks']),('Current strategy link missing',level)
 assert all(f'park-level-{n}' in numbers for n in expected_levels),'Guide Park level anchors missing'
 assert not [p['id'] for p in pages if re.match(r'park-level-(?:[0-4]|50)(?:$|-cont-)',p['id'])],'Guide goal outside Park 5 through 49'
 assert {'park-progression-rules','park-progression-overview'}<=set(numbers),'Guide progression overview/rules missing'
 # The bridge remains one source for the 17 existing later scenes and its
 # actual mission references; do not infer coverage from advertised counts.
 screenplay=(ROOT/'docs/current/story-progression.md').read_text()
 bridge=screenplay.split('## 11. 첫 합성 이후 본편의 성장 연결',1)[1].split('## 변경 기록',1)[0]
 scene_ids=re.findall(r'^\| `((?:ch[456]-scene-|epilogue-scene-)[^`]+)` \|',bridge,re.M)
 expected_scenes={f'ch4-scene-{i}' for i in range(1,6)}|{f'ch5-scene-{i}' for i in range(1,5)}|{'ch6-scene-1','ch6-scene-2'}|{f'ch6-scene-3-{kind}' for kind in ('hopeful','realistic','tragic')}|{f'epilogue-scene-{kind}' for kind in ('hopeful','realistic','tragic')}
 assert len(scene_ids)==len(set(scene_ids))==17 and set(scene_ids)==expected_scenes,'Later story source scene coverage'
 known_goals=set(source)|set(acquisition.egg_targets())|set(acquisition.followup.material_missions())
 mission_refs={ref for ref in re.findall(r'`([^`]+)`',bridge) if ref.startswith(('mission.','natural-target-','gene-target-','parent-target-','return-target-','park-growth-'))}
 assert mission_refs<=known_goals,('Later story references unknown goal IDs',sorted(mission_refs-known_goals))
 story_pages=[p for p in pages if p['id']=='story-current-section-11' or p['id'].startswith('story-current-section-11-cont-')]
 assert story_pages and 'story-current-section-11' in numbers,'Later story bridge missing from guide'
 selected.update(p['id'] for p in story_pages)
 def plan_text(page):
  return ''.join(normalized(v) for b in page.get('blocks',[]) for v in ([*b['headers'],*(v for row in b['rows'] for v in row)] if b['type']=='table' else [b.get('text','')]))
 story_text=''.join(plan_text(p) for p in story_pages)
 planned_scene_ids=[normalized(row[0]) for p in story_pages for b in p.get('blocks',[]) if b['type']=='table' and normalized(b['headers'][0])=='장면ID' for row in b['rows']]
 assert Counter(planned_scene_ids)==Counter(map(normalized,scene_ids)),'Later story scene rows missing/duplicated in guide'
 assert all(normalized(ref) in story_text for ref in expected_scenes|mission_refs),'Later story scene/goal ID omitted from guide'
 # Page bookmarks delimit actual Word content even when one source table was
 # split across several planned pages with repeated headers.
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 boundaries={gb.anchor(p['id']):p['id'] for p in pages};written_tables={pid:[] for pid in selected};written_text={pid:[] for pid in selected};current=None
 for node in document.find('w:body',ns):
  if node.tag=='{'+ns['w']+'}p':
   matches=[boundaries[m] for m in node.xpath('.//w:bookmarkStart/@w:name',namespaces=ns) if m in boundaries]
   if matches:current=matches[0]
   if current in written_text:written_text[current].append(normalized(''.join(node.xpath('.//w:t/text()',namespaces=ns))))
  elif node.tag=='{'+ns['w']+'}tbl' and current in written_tables:
   table=[[normalized(''.join(tc.xpath('.//w:t/text()',namespaces=ns))) for tc in tr.findall('w:tc',ns)] for tr in node.findall('w:tr',ns)]
   written_tables[current].append(table);written_text[current].extend(v for row in table for v in row)
 for page in pages:
  pid=page['id']
  if pid not in selected:continue
  expected_tables=[[[normalized(v) for v in row] for row in [b['headers'],*b['rows']]] for b in page.get('blocks',[]) if b['type']=='table']
  assert written_tables[pid]==expected_tables,('Park progression/story Word table values changed',pid)
  walkthrough=pid=='park-growth-walkthrough' or pid.startswith('park-growth-walkthrough-cont-')
  metadata_text=Counter(normalized(b['text']) for b in page.get('blocks',[]) if b['type']=='p' and (walkthrough or 'progression_level' in b))
  assert not metadata_text-Counter(written_text[pid]),('Park progression paragraph missing in Word',pid)
 written_story=''.join(v for p in story_pages for v in written_text[p['id']])
 assert all(normalized(ref) in written_story for ref in expected_scenes|mission_refs),'Later story scene/goal ID omitted from Word'
 return {'transitions':45,'model_goal_rows':180,'published_goal_rows':len(planned),'current_strategy_levels':sorted(strategy_levels),'new_goal_xp':3964614,'early_goal_xp':4800,'park5_carry_xp':35,'max_park_level':50,'remaining_at_park50':0,'later_story_scenes':17,'later_story_goal_refs':len(mission_refs),'source_plan_word_values_preserved':True,'missing_goals':0}

def verify_figure_levels(plan, document, figures):
 """Preserve every source level value through the plan and actual Word tables."""
 pages=plan['pages'];profiles=figures['figures'];ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 assert len(profiles)==50 and len({f['id'] for f in profiles})==50
 expected={};owners={}
 for f in profiles:
  assert [v['level'] for v in f['levels']]==list(range(1,11)),('Figure source levels',f['id'])
  expected[f['id']]=[[v['level'],v['possession_value'],v['assignment_value'] if f['assignment_effect']['available'] else '-',v['xp_to_next'] if v['level']<10 else '-',v['gold_to_next'] if v['level']<10 else '-'] for v in f['levels']]
  matches=[p for p in pages if any(b.get('anchor')=='figure-'+f['id'] for b in p.get('blocks',[]))]
  assert len(matches)==1,('Figure profile heading coverage',f['id'])
  owners[matches[0]['id'].split('-cont-')[0]]=f['id']
 def is_levels(headers):return len(headers)==5 and headers[0]=='Lv' and headers[1].startswith('보유 효과') and headers[2].startswith('배정 효과')
 planned={fid:[] for fid in expected};written={fid:[] for fid in expected}
 for page in pages:
  fid=owners.get(page['id'].split('-cont-')[0])
  if fid:
   for block in page.get('blocks',[]):
    if block['type']=='table' and is_levels(block['headers']):planned[fid].extend(block['rows'])
 page_owners={gb.anchor(p['id']):owners.get(p['id'].split('-cont-')[0]) for p in pages}
 profile_marks={gb.anchor('figure-'+fid):fid for fid in expected};current=None
 names={f['id']:re.sub(r'\s+','',gb.content.clean(f['name'])) for f in profiles}
 written_names=set()
 for node in document.find('w:body',ns):
  if node.tag=='{'+ns['w']+'}p':
   marks=node.xpath('.//w:bookmarkStart/@w:name',namespaces=ns)
   profile=[profile_marks[m] for m in marks if m in profile_marks]
   boundary=[m for m in marks if m in page_owners]
   if profile:
    current=profile[0]
    title=re.sub(r'\s+','',''.join(node.xpath('.//w:t/text()',namespaces=ns)))
    assert names[current] in title,('Figure name missing from its Word bookmark',current)
    written_names.add(current)
   elif boundary:current=page_owners[boundary[0]]
  elif node.tag=='{'+ns['w']+'}tbl':
   rows=[[''.join(tc.xpath('.//w:t/text()',namespaces=ns)).strip() for tc in tr.findall('w:tc',ns)] for tr in node.findall('w:tr',ns)]
   if rows and is_levels(rows[0]):
    assert current in written,'Unowned figure level table in Word'
    written[current].extend(rows[1:])
 def value(v):
  s=str(v).strip()
  return s if s=='-' else Decimal(s.replace(',','').replace('%',''))
 for kind,actual in [('plan',planned),('Word',written)]:
  for fid,source in expected.items():
   assert len(actual[fid])==10,(kind,'Figure level row coverage',fid,len(actual[fid]))
   assert [[value(v) for v in row] for row in actual[fid]]==[[value(v) for v in row] for row in source],(kind,'Figure level values changed',fid)
 assert plan['counts']['figure_levels']==500 and written_names==set(expected)
 return {'profiles':50,'levels_per_profile':10,'level_rows':500,'planned_values_preserved':True,'word_values_preserved':True}

def verify_single_current_plan(chapters, pages, outline):
 # A source filename or historical event may mention an earlier document;
 # the reader-facing chapter structure must present one current game plan.
 forbidden=re.compile(r'구버전|보관본|원안\s*(?:기획|참고|자료)')
 labels=[ch['title'] for ch in chapters]+[p['title'] for p in pages if p.get('chapter_open')]+list(outline)
 assert not [v for v in labels if forbidden.search(v)],'Separate legacy/reference chapter in current guidebook'
 return {'current_chapters':len(chapters),'separate_legacy_chapters':0}

def verify_word_outline(plan, document, styles, reader):
 """Check the actual Word outline, including inherited and direct levels.

 Logical-block bookmarks remain navigation destinations even when repeated
 block titles are absent from Word's navigation pane. Derive the
 outline independently of the builder's paragraph-style selection.
 """
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 tag=lambda name:'{'+ns['w']+'}'+name
 pages=plan['pages'];numbers=plan['numbers']
 chapters=[ch for page in pages for ch in page.get('chapters',[])]
 assert [ch['number'] for ch in chapters]==list(range(1,13)),'Word outline chapter coverage'
 h1={ch['id'] for ch in chapters}|{'toc','toc-1','index'}
 topics={target for ch in chapters for _,target in ch['topics']}
 profiles={block['anchor'] for page in pages if page['id'].startswith(('people-','figures-','dinosaurs-')) for block in page.get('blocks',[]) if block.get('anchor','').startswith(('dino-','figure-','character-'))}
 h2=(topics-profiles)|{'read-first','park-progression-rules'}
 assert len(h1)==15 and len(h2)==36 and not h1&h2,'Word semantic outline contract changed'
 assert not [target for target in h2 if target.startswith('park-level-') or '-cont-' in target],'Physical continuation/level title in semantic outline'
 assert {page['id']:page['title'] for page in pages if page['id'] in {'toc','toc-1'}}=={'toc':'목차','toc-1':'빠른 찾기'},'Contents/quick-find page titles'
 expected=[]
 for page in pages:
  pid=page['id']
  if pid in h1 or pid in h2:
   expected.append({'target':pid,'page_id':pid,'level':0 if pid in h1 else 1,'text':page['title']})
  for block in page.get('blocks',[]):
   target=block.get('anchor')
   if target not in h2:continue
   assert block['type']=='h' and not block.get('title_anchor'),('Unsupported core outline anchor',target)
   scene=re.match(r'^(prologue scene \d+|ch[123] scene \d+)\s+(.+)',block['text'])
   expected.append({'target':target,'page_id':pid,'level':1,'text':scene[2] if scene else block['text']})
 assert len(expected)==len(h1|h2) and {entry['target'] for entry in expected}==h1|h2,'Missing/duplicate semantic outline target'
 assert all(entry['target'] in numbers for entry in expected),'Outline destination missing from physical page map'
 by_style={style.get(tag('styleId')):style for style in styles.findall('w:style',ns)}
 defaults=styles.xpath('./w:style[@w:type="paragraph" and @w:default="1"]/@w:styleId',namespaces=ns)
 assert len(defaults)<=1,'Multiple default paragraph styles'
 memo={}
 def style_level(sid,active=()):
  if not sid:return 9
  if sid in memo:return memo[sid]
  assert sid not in active,('Cyclic Word paragraph-style inheritance',sid)
  assert sid in by_style,('Unknown Word paragraph style',sid)
  style=by_style[sid];own=style.find('w:pPr/w:outlineLvl',ns)
  parent=style.find('w:basedOn',ns)
  level=int(own.get(tag('val'))) if own is not None else style_level(parent.get(tag('val')) if parent is not None else None,(*active,sid))
  assert 0<=level<=9,('Invalid Word style outline level',sid,level)
  memo[sid]=level;return level
 def paragraph_level(paragraph):
  own=paragraph.find('w:pPr/w:outlineLvl',ns)
  if own is not None:
   level=int(own.get(tag('val')))
   assert 0<=level<=9,('Invalid direct Word outline level',level)
   return level
  style=paragraph.find('w:pPr/w:pStyle',ns)
  return style_level(style.get(tag('val')) if style is not None else (defaults[0] if defaults else None))
 normalize=lambda value:re.sub(r'\s+',' ',value).strip()
 wanted={gb.anchor(entry['target']):entry for entry in expected};actual=[];logical_titles={};park_titles={}
 page_marks={gb.anchor(page['id']):page['id'] for page in pages}
 body=document.find('w:body',ns)
 for paragraph in body.iter(tag('p')):
  level=paragraph_level(paragraph);marks=paragraph.xpath('.//w:bookmarkStart/@w:name',namespaces=ns)
  for mark in marks:
   if mark in page_marks:
    pid=page_marks[mark];assert pid not in logical_titles,('Repeated Word logical block bookmark',pid)
    logical_titles[pid]=level
    if re.fullmatch(r'park-level-\d+',pid):park_titles[pid]=level
  if level==9:continue
  text=normalize(''.join(paragraph.xpath('.//w:t/text()',namespaces=ns)))
  assert level in (0,1),('Unexpected H3-or-deeper Word outline entry',level,text)
  matches=[wanted[mark] for mark in marks if mark in wanted]
  assert len(matches)==1,('Unplanned Word outline entry',level,text,marks)
  assert paragraph.getparent() is body,('Word outline heading hidden inside table/container',text)
  entry=matches[0]
  actual.append((level,text,entry['target']))
 expected_word=[(entry['level'],normalize(entry['text']),entry['target']) for entry in expected]
 assert actual==expected_word,('Word semantic outline differs from source',actual,expected_word)
 assert set(logical_titles)=={page['id'] for page in pages},'Word logical block bookmark coverage'
 assert all(level==(0 if pid in h1 else 1 if pid in h2 else 9) for pid,level in logical_titles.items()),'Logical block title unexpectedly appears in Word outline'
 assert len(park_titles)==45 and set(park_titles.values())=={9},'Park level titles were not hidden from Word outline'
 pdf_outline=[]
 def walk(items,depth=0):
  for item in items:
   if isinstance(item,list):walk(item,depth+1)
   else:pdf_outline.append((depth,normalize(item.get('/Title','')),reader.get_destination_page_number(item)+1))
 walk(reader.outline)
 expected_pdf=[(entry['level'],normalize(entry['text']),numbers[entry['target']]) for entry in expected]
 assert pdf_outline==expected_pdf,('PDF semantic outline differs from Word/source',pdf_outline,expected_pdf)
 return {'h1_chapters':12,'h1_front_and_back_matter':3,'h1_total':len(h1),'h2_core_headings':len(h2),'total':len(expected),
         'park_level_titles_hidden':45,'logical_block_bookmarks':len(logical_titles),
         'style_inheritance_and_direct_outline_levels_checked':True,'word_pdf_outline_and_destinations_preserved':True,
         'targets':[entry['target'] for entry in expected]}


def verify_word_front_links(plan, document, footer):
 """Read the displayed contents and quick-find links from actual Word XML."""
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 tag=lambda name:'{'+ns['w']+'}'+name
 pages=plan['pages'];numbers=plan['numbers']
 front=[p for p in pages if p['part']=='목차']
 assert [p['id'] for p in front]==['toc','toc-1']
 contents,quick=front
 assert len(contents['chapters'])==12 and not quick['chapters']
 groups=quick['quick_groups']
 assert [len(items) for _,items in groups]==[4,5,4,4]
 expected={
  'toc':[(f'{ch["number"]:02}  {ch["title"]}',ch['id']) for ch in contents['chapters']]+[('빠른 찾기','toc-1')],
  'toc-1':[tuple(item) for _,items in groups for item in items]+[('전체 장 목차','toc')],
 }
 body=document.find('w:body',ns)
 page_marks={gb.anchor(p['id']):p['id'] for p in pages}
 current=None;actual={pid:[] for pid in expected}
 for paragraph in body.findall('w:p',ns):
  marks=paragraph.findall('w:bookmarkStart',ns)
  if marks:
   assert paragraph[0].tag==tag('pPr'),'Word paragraph properties must precede bookmark elements'
  for mark in marks:
   name=mark.get(tag('name'))
   if name in page_marks:current=page_marks[name]
  if current not in actual:continue
  links=paragraph.findall('w:hyperlink',ns)
  if not links:continue
  assert len(links)==2,'Front link row must link its title and its number'
  row=[]
  for link in links:
   assert not link.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'),'Expected an internal bookmark link'
   assert link.find('w:r/w:rPr/w:u',ns) is not None,'Front links must be visually recognizable'
   row.append((''.join(link.xpath('.//w:t/text()',namespaces=ns)),link.get(tag('anchor'))))
  actual[current].append(row)
 for pid,rows in expected.items():
  assert actual[pid]==[[(label,gb.anchor(target)),(str(numbers[target]),gb.anchor(target))] for label,target in rows],('Word link labels/targets do not match',pid)
 back_links=footer.xpath('//w:hyperlink',namespaces=ns)
 assert [(x.get(tag('anchor')),''.join(x.xpath('.//w:t/text()',namespaces=ns))) for x in back_links]==[(gb.anchor('toc'),'목차'),(gb.anchor('index'),'색인')]
 return {'chapter_links':12,'quick_find_links':sum(len(items) for _,items in groups),
         'front_bookmark_links':2*sum(map(len,expected.values())),'footer_return_links':2}


def verify_operation_balance(plan, document):
 """Check the operating report is reachable and each planned table reached Word."""
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 topic='operation-balance'
 pages=[p for p in plan['pages'] if p['id']==topic or p['id'].startswith(topic+'-cont-')]
 assert pages and pages[0]['chapter']=='chapter-05','Missing operation balance chapter link'
 quick=next(p for p in plan['pages'] if p['id']=='toc-1')
 assert any(target==topic for _,items in quick['quick_groups'] for _,target in items)
 expected=[(b['headers'],*b['rows']) for p in pages for b in p['blocks'] if b['type']=='table']
 marks={gb.anchor(p['id']):p['id'] for p in plan['pages']}
 report_ids={p['id'] for p in pages}
 current=None;actual=[]
 for element in document.find('w:body',ns):
  for name in element.xpath('./w:bookmarkStart/@w:name',namespaces=ns):
   current=marks.get(name,current)
  if current in report_ids and element.tag.endswith('}tbl'):
   rows=[''.join(cell.xpath('.//w:t/text()',namespaces=ns)) for cell in element.xpath('./w:tr/w:tc',namespaces=ns)]
   count=len(element.xpath('./w:tr[1]/w:tc',namespaces=ns))
   actual.append(tuple(rows[i:i+count] for i in range(0,len(rows),count)))
 assert expected and expected==actual,'Operating report table differs from Word'
 return {'opening_page':plan['numbers'][topic],'tables':len(actual),'rows':sum(len(t)-1 for t in actual)}


def verify_flow_pagination(plan, document, styles, reader):
 """Separate logical content boundaries from the rendered physical pages."""
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 tag=lambda name:'{'+ns['w']+'}'+name
 pages=plan['pages'];numbers=plan['numbers'];physical=plan['physical_pages']
 assert type(physical) is int and physical==len(reader.pages) and physical>=4,'Physical page count differs from final render'
 logical=[page['id'] for page in pages]
 assert len(logical)==len(set(logical)),'Duplicate logical block ID'
 targets=set(logical)
 for page in pages:
  for block in page.get('blocks',[]):
   if block.get('anchor'):
    assert block['anchor'] not in targets,('Duplicate logical target',block['anchor'])
    targets.add(block['anchor'])
 assert set(numbers)==targets,'Physical page map lost or added a logical destination'
 assert all(type(value) is int and 1<=value<=physical for value in numbers.values()),'Invalid physical destination page'
 assert {pid:numbers[pid] for pid in ('cover','toc','toc-1','read-first')}=={'cover':1,'toc':2,'toc-1':3,'read-first':4},'Front matter physical-page contract changed'
 assert [numbers[pid] for pid in logical]==sorted(numbers[pid] for pid in logical),'Logical block starts out of physical order'
 assert {pid:numbers[pid] for pid in ('cover','toc','toc-1','read-first')}=={'cover':1,'toc':2,'toc-1':3,'read-first':4},'Front matter moved from its reserved pages'
 # A heading inside one logical block may flow to a later physical page.
 # It must still occur before the next logical block starts.
 for index,page in enumerate(pages):
  own=[numbers[page['id']],*(numbers[b['anchor']] for b in page.get('blocks',[]) if b.get('anchor'))]
  assert own==sorted(own),('Logical target order changed',page['id'])
  limit=numbers[logical[index+1]] if index+1<len(logical) else physical
  assert own[-1]<=limit,('Target escaped its logical block',page['id'])
 actual_marks=document.xpath('//w:bookmarkStart/@w:name',namespaces=ns)
 assert Counter(actual_marks)==Counter(gb.anchor(target) for target in targets),'Word logical destination coverage'
 body=document.find('w:body',ns);paragraphs=list(body.iter(tag('p')))
 style_map={style.get(tag('styleId')):style for style in styles.findall('w:style',ns)}
 defaults=styles.xpath('./w:style[@w:type="paragraph" and @w:default="1"]/@w:styleId',namespaces=ns)
 def enabled(element):
  value=element.get(tag('val'),'true')
  assert value in ('true','1','on','false','0','off'),('Invalid page-break setting',value)
  return value in ('true','1','on')
 def style_break(sid,active=()):
  if not sid:
   default=styles.find('w:docDefaults/w:pPrDefault/w:pPr/w:pageBreakBefore',ns)
   return enabled(default) if default is not None else False
  assert sid not in active,('Cyclic page-break style inheritance',sid)
  assert sid in style_map,('Unknown page-break paragraph style',sid)
  style=style_map[sid];value=style.find('w:pPr/w:pageBreakBefore',ns)
  if value is not None:return enabled(value)
  parent=style.find('w:basedOn',ns)
  return style_break(parent.get(tag('val')) if parent is not None else None,(*active,sid))
 boundaries={gb.anchor(pid):pid for pid in logical};following=None;forced=[]
 for paragraph in reversed(paragraphs):
  marks=paragraph.xpath('.//w:bookmarkStart/@w:name',namespaces=ns)
  own=[boundaries[mark] for mark in marks if mark in boundaries]
  if own:following=own[0]
  direct=paragraph.find('w:pPr/w:pageBreakBefore',ns);style=paragraph.find('w:pPr/w:pStyle',ns)
  is_break=enabled(direct) if direct is not None else style_break(style.get(tag('val')) if style is not None else defaults[0] if defaults else None)
  if is_break:forced.append(following)
 forced.reverse()
 assert forced==['toc','toc-1','read-first'],('Forced page breaks outside front matter',forced)
 assert not document.xpath('//w:br[@w:type="page"]',namespaces=ns),'Manual body page break'
 for section in document.xpath('//w:pPr/w:sectPr',namespaces=ns):
  kind=section.find('w:type',ns)
  assert kind is not None and kind.get(tag('val'))=='continuous','Forced section page break'
 return {'logical_blocks':len(logical),'logical_destinations':len(targets),'physical_pages':physical,
         'front_forced_page_breaks':3,'body_forced_page_breaks':0,'all_logical_destinations_preserved':True}


def verify_index_links(plan, document):
 """Keep distinct index anchors even when they share a physical page."""
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 tag=lambda name:'{'+ns['w']+'}'+name
 pages=plan['pages'];numbers=plan['numbers']
 index_pages=[page for page in pages if page['part']=='찾아보기']
 assert [entry for page in index_pages for entry in page['entries']]==plan['index_entries'],'Index logical entry coverage'
 for entry in plan['index_entries']:
  targets=entry['targets']
  assert 1<=len(targets)<=5 and len(targets)==len(set(targets)),('Invalid index target list',entry['term'])
  assert set(targets)<=set(numbers),('Unknown index destination',entry['term'])
 boundaries={gb.anchor(page['id']):page['id'] for page in pages};actual={page['id']:[] for page in index_pages};current=None
 for node in document.find('w:body',ns):
  if node.tag==tag('p'):
   own=[boundaries[mark] for mark in node.xpath('.//w:bookmarkStart/@w:name',namespaces=ns) if mark in boundaries]
   if own:current=own[0]
  elif node.tag==tag('tbl') and current in actual:
   rows=node.findall('w:tr',ns)
   header=[''.join(cell.xpath('.//w:t/text()',namespaces=ns)) for cell in rows[0].findall('w:tc',ns)]
   assert header==['용어와 이름','분야','쪽'],('Unexpected index table',current)
   for row in rows[1:]:
    cells=row.findall('w:tc',ns);assert len(cells)==3,('Invalid index row',current)
    text=lambda cell:''.join(cell.xpath('.//w:t/text()',namespaces=ns))
    hyperlinks=cells[2].xpath('.//w:hyperlink',namespaces=ns)
    assert all(not link.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id') for link in hyperlinks),('External index link',current)
    links=[(text(link),link.get(tag('anchor'))) for link in hyperlinks]
    actual[current].append((text(cells[0]),text(cells[1]),text(cells[2]),links))
 total=0;shared=0
 for page in index_pages:
  expected=[(entry['term'],entry['category'],', '.join(str(numbers[target]) for target in entry['targets']),[(str(numbers[target]),gb.anchor(target)) for target in entry['targets']]) for entry in page['entries']]
  assert actual[page['id']]==expected,('Word index labels, page numbers or distinct destinations changed',page['id'])
  total+=sum(len(entry['targets']) for entry in page['entries'])
  shared+=sum(len(entry['targets'])-len({numbers[target] for target in entry['targets']}) for entry in page['entries'])
 return {'entries':len(plan['index_entries']),'bookmark_links':total,'distinct_anchors_on_shared_pages':shared,'cap_per_entry':5,'word_links_preserved':True}


def main():
 gb.check()
 plan=json.loads((TMP/'page-plan.json').read_text());manifest=json.loads(gb.MANIFEST.read_text())
 reader=PdfReader(gb.PDF);page_refs={p.indirect_reference.idnum:i+1 for i,p in enumerate(reader.pages)}
 invalid=[];go_to=0
 for pi,page in enumerate(reader.pages,1):
  for ref in page.get('/Annots',[]):
   a=ref.get_object();action=a.get('/A',{});dest=a.get('/Dest',action.get('/D'))
   if action.get('/S')=='/GoTo' or '/Dest' in a:
    go_to+=1
    if not isinstance(dest,list) or getattr(dest[0],'idnum',None) not in page_refs:invalid.append([pi,str(dest)])
 assert not invalid,(len(invalid),'invalid internal destinations')
 with ZipFile(gb.DOCX) as z:
  root=etree.fromstring(z.read('word/document.xml'));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
  marks=root.xpath('//w:bookmarkStart/@w:name',namespaces=ns);anchors=root.xpath('//w:hyperlink/@w:anchor',namespaces=ns)
  assert len(marks)==len(set(marks)) and set(anchors)<=set(marks)
  styles=etree.fromstring(z.read('word/styles.xml'))
  footer=etree.fromstring(z.read('word/footer1.xml'))
  assert not styles.xpath('//w:style[@w:styleId="Title"]//w:pBdr',namespaces=ns)
  assert not root.xpath('//w:p[.//w:drawing]/w:pPr/w:spacing[@w:lineRule="exact"]',namespaces=ns),'Inline images clipped by exact paragraph height'
 # Page plans are structured records generated by the source readers, so verify
 # complete entry/rank coverage independently of the prose's advertised totals.
 pages=plan['pages'];ids={p['id'] for p in pages};numbers=plan['numbers'];counts=plan['counts']
 flow_pagination=verify_flow_pagination(plan,root,styles,reader)
 word_front_links=verify_word_front_links(plan,root,footer)
 # Logical chunks can now share or span physical pages. Physical orphan
 # headings/source-only pages are checked on the final rendered page images.
 building_groups={}
 for page in pages:
  if page['id'].startswith('building-') and not page['id'].startswith('building-rules'):
   building_groups.setdefault(page['id'].split('-cont-')[0],[]).append(page)
 assert len(building_groups)==25,'Building logical profile coverage'
 for bid,chunks in building_groups.items():
  levels=[str(row[0]) for page in chunks for block in page['blocks'] if block['type']=='table' for row in block['rows']]
  assert levels==[str(i) for i in range(1,26)],('Building logical level row coverage',bid)
 contents=[p for p in pages if p['part']=='목차'];assert len(contents)==2
 chapters=[ch for page in contents for ch in page['chapters']]
 assert [ch['number'] for ch in chapters]==list(range(1,13))
 mark_order={name:i for i,name in enumerate(marks)}
 for ch in chapters:
  assert 2<=len(ch['topics'])<=(4 if ch['id']=='chapter-06' else 3)
  cp=[p for p in pages if p.get('chapter')==ch['id']]
  assert cp and cp[0]['id']==ch['id'] and cp[0]['chapter_open']
  targets=[t for label,t in ch['topics']]
  positions=[mark_order[gb.anchor(target)] for target in targets]
  assert positions==sorted(positions),('TOC logical topic order',ch['title'])
  owned={p['id'] for p in cp}|{b['anchor'] for p in cp for b in p.get('blocks',[]) if b.get('anchor')}
  assert set(targets)<=owned,('TOC topic belongs to another chapter',ch['title'])
 directory_counts={}
 for cid,prefix,total in [('chapter-03','figure-GF-',50),('chapter-06','building-',25),('chapter-07','research-',69),('chapter-09','recipe-',15),('chapter-10','dino-',83)]:
  targets=[t for page in pages if page['part']=='장 안내' and page['chapter']==cid for b in page['blocks'] if b['type']=='nav-grid' for label,t in b['items'] if t.startswith(prefix)]
  assert len(targets)==len(set(targets))==total,(cid,len(targets),total)
  directory_counts[cid]=total
 for page in pages:
  for block in page.get('blocks',[]):
   if block['type']=='nav':assert block['target'] in numbers
   if block['type']=='nav-grid':assert all(t in numbers for label,t in block['items'])
 root_outline=[item.get('/Title','') for item in reader.outline if not isinstance(item,list)]
 assert all(f'{ch["number"]:02} {ch["title"]}' in root_outline for ch in chapters),'PDF chapter hierarchy'
 word_outline=verify_word_outline(plan,root,styles,reader)
 figure_coverage=verify_figure_levels(plan,root,gb.content.editorial('figures'))
 acquisition_coverage=verify_dinosaur_acquisition(plan,root)
 scout_coverage=verify_scout_guide(plan,root)
 habitat_space_coverage=verify_habitat_space_guide(plan,root)
 habitat_fence_coverage=verify_habitat_fence_guide(plan,root)
 hybrid_coverage=verify_experimental_hybrid_guide(plan,root)
 progression_coverage=verify_park_progression(plan,root)
 operation_coverage=verify_operation_balance(plan,root)
 current_plan=verify_single_current_plan(chapters,pages,root_outline)
 assert sum(i.startswith('research-') and '-cont-' not in i and i!='research-rules' for i in ids)==69
 assert sum(i.startswith('building-') and '-cont-' not in i and i!='building-rules' for i in ids)==25
 assert sum(i.startswith('recipe-') and '-cont-' not in i for i in ids)==15
 assert len([i for i in numbers if i.startswith('dino-')])==83
 assert len([i for i in numbers if re.fullmatch(r'figure-[Gg][Ff]-\d+',i)])==50
 assert len([i for i in numbers if i.startswith('character-')])==22
 expected_story={f'prologue-scene-{i}' for i in range(1,5)}|{f'ch{c}-scene-{i}' for c,n in [(1,3),(2,5),(3,6)] for i in range(1,n+1)}
 assert {i.removeprefix('story-current-') for i in numbers if re.fullmatch(r'story-current-(?:prologue|ch[123])-scene-\d+',i)}==expected_story
 assert counts['current_story_scenes']==18
 story=gb.content.editorial('story-people')
 for scene in story['main_scenes']:
  target=('story-current-' if scene['id'] in expected_story else 'story-entry-story-')+scene['id']
  assert target in numbers,('Story scene missing from the book',scene['id'])
 index_links=verify_index_links(plan,root)
 assert counts['building_levels']==625 and counts['research_levels']==239
 # Both important failure paths are tested without editing a real source file.
 original=gb.inputs
 try:
  gb.inputs=lambda:{**original(),'docs/current/balance.md':'0'*64}
  try:gb.check()
  except AssertionError:stale_source_rejected=True
  else:raise AssertionError('Changed planning source accepted')
 finally:gb.inputs=original
 raw=json.loads((gb.HERE/'editorial/story-people.json').read_text());wrong=copy.deepcopy(raw);first=next(iter(wrong['source_sha256']));wrong['source_sha256'][first]='0'*64
 try:gb.content.validate_editorial(wrong)
 except AssertionError:stale_editorial_rejected=True
 else:raise AssertionError('Stale editorial accepted')
 # Verify printable bounds and readable Korean on every final PDF page.
 bounds=[];replacement=[];footers=[];hangul=0
 with pdfplumber.open(gb.PDF) as pdf:
  for i,page in enumerate(pdf.pages,1):
   chars=page.chars;text=''.join(c['text'] for c in chars);hangul+=len(re.findall('[가-힣]',text))
   if '\ufffd' in text:replacement.append(i)
   bad=[c for c in chars if c['text'].strip() and (c['x0']<28 or c['x1']>page.width-28 or c['top']<7 or c['bottom']>page.height-7)]
   if bad:bounds.append({'page':i,'sample':''.join(c['text'] for c in bad)[:80]})
   ptext=reader.pages[i-1].extract_text()
   match=re.search(r'목차\s*\|\s*색인\s*(\d+)',ptext)
   if not match or int(match[1])!=i:footers.append(i)
   if i%50==0:print(json.dumps({'checked_pages':i},ensure_ascii=False),flush=True)
 assert not bounds and not replacement and not footers,(bounds[:5],replacement,footers[:5])
 assert hangul>50000
 rendered_pages={int(match[1]) for path in (TMP/'render').glob('page-*.png') if (match:=re.fullmatch(r'page-(\d+)\.png',path.name))}
 assert rendered_pages==set(range(1,plan['physical_pages']+1)),'Rendered PNG/physical-page coverage'
 gb.verify_pdf(pages,numbers)
 report={'status':'pass','kind':'document coverage, currentness and rendered layout checks; not game testing',
         'pages':len(reader.pages),'counts':counts,'index_terms':manifest['indexed_terms'],'word_bookmarks':len(marks),
         'word_internal_links':len(anchors),'pdf_internal_links':go_to,'invalid_destinations':invalid,
         'out_of_bounds':bounds,'replacement_glyph_pages':replacement,'wrong_page_footers':footers,
         'hangul_characters':hangul,'stale_source_rejected':stale_source_rejected,'stale_editorial_rejected':stale_editorial_rejected,
         'toc_pages':2,'toc_chapters':12,'classified_directory_counts':directory_counts,
         'figure_level_coverage':figure_coverage,'dinosaur_acquisition_coverage':acquisition_coverage,'park_progression_coverage':progression_coverage,'current_plan_structure':current_plan,'word_outline':word_outline,
         'operation_balance_coverage':operation_coverage,'scout_coverage':scout_coverage,
         'habitat_space_coverage':habitat_space_coverage,'habitat_fence_coverage':habitat_fence_coverage,
         'experimental_hybrid_coverage':hybrid_coverage,
         'word_front_links':word_front_links,'flow_pagination':flow_pagination,'index_links':index_links,
         'page_png_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((TMP/'render').glob('page-*.png'))}}
 (TMP/'document-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k!='page_png_sha256'},ensure_ascii=False))
if __name__=='__main__':main()
