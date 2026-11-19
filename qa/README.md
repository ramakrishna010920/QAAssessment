# Claims Demo QA Automation

This suite separates browser UI, BFF/API, cross-service, browser end-to-end, and database checks. It is based on the implemented Next.js/React UI, Spring Boot BFF and Claims Service, Keycloak auth, PostgreSQL persistence, and Kafka/CDC event path.

## Folder map

| Folder | Scope |
|---|---|
| `ui/` | Browser-visible login and claim form behavior, including negative and boundary cases |
| `api/` | BFF login, cookie auth, claim create/read/list, validation, and role access |
| `microservices/` | BFF-to-Claims Service claim lifecycle, persistence read-back, and allowed/denied status transitions |
| `e2e/` | Complete claimant claim-submission flow and administrator navigation |
| `database/` | Read-only PostgreSQL schema/data integrity assertions and status counts |
| `fixtures/` | Shared local demo credentials, unique claim data, and sign-in helpers |
| `scripts/` | PostgreSQL assertion runners |

The UI project's Vitest suite also has separate `tests/components/` and `tests/unit/` folders. Component tests use Testing Library roles, labels, visible content, and user interactions; unit tests exercise schemas and business rules without rendering React or starting services.

## Coverage decisions

### Highest-risk areas

1. **Authentication and authorization** — login issues browser cookies, and BFF authorization must preserve roles across each downstream request. An auth/RBAC regression can expose claims or admin functions.
2. **Claim validation and lifecycle** — incident date, description, location, and monetary bounds are checked in both UI and domain code; status transitions are state-dependent.
3. **Cross-service persistence** — a claim crosses the UI/BFF boundary, is authenticated and validated by the Claims Service, is persisted in PostgreSQL, and may produce Kafka/CDC events.
4. **UI wizard and session routing** — multi-step form state and post-login route selection affect whether a user can submit and later find their claim.

| Risk / boundary | Positive | Negative | Boundary or persistence evidence |
|---|---|---|---|
| Authentication and authorization | Claimant/admin login and role landing | Bad password, anonymous claim request, claimant admin-route denial, missing CSRF token | BFF sets HTTP-only access/refresh cookies |
| Claim validation | Current-date claim | Future date, short location/description, zero and over-limit amounts | $0.01, five-character location, ten-character description |
| Claim persistence | Create, retrieve by ID, list | Invalid claim must be rejected | API read-back; database FK, required columns, supported statuses |
| Admin status rules | SUBMITTED → UNDER_REVIEW → APPROVED | SUBMITTED → CLOSED is rejected | Read back final status through claimant BFF API |
| UI workflows | Login, wizard review, submit, admin navigation | Invalid login and invalid wizard fields | Browser-visible confirmation and claims list |

Each created claim uses a UUID in its test data. The API does not expose a claim-delete operation, so successful test claims remain in the local demo database. Do not point these write tests at a shared or production environment.

### Assessment notes

- The supplied assessment document describes an Angular application with no tests; the checked-in implementation is Next.js/React and already contains Vitest UI tests plus extensive JUnit tests. These new tests target the actual code and do not duplicate those suites.
- The README says direct Kafka publishing is the default, but `docker-compose.apps.yml` sets `APP_EVENTS_CDC_ENABLED` to `true`. Start the CDC stack when using the Compose configuration as checked in, or consciously change that setting for direct-publish mode.
- The BFF enforces CSRF on state-changing claim endpoints and exposes `/api/auth/csrf`. The direct API test confirms a write without the token is rejected. The normal claimant browser flow passed in the local E2E run and persisted a claim, so CSRF did not block the configured user flow in this environment.
- Async event payload/consumer correctness, load, visual regression, and full transition-matrix coverage are intentionally deferred; the selected tests focus on auth boundaries, claim validation, persistence, the central status transition, and user journeys.

## Prerequisites and run commands

1. Start the Docker Compose infrastructure and app from the repository instructions. All Playwright projects require the UI, BFF, Claims Service, and Keycloak to be reachable. For the configured `APP_EVENTS_CDC_ENABLED=true` mode, start the CDC Compose file after the claims table has been created.
2. Use Node.js 22.18 or newer for Allure Report 3. From the workspace root, install the root and UI package dependencies if needed and install Chromium once:

   ```powershell
   npm install
   npm --prefix demo-app-qa-main/code/demo-app-ui install
   npx playwright install chromium
   ```

3. Run selected or all browser/API suites:

   ```powershell
   npm run qa:test:component
   npm run qa:test:unit
   npm run qa:test:components
   npm run qa:test:ui
   npm run qa:test:api
   npm run qa:test:microservices
   npm run qa:test:e2e
   npm run qa:test
   ```

4. Generate the combined Allure report after starting the Docker Compose app:

   ```powershell
   npm run qa:report
   npm run qa:report:open
   ```

   `qa:report` runs the full Playwright QA suite plus the frontend Vitest suite, including component and unit tests. It writes raw results to `artifacts\allure-results` and the HTML report to `artifacts\allure-report`. The report is still generated when a test suite fails, and the command returns a non-zero exit code so CI does not hide failures. The Allure suites are grouped by test file; the `tests/components/` and `tests/unit/` folders identify the new component and unit cases.

5. Run database integrity assertions separately:

   ```powershell
   .\qa\scripts\run-database-checks.ps1
   ```

The test runner checks UI, BFF, Claims Service, and Keycloak readiness before starting. Configure alternate endpoints or credentials with `QA_UI_URL`, `QA_BFF_URL`, `QA_CLAIMS_URL`, `QA_KEYCLOAK_URL`, `QA_CLAIMANT_EMAIL`, `QA_CLAIMANT_PASSWORD`, `QA_ADMIN_EMAIL`, and `QA_ADMIN_PASSWORD`. Defaults match the local demo realm only.

Playwright evidence is written to `artifacts\playwright-report`, `artifacts\playwright-results.xml`, and `artifacts\test-results`. Allure's combined raw results and HTML report are written under `artifacts\allure-results` and `artifacts\allure-report`. The GitHub Actions workflow uploads the report and raw results as a 30-day artifact named `allure-report-<run-number>`. Database assertions are read-only and use the schema from the Claims Service Liquibase changelog.

## Runtime validation

See [runtime-validation-report.md](./runtime-validation-report.md) for the Docker startup status, test counts, database check results, and remaining application defects observed during local execution.

## Project notes

- [test-strategy-notes.md](./test-strategy-notes.md) records the application assessment, coverage decisions, and known gaps.
- [ai-working-journal.md](./ai-working-journal.md) records accepted requests, challenged assumptions, and scope decisions.

## Deliberate exclusions

- `qa:test:components` runs the full frontend Vitest suite; `qa:test:component` runs the Testing Library component folder, and `qa:test:unit` runs the UI unit-test folder.
- The Allure report combines the Playwright QA suite with the full frontend Vitest suite; component and unit cases appear alongside browser/API results, grouped by their test-file suites.
- No load, visual-diff, or CDC message-content assertions are included. CDC and Kafka are independently observable infrastructure and can be added as a separate layer once event schema/retention expectations are agreed.
- The database checks assert integrity and schema assumptions without inserting or deleting rows. Claim writes are exercised through the BFF and verified via API read-back.
