"""Guidebook reading model. Domain facts are read from their existing owners."""
from __future__ import annotations
import json, math, re, sys, hashlib, subprocess
from pathlib import Path
from collections import defaultdict
from functools import lru_cache
from PIL import Image, ImageFont
TABLE_METRIC_FONT=ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc',95)
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/models'))
import followup_content_model_v06 as model
import dinosaur_acquisition_model_v06 as acquisition
import park_progression_model_v06 as progression
from render_dinosaur_acquisition_v06 import route_info,route_summary,gate_text
from render_followup_content_v06 import FAC,AREA,RARITY,QUALITY,MATERIAL,aviary_space_display,duration,research
from render_research_effects_v06 import SCOUT_PLAN_PENDING,SCOUT_PLAN_STATUS

VERSION=re.search(r'(\d+\.\d+)',(ROOT/'docs/current/game-design.md').read_text().splitlines()[0]).group(1)
STRATEGY_TOPICS={6:'park-growth-level-seven',7:'park-growth-level-eight'}
SCOUT_REGIONS=[('grassland','초원'),('coast','해안'),('deep-sea','깊은 바다'),('desert','사막'),('cliffs','절벽'),
               ('fossil-valley','화석 계곡'),('primal-swamp','원시 습지'),('abandoned-lab','버려진 연구소'),
               ('mineral-cave','광물 동굴'),('mutation-crater','변이 분화구')]
SAFETY_BUILDING_IDS=('habitat-carnivore','operation-security-center')
BUILDING_ART_STRIPS=((*SAFETY_BUILDING_IDS,'visitor-tour-train'),
                     ('research-dna-lab','amenity-food-court','production-feed-factory'))
FONT=10.5; WIDTH=488; BUDGET=585

def clean(x):
 s=str(x)
 s=re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',s)
 s=re.sub(r'<[^>]+>','',s).replace('**','').replace('`','').replace('&#124;','/')
 s=re.sub(r'[\U0001F000-\U0001FFFF\u2600-\u27BF\ufe0f]','',s)
 return re.sub(r'\s+',' ',s).strip().replace('–','-').replace('—','-').replace('‑','-')
def p(text):return {'type':'p','text':clean(text)}
def h(text):return {'type':'h','text':re.sub(r'[^\w가-힣 ]',' ',clean(text)).replace('_',' ')}
def table(headers,rows,widths=None):return {'type':'table','headers':[clean(x) for x in headers],'rows':[[clean(v) for v in r] for r in rows],'widths':widths}
def source(text):return {'type':'source','text':clean(text)}
def table_chunk(block,rows):
 result={**block,'rows':rows}
 for key in ['acquisition_species_ids','progression_goal_ids']:
  if key in block:
   by_name={r[0]:sid for r,sid in zip(block['rows'],block[key])}
   result[key]=[by_name[r[0]] for r in rows]
 return result
def units(s):return sum(1 if ord(c)>127 else .52 for c in clean(s))
def block_height(b):
 if b['type']=='nav':return 24
 if b['type']=='nav-grid':
  n=b['columns'];rows=[b['items'][i:i+n] for i in range(0,len(b['items']),n)]
  return sum(max(max(1,math.ceil((units(label)+5)/(WIDTH/n/10-3))) for label,target in row)*15+10 for row in rows)+8
 if b['type']=='image':return b.get('height',300)+15
 if b['type']=='h' and b.get('title_anchor'):return 0
 if b['type']=='h':return 36+(14 if re.match(r'^(prologue scene \d+|ch[123] scene \d+)',b['text']) else 0)
 if b['type']=='source':return max(1,math.ceil(units(b['text'])/(WIDTH/8)))*11.5+13
 if b['type']=='table':
  n=len(b['headers']);weights=b.get('widths') or [1]*n;sw=sum(weights)
  def rh(row):
   if b.get('variant')=='building':
    return max(max(1,math.ceil(TABLE_METRIC_FONT.getlength(v)/10*1.05/(WIDTH*weights[i]/sw-10))) for i,v in enumerate(row))*13.5+4
   return max(max(1,math.ceil(units(v)*.9/(WIDTH*weights[i]/sw/9.5-2.2))) for i,v in enumerate(row))*13.5+(9 if b.get('variant')=='research' else 4)
  return rh(b['headers'])+sum(rh(row) for row in b['rows'])+13
 return max(1,math.ceil(units(b['text'])/(WIDTH/FONT-1)))*16+7

def _split_plain(blocks):
 """Keep a heading with its content; split long tables with repeated headers."""
 result=[];current=[];used=0
 def flush():
  nonlocal current,used
  if current:result.append(current)
  current=[];used=0
 for b in blocks:
  bh=block_height(b)
  if b['type']=='table' and not b.get('keep_table'):
   chunk=[]
   for row_index,row in enumerate(b['rows']):
    candidate={**b,'rows':chunk+[row]}
    if used+block_height(candidate)>BUDGET and (current or chunk):
     minimum=5 if b.get('variant')=='building' else 2
     remaining=len(b['rows'])-row_index;borrow=max(0,minimum-remaining)
     tail=chunk[-borrow:] if borrow and len(chunk)>borrow else []
     if tail:chunk=chunk[:-borrow]
     if chunk:current.append(table_chunk(b,chunk))
     flush();chunk=tail
    chunk.append(row)
   if chunk:current.append(table_chunk(b,chunk));used+=block_height({**b,'rows':chunk})
  else:
   if used+bh+(30 if b['type']=='h' else 0)>BUDGET:flush()
   current.append(b);used+=bh
 flush();return result

def split_blocks(blocks):
 if not any(b.get('keep_group') for b in blocks):
  chunks=_split_plain(blocks)
 else:
  groups=[]
  for block in blocks:
   key=block.get('keep_group')
   if key and groups and groups[-1][0].get('keep_group')==key:groups[-1].append(block)
   else:groups.append([block])
  chunks=[];current=[];used=0
  for group in groups:
   height=sum(block_height(x) for x in group)
   if height<=BUDGET:
    if current and used+height>BUDGET:chunks.append(current);current=[];used=0
    current.extend(group);used+=height
   else:
    pieces=_split_plain(current+group);chunks.extend(pieces[:-1]);current=pieces[-1];used=sum(block_height(x) for x in current)
  if current:chunks.append(current)
 # A page-break paragraph must never be the content a heading keeps with.
 for i in range(len(chunks)-1):
  carry=[]
  while chunks[i] and chunks[i][-1]['type']=='h':carry.insert(0,chunks[i].pop())
  if carry:chunks[i+1][:0]=carry
 # A source belongs to the preceding content, never to a page by itself.
 for i in range(len(chunks)-1,0,-1):
  if chunks[i] and all(b['type']=='source' for b in chunks[i]):
   chunks[i-1].extend(chunks.pop(i))
 # Rebalance a short prose tail so a continuation does not contain only
 # a couple of dialogue lines beneath a full page title.
 if len(chunks)>1 and sum(block_height(b) for b in chunks[-1])<130 and all(b['type'] in ('p','source') for b in chunks[-1]):
  while len(chunks[-2])>2 and sum(block_height(b) for b in chunks[-1])<190 and chunks[-2][-1]['type']=='p':
   chunks[-1].insert(0,chunks[-2].pop())
  if chunks[-2] and chunks[-2][-1]['type']=='h':chunks[-1].insert(0,chunks[-2].pop())
 return [chunk for chunk in chunks if chunk]

def narrative(path, *, text=None, exclude=(), include=None, skip_intro=False):
 text=((ROOT/path).read_text() if text is None else text).split('## 변경 기록')[0]
 if exclude or include is not None or skip_intro:
  intro,*sections=re.split(r'(?=^## )',text,flags=re.M)
  text=''.join(['' if skip_intro else intro,*[
   section for section in sections
   if (label:=section.splitlines()[0][3:]) not in exclude and (include is None or label in include)
  ]])
 if str(path)=='docs/current/park-progression.md':
  # Machine condition encodings remain in the owner; the book has human tables.
  text=re.sub(r'^## 6\..*?(?=^## 7\.|\Z)','',text,flags=re.M|re.S)
  text=re.sub(r'^## 7\.', '## 6.',text,flags=re.M)
 if str(path)=='docs/current/buildings.md':
  text=re.sub(r'^## 7\..*?(?=^## 8\.)','',text,flags=re.M|re.S)
  text=re.sub(r'^### 8\.4 에셋·실행 상태.*?(?=^#{2,3} |\Z)','',text,flags=re.M|re.S)
 if str(path)=='docs/current/resources-and-production.md':
  text=re.sub(r'^## 10\..*?(?=^## 11\.)','',text,flags=re.M|re.S)
  text=re.sub(r'^0\.5의 자원/금고/연료 설계는.*$','',text,flags=re.M)
 text=re.sub(r'<!-- ([a-z-]+:[^>]+) -->.*?<!-- /\1 -->','',text,flags=re.S)
 lines=text.splitlines();out=[];para=[];i=0;fenced=False
 def emit():
  if para:out.append(p(' '.join(para)));para.clear()
 while i<len(lines):
  line=lines[i].strip()
  if line.startswith('```'):emit();fenced=not fenced;i+=1;continue
  if not line or line=='---' or line.startswith('<!--'):emit();i+=1;continue
  if line.startswith('#'):
   emit();title=re.sub(r'^#+\s*','',line)
   if not line.startswith('# '):out.append(h(title))
   i+=1;continue
  if line.startswith('|'):
   emit();rows=[]
   while i<len(lines) and lines[i].lstrip().startswith('|'):
    row=[clean(c) for c in re.split(r'(?<!\\)\|',lines[i].strip().strip('|'))]
    if not all(re.fullmatch(r'[:\- ]+',c) for c in row):rows.append(row)
    i+=1
   if rows and all(len(r)==len(rows[0]) for r in rows) and len(rows[0])<=5:
    out.append(table(rows[0],rows[1:], [1]*len(rows[0])))
   elif rows:
    for row in rows[1:]:out.append(p(' · '.join(f'{a}: {b}' for a,b in zip(rows[0],row))))
   continue
  emit() if line.startswith(('- ','> ')) or re.match(r'^\d+\. ',line) else None
  para.append(re.sub(r'^(?:[-*>]+\s*|\d+\.\s*)','',line))
  if fenced:emit()
  i+=1
 emit();return out

