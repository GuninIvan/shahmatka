// ═══ core.js — API, цвета/отставание, язык, состояние, init, авторизация, загрузка данных ═══
// Подключение: см. порядок <script> в index.html (важен!)

const API = 'https://script.google.com/macros/s/AKfycbzEXg-pV4xOZmZ0uEmlcrJwbf3L9yCxkHkS9G_Tvm8omk6d3q24iyClcKFWcZ7-FjfXVw/exec';

// ── ЦВЕТ полоски ─────────────────────────────────────────────────
// Запасной вариант (нет данных об отставании): по проценту
// 0% → серый трек, 1–99% → красный→жёлтый, 100% → зелёный
function barColor(pct) {
  if (pct === 0)   return null;
  if (pct === 100) return '#2f9e44';
  const hue = Math.round((pct / 99) * 60);
  return `hsl(${hue},${pct < 50 ? 75 : 78}%,${pct < 50 ? 50 : 43}%)`;
}

// ── ЦВЕТ по отставанию ───────────────────────────────────────────
// 1 день — уже жёлтый (hue 50), 30+ дней — красный (hue 0)
function devHue(dev){
  const x = Math.min(Math.max(dev,1),30);
  return Math.round(50 * (1 - (x-1)/29));
}
// Цвет полоски: приоритет — отставание; нет данных — по проценту
function cellBarColor(d){
  if (d.pct === 100) return '#2f9e44';
  if (d.dev !== null){
    if (d.dev > 0) return `hsl(${devHue(d.dev)},80%,45%)`;
    return '#2f9e44';                       // в графике / опережение
  }
  return barColor(d.pct);
}
// Заливка всей карточки. Не начали и отставания нет — не красим.
function cellTint(d){
  if (d.pct === 100 || d.dev === null) return '';
  if (d.dev > 0)  return `hsl(${devHue(d.dev)},75%,93%)`;   // отстаёт
  if (d.pct > 0)  return 'hsl(140,45%,94%)';                // идёт в графике
  return '';                                                 // не начата, не отстаёт
}

// Метки секции/этажа по языку
const SEC_LBL = { ru:'с', sr:'s', en:'s' };
const FL_LBL  = { ru:'э', sr:'sp', en:'fl' };
const DAY_LBL = { ru:'д', sr:'d', en:'d' };   // суффикс дней в отставании

