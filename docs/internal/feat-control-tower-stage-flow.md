# Feature Plan: Control Tower Stage Flow

## Objective

Make the control-tower workspace feel like a realistic operator journey by surfacing the operating stages, separating operational work from simulation, and making the next action obvious.

## Scope

- [x] Add an operator workflow stage rail that reflects the live state of the system
- [x] Add a workspace switcher so Operations Console, Scenario Lab, and Approval Queue are clearly separated
- [x] Improve trace storytelling with phase labels, active-step emphasis, and clearer step metadata
- [x] Improve approval summaries with more operator-friendly context and trigger visibility
- [x] Keep all changes frontend-only and compatible with the current backend API
- [x] Verify with TypeScript compilation

## Files To Modify

- [x] `scm-demo/src/components/Agent.tsx`

## Implementation Steps

- [x] Define workflow stages derived from summary, trace, and approval state
- [x] Add stage rail cards with status, explanation, and next-action guidance
- [x] Add workspace tabs or segmented controls for operations, scenario, approval, and full-flow views
- [x] Refine trace cards to show phase grouping and active-stage styling
- [x] Extend approval area with trigger summary and clearer decision context
- [x] Run `npx tsc -b`

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Manually verify:
  - [ ] stage rail updates between stable, disruption, and approval states
  - [ ] workspace switcher isolates operations, scenario, and approval views cleanly
  - [ ] trace cards highlight active reasoning steps and remain clickable
  - [ ] approval queue shows actionable context without raw backend phrasing
