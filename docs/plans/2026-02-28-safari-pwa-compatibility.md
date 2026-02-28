# Safari PWA Compatibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app work correctly as a PWA (Add to Home Screen) on iPhone 14 Pro and iPhone 16 Pro running iOS Safari.

**Architecture:** 12 files touched across 6 independent tasks. No new dependencies needed — `createPortal` is already in `react-dom`. Tasks can be done in any order except Task 4 and Task 5 should be done after understanding the portal pattern in Task 4.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript. No test suite — verify each task visually using the browser.

**Design doc:** `docs/plans/2026-02-28-safari-pwa-compatibility-design.md`

---

## Task 1: PWA Setup — manifest + meta tags

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/layout.tsx`

**Step 1: Create `public/manifest.json`**

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

**Step 2: Update `src/app/layout.tsx`**

Replace the current `metadata` export and add a `viewport` export. The file currently has:

```ts
export const metadata: Metadata = {
  title: 'Macros Comida',
  description: 'Seguimiento de macros y calorías',
};
```

Replace with:

```ts
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Macros Comida',
  description: 'Seguimiento de macros y calorías',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Macros',
  },
};
```

Note: `Viewport` must be a named export, not inside `metadata`. Next.js 13.4+ requires this separation.

**Step 3: Verify**

Run `npm run build` — should compile without errors. Then run `npm run dev` and open DevTools → Application → Manifest. The manifest should load with `display: standalone`.

**Step 4: Commit**

```bash
git add public/manifest.json src/app/layout.tsx
git commit -m "feat(pwa): add manifest and apple web app meta tags"
```

---

## Task 2: Viewport height — replace `vh` with `dvh`

**Files:**
- Modify: `src/components/ui/Screen/index.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/auth/login/page.tsx`

**Step 1: Update `src/components/ui/Screen/index.tsx`**

Current:
```tsx
export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background pt-4 pb-20">
      <div className="mx-auto w-full max-w-xl px-6">{children}</div>
    </main>
  );
}
```

Replace with:
```tsx
export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-background pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-xl px-6">{children}</div>
    </main>
  );
}
```

`5rem` = 80px = h-20 (the BottomNav height). Adding `env(safe-area-inset-bottom)` on top of that covers the home indicator.

**Step 2: Update `src/app/dashboard/page.tsx`**

Find line 49:
```tsx
<div className="flex flex-col items-center justify-evenly gap-4 min-h-[calc(100vh-2rem)]">
```

Replace with:
```tsx
<div className="flex flex-col items-center justify-evenly gap-4 min-h-[calc(100dvh-2rem)]">
```

**Step 3: Update `src/app/auth/login/page.tsx`**

Find line 41:
```tsx
<div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
```

Replace with:
```tsx
<div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center">
```

**Step 4: Verify**

Run `npm run dev`. Open the app. Confirm no content is clipped at the bottom on any page.

**Step 5: Commit**

```bash
git add src/components/ui/Screen/index.tsx src/app/dashboard/page.tsx src/app/auth/login/page.tsx
git commit -m "fix(layout): replace 100vh with dvh for iOS Safari compatibility"
```

---

## Task 3: BottomNav — safe-area-inset-bottom

**Files:**
- Modify: `src/components/BottomNav/index.tsx`

**Step 1: Update `src/components/BottomNav/index.tsx`**

Current nav element (line 18):
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-alternate/20 h-16 z-50 flex justify-center">
```

