"""Reader-facing chapter structure, separate from the complete name index."""
from __future__ import annotations
import hashlib,re
import content as c


def heading(book,article,phrase):
 matches=[]
 for page in book.pages:
  if page['id']!=article and not page['id'].startswith(article+'-cont-'):continue
  for b in page.get('blocks',[]):
   if b['type']=='h' and phrase in re.sub(r'\s+',' ',b['text']):matches.append((page,b))
 assert len(matches)==1,(article,phrase,len(matches))
 page,b=matches[0]
 target=b.get('anchor') or 'topic-'+hashlib.sha256((article+phrase).encode()).hexdigest()[:22]
 b['anchor']=target;book.entry_positions[target]=page['id']
 return target


def row(label,target):return {'type':'nav','text':label,'target':target}
def grid(items,columns=3):return {'type':'nav-grid','items':items,'columns':columns}
def section(label,items,columns=3):
 blocks=[c.h(label),grid(items,columns)]
 for b in blocks:b['keep_group']='directory-'+label
 return blocks


def organize(book):
 """Insert chapter directories and return the 12 semantic TOC records."""
 body=list(book.pages)
 def H(article,phrase):return heading(book,article,phrase)
 profiles={}
 for page in body:
  if page['id'].startswith(('people-','figures-','dinosaurs-')) and '-cont-' not in page['id']:
   names=[b['text'] for b in page['blocks'] if b.get('anchor','').startswith(('character-','figure-','dino-'))]
   if names:
    names=[re.sub(r' [gG][fF] \d+$','',n) for n in names]
    page['title']=(names[0]+f' 등 {len(names)}종') if page['id'].startswith('dinosaurs-') else ' 및 '.join(names)
  for i,b in enumerate(page.get('blocks',[])):
   a=b.get('anchor','')
   if a.startswith(('dino-','figure-','character-')):
    profiles[a]=(b['text'],page['blocks'][i+1]['text'])

 resource_quality=H('resources','품질 공룡 등급 시설 레벨')
 quality=H('synthesis-rules','품질과 승급')
 grades=H('synthesis-rules','공룡 도감과 등급')
 parents=H('synthesis-rules','실제 보유 조건')
 protection=H('synthesis-rules','결과 등급별 실패와 보호')
 admission=H('economy','입장료와 전체 금고 한도')
 staff=H('economy','건설자와 연구원 고용')
 rules=H('building-rules','파크 레벨 건물 레벨 강화 조작')
 land=H('building-rules','토지의 유료 확장과 입구 미리보기')
 housing=H('building-rules','호환 판정 격리 거대종')
 firstplay=H('game-design','첫 10분')
 firstsynth=H('game-design','첫 합성까지의 진행')
 chapters=[]
 def add(number,title,parts,intro,topics,blocks):
  cid=f'chapter-{number:02}';start=len(book.pages)
  book.add(cid,'장 안내',f'{number:02} {title}',[c.p(intro),*blocks],toc=False)
  directory=book.pages[start:]
  for p in directory:p.update(chapter=cid,chapter_title=title,chapter_number=number,chapter_open=p['id']==cid)
  chapters.append({'id':cid,'number':number,'title':title,'parts':parts,'topics':topics,'directory':directory})

 add(1,'게임의 시작과 운영',('게임의 시작과 운영',),
     '시작 리더를 골라 파크를 열고 첫 영웅을 전시합니다. 이어 성장 목표에서 경험치를 받아 파크 Lv.6에 도달하는 방법을 안내합니다.',
     [('게임 개요와 첫 플레이','game-design'),('시작 리더와 재건 목표','production-direction'),('첫 전시 뒤 파크 Lv.6까지','park-growth-walkthrough')],
     [row('게임 개요와 핵심 루프','game-design'),row('첫 10분의 조작과 목표',firstplay),row('첫 합성까지 공룡과 시설의 성장',firstsynth),
      grid([('첫 개장과 첫 전시','first-exhibition-scope'),('시작 리더','starting-leaders'),('재건 목표','reconstruction-goals')],3),
      row('첫 전시 뒤 파크 Lv.6까지','park-growth-walkthrough'),row('첫 합성 이후 성장과 경험치 공급','park-progression-overview'),row('성장목표 완료·수령과 경험치 기준','park-progression-rules'),c.h('레벨 구간별 성장목표'),grid([(f'Park{start}부터{min(start+4,49)}','park-level-'+str(start)) for start in range(5,50,5)],3),
      c.h('함께 읽을 장'),row('실제 대사와 장면별 목표','chapter-02'),row('첫 합성의 재료와 성공 규칙','chapter-09')])

 story_items=[('세계관과 과거 사건','story-story-world'),('최신 초반 대본의 기준','story-current-section-0'),('프롤로그','story-current-section-3'),('1장 새로운 시작','story-current-section-4'),('원종 확보와 시설 준비','story-current-section-5'),('2장 포식자의 귀환','story-current-section-6'),('연구 재료와 지하 연구소 준비','story-current-section-7'),('3장 금지된 실험','story-current-section-8'),('4장부터 에필로그의 실제 플레이 조건','story-current-section-11'),('4장 심연의 비밀','story-story-chapter-4'),('5장 폭풍 전야','story-story-chapter-5'),('6장 인도미누스','story-story-chapter-6'),('에필로그와 세 결말','story-story-epilogue'),('사이드 스토리','story-story-side-overview'),('선택과 인물 관계','story-story-choice-systems'),('4시즌 확장 이야기','story-story-season-legacy'),('시즌1 창립자의 귀환','story-story-season-runtime'),('스토리 진행 조건과 남은 결정','story-story-conflicts')]
 add(2,'세계관과 스토리',('스토리와 세계관',),
     '재건의 이유와 과거 사건, 장면별 이야기를 찾습니다. 후반 장과 에필로그에는 결말이 담겨 있으니 현재 진행한 장까지 읽어도 됩니다.',
     [('세계관과 본편 줄거리','story-story-world'),('프롤로그부터 3장까지 최신 대본','story-current-section-0'),('후반 이야기와 엔딩','story-story-chapter-4')],
     [*section('이야기 순서와 대본',story_items,2),row('첫 스테고케라톱스 탄생 장면','story-current-ch3-scene-6')])

 people=[(name,a) for a,(name,_) in profiles.items() if a.startswith('character-')]
 figure_cats={}
 for a,(name,description) in profiles.items():
  if a.startswith('figure-'):
   cat=description.split(' · ')[1];figure_cats.setdefault(cat,[]).append((re.sub(r' gf \d+$','',name),a))
 add(3,'등장인물과 위인',('등장인물','위인'),
     '이야기 속 인물의 관계와 위인의 수록 정보를 구분해서 봅니다. 기술 연구원·건설자의 고용 규칙은 경제와 인력 장에서 확인합니다.',
     [('등장인물의 역할과 관계','nav-characters'),('위인 분류별 도감','nav-figures'),('GP 영입과 레벨별 성장','figure-rules')],
     [{**c.h('등장인물별 프로필'),'anchor':'nav-characters'},grid(people,3),{**c.h('위인 분류별 프로필'),'anchor':'nav-figures'},*[b for cat,items in figure_cats.items() for b in section(cat,items,3)],
      row('위인의 역할과 수록 범위','figures-overview'),row('GP 영입과 레벨별 성장','figure-rules'),row('보유·배정 효과와 중첩 상한','figure-caps'),row('관계와 분류 시너지','figure-synergies'),row('위인의 대화와 배정','figure-policy'),row('건설자와 기술 연구원 고용',staff)])

 add(4,'자원과 재료',('자원과 재료',),
     '무엇을 어디에서 얻고 어디에 쓰는지 확인합니다. 일반 운영 자원과 연구 재료를 나누고, 품질과 승급 규칙으로 바로 이동할 수 있습니다.',
     [('자원별 획득과 사용처','resources'),('연구 재료와 품질',resource_quality),('생산과 저장 및 돌봄',H('resources','생산 시설과 생산 규칙'))],
     [row('전체 자원 목록과 사용처',H('resources','기본 자원 목록과 사용처')),row('골드와 다이아 및 탐험 연료',H('resources','골드 다이아 GP 탐험 연료')),row('연구 재료의 품질',resource_quality),row('재료 승급의 규칙',quality),row('재료 승급의 골드 비용',H('economy','연구 재료 승급 비용')),row('시설 생산과 수령',H('resources','생산 시설과 생산 규칙')),row('공룡 돌봄과 운영 비용',H('resources','공룡 돌봄과 운영 비용')),row('저장 한도와 재료함',H('resources','저장과 사용자에게 보여줄 정보'))])

 add(5,'경제와 인력',('경제와 정산',),
     '입장료·금고·유지비를 확인하고 첫 7일과 성장 시점별 수급을 비교합니다. 직원의 고용 조건은 이 장에서, 연구 배정 방식은 연구트리 장에서 확인합니다.',
     [('입장료와 금고 및 오프라인',admission),('건설자와 연구원 고용',staff),('첫 주와 장기 운영 예시','operation-balance')],
     [row('입장료 정산과 전체 금고 한도',admission),row('첫 주와 장기 운영 예시','operation-balance'),row('공통 운영 수치와 오프라인 기준','numeric-policies'),row('건설자와 연구원의 고용 조건 및 가격',staff),row('초반 목표와 경험치',H('economy','초반 목표 앵커')),row('건설과 강화의 비용 및 시간',H('economy','강화 비용과 시간 계산')),row('생산 단가와 탐험 연료',H('economy','생산 단가와 연료')),row('기술 연구의 비용과 시간',H('economy','기술 연구 비용과 시간'))])

 facilities=[(p['title'],p['id']) for p in body if p['id'].startswith('building-') and p['id']!='building-rules' and '-cont-' not in p['id']]
 habitats=[x for x in facilities if any(v in x[0] for v in ['서식지','익룡 돔','해양관'])]
 others=[x for x in facilities if x not in habitats]
 add(6,'건물과 부지',('건물과 부지',),
     '역할과 배치 규칙을 읽거나 건물 이름을 골라 1~25레벨 비용·시간·효과 표로 이동합니다. 부지 확장과 종별 호환 조건도 아래에서 찾을 수 있습니다.',
     [('건물별 강화표 찾기','nav-facilities'),('건물 역할과 배치 규칙',rules),('부지 확장과 서식지 호환',land)],
     [row('건물 역할과 배치 및 강화 조작',rules),row('부지 확장과 입구 전환',land),row('공룡별 서식지 호환과 격리 조건',housing),{**c.h('건물별 1부터25레벨 강화표'),'anchor':'nav-facilities'},
      *section('서식지와 특수 환경',habitats,3),*section('관람과 생산 및 운영 시설',others,3)])

 research_groups=[]
 for key,name in [('ops','운영'),('care','사육'),('exp','탐험'),('gene','유전')]:
  items=[(p['title'].removeprefix('연구 '),p['id']) for p in body if p['id'].startswith('research-'+key+'-') and '-cont-' not in p['id']]
  blocks=[{**c.h(name+' 계열'),'anchor':'nav-research-'+key},row(name+' 연구트리 구조도','tree-'+key),grid(items,3)]
  for b in blocks:b['keep_group']='research-directory-'+key
  research_groups += blocks
 add(7,'연구트리',('연구',),
     '연구소 단계와 선행 조건을 먼저 확인한 뒤 계열을 고릅니다. 각 연구 이름을 누르면 레벨별 효과·해금·비용·시간을 함께 볼 수 있습니다.',
     [('계열별 연구트리와 상세표 찾기','nav-research-items'),('연구소와 선행 조건','research-rules')],
     [row('연구소와 선행 조건 및 연구원 배정','research-rules'),{**c.h('계열별 연구 찾기'),'anchor':'nav-research-items'},*research_groups])

 places=[(p['title'],p['id']) for p in body if p['id'].startswith('expedition-') and p['id']!='expedition-play' and '-cont-' not in p['id']]
 add(8,'탐험',('탐험',),
     '첫 초원 정찰 뒤 육상 주행에서 원종 알과 중급 재료를 모읍니다. 육상 차량과 해상 보트로 재료를 회수하고, 익숙한 장소에서 더 먼 구간에도 도전할 수 있습니다.',
     [('장소별 재료 목표 찾기','nav-expedition-places'),('육상 차량과 해상 보트 주행','expedition-play'),('원종 알과 재입수','egg-targets')],
     [row('주행 조작과 회수 및 귀환','expedition-play'),row('반복 원정과 심층 주행','deep-expedition'),{**c.h('장소별 재료 목표'),'anchor':'nav-expedition-places'},grid(places,2),row('공룡별 알 목표와 재입수 조건','egg-targets'),row('83종의 최초와 반복 획득 비용 비교','acquisition-table')])

 recipes=[(p['title'].removesuffix(' 합성 레시피'),p['id']) for p in body if p['id'].startswith('recipe-') and '-cont-' not in p['id']]
 add(9,'DNA 합성',('합성',),
     '첫 지정 스테고케라톱스를 합성·전시하면 같은 종의 반복 합성이 열립니다. 성향별 확률과 개체별 매력도, 실제 전시 교체 조건을 확인합니다.',
     [('결과 공룡별 레시피 찾기','nav-recipes'),('원종 보유와 합성 조건',parents),('성공률과 첫 합성 보장',protection)],
     [row('실제 보유 부모와 작업 조건',parents),row('성공률과 실패 보호 및 반환',protection),row('스테고케라톱스 레시피','recipe-stegoceratops'),row('반복 합성과 개체 능력치','repeat-synthesis-traits'),row('새로운 변종과 하이브리드 찾기','collect-new-hybrids'),row('첫 합성의 이야기와 전시 목표','story-current-ch3-scene-6'),{**c.h('결과 공룡별 레시피'),'anchor':'nav-recipes'},grid(recipes,2)])

 dino_groups=[]
 for grade in ['일반','고급','희귀','영웅','전설']:
  items=[]
  for a,(name,description) in profiles.items():
   if a.startswith('dino-') and description.split(' · ')[0]==grade:items.append((name,a))
  blocks=[{**c.h(grade),'anchor':'nav-dinosaurs-'+grade},grid(sorted(items),3)]
  for b in blocks:b['keep_group']='dinosaur-directory-'+grade
  dino_groups += blocks
 add(10,'공룡 도감',('공룡 도감',),
     '등급별 이름에서 공룡을 골라 특징·획득 방법·서식지·합성 연결을 확인합니다. 수록 공룡83종의 기본 수치와 전시 조건을 함께 확인합니다.',
     [('등급과 계보 및 수집 기준','nav-dino-rules'),('83종 전체 획득표','acquisition-table'),('개별 공룡의 획득과 전시','dino-parasaurolophus')],
     [{**c.h('등급과 수집 기준'),'anchor':'nav-dino-rules'},c.p('공룡 희귀도는 일반·고급·희귀·영웅·전설이며, 자연종·변종·하이브리드는 계보 구분입니다. 영구 수집과 현재 보유는 구별합니다. 자세한 규칙은 아래 연결 본문에서 확인합니다.'),row('등급과 계보 및 도감 등록 규칙',grades),row('전체83종 최초·반복 획득표','acquisition-table'),row('획득 해금과 전시 조건의 구분','acquisition-rules'),*dino_groups])

 add(11,'시즌과 파크 교류',('시즌과 파크 교류',),
     '시즌에서 새 이야기를 만나고 다른 파크에 방문합니다. 내 공룡의 경기 기록을 비교하고, 경매장과 야시장에서 새로운 전시와 원정을 찾을 수 있습니다.',
     [('시즌과 이벤트','season-events'),('공룡 경기와 기록 경쟁','dinosaur-competition'),('플레이어 거래','player-market')],
     [row('시즌 이야기와 이벤트','season-events'),row('친구 방문과 선물','park-visits'),row('공룡 경기와 기록 경쟁','dinosaur-competition'),grid([('경매장과 야시장','auction-night-market'),('플레이어 거래','player-market')],2)])

 add(12,'도움말과 찾아보기',('도움말',),
     '입장객이 오지 않거나 자원이 부족할 때 먼저 확인할 항목이 있습니다. 공사가 끝났는데 보상을 받지 못했거나 막힌 원정의 해결 방법도 확인할 수 있습니다.',
     [('파크 운영이 막힐 때','park-help'),('완료한 작업과 받지 않은 보상','activity-help')],
     [row('골드와 사료가 부족하거나 관람객이 오지 않을 때','park-help'),row('완료한 작업과 받지 않은 보상','activity-help'),row('이름 색인','index')])

 part_map={p:ch for ch in chapters for p in ch['parts']}
 assert set(part_map)=={p['part'] for p in body if p['part']!='이용 안내'}
 arranged=[];started=set()
 for page in body:
  if page['part']=='이용 안내':arranged.append(page);continue
  ch=part_map[page['part']]
  if ch['id'] not in started:arranged.extend(ch['directory']);started.add(ch['id'])
  page.update(chapter=ch['id'],chapter_title=ch['title'],chapter_number=ch['number'],chapter_open=False)
  arranged.append(page)
 book.pages=arranged
 for ch in chapters:ch.pop('directory')
 return chapters
