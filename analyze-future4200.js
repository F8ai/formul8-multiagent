const { chromium } = require('playwright');

async function analyzeFuture4200() {
  console.log('🚀 Starting analysis of future4200.com...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the website
    console.log('📱 Navigating to future4200.com...');
    await page.goto('https://future4200.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'future4200-screenshot.png', fullPage: true });
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Get all text content
    const textContent = await page.textContent('body');
    console.log('📝 Text content length:', textContent.length);
    
    // Get HTML structure
    const html = await page.content();
    console.log('🏗️ HTML content length:', html.length);
    
    // Save the HTML for analysis
    const fs = require('fs');
    fs.writeFileSync('future4200.html', html);
    console.log('💾 Saved HTML to future4200.html');
    
    // Get CSS styles
    const styles = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      let allStyles = '';
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            allStyles += rule.cssText + '\n';
          });
        } catch (e) {
          // Skip external stylesheets that can't be accessed
        }
      });
      return allStyles;
    });
    
    fs.writeFileSync('future4200-styles.css', styles);
    console.log('🎨 Saved CSS to future4200-styles.css');
    
    // Get meta information
    const metaInfo = await page.evaluate(() => {
      const metas = Array.from(document.querySelectorAll('meta'));
      return metas.map(meta => ({
        name: meta.getAttribute('name') || meta.getAttribute('property'),
        content: meta.getAttribute('content')
      })).filter(meta => meta.name && meta.content);
    });
    
    console.log('🔍 Meta information:', metaInfo);
    
    // Get all images
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      }));
    });
    
    console.log('🖼️ Images found:', images.length);
    images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.src} (${img.width}x${img.height}) - ${img.alt}`);
    });
    
    // Get all links
    const links = await page.evaluate(() => {
      const linkElements = Array.from(document.querySelectorAll('a'));
      return linkElements.map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        target: link.target
      }));
    });
    
    console.log('🔗 Links found:', links.length);
    links.slice(0, 10).forEach((link, i) => {
      console.log(`  ${i + 1}. ${link.text} -> ${link.href}`);
    });
    
    // Get color scheme
    const colors = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.body);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize
      };
    });
    
    console.log('🎨 Color scheme:', colors);
    
    // Get layout information
    const layout = await page.evaluate(() => {
      const body = document.body;
      return {
        width: body.offsetWidth,
        height: body.offsetHeight,
        scrollWidth: body.scrollWidth,
        scrollHeight: body.scrollHeight
      };
    });
    
    console.log('📐 Layout dimensions:', layout);
    
    // Get all headings
    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map(heading => ({
        tag: heading.tagName,
        text: heading.textContent.trim(),
        level: parseInt(heading.tagName.charAt(1))
      }));
    });
    
    console.log('📋 Headings found:', headings.length);
    headings.forEach((heading, i) => {
      console.log(`  ${i + 1}. ${heading.tag}: ${heading.text}`);
    });
    
    // Get all buttons
    const buttons = await page.evaluate(() => {
      const buttonElements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
      return buttonElements.map(button => ({
        text: button.textContent.trim() || button.value,
        type: button.type || 'button',
        className: button.className
      }));
    });
    
    console.log('🔘 Buttons found:', buttons.length);
    buttons.forEach((button, i) => {
      console.log(`  ${i + 1}. ${button.text} (${button.type})`);
    });
    
    // Get form elements
    const forms = await page.evaluate(() => {
      const formElements = Array.from(document.querySelectorAll('form'));
      return formElements.map(form => ({
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          required: input.required
        }))
      }));
    });
    
    console.log('📝 Forms found:', forms.length);
    forms.forEach((form, i) => {
      console.log(`  ${i + 1}. ${form.method.toUpperCase()} ${form.action}`);
      form.inputs.forEach((input, j) => {
        console.log(`    - ${input.type}: ${input.name} (${input.placeholder})`);
      });
    });
    
    console.log('✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

analyzeFuture4200().catch(console.error);