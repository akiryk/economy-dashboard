---
name: economy-dashboard-story
description: Execute every economy-dashboard user story, feature, bug fix, or behavioral code change with required preflight, regression, mutable-input, verification, commit, push, and deployment gates. Do not use for read-only explanation or diagnosis.
---

# Economy Dashboard Story Protocol

Use this protocol for every implementation story. Its gates are required; do
not treat them as suggestions or replace them with a generic plan.

## 1. Preflight before editing

1. Read the repository `AGENTS.md` and `LEARNINGS.md` completely.
2. Inspect `git status`, the relevant implementation and tests, and applicable
   canonical documentation.
3. State the story's acceptance criteria and identify:
   - mutable production inputs such as current observations, dates, generated
     metadata, provider responses, and workflow state;
   - existing behavior and regression protections the story could affect;
   - the story-specific checks required in addition to `npm run verify`.
4. Resolve existing upstream commits and unrelated working-tree changes before
   editing. Preserve user changes.

## 2. Implementation and tests

1. Make the smallest change that satisfies the story.
2. Use controlled fixtures for UI behavior. Never copy a current production
   value or date into a permanent assertion unless it is an explicitly named
   historical regression.
3. When a test intentionally consumes production data, derive its expectation
   from that data or assert stable structural, chronology, coverage,
   validation, transformation, reconciliation, or rendering invariants.
4. For every mutable input touched by the story, add or run a forward-change
   check: replace the controlled input with a plausible next value and prove
   the behavior and tests still pass. Testing only today's repository state is
   insufficient.
5. Preserve existing regression coverage. Do not replace or weaken unrelated
   assertions to make a new test pass.

## 3. Required regression audit before committing

Inspect every added or changed test assertion and answer all four questions:

1. Is the expected value owned by a controlled fixture?
2. If production data are involved, is the expectation derived or structural?
3. Will the assertion remain valid after the next normal data refresh?
4. Does the change comply with every applicable entry in `LEARNINGS.md`?

Run `npm run test:policy`. A failure is blocking. Add a narrow machine check
when a demonstrated regression pattern can be detected reliably without
forbidding legitimate controlled fixtures or historical regression tests.

## 4. Completion gates

Follow the full Story Completion section in `AGENTS.md`, including applicable
browser, data-refresh, and live checks. Before the final response, report:

- applicable learnings reviewed;
- mutable-input risks identified;
- forward-change checks performed;
- changed-assertion audit result;
- canonical verification, commit, push, workflow, deployment, and live results.

Do not declare the story complete if any required gate was skipped or failed.
