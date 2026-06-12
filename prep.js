// ═══ prep.js — Режим «Подготовка»: РД → Тендер → Контракт ═══
// Подключение: см. порядок <script> в index.html (важен!)
//
// Источник — «Список работ», колонки на каждую фазу (РД/Тендер/Контракт):
//   «<Фаза> / Готовность»       — чекбокс TRUE, когда фаза закрыта
//   «<Фаза> / Начало работ»     — когда фазу надо НАЧАТЬ (дедлайн старта)
//   «<Фаза> / Дата готовности»  — к какой дате фаза должна быть готова
//   «<Фаза> / Длительность»     — дней на фазу
// Математика дедлайнов — формулами в таблице (обратный отсчёт от первого
// старта работ в БД); здесь только разбор и отображение.

const PREP_PHASES = [
  {key:'РД',       lbl:'prepRd'},
  {key:'Тендер',   lbl:'prepTender'},
  {key:'Контракт', lbl:'prepContract'},
];

// Статус фазы на сегодня:
//   ok   — готовность TRUE
//   late — не готово, дата готовности уже прошла
//   run  — не готово, начинать уже пора (старт ≤ сегодня)
//   idle — не готово, старт ещё впереди
//   none — нет ни дат, ни признака (не настроено)
function prepPhaseStatus(w, phase){
  const ready = parseBool(w[phase+' / Готовность']);
  const start = parseDate(normalizeDate(w[phase+' / Начало работ']));
  const due   = parseDate(normalizeDate(w[phase+' / Дата готовности']));
  const dur   = parseFloat(w[phase+' / Длительность'])||null;
  if(ready===true) return {st:'ok', start, due, dur};
  if(!start && !due && ready===null) return {st:'none', start, due, dur};
  const today=new Date(); today.setHours(0,0,0,0);
  let st='idle', lateDays=0;
  if(due && today>due){ st='late'; lateDays=Math.round((today-due)/86400000); }
  else if(start && today>=start){ st='run'; }
  return {st, start, due, dur, lateDays};
}

function prepCellHtml(w, phase){
  const p = prepPhaseStatus(w, phase);
  if(p.st==='none') return `<td class="pp pp-none">—</td>`;
  const dates = [
    p.start ? `${t('startShort')} ${fmtShort(toDmy(p.start))}` : '',
    p.due   ? `${t('readyBy')} ${fmtShort(toDmy(p.due))}`      : '',
  ].filter(Boolean).join(' · ');
  const dur = p.dur ? `<span class="pp-dur">${p.dur} ${t('durShort')}</span>` : '';
  let badge='';
  if(p.st==='ok')   badge=`<span class="pp-badge ok">✓ ${t('stReady')}</span>`;
  if(p.st==='late') badge=`<span class="pp-badge late">+${p.lateDays}${DAY_LBL[CURRENT_LANG]||'д'} ${t('stLate')}</span>`;
  if(p.st==='run')  badge=`<span class="pp-badge run">${t('stRun')}</span>`;
  if(p.st==='idle') badge=`<span class="pp-badge idle">${t('stIdle')}</span>`;
  return `<td class="pp pp-${p.st}">${badge}<div class="pp-dates">${esc(dates)}</div>${dur}</td>`;
}

function toDmy(d){
  return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();
}

function renderPrep(container){
  // Фильтры «Группа» и «Вид работ» действуют и здесь
  const works = CONFIG.works.filter(w=>inGroup(w)&&workSelected(w));

  // Сортируем по дедлайну контракта (= старту работ): что горит — наверху
  const rows = works.slice().sort((a,b)=>{
    const da=parseDate(normalizeDate(a['Контракт / Дата готовности']));
    const db=parseDate(normalizeDate(b['Контракт / Дата готовности']));
    return (da?da.getTime():Infinity)-(db?db.getTime():Infinity);
  });

  // Риск-баннер: просроченные фазы
  let lateCnt=0;
  rows.forEach(w=>PREP_PHASES.forEach(ph=>{ if(prepPhaseStatus(w,ph.key).st==='late') lateCnt++; }));

  let h='';
  h+=`<div class="prep-head"><b>${t('byPrep')}</b>`;
  if(lateCnt) h+=` <span class="risk-pill">⚠ ${t('stLate')}: ${lateCnt}</span>`;
  h+=`</div>`;

  h+=`<div class="sum-card"><table class="prep-tbl"><thead><tr>`+
     `<th class="pp-work">${esc(t('colWork'))}</th>`+
     PREP_PHASES.map(ph=>`<th>${esc(t(ph.lbl))}</th>`).join('')+
     `<th class="pp-start">${esc(t('prepStart'))}</th>`+
     `</tr></thead><tbody>`;

  rows.forEach(w=>{
    const name = w['Вид работ'];
    const wc = workColor(name);
    const dot = `<span class="dot" style="background:${wc||'var(--brd2)'}"></span>`;
    const startWork = normalizeDate(w['Контракт / Дата готовности']);   // = первый старт в БД
    h+=`<tr>`+
       `<td class="pp-work">${dot}${esc(workLabel(w))}</td>`+
       PREP_PHASES.map(ph=>prepCellHtml(w, ph.key)).join('')+
       `<td class="pp-start">${startWork?fmtShort(startWork):'—'}</td>`+
       `</tr>`;
  });

  h+=`</tbody></table></div>`;
  container.innerHTML=h;
}
