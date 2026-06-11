const SS_ID = '14kn6d3PrtHp1etLDz6Gn84qsM1IfBWjdPAcP3ycjT9A';
const SS = SpreadsheetApp.openById(SS_ID);

// ═══════════════════════════════════════════════════════════════
//  ЭНДПОИНТЫ (все через GET)
//  ?action=config            — Список работ + Секции
//  ?action=data              — База данных
//  ?action=login&pass=XXX    — проверка пароля (лист «Роли»)
//  ?action=update&section=&floor=&work=&pct=&pass=&who=
// ═══════════════════════════════════════════════════════════════

function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    if      (action === 'config') result = getConfig();
    else if (action === 'data')   result = getData();
    else if (action === 'summary') result = getSummary();
    else if (action === 'login')  result = login(e.parameter);
    else if (action === 'update') result = updateRecord(e.parameter);
    else result = { error: 'Unknown action: ' + action };
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Конфиг ────────────────────────────────────────────────────────
function getConfig() {
  const works    = sheetToObjects('Список работ');
  const sections = sheetToObjects('Секции');
  // Цвет колонки = фон ячейки «Вид работ» в листе «Список работ».
  // Белый/пустой фон = без подкраски.
  try {
    const sh  = SpreadsheetApp.getActive().getSheetByName('Список работ');
    const rng = sh.getDataRange();
    const v   = rng.getValues();
    const b   = rng.getBackgrounds();
    const hi  = v[0].indexOf('Вид работ');
    if (hi >= 0) {
      const colors = {};
      for (let i = 1; i < v.length; i++) {
        const name = String(v[i][hi]).trim();
        if (!name) continue;
        const c = String(b[i][hi] || '').toLowerCase();
        if (c && c !== '#ffffff') colors[name] = c;
      }
      works.forEach(function(w){ w['Цвет'] = colors[String(w['Вид работ']).trim()] || ''; });
    }
  } catch(e) { /* цвета — некритичная косметика */ }
  return { works, sections };
}

// ── Данные ────────────────────────────────────────────────────────
function getData() {
  const rows = sheetToObjects('База данных');
  return { rows: rows.map(r => {
    if (r['Дата начала'] !== undefined) r['Дата начала'] = serialToDate(r['Дата начала']);
    if (r['Дата план'] !== undefined) r['Дата план'] = serialToDate(r['Дата план']);
    if (r['Дата факт'] !== undefined) r['Дата факт'] = serialToDate(r['Дата факт']);
    if (r['Обновлено'] !== undefined) r['Обновлено'] = serialToDate(r['Обновлено']);
    return r;
  })};
}

// ── Роли / доступ ─────────────────────────────────────────────────
// Лист «Роли»: Пароль | Имя | Роль | Секции | Вид работ
//   Роль:      ГИП / Инженер / Читатель (пусто = редактор)
//   Секции:    пусто или «Все» = все секции, иначе список: 1, 2
//   Вид работ: пусто или «Все» = все работы, иначе список работ
//   Условия пересекаются (И): секции 1 + работа «Монолит» =
//   только монолит на секции 1, больше ничего.
// Если листа «Роли» нет — система открыта для всех (как раньше).

function login(p) {
  const sheet = SS.getSheetByName('Роли');
  if (!sheet) return { open: true };
  const rows = sheetToObjects('Роли');
  const pass = String(p.pass || '').trim();
  if (!pass) return { error: 'no_access' };
  const u = rows.find(r => String(r['Пароль']).trim() === pass);
  if (!u) return { error: 'no_access' };
  return {
    name:     String(u['Имя']  || ''),
    role:     String(u['Роль'] || ''),
    sections: String(u['Секции'] || ''),
    works:    String(u['Вид работ'] || '')
  };
}

function checkAccess(p) {
  const sheet = SS.getSheetByName('Роли');
  // Листа нет → открытый режим, имя берём из параметра who
  if (!sheet) return { ok: true, name: String(p.who || '') };

  const rows = sheetToObjects('Роли');
  const pass = String(p.pass || '').trim();
  const u = pass ? rows.find(r => String(r['Пароль']).trim() === pass) : null;
  if (!u) return { ok: false, error: 'no_access' };

  const role = String(u['Роль'] || '').trim().toLowerCase();
  if (role === 'читатель') return { ok: false, error: 'read_only' };

  // Секции: пусто или «Все» = без ограничений
  const secs = String(u['Секции'] || '').trim();
  if (secs && secs.toLowerCase() !== 'все') {
    const list = secs.split(',').map(s => s.trim()).filter(s => s !== '');
    if (!list.includes(String(p.section || '').trim()))
      return { ok: false, error: 'section_denied' };
  }

  // Вид работ: пусто или «Все» = без ограничений.
  // Проверка идёт ПОСЛЕ секций — условия пересекаются (И).
  const wks = String(u['Вид работ'] || '').trim();
  if (wks && wks.toLowerCase() !== 'все') {
    const list = wks.split(',').map(s => s.trim()).filter(s => s !== '');
    if (!list.includes(String(p.work || '').trim()))
      return { ok: false, error: 'work_denied' };
  }

  return { ok: true, name: String(u['Имя'] || '') };
}