# Preserve the domain sources for implementation. These display edits remove
# engineering notes and explain the same rules in terms of player actions.
PLAYER_WORDING={
 '서버가 입장 인원·골드·정산 시각을 확정한다.':'입장객 수와 입장료는 운영 화면에서 확인한다. 파크를 닫거나 다시 열어도 같은 방문과 입장료가 두 번 집계되지 않는다.',
 '첫 튜토리얼에서 별도 부화장 선구매를 요구하지 않는다.':'첫 알은 기본 부화 자리에서 부화한다. 부화장을 지으면 자리가 세 칸으로 늘어난다. 첫 관람대는 골드만으로 지을 수 있다.',
 '튜토리얼은 목표 카드 하나와 닥터 진의 짧은 단서 안내로 구성한다.':'닥터 진의 안내에 따라 초원 정찰의 발자국·먹이 흔적·둥지를 순서대로 확인한다. 단서를 모두 찾으면 알을 수령해 부화를 시작한다. 이미 진행한 정찰은 돌아와 이어 할 수 있다.',
 '튜토리얼 표시 진행은':None,
 '관람대는 기존 Lv.2 해금을 유지한다.':'첫 입장료 목표의 경험치를 받아 파크 Lv.2에 도달하면 관람대를 지을 수 있다. 먼저 마친 배치와 급식도 인정한다. 이구아노돈을 처음 수령하면 도감에 등록되고 목표 경험치 700을 받는다. 방생한 원종은 탐험에서 다시 얻을 수 있다.',
 '첫 스테고케라톱스까지의 경과4~6시간은':None,
 '이 표는 진행 순서다.':'시작한 생산·건설·부화·합성은 앱을 닫아도 시간이 흐른다. 원정은 플레이가 저장된 구간에서 이어 달린다.',
 '첫 스테고케라톱스의 장면과 챕터 순서는':None,
 '첫 합성 이후에는 원종 수집·탐험·재료 승급·연구를 반복하며':'첫 전시 뒤에는 새 원종을 모으고, 재료 승급과 유전 연구로 변종과 상위 하이브리드를 연다. 합성에 앞서 성공률과 재도전 조건을 확인한다.',
 '새 보상은 파크 소유의 성장 성취 보상이다.':'첫 영웅을 수령하면 성장 목표의 경험치를 받을 수 있다. 첫 전시 뒤 파크에서 성장 목표를 열어 시설·연구·현장·운영 목표를 원하는 순서로 완료하고 각각 경험치를 한 번 수령한다.',
 '시설은 해당 파크의 건물 완공 이력,':'시설은 완공, 연구는 해당 단계 완료, 현장은 원정 보상 수령, 운영은 실제 유료 입장객 누적으로 완료한다. 미리 채운 조건도 인정한다. 한 목표의 두 대안을 모두 충족해도 경험치는 한 번 받는다.',
 'Park구간은 권장 목표 묶음이다.':'본편의 각 장에는 발견·안전·시설에 맞는 진입 조건이 있다. 파크 레벨별 목표와 함께 진행할 장면은 각 레벨의 성장표에서 찾을 수 있다.',
 '현금·다이아·가속 구매와 추가 유료 연구원을':'기본 연구원과 파크에서 얻는 재화로 성장 목표를 완료할 수 있다. 파크 Lv.50 이후에도 시설·탐험·수집을 계속한다.',
 'Park는 파크 성장 수치,':'파크 레벨은 운영 목표로 올린다. DNA 연구소는 시설 강화로 Lv.25까지 성장하고, 개별 기술은 연구원을 배정해 3~5단계까지 완료한다.',
 '6  45전환의 선택지 정확 보상 원천':None,
 'building:id:rank=':None,
 '기준일:':None,
 '첫 영웅까지 경과4~6시간은':None,
 '이 연결은 기획 기준이며 실제 스토리 게이트':None,
 '각 프로필의 숫자는 설계 기준안이다.':'보유 효과와 시설 배정 효과, 컬렉션 시너지는 각 효과의 상한까지 적용한다.',
 '일반 자원 생산은 골드를 쓰고 시간을 들여 기본 물자 구매보다 효율적으로 확보하는 경로다.':'자원이 급하면 기본 물자에서 구매하고, 꾸준히 쓸 자원은 생산시설에서 골드와 시간을 들여 마련한다.',
 '아래 ID는 향후 공유 타입':None,
 '지역 이름은 이번 설계의 명칭이다.':None,
 '초반 자재 수량·시설 가격·해금·공급 속도와':'건설에 필요한 자재는 시설마다 다르다. 공사 화면에서 목재·석재·금속 중 필요한 자재와 수량을 확인한다.',
 '첫 기술은 기본1분이고 후기 지정 기술은':'첫 기술은 기본 1분이다. 후기 지정 기술은 할인을 적용해도 한 단계에 최소 7일이 걸리며, 이미 시작한 작업의 시간은 그대로 이어진다.',
 '급식 한 번은 사료 한 단위를':'공룡에게 먹이를 줄 때 공용 사료 한 개를 쓴다. 먹이가 필요한 공룡을 골라 급식한다.',
 '첫 합성 경과4~6시간은':None,
 '다음 예외는 현재 구현/기존 초반 계획을':'첫 관람대와 초기 시설에는 아래 비용과 시간이 적용된다.',
 '정산은 서버의 같은 park/currency 잠금 안에서':'금고를 강화하면 완공까지는 기존 한도로, 완공 뒤부터는 새 한도로 입장료가 쌓인다.',
 '역할 확정: 건설자는 건설/강화,':'건설자는 건설과 강화를 맡고, 연구원은 연구트리의 기술을 맡는다. DNA 합성에는 별도 작업 자리를 사용한다.',
 '건설자는 서버 완공 시각에 작업이 끝나면':'공사가 끝나거나 기술이 완료되면 담당자가 자동으로 복귀해 다음 일을 맡을 수 있다. 기술 연구가 진행되는 동안에도 부화와 합성을 따로 할 수 있다.',
 '검산 기준':'운영 예시를 읽는 방법',
 '입장료는 실제 수납분을 보고, 운영 순수입은':'운영 순수입은 받은 입장료에서 유지비를 뺀 금액이다. 아래 사례는 전시·돌봄·접속 일정이 달라지면 달라질 수 있다. 자재 구매비는 실제로 작업할 때 확인한다.',
 '구현 검토안. 먼저 미수령 사료와':'미수령 사료와 남은 재고를 확인한다. 전시와 관람길이 연결돼 있어 입장료로 급식비를 마련할 수 있다면 개장을 유지한다.',
 '검증할 상태는 잔액 0에서':None,
 '첫 영웅까지의 시간은 초반 성장 속도를':None,
 '이 절은 토지·특수환경과 종별 사육을 연결하는 기획이다.':None,
 '실제 게임의 임시 에셋 목록은':None,
 '첫 전시의 건설·서식지 호환·관람 동선과 결과 수령 뒤 건설자 2명은':None,
 '서식지의 수용량은 파크 전체 개체 한도가':'공룡을 호환 서식지에 배치하고 수용량을 확인한다. 방문객이 입구에서 관람 지점까지 갈 수 있으면 전시가 관람 수요에 반영된다.',
 '아래83종 표가 원래 사육 경로의 정본이다.':'아래 표에서 공룡이 살 수 있는 서식지, 필요한 사육 기술과 안전 점수를 확인한다.',
 '각 표의 ‘연구소 단계’는':'연구소 단계는 해당 기술의 각 단계를 시작하기 위한 최소 연구소 레벨이다. 선행 기술과 자재를 갖춰 다음 단계로 진행한다.',
 '아래14개 효과는 기존12개의':'표는 완료한 단계의 총효과를 보여준다. 이전 단계의 수치를 더하지 않는다.',
 '1  이번 결정':'합성을 시작하기 전',
 '모델은 정적 기획을 읽고 검산하는 도구다.':None,
}

class Book:
 def __init__(self):self.pages=[];self.terms=[];self.entry_positions={}
 def add(self,id,part,title,blocks,terms=(),toc=False):
  player_blocks=[]
  for block in blocks:
   if block['type']=='source':continue
   if block['type'] in ('p','h'):
    text=block['text']
    prefix=next((prefix for prefix in PLAYER_WORDING if text.startswith(prefix)),None)
    if prefix is not None:
     if (replacement:=PLAYER_WORDING[prefix]) is None:continue
     block={**block,'text':replacement}
   player_blocks.append(block)
  blocks=player_blocks
  chunks=split_blocks(blocks) or [[]]
  for i,chunk in enumerate(chunks):
   self.pages.append({'id':id if not i else f'{id}-cont-{i}','part':part,'title':re.sub(r'[^\w가-힣 ]',' ',clean(title)).replace('_',' ')+(f' 계속 {i+1}' if i else ''),'blocks':chunk,'toc':toc and not i})
  for page in self.pages[-len(chunks):]:
   for block in page['blocks']:
    if block.get('anchor'):self.entry_positions[block['anchor']]=page['id']
  for term in terms:
   target=id
   if isinstance(term,tuple):term,target=term
   if clean(term):self.terms.append({'term':clean(term),'category':part,'target':target})
 def doc(self,id,part,title,path):self.add(id,part,title,narrative(path)+[source('원천 '+path)],terms=[title],toc=True)

def validate_editorial(raw, root=ROOT):
 for path,expected in raw['source_sha256'].items():
  assert hashlib.sha256((root/path).read_bytes()).hexdigest()==expected, f'편집 요약 갱신 필요: {path}'
 return raw['content']

def editorial(name):
 return validate_editorial(json.loads((ROOT/f'docs/guidebook/editorial/{name}.json').read_text()))

def current_story(book, original):
 """Read the current screenplay directly; editorial summaries remain references."""
 path='docs/current/story-progression.md';raw=(ROOT/path).read_text().split('## 변경 기록')[0]
 headings=list(re.finditer(r'^## (.+)$',raw,re.M));seen=set()
 # Keep every scene searchable by its existing ID and original index terms.
 old={s['id'].removeprefix('story-'):s for s in original['sections']}
 sections=[('안내',raw[:headings[0].start()] if headings else raw)]
 sections += [(m[1],raw[m.end():headings[i+1].start() if i+1<len(headings) else len(raw)]) for i,m in enumerate(headings)]
 for i,(title,body) in enumerate(sections):
  if i==10:continue # Internal production acceptance criteria.
  title='본편 대본과 플레이 연결 안내' if i==0 else re.sub(r'^\d+\.\s*','',title)
  blocks=narrative(path,text=body);terms=[];group=None
  if i==11:
   for block in blocks:
    if block['type']=='table' and len(block['headers'])==4:block['widths']=[1.4,.65,4.4,1.35]
  for block in blocks:
   if block['type']=='h':
    m=re.match(r'^(prologue scene \d+|ch[123] scene \d+)\s+(.+)',block['text'])
    if m:
     sid=m[1].replace(' ','-');group='story-current-'+sid
     assert sid not in seen,'Duplicate current story scene: '+sid
     seen.add(sid);block['anchor']=group
     terms += [(v,group) for v in [sid,m[2],*old.get(sid,{}).get('index_terms',[])]]
    else:group=None
   if group:block['keep_group']=group
  if not blocks:continue
  book.add('story-current-section-'+str(i),'스토리와 세계관',title,blocks,
           terms+[title]+(['최신 초반 대본','스토리 진행표','첫 합성 이야기'] if i==0 else []),
           toc=i==0 or bool(re.search(r'프롤로그|챕터\s*[123]|진행표',title)))
 expected={f'prologue-scene-{i}' for i in range(1,5)}|{f'ch{c}-scene-{i}' for c,n in [(1,3),(2,5),(3,6)] for i in range(1,n+1)}
 assert seen==expected,('Current screenplay scene coverage',sorted(expected-seen),sorted(seen-expected))

