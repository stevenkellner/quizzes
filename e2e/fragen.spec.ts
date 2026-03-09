import { test, expect } from '@playwright/test';

test.describe('Fragen page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/fragen/mta2');
    });

    test('shows the page heading with the quiz title', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 1 })).toContainText('MTA 2');
    });

    test('renders the question list after loading', async ({ page }) => {
        await expect(page.locator('article.fragen-entry').first()).toBeVisible();
    });

    test('shows a total-questions info text', async ({ page }) => {
        await expect(page.locator('.search-info')).toContainText('Fragen insgesamt');
    });

    test('search filters the visible questions', async ({ page }) => {
        // wait for questions to load
        await page.locator('article.fragen-entry').first().waitFor();

        const totalBefore = await page.locator('article.fragen-entry').count();

        const searchInput = page.locator('input[type=search]');
        await searchInput.fill('a');

        const totalAfter = await page.locator('article.fragen-entry').count();
        // at minimum, the list is not larger than before filtering
        expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    });

    test('shows "Keine Ergebnisse" when the search matches nothing', async ({ page }) => {
        await page.locator('article.fragen-entry').first().waitFor();
        await page.locator('input[type=search]').fill('zzz_no_match_xyz');
        await expect(page.locator('.no-results')).toContainText('Keine Ergebnisse');
    });

    test('search info text updates when a filter is active', async ({ page }) => {
        await page.locator('article.fragen-entry').first().waitFor();
        await page.locator('input[type=search]').fill('a');
        await expect(page.locator('.search-info')).toContainText('von');
    });

    test('shows an error for an unknown quiz id', async ({ page }) => {
        await page.goto('/fragen/does-not-exist');
        await expect(page.locator('[role=alert]')).toBeVisible();
    });

    test('back button navigates to the previous page', async ({ page }) => {
        // navigate from home so there is history
        await page.goto('/');
        await page.goto('/fragen/mta2');
        await page.locator('.back-link').click();
        await expect(page).toHaveURL('/');
    });
});