// ── Обновление записи ─────────────────────────────────────────────
// Истории больше нет. Пишем только в «Базу данных»:
// находим строку по ключу Секция&Вид работ&Этаж и перезаписываем
// % выполнения, Обновлено и «Кто внёс запись».
// Все колонки ищутся по заголовку, а не по номеру — можно двигать.
function updateRecord(p) {
  // 1. Проверка прав
  const access = checkAccess(p);
  if (!access.ok) return { error: access.error };
  const who = access.name || String(p.who || '');

  // 2. Блокировка — два инженера не перетрут друг друга
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch(e) {
    return { error: 'busy' }; // сервер занят, фронт откатит и покажет тост
  }

  try {
    const db  = SS.getSheetByName('База данных');
    const now = formatDate(new Date());
    const key = makeKey(p.section, p.floor, p.work);

    const data    = db.getDataRange().getValues();
    const headers = data[0];
    const colS   = headers.indexOf('Секция');
    const colF   = headers.indexOf('Этаж');
    const colW   = headers.indexOf('Вид работ');
    const colP   = headers.indexOf('% выполнения');
    const colT   = headers.indexOf('Обновлено');
    const colWho = headers.indexOf('Кто внёс запись'); // может отсутствовать

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (makeKey(data[i][colS], data[i][colF], data[i][colW]) === key) {
        foundRow = i + 1; break;
      }
    }

    if (foundRow === -1) {
      // Новая запись: последнюю занятую строку ищем по «Вид работ»,
      // т.к. формула «Дата факт» растягивает лист вниз.
      let lastRow = 1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][colW] || '') !== '') lastRow = i + 1;
      }
      foundRow = lastRow + 1;
      db.getRange(foundRow, colS + 1).setValue(p.section || '');
      db.getRange(foundRow, colF + 1).setValue(p.floor   || '');
      db.getRange(foundRow, colW + 1).setValue(p.work);
    }

    // Перезапись ячеек найденной (или только что созданной) строки.
    // Каждая ячейка пишется отдельно по своему заголовку —
    // колонка с формулой «Дата факт» не затрагивается вообще.
    db.getRange(foundRow, colP + 1).setValue(Number(p.pct));
    db.getRange(foundRow, colT + 1).setValue(now);
    if (colWho > -1) db.getRange(foundRow, colWho + 1).setValue(who);

    return { success: true, key, updatedAt: now };
  } finally {
    lock.releaseLock();
  }
}

// ── Вспомогательные ───────────────────────────────────────────────
function sheetToObjects(name) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(r => r.some(c => c !== ''))
    .map(r => { const obj = {}; headers.forEach((h, i) => obj[h] = r[i]); return obj; });
}

// Ключ записи: Секция & Вид работ & Этаж.
// Разделитель «&» + вид работ между цифрами исключают путаницу
// вида «1+15» против «11+5» — ключи всегда однозначны:
// "1&Монолитные конструкции&15" ≠ "11&Монолитные конструкции&5"
function makeKey(section, floor, work) {
  return [String(section || '').trim(),
          String(work    || '').trim(),
          String(floor   || '').trim()].join('&');
}

function formatDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
}

// Любой формат даты → строка "dd.mm.yyyy"
// ВАЖНО: getValues() возвращает для ячеек-дат объекты Date,
// поэтому первым делом обрабатываем именно их.
function serialToDate(serial) {
  if (serial === '' || serial === null || serial === undefined) return '';
  if (serial instanceof Date) {
    return Utilities.formatDate(serial, Session.getScriptTimeZone(), 'dd.MM.yyyy');
  }
  if (typeof serial === 'string' && serial.includes('.')) return serial; // уже строка
  const num = parseFloat(serial);
  if (isNaN(num)) return String(serial);
  const date = new Date(new Date(1899, 11, 30).getTime() + Math.floor(num) * 86400000);
  return String(date.getDate()).padStart(2, '0') + '.' +
         String(date.getMonth() + 1).padStart(2, '0') + '.' +
         date.getFullYear();
}

