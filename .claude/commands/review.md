# /review

Review the current change set with a bug-finding mindset.

## Steps
1. Inspect changed files and identify user-facing risk.
2. Prioritize functional regressions, authorization mistakes, data integrity issues, and broken types.
3. Verify whether tests or manual checks cover the touched paths.
4. Report findings first. Keep summaries brief.

## Repository Focus
- Frontend route and state regressions
- NestJS DTO and controller/service mismatches
- Prisma schema or query behavior that can break MySQL data integrity
- Broken env assumptions between docs and code
