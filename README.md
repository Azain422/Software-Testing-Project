# Playwright Automation Framework - Adactin Hotel App

UI and API test automation framework built with Playwright and JavaScript for the Software Testing course project.

- UI under test: https://adactinhotelapp.com/
- API under test: https://api-testing-postman.vercel.app/api/v1/users (the API used in Part 06 of the lab manual)
- Browser: Chromium only
- Total test cases: 20 (12 UI + 8 API)

## Framework Architecture

```
                    +---------------------------+
                    |   Jenkins (Jenkinsfile)   |
                    |  checkout -> docker build |
                    |  -> docker run -> publish |
                    +-------------+-------------+
                                  |
                    +-------------v-------------+
                    |  Docker container         |
                    |  (mcr.microsoft.com/      |
                    |   playwright image)       |
                    +-------------+-------------+
                                  |
                    +-------------v-------------+
                    |  playwright.config.js     |
                    |  chromium project,        |
                    |  list + html + allure     |
                    +-------------+-------------+
                                  |
          +-----------------------+-----------------------+
          |                                               |
+---------v----------+                         +----------v---------+
|  UI Test Suites    |                         |  API Test Suite    |
|  login.spec.js     |                         |  api.spec.js       |
|  searchHotel.spec  |                         |  (request fixture) |
|  bookedItinerary   |                         +----------+---------+
|  session.spec.js   |                                    |
+---------+----------+                                    |
          |                                               |
+---------v----------+    +--------------------+    +-----v--------------+
|  fixtures/         |    |  testdata/ (JSON)  |    |  utilities/        |
|  testSetup.js      |    |  loginData.json    |    |  apiHelper.js      |
|  (auto fixture)    |    |  uiData.json       |<---+  config.js         |
+---------+----------+    |  apiData.json      |    |  logger.js         |
          |               +--------------------+    |  screenshot.js     |
+---------v----------+                              |  waits.js          |
|  pages/ (POM)      +----------------------------->+                    |
|  BasePage.js       |                              +---------+----------+
|  LoginPage.js      |                                        |
|  SearchHotelPage   |                              +---------v----------+
|  SelectHotelPage   |                              |  Outputs           |
|  BookedItinerary   |                              |  allure-results/   |
+--------------------+                              |  playwright-report/|
                                                    |  screenshots/      |
                                                    |  logs/             |
                                                    +--------------------+
```

Flow of one UI test: JSON test data -> spec file -> page object -> BasePage / utilities -> browser -> Allure results.

Flow of one API test: JSON test data -> api.spec.js -> apiHelper.sendRequest() -> request fixture -> Allure results.

## Folder Structure

```
PlaywrightAutomation/
|-- fixtures/
|   +-- testSetup.js          auto fixture: opens app, starts log, attaches log after test
|-- pages/
|   |-- BasePage.js           navigate, login, logout, waits, screenshot, alert handling
|   |-- LoginPage.js
|   |-- SearchHotelPage.js
|   |-- SelectHotelPage.js
|   +-- BookedItineraryPage.js
|-- utilities/
|   |-- config.js             URLs, timeouts, output folders
|   |-- logger.js             console + logs/execution.log + Allure log attachment
|   |-- screenshot.js         step screenshots and afterEach screenshots
|   |-- waits.js              explicit wait helpers
|   +-- apiHelper.js          send request, measure response time, schema check
|-- testdata/
|   |-- loginData.json
|   |-- uiData.json
|   +-- apiData.json
|-- tests/
|   |-- login.spec.js
|   |-- searchHotel.spec.js
|   |-- bookedItinerary.spec.js
|   |-- session.spec.js
|   +-- api.spec.js
|-- playwright.config.js
|-- Dockerfile
|-- .dockerignore
|-- Jenkinsfile
+-- package.json
```

## Framework Components

**Page Object Model** - every page has its own class in `pages/` with its locators in the constructor and its actions as methods. All page classes extend `BasePage`, which has the common methods: `navigate`, `navigateTo`, `clickMenuLink`, `login`, `logout`, `waitForElement`, `takeScreenshot` and `handleAlert`.

**Data-driven testing** - all inputs and expected results are in `testdata/*.json`. The SQL injection tests (TC04-TC06) and the API negative tests (TC18-TC20) are generated with `forEach` over JSON arrays, so adding a row in the JSON adds a test.

**Hooks**
- `fixtures/testSetup.js` has an auto fixture that runs for every UI test: it starts the test log, opens the application URL, and after the test it logs the result and attaches the log to the report.
- Each spec file has `test.beforeAll` (logs browser name and version), `test.afterEach` (final screenshot, plus failure screenshot when the test fails) and `test.afterAll`.
- `searchHotel.spec.js` also uses `test.beforeEach` to log in before every test.
- Note: putting `test.afterEach` at the top level of the fixture file (as in Part 05) only attaches the hook to the first spec file loaded by each worker, so the screenshot hook is declared inside each spec file instead.

**Waits** - implicit waits come from `actionTimeout`, `navigationTimeout` and `expect.timeout` in `playwright.config.js`. Explicit waits are in `utilities/waits.js` (`waitForVisible`, `waitForHidden`, `waitForPageLoad`, `waitForUrl`).

**Reporting** - `allure-playwright` reporter. Each test in the Allure report has its steps, step screenshots, a final screenshot, a failure screenshot (failed tests only), the execution log, and for API tests the JSON response of every request. UI and API tests are in the same report.

**API testing** - uses the Playwright `request` fixture. Each test checks status code, response body, field types (schema), `content-type` header and response time. Tests create their own user (the API returns 409 for duplicates) and delete it at the end.

