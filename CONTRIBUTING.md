# Contributing to QuickBite

Thank you for your interest in contributing to QuickBite!

## Branch Naming
Please use the following conventions when creating a branch:
- `feat/feature-name` for new features
- `fix/issue-description` for bug fixes
- `docs/what-changed` for documentation updates
- `chore/task-name` for maintenance (dependencies, build configs)

## Commit Message Style
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: added operator approval endpoints`
- `fix: resolved infinite loop in auth context`
- `docs: updated architecture diagrams`

Ensure your commit messages are descriptive and concise.

## Local Development Expectations
1. Never commit `.env` files. Ensure you copy `.env.example` and only use local placeholder values.
2. Keep the codebase clean. Ensure no `console.log` (unless strictly for intended CLI output) or unused imports remain.
3. Keep the git history clean. Squash minor "wip" commits before opening a Pull Request.

## Testing Before Pull Requests
Before submitting a PR, you **must** verify that the build passes locally.

**Backend:**
```bash
mvn verify
```
All integration and unit tests must pass. If you write a new feature, write accompanying tests in `src/test/java`.

**Frontend:**
```bash
cd frontend
npm run build
npx tsc --noEmit
```
There should be no TypeScript or ESLint errors.

## Secret Handling Rules
**CRITICAL:** Under no circumstances should secrets (Passwords, JWT Secrets, Razorpay Keys, Google OAuth Secrets, Database Credentials, etc.) be committed to version control.
- Always use environment variables for secrets.
- Check your diffs carefully.
- If you accidentally commit a secret, notify the repository maintainers immediately so we can rotate the compromised credential.