@lru_cache(maxsize=1)
def park_artwork_preview():
 """Resolve preview artwork through the same lookups used by the game."""
 script="""
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const ts = require('typescript');
const { BUILDING_DATA } = require('./packages/game-data/dist/index.js');
const { FIRST_HYBRID_HABITAT_ID } = require('./packages/shared/dist/index.js');
const file = resolve('apps/client/src/game/parkArtwork.ts');
const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
  fileName: file,
});
const entry = { exports: {} };
// The static map does not need Vite's browser environment during export.
const nodeModuleText = outputText.replaceAll('import.meta.env', '({})');
new Function('require', 'module', 'exports', nodeModuleText)(createRequire(file), entry, entry.exports);
const {
  buildingArtwork, dinosaurRasterArtwork, HABITAT_FENCE_UPGRADE_LEVEL, hasHabitatFenceUpgrade,
} = entry.exports;
process.stdout.write(JSON.stringify({
  art: [...dinosaurRasterArtwork],
  buildings: Object.fromEntries(BUILDING_DATA
    .filter(({ category }) => category !== 'decoration')
    .map(({ id }) => [id, buildingArtwork(id, 1, false)])),
  habitatFences: Object.fromEntries(BUILDING_DATA
    .filter(({ id }) => hasHabitatFenceUpgrade(id))
    .map(({ id }) => [id, buildingArtwork(id, HABITAT_FENCE_UPGRADE_LEVEL, false)])),
  hybrid: FIRST_HYBRID_HABITAT_ID,
}));
"""
 return json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT,text=True))

def park_placement_scale(species):
 """Read the grid, building footprints and current raster examples together."""
 grid_source=(ROOT/'apps/client/src/game/engine/IsometricGrid.ts').read_text()
 tile=dict(re.findall(r'^\s*(TILE_WIDTH|TILE_HEIGHT):\s*(\d+),',grid_source,re.M))
 preview=park_artwork_preview()
 catalog,_=model.effect.catalog_data()
 facility_ids=['operation-entrance-gate','habitat-grassland',preview['hybrid'],'research-dna-lab',
               'production-lumberyard','production-quarry','visitor-viewing-platform',*SAFETY_BUILDING_IDS]
 buildings={entry['id']:entry for entry in catalog['buildings']}
 footprints={}
 for facility_id in facility_ids:
  building=buildings[facility_id]
  size=building['size']
  footprints.setdefault(f'{size["width"]}×{size["height"]}칸',[]).append(building['nameKo'])
 widths=[]
 canvases=set()
 for species_id,art in preview['art']:
  with Image.open(ROOT/'apps/client/public'/art['path'].lstrip('/')) as raster:
   assert 'A' in raster.getbands(),art['path']
   canvases.add(raster.size)
  widths.append([species[species_id]['nameKo'],f'{art["width"]}px'])
 canvas_width,canvas_height=canvases.pop()
 assert not canvases,'공룡 투명 원본의 공통 크기를 확인해 주세요.'
 art_strips=[
  {'type':'image','paths':[str(ROOT/'apps/client/public'/preview['buildings'][bid].lstrip('/')) for bid in strip],
   'width':46,'height':128,'caption':' · '.join(buildings[bid]['nameKo'] for bid in strip)}
  for strip in BUILDING_ART_STRIPS
 ]
 design=narrative('docs/current/production-and-services.md',include=('1. 화면과 아트 방향',),skip_intro=True)
 exterior_heading=next(i for i,block in enumerate(design) if block.get('text')=='파크 경계와 정문 길')
 dinosaur_art=next(block for block in design if block.get('text','').startswith('파라·이구아노돈·트리케라톱스·스테고케라톱스는'))
 return [
  design[exterior_heading+1],
  design[exterior_heading+2],
  {'type':'nav','text':'파크 뒤 초원에서 첫 조사 시작하기','target':'first-meadow-dispatch'},
  {**p(f'배치 칸 하나는 지도 기준 {tile["TILE_WIDTH"]}×{tile["TILE_HEIGHT"]}px인 마름모다. 파크 화면에서 칸 수는 배치 판정에만 쓰인다. 일반 시설의 강화는 같은 자리에서 진행한다.'),'keep_with_next':True},
  {**table(['시설','차지하는 자리'],[[' · '.join(names),size] for size,names in footprints.items()],[2.5,1]),'keep_rows':True},
  {**h('시설별 기본 외형'),'anchor':'park-safety-buildings'},
  p('서식지, 연구, 관람, 편의, 생산, 운영 시설의 기본 외형을 건설 목록과 지도에서 확인할 수 있다.'),
  *art_strips,
  dinosaur_art,
  {**p(f'아래 공룡은 {canvas_width}×{canvas_height}px 투명 게임 이미지와 같은 발밑 기준을 사용한다. 지도에 그리는 폭은 종에 따라 다르고, 지도 배율에 따라 화면에서도 달라진다. 공룡 한 마리는 배치할 수 있는 칸 하나를 차지한다.'),'keep_with_next':True},
  {**table(['공룡','지도 기준 그림 가로 폭'],widths,[2.5,1]),'keep_rows':True},
  h('시설 옮기기와 회전'),
  p('시설을 놓거나 옮길 때 회전을 누르면 같은 자리에서 그림이 좌우로 뒤집힌다. 두 번 누르면 원래 방향으로 돌아온다. 건설이나 이동을 누르면 위치와 방향이 함께 저장된다.'),
  p('시설을 옮길 때는 빈자리로 끌어 놓는다. 정문의 회전은 왼쪽 아래나 오른쪽 아래를 향하게 한다. 앞쪽 모서리에서는 제자리에서 돌릴 수 있고, 한 변에만 닿은 자리에서는 선택한 방향의 가까운 빈자리가 표시된다.'),
 ]

def add_scout_spot_maps(book):
 path='docs/current/exploration-spots.md'
 overview,maps=(ROOT/path).read_text().split('\n## 공룡 발견 지역',1)
 sections=re.split(r'^### (.+)\n',maps,flags=re.M)[1:]
 by_name=dict(zip(sections[::2],sections[1::2]))
 assert set(by_name)=={name for _,name in SCOUT_REGIONS}
 dispatches=model.scout_dispatches()
 long_range=[r for r in dispatches if r['fuel']==10]
 scout_overview=narrative(path,text=overview)
 first_meadow=next(block for block in scout_overview if block.get('text')=='파크 뒤 초원 첫 조사')
 first_meadow['anchor']='first-meadow-dispatch'
 book.add('scout-expedition','탐험','탐험가 파견과 지역 미니맵',[
          *scout_overview,
          {**h('연료가 드는 장거리 목표'),'anchor':'scout-long-range-fuel'},
          {**table(['지역','조사 목표','필요 연료'],[[r['region'],r['title'],r['fuel']] for r in long_range],[1.4,4,1]),'keep_table':True},
          {'type':'nav','text':'깊은 바다 파견 스팟 8곳','target':'scout-deep-sea'},
          {'type':'nav','text':'연료를 보충하거나 생산하는 방법','target':'special-expedition-fuel'},
          {'type':'nav','text':'연구원과 연구소의 단계별 해금','target':'research-rules'},
          {'type':'nav','text':'DNA 연구소 강화표','target':'building-lab'},
          ],['탐험가','미니맵','탐험 스팟','귀환 보고서','탐험 보상 수령','후반 스팟',
             ('파크 뒤 초원','first-meadow-dispatch'),('첫 탐험가 파견','first-meadow-dispatch'),
             ('장거리 원정','scout-long-range-fuel')],True)
 for region,name in SCOUT_REGIONS:
  section=by_name[name].split('\n## 재료 지역',1)[0]
  blocks=narrative(path,text=section)
  spots=next(b for b in blocks if b['type']=='table')
  difficulty=re.findall(r'^\| [^|]+ \| (\S+ [★☆]{5}) \|',section,flags=re.M)
  assert len(spots['rows'])==len(difficulty)==8,(name,'파견 스팟 8곳')
  spots['widths']=[1.18,1,2.05,3.2]
  for row,stars in zip(spots['rows'],difficulty):row[1]=stars
  if region=='deep-sea':
   blocks.append({'type':'nav','text':'특수 원정 연료를 채우는 방법','target':'special-expedition-fuel'})
  if region=='abandoned-lab':
   blocks.append({'type':'nav','text':'회수한 연구자료를 복원하는 방법','target':'hybrid-research-notes'})
  book.add('scout-'+region,'탐험',name+' 파견 스팟',blocks,
           [name+' 탐험',*[r[0] for r in spots['rows']]],True)


