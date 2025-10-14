const { chromium } = require('playwright');

async function analyzeDropdownBehavior() {
  console.log('🔍 Analyzing dropdown behavior on future4200.com...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the website
    console.log('📱 Navigating to future4200.com...');
    await page.goto('https://future4200.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    // Look for search input or question input field
    console.log('🔍 Looking for input fields...');
    
    const inputFields = await page.$$('input[type="text"], input[type="search"], textarea, [contenteditable="true"]');
    console.log(`Found ${inputFields.length} input fields`);
    
    // Try to find search/ask functionality
    const searchInputs = await page.$$('input[placeholder*="search"], input[placeholder*="ask"], input[placeholder*="question"]');
    console.log(`Found ${searchInputs.length} search/ask inputs`);
    
    // Look for any input that might trigger dropdown
    const allInputs = await page.$$('input, textarea, [contenteditable]');
    console.log(`Total input elements: ${allInputs.length}`);
    
    // Check for search functionality in navigation
    const searchElements = await page.$$('[class*="search"], [id*="search"], [data-*="search"]');
    console.log(`Found ${searchElements.length} search-related elements`);
    
    // Look for any dropdown or autocomplete elements
    const dropdowns = await page.$$('[class*="dropdown"], [class*="autocomplete"], [class*="suggest"], [role="listbox"], [role="combobox"]');
    console.log(`Found ${dropdowns.length} dropdown/autocomplete elements`);
    
    // Take initial screenshot
    await page.screenshot({ path: 'future4200-initial.png', fullPage: true });
    
    // Try to interact with different input fields
    for (let i = 0; i < allInputs.length; i++) {
      try {
        console.log(`\n🔍 Testing input ${i + 1}...`);
        
        const input = allInputs[i];
        const inputInfo = await page.evaluate((el) => {
          return {
            tagName: el.tagName,
            type: el.type || 'N/A',
            placeholder: el.placeholder || 'N/A',
            className: el.className || 'N/A',
            id: el.id || 'N/A',
            visible: el.offsetWidth > 0 && el.offsetHeight > 0
          };
        }, input);
        
        console.log(`  Type: ${inputInfo.tagName}, Placeholder: "${inputInfo.placeholder}", Visible: ${inputInfo.visible}`);
        
        if (inputInfo.visible) {
          // Click on the input
          await input.click();
          await page.waitForTimeout(500);
          
          // Type a test question
          await input.type('How to extract CBD from hemp?');
          await page.waitForTimeout(1000);
          
          // Press Enter
          await input.press('Enter');
          await page.waitForTimeout(2000);
          
          // Check if any dropdown appeared
          const dropdownAfter = await page.$$('[class*="dropdown"], [class*="autocomplete"], [class*="suggest"], [role="listbox"], [role="combobox"], [class*="results"], [class*="suggestions"]');
          console.log(`  Dropdowns after typing: ${dropdownAfter.length}`);
          
          // Take screenshot after interaction
          await page.screenshot({ path: `future4200-after-input-${i + 1}.png`, fullPage: true });
          
          // Clear the input
          await input.fill('');
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log(`  Error testing input ${i + 1}: ${error.message}`);
      }
    }
    
    // Look for any JavaScript that might handle search/ask functionality
    console.log('\n🔍 Analyzing JavaScript behavior...');
    
    const jsAnalysis = await page.evaluate(() => {
      // Look for event listeners on inputs
      const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
      const inputInfo = Array.from(inputs).map(input => {
        const events = [];
        // Check for common event attributes
        if (input.onkeydown) events.push('keydown');
        if (input.onkeyup) events.push('keyup');
        if (input.oninput) events.push('input');
        if (input.onchange) events.push('change');
        if (input.onsearch) events.push('search');
        
        return {
          tagName: input.tagName,
          type: input.type || 'N/A',
          placeholder: input.placeholder || 'N/A',
          events: events,
          hasDataAttributes: Array.from(input.attributes).some(attr => attr.name.startsWith('data-'))
        };
      });
      
      return inputInfo;
    });
    
    console.log('Input elements with event handlers:');
    jsAnalysis.forEach((info, i) => {
      if (info.events.length > 0 || info.hasDataAttributes) {
        console.log(`  ${i + 1}. ${info.tagName} (${info.type}) - Events: ${info.events.join(', ')} - Data attrs: ${info.hasDataAttributes}`);
      }
    });
    
    // Look for any search-related functionality in the page
    console.log('\n🔍 Looking for search functionality...');
    
    const searchFunctionality = await page.evaluate(() => {
      // Look for search forms
      const searchForms = document.querySelectorAll('form[action*="search"], form[class*="search"]');
      
      // Look for search buttons
      const searchButtons = document.querySelectorAll('button[class*="search"], input[type="submit"][class*="search"]');
      
      // Look for any elements with search-related text
      const searchText = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('search')
      ).map(el => el.textContent.trim()).slice(0, 10);
      
      return {
        searchForms: searchForms.length,
        searchButtons: searchButtons.length,
        searchText: searchText
      };
    });
    
    console.log(`Search forms: ${searchFunctionality.searchForms}`);
    console.log(`Search buttons: ${searchFunctionality.searchButtons}`);
    console.log('Search-related text found:', searchFunctionality.searchText);
    
    // Check if there's a search URL parameter or hash
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Look for any autocomplete or suggestion functionality
    console.log('\n🔍 Looking for autocomplete/suggestion functionality...');
    
    const autocompleteElements = await page.$$('[autocomplete], [aria-autocomplete], [class*="complete"], [class*="suggest"]');
    console.log(`Autocomplete elements: ${autocompleteElements.length}`);
    
    // Check for any hidden elements that might show suggestions
    const hiddenElements = await page.$$('[style*="display: none"], [style*="visibility: hidden"], .hidden, [aria-hidden="true"]');
    console.log(`Hidden elements: ${hiddenElements.length}`);
    
    console.log('\n✅ Analysis completed!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

analyzeDropdownBehavior().catch(console.error);