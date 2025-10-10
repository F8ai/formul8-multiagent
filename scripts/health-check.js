#!/usr/bin/env node

/**
 * Comprehensive Health Check Script for Formul8 Microservices
 */

const microservices = [
  { name: 'formul8-platform', port: 3000, url: 'http://localhost:3000' },
  { name: 'compliance-agent', port: 3001, url: 'http://localhost:3001' },
  { name: 'formulation-agent', port: 3002, url: 'http://localhost:3002' },
  { name: 'science-agent', port: 3003, url: 'http://localhost:3003' },
  { name: 'operations-agent', port: 3004, url: 'http://localhost:3004' },
  { name: 'marketing-agent', port: 3005, url: 'http://localhost:3005' },
  { name: 'sourcing-agent', port: 3006, url: 'http://localhost:3006' },
  { name: 'patent-agent', port: 3007, url: 'http://localhost:3007' },
  { name: 'spectra-agent', port: 3008, url: 'http://localhost:3008' },
  { name: 'customer-success-agent', port: 3009, url: 'http://localhost:3009' },
  { name: 'f8-slackbot', port: 3010, url: 'http://localhost:3010' },
  { name: 'mcr-agent', port: 3011, url: 'http://localhost:3011' },
  { name: 'ad-agent', port: 3012, url: 'http://localhost:3012' }
];

async function checkService(service) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const startTime = Date.now();
    const response = await fetch(`${service.url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: service.name,
        port: service.port,
        status: 'healthy',
        responseTime: responseTime,
        details: data
      };
    } else {
      return {
        name: service.name,
        port: service.port,
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
        responseTime: responseTime
      };
    }
  } catch (error) {
    return {
      name: service.name,
      port: service.port,
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: 0
    };
  }
}

async function runHealthCheck() {
  console.log('🏥 Formul8 Microservice Health Check');
  console.log('=====================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const results = await Promise.allSettled(
    microservices.map(service => checkService(service))
  );

  const healthResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: microservices[index].name,
        port: microservices[index].port,
        status: 'error',
        error: result.reason?.message || 'Promise rejected',
        responseTime: 0
      };
    }
  });

  const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
  const totalCount = healthResults.length;

  console.log('📊 SUMMARY:');
  console.log(`Total Services: ${totalCount}`);
  console.log(`Healthy: ${healthyCount}`);
  console.log(`Unhealthy: ${healthResults.filter(r => r.status === 'unhealthy').length}`);
  console.log(`Down: ${healthResults.filter(r => r.status === 'down').length}`);
  console.log(`Error: ${healthResults.filter(r => r.status === 'error').length}`);
  console.log(`Health Percentage: ${Math.round((healthyCount / totalCount) * 100)}%`);
  console.log('');

  console.log('🔍 SERVICE DETAILS:');
  console.log('==================');
  
  healthResults.forEach(service => {
    const statusIcon = service.status === 'healthy' ? '✅' : 
                      service.status === 'unhealthy' ? '⚠️' : '❌';
    
    console.log(`${statusIcon} ${service.name} (port ${service.port})`);
    console.log(`   Status: ${service.status}`);
    if (service.responseTime > 0) {
      console.log(`   Response Time: ${service.responseTime}ms`);
    }
    if (service.error) {
      console.log(`   Error: ${service.error}`);
    }
    console.log('');
  });

  return {
    summary: {
      total: totalCount,
      healthy: healthyCount,
      unhealthy: healthResults.filter(r => r.status === 'unhealthy').length,
      down: healthResults.filter(r => r.status === 'down').length,
      error: healthResults.filter(r => r.status === 'error').length,
      healthPercentage: Math.round((healthyCount / totalCount) * 100)
    },
    services: healthResults
  };
}

runHealthCheck().catch(console.error);
