# Test report

Executed on **24 October 2026** in the development environment. These are actual local execution results, not a claim that GitHub Actions or an external deployment has run.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Backend API/integration suite | **58 passed** | [pytest output](docs/backend-tests.txt), [JUnit XML](docs/backend-junit.xml) |
| Backend combined statement/branch coverage | **93.21%**, above the 90% gate | [pytest coverage table](docs/backend-tests.txt) |
| Frontend component/application suite | **14 passed** | [Vitest output](docs/frontend-tests.txt) |
| Frontend coverage | **91.94% statements**, **93.50% branches**, **90.19% functions**, **94.20% lines** | [Vitest coverage table](docs/frontend-tests.txt) |
| Real-browser integration suite | **6 passed** | [Playwright output](docs/browser-tests.txt) |
| TypeScript + Vite production build | **Passed** | [Build output](docs/build.txt) |
| Prettier formatting check | **Passed** | [Formatting output](docs/format-check.txt) |
| Python Ruff lint | **Passed** | [Lint output](docs/python-lint.txt) |
| Combined FastAPI + built SPA smoke check | **Passed** | [Smoke output](docs/production-smoke.txt) |

**Total automated test cases: 78 passed.** Smoke assertions and formatting/build checks are additional checks, not included in that count.

## Meaningful behaviors covered

### Backend

- Registration returns a usable JWT and no password; the SQLite password hash is Argon2.
- Duplicate email detection is case-insensitive; invalid credentials return generic 401 responses.
- Invalid registration input and attempted role escalation are rejected.
- Missing, malformed, expired, incorrectly signed, unknown-user, and invalid-subject tokens fail.
- Existing tokens immediately lose admin privileges after a database role change.
- All vehicle endpoints require authentication; deletion and restocking require admin rights.
- Vehicle create/list/update/delete and persistence across application recreation.
- Case-insensitive combined search, inclusive price boundaries, invalid ranges, and safe literal handling of SQL-like input.
- Negative, fractional, boolean, excessive, non-finite, and empty inputs are rejected where appropriate.
- Editing vehicle details cannot overwrite inventory quantities.
- Purchasing reduces stock, sold-out purchases return conflict, restocking increases stock, and missing IDs return 404.
- **Eight simultaneous purchases of the last unit yield one success and seven conflicts.**
- Eight simultaneous restocks preserve all eight increments.
- Weak secrets and in-memory databases are rejected; demo seeding is idempotent.

### Frontend and browser

- Customer registration/sign-in/sign-out, invalid credentials, and expired-session recovery.
- Inventory rendering, combined filtering, category selection, reset, and empty results.
- Purchase submission, inventory refresh, notifications, and disabled sold-out/pending controls.
- Administrator add/edit/restock/delete dialogs, API payloads, failed form preservation, and cancellation.
- API field-validation and non-JSON error messages, network failure, and retry.
- Desktop screenshots, a mobile screenshot at **390 × 844**, no horizontal overflow, and mobile dialog interaction.

Browser tests use a real React development server, a real FastAPI HTTP server, and a disposable SQLite file. The expired-session browser test deliberately intercepts one response to exercise the UI's 401 path; backend tests separately exercise real JWT rejection.

## Honest TDD evidence

Historical outputs are preserved in `docs/tdd/` and the corresponding Git commits:

| Stage | Before implementation | After implementation |
| --- | --- | --- |
| Authentication | 11 failures | 11 passes |
| Vehicles/inventory | 37 failures, 12 passes | 49 passes |
| Domain error refactor | Existing suite | 49 passes |
| Vehicle card UI | 4 failures, 1 pass | 5 passes |

Later security regressions, full-application component tests, and browser tests were added after implementation. The project does not claim every line or feature was developed test-first.

## Environment and limits

- Python 3.12.14; Node.js 24.22.1; npm 11.9.0.
- FastAPI 0.162.0; pytest 9.1.1; Vitest 5.0.5; Vite 8.3.5.
- Playwright 1.51.1 with Chromium Headless Shell 134.0.6998.35. The latest browser download was unavailable in this environment; a compatible older test runner/browser was pinned and used successfully. This is test infrastructure, not a browser shipped to customers.
- pytest emitted one Starlette deprecation warning about its `httpx` TestClient compatibility path. It did not fail tests. The exact warning remains in the raw output.
- Backend coverage includes all `app` modules. `app/server.py`, the production entry point, is not covered by the measured pytest suite; it was exercised separately by the production smoke check. Other listed backend modules reach 100% in the measured suite.
- Frontend metrics come from Vitest's V8 coverage report under the configured `src` include/exclude rules. They do not include browser coverage, the application bootstrap, or test setup files.
- These results do not constitute a production security audit, load test, cross-browser certification, or an executed Windows installation. Windows instructions are provided but were not run on a Windows host here.
- Screenshots show fictional demo records and disposable test accounts. They are actual application screenshots, not design mockups.

## Reproduce

Run the commands in the README. Backend tests create fresh files through pytest's temporary-directory fixtures. Browser tests create and discard their own database. Stop development servers first so Playwright can acquire ports 8000 and 5173.

HTML coverage reports are supplied in the ZIP under `docs/coverage/` and can also be regenerated by the documented commands. Git excludes generated HTML coverage folders; plain-text reports and JUnit XML are committed. CI uploads regenerated reports as artifacts when it runs.
