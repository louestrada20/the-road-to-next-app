export const createMockFormData = (data: Record<string, string | number | boolean>): FormData => {
  const formData = new FormData()
  
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, String(value))
  })
  
  return formData
}

export const createTicketFormData = (overrides: Record<string, any> = {}): FormData => {
  return createMockFormData({
    title: 'Test Ticket',
    content: 'Test ticket content',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD format
    bounty: '100.00',
    ...overrides,
  })
}

export const createSignInFormData = (email: string, password: string): FormData => {
  return createMockFormData({
    email,
    password,
  })
}

export const createSignUpFormData = (overrides: Record<string, any> = {}): FormData => {
  return createMockFormData({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  })
}
