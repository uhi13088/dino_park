"""Guidebook reading model. Domain facts are read from their existing owners."""
from __future__ import annotations
import json, math, re, sys, hashlib
from pathlib import Path
from collections import defaultdict
from PIL import ImageFont
TABLE_METRIC_FONT=ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc',95)
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/models'))
import followup_content_model_v06 as model
import dinosaur_acquisition_model_v06 as acquisition
import park_progression_model_v06 as progression
from render_dinosaur_acquisition_v06 import route_info,route_summary,gate_text
from render_followup_content_v06 import FAC,AREA,RARITY,QUALITY,MATERIAL,duration,research

VERSION=re.search(r'(\d+\.\d+)',(ROOT/'docs/current/game-design.md').read_text().splitlines()[0]).group(1)
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
  text=re.sub(r'^## 6\..*?(?=^## 7\.)','',text,flags=re.M|re.S)
  text=re.sub(r'^## 7\.', '## 6.',text,flags=re.M)
 if str(path)=='docs/current/buildings.md':
  text=re.sub(r'^## 7\..*?(?=^## 8\.)','',text,flags=re.M|re.S)
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
 '기존 explorationEnergy와 회복 시각을':'자동 회복, 구매, 연료 생산품 수령으로 같은 탱크를 채운다. 연료는 출발할 때 사용하며, 보급소에서 완성한 물량은 수령한 뒤 탱크에 들어온다.',
 '보급소 철거·이관으로 최대치가':'보급소를 철거해 탱크 한도가 줄어도 보유한 연료로 출발할 수 있다. 연료가 한도 아래로 내려가면 회복·구매·수령이 재개된다.',
 '초반 자재 수량·시설 가격·해금·공급 속도와':'건설에 필요한 자재는 시설마다 다르다. 공사 화면에서 목재·석재·금속 중 필요한 자재와 수량을 확인한다.',
 '첫 기술은 기본1분이고 후기 지정 기술은':'첫 기술은 기본 1분이다. 후기 지정 기술은 할인을 적용해도 한 단계에 최소 7일이 걸리며, 이미 시작한 작업의 시간은 그대로 이어진다.',
 '급식 한 번은 사료 한 단위를':'공룡에게 먹이를 줄 때 공용 사료 한 개를 쓴다. 먹이가 필요한 공룡을 골라 급식한다.',
 '첫 합성 경과4~6시간은':None,
 '다음 예외는 현재 구현/기존 초반 계획을':'첫 관람대와 초기 시설에는 아래 비용과 시간이 적용된다.',
 '정산은 서버의 같은 park/currency 잠금 안에서':'금고를 강화하면 완공까지는 기존 한도로, 완공 뒤부터는 새 한도로 입장료가 쌓인다.',
 '역할 확정: 건설자는 건설/강화,':'건설자는 건설과 강화를 맡고, 연구원은 연구트리의 기술을 맡는다. DNA 합성에는 별도 작업 자리를 사용한다.',
 '건설자는 서버 완공 시각에 작업이 끝나면':'공사가 끝나거나 기술이 완료되면 담당자가 자동으로 복귀해 다음 일을 맡을 수 있다. 기술 연구가 진행되는 동안에도 부화와 합성을 따로 할 수 있다.',
 '검산 기준':'운영 예시를 읽는 방법',
 '입장료는 실제 수납분을 보고, 운영 순수입은':'운영 순수입은 받은 입장료에서 유지비를 뺀 금액이다. 아래 사례는 전시·돌봄·접속 일정이 달라지면 달라질 수 있다. 자재와 연료의 구매비는 실제로 작업할 때 확인한다.',
 '구현 검토안. 먼저 미수령 사료와':'미수령 사료와 남은 재고를 확인한다. 전시와 관람길이 연결돼 있어 입장료로 급식비를 마련할 수 있다면 개장을 유지한다.',
 '검증할 상태는 잔액 0에서':None,
 '첫 영웅까지의 시간은 초반 성장 속도를':None,
 '이 절은 토지·특수환경과 종별 사육을 연결하는 기획이다.':None,
 '실제 게임의 임시 에셋 목록은':None,
 '첫 전시의 건설·서식지 호환·관람 동선과 결과 수령 뒤 건설자 2명은':None,
 '5에서 푸드코트는 방문 수요,':'푸드코트는 방문 수요, 화장실은 관람 정원, 정보센터는 오프라인 운영을 개선한다. 각 시설의 강화표에서 구체적인 효과를 확인한다.',
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

