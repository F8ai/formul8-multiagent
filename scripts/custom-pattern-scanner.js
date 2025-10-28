#!/usr/bin/env node

/**
 * Custom Pattern Scanner for Sensitive Data
 * Extend this script to scan for any custom patterns you need
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

// 🔧 CUSTOM PATTERNS - Add your patterns here!
const CUSTOM_PATTERNS = [
  // API Keys
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'CRITICAL',
    description: 'OpenAI API keys'
  },
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-[a-zA-Z0-9]{32}/g,
    severity: 'CRITICAL',
    description: 'Anthropic Claude API keys'
  },
  {
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
    severity: 'CRITICAL',
    description: 'Google API keys'
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'CRITICAL',
    description: 'GitHub personal access tokens'
  },
  {
    name: 'GitHub App Token',
    pattern: /ghs_[a-zA-Z0-9]{36}/g,
    severity: 'CRITICAL',
    description: 'GitHub app tokens'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
    description: 'AWS access keys'
  },
  {
    name: 'AWS Secret Key',
    pattern: /[A-Za-z0-9/+=]{40}/g,
    severity: 'HIGH',
    description: 'AWS secret keys (40 chars)'
  },
  {
    name: 'Slack Bot Token',
    pattern: /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g,
    severity: 'HIGH',
    description: 'Slack bot tokens'
  },
  {
    name: 'Slack App Token',
    pattern: /xapp-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g,
    severity: 'HIGH',
    description: 'Slack app tokens'
  },
  {
    name: 'Discord Bot Token',
    pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
    severity: 'HIGH',
    description: 'Discord bot tokens'
  },
  {
    name: 'Stripe API Key',
    pattern: /sk_live_[a-zA-Z0-9]{24}/g,
    severity: 'CRITICAL',
    description: 'Stripe live API keys'
  },
  {
    name: 'Stripe Test Key',
    pattern: /sk_test_[a-zA-Z0-9]{24}/g,
    severity: 'MEDIUM',
    description: 'Stripe test API keys'
  },
  {
    name: 'PayPal Client ID',
    pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
    severity: 'MEDIUM',
    description: 'PayPal client IDs'
  },
  {
    name: 'Twilio API Key',
    pattern: /SK[0-9a-fA-F]{32}/g,
    severity: 'HIGH',
    description: 'Twilio API keys'
  },
  {
    name: 'SendGrid API Key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: 'HIGH',
    description: 'SendGrid API keys'
  },
  {
    name: 'Mailgun API Key',
    pattern: /key-[a-zA-Z0-9]{32}/g,
    severity: 'HIGH',
    description: 'Mailgun API keys'
  },
  {
    name: 'Firebase API Key',
    pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
    severity: 'MEDIUM',
    description: 'Firebase API keys'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'MEDIUM',
    description: 'JWT tokens'
  },
  {
    name: 'Database URL',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:\s]+:[^@\s]+@[^\/\s]+\/[^\s]+/g,
    severity: 'CRITICAL',
    description: 'Database connection strings'
  },
  {
    name: 'Redis URL',
    pattern: /redis:\/\/[^:\s]+:[^@\s]+@[^\/\s]+:[0-9]+/g,
    severity: 'HIGH',
    description: 'Redis connection strings'
  },
  {
    name: 'Email Password',
    pattern: /password["']?\s*[:=]\s*["'][^"']{8,}["']/gi,
    severity: 'HIGH',
    description: 'Email passwords in config'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    description: 'Private keys'
  },
  {
    name: 'SSH Private Key',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*?-----END OPENSSH PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    description: 'SSH private keys'
  },
  {
    name: 'Credit Card Number',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    severity: 'CRITICAL',
    description: 'Credit card numbers'
  },
  {
    name: 'SSN',
    pattern: /\b(?:[0-9]{3}-[0-9]{2}-[0-9]{4}|[0-9]{9})\b/g,
    severity: 'CRITICAL',
    description: 'Social Security Numbers'
  },
  {
    name: 'Phone Number',
    pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    severity: 'MEDIUM',
    description: 'Phone numbers'
  },
  {
    name: 'Email Address',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'LOW',
    description: 'Email addresses'
  },
  {
    name: 'IP Address',
    pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    severity: 'LOW',
    description: 'IP addresses'
  },
  {
    name: 'URL with Credentials',
    pattern: /https?:\/\/[^:\s]+:[^@\s]+@[^\s]+/g,
    severity: 'HIGH',
    description: 'URLs with embedded credentials'
  },
  {
    name: 'Environment Variable Assignment',
    pattern: /(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*["']([^"']+)["']/g,
    severity: 'MEDIUM',
    description: 'Environment variable assignments'
  },
  {
    name: 'Hardcoded Password',
    pattern: /(?:password|passwd|pwd)["']?\s*[:=]\s*["'][^"']{6,}["']/gi,
    severity: 'HIGH',
    description: 'Hardcoded passwords'
  },
  {
    name: 'API Key Assignment',
    pattern: /(?:api[_-]?key|apikey)["']?\s*[:=]\s*["']([^"']+)["']/gi,
    severity: 'HIGH',
    description: 'API key assignments'
  },
  {
    name: 'Secret Assignment',
    pattern: /(?:secret|token)["']?\s*[:=]\s*["']([^"']+)["']/gi,
    severity: 'HIGH',
    description: 'Secret/token assignments'
  }
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
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  // Add more exclusions as needed
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
  severity: args.find(arg => arg.startsWith('--severity='))?.split('=')[1],
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  scanAll: args.includes('--scan-all'),
  base: args.find(arg => arg.startsWith('--base='))?.split('=')[1] || 'origin/main',
  head: args.find(arg => arg.startsWith('--head='))?.split('=')[1] || 'HEAD',
};

class CustomPatternScanner {
  constructor(options) {
    this.options = options;
    this.findings = [];
    this.fixedFiles = new Set();
    this.patterns = this.filterPatterns();
  }

  filterPatterns() {
    let patterns = CUSTOM_PATTERNS;
    
    // Filter by specific pattern name
    if (this.options.pattern) {
      patterns = patterns.filter(p => 
        p.name.toLowerCase().includes(this.options.pattern.toLowerCase())
      );
    }
    
    // Filter by severity
    if (this.options.severity) {
      patterns = patterns.filter(p => 
        p.severity.toLowerCase() === this.options.severity.toLowerCase()
      );
    }
    
    return patterns;
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
        const output = execSync('git ls-files', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(Boolean);
      } else {
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

  // Get file content
  getFileContent(filePath) {
    try {
      return execSync(`git show HEAD:${filePath}`, { encoding: 'utf-8' });
    } catch (error) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return null;
    }
  }

  // Scan a single file for patterns
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
    
    this.patterns.forEach(pattern => {
      lines.forEach((line, lineNumber) => {
        const matches = line.matchAll(pattern.pattern);
        for (const match of matches) {
          const value = match[0];
          
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
            value: value,
            valuePreview: this.maskValue(value),
            pattern: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
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
      /xxx/i,
      /\.\.\./,  // Ellipsis
      /masked/i,
      /redacted/i,
    ];

    // Check if file is documentation
    if (/\.(md|txt)$/i.test(filePath)) {
      return docIndicators.some(pattern => pattern.test(line));
    }

    return false;
  }

  // Mask sensitive values for display
  maskValue(value) {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  // Generate report
  generateReport() {
    if (this.findings.length === 0) {
      this.success('No sensitive data found! 🎉');
      return 0;
    }

    this.log('\n' + '='.repeat(80), 'red');
    this.error(`SECURITY ALERT: Found ${this.findings.length} sensitive data pattern(s)`);
    this.log('='.repeat(80) + '\n', 'red');

    // Group findings by severity
    const bySeverity = this.findings.reduce((acc, finding) => {
      if (!acc[finding.severity]) {
        acc[finding.severity] = [];
      }
      acc[finding.severity].push(finding);
      return acc;
    }, {});

    // Display by severity (CRITICAL first)
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    severityOrder.forEach(severity => {
      if (bySeverity[severity]) {
        this.log(`\n🔴 ${severity} SEVERITY (${bySeverity[severity].length} findings):`, 'red');
        bySeverity[severity].forEach(finding => {
          this.log(`   📄 ${finding.file}:${finding.line}`, 'yellow');
          this.log(`      Pattern: ${finding.pattern}`, 'cyan');
          this.log(`      Preview: ${finding.valuePreview}`, 'magenta');
          this.log(`      Content: ${finding.lineContent.substring(0, 80)}...`, 'cyan');
        });
      }
    });

    this.log('\n' + '='.repeat(80), 'yellow');
    this.warning('ACTION REQUIRED:');
    this.log('='.repeat(80) + '\n', 'yellow');

    this.info('1. Review each finding carefully');
    this.info('2. Remove or mask sensitive data');
    this.info('3. Use environment variables or secrets management');
    this.info('4. Consider if the data should be in the repository at all');

    return 1;
  }

  // Main execution
  async run() {
    this.log('\n🔍 Custom Pattern Scanner', 'blue');
    this.log('=' .repeat(80) + '\n', 'blue');

    this.log(`Scanning for ${this.patterns.length} pattern(s):`, 'cyan');
    this.patterns.forEach(pattern => {
      this.log(`  • ${pattern.name} (${pattern.severity})`, 'cyan');
    });
    this.log('');

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

    // Generate report
    const exitCode = this.generateReport();

    return exitCode;
  }
}

// Execute if run directly
if (require.main === module) {
  const scanner = new CustomPatternScanner(options);
  scanner.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = CustomPatternScanner;
