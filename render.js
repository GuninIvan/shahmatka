// ═══ render.js — Роутер режимов: какой экран рисовать ═══
// Подключение: см. порядок <script> в index.html (важен!)

// ── RENDER ────────────────────────────────────────────────────────
function render(){
  saveFilters();   // фильтры переживают перезагрузку страницы
  const dl = document.getElementById('deadlineInp').value;   // yyyy-mm-dd
  DEADLINE = dl ? new Date(dl+'T23:59:59') : null;
  const board=document.getElementById('board');
  const empty=document.getElementById('emptyState');
  const sub=document.getElementById('subBoards');
  const gw=document.getElementById('ganttWrap');
  const sw=document.getElementById('sumWrap');
  const tw=document.getElementById('tasksWrap');
  if(MODE!=='work')    sub.innerHTML='';
  if(MODE!=='gantt'){  gw.innerHTML='';  } gw.style.display = MODE==='gantt' ?'block':'none';
  if(MODE!=='summary'){sw.innerHTML='';  } sw.style.display = MODE==='summary'?'block':'none';
  if(MODE!=='tasks'){  tw.innerHTML='';  } tw.style.display = MODE==='tasks' ?'block':'none';
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

