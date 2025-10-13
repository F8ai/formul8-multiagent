#!/usr/bin/env node

/**
 * Fetch baseline.json files from all agent repositories in the F8ai organization
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = 'F8ai';
const OUTPUT_DIR = path.join(process.cwd(), 'baselines-raw');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Make GitHub API request
 */
function makeGitHubRequest(requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: requestPath,
      method: method,
      headers: {
        'User-Agent': 'F8ai-Baseline-Fetcher',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(data);
          }
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`GitHub API request failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Get all repositories in the organization
 */
async function getOrgRepositories() {
  console.log(`🔍 Fetching repositories from ${ORG_NAME} organization...`);
  
  const repos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const pageRepos = await makeGitHubRequest(`/orgs/${ORG_NAME}/repos?per_page=100&page=${page}`);
      
      if (pageRepos && pageRepos.length > 0) {
        repos.push(...pageRepos);
        page++;
        hasMore = pageRepos.length === 100;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`❌ Error fetching repositories: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`✅ Found ${repos.length} repositories in ${ORG_NAME}`);
  return repos;
}

/**
 * Fetch baseline.json from a repository
 */
async function fetchBaselineFromRepo(repoName) {
  try {
    console.log(`  📥 Checking ${repoName} for baseline.json...`);
    
    const content = await makeGitHubRequest(`/repos/${ORG_NAME}/${repoName}/contents/baseline.json`);
    
    if (content && content.content) {
      // Decode base64 content
      const baselineContent = Buffer.from(content.content, 'base64').toString('utf8');
      const baseline = JSON.parse(baselineContent);
      
      // Save to output directory
      const outputPath = path.join(OUTPUT_DIR, `${repoName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(baseline, null, 2));
      
      console.log(`  ✅ Fetched baseline.json from ${repoName}`);
      return { repoName, baseline, found: true };
    } else {
      console.log(`  ⏭️  No baseline.json found in ${repoName}`);
      return { repoName, found: false };
    }
  } catch (error) {
    console.log(`  ⚠️  Error fetching from ${repoName}: ${error.message}`);
    return { repoName, found: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting baseline.json fetcher');
  console.log('='.repeat(60));
  
  if (!GITHUB_TOKEN) {
    console.warn('⚠️  GITHUB_TOKEN not set. API rate limits will be lower.');
  }

  // Get all repositories
  const repos = await getOrgRepositories();
  
  // Filter for agent repositories (those with 'agent' in the name)
  const agentRepos = repos
    .filter(repo => repo.name.includes('agent') || repo.name.includes('formul8'))
    .map(repo => repo.name);
  
  console.log(`\n🎯 Found ${agentRepos.length} agent/formul8 repositories to check`);
  console.log('='.repeat(60));

  // Fetch baseline.json from each repository
  const results = {
    timestamp: new Date().toISOString(),
    totalRepos: agentRepos.length,
    found: [],
    notFound: [],
    errors: []
  };

  for (const repoName of agentRepos) {
    const result = await fetchBaselineFromRepo(repoName);
    
    if (result.found) {
      results.found.push(repoName);
    } else if (result.error) {
      results.errors.push({ repo: repoName, error: result.error });
    } else {
      results.notFound.push(repoName);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save summary
  const summaryPath = path.join(OUTPUT_DIR, 'fetch-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FETCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total repositories checked: ${results.totalRepos}`);
  console.log(`✅ Found baseline.json: ${results.found.length}`);
  console.log(`⏭️  No baseline.json: ${results.notFound.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.found.length > 0) {
    console.log('\n📦 Repositories with baseline.json:');
    results.found.forEach(repo => console.log(`  - ${repo}`));
  }

  console.log(`\n💾 Raw baseline files saved to: ${OUTPUT_DIR}`);
  console.log(`💾 Summary saved to: ${summaryPath}`);
  console.log('\n✅ Baseline fetching completed!');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, getOrgRepositories, fetchBaselineFromRepo };
