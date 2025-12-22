# POS Merge — Tasks and TODO

This file documents the planned steps to finish the merged Cashier + Dashboard (POS) work, with expected files, acceptance criteria, and brief notes.

**How to use this file**

- Follow the steps in order. Each step lists the target files and acceptance criteria. After completing a step, update the todo list (managed by the dev agent).

**1. ItemSearch component**

- Files: `src/components/cashier/ItemSearch.tsx`
- Goal: allow quick add of items by name or barcode. Calls `usePOS().addItem` with minimal item data.
- Acceptance: adding an item refreshes the current sale and the item appears in the basket.

**2. Basket component**

- Files: `src/components/cashier/Basket.tsx`
- Goal: show sale line items, allow increment/decrement quantity and remove.
- Acceptance: actions call `usePOS().updateItem` and `usePOS().removeItem` and refresh the sale.

**3. CashierPanel cleanup & wiring** (in-progress)

- Files: `src/components/cashier/CashierPanel.tsx`
- Goal: single clean implementation that uses `usePOS()` for `currentSale`, `addItem`, `addPayment`, `completeSale` and renders `ItemSearch`, `Basket`, and `QuickActions`.
- Acceptance: no duplicate exports or stray code; clicking Complete Sale calls `completeSale()` and reflects updated sale state.

**4. QuickActions component**

- Files: `src/components/ui/QuickActions.tsx` (create)
- Goal: small toolbar with shortcuts (open tender, apply discount, suspend sale). Use `usePOS()` actions where appropriate.
- Acceptance: each action triggers a toast and appropriate POS action (or placeholder if backend not ready).

**5. DashboardPanel scaffold**

- Files: `src/components/dashboard/DashboardPanel.tsx` (create)
- Goal: scaffold right-hand column for quick widgets: `TotalsCard`, `RecentSales`, `TopItems`, `LowStock`.
- Acceptance: renders placeholder widgets and is importable by `src/app/cashier-dashboard/page.tsx`.

**6. Dashboard widgets**

- Files: `src/components/dashboard/TotalsCard.tsx`, `RecentSales.tsx`, `TopItems.tsx`, `LowStock.tsx`
- Goal: small, fast widgets that fetch summary data via Tauri invokes or show placeholder skeletons.
- Acceptance: each widget renders data or a skeleton with a refresh button.

**7. Run builds and fix compile/lint issues**

- Commands to run:

```bash
# Frontend
npm run build

# Backend (Tauri / Rust)
cd src-tauri
cargo build
```

- Goal: resolve TypeScript/Rust compile errors, missing imports, and React hook warnings.
- Acceptance: both builds succeed; major runtime flows (add item, complete sale) work in dev environment.

**Notes & next steps**

- Start by finalizing `CashierPanel` wiring (step 3) so UI components use the stable `usePOS` API.
- Implement `QuickActions` and `DashboardPanel` as lightweight placeholders to keep iteration fast.
- After builds succeed, implement keyboard shortcuts and polish visuals.

If you want, I can scaffold `QuickActions` and `DashboardPanel` now and run the builds to surface errors.
