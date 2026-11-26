# Official Playwright image, tag must match @playwright/test version in package.json
FROM mcr.microsoft.com/playwright:v1.65.1-jammy

WORKDIR /app

# copy manifest files first so the npm ci layer is cached between builds
COPY package*.json ./
RUN npm ci

COPY . .

# runs UI and API tests, results go to allure-results, playwright-report, screenshots and logs
CMD ["npx", "playwright", "test"]
