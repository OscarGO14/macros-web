# Safari PWA Compatibility — Design

**Date:** 2026-02-28
**Target devices:** iPhone 14 Pro (iOS 16+), iPhone 16 Pro (iOS 18+)
**Use case:** App añadida a pantalla de inicio en Safari (modo standalone)

## Context

The app is used exclusively by 2 people via "Add to Home Screen" on iOS Safari. The current codebase has several issues that break or degrade the experience in standalone PWA mode on iPhone.

## Problems Found

| Severity | Problem | Files |
|----------|---------|-------|
| Critical | `<dialog>` + `showModal()` — `onChange` on inputs unreliable in iOS PWA, backdrop touch events broken | `SearchItemModal`, `ConfirmationModal` |
| Critical | No PWA manifest or Apple meta tags — standalone mode not enabled | `layout.tsx` |
| Critical | `100vh` includes browser toolbar on iOS — content gets clipped | `Screen`, `dashboard/page.tsx`, `login/page.tsx` |
| Important | `BottomNav` with `fixed bottom-0` no safe-area — hidden by home indicator on iPhone 14/16 Pro | `BottomNav` |
| Important | `Screen` with fixed `pb-20` — doesn't adapt to safe area | `Screen` |
| Minor | No touch feedback on buttons (only `hover:` which doesn't work on mobile) | `Button`, `ActionButton`, `SubmitButton` |
| Minor | Gray tap highlight on interactive elements | `globals.css` |
| Minor | Scroll in modal can trigger system pull-to-refresh | `SearchItemModal` |

## Design

### Section 1 — PWA Setup

**`src/app/layout.tsx`** — Add Next.js metadata for PWA:
- `viewport: { width: 'device-width', initialScale: 1, viewportFit: 'cover' }`
- `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Macros' }`

`viewportFit: 'cover'` enables `env(safe-area-inset-*)` usage throughout the app.

**`public/manifest.json`** — New file:
```json
{
  "name": "Macros Comida",
  "short_name": "Macros",
  "display": "standalone",
  "background_color": "#181920",
  "theme_color": "#181920",
  "start_url": "/"
}
```

### Section 2 — Viewport Height (`vh` → `dvh`)

`dvh` (dynamic viewport height) adjusts when the browser toolbar appears/disappears. `100vh` stays fixed at the full height including the toolbar, causing clipping.

- `src/components/ui/Screen/index.tsx`: `min-h-screen` → `min-h-dvh`, `pb-20` → `pb-[calc(5rem+env(safe-area-inset-bottom))]`
- `src/app/dashboard/page.tsx`: `min-h-[calc(100vh-2rem)]` → `min-h-[calc(100dvh-2rem)]`
- `src/app/auth/login/page.tsx`: `min-h-[calc(100vh-2rem)]` → `min-h-[calc(100dvh-2rem)]`

### Section 3 — BottomNav Safe Area

iPhone 14 Pro and 16 Pro both have a home indicator (~34px). `fixed bottom-0` without safe area places tabs behind the indicator.

**`src/components/BottomNav/index.tsx`**:
- Add `pb-[env(safe-area-inset-bottom)]` to the nav element
- Adjust inner content to use `pt-2` for consistent visual spacing

On devices without a home indicator, `env(safe-area-inset-bottom)` returns `0` — no impact.

### Section 4 — Replace `<dialog>` with Custom Modals

`<dialog>` in iOS PWA standalone mode has critical bugs: `onChange` may not fire on inputs, backdrop touch handling is broken, virtual keyboard can destroy the layout.

**Pattern:** `createPortal()` rendering directly into `document.body`, styled as a **bottom sheet** (native iOS pattern).

Structure for both `SearchItemModal` and `ConfirmationModal`:
```
createPortal(
  <div fixed inset-0 z-50>
    <div fixed inset-0 bg-black/50 (click → close) />
    <div fixed inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl
         bg-item-background overflow-hidden
         pb-[env(safe-area-inset-bottom)]>
      ...existing content unchanged...
    </div>
  </div>,
  document.body
)
```

Internal logic (search, selection, quantity, confirm/cancel) remains identical.
Scroll list inside modal uses `overflow-y-auto overscroll-contain` to prevent triggering system pull-to-refresh.

### Section 5 — Touch Feedback & Global CSS

**`src/app/globals.css`** — Add to `body`:
```css
-webkit-tap-highlight-color: transparent;
overscroll-behavior-y: none;
```

**`src/components/ui/ActionButton/index.tsx`**, **`Button/index.tsx`**, **`SubmitButton/index.tsx`**:
- Add `active:opacity-70` for tactile feedback on touch (no `hover:` on mobile)

## Files Changed

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Add PWA metadata + viewport |
| `public/manifest.json` | New file |
| `src/app/globals.css` | tap-highlight + overscroll |
| `src/components/ui/Screen/index.tsx` | dvh + safe-area pb |
| `src/app/dashboard/page.tsx` | dvh |
| `src/app/auth/login/page.tsx` | dvh |
| `src/components/BottomNav/index.tsx` | safe-area-inset-bottom |
| `src/components/SearchItemModal/index.tsx` | Replace dialog → createPortal bottom sheet |
| `src/components/ConfirmationModal/index.tsx` | Replace dialog → createPortal bottom sheet |
| `src/components/ui/ActionButton/index.tsx` | active:opacity-70 |
| `src/components/ui/Button/index.tsx` | active:opacity-70 |
| `src/components/ui/SubmitButton/index.tsx` | active:opacity-70 |
