import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('shows the main heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Prüfungsvorbereitung' })).toBeVisible();
    });

    test('renders a quiz entry for each active quiz', async ({ page }) => {
        await expect(page.locator('.quiz-link')).toHaveCount(1);
        await expect(page.locator('.quiz-link').first()).toContainText('MTA 2');
    });

    test('renders a Fragenübersicht link for each quiz', async ({ page }) => {
        await expect(page.locator('.quiz-fragen-link')).toHaveCount(1);
        await expect(page.locator('.quiz-fragen-link').first()).toContainText('Fragenübersicht');
    });

    test('clicking a quiz link navigates to the quiz page', async ({ page }) => {
        await page.locator('.quiz-link').first().click();
        await expect(page).toHaveURL(/\/quiz\/mta2/);
    });

    test('clicking Fragenübersicht navigates to the fragen page', async ({ page }) => {
        await page.locator('.quiz-fragen-link').first().click();
        await expect(page).toHaveURL(/\/fragen\/mta2/);
    });

    test('unknown routes redirect to home', async ({ page }) => {
        await page.goto('/does-not-exist');
        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { name: 'Prüfungsvorbereitung' })).toBeVisible();
    });
});
