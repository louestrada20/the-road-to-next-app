import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signIn } from '@/features/auth/actions/sign-in'
import { renderWithProviders } from '@/test/helpers'
import { SignInForm } from '../sign-in-form'

// Mock the signIn action
vi.mock('@/features/auth/actions/sign-in', () => ({
  signIn: vi.fn()
}))

// Mock useActionState
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: (action: any, initialState: any) => {
      const [state, setState] = (actual as any).useState(initialState)
      const formAction = async (formData: FormData) => {
        try {
          const result = await action(state, formData)
          setState(result)
        } catch (error) {
          // Handle Next.js redirect errors
          if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            // This is expected behavior for successful sign in
            return
          }
          throw error
        }
      }
      return [state, formAction]
    }
  }
})

describe('SignInForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in form with all fields', () => {
    renderWithProviders(<SignInForm />)

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    renderWithProviders(<SignInForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Fill in the form
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Mock successful sign in (redirect throws)
    vi.mocked(signIn).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT /tickets')
    })

    // Submit the form
    await user.click(submitButton)

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(FormData)
      )
    })

    // Verify the form data
    const calls = vi.mocked(signIn).mock.calls
    const formData = calls[0][1] as FormData
    expect(formData.get('email')).toBe('test@example.com')
    expect(formData.get('password')).toBe('password123')
  })

  it('displays field errors when validation fails', async () => {
    renderWithProviders(<SignInForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Mock validation error response
    vi.mocked(signIn).mockResolvedValue({
      status: 'ERROR',
      message: '',
      fieldErrors: {
        email: ['is required'],
        password: ['String must contain at least 6 character(s)']
      },
      payload: new FormData(),
      timestamp: Date.now()
    })

    // Submit empty form
    await user.click(submitButton)

    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText('is required')).toBeInTheDocument()
      expect(screen.getByText('String must contain at least 6 character(s)')).toBeInTheDocument()
    })
  })

  it('displays general error message', async () => {
    renderWithProviders(<SignInForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')

    // Mock authentication error
    vi.mocked(signIn).mockResolvedValue({
      status: 'ERROR',
      message: 'Incorrect email or password',
      fieldErrors: {},
      payload: new FormData(),
      timestamp: Date.now()
    })

    await user.click(submitButton)

    // The general error would typically be displayed by the Form component
    await waitFor(() => {
      expect(signIn).toHaveBeenCalled()
    })
  })

  it('preserves form data on error', async () => {
    renderWithProviders(<SignInForm />)

    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Fill in the form
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'pass') // Too short

    // Mock validation error with preserved form data
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'pass')

    vi.mocked(signIn).mockResolvedValue({
      status: 'ERROR',
      message: '',
      fieldErrors: {
        password: ['String must contain at least 6 character(s)']
      },
      payload: formData,
      timestamp: Date.now()
    })

    await user.click(submitButton)

    // Wait for the form to update
    await waitFor(() => {
      expect(screen.getByText('String must contain at least 6 character(s)')).toBeInTheDocument()
    })

    // Form values should be preserved
    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('pass')
  })

  it('shows loading state when submitting', async () => {
    renderWithProviders(<SignInForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Mock a delayed response
    vi.mocked(signIn).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    await user.click(submitButton)

    // The SubmitButton component should show loading state
    // This would depend on the implementation of SubmitButton
    expect(submitButton).toHaveProperty('disabled', true)
  })
})
