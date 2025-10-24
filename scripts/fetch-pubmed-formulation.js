#!/usr/bin/env node

/**
 * Fetch PubMed Articles for Formulation Agent RAG
 * 
 * This script searches PubMed for cannabis formulation-related articles
 * and updates the science-agent's index.json for RAG use.
 * 
 * Run: node scripts/fetch-pubmed-formulation.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// PubMed API configuration
const PUBMED_API_BASE = 'eutils.ncbi.nlm.nih.gov';
const EMAIL = 'contact@formul8.ai'; // Required by NCBI
const TOOL = 'formul8-rag-updater';

// Search terms for formulation-relevant articles
const SEARCH_QUERIES = [
  'cannabis formulation',
  'cannabinoid extraction',
  'cannabis dosage',
  'THC CBD formulation',
  'terpene preservation',
  'cannabis edibles',
  'cannabis stability',
  'cannabinoid degradation',
  'cannabis product development',
  'cannabis bioavailability'
];

// Output paths
const OUTPUT_DIR = path.join(__dirname, '../agents/science-agent/data');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');

/**
 * Make HTTPS GET request
 */
function httpsGet(hostname, path) {
  return new Promise((resolve, reject) => {
    https.get({ hostname, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Search PubMed for articles
 */
async function searchPubMed(query, maxResults = 10) {
  console.log(`🔍 Searching PubMed: "${query}"`);
  
  const searchPath = `/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=pub+date&email=${EMAIL}&tool=${TOOL}`;
  
  try {
    const response = await httpsGet(PUBMED_API_BASE, searchPath);
    const data = JSON.parse(response);
    const idList = data.esearchresult?.idlist || [];
    console.log(`  Found ${idList.length} articles`);
    return idList;
  } catch (error) {
    console.error(`  Error searching: ${error.message}`);
    return [];
  }
}

/**
 * Fetch article details from PubMed
 */
async function fetchArticleDetails(pmids) {
  if (pmids.length === 0) return [];
  
  console.log(`📥 Fetching details for ${pmids.length} articles...`);
  
  const fetchPath = `/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&email=${EMAIL}&tool=${TOOL}`;
  
  try {
    const xml = await httpsGet(PUBMED_API_BASE, fetchPath);
    return parseArticleXML(xml);
  } catch (error) {
    console.error(`  Error fetching details: ${error.message}`);
    return [];
  }
}

/**
 * Parse PubMed XML response
 */
function parseArticleXML(xml) {
  const articles = [];
  
  // Simple XML parsing - extract key fields
  const articleMatches = xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g);
  
  for (const match of articleMatches) {
    const articleXML = match[1];
    
    try {
      const pmid = articleXML.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || '';
      const title = articleXML.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || '';
      const abstract = articleXML.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/)?.[1] || '';
      const doi = articleXML.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/)?.[1] || '';
      
      // Extract authors
      const authorMatches = articleXML.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g);
      const authors = Array.from(authorMatches).map(m => `${m[2]} ${m[1]}`).slice(0, 5);
      
      // Extract publication date
      const year = articleXML.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1] || '';
      const month = articleXML.match(/<PubDate>[\s\S]*?<Month>(.*?)<\/Month>/)?.[1] || '01';
      const day = articleXML.match(/<PubDate>[\s\S]*?<Day>(.*?)<\/Day>/)?.[1] || '01';
      
      // Extract journal
      const journal = articleXML.match(/<Title>(.*?)<\/Title>/)?.[1] || '';
      
      // Extract MeSH keywords
      const meshMatches = articleXML.matchAll(/<DescriptorName[^>]*>(.*?)<\/DescriptorName>/g);
      const meshTerms = Array.from(meshMatches).map(m => m[1].toLowerCase());
      
      // Generate keywords from title and abstract
      const text = `${title} ${abstract}`.toLowerCase();
      const keywords = [
        ...new Set([
          ...meshTerms,
          ...(text.includes('cannabinoid') ? ['cannabinoid'] : []),
          ...(text.includes('thc') ? ['THC'] : []),
          ...(text.includes('cbd') ? ['CBD'] : []),
          ...(text.includes('terpene') ? ['terpene'] : []),
          ...(text.includes('extraction') ? ['extraction'] : []),
          ...(text.includes('formulation') ? ['formulation'] : []),
          ...(text.includes('dosage') || text.includes('dose') ? ['dosage'] : []),
          ...(text.includes('stability') ? ['stability'] : []),
          ...(text.includes('cannabis') ? ['cannabis'] : [])
        ])
      ].slice(0, 10);
      
      // Determine relevance to formulation
      const relevantTo = [];
      if (text.includes('formulation') || text.includes('recipe') || text.includes('product')) {
        relevantTo.push('formulation');
      }
      if (text.includes('science') || text.includes('research') || text.includes('study')) {
        relevantTo.push('science');
      }
      if (text.includes('compliance') || text.includes('regulation')) {
        relevantTo.push('compliance');
      }
      if (text.includes('operation') || text.includes('manufacturing')) {
        relevantTo.push('operations');
      }
      
      if (pmid && title) {
        articles.push({
          id: `pubmed-${pmid}`,
          title: cleanHTML(title),
          authors: authors,
          abstract: cleanHTML(abstract),
          keywords: keywords,
          pubmedId: pmid,
          doi: doi || null,
          publishedDate: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
          journal: cleanHTML(journal),
          summary: generateSummary(title, abstract),
          relevantTo: relevantTo.length > 0 ? relevantTo : ['science'],
          fetchedDate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`  Error parsing article: ${error.message}`);
    }
  }
  
  return articles;
}

/**
 * Clean HTML entities and tags from text
 */
function cleanHTML(text) {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .trim();
}

/**
 * Generate a brief summary from title and abstract
 */
function generateSummary(title, abstract) {
  const text = cleanHTML(abstract || title);
  if (text.length <= 200) return text;
  
  // Take first 200 chars and cut at sentence boundary
  const truncated = text.substring(0, 200);
  const lastPeriod = truncated.lastIndexOf('.');
  return lastPeriod > 100 ? truncated.substring(0, lastPeriod + 1) : truncated + '...';
}

/**
 * Load existing index
 */
function loadExistingIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      const data = fs.readFileSync(INDEX_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`⚠️  Error loading existing index: ${error.message}`);
  }
  
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    totalPapers: 0,
    description: 'PubMed research papers and scientific studies for cannabis industry',
    papers: [],
    categories: {},
    dataSource: 'PubMed API',
    accessPattern: 'RAG for formulation-agent and other specialized agents'
  };
}

