## Title

[AUTH] Improve login security and remove plaintext password comparison

## Type

Technical debt / security

## Description

Current login flow compares plaintext passwords stored in custom tables. Migrate to secure authentication flow and hashed credentials while preserving doctor/receptionist role behavior.

## Acceptance Criteria

- Passwords are hashed at rest.
- Login still returns role-based payload.
- Existing tests updated and passing.

## Labels

`backend`, `security`, `priority:P0`

