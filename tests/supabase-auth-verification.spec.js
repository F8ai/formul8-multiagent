import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Test to verify Supabase authentication implementation in chat.html
 * This test checks the code implementation, not the live deployment
 */

test.describe('Supabase Auth Code Verification', () => {
  test('chat.html contains Supabase authentication code', () => {
    const chatHtmlPath = join(process.cwd(), 'chat.html');
    const chatHtml = readFileSync(chatHtmlPath, 'utf-8');
    
    // Check for Supabase library
    const hasSupabaseLib = chatHtml.includes('@supabase/supabase-js') || 
                          chatHtml.includes('supabase.min.js');
    
    // Check for Supabase client initialization
    const hasSupabaseClient = chatHtml.includes('createClient') && 
                             chatHtml.includes('SUPABASE_URL');
    
    // Check for OAuth sign-in
    const hasOAuthSignIn = chatHtml.includes('signInWithOAuth') && 
                          chatHtml.includes('provider: \'google\'');
    
    // Check for session management
    const hasSessionMgmt = chatHtml.includes('getSession') || 
                          chatHtml.includes('onAuthStateChange');
    
    // Check for sign-out
    const hasSignOut = chatHtml.includes('signOut') || 
                      chatHtml.includes('auth.signOut');
    
    // Check for sign-in button
    const hasSignInButton = chatHtml.includes('supabase-signin-button') ||
                           chatHtml.includes('Sign in with Google');
    
    // Check that Google Sign-In script is removed
    const hasOldGoogleAuth = chatHtml.includes('accounts.google.com/gsi/client');
    
    console.log('\n=== Supabase Auth Code Verification ===');
    console.log('Supabase Library:', hasSupabaseLib ? '✅' : '❌');
    console.log('Supabase Client Init:', hasSupabaseClient ? '✅' : '❌');
    console.log('OAuth Sign-In:', hasOAuthSignIn ? '✅' : '❌');
    console.log('Session Management:', hasSessionMgmt ? '✅' : '❌');
    console.log('Sign Out:', hasSignOut ? '✅' : '❌');
    console.log('Sign-In Button:', hasSignInButton ? '✅' : '❌');
    console.log('Old Google Auth Removed:', !hasOldGoogleAuth ? '✅' : '❌');
    console.log('========================================\n');
    
    expect(hasSupabaseLib).toBe(true);
    expect(hasSupabaseClient).toBe(true);
    expect(hasOAuthSignIn).toBe(true);
    expect(hasSessionMgmt).toBe(true);
    expect(hasSignOut).toBe(true);
    expect(hasSignInButton).toBe(true);
    expect(hasOldGoogleAuth).toBe(false);
  });

  test('chat.html has correct Supabase implementation structure', () => {
    const chatHtmlPath = join(process.cwd(), 'chat.html');
    const chatHtml = readFileSync(chatHtmlPath, 'utf-8');
    
    const checks = {
      supabaseUrlConfig: chatHtml.includes('SUPABASE_URL') || chatHtml.includes('window.SUPABASE_URL'),
      supabaseKeyConfig: chatHtml.includes('SUPABASE_ANON_KEY') || chatHtml.includes('window.SUPABASE_ANON_KEY'),
      initializeFunction: chatHtml.includes('initializeSupabaseAuth') || chatHtml.includes('initializeSupabase'),
      signInHandler: chatHtml.includes('handleSupabaseSignInClick') || chatHtml.includes('signInWithOAuth'),
      redirectHandling: chatHtml.includes('redirectTo') || chatHtml.includes('redirect'),
      versionUpdated: chatHtml.includes('supabase-auth') || chatHtml.includes('Supabase Google OAuth')
    };
    
    console.log('\n=== Implementation Structure Check ===');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${key}:`, value ? '✅' : '❌');
    });
    console.log('=====================================\n');
    
    // At least most should be true
    const passCount = Object.values(checks).filter(Boolean).length;
    expect(passCount).toBeGreaterThanOrEqual(4);
  });
});

test.describe('Live Site Supabase Check', () => {
  test('Deployed site can load and check for Supabase (may not be deployed yet)', async ({ page }) => {
    // Test the deployed site
    await page.goto('https://chat.formul8.ai', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    await page.waitForTimeout(3000);
    
    // Check what's actually on the page
    const pageInfo = await page.evaluate(() => {
      return {
        hasSupabaseScript: !!document.querySelector('script[src*="supabase"]'),
        hasGoogleScript: !!document.querySelector('script[src*="accounts.google.com/gsi"]'),
        versionText: document.querySelector('#versionInfo')?.textContent || 'not found',
        hasSignInButton: !!(document.querySelector('.supabase-signin-button') || 
                           Array.from(document.querySelectorAll('button')).find(b => 
                             b.textContent.includes('Sign in')
                           ))
      };
    });
    
    console.log('\n=== Live Site Check ===');
    console.log('Supabase Script:', pageInfo.hasSupabaseScript ? '✅' : '❌');
    console.log('Old Google Script:', pageInfo.hasGoogleScript ? '⚠️ Still present' : '✅ Removed');
    console.log('Version:', pageInfo.versionText);
    console.log('Sign-In Button:', pageInfo.hasSignInButton ? '✅' : '❌');
    console.log('========================\n');
    
    // Informational - won't fail if not deployed yet
    if (!pageInfo.hasSupabaseScript) {
      console.log('ℹ️ Supabase auth may not be deployed yet to live site');
    }
  });
});
