#!/usr/bin/env python3
"""Build or verify the paginated Word/PDF planning handbook from project sources."""
from __future__ import annotations
import argparse, collections, datetime, hashlib, json, math, os, re, shutil, subprocess, sys
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from docx import Document
from pdf2image import convert_from_path
from PIL import Image
from docx.shared import Pt, Mm, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
from pypdf import PdfReader
import content
import navigation
from flow_pages import anchor, export_pdf, map_plan_pages, pdf_bookmark_pages, resolve_goto_page, DestinationError

ROOT=content.ROOT; HERE=Path(__file__).resolve().parent
OUTPUT=HERE/'output'; TMP=ROOT/'tmp/guidebook'
DOCX=OUTPUT/'dino-park-guidebook.docx'; PDF=OUTPUT/'dino-park-guidebook.pdf'
MANIFEST=HERE/'manifest.json'
FONT='Apple SD Gothic Neo'
FONT_FILE='/System/Library/Fonts/AppleSDGothicNeo.ttc'
BODY_SIZE=10.5; BODY_LINE=16
TABLE_SIZE=9.5; TABLE_LINE=13.5
INK='000000'; MUTED='56645F'; NAVY='304B59'; LIGHT='F3F6F7'
VERSION=content.VERSION
BOOK_DATE=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()
BUNDLE=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies'
os.environ['PATH']=str(BUNDLE/'node/bin')+os.pathsep+str(BUNDLE/'bin/override')+os.pathsep+os.environ.get('PATH','')


def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def noemoji(t):return content.clean(t)

def bookmarks(paragraph,id,serial):
 start=OxmlElement('w:bookmarkStart');start.set(qn('w:id'),str(serial));start.set(qn('w:name'),anchor(id))
 end=OxmlElement('w:bookmarkEnd');end.set(qn('w:id'),str(serial))
 # Word expects paragraph properties before content, including bookmark starts.
 paragraph._p.get_or_add_pPr().addnext(start)
 paragraph._p.append(end)

def link(paragraph,text,id,*,size=None,bold=False,visible=False):
 h=OxmlElement('w:hyperlink');h.set(qn('w:anchor'),anchor(id));h.set(qn('w:history'),'1')
 r=OxmlElement('w:r');pr=OxmlElement('w:rPr');font=OxmlElement('w:rFonts')
 for k in ['ascii','hAnsi','eastAsia']:font.set(qn('w:'+k),FONT)
 pr.append(font);c=OxmlElement('w:color');c.set(qn('w:val'),'15516A' if visible else INK);pr.append(c)
 if size is not None:
  sz=OxmlElement('w:sz');sz.set(qn('w:val'),str(round(size*2)));pr.append(sz)
 if bold:pr.append(OxmlElement('w:b'))
 if visible:
  underline=OxmlElement('w:u');underline.set(qn('w:val'),'single');pr.append(underline)
 r.append(pr);t=OxmlElement('w:t');t.text=text;r.append(t);h.append(r);paragraph._p.append(h)

def cell_borders(cell,padding=40):
 props=cell._tc.get_or_add_tcPr();borders=OxmlElement('w:tcBorders')
 for side in ['top','left','bottom','right','insideH','insideV']:
  v=OxmlElement('w:'+side);v.set(qn('w:val'),'single');v.set(qn('w:sz'),'4');v.set(qn('w:color'),'D9D9D9');borders.append(v)
 props.append(borders);marg=OxmlElement('w:tcMar')
 for side,val in [('top',str(padding)),('bottom',str(padding)),('left','100'),('right','100')]:
  e=OxmlElement('w:'+side);e.set(qn('w:w'),val);e.set(qn('w:type'),'dxa');marg.append(e)
 props.append(marg)

def make_table(doc,b):
 t=doc.add_table(rows=1,cols=len(b['headers']));t.autofit=False;t.alignment=WD_TABLE_ALIGNMENT.CENTER
 text_style_id=doc.styles['Table Text'].style_id
 weights=b.get('widths') or [1]*len(b['headers']);total=sum(weights)
 for i,w in enumerate(weights):t.columns[i].width=Mm(174*w/total)
 spacious=b.get('variant')=='research';allrows=[b['headers'],*b['rows']]
 padding=90 if spacious else 35 if b.get('variant')=='index' else 40
 milestone=b['headers'][0]=='Lv' and len(b['rows'])>=20
 keep_rows={0} if len(allrows)>1 else set()
 if len(b['rows'])>=3:
  if content.block_height({**b,'type':'table','rows':b['rows'][:2]})<=140:keep_rows.add(1)
  if content.block_height({**b,'type':'table','rows':b['rows'][-2:]})<=140:keep_rows.add(len(allrows)-2)
 if b.get('keep_rows'):keep_rows.update(range(len(allrows)-1))
 for ri,values in enumerate(allrows):
  cells=t.rows[0].cells if ri==0 else t.add_row().cells
  trpr=cells[0]._tc.getparent().get_or_add_trPr();trpr.append(OxmlElement('w:cantSplit'))
  if ri==0:repeat=OxmlElement('w:tblHeader');repeat.set(qn('w:val'),'true');trpr.append(repeat)
  major=milestone and ri>0 and str(values[0]) in ('5','10','15','20','25')
  for ci,value in enumerate(values):
   cell=cells[ci];cell.width=Mm(174*weights[ci]/total);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER;cell_borders(cell,padding)
   shade=OxmlElement('w:shd');shade.set(qn('w:fill'),NAVY if ri==0 else ('E5ECEF' if major else (LIGHT if ri%2==0 else 'FFFFFF')));cell._tc.get_or_add_tcPr().append(shade)
   p=cell.paragraphs[0];p._p.style=text_style_id
   if ri in keep_rows:p.paragraph_format.keep_with_next=True
   short=ci==0 and (weights[ci]<1 or b['headers'][ci] in ('Lv','등급','표시'))
   numeric=ri>0 and bool(re.fullmatch(r'[0-9,./%× →-]+',str(value)))
   p.alignment=WD_ALIGN_PARAGRAPH.CENTER if short else (WD_ALIGN_PARAGRAPH.RIGHT if numeric else WD_ALIGN_PARAGRAPH.LEFT)
   run=p.add_run(str(value));run.bold=ri==0 or major
   run.font.color.rgb=RGBColor.from_string('FFFFFF' if ri==0 else INK)
 gap=doc.add_paragraph();gap.paragraph_format.line_spacing=Pt(1);gap.paragraph_format.space_after=Pt(4);gap.paragraph_format.space_before=Pt(0);gap.add_run().font.size=Pt(1)
 return t


