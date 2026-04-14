# Feature Plan: KPI Hierarchy Balance

## Objective

Make the KPI area in the Operations Console the primary visual anchor so users understand system health before acting.

## Scope

- [x] Strengthen the visual grouping of the KPI block
- [x] Reduce the visual dominance of the action buttons relative to system state
- [x] Improve spacing and hierarchy so metrics are read before commands
- [x] Keep changes limited to the Operations Console UI
- [x] Verify with TypeScript compilation

## Files To Modify

- [x] `scm-demo/src/components/Agent.tsx`

## Implementation Steps

- [x] Create a clearer system-health container around the KPI cards
- [x] Move command controls into a more secondary command layer
- [x] Improve layout proportions and spacing between KPI block and command area
- [x] Run `npx tsc -b`

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Manually verify:
  - [ ] KPI block is the strongest element in the console
  - [ ] actions read as secondary to system state
  - [ ] metrics are grouped and easier to scan than before
