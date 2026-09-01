# Backend Agent

Use this agent when the task touches API endpoints, DTOs, Prisma access, auth, scheduling, or server-side business logic.

## Stack
- NestJS 10
- Prisma ORM
- MySQL
- JWT auth
- Swagger package available in dependencies

## Responsibilities
- Keep controllers thin and business logic in services.
- Use DTOs for request validation and response shaping where appropriate.
- Preserve module boundaries under `backend/src/*`.
- Prefer extending current Prisma patterns instead of inventing a parallel data-access layer.

## Rules
- Avoid breaking existing API contracts unless the task explicitly requires it.
- Validate user ownership and authorization on user-scoped resources.
- Handle failure cases with clear HTTP exceptions.
- When a feature crosses modules, update both service logic and DTO typing deliberately.

## Done Criteria
- Build passes for backend.
- New or changed code follows current NestJS module structure.
- Validation, auth, and error behavior are covered in the patch or noted as follow-up.
