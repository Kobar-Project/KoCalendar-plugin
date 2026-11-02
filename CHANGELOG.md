# Changelog

## 1.2.0 - 2026-11-02

- Canlı look: month title in the display font with round nav buttons and a Today pill, calendar cells with radius 12, today as a filled accent circle, 6 px event dots, weekends on the tile colour, Material Symbols Rounded icons, no glow or scale effects. Esc closes the panel.
- Bar tile: `value-caption` template (weekday, day of month, short month, badge with the number of today's events, localised label), refreshed at midnight and when events change. Event titles are never sent to the bar. Ignored on KoBar versions without tile support.
- Redesigned from its functions: a selected-day card with the plan and quick add; Google Calendar events (read only) in blue.

## 1.1.0

- Optional read-only Google Calendar layer (needs a KoBar version with Google Calendar (Experimental) enabled; hidden on older versions).
