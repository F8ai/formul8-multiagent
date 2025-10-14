const { chromium } = require('playwright');

async function captureDesktopFuture4200() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        console.log('Capturing desktop future4200.com...');
        await page.goto('https://future4200.com', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(5000);
        
        // Wait for JavaScript to load
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Take screenshot
        await page.screenshot({ path: 'desktop-future4200.png', fullPage: true });
        console.log('Desktop screenshot saved as desktop-future4200.png');
        
        // Get the full HTML after JavaScript execution
        const html = await page.content();
        require('fs').writeFileSync('desktop-future4200.html', html);
        console.log('Desktop HTML saved to desktop-future4200.html');
        
        // Look for specific elements
        const searchBar = await page.locator('input[type="search"], .search-bar, #search').count();
        console.log('Search bar elements found:', searchBar);
        
        const logo = await page.locator('img[alt*="logo"], img[alt*="Logo"], .logo img, header img').count();
        console.log('Logo elements found:', logo);
        
        const sidebar = await page.locator('.sidebar, .left-panel, .side-panel, .navigation').count();
        console.log('Sidebar elements found:', sidebar);
        
        const nav = await page.locator('nav, .nav, .navigation').count();
        console.log('Navigation elements found:', nav);
        
        // Get all images
        const images = await page.locator('img').all();
        console.log('Total images found:', images.length);
        
        for (let i = 0; i < Math.min(images.length, 10); i++) {
            const src = await images[i].getAttribute('src');
            const alt = await images[i].getAttribute('alt');
            const className = await images[i].getAttribute('class');
            console.log(`Image ${i + 1}: ${src} (alt: ${alt}, class: ${className})`);
        }
        
        // Check for search functionality
        const searchInputs = await page.locator('input').all();
        console.log('Total input elements:', searchInputs.length);
        
        for (let i = 0; i < Math.min(searchInputs.length, 5); i++) {
            const type = await searchInputs[i].getAttribute('type');
            const placeholder = await searchInputs[i].getAttribute('placeholder');
            const className = await searchInputs[i].getAttribute('class');
            console.log(`Input ${i + 1}: type=${type}, placeholder=${placeholder}, class=${className}`);
        }

    } catch (error) {
        console.error('Error capturing desktop site:', error);
    } finally {
        await browser.close();
    }
}

captureDesktopFuture4200().catch(console.error);
