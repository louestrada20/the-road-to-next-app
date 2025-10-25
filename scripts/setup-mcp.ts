#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
dotenv.config({ path: '.env' });

const mcpToken = process.env.MCP_CREDENTIAL_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!mcpToken) {
  console.error('❌ MCP_CREDENTIAL_TOKEN not found in .env');
  console.error('   Run: npm run prisma-seed');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

// Path to mcp.json (in .cursor folder in user's home directory)
const mcpJsonPath = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'mcp.json'
);

const projectPath = process.cwd().replace(/\\/g, '/');
// Use tsx CLI directly via node for better cross-platform compatibility
const tsxCliPath = `${projectPath}/node_modules/tsx/dist/cli.mjs`;
const tsconfigPath = `${projectPath}/tsconfig.json`;
const mcpServerPath = `${projectPath}/src/mcp-server-ticketing/index.ts`;

const mcpConfig = {
  mcpServers: {
    'roadtonext-ticketing': {
      command: 'node',
      args: [
        tsxCliPath,
        '--tsconfig',
        tsconfigPath,
        mcpServerPath
      ],
      env: {
        DATABASE_URL: databaseUrl,
        DIRECT_URL: directUrl || databaseUrl,
        MCP_CREDENTIAL_TOKEN: mcpToken
      }
    }
  }
};

// Create .cursor directory if it doesn't exist
const cursorDir = path.dirname(mcpJsonPath);
if (!fs.existsSync(cursorDir)) {
  fs.mkdirSync(cursorDir, { recursive: true });
}

// Read existing mcp.json or create new
let existingConfig: any = { mcpServers: {} };
if (fs.existsSync(mcpJsonPath)) {
  try {
    existingConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
  } catch (error) {
    console.warn('⚠️  Could not parse existing mcp.json, will overwrite');
  }
}

// Merge configurations (preserve other MCP servers)
existingConfig.mcpServers = {
  ...existingConfig.mcpServers,
  ...mcpConfig.mcpServers
};

// Write updated config
fs.writeFileSync(mcpJsonPath, JSON.stringify(existingConfig, null, 2));

console.log('✅ MCP configuration updated!');
console.log(`   Config file: ${mcpJsonPath}`);
console.log(`   Server: roadtonext-ticketing`);
console.log(`   Token: ${mcpToken.substring(0, 10)}...${mcpToken.substring(mcpToken.length - 4)}`);
console.log(`   Project: ${projectPath}`);
console.log('\n🔄 Restart Cursor to load the new MCP server');
console.log('\n📝 Once restarted, you can ask Cursor Agent to:');
console.log('   - "List all tickets using the MCP server"');
console.log('   - "Create a ticket using the MCP server"');
console.log('   - "Search for tickets about authentication"');
console.log('   - And more! The agent will have full access to your ticketing data.');

