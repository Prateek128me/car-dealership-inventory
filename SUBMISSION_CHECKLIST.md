# Submission checklist

## Completed in this package

- [x] Original FastAPI API and React/TypeScript/Tailwind SPA.
- [x] Persistent file-backed SQLite database.
- [x] Registration, login, JWT verification, and admin authorization.
- [x] CRUD, combined search, purchasing, and restocking.
- [x] Atomic stock changes, including a simultaneous-purchase regression test.
- [x] Genuine red/green/refactor commits and captured failure/success logs.
- [x] Backend, frontend, and browser tests executed locally in the build environment.
- [x] Responsive desktop/mobile screenshots of the working application.
- [x] Setup instructions, API documentation, My AI Usage, test report, and CI workflow.

## Required before you submit

- [ ] Download and extract the package. Clone `car-dealership-history.bundle` to retain the real history.
- [ ] Set your own Git identity locally before making your own commits.
- [ ] Run the project on your computer using the README. Create your own administrator credentials.
- [ ] Review the API permission interpretation: only delete/restock are admin-only at the API, while all management forms are admin-only in the UI.
- [ ] Replace the partial record in `PROMPTS.md` with a complete, raw chat export or add a real public chat link. Include future AI sessions too. Do not use generated summaries.
- [ ] Resolve the missing AI co-author trailers. They are disabled in the authoring workspace; the supplied commits do not satisfy that requirement.
- [ ] Add a truthful personal reflection to My AI Usage, describing your actual review, changes, and local validation.
- [ ] Publish the repository publicly and verify an unauthenticated reader can access it. No destination repository was supplied or created in this session.
- [ ] Confirm the remote GitHub Actions run passes; local results are not evidence of a remote run.
- [ ] Add the actual repository link to your submission. Deployment is optional and has not been performed.

## Publishing without losing the TDD history

1. Create an empty public GitHub repository in your own account. Do not initialize it with an unrelated README or license.
2. From the folder cloned from the bundle, remove its bundle remote and add your actual repository URL:

```sh
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

The URL above is a placeholder, not an existing project link. Never commit `.env`, virtual environments, dependency folders, or database files. They are excluded by `.gitignore`.

## Interview checkpoints

Be able to explain and demonstrate:

1. Why a SQLite file satisfies persistence and an in-memory database does not.
2. Authentication versus authorization; why hiding an admin button is insufficient.
3. JWT signing, expiration, and why passwords are hashed rather than encrypted.
4. Why registration cannot accept a role and why admin creation is a local CLI action.
5. Why money is stored in integer paise and exposed as a decimal string.
6. Why read-then-decrement can oversell, and how a conditional SQL update prevents it.
7. Which tests failed in the red commits and what changed to make them pass.
8. Why the UI disables purchasing at zero stock while the API still independently validates it.
9. Tradeoffs: SQLite versus PostgreSQL, memory-only tokens, no pagination, no payment/order system.
10. What AI wrote, what you personally reviewed, and which design choices you would change.

## Efficient Astra workflow for further work

Use the access already available in your account. No paid AI API calls are needed. Keep the requirements, architecture, test results, and raw prompts in this repository so a new session has concrete context.

- Give one small feature, its acceptance criteria, and relevant files per request.
- Ask for behavioral tests first; run them and commit the genuine red state before implementing.
- Implement only that feature, rerun tests, and commit the green state.
- Refactor separately while preserving passing tests.
- When debugging, provide the exact command, full relevant error, environment versions, and smallest relevant code sample.
- Ask for review of permissions, boundary values, and concurrency once the feature works.
- Review the diff yourself; explain why each test exists. Do not spend repeated prompts regenerating files that already work.

Suggested future prompt (a template, not part of the raw chat log):

> Implement only [feature]. Read the current README and tests. First add tests for [acceptance cases] and demonstrate that they fail for the intended reason. Then implement the smallest complete change, rerun the relevant suite, and refactor if needed. Report the actual commands/results and changed files. Do not invent execution results or rewrite past history. Follow the repository's AI disclosure rules and preserve the exact conversation externally for PROMPTS.md.