def make_book():
 b=Book();story=editorial('story-people');figures=editorial('figures')
 species,actual,provenance=model.catalogue();costs=model.effect.cost.all_costs();cost_index={(r['id'],r['level']):r for r in costs}
 acquisition_rows=acquisition.acquisition_rows();acquisition_by_species={r['species_id']:r for r in acquisition_rows}
 acquisition_counts=acquisition.summary()
 b.add('read-first','이용 안내','가이드북 사용법',[
  p('파크를 열고 새 공룡을 맞이하세요. 이 책에서 첫 손님을 받는 방법부터 시설 강화, 탐험, DNA 합성, 다른 파크와의 경기와 거래까지 찾아볼 수 있습니다. 완성 게임의 전체 흐름을 담아 이용할 수 있는 메뉴는 플레이 버전에 따라 달라질 수 있습니다.'),
  p('Word 탐색 창의 제목을 누르면 해당 장이나 핵심 본문으로 이동한다. 2쪽 목차는 12장으로, 3쪽 빠른 찾기는 성장표·강화표·레시피처럼 자주 확인하는 항목으로 연결된다. 공룡·인물·연구·건물 이름은 뒤쪽 색인에서 찾는다. 각 쪽 아래의 목차와 색인 링크로 돌아갈 수 있다.'),
  table(['찾는 내용','이 책에 있는 항목'],[['공룡','기본 83종의 최초·반복 획득 경로와 실험 계통'],['위인과 인물','위인 50명의 레벨별 능력과 이야기 속 인물'],['건물','주요 시설 25종의 25레벨 강화표'],['연구','운영·사육·탐험·유전 4계열과 69개 항목'],['파크 성장','파크 Lv.5~50의 네 분야 성장 목표와 본편 연결'],['탐험과 합성',f'46개 재료 목표, 자연종 알 목표, 지정 {acquisition_counts["recipes"]}개 레시피와 실험 합성']],[1,4])],terms=['사용법','찾아보기'],toc=True)
 game_sections=('2. 핵심 루프','4. 공간과 파크 운영','5. 첫 10분','6. 첫 합성까지의 진행')
 game_blocks=narrative('docs/current/game-design.md',include=game_sections,skip_intro=True)
 exhibit_flow=next(block for block in game_blocks if block['type']=='h' and block['text']=='전시 확장과 관람대 강화')
 exhibit_flow['anchor']='park-exhibit-flow'
 expansion_intro=next(i for i,block in enumerate(game_blocks)
                     if block['type']=='p' and block['text'].startswith('부지를 매입하면 배치할 공간이 늘어난다.'))
 game_blocks[expansion_intro]['text']=game_blocks[expansion_intro]['text'].removesuffix(' 부지 확장')
 game_blocks.insert(expansion_intro+1,{'type':'nav','text':'중반 필지 매입과 울타리 확장','target':'park-plot-purchase'})
 shuttle_intro=next(i for i,block in enumerate(game_blocks)
                   if block['type']=='p' and block['text'].startswith('셔틀버스가 열리면'))
 game_blocks[shuttle_intro]['text']=game_blocks[shuttle_intro]['text'].removesuffix(' 셔틀버스 운영')
 game_blocks.insert(shuttle_intro+1,{'type':'nav','text':'셔틀버스 구매와 노선 운영','target':'park-visitor-transport'})
 safari_intro=next(i for i,block in enumerate(game_blocks)
                   if block['type']=='p' and block['text'].startswith('사파리 관리에서는'))
 game_blocks[safari_intro]['text']=game_blocks[safari_intro]['text'].removesuffix(' 사파리 지프 투어')
 game_blocks.insert(safari_intro+1,{'type':'nav','text':'사파리 우리와 지프 관람','target':'park-safari-jeep'})
 exhibit_design=next(i for i,block in enumerate(game_blocks)
                     if block['type']=='p' and block['text'].startswith('초원·해양관의 블록 확장 설계에서는'))
 game_blocks[exhibit_design]['text']=game_blocks[exhibit_design]['text'].removesuffix(' 서식지 블록과 익룡 돔 공간')
 game_blocks.insert(exhibit_design+1,{'type':'nav','text':'서식지 블록과 익룡 돔 공간','target':'habitat-space-design'})
 dangerous_exhibit=next(block for block in game_blocks if block['type']=='h' and block['text']=='위험 공룡 전시 준비')
 dangerous_exhibit['anchor']='dangerous-dinosaur-exhibit'
 scout_overview=next(i for i,block in enumerate(game_blocks)
                     if block['type']=='p' and block['text'].startswith('유휴 탐험가가 있고'))
 game_blocks[scout_overview]['text']=game_blocks[scout_overview]['text'].removesuffix(' 파견 절차')
 game_blocks.insert(scout_overview+1,{'type':'nav','text':'파크 뒤 초원에 첫 탐험가 보내기','target':'first-meadow-dispatch'})
 diagnosis=next(block for block in game_blocks if block['type']=='h' and block['text']=='입장 진단에서 원인 찾기')
 diagnosis['anchor']='park-admission-diagnosis'
 b.add('game-design','게임의 시작과 운영','게임의 전체 흐름',game_blocks,
       ['개장','파크 운영','첫 10분',('전시 확장','park-exhibit-flow'),('관람객 동선','park-exhibit-flow'),
        ('관람대 강화와 혼잡도','park-exhibit-flow'),('배치 효과','park-exhibit-flow'),
        ('위험 점수','dangerous-dinosaur-exhibit'),('육식 하이브리드 전시','dangerous-dinosaur-exhibit'),
        ('입장 진단','park-admission-diagnosis')],True)
 direction_path='docs/current/production-direction.md'
 direction_blocks=narrative(direction_path,include=('첫 개장과 첫 전시','시작 리더','재건 목표'),skip_intro=True)
 direction_headings={
  '첫 개장과 첫 전시':'first-exhibition-scope',
  '시작 리더':'starting-leaders',
  '재건 목표':'reconstruction-goals',
 }
 for block in direction_blocks:
  if block['type']=='h' and block['text'] in direction_headings:
   block['anchor']=direction_headings[block['text']]
  if block['type']=='table':
   block['widths']={
    '순서':[1.25,4.75],
    '리더':[1.1,1.5,2.1,1.9],
    '경로':[1,5],
   }[block['headers'][0]]
   block['keep_group']='production-direction-'+block['headers'][0]
 growth_intro=next(i for i,block in enumerate(direction_blocks)
                   if block['type']=='p' and block['text'].startswith('첫 전시 뒤 파크의 성장 목표를 열어'))
 direction_blocks.insert(growth_intro+1,{'type':'nav','text':'첫 전시 뒤 파크 Lv.15까지','target':'park-growth-walkthrough'})
 b.add('production-direction','게임의 시작과 운영','시작 리더와 재건 목표',
       direction_blocks,
       [*direction_headings.items(),('첫 스테고케라톱스 전시','first-exhibition-scope'),
        ('리더','starting-leaders'),('승리 조건','reconstruction-goals')],True)
 progression_path='docs/current/park-progression.md'
 growth_walkthrough='첫 전시 뒤 파크 Lv.15까지'
 walkthrough=narrative(progression_path,include=(growth_walkthrough,),skip_intro=True)
 assert walkthrough and walkthrough[0]['type']=='h','First exhibition growth guide is missing'
 diagnosis_summary=next(i for i,block in enumerate(walkthrough)
                        if block['type']=='p' and block['text'].startswith('첫 전시 뒤 입장 진단에서'))
 walkthrough.insert(diagnosis_summary+1,{'type':'nav','text':'입장 진단에서 원인 찾기','target':'park-admission-diagnosis'})
 for block in walkthrough:
  if block['type']=='table':
   if block['headers']==['파크','시설 예시','연구 예시','현장 예시']:
    level_rows={row['park_level']:row for row in progression.level_rows()}
    block['headers']+=['유료 입장']
    block['rows']=[row+[f"{int(level_rows[stage]['source']['operation'].removeprefix('paid:')):,}명"]
                   for stage,row in enumerate(block['rows'],8)]
    block['widths']=[.85,1.35,1.55,2.65,1]
   else:
    block['widths']=[1.1,5]
    block['keep_table']=True
  if block['type']=='h':
   for level,target in STRATEGY_TOPICS.items():
    if block['text']==f'파크 레벨 {level}에서 {level+1}까지':
     block['anchor']=target
 b.add('park-growth-walkthrough','게임의 시작과 운영',growth_walkthrough,
       [*walkthrough[1:],{'type':'nav','text':'입장 수속 연구의 단계별 효과와 비용','target':'research-ops-entry'},
        {'type':'nav','text':'환경 적응 연구의 단계별 효과와 비용','target':'research-care-adaptation'},
        {'type':'nav','text':'현장 지도화의 단계별 효과와 비용','target':'research-exp-field-mapping'},
        {'type':'nav','text':'위험종을 전시할 때 보안센터 강화 효과','target':'building-security'},
        {'type':'nav','text':'탐험가 파견과 귀환 보고서','target':'scout-expedition'},
        {'type':'nav','text':'파크 Lv.15에서 새 하이브리드 실험 시작하기','target':'experimental-hybrids'},
        {'type':'nav','text':'파크의 전체 성장 목표표','target':'park-progression-overview'}],
       ['성장 목표','첫 전시 뒤 성장','897 XP','파크 Lv.6 도달','기초 촉매 회수','전시 구역 수용량','관람 혼잡도',
        ('파크 Lv.7 도달',STRATEGY_TOPICS[6]),('파크 Lv.8 도달',STRATEGY_TOPICS[7]),('운영 경로',STRATEGY_TOPICS[6]),
        ('탐험 경로',STRATEGY_TOPICS[6]),('화석 계곡 재조사',STRATEGY_TOPICS[7])],True)
 b.add('park-progression-rules','게임의 시작과 운영','첫 합성 이후 성장과 경험치 기준',
       narrative(progression_path,exclude=(growth_walkthrough,'7. 정적 검증과 구현 경계'),skip_intro=True),['파크 성장','경험치'],True)
 growth_levels=progression.level_rows();growth_goals=progression.goal_rows();growth_summary=progression.summary()
 b.add('park-progression-overview','게임의 시작과 운영','Park5부터50 성장과 경험치 공급표',[
  p('첫 지정 영웅 이후 45번의 레벨 전환에 필요한 경험치를 확인한다. Lv.6→7과 Lv.7→8은 운영 또는 탐험 경로를 따른다. 장기 성장표의 시설·연구·현장·운영 목표는 병행하며 대안이 있으면 하나를 완료한다.'),
  p(f'초반 다섯 목표의 {growth_summary["early_goal_xp"]:,}XP로 파크 Lv.5에 도달하고 {growth_summary["park5_carry_xp"]}XP가 남는다. 이후 성장 목표에서 {growth_summary["new_goal_xp"]:,}XP를 받아 파크 Lv.50에 필요한 누적 {growth_summary["cumulative_to_park50"]:,}XP를 채울 수 있다.'),
  h('성장 구간의 방향'),table(['권장 구간','성장 방향','함께 읽을 본편'],[[f'{m["park_from"]}~{m["park_to"]}',m['label']+' / '+m['focus'],{'responsibility':'4장 심연의 비밀','crisis':'5장 폭풍 전야','conclusion':'6장과 선택한 에필로그'}.get(m['id'],'운영과 수집')] for m in progression.milestones()],[1,3.6,1.6]),
  h('레벨별 필요량과 목표 공급'),table(['현재→다음','전환 필요XP','새 목표 보상합','다음 레벨 누적기준','권장 연구소 준비'],[[f'{r["park_level"]}→{r["next_park_level"]}',f'{progression.experience(r["park_level"]):,}',f'{r["new_xp"]:,}',f'{r["cumulative_park_xp"]:,}',r['recommended_lab']] for r in growth_levels],[1.1,1.2,1.2,1.7,1.2]),
  p('Lv.5의 목표 보상과 남아 있던 35XP를 합치면 Lv.6에 도달한다. 권장 연구소 레벨은 다음 기술을 준비할 때 참고한다. 토지·시설·기술은 각각의 조건을 갖춰 열고, 개별 비용과 시간이 든다.'),
  source('원천 park-progression / 기존 shared Park XP곡선과 밸런스 초반5목표')],['파크 성장표','성장 경험치','중후반 성장','레벨별 경험치','Park50','Park XP','일회성 목표'],True)
 for r in growth_levels:
  level=r['park_level'];goals=[g for g in growth_goals if g['park_level']==level]
  blocks=[p(f'현재 Park{level} → Park{r["next_park_level"]} · 필요XP {progression.experience(level):,} · 새 목표 합 {r["new_xp"]:,}')]
  if level in progression.CURRENT_STRATEGY_LEVELS:
   blocks.append({'type':'nav','text':f'Lv.{level}→{level+1} 운영·탐험 경로','target':STRATEGY_TOPICS[level]})
  else:
   blocks.extend([p(f'연구소 Lv.{r["recommended_lab"]}를 준비하는 권장 구간이다. 건물/연구소 레벨과 Park레벨은 별개이며 먼저 정상 완료한 조건도 인정한다. 완료 조건 안의 ‘또는’은 대안 중 하나를 뜻한다.'),
          {**table(['성장 목표','완료 조건','Park XP'],[[g['track_label'],progression.goal_label(g),f'{g["xp"]:,}'] for g in goals],[1.1,5.2,.9]),'progression_goal_ids':[g['id'] for g in goals]},
          p(f'네 목표의 보상을 모두 받으면 누적 {r["cumulative_park_xp"]:,}XP에 도달한다. 각 목표는 한 번씩 수령하고, 원정 보상과 부화·합성 완료 개체는 해당 화면에서 따로 받는다.')])
  if level==5:
   blocks.insert(1,{'type':'nav','text':f'현재 플레이할 수 있는 Lv.{level}→{level+1} 경로','target':'park-growth-walkthrough'})
  for ref in r['story_refs']:
   chapter_targets={f'chapter-{n}':f'story-story-chapter-{n}' for n in range(4,7)}|{'epilogue':'story-story-epilogue'}
   target=chapter_targets.get(ref,('story-current-' if re.match(r'(prologue|ch[123])-scene-',ref) else 'story-entry-story-')+ref)
   blocks.append({'type':'nav','text':'함께 진행할 본편 '+ref,'target':target})
  if level<49:blocks.append({'type':'nav','text':f'다음 Park{level+1} 성장목표','target':'park-level-'+str(level+1)})
  else:blocks.append(p('Park50 이후에도 시설·연구·탐험·수집을 이어간다. 전체69기술 최대·83종 전수집·15레시피 완성을 이 레벨업의 필수로 요구하지 않는다.'))
  if level not in progression.CURRENT_STRATEGY_LEVELS:
   blocks.append(source(f'목표 park-growth-{level:02d}-facility / research / field / operation · 성장 정본과 기존 시설/연구/획득 원천'))
  start=len(b.pages);b.add('park-level-'+str(level),'게임의 시작과 운영',f'Park{level}에서{level+1} 성장목표',blocks,[f'파크 Lv.{level}',f'Park{level} 성장'],True)
  for page in b.pages[start:]:page['progression_level']=level
 # Keep a complete chapter and its scenes in the same flowing article.
 grouped=[];used=set()
 for section in story['sections']:
  if section['id'] in used:continue
  # The 18 early scenes now have a current source with actual dialogue and
  # gameplay gates. Render it once rather than a competing old synopsis.
  if section['id']=='story-prologue':
   current_story(b,story)
  if section['id'] in {'story-prologue','story-chapter-1','story-chapter-2','story-chapter-3'} or section.get('chapter_id') in {'prologue','chapter-1','chapter-2','chapter-3'}:
   used.add(section['id']);continue
  group=[section];used.add(section['id'])
  if section.get('section_type')=='chapter':
   chapter=section['id'].removeprefix('story-')
   for child in story['sections']:
    if child.get('chapter_id')==chapter:
     group.append(child);used.add(child['id'])
  blocks=[];terms=[]
  for index,item in enumerate(group):
   startblock=len(blocks)
   entryid='story-entry-'+item['id']
   if index:blocks.append({**h(item['title']),'anchor':entryid})
   else:entryid='story-'+section['id']
   blocks += [p(v) for v in item.get('paragraphs',[])]
   if item.get('table'):blocks.append(table(item['table']['headers'],item['table']['rows'],[1]*len(item['table']['headers'])))
   blocks.append(source('출처 '+str(item['source'])));
   for block in blocks[startblock:]:block['keep_group']=entryid
   terms += [(v,entryid) for v in item.get('index_terms',[])+[item['title']]]
  b.add('story-'+section['id'],'스토리와 세계관',section['title'],blocks,terms,toc=section.get('section_type')=='chapter' or section['id'] in ['story-world','story-read-first'])
 # Narrative character cards remain separate from personnel stat profiles.
 chars=story['characters']
 for i in range(0,len(chars),2):
  blocks=[];terms=[]
  for c in chars[i:i+2]:
   blocks += [{**h(c['name']),'anchor':'character-'+c['id']},p(c['role']+' · '+c.get('affiliation','')+' · '+c['status']),p(c['description']),p('서사 흐름 '+c['arc'])]
   if c.get('identity_note'):blocks.append(p('구분 '+c['identity_note']))
   if c.get('catalog_id'):blocks.append(p('위인 도감 '+c.get('catalog_name',c['name'])))
   blocks.append(source('출처 '+str(c['source'])));terms += [(v,'character-'+c['id']) for v in [c['name'],*c.get('aliases',[])]]
  b.add(f'people-{i}','등장인물',f'등장인물 {i+1}부터{min(i+2,len(chars))}',blocks,terms,toc=i==0)
 b.add('figures-overview','위인','위인의 영입과 효과',[p(v) for v in figures['overview']],['위인','영입','위인 포인트','GP','보유 효과','배정 효과','연구원과 위인'],True)
 rules=figures['rules']
 b.add('figure-rules','위인','GP 영입과 위인 성장',[
  h('GP 영입 비용'),table(['등급','영입 GP'],[[x['rarity'],x['gp_cost']] for x in rules['recruitment_prices']],[2,1]),
  h('GP 획득'),table(['활동','GP','반복과 수령'],[[x['trigger'],x['gp'],x['repeat']+' · '+x['claim']] for x in rules['gp_sources']],[2,0.7,3]),
  h('레벨 성장'),table(['Lv','누적 경험치','다음 단계 XP','골드 훈련비'],[[x['level'],x['xp_total'],x['xp_to_next'],x['gold_to_next']] for x in rules['growth']],[.5,1,1,1]),
  h('경험치 획득'),table(['활동','XP','적용과 반복'],[[x['trigger'],x['xp'],x['recipient']+' · '+x['repeat']] for x in rules['xp_sources']],[2,.6,2.6]),
  source('원천 docs/current/great-figures.md')],['위인 성장','영입 GP','위인 경험치','위인 훈련','GP 획득'],True)
 figure_text=(ROOT/'docs/current/great-figures.md').read_text()
 cap_text=re.search(r'^## 4\..*?\n(.*?)(?=^## 5\.)',figure_text,re.M|re.S)[1]
 cap_paras=[p(v) for v in re.split(r'\n\s*\n',cap_text) if v.strip() and not v.lstrip().startswith('|')]
 cap_table=table(['효과','단위','보유','배정','관계','최종 상한'],[[x['label'],x['unit'],x['owned_cap'],x['assigned_cap'],x['synergy_cap'],x['total_cap']] for x in rules['effect_caps']],[2.5,.5,.6,.6,.6,.8])
 b.add('figure-caps','위인','보유 배정 시너지의 중첩과 상한',cap_paras[:2]+[cap_table]+cap_paras[2:]+[source('원천 docs/current/great-figures.md')],['위인 상한','보유 효과 상한','배정 효과 상한','위인 중첩'],True)
 names={f['id']:f['name'] for f in figures['figures']}
 b.add('figure-synergies','위인','위인 관계 시너지',[
  p('필요한 인물을 모두 보유하고 각Lv.5 이상이면 기본 관계 효과, 모두Lv.10이면 완성 효과를 적용한다. 같은 효과에는 관계·분류 시너지 중 최고 하나를 사용한다.'),table(['관계','필요 인물','효과','Lv.5 → 모두Lv.10'],[[x['name'],' + '.join(names[v] for v in x['member_ids']),x.get('effect_label',x['effect_id']),str(x['value'])+x['unit']+' → '+str(x['max_value'])+x['unit']] for x in rules['synergies']],[1.2,1.6,1.5,.8]),h('분류별 컬렉션'),table(['분류','효과','필요 조건'],[[x['name'],x['effect_label']+' '+str(x['value'])+x['unit'],x['requirement']] for x in rules['category_synergies']],[1.2,1.7,2.6]),source('원천 docs/current/great-figures.md')],['위인 시너지','관계 시너지','분류 시너지'],True)
 for i,f in enumerate(figures['figures']):
  own=f['possession_effect'];assigned=f['assignment_effect'];recruit=f['recruitment']
  blocks=[p(f['english_name']+' · '+f['category']+' · '+f['rarity']+' · '+f['id']),p(f['description']),p('역할 '+f['role']),
   p('영입 '+str(recruit['gp_cost'])+' GP · '+recruit['appearance_condition']),
   p('보유 효과 '+own['label']+' · '+own['scope']+' · '+own.get('target_condition','모든 유효 대상')),p('배정 효과 '+(assigned['label']+' · '+assigned['scope']+' · '+assigned.get('target_condition','모든 유효 대상') if assigned['available'] else '현장 배정 없음 · 유산 기록으로 보유 효과 적용')),
   table(['Lv','보유 효과 '+own['unit'],'배정 효과 '+assigned['unit'],'다음 단계 XP','골드 정리비' if recruit['kind']=='memorial_record' else '골드 훈련비'],[[x['level'],x['possession_value'],x['assignment_value'] if assigned['available'] else '-',x['xp_to_next'] if x['level']<10 else '-',x['gold_to_next'] if x['level']<10 else '-'] for x in f['levels']],[.5,1.1,1.1,1,1.3]),
   p('성장 구간 '+' / '.join('Lv.'+str(x['level'])+' '+x['title']+' '+x['effect'] for x in f['milestones'])),
   p('적용 '+own['aggregation']+' · 효과별 최종 상한 적용')]
  if f.get('quote'):blocks.append(p(('유산 기록 ' if recruit['kind']=='memorial_record' else '대사 ')+f['quote']))
  if f['relations']:blocks.append(p('관계 '+' / '.join(f['relations'])))
  blocks.append(source('통합 위인 기획 great-figures.md · 현재 게임 연결은 구현 현황 장 참고'))
  # A real named heading supports both profile links and the chapter directory.
  blocks.insert(0,{**h(f['name']),'anchor':'figure-'+f['id'],'title_anchor':True})
  b.add(f'figures-{i}','위인',f['name'],blocks,[(v,'figure-'+f['id']) for v in [f['name'],f['english_name'],f['id'],f.get('runtime_id','')]],toc=False)
 policy=[]
 for v in figures.get('legacy_systems',[]):
  if '구현 상태' in v['title']:continue
  policy += [h(v['title']),p(v.get('summary',v.get('description','')))]
 b.add('figure-policy','위인','위인의 대화 배정과 운영',policy+[source('원천 docs/current/great-figures.md')],[v['title'] for v in figures.get('legacy_systems',[])],True)
 resources_path='docs/current/resources-and-production.md'
 resources=narrative(resources_path,exclude=('1. 범위와 기준','10. 자원 분류와 운영 범위','12. 구현 상태·이관·완료 기준'),skip_intro=True)
 for block in resources:
  if block['type']=='h' and block['text']=='특수 원정 연료와 보급':
   block['anchor']='special-expedition-fuel'
  if block['type']=='table' and block['headers'][-1]=='현재 코드 상태':
   block['headers'].pop()
   block['widths'].pop()
   for row in block['rows']:row.pop()
 b.add('resources','자원과 재료','자원 생산과 사용처',resources,
       ['자원 생산과 사용처','재료함',('특수 원정 연료','special-expedition-fuel'),
        ('연료 보급소','special-expedition-fuel'),('연료 구매','special-expedition-fuel')],True)
 balance_path='docs/current/balance.md'
 balance_sections=('2. 공통 운영 값','3. 최초 건설과 도입','4. 강화 비용과 시간 계산','5. 건물별 성능',
                   '6. 생산 단가','7. 입장료와 전체 금고 한도','10. 초반 목표 앵커',
                   '11. 연구 재료 승급 비용','12. 건설자와 연구원 고용','13. 기술 연구 비용과 시간','15. 최종 연구시간·할인·도달 가능성')
 balance_blocks=narrative(balance_path,include=balance_sections,skip_intro=True)
 shuttle_balance=next(i for i,block in enumerate(balance_blocks)
                     if block['type']=='h' and block['text'].endswith('셔틀버스 구매와 운행'))
 shuttle_example=next(i for i,block in enumerate(balance_blocks)
                     if block['type']=='p' and block['text'].startswith('예를 들어 정문에서 24칸 떨어진 전시는'))
 balance_blocks[shuttle_balance]['anchor']='shuttle-economy'
 balance_blocks[shuttle_balance+1].update(widths=[1,2.3],keep_table=True)
 balance_blocks[shuttle_example]['text']=balance_blocks[shuttle_example]['text'].removesuffix(' 셔틀버스 운행 조작')
 balance_blocks.insert(shuttle_example+1,{'type':'nav','text':'셔틀버스 구매와 노선 운영','target':'park-visitor-transport'})
 safari_balance=next(i for i,block in enumerate(balance_blocks)
                     if block['type']=='h' and block['text'].endswith('사파리 우리 비용'))
 balance_blocks[safari_balance]['anchor']='safari-enclosure-cost'
 balance_blocks[safari_balance+1]['text']=balance_blocks[safari_balance+1]['text'].removesuffix(' 사파리 우리와 지프 관람')
 balance_blocks.insert(safari_balance+2,{'type':'nav','text':'사파리 우리와 지프 관람','target':'park-safari-jeep'})
 b.add('economy','경제와 정산','입장료 저장 한도와 비용 규칙',balance_blocks,
       ['입장료와 저장 한도',('셔틀버스 운행비','shuttle-economy'),('사파리 우리 비용','safari-enclosure-cost')],True)
 b.add('operation-balance','경제와 정산','첫 주와 장기 운영 예시',
       narrative('docs/current/operation-balance.md',exclude=('후속 플레이 검증',),skip_intro=True),
       ['첫 주 운영','첫 7일','운영 순수입','골드 고갈','복구 운영','중후반 수급'],True)
 param_rows=model.building.table('params')
 b.add('numeric-policies','경제와 정산','운영 기본값과 인력 고용',[
  p('표의 기본값에 완료한 기술과 해당 시설의 효과를 적용한다. 공사나 연구에 앞서 화면에서 이번 작업의 최종 비용과 시간을 확인한다.'),
  table(['기본값','값','의미'],[[r['id'],r['value'],r['설명']] for r in param_rows],[2,1,4]),
  h('인원별 한 번의 영구 고용'),table(['역할/총인원','필요 시설','골드','다이아','첫 영웅 후'],[[r['role']+' '+r['count'],r['building']+' '+r['level'],r['gold'],r['diamond'],r['first_hero']] for r in model.building.table('staff')],[1.5,1.5,1,1,1]),source('원천 balance 공통 값/인력 표')],['골드','다이아','입장료','금고','고용','건설자','연구원'],True)
 buildings_path='docs/current/buildings.md'
 buildings_text=(ROOT/buildings_path).read_text()
 b.add('park-placement-scale','건물과 부지','파크 배치 크기와 시설 이동',park_placement_scale(species),
       ['배치 크기','시설 이동','시설 회전','건물 크기','공룡 크기','파크 경계','정문 진입로','섬 전체 보기',
        ('시설 기본 외형','park-safety-buildings'),('보안센터 외형','park-safety-buildings')],True)
 building_rules=narrative(buildings_path,text=buildings_text,exclude=('1. 수치 원천과 현재 구현','7. 구현·이관과 보존 계약'),skip_intro=True)
 habitat_catalog=next(block for block in building_rules
                      if block.get('headers')==['기준 ID','시설','운영 방식','역할과 도입'])
 habitat_catalog.update(widths=[1.05,.95,.75,1.65],keep_table=True)
 fence_heading=next(i for i,block in enumerate(building_rules)
                    if block['type']=='h' and block['text']=='실외 서식지 울타리 강화')
 building_rules[fence_heading]['anchor']='habitat-fence-upgrade'
 artwork=park_artwork_preview()
 carnivore='habitat-carnivore'
 fence_paths=[ROOT/'apps/client/public'/artwork[group][carnivore].lstrip('/')
             for group in ('buildings','habitatFences')]
 building_rules.insert(fence_heading+3,{'type':'image','paths':list(map(str,fence_paths)),
  'width':69,'height':194,'caption':'육식 서식지 · Lv.1(왼쪽)과 Lv.5(오른쪽)'})
 space_heading=next(block for block in building_rules
                    if block['type']=='h' and block['text']=='서식지 블록과 익룡 돔 공간')
 space_heading['anchor']='habitat-space-design'
 expansion_headings={
  '중반 인접 필지 매입':'park-plot-purchase',
  '대형 파크의 관람 교통':'park-visitor-transport',
  '사파리 지프 투어':'park-safari-jeep',
  '사파리 시범 관람':'park-safari-preview',
  '스테고사우루스 3D 관람':'park-stegosaurus-3d',
 }
 for block in building_rules:
  if block['type']=='h' and block['text'] in expansion_headings:
   block['anchor']=expansion_headings[block['text']]
   if block['anchor']=='park-plot-purchase':block['text']+=' (기획)'
 shuttle_detail=next(i for i,block in enumerate(building_rules)
                    if block['type']=='p' and block['text'].startswith('휴장하거나 배치 변경으로'))
 building_rules[shuttle_detail]['text']=building_rules[shuttle_detail]['text'].removesuffix(' 구매·배차 및 운행비')
 building_rules.insert(shuttle_detail+1,{'type':'nav','text':'셔틀버스 구매·배차 수치와 운행비','target':'shuttle-economy'})
 safari_save=next(i for i,block in enumerate(building_rules)
                  if block['type']=='p' and block['text'].endswith(' 사파리 우리 비용'))
 building_rules[safari_save]['text']=building_rules[safari_save]['text'].removesuffix(' 사파리 우리 비용')
 building_rules.insert(safari_save+3,{'type':'nav-grid','columns':3,'items':[
  ('우리 비용','safari-enclosure-cost'),('스테고사우루스 획득','dino-stegosaurus'),('티라노사우루스 렉스 획득','dino-tyrannosaurus-rex')]})
 expansion_status=re.search(r'토지 공사와 인접 필지 매입은 [^.]+\.',buildings_text)[0]
 land_intro=next(i for i,block in enumerate(building_rules)
                 if block['type']=='h' and '토지의 유료 확장과 입구 미리보기' in block['text'])
 building_rules.insert(land_intro+1,{**p(expansion_status),'keep_with_next':True})
 aviary_intro=next(i for i,block in enumerate(building_rules)
                   if block['type']=='p' and block['text'].startswith('익룡 돔. 돔은 독립된 시설로'))
 aviary_headers,aviary_rows,flight_costs=aviary_space_display()
 building_rules[aviary_intro+1:aviary_intro+1]=[
  {**p('한 마리가 쓰는 비행 공간은 '+flight_costs+'다. 같은 돔의 개체들이 쓰는 공간을 합산한다.'),'keep_with_next':True},
  {**table(aviary_headers,aviary_rows,[.8,.9,.9,1.1,3.3]),'keep_table':True},
 ]
 b.add('building-rules','건물과 부지','건물 운영과 호환 규칙',building_rules,
       ['건물 역할','부지','강화',('실외 서식지 울타리','habitat-fence-upgrade'),('육식 서식지 외형','habitat-fence-upgrade'),
        ('전기 울타리','habitat-fence-upgrade'),('서식지 블록','habitat-space-design'),('익룡 돔 공간 단계','habitat-space-design'),
        ('필지 매입','park-plot-purchase'),('버스','park-visitor-transport'),('셔틀버스','park-visitor-transport'),
        ('배차','park-visitor-transport'),('사파리 지프','park-safari-jeep'),('사파리 관리','park-safari-jeep'),
        ('사파리 우리','park-safari-jeep'),('지프 정차 지점','park-safari-jeep'),('사파리 시범 관람','park-safari-preview'),
        ('로봇 중재','park-safari-preview'),('스테고사우루스 3D 관람','park-stegosaurus-3d')],True)
 for bid,definition in list(model.building.BUILD.items())+list(model.SPECIAL.items()):
  special=bid in model.SPECIAL;name=definition.get('건물',definition.get('name'))
  blocks=[p('최대 25레벨. 표는 단계별 기본 비용과 시간이며 할인 전이다. 24→25 강화는 일반 단축 후에도 최소 7일이다.')]
  if special:blocks.append(p('해금 '+research(definition['research'])+f' · 점유 {definition["width"]}×{definition["height"]} · 첫 영웅 이후'))
  rr=[]
  for level in range(1,26):
   r=model.special_upgrade(bid,level) if special else model.building.upgrade(bid,level)
   effect=f'수용{r["capacity"]} / 악화{level-1}% 완화' if special else model.building.effect_text(bid,level)
   rr.append([level,f'{r["gold"]:,}',f'{r["wood"]}/{r["stone"]}/{r["metal"]}',duration(r['seconds']),r['upkeep'],effect])
  if bid=='platform':
   blocks.append(p('첫 영웅을 수령하고 파크 Lv.5에 도달하면 관람대를 Lv.3부터 강화할 수 있다. 기본 물자에서 금속을 개당 80골드로 구입한다. 관람대를 선택해 자재, 공사 시간, 담당 전시의 혼잡도와 만족도 변화를 확인한다. 공사 중에는 기존 외형과 관람 자리로 운영한다. Lv.5가 완공되면 같은 위치에서 넓은 청록색 지붕으로 바뀌고 담당 전시의 관람 자리가 100명으로 늘어난다.'))
   platform_art=ROOT/'apps/client/public/assets/buildings'
   blocks.append({'type':'image','paths':[str(platform_art/name) for name in ('viewing-platform.webp','viewing-platform-lv5.webp')],
                  'width':60,'height':150,'caption':'왼쪽은 Lv.1~4 관람대, 오른쪽은 Lv.5 관람대다.'})
  if bid in {'grassland','aerial','marine'}:
   blocks.append({'type':'nav','text':'기본 부지와 서식지 공간 설계','target':'habitat-space-design'})
  blocks.append(p('자재는 목재 / 석재 / 금속 순이며 유지비는 시간당 골드다. 강조된 행은 5레벨마다 바뀌는 성장 구간이다.'))
  blocks += [table(['Lv','골드','자재','기본 공사','유지비/h','성능'],rr,[.45,1.05,1.35,1.45,.8,3]),source('원천 docs/current/balance.md · '+('특수시설16절' if special else '건설/강화/성능 표'))]
  for block in blocks:
   if block['type']=='table':block['variant']='building'
  b.add('building-'+bid,'건물과 부지',name,blocks,[name,definition.get('catalog','')],toc=True)
 research_path='docs/current/research-trees.md'
 b.add('research-rules','연구','연구원과 연구트리의 규칙',
       narrative(research_path,exclude=('4. 권한과 콘텐츠의 실제 적용','8. 단계별 노출과 남은 수치 설계'),skip_intro=True),['연구원','연구트리'],True)
 for key in ['ops','care','exp','gene']:
  path=ROOT/f'docs/visuals/research-tree-v06/research-tree-{key}.png'
  b.add('tree-'+key,'연구',{'ops':'운영','care':'사육','exp':'탐험','gene':'유전'}[key]+' 연구 구조도',[p('연결선의 Lv는 필요한 선행 기술의 완료레벨이며 카드의 최대Lv는 해당 기술의 최대레벨이다. 세부 효과·비용은 각 항목 쪽을 확인한다.'),{'type':'image','path':str(path),'height':360},source('정본 research-trees.md에서 생성한 구조도')],toc=True)
 for node_id,node in model.effect.cost.NODES.items():
  levels=model.effect.all_effects()[node_id]['levels']
  effects=[]
  pending_scout_effect=node_id in SCOUT_PLAN_PENDING
  for row in levels:
   text=(row['effect']+' '+str(row['value']) if node_id in model.effect.BASE else row['effect'])
   if pending_scout_effect:text='파견 효과 준비 중'
   if node_id=='exp-evidence-validation':text=re.sub(r'서로 연결된 판단\d+구간, ','',text)
   for english,ko in MATERIAL.items():text=re.sub(r'\b'+english+r'\b',ko,text)
   text=re.sub(r'([가-힣 ]+)% (-?[0-9.]+)',r'\1 \2%',text)
   extra=[species[v['species']]['nameKo'] for v in acquisition.marked('extra-natural-targets') if v['required_research']==f'{node_id}:{row["level"]}']
   if extra:text+=' / 함께 여는 비육상 알 목표: '+' · '.join(extra)+' (탐험가 파견·부화, 전시 허가 별도)'
   effects.append([row['level'],text])
  parents='없음' if node['선행']=='-' else ' / '.join(research(v.strip()) for v in node['선행'].split(','))
  purpose=SCOUT_PLAN_STATUS if pending_scout_effect else clean(node['목적'])
  blocks=[p(node['계열']+' · '+node['분야']+f' · 최대 Lv.{node["max"]}'),p('목적 '+purpose),p('선행 '+parents+' · 연구소 단계 '+node['연구소단계']+(' · 첫 영웅 이후' if node['첫영웅후']=='1' else '')),
          h('레벨별 총효과'),table(['Lv','효과와 해금'],effects,[.5,6.5]),h('해당 레벨 한 번의 연구비')]
  rr=[]
  for level in range(1,int(node['max'])+1):
   r=cost_index[node_id,level];rr.append([level,f'{r["gold"]:,}',f'{r["wood"]}/{r["stone"]}/{r["metal"]}',duration(r['seconds']),duration(r['min_seconds']) if r['min_seconds'] else '별도 없음'])
  blocks += [table(['Lv','골드','목재/석재/금속','기본 시간','최종 하한'],rr,[.5,1,1.4,1.7,1.4]),p('완료한 단계의 효과를 적용한다. 화면에서 이미 완료한 할인까지 반영한 이번 연구 비용과 시간을 확인한다.')]
  for block in blocks:
   if block['type']=='table':block['variant']='research'
  b.add('research-'+node_id,'연구','연구 '+node['항목'],blocks,[node['항목'],node_id])
 add_scout_spot_maps(b)
 missions=model.material_missions()
 for area,name in AREA.items():
  rr=[]
  for r in missions.values():
   if r['area_id']!=area:continue
   rew=r['reward'];rr.append([r.get('name','기초 반복'),research(r['research']),f'{QUALITY[rew["quality"]]} {MATERIAL[rew["material"]]} {rew["quantity"]}',f'{r["gold"]:,}골드'+model.scout_fuel_label(r['id'])])
  b.add('expedition-'+area,'탐험',name+' 재료 목표',[p('목표를 고를 때 필요한 연구, 출발 비용과 기본 보상을 확인한다.'),table(['미션','필요 연구','기본 보상','준비비'],rr,[1.8,1.5,1.4,1])],[name],True)
 eggrows=[]
 for r in acquisition.egg_targets().values():
  label=species[r['species']]['nameKo']+(' (최초)' if r.get('starter_first') else '')
  eggrows.append([label,acquisition.research_label(r['research']),model.scout_locations(r['id'],AREA[r['area']]),f'{r["gold"]:,}골드'+model.scout_fuel_label(r['id']),duration(r['hatch_seconds'])])
 b.add('egg-targets','탐험','원종과 재입수 알 목표',[p('자연종 68종의 반복 알 목표와 첫 벨로시랩터 목표가 있다. 표의 장소는 알 목표가 연결된 구역이다. 탐험가를 파견하는 위치는 지역별 스팟 표에서 확인한다. 목표를 마치면 지정 알 한 개를 받고, 부화한 개체를 수령하면 도감에 등록된다.'),{'type':'nav','text':'지역별 탐험가 파견 스팟 찾기','target':'nav-scout-spots'},table(['종','기본 권한','장소','준비비','부화'],eggrows,[1.25,1.75,1,1.65,.65]),{'type':'nav','text':'최초 비용과 반복 비용을 비교하는 83종 전체 획득표','target':'acquisition-table'}],['원종 목표','알','재입수','방생'],True)
 synthesis_path='docs/current/dna-and-collection.md'
 synthesis_blocks=narrative(synthesis_path,exclude=('9. 데이터와 구현 범위',),skip_intro=True)
 repeat_traits_anchor='repeat-synthesis-traits'
 for block in synthesis_blocks:
  if block['type']=='h' and block['text'].endswith('품질과 승급'):
   block['anchor']='research-material-upgrades'
  if block['type']=='h' and block['text']=='반복 합성과 개체 능력치':
   block['anchor']=repeat_traits_anchor
  if block['type']=='h' and block['text']=='지정 레시피와 새 하이브리드':
   block['anchor']='collect-new-hybrids'
  if block['type']=='h' and block['text']=='새 하이브리드 실험':
   block['anchor']='experimental-hybrids'
  if block['type']=='h' and block['text']=='연구자료 획득과 재현':
   block['anchor']='hybrid-research-notes'
  if block['type']=='p' and block['text'].startswith('야시장에 올라온'):
   block['text']=block['text'].removesuffix(' 야시장 연구자료 거래')
  if block['type']=='table':
   if block['headers'][0]=='성향':
    block['keep_table']=True
   if block['headers'][0]=='공룡 등급':
    for rank,row in enumerate(block['rows'],1):
     row[1]=row[1].removesuffix(' ·')+' '+'★'*rank
   if block['headers'][0]=='결과와 방식':
    block['keep_table']=True
    block['widths']=[1.35,.85,2.05,.85,.85]
 synthesis_blocks.extend([
  {'type':'nav','text':'육식 하이브리드를 전시하는 방법','target':'dangerous-dinosaur-exhibit'},
  {'type':'nav','text':'재료 등급 올리기와 품질별 비용','target':'research-material-upgrades'},
  {'type':'nav','text':'상급 DNA를 얻는 화석 계곡 심층 보존층','target':'scout-fossil-valley'},
  {'type':'nav','text':'버려진 연구소의 외벽 보관동 파견','target':'scout-abandoned-lab'},
  {'type':'nav','text':'야시장에서 연구자료를 사고파는 방법','target':'hybrid-research-market'},
  {'type':'nav','text':'내 공룡을 다른 파크의 공룡과 비교하는 경기','target':'dinosaur-competition'},
 ])
 b.add('synthesis-rules','합성','DNA 합성과 실패 보호',synthesis_blocks+[source('원천 '+synthesis_path)],
       ['DNA 합성과 실패 보호',('반복 합성',repeat_traits_anchor),('개체 능력치',repeat_traits_anchor),
        ('매력도',repeat_traits_anchor),('대표 전시',repeat_traits_anchor),
        ('새로운 변종','collect-new-hybrids'),('새로운 하이브리드','experimental-hybrids'),
        ('실험 합성','experimental-hybrids'),('부모별 재료 견적','experimental-hybrids'),
        ('재료 등급 올리기','research-material-upgrades'),
        ('연구자료','hybrid-research-notes'),('외벽 보관동 기록 복원','hybrid-research-notes')],True)
 recipes=acquisition.all_recipe_data()
 for rid,r in recipes.items():
  first=acquisition_by_species[rid]['first'];repeat=acquisition_by_species[rid]['repeat']
  blocks=[p('등급 '+RARITY[r['rarity']]+' · 최소 '+QUALITY[r['quality']]+' 재료'),p('해금 '+gate_text(first)),p('실제 보유 부모 '+' + '.join(species[v]['nameKo'] for v in r['parents'])),table(['항목','기본값'],[[MATERIAL[k],r[k]] for k in MATERIAL if r.get(k)]+[['골드',f'{r["gold"]:,}'],['합성 시간',duration(r['seconds'])]],[1,3]),p('최초 '+route_info(first)['claim_rule']+' / 반복 '+route_info(repeat)['claim_rule']),p('부모는 성공과 실패 모두 보존하고 결과에 알 부화시간을 다시 붙이지 않는다. 비용은 한 번의 기본 시도이며 일반 효율과 실패 반환/안정제는 정본을 따른다.'),source('원천 DNA 공개/후속/변종 레시피 · dinosaur-acquisition 전체 경로')]
  if rid=='stegoceratops':
   blocks.insert(1,p('첫 전시를 마치면 같은 레시피를 반복한다. 성향별 능력치 분포를 확인하고 새 개체를 전시 중인 공룡과 비교할 수 있다.'))
   blocks.insert(-1,{'type':'nav','text':'반복 합성과 개체 능력치','target':repeat_traits_anchor})
  b.add('recipe-'+rid,'합성',r['name']+' 합성 레시피',blocks,[r['name']+' 레시피'],toc=True)
 # Compact species catalogue; direct revenue, legacy tile-space and passive
 # synthesis probability buffs are deliberately not promoted into current rules.
 acquisition_path='docs/current/dinosaur-acquisition.md'
 b.add('acquisition-rules','공룡 도감','공룡 획득과 최초 반복의 기준',
       narrative(acquisition_path,skip_intro=True),['공룡 획득과 전시'],True)
 acquisition_blocks=[
  p('기본 도감 83종의 최초와 반복 경로를 비교한다. 자연종 68종은 지정 알을 회수해 부화하고, 지정 합성 15종은 실제 부모와 연구 재료로 새 개체를 만든다. 비용과 시간은 한 번의 기본값이다. 관문 연구나 시설 건설 비용은 해당 장에서 확인한다.'),
  {'type':'nav','text':'실험 합성으로 새 계통 얻기','target':'experimental-hybrids'},
 ]
 for origin,grades in [('natural',list(RARITY)),('variant',['epic']),('hybrid',['epic','legendary'])]:
  for rarity in grades:
   group=[v for v in acquisition_rows if v['origin']==origin and v['rarity']==rarity]
   if not group:continue
   acquisition_blocks.append({**h({'natural':'자연종','variant':'변종','hybrid':'하이브리드'}[origin]+' · '+RARITY[rarity]),'anchor':f'acquisition-{origin}-{rarity}'})
   rows=[]
   for v in group:
    f=route_info(v['first']);r=route_info(v['repeat'])
    if origin=='natural':rows.append([v['name'],f['method']+' / '+f['gate'],f['cost']+' / '+f['time'],r['method']+' / '+r['gate'],r['cost']+' / '+r['time']])
    else:rows.append([v['name'],f['gate']+' / '+f['parents_materials'].split(' / ')[0],f['parents_materials'].split(' / ',1)[-1]+' / '+f['cost']+' / '+f['time'],f['claim_rule']+' / 반복 '+r['claim_rule']])
   headers=['공룡','최초 획득·해금','최초 비용·시간','반복 획득·해금','반복 비용·시간'] if origin=='natural' else ['공룡','해금·실제 부모','기본 재료·비용·시간','성공·재획득']
   weights=[1.2,2,1.2,2,1.2] if origin=='natural' else [1.2,2,2.3,1.3]
   acquisition_blocks.append({**table(headers,rows,weights),'acquisition_species_ids':[v['species_id'] for v in group]})
 acquisition_blocks.append(source('원천 dinosaur-acquisition·DNA·밸런스·스토리 / 읽기용83종 획득표와 같은 모델·표시 규칙'))
 b.add('acquisition-table','공룡 도감','공룡83종 전체 획득표',acquisition_blocks,['전체 획득표','공룡 획득표','83종 획득','최초 획득','반복 획득'],True)
 eggs=acquisition.egg_targets();used_by=defaultdict(list)
 for rid,r in recipes.items():
  for parent in r['parents']:used_by[parent].append(r['name'])
 ids=list(species)
 for i in range(0,len(ids),2):
  blocks=[];terms=[]
  for sid in ids[i:i+2]:
   startblock=len(blocks)
   d=species[sid];house=model.HOUSES[sid];origin=d.get('origin') or ('hybrid' if d.get('category')=='hybrid' else 'natural')
   blocks += [{**h(d['nameKo']),'anchor':'dino-'+sid},p(RARITY[d['rarity']]+' · '+{'natural':'자연종','variant':'변종','hybrid':'하이브리드'}.get(origin,origin)+' · '+{'small':'소형','medium':'중형','large':'대형','giant':'거대'}[house['size']])]
   if d.get('description'):blocks.append(p(d['description']))
   route=acquisition_by_species[sid]
   blocks += [{**p(label+' '+route_summary(route[key])),'acquisition_species_id':sid,'acquisition_route':key} for label,key in [('최초','first'),('반복','repeat')]]
   if sid in recipes:blocks.append({'type':'nav','text':'실제 부모·재료·성공률과 합성 레시피','target':'recipe-'+sid})
   habitats=json.loads(house['alternatives'])
   blocks.append(p('전시 '+' / '.join(FAC[v['facility']]+f' Lv.{v["min_level"]}' for v in habitats)+' · 위험'+house['security_points']+'점'+(' · '+research(house['giant_permission']) if house['giant_permission']!='-' else '')))
   if house['size']=='giant' and any(v['facility']=='aerial' for v in habitats):
    blocks.append({'type':'nav','text':'거대 익룡의 돔 공간 기준','target':'habitat-space-design'})
   if used_by[sid]:blocks.append(p('부모로 사용하는 합성 '+' / '.join(used_by[sid])))
   stats=d.get('stats',{})
   blocks.append(p('인기도 '+str(stats.get('popularity',d.get('popularity','-')))+' · 기준 유지비 '+str(stats.get('maintenanceCost',d.get('upkeep','-')))+'골드/시간'))
   for block in blocks[startblock:]:block['keep_group']='dino-profile-'+sid
   terms += [(v,'dino-'+sid) for v in [d['nameKo'],d.get('nameEn',d.get('name','')),sid]]
  blocks.append(source('종 정보 game-data / DNA 기획 / 전시 buildings83종 호환표'))
  b.add(f'dinosaurs-{i}','공룡 도감',f'공룡 도감 {i+1}부터{min(i+2,83)}',blocks,terms,toc=i==0)
 b.terms += [{'term':alias,'category':'공룡 도감','target':'dino-'+sid} for alias,sid in [('파라 룩스','parasaurolophus-lux'),('티라노','tyrannosaurus-rex'),('트리케라','triceratops'),('스테고','stegosaurus')] if sid in ids]
 social_part='시즌과 파크 교류'
 service_path='docs/current/production-and-services.md'
 b.add('season-events',social_part,'시즌과 이벤트',
       narrative(service_path,include=('4. 시즌 운영과 이벤트','5. 시즌 생물과 인물 제작 목표'),skip_intro=True),
       ['시즌','이벤트','시즌 패스','피날레'],True)
 social=narrative(service_path,include=('6. 친구 방문과 교류',),skip_intro=True)
 competition=next(i for i,block in enumerate(social) if block['type']=='h' and block['text']=='공룡 경기와 기록 경쟁')
 b.add('park-visits',social_part,'다른 파크를 방문하는 방법',social[:competition],['친구','방문','선물','랭킹'],True)
 b.add('dinosaur-competition',social_part,'공룡 경기와 기록 경쟁',
       social[competition+1:]+[{'type':'nav','text':'합성으로 얻는 개체 능력치','target':repeat_traits_anchor}],
       ['공룡 경기','달리기','친선 대결','기록 경쟁','공룡 올림픽'],True)
 for section,anchor_id,terms in (
  ('경매장과 야시장','auction-night-market',['경매장','야시장','밀거래 창고','특별전']),
  ('플레이어 거래','player-market',['플레이어 거래','유저 거래','장터']),
 ):
  market=narrative(direction_path,include=(section,),skip_intro=True)
  for block in market:
   if block['type']=='table':block['widths']=[1.1,2.5,2.4]
   if block['type']=='h' and block['text']=='야시장 연구자료 거래':
    block['anchor']='hybrid-research-market'
   if block['type']=='p' and block['text'].startswith('구매자는 원종'):
    block['text']=block['text'].removesuffix(' 실험 합성과 연구자료')
  if anchor_id=='player-market':
   market.append({'type':'nav','text':'원종 선택부터 실험 합성까지','target':'experimental-hybrids'})
   terms.append(('야시장 연구자료 거래','hybrid-research-market'))
  b.add(anchor_id,social_part,section,market[1:],terms,True)
 help_part='도움말'
 b.add('park-help',help_part,'파크 운영이 막힐 때',[
  p('관람객이 오지 않으면 파크 개장과 금고 상태를 확인하고, 입구에서 전시까지 길이 닿는지 살핀다. 손님이 더 오고 싶어 한다면 입장 진단에서 전시 구역 수용량과 입구 처리량 중 어느 쪽을 넓힐지 확인한다. 한 전시에 손님이 몰리면 관람대를 강화해 혼잡을 줄인다.'),
  p('골드와 사료가 부족하면 먼저 생산시설의 수령 가능 사료와 파크 운영의 예상 순수입을 확인한다. 복구 개장이 표시되면 기본 입구와 안전한 전시 한 곳으로 사료 구입비를 벌 수 있다. 사료를 마련해 급식하고, 관람길과 전시 상태를 확인한 뒤 일반 운영으로 돌아간다.'),
  {'type':'nav','text':'입장료와 전시 구역 수용량','target':'economy'},
  {'type':'nav','text':'빈 금고와 사료에 대비하는 운영 예시','target':'operation-balance'},
 ],['복구 개장','사료 부족','관람객이 오지 않음'],True)
 b.add('activity-help',help_part,'완료한 작업과 받지 않은 보상',[
  p('시간이 지났는데 알·재료·공룡이 보이지 않으면 부화장, 합성, 탐험 결과, 생산시설에서 받을 항목이 남아 있는지 확인한다. 창고가 가득 찼다면 자재를 사용하거나 저장 한도를 늘린 뒤 완료 물량을 수령한다. 멈춘 원정은 탐험 목록에서 이어갈 수 있다.'),
  p('잠긴 공룡은 도감의 획득 방법과 서식지를 함께 본다. 원종이 필요하면 원종 알 목표를 찾고, 합성 재료가 부족하면 재료의 장소와 품질을 확인한다.'),
  {'type':'nav','text':'자원별 획득과 생산','target':'resources'},
  {'type':'nav','text':'83종의 획득 방법과 비용','target':'acquisition-table'},
 ],['수령','완료 보상','보관함','막힌 원정'],True)
 assert len({x['id'] for x in b.pages})==len(b.pages)
 return b,{'species':len(species),'runtime_species':len(actual),'figures':50,'characters':len(chars),'story_sections':len(story['sections']),'current_story_scenes':18,
           'figure_levels':sum(len(f['levels']) for f in figures['figures']),'research_nodes':69,'research_levels':239,'major_buildings':25,'building_levels':625,'material_missions':46,'egg_targets':len(eggs),'repeat_egg_targets':len(acquisition.repeat_egg_targets()),'acquisition_species':len(acquisition_rows),'recipes':len(recipes),'progression_levels':len(growth_levels),'progression_goals':len(growth_goals),'progression_new_xp':growth_summary['new_goal_xp'],'catalogue_provenance':provenance}
