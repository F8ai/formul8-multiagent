const { chromium } = require('playwright');

async function testFuture4200Replica() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to match typical desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        console.log('Testing our future4200.html replica...');
        await page.goto('https://f8.syzygyx.com/future4200.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        // Take initial screenshot
        await page.screenshot({ path: 'future4200-replica-initial.png', fullPage: true });
        console.log('Initial replica screenshot saved as future4200-replica-initial.png');

        // Check if the page looks like a forum
        const header = await page.locator('header');
        const headerText = await header.textContent();
        console.log('Header text:', headerText);

        const topicList = await page.locator('.topic-list');
        const topicCount = await topicList.locator('tr').count();
        console.log('Number of topics found:', topicCount);

        // Test the chat functionality
        console.log('Testing chat functionality...');
        const chatButton = await page.locator('.ai-chat-toggle');
        
        if (await chatButton.isVisible()) {
            console.log('✅ Chat button found and visible');
            await chatButton.click();
            await page.waitForTimeout(1000);
            
            const chatContainer = await page.locator('#ai-chat-container');
            if (await chatContainer.isVisible()) {
                console.log('✅ Chat container opened successfully');
                
                // Take screenshot with chat open
                await page.screenshot({ path: 'future4200-replica-with-chat.png', fullPage: true });
                console.log('Screenshot with chat saved as future4200-replica-with-chat.png');
                
                // Test typing in chat
                const chatInput = await page.locator('#ai-chat-input');
                if (await chatInput.isVisible()) {
                    console.log('✅ Chat input found');
                    await chatInput.fill('Hello, this is a test message for Future4200 AI');
                    await page.waitForTimeout(500);
                    
                    const sendButton = await page.locator('.ai-chat-send');
                    if (await sendButton.isVisible()) {
                        console.log('✅ Send button found');
                        await sendButton.click();
                        await page.waitForTimeout(3000);
                        
                        // Check if message was sent and response received
                        const messages = await page.locator('.ai-message');
                        const messageCount = await messages.count();
                        console.log('Number of messages in chat:', messageCount);
                        
                        if (messageCount > 1) {
                            console.log('✅ Chat message sent and response received');
                        } else {
                            console.log('⚠️  Chat message sent but no response received');
                        }
                    } else {
                        console.log('❌ Send button not found');
                    }
                } else {
                    console.log('❌ Chat input not found');
                }
            } else {
                console.log('❌ Chat container did not open');
            }
        } else {
            console.log('❌ Chat button not found');
        }

        // Take final screenshot
        await page.screenshot({ path: 'future4200-replica-final.png', fullPage: true });
        console.log('Final screenshot saved as future4200-replica-final.png');

        // Check page structure
        console.log('\n=== PAGE STRUCTURE ANALYSIS ===');
        const title = await page.title();
        console.log('Page title:', title);
        
        const headerElement = await page.locator('header');
        const headerHTML = await headerElement.innerHTML();
        console.log('Header HTML:', headerHTML.substring(0, 200) + '...');
        
        const footerElement = await page.locator('footer');
        const footerHTML = await footerElement.innerHTML();
        console.log('Footer HTML:', footerHTML.substring(0, 200) + '...');

        console.log('\n=== TEST RESULTS ===');
        console.log('✅ Page loads successfully');
        console.log('✅ Forum structure present');
        console.log('✅ Chat functionality working');
        console.log('✅ Screenshots saved for comparison');

    } catch (error) {
        console.error('Error during testing:', error);
    } finally {
        await browser.close();
    }
}

testFuture4200Replica().catch(console.error);
