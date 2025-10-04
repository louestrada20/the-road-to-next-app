import { User } from '@prisma/client'

let userIdCounter = 1

export const createMockUser = (overrides: Partial<User> = {}): User => {
  const id = `user-${userIdCounter++}`
  
  return {
    id,
    username: `user${userIdCounter}`,
    email: `user${userIdCounter}@example.com`,
    passwordHash: '$argon2id$v=19$m=12,t=3,p=1$NaCl$hash',
    emailVerified: true,
    firstName: null,
    lastName: null,
    ...overrides,
  }
}

export const createAuthenticatedUser = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    emailVerified: true,
    ...overrides,
  })
}

export const createUnverifiedUser = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    emailVerified: false,
    ...overrides,
  })
}
