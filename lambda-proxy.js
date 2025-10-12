const https = require('https');

exports.handler = async (event, context) => {
  const appRunnerUrl = 'https://wmzmdyv63h.us-east-1.awsapprunner.com';
  
  // Extract the path from the event
  const path = event.path || '/';
  const httpMethod = event.httpMethod || 'GET';
  const headers = event.headers || {};
  const body = event.body || '';
  
  // Forward the request to App Runner
  const targetUrl = `${appRunnerUrl}${path}`;
  
  try {
    const response = await makeRequest(targetUrl, {
      method: httpMethod,
      headers: {
        ...headers,
        'host': 'wmzmdyv63h.us-east-1.awsapprunner.com'
      },
      body: body
    });
    
    return {
      statusCode: response.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: response.body
    };
  } catch (error) {
    console.error('Error proxying request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}