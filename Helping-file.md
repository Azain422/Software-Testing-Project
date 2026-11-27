# Execution Guide

All commands are run in PowerShell (VS Code terminal) inside the `Project` folder. Run them in this order.

## 0. Before you start

- Open Docker Desktop and wait until it says "Engine running" (needed for steps 5 and 7).
- If `npx` or `docker` is "not recognized", close and reopen VS Code, or run:

```
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

## 1. Install

`node_modules` and all report folders are not kept in the project, they are created by these commands.

```
npm install
npx playwright install chromium
npm install -g allure-commandline --save-dev
```

## 2. Run tests

| Command                                      | What it runs                                  |
| -------------------------------------------- | --------------------------------------------- |
| `npx playwright test`                      | All 20 tests                                  |
| `npm run test:ui`                          | 12 UI tests                                   |
| `npm run test:api`                         | 8 API tests                                   |
| `npx playwright test -g "TC08"`            | One test by ID                                |
| `npx playwright test -g "TC08" --headed`   | One test with the browser visible             |
| `npx playwright test tests/login.spec.js`  | One file                                      |
| `npx playwright test --headed --workers=1` | All tests one by one with the browser visible |

## 3. Run each test case with the browser visible

| ID   | Test                                    | Command                                    |
| ---- | --------------------------------------- | ------------------------------------------ |
| TC01 | Login with valid user                   | `npx playwright test -g "TC01" --headed` |
| TC02 | Login with invalid password             | `npx playwright test -g "TC02" --headed` |
| TC03 | Login with empty fields                 | `npx playwright test -g "TC03" --headed` |
| TC04 | SQL injection `' OR '1'='1`           | `npx playwright test -g "TC04" --headed` |
| TC05 | SQL injection `admin'--`              | `npx playwright test -g "TC05" --headed` |
| TC06 | SQL injection `' UNION SELECT NULL--` | `npx playwright test -g "TC06" --headed` |
| TC07 | Navigate pages using the menu           | `npx playwright test -g "TC07" --headed` |
| TC08 | Search hotel with valid details         | `npx playwright test -g "TC08" --headed` |
| TC09 | Search without location                 | `npx playwright test -g "TC09" --headed` |
| TC10 | Cancel booking confirm popup            | `npx playwright test -g "TC10" --headed` |
| TC11 | Logout                                  | `npx playwright test -g "TC11" --headed` |
| TC12 | Logout should end a stolen session      | `npx playwright test -g "TC12" --headed` |
| TC13 | API GET all users                       | `npx playwright test -g "TC13"`          |
| TC14 | API POST login                          | `npx playwright test -g "TC14"`          |
| TC15 | API POST register                       | `npx playwright test -g "TC15"`          |
| TC16 | API PUT replace account                 | `npx playwright test -g "TC16"`          |
| TC17 | API DELETE account                      | `npx playwright test -g "TC17"`          |
| TC18 | API register with missing fields (400)  | `npx playwright test -g "TC18"`          |
| TC19 | API update without login (401)          | `npx playwright test -g "TC19"`          |
| TC20 | API login with unknown user (404)       | `npx playwright test -g "TC20"`          |

Notes:

- API tests (TC13-TC20) do not open a browser, so `--headed` makes no difference for them. Their requests and responses are in the terminal log and the Allure report.
- TC10: the confirm popup is dismissed by the test straight away, so it only flashes on screen. Add `--debug` to step through it slowly: `npx playwright test -g "TC10" --debug`
- TC12 opens a second browser window (the "attacker") during the test.
- Run several at once: `npx playwright test -g "TC01|TC02|TC03" --headed`

## 4. Allure report

Old results stay in `allure-results` until you delete them, so clear it before a run you want to show:

```
Remove-Item -Recurse -Force allure-results
npx playwright test
allure generate allure-results --clean -o allure-report
allure open allure-report
```

`allure open` starts a local server and opens the report in the browser. Screenshots and logs are inside each test under the steps and "After Hooks". A test that fails once and passes on the retry shows as "flaky". The two demo sites are shared, so an occasional 500 from the API or a slow page is normal.

Playwright's own HTML report:

```
npx playwright show-report
```

## 5. Docker

Remove old local results first, otherwise `docker cp` puts them inside the existing folder:

```
Remove-Item -Recurse -Force allure-results, screenshots, logs -ErrorAction SilentlyContinue
docker build -t playwright-tests .
docker run --name playwright-run playwright-tests
docker cp playwright-run:/app/allure-results ./allure-results
docker cp playwright-run:/app/screenshots ./screenshots
docker cp playwright-run:/app/logs ./logs
docker rm playwright-run
allure generate allure-results --clean -o allure-report
allure open allure-report
```

Useful Docker commands:

| Command | Purpose |
| --- | --- |
| `docker images` | List images |
| `docker ps -a` | List containers |
| `docker rm playwright-run` | Remove a leftover container if the name is already in use |
| `docker rmi playwright-tests` | Delete the image |

## 6. Push to GitHub

Repository: https://github.com/Azain422/Software-Testing-Project

```
git status
git add .
git commit -m "Describe what changed"
git push origin main
```

## 7. Jenkins

Jenkins runs as a Windows service on http://localhost:8080 and starts with Windows. Job: `Software-Testing-Project`.

