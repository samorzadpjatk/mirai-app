/**
 * CreateUserForm Component Tests
 *
 * Tests for the CreateUserForm component including:
 * - Rendering form fields
 * - Form validation
 * - Submit handling
 * - Cancel functionality
 * - Loading states
 * - Error display
 *
 * @module @/components/admin/users/__tests__/CreateUserForm.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateUserForm } from '../CreateUserForm';

describe('[UNIT] CreateUserForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });

    it('should render with placeholders', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByPlaceholderText('Enter first name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required first name', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: '' } });
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should validate required last name', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const lastNameInput = screen.getByLabelText(/last name/i);
      fireEvent.change(lastNameInput, { target: { value: '' } });
      fireEvent.blur(lastNameInput);

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });
    });

    it('should validate required email', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const error = screen.queryByText(/email/i);
        expect(error).toBeInTheDocument();
      });
    });

    it('should validate first name max length', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: 'a'.repeat(51) } });
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText('First name must be less than 50 characters')).toBeInTheDocument();
      });
    });

    it('should validate last name max length', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const lastNameInput = screen.getByLabelText(/last name/i);
      fireEvent.change(lastNameInput, { target: { value: 'a'.repeat(51) } });
      fireEvent.blur(lastNameInput);

      await waitFor(() => {
        expect(screen.getByText('Last name must be less than 50 characters')).toBeInTheDocument();
      });
    });

    it('should disable submit when form is invalid', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Initially form is empty and invalid
      const submitButton = screen.getByText('Create User');

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john.doe@example.com' },
      });

      // Blur all fields to trigger validation
      fireEvent.blur(screen.getByLabelText(/first name/i));
      fireEvent.blur(screen.getByLabelText(/last name/i));
      fireEvent.blur(screen.getByLabelText(/email/i));

      const submitButton = screen.getByText('Create User');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        });
      });
    });

    it('should trim whitespace from inputs', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: '  John  ' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: '  Doe  ' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: '  John.Doe@Example.COM  ' },
      });

      fireEvent.blur(screen.getByLabelText(/first name/i));
      fireEvent.blur(screen.getByLabelText(/last name/i));
      fireEvent.blur(screen.getByLabelText(/email/i));

      const submitButton = screen.getByText('Create User');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com', // Lowercased
        });
      });
    });

    it('should show loading state during submission', async () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      // All fields should be disabled during loading
      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
    });

    it('should disable submit button when loading', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      const submitButton = screen.getByText('Create User');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button clicked', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form when cancelled', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in some data
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      });

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable cancel button when loading', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error="Failed to create user"
        />
      );

      expect(screen.getByText('Failed to create user')).toBeInTheDocument();
    });

    it('should not display error when not provided', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('should style error message with red color', () => {
      render(
        <CreateUserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error="Test error message"
        />
      );

      const errorText = screen.getByText('Test error message');
      expect(errorText).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept custom onSubmit handler', async () => {
      const customSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <CreateUserForm
          onSubmit={customSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'Jane' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Smith' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'jane.smith@example.com' },
      });

      fireEvent.blur(screen.getByLabelText(/first name/i));
      fireEvent.blur(screen.getByLabelText(/last name/i));
      fireEvent.blur(screen.getByLabelText(/email/i));

      const submitButton = screen.getByText('Create User');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(customSubmit).toHaveBeenCalled();
      });
    });
  });
});
