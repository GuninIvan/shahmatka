// ═══ tests.node.js — тесты чистых функций шахматки ═══
// Запуск:  node tests.node.js   (в папке проекта)
// В index.html НЕ подключается — это инструмент разработки.
// Гоняется после каждой правки cells.js / tasks.js / summary.js / gantt.js.

const fs = require('fs');
const assert = require('assert');

// ── Стаб браузерного окружения для top-level кода файлов ──
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.window = { addEventListener: () => {} };
global.navigator = { userAgent: 'tests' };
global.document = { addEventListener: () => {}, getElementById: () => null };
global.LANG = { ru: {}, sr: {}, en: {} };
global.CURRENT_LANG = 'ru';
global.t = k => k;
global.esc = s => String(s || '');
global.CONFIG = { works: [], sections: [] };
global.DATA = {};
global.fetch = () => Promise.reject(new Error('no network in tests'));

// Загружаем файлы одним куском: top-level const/let делят скоуп,
// как у обычных <script> в браузере. После кода — экспорт функций
// в globalThis, т.к. const из eval наружу не виден.
{
  const code = ['cells.js', 'gantt.js', 'tasks.js', 'summary.js', 'prep.js']
    .map(f => fs.readFileSync(__dirname + '/' + f, 'utf8')).join('\n');
  const exports = ['makeKey','parseDev','normalizeDate','parseDate','fmtShort',
                   'taskTarget','isWorkApplicable','splitSummaryGrid','sumPctVal','parseGate','prepPhaseStatus','ganttAgg',
                   'phaseDone','workStartDate'];
  (0, eval)(code + '\n' + exports.map(n => `globalThis.${n}=${n};`).join(''));
}

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
const d = (dd, mm, yyyy) => new Date(yyyy, mm - 1, dd);

// ── parseDev: только чистое число, иначе null ──
console.log('parseDev');
check('целое',            () => assert.strictEqual(parseDev('5'), 5));
check('отрицательное',    () => assert.strictEqual(parseDev('-3'), -3));
check('дробное с запятой',() => assert.strictEqual(parseDev('2,5'), 2.5));
check('дата → null',      () => assert.strictEqual(parseDev('2026-06-15'), null));
check('текст → null',     () => assert.strictEqual(parseDev('завтра'), null));
check('пусто → null',     () => assert.strictEqual(parseDev(''), null));
check('null → null',      () => assert.strictEqual(parseDev(null), null));

// ── normalizeDate / parseDate / fmtShort ──
console.log('normalizeDate / parseDate');
check('dd.mm.yyyy как есть',  () => assert.strictEqual(normalizeDate('09.06.2026'), '09.06.2026'));
check('iso → dd.mm.yyyy',     () => assert.strictEqual(normalizeDate('2026-06-09'), '09.06.2026'));
check('серийный номер',       () => assert.strictEqual(normalizeDate('45931'), '01.10.2025'));
check('мусор → пусто',        () => assert.strictEqual(normalizeDate('abc'), ''));
check('parseDate dd.mm.yyyy', () => assert.deepStrictEqual(parseDate('09.06.2026'), d(9, 6, 2026)));
check('parseDate iso',        () => assert.deepStrictEqual(parseDate('2026-06-09'), d(9, 6, 2026)));
check('parseDate серийный',   () => assert.deepStrictEqual(parseDate('45931'), d(1, 10, 2025)));
check('fmtShort',             () => assert.strictEqual(fmtShort('09.06.2026'), '09.06'));

// ── makeKey: однозначность ключей ──
console.log('makeKey');
check('1|15 ≠ 11|5', () => assert.notStrictEqual(makeKey('1', '15', 'Монолит'), makeKey('11', '5', 'Монолит')));
check('площадка (всё пусто)', () => assert.strictEqual(makeKey('', '', 'X'), '||||||X'));
check('число и строка дают один ключ', () => assert.strictEqual(makeKey(1, 5, 'X'), makeKey('1', '5', 'X')));

