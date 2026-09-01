# Project Structure Rule

Respect the current repository layout.

## Frontend
- Pages live in `frontend/src/pages`
- Shared UI lives in `frontend/src/components`
- API clients live in `frontend/src/services`
- Shared hooks, store, and utilities remain in their existing folders

## Backend
- NestJS modules live in `backend/src/<module>`
- Keep controllers, services, DTOs, and module files grouped per feature
- Shared decorators, filters, DTOs, and interceptors stay under `backend/src/common`

## Rules
- Extend existing modules before creating parallel structures.
- Do not move files only to imitate a template repository.
- New docs should go into `docs/` or clearly related top-level guides.
