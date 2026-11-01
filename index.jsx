const React = window.React;
const { useState, useEffect, useRef } = React;
const useAppStore = window.useAppStore;
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameMonth, isSameDay, addMonths, subMonths, eachDayOfInterval, parseISO, addDays } from 'date-fns';

// --- Google Calendar (read-only, in-memory layer; never persisted) ---
const GCAL_COLOR = '#4285f4';
const gcalSupported = () => typeof window !== 'undefined' && window.api && typeof window.api.gcalListEvents === 'function';
const GCAL_TEXT = {
    en: { setup: "Google Calendar: set up in Settings > Integrations", reconnect: "Google Calendar: reconnect in Settings > Integrations", title: "Google Calendar (read-only)", allDay: "All day" },
    tr: { setup: "Google Takvim: Ayarlar > Entegrasyonlar bölümünden kurun", reconnect: "Google Takvim: Ayarlar > Entegrasyonlar bölümünden yeniden bağlanın", title: "Google Takvim (salt okunur)", allDay: "Tüm gün" },
    de: { setup: "Google Kalender: in Einstellungen > Integrationen einrichten", reconnect: "Google Kalender: in Einstellungen > Integrationen neu verbinden", title: "Google Kalender (nur Lesen)", allDay: "Ganztägig" },
    fr: { setup: "Google Agenda : à configurer dans Paramètres > Intégrations", reconnect: "Google Agenda : à reconnecter dans Paramètres > Intégrations", title: "Google Agenda (lecture seule)", allDay: "Toute la journée" },
    es: { setup: "Google Calendar: configúralo en Ajustes > Integraciones", reconnect: "Google Calendar: vuelve a conectarlo en Ajustes > Integraciones", title: "Google Calendar (solo lectura)", allDay: "Todo el día" },
    zh: { setup: "Google 日历：请在“设置 > 集成”中设置", reconnect: "Google 日历：请在“设置 > 集成”中重新连接", title: "Google 日历（只读）", allDay: "全天" },
    ja: { setup: "Google カレンダー: 設定 > 連携 で設定してください", reconnect: "Google カレンダー: 設定 > 連携 で再接続してください", title: "Google カレンダー（読み取り専用）", allDay: "終日" },
    ru: { setup: "Google Календарь: настройте в Настройки > Интеграции", reconnect: "Google Календарь: подключите заново в Настройки > Интеграции", title: "Google Календарь (только чтение)", allDay: "Весь день" },
    ar: { setup: "تقويم Google: قم بالإعداد من الإعدادات > التكاملات", reconnect: "تقويم Google: أعد الاتصال من الإعدادات > التكاملات", title: "تقويم Google (للقراءة فقط)", allDay: "طوال اليوم" },
    hi: { setup: "Google कैलेंडर: सेटिंग्स > इंटीग्रेशन में सेट करें", reconnect: "Google कैलेंडर: सेटिंग्स > इंटीग्रेशन में फिर से कनेक्ट करें", title: "Google कैलेंडर (केवल पढ़ने के लिए)", allDay: "पूरे दिन" },
};
const gcalDayKey = (d) => format(d, 'yyyy-MM-dd');
// All-day events use 'YYYY-MM-DD' with an INCLUSIVE end: compare as plain strings, never via Date (avoids UTC off-by-one).
const gcalEventsOnDay = (events, day) => {
    const key = gcalDayKey(day);
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    return events.filter(ev => {
        if (!ev || !ev.start) return false;
        if (ev.allDay) {
            const s = String(ev.start).slice(0, 10);
            const e = String(ev.end || ev.start).slice(0, 10);
            return s <= key && key <= (e < s ? s : e);
        }
        const s = new Date(ev.start); const e = new Date(ev.end || ev.start);
        if (isNaN(s.getTime())) return false;
        if (isNaN(e.getTime()) || e <= s) return s >= dayStart && s < dayEnd;
        return s < dayEnd && e > dayStart;
    });
};