// ── Сводка ────────────────────────────────────────────────────────
// Вся математика — формулами в листе «Сводка» (любые колонки).
// Приложение просто отображает лист как таблицу в режиме «Сводка».
function getSummary() {
  // Сырая сетка отображаемых значений: на листе может быть несколько таблиц,
  // разделённых пустыми строками — клиент разберёт сам.
  const sh = SpreadsheetApp.getActive().getSheetByName('Сводка');
  if (!sh) return { grid: [] };
  return { grid: sh.getDataRange().getDisplayValues() };
}

// ── Сеялка строк ──────────────────────────────────────────────────
// Запускается ВРУЧНУЮ из редактора Apps Script (выбрать seedDatabase → Run).
// Создаёт в «Базе данных» строки (0%) для всех применимых ячеек
// шахматки, которых ещё нет. Повторный запуск добавляет только новые
// (после добавления секций/работ). Нужна, чтобы формулы Ожидаемый %
// и Отставание считались для каждой ячейки, а сводка была честной.
function seedDatabase() {
  const works    = sheetToObjects('Список работ');
  const sections = sheetToObjects('Секции');
  const db   = SS.getSheetByName('База данных');
  const data = db.getDataRange().getValues();
  const headers = data[0];
  const colS = headers.indexOf('Секция');
  const colF = headers.indexOf('Этаж');
  const colW = headers.indexOf('Вид работ');
  const colP = headers.indexOf('% выполнения');
  const width = Math.max(colS, colF, colW, colP) + 1;

  // Базовые колонки должны идти раньше формульных, иначе пустые
  // значения новых строк заблокируют ARRAYFORMULA.
  const formulaCols = ['Дата факт', 'Ожидаемый %', 'Отставание'];
  for (let i = 0; i < width; i++) {
    if (formulaCols.indexOf(headers[i]) > -1)
      throw new Error('Колонка «' + headers[i] + '» должна стоять ПОСЛЕ базовых (Секция, Этаж, Вид работ, % выполнения).');
  }

  const existing = {};
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colW] || '') !== '')
      existing[makeKey(data[i][colS], data[i][colF], data[i][colW])] = true;
  }

  function applicable(w, sec, floor) {
    const secRule = String(w['Наличие на секции'] || '').trim();
    if (secRule && secRule.toLowerCase() !== 'все') {
      if (secRule.split(',').map(function(s){return s.trim();}).indexOf(String(sec)) === -1) return false;
    }
    if (floor === null) return true;
    const floorRule = String(w['Наличие на этаже'] || '').trim();
    if (!floorRule || floorRule.toLowerCase() === 'все') return true;
    return floorRule.split(',').map(function(f){return parseInt(f.trim());})
      .filter(function(f){return !isNaN(f);}).indexOf(floor) > -1;
  }

  const rowsToAdd = [];
  function push(sec, floor, name) {
    const key = makeKey(sec, floor, name);
    if (existing[key]) return;
    existing[key] = true;
    const row = new Array(width).fill('');
    row[colS] = sec; row[colF] = floor; row[colW] = name; row[colP] = 0;
    rowsToAdd.push(row);
  }

  works.forEach(function(w) {
    const unit = String(w['Единица приемки'] || '').trim();
    const name = w['Вид работ'];
    if (unit === 'Площадка') {
      // Площадка общая для всего объекта: одна строка, Секция и Этаж пустые
      push('', '', name);
      return;
    }
    sections.forEach(function(s) {
      const sec = String(s['Секция']);
      if (unit === 'Секция') {
        if (applicable(w, sec, null)) push(sec, '', name);
      } else if (unit === 'Этаж секция') {
        const a = parseInt(s['Этажи выше 0.000']) || 0;
        const b = parseInt(s['Этажи ниже 0.000']) || 0;
        for (let f = a; f >= 1; f--)  if (applicable(w, sec, f)) push(sec, f, name);
        for (let f = -1; f >= -b; f--) if (applicable(w, sec, f)) push(sec, f, name);
      }
    });
  });

  if (!rowsToAdd.length) { Logger.log('Все ячейки уже есть, добавлять нечего.'); return; }

  let lastRow = 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colW] || '') !== '') lastRow = i + 1;
  }
  db.getRange(lastRow + 1, 1, rowsToAdd.length, width).setValues(rowsToAdd);
  Logger.log('Добавлено строк: ' + rowsToAdd.length);
}

// ── Тест ──────────────────────────────────────────────────────────
function testUpdate() {
  Logger.log(JSON.stringify(updateRecord({
    section: '1', floor: '5', work: 'Монолитные конструкции',
    pct: 80, who: 'Тест', pass: ''
  })));
}
