/**
 * Serverless Function for Basic Authentication
 * Protects all pages with username/password
 */

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const { page } = req.query;
  const authHeader = req.headers.authorization;

  // Get credentials from environment variables
  const expectedUsername = process.env.AUTH_USERNAME || 'admin';
  const expectedPassword = process.env.AUTH_PASSWORD || 'changeme';

  // Check authentication
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username !== expectedUsername || password !== expectedPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Invalid credentials');
  }

  // Authentication successful - serve the requested page
  try {
    let filePath;
    
    if (!page || page === '') {
      filePath = path.join(process.cwd(), 'public', 'index.html');
    } else if (page === 'chat') {
      filePath = path.join(process.cwd(), 'public', 'chat.html');
    } else if (page.endsWith('.html')) {
      filePath = path.join(process.cwd(), 'public', page);
    } else {
      filePath = path.join(process.cwd(), 'public', page);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // If it doesn't end with .html, try adding it
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        return res.status(404).send('Page not found');
      }
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const contentType = filePath.endsWith('.html') ? 'text/html' : 'text/plain';
    
    res.setHeader('Content-Type', contentType);
    res.status(200).send(content);
  } catch (error) {
    console.error('Error serving page:', error);
    res.status(500).send('Internal server error');
  }
};