// --- Canlı look helpers (fall back to the old theme tokens on KoBar 1.4) ---
const T_SHELL = 'var(--kb-bg-shell, var(--theme-bg-dark, #161922))';
const T_SURFACE = 'var(--kb-bg-surface, var(--theme-surface, #1e222c))';
const T_TILE = 'var(--kb-bg-tile, var(--theme-surface, #242833))';
const T_INSET = 'var(--kb-bg-inset, rgba(0,0,0,.28))';
const T_CONTAINER = 'var(--kb-bg-container, var(--theme-accent-glow, rgba(255,255,255,.1)))';
const T_ON_CONTAINER = 'var(--kb-on-container, #fff)';
const T_ACCENT = 'var(--kb-accent, var(--theme-primary, #7c9cff))';
const T_ON_ACCENT = 'var(--kb-on-accent, #fff)';
const T_FG1 = 'var(--kb-fg-1, #fff)';
const T_FG2 = 'var(--kb-fg-2, #aab)';
const T_FG3 = 'var(--kb-fg-3, #778)';
const T_DISPLAY = 'var(--kb-font-display, inherit)';
const iconBtn = { width: 36, height: 36, borderRadius: 18, border: 0, background: T_INSET, color: T_FG1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const pillFilled = { height: 40, padding: '0 20px', borderRadius: 20, border: 0, background: T_ACCENT, color: T_ON_ACCENT, fontWeight: 600, fontSize: 14 };
const inputStyle = { width: '100%', background: T_INSET, border: 0, borderRadius: 16, padding: '10px 14px', color: T_FG1, fontSize: 13, outline: 'none' };

// --- Bar tile (value-caption). Silently skipped on KoBar versions without the tile API. ---
const BAR_ID = 'ko-calender-plugin-btn';
const CAL_TEXT = {
    en: { name: 'Calendar', one: '{n} event today', other: '{n} events today' },
    tr: { name: 'Takvim', one: 'bugün {n} etkinlik', other: 'bugün {n} etkinlik' },
    de: { name: 'Kalender', one: 'heute {n} Termin', other: 'heute {n} Termine' },
    es: { name: 'Calendario', one: 'hoy {n} evento', other: 'hoy {n} eventos' },
    fr: { name: 'Calendrier', one: '{n} événement aujourd’hui', other: '{n} événements aujourd’hui' },
    ru: { name: 'Календарь', one: 'сегодня {n} событие', few: 'сегодня {n} события', many: 'сегодня {n} событий', other: 'сегодня {n} события' },
    ar: { name: 'التقويم', one: 'حدث واحد اليوم', two: 'حدثان اليوم', few: '{n} أحداث اليوم', many: '{n} حدثًا اليوم', other: '{n} حدث اليوم' },
    zh: { name: '日历', one: '今天有 {n} 个活动', other: '今天有 {n} 个活动' },
    ja: { name: 'カレンダー', one: '今日は {n} 件の予定', other: '今日は {n} 件の予定' },
    hi: { name: 'कैलेंडर', one: 'आज {n} इवेंट', other: 'आज {n} इवेंट' },
};
const barLang = () => {
    const l = (window.useAppStore && window.useAppStore.getState().language) || 'en';
    return CAL_TEXT[l] ? l : 'en';
};
const stripDot = (v) => String(v).replace(/\.+$/, '');
const countTodayEvents = () => {
    try {
        const list = JSON.parse(localStorage.getItem('kobar_plugin_events') || '[]');
        if (!Array.isArray(list)) return 0;
        const now = new Date();
        return list.filter((ev) => ev && ev.startTime && isSameDay(parseISO(ev.startTime), now)).length;
    } catch { return 0; }
};
let barVisible = true;
let midnightTimer = null;
const pushBarState = () => {
    const ext = window.KoBarExtensions;
    if (!ext || typeof ext.setBarItemState !== 'function' || !barVisible) return;
    try {
        const lang = barLang();
        const tx = CAL_TEXT[lang];
        const now = new Date();
        const n = countTodayEvents();
        const fmt = (opts) => new Intl.DateTimeFormat(lang, opts).format(now);
        let label = tx.name + ' — ' + fmt({ weekday: 'long', day: 'numeric', month: 'long' });
        if (n > 0) {
            const cat = new Intl.PluralRules(lang).select(n);
            label += ', ' + (tx[cat] || tx.other).replace('{n}', String(n));
        }
        ext.setBarItemState(BAR_ID, {
            label,
            caption: stripDot(fmt({ weekday: 'short' })),
            value: String(now.getDate()),
            sub: stripDot(fmt({ month: 'short' })),
            badge: n > 0 ? n : undefined,
        });
    } catch { /* tile API is optional */ }
};
const scheduleMidnight = () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    const next = new Date();
    next.setHours(24, 0, 1, 0);
    midnightTimer = setTimeout(() => { pushBarState(); scheduleMidnight(); }, Math.max(1000, next.getTime() - Date.now()));
};
scheduleMidnight();
pushBarState();
try {
    if (window.useAppStore) {
        window.useAppStore.subscribe((state, prev) => { if (state.language !== prev.language) pushBarState(); });
    }
    if (typeof window.KoBarExtensions?.onBarItemChange === 'function') {
        window.KoBarExtensions.onBarItemChange(BAR_ID, (info) => {
            const visible = !info || info.visible !== false;
            barVisible = visible;
            if (visible) { pushBarState(); scheduleMidnight(); }
            else if (midnightTimer) { clearTimeout(midnightTimer); midnightTimer = null; }
        });
    }
} catch { /* tile API is optional */ }

