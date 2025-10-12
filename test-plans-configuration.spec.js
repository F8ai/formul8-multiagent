const { test, expect } = require('@playwright/test');

test.describe('Plans Configuration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://f8ai.github.io/formul8-multiagent/plans.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page successfully', async ({ page }) => {
    await expect(page).toHaveTitle('Formul8 Plans Configuration');
    await expect(page.locator('h1')).toContainText('Formul8 Plans Configuration');
  });

  test('should display all plan headers', async ({ page }) => {
    const planHeaders = page.locator('.plan-header');
    await expect(planHeaders).toHaveCount(4);
    
    const planNames = await planHeaders.allTextContents();
    expect(planNames).toContain('Standard');
    expect(planNames).toContain('Micro');
    expect(planNames).toContain('Operator');
    expect(planNames).toContain('Enterprise');
  });

  test('should display all plan prices', async ({ page }) => {
    const planPrices = page.locator('.plan-price');
    await expect(planPrices).toHaveCount(4);
    
    const prices = await planPrices.allTextContents();
    expect(prices).toContain('$20/month');
    expect(prices).toContain('$99/month');
    expect(prices).toContain('$499/month');
    expect(prices).toContain('Custom');
  });

  test('should display all agents in the table', async ({ page }) => {
    const agentRows = page.locator('tbody tr');
    await expect(agentRows).toHaveCount(14); // 14 agents total
    
    const agentNames = await page.locator('.agent-name').allTextContents();
    expect(agentNames).toContain('F8 Multi-Agent');
    expect(agentNames).toContain('Compliance Agent');
    expect(agentNames).toContain('Formulation Agent');
    expect(agentNames).toContain('Science Agent');
    expect(agentNames).toContain('Operations Agent');
    expect(agentNames).toContain('Marketing Agent');
    expect(agentNames).toContain('Sourcing Agent');
    expect(agentNames).toContain('Patent Agent');
    expect(agentNames).toContain('Spectra Agent');
    expect(agentNames).toContain('Customer Success Agent');
    expect(agentNames).toContain('F8 Slackbot');
    expect(agentNames).toContain('MCR Agent');
    expect(agentNames).toContain('Ad Agent');
    expect(agentNames).toContain('Editor Agent');
  });

  test('should have checkboxes for all agent-plan combinations', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(56); // 14 agents × 4 plans
  });

  test('should allow inline editing of plan names', async ({ page }) => {
    const standardHeader = page.locator('[data-plan="standard"][data-field="name"]');
    
    // Click to start editing
    await standardHeader.click();
    
    // Should show input field
    const input = page.locator('.editable-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Standard');
    
    // Type new name
    await input.fill('Premium Standard');
    await input.press('Enter');
    
    // Should update the display
    await expect(standardHeader).toContainText('Premium Standard');
  });

  test('should allow inline editing of plan prices', async ({ page }) => {
    const standardPrice = page.locator('[data-plan="standard"][data-field="price"]');
    
    // Click to start editing
    await standardPrice.click();
    
    // Should show input field
    const input = page.locator('.editable-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('$20/month');
    
    // Type new price
    await input.fill('$25/month');
    await input.press('Enter');
    
    // Should update the display
    await expect(standardPrice).toContainText('$25/month');
  });

  test('should allow inline editing of plan descriptions', async ({ page }) => {
    const standardDesc = page.locator('[data-plan="standard"][data-field="description"]');
    
    // Click to start editing
    await standardDesc.click();
    
    // Should show input field
    const input = page.locator('.editable-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Perfect for Artesians');
    
    // Type new description
    await input.fill('Perfect for Artisan Crafters');
    await input.press('Enter');
    
    // Should update the display
    await expect(standardDesc).toContainText('Perfect for Artisan Crafters');
  });

  test('should cancel editing on Escape key', async ({ page }) => {
    const standardHeader = page.locator('[data-plan="standard"][data-field="name"]');
    const originalText = await standardHeader.textContent();
    
    // Click to start editing
    await standardHeader.click();
    
    // Type something and press Escape
    const input = page.locator('.editable-input');
    await input.fill('New Name');
    await input.press('Escape');
    
    // Should revert to original text
    await expect(standardHeader).toContainText(originalText);
  });

  test('should toggle agent checkboxes', async ({ page }) => {
    const f8AgentCheckbox = page.locator('input[type="checkbox"]').first();
    
    // Check if initially checked
    const isChecked = await f8AgentCheckbox.isChecked();
    
    // Toggle the checkbox
    await f8AgentCheckbox.click();
    
    // Should have opposite state
    await expect(f8AgentCheckbox).toBeChecked({ checked: !isChecked });
  });

  test('should add new features to plans', async ({ page }) => {
    const addFeatureInput = page.locator('#add-feature-standard');
    const addFeatureButton = page.locator('button[onclick="addFeature(\'standard\')"]');
    
    // Add a new feature
    await addFeatureInput.fill('New Premium Feature');
    await addFeatureButton.click();
    
    // Should appear in the features list
    const features = page.locator('#features-standard .feature-item');
    await expect(features.last()).toContainText('New Premium Feature');
  });

  test('should remove features from plans', async ({ page }) => {
    // First add a feature to remove
    const addFeatureInput = page.locator('#add-feature-standard');
    const addFeatureButton = page.locator('button[onclick="addFeature(\'standard\')"]');
    
    await addFeatureInput.fill('Temporary Feature');
    await addFeatureButton.click();
    
    // Find the remove button and click it
    const removeButton = page.locator('#features-standard .remove-btn').last();
    await removeButton.click();
    
    // Feature should be removed
    await expect(page.locator('#features-standard .feature-item')).not.toContainText('Temporary Feature');
  });

  test('should drag and drop features within the same plan', async ({ page }) => {
    // Add two features to test drag and drop
    const addFeatureInput = page.locator('#add-feature-standard');
    const addFeatureButton = page.locator('button[onclick="addFeature(\'standard\')"]');
    
    await addFeatureInput.fill('First Feature');
    await addFeatureButton.click();
    
    await addFeatureInput.fill('Second Feature');
    await addFeatureButton.click();
    
    // Get the feature items
    const features = page.locator('#features-standard .feature-item');
    const firstFeature = features.nth(0);
    const secondFeature = features.nth(1);
    
    // Drag first feature to second position
    await firstFeature.dragTo(secondFeature);
    
    // Features should be reordered
    const featureTexts = await features.allTextContents();
    expect(featureTexts[0]).toContain('Second Feature');
    expect(featureTexts[1]).toContain('First Feature');
  });

  test('should drag and drop features between different plans', async ({ page }) => {
    // Add a feature to standard plan
    const addFeatureInput = page.locator('#add-feature-standard');
    const addFeatureButton = page.locator('button[onclick="addFeature(\'standard\')"]');
    
    await addFeatureInput.fill('Feature to Move');
    await addFeatureButton.click();
    
    // Drag from standard to micro
    const standardFeature = page.locator('#features-standard .feature-item').last();
    const microFeatures = page.locator('#features-micro');
    
    await standardFeature.dragTo(microFeatures);
    
    // Feature should be moved to micro plan
    await expect(page.locator('#features-micro .feature-item')).toContainText('Feature to Move');
    await expect(page.locator('#features-standard .feature-item')).not.toContainText('Feature to Move');
  });

  test('should show visual feedback during drag operations', async ({ page }) => {
    // Add a feature to test drag feedback
    const addFeatureInput = page.locator('#add-feature-standard');
    const addFeatureButton = page.locator('button[onclick="addFeature(\'standard\')"]');
    
    await addFeatureInput.fill('Draggable Feature');
    await addFeatureButton.click();
    
    const feature = page.locator('#features-standard .feature-item').last();
    
    // Start drag operation
    await feature.hover();
    await page.mouse.down();
    
    // Should show dragging class
    await expect(feature).toHaveClass(/dragging/);
    
    // Move mouse and release
    await page.mouse.move(100, 100);
    await page.mouse.up();
  });

  test('should save configuration and show success message', async ({ page }) => {
    // Make a change to trigger save
    const standardHeader = page.locator('[data-plan="standard"][data-field="name"]');
    await standardHeader.click();
    
    const input = page.locator('.editable-input');
    await input.fill('Updated Standard');
    await input.press('Enter');
    
    // Click save button
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    
    // Should show success message
    await expect(page.locator('.status.success')).toBeVisible();
    await expect(page.locator('.status.success')).toContainText('Configuration prepared!');
  });

  test('should reset configuration', async ({ page }) => {
    // Make a change
    const standardHeader = page.locator('[data-plan="standard"][data-field="name"]');
    await standardHeader.click();
    
    const input = page.locator('.editable-input');
    await input.fill('Modified Name');
    await input.press('Enter');
    
    // Click reset button
    const resetButton = page.locator('button:has-text("Reset")');
    await resetButton.click();
    
    // Confirm reset dialog
    await page.on('dialog', dialog => dialog.accept());
    
    // Should revert to original name
    await expect(standardHeader).toContainText('Standard');
  });

  test('should create pull request workflow', async ({ page }) => {
    // Make a change
    const standardHeader = page.locator('[data-plan="standard"][data-field="name"]');
    await standardHeader.click();
    
    const input = page.locator('.editable-input');
    await input.fill('PR Test Plan');
    await input.press('Enter');
    
    // Click save to trigger PR workflow
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    
    // Should show PR creation instructions
    await expect(page.locator('.status')).toContainText('Ready to Create Pull Request!');
    await expect(page.locator('a[href*="github.com"]')).toBeVisible();
  });

  test('should display proper agent access for each plan', async ({ page }) => {
    // Check that f8_agent is enabled for all plans
    const f8AgentCheckboxes = page.locator('tr:has-text("F8 Multi-Agent") input[type="checkbox"]');
    await expect(f8AgentCheckboxes).toHaveCount(4);
    
    for (let i = 0; i < 4; i++) {
      await expect(f8AgentCheckboxes.nth(i)).toBeChecked();
    }
    
    // Check that editor_agent is only enabled for enterprise
    const editorAgentRow = page.locator('tr:has-text("Editor Agent")');
    const editorCheckboxes = editorAgentRow.locator('input[type="checkbox"]');
    await expect(editorCheckboxes).toHaveCount(4);
    
    // Only the last checkbox (enterprise) should be checked
    await expect(editorCheckboxes.nth(0)).not.toBeChecked(); // standard
    await expect(editorCheckboxes.nth(1)).not.toBeChecked(); // micro
    await expect(editorCheckboxes.nth(2)).not.toBeChecked(); // operator
    await expect(editorCheckboxes.nth(3)).toBeChecked();     // enterprise
  });

  test('should have responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should still show all elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.plans-table')).toBeVisible();
    await expect(page.locator('.plan-header')).toHaveCount(4);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus on checkboxes
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to page and check for loading spinner
    await page.goto('https://f8ai.github.io/formul8-multiagent/plans.html');
    
    // Should show loading initially
    const loading = page.locator('#loading');
    await expect(loading).toBeVisible();
    
    // Should hide loading after content loads
    await expect(loading).not.toBeVisible({ timeout: 10000 });
  });

  test('should maintain dark theme styling', async ({ page }) => {
    // Check that dark theme variables are applied
    const body = page.locator('body');
    const computedStyle = await body.evaluate((el) => {
      return window.getComputedStyle(el);
    });
    
    // Should have dark background
    expect(computedStyle.backgroundColor).toContain('rgb(10, 10, 10)');
    
    // Check container has proper dark styling
    const container = page.locator('.container');
    await expect(container).toHaveCSS('background-color', 'rgb(30, 30, 30)');
  });

  test('should handle feature input validation', async ({ page }) => {
    const addFeatureInput = page.locator('#add-feature-standard');
    const addFeatureButton = page.locator('button[onclick="addFeature(\'standard\')"]');
    
    // Try to add empty feature
    await addFeatureInput.fill('');
    await addFeatureButton.click();
    
    // Should not add empty feature
    const features = page.locator('#features-standard .feature-item');
    const featureCount = await features.count();
    
    // Add a valid feature
    await addFeatureInput.fill('Valid Feature');
    await addFeatureButton.click();
    
    // Should add the valid feature
    await expect(features).toHaveCount(featureCount + 1);
    await expect(features.last()).toContainText('Valid Feature');
  });

  test('should update configuration object when making changes', async ({ page }) => {
    // Make a change to plan name
    const standardHeader = page.locator('[data-plan="standard"][data-field="name"]');
    await standardHeader.click();
    
    const input = page.locator('.editable-input');
    await input.fill('Updated Plan Name');
    await input.press('Enter');
    
    // Check that the configuration object was updated
    const configUpdated = await page.evaluate(() => {
      return window.plansConfig && 
             window.plansConfig.plans && 
             window.plansConfig.plans.standard && 
             window.plansConfig.plans.standard.name === 'Updated Plan Name';
    });
    
    expect(configUpdated).toBe(true);
  });
});

test.describe('Plans Configuration - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/raw.githubusercontent.com/**', route => route.abort());
    
    await page.goto('https://f8ai.github.io/formul8-multiagent/plans.html');
    await page.waitForLoadState('networkidle');
    
    // Should still load with fallback configuration
    await expect(page.locator('h1')).toContainText('Formul8 Plans Configuration');
    await expect(page.locator('.plan-header')).toHaveCount(4);
  });

  test('should show error message for failed operations', async ({ page }) => {
    await page.goto('https://f8ai.github.io/formul8-multiagent/plans.html');
    await page.waitForLoadState('networkidle');
    
    // Mock a failed save operation
    await page.evaluate(() => {
      window.fetch = () => Promise.reject(new Error('Network error'));
    });
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    
    // Should show error message
    await expect(page.locator('.status.error')).toBeVisible();
  });
});