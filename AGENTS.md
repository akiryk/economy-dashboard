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

# Story Completion

A story is complete when the requested implementation and documentation have been
verified and committed locally. Pushing is a separate follow-up action that
requires the user's confirmation.

Committed but unpushed work must never block starting the next story. At the
start of a new story, inspect the working tree, preserve unrelated changes, and
continue with the new work using the smallest safe scope. If earlier story
commits have not been pushed, immediately show this commentary cue and then keep
working:

`ℹ️ PRIOR STORY COMMITS HAVE NOT BEEN PUSHED; STARTING THIS STORY LOCALLY.`

Before completing a story:

1. Review the story requirements and confirm that no requested work was omitted.
2. Confirm that no out-of-scope work from future stories was added.
3. Run all required quality checks, including:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
   - `git diff --check`
4. Run any story-specific data-refresh, browser, or manual verification steps.
5. Fix all errors and warnings that indicate an implementation problem.
6. Stop any development servers or temporary processes started during verification.
7. Inspect `git status` and the staged diff.
8. Confirm that no secrets, `.env` files, generated temporary files, debug output, or unrelated changes are included.
9. Update relevant documentation so it reflects the completed implementation.
10. Create one focused conventional-style commit containing only the story
    changes.
11. Confirm the story commit exists locally and that unrelated working-tree
    changes remain untouched.

Do not:

- Commit work that does not pass the required checks.
- Push secrets or local environment files.
- use `--force` or `--force-with-lease` unless explicitly instructed.
- Rewrite or squash existing shared history unless explicitly instructed.
- Commit unrelated changes merely because they are present in the working tree.
- Leave verification-only files, screenshots, logs, temporary datasets, or running processes behind.

When the story implementation is verified:

1. Mark it clearly with `ALL DONE WITH USER STORY [NUMBER]`.
2. Report the local commit hash and message.
3. Do not push unless the user explicitly asks.
4. End with this compact, single-line cue so it remains visible in a small Codex
   panel:

   `⚠️ STORY [NUMBER] DONE AND COMMITTED LOCALLY — NOT PUSHED. PUSH NOW?`

5. If the user starts another story instead, begin it immediately. Preserve and
   distinguish earlier local commits and unrelated working-tree changes; do not
   stop to request a push.

If pushing fails after the user requested it because of authentication,
permissions, branch protection, a non-fast-forward update, or another remote issue:

- Do not use a destructive Git command to bypass the problem.
- Report the exact failure clearly.
- Leave the verified local commit intact.
- Explain what user action is required.

The completion response must report:

- What was implemented
- Important decisions or deviations
- Quality checks and verification results
- Branch name
- Commit hash and message
- GitHub remote and push result when applicable
- Final working-tree status
- Any known limitations or concerns for the next story
- The compact push cue whenever the story commit has not been pushed
- Finally, make it clear to the human reader that the story is done. Do this by
  printing `ALL DONE WITH USER STORY [NUMBER]` in all caps so it stands out.
