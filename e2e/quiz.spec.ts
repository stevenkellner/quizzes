import { test, expect } from '@playwright/test';

test.describe('Quiz page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/quiz/mta2');
    });

    test('shows the quiz title after loading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'MTA 2 Quiz' })).toBeVisible();
    });

    test('shows the start view with a count input', async ({ page }) => {
        await expect(page.locator('input[type=number]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Starten' })).toBeVisible();
    });

    test('count input defaults to the configured defaultCount', async ({ page }) => {
        const input = page.locator('input[type=number]');
        await expect(input).toHaveValue('15');
    });

    test('shows a validation error for an invalid count', async ({ page }) => {
        await page.locator('input[type=number]').fill('999');
        await page.getByRole('button', { name: 'Starten' }).click();
        await expect(page.locator('.status')).toContainText('zwischen 1 und');
    });

    test('starting the quiz navigates to the question view', async ({ page }) => {
        await page.locator('input[type=number]').fill('1');
        await page.getByRole('button', { name: 'Starten' }).click();
        await expect(page.locator('app-quiz-question')).toBeVisible();
    });

    test('question view shows a question text', async ({ page }) => {
        await page.locator('input[type=number]').fill('1');
        await page.getByRole('button', { name: 'Starten' }).click();
        await expect(page.locator('.question-text').first()).not.toBeEmpty();
    });

    test('selecting an answer and confirming reveals the result', async ({ page }) => {
        await page.locator('input[type=number]').fill('1');
        await page.getByRole('button', { name: 'Starten' }).click();

        // select the first answer
        await page.locator('label.answer-item').first().click();
        await page.getByRole('button', { name: 'Antwort bestätigen' }).click();

        // result indicator appears (Richtig or Falsch)
        await expect(page.locator('app-quiz-question .status')).toBeVisible();
        await expect(page.locator('app-quiz-question .status')).not.toBeEmpty();
    });

    test('completing one question shows the Weiter button', async ({ page }) => {
        await page.locator('input[type=number]').fill('1');
        await page.getByRole('button', { name: 'Starten' }).click();
        await page.locator('label.answer-item').first().click();
        await page.getByRole('button', { name: 'Antwort bestätigen' }).click();

        // with 1 question, after confirming the last question the button says "Quiz beenden"
        await expect(page.getByRole('button', { name: /Quiz beenden|Nächste Frage/ })).toBeVisible();
    });

    test('finishing a single-question quiz shows the finished view', async ({ page }) => {
        await page.locator('input[type=number]').fill('1');
        await page.getByRole('button', { name: 'Starten' }).click();
        await page.locator('label.answer-item').first().click();
        await page.getByRole('button', { name: 'Antwort bestätigen' }).click();
        await page.getByRole('button', { name: 'Quiz beenden' }).click();

        await expect(page.locator('app-quiz-finished')).toBeVisible();
    });

    test('back link on the start view navigates to home', async ({ page }) => {
        await page.getByRole('link', { name: '← Zur Auswahl' }).click();
        await expect(page).toHaveURL('/');
    });

    test('shows an error for an unknown quiz id', async ({ page }) => {
        await page.goto('/quiz/does-not-exist');
        await expect(page.locator('[role=alert]')).toBeVisible();
    });

    test('"Fragen manuell auswählen" opens the select view', async ({ page }) => {
        await page.getByRole('button', { name: /manuell auswählen/i }).click();
        await expect(page.locator('app-quiz-select')).toBeVisible();
    });

    test('back button in select view returns to the start view', async ({ page }) => {
        await page.getByRole('button', { name: /manuell auswählen/i }).click();
        await expect(page.locator('app-quiz-select')).toBeVisible();
        await page.getByRole('button', { name: /zurück/i }).click();
        await expect(page.locator('app-quiz-start')).toBeVisible();
    });
});
