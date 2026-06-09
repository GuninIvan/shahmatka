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

    // Фильтры
    sectionLbl:     'Секция:',
    floorLbl:       'Этаж:',
    workLbl:        'Вид работ:',
    allSections:    'Все',
    allFloors:      'Все этажи',
    allWorks:       'Все работы',
    onlySecWorks:   'Работы на секцию',

    // Шахматка — заголовки
    sectionPrefix:  'Секция',
    floorShort:     'эт.',
    worksAbove:     'Работы выше 0.000',
    worksBelow:     'Работы ниже 0.000',
    workOnSec:      'Работа на секцию',
    onSec:          'на сек.',

    // Модальное окно
    pctLabel:       'Процент выполнения',
    save:           'Сохранить',
    cancel:         'Отмена',
    histTitle:      'История',
    noHistory:      'Изменений ещё не было',
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
    partial:        'частично',
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

    // Filteri
    sectionLbl:     'Sekcija:',
    floorLbl:       'Sprat:',
    workLbl:        'Vrsta radova:',
    allSections:    'Sve',
    allFloors:      'Svi spratovi',
    allWorks:       'Svi radovi',
    onlySecWorks:   'Radovi na sekciji',

    // Šahmatka — naslovi
    sectionPrefix:  'Sekcija',
    floorShort:     'sp.',
    worksAbove:     'Radovi iznad 0.000',
    worksBelow:     'Radovi ispod 0.000',
    workOnSec:      'Rad na sekciji',
    onSec:          'na sek.',

    // Modalni prozor
    pctLabel:       'Procenat izvršenja',
    save:           'Sačuvaj',
    cancel:         'Otkaži',
    histTitle:      'Istorija',
    noHistory:      'Još nema izmjena',
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
    partial:        'djelimično',
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

    // Filters
    sectionLbl:     'Section:',
    floorLbl:       'Floor:',
    workLbl:        'Work type:',
    allSections:    'All',
    allFloors:      'All floors',
    allWorks:       'All works',
    onlySecWorks:   'Section works',

    // Grid — headers
    sectionPrefix:  'Section',
    floorShort:     'fl.',
    worksAbove:     'Works above 0.000',
    worksBelow:     'Works below 0.000',
    workOnSec:      'Section works',
    onSec:          'on sec.',

    // Modal
    pctLabel:       'Completion %',
    save:           'Save',
    cancel:         'Cancel',
    histTitle:      'History',
    noHistory:      'No changes yet',
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
    partial:        'partial',
    hint:           'Click a cell to update',

    // Loader
    loading:        'Loading…',
    loadingSheets:  'Loading from Google Sheets…',

    // Other
    anonymous:      'Anonymous',
  }

};