// --- Panel strings: the plugin's own dictionary (month and weekday names come from Intl) ---
const KC_KEYS = ['today', 'jump', 'importHolidays', 'close', 'edit', 'add', 'evTitle', 'evDesc', 'evLink', 'alertOn', 'alertOff', 'save', 'update', 'cancel', 'upcoming', 'join', 'del', 'nothing', 'more', 'defColor', 'prev', 'next', 'dueTasks', 'found', 'importN', 'colorLabel', 'monthYear', 'year'];
const KC_VALUES = {
    en: ['Today', 'Jump to date', 'Import holidays', 'Close', 'Edit event', 'Add event', 'Event title', 'Description (optional)', 'Meeting link (optional)', 'Alert on', 'No alert', 'Save', 'Update', 'Cancel', 'Upcoming', 'Join meeting', 'Delete', 'Nothing planned', 'More', 'Default colour', 'Previous month', 'Next month', 'Tasks due', '{n} holidays found. Pick a colour for them.', 'Import {n} holidays', 'Colour', 'Pick month and year', 'Year'],
    tr: ['Bugün', 'Tarihe git', 'Tatilleri içe aktar', 'Kapat', 'Etkinliği düzenle', 'Etkinlik ekle', 'Etkinlik başlığı', 'Açıklama (isteğe bağlı)', 'Toplantı bağlantısı (isteğe bağlı)', 'Uyarı açık', 'Uyarı yok', 'Kaydet', 'Güncelle', 'Vazgeç', 'Yaklaşan', 'Toplantıya katıl', 'Sil', 'Planlanmış bir şey yok', 'Daha fazla', 'Varsayılan renk', 'Önceki ay', 'Sonraki ay', 'Son tarihi olan görevler', '{n} tatil bulundu. Bunlar için bir renk seçin.', '{n} tatili içe aktar', 'Renk', 'Ay ve yıl seç', 'Yıl'],
    de: ['Heute', 'Zum Datum springen', 'Feiertage importieren', 'Schließen', 'Termin bearbeiten', 'Termin hinzufügen', 'Titel des Termins', 'Beschreibung (optional)', 'Meeting-Link (optional)', 'Erinnerung an', 'Keine Erinnerung', 'Speichern', 'Aktualisieren', 'Abbrechen', 'Demnächst', 'Meeting beitreten', 'Löschen', 'Nichts geplant', 'Mehr', 'Standardfarbe', 'Voriger Monat', 'Nächster Monat', 'Fällige Aufgaben', '{n} Feiertage gefunden. Wähle eine Farbe dafür.', '{n} Feiertage importieren', 'Farbe', 'Monat und Jahr wählen', 'Jahr'],
    fr: ['Aujourd’hui', 'Aller à une date', 'Importer des jours fériés', 'Fermer', 'Modifier l’événement', 'Ajouter un événement', 'Titre de l’événement', 'Description (facultatif)', 'Lien de réunion (facultatif)', 'Alerte activée', 'Pas d’alerte', 'Enregistrer', 'Mettre à jour', 'Annuler', 'À venir', 'Rejoindre la réunion', 'Supprimer', 'Rien de prévu', 'Plus', 'Couleur par défaut', 'Mois précédent', 'Mois suivant', 'Tâches à échéance', '{n} jours fériés trouvés. Choisissez une couleur.', 'Importer {n} jours fériés', 'Couleur', 'Choisir le mois et l’année', 'Année'],
    es: ['Hoy', 'Ir a una fecha', 'Importar festivos', 'Cerrar', 'Editar evento', 'Añadir evento', 'Título del evento', 'Descripción (opcional)', 'Enlace de reunión (opcional)', 'Aviso activado', 'Sin aviso', 'Guardar', 'Actualizar', 'Cancelar', 'Próximos', 'Unirse a la reunión', 'Eliminar', 'Nada planeado', 'Más', 'Color predeterminado', 'Mes anterior', 'Mes siguiente', 'Tareas con fecha', 'Se encontraron {n} festivos. Elige un color.', 'Importar {n} festivos', 'Color', 'Elegir mes y año', 'Año'],
    zh: ['今天', '跳转到日期', '导入节假日', '关闭', '编辑活动', '添加活动', '活动标题', '说明（可选）', '会议链接（可选）', '提醒已开启', '无提醒', '保存', '更新', '取消', '即将到来', '加入会议', '删除', '暂无安排', '更多', '默认颜色', '上个月', '下个月', '到期任务', '找到 {n} 个节假日。请为它们选择颜色。', '导入 {n} 个节假日', '颜色', '选择月份和年份', '年份'],
    ja: ['今日', '日付へ移動', '祝日をインポート', '閉じる', '予定を編集', '予定を追加', '予定のタイトル', '説明（任意）', '会議リンク（任意）', '通知オン', '通知なし', '保存', '更新', 'キャンセル', '今後の予定', '会議に参加', '削除', '予定はありません', 'その他', '既定の色', '前の月', '次の月', '期限のあるタスク', '{n} 件の祝日が見つかりました。色を選んでください。', '{n} 件の祝日をインポート', '色', '月と年を選択', '年'],
    ru: ['Сегодня', 'Перейти к дате', 'Импортировать праздники', 'Закрыть', 'Изменить событие', 'Добавить событие', 'Название события', 'Описание (необязательно)', 'Ссылка на встречу (необязательно)', 'Напоминание включено', 'Без напоминания', 'Сохранить', 'Обновить', 'Отмена', 'Скоро', 'Присоединиться', 'Удалить', 'Ничего не запланировано', 'Ещё', 'Цвет по умолчанию', 'Предыдущий месяц', 'Следующий месяц', 'Задачи со сроком', 'Найдено праздников: {n}. Выберите для них цвет.', 'Импортировать праздники: {n}', 'Цвет', 'Выбрать месяц и год', 'Год'],
    ar: ['اليوم', 'الانتقال إلى تاريخ', 'استيراد العطل', 'إغلاق', 'تعديل الحدث', 'إضافة حدث', 'عنوان الحدث', 'الوصف (اختياري)', 'رابط الاجتماع (اختياري)', 'التنبيه مفعّل', 'بدون تنبيه', 'حفظ', 'تحديث', 'إلغاء', 'القادم', 'الانضمام إلى الاجتماع', 'حذف', 'لا شيء مخطط', 'المزيد', 'اللون الافتراضي', 'الشهر السابق', 'الشهر التالي', 'مهام ذات موعد', 'تم العثور على {n} عطلة. اختر لونًا لها.', 'استيراد {n} عطلة', 'اللون', 'اختيار الشهر والسنة', 'السنة'],
    hi: ['आज', 'तारीख पर जाएँ', 'छुट्टियाँ आयात करें', 'बंद करें', 'इवेंट संपादित करें', 'इवेंट जोड़ें', 'इवेंट का शीर्षक', 'विवरण (वैकल्पिक)', 'मीटिंग लिंक (वैकल्पिक)', 'अलर्ट चालू', 'कोई अलर्ट नहीं', 'सहेजें', 'अपडेट करें', 'रद्द करें', 'आने वाले', 'मीटिंग में शामिल हों', 'हटाएँ', 'कुछ भी नियोजित नहीं', 'और', 'डिफ़ॉल्ट रंग', 'पिछला महीना', 'अगला महीना', 'नियत तिथि वाले कार्य', '{n} छुट्टियाँ मिलीं। उनके लिए रंग चुनें।', '{n} छुट्टियाँ आयात करें', 'रंग', 'महीना और वर्ष चुनें', 'वर्ष'],
};
const KC_DICT = {};
Object.keys(KC_VALUES).forEach((lg) => { KC_DICT[lg] = {}; KC_KEYS.forEach((k, i) => { KC_DICT[lg][k] = KC_VALUES[lg][i]; }); });
const kcText = (lang) => {
    const d = KC_DICT[lang] || KC_DICT.en;
    return (k, n) => String(d[k] || KC_DICT.en[k] || k).replace('{n}', String(n === undefined ? '' : n));
};
const KC_COLORS = ['#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa'];
const KC_CSS = `
.kocal-panel .material-symbols-outlined { font-family: 'Material Symbols Rounded', 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 400; }
.kocal-panel .kocal-fill { font-variation-settings: 'FILL' 1, 'wght' 400; }
.kocal-panel button { cursor: pointer; font-family: inherit; }
.kocal-panel button:disabled { cursor: not-allowed; opacity: .5; }
.kocal-panel button:focus-visible, .kocal-panel input:focus-visible, .kocal-panel textarea:focus-visible { outline: 2px solid var(--kb-accent, #7c9cff); outline-offset: 2px; }
.kocal-panel .kc-cell:hover:not([aria-pressed="true"]) { background: var(--kb-bg-tile, rgba(255,255,255,.06)); }
.kocal-panel .kc-year::-webkit-outer-spin-button, .kocal-panel .kc-year::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;
const kcDot = (color, size = 6) => ({ width: size, height: size, borderRadius: size / 2, background: color, flexShrink: 0 });
const kcChip = (on) => ({ height: 32, padding: '0 12px', borderRadius: 10, border: 0, background: on ? T_CONTAINER : T_TILE, color: on ? T_ON_CONTAINER : T_FG2, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 });

const KoCalendarPluginPanel = (props) => {
    const { onClose, anchorRect } = props;

    const edgePosition = useAppStore(state => state.edgePosition);
    const screenBounds = useAppStore(state => state.screenBounds);
    const isSmartPositioning = useAppStore(state => state.isPopupSmartPositioning);
    const sidebarPosition = useAppStore(state => state.sidebarPosition);
    const orientation = useAppStore(state => state.orientation);
    const language = useAppStore(state => state.language);
    const lang = KC_DICT[language] ? language : 'en';
    const tr = kcText(lang);
    const gt = GCAL_TEXT[lang] || GCAL_TEXT.en;
    const dfmt = (d, opts) => new Intl.DateTimeFormat(lang, opts).format(d);

    const todos = (() => {
        try {
            const v = JSON.parse(localStorage.getItem('kobar_plugin_todos') || '[]');
            return Array.isArray(v) ? v : [];
        } catch {
            return [];
        }
    })();

    const [localEvents, setLocalEventsState] = useState(() => {
        try {
            const saved = localStorage.getItem('kobar_plugin_events');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    const [koCalendarColor, setKoCalendarColor] = useState(() => {
        try {
            const saved = localStorage.getItem('kobar_plugin_calendar_color');
            if (saved) return saved;
        } catch (e) {}
        return '#60a5fa';
    });

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editingEventDate, setEditingEventDate] = useState(null);
    const [editingEventId, setEditingEventId] = useState(null);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventMeetingLink, setNewEventMeetingLink] = useState('');
    const [newEventHours, setNewEventHours] = useState('12');
    const [newEventMinutes, setNewEventMinutes] = useState('00');
    const [newEventNotification, setNewEventNotification] = useState(true);
    const [newEventColor, setNewEventColor] = useState(koCalendarColor);
    const [pendingHolidays, setPendingHolidays] = useState(null);
    const [importColor, setImportColor] = useState(koCalendarColor);
    const [isPickerMode, setIsPickerMode] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('kobar_plugin_events', JSON.stringify(localEvents));
        pushBarState();
    }, [localEvents]);

    useEffect(() => {
        localStorage.setItem('kobar_plugin_calendar_color', koCalendarColor);
    }, [koCalendarColor]);

    // Esc peels one layer at a time: menu, then form / import / picker, then the panel.
    const layersRef = useRef({});
    layersRef.current = { menuOpen, editing: !!editingEventDate, importing: !!pendingHolidays, picker: isPickerMode };
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            const l = layersRef.current;
            if (l.menuOpen) setMenuOpen(false);
            else if (l.editing) closeForm();
            else if (l.importing) setPendingHolidays(null);
            else if (l.picker) setIsPickerMode(false);
            else onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose]);

    const addCalendarEvent = (event) => {
        setLocalEventsState(prev => [...prev, { ...event, id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000), colorId: event.colorId || koCalendarColor }]);
    };
    const updateCalendarEvent = (id, updatedEvent) => {
        setLocalEventsState(prev => prev.map(e => e.id === id ? { ...e, ...updatedEvent } : e));
    };
    const deleteCalendarEvent = (id) => {
        setLocalEventsState(prev => prev.filter(e => e.id !== id));
    };

    // Google layer: component memory only, read-only. Failures leave it empty.
    const [gcalState, setGcalState] = useState(null);
    const [gcalEvents, setGcalEvents] = useState([]);
    const gcalMonthKey = format(currentDate, 'yyyy-MM');
    useEffect(() => {
        if (!gcalSupported()) return undefined;
        let cancelled = false;
        const refresh = async () => {
            try {
                const st = await window.api.gcalStatus?.();
                if (cancelled) return;
                setGcalState(st || null);
                if (!st || st.state !== 'connected' || !st.enabled) { setGcalEvents([]); return; }
                const base = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const from = startOfMonth(subMonths(base, 1));
                const to = endOfMonth(addMonths(base, 1));
                const list = await window.api.gcalListEvents({ from: from.toISOString(), to: to.toISOString() });
                if (!cancelled) setGcalEvents(Array.isArray(list) ? list : []);
            } catch {
                if (!cancelled) setGcalEvents([]);
            }
        };
        refresh();
        const timer = setInterval(() => { if (document.visibilityState !== 'hidden') refresh(); }, 15 * 60 * 1000);
        return () => { cancelled = true; clearInterval(timer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gcalMonthKey]);
    const gcalActive = !!(gcalState && gcalState.state === 'connected' && gcalState.enabled);
    const gcalNeedsSetup = !!(gcalSupported() && gcalState && (gcalState.state === 'not-connected' || gcalState.state === 'reconnect-needed'));
    const openGcalSettings = () => { try { window.api?.openSettings?.('integrations'); } catch { /* ignore */ } };

    const PANEL_W = 400;
    const getPopupStyle = () => {
        if (!anchorRect) return { display: 'none' };

        const popupHeight = Math.min(780, (screenBounds?.height ?? 800) - 48);
        const popupWidth = PANEL_W;
        const screenHeight = screenBounds?.height ?? 800;
        const screenWidth = screenBounds?.width ?? 1200;
        const offsetTop = sidebarPosition ? sidebarPosition.y : 0;
        const offsetLeft = sidebarPosition ? sidebarPosition.x : 0;

        const style = {
            position: 'absolute',
            width: popupWidth,
            maxHeight: popupHeight,
            zIndex: 99999,
            backgroundColor: T_SHELL,
            border: '1px solid var(--kb-stroke-subtle, var(--theme-border))',
            borderRadius: 32,
            boxShadow: 'var(--kb-shadow-e3, 0 12px 32px rgba(0,0,0,.45))',
            color: T_FG1,
            fontFamily: 'var(--kb-font, inherit)',
            willChange: 'transform, opacity',
            transitionProperty: 'opacity, transform, filter'
        };

        const screenXInViewport = (screenBounds?.x ?? 0) - window.screenX;
        const screenYInViewport = (screenBounds?.y ?? 0) - window.screenY;

        if (orientation === "horizontal") {
            let adjustedLeft = (anchorRect.left - offsetLeft) + (anchorRect.width / 2) - (popupWidth / 2);
            const maxLeft = screenXInViewport + (screenWidth - offsetLeft) - popupWidth - 20;
            const minLeft = screenXInViewport - offsetLeft + 20;
            if (adjustedLeft < minLeft) adjustedLeft = minLeft;
            if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;

            if (!isSmartPositioning) {
                style.left = '50%';
                style.transform = 'translateX(-50%)';
            } else {
                style.left = adjustedLeft;
            }

            if (edgePosition === 'top') {
                style.top = '100%';
                style.marginTop = '12px';
            } else {
                style.bottom = '100%';
                style.marginBottom = '12px';
            }
        } else {
            let adjustedTop = (anchorRect.top - offsetTop) - 20 + (anchorRect.height / 2) - (popupHeight / 2);
            const maxTop = screenYInViewport + (screenHeight - offsetTop) - popupHeight - 20;
            const minTop = screenYInViewport - offsetTop + 20;
            if (adjustedTop < minTop) adjustedTop = minTop;
            if (adjustedTop > maxTop) adjustedTop = maxTop;

            if (!isSmartPositioning) {
                style.top = '50%';
                style.transform = 'translateY(-50%)';
            } else {
                style.top = adjustedTop;
            }

            if (edgePosition === 'left') {
                style.left = '100%';
                style.marginLeft = '12px';
            } else {
                style.right = '100%';
                style.marginRight = '12px';
            }
        }
        return style;
    };

    const popupRef = useRef(null);
    const fileInputRef = useRef(null);
    const isSmartRef = useRef(isSmartPositioning);
    useEffect(() => { isSmartRef.current = isSmartPositioning; }, [isSmartPositioning]);

    useEffect(() => {
        const onDrag = (e) => {
            if (!popupRef.current || !anchorRect || !isSmartRef.current) return;
            const newX = e.detail.x;
            const newY = e.detail.y;
            const popupHeight = Math.min(780, (screenBounds?.height ?? 800) - 48);
            const popupWidth = PANEL_W;

            const screenXInViewport = (screenBounds?.x ?? 0) - window.screenX;
            const screenYInViewport = (screenBounds?.y ?? 0) - window.screenY;

            if (orientation === "horizontal") {
                const screenWidth = screenBounds?.width ?? 1200;
                let adjustedLeft = (anchorRect.left - newX) + (anchorRect.width / 2) - (popupWidth / 2);
                const maxLeft = screenXInViewport + (screenWidth - newX) - popupWidth - 20;
                const minLeft = screenXInViewport - newX + 20;
                if (adjustedLeft < minLeft) adjustedLeft = minLeft;
                if (adjustedLeft > maxLeft) adjustedLeft = maxLeft;
                popupRef.current.style.left = `${adjustedLeft}px`;
            } else {
                const screenHeight = screenBounds?.height ?? 800;
                let adjustedTop = (anchorRect.top - newY) - 20 + (anchorRect.height / 2) - (popupHeight / 2);
                const maxTop = screenYInViewport + (screenHeight - newY) - popupHeight - 20;
                const minTop = screenYInViewport - newY + 20;
                if (adjustedTop < minTop) adjustedTop = minTop;
                if (adjustedTop > maxTop) adjustedTop = maxTop;
                popupRef.current.style.top = `${adjustedTop}px`;
            }
        };
        document.addEventListener('kobar-drag', onDrag);
        return () => document.removeEventListener('kobar-drag', onDrag);
    }, [anchorRect, screenBounds, orientation]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleImportHolidays = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result);
                if (json && json.holidays && Array.isArray(json.holidays)) {
                    setPendingHolidays(json.holidays);
                    setImportColor(koCalendarColor);
                }
            } catch (err) {
                console.error("Failed to parse holidays JSON", err);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formRef = useRef(null);
    useEffect(() => { if (editingEventDate && formRef.current) formRef.current.scrollIntoView({ block: 'nearest' }); }, [editingEventDate, editingEventId]);
    const closeForm = () => {
        setEditingEventDate(null);
        setEditingEventId(null);
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventMeetingLink('');
    };
    const openAddForm = (day) => {
        setMenuOpen(false);
        setEditingEventDate(day);
        setEditingEventId(null);
        setNewEventColor(koCalendarColor);
    };
    const openEditForm = (ev) => {
        const d = parseISO(ev.startTime);
        setEditingEventDate(d);
        setEditingEventId(ev.id);
        setNewEventTitle(ev.title);
        setNewEventDescription(ev.description || '');
        setNewEventMeetingLink(ev.meetingLink || '');
        setNewEventHours(format(d, 'HH'));
        setNewEventMinutes(format(d, 'mm'));
        setNewEventNotification(!!ev.notificationEnabled);
        setNewEventColor(ev.colorId || koCalendarColor);
    };
    const submitForm = (e) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;
        const eventStart = new Date(editingEventDate);
        eventStart.setHours(parseInt(newEventHours, 10) || 0);
        eventStart.setMinutes(parseInt(newEventMinutes, 10) || 0);
        eventStart.setSeconds(0);
        if (editingEventId) {
            updateCalendarEvent(editingEventId, {
                title: newEventTitle.trim(),
                description: newEventDescription.trim(),
                meetingLink: newEventMeetingLink.trim(),
                startTime: eventStart.toISOString(),
                endTime: eventStart.toISOString(),
                notificationEnabled: newEventNotification,
                colorId: newEventColor
            });
        } else {
            addCalendarEvent({
                title: newEventTitle.trim(),
                description: newEventDescription.trim(),
                meetingLink: newEventMeetingLink.trim(),
                startTime: eventStart.toISOString(),
                endTime: eventStart.toISOString(),
                notificationEnabled: newEventNotification,
                notificationMinutes: 15,
                colorId: newEventColor
            });
        }
        closeForm();
    };
    const doImport = () => {
        const addedKeys = new Set();
        pendingHolidays.forEach((holiday) => {
            if (holiday.date) {
                const date = new Date(holiday.date);
                date.setHours(0, 0, 0, 0);
                const startTime = date.toISOString();
                const title = holiday.name || 'Holiday';
                const key = `${title}-${startTime}`;
                const isDuplicate = localEvents.some(ev => ev.title === title && ev.startTime === startTime);
                if (!isDuplicate && !addedKeys.has(key)) {
                    addedKeys.add(key);
                    addCalendarEvent({ title, startTime, endTime: startTime, notificationEnabled: false, notificationMinutes: 15, colorId: importColor });
                }
            }
        });
        setPendingHolidays(null);
    };

    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    // Force exactly 42 days (6 weeks) to prevent height flickering
    const dayIntervals = Array.from({ length: 42 }).map((_, i) => addDays(startDate, i));
    const selVisible = dayIntervals.some(d => isSameDay(d, selectedDate));

    // Arrow keys move the selected day; the grid follows into other months.
    const focusSelRef = useRef(false);
    useEffect(() => {
        if (!focusSelRef.current) return;
        focusSelRef.current = false;
        const el = popupRef.current && popupRef.current.querySelector('[data-kc-sel="1"]');
        if (el) el.focus();
    }, [selectedDate]);
    const onCellKey = (e) => {
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = addDays(selectedDate, step);
        focusSelRef.current = true;
        setSelectedDate(next);
        if (!isSameMonth(next, currentDate)) setCurrentDate(next);
    };

    const eventsOn = (day) => localEvents.filter(ev => ev && ev.startTime && isSameDay(parseISO(ev.startTime), day));
    const byTime = (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    const dayEvents = eventsOn(selectedDate).sort(byTime);
    const dayGoogle = gcalActive ? gcalEventsOnDay(gcalEvents, selectedDate) : [];
    const dayTodos = todos.filter(x => x && x.dueDate && isSameDay(parseISO(x.dueDate), selectedDate));
    const nextDayStart = new Date(selectedDate); nextDayStart.setHours(0, 0, 0, 0); nextDayStart.setDate(nextDayStart.getDate() + 1);
    const upcoming = localEvents.filter(ev => ev && ev.startTime && new Date(ev.startTime) >= nextDayStart).sort(byTime).slice(0, 4);
    const hasDayItems = dayEvents.length + dayGoogle.length + dayTodos.length > 0;
    const dayCount = dayEvents.length + dayGoogle.length;

    const monthTitle = dfmt(currentDate, { month: 'long' }) + ' ' + currentDate.getFullYear();
    const ColorDots = ({ value, onPick, size = 20 }) => (
        <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
            {KC_COLORS.map(color => (
                <button
                    key={color}
                    type="button"
                    aria-label={tr('colorLabel') + ' ' + color}
                    aria-pressed={value === color}
                    onClick={() => onPick(color)}
                    style={{ width: size, height: size, borderRadius: size / 2, border: 0, padding: 0, backgroundColor: color, opacity: value === color ? 1 : 0.5, boxShadow: value === color ? '0 0 0 2px ' + T_SURFACE + ', 0 0 0 4px ' + T_FG2 : 'none' }}
                />
            ))}
        </div>
    );
    const cardStyle = { background: T_SURFACE, borderRadius: 24, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
    const rowStyle = { borderRadius: 16, background: T_TILE, minHeight: 52, padding: '8px 8px 8px 12px', display: 'flex', alignItems: 'center', gap: 12 };
    const smallBtn = (danger) => ({ width: 32, height: 32, borderRadius: 16, border: 0, background: T_INSET, color: danger ? 'var(--kb-danger, #f87171)' : T_FG1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 });
    const ico = (name, size = 18, fill) => <span className={'material-symbols-outlined' + (fill ? ' kocal-fill' : '')} style={{ fontSize: size }}>{name}</span>;

    const renderEventRow = (ev, showDate) => {
        const d = parseISO(ev.startTime);
        const col = ev.colorId || koCalendarColor;
        return (
            <div key={ev.id} style={rowStyle}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: col, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1, cursor: showDate ? 'pointer' : 'default' }} onClick={showDate ? () => { setSelectedDate(d); setCurrentDate(d); } : undefined}>
                    <div className="flex items-center" style={{ gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T_FG1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                        {ev.notificationEnabled && <span className="material-symbols-outlined kocal-fill" style={{ fontSize: 14, color: T_FG3, flexShrink: 0 }}>notifications_active</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T_FG2, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ev.description || undefined}>
                        {showDate ? dfmt(d, { day: 'numeric', month: 'short' }) + ' · ' : ''}{format(d, 'HH:mm')}{ev.description ? ' · ' + ev.description : ''}
                    </div>
                </div>
                {ev.meetingLink && (
                    <button type="button" onClick={() => window.api?.openExternal?.(ev.meetingLink)} style={{ ...smallBtn(false), background: T_CONTAINER, color: T_ON_CONTAINER }} title={tr('join')} aria-label={tr('join')}>{ico('videocam')}</button>
                )}
                <button type="button" onClick={() => openEditForm(ev)} style={smallBtn(false)} title={tr('edit')} aria-label={tr('edit')}>{ico('edit')}</button>
                <button type="button" onClick={() => deleteCalendarEvent(ev.id)} style={smallBtn(true)} title={tr('del')} aria-label={tr('del')}>{ico('delete')}</button>
            </div>
        );
    };

    return (
        <div
            ref={popupRef}
            className="kocal-panel pointer-events-auto overflow-hidden flex flex-col"
            style={{ ...getPopupStyle(), padding: 20 }}
        >
            <style>{KC_CSS}</style>
            <div className="flex items-center drag-region" style={{ gap: 12, marginBottom: 16, flex: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 15, background: T_CONTAINER, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined kocal-fill" style={{ fontSize: 24, color: T_ACCENT }}>calendar_month</span>
                </div>
                <div className="flex-1 no-drag-region" style={{ minWidth: 0 }}>
                    <button
                        type="button"
                        onClick={() => setIsPickerMode(!isPickerMode)}
                        className="flex items-center whitespace-nowrap"
                        style={{ background: 'transparent', border: 0, padding: 0, color: T_FG1, fontSize: 19, fontWeight: 600, fontFamily: T_DISPLAY, textAlign: 'start', gap: 2 }}
                        title={tr('jump')}
                        aria-label={tr('jump') + ': ' + monthTitle}
                        aria-expanded={isPickerMode}
                    >
                        <span>{monthTitle}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: T_FG2 }}>{isPickerMode ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
                    </button>
                </div>
                <div className="flex items-center shrink-0 no-drag-region">
                    <button type="button" onClick={() => onClose()} style={iconBtn} aria-label={tr('close')}>{ico('close', 20)}</button>
                </div>
            </div>

            <div className="flex items-center no-drag-region" style={{ gap: 8, marginBottom: 12, flex: 'none', position: 'relative' }}>
                <button type="button" onClick={handlePrevMonth} style={iconBtn} aria-label={tr('prev')} title={tr('prev')}>{ico('chevron_left', 22)}</button>
                <button type="button" onClick={handleNextMonth} style={iconBtn} aria-label={tr('next')} title={tr('next')}>{ico('chevron_right', 22)}</button>
                <button type="button" onClick={handleToday} style={{ height: 36, padding: '0 16px', borderRadius: 18, border: 0, background: T_CONTAINER, color: T_ON_CONTAINER, fontSize: 13, fontWeight: 600 }}>{tr('today')}</button>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setMenuOpen(!menuOpen)} style={{ ...iconBtn, background: menuOpen ? T_CONTAINER : T_INSET, color: menuOpen ? T_ON_CONTAINER : T_FG1 }} aria-label={tr('more')} title={tr('more')} aria-expanded={menuOpen} aria-haspopup="menu">{ico('more_horiz', 22)}</button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportHolidays} style={{ display: 'none' }} />
                {menuOpen && (
                    <div role="menu" style={{ position: 'absolute', top: 44, right: 0, zIndex: 5, width: 248, background: T_SURFACE, border: '1px solid var(--kb-stroke-subtle, rgba(255,255,255,.1))', borderRadius: 20, padding: 8, boxShadow: 'var(--kb-shadow-e3, 0 12px 32px rgba(0,0,0,.45))', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }} style={{ height: 44, borderRadius: 14, border: 0, background: 'transparent', color: T_FG1, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', fontSize: 14, fontWeight: 500, textAlign: 'start' }}>
                            <span style={{ color: T_FG2, display: 'flex' }}>{ico('download', 20)}</span>{tr('importHolidays')}
                        </button>
                        <div style={{ padding: '8px 12px 10px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T_FG2, marginBottom: 8 }}>{tr('defColor')}</div>
                            <ColorDots value={koCalendarColor} onPick={setKoCalendarColor} size={24} />
                        </div>
                    </div>
                )}
            </div>

            <div className="kocal-body custom-scrollbar flex flex-col" style={{ minHeight: 0, flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden', gap: 12 }}>
                {isPickerMode ? (
                    <div style={{ ...cardStyle, gap: 16 }}>
                        <div className="flex items-center justify-center" style={{ gap: 16 }}>
                            <button type="button" onClick={() => setCurrentDate(subMonths(currentDate, 12))} style={iconBtn} aria-label={tr('prev')}>{ico('chevron_left', 20)}</button>
                            <input
                                type="number"
                                aria-label={tr('year')}
                                value={currentDate.getFullYear()}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                        const d = new Date(currentDate);
                                        d.setFullYear(val);
                                        setCurrentDate(d);
                                    }
                                }}
                                className="kc-year no-drag-region"
                                style={{ background: 'transparent', border: 0, outline: 'none', textAlign: 'center', width: 80, fontSize: 22, fontWeight: 600, fontFamily: T_DISPLAY, color: T_FG1, fontVariantNumeric: 'tabular-nums' }}
                            />
                            <button type="button" onClick={() => setCurrentDate(addMonths(currentDate, 12))} style={iconBtn} aria-label={tr('next')}>{ico('chevron_right', 20)}</button>
                        </div>
                        <div className="grid grid-cols-3" style={{ gap: 8 }}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => { const d = new Date(currentDate); d.setDate(1); d.setMonth(i); setCurrentDate(d); setIsPickerMode(false); }}
                                    style={{ height: 48, borderRadius: 16, border: 0, fontSize: 14, fontWeight: 600, background: currentDate.getMonth() === i ? T_ACCENT : T_TILE, color: currentDate.getMonth() === i ? T_ON_ACCENT : T_FG1 }}
                                >
                                    {dfmt(new Date(2026, i, 1), { month: 'short' })}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div role="grid" aria-label={monthTitle}>
                            <div className="grid grid-cols-7" style={{ gap: 4, paddingBottom: 4 }}>
                                {[5, 6, 7, 8, 9, 10, 11].map((day, i) => (
                                    <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: T_FG3 }}>{dfmt(new Date(2026, 0, day), { weekday: 'short' })}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7" style={{ gap: '2px 4px' }}>
                                {dayIntervals.map((day, i) => {
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    const isToday = isSameDay(day, new Date());
                                    const isSelected = isSameDay(day, selectedDate);
                                    const evs = eventsOn(day);
                                    const hasTodo = todos.some(x => x && x.dueDate && isSameDay(parseISO(x.dueDate), day));
                                    const hasG = gcalActive && gcalEventsOnDay(gcalEvents, day).length > 0;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            role="gridcell"
                                            className="kc-cell"
                                            data-kc-sel={isSelected ? '1' : '0'}
                                            tabIndex={isSelected || (!selVisible && i === 7) ? 0 : -1}
                                            aria-pressed={isSelected}
                                            aria-current={isToday ? 'date' : undefined}
                                            aria-label={dfmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            onClick={() => setSelectedDate(day)}
                                            onDoubleClick={() => openAddForm(day)}
                                            onKeyDown={onCellKey}
                                            style={{ height: 40, borderRadius: 14, border: 0, background: isSelected ? T_CONTAINER : 'transparent', opacity: isCurrentMonth ? 1 : 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0 }}
                                        >
                                            <span style={{ width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', background: isToday ? T_ACCENT : 'transparent', color: isToday ? T_ON_ACCENT : (isSelected ? T_ON_CONTAINER : (isCurrentMonth ? T_FG1 : T_FG3)) }}>{format(day, 'd')}</span>
                                            <span style={{ display: 'flex', gap: 3, height: 6 }}>
                                                {evs.slice(0, 3).map((ev, ei) => <span key={ei} style={kcDot(ev.colorId || koCalendarColor, 5)} />)}
                                                {hasG && <span style={kcDot(GCAL_COLOR, 5)} />}
                                                {hasTodo && <span style={kcDot(T_FG3, 5)} />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {pendingHolidays ? (
                            <div style={cardStyle}>
                                <div className="flex items-center justify-between">
                                    <span style={{ fontSize: 15, fontWeight: 600, fontFamily: T_DISPLAY, color: T_FG1 }}>{tr('importHolidays')}</span>
                                    <button type="button" onClick={() => setPendingHolidays(null)} style={smallBtn(false)} aria-label={tr('cancel')}>{ico('close')}</button>
                                </div>
                                <div style={{ fontSize: 13, color: T_FG2 }}>{tr('found', pendingHolidays.length)}</div>
                                <ColorDots value={importColor} onPick={setImportColor} size={24} />
                                <button type="button" onClick={doImport} style={{ ...pillFilled, width: '100%' }}>{tr('importN', pendingHolidays.length)}</button>
                            </div>
                        ) : editingEventDate ? (
                            <form ref={formRef} onSubmit={submitForm} style={cardStyle}>
                                <div className="flex items-center justify-between">
                                    <span style={{ fontSize: 15, fontWeight: 600, fontFamily: T_DISPLAY, color: T_FG1 }}>
                                        {editingEventId ? tr('edit') : tr('add')} · {dfmt(editingEventDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <input autoFocus type="text" placeholder={tr('evTitle')} aria-label={tr('evTitle')} value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="no-drag-region" style={{ ...inputStyle, background: T_INSET, height: 44 }} />
                                <textarea placeholder={tr('evDesc')} aria-label={tr('evDesc')} value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} className="no-drag-region custom-scrollbar" style={{ ...inputStyle, resize: 'none' }} rows={2} />
                                <div className="relative" style={{ position: 'relative' }}>
                                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: 12, fontSize: 18, color: T_FG3 }}>link</span>
                                    <input type="text" placeholder={tr('evLink')} aria-label={tr('evLink')} value={newEventMeetingLink} onChange={(e) => setNewEventMeetingLink(e.target.value)} className="no-drag-region" style={{ ...inputStyle, paddingLeft: 40, height: 44 }} />
                                </div>
                                <div className="flex items-center" style={{ gap: 8 }}>
                                    <div className="flex items-center" style={{ background: T_INSET, borderRadius: 12, height: 32, padding: '0 10px', gap: 2 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: T_FG3, marginRight: 4 }}>schedule</span>
                                        <input
                                            type="text" inputMode="numeric" maxLength={2} aria-label="HH" value={newEventHours}
                                            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); if (parseInt(v) < 24 || v === '') setNewEventHours(v); }}
                                            onBlur={() => setNewEventHours(prev => prev.padStart(2, '0'))}
                                            style={{ width: 24, background: 'transparent', border: 0, outline: 'none', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T_FG1, fontVariantNumeric: 'tabular-nums' }}
                                        />
                                        <span style={{ color: T_FG3 }}>:</span>
                                        <input
                                            type="text" inputMode="numeric" maxLength={2} aria-label="MM" value={newEventMinutes}
                                            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); if (parseInt(v) < 60 || v === '') setNewEventMinutes(v); }}
                                            onBlur={() => setNewEventMinutes(prev => prev.padStart(2, '0'))}
                                            style={{ width: 24, background: 'transparent', border: 0, outline: 'none', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T_FG1, fontVariantNumeric: 'tabular-nums' }}
                                        />
                                    </div>
                                    <button type="button" aria-pressed={newEventNotification} onClick={() => setNewEventNotification(!newEventNotification)} style={kcChip(newEventNotification)}>
                                        {ico(newEventNotification ? 'notifications_active' : 'notifications_off', 16, newEventNotification)}
                                        {newEventNotification ? tr('alertOn') : tr('alertOff')}
                                    </button>
                                    <div style={{ flex: 1 }} />
                                </div>
                                <ColorDots value={newEventColor} onPick={setNewEventColor} size={22} />
                                <div className="flex" style={{ gap: 8 }}>
                                    <button type="button" onClick={closeForm} style={{ ...pillFilled, background: T_CONTAINER, color: T_ON_CONTAINER, flex: '0 0 auto' }}>{tr('cancel')}</button>
                                    <button type="submit" disabled={!newEventTitle.trim()} style={{ ...pillFilled, flex: 1 }}>{editingEventId ? tr('update') : tr('save')}</button>
                                </div>
                            </form>
                        ) : (
                            <div style={cardStyle}>
                                <div className="flex items-center" style={{ gap: 12 }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: T_DISPLAY, color: T_FG1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dfmt(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                        <div style={{ fontSize: 12, color: T_FG2, marginTop: 2 }}>{isSameDay(selectedDate, new Date()) ? tr('today') : selectedDate.getFullYear()}</div>
                                    </div>
                                    <button type="button" onClick={() => openAddForm(selectedDate)} style={{ ...pillFilled, display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 0 14px' }}>{ico('add', 20)}{tr('add')}</button>
                                </div>
                                {gcalNeedsSetup && (
                                    typeof window.api?.openSettings === 'function' ? (
                                        <button type="button" onClick={openGcalSettings} style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'start', fontSize: 12, textDecoration: 'underline', color: GCAL_COLOR }}>{gcalState.state === 'reconnect-needed' ? gt.reconnect : gt.setup}</button>
                                    ) : (
                                        <span style={{ fontSize: 12, color: T_FG2 }}>{gcalState.state === 'reconnect-needed' ? gt.reconnect : gt.setup}</span>
                                    )
                                )}
                                {hasDayItems && (
                                    <div className="flex flex-col custom-scrollbar" style={{ gap: 8, maxHeight: 224, overflowY: 'auto', overflowX: 'hidden' }}>
                                        {dayGoogle.map(gev => (
                                            <div key={gev.id} title={gt.title} style={rowStyle}>
                                                <div style={{ width: 4, height: 28, borderRadius: 2, background: GCAL_COLOR, flexShrink: 0 }} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: T_FG1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gev.title}</div>
                                                    <div style={{ fontSize: 12, color: GCAL_COLOR, fontVariantNumeric: 'tabular-nums' }}>{gev.allDay ? gt.allDay : format(new Date(gev.start), 'HH:mm')}</div>
                                                </div>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: GCAL_COLOR, marginRight: 4 }}>event</span>
                                            </div>
                                        ))}
                                        {dayEvents.map(ev => renderEventRow(ev, false))}
                                        {dayTodos.map(x => (
                                            <div key={x.id} style={{ ...rowStyle, minHeight: 44 }}>
                                                <span style={{ color: T_FG3, display: 'flex' }}>{ico(x.completed ? 'task_alt' : 'radio_button_unchecked', 20)}</span>
                                                <span style={{ fontSize: 14, color: T_FG2, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: x.completed ? 'line-through' : 'none' }}>{x.text || x.title}</span>
                                                <span style={{ fontSize: 11, color: T_FG3, marginRight: 4 }}>{tr('dueTasks')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!hasDayItems && (
                                    <div className="flex flex-col items-center" style={{ border: '2px dashed var(--kb-stroke-subtle, var(--theme-border, rgba(255,255,255,.1)))', borderRadius: 28, padding: '16px', gap: 8 }}>
                                        <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 15, background: T_CONTAINER, color: T_ACCENT }}>{ico('event_available', 24, true)}</div>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: T_FG1 }}>{tr('nothing')}</span>
                                    </div>
                                )}
                                {upcoming.length > 0 && (
                                    <div className="flex flex-col" style={{ gap: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T_FG2, letterSpacing: '.02em' }}>{tr('upcoming')}</span>
                                        {upcoming.map(ev => renderEventRow(ev, true))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

window.KoBarExtensions.registerPanel('ko-calender-plugin-panel', {
    id: 'ko-calender-plugin-panel',
    render: (props) => React.createElement(KoCalendarPluginPanel, props)
});

window.KoBarExtensions.registerSidebarButton({
    id: 'ko-calender-plugin-btn',
    icon: 'calendar_month',
    label: 'KoCalendar',
    tile: { template: 'value-caption', sensitive: false, live: false, pinnable: false },
    onClick: (e, anchorRect) => {
        const state = window.useAppStore.getState();
        if (state.activeExtensionPanelId === 'ko-calender-plugin-panel') {
            state.closeAllUtilityPopups?.();
            window.useAppStore.setState({ activeExtensionPanelId: null, activeExtensionAnchorRect: null });
        } else {
            state.closeAllUtilityPopups?.();
            window.useAppStore.setState({ 
                activeExtensionPanelId: 'ko-calender-plugin-panel',
                activeExtensionAnchorRect: anchorRect
            });
        }
    }
});
