import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { upsertTicket } from '@/features/ticket/actions/upsert-ticket'
import { createMockTicket } from '@/test/factories'
import { renderWithProviders } from '@/test/helpers'
import { TicketUpsertForm } from '../ticket-upsert-form'

// Mock the upsertTicket action
vi.mock('@/features/ticket/actions/upsert-ticket', () => ({
  upsertTicket: vi.fn()
}))

// Mock DatePicker component to simplify testing
vi.mock('@/components/date-picker', () => ({
  DatePicker: ({ name, defaultValue, onSelect }: any) => (
    <input
      id={name}
      type="date"
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => onSelect && onSelect(new Date(e.target.value))}
    />
  ),
  ImperativeHandleFromDatePicker: {}
}))

describe('TicketUpsertForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create mode', () => {
    it('renders empty form in create mode', () => {
      renderWithProviders(<TicketUpsertForm />)

      expect(screen.getByLabelText('Title')).toHaveValue('')
      expect(screen.getByLabelText('Content')).toHaveValue('')
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    })

    it('submits form with valid data', async () => {
      renderWithProviders(<TicketUpsertForm />)

      const titleInput = screen.getByLabelText('Title')
      const contentInput = screen.getByLabelText('Content')
      const deadlineInput = screen.getByLabelText('Deadline')
      const bountyInput = screen.getByLabelText('Bounty ($)')
      const submitButton = screen.getByRole('button', { name: /create/i })

      // Fill in the form
      await user.type(titleInput, 'New Test Ticket')
      await user.type(contentInput, 'This is the ticket content')
      await user.type(deadlineInput, '2025-12-31')
      await user.type(bountyInput, '150.50')

      // Mock successful creation
      vi.mocked(upsertTicket).mockResolvedValue({
        status: 'SUCCESS',
        message: 'Ticket created',
        fieldErrors: {},
        timestamp: Date.now()
      })

      // Submit the form
      await user.click(submitButton)

      await waitFor(() => {
        expect(upsertTicket).toHaveBeenCalled()
      })
    })
  })

  describe('update mode', () => {
    it('renders form with existing ticket data', () => {
      const mockTicket = createMockTicket('user-1', 'org-1', {
        title: 'Existing Ticket',
        content: 'Existing content',
        deadline: '2025-12-25', // Use YYYY-MM-DD format
        bounty: 20000 // $200 in cents
      })

      renderWithProviders(<TicketUpsertForm ticket={mockTicket} />)

      expect(screen.getByLabelText('Title')).toHaveValue('Existing Ticket')
      expect(screen.getByLabelText('Content')).toHaveValue('Existing content')
      expect(screen.getByLabelText('Bounty ($)')).toHaveValue(200)
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })
  })

  it('displays validation errors', async () => {
    renderWithProviders(<TicketUpsertForm />)

    const submitButton = screen.getByRole('button', { name: /create/i })

    // Mock validation error response
    vi.mocked(upsertTicket).mockResolvedValue({
      status: 'ERROR',
      message: '',
      fieldErrors: {
        title: ['is required'],
        content: ['is required'],
        deadline: ['Is required'],
        bounty: ['Number must be greater than 0']
      },
      payload: new FormData(),
      timestamp: Date.now()
    })

    // Submit empty form
    await user.click(submitButton)

    // Check for error messages
    await waitFor(() => {
      // Use getAllByText for multiple "is required" messages
      const requiredErrors = screen.getAllByText('is required')
      expect(requiredErrors).toHaveLength(2) // title and content
      expect(screen.getByText('Is required')).toBeInTheDocument() // deadline
      expect(screen.getByText('Number must be greater than 0')).toBeInTheDocument() // bounty
    })
  })

  it('preserves form data on error', async () => {
    renderWithProviders(<TicketUpsertForm />)

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement
    const contentInput = screen.getByLabelText('Content') as HTMLTextAreaElement
    const submitButton = screen.getByRole('button', { name: /create/i })

    // Fill in partial form
    await user.type(titleInput, 'Test Title')
    await user.type(contentInput, 'Test Content')

    // Mock validation error with preserved form data
    const formData = new FormData()
    formData.append('title', 'Test Title')
    formData.append('content', 'Test Content')

    vi.mocked(upsertTicket).mockResolvedValue({
      status: 'ERROR',
      message: '',
      fieldErrors: {
        deadline: ['Is required'],
        bounty: ['Number must be greater than 0']
      },
      payload: formData,
      timestamp: Date.now()
    })

    await user.click(submitButton)

    // Wait for errors to appear
    await waitFor(() => {
      expect(screen.getByText('Is required')).toBeInTheDocument()
    })

    // Form values should be preserved
    expect(titleInput.value).toBe('Test Title')
    expect(contentInput.value).toBe('Test Content')
  })

  it('formats bounty input correctly', async () => {
    renderWithProviders(<TicketUpsertForm />)

    const bountyInput = screen.getByLabelText('Bounty ($)')

    // Type a decimal value
    await user.type(bountyInput, '99.99')

    expect(bountyInput).toHaveValue(99.99)
  })
})