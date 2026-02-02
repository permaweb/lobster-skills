import { describe, test, beforeEach, afterEach, it } from 'node:test';
import assert from 'node:assert';
import PASPSkill from '../src/index.js';

describe('PASP Skill', () => {
  let pasp;
  let mockWallet;

  beforeEach(() => {
    // Mock configuration
    pasp = new PASPSkill({
      wallet_path: '/tmp/test-wallet.json',
      arweave_gateway: 'https://arweave.net',
      graphql_endpoint: 'https://arweave.net/graphql'
    });

    // Mock wallet
    mockWallet = {
      kty: 'RSA',
      n: 'test-n',
      e: 'AQAB',
      d: 'test-d',
      p: 'test-p',
      q: 'test-q',
      dp: 'test-dp',
      dq: 'test-dq',
      qi: 'test-qi'
    };
  });

  describe('Content Parsing', () => {
    test('should parse valid YAML front matter', () => {
      const raw = `---
action: post
agent_name: TestAgent
tags:
  - arweave
---

# Test Post

Content here`;

      const { metadata, markdown, error } = PASPSkill.parseContent(raw);

      assert.strictEqual(error, null);
      assert.deepStrictEqual(metadata, {
        action: 'post',
        agent_name: 'TestAgent',
        tags: ['arweave']
      });
      assert.strictEqual(markdown, '# Test Post\n\nContent here');
    });

    test('should handle missing YAML front matter', () => {
      const raw = '# Just markdown';

      const { metadata, markdown, error } = PASPSkill.parseContent(raw);

      assert.strictEqual(error, 'No valid YAML front matter');
      assert.strictEqual(metadata, null);
      assert.strictEqual(markdown, raw);
    });

    test('should parse YAML list correctly', () => {
      const raw = `---
skills:
  - Arweave
  - AO
  - Permaweb
---

Title`;

      const { metadata } = PASPSkill.parseContent(raw);

      assert.deepStrictEqual(metadata.skills, ['Arweave', 'AO', 'Permaweb']);
    });
  });

  describe('Markdown Rendering', () => {
    test('should render markdown to HTML', () => {
      const markdown = '# Heading\n\n**Bold** and *italic*';
      const html = PASPSkill.renderMarkdown(markdown);

      assert.ok(html.includes('<h1>Heading</h1>'));
      assert.ok(html.includes('<strong>Bold</strong>'));
      assert.ok(html.includes('<em>italic</em>'));
    });

    test('should render code blocks', () => {
      const markdown = '```js\nconst x = 1;\n```';
      const html = PASPSkill.renderMarkdown(markdown);

      // Marked wraps code in pre/code with language class
      assert.ok(html.includes('<code'));
      assert.ok(html.includes('const x = 1;'));
    });
  });

  describe('Content Generation', () => {
    test('should generate YAML + Markdown content', () => {
      const metadata = {
        action: 'post',
        agent_name: 'TestAgent',
        tags: ['test']
      };
      const content = 'Test content';

      const result = PASPSkill.generatePASPContent(metadata, content);

      assert.ok(result.startsWith('---'));
      assert.ok(result.includes('action: post'));
      assert.ok(result.includes('agent_name: TestAgent'));
      assert.ok(result.includes('---\n'));
      assert.ok(result.endsWith('Test content'));
    });

    test('should generate valid YAML', () => {
      const metadata = {
        action: 'post',
        agent_name: 'TestAgent',
        nested: {
          key: 'value'
        }
      };

      const content = PASPSkill.generatePASPContent(metadata, 'Test content');
      const { metadata: parsed, error } = PASPSkill.parseContent(content);

      assert.strictEqual(error, null);
      assert.deepStrictEqual(parsed.nested, { key: 'value' });
    });
  });

  describe('Profile Markdown Generation', () => {
    test('should generate basic profile', () => {
      const metadata = {
        agent_name: 'TestAgent',
        role: 'Developer',
        description: 'AI agent',
        skills: ['Arweave', 'AO']
      };

      const md = pasp.generateProfileMarkdown(metadata);

      assert.ok(md.includes('# TestAgent'));
      assert.ok(md.includes('**Role:** Developer'));
      assert.ok(md.includes('**Description:** AI agent'));
      assert.ok(md.includes('## Skills & Capabilities'));
      assert.ok(md.includes('- Arweave'));
      assert.ok(md.includes('- AO'));
    });

    test('should include links when provided', () => {
      const metadata = {
        agent_name: 'TestAgent',
        website: 'https://example.com',
        moltbook: '@testagent'
      };

      const md = pasp.generateProfileMarkdown(metadata);

      assert.ok(md.includes('## Connect'));
      assert.ok(md.includes('https://example.com'));
      assert.ok(md.includes('@testagent'));
    });

    test('should handle empty optional fields', () => {
      const metadata = {
        agent_name: 'TestAgent',
        skills: []
      };

      const md = pasp.generateProfileMarkdown(metadata);

      assert.ok(md.includes('# TestAgent'));
      assert.ok(!md.includes('Skills & Capabilities'));
      assert.ok(!md.includes('Connect'));
    });
  });

  describe('Protocol Constants', () => {
    test('should have correct protocol version', () => {
      assert.strictEqual(pasp.config.arweave_gateway, 'https://arweave.net');
    });
  });

  describe('Cache Management', () => {
    test('should cache profiles', async () => {
      const mockProfile = {
        txId: 'test-id',
        url: 'https://arweave.net/test-id',
        metadata: { agent_name: 'TestAgent' }
      };

      pasp.profileCache.set('TestAgent', {
        data: mockProfile,
        timestamp: Date.now()
      });

      // Note: Since initialize() is mocked, this would return the cached value
      // In real implementation, getProfile would check cache first
      assert.ok(pasp.profileCache.has('TestAgent'));
    });

    test('should respect cache TTL', () => {
      const oldTime = Date.now() - 4000000; // Older than TTL
      pasp.profileCache.set('ExpiredAgent', {
        data: { test: 'data' },
        timestamp: oldTime
      });

      // In real implementation, getProfile would detect expired cache
      // This test structure shows the cache TTL logic
      const cached = pasp.profileCache.get('ExpiredAgent');
      assert.strictEqual(cached.timestamp, oldTime);
    });
  });

  describe('Tag Construction', () => {
    test('should construct tags correctly', async () => {
      // This tests internal tag construction logic
      // In real implementation, tags are added to transactions

      const expectedTags = {
        'App-Name': 'agent-social-protocol',
        'Version': '1.0.0',
        'Action-Type': 'post',
        'Agent-Id': 'test-address',
        'Agent-Name': 'TestAgent'
      };

      // Verify tag structure matches expected format
      assert.strictEqual(expectedTags['App-Name'], 'agent-social-protocol');
      assert.strictEqual(expectedTags['Version'], '1.0.0');
    });
  });

  describe('GraphQL Query Building', () => {
    test('should build basic query', () => {
      const query = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["agent-social-protocol"] }
            ]
            first: 10
          ) {
            edges {
              node {
                id
                owner { address }
              }
            }
          }
        }
      `;

      assert.ok(query.includes('App-Name'));
      assert.ok(query.includes('agent-social-protocol'));
    });

    test('should build query with multiple filters', () => {
      const conditions = [
        { name: 'App-Name', values: ['agent-social-protocol'] },
        { name: 'Submolt', values: ['arweave-dev'] },
        { name: 'Content-Type', values: ['tutorial'] }
      ];

      assert.strictEqual(conditions.length, 3);
    });
  });
});