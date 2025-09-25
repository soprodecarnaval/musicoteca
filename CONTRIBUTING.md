# Contributing

## Workflow
- Create an issue for every bug, feature, or song request before coding.
- Use the provided issue templates.
- Keep PRs small and focused on a single issue.

## Branching
- Branch from `main`: `feature/<issue-number>-short-title`, `fix/<issue-number>-short-title` or `song/<issue-number>-short-title`

## Pull Requests
- Link the issue in the PR description using "Fixes #<issue-number>".
- Add short testing notes and screenshots if UI changes.
- One approval is enough; keep changes easy to review.

### PR title conventions (simple)
- `feat:` Short summary of the feature
- `fix:` Short summary of the fix
- `song:` {Add/Update/Remove} "TITLE" - optional note
  - Example: `song: Add "CHEGUEI" - Trombone`, `song: Update "CHEGUEI" - Fingering Tuba`, `song: Remove "OLD MARCHA" - All`

## GitHub Project
- Single board using Status: `No status` (triage) → `Backlog` → `In Progress` → `Done`.
- New issues are auto-added to the board and land in `No status` (we treat this as "Needs triage").
- During triage, check that:
  - The issue is well explained and easily understandable
  - There are sufficient resources to be executable by someone else without external help from the author
  - If it meets the requirements for any release planned, apply the respective version label; if not, just move to Backlog for a possible future version
- When you start work, move the issue to `In Progress` (or open a linked PR; automation may move it).
- When the linked PR is merged OR the issue is closed, automation sets Status to `Done`.
- Always reference the issue in the PR (use "Fixes #<issue-number>") so it closes automatically on merge.

## Releases and Version Labels
- Use version labels as defined by the organization.
- Apply the appropriate version label if the issue qualifies for that release.
- Issues without version labels remain in Backlog for future consideration.

## Local checks (recommended)
- Run the app and do a quick sanity check.
- If you can, run `npm run lint` and `npm run build` before opening the PR.
