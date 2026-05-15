# Scrum Meeting 02 - Integration and Testing

- Date: 2026-04-18
- Sprint: Sprint-2
- Duration: 50 minutes

## Participants

- Product owner
- Backend developer
- Frontend developer
- QA engineer

## Agenda

1. Review completed Sprint-1 stories.
2. Validate diagnosis, billing, and insurance logic.
3. Confirm negative tests and regression strategy.

## Decisions

- Added insurance validity behavior as blocker-level requirement for billing.
- Adopted negative tests for invalid login, expired insurance, and stock underflow.
- Approved backend unit tests for invoice and inventory rules.

## Blockers

- Temporary inconsistency in local API base URL across frontend modules.

## Action Items

- Frontend: centralize API base URL config.
- Backend: add tests for insurance and stock edge cases.
- QA: update Postman collection with negative folder.

