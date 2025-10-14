const { chromium } = require('playwright');

async function compareFuture4200() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to match typical desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        console.log('Taking screenshot of real future4200.com...');
        await page.goto('https://future4200.com', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'future4200-real.png', fullPage: true });
        console.log('Real future4200.com screenshot saved as future4200-real.png');

        console.log('Taking screenshot of our replica...');
        await page.goto('https://f8.syzygyx.com/future4200.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'future4200-replica.png', fullPage: true });
        console.log('Replica screenshot saved as future4200-replica.png');

        // Test the chat functionality
        console.log('Testing chat functionality...');
        const chatButton = await page.locator('.ai-chat-toggle');
        if (await chatButton.isVisible()) {
            console.log('Chat button found, clicking...');
            await chatButton.click();
            await page.waitForTimeout(1000);
            
            const chatContainer = await page.locator('#ai-chat-container');
            if (await chatContainer.isVisible()) {
                console.log('Chat container opened successfully');
                
                // Test typing in chat
                const chatInput = await page.locator('#ai-chat-input');
                await chatInput.fill('Hello, test message');
                await page.waitForTimeout(500);
                
                const sendButton = await page.locator('.ai-chat-send');
                await sendButton.click();
                await page.waitForTimeout(2000);
                
                console.log('Chat message sent successfully');
            } else {
                console.log('Chat container did not open');
            }
        } else {
            console.log('Chat button not found');
        }

        // Take final screenshot with chat open
        await page.screenshot({ path: 'future4200-with-chat.png', fullPage: true });
        console.log('Final screenshot with chat saved as future4200-with-chat.png');

        console.log('Comparison complete!');
        console.log('- Real site: future4200-real.png');
        console.log('- Replica: future4200-replica.png');
        console.log('- With chat: future4200-with-chat.png');

    } catch (error) {
        console.error('Error during comparison:', error);
    } finally {
        await browser.close();
    }
}

compareFuture4200().catch(console.error);
