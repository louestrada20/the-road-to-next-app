# Testing Guide for The Road to Next

**Last Updated:** 2025-10-25

## Overview

This guide covers the testing strategy and implementation for The Road to Next application. We use a comprehensive testing approach with different layers of tests to ensure reliability and maintainability.

## Testing Stack

- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright (planned for future implementation)
- **Mocking**: Custom mocks in setup files, MSW planned for API mocking

## Getting Started

### Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Open Vitest UI for interactive testing
npm run test:ui
```

## Test Structure

### File Organization

Tests are co-located with the code they test:

```
src/
├── features/
│   ├── auth/
│   │   ├── actions/
│   │   │   ├── sign-in.ts
│   │   │   └── __tests__/
│   │   │       └── sign-in.test.ts
│   │   └── components/
│   │       ├── sign-in-form.tsx
│   │       └── __tests__/
│   │           └── sign-in-form.test.tsx
```

### Naming Conventions

- Test files: `[name].test.ts` or `[name].test.tsx`
- Test suites: Use `describe` blocks to group related tests
- Test cases: Start with "should" or describe the expected behavior

## Writing Tests

### Server Action Tests

Server actions are the core business logic of the application. Test them thoroughly:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { upsertTicket } from '../upsert-ticket'
import { prisma } from '@/lib/prisma'
import { createMockUser, createMockOrganization } from '@/test/factories'
import { createTicketFormData } from '@/test/helpers'

describe('upsertTicket', () => {
  const mockUser = createMockUser()
  const mockOrg = createMockOrganization()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default successful mocks
    ;(getAuthOrRedirect as any).mockResolvedValue({
      user: mockUser,
      activeOrganization: mockOrg
    })
  })

  it('should create a new ticket with valid data', async () => {
    const formData = createTicketFormData({
      title: 'New Ticket',
      content: 'Description',
      deadline: '2025-12-31',
      bounty: '100.00'
    })

    const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, formData)

    expect(result.status).toBe('SUCCESS')
    expect(prisma.ticket.upsert).toHaveBeenCalledWith({
      where: { id: '' },
      create: expect.objectContaining({
        title: 'New Ticket',
        bounty: 10000, // Converted to cents
      })
    })
  })

  it('should validate required fields', async () => {
    const formData = createTicketFormData({ title: '' })
    
    const result = await upsertTicket(undefined, EMPTY_ACTION_STATE, formData)
    
    expect(result.status).toBe('ERROR')
    expect(result.fieldErrors.title).toBeDefined()
  })
})
```

### Component Tests

Test user interactions and component behavior:

```typescript
import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '../sign-in-form'
import { renderWithProviders } from '@/test/helpers'

describe('SignInForm', () => {
  const user = userEvent.setup()

  it('displays validation errors for empty form', async () => {
    renderWithProviders(<SignInForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('is required')).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    renderWithProviders(<SignInForm />)
    
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalled()
    })
  })
})
```

## Test Utilities

### Factories

Located in `src/test/factories/`, these create consistent test data:

```typescript
// src/test/factories/user.ts
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})
```

### Helpers

Located in `src/test/helpers/`, these provide testing utilities:

```typescript
// src/test/helpers/form-data.ts
export const createMockFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, String(value))
  })
  return formData
}
```

### Custom Render

Use `renderWithProviders` to wrap components with necessary providers:

```typescript
// src/test/helpers/render.tsx
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

## Mocking Strategies

### Global Mocks

Set up in `src/test/setup.ts`:

- Next.js navigation (`redirect`, `useRouter`)
- Prisma client
- External services (Stripe, AWS, Resend)
- Rate limiting

### Component-Specific Mocks

Mock complex components to simplify testing:

```typescript
// Mock DatePicker for simpler testing
vi.mock('@/components/date-picker', () => ({
  DatePicker: ({ name, defaultValue }: any) => (
    <input type="date" name={name} defaultValue={defaultValue} />
  )
}))
```

### Handling Next.js Redirects

Next.js `redirect()` throws an error to perform navigation. Handle this in tests:

```typescript
// In mock
redirect: vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`)
})

// In test
await expect(signIn(state, formData)).rejects.toThrow('NEXT_REDIRECT')
```

## Best Practices

### Do's

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Don't test internal state or private methods

2. **Use Accessible Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Write Descriptive Test Names**
   - Be specific about what's being tested
   - Include the expected outcome

4. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Boundary values
   - Permission scenarios

5. **Keep Tests Independent**
   - Each test should run in isolation
   - Use `beforeEach` to reset state

### Don'ts

1. **Don't Test Third-Party Code**
   - Trust that libraries like Prisma, Stripe work correctly
   - Test your integration, not their functionality

2. **Don't Over-Mock**
   - Mock only what's necessary
   - Prefer integration tests over unit tests

3. **Don't Test Styles**
   - CSS changes shouldn't break tests
   - Use visual regression testing separately

4. **Don't Use Random Data**
   - Tests should be deterministic
   - Use consistent mock data

## Common Patterns

### Testing Forms

```typescript
it('preserves form data on error', async () => {
  const formData = createMockFormData({
    email: 'test@example.com',
    password: 'short' // Too short
  })

  vi.mocked(signIn).mockResolvedValue({
    status: 'ERROR',
    fieldErrors: { password: ['Too short'] },
    payload: formData,
  })

  renderWithProviders(<SignInForm />)
  
  // Submit form and verify data is preserved
  await user.click(submitButton)
  
  expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
})
```

### Testing Permissions

```typescript
it('prevents unauthorized updates', async () => {
  ;(isOwner as any).mockReturnValue(false)
  
  const result = await updateTicket(ticketId, state, formData)
  
  expect(result.status).toBe('ERROR')
  expect(result.message).toBe('Not authorized')
  expect(prisma.ticket.update).not.toHaveBeenCalled()
})
```

### Testing Async Operations

```typescript
it('shows loading state during submission', async () => {
  vi.mocked(signIn).mockImplementation(() => 
    new Promise(resolve => setTimeout(resolve, 100))
  )

  renderWithProviders(<SignInForm />)
  
  const submitButton = screen.getByRole('button', { name: /sign in/i })
  await user.click(submitButton)
  
  expect(submitButton).toBeDisabled()
})
```

## Debugging Tests

### Vitest UI

Use the UI mode for interactive debugging:

```bash
npm run test:ui
```

### Debug Output

Use `screen.debug()` to see the current DOM:

```typescript
screen.debug() // Logs entire DOM
screen.debug(screen.getByRole('form')) // Logs specific element
```

### Console Logs

Vitest shows console output by default. Use for debugging:

```typescript
console.log('Current state:', result)
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Coverage Requirements

We aim for high test coverage on critical paths:

- Server Actions: 90%+ coverage
- Business Logic: 85%+ coverage
- UI Components: 70%+ coverage
- Utilities: 95%+ coverage

Check coverage with:

```bash
npm run test:coverage
```

## Future Enhancements

### Planned Improvements

1. **Playwright E2E Tests**
   - Full user journey tests
   - Cross-browser testing
   - Visual regression testing

2. **MSW Integration**
   - Mock Service Worker for API mocking
   - More realistic network behavior
   - Shared mocks between tests and development

3. **Performance Testing**
   - Measure component render times
   - Track bundle size impact
   - Memory leak detection

4. **Accessibility Testing**
   - Automated a11y checks
   - Screen reader testing
   - Keyboard navigation tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
