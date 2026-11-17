import { NestFactory } from '@nestjs/core';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { SystemBootstrapModule } from './system-bootstrap.module.js';
import { SystemBootstrapService } from './system-bootstrap.service.js';

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY) {
    return Promise.reject(
      new Error('Password input requires an interactive terminal.'),
    );
  }

  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();

    let value = '';
    let settled = false;

    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };

    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          if (!settled) {
            settled = true;
            cleanup();
            reject(new Error('Password entry cancelled.'));
          }
          return;
        }

        if (character === '\r' || character === '\n') {
          if (!settled) {
            settled = true;
            cleanup();
            resolve(value);
          }
          return;
        }

        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }

        value += character;
      }
    };

    stdin.on('data', onData);
  });
}

function isValidPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    password.length <= 128 &&
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?=\S+$).+$/.test(
      password,
    )
  );
}

async function main(): Promise<void> {
  const firstName = getArgument('--first-name')?.trim();
  const lastName = getArgument('--last-name')?.trim();
  const email = getArgument('--email')?.trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    console.error(
      'Usage: bootstrap:admin --first-name "First" --last-name "Last" --email "admin@example.com"',
    );
    process.exitCode = 1;
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('A valid email address is required.');
    process.exitCode = 1;
    return;
  }

  if (!stdin.isTTY) {
    console.error(
      'Run this command from an interactive terminal to enter the password securely.',
    );
    process.exitCode = 1;
    return;
  }

  console.log('\nInitial system administrator');
  console.log('--------------------------------');
  console.log(`Name:  ${firstName} ${lastName}`);
  console.log(`Email: ${email}`);
  console.log('Role:  SYSTEM_ADMIN');
  console.log('Scope: Platform-wide');
  console.log('Status after bootstrap: ACTIVE');
  console.log('--------------------------------');

  const readline = createInterface({ input: stdin, output: stdout });

  try {
    const answer = await readline.question(
      'Proceed with initial administrator bootstrap? Type YES to continue: ',
    );

    if (answer.trim() !== 'YES') {
      console.log('Bootstrap cancelled. No changes made.');
      return;
    }
  } finally {
    readline.close();
  }

  const password = await readHidden('Enter initial administrator password: ');

  if (!isValidPassword(password)) {
    throw new Error(
      'Password must be 12-128 characters and contain uppercase, lowercase, number, and special character, with no spaces.',
    );
  }

  const confirmation = await readHidden('Confirm password: ');

  if (password !== confirmation) {
    throw new Error('Passwords do not match. Bootstrap was not started.');
  }

  const app = await NestFactory.createApplicationContext(
    SystemBootstrapModule,
    { logger: ['error', 'warn', 'log'] },
  );

  try {
    const service = app.get(SystemBootstrapService);

    const result = await service.bootstrapInitialAdmin({
      firstName,
      lastName,
      email,
      password,
    });

    console.log('\n' + result.message);
    console.log('Account:', result.user);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Bootstrap failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
