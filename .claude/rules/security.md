# Security Rule

Do not trade safety for speed.

## Secrets
- Never commit real `.env` files, API keys, tokens, or passwords.
- Keep examples in `.env.example` only.

## Auth
- Protect user data by checking identity and role at the backend boundary.
- Do not trust frontend-only restrictions for admin or user-scoped data.

## Data Handling
- Validate and sanitize input through DTOs and server-side rules.
- Be deliberate with file upload and external API usage.

## Operational Safety
- Prefer additive changes over destructive migrations unless explicitly required.
- Flag any risky schema or auth changes before they expand in scope.
