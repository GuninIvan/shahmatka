// ═══ modal.js — Модалка процента, сохранение на сервер, мелкие helpers ═══
// Подключение: см. порядок <script> в index.html (важен!)

// ── MODAL ─────────────────────────────────────────────────────────
function openModal(sec,floor,work){
  CUR={sec,floor,work,key:makeKey(sec,floor,work)};
  const d=getCell(sec,floor,work);
  const wObj=CONFIG.works.find(x=>x['Вид работ']===work);
  document.getElementById('moTitle').textContent = wObj ? workLabel(wObj) : work;
  const flTxt=floor?` · ${t('floorShort')} ${floor}`:'';
  const where = String(sec)==='' ? t('onSiteOpt') : `${t('sectionPrefix')} ${sec}${flTxt}`;
  const sub=[where];
  if(d.factDate) sub.push(`${t('factPrefix')} ${d.factDate}`);
  else if(d.planDate) sub.push(`${t('planPrefix')} ${d.planDate}`);
  document.getElementById('moSub').textContent=sub.join('  ');
  document.getElementById('pctSl').value=d.pct;
  document.getElementById('pctBig').textContent=d.pct+'%';

  // Право редактирования: без пароля (или с ролью Читатель) — только просмотр
  const editable=canEdit(sec, work);
  document.getElementById('pctBlock').style.display = editable?'':'none';
  document.getElementById('saveBtn').style.display  = editable?'':'none';
  const ro=document.getElementById('roNote');
  ro.style.display = editable?'none':'';
  ro.textContent = editable?'':('🔒 '+t('readOnly'));

  document.getElementById('overlay').classList.add('on');
}
function closeModal(e){
  if(e&&e.target!==e.currentTarget)return;
  document.getElementById('overlay').classList.remove('on'); CUR=null;
}
function updPct(v){document.getElementById('pctBig').textContent=v+'%';}
function setPct(v){document.getElementById('pctSl').value=v;document.getElementById('pctBig').textContent=v+'%';}

// ── SAVE ─────────────────────────────────────────────────────────
function saveCell(){
  if(!CUR)return;
  if(!canEdit(CUR.sec, CUR.work)){ toast(t('readOnly'),'err'); return; }
  const pctNew=parseInt(document.getElementById('pctSl').value);
  const pctOld=DATA[CUR.key]?.pct||0;
  const savedCUR={...CUR};
  if(!DATA[savedCUR.key])DATA[savedCUR.key]={found:true,pct:0,updatedAt:'',startDate:'',planDate:'',factDate:'',dev:null};
  DATA[savedCUR.key].pct=pctNew;
  closeModal(); render(); setSt('spin',t('saving'));
  const now=new Date();
  apiFetch({
    action:'update',
    section:String(savedCUR.sec),
    floor:String(savedCUR.floor),
    work:savedCUR.work,
    pct:pctNew,
    token:localStorage.getItem('shk_token')||'',
    who:OPEN_MODE?(userName||t('anonymous')):''
  })
  .then(j=>{
    if(j.error)throw new Error(j.error);
    if(DATA[savedCUR.key])DATA[savedCUR.key].updatedAt=j.updatedAt||'';
    setSt('ok',t('saved')+' · '+now.toLocaleTimeString('ru'));
    toast(t('saved'),'ok');
  })
  .catch(err=>{
    if(DATA[savedCUR.key])DATA[savedCUR.key].pct=pctOld;
    render();
    const m=err&&err.message;
    const msg = m==='no_access'      ? t('wrongPass')
              : m==='read_only'      ? t('readOnly')
              : m==='section_denied' ? t('noSecAccess')
              : m==='work_denied'    ? t('noWorkAccess')
              : t('errorSave');
    setSt('err',msg); toast(msg,'err',4000);
    if(!['no_access','read_only','section_denied','work_denied'].includes(m))
      logError('saveCell', m||'network');
  });
}

// ── HELPERS ──────────────────────────────────────────────────────
function setSt(st,txt){document.getElementById('sdot').className='sync-dot '+st;const el=document.getElementById('stxt');el.className='sync-txt '+st;el.textContent=txt;}
function showLoader(txt){document.getElementById('loader').classList.add('on');document.getElementById('loaderTxt').textContent=txt;}
function hideLoader(){document.getElementById('loader').classList.remove('on');}
function toast(msg,tp,dur){const w=document.getElementById('toasts'),el=document.createElement('div');el.className='toast '+(tp||'inf');el.textContent=msg;w.appendChild(el);setTimeout(()=>el.remove(),dur||2800);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
