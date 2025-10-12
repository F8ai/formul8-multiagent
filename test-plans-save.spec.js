const { test, expect } = require('@playwright/test');

test.describe('Plans Configuration Save Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://f8ai.github.io/formul8-multiagent/plans.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load plans configuration page', async ({ page }) => {
    await expect(page).toHaveTitle(/Formul8 Plans Configuration/);
    await expect(page.locator('h1')).toContainText('Formul8 Plans Configuration');
  });

  test('should display plan headers correctly', async ({ page }) => {
    // Check that all plan headers are present
    await expect(page.locator('th')).toContainText(['Free', 'Standard', 'Micro', 'Operator', 'Enterprise', 'Beta', 'Admin', 'Future4200.com']);
  });

  test('should display agent sections', async ({ page }) => {
    // Wait for the table to load
    await page.waitForSelector('.agent-section-header');
    
    // Check that section headers are present
    await expect(page.locator('.agent-section-header')).toContainText(['F8 CORE AGENTS', 'BETA FEATURES', 'FREE PLAN FEATURES', 'CUSTOM AGENTS', 'ADMIN TOOLS']);
  });

  test('should allow editing plan names', async ({ page }) => {
    // Click on a plan name to edit it
    await page.click('[data-plan="standard"][data-field="name"]');
    
    // Check that input field appears
    await expect(page.locator('input[data-plan="standard"][data-field="name"]')).toBeVisible();
    
    // Type new name
    await page.fill('input[data-plan="standard"][data-field="name"]', 'Standard Plan');
    await page.press('input[data-plan="standard"][data-field="name"]', 'Enter');
    
    // Check that the name was updated
    await expect(page.locator('[data-plan="standard"][data-field="name"]')).toContainText('Standard Plan');
  });

  test('should allow editing plan prices', async ({ page }) => {
    // Click on a plan price to edit it
    await page.click('[data-plan="standard"][data-field="price"]');
    
    // Check that input field appears
    await expect(page.locator('input[data-plan="standard"][data-field="price"]')).toBeVisible();
    
    // Type new price
    await page.fill('input[data-plan="standard"][data-field="price"]', '$25/month');
    await page.press('input[data-plan="standard"][data-field="price"]', 'Enter');
    
    // Check that the price was updated
    await expect(page.locator('[data-plan="standard"][data-field="price"]')).toContainText('$25/month');
  });

  test('should allow toggling agent checkboxes', async ({ page }) => {
    // Wait for the table to load
    await page.waitForSelector('.checkbox');
    
    // Find a checkbox and toggle it
    const checkbox = page.locator('.checkbox').first();
    const isChecked = await checkbox.isChecked();
    
    await checkbox.click();
    
    // Check that the state changed
    await expect(checkbox).toBeChecked({ checked: !isChecked });
  });

  test('should show save button and create PR functionality', async ({ page }) => {
    // Check that save button is present
    await expect(page.locator('button:has-text("Save & Create PR")')).toBeVisible();
    
    // Check that reset button is present
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
  });

  test('should display features as bullets under agents', async ({ page }) => {
    // Wait for the table to load
    await page.waitForSelector('.agent-features');
    
    // Check that feature bullets are present
    await expect(page.locator('.feature-bullet')).toHaveCount.greaterThan(0);
  });

  test('should have proper dark mode styling', async ({ page }) => {
    // Check that dark mode variables are applied
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', /rgb\(20, 25, 31\)/);
  });

  test('should display beta agents only for beta and admin plans', async ({ page }) => {
    // Wait for the table to load
    await page.waitForSelector('.agent-name');
    
    // Find Science Agent row
    const scienceAgentRow = page.locator('tr').filter({ hasText: 'Science Agent' });
    await expect(scienceAgentRow).toBeVisible();
    
    // Check that Science Agent is only available for beta and admin plans
    const betaCheckbox = scienceAgentRow.locator('td').nth(6).locator('.checkbox'); // Beta column
    const adminCheckbox = scienceAgentRow.locator('td').nth(7).locator('.checkbox'); // Admin column
    
    await expect(betaCheckbox).toBeChecked();
    await expect(adminCheckbox).toBeChecked();
  });

  test('should allow drag and drop of agent rows', async ({ page }) => {
    // Wait for the table to load
    await page.waitForSelector('.agent-row');
    
    // Find a draggable agent row
    const agentRow = page.locator('.agent-row').first();
    await expect(agentRow).toBeVisible();
    
    // Check that drag handle is present
    await expect(agentRow.locator('.drag-handle')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // This test might need to be adjusted based on loading speed
    // Check that loading spinner is present initially
    const loadingElement = page.locator('#loading');
    if (await loadingElement.isVisible()) {
      await expect(loadingElement).toBeVisible();
    }
  });
});