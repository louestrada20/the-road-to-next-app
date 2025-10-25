// Enhanced Prisma build script for Vercel deployment with Next.js 16
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 Running enhanced Prisma build for Vercel...');

// Set environment variables for Prisma
process.env.PRISMA_QUERY_ENGINE_LIBRARY = join(
  projectRoot,
  'node_modules',
  '.prisma',
  'client',
  'libquery_engine-rhel-openssl-3.0.x.so.node'
);

// Generate Prisma client with specific settings
try {
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true',
      PRISMA_HIDE_UPDATE_MESSAGE: 'true',
    }
  });
  
  // Verify the engine file exists
  const enginePath = process.env.PRISMA_QUERY_ENGINE_LIBRARY;
  if (existsSync(enginePath)) {
    console.log('✅ Query engine found at:', enginePath);
  } else {
    console.warn('⚠️  Query engine not found at expected location');
  }
  
  console.log('✅ Prisma generation complete');
} catch (error) {
  console.error('❌ Prisma generation failed:', error.message);
  process.exit(1);
}
