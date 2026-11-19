# Test Strategy Notes

**Updated:** 2026-11-20

## Application assessment

The supplied assessment described an Angular application without tests. The checked-in application is instead a Next.js/React SPA with a Spring Boot BFF, a Spring Boot Claims Service, Keycloak authentication, PostgreSQL persistence, Redis, and Kafka. It already has Vitest UI tests and JUnit backend tests. The source and Compose configuration were treated as authoritative over the assessment's stack description.

The highest-risk journeys cross multiple boundaries: authentication and role checks, claim validation, BFF-to-service calls, persistence, and claim status transitions. The QA coverage includes browser-visible Playwright and API-backed service tests, plus Testing Library component tests and isolated unit tests for claim validation.

## Coverage choices

| Layer | What is exercised | Why |
|---|---|---|
| Component | Empty-claims message, accessible submit action, and navigation after the user's click | Validates visible user behavior and interaction through Testing Library, without asserting component internals. |
| Unit | Claim schema minimum/maximum bounds, invalid values, future dates, and combined valid submissions | Exercises business validation in isolation from React and network services. |
| UI | Claimant/admin login, invalid login, claim form validation | Validates rendered behavior and client-side boundaries in the SPA. |
| API | Login cookies, anonymous access, CSRF, claim create/read/list, field bounds, role restrictions | Checks BFF contracts and authorization with real services. |
| Microservices | Create through the BFF, administer status, read the persisted claim back | Verifies the BFF-to-Claims-Service path and persistence across the service boundary. |
| E2E | Claimant submits and sees a saved claim; admin navigates dashboard, claims, and users | Confirms complete user journeys in a browser. |
| Database | Schema, required columns, indexes, foreign key, bounds, statuses, orphan and duplicate checks | Adds read-only integrity checks against the actual PostgreSQL schema. |

Positive, negative, and boundary cases are included. Examples include invalid credentials, anonymous requests, missing CSRF, claimant access to admin APIs, future dates, too-short location/description, zero and over-limit amounts, inclusive amount/text boundaries, and a denied `SUBMITTED → CLOSED` transition.

## Shared authentication fixture

The Playwright projects share [fixtures/auth.ts](./fixtures/auth.ts) and role-specific credentials. `signInApi` verifies API login succeeds; `csrfHeaders` obtains and validates the server-provided CSRF token/header before state-changing API requests; `signInUi` follows the visible login flow and asserts the claimant or administrator landing route. This keeps authentication setup consistent while preserving separate API and browser user journeys. Credentials are for the local demo realm only; use the documented `QA_*` environment variables to override them.

## Running the new frontend test groups

- `npm run qa:test:component` runs the Testing Library component tests. They query visible content by role/text and interact with the empty-state submit button.
- `npm run qa:test:unit` runs the UI unit folder, including isolated claim-schema tests for inclusive minimum/maximum bounds, rejected out-of-range values, future incident dates, and a valid combined submission.
- `npm run qa:test:components` runs the complete frontend Vitest suite.

## Combined Allure reporting

`npm run qa:report` clears the previous Allure output, runs the Playwright QA suite and the full frontend Vitest suite, then generates a single-file HTML report at `artifacts/allure-report/index.html`. Playwright results are labeled as QA; Vitest suites are labeled as component/unit and grouped by their test-file paths, including `tests/components/` and `tests/unit/`. The command still returns non-zero when any suite fails, after attempting report generation.

The GitHub Actions workflow uploads the HTML report and raw results as a 30-day artifact. In combined-report mode, Playwright action details and trace/screenshot/video collection are disabled to avoid publishing input credentials. Run standalone browser tests to retain the configured failure diagnostics.

## Execution and data decisions

- Use the real Docker Compose stack and Playwright Chromium; do not mock the BFF, Claims Service, Keycloak, or PostgreSQL for these runtime flows.
- Use unique claim descriptions/UUIDs to keep test writes identifiable.
- The database scripts are read-only. The API does not expose claim deletion, so successful test claims remain in the local database. The final validation run left 18 claims; do not run write tests against shared or production data.
- Keep browser UI and API/service test projects separate so they can be run independently. The final suite is serialized (`workers: 1`) because the local app uses shared demo accounts and local infrastructure.
- Do not alter production behavior to make tests pass. Tests retain the expected client-error contract and report unexpected server responses.

## Findings and limitations

- The normal claimant browser flow, including claim submission and read-back, passed.
- Latest supplemental UI run (2026-11-20): the new Testing Library component tests passed (2/2), and all six new isolated claim-schema cases passed.
- The full `tests/unit/` group had 53 passing and 2 failing tests. Both failures are existing theme-store persistence assertions (`theme-storage` is absent after updates); they were not changed as part of the claims test addition.
- Latest combined Allure run (2026-11-20): report generation succeeded and contains the Playwright QA results (13 passed, 2 failed) plus the full Vitest results (265 passed, 9 failed). The aggregate command returns failure because test defects remain; report generation itself passed.
- Two negative API/service cases return HTTP 500 instead of the expected HTTP 400: future incident date validation and the invalid status transition. These are reported as application defects, not hidden by changing the assertions.
- The existing UI component suite reported 257 passed and 9 failed in wizard-step-2 validation/accessibility and theme-store persistence tests.
- The UI container initially lacked generated OpenAPI client files. Running the project's existing API generation script and rebuilding the UI image resolved the missing-module errors; no production logic was changed.
- `docker-compose.apps.yml` enables CDC mode. The CDC Compose stack was not started, so CDC connector behavior and Kafka event payloads remain unverified.
- `npm ci` reported 23 dependency audit advisories (2 low, 4 moderate, 15 high, 2 critical). Dependency remediation was outside this test-automation scope.

See [runtime-validation-report.md](./runtime-validation-report.md) for environment details, exit codes, test counts, and final database results. The automation layout and run commands are in [README.md](./README.md).
