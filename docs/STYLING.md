# Styling conventions

- **Inline styles for layout are allowed.** Dynamic positioning and sizing (e.g. scene cards) use `element.style.left`, `element.style.top`, and related properties. A previous "avoid inline styling" refactor was reverted after it caused regressions.
- **State and presentation** can use CSS classes (e.g. `.hovered`, `.selected`, `.clone`) where appropriate.
- **Theme data:** `applyPaletteToElement()` in `useColorPalette.mjs` sets `--data-*` variables on elements; do not duplicate or override these with ad-hoc inline styles elsewhere.
