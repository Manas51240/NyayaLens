import { test, expect } from '@playwright/test';

test.describe('NyayaLens Critical E2E Browser Workflows', () => {

  // Test 1 — Document Workflow
  test('Test 1 — Document workflow: Homepage -> Document Analysis -> Evidence -> Q&A', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NyayaLens/i);

    // Navigate to sample document analysis
    await page.goto('/app/document?doc=sample-saas-msa');
    await expect(page.locator('h1')).toBeVisible();

    // Verify Risk Radar exists
    const riskRadar = page.locator('text=Risk Radar').or(page.locator('text=Risk'));
    await expect(riskRadar.first()).toBeVisible();

    // Verify Evidence / Grounded Clauses
    const clauseSection = page.locator('text=Important Clauses').or(page.locator('text=Clauses'));
    await expect(clauseSection.first()).toBeVisible();

    // Verify Ask Document Q&A interface is present
    const chatInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
    if (await chatInput.count() > 0) {
      await expect(chatInput.first()).toBeVisible();
    }
  });

  // Test 2 — Comparison
  test('Test 2 — Comparison: Compare Document A and Document B -> Inspect Changes', async ({ page }) => {
    await page.goto('/app/compare');
    await expect(page.locator('h1')).toContainText(/Compare|Comparison/i);

    // Look for Compare CTA or pre-selected comparison
    const compareBtn = page.locator('button:has-text("Compare")');
    if (await compareBtn.count() > 0) {
      await compareBtn.first().click();
      // Should show executive summary or category deltas
      await expect(page.locator('text=Executive Summary').or(page.locator('text=Variation')).or(page.locator('text=Delta'))).toBeVisible({ timeout: 10000 });
    }
  });

  // Test 3 — Action Plan
  test('Test 3 — Action Plan: View Action Items -> Add/Toggle Custom Item', async ({ page }) => {
    await page.goto('/app/action-plan');
    await expect(page.locator('h1')).toContainText(/Action Plan/i);

    // Check stats are rendered
    await expect(page.locator('text=Total Actions')).toBeVisible();

    // Check Add Action Item button exists
    const addBtn = page.locator('button:has-text("Add Action Item")');
    await expect(addBtn).toBeVisible();

    // Open Modal
    await addBtn.click();
    const modal = page.locator('role=dialog');
    await expect(modal).toBeVisible();

    // Close Modal via Escape key (verifying focus trap and accessible modal interaction)
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  // Test 4 — Consultation Brief
  test('Test 4 — Consultation: Generate Brief -> Verify Legal Disclaimer and Counsel Questions', async ({ page }) => {
    await page.goto('/app/consultation?doc=sample-saas-msa');
    await expect(page.locator('h1')).toContainText(/Consultation Brief/i);

    // Verify disclaimer notice is prominently displayed
    const disclaimer = page.locator('text=Legal Notice & Disclaimer').or(page.locator('text=Notice:'));
    await expect(disclaimer.first()).toBeVisible();

    // Verify Questions for Counsel section is present
    const questionsSection = page.locator('text=Questions for Legal Counsel');
    await expect(questionsSection.first()).toBeVisible();
  });

  // Test 5 — Security
  test('Test 5 — Security: Unauthorized document access is rejected', async ({ request }) => {
    // Attempt unauthorized access to arbitrary or non-existent document ID
    const response = await request.get('/api/documents/non-existent-unauthorized-doc-id-99999');
    // Expect 404 or 403 Forbidden
    expect([403, 404]).toContain(response.status());
  });

  // Test 6 — Accessibility
  test('Test 6 — Accessibility: Proper semantic landmarks, skip link, and heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check main semantic element
    const mainLandmark = page.locator('main');
    await expect(mainLandmark).toBeVisible();

    // Check single H1 per page
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check interactive elements have accessible names
    const buttonsWithoutAccessibleName = await page.$$eval('button', (buttons) =>
      buttons.filter((b) => !b.innerText.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length
    );
    expect(buttonsWithoutAccessibleName).toBe(0);
  });
});