def make_book():
 b=Book();story=editorial('story-people');figures=editorial('figures')
 species,actual,provenance=model.catalogue();costs=model.effect.cost.all_costs();cost_index={(r['id'],r['level']):r for r in costs}
 acquisition_rows=acquisition.acquisition_rows();acquisition_by_species={r['species_id']:r for r in acquisition_rows}
 acquisition_counts=acquisition.summary()
 b.add('read-first','이용 안내','가이드북 사용법',[
  p('파크를 열고 새 공룡을 맞이하세요. 이 책에서 첫 손님을 받는 방법부터 시설 강화, 탐험, DNA 합성, 다른 파크와의 경기와 거래까지 찾아볼 수 있습니다. 완성 게임의 전체 흐름을 담아 이용할 수 있는 메뉴는 플레이 버전에 따라 달라질 수 있습니다.'),
  p('Word 탐색 창의 제목을 누르면 해당 장이나 핵심 본문으로 이동한다. 2쪽 목차는 12장으로, 3쪽 빠른 찾기는 성장표·강화표·레시피처럼 자주 확인하는 항목으로 연결된다. 공룡·인물·연구·건물 이름은 뒤쪽 색인에서 찾는다. 각 쪽 아래의 목차와 색인 링크로 돌아갈 수 있다.'),
  table(['찾는 내용','이 책에 있는 항목'],[['공룡','83종의 최초·반복 획득 경로'],['위인과 인물','위인 50명의 레벨별 능력과 이야기 속 인물'],['건물','주요 시설 26종의 25레벨 강화표'],['연구','운영·사육·탐험·유전 4계열과 72개 항목'],['파크 성장','파크 Lv.5~50의 네 분야 성장 목표와 본편 연결'],['탐험과 합성',f'46개 재료 목표와 자연종 알 목표, {acquisition_counts["recipes"]}개 합성 레시피']],[1,4])],terms=['사용법','찾아보기'],toc=True)
 game_sections=('2. 핵심 루프','4. 공간과 파크 운영','5. 첫 10분','6. 첫 합성까지의 진행')
 b.add('game-design','게임의 시작과 운영','게임의 전체 흐름',narrative('docs/current/game-design.md',include=game_sections,skip_intro=True),['개장','파크 운영','첫 10분'],True)
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
 direction_blocks.insert(growth_intro+1,{'type':'nav','text':'첫 전시 뒤 파크 Lv.6까지','target':'park-growth-walkthrough'})
 b.add('production-direction','게임의 시작과 운영','시작 리더와 재건 목표',
       direction_blocks,
       [*direction_headings.items(),('첫 스테고케라톱스 전시','first-exhibition-scope'),
        ('리더','starting-leaders'),('승리 조건','reconstruction-goals')],True)
 progression_path='docs/current/park-progression.md'
 growth_walkthrough='첫 전시 뒤 파크 Lv.6까지'
 walkthrough=narrative(progression_path,include=(growth_walkthrough,),skip_intro=True)
 assert walkthrough and walkthrough[0]['type']=='h','First exhibition growth guide is missing'
 for block in walkthrough:
  if block['type']=='table':
   block['widths']=[1.1,5]
   block['keep_table']=True
 b.add('park-growth-walkthrough','게임의 시작과 운영',growth_walkthrough,
       [*walkthrough[1:],{'type':'nav','text':'입장 수속 연구의 단계별 효과와 비용','target':'research-ops-entry'},
        {'type':'nav','text':'육상 원정 조작과 보상 수령','target':'expedition-play'},
        {'type':'nav','text':'파크의 전체 성장 목표표','target':'park-progression-overview'}],
       ['성장 목표','첫 전시 뒤 성장','897 XP','파크 Lv.6 도달','기초 촉매 회수'],True)
 b.add('park-progression-rules','게임의 시작과 운영','첫 합성 이후 성장과 경험치 기준',
       narrative(progression_path,exclude=(growth_walkthrough,'7. 정적 검증과 구현 경계'),skip_intro=True),['파크 성장','경험치'],True)
 growth_levels=progression.level_rows();growth_goals=progression.goal_rows();growth_summary=progression.summary()
 b.add('park-progression-overview','게임의 시작과 운영','Park5부터50 성장과 경험치 공급표',[
  p('첫 지정 영웅 이후 45번의 레벨 전환과 180개 성장 목표를 담은 전체 표다. 각 레벨의 시설·연구·현장·운영 목표는 병행하며, 선택 가능한 대안은 하나를 완료하면 된다. 현재 플레이할 경로는 첫 전시 뒤 파크 Lv.6 안내에서 확인한다.'),
  p(f'초반 다섯 목표의 {growth_summary["early_goal_xp"]:,}XP로 파크 Lv.5에 도달하고 {growth_summary["park5_carry_xp"]}XP가 남는다. 이후 성장 목표에서 {growth_summary["new_goal_xp"]:,}XP를 받아 파크 Lv.50에 필요한 누적 {growth_summary["cumulative_to_park50"]:,}XP를 채울 수 있다.'),
  h('성장 구간의 방향'),table(['권장 구간','성장 방향','함께 읽을 본편'],[[f'{m["park_from"]}~{m["park_to"]}',m['label']+' / '+m['focus'],{'responsibility':'4장 심연의 비밀','crisis':'5장 폭풍 전야','conclusion':'6장과 선택한 에필로그'}.get(m['id'],'운영과 수집')] for m in progression.milestones()],[1,3.6,1.6]),
  h('레벨별 필요량과 목표 공급'),table(['현재→다음','전환 필요XP','새 목표 보상합','다음 레벨 누적기준','권장 연구소 준비'],[[f'{r["park_level"]}→{r["next_park_level"]}',f'{progression.experience(r["park_level"]):,}',f'{r["new_xp"]:,}',f'{r["cumulative_park_xp"]:,}',r['recommended_lab']] for r in growth_levels],[1.1,1.2,1.2,1.7,1.2]),
  p('Lv.5의 목표 보상과 남아 있던 35XP를 합치면 Lv.6에 도달한다. 권장 연구소 레벨은 다음 기술을 준비할 때 참고한다. 토지·시설·기술은 각각의 조건을 갖춰 열고, 개별 비용과 시간이 든다.'),
  source('원천 park-progression / 기존 shared Park XP곡선과 밸런스 초반5목표')],['파크 성장표','성장 경험치','중후반 성장','레벨별 경험치','Park50','Park XP','일회성 목표'],True)
 for r in growth_levels:
  level=r['park_level'];goals=[g for g in growth_goals if g['park_level']==level]
  blocks=[p(f'현재 Park{level} → Park{r["next_park_level"]} · 필요XP {progression.experience(level):,} · 새 목표 합 {r["new_xp"]:,}'),
          p(f'연구소 Lv.{r["recommended_lab"]}를 준비하는 권장 구간이다. 건물/연구소 레벨과 Park레벨은 별개이며 먼저 정상 완료한 조건도 인정한다. 완료 조건 안의 ‘또는’은 대안 중 하나를 뜻한다.'),
          {**table(['성장 목표','완료 조건','Park XP'],[[g['track_label'],progression.goal_label(g),f'{g["xp"]:,}'] for g in goals],[1.1,5.2,.9]),'progression_goal_ids':[g['id'] for g in goals]},
          p(f'네 목표의 보상을 모두 받으면 누적 {r["cumulative_park_xp"]:,}XP에 도달한다. 각 목표는 한 번씩 수령하고, 원정 보상과 부화·합성 완료 개체는 해당 화면에서 따로 받는다.')]
  if level==5:
   blocks.insert(1,{'type':'nav','text':'현재 플레이할 수 있는 Lv.5→6 경로','target':'park-growth-walkthrough'})
  for ref in r['story_refs']:
   chapter_targets={f'chapter-{n}':f'story-story-chapter-{n}' for n in range(4,7)}|{'epilogue':'story-story-epilogue'}
   target=chapter_targets.get(ref,('story-current-' if re.match(r'(prologue|ch[123])-scene-',ref) else 'story-entry-story-')+ref)
   blocks.append({'type':'nav','text':'함께 진행할 본편 '+ref,'target':target})
  if level<49:blocks.append({'type':'nav','text':f'다음 Park{level+1} 성장목표','target':'park-level-'+str(level+1)})
  else:blocks.append(p('Park50 이후에도 시설·연구·탐험·수집을 이어간다. 전체72기술 최대·83종 전수집·15레시피 완성을 이 레벨업의 필수로 요구하지 않는다.'))
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
  if block['type']=='table' and block['headers'][-1]=='현재 코드 상태':
   block['headers'].pop()
   block['widths'].pop()
   for row in block['rows']:row.pop()
 b.add('resources','자원과 재료','자원 생산과 사용처',resources,['자원 생산과 사용처','재료함'],True)
 balance_path='docs/current/balance.md'
 balance_sections=('2. 공통 운영 값','3. 최초 건설과 도입','4. 강화 비용과 시간 계산','5. 건물별 성능',
                   '6. 생산 단가와 연료','7. 입장료와 전체 금고 한도','10. 초반 목표 앵커',
                   '11. 연구 재료 승급 비용','12. 건설자와 연구원 고용','13. 기술 연구 비용과 시간','15. 최종 연구시간·할인·도달 가능성')
 b.add('economy','경제와 정산','입장료 저장 한도와 비용 규칙',narrative(balance_path,include=balance_sections,skip_intro=True),['입장료와 저장 한도'],True)
 b.add('operation-balance','경제와 정산','첫 주와 장기 운영 예시',
       narrative('docs/current/operation-balance.md',exclude=('후속 플레이 검증',),skip_intro=True),
       ['첫 주 운영','첫 7일','운영 순수입','골드 고갈','복구 운영','중후반 수급'],True)
 param_rows=model.building.table('params')
 b.add('numeric-policies','경제와 정산','운영 기본값과 인력 고용',[
  p('표의 기본값에 완료한 기술과 해당 시설의 효과를 적용한다. 공사나 연구에 앞서 화면에서 이번 작업의 최종 비용과 시간을 확인한다.'),
  table(['기본값','값','의미'],[[r['id'],r['value'],r['설명']] for r in param_rows],[2,1,4]),
  h('인원별 한 번의 영구 고용'),table(['역할/총인원','필요 시설','골드','다이아','첫 영웅 후'],[[r['role']+' '+r['count'],r['building']+' '+r['level'],r['gold'],r['diamond'],r['first_hero']] for r in model.building.table('staff')],[1.5,1.5,1,1,1]),source('원천 balance 공통 값/인력 표')],['골드','다이아','입장료','금고','연료','고용','건설자','연구원'],True)
 buildings_path='docs/current/buildings.md'
 b.add('building-rules','건물과 부지','건물 운영과 호환 규칙',
       narrative(buildings_path,exclude=('1. 수치 원천과 현재 구현','7. 구현·이관과 보존 계약'),skip_intro=True),['건물 역할','부지','강화'],True)
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
   blocks.append(p('첫 영웅을 수령하고 파크 Lv.5에 도달하면 관람대를 Lv.3부터 강화할 수 있다. 기본 물자에서 금속을 개당 80골드로 구입한다. 관람대를 선택해 자재와 공사 시간을 확인한다. 공사 중에는 기존 외형과 정원으로 운영한다. Lv.5가 완공되면 같은 위치에서 넓은 청록색 지붕으로 바뀌고 관람대 정원이 100명이 된다. 예상 입장이 더 늘지 않으면 파크 운영 화면에서 입구 처리량도 확인한다.'))
   platform_art=ROOT/'apps/client/public/assets/buildings'
   blocks.append({'type':'image','paths':[str(platform_art/name) for name in ('viewing-platform.webp','viewing-platform-lv5.webp')],
                  'width':60,'height':150,'caption':'왼쪽은 Lv.1~4 관람대, 오른쪽은 Lv.5 관람대다.'})
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
  for row in levels:
   text=(row['effect']+' '+str(row['value']) if node_id in model.effect.BASE else row['effect'])
   for english,ko in MATERIAL.items():text=re.sub(r'\b'+english+r'\b',ko,text)
   text=re.sub(r'([가-힣 ]+)% (-?[0-9.]+)',r'\1 \2%',text)
   extra=[species[v['species']]['nameKo'] for v in acquisition.marked('extra-natural-targets') if v['required_research']==f'{node_id}:{row["level"]}']
   if extra:text+=' / 함께 여는 비육상 알 목표: '+' · '.join(extra)+' (직접 미션·부화, 전시 허가 별도)'
   effects.append([row['level'],text])
  parents='없음' if node['선행']=='-' else ' / '.join(research(v.strip()) for v in node['선행'].split(','))
  blocks=[p(node['계열']+' · '+node['분야']+f' · 최대 Lv.{node["max"]}'),p('목적 '+clean(node['목적'])),p('선행 '+parents+' · 연구소 단계 '+node['연구소단계']+(' · 첫 영웅 이후' if node['첫영웅후']=='1' else '')),
          h('레벨별 총효과'),table(['Lv','효과와 해금'],effects,[.5,6.5]),h('해당 레벨 한 번의 연구비')]
  rr=[]
  for level in range(1,int(node['max'])+1):
   r=cost_index[node_id,level];rr.append([level,f'{r["gold"]:,}',f'{r["wood"]}/{r["stone"]}/{r["metal"]}',duration(r['seconds']),duration(r['min_seconds']) if r['min_seconds'] else '별도 없음'])
  blocks += [table(['Lv','골드','목재/석재/금속','기본 시간','최종 하한'],rr,[.5,1,1.4,1.7,1.4]),p('완료한 단계의 효과를 적용한다. 화면에서 이미 완료한 할인까지 반영한 이번 연구 비용과 시간을 확인한다.')]
  for block in blocks:
   if block['type']=='table':block['variant']='research'
  b.add('research-'+node_id,'연구','연구 '+node['항목'],blocks,[node['항목'],node_id])
 expedition_path='docs/current/exploration-play.md'
 expedition=narrative(expedition_path,exclude=('6. 진행과 보존','7. 검증과 남은 구현'),skip_intro=True)
 for block in expedition:
  if block['type']=='h' and block['text']=='반복 원정과 더 먼 구간':block['anchor']='deep-expedition'
 b.add('expedition-play','탐험','육상 차량과 해상 보트 탐험',expedition,
       ['주행 탐험','육상 차량','해상 보트',('반복 원정','deep-expedition'),('심층 주행','deep-expedition'),('경험치 아이템','deep-expedition')],True)
 missions=model.material_missions()
 for area,name in AREA.items():
  rr=[]
  for r in missions.values():
   if r['area_id']!=area:continue
   rew=r['reward'];rr.append([r.get('name','기초 반복'),research(r['research']),f'{QUALITY[rew["quality"]]} {MATERIAL[rew["material"]]} {rew["quantity"]}',r['gold'],'10→5' if r['fuel']==10 else r['fuel'],r['checks']])
  b.add('expedition-'+area,'탐험',name+' 재료 목표',[p('목표를 고를 때 필요한 연구, 준비비와 연료, 기본 보상을 확인한다.'),table(['미션','필요 연구','기본 보상','골드','연료'],[row[:5] for row in rr],[1.4,1.7,1.7,.6,.5])],[name],True)
 eggrows=[]
 for r in acquisition.egg_targets().values():
  label=species[r['species']]['nameKo']+(' (최초)' if r.get('starter_first') else '')
  eggrows.append([label,acquisition.research_label(r['research']),AREA[r['area']],f'{r["gold"]:,} / {r["fuel"]}',duration(r['hatch_seconds'])])
 b.add('egg-targets','탐험','원종과 재입수 알 목표',[p('자연종 68종의 반복 알 목표와 첫 벨로시랩터 목표가 있다. 이구아노돈·트리케라톱스·스테고사우루스의 최초 획득 조건은 첫 원정에서 확인한다. 목표를 완주하면 지정 알 한 개를 받고, 부화한 개체를 수령하면 도감에 등록된다.'),table(['종','기본 권한','장소','골드 / 연료','부화'],eggrows,[1.3,2,1.2,1,1]),{'type':'nav','text':'최초 비용과 반복 비용을 비교하는 83종 전체 획득표','target':'acquisition-table'}],['원종 목표','알','재입수','방생'],True)
 synthesis_path='docs/current/dna-and-collection.md'
 synthesis_blocks=narrative(synthesis_path,exclude=('9. 데이터와 구현 범위',),skip_intro=True)
 repeat_traits_anchor='repeat-synthesis-traits'
 for block in synthesis_blocks:
  if block['type']=='h' and block['text']=='반복 합성과 개체 능력치':
   block['anchor']=repeat_traits_anchor
  if block['type']=='h' and block['text']=='새로운 변종과 하이브리드 찾기':
   block['anchor']='collect-new-hybrids'
  if block['type']=='table' and block['headers'][0]=='성향':
   block['keep_table']=True
 synthesis_blocks.append({'type':'nav','text':'내 공룡을 다른 파크의 공룡과 비교하는 경기','target':'dinosaur-competition'})
 b.add('synthesis-rules','합성','DNA 합성과 실패 보호',synthesis_blocks+[source('원천 '+synthesis_path)],
       ['DNA 합성과 실패 보호',('반복 합성',repeat_traits_anchor),('개체 능력치',repeat_traits_anchor),
        ('매력도',repeat_traits_anchor),('대표 전시',repeat_traits_anchor),
        ('새로운 변종','collect-new-hybrids'),('새로운 하이브리드','collect-new-hybrids')],True)
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
 acquisition_blocks=[p('83종의 최초와 반복 경로를 비교한다. 자연종68은 지정 알 회수·부화, 합성15종은 실제 부모와 연구 재료로 새 개체를 만든다. 비용과 시간은 한 번의 기본값이며 관문 연구·시설 건설에 쓰는 비용은 해당 장에서 확인한다. 합성 재료는 개별 레시피로도 바로 찾을 수 있다.')]
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
   blocks.append(p('전시 '+' / '.join(FAC[v['facility']]+f' Lv.{v["min_level"]}' for v in json.loads(house['alternatives']))+' · 위험'+house['security_points']+'점'+(' · '+research(house['giant_permission']) if house['giant_permission']!='-' else '')))
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
  b.add(anchor_id,social_part,section,market[1:],terms,True)
 help_part='도움말'
 b.add('park-help',help_part,'파크 운영이 막힐 때',[
  p('관람객이 오지 않으면 파크 개장 상태, 입구에서 관람대까지의 길, 관람 가능한 공룡, 공룡의 건강 상태를 확인한다. 관람 수요는 있는데 입장이 더 늘지 않으면 관람 정원과 입구 처리량을 비교한다.'),
  p('골드와 사료가 부족하면 먼저 생산시설의 수령 가능 사료와 파크 운영의 예상 순수입을 확인한다. 복구 개장이 표시되면 기본 입구와 안전한 전시 한 곳으로 사료 구입비를 벌 수 있다. 사료를 마련해 급식하고, 관람길과 전시 상태를 확인한 뒤 일반 운영으로 돌아간다.'),
  {'type':'nav','text':'입장료와 정원 확인','target':'economy'},
  {'type':'nav','text':'빈 금고와 사료에 대비하는 운영 예시','target':'operation-balance'},
 ],['복구 개장','사료 부족','관람객이 오지 않음'],True)
 b.add('activity-help',help_part,'완료한 작업과 받지 않은 보상',[
  p('시간이 지났는데 알·재료·공룡이 보이지 않으면 부화장, 합성, 탐험 결과, 생산시설에서 받을 항목이 남아 있는지 확인한다. 창고가 가득 찼다면 자재를 사용하거나 저장 한도를 늘린 뒤 완료 물량을 수령한다. 멈춘 원정은 탐험 목록에서 이어갈 수 있다.'),
  p('잠긴 공룡은 도감의 획득 방법과 서식지를 함께 본다. 원종이 필요하면 원종 알 목표를 찾고, 합성 재료가 부족하면 재료의 장소와 품질을 확인한다.'),
  {'type':'nav','text':'자원별 획득과 생산','target':'resources'},
  {'type':'nav','text':'83종의 획득 방법과 비용','target':'acquisition-table'},
 ],['수령','완료 보상','보관함','막힌 원정'],True)
 assert len({x['id'] for x in b.pages})==len(b.pages)
 return b,{'species':83,'runtime_species':81,'figures':50,'characters':len(chars),'story_sections':len(story['sections']),'current_story_scenes':18,
           'figure_levels':sum(len(f['levels']) for f in figures['figures']),'research_nodes':72,'research_levels':252,'major_buildings':26,'building_levels':650,'material_missions':46,'egg_targets':len(eggs),'repeat_egg_targets':len(acquisition.repeat_egg_targets()),'acquisition_species':len(acquisition_rows),'recipes':len(recipes),'progression_levels':len(growth_levels),'progression_goals':len(growth_goals),'progression_new_xp':growth_summary['new_goal_xp'],'catalogue_provenance':provenance}