Replace with:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-alternate/20 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
```

Note: Remove `h-16` (fixed height). The nav height is now determined by its content + safe area padding.

Current inner div + link (lines 19-28):
```tsx
<div className="w-full max-w-xl flex">
{tabs.map(({ href, label, Icon }) => {
  ...
  return (
    <Link
      key={href}
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-1"
    >
```

Replace the Link className to add explicit top/bottom padding instead of `justify-center`:
```tsx
<div className="w-full max-w-xl flex">
{tabs.map(({ href, label, Icon }) => {
  ...
  return (
    <Link
      key={href}
      href={href}
      className="flex flex-1 flex-col items-center gap-1 py-3"
    >
```

**Step 2: Verify**

Run `npm run dev`. The nav should sit above the home indicator on iPhone, and tabs should remain visually centered.

**Step 3: Commit**

```bash
git add src/components/BottomNav/index.tsx
git commit -m "fix(nav): add safe-area-inset-bottom for iPhone home indicator"
```

---

## Task 4: Replace SearchItemModal `<dialog>` with createPortal bottom sheet

**Files:**
- Modify: `src/components/SearchItemModal/index.tsx`

This is the most critical fix. The `<dialog>` element has broken `onChange` events in iOS Safari PWA mode. We replace it with a `div`-based portal bottom sheet. All internal logic (search state, filter, selection, quantity, confirm) stays identical.

**Step 1: Update the imports**

Current imports (line 1-10):
```tsx
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
```

Replace with:
```tsx
'use client';
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
```

Remove `useEffect` and `useRef` — they were only needed for `showModal()`/`close()`.

**Step 2: Replace the return statement**

Current return (lines 73-153) starts with `<dialog ref={dialogRef} ...>`.

Replace the entire return statement with:

```tsx
  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative w-full bg-item-background rounded-t-2xl shadow-lg flex flex-col max-h-[85dvh] pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col gap-3 flex-1 min-h-0">
          <h2 className="text-xl font-bold text-primary text-center">Añadir Item</h2>

          <InputText
            placeholder="Buscar ingrediente o receta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {loading ? (
              <p className="text-center text-alternate py-4">Cargando...</p>
            ) : fetchError ? (
              <p className="text-danger text-center py-4">
                Error al cargar datos. {(fetchError as Error).message}
              </p>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-alternate py-4">No se encontraron items</p>
            ) : (
              <ul className="flex flex-col gap-1 py-2">
                {filteredItems.map((item) => (
                  <li key={`${item.itemType}-${item.id}`}>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className={`w-full p-2 rounded border cursor-pointer ${
                        selectedItem?.id === item.id && selectedItem?.itemType === item.itemType
                          ? 'border-accent bg-accent/10'
                          : 'border-transparent'
                      }`}
                    >
                      <Item
                        name={item.name}
                        type={item.itemType === 'ingredient' ? ItemType.INGREDIENT : ItemType.RECIPE}
                        calories={item.itemType === 'ingredient' ? item.calories : item.macros.calories}
                        showType
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedItem && (
            <div className="p-3 border border-alternate rounded bg-item-background">
              <p className="font-semibold mb-2 text-primary">Seleccionado: {selectedItem.name}</p>
              <input
                type="number"
                placeholder={selectedItem.itemType === 'ingredient' ? 'Cantidad (gr)' : 'Cantidad (raciones)'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-background border border-alternate rounded p-2 text-primary placeholder:text-alternate outline-none"
              />
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <ActionButton label="Cancelar" onPress={onClose} color="secondary" />
            <ActionButton
              label="Confirmar"
              onPress={handleConfirm}
              disabled={!selectedItem || loading}
              color="accent"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
```

**Step 3: Remove the useEffect that called showModal/close**

Remove lines 28-37 (the entire `useEffect` that called `dialogRef.current?.showModal()` and `dialogRef.current?.close()`). Also remove `dialogRef` — it is no longer needed.

The reset of state on close is now handled by the `if (!isVisible) return null` — when the modal closes, the component unmounts and state resets automatically. If you need explicit reset, add it to `onClose` in the parent instead.

Actually, to keep the same reset behavior (clearing searchTerm, selectedItem, quantity when closed), keep them initialized to `''`/`null`/`''` which is their default — since the component unmounts on `!isVisible`, state will always be fresh on next open. No extra code needed.

**Step 4: Verify**

Run `npm run dev`. Open the add-meal page, click "Añadir ingrediente o receta". The bottom sheet should slide up. Type "pollo" — the list should filter in real time. Select an item, enter a quantity, confirm.

**Step 5: Commit**

```bash
git add src/components/SearchItemModal/index.tsx
git commit -m "fix(modal): replace dialog with createPortal bottom sheet for iOS Safari"
```

---

## Task 5: Replace ConfirmationModal `<dialog>` with createPortal

**Files:**
- Modify: `src/components/ConfirmationModal/index.tsx`

Same pattern as Task 4 but simpler — no search, no list, just a message + two buttons.

**Step 1: Rewrite `src/components/ConfirmationModal/index.tsx`**

Replace the entire file with:

```tsx
'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import ActionButton from '@/components/ui/ActionButton';
import { ConfirmationModalProps } from './types';

export default function ConfirmationModal({
  isVisible,
  onClose,
  handleConfirm,
  message,
}: ConfirmationModalProps) {
  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className="relative w-full bg-item-background rounded-t-2xl shadow-lg p-5 flex flex-col gap-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-primary text-base font-bold">{message}</p>
        <ActionButton
          color="accent"
          label="Confirmar"
          onPress={() => {
            handleConfirm();
            onClose();
          }}
        />
        <ActionButton color="primary" label="Cancelar" onPress={onClose} />
      </div>
    </div>,
    document.body
  );
}
```

**Step 2: Verify**

Find any place in the app that uses `ConfirmationModal` (ingredients list, recipes list). Trigger it. Confirm it opens as a bottom sheet, the backdrop closes it, and the buttons work.

**Step 3: Commit**

```bash
git add src/components/ConfirmationModal/index.tsx
git commit -m "fix(modal): replace ConfirmationModal dialog with createPortal bottom sheet"
```

---

## Task 6: Touch feedback + global CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/ActionButton/index.tsx`
- Modify: `src/components/ui/Button/index.tsx`
- Modify: `src/components/ui/SubmitButton/index.tsx`

**Step 1: Update `src/app/globals.css`**

Current `body` block (lines 45-48):
```css
body {
  background-color: #181920;
  color: #FFFFFF;
}
```

Replace with:
```css
body {
  background-color: #181920;
  color: #FFFFFF;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: none;
}
```

**Step 2: Update `src/components/ui/ActionButton/index.tsx`**

Current button className (line 21):
```tsx
className={`bg-${config.backgroundColor} rounded-lg p-4 w-full flex items-center justify-center transition-opacity cursor-pointer ${
  disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
}`}
```

Replace with:
```tsx
className={`bg-${config.backgroundColor} rounded-lg p-4 w-full flex items-center justify-center transition-opacity cursor-pointer ${
  disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100 active:opacity-70'
}`}
```

**Step 3: Update `src/components/ui/Button/index.tsx`**

Current button className (line 12):
```tsx
className={`bg-primary hover:bg-accent active:bg-accent px-6 py-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${className}`}
```

Replace with:
```tsx
className={`bg-primary hover:bg-accent active:bg-accent active:opacity-70 px-6 py-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${className}`}
```

**Step 4: Update `src/components/ui/SubmitButton/index.tsx`**

Current button className (line 7-9):
```tsx
className={`bg-accent rounded-lg p-4 w-full flex items-center justify-center cursor-pointer transition-opacity ${
  disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90'
}`}
```

Replace with:
```tsx
className={`bg-accent rounded-lg p-4 w-full flex items-center justify-center cursor-pointer transition-opacity ${
  disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90 active:opacity-70'
}`}
```

**Step 5: Verify**

Run `npm run dev`. Tap any button — it should briefly dim on press with no gray flash. Pull-to-refresh gesture on the main page should not trigger.

**Step 6: Commit**

```bash
git add src/app/globals.css src/components/ui/ActionButton/index.tsx src/components/ui/Button/index.tsx src/components/ui/SubmitButton/index.tsx
git commit -m "fix(ux): add touch feedback and remove tap highlight for iOS Safari"
```

---

## Final verification

After all 6 tasks:

1. `npm run build` — must pass with no errors
2. Deploy to Firebase Hosting (`firebase deploy`) or test via local network on real iPhone
3. On iPhone Safari: go to the deployed URL → Share → Add to Home Screen → Open
4. Verify in standalone mode:
   - No browser chrome visible
   - BottomNav not hidden behind home indicator
   - Content not clipped at bottom
   - SearchItemModal opens as bottom sheet, search filters work
   - ConfirmationModal opens as bottom sheet
   - Buttons show tap feedback
