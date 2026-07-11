# AGENTS.md

This repository is built incrementally through small, reviewable stories. Favor simplicity, correctness, and maintainability over clever abstractions.

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

When implementing a story:

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
