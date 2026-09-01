# API Conventions Rule

Keep frontend and backend contracts predictable.

## Backend
- Validate request payloads with DTOs.
- Use HTTP status codes that match the actual outcome.
- Keep controllers thin and push business logic into services.
- Preserve authentication and ownership checks on protected resources.

## Frontend
- Centralize HTTP calls in `frontend/src/services`.
- Do not scatter ad-hoc fetch logic across pages when a service already exists.
- Handle loading and error paths for user-facing mutations and queries.

## Contract Changes
- If a response shape changes, update both backend and frontend in the same patch.
- Reflect meaningful API changes in docs when the impact is user or integrator visible.
