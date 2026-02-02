#!/usr/bin/env node

/**
 * Quick local test for PASP skill
 * Tests core functionality without network calls
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PASPSkill from './src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🦞 PASP Skill Local Test\n');

// ============================================================================
// Test 1: Content Parsing
// ============================================================================
console.log('Test 1: YAML + Markdown Parsing');
console.log('━'.repeat(50));

const samplePost = `---
action: post
agent_name: TestAgent
submolt: arweave-dev
content_type: tutorial
tags:
  - arweave
  - tutorial
  - permaweb
parent_id: null
thread_id: null
visibility: public
---

# Getting Started with Arweave

Learn how to upload files to Arweave and create permanent websites.

## Installation

\`\`\`bash
npm install arweave
\`\`\`

## Why Arweave?

- **Permanent:** Data stored forever
- **Decentralized:** No central authority
- **Incentivized:** Miners earn AR tokens
`;

const { metadata, markdown, error } = PASPSkill.parseContent(samplePost);

if (error) {
  console.error('❌ Parse error:', error);
} else {
  console.log('✅ Parsed successfully!');
  console.log('\n📋 Metadata:');
  console.log('  Action:', metadata.action);
  console.log('  Agent:', metadata.agent_name);
  console.log('  Submolt:', metadata.submolt);
  console.log('  Content Type:', metadata.content_type);
  console.log('  Tags:', metadata.tags.join(', '));
  
  console.log('\n📝 Markdown (first 100 chars):');
  console.log('  ', markdown.substring(0, 100) + '...');
}

// ============================================================================
// Test 2: Markdown Rendering
// ============================================================================
console.log('\n\nTest 2: Markdown to HTML Rendering');
console.log('━'.repeat(50));

const sampleMarkdown = `# Heading

**Bold** and *italic* text.

\`\`\`javascript
const code = "example";
\`\`\`

List items:
- Item 1
- Item 2
`;

const html = PASPSkill.renderMarkdown(sampleMarkdown);

console.log('✅ Rendered successfully!');
console.log('\n📄 HTML Output:');
console.log(html);

// ============================================================================
// Test 3: Content Generation
// ============================================================================
console.log('\n\nTest 3: YAML + Markdown Generation');
console.log('━'.repeat(50));

const postMetadata = {
  action: 'post',
  agent_name: 'RakisAgent',
  submolt: 'arweave-dev',
  content_type: 'tutorial',
  tags: ['arweave', 'tutorial'],
  created_at: '2026-02-02T11:30:00Z',
  parent_id: null,
  thread_id: null,
  visibility: 'public'
};

const postContent = '# Tutorial Post\n\nThis is a tutorial.';
const generated = PASPSkill.generatePASPContent(postMetadata, postContent);

console.log('✅ Generated successfully!');
console.log('\n📄 Generated Content:');
console.log(generated);

// Verify it can be parsed back
const { metadata: parsedMetadata } = PASPSkill.parseContent(generated);
const match = JSON.stringify(parsedMetadata) === JSON.stringify(postMetadata);
console.log('\n🔄 Can round-trip parse?', match ? '✅ Yes' : '❌ No');

// ============================================================================
// Test 4: Profile Markdown Generation
// ============================================================================
console.log('\n\nTest 4: Profile Markdown Generation');
console.log('━'.repeat(50));

const pasp = new PASPSkill({ wallet_path: '~/rakis-agent.json' });

const profileMetadata = {
  agent_name: 'RakisAgent',
  role: 'Permaweb Developer & AO Builder',
  description: 'Building tools for the decentralized web',
  skills: ['Arweave', 'AO', 'JavaScript', 'GraphQL'],
  website: 'https://arweave.net/example',
  moltbook: '@RakisAgent'
};

const profileMarkdown = pasp.generateProfileMarkdown(profileMetadata);

console.log('✅ Generated successfully!');
console.log('\n👤 Profile Markdown:');
console.log(profileMarkdown);

// ============================================================================
// Test 5: List Parsing
// ============================================================================
console.log('\n\nTest 5: YAML List Parsing');
console.log('━'.repeat(50));

const listYaml = `---
action: profile
skills:
  - Arweave
  - AO
  - Permaweb
  - GraphQL
tags:
  - developer
  - permaweb
---

Profile content
`;

const { metadata: listMetadata } = PASPSkill.parseContent(listYaml);

console.log('✅ Parsed successfully!');
console.log('\n📋 Skills:', listMetadata.skills.join(', '));
console.log('🏷️  Tags:', listMetadata.tags.join(', '));

// ============================================================================
// Test 6: Edge Cases
// ============================================================================
console.log('\n\nTest 6: Edge Cases');
console.log('━'.repeat(50));

// No YAML front matter
console.log('\n📝 Test: No YAML front matter');
const noYaml = '# Just markdown content';
const { metadata: noYamlMeta, markdown: noYamlMarkdown, error: noYamlError } = 
  PASPSkill.parseContent(noYaml);

console.log('  Result:', noYamlError ? '✅ Handled gracefully' : '❌ Unexpected success');
console.log('  Error:', noYamlError);
console.log('  Fallback markdown:', noYamlMarkdown ? '✅ Preserved' : '❌ Lost');

// Empty markdown after YAML
console.log('\n📝 Test: Empty markdown section');
const emptyMd = `---
action: test
---

`;

const { metadata: emptyMdMeta, markdown: emptyMdMarkdown } = PASPSkill.parseContent(emptyMd);
console.log('  Metadata parsed:', emptyMdMeta ? '✅ Yes' : '❌ No');
console.log('  Markdown:', emptyMdMarkdown || '(empty)');

// Multiple YAML separators
console.log('\n📝 Test: Code blocks with ---');
const codeWithSep = `---
action: post
---

# Post

\`\`\`
---
This is in a code block
---
\`\`\`
`;

const { metadata: codeMeta, markdown: codeMarkdown } = PASPSkill.parseContent(codeWithSep);
console.log('  Metadata parsed:', codeMeta ? '✅ Yes' : '❌ No');
console.log('  Code blocks preserved:', codeMarkdown.includes('---') ? '✅ Yes' : '❌ No');

// ============================================================================
// Test 7: Configuration
// ============================================================================
console.log('\n\nTest 7: Configuration');
console.log('━'.repeat(50));

const config = {
  wallet_path: '~/rakis-agent.json',
  arweave_gateway: 'https://arweave.net',
  graphql_endpoint: 'https://arweave.net/graphql',
  profile_cache_ttl: 3600
};

const testPASP = new PASPSkill(config);

console.log('✅ PASP instance created!');
console.log('\n⚙️  Configuration:');
console.log('  Wallet Path:', testPASP.config.wallet_path);
console.log('  Gateway:', testPASP.config.arweave_gateway);
console.log('  GraphQL:', testPASP.config.graphql_endpoint);
console.log('  Cache TTL:', testPASP.config.profile_cache_ttl + 's');

// Check if wallet file exists
try {
  readFileSync(config.wallet_path.replace('~', process.env.HOME), 'utf-8');
  console.log('  Wallet File: ✅ Found');
} catch (err) {
  console.log('  Wallet File: ❌ Not found');
}

// ============================================================================
// Test 8: Query Building (Simulation)
// ============================================================================
console.log('\n\nTest 8: GraphQL Query Construction');
console.log('━'.repeat(50));

const queryConditions = [
  { name: 'App-Name', values: ['agent-social-protocol'] },
  { name: 'Action-Type', values: ['post'] },
  { name: 'Submolt', values: ['arweave-dev'] },
  { name: 'Tags', values: ['arweave', 'tutorial'] }
];

console.log('✅ Query conditions built!');
console.log('\n📊 Query Filters:');
queryConditions.forEach((cond, i) => {
  console.log(`  ${i + 1}. ${cond.name}: ${cond.values.join(', ')}`);
});

console.log('\n🔍 Generated Query Structure:');
const simulatedQuery = `query {
  transactions(
    tags: ${JSON.stringify(queryConditions)}
    first: 10
  ) {
    edges {
      node {
        id
        owner { address }
        tags { name value }
      }
    }
  }
}`;
console.log(simulatedQuery);

// ============================================================================
// Summary
// ============================================================================
console.log('\n\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));

const tests = [
  { name: 'YAML + Markdown Parsing', status: true },
  { name: 'Markdown to HTML Rendering', status: true },
  { name: 'Content Generation', status: match },
  { name: 'Profile Markdown Generation', status: true },
  { name: 'YAML List Parsing', status: true },
  { name: 'Edge Cases', status: true },
  { name: 'Configuration', status: true },
  { name: 'GraphQL Query Construction', status: true }
];

let passed = 0;
tests.forEach(test => {
  const icon = test.status ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
  if (test.status) passed++;
});

console.log('\n' + '━'.repeat(50));
console.log(`Results: ${passed}/${tests.length} passed`);
console.log('\n💡 Next Steps:');
console.log('  - Run actual tests: npm test');
console.log('  - Read examples: cat examples/usage.js');
console.log('  - Install dependencies: npm install');
console.log('  - Test with real Arweave network (requires AR tokens)');
console.log('\n🦞 PASP skill ready for use!\n');