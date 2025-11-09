#!/usr/bin/env node

/**
 * Verify Development Environment Setup
 * Checks all required dependencies and configurations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const checks = [];
let allPassed = true;

// Helper functions
const check = (name, fn) => {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      checks.push({ name, status: '✅', message: 'OK' });
      return true;
    } else {
      checks.push({ name, status: '❌', message: result });
      allPassed = false;
      return false;
    }
  } catch (error) {
    checks.push({ name, status: '❌', message: error.message });
    allPassed = false;
    return false;
  }
};

const runCommand = (cmd) => {
  try {
    execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    return true;
  } catch (error) {
    return error.message;
  }
};

const fileExists = (filePath) => {
  return fs.existsSync(path.join(process.cwd(), filePath));
};

console.log('\n🔍 Verifying Development Environment Setup...\n');

// Check 1: Node.js version
check('Node.js version (>=20.9.0)', () => {
  const version = process.version.replace('v', '');
  const [major, minor] = version.split('.').map(Number);
  if (major > 20 || (major === 20 && minor >= 9)) {
    return true;
  }
  return `Current: v${version}, Required: >=20.9.0`;
});

// Check 2: Docker installed
check('Docker installed', () => {
  return runCommand('docker --version');
});

// Check 3: Docker running
check('Docker Desktop running', () => {
  return runCommand('docker ps');
});

// Check 4: PostgreSQL container
check('PostgreSQL container running', () => {
  try {
    const output = execSync('docker ps --filter "name=road-to-next-postgres" --format "{{.Status}}"', {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    if (output.includes('Up') && output.includes('healthy')) {
      return true;
    }
    if (output.includes('Up')) {
      return 'Running but not healthy yet (wait a moment)';
    }
    return 'Not running (run: docker-compose up -d)';
  } catch {
    return 'Not running (run: docker-compose up -d)';
  }
});

// Check 5: Required files
check('.env file exists', () => {
  return fileExists('.env') || '.env file missing';
});

check('.env.local file exists', () => {
  return fileExists('.env.local') || '.env.local file missing (run: npm run seed)';
});

check('docker-compose.yml exists', () => {
  return fileExists('docker-compose.yml') || 'docker-compose.yml missing';
});

// Check 6: Environment variables
check('.env.local has DATABASE_URL', () => {
  if (!fileExists('.env.local')) return 'File missing';
  const content = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  return content.includes('DATABASE_URL') || 'DATABASE_URL not found';
});

check('.env.local has localhost URL', () => {
  if (!fileExists('.env.local')) return 'File missing';
  const content = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  return content.includes('localhost:5432') || 'Not using localhost database';
});

// Check 7: Stripe CLI
check('Stripe CLI installed', () => {
  const result = runCommand('stripe --version');
  if (result === true) return true;
  return 'Not installed (optional - see: https://stripe.com/docs/stripe-cli)';
});

// Check 8: Database connection
check('Database connection working', () => {
  try {
    execSync('docker exec road-to-next-postgres psql -U postgres -d road_to_next_dev -c "SELECT 1;" > nul 2>&1', {
      stdio: 'pipe'
    });
    return true;
  } catch {
    return 'Cannot connect (check container is running)';
  }
});

// Check 9: Database has data
check('Database seeded', () => {
  try {
    const output = execSync(
      'docker exec road-to-next-postgres psql -U postgres -d road_to_next_dev -t -c "SELECT COUNT(*) FROM \\"User\\";"',
      { stdio: 'pipe', encoding: 'utf8' }
    );
    const count = parseInt(output.trim());
    if (count > 0) {
      return true;
    }
    return 'No users found (run: npm run seed)';
  } catch {
    return 'Cannot query database';
  }
});

// Check 10: node_modules
check('Dependencies installed', () => {
  return fileExists('node_modules') || 'Run: npm install';
});

// Check 11: Prisma Client
check('Prisma Client generated', () => {
  return fileExists('node_modules/.prisma/client') || 'Run: npx prisma generate';
});

// Print results
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                 VERIFICATION RESULTS                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

checks.forEach(({ name, status, message }) => {
  const paddedName = name.padEnd(35);
  if (status === '✅') {
    console.log(`${status} ${paddedName} ${message}`);
  } else {
    console.log(`${status} ${paddedName} ${message}`);
  }
});

console.log('\n' + '═'.repeat(62));

if (allPassed) {
  console.log('\n🎉 All checks passed! Your development environment is ready.');
  console.log('\n📝 Quick start:');
  console.log('   npm run dev:full    # Full dev (Next.js + Prisma Studio + Stripe CLI)');
  console.log('   npm run dev:lite    # Lightweight (Next.js + Prisma Studio)');
  console.log('   npm run dev         # Basic (Next.js only)');
  console.log('\n🔗 Access:');
  console.log('   App:           http://localhost:3000');
  console.log('   Prisma Studio: http://localhost:5555');
  console.log('   Login:         louestrada31@gmail.com / adminAdmin1!@');
  console.log('\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.');
  console.log('\n📚 Documentation: docs/local-database-setup.md');
  console.log('');
  process.exit(1);
}

