const fs = require('fs');
const path = require('path');

const LOCAL_AGENT_REPOS = '/Users/danielmcshan/GitHub';

const agents = [
  'compliance-agent',
  'operations-agent',
  'marketing-agent',
  'formulation-agent',
  'science-agent',
  'spectra-agent',
  'customer-success-agent',
  'ad-agent'
];

const masterBaseline = {
  metadata: {
    generatedAt: new Date().toISOString(),
    source: 'Local agent repositories',
    description: 'Master baseline from Tech Ops validation questions'
  },
  questions: []
};

console.log('📦 Collecting baseline.json from local agent repos\n');

for (const agent of agents) {
  const baselinePath = path.join(LOCAL_AGENT_REPOS, agent, 'baseline.json');
  
  if (fs.existsSync(baselinePath)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      if (baseline.questions && Array.isArray(baseline.questions)) {
        console.log(`✅ ${agent}: ${baseline.questions.length} questions`);
        masterBaseline.questions.push(...baseline.questions);
      }
    } catch (e) {
      console.log(`❌ ${agent}: Error reading baseline`);
    }
  } else {
    console.log(`⚠️  ${agent}: No baseline.json found`);
  }
}

fs.writeFileSync('baseline.json', JSON.stringify(masterBaseline, null, 2));
console.log(`\n✅ Created master baseline.json with ${masterBaseline.questions.length} questions`);
