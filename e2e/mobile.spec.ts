import { expect, test } from './fixtures/app';

test.use({ viewport: { width: 390, height: 844 } });

test('shows one Areas pane at a time on phones and keeps focus in the visible pane', async ({ app, page }) => {
  await app.open();
  await app.goTo('Áreas');

  // Without Areas, the empty state is the useful pane.
  await expect(page.getByRole('heading', { name: 'Comece por uma área' })).toBeVisible();
  await page.getByRole('button', { name: 'Usar sugestões' }).click();
  await app.confirmDialog('Usar áreas sugeridas?').getByRole('button', { name: 'Criar áreas' }).click();

  await expect(app.areaButton('Estudos')).toBeVisible();
  await app.areaButton('Estudos').click();
  await expect(app.areaList).toBeHidden();
  await expect(page.getByRole('heading', { level: 2, name: 'Estudos' })).toBeFocused();

  await page.getByRole('button', { name: 'Voltar para Áreas' }).click();
  await expect(app.areaList).toBeVisible();
  await expect(app.areaButton('Estudos')).toBeFocused();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('uses the icon rail for app navigation on phones', async ({ app, page }) => {
  await app.open();
  const sidebar = page.locator('#sidebar-navigation');
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBeLessThan(100);
  await expect(page.getByRole('tab', { name: 'Áreas' })).toBeVisible();
});
