# LifeSync AI AI Working Guide

## Project Context
LifeSync AI is a full-stack time and productivity application with:
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS
- Backend: NestJS 10 + Prisma + MySQL
- Mobile shell: Capacitor Android
- State and data: Zustand + TanStack Query

## Working Principles
- Prefer additive improvements over rewrites.
- Do not remove working features just to match a template.
- Align changes with the current project stack, folder layout, and naming.
- Reuse existing docs, scripts, DTOs, services, and UI patterns before introducing new abstractions.
- Keep frontend and backend contracts consistent when changing API behavior.

## Mandatory References
Always follow the rules in `.Codex/rules/`.

Priority rules for this repository:
- `tech-stack.md`
- `project-structure.md`
- `api-conventions.md`
- `testing.md`
- `security.md`
- `clean-code.md`

## Available Commands
- `review`: inspect changes for bugs, regressions, and missing tests
- `fix-issue`: analyze a reported issue and patch it incrementally
- `deploy`: verify release readiness against this repo's current setup

## Available Agents
- `agents/frontend.md`: React, Vite, Tailwind, routing, state, UI behavior
- `agents/backend.md`: NestJS modules, controllers, services, Prisma, auth
- `agents/qa.md`: test strategy, regression checks, release checklist
- `agents/project-manager.md`: break features into scoped, implementation-ready tasks

## Repo-Specific Notes
- Root docs already exist in `docs/` and top-level markdown files. Extend them instead of replacing them.
- Backend uses NestJS modules under `backend/src`.
- Frontend uses page-based routing under `frontend/src/pages` and shared UI under `frontend/src/components`.
- Prefer changes that are easy to validate with existing npm scripts.
