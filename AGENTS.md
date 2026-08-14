# AGENTS.md

Phase 1 is complete. Continue evolving the repository through small, reviewable stories or similarly scoped work items. Favor simplicity, correctness, and maintainability over clever abstractions.

---

# Project Philosophy

This project is intended to become a high-quality dashboard for understanding the U.S. economy through objective, well-documented data.

The application should help users understand economic indicators rather than persuade them toward any political viewpoint.

Design decisions should prioritize:

- clarity
- correctness
- transparency
- maintainability
- accessibility

Avoid unnecessary complexity.

---

# General Development Principles

## Make the smallest reasonable change.

Prefer small, reviewable pull requests.

Do not implement future stories while working on the current one.

Do not build infrastructure that is not yet needed.

---

## Be explicit.

Choose code that is easy to understand over code that is clever.

Avoid hidden behavior.

Avoid "magic."

---

## Prefer composition over inheritance.

Keep components small and focused.

---

## Avoid premature abstraction.

If only one component needs some logic, keep it there.

Extract reusable abstractions only after duplication appears.

---

## Favor readability over DRY.

Some duplication is preferable to unreadable abstractions.

---

# Architecture

The application should naturally separate:

- UI
- domain models
- data access
- chart rendering
- utility functions

React components should primarily render UI.

Business logic should not live inside JSX.

External APIs should never be called directly from React components.

---

# TypeScript

Use strict TypeScript.

Avoid `any`.

Prefer explicit types.

Prefer discriminated unions over boolean flags when modeling state.

Use interfaces for domain models unless a type alias is clearly more appropriate.

---

# React

Prefer functional components.

Prefer hooks.

Keep components focused on one responsibility.

Avoid deeply nested component trees.

Avoid prop drilling where reasonable, but do not introduce global state unnecessarily.

---

# State Management

Use React state unless there is a demonstrated need for something larger.

Do not introduce Redux, MobX, Zustand, or similar libraries without clear justification.

---

# Styling

Prefer plain CSS.

Use CSS custom properties for design tokens.

Avoid inline styles except when genuinely appropriate.

Avoid CSS frameworks unless explicitly requested.

Keep styling restrained and information-focused.

---

# Error Handling

Fail loudly during development.

Avoid silently swallowing exceptions.

Return useful error messages.

Validate external data.

Never assume third-party APIs return valid data.

---

# Comments

Write code that is self-explanatory.

Use comments to explain _why_, not _what_.

Avoid redundant comments.

---

# Dependencies

Minimize dependencies.

Before introducing a package, ask:

- Does the platform already solve this?
- Can this be implemented simply ourselves?
- Is the dependency mature and actively maintained?

Avoid adding packages for trivial functionality.

---

# Testing

Test behavior rather than implementation details.

Prefer deterministic tests.

Avoid brittle snapshot tests.

---

# Git

Keep commits focused.

Do not mix unrelated changes.

Use meaningful commit messages.

---

# Documentation

Update documentation whenever architecture changes.

README files should stay accurate.

Document important architectural decisions.

Treat `docs/product-overview.md` as the current product inventory and purpose statement. Update it whenever a visible card is added, removed, combined, or materially reframed.

Treat `docs/data-refresh.md` as the technical source and transformation inventory. Avoid duplicating that full inventory in the README.

Documents under `docs/archive/` are historical context, not current project status.

---

# Accessibility

Prefer semantic HTML.

Support keyboard navigation.

Ensure visible focus indicators.

Use appropriate ARIA attributes only when native HTML is insufficient.

Accessibility is a feature, not an enhancement.

---

# Performance

Optimize when there is evidence.

Avoid premature optimization.

Favor simple code first.

---

# Scope Control

When implementing a story or scoped work item:

Implement only what the story requests.

Do not anticipate future stories by adding speculative abstractions.

If a better long-term architecture becomes apparent, mention it in the completion summary rather than implementing it prematurely.

---

# If Requirements Are Unclear

Do not invent product requirements.

State the ambiguity clearly.

Choose the simplest reasonable implementation.

Document any assumptions.

---

# Code Quality Checklist

Before considering work complete:

- Project builds successfully.
- TypeScript passes.
- Lint passes.
- No dead code remains.
- No unnecessary dependencies were added.
- No TODOs without explanation.
- Public APIs are documented.
- Naming is clear and consistent.

The code should leave the repository slightly better than it was found.

# Updating CPI inflation-contribution data

Normal monthly BLS News Release Table 7 workbooks are discovered, downloaded,
validated, and ingested automatically by `npm run data:refresh`. The daily
GitHub Actions refresh uses the official BLS **Archived Consumer Price Index
Supplemental Files** page and advances the committed contribution history only
when the newest release is exactly one month after the latest committed release.
No-new-release checks are clean no-ops. Discovery, download, parsing, validation,
or multi-month-gap failures preserve the existing dataset and fail visibly.

If the automatic path fails because BLS access or workbook structure changed,
use the retained manual fallback:

