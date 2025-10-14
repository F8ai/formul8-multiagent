const { chromium } = require('playwright');

async function captureChatGPT() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Set viewport to match typical desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    
    try {
        // Navigate to ChatGPT
        console.log('Navigating to ChatGPT...');
        await page.goto('https://chatgpt.com', { waitUntil: 'networkidle' });
        
        // Wait for the page to load
        await page.waitForTimeout(3000);
        
        // Take a screenshot
        await page.screenshot({ path: 'chatgpt-interface.png', fullPage: true });
        console.log('Screenshot saved as chatgpt-interface.png');
        
        // Extract CSS styles and HTML structure
        const styles = await page.evaluate(() => {
            const styleSheets = Array.from(document.styleSheets);
            let allStyles = '';
            
            styleSheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules);
                    rules.forEach(rule => {
                        allStyles += rule.cssText + '\n';
                    });
                } catch (e) {
                    // Skip external stylesheets that can't be accessed
                }
            });
            
            return allStyles;
        });
        
        // Get the main chat container structure
        const chatStructure = await page.evaluate(() => {
            const mainContainer = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
            return {
                html: mainContainer.innerHTML,
                computedStyles: {}
            };
        });
        
        // Get computed styles for key elements
        const computedStyles = await page.evaluate(() => {
            const elements = [
                'body', 'main', '.chat-container', '.message', '.input-container',
                '.sidebar', '.header', '.message-user', '.message-assistant'
            ];
            
            const styles = {};
            elements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    const computed = window.getComputedStyle(element);
                    styles[selector] = {
                        backgroundColor: computed.backgroundColor,
                        color: computed.color,
                        fontFamily: computed.fontFamily,
                        fontSize: computed.fontSize,
                        padding: computed.padding,
                        margin: computed.margin,
                        border: computed.border,
                        borderRadius: computed.borderRadius,
                        boxShadow: computed.boxShadow,
                        display: computed.display,
                        flexDirection: computed.flexDirection,
                        alignItems: computed.alignItems,
                        justifyContent: computed.justifyContent,
                        width: computed.width,
                        height: computed.height,
                        maxWidth: computed.maxWidth,
                        minHeight: computed.minHeight
                    };
                }
            });
            return styles;
        });
        
        // Save the captured data
        const fs = require('fs');
        fs.writeFileSync('chatgpt-styles.css', styles);
        fs.writeFileSync('chatgpt-structure.json', JSON.stringify({
            html: chatStructure.html,
            computedStyles: computedStyles
        }, null, 2));
        
        console.log('ChatGPT analysis complete!');
        console.log('- Styles saved to: chatgpt-styles.css');
        console.log('- Structure saved to: chatgpt-structure.json');
        console.log('- Screenshot saved to: chatgpt-interface.png');
        
    } catch (error) {
        console.error('Error capturing ChatGPT:', error);
    } finally {
        await browser.close();
    }
}

captureChatGPT().catch(console.error);
