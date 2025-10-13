# Formul8 Multiagent System

[![Baseline Integration](https://github.com/F8ai/formul8-multiagent/actions/workflows/baseline-integration.yml/badge.svg)](https://github.com/F8ai/formul8-multiagent/actions/workflows/baseline-integration.yml)

A comprehensive multiagent system for cannabis industry operations, featuring specialized agents for compliance, formulation, science, operations, marketing, and more.

## 🚀 Features

- **Multiagent Orchestration**: Intelligent routing between specialized agents
- **Automated Baseline Integration**: Continuous integration and testing of agent baselines
- **Comprehensive Testing**: Automated testing framework with Playwright
- **API Gateway**: Unified API endpoint for all agents
- **Real-time Monitoring**: Health checks and performance monitoring
- **Flexible Configuration**: Tiered access control and dynamic agent routing

## 📁 Repository Structure

```
formul8-multiagent/
├── .github/
│   └── workflows/
│       └── baseline-integration.yml    # Automated baseline integration workflow
├── config/                             # Agent and routing configurations
├── docs/                               # Documentation and web interfaces
├── examples/                           # Example baseline formats and usage
│   ├── README.md                       # Detailed examples documentation
│   └── baseline-formats/               # Sample baseline.json files
├── scripts/                            # Automation and utility scripts
│   ├── README.md                       # Scripts documentation
│   ├── fetch-baselines.js              # Fetch baselines from organization repos
│   ├── merge-baselines.js              # Merge multiple baseline files
│   └── test-baselines.js               # Test baselines against API
├── tests/                              # Playwright test suites
├── baseline.json                       # Unified baseline questions
└── baseline-results.json               # Latest test results
```

## 🤖 Baseline Integration System

The repository includes an automated system for integrating and testing baseline questions from all agent repositories in the F8ai organization.

### How It Works

1. **Fetch**: Automatically discovers and fetches `baseline.json` files from all agent repositories
2. **Merge**: Merges individual baselines into a unified `baseline.json`, removing duplicates
3. **Test**: Tests all questions against the `/api/chat` endpoint at `f8.syzygyx.com`
4. **Validate**: Compares responses with expected answers using keyword matching
5. **Grade**: Calculates success rates and assigns performance grades (A+ to F)
6. **Report**: Generates detailed `baseline-results.json` with results and metrics

### Running the Workflow

#### Automated (GitHub Actions)
The workflow runs automatically:
- **Daily at 2 AM UTC** (scheduled)
- **On demand** via manual trigger

#### Manual Execution
```bash
# Install dependencies
npm install

# Fetch baselines from organization repositories
GITHUB_TOKEN=your_token node scripts/fetch-baselines.js

# Merge baselines into unified file
node scripts/merge-baselines.js

# Test against API endpoint
node scripts/test-baselines.js

# View results
cat baseline-results.json
```

### Creating a Baseline for Your Agent

1. Create a `baseline.json` file in your agent repository root
2. Use one of the supported formats (see [examples/README.md](examples/README.md))
3. Include expected answers for validation
4. Test locally before committing

**Recommended Format:**
```json
{
  "questions": [
    {
      "question": "Your question here?",
      "expected_answer": "The expected response content...",
      "category": "your_agent_category",
      "metadata": {
        "difficulty": "intermediate",
        "tags": ["tag1", "tag2"]
      }
    }
  ]
}
```

See [examples/README.md](examples/README.md) for more formats and detailed guidance.

## 📊 Test Results

Latest test results are available in `baseline-results.json` and as workflow artifacts.

**Key Metrics:**
- Success Rate: Percentage of questions answered successfully
- Validation Rate: Percentage of questions matching expected answers
- Response Times: Average, min, and max response times
- Category Breakdown: Per-category performance statistics
- Overall Grade: Performance grade from A+ to F

## 🧪 Testing

### Baseline Testing
```bash
# Test all baselines
node scripts/test-baselines.js

# Test with custom endpoint
API_ENDPOINT=https://custom-api.com/chat node scripts/test-baselines.js
```

### Playwright Tests
```bash
# Install Playwright
npx playwright install --with-deps

# Run tests
npx playwright test

# View report
npx playwright show-report
```

### Agent-Specific Tests
```bash
# Test all agents
node test-all-agents-baseline.js

# Test key agents
node test-key-agents.js

# Test specific agent baselines
node test-agent-baselines.js
```

## 📚 Documentation

- **[scripts/README.md](scripts/README.md)**: Detailed documentation for baseline integration scripts
- **[examples/README.md](examples/README.md)**: Examples and best practices for creating baselines
- **[tests/README.md](tests/README.md)**: Comprehensive testing guide

## 🔧 Configuration

### Agent Configuration
Agent configurations are stored in `config/agents.json`:
- Agent URLs and endpoints
- Specialties and keywords
- Routing priorities

### Pricing Tiers
Tier configurations in `config/pricing-tiers.json`:
- Agent access per tier (free, standard, micro, operator, enterprise, admin)
- Feature flags and limitations

### Models
Model configurations in `config/models.json`:
- Available AI models
- Cost and performance characteristics

## 🚦 Health Monitoring

Check system health:
```bash
node scripts/health-check.js
```

## 🤝 Contributing

### Adding a New Agent

1. Create your agent repository in the F8ai organization
2. Add a `baseline.json` file in the repository root
3. Update `config/agents.json` with your agent configuration
4. The baseline integration workflow will automatically pick up your baselines

### Improving Baselines

1. Update your agent's `baseline.json` file
2. Test locally using `node scripts/test-baselines.js`
3. Commit and push to your repository
4. The workflow will merge and test on the next run

### Adding Tests

1. Add test files to the `tests/` directory
2. Follow existing test patterns
3. Run tests locally before committing
4. Update test documentation

## 📈 Performance Grading

The system grades overall performance based on success rate:

| Grade | Success Rate | Status |
|-------|--------------|--------|
| A+ | 95-100% | 🏆 Exceptional |
| A | 90-95% | 🌟 Excellent |
| B+ | 85-90% | ✅ Very Good |
| B | 80-85% | 👍 Good |
| C+ | 75-80% | ⚠️ Needs Improvement |
| C | 70-75% | ⚠️ Poor |
| F | <70% | ❌ Failing |

## 🔐 Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token for API access
- `API_ENDPOINT`: API endpoint to test against (default: `https://f8.syzygyx.com/api/chat`)

## 📝 License

MIT License - See LICENSE file for details

## 📞 Support

For issues or questions:
- Check the documentation in `scripts/README.md` and `examples/README.md`
- Review test logs and artifacts
- Open an issue in the repository
- Contact the development team

## 🎯 Roadmap

- [ ] Add support for more baseline formats
- [ ] Implement semantic similarity matching for validation
- [ ] Add performance benchmarking and trends
- [ ] Create dashboard for baseline results visualization
- [ ] Add automatic issue creation for failing tests
- [ ] Implement A/B testing for baseline variations
- [ ] Add multi-language support for questions

---

**Built with ❤️ by the Formul8 AI Team**
