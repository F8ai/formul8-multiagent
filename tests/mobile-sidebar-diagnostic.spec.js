const { test, expect } = require('@playwright/test');

test.describe('Mobile Sidebar Diagnostic', () => {
  test('Debug sidebar initialization on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate
    await page.goto('https://chat.formul8.ai');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Check what's actually happening
    const debugInfo = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebarToggle');
      
      return {
        windowWidth: window.innerWidth,
        isMobile: window.innerWidth <= 768,
        sidebarExists: !!sidebar,
        toggleExists: !!toggle,
        sidebarClasses: sidebar ? sidebar.className : 'not found',
        toggleClasses: toggle ? toggle.className : 'not found',
        sidebarTransform: sidebar ? window.getComputedStyle(sidebar).transform : 'not found',
        sidebarVisible: sidebar ? sidebar.offsetWidth > 0 : false,
        hasCollapsedClass: sidebar ? sidebar.classList.contains('collapsed') : false,
        toggleHasOpenClass: toggle ? toggle.classList.contains('sidebar-open') : false,
      };
    });
    
    console.log('=== Debug Info ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/mobile-sidebar-debug.png', fullPage: true });
    
    // Check if initialization ran
    const initRan = await page.evaluate(() => {
      // Try to call the function manually to see if it works
      try {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;
        
        if (isMobile && sidebar && toggle) {
          sidebar.classList.add('collapsed-test');
          toggle.classList.remove('sidebar-open');
          return { success: true, isMobile, bothExist: true };
        }
        return { success: false, isMobile, sidebarExists: !!sidebar, toggleExists: !!toggle };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('=== Manual Init Test ===');
    console.log(JSON.stringify(initRan, null, 2));
  });
});
