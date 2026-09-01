# /fix-issue

Use this workflow for a reported bug or broken behavior.

## Steps
1. Reproduce or inspect the failing path.
2. Narrow the issue to the smallest responsible module.
3. Patch the root cause with minimal surface-area changes.
4. Verify with build, lint, tests, or targeted manual checks.
5. Summarize the fix, remaining risk, and verification result.

## Rules
- Prefer fixing the cause over masking the symptom.
- Do not rewrite unrelated modules during a bug fix.
- Preserve existing UX and API behavior unless the issue requires a contract correction.
