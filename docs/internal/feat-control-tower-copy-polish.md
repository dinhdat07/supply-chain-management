# Feature Plan: Control Tower Copy Polish

## Objective

Remove the remaining backend-style wording from the Control Tower page so the experience reads like an operator console instead of a developer tool.

## Scope

- [x] Replace internal references and raw technical wording in the approval and trace areas
- [x] Improve action detail phrasing so recommended actions read like operational instructions
- [x] Improve event and disruption summaries so they sound user-facing
- [x] Keep changes frontend-only and limited to presentation
- [x] Verify with TypeScript compilation

## Files To Modify

- [x] `scm-demo/src/components/Agent.tsx`
- [x] `scm-demo/src/lib/presenters.ts`

## Implementation Steps

- [x] Add presenter helpers for target labels, action summaries, and operator-facing reference text
- [x] Replace raw approval reference wording with operator-facing context
- [x] Replace technical trace metadata labels with plain-language labels
- [x] Refine disruption summary text and fallback wording
- [x] Run `npx tsc -b`

## Testing Approach

- [x] Run `npx tsc -b`
- [ ] Manually verify:
  - [ ] approval queue avoids internal ids in primary copy
  - [ ] action cards read like operational instructions
  - [ ] trace metadata reads clearly without backend jargon
  - [ ] disruption summaries and fallback notes sound user-facing
