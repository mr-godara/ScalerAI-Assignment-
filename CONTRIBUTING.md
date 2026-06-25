# Contributing

We love your input! We want to make contributing to this Route53 clone as easy and transparent as possible.

## How to add new record types

1. **Update the Database Model**:
   - Go to `backend/app/models/dns_record.py` and add the new type to the `RecordType` enum.
   - Example: `CAA = "CAA"`

2. **Update the Validation Logic**:
   - Go to `backend/app/schemas/dns_record.py` and modify the `validate_record_value` function.
   - Add specific regex or logical checks for the new record type to ensure the JSON values array contains valid data strings.

3. **Frontend Support**:
   - Add the new record type to frontend UI selections in `frontend/src/lib/constants.ts` or directly within the record creation form components.
   - Adjust any record-specific help text or tooltips in the `RecordForm` component.

## How to add new API endpoints

1. **Define the Schema**:
   - Add Pydantic request and response models in the appropriate file under `backend/app/schemas/`.

2. **Implement Business Logic**:
   - Add the core functionality into a service class under `backend/app/services/` (e.g., `ZoneService` or `AuthService`). Keep database interactions isolated here.

3. **Create the Route Handler**:
   - Add the `@router.post` / `@router.get` function in the corresponding file inside `backend/app/routers/`.
   - Ensure the endpoint properly handles dependency injection (e.g., `db: DbDep`, `current_user: CurrentUserDep`).
   - Use standard RFC 7807 error formats by raising `HTTPException` with a structured `detail` dict.

4. **Add Frontend API Hooks**:
   - Update `frontend/src/lib/api/` with a new fetch wrapper.
   - Create a corresponding custom React Query hook in `frontend/src/lib/hooks/` to be used in UI components.

## Code Style Guide Summary

- **Backend (Python)**
  - Use Python 3.11+ syntax and strict type hinting (`from __future__ import annotations`).
  - Use `black` and `ruff` for formatting and linting.
  - Follow RESTful conventions. API responses must conform strictly to JSON schema designs.
  - Prefix private helper functions with an underscore (`_get_zone_or_404`).

- **Frontend (TypeScript / Next.js)**
  - Enable **strict mode**; absolutely no `any` types.
  - Use PascalCase for components (`HostedZonesTable`) and kebab-case for file names (`hosted-zones-table.tsx`).
  - Do not use inline styles. All styling must be done via Tailwind CSS utility classes.
  - Keep components modular. Separate data fetching (via React Query) from presentation components where possible.
