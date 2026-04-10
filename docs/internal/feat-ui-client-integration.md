# Feature Plan: UI Client Integration

## Objective

Replace the mock-driven React client with real control-tower backend data and actions while preserving the current product shell and making the AI Agent screen operational.

## Scope

- [x] Add a typed frontend API client for the control-tower backend
- [x] Add a small shared app state hook/provider for loading summary, trace, approvals, inventory, and suppliers
- [x] Replace Dashboard mocks with live summary data
- [x] Replace Inventory and Suppliers mocks with live backend lists
- [x] Replace the scripted Agent flow with live plan/scenario/approval interactions
- [x] Add Vite dev proxy so the client can call the backend without CORS changes
- [x] Add build verification for the frontend

## Files To Modify

- [x] `scm-demo/src/App.tsx`
- [x] `scm-demo/src/components/Dashboard.tsx`
- [x] `scm-demo/src/components/Inventory.tsx`
- [x] `scm-demo/src/components/Suppliers.tsx`
- [x] `scm-demo/src/components/Agent.tsx`
- [x] `scm-demo/vite.config.ts`

## Files To Add

- [x] `scm-demo/src/lib/api.ts`
- [x] `scm-demo/src/lib/types.ts`
- [x] `scm-demo/src/hooks/useControlTower.ts`

## Implementation Steps

- [x] Define the backend response types used by the UI
- [x] Add fetch helpers for summary, inventory, suppliers, plan, pending approval, trace, scenarios, and approval actions
- [x] Add a control-tower hook that loads and refreshes the main backend state
- [x] Dashboard:
  - [x] show live KPIs
  - [x] show live alerts
  - [x] show current mode and plan status
- [x] Inventory:
  - [x] fetch live inventory rows
  - [x] keep client-side search/filter
- [x] Suppliers:
  - [x] fetch live supplier cards
- [x] Agent:
  - [x] run daily plan
  - [x] trigger a disruption scenario
  - [x] render trace steps from `/trace/latest`
  - [x] render selected plan and candidate plans
  - [x] render pending approval state
  - [x] wire approve / reject / safer-plan buttons
- [x] Add loading, empty, and backend-error states
- [x] Add Vite proxy for `/api`
- [x] Run TypeScript compilation
- [ ] Run a full Vite build

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Run `npm run build`
- [ ] Manually verify:
  - [ ] dashboard loads summary
  - [ ] inventory loads rows
  - [ ] suppliers load rows
  - [ ] agent page can run daily plan
  - [ ] scenario can create pending approval
  - [ ] approve / reject / safer-plan update the UI
