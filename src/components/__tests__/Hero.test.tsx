import { render, screen } from '@testing-library/react'
import Hero from '../Hero'
import { useAuth } from '@/components/providers/AuthProvider'

// Mock the Beams component to avoid Three.js issues in tests
jest.mock('@/components/ui/Beams', () => ({
  Beams: function MockBeams() {
    return <div data-testid="beams-background" />
  }
}))

jest.mock('@/components/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}))

describe('Hero Component', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the hero section with correct content', () => {
    render(<Hero />)
    
    // Check main heading
    expect(screen.getByText(/transform your content with ai-powered aeo/i)).toBeInTheDocument()
    
    // Check description
    expect(screen.getByText(/leverage artificial intelligence to optimize your content/i)).toBeInTheDocument()
    
    // Check for sign up button when not authenticated
    expect(screen.getByText(/get started free/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })

  it('renders dashboard button when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00.000Z'
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    })

    render(<Hero />)
    
    expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument()
    expect(screen.queryByText(/get started free/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
  })

  it('renders the background beams component', () => {
    render(<Hero />)
    
    expect(screen.getByTestId('beams-background')).toBeInTheDocument()
  })

  it('has correct button links', () => {
    render(<Hero />)
    
    const signUpButton = screen.getByText(/get started free/i).closest('a')
    const signInButton = screen.getByText(/sign in/i).closest('a')
    
    expect(signUpButton).toHaveAttribute('href', '/signup')
    expect(signInButton).toHaveAttribute('href', '/login')
  })

  it('has correct dashboard link when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00.000Z'
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    })

    render(<Hero />)
    
    const dashboardButton = screen.getByText(/go to dashboard/i).closest('a')
    expect(dashboardButton).toHaveAttribute('href', '/dashboard')
  })
})