// ── taskTarget: математика «к дате» (ТЗ п.7) ──
// Работа 09.06–24.06 = 16 дней включительно.
console.log('taskTarget');
const cell = (start, plan, pct) => ({ found: true, pct, startDate: start, planDate: plan });
const DL = day => new Date(2026, 5, day, 23, 59, 59);   // июнь 2026
check('1-й день: 1/16 → 6%',     () => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',0), DL(9)), 6));
check('середина: 8/16 → 50%',    () => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',0), DL(16)), 50));
check('канун финиша: потолок 99',() => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',0), DL(23)), 94));
check('день финиша → 100',       () => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',0), DL(24)), 100));
check('после финиша → 100',      () => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',0), DL(30)), 100));
check('до старта → null',        () => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',0), DL(8)), null));
check('выполнено → null',        () => assert.strictEqual(taskTarget(cell('09.06.2026','24.06.2026',100), DL(16)), null));
check('нет записи → null',       () => assert.strictEqual(taskTarget({found:false,pct:0,startDate:'',planDate:''}, DL(16)), null));
check('без плана, старт прошёл → 100', () => assert.strictEqual(taskTarget(cell('09.06.2026','',0), DL(16)), 100));
check('никогда не выше 99 до финиша',  () => {
  for (let day = 9; day <= 23; day++)
    assert.ok(taskTarget(cell('09.06.2026','24.06.2026',0), DL(day)) <= 99, 'день ' + day);
});

// ── isWorkApplicable: правила «Наличие на секции/этаже» ──
console.log('isWorkApplicable');
const W = (sec, fl) => ({ 'Наличие на секции': sec, 'Наличие на этаже': fl });
check('всё пусто → применимо',     () => assert.ok(isWorkApplicable(W('',''), '1', 5)));
check('«Все» → применимо',         () => assert.ok(isWorkApplicable(W('Все','Все'), '2', 3)));
check('секция в списке',           () => assert.ok(isWorkApplicable(W('1, 2',''), '2', 1)));
check('секция не в списке',        () => assert.ok(!isWorkApplicable(W('1, 2',''), '3', 1)));
check('этаж в списке',             () => assert.ok(isWorkApplicable(W('','2,3,4'), '1', 3)));
check('этаж не в списке',          () => assert.ok(!isWorkApplicable(W('','2,3,4'), '1', 5)));
check('floor=null игнорирует этажи',() => assert.ok(isWorkApplicable(W('','2,3'), '1', null)));
check('отрицательный этаж',        () => assert.ok(isWorkApplicable(W('','-1,1'), '1', -1)));

// ── splitSummaryGrid: резка листа на таблицы ──
console.log('splitSummaryGrid');
check('две таблицы рядом по горизонтали', () => {
  const grid = [
    ['Группа','%','', 'Группа','Вид','%'],
    ['A','10','',     'A','x','5'],
    ['B','20','',     'B','y','7'],
  ];
  const tabs = splitSummaryGrid(grid);
  assert.strictEqual(tabs.length, 2);
  assert.deepStrictEqual(tabs[0][0], ['Группа','%']);
  assert.deepStrictEqual(tabs[1][0], ['Группа','Вид','%']);
});
check('две таблицы по вертикали', () => {
  const grid = [
    ['Группа','%'],
    ['A','10'],
    ['',''],
    ['Вид','%'],
    ['x','5'],
  ];
  const tabs = splitSummaryGrid(grid);
  assert.strictEqual(tabs.length, 2);
  assert.strictEqual(tabs[1][1][0], 'x');
});
check('ведущая пустая колонка отбрасывается', () => {
  const grid = [
    ['','Группа','%'],
    ['','A','10'],
  ];
  const tabs = splitSummaryGrid(grid);
  assert.strictEqual(tabs.length, 1);
  assert.deepStrictEqual(tabs[0][0], ['Группа','%']);
});

// ── sumPctVal: проценты и доли ──
console.log('sumPctVal');
check('«63 %» → 63',          () => assert.strictEqual(sumPctVal('63 %'), 63));
check('доля 0.6257 → 63',     () => assert.strictEqual(sumPctVal('0.6257'), 63));
check('доля с запятой → 63',  () => assert.strictEqual(sumPctVal('0,6257'), 63));
check('1 → 100',              () => assert.strictEqual(sumPctVal('1'), 100));
check('15 → 15',              () => assert.strictEqual(sumPctVal('15'), 15));
check('пусто → null',         () => assert.strictEqual(sumPctVal(''), null));
check('текст → null',         () => assert.strictEqual(sumPctVal('нет'), null));

// ── parseGate: ворота «Фронт открыт» / «Контракт заключен» ──
console.log('parseGate');
check('TRUE → true',            () => assert.strictEqual(parseGate(true), true));
check('FALSE → false',          () => assert.strictEqual(parseGate(false), false));
check('0 от VLOOKUP → false',   () => assert.strictEqual(parseGate(0), false));
check('"0" → false',            () => assert.strictEqual(parseGate('0'), false));
check('"" → null (не настроено)',() => assert.strictEqual(parseGate(''), null));
check('undefined → null',       () => assert.strictEqual(parseGate(undefined), null));
check('"TRUE" строкой → true',  () => assert.strictEqual(parseGate('TRUE'), true));

// ── prepPhaseStatus: статусы фаз РД/Тендер/Контракт ──
console.log('prepPhaseStatus');
const today = new Date(); today.setHours(0,0,0,0);
const dmy = dd => { const x=new Date(today.getTime()+dd*86400000);
  return String(x.getDate()).padStart(2,'0')+'.'+String(x.getMonth()+1).padStart(2,'0')+'.'+x.getFullYear(); };
const ph = (ready,start,due,dur) => ({'РД / Готовность':ready,'РД / Начало работ':start,'РД / Дата готовности':due,'РД / Длительность':dur});
check('готово → ok даже если просрочено', () => assert.strictEqual(prepPhaseStatus(ph(true, dmy(-100), dmy(-10), 90),'РД').st, 'ok'));
check('дедлайн прошёл → late',  () => {
  const p=prepPhaseStatus(ph('', dmy(-100), dmy(-10), 90),'РД');
  assert.strictEqual(p.st,'late'); assert.strictEqual(p.lateDays,10);
});
check('старт прошёл, дедлайн впереди → run', () => assert.strictEqual(prepPhaseStatus(ph('', dmy(-5), dmy(30), 35),'РД').st, 'run'));
check('старт впереди → idle',   () => assert.strictEqual(prepPhaseStatus(ph('', dmy(5), dmy(40), 35),'РД').st, 'idle'));
check('ничего не настроено → none', () => assert.strictEqual(prepPhaseStatus(ph('', '', '', ''),'РД').st, 'none'));

// ── ganttAgg: свёрнутая строка графика — средний % vs ожидаемый ──
// (опережающие этажи компенсируют отстающие; красим только суммарное опоздание)
console.log('ganttAgg');
const gw = {'Вид работ':'Тест'};
function gSet(kids, pcts, start, plan){
  global.DATA = {};
  kids.forEach((k,i)=>{
    global.DATA[makeKey(k.sec,k.floor,'Тест')] =
      {found:true, pct:pcts[i], startDate:start, planDate:plan, dev:null,
       factDate:'', updatedAt:'', front:null, contract:null, predReady:null,
       vol:null, rate:null, unit:'', crew:null};
  });
  return kids.map(k=>({sec:k.sec, floor:k.floor}));
}
const K2=[{sec:'1',floor:1},{sec:'1',floor:2}];
check('опережение компенсирует отставание → не красим', () => {
  const a=ganttAgg(gw, gSet(K2,[40,60], dmy(-10), dmy(10)));   // ожидаемый ≈50, средний 50
  assert.ok(!(a.dev>0), 'dev='+a.dev);
});
check('суммарно отстаёт → dev>0', () => {
  const a=ganttAgg(gw, gSet(K2,[10,30], dmy(-10), dmy(10)));   // ожидаемый ≈50, средний 20
  assert.ok(a.dev>0, 'dev='+a.dev);
});
check('один этаж сильно отстаёт, второй опережает → не красим', () => {
  const a=ganttAgg(gw, gSet(K2,[0,100], dmy(-10), dmy(10)));   // средний 50 = ожидаемый
  assert.ok(!(a.dev>0), 'dev='+a.dev);
});
check('до старта → не красим', () => {
  const a=ganttAgg(gw, gSet(K2,[0,0], dmy(5), dmy(25)));       // ожидаемый 0
  assert.ok(!(a.dev>0), 'dev='+a.dev);
});
check('всё выполнено → dev null (зелёный по %)', () => {
  const a=ganttAgg(gw, gSet(K2,[100,100], dmy(-10), dmy(10)));
  assert.strictEqual(a.dev, null);
  assert.strictEqual(a.pct, 100);
});
check('нет дат → dev null', () => {
  const a=ganttAgg(gw, gSet(K2,[50,50], '', ''));
  assert.strictEqual(a.dev, null);
});
global.DATA = {};

// ── phaseDone: готовность фазы строго по TRUE ──
console.log('phaseDone');
check('TRUE → готово',         () => assert.strictEqual(phaseDone(true), true));
check('"TRUE" → готово',       () => assert.strictEqual(phaseDone('TRUE'), true));
check('"истина" → готово',     () => assert.strictEqual(phaseDone('истина'), true));
check('FALSE → не готово',     () => assert.strictEqual(phaseDone(false), false));
check('пусто → не готово',     () => assert.strictEqual(phaseDone(''), false));
check('0 → не готово',         () => assert.strictEqual(phaseDone(0), false));
check('мусор → не готово',     () => assert.strictEqual(phaseDone('абвгд'), false));
check('undefined → не готово', () => assert.strictEqual(phaseDone(undefined), false));

// ── workStartDate: старт СМР = Контракт/Дата готовности + Готовность за (дней) ──
console.log('workStartDate');
const wS = (due, za) => ({'Контракт / Дата готовности': due, 'Контракт / Готовность за': za});
check('16.04.2027 + 15 → 01.05.2027', () => assert.deepStrictEqual(workStartDate(wS('16.04.2027', 15)), d(1,5,2027)));
check('буфер строкой "15"',           () => assert.deepStrictEqual(workStartDate(wS('16.04.2027','15')), d(1,5,2027)));
check('буфер с запятой "15,0"',       () => assert.deepStrictEqual(workStartDate(wS('16.04.2027','15,0')), d(1,5,2027)));
check('без буфера → сама дата',       () => assert.deepStrictEqual(workStartDate(wS('16.04.2027','')), d(16,4,2027)));
check('iso-дата + 15',                () => assert.deepStrictEqual(workStartDate(wS('2027-04-16',15)), d(1,5,2027)));
check('переход через год',            () => assert.deepStrictEqual(workStartDate(wS('20.12.2026',15)), d(4,1,2027)));
check('нет даты готовности → null',   () => assert.strictEqual(workStartDate(wS('',15)), null));
check('null работа → null',           () => assert.strictEqual(workStartDate(null), null));

// ── Итог ──
console.log('\n' + (fail ? '✗ ПРОВАЛЕНО: ' + fail + ' из ' + (pass + fail) : '✓ Все ' + pass + ' тестов прошли'));
process.exit(fail ? 1 : 0);
