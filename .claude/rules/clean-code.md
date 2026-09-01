# Clean Code Rule

Favor clear, local, maintainable code.

## Rules
- Keep functions focused on one responsibility.
- Name variables and methods after domain intent, not implementation trivia.
- Remove duplication when it improves clarity, but do not over-abstract small differences.
- Add comments only when the reasoning is not obvious from the code.
- Prefer explicit types and DTOs over loose object shapes in critical flows.

## Repository Guidance
- In NestJS, business logic belongs in services, not controllers.
- In React, shared behavior should move into hooks, services, or small reusable components when duplication becomes real.
