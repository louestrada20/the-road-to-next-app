// This script ensures Prisma Query Engine binaries are available for Vercel deployment
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const prismaClient = join(projectRoot, 'node_modules', '.prisma', 'client');
const engineFile = 'libquery_engine-rhel-openssl-3.0.x.so.node';

// Paths where Vercel might look for the engine
const targetPaths = [
  join(projectRoot, '.vercel', 'output', 'functions', '_shared', '.prisma', 'client'),
  join(projectRoot, '.next', 'server', 'chunks', '.prisma', 'client'),
  join(projectRoot, '.next', 'standalone', 'node_modules', '.prisma', 'client'),
];

console.log('Copying Prisma Query Engine for Vercel deployment...');

const enginePath = join(prismaClient, engineFile);
if (!existsSync(enginePath)) {
  console.error(`Engine file not found: ${enginePath}`);
  console.log('Make sure to run "prisma generate" first');
  process.exit(0); // Don't fail the build
}

targetPaths.forEach(targetDir => {
  try {
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = join(targetDir, engineFile);
    copyFileSync(enginePath, targetFile);
    console.log(`✓ Copied to: ${targetFile}`);
  } catch (error) {
    console.log(`ℹ Could not copy to ${targetDir} (may not be needed)`);
  }
});

console.log('Prisma Query Engine copy complete');