// ── Цвет колонки работы: фон ячейки «Вид работ» в Google-таблице ──
function workColor(name){
  const w = CONFIG.works.find(x=>String(x['Вид работ'])===String(name));
  const c = w && String(w['Цвет']||'').trim();
  return (c && /^#[0-9a-f]{6}$/i.test(c)) ? c : '';
}
function hexA(hex,a){   // #rrggbb -> rgba(r,g,b,a)
  const n=parseInt(hex.slice(1),16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
// Подчёркивание названия работы в шапке полосой её цвета
function thWork(w){
  const c=workColor(w['Вид работ']);
  return `<th class="h-work"${c?` style="box-shadow:inset 0 -3px 0 ${c}"`:''}>${esc(workLabel(w))}</th>`;
}

// Перевод названия работы ТОЛЬКО для отображения.
// В базу и в ключ всегда уходит русское w['Вид работ'].
// Колонки в «Списке работ»: «Вид работ SR», «Вид работ EN».
function workLabel(w){
  if(CURRENT_LANG==='sr' && String(w['Вид работ SR']||'').trim()) return String(w['Вид работ SR']).trim();
  if(CURRENT_LANG==='en' && String(w['Вид работ EN']||'').trim()) return String(w['Вид работ EN']).trim();
  return w['Вид работ'];
}
// Перевод названия группы (колонки «Группа работ SR/EN»)
function groupLabel(g){
  const w = CONFIG.works.find(x=>String(x['Группа работ']||'').trim()===g);
  if(w){
    if(CURRENT_LANG==='sr' && String(w['Группа работ SR']||'').trim()) return String(w['Группа работ SR']).trim();
    if(CURRENT_LANG==='en' && String(w['Группа работ EN']||'').trim()) return String(w['Группа работ EN']).trim();
  }
  return g;
}

// ── ЯЗЫК ─────────────────────────────────────────────────────────
let CURRENT_LANG = 'ru';
function t(key){ return (LANG[CURRENT_LANG]&&LANG[CURRENT_LANG][key]) ? LANG[CURRENT_LANG][key] : key; }

function setLang(lang){
  CURRENT_LANG = lang;
  localStorage.setItem('shk_lang', lang);
  ['ru','sr','en'].forEach(l => document.getElementById('lang-'+l).classList.toggle('on', l===lang));
  applyLang();
  render();
}

function applyLang(){
  document.getElementById('ui-title').textContent      = t('title');
  document.getElementById('ui-refresh').textContent    = t('refresh');
  document.getElementById('mode-sec').textContent      = t('bySection');
  document.getElementById('mode-work').textContent     = t('byWork');
  document.getElementById('mode-gantt').textContent    = t('byGantt');
  document.getElementById('mode-tasks').textContent    = t('byTasks');
  document.getElementById('mode-sum').textContent      = t('bySummary');
  document.getElementById('ui-deadlineLbl').textContent= t('deadlineLbl');
  document.getElementById('ui-showBtn').textContent    = t('showBtn');
  document.getElementById('ui-sectionLbl').textContent = t('sectionLbl');
  document.getElementById('ui-cutLbl').textContent     = t('cutLbl');
  document.getElementById('ui-groupLbl').textContent   = t('groupLbl');
  document.getElementById('ui-workLbl').textContent    = t('workLbl');
  document.getElementById('ui-pctLabel').textContent   = t('pctLabel');
  document.getElementById('ui-cancel').textContent     = t('cancel');
  document.getElementById('saveBtn').textContent       = t('save');
  document.getElementById('ui-loading').textContent    = t('loading');
  document.getElementById('ui-hint').textContent       = t('hint');
  document.title = t('title');
  rebuildSecChips();        // чипы секций тоже перестраиваются при смене языка
  rebuildCutFilter();
  rebuildGroupFilter();
  rebuildWorkFilter();
  buildViewPanel();
  renderUserArea();
}

// ── ДАННЫЕ / СОСТОЯНИЕ ───────────────────────────────────────────
let CONFIG = { works:[], sections:[] };
let DATA   = {};
let SUMMARY= [];
let MODE   = 'section';
// «Что показывать» в ячейке (галочки), хранится в localStorage
let SHOW = { pct:true, dstart:false, dend:true, dev:true, sec:true, fl:true };
try{ const s=JSON.parse(localStorage.getItem('shk_show')||'null'); if(s) SHOW=Object.assign(SHOW,s);}catch(e){}
let DEADLINE = null;   // режим «к дате»: Date или null
let FILTER_SEC   = new Set();
let FILTER_CUT   = new Set();   // «Разрез»: номера этажей (строки), '__sec__', '__site__'; пусто = всё
let FILTER_WORK  = new Set();   // выбранные виды работ (русские ID); пусто = все
let FILTER_GROUP = new Set();   // выбранные группы; пусто = все
let CUR    = null;
let userName  = '';
let USER      = null;    // {name, role, sections} после входа по паролю
let OPEN_MODE = false;   // true, если в таблице нет листа «Роли» — доступ всем

// ── INIT ─────────────────────────────────────────────────────────
window.onload = async () => {
  CURRENT_LANG = localStorage.getItem('shk_lang') || 'ru';
  userName = localStorage.getItem('shk_name') || '';
  ['ru','sr','en'].forEach(l => document.getElementById('lang-'+l).classList.toggle('on', l===CURRENT_LANG));
  applyLang();
  initDelegation();
  await Promise.all([initAuth(), loadAll()]);
};
function saveName(v){ userName=v.trim(); localStorage.setItem('shk_name',userName); }

// Делегирование кликов: ячейки и чипы секций без inline-onclick —
// названия работ с кавычками/апострофами больше ничего не ломают
function initDelegation(){
  document.getElementById('board').addEventListener('click', e => {
    const td = e.target.closest('td.cell');
    if(!td || td.classList.contains('na')) return;
    openModal(td.dataset.sec, td.dataset.floor, td.dataset.work);
  });
  document.getElementById('secChips').addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if(!c) return;
    const v = c.dataset.sec;
    if(v === '') FILTER_SEC.clear();
    else FILTER_SEC.has(v) ? FILTER_SEC.delete(v) : FILTER_SEC.add(v);
    rebuildSecChips();
    render();
  });
}

// ── АВТОРИЗАЦИЯ ──────────────────────────────────────────────────
async function tryLogin(pass){
  const r = await fetch(API+'?action=login&pass='+encodeURIComponent(pass||'')+'&t='+Date.now());
  return r.json();
}

async function initAuth(){
  try {
    const pass = localStorage.getItem('shk_pass') || '';
    const j = await tryLogin(pass);
    if(j.open){ OPEN_MODE = true; USER = null; }
    else if(j.name){ USER = j; }
    else { USER = null; if(pass) localStorage.removeItem('shk_pass'); }
  } catch(e){ USER = null; }
  renderUserArea();
}

async function doLogin(){
  const inp = document.getElementById('passInp');
  const pass = (inp && inp.value || '').trim();
  if(!pass) return;
  try {
    const j = await tryLogin(pass);
    if(j.error || !j.name){ toast(t('wrongPass'),'err'); return; }
    localStorage.setItem('shk_pass', pass);
    USER = j;
    renderUserArea();
    toast('👤 '+j.name,'ok');
  } catch(e){ toast(t('errorSave'),'err'); }
}

function logout(){
  localStorage.removeItem('shk_pass');
  USER = null;
  renderUserArea();
}

// Может ли пользователь редактировать данную работу на данной секции.
// Ограничения по секциям и по видам работ ПЕРЕСЕКАЮТСЯ (логика И):
// «Секции: 1» + «Вид работ: Монолит» = только монолит на секции 1.
// Пустое поле = без ограничения.
function canEdit(sec, work){
  if(OPEN_MODE) return true;
  if(!USER) return false;
  if(String(USER.role||'').trim().toLowerCase() === 'читатель') return false;

  const inList = (raw, val) => {
    const s = String(raw||'').trim();
    if(s === '') return true;
    const low = s.toLowerCase();
    if(low === 'все' || low === 'sve' || low === 'all') return true;
    return s.split(',').map(x=>x.trim()).includes(String(val).trim());
  };

  if(!inList(USER.sections, sec))  return false;
  if(!inList(USER.works,    work)) return false;
  return true;
}

function renderUserArea(){
  const el = document.getElementById('userArea');
  if(!el) return;
  if(OPEN_MODE){
    el.innerHTML = `<span style="font-size:11px;color:var(--ink3);">👤</span>
      <input class="name-inp" id="nameInp" placeholder="${esc(t('yourName'))}" value="${esc(userName)}" oninput="saveName(this.value)">`;
  } else if(USER){
    el.innerHTML = `<span class="user-badge">👤 <b>${esc(USER.name)}</b>${USER.role?' · '+esc(USER.role):''}</span>
      <button class="btn" onclick="logout()">${esc(t('logout'))}</button>`;
  } else {
    el.innerHTML = `<input class="name-inp" id="passInp" type="password" placeholder="${esc(t('passHolder'))}"
        onkeydown="if(event.key==='Enter')doLogin()">
      <button class="btn btn-pri" onclick="doLogin()">${esc(t('login'))}</button>`;
  }
}

// ── LOAD ─────────────────────────────────────────────────────────
async function loadAll(){
  setSt('spin',t('loading')); showLoader(t('loadingSheets'));
  try {
    const [cfgRes, dataRes, sumRes] = await Promise.all([
      fetch(API+'?action=config&t='+Date.now()),
      fetch(API+'?action=data&t='+Date.now()),
      fetch(API+'?action=summary&t='+Date.now()).catch(()=>null)   // сводка опциональна
    ]);
    const cfg = await cfgRes.json();
    const dat = await dataRes.json();
    let   sum = {rows:[]};
    try{ if(sumRes) sum = await sumRes.json(); }catch(e){}
    if(cfg.error) throw new Error(cfg.error);
    if(dat.error) throw new Error(dat.error);   // ошибка чтения базы больше не глотается
    SUMMARY = (sum && !sum.error) ? (sum.grid || (sum.rows ? [Object.keys(sum.rows[0]||{}), ...sum.rows.map(r=>Object.values(r))] : [])) : [];
    CONFIG.works    = cfg.works    || [];
    CONFIG.sections = cfg.sections || [];
    DATA = {};
    (dat.rows||[]).forEach(r => {
      const k = makeKey(r['Секция'], r['Этаж'], r['Вид работ']);
      DATA[k] = {
        found:    true,
        pct:      parseFloat(r['% выполнения'])||0,
        updatedAt:r['Обновлено'] ||'',
        startDate:normalizeDate(r['Дата начала']),
        planDate: normalizeDate(r['Дата план']),
        factDate: normalizeDate(r['Дата факт']),
        dev:      parseDev(r['Отставание'])
      };
    });
    buildFilters();
    render();
    setSt('ok', t('loaded')+' · '+new Date().toLocaleTimeString('ru'));
    toast(t('loaded'),'ok');
  } catch(e) {
    setSt('err',e.message);
    toast('Ошибка: '+e.message,'err',4000);
    document.getElementById('emptyState').style.display='flex';
    document.getElementById('board').style.display='none';
  }
  hideLoader();
}

