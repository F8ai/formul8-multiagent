const { chromium } = require('playwright');

async function analyzeChatGPT() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('📱 Navigating to ChatGPT...');
    await page.goto('https://chatgpt.com/', { waitUntil: 'networkidle' });
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(3000);

    console.log('\n📸 Taking screenshot of initial state...');
    await page.screenshot({ path: 'chatgpt-initial.png', fullPage: true });

    console.log('\n🔍 Analyzing ChatGPT structure...\n');

    // Get the main container structure
    const bodyStyles = await page.evaluate(() => {
        const body = document.body;
        const computed = window.getComputedStyle(body);
        return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize
        };
    });
    console.log('Body styles:', JSON.stringify(bodyStyles, null, 2));

    // Get header info
    const headerInfo = await page.evaluate(() => {
        const header = document.querySelector('header') || 
                      document.querySelector('[role="banner"]') ||
                      document.querySelector('nav');
        if (!header) return null;
        
        const computed = window.getComputedStyle(header);
        return {
            html: header.outerHTML.substring(0, 500),
            styles: {
                backgroundColor: computed.backgroundColor,
                height: computed.height,
                padding: computed.padding,
                borderBottom: computed.borderBottom,
                position: computed.position
            },
            classes: header.className
        };
    });
    console.log('\nHeader:', JSON.stringify(headerInfo, null, 2));

    // Get input container info
    const inputInfo = await page.evaluate(() => {
        const inputs = document.querySelectorAll('textarea, input[type="text"]');
        const mainInput = Array.from(inputs).find(el => 
            el.placeholder?.toLowerCase().includes('message') ||
            el.getAttribute('aria-label')?.toLowerCase().includes('message')
        );
        
        if (!mainInput) return null;
        
        const container = mainInput.closest('form') || mainInput.closest('div');
        const computed = window.getComputedStyle(container);
        const inputComputed = window.getComputedStyle(mainInput);
        
        return {
            containerStyles: {
                backgroundColor: computed.backgroundColor,
                padding: computed.padding,
                position: computed.position,
                bottom: computed.bottom,
                maxWidth: computed.maxWidth,
                margin: computed.margin
            },
            inputStyles: {
                backgroundColor: inputComputed.backgroundColor,
                borderRadius: inputComputed.borderRadius,
                border: inputComputed.border,
                padding: inputComputed.padding,
                fontSize: inputComputed.fontSize,
                color: inputComputed.color
            },
            placeholder: mainInput.placeholder
        };
    });
    console.log('\nInput container:', JSON.stringify(inputInfo, null, 2));

    // Get message container info
    const messagesInfo = await page.evaluate(() => {
        const main = document.querySelector('main') || 
                    document.querySelector('[role="main"]') ||
                    document.querySelector('.conversation');
        
        if (!main) return null;
        
        const computed = window.getComputedStyle(main);
        return {
            styles: {
                backgroundColor: computed.backgroundColor,
                padding: computed.padding,
                maxWidth: computed.maxWidth,
                margin: computed.margin,
                display: computed.display,
                flexDirection: computed.flexDirection
            }
        };
    });
    console.log('\nMessages container:', JSON.stringify(messagesInfo, null, 2));

    // Try to type a message and analyze the response
    console.log('\n✍️  Typing a test message...');
    const inputSelector = await page.evaluate(() => {
        const inputs = document.querySelectorAll('textarea, input[type="text"]');
        const mainInput = Array.from(inputs).find(el => 
            el.placeholder?.toLowerCase().includes('message') ||
            el.getAttribute('aria-label')?.toLowerCase().includes('message')
        );
        return mainInput ? mainInput.id || 'textarea' : null;
    });

    if (inputSelector) {
        await page.click('textarea');
        await page.keyboard.type('What is 2+2?');
        await page.waitForTimeout(1000);
        
        console.log('📸 Taking screenshot with input...');
        await page.screenshot({ path: 'chatgpt-with-input.png', fullPage: true });

        // Press Enter to send
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);

        console.log('📸 Taking screenshot after response...');
        await page.screenshot({ path: 'chatgpt-after-response.png', fullPage: true });

        // Analyze message styling
        const messageStyles = await page.evaluate(() => {
            const messages = document.querySelectorAll('[data-message-author-role], .message, [class*="message"]');
            if (messages.length === 0) return null;

            const results = [];
            for (let i = 0; i < Math.min(2, messages.length); i++) {
                const msg = messages[i];
                const computed = window.getComputedStyle(msg);
                results.push({
                    role: msg.getAttribute('data-message-author-role') || 'unknown',
                    styles: {
                        backgroundColor: computed.backgroundColor,
                        padding: computed.padding,
                        margin: computed.margin,
                        borderRadius: computed.borderRadius
                    },
                    html: msg.outerHTML.substring(0, 300)
                });
            }
            return results;
        });
        console.log('\nMessage styles:', JSON.stringify(messageStyles, null, 2));
    }

    console.log('\n✅ Analysis complete! Check the screenshots.');
    console.log('\nScreenshots saved:');
    console.log('  - chatgpt-initial.png');
    console.log('  - chatgpt-with-input.png');
    console.log('  - chatgpt-after-response.png');

    await page.waitForTimeout(3000);
    await browser.close();
}

analyzeChatGPT().catch(console.error);
