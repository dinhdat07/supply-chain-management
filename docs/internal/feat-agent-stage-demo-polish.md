# Feature Plan: Agent Stage Demo Polish

## Objective

Polish the control-tower demo so the agent workflow feels staged, animated, and operator-friendly while staying compatible with the current backend.

## Scope

- [x] Remove the `Full flow` workspace option and default to a simpler operator view
- [x] Reintroduce the original stage-by-stage agent timeline feel using the live trace data
- [x] Add visible loading states so agent work feels active during refresh, planning, simulation, and approval actions
- [x] Fix card and box responsiveness so layouts do not collapse awkwardly on narrower screens
- [x] Replace raw SKU, supplier, route, and warehouse ids with realistic business-facing names in the frontend
- [x] Keep changes frontend-only and avoid changing backend contracts
- [x] Verify with TypeScript compilation

## Files To Modify

- [x] `scm-demo/src/components/Agent.tsx`
- [x] `scm-demo/src/components/Inventory.tsx`
- [x] `scm-demo/src/components/Suppliers.tsx`
- [x] `scm-demo/src/lib/presenters.ts`

## Implementation Steps

- [x] Add business-facing label mappings for products, suppliers, routes, and warehouses
- [x] Remove `Full flow` and simplify workspace switching
- [x] Refactor trace rendering into a stage timeline inspired by the initial client UI
- [x] Add agent-working banner and per-action loading feedback
- [x] Make KPI and approval cards responsive on mobile and tablet widths
- [x] Apply realistic names to inventory and supplier screens
- [x] Run `npx tsc -b`

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Manually verify:
  - [ ] no `Full flow` option remains
  - [ ] trace displays as a stage-by-stage timeline with progressive reveal
  - [ ] planning and simulation show visible in-progress feedback
  - [ ] cards stay readable on tablet/mobile widths
  - [ ] SKUs and suppliers display business-facing names instead of raw ids
