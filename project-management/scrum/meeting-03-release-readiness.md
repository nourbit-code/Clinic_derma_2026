# Scrum Meeting 03 - Release Readiness

- Date: 2026-05-12
- Sprint: Sprint-3
- Duration: 60 minutes

## Participants

- Product owner
- Backend developer
- Frontend developer
- QA engineer
- DevOps owner

## Agenda

1. Phase 2 checklist walkthrough.
2. CI/CD and deployment readiness.
3. Documentation completion and handover.

## Decisions

- CI pipeline must include backend tests and frontend lint on every push/PR.
- CD pipeline will use deploy hook secrets for backend and frontend targets.
- Repository must contain backlog, issue templates, scrum artifacts, and PR template.

## Blockers

- Deployment secrets not configured yet in GitHub repository settings.

## Action Items

- DevOps: configure `BACKEND_DEPLOY_HOOK_URL` and `FRONTEND_DEPLOY_HOOK_URL`.
- Team: migrate backlog items into GitHub Issues and board.
- QA: run final regression and attach run evidence to release notes.

