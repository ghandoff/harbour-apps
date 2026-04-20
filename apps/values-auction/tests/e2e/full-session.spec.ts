import { test, expect } from '@playwright/test';

test.describe('values auction full session smoke', () => {
  test('facilitator + participant flow', async ({ browser }) => {
    const base = 'http://localhost:5173';
    const ctxFac = await browser.newContext();
    const ctxP1 = await browser.newContext();
    const fac = await ctxFac.newPage();
    const p1 = await ctxP1.newPage();

    await fac.goto(`${base}/#/facilitate?code=E2E`);
    await p1.goto(`${base}/#/join?code=E2E`);

    await p1.getByPlaceholder('your name').fill('alex');
    await p1.getByRole('button', { name: /join/i }).click();

    // facilitator advances to grouping
    await fac.getByRole('button', { name: /next act/i }).click();

    // participant picks an archetype
    await p1.getByRole('radio').first().click();

    // facilitator auto-assigns then advances through scene, strategy, to auction
    await fac.getByRole('button', { name: /auto-assign teams/i }).click().catch(() => undefined);
    await fac.getByRole('button', { name: /next act/i }).click(); // scene
    await fac.getByRole('button', { name: /next act/i }).click(); // strategy
    await fac.getByRole('button', { name: /next act/i }).click(); // auction

    // facilitator starts the first auction
    await fac.getByRole('button', { name: /radical transparency/i }).first().click().catch(() => undefined);

    // participant should see a bid button
    await expect(p1.getByRole('button', { name: /bid/i })).toBeVisible({ timeout: 3000 });

    await ctxFac.close();
    await ctxP1.close();
  });
});
