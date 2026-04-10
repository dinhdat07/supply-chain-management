# Feature Plan: Operator Workflow UI

## Objective

Redesign the control-tower client so daily operations, scenario simulation, trace reasoning, and approvals feel like a realistic operator workflow rather than a demo script.

## Scope

- [x] Replace `Run Daily Plan` with realistic operator actions: `Refresh network state` and `Generate recommendations`
- [x] Split the AI page into `Operations Console`, `Scenario Lab`, and `Approval Queue`
- [x] Add a frontend humanization layer for statuses, strategies, events, actions, and node labels
- [x] Add staged trace replay driven by real backend trace data
- [x] Make each trace step clickable and show detailed reasoning
- [x] Upgrade approval cards to show plan details, KPI impact, and reasoning summary
- [x] Add scenario preview using the existing what-if backend endpoint
- [x] Verify with TypeScript compilation

## Files To Modify

- [x] `scm-demo/src/App.tsx`
- [x] `scm-demo/src/components/Agent.tsx`
- [x] `scm-demo/src/components/Dashboard.tsx`
- [x] `scm-demo/src/components/Inventory.tsx`
- [x] `scm-demo/src/components/Suppliers.tsx`
- [x] `scm-demo/src/components/Layout.tsx`
- [x] `scm-demo/src/hooks/useControlTower.ts`
- [x] `scm-demo/src/lib/api.ts`
- [x] `scm-demo/src/lib/types.ts`

## Files To Add

- [x] `scm-demo/src/lib/presenters.ts`

## Implementation Steps

- [x] Add user-facing presentation helpers for backend terms
- [x] Extend frontend API/types to support what-if scenario preview
- [x] Extend the control-tower hook to load approval detail and scenario previews
- [x] Rework the Agent page into:
  - [x] Operations Console
  - [x] Scenario Lab
  - [x] Approval Queue
- [x] Add staged trace animation and step detail panel
- [x] Remove raw backend ids from primary UI and move them to secondary metadata
- [x] Update supporting screens to use humanized labels where needed
- [x] Run `npx tsc -b`

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Manually verify:
  - [ ] operations section loads current mode, alerts, and recommendation controls
  - [ ] scenario lab previews and runs simulated disruptions
  - [ ] trace reveals progressively and step cards are clickable
  - [ ] approval queue shows plan details and actions
