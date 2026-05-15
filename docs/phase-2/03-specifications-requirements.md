# 3. Specifications & Requirements

## 3.1 System Overview

Clinic Derma is a role-based clinic operations platform with:

- Frontend: Expo React Native application
- Backend: Django REST API
- Data layer: SQLite (development) with migration-ready schema

Primary business goals:

- reduce receptionist workload for appointment and billing tasks
- give doctors structured tools for diagnosis and longitudinal patient history
- enforce consistent insurance and inventory logic
- provide operational analytics for clinic decisions

## 3.2 Stakeholders

- Receptionist
- Doctor
- Clinic management
- Patient (indirect actor through receptionist and doctor workflows)

## 3.3 Functional Requirements

### Authentication and Access

- FR-01: System shall authenticate doctors and receptionists using email and password.
- FR-02: System shall return user role and profile data on successful login.
- FR-03: System shall reject invalid credentials with explicit error response.

### Patient Management

- FR-04: System shall allow creation and update of patient records.
- FR-05: System shall store medical history, surgeries, and allergies.
- FR-06: System shall provide detailed patient profile and timeline endpoints.
- FR-07: System shall support insurance metadata per patient, including validity dates.

### Appointment Management

- FR-08: System shall allow booking, listing, filtering, and updating appointments.
- FR-09: Appointment status shall support `booked`, `checked_in`, `completed`, `cancelled`.
- FR-10: System shall allow assigning services to appointments.

### Diagnosis and Clinical Records

- FR-11: Doctors shall be able to create medical records with diagnosis notes.
- FR-12: System shall support prescription creation and medication association.
- FR-13: System shall support ontology-assisted search for diagnosis support.
- FR-14: System shall support attachments metadata (photos/labs) in diagnosis workflow.

### Billing and Insurance

- FR-15: System shall create invoices with multiple items.
- FR-16: System shall auto-compute subtotal, discount, insurance amount, and total.
- FR-17: System shall auto-apply insurance coverage only when policy is active.
- FR-18: System shall allow marking invoice as paid with payment method.

### Inventory

- FR-19: System shall support CRUD operations on inventory items.
- FR-20: System shall support stock add/use transactions with audit trail.
- FR-21: System shall block over-consumption when stock is insufficient.
- FR-22: System shall provide low-stock and expiring-soon alerts.

### Reports and Analytics

- FR-23: System shall provide analytics endpoints for overview KPIs.
- FR-24: System shall provide appointment trend and status reports.
- FR-25: System shall provide inventory summary and transaction reports.
- FR-26: System shall provide patient analytics trends and demographics.

### Clinic Settings

- FR-27: System shall support default and per-doctor clinic schedule.
- FR-28: System shall resolve effective schedule for any doctor context.

## 3.4 Non-Functional Requirements

- NFR-01 Performance: core API requests should respond within local baseline thresholds.
- NFR-02 Reliability: CI must pass before production deployment.
- NFR-03 Maintainability: all business rules must be tracked in code review and tests.
- NFR-04 Security (current baseline): no secrets hardcoded in deployment configs; use GitHub Secrets.
- NFR-05 Observability: deployment workflow should expose clear job logs and failure causes.
- NFR-06 Scalability: architecture supports migration from SQLite to managed DB provider.

## 3.5 Constraints and Assumptions

- C-01: Current backend uses SQLite for local development.
- C-02: Role logic currently relies on custom doctor/receptionist tables.
- C-03: Production deployment requires environment secrets configured in GitHub.
- C-04: Frontend currently targets REST endpoints under `/api/`.
- C-05: Frontend API base URL must be provided via `EXPO_PUBLIC_API_BASE_URL` for non-local deployments.

## 3.6 API Surface Summary

Base URL: `/api/`

Core endpoints:

- `/login/`
- `/patients/`, `/patients/{id}/details/`, `/patients/{id}/history/`, `/patients/{id}/save_diagnosis/`, `/patients/{id}/update_info/`
- `/doctors/{id}/dashboard/`, `/doctors/{id}/appointments_by_date/`, `/doctors/{id}/patients/`
- `/appointments/`, `/appointments/{id}/add_service/`
- `/invoices/`, `/invoices/{id}/mark_paid/`
- `/inventory/`, `/inventory/{id}/add_stock/`, `/inventory/{id}/use_stock/`, `/inventory/low_stock/`, `/inventory/expiring_soon/`
- `/insurance-companies/`
- `/clinic-schedules/upsert/`, `/clinic-schedules/resolved/`
- `/reports/analytics/`, `/reports/appointments/`, `/reports/inventory/`, `/reports/patients/`

## 3.7 Acceptance Criteria

- AC-01: All high-priority test cases in [01-test-cases.md](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\docs\phase-2\01-test-cases.md) pass.
- AC-02: Backend automated tests pass in CI.
- AC-03: Frontend lint passes in CI.
- AC-04: CD workflow can trigger deployment using configured deploy-hook secrets.
- AC-05: Repository includes backlog, issue process, scrum summaries, and PR template.
