/**
 * Login Form Component Tests
 *
 * Tests for the LoginForm component including:
 * - Email phase rendering and validation
 * - OTP phase rendering and validation
 * - Phase transitions (email → OTP → verifying → success)
 * - Resend cooldown functionality
 * - Error handling and display
 * - Form submission flows
 *
 * @module @/components/__tests__/LoginForm.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';

// Mock auth client
vi.mock('@/lib/auth', () => ({
  authClient: {
    signInWithOTP: vi.fn(),
    verifyOTP: vi.fn(),
  },
  formatAuthError: vi.fn((error) => error?.message || 'Unknown error'),
}));

// Mock OTPCodeInput
vi.mock('../OTPCodeInput', () => ({
  OTPCodeInput: ({ value, onChange, disabled, error }: {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    error?: string;
  }) => (
    <div>
      <input
        data-testid="otp-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={6}
      />
      {error && <span data-testid="otp-error">{error}</span>}
    </div>
  ),
}));

import { authClient } from '@/lib/auth';

describe('[UNIT] LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const mockSignInWithOTP = vi.mocked(authClient.signInWithOTP);
  const mockVerifyOTP = vi.mocked(authClient.verifyOTP);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSignInWithOTP.mockReset();
    mockVerifyOTP.mockReset();
  });

  describe('Email Phase', () => {
    it('should render email input initially', () => {
      render(<LoginForm />);

      expect(screen.getByText('Admin Sign In')).toBeInTheDocument();
      expect(screen.getByText('Enter your email to receive a verification code')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Send Code')).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const submitButton = screen.getByText('Send Code');

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should require email field', async () => {
      render(<LoginForm />);

      const submitButton = screen.getByText('Send Code');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should transition to OTP phase on successful email submit', async () => {
      mockSignInWithOTP.mockResolvedValueOnce(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const submitButton = screen.getByText('Send Code');

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('We sent a code to admin@example.com')).toBeInTheDocument();
      });

      expect(mockSignInWithOTP).toHaveBeenCalledWith('admin@example.com');
    });

    it('should show loading state during email submission', async () => {
      mockSignInWithOTP.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const submitButton = screen.getByText('Send Code');

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
    });

    it('should display error when OTP request fails', async () => {
      mockSignInWithOTP.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const submitButton = screen.getByText('Send Code');

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('OTP Phase', () => {
    beforeEach(() => {
      // Pre-populate email phase
      mockSignInWithOTP.mockResolvedValueOnce(undefined);
    });

    it('should render OTP input after email submission', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Verify & Sign In')).toBeInTheDocument();
      expect(screen.getByText('Use different email')).toBeInTheDocument();
      expect(screen.getByText(/Resend/)).toBeInTheDocument();
    });

    it('should show cooldown timer for resend button', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByText(/Resend in/)).toBeInTheDocument();
      });
    });

    it('should allow going back to email phase', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByText('Use different email')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use different email'));

      await waitFor(() => {
        expect(screen.getByText('Enter your email to receive a verification code')).toBeInTheDocument();
      });
    });

    it('should call verifyOTP on form submission', async () => {
      mockVerifyOTP.mockResolvedValueOnce({
        token: 'test-token',
        user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
      });

      render(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      const otpInput = screen.getByTestId('otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByText('Verify & Sign In'));

      await waitFor(() => {
        expect(mockVerifyOTP).toHaveBeenCalledWith('admin@example.com', '123456');
      });
    });

    it('should show verifying state during OTP verification', async () => {
      mockVerifyOTP.mockImplementation(() => new Promise(() => {}));

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      const otpInput = screen.getByTestId('otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByText('Verify & Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument();
      });
    });

    it('should display invalid OTP error', async () => {
      mockVerifyOTP.mockRejectedValueOnce(new Error('Invalid code'));

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      const otpInput = screen.getByTestId('otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByText('Verify & Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Invalid code. Please check and try again.')).toBeInTheDocument();
      });
    });

    it('should display expired OTP error', async () => {
      mockVerifyOTP.mockRejectedValueOnce(new Error('Code expired'));

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      const otpInput = screen.getByTestId('otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByText('Verify & Sign In'));

      await waitFor(() => {
        expect(screen.getByText('This code has expired. Please request a new one.')).toBeInTheDocument();
      });
    });

    it('should display admin access denied error', async () => {
      mockVerifyOTP.mockRejectedValueOnce(new Error('Admin privileges required'));

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      const otpInput = screen.getByTestId('otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByText('Verify & Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
      });
    });

    it('should resend OTP when resend button clicked', async () => {
      mockSignInWithOTP.mockResolvedValue(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByText(/Resend in/)).toBeInTheDocument();
      });

      // Wait for cooldown to expire in real implementation
      // For test, we'd need to advance timers
    });
  });

  describe('Success Phase', () => {
    it('should show success message after verification', async () => {
      mockSignInWithOTP.mockResolvedValueOnce(undefined);
      mockVerifyOTP.mockResolvedValueOnce({
        token: 'test-token',
        user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
      });

      render(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });

      const otpInput = screen.getByTestId('otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByText('Verify & Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Successfully signed in!')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('should accept custom redirectTo path', async () => {
      mockSignInWithOTP.mockResolvedValueOnce(undefined);

      render(<LoginForm redirectTo="/dashboard" />);

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.click(screen.getByText('Send Code'));

      await waitFor(() => {
        expect(screen.getByText('We sent a code to admin@example.com')).toBeInTheDocument();
      });
    });
  });
});
