# Contributing

## Workflow
- Create an issue for every bug or feature before coding.
- Use the provided issue templates.
- Keep PRs small and focused on a single issue.

## Branching
- Branch from `main`: `feature/<issue-number>-short-title` or `fix/<issue-number>-short-title`.

## Pull Requests
- Link the issue in the PR description using “Fixes #<issue-number>”.
- Add short testing notes and screenshots if UI changes.
- One approval is enough; keep changes easy to review.

## GitHub Project
- Add the issue to the Project board.
- Status flow: Backlog → In Progress → In Review → Done.
- When you start: move the issue to “In Progress”.
- When you open a PR: move to “In Review”.
- When merged: the issue auto-closes (via “Fixes #…”) and you move it to “Done”.

## Local checks (recommended)
- Run the app and do a quick sanity check.
- If you can, run `npm run lint` and `npm run build` before opening the PR. 