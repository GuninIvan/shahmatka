// ═══ summary.js — Режим «Сводка»: разбор листа и вычисляемый fallback ═══
// Подключение: см. порядок <script> в index.html (важен!)

// ── Сводка: лист «Сводка» из Google как есть ─────────────────────
// ── Сводка ────────────────────────────────────────────────────────
// Лист «Сводка» может содержать несколько таблиц (по группам, по видам
// работ), разделённых пустыми строками. Каждая рисуется карточкой.
// Если листа нет или он пуст — сводка считается из данных шахматки.
// Процент в сводке: просто число, без прогресс-бара.
// gray=true — плановый процент, приглушённый.
function sumBar(pct,gray){
  return `<span class="sum-pct${gray?' plan':''}">${pct}%</span>`;
}
// Числовое значение процента: понимает и «15 %», и долю 0–1 (0.0671 → 7)
function sumPctVal(raw){
  const v=String(raw==null?'':raw).trim();
  if(v==='') return null;
  const n=parseFloat(v.replace(',','.').replace('%','').trim());
  if(isNaN(n)) return null;
  // без знака % и в диапазоне 0..1 — это доля (0.6257 → 63%, 1 → 100%)
  if(!v.includes('%') && Math.abs(n)<=1) return Math.round(n*100);
  return Math.round(n);
}
function sumCellHtml(head,val,prevVal){
  const v=String(val==null?'':val).trim();
  if(/процент|procenat|percent|%/i.test(head)){
    const n=sumPctVal(v);
    if(n!==null) return `<td>${sumBar(n,/план|plan/i.test(head))}</td>`;
  }
  if(/отстав|kašnj|kasnj|lag/i.test(head)){
    const n=parseFloat(v.replace(',','.'));
    if(!isNaN(n)&&n>0) return `<td class="num" style="color:#dc2626;font-weight:700;">+${esc(v)}</td>`;
    if(!isNaN(n)&&n<0) return `<td class="num" style="color:#16a34a;font-weight:700;">${esc(v)}</td>`;
    if(!isNaN(n))      return `<td class="num" style="color:var(--ink3);">—</td>`;
  }
  // повторяющееся значение группирующей колонки — приглушаем
  if(/групп|grup|group/i.test(head) && v!=='' && v===String(prevVal==null?'':prevVal).trim()){
    return `<td style="color:var(--ink3);font-size:10px;">${esc(v)}</td>`;
  }
  if(/^-?\d+([.,]\d+)?$/.test(v)) return `<td class="num">${esc(v)}</td>`;
  return `<td>${esc(v)}</td>`;
}
// Сетка листа → список таблиц: режем по пустым строкам И по пустым колонкам
// (на листе таблицы могут стоять рядом по горизонтали)
function splitSummaryGrid(grid){
  const vblocks=[]; let cur=[];
  grid.forEach(row=>{
    if(row.some(c=>String(c).trim()!=='')) cur.push(row);
    else if(cur.length){ vblocks.push(cur); cur=[]; }
  });
  if(cur.length) vblocks.push(cur);
  const tables=[];
  vblocks.forEach(b=>{
    const W=Math.max(...b.map(r=>r.length));
    const colHas=[];
    for(let c=0;c<W;c++) colHas[c]=b.some(r=>String(r[c]||'').trim()!=='');
    let start=null;
    for(let c=0;c<=W;c++){
      if(c<W && colHas[c]){ if(start===null) start=c; continue; }
      if(start!==null){
        const rows=b.map(r=>r.slice(start,c)).filter(r=>r.some(x=>String(x||'').trim()!==''));
        if(rows.length) tables.push(rows);
        start=null;
      }
    }
  });
  return tables;
}
function renderSummary(sw,empty){
  let html='';
  if(SUMMARY.length){
    splitSummaryGrid(SUMMARY).forEach(b=>{
      let title='';
      if(b.length>1 && b[0].filter(c=>String(c).trim()!=='').length===1){
        title=b[0].find(c=>String(c).trim()!==''); b=b.slice(1);
      }
      if(!b.length) return;
      const head=b[0];
      // нет своего заголовка — даём по составу колонок
      if(!title){
        const hs=head.map(x=>String(x).toLowerCase());
        if(hs.some(x=>/вид работ|vrsta|work type/.test(x))) title=t('sumByWork');
        else if(hs.some(x=>/групп|grup|group/.test(x)))     title=t('sumByGroup');
      }
      html+=`<div class="sum-card">${title?`<div class="sum-title">${esc(title)}</div>`:''}<table class="sum-tbl"><thead><tr>`;
      head.forEach(hd=>{ html+=`<th>${esc(String(hd))}</th>`; });
      html+='</tr></thead><tbody>';
      b.slice(1).forEach((r,ri)=>{
        const prev=ri>0?b[ri]:null;   // b[ri] = предыдущая строка данных (b сдвинут на header)
        html+='<tr>'+head.map((hd,i)=>sumCellHtml(hd,r[i],prev?prev[i]:null)).join('')+'</tr>';
      });
      html+='</tbody></table></div>';
    });
  } else {
    html=computedSummaryHtml();   // лист пуст — считаем сами
  }
  sw.innerHTML=html;
}

