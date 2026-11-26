#!/usr/bin/env node
/** Static planning images derived from the canonical Markdown; no game state. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');
const ROOT = path.resolve(__dirname, '../..');
const source = path.join(ROOT, 'docs/current/research-trees.md');
const output = path.join(ROOT, 'docs/visuals/research-tree-v06');
const markdown = fs.readFileSync(source, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(markdown).digest('hex');
const definitions = [
  {key:'ops', name:'운영', color:'#A36A14', soft:'#FBF1DD', caption:'부지 · 시설 · 생산 · 방문객'},
  {key:'care', name:'사육', color:'#327347', soft:'#EAF3E5', caption:'돌봄 · 부화 · 환경 · 안전'},
  {key:'exp', name:'탐험', color:'#16798B', soft:'#E4F1F2', caption:'권역 · 시료 · 지형 · 현장 조사'},
  {key:'gene', name:'유전', color:'#77519B', soft:'#F0EAF5', caption:'원종 · 계통 · 조합 · 연구 효율'},
];
const C = {ink:'#193C2B', muted:'#526859', line:'#D6E0D3', bg:'#F5F8F0', white:'#FFFFFF'};
const W=1940,H=1450,NW=270,NH=108,PAD=64,TOP=225,GH=1082;
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function table(key) {
  const tag=`tech:nodes-${key}`;
  const block=markdown.split(`<!-- ${tag} -->`)[1]?.split(`<!-- /${tag} -->`)[0];
  if(!block) throw new Error(`Missing ${tag}`);
  const rows=block.split('\n').filter(x=>x.startsWith('|')).map(x=>x.trim().slice(1,-1).split('|').map(x=>x.trim()));
  return rows.slice(2).map(cells=>Object.fromEntries(rows[0].map((name,i)=>[name,cells[i]])));
}
const familyNodes = new Map(definitions.map(({key}) => [key, table(key)]));
const all = [...familyNodes.values()].flat();
const byId=new Map(all.map(n=>[n.id,n]));
if(all.length!==69 || byId.size!==all.length)throw new Error('Expected 69 unique nodes');
function parents(n) {return n['선행']==='-'?[]:n['선행'].split(',').map(s=>{const [id,level]=s.split(':');return {id,level:Number(level)};});}
const edges=all.flatMap(n=>parents(n).map(p=>({from:p.id,to:n.id,level:p.level})));
const roots=all.filter(n=>!parents(n).length);
const labCache=new Map();
function requiredLab(id,rank=1){const key=id+':'+rank;if(labCache.has(key))return labCache.get(key);const n=byId.get(id);const own=Number(n['연구소단계'].split(',')[rank-1]);const result=Math.max(own,...parents(n).map(p=>requiredLab(p.id,p.level)));labCache.set(key,result);return result;}
if(edges.length!==63 || roots.length!==7)throw new Error('Canonical edge/root counts changed; review the diagram');
function text(x,y,label,size=24,weight=500,fill=C.ink,extra='') {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(label)}</text>`;
}
function pill(x,y,label,fill,color,size=17) {
  const width=label.length*size*.78+26;
  return `<rect x="${x}" y="${y-23}" width="${width}" height="32" rx="16" fill="${fill}"/>`+text(x+13,y,label,size,600,color);
}
function icon(key,x,y,color,size=54) {
  const paths={
    ops:'<path d="M4 21h16M6 21V9l6-5 6 5v12M10 21v-7h4v7M3 9h18"/>',
    care:'<path d="M20 4C11 3 5 7 5 13c0 5 5 8 9 5 5-3 6-9 6-14Z M5 21l11-12 M5 13l5 2"/>',
    exp:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 3-6 5-2Z"/>',
    gene:'<path d="M7 2c0 9 10 11 10 20M17 2c0 9-10 11-10 20 M8 5h8 M9 9h6 M9 15h6 M8 19h8"/>',
  };
  return `<g transform="translate(${x},${y}) scale(${size/24})" fill="none" stroke="${color}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[key]}</g>`;
}
function layout(nodes) {
  const map=new Map(nodes.map(n=>[n.id,n]));const memo=new Map();
  function depth(id,seen=new Set()) {
    if(memo.has(id))return memo.get(id);
    if(seen.has(id))throw new Error('Cycle');seen.add(id);
    const ps=parents(map.get(id));
    for(const p of ps)if(!map.has(p.id))throw new Error('Unexpected cross-family prerequisite');
    const d=ps.length?1+Math.max(...ps.map(p=>depth(p.id,new Set(seen)))):0;memo.set(id,d);return d;
  }
  const cols=[];for(const n of nodes){const d=depth(n.id);(cols[d]??=[]).push(n);}
  // Barycentric ordering keeps siblings together without inventing prerequisites.
  const children=new Map(nodes.map(n=>[n.id,[]]));for(const n of nodes)for(const p of parents(n))children.get(p.id).push(n.id);
  let positions=new Map();
  function place(){positions=new Map();cols.forEach((col,d)=>{
    const slot=GH/col.length;
    col.forEach((n,i)=>positions.set(n.id,{x:PAD+d*(W-2*PAD-NW)/(cols.length-1),y:TOP+slot*(i+.5)-NH/2,d}));
  });}
  place();
  for(let loop=0;loop<10;loop++){
    for(let d=1;d<cols.length;d++){
      cols[d].sort((a,b)=>average(parents(a).map(p=>positions.get(p.id).y))-average(parents(b).map(p=>positions.get(p.id).y)));place();
    }
    for(let d=cols.length-2;d>=0;d--){
      cols[d].sort((a,b)=>average(children.get(a.id).map(id=>positions.get(id).y),positions.get(a.id).y)-average(children.get(b.id).map(id=>positions.get(id).y),positions.get(b.id).y));place();
    }
  }
  function average(xs,fallback=0){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:fallback;}
  for(const [id,p]of positions){if(p.x<PAD-.1||p.y<TOP-1||p.x+NW>W-PAD+1||p.y+NH>H-90)throw new Error(`Out of bounds ${id}`);}
  for(const col of cols)for(let i=1;i<col.length;i++)if(positions.get(col[i].id).y-positions.get(col[i-1].id).y<NH+15)throw new Error('Node collision');
  return {positions,cols};
}
function panel(d) {
  const ns=familyNodes.get(d.key);
  const {positions,cols}=layout(ns);
  let s=`<g id="panel-${d.key}"><rect width="${W}" height="${H}" rx="28" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>`;
  s+=`<rect x="0" y="0" width="${W}" height="154" rx="28" fill="${d.soft}"/><rect x="0" y="110" width="${W}" height="44" fill="${d.soft}"/>`;
  s+=icon(d.key,58,42,d.color,62)+text(142,85,d.name,45,700,d.color)+text(145,121,d.caption,22,500,C.muted);
  s+=pill(W-273,68,`${ns.length}개 기술`,C.white,d.color,23);
  s+=text(W-280,119,'각 항목 최대 Lv.3 또는 5',19,500,C.muted);
  s+=text(64,196,'실제 선행 관계 →',19,600,C.muted)+text(W-64,196,'연결선 Lv. = 필요한 선행 기술 레벨',18,400,C.muted,'text-anchor="end"');
  const local=edges.filter(e=>byId.get(e.to)['계열']===d.name);
  // Connectors are drawn first, so cards remain unobstructed.
  for(const [index,e]of local.entries()){
    const a=positions.get(e.from),b=positions.get(e.to),x1=a.x+NW,y1=a.y+NH/2,x2=b.x,y2=b.y+NH/2;
    const dx=x2-x1,mid=x1+dx*.50;
    s+=`<path data-edge="${e.from}:${e.to}" d="M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2-8},${y2}" fill="none" stroke="${d.color}" stroke-opacity=".53" stroke-width="2.6" marker-end="url(#arrow-${d.key})"/>`;
    const t=.56, u=1-t;
    const lx=u*u*u*x1+3*u*u*t*mid+3*u*t*t*mid+t*t*t*(x2-8);
    const ly=u*u*u*y1+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y2;
    s+=`<g data-edge-label="${index}"><rect x="${lx-30}" y="${ly-12}" width="60" height="24" rx="12" fill="${C.white}" stroke="${d.color}" stroke-opacity=".24"/>`+text(lx,ly+6,`Lv.${e.level}`,16,600,d.color,'text-anchor="middle"')+'</g>';
  }
  for(const n of ns){
    const p=positions.get(n.id), name=n['항목'];const nameFont=(name.replaceAll(' ','').length>9?23:25);
    s+=`<g data-node="${n.id}"><title>${esc(name+' — '+n['목적'])}</title><rect x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="15" fill="${C.white}" stroke="${C.line}" stroke-width="1.8"/><rect x="${p.x}" y="${p.y+16}" width="5" height="${NH-32}" rx="2.5" fill="${d.color}"/>`;
    s+=text(p.x+18,p.y+25,n['분야'],15,500,C.muted);
    s+=`<rect x="${p.x+NW-109}" y="${p.y+10}" width="94" height="24" rx="12" fill="${d.soft}"/>`+text(p.x+NW-51,p.y+27,`최대 Lv.${n.max}`,14,600,d.color,'text-anchor="middle"');
    s+=text(p.x+18,p.y+61,name,nameFont,650,C.ink);
    s+=text(p.x+18,p.y+88,`시작 연구소 Lv.${requiredLab(n.id)}`,16,400,C.muted);
    s+='</g>';
  }
  s+=`<line x1="64" y1="1366" x2="${W-64}" y2="1366" stroke="${C.line}"/>`;
  s+=text(64,1404,`${d.name} · 선행 조건을 충족한 서로 다른 기술을 연구원 수만큼 병렬 진행합니다.`,19,500,C.muted);
  s+=`</g>`;return {svg:s,nodes:ns.map(n=>n.id),edges:local.length,columns:cols.map(c=>c.length)};
}
function defs(){return `<defs>${definitions.map(d=>`<marker id="arrow-${d.key}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${d.color}" fill-opacity=".7"/></marker>`).join('')}</defs>`;}
function wrap(content,width,height,label){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}"><style>text{font-family:'Apple SD Gothic Neo','Arial Unicode MS',sans-serif;}</style>${defs()}${content}</svg>`;}
async function main(){
  fs.mkdirSync(output,{recursive:true});
  const panels=definitions.map(d=>({d,...panel(d)}));
  const posterW=W*2+168,posterH=H*2+470;
  const mascot=fs.readFileSync(path.join(ROOT,'apps/client/public/assets/placeholders/parasaurolophus.svg')).toString('base64');
  let body=`<rect width="${posterW}" height="${posterH}" fill="${C.bg}"/>`;
  body+=text(76,90,'DINO PARK  /  RESEARCH MAP',22,700,'#45724E','letter-spacing="4"');
  body+=text(76,171,'다이노 파크 연구 스킬트리',66,750,C.ink);
  body+=text(78,228,`4개 계열 · 총 ${all.length}개 기술`,31,500,C.muted);
  body+=text(78,275,'연구소 성장 → 선행 기술 완료 → 부지·시설·새 지역·공룡 연구 개방',25,500,C.muted);
  body+=`<image href="data:image/svg+xml;base64,${mascot}" x="${posterW-235}" y="45" width="140" height="130"/>`;
  body+=pill(posterW-600,228,'기획 0.6 · 전체 구조안','#E7EEDC','#366042',23);
  panels.forEach((p,i)=>{const x=64+(i%2)*(W+40),y=326+Math.floor(i/2)*(H+40);body+=`<g transform="translate(${x},${y})">${p.svg}</g>`;});
  body+=text(78,posterH-74,'카드의 최대값은 해당 기술의 최대 레벨입니다. 연구소 조건은 기술 강화에 따라 추가로 높아집니다.',23,500,C.muted);
  body+=text(78,posterH-35,'연구별 자원·시간·레벨 효과와 스토리 조건은 플레이 가이드에서 확인하세요.',21,400,C.muted);
  const poster=wrap(body,posterW,posterH,`다이노 파크 4계열 ${all.length}개 기술의 선행 스킬트리`);
  const assets=[{name:'research-tree-overview',svg:poster,width:posterW,height:posterH},...panels.map(p=>({name:`research-tree-${p.d.key}`,svg:wrap(p.svg,W,H,`${p.d.name} ${p.nodes.length}개 기술 선행 트리`),width:W,height:H}))];
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({deviceScaleFactor:1});
  const labelFailures=[];
  for(const a of assets){
    fs.writeFileSync(path.join(output,a.name+'.svg'),a.svg);
    await page.setViewportSize({width:a.width,height:a.height});
    await page.setContent(`<html lang="ko"><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${a.width}px;height:${a.height}px}svg{display:block}</style>${a.svg}</html>`);
    await page.evaluate(()=>document.fonts.ready);
    const labels=await page.locator('[data-node] text').evaluateAll(els=>els.filter(el=>!el.textContent.startsWith('최대')&&el.getAttribute('font-size')>=23).map(el=>({label:el.textContent,w:el.getBBox().width})).filter(x=>x.w>236));
    labelFailures.push(...labels);
    await page.screenshot({path:path.join(output,a.name+'.png'),fullPage:true});
  }
  await browser.close();
  if(labelFailures.length)throw new Error(`Text exceeds card: ${JSON.stringify(labelFailures)}`);
  const report={source:'docs/current/research-trees.md',sourceSha256,nodeCount:all.length,edgeCount:edges.length,rootCount:roots.length,accountState:false,requiredFirstLab:Object.fromEntries(all.map(n=>[n.id,requiredLab(n.id)])),labelOverflow:labelFailures,families:panels.map(p=>({key:p.d.key,nodes:p.nodes.length,edges:p.edges,columns:p.columns})),files:assets.map(a=>({name:a.name,width:a.width,height:a.height}))};
  fs.writeFileSync(path.join(output,'render-check.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(err=>{console.error(err);process.exitCode=1;});