/**
 * Save updated index
 */
function saveIndex(index) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Update metadata
    index.lastUpdated = new Date().toISOString();
    index.totalPapers = index.papers.length;
    
    // Count categories
    index.categories = {};
    index.papers.forEach(paper => {
      paper.keywords.forEach(keyword => {
        index.categories[keyword] = (index.categories[keyword] || 0) + 1;
      });
    });
    
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    console.log(`✅ Index saved: ${INDEX_FILE}`);
    console.log(`   Total papers: ${index.totalPapers}`);
  } catch (error) {
    console.error(`❌ Error saving index: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  PubMed Formulation Article Fetcher              ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  
  const startTime = Date.now();
  
  // Load existing index
  console.log('📂 Loading existing index...');
  const index = loadExistingIndex();
  const existingIds = new Set(index.papers.map(p => p.id));
  console.log(`   Found ${index.papers.length} existing papers`);
  console.log('');
  
  // Fetch new articles for each query
  let allNewArticles = [];
  
  for (const query of SEARCH_QUERIES) {
    const pmids = await searchPubMed(query, 5); // 5 most recent per query
    
    if (pmids.length > 0) {
      // Add small delay to respect NCBI rate limits (3 requests/second)
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const articles = await fetchArticleDetails(pmids);
      
      // Filter out duplicates
      const newArticles = articles.filter(a => !existingIds.has(a.id));
      allNewArticles.push(...newArticles);
      
      console.log(`  Added ${newArticles.length} new articles`);
      
      // Add to existing set to avoid duplicates within this run
      newArticles.forEach(a => existingIds.add(a.id));
    }
    
    // Delay between queries
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log('');
  }
  
  // Add new articles to index
  if (allNewArticles.length > 0) {
    console.log(`📚 Adding ${allNewArticles.length} new articles to index`);
    index.papers.unshift(...allNewArticles); // Add to beginning (most recent first)
    
    // Keep only most recent 100 papers to limit size
    if (index.papers.length > 100) {
      console.log(`   Trimming to 100 most recent papers (removed ${index.papers.length - 100})`);
      index.papers = index.papers.slice(0, 100);
    }
    
    saveIndex(index);
  } else {
    console.log('ℹ️  No new articles found');
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log(`✅ Completed in ${duration}s`);
  console.log('');
  
  // Print summary
  console.log('📊 Summary:');
  console.log(`   Total papers in index: ${index.totalPapers}`);
  console.log(`   New papers added: ${allNewArticles.length}`);
  console.log(`   Categories: ${Object.keys(index.categories).length}`);
  console.log(`   Next update: Tomorrow at midnight UTC`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };

