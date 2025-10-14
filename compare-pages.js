const { chromium } = require('playwright');

async function comparePages() {
  console.log('🔍 Comparing original future4200.com with our mimic...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Load original page
    console.log('📱 Loading original future4200.com...');
    await page.goto('https://future4200.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'original-future4200.png', fullPage: true });
    
    // Load our mimic
    console.log('📱 Loading our future4200.html mimic...');
    await page.goto('file://' + __dirname + '/future4200.html');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'mimic-future4200.png', fullPage: true });
    
    // Compare key elements
    console.log('🔍 Comparing key elements...');
    
    // Original page analysis
    await page.goto('https://future4200.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(3000);
    
    const originalData = await page.evaluate(() => {
      return {
        title: document.title,
        hasHeader: !!document.querySelector('header, .header'),
        hasNavigation: !!document.querySelector('nav, .nav'),
        hasCategories: document.querySelectorAll('.category, [class*="category"]').length,
        hasTopics: document.querySelectorAll('.topic, [class*="topic"]').length,
        hasFooter: !!document.querySelector('footer, .footer'),
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        textColor: getComputedStyle(document.body).color,
        fontFamily: getComputedStyle(document.body).fontFamily
      };
    });
    
    // Our mimic analysis
    await page.goto('file://' + __dirname + '/future4200.html');
    await page.waitForTimeout(2000);
    
    const mimicData = await page.evaluate(() => {
      return {
        title: document.title,
        hasHeader: !!document.querySelector('header, .header'),
        hasNavigation: !!document.querySelector('nav, .nav'),
        hasCategories: document.querySelectorAll('.category, [class*="category"]').length,
        hasTopics: document.querySelectorAll('.topic, [class*="topic"]').length,
        hasFooter: !!document.querySelector('footer, .footer'),
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        textColor: getComputedStyle(document.body).color,
        fontFamily: getComputedStyle(document.body).fontFamily
      };
    });
    
    console.log('\n📊 COMPARISON RESULTS:');
    console.log('='.repeat(50));
    
    console.log('\n🏷️  TITLE:');
    console.log(`Original: "${originalData.title}"`);
    console.log(`Mimic:    "${mimicData.title}"`);
    console.log(`Match:    ${originalData.title === mimicData.title ? '✅' : '❌'}`);
    
    console.log('\n🏗️  STRUCTURE:');
    console.log(`Header:     Original: ${originalData.hasHeader ? '✅' : '❌'} | Mimic: ${mimicData.hasHeader ? '✅' : '❌'}`);
    console.log(`Navigation: Original: ${originalData.hasNavigation ? '✅' : '❌'} | Mimic: ${mimicData.hasNavigation ? '✅' : '❌'}`);
    console.log(`Categories: Original: ${originalData.hasCategories} | Mimic: ${mimicData.hasCategories}`);
    console.log(`Topics:     Original: ${originalData.hasTopics} | Mimic: ${mimicData.hasTopics}`);
    console.log(`Footer:     Original: ${originalData.hasFooter ? '✅' : '❌'} | Mimic: ${mimicData.hasFooter ? '✅' : '❌'}`);
    
    console.log('\n🎨 STYLING:');
    console.log(`Background: Original: ${originalData.backgroundColor} | Mimic: ${mimicData.backgroundColor}`);
    console.log(`Text Color: Original: ${originalData.textColor} | Mimic: ${mimicData.textColor}`);
    console.log(`Font:       Original: ${originalData.fontFamily} | Mimic: ${mimicData.fontFamily}`);
    
    // Calculate similarity score
    let similarityScore = 0;
    const totalChecks = 8;
    
    if (originalData.title === mimicData.title) similarityScore++;
    if (originalData.hasHeader === mimicData.hasHeader) similarityScore++;
    if (originalData.hasNavigation === mimicData.hasNavigation) similarityScore++;
    if (originalData.hasFooter === mimicData.hasFooter) similarityScore++;
    if (originalData.backgroundColor === mimicData.backgroundColor) similarityScore++;
    if (originalData.textColor === mimicData.textColor) similarityScore++;
    if (originalData.fontFamily === mimicData.fontFamily) similarityScore++;
    if (Math.abs(originalData.hasCategories - mimicData.hasCategories) <= 2) similarityScore++;
    
    const percentage = Math.round((similarityScore / totalChecks) * 100);
    
    console.log('\n📈 SIMILARITY SCORE:');
    console.log(`${similarityScore}/${totalChecks} checks passed (${percentage}%)`);
    
    if (percentage >= 80) {
      console.log('🎉 Excellent mimic! Very close to the original.');
    } else if (percentage >= 60) {
      console.log('👍 Good mimic! Some differences but overall similar.');
    } else {
      console.log('⚠️  Needs improvement. Consider adjusting the design.');
    }
    
    console.log('\n✅ Comparison completed!');
    
  } catch (error) {
    console.error('❌ Error during comparison:', error);
  } finally {
    await browser.close();
  }
}

comparePages().catch(console.error);