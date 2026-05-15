# 4. Project Management & GitHub Repository Requirements

## 4.1 Backlog

- Backlog source file:
  [backlog.csv](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\project-management\backlog.csv)
- Backlog includes:
  - Epic
  - User story
  - Priority
  - Story points
  - Sprint
  - Definition of done
  - Owner

## 4.2 Project Issues

- Issue form templates:
  - [bug_report.yml](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\ISSUE_TEMPLATE\bug_report.yml)
  - [feature_request.yml](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\ISSUE_TEMPLATE\feature_request.yml)
  - [task.yml](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\ISSUE_TEMPLATE\task.yml)
- Issue seeds for quick upload/copy:
  [project-management/issues](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\project-management\issues)

## 4.3 Scrum Board

Recommended board columns:

1. Backlog
2. Ready
3. In Progress
4. In Review
5. Testing
6. Done

Recommended custom fields:

- `Priority` (`P0`, `P1`, `P2`, `P3`)
- `Story Points`
- `Sprint`
- `Assignee`

WIP policies:

- Max 2 active issues per developer in `In Progress`
- Pull request required before moving to `Testing`
- CI must pass before moving to `Done`

## 4.4 Scrum Meeting Summaries

Meeting documentation is stored in:

- [meeting-01-kickoff.md](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\project-management\scrum\meeting-01-kickoff.md)
- [meeting-02-integration-and-testing.md](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\project-management\scrum\meeting-02-integration-and-testing.md)
- [meeting-03-release-readiness.md](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\project-management\scrum\meeting-03-release-readiness.md)

Each meeting summary includes:

- participants
- sprint goals
- blockers
- decisions
- action items and owners

## 4.5 Pull Request Governance

- PR template:
  [pull_request_template.md](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\pull_request_template.md)

PR rules:

- Every code change must reference at least one issue.
- CI must pass before merge.
- At least one reviewer approval required.
- Risk notes and rollback notes mandatory for backend logic changes.

## 4.6 CI/CD Pipeline

- CI workflow:
  [ci.yml](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\workflows\ci.yml)
- CD workflow:
  [cd.yml](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\workflows\cd.yml)

Current CI checks:

- Backend dependency install
- Django migrations
- Django automated tests
- Frontend dependency install
- Frontend lint

Current CD behavior:

- Runs only after CI succeeds on `master` or `main`
- Triggers deployment through secure deploy hooks
- Supports separate backend and frontend deployment hooks

## 4.7 Mandatory Deployment Using GitHub Student Pack

Suggested deployment strategy:

1. Claim GitHub Student Pack benefits on your active GitHub account.
2. Choose providers available in your benefits (for backend and frontend hosting).
3. Create deployment services and generate deploy hook URLs.
4. Add repository secrets:
   - `BACKEND_DEPLOY_HOOK_URL`
   - `FRONTEND_DEPLOY_HOOK_URL`
5. Push to `master` to trigger CI then CD.

Verification:

- CI job succeeds
- CD job succeeds
- production URLs respond correctly

