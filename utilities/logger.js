import fs from 'fs';
import path from 'path';
import config from './config.js';

const logFile = path.join(config.logDir, 'execution.log');

if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

let testLogs = [];

function write(level, message) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
  testLogs.push(line);
}

const logger = {
  info(message) {
    write('INFO', message);
  },

  error(message) {
    write('ERROR', message);
  },

  startTest(title) {
    testLogs = [];
    write('INFO', `Test started: ${title}`);
  },

  async attachLogs(testInfo) {
    await testInfo.attach('Execution Log', {
      body: testLogs.join('\n'),
      contentType: 'text/plain',
    });
  },
};

export default logger;
