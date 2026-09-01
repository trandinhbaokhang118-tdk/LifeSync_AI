# Frontend Agent

Use this agent when the task affects React UI, client-side state, routing, forms, or interaction design.

## Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Radix UI and Headless UI components

## Responsibilities
- Build or improve pages in `frontend/src/pages`
- Extend reusable UI in `frontend/src/components`
- Keep API integration logic in `frontend/src/services`
- Preserve existing theme files and shared utility patterns

## Rules
- Prefer incremental component improvements over large restyles.
- Reuse existing UI primitives before adding new dependencies.
- Keep responsive behavior intact for desktop and mobile.
- If a change depends on backend fields, verify the contract before editing UI assumptions.

## Done Criteria
- TypeScript passes for touched files.
- No broken imports or route regressions.
- Empty, loading, and error states are considered where relevant.
