# Security Review Skill

Use this skill for auth, permissions, secret handling, and risky data-flow changes.

## Steps
1. Identify protected routes, admin paths, and user-owned resources touched by the change.
2. Check whether the backend enforces authorization independently from the frontend.
3. Review `.env.example`, docs, and code for secret leakage or incorrect defaults.
4. Report concrete risks with file references and suggested fixes.
