# 1. Test Cases

## 1.1 Scope

The following test suite covers the end-to-end clinic workflow across:

- Authentication
- Patient lifecycle
- Doctor workflow (diagnosis and history)
- Receptionist workflow (appointments, billing, insurance, settings)
- Inventory management
- Reporting and analytics
- Reliability and data integrity

## 1.2 Test Environment

- Backend: Django REST API on `http://127.0.0.1:8000`
- Frontend: Expo app (`DermaSkincareApp`)
- Database: SQLite (local)
- API runner: Postman Collection Runner
- Automated checks: GitHub Actions CI

## 1.3 Entry / Exit Criteria

- Entry criteria:
  - migrations applied
  - backend running
  - frontend dependencies installed
- Exit criteria:
  - all critical and high-priority tests pass
  - no open blocker defects
  - CI pipeline passes on target branch

## 1.4 Test Case Matrix

| ID | Module | Preconditions | Steps | Expected Result | Type | Priority |
|---|---|---|---|---|---|---|
| AUTH-01 | Login as Doctor | Doctor account exists | Send `POST /api/login/` with valid doctor credentials | `200`, role=`doctor` | API | High |
| AUTH-02 | Login as Receptionist | Receptionist account exists | Send `POST /api/login/` with valid receptionist credentials | `200`, role=`receptionist` | API | High |
| AUTH-03 | Invalid Login | None | Send `POST /api/login/` with wrong email/password | `401` with error message | API | High |
| AUTH-04 | Missing Login Payload | None | Send `POST /api/login/` without password | `400` validation error | API | High |
| AUTH-05 | Role Routing on UI | Valid credentials for each role | Login from app as doctor/receptionist | User lands on role-specific dashboard | UI | High |
| PAT-01 | Create Patient Basic | Receptionist logged in | Add patient (name, phone, age) | Patient created and listed | UI/API | High |
| PAT-02 | Create Patient with Insurance | Insurance company exists | Add patient with insurance fields and validity dates | `insurance_is_active` calculated correctly | API | High |
| PAT-03 | Edit Patient Info | Existing patient | Update email, notes, history, surgeries | Changes persist and return in details | API/UI | Medium |
| PAT-04 | Patient Details Endpoint | Existing patient | `GET /api/patients/{id}/details/` | Full profile payload returned | API | High |
| PAT-05 | Patient History Endpoint | Patient has records | `GET /api/patients/{id}/history/` | Medical records list returned | API | Medium |
| PAT-06 | Patient Search (UI) | Multiple patients | Search by name/phone in directory | Correct filtered list | UI | Medium |
| PAT-07 | Edit-Only Policy | Existing patient | Attempt delete in receptionist flow | Deletion blocked or hidden by policy | UI/Process | High |
| DOC-01 | Doctor Dashboard | Doctor exists with appointments | `GET /api/doctors/{id}/dashboard/` | Correct KPIs and today list | API | High |
| DOC-02 | Doctor Appointments by Date | Doctor has appointment range | `GET /api/doctors/{id}/appointments_by_date?date=...` | Correct appointments for date | API | Medium |
| DOC-03 | Save Diagnosis | Patient and doctor exist | `POST /api/patients/{id}/save_diagnosis/` with diagnosis + meds | Record and prescription are created | API | High |
| DOC-04 | Medication Suggest | Medication data imported | `GET /api/medications/suggest?q=...` | Relevant suggestions returned | API | Medium |
| DOC-05 | Ontology Search | Backend running with network access | `GET /api/ontology/search?q=...` | Concepts returned (remote or cached fallback) | API | Medium |
| DOC-06 | Patient Profile Timeline | Patient has visits/files | `GET /api/patients/{id}/profile/` | Combined timeline data rendered | API/UI | Medium |
| APP-01 | Create Appointment | Patient exists | `POST /api/appointments/` with date/time/type | `201` and appears on calendar | API/UI | High |
| APP-02 | Filter Appointments by Date | Appointments exist | `GET /api/appointments/?date=...` | Only date-matching rows returned | API | Medium |
| APP-03 | Filter by Doctor | Appointments exist | `GET /api/appointments/?doctor={id}` | Only doctor-specific appointments | API | Medium |
| APP-04 | Status Change Flow | Existing appointment | Patch `booked -> checked_in -> completed` | Status updates saved and visible | API/UI | High |
| APP-05 | Add Service to Appointment | Appointment + service exist | `POST /api/appointments/{id}/add_service/` | Service link created with optional cost | API | Medium |
| APP-06 | Calendar Grouping | Appointments across dates | Open receptionist dashboard calendar | Correct group-by-date cards | UI | Medium |
| INV-01 | Create Invoice | Patient exists | `POST /api/invoices/` with items | Subtotal/total auto-calculated | API | High |
| INV-02 | Auto Insurance Coverage (Active) | Patient has active insurance | Create invoice without explicit coverage | Coverage pulled from insurance company | API | High |
| INV-03 | Expired Insurance Handling | Patient insurance expired | Create invoice | Coverage forced to `0`, provider cleared | API | High |
| INV-04 | Mark Invoice Paid | Existing invoice | `POST /api/invoices/{id}/mark_paid/` | status=`paid`, `is_paid=true` | API | High |
| INV-05 | Update Invoice Items | Existing invoice | `PATCH /api/invoices/{id}/` with new items | Totals recomputed correctly | API | Medium |
| INV-06 | Payment List UI | Multiple invoices | Open payments page | Correct list, statuses, totals | UI | Medium |
| STOCK-01 | Add Inventory Item | Receptionist/doctor access | `POST /api/inventory/` | Item created with category/unit metadata | API | High |
| STOCK-02 | Add Stock Transaction | Item exists | `POST /api/inventory/{id}/add_stock/` | Quantity increases, transaction logged | API | High |
| STOCK-03 | Use Stock Valid | Item quantity sufficient | `POST /api/inventory/{id}/use_stock/` within balance | Quantity decreases, transaction logged | API | High |
| STOCK-04 | Use Stock Insufficient | Item quantity insufficient | `POST /api/inventory/{id}/use_stock/` over balance | `400` with error `Insufficient stock` | API | High |
| STOCK-05 | Low Stock Endpoint | Items with low levels exist | `GET /api/inventory/low_stock/` | Low stock subset returned | API | Medium |
| STOCK-06 | Expiring Soon Endpoint | Items with expiry dates exist | `GET /api/inventory/expiring_soon/` | Expiring subset returned | API | Medium |
| RPT-01 | Analytics Report | Historical data exists | `GET /api/reports/analytics/?period=week` | KPI and chart arrays returned | API | Medium |
| RPT-02 | Appointments Report | Appointment data exists | `GET /api/reports/appointments/?period=month` | Trends, status, hourly breakdown returned | API | Medium |
| RPT-03 | Inventory Report | Inventory data exists | `GET /api/reports/inventory/` | Summary + categories + recent transactions | API | Medium |
| RPT-04 | Patients Analytics Report | Patient data exists | `GET /api/reports/patients/?period=month` | New-patients trend + demographics returned | API | Medium |
| RPT-05 | Report Pages Rendering | API available | Open doctor/receptionist report pages | Charts load without runtime errors | UI | Medium |
| CFG-01 | Default Schedule Upsert | None | `POST /api/clinic-schedules/upsert/` with `doctor=default` | Default schedule saved | API | High |
| CFG-02 | Schedule Resolve | Default or doctor schedule exists | `GET /api/clinic-schedules/resolved/?doctor=...` | Correct schedule returned | API | High |
| CFG-03 | Invalid Doctor in Schedule | Invalid doctor ID | Upsert with unknown doctor | `404` doctor not found | API | Medium |
| REL-01 | API Response Time Baseline | System running locally | Run 25 core requests via runner | Avg response under 500ms local baseline | Non-functional | Low |
| REL-02 | Data Consistency | Create/update records | Cross-check UI pages and API payloads | No mismatch between UI and API data | Non-functional | Medium |
| REL-03 | Regression on Master | CI enabled | Push to `master` | CI passes; no deployment on failed checks | Process | High |

## 1.5 Automated Coverage Map

- Automated API/business tests:
  [tests.py](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\backend-1\clinic\tests.py)
- Postman regression suite:
  [Clinic_Derma_Backend.postman_collection.json](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\backend-1\Clinic_Derma_Backend.postman_collection.json)
- CI automation:
  [ci.yml](C:\Users\yoyom\Downloads\Clinic_derma_2026-master\Clinic_derma_2026-git\.github\workflows\ci.yml)

