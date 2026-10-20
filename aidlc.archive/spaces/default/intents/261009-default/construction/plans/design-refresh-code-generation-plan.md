# Code Generation Plan - design-refresh

## Unit Context
- **Unit**: design-refresh
- **Goal**: Apply `.claude/DESIGN.md` Ordered Editorial Ink style to the existing blog UI.
- **Scope**: Existing homepage, global tokens, header, footer, theme toggle, post list, post card, and tag badge.
- **Dependencies**: Existing blog-v2 foundation and content repository.

## Step-by-Step Plan

- [x] Step 1: Update global design tokens in `src/styles/globals.css` to the Ordered Editorial Ink palette and base typography behavior.
- [x] Step 2: Update app shell components (`src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/shared/ThemeToggle.tsx`) to use editorial navigation, restrained borders, and sharp controls.
- [x] Step 3: Update homepage composition in `src/app/page.tsx` to a text-first editorial layout with structured metadata and quiet CTAs.
- [x] Step 4: Update blog list components (`src/components/blog/PostCard.tsx`, `src/components/blog/PostList.tsx`, `src/components/blog/TagBadge.tsx`) to reduce card elevation and emphasize list-like reading structure.
- [x] Step 5: Run quality gates (`yarn type-check`, `yarn lint`, `yarn build`) and fix issues.
- [x] Step 6: Update AI-DLC state and audit log with completion details.

## Acceptance Criteria

- [x] The UI follows `.claude/DESIGN.md` tokens and avoids vibrant accent colors, heavy shadows, and rounded CTA-heavy styling.
- [x] Homepage, shell, and post list share one coherent editorial visual language.
- [x] Existing light/dark theme behavior remains functional.
- [x] `yarn type-check`, `yarn lint`, and `yarn build` pass.
