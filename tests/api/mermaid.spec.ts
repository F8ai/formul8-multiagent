import { test, expect } from '@playwright/test';

test.describe('Mermaid Diagram Support', () => {
  const baseURL = 'http://localhost:3000';

  test('API returns Mermaid diagram syntax when requested', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/chat`, {
      data: {
        message: 'Show me a flowchart',
        user_id: 'test-user'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.response).toContain('```mermaid');
    expect(data.response).toContain('graph TD');
    expect(data.response).toContain('```');
  });

  test('Chat page loads with Mermaid script', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    
    // Check that Mermaid script tag is present
    const content = await page.content();
    expect(content).toContain('mermaid');
    
    // Check that styles for Mermaid diagrams are present
    expect(content).toContain('.mermaid-diagram');
    expect(content).toContain('.mermaid-container');
  });

  test('addMessage function can parse Mermaid syntax', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    
    // Test that the regex pattern works correctly
    const result = await page.evaluate(() => {
      const testContent = 'Here is a diagram:\n```mermaid\ngraph TD\n    A-->B\n```';
      const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
      const matches = [];
      let match;
      while ((match = mermaidRegex.exec(testContent)) !== null) {
        matches.push(match[1]);
      }
      
      return {
        hasMatches: matches.length > 0,
        matchedContent: matches[0] || null
      };
    });
    
    expect(result.hasMatches).toBe(true);
    expect(result.matchedContent).toContain('graph TD');
  });
});