def paragraph_text(doc,text,*,style='Normal',page=None):
 """Bold field labels and separate speech without changing the source text."""
 p=doc.add_paragraph(style=style)
 dialogue=re.match(r'^(아서의 편지|아이|올리비아|로버트|다니엘|루이스|토마스|기록|닥터 진|플레이어|내레이션|서연|이서연|마르코|에밀리|오웬|리사|헨리 우|그랜트|제이든|아리아|루카|노아|미아|테오|박사|에코|인도미누스)(:)(.*)',text)
 if dialogue:
  p.paragraph_format.left_indent=Mm(6);p.paragraph_format.right_indent=Mm(5)
  r=p.add_run(dialogue[1]+'  ');r.bold=True
  p.add_run(dialogue[3].lstrip());return p
 leads=['진입과 목표:', '완료와 다음:', '선택과 결과:', '우리 짓기 ', '공룡 옮기기 ', '코스 저장 ', '지프 관람 ', '상태 ', '목적 ', '선행 ', '획득 ', '전시 ', '부모로 사용하는 합성 ', '인기도 ', '특성 원안 ', '서사 흐름 ', '현재 위인 식별 ', '구분 ', '역할 ', '대사 ', '보유 효과 ', '배정 효과 ', '영입 ', '성장 구간 ', '적용 ', '관계 ', '해금 ', '실제 보유 부모 ']
 for lead in leads:
  if text.startswith(lead):
   p.add_run(lead.rstrip()+('  ' if not lead.endswith(':') else ' ')).bold=True;p.add_run(text[len(lead):].lstrip());break
 else:p.add_run(text)
 return p


def set_style(doc,name,size,line,bold=False,before=0,after=6,color='000000'):
 style=doc.styles[name] if name in doc.styles else doc.styles.add_style(name,1)
 style.font.name=FONT;style.font.size=Pt(size);style.font.bold=bold;style.font.italic=False;style.font.color.rgb=RGBColor.from_string(color)
 rf=style.element.get_or_add_rPr().get_or_add_rFonts()
 for k in ['ascii','hAnsi','eastAsia','cs']:rf.set(qn('w:'+k),FONT)
 for key in list(rf.attrib):
  if 'theme' in key.lower():rf.attrib.pop(key)
 pf=style.paragraph_format;pf.space_before=Pt(before);pf.space_after=Pt(after);pf.line_spacing=Pt(line)
 if name.startswith('Heading'):pf.keep_with_next=True
 return style


def word_heading_policy(pages):
 """Separate reader-facing outline entries from physical page furniture.

 All bookmark targets remain available to links, including hidden profiles and
 continuation titles. The current chapter topic records own the small H2 set.
 """
 h1={p['id'] for p in pages if p.get('chapter_open')}
 h1.update(p['id'] for p in pages if p['id'] in ('toc','toc-1','index'))
 topics={target for p in pages for ch in p.get('chapters',[]) for _label,target in ch['topics']}
 profiles={b['anchor'] for p in pages if p['id'].startswith(('figures-','people-','dinosaurs-'))
           for b in p.get('blocks',[]) if b.get('anchor','').startswith(('dino-','figure-','character-'))}
 topics-=profiles
 h2=topics|{p['id'] for p in pages if p['id'] in ('read-first','park-progression-rules')}
 return {'h1':h1,'h2':h2}


def install_page_heading_styles(doc):
 """Normal-based display styles do not turn 520 physical pages into headings."""
 from copy import deepcopy
 for name,visual in [('Page Title Major','Heading 1'),('Page Title','Heading 2'),('Page Subheading','Heading 3')]:
  style=doc.styles[name] if name in doc.styles else doc.styles.add_style(name,1)
  style.base_style=doc.styles['Normal']
  for tag in ('w:pPr','w:rPr'):
   prior=style.element.find(qn(tag))
   if prior is not None:style.element.remove(prior)
   original=doc.styles[visual].element.find(qn(tag))
   if original is not None:style.element.append(deepcopy(original))
  props=style.element.get_or_add_pPr()
  for level in list(props.findall(qn('w:outlineLvl'))):props.remove(level)
  level=OxmlElement('w:outlineLvl');level.set(qn('w:val'),'9');props.append(level)


