# Formul8 Scripts

## Baseline Management

### collect-baselines-from-repos.js

Collects `baseline.json` from all agent repositories and creates a master baseline file.

**Usage:**
```bash
node scripts/collect-baselines-from-repos.js
```

**What it does:**
1. Clones/pulls all agent repositories to `.agent-repos/`
2. Searches for `baseline.json` in each repo
3. Concatenates all questions into master `baseline.json`
4. Generates `baseline-summary.md` with statistics
5. Updates `.gitignore` to exclude temp repos

**Output:**
- `baseline.json` - Master baseline with all questions
- `baseline-summary.md` - Statistics and samples
- `.agent-repos/` - Temporary cloned repos (gitignored)

### concat-baselines.js

Concatenates `baseline.json` from agent subdirectories in this monorepo.

**Usage:**
```bash
node scripts/concat-baselines.js
```

**Note:** Use `collect-baselines-from-repos.js` instead if agents are in separate repositories.

## Automation

### GitHub Actions

The baseline is automatically updated:

- **Daily**: At 2 AM UTC via scheduled workflow
- **On-demand**: Manual workflow dispatch
- **Triggered**: When agent repos push updates

See `.github/workflows/update-baseline.yml`

## Agent Repositories

Expected repositories under GitHub org `F8ai`:

- compliance-agent
- science-agent
- formulation-agent
- marketing-agent
- patent-agent
- operations-agent
- sourcing-agent
- spectra-agent
- mcr-agent
- customer-success-agent
- ad-agent
- editor-agent
- f8-slackbot

## Baseline Format

Each agent's `baseline.json` should follow this format:

```json
{
  "metadata": {
    "generatedAt": "2025-10-21T00:00:00.000Z",
    "agent": "compliance-agent",
    "version": "1.0",
    "description": "Baseline questions for compliance agent"
  },
  "questions": [
    {
      "id": "compliance-001",
      "question": "What are compliance requirements?",
      "category": "compliance",
      "expectedAgent": "compliance",
      "tier": "micro",
      "tags": ["regulatory", "requirements"],
      "difficulty": "medium"
    }
  ]
}
```

## Contributing

To add new baseline questions:

1. Add questions to your agent's `baseline.json`
2. Commit and push to your agent repo
3. Run collection script or wait for daily update
4. Verify in master `baseline.json`

## Troubleshooting

**Script fails to clone repos:**
- Check GitHub access token
- Verify repository names
- Ensure repos exist under org

**No questions collected:**
- Verify `baseline.json` exists in agent repo
- Check JSON format is valid
- Ensure `questions` array exists

**Questions not appearing in chat:**
- Check `chat.html` loads `/baseline.json`
- Verify baseline.json is deployed
- Clear browser cache
