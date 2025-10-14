const { test, expect } = require('@playwright/test');

test.describe('F8 Domain Validation', () => {
  test('should resolve f8.syzygyx.com correctly', async ({ page }) => {
    // Test DNS resolution and basic connectivity
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
  });

  test('should have correct SSL certificate', async ({ page }) => {
    // Navigate to the site and check for HTTPS
    await page.goto('/');
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);
  });

  test('should redirect HTTP to HTTPS', async ({ page }) => {
    // Test HTTP to HTTPS redirect
    const response = await page.goto('http://f8.syzygyx.com', { 
      waitUntil: 'networkidle' 
    });
    expect(page.url()).toMatch(/^https:\/\//);
  });

  test('should have proper CORS headers', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const headers = response.headers();
    
    // Check for CORS headers
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    expect(headers['access-control-allow-headers']).toBeDefined();
  });

  test('should respond to health check', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const headers = response.headers();
    
    // Check for security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-xss-protection']).toBeDefined();
  });
});