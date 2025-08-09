import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Hero } from '../Hero'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Mock Auth to avoid needing a real provider in unit tests
jest.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
  }),
}))

describe('Hero Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    // Fully reset fetch mock (clears queued implementations)
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('renders the hero section with correct content', () => {
    render(<Hero />)
    
    // Check main heading
    expect(screen.getByText(/turn any webpage into/i)).toBeInTheDocument()
    expect(screen.getByText(/an AI answer engine/i)).toBeInTheDocument()
    
    // Check description
    expect(screen.getByText(/Get featured answers in Google Search and AI tools/i)).toBeInTheDocument()
  })

  it('renders the form with correct attributes', () => {
    render(<Hero />)
    
    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()
    expect(form).toHaveAttribute('id', 'audit-form')
    expect(form).toHaveAttribute('name', 'auditForm')
  })

  it('renders the URL input with correct attributes', () => {
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('id', 'url-input')
    expect(input).toHaveAttribute('name', 'url')
    expect(input).toHaveAttribute('type', 'url')
    expect(input).toHaveAttribute('placeholder', 'Enter the website url')
    expect(input).toHaveAttribute('autoComplete', 'url')
    expect(input).toHaveAttribute('data-testid', 'url-input')
    expect(input).toHaveAttribute('aria-label', 'Website URL input field')
    expect(input).toBeRequired()
  })

  it('renders the submit button with correct attributes', () => {
    render(<Hero />)
    
    const button = screen.getByRole('button', { name: /submit url/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('renders platform badges', () => {
    render(<Hero />)
    
    expect(screen.getByText('Webflow')).toBeInTheDocument()
    expect(screen.getByText('SEMrush')).toBeInTheDocument()
    expect(screen.getByText('Zapier')).toBeInTheDocument()
    expect(screen.getByText('Hubspot')).toBeInTheDocument()
  })

  it('submits valid URL successfully', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'URL submitted successfully!',
        data: {
          id: 'test-id',
          url: 'https://example.com',
          status: 'pending',
          createdAt: '2025-08-08T20:00:00.000Z',
        },
      }),
    })
    
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field')
    const submitButton = screen.getByRole('button', { name: /submit url/i })
    
    await user.type(input, 'https://example.com')
    await user.click(submitButton)
    
    // Check that fetch was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/submit-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      })
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        message: 'Internal server error',
      }),
    })
    
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field')
    const submitButton = screen.getByRole('button', { name: /submit url/i })
    
    await user.type(input, 'https://example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      // Inline error alert
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to submit|Internal server error/i)
    })
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    
    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field')
    const submitButton = screen.getByRole('button', { name: /submit url/i })
    
    await user.type(input, 'https://example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      // Inline error alert
      expect(screen.getByRole('alert')).toHaveTextContent(/Network error/i)
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock delayed API response
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field')
    const submitButton = screen.getByRole('button', { name: /submit url/i })
    
    await user.type(input, 'https://example.com')
    await user.click(submitButton)
    
    // Check loading state
    expect(screen.getByText(/Processing your URL/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(input).toBeDisabled()
  })

  it('prevents multiple submissions', async () => {
    const user = userEvent.setup()
    
    // Mock API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Success' }),
    })
    
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field')
    const submitButton = screen.getByRole('button', { name: /submit url/i })
    
    await user.type(input, 'https://example.com')
    
    // Click submit multiple times
    await user.click(submitButton)
    await user.click(submitButton)
    await user.click(submitButton)
    
    // Should only call fetch once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it('clears form after successful submission', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'URL submitted successfully!',
        data: { id: 'test-id', url: 'https://example.com', status: 'pending' },
      }),
    })
    
    render(<Hero />)
    
    const input = screen.getByLabelText('Website URL input field') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit url/i })
    
    await user.type(input, 'https://example.com')
    expect(input.value).toBe('https://example.com')
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it.skip('shows toast notification on success', async () => {})

  it.skip('shows toast notification on error', async () => {})
})
