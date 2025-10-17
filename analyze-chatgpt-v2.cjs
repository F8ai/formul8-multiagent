const { chromium } = require('playwright');

async function analyzeChatGPT() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('📱 Navigating to ChatGPT...');
    await page.goto('https://chatgpt.com/', { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(5000);

    console.log('\n🔍 Getting all computed styles and structure...\n');

    // Get comprehensive structure analysis
    const analysis = await page.evaluate(() => {
        const results = {
            body: null,
            main: null,
            inputArea: null,
            allTextareas: [],
            allDivs: []
        };

        // Body
        const body = document.body;
        const bodyStyles = window.getComputedStyle(body);
        results.body = {
            backgroundColor: bodyStyles.backgroundColor,
            color: bodyStyles.color,
            fontFamily: bodyStyles.fontFamily
        };

        // Main content area
        const main = document.querySelector('main');
        if (main) {
            const mainStyles = window.getComputedStyle(main);
            results.main = {
                tag: main.tagName,
                classes: main.className,
                backgroundColor: mainStyles.backgroundColor,
                display: mainStyles.display,
                maxWidth: mainStyles.maxWidth,
                padding: mainStyles.padding,
                width: mainStyles.width
            };
        }

        // Find all textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((ta, i) => {
            const styles = window.getComputedStyle(ta);
            const parent = ta.parentElement;
            const parentStyles = parent ? window.getComputedStyle(parent) : null;
            
            results.allTextareas.push({
                index: i,
                id: ta.id,
                placeholder: ta.placeholder,
                rows: ta.rows,
                classes: ta.className,
                styles: {
                    backgroundColor: styles.backgroundColor,
                    border: styles.border,
                    borderRadius: styles.borderRadius,
                    padding: styles.padding,
                    fontSize: styles.fontSize,
                    color: styles.color,
                    width: styles.width,
                    minHeight: styles.minHeight
                },
                parentClasses: parent ? parent.className : null,
                parentStyles: parentStyles ? {
                    backgroundColor: parentStyles.backgroundColor,
                    padding: parentStyles.padding,
                    position: parentStyles.position,
                    bottom: parentStyles.bottom,
                    maxWidth: parentStyles.maxWidth
                } : null
            });
        });

        // Get divs with specific styling patterns
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
            const styles = window.getComputedStyle(div);
            const bg = styles.backgroundColor;
            const pos = styles.position;
            
            // Look for interesting divs (fixed, absolute, or with specific bg colors)
            if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') {
                results.allDivs.push({
                    classes: div.className,
                    position: pos,
                    top: styles.top,
                    bottom: styles.bottom,
                    left: styles.left,
                    right: styles.right,
                    backgroundColor: bg,
                    zIndex: styles.zIndex,
                    textContent: div.textContent?.substring(0, 50) || ''
                });
            }
        });

        return results;
    });

    console.log('===== BODY =====');
    console.log(JSON.stringify(analysis.body, null, 2));
    
    console.log('\n===== MAIN CONTAINER =====');
    console.log(JSON.stringify(analysis.main, null, 2));
    
    console.log('\n===== TEXTAREAS =====');
    analysis.allTextareas.forEach((ta, i) => {
        console.log(`\n--- Textarea ${i} ---`);
        console.log(JSON.stringify(ta, null, 2));
    });

    console.log('\n===== POSITIONED DIVS =====');
    analysis.allDivs.slice(0, 10).forEach((div, i) => {
        console.log(`\n--- Div ${i} ---`);
        console.log(JSON.stringify(div, null, 2));
    });

    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'chatgpt-full-analysis.png', fullPage: true });

    console.log('\n✅ Complete! Screenshot saved as chatgpt-full-analysis.png');

    await page.waitForTimeout(2000);
    await browser.close();
}

analyzeChatGPT().catch(console.error);
