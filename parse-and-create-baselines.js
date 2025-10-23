#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Parse compliance questions
function parseComplianceQuestions() {
  const text = fs.readFileSync('temp-validation/Compliance Validation Questions.txt', 'utf8');
  const lines = text.split('\n');
  const questions = [];
  let category = '';
  let id = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line && !line.startsWith('•') && !line.startsWith('Notes:') && !line.startsWith('Questions') && !line.startsWith('Compliance Validation')) {
      const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
      if (nextLine.startsWith('•') || nextLine === '') {
        category = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      }
    }
    
    if (line.startsWith('•')) {
      const question = line.substring(1).trim();
      if (question && !question.includes('You can insert') && !question.includes('Remember, you')) {
        questions.push({
          id: `compliance-q${String(id).padStart(3, '0')}`,
          question: question,
          category: category || 'general',
          expectedAgent: 'compliance',
          source: 'tech-ops-validation'
        });
        id++;
      }
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Tech Ops Validation Questions',
      version: '1.0.0',
      description: 'Compliance Agent baseline questions from Tech Ops Google Drive'
    },
    questions: questions
  };
}

// Parse operations questions
function parseOperationsQuestions() {
  const text = fs.readFileSync('temp-validation/Operations Validation Questions.txt', 'utf8');
  const lines = text.split('\n');
  const questions = [];
  let category = '';
  let id = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/^\d+\)/)) {
      category = line.replace(/^\d+\)\s*/, '').toLowerCase().replace(/[^a-z0-9\s&]/g, '').replace(/\s+/g, '-');
    }
    
    if (line.startsWith('•')) {
      const question = line.substring(1).trim();
      if (question) {
        questions.push({
          id: `operations-q${String(id).padStart(3, '0')}`,
          question: question,
          category: category || 'general',
          expectedAgent: 'operations',
          source: 'tech-ops-validation'
        });
        id++;
      }
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Tech Ops Validation Questions',
      version: '1.0.0',
      description: 'Operations Agent baseline questions from Tech Ops Google Drive'
    },
    questions: questions
  };
}

// Parse marketing questions
function parseMarketingQuestions() {
  const text = fs.readFileSync('temp-validation/Marketing Validation Questions_Kevin_Revised.txt', 'utf8');
  const lines = text.split('\n');
  const questions = [];
  let category = '';
  let id = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line && !line.startsWith('•') && !line.startsWith('Marketing Validation')) {
      const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
      if (nextLine.startsWith('•') || (line.includes('Marketing') || line.includes('Brand') || line.includes('Product'))) {
        category = line.toLowerCase().replace(/[^a-z0-9\s&]/g, '').replace(/\s+/g, '-');
      }
    }
    
    if (line.startsWith('•')) {
      const question = line.substring(1).trim();
      if (question) {
        questions.push({
          id: `marketing-q${String(id).padStart(3, '0')}`,
          question: question,
          category: category || 'general',
          expectedAgent: 'marketing',
          source: 'tech-ops-validation'
        });
        id++;
      }
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Tech Ops Validation Questions',
      version: '1.0.0',
      description: 'Marketing Agent baseline questions from Tech Ops Google Drive'
    },
    questions: questions
  };
}

// Main execution
console.log('🔄 Parsing validation questions and creating baseline.json files\n');

const complianceBaseline = parseComplianceQuestions();
fs.writeFileSync('/Users/danielmcshan/GitHub/compliance-agent/baseline.json', JSON.stringify(complianceBaseline, null, 2));
console.log(`✅ Compliance: ${complianceBaseline.questions.length} questions`);

const operationsBaseline = parseOperationsQuestions();
fs.writeFileSync('/Users/danielmcshan/GitHub/operations-agent/baseline.json', JSON.stringify(operationsBaseline, null, 2));
console.log(`✅ Operations: ${operationsBaseline.questions.length} questions`);

const marketingBaseline = parseMarketingQuestions();
fs.writeFileSync('/Users/danielmcshan/GitHub/marketing-agent/baseline.json', JSON.stringify(marketingBaseline, null, 2));
console.log(`✅ Marketing: ${marketingBaseline.questions.length} questions`);

console.log(`\n📊 Total: ${complianceBaseline.questions.length + operationsBaseline.questions.length + marketingBaseline.questions.length} questions\n`);

