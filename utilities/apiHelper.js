import { test, expect } from '@playwright/test';
import config from './config.js';
import logger from './logger.js';

export async function sendRequest(request, method, endpoint, data) {
  const start = Date.now();
  const response = await request[method](config.apiBaseURL + endpoint, { data });
  const responseTime = Date.now() - start;
  const isJson = (response.headers()['content-type'] || '').includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  logger.info(`${method.toUpperCase()} ${endpoint} -> ${response.status()} in ${responseTime} ms`);
  await test.info().attach(`${method.toUpperCase()} ${endpoint} response`, {
    body: isJson ? JSON.stringify(body, null, 2) : body,
    contentType: isJson ? 'application/json' : 'text/plain',
  });

  return { response, body, responseTime };
}

export function checkSchema(object, schema) {
  for (const key in schema) {
    expect(object, `field "${key}" missing in response`).toHaveProperty(key);
    expect(typeof object[key], `field "${key}" has wrong type`).toBe(schema[key]);
  }
}
