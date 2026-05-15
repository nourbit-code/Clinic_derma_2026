# 5. Deployment Guide (GitHub Student Pack)

This repository is deployment-ready through `.github/workflows/cd.yml` using deploy hooks.

## 5.1 Prerequisites

1. Your GitHub account is verified for Student Pack.
2. You have selected hosting providers available through your Student Pack benefits.
3. You created one backend service and one frontend service in your hosting provider dashboard.

## 5.2 Configure Backend Service

Use the backend folder:

- Root path: `backend-1`
- Start command: `python manage.py runserver 0.0.0.0:$PORT` (or provider equivalent)
- Required environment variables:
  - `DJANGO_SETTINGS_MODULE=clinical_backend.settings`
  - any provider-specific variables

Generate backend deploy hook URL from your hosting provider.

## 5.3 Configure Frontend Service

Use the frontend folder:

- Root path: `DermaSkincareApp`
- Build command: provider-specific Expo web build command
- Required environment variable:
  - `EXPO_PUBLIC_API_BASE_URL=https://<your-backend-domain>/api`

Generate frontend deploy hook URL from your hosting provider.

## 5.4 Configure GitHub Secrets

In repository settings, create:

- `BACKEND_DEPLOY_HOOK_URL`
- `FRONTEND_DEPLOY_HOOK_URL`

## 5.5 Deployment Trigger

Deployment runs automatically when:

- `CI` workflow succeeds on `master` or `main`, or
- you manually run `CD` workflow from GitHub Actions tab.

## 5.6 Post-Deploy Validation

1. Open backend health endpoint, for example:
   `https://<backend-domain>/api/patients/`
2. Open deployed frontend and complete:
   - login
   - patient creation
   - appointment creation
   - invoice creation
3. Confirm report pages load successfully.

## 5.7 Rollback Strategy

If deployment fails:

1. Re-run the previous stable commit deployment hook.
2. Revert the failing commit in Git.
3. Re-run CI/CD.
4. Log root cause in a new issue using bug template.