Check or start the service (PowerShell as administrator for start/stop):

```
Get-Service jenkins
Start-Service jenkins
Restart-Service jenkins
```

Run the pipeline:

1. Open http://localhost:8080/job/Software-Testing-Project/
2. Click **Build Now** (or push to GitHub if the webhook is set up, or wait for the nightly run at about 2 AM).
3. Open the build number, then:
   - **Console Output** - full log, ends with `PLAYWRIGHT TESTS PASSED` and `Finished: SUCCESS`
   - **Allure Report** - all 20 tests with screenshots and logs
   - **Playwright HTML Report** - Playwright's own report
   - **Build Artifacts** - archived screenshots and logs

What the pipeline does: checkout from GitHub -> `docker build` -> `docker run` (all 20 tests) -> `docker cp` results out -> publish Allure and HTML reports -> archive screenshots and logs -> `docker rm`.

Build on every push (Part 08, Part 7 - needs an ngrok account):

```
ngrok config add-authtoken YOUR_AUTHTOKEN
ngrok http 8080
```

Then on GitHub: repository -> Settings -> Webhooks -> Add webhook -> Payload URL `https://<ngrok-url>/github-webhook/`, content type `application/json`, "Just the push event". The free ngrok URL changes every restart, so update the webhook each time.

## 8. Clean up generated files

Everything below is recreated by the commands above:

```
Remove-Item -Recurse -Force node_modules, allure-results, allure-report, playwright-report, test-results, screenshots, logs -ErrorAction SilentlyContinue
```

## 9. Where each test lives

| Tests           | Spec file                     | Data file               | Page objects                                       |
| --------------- | ----------------------------- | ----------------------- | -------------------------------------------------- |
| TC01-TC06, TC11 | tests/login.spec.js           | testdata/loginData.json | pages/LoginPage.js                                 |
| TC07-TC09       | tests/searchHotel.spec.js     | testdata/uiData.json    | pages/SearchHotelPage.js, pages/SelectHotelPage.js |
| TC10            | tests/bookedItinerary.spec.js | testdata/uiData.json    | pages/BookedItineraryPage.js                       |
| TC12            | tests/session.spec.js         | testdata/uiData.json    | pages/LoginPage.js, pages/SearchHotelPage.js       |
| TC13-TC20       | tests/api.spec.js             | testdata/apiData.json   | utilities/apiHelper.js                             |

Common methods (login, logout, navigation, waits, screenshot, alert) are in `pages/BasePage.js`.

## 10. Changing test cases

### Change only the input or expected value

Edit the JSON file, no code change. Example - test another location in TC08 (`testdata/uiData.json`):

```json
"validSearch": {
  "location": "Melbourne",
  "hotel": "Hotel Sunshine",
  ...
}
```

### Add one more run to a data-driven test

Add a row to the JSON array. Example - new negative API case (`testdata/apiData.json`, `negativeTests`):

```json
{
  "name": "POST register with existing user",
  "method": "post",
  "endpoint": "/register",
  "payload": { "fullname": "A", "email": "a@example.com", "username": "a", "password": "Password123!" },
  "expectedStatus": 409,
  "expectedMessage": "User already exists"
}
```

This adds a test, so remove one somewhere else to stay at 20.

### Rewrite a test

1. Find its spec file in the table above and search for the ID (e.g. `TC09`).
2. Keep the same pattern: create the page object, put the actions in `test.step`, assert with `expect`.
3. Put any new input or expected text in the JSON file, not in the spec.
4. If you need a new element, add its locator in the page class constructor, e.g. `this.checkOut = page.locator('#datepick_out');`
5. Run only that test: `npx playwright test -g "TC09" --headed`

Example - rewrite TC09 to check the date validation instead of the location error:

`testdata/uiData.json`

```json
"badDateSearch": {
  "location": "Sydney",
  "rooms": "1",
  "adults": "1",
  "checkIn": "13/12/2026",
  "checkOut": "10/12/2026",
  "ExpectedError": "Check-In Date shall be before than Check-Out Date"
}
```

`pages/SearchHotelPage.js` (add in the constructor)

```js
this.checkIn = page.locator('#datepick_in');
this.checkOut = page.locator('#datepick_out');
this.checkInError = page.locator('#checkin_span');
```

`tests/searchHotel.spec.js`

```js
test('TC09 - Search with check-out date before check-in', async ({ page }) => {
  const searchPage = new SearchHotelPage(page);
  const data = uiData.badDateSearch;

  await test.step('Enter wrong dates and search', async () => {
    await searchPage.location.selectOption(data.location);
    await searchPage.checkIn.fill(data.checkIn);
    await searchPage.checkOut.fill(data.checkOut);
    await searchPage.searchButton.click();
  });

  await test.step('Verify date error message', async () => {
    await expect(searchPage.checkInError).toHaveText(data.ExpectedError);
  });
});
```

### Find a locator for a new element

Right click the element in Chrome, Inspect, and use its `id` (`#id`) or class (`.class`). Or record it with:

```
npx playwright codegen https://adactinhotelapp.com/
```

### After any change

Run `npx playwright test`, check that 20 tests pass, then regenerate the Allure report.
