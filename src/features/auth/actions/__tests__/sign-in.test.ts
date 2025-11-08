import { redirect } from 'next/navigation'
import { beforeEach,describe, expect, it, vi } from 'vitest'
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state'
import { setSessionCookie } from '@/features/auth/cookie'
import { verifyPasswordHash } from '@/features/auth/password'
import { createSession, generateRandomSessionToken } from '@/features/auth/session'
import { prisma } from '@/lib/prisma'
import { limitEmail,limitIp } from '@/lib/rate-limit'
import { ticketsPath } from '@/paths'
import { createMockUser } from '@/test/factories'
import { createMockFormData } from '@/test/helpers'
import { asMock, asMockObject } from '@/test/types/mocks'
import { signIn } from '../sign-in'

// Additional mocks not in setup.ts
vi.mock('@/features/auth/password', () => ({
  verifyPasswordHash: vi.fn()
}))
vi.mock('@/features/auth/session', () => ({
  createSession: vi.fn(),
  generateRandomSessionToken: vi.fn()
}))
vi.mock('@/features/auth/cookie', () => ({
  setSessionCookie: vi.fn(),
  SESSION_COOKIE_NAME: 'session',
}))
vi.mock('@/lib/get-client-ip', () => ({
  getClientIp: vi.fn().mockResolvedValue('127.0.0.1')
}))

describe('signIn', () => {
  const mockUser = createMockUser()
  const validFormData = createMockFormData({
    email: mockUser.email,
    password: 'password123'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful mocks
    asMock(limitIp).mockResolvedValue({ 
      success: true,
      limit: 50,
      remaining: 49,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    })
    asMock(limitEmail).mockResolvedValue({ 
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    })
    asMockObject(prisma.user).findUnique.mockResolvedValue(mockUser)
    asMock(verifyPasswordHash).mockResolvedValue(true)
    asMock(generateRandomSessionToken).mockReturnValue('test-session-token')
    asMock(createSession).mockResolvedValue({
      id: 'session-1',
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      refreshedAt: null,
    })
  })

  it('should successfully sign in a user with valid credentials', async () => {
    // Redirect throws an error in Next.js, so we expect this to throw
    await expect(signIn(EMPTY_ACTION_STATE, validFormData)).rejects.toThrow('NEXT_REDIRECT')

    // Verify rate limiting was checked
    expect(limitIp).toHaveBeenCalledWith('127.0.0.1', 'sign-in', 50, '1 m')
    expect(limitEmail).toHaveBeenCalledWith('127.0.0.1', mockUser.email, 'sign-in')

    // Verify user lookup and password verification
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockUser.email }
    })
    expect(verifyPasswordHash).toHaveBeenCalledWith(mockUser.passwordHash, 'password123')

    // Verify session creation
    expect(generateRandomSessionToken).toHaveBeenCalled()
    expect(createSession).toHaveBeenCalledWith('test-session-token', mockUser.id)
    expect(setSessionCookie).toHaveBeenCalled()

    // Verify redirect
    expect(redirect).toHaveBeenCalledWith(ticketsPath())
  })

  it('should return error when IP rate limit is exceeded', async () => {
    asMock(limitIp).mockResolvedValue({ 
      success: false,
      limit: 50,
      remaining: 0,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    })

    const result = await signIn(EMPTY_ACTION_STATE, validFormData)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Too many requests')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('should return error when email rate limit is exceeded', async () => {
    asMock(limitEmail).mockResolvedValue({ 
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    })

    const result = await signIn(EMPTY_ACTION_STATE, validFormData)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Too many attempts for this account')
    expect(verifyPasswordHash).not.toHaveBeenCalled()
  })

  it('should return error for non-existent user', async () => {
    asMockObject(prisma.user).findUnique.mockResolvedValue(null)

    const result = await signIn(EMPTY_ACTION_STATE, validFormData)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Incorrect email or password')
    expect(createSession).not.toHaveBeenCalled()
  })

  it('should return error for incorrect password', async () => {
    asMock(verifyPasswordHash).mockResolvedValue(false)

    const result = await signIn(EMPTY_ACTION_STATE, validFormData)

    expect(result.status).toBe('ERROR')
    expect(result.message).toBe('Incorrect email or password')
    expect(createSession).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    const invalidFormData = createMockFormData({
      email: 'invalid-email',
      password: 'password123'
    })

    const result = await signIn(EMPTY_ACTION_STATE, invalidFormData)

    expect(result.status).toBe('ERROR')
    expect(result.fieldErrors?.email).toBeDefined()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('should validate password length', async () => {
    const invalidFormData = createMockFormData({
      email: mockUser.email,
      password: '123' // Too short
    })

    const result = await signIn(EMPTY_ACTION_STATE, invalidFormData)

    expect(result.status).toBe('ERROR')
    expect(result.fieldErrors?.password).toBeDefined()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('should preserve form data on error', async () => {
    asMock(verifyPasswordHash).mockResolvedValue(false)

    const result = await signIn(EMPTY_ACTION_STATE, validFormData)

    expect(result.payload).toEqual(validFormData)
  })
})
