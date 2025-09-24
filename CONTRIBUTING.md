# Contributing

Thank you for helping improve Musicoteca!

## Branching

- Create branches from `main` using prefixes: `feature/`, `bugfix/`, `chore/`.
- Keep branches short-lived and focused.

## Commits & PRs

- Prefer Conventional Commits style (e.g., `feat:`, `fix:`, `chore:`).
- Open a draft PR early; convert to ready when reviewable.
- Link issues using `Fixes #123`.
- Fill out the PR template; include screenshots for UI changes.

## Running locally

```bash
npm ci
npm run dev
```

## Quality checks

Before pushing:

```bash
npm run lint
npm run build
npm test -- --run
```

## Code style

- TypeScript strictness; avoid `any`.
- Prefer descriptive names and small functions.
- Add/adjust tests when fixing bugs or adding features.

## Reviews

- At least one approval required before merge.
- Address comments or explain decisions.

## Security

- Do not commit secrets. If you find one, rotate and open a security advisory (see SECURITY.md). 