## Test Cases

| ID | Type | Test | Expected Result |
|---|---|---|---|
| TC01 | Positive | Login with valid user | Welcome message, Search Hotel page |
| TC02 | Negative | Login with invalid password | "Invalid Login details..." error |
| TC03 | Negative | Login with empty fields | "Enter Username" message |
| TC04 | SQL Injection | Login with `' OR '1'='1` | Login rejected, no DB error shown |
| TC05 | SQL Injection | Login with `admin'--` | Login rejected, no DB error shown |
| TC06 | SQL Injection | Login with `' UNION SELECT NULL--` | Login rejected, no DB error shown |
| TC07 | Functional | Navigate pages using the menu | Correct URL and page heading |
| TC08 | Functional | Search hotel with valid details | Select Hotel page with matching results |
| TC09 | Negative | Search without location | "Please Select a Location" |
| TC10 | Functional | Cancel booking confirm popup | Popup text checked, popup dismissed |
| TC11 | Positive | Logout | "You have successfully logged out" |
| TC12 | Security | Logout should end a stolen session | Copied session cookie stops working after logout |
| TC13 | API GET | Get all users | 200, user list, schema, no password field |
| TC14 | API POST | Login | 200, token in body and cookie |
| TC15 | API POST | Register new user | 201, user returned, no password field |
| TC16 | API PUT | Replace account details | 200, updated values returned |
| TC17 | API DELETE | Delete account | 200, user can no longer log in (404) |
| TC18 | API Negative | Register with missing fields | 400 |
| TC19 | API Negative | Update account without login | 401 |
| TC20 | API Negative | Login with unknown user | 404 |

TC12 logs in, copies the `PHPSESSID` cookie into a second browser context, checks that the second context is logged in, logs out in the first one and then checks that the second context is sent back to the login page.

## Setup

Requirements: Node.js (LTS), Java 8+ (for Allure command line), Docker Desktop (for container runs).

```
npm install
npx playwright install chromium
npm install -g allure-commandline --save-dev
```

## Running Tests

| Command | Purpose |
|---|---|
| `npx playwright test` | Run all 20 tests |
| `npm run test:ui` | Run only the 12 UI tests |
| `npm run test:api` | Run only the 8 API tests |
| `npx playwright test tests/login.spec.js --headed` | Run one file with the browser visible |
| `npx playwright show-report` | Open Playwright HTML report |

## Allure Report

```
npx playwright test
allure generate allure-results --clean -o allure-report
allure open allure-report
```

## Running in Docker

```
docker build -t playwright-tests .
docker run --name playwright-run playwright-tests
docker cp playwright-run:/app/allure-results ./allure-results
docker cp playwright-run:/app/screenshots ./screenshots
docker cp playwright-run:/app/logs ./logs
docker rm playwright-run
```

The image tag in the `Dockerfile` (`v1.65.1-jammy`) must match the `@playwright/test` version in `package.json`.

## Jenkins Pipeline

The `Jenkinsfile` is a declarative pipeline for a Windows Jenkins agent (uses `bat`), based on the Freestyle batch script from Part 08.

Stages:
1. Checkout - pulls the code from GitHub
2. Clean Old Results - removes result folders from the previous build
3. Build Docker Image - `docker build`
4. Run UI and API Tests - `docker run` with `CI=true` (2 workers)
5. Copy Results From Container - `docker cp` of allure-results, playwright-report, screenshots and logs

Post actions (always run): publish Allure report, publish Playwright HTML report, archive screenshots and logs, remove the container, and mark the build FAILURE if any test failed.

Triggers: GitHub push webhook and a nightly schedule (`H 2 * * *`).

Jenkins setup:
1. Install Jenkins LTS (Windows .msi). Jenkins 2.580 needs Java 21 or 25, so install a JDK 21 (e.g. Eclipse Temurin 21) and select it in the installer.
2. Plugins: Git, GitHub, NodeJS, HTML Publisher (Part 08) plus Pipeline and Allure.
3. Manage Jenkins -> Tools -> Allure Commandline -> Add, name `allure`, tick "Install automatically" (version 2.46.2).
4. Docker Desktop is installed per user, so the Jenkins service cannot see it on PATH. Manage Jenkins -> System -> Global properties -> Environment variables: `PATH+DOCKER` = `C:\Users\<user>\AppData\Local\Programs\DockerDesktop\resources\bin`.
5. New Item -> Pipeline -> Definition: "Pipeline script from SCM" -> Git -> `https://github.com/Azain422/Software-Testing-Project.git` -> branch `*/main` -> Script Path `Jenkinsfile`. The repository is public, so no credential is needed (for a private repo add a GitHub token as in Part 08, section 6.5).
6. Run "Build Now" once so Jenkins reads the `triggers` block from the Jenkinsfile.
7. For builds on every push, run ngrok and point the GitHub webhook to `<ngrok url>/github-webhook/` (Part 08, Part 7).
8. Docker Desktop must be running on the Jenkins machine.

## Known Issues

- The Booked Itinerary page can take over a minute to fully load because the shared test account has thousands of bookings. TC10 does not wait for the full page: it opens the page with `waitUntil: 'commit'` and only waits for the first Cancel button, which shows up within a few seconds. Full page screenshots are skipped for pages taller than 5000px for the same reason.
- The Change Password page has the wrong page title ("Adactin.com - Search Hotel"), so TC07 checks the page heading instead of the title.
- The application and API are public demo sites shared with other students, so a slow response can occasionally fail a test. Every run retries a failed test once (`retries: 1`).
