const React = window.React;
const { useState, useEffect, useRef } = React;
const useAppStore = window.useAppStore;
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameMonth, isSameDay, addMonths, subMonths, eachDayOfInterval, parseISO, addDays } from 'date-fns';

// --- Google Calendar (read-only, in-memory layer; never persisted) ---
const GCAL_COLOR = '#4285f4';
const gcalSupported = () => typeof window !== 'undefined' && window.api && typeof window.api.gcalListEvents === 'function';
const GCAL_TEXT = {
    en: { setup: 'Google Calendar: set up in Settings > Integrations', reconnect: 'Google Calendar: reconnect in Settings > Integrations', title: 'Google Calendar (read-only)', allDay: 'All day' },
    tr: { setup: 'Google Takvim: Ayarlar > Entegrasyonlar bölümünden kurun', reconnect: 'Google Takvim: Ayarlar > Entegrasyonlar bölümünden yeniden bağlanın', title: 'Google Takvim (salt okunur)', allDay: 'Tüm gün' },
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
// One shared rule: Rounded face on Canlı hosts, Outlined fallback on older hosts.
const ICON_CSS = `
.kocal-panel .material-symbols-outlined { font-family: 'Material Symbols Rounded', 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 400; }
.kocal-panel .kocal-fill { font-variation-settings: 'FILL' 1, 'wght' 400; }
.kocal-panel button { cursor: pointer; }
.kocal-panel .kocal-cell:focus-visible, .kocal-panel button:focus-visible { outline: 2px solid var(--kb-accent, #7c9cff); outline-offset: 2px; }
`;
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

const KoCalendarPluginPanel = (props) => {
    const { onClose, anchorRect } = props;
    
    const edgePosition = useAppStore(state => state.edgePosition);
    const design = useAppStore(state => state.design);
    const glassOpacity = useAppStore(state => state.glassOpacity);
    const screenBounds = useAppStore(state => state.screenBounds);
    const isSmartPositioning = useAppStore(state => state.isPopupSmartPositioning);
    const isMac = useAppStore(state => state.isMac);
    
    const todos = (() => {
        try {
            return JSON.parse(localStorage.getItem('kobar_plugin_todos') || '[]');
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

    const [koCalendarColor, setKoCalendarColorState] = useState(() => {
        try {
            const saved = localStorage.getItem('kobar_plugin_calendar_color');
            if (saved) return saved;
        } catch(e) {}
        return '#60a5fa';
    });

    useEffect(() => {
        localStorage.setItem('kobar_plugin_events', JSON.stringify(localEvents));
        pushBarState();
    }, [localEvents]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        localStorage.setItem('kobar_plugin_calendar_color', koCalendarColor);
    }, [koCalendarColor]);

    const addCalendarEvent = (event) => {
        setLocalEventsState(prev => [...prev, { ...event, id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000), colorId: event.colorId || koCalendarColor }]);
    };

    const updateCalendarEvent = (id, updatedEvent) => {
        setLocalEventsState(prev => prev.map(e => e.id === id ? { ...e, ...updatedEvent } : e));
    };

    const deleteCalendarEvent = (id) => {
        setLocalEventsState(prev => prev.filter(e => e.id !== id));
    };

    const setKoCalendarColor = (color) => {
        setKoCalendarColorState(color);
    };
    const t = useAppStore(state => state.t) || ((k) => k);
    const language = useAppStore(state => state.language);
    const gt = GCAL_TEXT[language] || GCAL_TEXT.en;

    const [currentDate, setCurrentDate] = useState(new Date());
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

    const sidebarPosition = useAppStore(state => state.sidebarPosition);
    const orientation = useAppStore(state => state.orientation);

    const getPopupStyle = () => {
        if (!anchorRect) return { display: 'none' };
        
        const popupHeight = 680;
        const popupWidth = 480;
        const screenHeight = screenBounds?.height ?? 800;
        const screenWidth = screenBounds?.width ?? 1200;
        const offsetTop = sidebarPosition ? sidebarPosition.y : 0;
        const offsetLeft = sidebarPosition ? sidebarPosition.x : 0;

        const style = {
            position: 'absolute',
            width: popupWidth,
            zIndex: 99999,
            backgroundColor: T_SHELL,
            border: '1px solid var(--kb-stroke-subtle, var(--theme-border))',
            borderRadius: 32,
            boxShadow: 'var(--kb-shadow-e3, 0 12px 32px rgba(0,0,0,.45))',
            color: T_FG1,
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
            const popupHeight = 680;
            const popupWidth = 480;

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

    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    // Force exactly 42 days (6 weeks) to prevent height flickering
    const dayIntervals = Array.from({ length: 42 }).map((_, i) => addDays(startDate, i));

    return (
        <div
            ref={popupRef}
            className="kocal-panel pointer-events-auto overflow-hidden flex flex-col"
            style={{ ...getPopupStyle(), padding: 20 }}
        >
            <style>{ICON_CSS}</style>
            <div className="flex items-center drag-region" style={{ gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 15, background: T_CONTAINER, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined kocal-fill" style={{ fontSize: 24, color: T_ACCENT }}>calendar_month</span>
                </div>
                <div className="min-w-0 flex-1 no-drag-region" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                        type="button"
                        onClick={() => setIsPickerMode(!isPickerMode)}
                        className="flex items-center whitespace-nowrap"
                        style={{ background: 'transparent', border: 0, padding: 0, color: T_FG1, fontSize: 19, fontWeight: 600, fontFamily: T_DISPLAY, textAlign: 'start', gap: 2 }}
                        title={t('jumpToDate') || "Jump to Date"}
                        aria-expanded={isPickerMode}
                    >
                        <span className="truncate">{t(`month_${currentDate.getMonth()}`)} {currentDate.getFullYear()}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: T_FG2 }}>
                            {isPickerMode ? 'arrow_drop_up' : 'arrow_drop_down'}
                        </span>
                    </button>
                    <div className="flex" style={{ gap: 8 }}>
                        {['#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa'].map(color => (
                            <button
                                key={color}
                                type="button"
                                aria-label={color}
                                aria-pressed={koCalendarColor === color}
                                onClick={() => setKoCalendarColor(color)}
                                style={{ width: 12, height: 12, borderRadius: 6, border: 0, padding: 0, backgroundColor: color, opacity: koCalendarColor === color ? 1 : 0.45, boxShadow: koCalendarColor === color ? '0 0 0 2px ' + T_SHELL + ', 0 0 0 3.5px ' + T_FG2 : 'none' }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex items-center shrink-0 no-drag-region">
                    <button type="button" onClick={() => onClose()} style={iconBtn} aria-label={t('close') || 'Close'}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                    </button>
                </div>
            </div>
            <div className="flex items-center no-drag-region" style={{ gap: 6, marginBottom: 16 }}>
                <button type="button" onClick={handlePrevMonth} style={iconBtn} aria-label="‹">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_left</span>
                </button>
                <button type="button" onClick={handleNextMonth} style={iconBtn} aria-label="›">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_right</span>
                </button>
                <button type="button" onClick={handleToday} style={{ height: 32, padding: '0 14px', borderRadius: 16, border: 0, background: T_CONTAINER, color: T_ON_CONTAINER, fontSize: 13, fontWeight: 600 }}>{t('today')}</button>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={iconBtn} title={t('importHolidays') || "Import Holidays"} aria-label={t('importHolidays') || "Import Holidays"}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                </button>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleImportHolidays}
                    style={{ display: 'none' }}
                />
            </div>

            {isPickerMode ? (
                <div className="flex flex-col gap-4 flex-1" style={{ background: T_SURFACE, borderRadius: 24, padding: 16 }}>
                    <style>{`
                        .hide-number-arrows::-webkit-outer-spin-button,
                        .hide-number-arrows::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                    `}</style>
                    <div className="flex items-center justify-center gap-4">
                        <button type="button" onClick={() => setCurrentDate(subMonths(currentDate, 12))} style={iconBtn}>
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <input 
                            type="number" 
                            value={currentDate.getFullYear()} 
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    const d = new Date(currentDate);
                                    d.setFullYear(val);
                                    setCurrentDate(d);
                                }
                            }}
                            className="bg-transparent text-center w-20 outline-none no-drag-region hide-number-arrows"
                            style={{ WebkitAppearance: 'none', margin: 0, fontSize: 22, fontWeight: 600, fontFamily: T_DISPLAY, color: T_FG1, fontVariantNumeric: 'tabular-nums' }}
                        />
                        <button type="button" onClick={() => setCurrentDate(addMonths(currentDate, 12))} style={iconBtn}>
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 flex-1 mt-2">
                        {Array.from({length: 12}).map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => {
                                    const d = new Date(currentDate);
                                    d.setMonth(i);
                                    setCurrentDate(d);
                                    setIsPickerMode(false);
                                }}
                                className="flex items-center justify-center text-sm h-12"
                                style={{ borderRadius: 16, border: 0, fontWeight: 600, background: currentDate.getMonth() === i ? T_ACCENT : T_TILE, color: currentDate.getMonth() === i ? T_ON_ACCENT : T_FG1 }}
                            >
                                {t(`month_${i}`)}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
            <>
            <div className="grid grid-cols-7" style={{ gap: 4, paddingBottom: 6 }}>
                {[5, 6, 7, 8, 9, 10, 11].map((day, i) => (
                    <div key={i} className="text-center text-xs font-semibold" style={{ color: T_FG3 }}>{new Intl.DateTimeFormat(language || 'en', { weekday: 'short' }).format(new Date(2026, 0, day))}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 custom-scrollbar overflow-y-auto" style={{ gap: 4, marginBottom: 12 }}>
                {dayIntervals.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDate);
                    const isWeekend = i % 7 >= 5;
                                        
                    const dayEvents = localEvents.filter(ev => ev.startTime && isSameDay(parseISO(ev.startTime), day));
                    const dayTodos = todos.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));

                    return (
                        <div 
                            key={i} 
                            onClick={() => setSelectedDate(day)}
                            onDoubleClick={() => {
                                setEditingEventDate(day);
                                setNewEventColor(koCalendarColor);
                            }}
                            className="kocal-cell flex flex-col h-[62px] p-1.5 relative cursor-pointer group"
                            style={{
                                borderRadius: 12,
                                background: isWeekend ? T_TILE : T_SURFACE,
                                opacity: isCurrentMonth ? 1 : 0.35,
                                boxShadow: isSelected ? 'inset 0 0 0 2px ' + koCalendarColor : (editingEventDate && isSameDay(day, editingEventDate) ? 'inset 0 0 0 2px ' + T_ACCENT : 'none'),
                                overflow: 'hidden'
                            }}
                        >
                            <div className="flex justify-center items-center" style={{ marginBottom: 4 }}>
                                <span
                                    className="flex items-center justify-center"
                                    style={{
                                        width: 26, height: 26, borderRadius: 13, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                                        background: isToday ? T_ACCENT : 'transparent',
                                        color: isToday ? T_ON_ACCENT : (isCurrentMonth ? T_FG1 : T_FG3)
                                    }}
                                >
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="flex flex-wrap justify-center mt-auto" style={{ gap: 3 }}>
                                {dayEvents.slice(0, 3).map((ev, ei) => (
                                    <div key={ei} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ev.colorId || koCalendarColor }} title={ev.title} />
                                ))}
                                {gcalActive && gcalEventsOnDay(gcalEvents, day).length > 0 && (
                                    <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GCAL_COLOR }} title={gt.title} />
                                )}
                                {dayTodos.length > 0 && (
                                    <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T_FG3 }} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {pendingHolidays ? (
                <div className="flex flex-col gap-2 flex-1" style={{ background: T_SURFACE, borderRadius: 24, padding: 16 }}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold" style={{ color: T_FG1 }}>
                            {t('importHolidays') || "Import Holidays"}
                        </span>
                        <button type="button" onClick={() => setPendingHolidays(null)} style={{ ...iconBtn, width: 28, height: 28, borderRadius: 14 }} aria-label={t('close') || 'Close'}>
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                    <div className="text-xs mb-2" style={{ color: T_FG2 }}>
                        Found {pendingHolidays.length} holidays. Select a color to associate with them:
                    </div>
                    <div className="flex gap-2 w-fit mx-auto mb-2" style={{ background: T_INSET, borderRadius: 16, padding: 8 }}>
                        {['#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa'].map(color => (
                            <button 
                                key={color}
                                type="button"
                                onClick={() => setImportColor(color)}
                                style={{ width: 20, height: 20, borderRadius: 10, border: 0, backgroundColor: color, opacity: importColor === color ? 1 : 0.45, boxShadow: importColor === color ? '0 0 0 2px ' + T_INSET + ', 0 0 0 3.5px ' + T_FG2 : 'none' }}
                            />
                        ))}
                    </div>
                    <div className="mt-auto pt-2 flex justify-end">
                        <button 
                            onClick={() => {
                                const currentEvents = useAppStore.getState().localEvents || [];
                                const addedKeys = new Set();

                                pendingHolidays.forEach((holiday) => {
                                    if (holiday.date) {
                                        const date = new Date(holiday.date);
                                        date.setHours(0, 0, 0, 0);
                                        const startTime = date.toISOString();
                                        const title = holiday.name || 'Holiday';
                                        
                                        const key = `${title}-${startTime}`;
                                        const isDuplicate = currentEvents.some(ev => ev.title === title && ev.startTime === startTime);

                                        if (!isDuplicate && !addedKeys.has(key)) {
                                            addedKeys.add(key);
                                            addCalendarEvent({
                                                title: title,
                                                startTime: startTime,
                                                endTime: startTime,
                                                notificationEnabled: false,
                                                notificationMinutes: 15,
                                                colorId: importColor
                                            });
                                        }
                                    }
                                });
                                setPendingHolidays(null);
                            }}
                            style={{ ...pillFilled, width: '100%' }}
                        >
                            Import {pendingHolidays.length} Holidays
                        </button>
                    </div>
                </div>
            ) : editingEventDate ? (
                <div className="flex flex-col gap-2 flex-1" style={{ background: T_SURFACE, borderRadius: 24, padding: 16 }}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold" style={{ color: T_FG1 }}>
                            {editingEventId ? (t('editEvent') || 'Edit Event') : (t('addEvent') || 'Add Event')}: {format(editingEventDate, 'MMM d, yyyy')}
                        </span>
                        <button onClick={() => { 
                            setEditingEventDate(null); 
                            setEditingEventId(null);
                            setNewEventTitle(''); 
                            setNewEventDescription('');
                            setNewEventMeetingLink('');
                        }} style={{ ...iconBtn, width: 28, height: 28, borderRadius: 14 }} aria-label={t('close') || 'Close'}>
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                            const eventStart = new Date(editingEventDate);
                            eventStart.setHours(parseInt(newEventHours, 10));
                            eventStart.setMinutes(parseInt(newEventMinutes, 10));
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
                            setNewEventTitle('');
                            setNewEventDescription('');
                            setNewEventMeetingLink('');
                            setEditingEventDate(null);
                            setEditingEventId(null);
                    }} className="flex flex-col gap-2">
                        <div className="relative flex flex-col gap-2">
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('eventTitle') || 'Event Title'}
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="no-drag-region" style={{ ...inputStyle, paddingRight: 40 }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                                    <span className="material-symbols-outlined text-[14px]">event</span>
                                </div>
                            </div>
                            <textarea
                                placeholder={t('eventDescription') || 'Description (optional)'}
                                value={newEventDescription}
                                onChange={(e) => setNewEventDescription(e.target.value)}
                                className="no-drag-region resize-none custom-scrollbar" style={inputStyle}
                                rows={2}
                            />
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('meetingLink') || 'Meeting Link (optional)'}
                                    value={newEventMeetingLink}
                                    onChange={(e) => setNewEventMeetingLink(e.target.value)}
                                    className="no-drag-region" style={{ ...inputStyle, paddingLeft: 34 }}
                                />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                                    <span className="material-symbols-outlined text-[14px]">link</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1" style={{ background: T_INSET, borderRadius: 16, padding: 6 }}>
                                <span className="material-symbols-outlined text-[14px] text-slate-500 ml-1">schedule</span>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        maxLength={2}
                                        value={newEventHours}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                                            if (parseInt(v) < 24 || v === '') setNewEventHours(v);
                                        }}
                                        onBlur={() => setNewEventHours(prev => prev.padStart(2, '0'))}
                                        className="w-6 bg-transparent text-center text-xs text-white outline-none font-bold"
                                    />
                                    <span className="text-slate-600">:</span>
                                    <input 
                                        type="text" 
                                        maxLength={2}
                                        value={newEventMinutes}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                                            if (parseInt(v) < 60 || v === '') setNewEventMinutes(v);
                                        }}
                                        onBlur={() => setNewEventMinutes(prev => prev.padStart(2, '0'))}
                                        className="w-6 bg-transparent text-center text-xs text-white outline-none font-bold"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setNewEventNotification(!newEventNotification)}
                                className="flex items-center gap-2 text-[11px] font-semibold"
                                style={{ height: 32, padding: '0 12px', borderRadius: 16, border: 0, background: newEventNotification ? T_CONTAINER : T_TILE, color: newEventNotification ? T_ON_CONTAINER : T_FG2 }}
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    {newEventNotification ? 'notifications_active' : 'notifications_off'}
                                </span>
                                {newEventNotification ? (t('alertOn') || 'Alert On') : (t('noAlert') || 'No Alert')}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-2" style={{ background: T_INSET, borderRadius: 16, padding: 8 }}>
                                {['#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa'].map(color => (
                                    <button 
                                        key={color}
                                        type="button"
                                        onClick={() => setNewEventColor(color)}
                                        aria-label={color}
                                        aria-pressed={newEventColor === color}
                                        style={{ width: 16, height: 16, borderRadius: 8, border: 0, backgroundColor: color, opacity: newEventColor === color ? 1 : 0.45, boxShadow: newEventColor === color ? '0 0 0 2px ' + T_INSET + ', 0 0 0 3.5px ' + T_FG2 : 'none' }}
                                    />
                                ))}
                            </div>
                            <button type="submit" disabled={!newEventTitle.trim()} className="ml-auto disabled:opacity-50 disabled:cursor-not-allowed" style={pillFilled}>
                                {editingEventId ? (t('updateEvent') || 'Update') : (t('saveEvent') || 'Save')}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex flex-col gap-2 flex-1 relative group overflow-hidden" style={{ background: T_SURFACE, borderRadius: 24, padding: 16 }}>
                    {(() => {
                        const targetStartOfDay = new Date(selectedDate);
                        targetStartOfDay.setHours(0,0,0,0);
                        const agendaData = localEvents
                            .filter(e => e.startTime && new Date(e.startTime) >= targetStartOfDay)
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                        
                        const selectedDayHasEvent = agendaData.length > 0 && isSameDay(parseISO(agendaData[0].startTime), selectedDate);
                        
                        return (
                            <>
                                {gcalNeedsSetup && (
                                    typeof window.api?.openSettings === 'function' ? (
                                        <button onClick={openGcalSettings} className="text-[10px] text-left underline" style={{ color: GCAL_COLOR }}>{gcalState.state === 'reconnect-needed' ? gt.reconnect : gt.setup}</button>
                                    ) : (
                                        <span className="text-[10px] text-slate-400">{gcalState.state === 'reconnect-needed' ? gt.reconnect : gt.setup}</span>
                                    )
                                )}
                                <div className="flex justify-between items-center pr-1">
                                    <span style={{ fontSize: 13, fontWeight: 600, color: T_FG2 }}>
                                        {selectedDayHasEvent ? `${format(selectedDate, 'MMM d')} - ${t('events') || 'Events'}` : (t('upcomingEvents') || 'Upcoming Events')}
                                    </span>
                                    <button onClick={() => {
                                        setEditingEventDate(selectedDate);
                                        setNewEventColor(koCalendarColor);
                                    }} className="flex items-center justify-center relative z-20" style={{ width: 32, height: 32, borderRadius: 16, border: 0, background: T_CONTAINER, color: T_ON_CONTAINER }} aria-label={t('addEvent') || 'Add Event'}>
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar h-[160px] animate-in fade-in slide-in-from-top-1 pr-1">
                                    {gcalActive && gcalEventsOnDay(gcalEvents, selectedDate).map(gev => (
                                        <div key={gev.id} title={gt.title} className="flex justify-between items-center text-sm px-3 py-2 cursor-default select-none" style={{ borderRadius: 16, backgroundColor: T_TILE }}>
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                                                <span className="material-symbols-outlined text-[14px] shrink-0" style={{ color: GCAL_COLOR }}>event</span>
                                                <span className="truncate" style={{ color: T_FG1 }}>{gev.title}</span>
                                            </div>
                                            <span className="text-xs shrink-0" style={{ color: GCAL_COLOR }}>{gev.allDay ? gt.allDay : format(new Date(gev.start), 'HH:mm')}</span>
                                        </div>
                                    ))}
                                    {agendaData.slice(0, 8).map(ev => {
                                        const eventDate = parseISO(ev.startTime);
                                        const isEvToday = isSameDay(eventDate, new Date());
                                        const isEvSelected = isSameDay(eventDate, selectedDate);
                                        
                                        return (
                                            <div 
                                                key={ev.id} 
                                                onClick={() => {
                                                    setSelectedDate(eventDate);
                                                    setCurrentDate(eventDate);
                                                }}
                                                className="flex justify-between items-center text-sm group/event px-3 py-2 cursor-pointer"
                                                style={{ borderRadius: 16, backgroundColor: T_TILE }}
                                            >
                                                <div className="flex items-start gap-2.5 flex-1 min-w-0 mr-3 mt-1">
                                                    <div className="shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isEvSelected ? (ev.colorId || koCalendarColor) : isEvToday ? T_ACCENT : T_FG3 }} />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="truncate" style={{ color: T_FG1, fontWeight: isEvSelected ? '600' : '400' }}>{ev.title}</span>
                                                            {ev.meetingLink && (
                                                                <button onClick={(e) => { e.stopPropagation(); window.api?.openExternal?.(ev.meetingLink); }} className="text-blue-400 hover:text-blue-300 ml-1 shrink-0 bg-blue-400/10 rounded-full w-5 h-5 flex items-center justify-center transition-colors" title={t('joinMeeting') || 'Join Meeting'}>
                                                                    <span className="material-symbols-outlined text-[12px]">videocam</span>
                                                                </button>
                                                            )}
                                                            {ev.notificationEnabled && (
                                                                <span className="material-symbols-outlined text-xs text-primary/50 shrink-0">notifications_active</span>
                                                            )}
                                                        </div>
                                                        {ev.description && (
                                                            <span className="text-[11px] truncate mt-0.5" style={{ color: T_FG2 }} title={ev.description}>{ev.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs group-hover/event:hidden" style={{ color: T_FG2, fontVariantNumeric: 'tabular-nums' }}>
                                                        {isEvSelected ? format(eventDate, 'HH:mm') : format(eventDate, 'MMM d')}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
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
                                                        }}
                                                        className="hidden group-hover/event:flex w-4 h-4 items-center justify-center text-blue-400 hover:text-blue-300 bg-blue-400/10 rounded"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteCalendarEvent(ev.id);
                                                        }}
                                                        className="hidden group-hover/event:flex w-4 h-4 items-center justify-center text-red-400 hover:text-red-300 bg-red-400/10 rounded"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {agendaData.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30 mt-1">
                                           <span className="text-[11px]" style={{ color: T_FG3 }}>{t('noEventsFound') || 'No events found'}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
            </>
            )}
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
