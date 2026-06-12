// ═══ render.js — Роутер режимов: какой экран рисовать ═══
// Подключение: см. порядок <script> в index.html (важен!)

// ── RENDER ────────────────────────────────────────────────────────
function render(){
  saveFilters();   // фильтры переживают перезагрузку страницы
  const dl = document.getElementById('deadlineInp').value;   // yyyy-mm-dd
  DEADLINE = dl ? new Date(dl+'T23:59:59') : null;
  // Риск-панель видна на всех вкладках (к выбранной дате или к сегодня)
  const riskDL = DEADLINE || (()=>{const x=new Date(); x.setHours(23,59,59,0); return x;})();
  renderRiskPanel(riskDL);
  const board=document.getElementById('board');
  const empty=document.getElementById('emptyState');
  const sub=document.getElementById('subBoards');
  const gw=document.getElementById('ganttWrap');
  const sw=document.getElementById('sumWrap');
  const tw=document.getElementById('tasksWrap');
  const pw=document.getElementById('prepWrap');
  if(MODE!=='work')    sub.innerHTML='';
  if(MODE!=='gantt'){  gw.innerHTML='';  } gw.style.display = MODE==='gantt' ?'block':'none';
  if(MODE!=='summary'){sw.innerHTML='';  } sw.style.display = MODE==='summary'?'block':'none';
  if(MODE!=='tasks'){  tw.innerHTML='';  } tw.style.display = MODE==='tasks' ?'block':'none';
  if(MODE!=='prep'){   pw.innerHTML='';  } pw.style.display = MODE==='prep'  ?'block':'none';
  if(MODE==='prep'){ board.style.display='none'; board.innerHTML=''; empty.style.display='none'; renderPrep(pw); return; }
  if(MODE==='summary'){ board.style.display='none'; board.innerHTML=''; empty.style.display='none'; renderSummary(sw,empty); return; }
  if(!CONFIG.sections.length){board.style.display='none';empty.style.display='flex';return;}
  empty.style.display='none';
  if(MODE==='gantt'){
    board.style.display='none'; board.innerHTML='';
    renderGantt(gw);
  } else if(MODE==='tasks'){
    board.style.display='none'; board.innerHTML='';
    renderTasks(tw);
  } else {
    board.style.display='table';
    MODE==='section' ? renderBySection(board) : renderByWork(board);
  }
}


// ── РИСК-ПАНЕЛЬ (на всех вкладках, сворачиваемая) ────────────────
// 1) «Фронт закрыт»: по сроку работать уже надо (есть цель к дате),
//    а предшественник не готов. Срыв планирования, не подрядчика.
// 2) «Контракт не заключён»: старт работ ≤ выбранной даты, договора нет.
let RISK_OPEN = localStorage.getItem('shk_risk_open')!=='0';

function computeRisks(DL){
  const noFront=[], noContractMap=new Map();
  CONFIG.works.forEach(w=>{
    const name=w['Вид работ'];
    const unit=String(w['Единица приемки']||'').trim();
    const cells=[];
    if(unit==='Этаж секция'){
      CONFIG.sections.forEach(s=>{
        const a=parseInt(s['Этажи выше 0.000'])||0, b=parseInt(s['Этажи ниже 0.000'])||0;
        for(let f=a;f>=1;f--)  if(isWorkApplicable(w,s['Секция'],f)) cells.push({sec:s['Секция'],floor:f});
        for(let f=-1;f>=-b;f--) if(isWorkApplicable(w,s['Секция'],f)) cells.push({sec:s['Секция'],floor:f});
      });
    } else if(unit==='Секция'){
      CONFIG.sections.forEach(s=>{ if(isWorkApplicable(w,s['Секция'],null)) cells.push({sec:s['Секция'],floor:''}); });
    } else if(unit==='Площадка'){
      cells.push({sec:'',floor:''});
    }
    cells.forEach(c=>{
      const d=getCell(c.sec,c.floor,name);
      if(!d.found) return;
      const tt=taskTarget(d,DL);
      if(tt!==null && d.front===false){
        const label = c.floor!=='' ? `${t('sectionPrefix')} ${c.sec} · ${c.floor} ${t('floorShort')}`
                    : c.sec!==''   ? `${t('sectionPrefix')} ${c.sec}` : t('onSiteOpt');
        noFront.push({w, label, predReady:d.predReady});
      }
      // контракт: старт уже ≤ выбранной даты, а договора нет
      if(d.contract===false && d.pct<100){
        const sd=parseDate(d.startDate);
        if(sd && sd<=DL){
          const prev=noContractMap.get(name);
          if(!prev || sd<prev.start) noContractMap.set(name,{w, start:sd});
        }
      }
    });
  });
  return {noFront, noContract:[...noContractMap.values()].sort((a,b)=>a.start-b.start)};
}

function renderRiskPanel(DL){
  const rw=document.getElementById('riskWrap');
  if(!rw) return;
  const {noFront, noContract}=computeRisks(DL);
  if(!noFront.length && !noContract.length){ rw.innerHTML=''; rw.style.display='none'; return; }
  rw.style.display='block';
  const sum=[
    noFront.length   ? `🔒 ${noFront.length}`   : '',
    noContract.length? `✍ ${noContract.length}` : ''
  ].filter(Boolean).join(' · ');
  let h=`<div class="risk-card${RISK_OPEN?'':' closed'}">`;
  h+=`<div class="risk-hdr" onclick="toggleRisk()"><b>⚠ ${t('risksTitle')}</b> <span class="risk-sum">${sum}</span><span class="risk-arr">${RISK_OPEN?'▾':'▸'}</span></div>`;
  if(RISK_OPEN){
    if(noFront.length){
      h+=`<div class="risk-line"><b>🔒 ${t('riskNoFront')} · ${noFront.length}</b></div>`;
      h+=`<div class="risk-items">`+noFront.slice(0,12).map(i=>{
        const pr=(i.predReady!==null)?` ${i.predReady}%`:'';
        return `<span class="risk-it">${esc(workLabel(i.w))} · ${esc(i.label)}${pr}</span>`;
      }).join('')+(noFront.length>12?` <span class="risk-it">+${noFront.length-12}…</span>`:'')+`</div>`;
    }
    if(noContract.length){
      h+=`<div class="risk-line"><b>✍ ${t('noContract')} · ${noContract.length}</b></div>`;
      h+=`<div class="risk-items">`+noContract.map(i=>{
        return `<span class="risk-it">${esc(workLabel(i.w))} · ${t('startShort')} ${esc(toDmy(i.start))}</span>`;
      }).join('')+`</div>`;
    }
  }
  h+=`</div>`;
  rw.innerHTML=h;
}

function toggleRisk(){
  RISK_OPEN=!RISK_OPEN;
  try{ localStorage.setItem('shk_risk_open', RISK_OPEN?'1':'0'); }catch(e){}
  render();
}
