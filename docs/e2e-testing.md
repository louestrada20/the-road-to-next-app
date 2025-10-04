# E2E Testing Guide

This guide covers how to run and maintain the E2E tests for The Road to Next application.

## Prerequisites

1. Install Playwright browsers:
   ```bash
   npx playwright install chromium firefox webkit
   ```

2. Set up test data in your database (ensure you have a test user account)

3. Set up environment variables for E2E testing:
   ```bash
   # .env.test
   DATABASE_URL=your_test_database_url
   PLAYWRIGHT_BASE_URL=http://localhost:3000
   ```

## Running E2E Tests

### Local Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the E2E tests:
   ```bash
   npm run test:e2e
   ```

### Against Production/Staging

Run tests against a deployed environment:
```bash
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

### Interactive Mode

Debug tests with Playwright UI:
```bash
npm run test:e2e:ui
```

### Debug Mode

Step through tests with browser DevTools:
```bash
npm run test:e2e:debug
```

## Test Structure

### Authentication Tests (`e2e/auth.spec.ts`)
- Sign in form validation
- Sign up form validation
- Password reset flow
- Protected route access

### Ticket Tests (`e2e/tickets.spec.ts`)
- Create new ticket
- Edit existing ticket
- Delete ticket
- Search and filter tickets
- Pagination

## Writing New E2E Tests

1. Create a new test file in the `e2e/` directory
2. Import test utilities:
   ```typescript
   import { test, expect } from '@playwright/test'
   ```

3. Use page objects for reusable interactions:
   ```typescript
   import { AuthHelper } from './fixtures/auth'
   ```

## Best Practices

1. **Test Data**: Use a dedicated test database or test tenant
2. **Authentication**: Reuse auth sessions where possible
3. **Selectors**: Prefer semantic selectors (roles, labels) over CSS
4. **Waits**: Use explicit waits instead of arbitrary timeouts
5. **Cleanup**: Reset test data after each test run

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
```

## Troubleshooting

### Tests failing locally
- Ensure dev server is running
- Check for port conflicts
- Clear browser cache/cookies
- Reset test database

### Tests failing in CI
- Check environment variables
- Verify database migrations
- Review screenshot/video artifacts
- Check for timing issues

## Viewing Test Reports

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

This opens a detailed report with:
- Test results
- Screenshots on failure
- Video recordings
- Trace files for debugging