1. Visit https://www.bls.gov/cpi/tables/supplemental-files/home.htm.
2. Download **News Release Table 7, [Month] [Year] (XLSX)**.
3. Run `npm run data:ingest-inflation-contribution --` with `--file`, `--period`,
   `--release-date`, `--source-url`, and an explicit temporary `--output` path.
4. Inspect the validated output and use the shared parser/update rules to append
   it without truncating history, then run the full story-completion checks.

Files for completed prior years may instead appear near the bottom of the page
as annual archives named in this format:

**2024 Supplemental Files (ZIP)**

The annual ZIP files were needed for the original historical backfill. The
scheduled path does not rescan them; explicit historical backfills remain a
manual maintenance operation.

Do not substitute another CPI table or a category inflation-rate series. Table
7 contains the percentage-point contribution effects required by the dashboard.

# Story Completion

A story is complete when the requested implementation and documentation have been
verified, committed locally, pushed successfully to the current tracked remote
branch, and deployed successfully by the repository's GitHub Pages workflow.

Before completing a story:

1. Review the story requirements and confirm that no requested work was omitted.
2. Confirm that no out-of-scope work from future stories was added.
3. Run the canonical repository verification command:
   - `npm run verify`
4. Run Git diff validation:
   - `git diff --check`
5. Run any story-specific data-refresh, browser, verifier, or manual verification steps.
6. Fix all errors and warnings that indicate an implementation problem.
7. Stop any development servers or temporary processes started during verification.
8. Inspect `git status` and the staged diff.
9. Confirm that the diff contains only work belonging to the current story.
10. Confirm that no secrets, `.env` files, generated temporary files, debug output,
    screenshots, logs, or unrelated changes are included.
11. Update relevant documentation so it reflects the completed implementation.
12. Create one focused conventional-style commit containing only the story changes.
13. Confirm the story commit exists locally and unrelated working-tree changes remain untouched.
14. Push the commit to the current tracked remote branch.
15. Confirm that the remote push succeeded.
16. Find the `refresh-and-deploy.yml` workflow run for the exact pushed commit and
    monitor it through completion.
17. Confirm that both `refresh-and-build` and `deploy` succeeded. When practical,
    confirm that the deployed `deployment-metadata.json` names the expected commit.
18. Confirm the final working-tree status.

After every code push:

- Do not treat a successful `git push` as completion.
- Use the GitHub CLI to locate and watch the workflow run for the exact commit.
- If the run fails, inspect the failed job and step logs, identify the root cause,
  fix it, run the required local verification again, create a focused follow-up
  commit, push it, and monitor the new run. Continue until deployment succeeds.
- Do not blindly rerun a failed workflow when the failure indicates a code, test,
  data, build, or configuration problem. A rerun is appropriate only when the logs
  clearly show a transient GitHub or network infrastructure failure.
- If monitoring or deployment is blocked by authentication, permissions, GitHub
  availability, branch protection, an unavailable required secret, or another
  external condition that cannot be corrected in the repository, preserve the
  verified commits and report the exact required user action.

Do not:

- Commit or push work that does not pass all required checks.
- Push if the verifier reports unresolved problems.
- Push secrets or local environment files.
- Use `--force` or `--force-with-lease`.
- Rewrite or squash existing shared history unless explicitly instructed.
- Change branches unless the story explicitly requires it.
- Commit unrelated changes merely because they are present in the working tree.
- Leave verification-only files, screenshots, logs, temporary datasets, or running
  processes behind.
- Ask for permission to push after a story has passed all checks and verification.
- Report a story as complete before its exact pushed commit has passed the Pages
  workflow and deployed successfully.

When the story implementation is verified:

1. Commit and push automatically.
2. Mark completion clearly with:

   `ALL DONE WITH USER STORY [NUMBER]`

3. Report:
   - What was implemented
   - Important decisions or deviations
   - Quality checks and verification results
   - Verifier result
   - Branch name
   - Commit hash and message
   - GitHub remote
   - Push result
   - GitHub Actions run URL and result
   - Pages deployment result and deployed commit
   - Final working-tree status
   - Any known limitations or concerns for the next story

4. End with this compact, single-line cue:

   `✅ STORY [NUMBER] DONE, VERIFIED, COMMITTED, PUSHED, AND DEPLOYED.`

If pushing fails because of authentication, permissions, branch protection,
a non-fast-forward update, or another remote issue:

- Do not use a destructive Git command to bypass the problem.
- Report the exact failure clearly.
- Leave the verified local commit intact.
- Explain what user action is required.
- End with:

  `⚠️ STORY [NUMBER] DONE AND COMMITTED LOCALLY — PUSH FAILED.`

If an earlier verified story commit remains unpushed because of a prior push failure,
do not silently mix it into the current story. Report the situation before pushing
and preserve commit boundaries.

If the push succeeds but the deployment cannot be completed because of an external
blocker, do not describe the story as fully complete. Report the failed workflow URL,
failed job and step, diagnosis, preserved commit, and required user action. End with:

`⚠️ STORY [NUMBER] VERIFIED, COMMITTED, AND PUSHED — DEPLOYMENT BLOCKED.`
