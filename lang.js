// ─────────────────────────────────────────────────────────────────
// lang.js — словарь переводов интерфейса шахматки
// Чтобы добавить язык: скопируй блок 'en', измени код и переведи.
// Чтобы добавить ключ: добавь во все три блока одновременно.
// ─────────────────────────────────────────────────────────────────

const LANG = {

  ru: {
    // Топбар
    title:          'Шахматка приёмки',
    refresh:        '↻ Обновить',
    yourName:       'Ваше имя…',
    bySection:      'По секции',
    byWork:         'По виду работ',
    bySummary:      'Сводка',
    byGantt:        'График',
    byTasks:        'Задания',
    tasksFor:       'Задания к',
    gByFloor:       'По этажам',
    gByWork:        'По видам работ',
    gByGroup:       'По группам',
    onTrack:        'в графике',
    noTasks:        'Нет заданий к этой дате',
    avgPct:         'Средний %',
    maxDev:         'Макс. отставание',
    sumByGroup:     'Сводка по группам работ',
    sumByWork:      'Сводка по видам работ',
    scaleLbl:       'Масштаб:',
    noDates:        'нет дат',

    // Панель «Что показывать» и режим «к дате»
    showBtn:        'Вид',
    showPct:        'Процент',
    showStart:      'Дата начала',
    showEnd:        'Дата окончания',
    showDev:        'Отставание',
    showSec:        'Секция',
    showFloor:      'Этаж',
    deadlineLbl:    'К дате:',
    noSummary:      'Лист «Сводка» не найден в таблице',

    // Вход / роли
    passHolder:     'Пароль…',
    login:          'Войти',
    logout:         'Выйти',
    readOnly:       'Только просмотр',
    wrongPass:      'Неверный пароль',
    noSecAccess:    'Нет доступа к этой секции',
    noWorkAccess:   'Нет доступа к этому виду работ',

    // Фильтры
    sectionLbl:     'Секция:',
    floorLbl:       'Этаж:',
    groupLbl:       'Группа:',
    workLbl:        'Вид работ:',
    allSections:    'Все',
    allFloors:      'Все этажи',
    allGroups:      'Все группы',
    allWorks:       'Все работы',
    onlySecWorks:   'Работы на секцию',

    // Шахматка — заголовки
    sectionPrefix:  'Секция',
    floorShort:     'эт.',
    worksAbove:     'Работы выше 0.000',
    worksBelow:     'Работы ниже 0.000',
    workOnSec:      'Работа на секцию',
    onSec:          'на сек.',
    cutLbl:         'Разрез:',
    allCuts:        'Весь разрез',
    onSecOpt:       'На секцию',
    onSiteOpt:      'Площадка',
    workOnSite:     'Работы на площадку',
    byFloorWorks:   'Поэтажные работы',
    startShort:     'Старт',
    finishShort:    'Финиш',

    // Модальное окно
    pctLabel:       'Процент выполнения',
    save:           'Сохранить',
    cancel:         'Отмена',
    factPrefix:     '✓ Факт:',
    planPrefix:     'План:',

    // Статусы / тосты
    saving:         'Сохранение…',
    saved:          '✓ Сохранено',
    errorSave:      'Не сохранилось — попробуй ещё раз',
    loaded:         'Загружено',

    // Статусбар
    total:          'всего',
    done:           '100%',
    inProg:         'в работе',
    hint:           'Нажмите на ячейку для обновления',

    // Лоадер
    loading:        'Загрузка…',
    loadingSheets:  'Загрузка из Google Sheets…',

    // Прочее
    anonymous:      'Аноним',
  },

  sr: {
    // Topbar
    title:          'Šahmatka prijema',
    refresh:        '↻ Osvježi',
    yourName:       'Vaše ime…',
    bySection:      'Po sekciji',
    byWork:         'Po vrsti radova',
    bySummary:      'Pregled',
    byGantt:        'Gantogram',
    byTasks:        'Zadaci',
    tasksFor:       'Zadaci do',
    gByFloor:       'Po spratovima',
    gByWork:        'Po vrsti radova',
    gByGroup:       'Po grupama',
    onTrack:        'po planu',
    noTasks:        'Nema zadataka do ovog datuma',
    avgPct:         'Prosečan %',
    maxDev:         'Maks. kašnjenje',
    sumByGroup:     'Pregled po grupama radova',
    sumByWork:      'Pregled po vrstama radova',
    scaleLbl:       'Razmera:',
    noDates:        'nema datuma',

    // Panel „Šta prikazati" i režim „do datuma"
    showBtn:        'Prikaz',
    showPct:        'Procenat',
    showStart:      'Datum početka',
    showEnd:        'Datum završetka',
    showDev:        'Kašnjenje',
    showSec:        'Sekcija',
    showFloor:      'Sprat',
    deadlineLbl:    'Do datuma:',
    noSummary:      'List „Сводка" nije pronađen u tabeli',

    // Prijava / uloge
    passHolder:     'Lozinka…',
    login:          'Prijava',
    logout:         'Odjava',
    readOnly:       'Samo pregled',
    wrongPass:      'Pogrešna lozinka',
    noSecAccess:    'Nema pristupa ovoj sekciji',
    noWorkAccess:   'Nema pristupa ovoj vrsti radova',

    // Filteri
    sectionLbl:     'Sekcija:',
    floorLbl:       'Sprat:',
    groupLbl:       'Grupa:',
    workLbl:        'Vrsta radova:',
    allSections:    'Sve',
    allFloors:      'Svi spratovi',
    allGroups:      'Sve grupe',
    allWorks:       'Svi radovi',
    onlySecWorks:   'Radovi na sekciji',

    // Šahmatka — naslovi
    sectionPrefix:  'Sekcija',
    floorShort:     'sp.',
    worksAbove:     'Radovi iznad 0.000',
    worksBelow:     'Radovi ispod 0.000',
    workOnSec:      'Rad na sekciji',
    onSec:          'na sek.',
    cutLbl:         'Presek:',
    allCuts:        'Ceo presek',
    onSecOpt:       'Na sekciju',
    onSiteOpt:      'Gradilište',
    workOnSite:     'Radovi na gradilištu',
    byFloorWorks:   'Radovi po spratovima',
    startShort:     'Start',
    finishShort:    'Kraj',

    // Modalni prozor
    pctLabel:       'Procenat izvršenja',
    save:           'Sačuvaj',
    cancel:         'Otkaži',
    factPrefix:     '✓ Fakt:',
    planPrefix:     'Plan:',

    // Statusi / tosti
    saving:         'Čuvanje…',
    saved:          '✓ Sačuvano',
    errorSave:      'Nije sačuvano — pokušaj ponovo',
    loaded:         'Učitano',

    // Statusbar
    total:          'ukupno',
    done:           '100%',
    inProg:         'u radu',
    hint:           'Kliknite na ćeliju za ažuriranje',

    // Loader
    loading:        'Učitavanje…',
    loadingSheets:  'Učitavanje iz Google Sheets…',

    // Ostalo
    anonymous:      'Anonimno',
  },

  en: {
    // Topbar
    title:          'Acceptance Grid',
    refresh:        '↻ Refresh',
    yourName:       'Your name…',
    bySection:      'By section',
    byWork:         'By work type',
    bySummary:      'Summary',
    byGantt:        'Timeline',
    byTasks:        'Tasks',
    tasksFor:       'Tasks for',
    gByFloor:       'By floor',
    gByWork:        'By work type',
    gByGroup:       'By group',
    onTrack:        'on track',
    noTasks:        'No tasks for this date',
    avgPct:         'Avg %',
    maxDev:         'Max lag',
    sumByGroup:     'Summary by work group',
    sumByWork:      'Summary by work type',
    scaleLbl:       'Scale:',
    noDates:        'no dates',

    // "What to show" panel and "by date" mode
    showBtn:        'View',
    showPct:        'Percent',
    showStart:      'Start date',
    showEnd:        'End date',
    showDev:        'Lag',
    showSec:        'Section',
    showFloor:      'Floor',
    deadlineLbl:    'By date:',
    noSummary:      'Sheet "Сводка" not found in the spreadsheet',

    // Login / roles
    passHolder:     'Password…',
    login:          'Log in',
    logout:         'Log out',
    readOnly:       'View only',
    wrongPass:      'Wrong password',
    noSecAccess:    'No access to this section',
    noWorkAccess:   'No access to this work type',

    // Filters
    sectionLbl:     'Section:',
    floorLbl:       'Floor:',
    groupLbl:       'Group:',
    workLbl:        'Work type:',
    allSections:    'All',
    allFloors:      'All floors',
    allGroups:      'All groups',
    allWorks:       'All works',
    onlySecWorks:   'Section works',

    // Grid — headers
    sectionPrefix:  'Section',
    floorShort:     'fl.',
    worksAbove:     'Works above 0.000',
    worksBelow:     'Works below 0.000',
    workOnSec:      'Section works',
    onSec:          'on sec.',
    cutLbl:         'View by:',
    allCuts:        'Everything',
    onSecOpt:       'Per section',
    onSiteOpt:      'Site',
    workOnSite:     'Site works',
    byFloorWorks:   'Floor-by-floor works',
    startShort:     'Start',
    finishShort:    'Finish',

    // Modal
    pctLabel:       'Completion %',
    save:           'Save',
    cancel:         'Cancel',
    factPrefix:     '✓ Fact:',
    planPrefix:     'Plan:',

    // Status / toasts
    saving:         'Saving…',
    saved:          '✓ Saved',
    errorSave:      'Not saved — try again',
    loaded:         'Loaded',

    // Statusbar
    total:          'total',
    done:           '100%',
    inProg:         'in progress',
    hint:           'Click a cell to update',

    // Loader
    loading:        'Loading…',
    loadingSheets:  'Loading from Google Sheets…',

    // Other
    anonymous:      'Anonymous',
  }

};
