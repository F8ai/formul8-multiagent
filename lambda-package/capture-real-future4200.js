const { chromium } = require('playwright');

async function captureRealFuture4200() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        console.log('Capturing real future4200.com structure...');
        await page.goto('https://future4200.com', { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(3000);
        
        // Get the full HTML structure
        const html = await page.content();
        console.log('HTML length:', html.length);
        
        // Save the HTML for analysis
        require('fs').writeFileSync('real-future4200.html', html);
        console.log('Real HTML saved to real-future4200.html');
        
        // Take screenshot
        await page.screenshot({ path: 'real-future4200-screenshot.png', fullPage: true });
        console.log('Screenshot saved as real-future4200-screenshot.png');
        
        // Extract key elements
        const title = await page.title();
        console.log('Page title:', title);
        
        const header = await page.locator('header').innerHTML();
        console.log('Header HTML:', header);
        
        const mainContent = await page.locator('#main-outlet').innerHTML();
        console.log('Main content length:', mainContent.length);
        
        // Check for left panel/sidebar
        const sidebar = await page.locator('.sidebar, .left-panel, .side-panel').count();
        console.log('Sidebar elements found:', sidebar);
        
        // Check for logo
        const logo = await page.locator('img[alt*="logo"], img[alt*="Logo"], .logo img').count();
        console.log('Logo elements found:', logo);
        
        // Get all images
        const images = await page.locator('img').all();
        console.log('Total images found:', images.length);
        
        for (let i = 0; i < Math.min(images.length, 5); i++) {
            const src = await images[i].getAttribute('src');
            const alt = await images[i].getAttribute('alt');
            console.log(`Image ${i + 1}: ${src} (alt: ${alt})`);
        }

    } catch (error) {
        console.error('Error capturing site:', error);
    } finally {
        await browser.close();
    }
}

captureRealFuture4200().catch(console.error);
