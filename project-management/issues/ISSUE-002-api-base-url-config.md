## Title

[FRONTEND] Replace hardcoded API URLs with environment-driven config

## Type

Feature / deployment readiness

## Description

Frontend API modules currently hardcode `http://127.0.0.1:8000/api`. Introduce a single runtime config using environment variables for local/staging/production deployment.

## Acceptance Criteria

- One shared API base URL source.
- Local fallback remains functional.
- Deployment docs include required env variable.

## Labels

`frontend`, `deployment`, `priority:P0`