def add_word_heading(doc,text,visual,level=None):
 """Change semantic level while preserving the exact original visual metrics."""
 from copy import deepcopy
 display={'Heading 1':'Page Title Major','Heading 2':'Page Title','Heading 3':'Page Subheading'}
 p=doc.add_paragraph(text,f'Heading {level}' if level else display[visual])
 props=p._p.get_or_add_pPr();source=doc.styles[visual].element
 # Preserve keep/spacing behavior; outline level comes only from the chosen
 # semantic or Normal-based display style, never from the source appearance.
 for item in source.get_or_add_pPr():
  if item.tag==qn('w:outlineLvl'):continue
  existing=props.find(item.tag)
  if existing is not None:props.remove(existing)
  props.append(deepcopy(item))
 for run in p.runs:
  if run._r.rPr is not None:run._r.remove(run._r.rPr)
  if source.rPr is not None:run._r.insert(0,deepcopy(source.rPr))
 return p


def nav_line(doc,label,target,numbers,*,chapter=False,indent=0,page_text=None):
 p=doc.add_paragraph();pf=p.paragraph_format
 pf.left_indent=Mm(indent);pf.line_spacing=Pt(21 if chapter else 16)
 pf.space_before=Pt(14 if chapter else 0);pf.space_after=Pt(4)
 pf.keep_with_next=chapter
 pf.tab_stops.add_tab_stop(Mm(174),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
 link(p,label,target,size=14 if chapter else 10.5,bold=chapter)
 p.add_run('\t')
 link(p,page_text or str(numbers[target]),target,size=14 if chapter else 10.5,bold=chapter)
 return p

def nav_grid(doc,block,numbers):
 items=block['items'];n=block['columns'];t=doc.add_table(rows=math.ceil(len(items)/n),cols=n)
 t.autofit=False;t.alignment=WD_TABLE_ALIGNMENT.CENTER
 for col in t.columns:col.width=Mm(174/n)
 for row in t.rows:
  row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
  for cell in row.cells:cell.width=Mm(174/n);cell_borders(cell,65)
 for i,item in enumerate(items):
  cell=t.cell(i//n,i%n)
  p=cell.paragraphs[0];p.paragraph_format.line_spacing=Pt(15);p.paragraph_format.space_after=Pt(2)
  if len(t.rows)>1 and i//n in {0,len(t.rows)-2}:p.paragraph_format.keep_with_next=True
  link(p,item[0]+'  '+str(numbers[item[1]]),item[1],size=10)
 p=doc.add_paragraph();p.paragraph_format.line_spacing=Pt(3);p.paragraph_format.space_after=Pt(0)

def front_link(doc,label,target,numbers,*,chapter=False):
 """A compact line with separate clickable title and page number."""
 paragraph=doc.add_paragraph()
 layout=paragraph.paragraph_format
 layout.line_spacing=Pt(22 if chapter else 17)
 layout.space_after=Pt(8 if chapter else 2)
 layout.keep_together=True
 layout.keep_with_next=False
 layout.tab_stops.add_tab_stop(Mm(174),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
 size=12 if chapter else 10.5
 link(paragraph,label,target,size=size,bold=chapter,visible=True)
 paragraph.add_run('\t')
 link(paragraph,str(numbers[target]),target,size=size,visible=True)

QUICK_GROUPS = [
 ('첫 플레이와 성장',[
  ('시작 리더와 재건 목표','production-direction'),('첫 스테고케라톱스 합성 레시피','recipe-stegoceratops'),
  ('첫 전시 뒤 파크 Lv.15까지','park-growth-walkthrough'),('중후반 스토리 진행 조건','story-current-section-11')]),
 ('파크 운영과 확장',[
  ('자원 획득과 사용처','resources'),('첫 7일과 장기 운영 수급','operation-balance'),
  ('건물별 25레벨 강화표','nav-facilities'),('계열별 연구 효과와 비용','nav-research-items'),
  ('사파리 우리와 지프 관람','park-safari-jeep')]),
 ('탐험과 공룡 수집',[
  ('탐험가 파견 스팟 80곳','nav-scout-spots'),('하이브리드 실험과 연구자료','experimental-hybrids'),
  ('공룡 83종 전체 획득표','acquisition-table'),('결과 공룡별 합성 레시피','nav-recipes')]),
 ('이야기와 교류',[
  ('프롤로그부터 3장까지 이야기','story-current-section-0'),('위인 영입과 성장','figure-rules'),
  ('공룡 경기와 기록 경쟁','dinosaur-competition'),('이름과 항목 색인','index')]),
]

def plan_book():
 book,counts=content.make_book()
 # Put each full-size diagram next to the detail it explains. This lets the
 # research tables fill the rest of its page without shrinking the diagram.
 diagram_ids={f'tree-{family}' for family in ('ops','care','exp','gene')}
 diagrams={page['id']:page for page in book.pages if page['id'] in diagram_ids}
 ordered=[]
 for page in book.pages:
  if page['id'] in diagram_ids:continue
  match=re.match(r'^research-(ops|care|exp|gene)-',page['id'])
  if match and (diagram:=diagrams.pop(f'tree-{match[1]}',None)):ordered.append(diagram)
  ordered.append(page)
 assert not diagrams,'Research diagram has no detail section'
 book.pages=ordered
 chapters=navigation.organize(book)
 # Stable, representative term references grouped by subject, with no duplicate
 # independent numeric inputs in the index.
 grouped=collections.OrderedDict()
 for term in book.terms:
  key=(term['term'],term['category']);grouped.setdefault(key,[])
  if term['target'] not in grouped[key]:grouped[key].append(term['target'])
 def key(item):
  term,category=item[0];first=term[0] if term else ''
  return (0 if '\uac00'<=first<='\ud7a3' else 1,term.casefold(),category)
 entries=[{'term':k[0],'category':k[1],'targets':v} for k,v in sorted(grouped.items(),key=key)]
 # Let Word repeat the header on actual page breaks. Longer index tables
 # avoid inserting another header every few dozen entries within a page.
 indexsize=75
 toc_pages=[
  {'id':'toc','part':'목차','title':'목차','chapters':chapters},
  {'id':'toc-1','part':'목차','title':'빠른 찾기','chapters':[],'quick_groups':QUICK_GROUPS},
 ]
 index_pages=[{'id':f'index-{i//indexsize}','part':'찾아보기','title':'가나다 영문 ID 색인'+f' {i//indexsize+1}','entries':entries[i:i+indexsize]} for i in range(0,len(entries),indexsize)]
 toc_pages[0]['id']='toc';index_pages[0]['id']='index'
 pages=[{'id':'cover','part':'표지','title':'다이노 파크 플레이 가이드'},*toc_pages,*book.pages,*index_pages]
 page_numbers={p['id']:i+1 for i,p in enumerate(pages)}
 for entry,parent in book.entry_positions.items():page_numbers[entry]=page_numbers[parent]
 # Several scenes can share a physical page. Show that page only once while
 # preserving the first actual scene link and up to five distinct references.
 for entry in entries:
  targets=[];seen_pages=set()
  for target in entry['targets']:
   page=page_numbers[target]
   if page not in seen_pages:targets.append(target);seen_pages.add(page)
   if len(targets)==5:break
  entry['targets']=targets
 return pages,page_numbers,counts,entries


def keep_source_with_content(paragraph):
 """Keep the source with its preceding text or the last table row."""
 from docx.text.paragraph import Paragraph
 previous=paragraph._p.getprevious()
 while previous is not None and previous.tag==qn('w:p'):
  Paragraph(previous,paragraph._parent).paragraph_format.keep_with_next=True
  if previous.xpath('.//w:t|.//w:drawing'):return
  previous=previous.getprevious()
 if previous is not None and previous.tag==qn('w:tbl'):
  for cell_paragraph in previous.xpath('./w:tr[last()]/w:tc/w:p'):
   Paragraph(cell_paragraph,paragraph._parent).paragraph_format.keep_with_next=True


def save_docx(pages,numbers,path=None):
 doc=Document();sec=doc.sections[0]
 sec.page_width=Mm(210);sec.page_height=Mm(297);sec.top_margin=Mm(16);sec.bottom_margin=Mm(17);sec.left_margin=Mm(18);sec.right_margin=Mm(18)
 sec.header_distance=Mm(7);sec.footer_distance=Mm(7)
 for spec in [('Normal',10.5,15,False,0,5),('Title',34,42,True,0,12),('Subtitle',14,22,False,0,10),('Heading 1',23,29,True,14,7),('Heading 2',17,23,True,11,6),('Heading 3',12.5,17.5,True,8,4),('Caption',8,11.5,False,0,4),('Table Text',9.5,13,False,0,0),('Profile Meta',9,13,True,0,5)]:
  set_style(doc,*spec)
 install_page_heading_styles(doc);outline_policy=word_heading_policy(pages)
 for style in doc.styles:
  for border in style.element.xpath('.//w:pBdr'):border.getparent().remove(border)
 hp=sec.header.paragraphs[0];hp.style='Caption'
 hp.paragraph_format.tab_stops.add_tab_stop(Mm(174),WD_TAB_ALIGNMENT.RIGHT)
 hp.add_run('DINO PARK   /   플레이 가이드')
 foot=sec.footer.paragraphs[0];foot.style='Caption';foot.paragraph_format.tab_stops.add_tab_stop(Mm(174),WD_TAB_ALIGNMENT.RIGHT)
 foot.add_run('DINO PARK');foot.add_run('\t');link(foot,'목차','toc');foot.add_run('   |   ');link(foot,'색인','index');foot.add_run('     ')
 field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');foot._p.append(field)
 doc.core_properties.title='다이노 파크 플레이 가이드';doc.core_properties.subject='파크 운영 탐험 공룡 수집과 교류 안내';doc.core_properties.author='Dino Park project';doc.core_properties.keywords='다이노파크, 플레이 가이드, 공룡'
 for pi,page in enumerate(pages):
  if page['id']=='cover':
   p=doc.add_paragraph('DINO PARK','Caption');p.paragraph_format.space_before=Pt(35);p.paragraph_format.space_after=Pt(18)
   p=doc.add_paragraph('다이노 파크 플레이 가이드','Title');bookmarks(p,page['id'],pi+1)
   doc.add_paragraph('파크의 재건부터 탐험과 DNA 합성까지','Subtitle')
   art=HERE/'artwork/park-cover.png'
   if art.exists():
    p=doc.add_paragraph();p.paragraph_format.line_spacing=1.0;p.add_run().add_picture(str(art),width=Mm(174));p.paragraph_format.space_after=Pt(12)
   doc.add_paragraph('첫 손님을 맞이하고 새 공룡을 키우세요. 시설과 연구를 확장하고, 탐험에서 얻은 알과 DNA로 나만의 파크를 만들어 갈 수 있습니다.')
   continue
  title_targets={page['id']}|{b['anchor'] for b in page.get('blocks',[]) if b.get('title_anchor') and b.get('anchor')}
  outline_level=1 if title_targets&outline_policy['h1'] else (2 if title_targets&outline_policy['h2'] else None)
  compact_anchor=len(title_targets)==1 and not outline_level and bool(re.search(r'-cont-\d+$|^(?:people|figures|index)-\d+$',page['id']))
  if page['id'].startswith('dinosaurs-') and len(title_targets)==1 and not outline_level:compact_anchor=True
  if compact_anchor:
   # A logical source boundary is still a bookmark even when its old printed
   # "continued" title would repeat what the preceding line already says.
   title=doc.add_paragraph()
   layout=title.paragraph_format
   layout.line_spacing=Pt(1);layout.space_before=Pt(0);layout.space_after=Pt(0)
   layout.keep_with_next=True
  else:
   style='Heading 1' if outline_level==1 else ('Heading 3' if page['id'].startswith('park-level-') else 'Heading 2')
   title=add_word_heading(doc,page['title'],style,outline_level)
  bookmarks(title,page['id'],pi+1)
  if page['id'] in {'toc','toc-1','read-first'}:
   title.paragraph_format.page_break_before=True
   title.paragraph_format.space_before=Pt(0)
  if page['part']=='목차':
   if page['id']=='toc':
    doc.add_paragraph('장 제목이나 쪽수를 눌러 해당 장의 안내로 이동합니다.')
    for ch in page['chapters']:
     front_link(doc,f'{ch["number"]:02}  {ch["title"]}',ch['id'],numbers,chapter=True)
    front_link(doc,'빠른 찾기','toc-1',numbers)
   else:
    doc.add_paragraph('찾으려는 내용을 고르면 해당 표나 본문으로 이동합니다.')
    for group,items in page['quick_groups']:
     group_title=doc.add_paragraph()
     group_title.paragraph_format.space_before=Pt(10)
     group_title.paragraph_format.space_after=Pt(3)
     group_title.paragraph_format.keep_with_next=True
     group_title.add_run(group).bold=True
     for label,target in items:
      front_link(doc,label,target,numbers)
    front_link(doc,'전체 장 목차','toc',numbers)
   continue
  if page['part']=='찾아보기':
   if page['id']=='index':doc.add_paragraph('가나다순 뒤에 영문과 ID를 배열했습니다. 같은 이름은 분야로 구분하며 대표 참조 쪽수를 클릭할 수 있습니다.','Caption')
   tb={'headers':['용어와 이름','분야','쪽'],'rows':[['','',''] for _ in page['entries']],'widths':[3.7,1.6,1.2],'variant':'index'}
   t=make_table(doc,tb)
   for ri,entry in enumerate(page['entries'],1):
    t.rows[ri].cells[0].paragraphs[0].add_run(entry['term']);t.rows[ri].cells[1].paragraphs[0].add_run(entry['category'])
    p=t.rows[ri].cells[2].paragraphs[0]
    for n,target in enumerate(entry['targets']):
     if n:p.add_run(', ')
     link(p,str(numbers[target]),target)
   continue
  blocks=page['blocks']
  first_data=next((i for i,b in enumerate(blocks) if b['type'] in {'table','image'}),0)
  short_intro=first_data and page['id'].startswith(('building-','research-','recipe-','park-level-','tree-')) and sum(content.block_height(b) for b in blocks[:first_data])<=150
  for block_index,block in enumerate(blocks):
   kind=block['type']
   if kind=='table':make_table(doc,block)
   elif kind=='nav':nav_line(doc,block['text'],block['target'],numbers)
   elif kind=='nav-grid':nav_grid(doc,block,numbers)
   elif kind=='image':
    p=doc.add_paragraph()
    p.paragraph_format.line_spacing=1.0
    p.paragraph_format.space_after=Pt(5)
    pictures=block['paths'] if 'paths' in block else [block['path']]
    if len(pictures)>1:p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for index,picture in enumerate(pictures):
     if index:p.add_run('      ')
     if Path(picture).suffix=='.webp':
      with Image.open(picture) as sprite:
       png=BytesIO()
       sprite.save(png,format='PNG')
      png.seek(0)
      picture=png
     shape=p.add_run().add_picture(picture,width=Mm(block.get('width',174)))
     shape._inline.docPr.set('descr',page['title'])
    if caption:=block.get('caption'):
     p.paragraph_format.keep_with_next=True
     caption_p=doc.add_paragraph(caption,'Caption')
     caption_p.alignment=WD_ALIGN_PARAGRAPH.CENTER
   elif kind=='h':
    if block.get('title_anchor'):
     bookmarks(title,block['anchor'],100000+pi);continue
    scene=re.match(r'^(prologue scene \d+|ch[123] scene \d+)\s+(.+)',block['text'])
    level=2 if block.get('anchor') in outline_policy['h2'] else None
    p=add_word_heading(doc,scene[2] if scene else block['text'],'Heading 3',level)
    if block.get('anchor'):bookmarks(p,block['anchor'],10000+sum(len(p._p.getparent()) for _ in [0]))
    if block.get('anchor','').startswith('dino-'):
     p.paragraph_format.line_spacing=Pt(23);p.paragraph_format.space_before=Pt(13);p.paragraph_format.space_after=Pt(8)
     for r in p.runs:r.font.size=Pt(16)
    if scene:
     caption=doc.add_paragraph(scene[1].replace(' ','-'),'Caption')
     caption.paragraph_format.keep_with_next=True
   else:
    profile=page['id'].startswith(('people-','figures-','dinosaurs-')) and re.match(r'^(일반|고급|희귀|영웅|전설) ·',block['text'])
    p=paragraph_text(doc,block['text'],style='Caption' if kind=='source' else ('Profile Meta' if profile else 'Normal'),page=page)
    next_block=blocks[block_index+1] if block_index+1<len(blocks) else {}
    before_acquisition=next_block.get('acquisition_route')=='first' and block.get('keep_group','').startswith('dino-profile-')
    if block.get('keep_with_next') or profile or before_acquisition or (short_intro and block_index<first_data):p.paragraph_format.keep_with_next=True
    if kind=='source':
     p.paragraph_format.space_before=Pt(4)
     keep_source_with_content(p)
     for r in p.runs:r.font.color.rgb=RGBColor.from_string(MUTED)
 doc.save(path or DOCX)


def inputs():
 candidates=set()
 for pattern in ['docs/current/*.md','docs/dino_park_*.md','docs/assets/*.md','packages/game-data/src/**/*.ts','packages/shared/src/**/*.ts', 'docs/models/*v06*','docs/guidebook/*.py','docs/guidebook/*.mjs','docs/guidebook/artwork/*.png','docs/guidebook/editorial/*.json','apps/client/public/assets/placeholders/*.svg','apps/client/public/assets/buildings/viewing-platform*.webp','apps/client/public/assets/dinosaurs/*/idle.webp','apps/client/public/assets/ui/park-hud/*.webp','docs/visuals/research-tree-v06/*.png']:
  candidates.update(p for p in ROOT.glob(pattern) if p.is_file())
 candidates.update(p for p in (ROOT/'apps/client/public/assets/safari-encounter').iterdir() if p.is_file() and p.suffix in {'.glb','.mp3','.webp'})
 candidates.update(p for p in (ROOT/'docs/assets/reference/safari-encounter').iterdir() if p.is_file() and p.suffix in {'.blend','.py'})
 for name in ('character-direction.webp','stegosaurus-character-direction.webp'):
  candidates.add(ROOT/'docs/assets/reference'/name)
 candidates.update((ROOT/'apps/client/public/assets/dinosaurs/parasaurolophus').glob('walk-*.webp'))
 dinosaur_sources=ROOT/'apps/client/src/assets/images/dinosaurs'
 for path in ('herbivore/parasaurolophus/idle-source.png',
              'herbivore/parasaurolophus/walk-sheet-source.png',
              'herbivore/iguanodon/idle-source.png',
              'herbivore/triceratops/idle-source.png',
              'hybrid/stegoceratops/idle-source.png',
              'herbivore/stegosaurus/idle-source.png',
              'carnivore/tyrannosaurus-rex/idle-source.png'):
  candidates.add(dinosaur_sources/path)
 for path in ['TASK.md','CLAUDE.md','docs/README.md','docs/guidebook/README.md']:
  if (ROOT/path).exists():candidates.add(ROOT/path)
 for path in ('apps/client/src/game/parkArtwork.ts','apps/client/src/game/buildingRasterManifest.json',
              'apps/client/src/game/engine/GameEngine.ts','apps/client/src/game/engine/IslandWorld.ts',
              'apps/client/src/game/engine/IsometricGrid.ts','apps/client/src/game/engine/ParkScenery.ts',
              'apps/client/src/game/engine/DinosaurShadow.ts',
              'apps/client/src/game/engine/ParkShuttles.ts',
              'apps/client/src/game/engine/ParkSafariScenery.ts',
              'apps/client/src/features/park/pages/ParkPage.tsx',
              'apps/client/src/features/park/pages/ParkSafariPage.tsx',
              'apps/client/src/features/park/pages/ParkSafariPage.css',
              'apps/client/src/features/park/pages/SafariMap.tsx',
              'apps/client/src/features/park/pages/drawSafariPark.ts',
              'apps/client/src/features/park/pages/safariEditor.ts',
              'apps/client/src/App.tsx',
              'apps/client/src/api/queries/safari.ts',
              'apps/client/src/features/park/pages/SafariPreviewPage.tsx',
              'apps/client/src/features/park/pages/SafariPreview.css',
              'apps/client/src/features/park/pages/StegosaurusRealtimePage.tsx',
              'apps/client/src/features/park/pages/StegosaurusRealtimePage.css',
              'apps/client/src/features/park/pages/ParkHud.css',
              'apps/client/src/features/park/components/ParkHud.tsx',
              'apps/client/src/features/park/components/ParkHarvestMarkers.tsx',
              'apps/client/src/features/park/components/ParkHarvestFeedback.css',
              'apps/client/src/features/park/components/useParkHarvest.tsx',
              'apps/client/src/features/park/components/useParkMapPin.ts',
              'apps/client/src/features/park/components/ParkPanel.tsx',
              'apps/client/src/features/park/components/ResourcePanel.tsx',
              'apps/client/src/features/park/components/ParkMeadowLink.tsx',
              'apps/client/src/features/park/components/ParkOperationsPanel.tsx',
              'apps/client/src/features/park/components/ParkShuttlePanel.tsx',
              'apps/client/public/assets/vehicles/shuttle-front.webp',
              'apps/client/public/assets/vehicles/shuttle-back.webp',
              'apps/server/src/modules/park/park-shuttle.logic.ts',
              'apps/server/src/modules/park/park-shuttle.service.ts',
              'apps/server/src/modules/park/park-safari.service.ts',
              'apps/server/src/modules/park/park-safari-state.ts',
              'apps/client/src/game/safari/safariEncounter.ts',
              'apps/client/src/game/safari/drawSafariEncounter.ts',
              'apps/client/src/game/safari/StegosaurusRealtimeScene.ts',
              'apps/client/public/assets/buildings/safari-security-pylon.webp',
              'apps/client/src/assets/images/buildings/habitats/safari-security-pylon/pylon-source.png',
              'apps/client/src/features/exploration/pages/ExplorationPage.tsx',
              'apps/client/src/assets/README.md'):
  candidates.add(ROOT/path)
 exterior=ROOT/'apps/client/src/game/engine/ParkExterior.ts'
 environment_paths={ROOT/'apps/client/public'/url.lstrip('/')
                    for url in re.findall(r'/assets/environment/[a-z0-9-]+\.webp',exterior.read_text())}
 assert environment_paths and all(path.is_file() for path in environment_paths)
 candidates.update({exterior,*environment_paths})
 artwork=content.park_artwork_preview()
 base_art=artwork['buildings']
 base_paths={ROOT/'apps/client/public'/url.lstrip('/') for url in base_art.values()}
 assert len(base_art)==len(base_paths)==49 and all(path.is_file() and path.suffix=='.webp' for path in base_paths)
 candidates.update(base_paths)
 fence_art=artwork['habitatFences']
 fence_paths={ROOT/'apps/client/public'/url.lstrip('/') for url in fence_art.values()}
 assert len(fence_art)==len(fence_paths)==7 and fence_art.keys()<=base_art.keys()
 assert not (base_paths & fence_paths) and all(path.is_file() and path.suffix=='.webp' for path in fence_paths)
 candidates.update(fence_paths)
 candidates.add(ROOT/'packages/game-data/src/research/progression.generated.json')
 candidates.add(ROOT/'packages/game-data/src/research/park-growth.generated.json')
 # Include the sources explicitly referenced by editorial summaries.
 for f in (HERE/'editorial').glob('*.json'):
  data=json.loads(f.read_text());candidates.update(ROOT/p for p in data['source_sha256'])
 return {str(p.relative_to(ROOT)):sha(p) for p in sorted(candidates)}


def check():
 saved=json.loads(MANIFEST.read_text());current=inputs();changed=[p for p in set(saved['sources'])|set(current) if saved['sources'].get(p)!=current.get(p)]
 for name in ['story-people','figures','reference']:
  content.editorial(name)
 if (HERE/'editorial/reference-detail.json').exists():content.editorial('reference-detail')
 assert not changed,'가이드북 갱신 필요: '+', '.join(sorted(changed))
 assert saved.get('font',{}).get('sha256')==sha(FONT_FILE),'출력 글꼴 변경: 가이드북 재생성 필요'
 for name,h in saved['outputs'].items():assert sha(HERE/name)==h,'출력 파일이 생성본과 다릅니다: '+name
 print(json.dumps({'status':'pass','sources':len(current),'pages':saved['pages'],'indexed_terms':saved['indexed_terms'],'outputs_current':True},ensure_ascii=False))


def verify_pdf(pages,numbers,pdf_path=None):
 pdf_path=pdf_path or PDF
 reader=PdfReader(pdf_path);outlines=[]
 assert 4<=max(numbers.values())<=len(reader.pages),'페이지 흐름 보완 필요'
 assert [numbers[target] for target in ('cover','toc','toc-1','read-first')]==[1,2,3,4]
 destinations=pdf_bookmark_pages(pdf_path,[anchor(target) for target in numbers])
 assert all(destinations[anchor(target)]['actual_page']==page for target,page in numbers.items()),'표시 쪽수와 실제 북마크가 다릅니다.'
 def walk(entries,depth=0):
  for entry in entries:
   if isinstance(entry,list):walk(entry,depth+1)
   else:
    title=entry.get('/Title','');page=reader.get_destination_page_number(entry)+1;outlines.append((title,page,depth))
 walk(reader.outline)
 expected_outline=[(p['title'],numbers[p['id']],0) for p in pages if p.get('chapter_open') or p['id'] in {'toc','toc-1','index'}]
 assert [item for item in outlines if item[2]==0]==expected_outline,'PDF top-level outline does not match the Word chapters'
 refs={p.indirect_reference.idnum:idx for idx,p in enumerate(reader.pages,1)}
 front_sizes={}
 for toc in (p for p in pages if p['part']=='목차'):
  targets=([ch['id'] for ch in toc['chapters']]+['toc-1'] if toc['id']=='toc' else
           [target for _,items in toc['quick_groups'] for _,target in items]+['toc'])
  physical=reader.pages[numbers[toc['id']]-1]
  counts=collections.Counter()
  for annotation in physical.get('/Annots',[]):
   obj=annotation.get_object()
   action=obj.get('/A',{})
   dest=obj.get('/Dest',action.get('/D'))
   if not 60<=float(obj['/Rect'][1])<=float(physical.mediabox.height)-60:continue
   if isinstance(dest,list):counts[refs.get(getattr(dest[0],'idnum',None))]+=1
   elif dest is not None:
    try:counts[resolve_goto_page(reader,dest)]+=1
    except DestinationError:raise AssertionError(('Invalid front link destination',toc['id'])) from None
  expected=collections.Counter(numbers[target] for target in targets)
  for target,count in expected.items():assert counts[target]>=2*count,('Missing rendered title/page-number link',toc['id'],target)
  front_sizes[toc['id']]=len(targets)
 links=sum(len(p.get('/Annots',[])) for p in reader.pages)
 report={'logical_blocks':len(pages),'actual_pages':len(reader.pages),'pdf_bookmarks':len(outlines),'pdf_annotations':links,'front_link_rows':front_sizes,'mapped_destinations':len(destinations),'body_forced_page_breaks':0}
 (TMP/'pagination-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 assert links>200
 return report


def reflow_book(pages,logical_numbers,work):
 """Resolve real page numbers and re-render until printed references agree."""
 word=work/DOCX.name;pdf=work/PDF.name
 numbers=logical_numbers
 try:previous=json.loads((TMP/'page-plan.json').read_text())
 except (OSError,ValueError):previous={}
 # A previous layout only seeds the draft labels. Every target is still
 # resolved against the new Word export before anything is published.
 previous=previous.get('numbers') if isinstance(previous,dict) else None
 if isinstance(previous,dict) and set(previous)==set(logical_numbers) and all(type(n) is int and n>=1 for n in previous.values()):
  numbers=previous
 for attempt in range(1,5):
  save_docx(pages,numbers,word)
  export_pdf(word,pdf)
  layout=map_plan_pages(pdf,pages,logical_numbers,docx_path=word)
  actual=layout['numbers']
  print(json.dumps({'stage':'reflow','pass':attempt,'physical_pages':layout['physical_pages'],
                    'changed_page_references':sum(numbers[k]!=actual[k] for k in numbers)}),flush=True)
  if numbers==actual:return word,pdf,layout
  numbers=actual
 raise RuntimeError('목차·색인의 실제 쪽수가 안정화되지 않았습니다.')


def rasterize_print_copy(pdf,physical):
 """Inspect the exact export that supplies the Word bookmarks and page numbers."""
 render=TMP/'render';render.mkdir(exist_ok=True)
 with TemporaryDirectory(prefix='render-',dir=TMP) as stage:
  images=convert_from_path(pdf,dpi=105,fmt='png',thread_count=8,
                           output_folder=stage,paths_only=True,output_file='page')
  assert len(images)==physical,'렌더 이미지와 PDF 쪽수 불일치'
  for stale_page in render.glob('page-*.png'):stale_page.unlink()
  for page,image in enumerate(images,1):shutil.move(image,render/f'page-{page}.png')
 shutil.copy2(pdf,render/PDF.name)


def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');parser.add_argument('--docx-only',action='store_true');args=parser.parse_args()
 if args.check:check();return
 from render_operation_balance_v06 import verify_source
 verify_source()
 OUTPUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
 subprocess.run([str(BUNDLE/'node/bin/node'),str(HERE/'create_cover_art.mjs')],check=True)
 TMP.mkdir(parents=True,exist_ok=True)
 fontconfig=TMP/'fonts.conf';fontconfig.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>/Library/Fonts</dir><dir>/System/Library/Fonts</dir><cachedir>'+str(TMP/'font-cache')+'</cachedir></fontconfig>')
 os.environ['FONTCONFIG_FILE']=str(fontconfig);os.environ['SAL_FONTPATH']='/System/Library/Fonts:/Library/Fonts'
 pages,logical_numbers,counts,entries=plan_book()
 with TemporaryDirectory(prefix='flow-',dir=TMP) as stage:
  word,pdf,layout=reflow_book(pages,logical_numbers,Path(stage))
  numbers=layout['numbers'];physical=layout['physical_pages']
  if not args.docx_only:
   report=verify_pdf(pages,numbers,pdf)
   rasterize_print_copy(pdf,physical)
   shutil.copy2(pdf,PDF)
  shutil.copy2(word,DOCX)
  (TMP/'page-plan.json').write_text(json.dumps({'pages':pages,'numbers':numbers,'physical_pages':physical,'counts':counts,'index_entries':entries},ensure_ascii=False,indent=2)+'\n')
  (TMP/'bookmark-pages.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
 if args.docx_only:return
 manifest={'book_version':f'{VERSION}-guidebook-1','date':BOOK_DATE.isoformat(),'pages':physical,'indexed_terms':len(entries),'counts':counts,
           'sources':inputs(),'outputs':{str(p.relative_to(HERE)):sha(p) for p in [DOCX,PDF]},'pagination':report,'font':{'family':FONT,'file':FONT_FILE,'sha256':sha(FONT_FILE)}}
 MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'pass','pages':physical,'index_terms':len(entries),'sources':len(manifest['sources']),**report},ensure_ascii=False))
if __name__=='__main__':main()