// Сводка из данных шахматки: по группам работ и по видам работ
function allCellsOf(w){
  // все применимые ячейки работы БЕЗ учёта фильтров интерфейса
  const unit=String(w['Единица приемки']||'').trim(), out=[];
  if(unit==='Этаж секция'){
    CONFIG.sections.forEach(s=>{
      const sec=s['Секция'], a=parseInt(s['Этажи выше 0.000'])||0, b=parseInt(s['Этажи ниже 0.000'])||0;
      for(let f=-b;f<=-1;f++) if(isWorkApplicable(w,sec,f)) out.push(getCell(sec,f,w['Вид работ']));
      for(let f=1;f<=a;f++)   if(isWorkApplicable(w,sec,f)) out.push(getCell(sec,f,w['Вид работ']));
    });
  } else if(unit==='Секция'){
    CONFIG.sections.forEach(s=>{ if(isWorkApplicable(w,s['Секция'],null)) out.push(getCell(s['Секция'],'',w['Вид работ'])); });
  } else if(unit==='Площадка'){
    out.push(getCell('','',w['Вид работ']));
  }
  return out;
}
function sumAggRow(label, cells){
  const total=cells.length;
  const done=cells.filter(c=>c.pct===100).length;
  const prog=cells.filter(c=>c.pct>0&&c.pct<100).length;
  const avg=total?Math.round(cells.reduce((a,c)=>a+c.pct,0)/total):0;
  const dev=cells.reduce((m,c)=>c.dev!==null&&c.dev>m?c.dev:m,0);
  return `<tr><td>${esc(label)}</td><td class="num">${total}</td><td class="num">${done}</td><td class="num">${prog}</td><td>${sumBar(avg)}</td>`+
    `<td class="num"${dev>0?' style="color:#dc2626;font-weight:700;"':''}>${dev>0?'+'+dev+DAY_LBL[CURRENT_LANG]:'—'}</td></tr>`;
}
function computedSummaryHtml(){
  const headRow=`<thead><tr><th></th><th>${t('total')}</th><th>${t('done')}</th><th>${t('inProg')}</th><th>${t('avgPct')}</th><th>${t('maxDev')}</th></tr></thead>`;
  // по группам
  const gorder=[];
  CONFIG.works.forEach(w=>{ const g=String(w['Группа работ']||'').trim(); if(g&&!gorder.includes(g)) gorder.push(g); });
  let h=`<div class="sum-card"><div class="sum-title">${t('sumByGroup')}</div><table class="sum-tbl">${headRow}<tbody>`;
  gorder.forEach(g=>{
    const cells=[];
    CONFIG.works.filter(w=>String(w['Группа работ']||'').trim()===g).forEach(w=>cells.push(...allCellsOf(w)));
    if(cells.length) h+=sumAggRow(groupLabel(g),cells);
  });
  h+='</tbody></table></div>';
  // по видам работ (в порядке: поэтажные → на секцию → на площадку)
  h+=`<div class="sum-card"><div class="sum-title">${t('sumByWork')}</div><table class="sum-tbl">${headRow}<tbody>`;
  ['Этаж секция','Секция','Площадка'].forEach(unit=>{
    CONFIG.works.filter(w=>String(w['Единица приемки']||'').trim()===unit).forEach(w=>{
      const cells=allCellsOf(w);
      if(cells.length) h+=sumAggRow(workLabel(w),cells);
    });
  });
  h+='</tbody></table></div>';
  return h;
}

