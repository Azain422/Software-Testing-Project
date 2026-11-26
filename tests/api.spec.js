import { test, expect } from '@playwright/test';
import apiData from '../testdata/apiData.json';
import { sendRequest, checkSchema } from '../utilities/apiHelper.js';
import logger from '../utilities/logger.js';

const api = apiData.endpoints;

// API rejects duplicate users (409) so every test makes its own
function newUser() {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = apiData.newUser.usernamePrefix + id;
  return {
    fullname: apiData.newUser.fullname,
    email: username + apiData.newUser.emailDomain,
    username: username,
    password: apiData.newUser.password,
  };
}

async function registerAndLogin(request, user) {
  const register = await sendRequest(request, 'post', api.register, user);
  expect(register.response.status()).toBe(201);
  const login = await sendRequest(request, 'post', api.login, user);
  expect(login.response.status()).toBe(200);
}

test.describe('User API @api', () => {
  test.beforeAll(async () => {
    logger.info('API suite started');
  });

  test.beforeEach(async ({}, testInfo) => {
    logger.startTest(testInfo.title);
  });

  test.afterEach(async ({}, testInfo) => {
    logger.info(`Test finished: ${testInfo.title} - ${testInfo.status} (${testInfo.duration} ms)`);
    if (testInfo.error) {
      logger.error(testInfo.error.message);
    }
    await logger.attachLogs(testInfo);
  });

  test.afterAll(async () => {
    logger.info('API suite finished');
  });

  test('TC13 - GET all users', async ({ request }) => {
    const { response, body, responseTime } = await sendRequest(request, 'get', api.allUsers);

    await test.step('Validate status, headers and response time', async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(responseTime).toBeLessThan(apiData.maxListResponseTime);
    });

    await test.step('Validate response body and schema', async () => {
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      checkSchema(body.data[0], apiData.userSchema);
      expect(body.data[0]).not.toHaveProperty('password');
    });
  });

  test('TC14 - POST login with valid user', async ({ request }) => {
    const user = newUser();
    await sendRequest(request, 'post', api.register, user);

    const { response, body, responseTime } = await sendRequest(request, 'post', api.login, user);

    await test.step('Validate status, headers and response time', async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(response.headers()['set-cookie']).toContain('accessToken=');
      expect(responseTime).toBeLessThan(apiData.maxResponseTime);
    });

    await test.step('Validate response body and schema', async () => {
      expect(body.message).toBe(apiData.expected.loginMsg);
      expect(typeof body.data.accessToken).toBe('string');
      checkSchema(body.data.user, apiData.userSchema);
      expect(body.data.user.username).toBe(user.username);
    });

    await sendRequest(request, 'delete', api.delete);
  });

  test('TC15 - POST register new user', async ({ request }) => {
    const user = newUser();

    const { response, body, responseTime } = await sendRequest(request, 'post', api.register, user);

    await test.step('Validate status, headers and response time', async () => {
      expect(response.status()).toBe(201);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(responseTime).toBeLessThan(apiData.maxResponseTime);
    });

    await test.step('Validate response body and schema', async () => {
      expect(body.success).toBe(true);
      expect(body.message).toBe(apiData.expected.registerMsg);
      checkSchema(body.data, apiData.userSchema);
      expect(body.data.username).toBe(user.username);
      expect(body.data.email).toBe(user.email);
      expect(body.data).not.toHaveProperty('password');
    });

    await test.step('Clean up created user', async () => {
      await sendRequest(request, 'post', api.login, user);
      await sendRequest(request, 'delete', api.delete);
    });
  });

  test('TC16 - PUT replace account details', async ({ request }) => {
    const user = newUser();
    const updated = {
      fullname: apiData.updatedUser.fullname,
      username: user.username.replace(apiData.newUser.usernamePrefix, apiData.updatedUser.usernamePrefix),
    };
    updated.email = updated.username + apiData.newUser.emailDomain;

    await registerAndLogin(request, user);

    const { response, body, responseTime } = await sendRequest(request, 'put', api.replace, updated);

    await test.step('Validate status, headers and response time', async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(responseTime).toBeLessThan(apiData.maxResponseTime);
    });

    await test.step('Validate updated values in response', async () => {
      expect(body.message).toBe(apiData.expected.replaceMsg);
      checkSchema(body.data, apiData.userSchema);
      expect(body.data.fullname).toBe(updated.fullname);
      expect(body.data.username).toBe(updated.username);
      expect(body.data.email).toBe(updated.email);
    });

    await sendRequest(request, 'delete', api.delete);
  });

  test('TC17 - DELETE account', async ({ request }) => {
    const user = newUser();
    await registerAndLogin(request, user);

    const { response, body, responseTime } = await sendRequest(request, 'delete', api.delete);

    await test.step('Validate status, headers and response time', async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(responseTime).toBeLessThan(apiData.maxResponseTime);
      expect(body.message).toBe(apiData.expected.deleteMsg);
    });

    await test.step('Deleted user can no longer login', async () => {
      const login = await sendRequest(request, 'post', api.login, user);
      expect(login.response.status()).toBe(404);
      expect(login.body.message).toBe(apiData.expected.userNotFoundMsg);
    });
  });

  apiData.negativeTests.forEach((data, index) => {
    test(`TC${index + 18} - ${data.name}`, async ({ request }) => {
      const { response, body, responseTime } = await sendRequest(request, data.method, data.endpoint, data.payload);

      expect(response.status()).toBe(data.expectedStatus);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(responseTime).toBeLessThan(apiData.maxResponseTime);
      expect(body.success).toBe(false);
      expect(body.message).toBe(data.expectedMessage);
    });
  });
});
