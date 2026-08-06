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

The BLS files used for the inflation-contribution history cannot currently be
downloaded automatically by Codex. After each new monthly CPI release:

1. Visit the BLS **Archived Consumer Price Index Supplemental Files** page:

   https://www.bls.gov/cpi/tables/supplemental-files/home.htm

2. Find the section for the newly released month.

3. Download the link named in this format:

   **News Release Table 7, [Month] [Year] (XLSX)**

   For example:

   **News Release Table 7, February 2026 (XLSX)**

4. Place the downloaded XLSX file in the workspace location requested by Codex,
   or attach it directly to the Codex conversation.

5. Tell Codex to ingest the new Table 7 workbook, validate it, update the
   committed inflation-contribution dataset, run all repository checks and
   verification, commit the update, and push it to the current tracked remote
   branch.

Files for completed prior years may instead appear near the bottom of the page
as annual archives named in this format:

**2024 Supplemental Files (ZIP)**

The annual ZIP files were needed for the original historical backfill. Under
normal circumstances, ongoing updates require only the single new monthly
**News Release Table 7** XLSX file.

Do not substitute another CPI table or a category inflation-rate series. Table
7 contains the percentage-point contribution effects required by the dashboard.

# Story Completion

A story is complete when the requested implementation and documentation have been
verified, committed locally, and pushed successfully to the current tracked remote
branch.

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
16. Confirm the final working-tree status.

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
   - Final working-tree status
   - Any known limitations or concerns for the next story

4. End with this compact, single-line cue:

   `✅ STORY [NUMBER] DONE, VERIFIED, COMMITTED, AND PUSHED.`

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
