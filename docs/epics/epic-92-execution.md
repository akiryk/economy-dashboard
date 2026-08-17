# Epic 92 execution queue

This file is the resumable implementation state for Epic 92. Status values are
`pending`, `in progress`, `complete`, `blocked`, or
`skipped by epic/research decision`.

| Story | Scope | Dependencies | Status |
|---|---|---|---|
| 92A | Import epic, audit cards, verify peers/dataflows, publish registry | None | complete |
| 92B | Add normalized OECD data schema, parser, validation, refresh, and committed snapshot for approved metrics | 92A | in progress |
| 92C | Add Compare route, top navigation, page shell, and metadata | 92B | pending |
| 92D | Add reusable accessible comparison module and prime-age employment reference card | 92B–92C | pending |
| 92E | Add unemployment and headline-inflation comparisons | 92D | pending |
| 92F | Add real-GDP-growth and ten-year-yield comparisons | 92D | pending |
| 92G | Complete responsive/accessibility polish, docs, integration tests, and Compare-route idle smoke coverage | 92C–92F | pending |

Research deliberately excludes or defers the other dashboard concepts recorded
in `docs/international-comparison-registry.md`; those are not omitted stories.
If later source research approves one, it should become a new scoped story.
