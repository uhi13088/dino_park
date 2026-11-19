import { test as base } from '@playwright/test';
import { PrismaClient } from '../apps/server/node_modules/@prisma/client';

const configuredUrl =
  process.env.DINO_PARK_E2E_DATABASE_URL ?? process.env.DINO_FIRST_HYBRID_E2E_DATABASE_URL;
const configuredPort =
  process.env.DINO_PARK_E2E_API_PORT ?? process.env.DINO_FIRST_HYBRID_E2E_API_PORT;
const apiPort = Number(configuredPort ?? 4400);
const loopbackHosts = ['localhost', '127.0.0.1'];
const databaseSetupError =
  'DINO_PARK_E2E_DATABASE_URL must point to a local dino_park_*_qa database';

function getIsolatedDatabaseUrl(value: string | undefined) {
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(databaseSetupError);
  }
  if (
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    !loopbackHosts.includes(url.hostname) ||
    !/^\/dino_park_\w+_qa$/.test(url.pathname)
  ) {
    throw new Error(databaseSetupError);
  }
  return url.href;
}

const databaseUrl = getIsolatedDatabaseUrl(configuredUrl);
if (databaseUrl && (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535)) {
  throw new Error('DINO_PARK_E2E_API_PORT must be a valid local API port');
}
const apiOrigin = `http://127.0.0.1:${apiPort}`;

export const isIsolatedParkConfigured = !!databaseUrl;
export const isolatedParkSetup = 'Set DINO_PARK_E2E_DATABASE_URL for isolated park fixtures.';

export const test = base.extend<Record<never, never>, { database: PrismaClient }>({
  database: [
    async ({}, use) => {
      if (!databaseUrl) throw new Error(isolatedParkSetup);
      const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      try {
        await use(database);
      } finally {
        await database.$disconnect();
      }
    },
    { scope: 'worker' },
  ],
  request: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: apiOrigin });
    try {
      await use(request);
    } finally {
      await request.dispose();
    }
  },
  page: async ({ page }, use) => {
    // A reused frontend server may proxy to a different backend. Use the same QA API as setup.
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const { pathname, search } = new URL(route.request().url());
        const url = new URL(pathname + search, apiOrigin);
        await route.fulfill({ response: await route.fetch({ url: url.href }) });
      },
    );
    await use(page);
  },
});
