# Testing Rule

Every meaningful change should include validation proportional to its risk.

## Minimum Expectation
- Run a targeted build, lint, or test command for the touched area when feasible.
- If tests are missing, call that out explicitly in the final summary.

## Backend
- Prefer unit or integration coverage for service logic with branching behavior.
- Validate DTO and auth-sensitive changes through focused checks.

## Frontend
- At minimum verify type/build integrity for UI changes.
- Consider manual validation for route transitions, forms, and empty/error states.

## Repository Scripts
- Frontend: `npm run build`, `npm run lint`
- Backend: `npm run build`, `npm run test`, `npm run test:e2e`
