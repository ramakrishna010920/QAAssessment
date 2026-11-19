# Runtime Validation Report

**Generated:** 2026-11-19  
**Target:** Claims demo at `demo-app-qa-main/`  
**Test harness:** `qa/`

## Supplemental UI validation (2026-11-20)

| Test group | Status | Exit code | Details |
|---|---|---:|---|
| New Testing Library component tests | PASS | 0 | 2 passed: empty-state guidance and submit navigation via user interaction. |
| UI unit tests (`tests/unit/`) | FAIL | 1 | 53 passed, 2 failed. All 6 new claim-schema boundary/business-rule tests passed; the failures are existing theme-store localStorage persistence assertions. |

## Allure combined report validation (2026-11-20)

| Test group | Result | Details |
|---|---|---|
| Playwright QA | 13 passed, 2 failed | Same two API/service validation defects listed below. |
| Frontend Vitest | 265 passed, 9 failed (274 total) | Includes the new component/unit tests; failures remain in existing wizard-step-2 and theme-store tests. |
| Allure HTML generation | PASS | Combined report generated at `artifacts/allure-report/index.html`; raw results are in `artifacts/allure-results`. The aggregate command returned exit code 1 because test failures are preserved. |

## Summary

| Step | Status | Exit code | Details |
|---|---|---:|---|
| Docker Compose startup | PASS | 0 | UI opened at `http://localhost:3001/login`; BFF, Claims Service, PostgreSQL, and Keycloak reported healthy. Kafka and Redis were running. |
| Playwright UI and E2E | PASS | 0 | 6 passed: sign-in, invalid credentials, claim form boundaries, claimant submission/read-back, and admin navigation. |
| Playwright API and microservices | FAIL | 1 | 7 passed, 2 failed. Invalid future incident date and invalid status transition returned HTTP 500 instead of the expected 400. |
| Full Playwright suite | FAIL | 1 | 13 passed, 2 failed across 15 tests. The two failures are the API and microservice responses above. |
| UI component suite | FAIL | 1 | Latest full Vitest run: 265 passed, 9 failed across 27 files (274 total). Failures are in the existing wizard-step-2 and theme-store tests. |
| Database integrity assertions | PASS | 0 | Read-only assertions passed; 2 users and 18 claims were present at final verification. |
| Claim status summary SQL | PASS | 0 | 18 claims were `SUBMITTED` at final verification. |

## Environment and startup evidence

- Docker Engine: available (Docker Desktop 29.9.3).
- Node.js: v24.17.0.
- Playwright Chromium: available and used by the browser tests.
- Compose services: UI on port 3001, BFF on 8090, Claims Service on 8080, Keycloak on 8180, PostgreSQL on 5432, and Kafka on 9092.
- The UI Docker image initially lacked generated OpenAPI client files. Running the UI's existing `generate:api` script and rebuilding the UI image resolved the missing-module errors; no production source code was changed.
- The browser sign-in and claim submission flow completed, and the submitted claim appeared in the claims list.

## Issues found

| Severity | Finding | Evidence |
|---|---|---|
| High | Future incident-date validation in the BFF/service path returned 500 rather than a client validation response (400). | `qa/api/claims.spec.ts` |
| High | An invalid `SUBMITTED → CLOSED` transition returned 500 rather than the expected 400. | `qa/microservices/claim-lifecycle.spec.ts` |
| Medium | Existing component tests have 9 failures in wizard-step-2 validation/accessibility expectations and theme-store persistence. | UI Vitest run |
| Medium | Existing unit tests have 2 theme-store persistence failures (`theme-storage` is absent after updates). | Supplemental UI unit Vitest run |

Production code was not changed during validation. The two HTTP 500 responses remain application defects for the owning team to address.

## Coverage gaps and notes

- The CDC Compose stack was not started, so Kafka/CDC message payloads and connector behavior were not asserted. The current app Compose configuration enables CDC mode; see the note in [README.md](./README.md).
- Successful claim tests persist data because the API does not expose a claim-delete operation. The local database contained 18 claims after the run; do not point write tests at a shared or production environment.
- `npm ci` reported 23 dependency audit advisories (2 low, 4 moderate, 15 high, 2 critical). Dependencies were not upgraded as part of this test-automation task.
- The Allure reporter suppresses automatic Playwright action details, and the combined report run disables trace, screenshot, and video capture to avoid including entered credentials in published report attachments. Standalone Playwright runs retain the existing failure diagnostics.
- GitHub Actions is configured to upload the generated Allure report and raw results as a 30-day artifact. This workspace has not triggered a remote CI run, so no hosted artifact URL is available yet.
- Installing Allure's root dependencies reported 6 moderate advisories; the UI package install reported 23 advisories (2 low, 4 moderate, 15 high, 2 critical). No dependency remediation was performed.

## Test evidence

- Playwright HTML report: `artifacts/playwright-report`
- Playwright JUnit report: `artifacts/playwright-results.xml`
- Playwright traces, screenshots, and videos: `artifacts/test-results`
- Database scripts: [assert-integrity.sql](./database/assert-integrity.sql) and [claim-status-summary.sql](./database/claim-status-summary.sql)
