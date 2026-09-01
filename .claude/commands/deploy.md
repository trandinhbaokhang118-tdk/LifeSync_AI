# /deploy

Use this checklist before release or environment promotion.

## Verify
- Frontend build: `npm run build` in `frontend`
- Backend build: `npm run build` in `backend`
- Required env vars match `.env.example` files
- Prisma migrations are in sync with the intended database state
- Any changed docs or setup steps are reflected in repo markdown files

## Release Notes Focus
- User-visible changes
- Required environment changes
- Migration or seed impact
- Known limitations not solved in the current patch
