# Feature Plan: Operations KPI Layout Fix

## Objective

Fix the KPI cards in the Operations Console so they are readable at laptop widths and no longer collapse into narrow, vertically broken tiles.

## Scope

- [x] Increase the effective space allocated to the KPI area inside the operations console
- [x] Prevent KPI labels and values from wrapping awkwardly
- [x] Keep the KPI layout compact and easy to scan side-by-side
- [x] Keep changes limited to the operations console UI
- [x] Verify with TypeScript compilation

## Files To Modify

- [x] `scm-demo/src/components/Agent.tsx`

## Implementation Steps

- [x] Rebalance the operations console column proportions
- [x] Change KPI grid breakpoints so 4 KPI cards do not appear too early
- [x] Protect KPI labels and values with safer wrapping/whitespace rules
- [x] Run `npx tsc -b`

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Manually verify:
  - [ ] KPI cards remain readable on laptop resolution
  - [ ] labels do not wrap awkwardly
  - [ ] values remain horizontal and scannable
  - [ ] the metrics area feels less cramped than the actions/exception area
