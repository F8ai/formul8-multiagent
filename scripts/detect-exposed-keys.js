#!/usr/bin/env node

/**
 * OpenRouter API Key Detection and Remediation Script
 * Scans git diffs for exposed OpenRouter API keys and provides automated remediation
 * 
 * Usage:
 *   node scripts/detect-exposed-keys.js [--fix] [--base=main] [--head=HEAD]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// OpenRouter API key patterns
const KEY_PATTERNS = [
  {
    name: 'OpenRouter API Key',
    pattern: /sk-or-v1-[a-zA-Z0-9]{64}/g,
    severity: 'CRITICAL',
  },
  {
    name: 'OpenRouter Provisioning Key',
    pattern: /OPENROUTER_(?:API_KEY|PROVISIONING_KEY)\s*=\s*["']?(sk-or-v1-[a-zA-Z0-9]{64})["']?/g,
    severity: 'CRITICAL',
    extractGroup: 1,
  },
  {
    name: 'Authorization Bearer Token (OpenRouter)',
    pattern: /Authorization["']?\s*:\s*["']Bearer\s+(sk-or-v1-[a-zA-Z0-9]{64})["']?/g,
    severity: 'HIGH',
    extractGroup: 1,
  },
];

// Files/paths to exclude from scanning
const EXCLUSIONS = [
  /node_modules\//,
  /\.git\//,
  /\.next\//,
  /dist\//,
  /build\//,
  /coverage\//,
  /\.env\.example$/,
  /\.env\.template$/,
  /README\.md$/i,
  /SECURITY\.md$/i,
  // Allow documentation about key format (not actual keys)
  /\/docs\/.*\.md$/,
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  base: args.find(arg => arg.startsWith('--base='))?.split('=')[1] || 'origin/main',
  head: args.find(arg => arg.startsWith('--head='))?.split('=')[1] || 'HEAD',
  scanAll: args.includes('--scan-all'),
  verbose: args.includes('--verbose'),
};

class KeyDetector {
  constructor(options) {
    this.options = options;
    this.findings = [];
    this.fixedFiles = new Set();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  // Get list of changed files
  getChangedFiles() {
    try {
      if (this.options.scanAll) {
        // Scan all tracked files
        const output = execSync('git ls-files', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(Boolean);
      } else {
        // Get files changed in the current commit/PR
        const output = execSync(
          `git diff --name-only ${this.options.base}...${this.options.head}`,
          { encoding: 'utf-8' }
        );
        return output.trim().split('\n').filter(Boolean);
      }
    } catch (error) {
      this.warning('Unable to get git diff, scanning staged files');
      try {
        const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(Boolean);
      } catch (e) {
        this.error('Failed to get changed files');
        return [];
      }
    }
  }

  // Check if file should be excluded
  shouldExclude(filePath) {
    return EXCLUSIONS.some(pattern => pattern.test(filePath));
  }

  // Get file content (from git or filesystem)
  getFileContent(filePath) {
    try {
      // Try to read from HEAD
      return execSync(`git show HEAD:${filePath}`, { encoding: 'utf-8' });
    } catch (error) {
      // Fall back to filesystem (for new files)
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return null;
    }
  }

  // Scan a single file for exposed keys
  scanFile(filePath) {
    if (this.shouldExclude(filePath)) {
      if (this.options.verbose) {
        this.info(`Skipping excluded file: ${filePath}`);
      }
      return;
    }

    const content = this.getFileContent(filePath);
    if (!content) {
      return;
    }

    const lines = content.split('\n');
    
    KEY_PATTERNS.forEach(pattern => {
      lines.forEach((line, lineNumber) => {
        const matches = line.matchAll(pattern.pattern);
        for (const match of matches) {
          const key = pattern.extractGroup ? match[pattern.extractGroup] : match[0];
          
          // Skip if this looks like documentation/example
          if (this.isDocumentationExample(line, filePath)) {
            if (this.options.verbose) {
              this.info(`Skipping documentation example in ${filePath}:${lineNumber + 1}`);
            }
            continue;
          }

          this.findings.push({
            file: filePath,
            line: lineNumber + 1,
            column: match.index,
            key: key,
            keyPreview: `${key.substring(0, 20)}...${key.substring(key.length - 4)}`,
            pattern: pattern.name,
            severity: pattern.severity,
            lineContent: line.trim(),
          });
        }
      });
    });
  }

  // Check if line is likely documentation/example
  isDocumentationExample(line, filePath) {
    const docIndicators = [
      /example/i,
      /sample/i,
      /template/i,
      /placeholder/i,
      /your-key-here/i,
      /sk-or-v1-xxx/,
      /sk-or-v1-\.\.\./,
      /\.\.\./,  // Ellipsis in key
    ];

    // Check if file is documentation
    if (/\.(md|txt)$/i.test(filePath)) {
      return docIndicators.some(pattern => pattern.test(line));
    }

    return false;
  }

  // Remove exposed keys from a file
  fixFile(finding) {
    const filePath = finding.file;
    
    if (!fs.existsSync(filePath)) {
      this.warning(`Cannot fix ${filePath}: file not found`);
      return false;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Replace the exposed key with a placeholder
      KEY_PATTERNS.forEach(pattern => {
        content = content.replace(pattern.pattern, (match, group1) => {
          // If we're in a documentation file, replace with clear example
          if (/\.(md|txt)$/i.test(filePath)) {
            return 'sk-or-v1-your-key-here';
          }
          
          // For code files, replace with environment variable reference
          if (match.includes('Authorization')) {
            return match.replace(group1 || match, '${process.env.OPENROUTER_API_KEY}');
          }
          
          // For assignment statements
          if (match.includes('=')) {
            return match.split('=')[0] + '= "YOUR_KEY_HERE_USE_ENV_VARS"';
          }
          
          // Default: clear placeholder
          return 'sk-or-v1-REMOVED-EXPOSED-KEY';
        });
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        this.fixedFiles.add(filePath);
        return true;
      }

      return false;
    } catch (error) {
      this.error(`Failed to fix ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Revoke key on OpenRouter using Provisioning API
  async revokeKey(key) {
    const provisioningKey = process.env.OPENROUTER_PROVISIONING_KEY;
    
    if (!provisioningKey) {
      this.warning(`Manual action required: Revoke key ${key.substring(0, 20)}... on OpenRouter dashboard`);
      this.info('Visit: https://openrouter.ai/keys');
      this.info('Or set OPENROUTER_PROVISIONING_KEY to enable automatic revocation');
      return false;
    }

    this.info(`Attempting to revoke key ${key.substring(0, 20)}...`);

    try {
      // First, list all keys to find the key ID for the exposed key
      const keys = await this.listOpenRouterKeys(provisioningKey);
      
      // Find the key by matching the actual key value (requires listing with details)
      // Note: The API may not return full keys, so we'll need to match by usage/creation date
      this.warning('Note: OpenRouter API requires key ID, not the key itself');
      this.warning('To revoke this key:');
      this.info(`1. List keys: node scripts/openrouter-key-manager.js list`);
      this.info(`2. Find key ending in ...${key.slice(-4)}`);
      this.info(`3. Delete it: node scripts/openrouter-key-manager.js delete --key-id=<id>`);
      
      return false;
    } catch (error) {
      this.error(`Failed to revoke key automatically: ${error.message}`);
      this.warning(`Manual action required: Revoke key on OpenRouter dashboard`);
      this.info('Visit: https://openrouter.ai/keys');
      return false;
    }
  }

  // List all OpenRouter keys using Provisioning API
  async listOpenRouterKeys(provisioningKey) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      
      const options = {
        hostname: 'openrouter.ai',
        path: '/api/v1/keys',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provisioningKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json.data || []);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Generate report
  generateReport() {
    if (this.findings.length === 0) {
      this.success('No exposed OpenRouter API keys found! 🎉');
      return 0;
    }

    this.log('\n' + '='.repeat(80), 'red');
    this.error(`SECURITY ALERT: Found ${this.findings.length} exposed OpenRouter API key(s)`);
    this.log('='.repeat(80) + '\n', 'red');

    // Group findings by file
    const byFile = this.findings.reduce((acc, finding) => {
      if (!acc[finding.file]) {
        acc[finding.file] = [];
      }
      acc[finding.file].push(finding);
      return acc;
    }, {});

    Object.entries(byFile).forEach(([file, findings]) => {
      this.log(`\n📄 ${file}`, 'yellow');
      findings.forEach(finding => {
        this.log(`   Line ${finding.line}: ${finding.pattern} (${finding.severity})`, 'red');
        this.log(`   Preview: ${finding.keyPreview}`, 'magenta');
        this.log(`   Content: ${finding.lineContent.substring(0, 80)}...`, 'cyan');
      });
    });

    this.log('\n' + '='.repeat(80), 'yellow');
    this.warning('ACTION REQUIRED:');
    this.log('='.repeat(80) + '\n', 'yellow');

    this.info('1. These keys have been exposed in the repository');
    this.info('2. They must be revoked immediately on OpenRouter dashboard');
    this.info('3. Generate new keys and store them securely');
    this.info('4. Use environment variables or secrets management');
    
    if (!this.options.fix) {
      this.log('\n💡 Run with --fix to automatically remove exposed keys from files\n', 'cyan');
    }

    return 1;
  }

  // Main execution
  async run() {
    this.log('\n🔍 OpenRouter API Key Scanner', 'blue');
    this.log('=' .repeat(80) + '\n', 'blue');

    const files = this.getChangedFiles();
    
    if (files.length === 0) {
      this.info('No files to scan');
      return 0;
    }

    this.info(`Scanning ${files.length} file(s)...\n`);

    // Scan all files
    files.forEach(file => {
      this.scanFile(file);
    });

    // Fix files if requested
    if (this.options.fix && this.findings.length > 0) {
      this.log('\n🔧 Attempting to fix exposed keys...', 'yellow');
      
      this.findings.forEach(finding => {
        if (this.fixFile(finding)) {
          this.success(`Fixed: ${finding.file}:${finding.line}`);
        }
      });

      if (this.fixedFiles.size > 0) {
        this.log('\n📝 Fixed files:', 'green');
        this.fixedFiles.forEach(file => this.log(`   - ${file}`, 'green'));
        this.log('\n⚠️  Remember to:', 'yellow');
        this.info('   1. Review the changes');
        this.info('   2. Revoke the exposed keys');
        this.info('   3. Update with new keys in secrets/environment variables');
        this.info('   4. Commit the fixes');
      }
    }

    // Generate report
    const exitCode = this.generateReport();

    // Suggest using GitHub secret scanning
    if (exitCode !== 0) {
      this.log('\n💡 Additional Security Measures:', 'cyan');
      this.info('   - Enable GitHub secret scanning in repository settings');
      this.info('   - Add pre-commit hooks to prevent key commits');
      this.info('   - Use a secrets management service (AWS Secrets Manager, Vault, etc.)');
      this.info('   - Implement automated key rotation');
    }

    return exitCode;
  }
}

// Execute if run directly
if (require.main === module) {
  const detector = new KeyDetector(options);
  detector.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = KeyDetector;

