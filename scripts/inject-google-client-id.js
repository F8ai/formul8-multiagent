#!/usr/bin/env node
/**
 * Inject Google Client ID into chat.html before deployment
 * This ensures the production Google OAuth credentials are used
 */

const fs = require('fs');
const path = require('path');

// Get Google Client ID from environment variable
const googleClientId = process.env.GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error('❌ Error: GOOGLE_CLIENT_ID environment variable not set');
  console.error('Please set GOOGLE_CLIENT_ID before deploying:');
  console.error('  export GOOGLE_CLIENT_ID=your-client-id');
  process.exit(1);
}

// Path to chat.html
const chatHtmlPath = path.join(__dirname, '..', 'chat.html');
const publicChatHtmlPath = path.join(__dirname, '..', 'public', 'chat.html');

// Function to inject client ID into file
function injectClientId(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}, skipping...`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace placeholder with actual client ID
  const updatedContent = content.replace(
    /const GOOGLE_CLIENT_ID = ['"]YOUR_GOOGLE_CLIENT_ID['"];/,
    `const GOOGLE_CLIENT_ID = '${googleClientId}';`
  );
  
  if (content === updatedContent) {
    console.log(`⚠️  No placeholder found in ${filePath}`);
    return false;
  }
  
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`✅ Updated ${filePath} with Google Client ID`);
  return true;
}

// Inject into both locations
console.log('🔧 Injecting Google Client ID into chat.html files...');
console.log('');

let updated = false;
updated = injectClientId(chatHtmlPath) || updated;
updated = injectClientId(publicChatHtmlPath) || updated;

if (!updated) {
  console.error('❌ Failed to update any files');
  process.exit(1);
}

console.log('');
console.log('✨ Google Client ID injection complete!');
console.log('');
console.log('Note: Make sure to set up the following environment variables in Vercel:');
console.log('  - GOOGLE_CLIENT_ID');
console.log('  - GOOGLE_CLIENT_SECRET');
console.log('  - JWT_SECRET');
console.log('');


