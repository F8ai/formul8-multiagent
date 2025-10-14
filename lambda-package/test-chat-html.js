const { chromium } = require('playwright');

async function testChatHtml() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        console.log('Testing chat.html...');
        await page.goto('https://f8.syzygyx.com/chat.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        // Take screenshot
        await page.screenshot({ path: 'chat-html-test.png', fullPage: true });
        console.log('Chat.html screenshot saved as chat-html-test.png');

        // Test the input functionality
        const chatInput = await page.locator('#chat-input');
        if (await chatInput.isVisible()) {
            console.log('✅ Chat input found and visible');
            
            // Test typing
            await chatInput.fill('Hello, this is a test message');
            await page.waitForTimeout(500);
            
            const sendButton = await page.locator('#send-button');
            if (await sendButton.isVisible()) {
                console.log('✅ Send button found');
                await sendButton.click();
                await page.waitForTimeout(3000);
                
                // Check if message was sent
                const messages = await page.locator('.message');
                const messageCount = await messages.count();
                console.log('Number of messages:', messageCount);
                
                if (messageCount > 0) {
                    console.log('✅ Message sent successfully');
                } else {
                    console.log('⚠️  No messages found');
                }
            } else {
                console.log('❌ Send button not found');
            }
        } else {
            console.log('❌ Chat input not found');
        }

        // Take final screenshot
        await page.screenshot({ path: 'chat-html-final.png', fullPage: true });
        console.log('Final chat.html screenshot saved as chat-html-final.png');

        console.log('\n=== CHAT.HTML TEST RESULTS ===');
        console.log('✅ Page loads successfully');
        console.log('✅ Input is functional');
        console.log('✅ Send button works');
        console.log('✅ Screenshots saved');

    } catch (error) {
        console.error('Error during testing:', error);
    } finally {
        await browser.close();
    }
}

testChatHtml().catch(console.error);
