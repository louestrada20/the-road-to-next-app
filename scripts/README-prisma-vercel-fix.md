# Prisma Vercel Deployment Scripts

These scripts were created to fix the Prisma Query Engine deployment issue with Next.js 16 on Vercel.

## Issue
After upgrading to Next.js 16, Vercel deployments fail with:
```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

## Scripts

### prisma-vercel-build.js
- Enhanced Prisma generation script for Vercel
- Sets PRISMA_QUERY_ENGINE_LIBRARY environment variable
- Generates Prisma client with specific Vercel-compatible settings
- Verifies the engine file exists after generation

### copy-prisma-engines.js
- Fallback script to copy Prisma binaries to multiple locations
- Ensures binaries are available in all possible Vercel function locations
- Non-blocking - continues build even if some copy operations fail

## Usage
These scripts are automatically called by the `vercel-build` npm script:
```json
"vercel-build": "node scripts/prisma-vercel-build.js && next build"
```

## Related Configuration
- `vercel.json` - Configures function file includes
- `next.config.ts` - Sets outputFileTracingIncludes
- `package.json` - Defines Node.js engine requirement

If the issue persists, check the Vercel build logs for which paths are being searched for the Query Engine.
