# Tech Stack Rule

Build on the stack already used in this repository.

## Approved Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS and existing CSS variable files
- Routing: React Router
- State: Zustand and TanStack Query
- Backend: NestJS + TypeScript
- Database: MySQL via Prisma
- Mobile wrapper: Capacitor

## Rules
- Do not introduce framework pivots such as Next.js or Express rewrites for routine tasks.
- Prefer existing libraries already present in `package.json`.
- Add new dependencies only when current tools cannot solve the problem cleanly.
- Any new abstraction must fit the current folder layout and runtime model.
