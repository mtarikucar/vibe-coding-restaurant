import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgotPassword from '../ForgotPassword';
import { authAPI } from '../../../services/api';

// Mock the API and translations
vi.mock('../../../services/api', () => ({
 authAPI: {
  requestPasswordReset: vi.fn(),
 },
}));

vi.mock('react-i18next', () => ({
 useTranslation: () => ({
  t: (key: string) => {
   const translations: Record<string, string> = {
    'auth.email': 'Email',
    'auth.resetPassword': 'Reset Password',
    'auth.passwordResetSent': 'If your email is registered, you will receive a password reset link shortly.',
    'auth.returnToLogin': 'Return to Login',
    'auth.rememberPassword': 'Remember your password?',
    'auth.signIn': 'Sign In',
    'common.loading': 'Loading...',
   };
   return translations[key] || key;
  },
 }),
}));

describe('ForgotPassword Component', () => {
 beforeEach(() => {
  vi.clearAllMocks();
 });

 it('renders the forgot password form', () => {
  render(
   <BrowserRouter>
    <ForgotPassword />
   </BrowserRouter>
  );

  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
 });

 it('shows validation error when submitting without email', async () => {
  render(
   <BrowserRouter>
    <ForgotPassword />
   </BrowserRouter>
  );

  const submitButton = screen.getByRole('button', { name: /reset password/i });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
  expect(authAPI.requestPasswordReset).not.toHaveBeenCalled();
 });

 it('calls the API and shows success message when form is submitted with valid email', async () => {
  (authAPI.requestPasswordReset as any).mockResolvedValue({
   message: 'If your email is registered, you will receive a password reset link',
  });

  render(
   <BrowserRouter>
    <ForgotPassword />
   </BrowserRouter>
  );

  const emailInput = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(authAPI.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  await waitFor(() => {
   expect(screen.getByText(/if your email is registered, you will receive a password reset link shortly/i)).toBeInTheDocument();
  });

  expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
 });

 it('shows error message when API call fails', async () => {
  const errorMessage = 'Failed to send password reset email';
  (authAPI.requestPasswordReset as any).mockRejectedValue({
   response: {
    data: {
     message: errorMessage,
    },
   },
  });

  render(
   <BrowserRouter>
    <ForgotPassword />
   </BrowserRouter>
  );

  const emailInput = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(authAPI.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  await waitFor(() => {
   expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
 });

 it('shows loading state while submitting', async () => {
  // Delay the API response to test loading state
  (authAPI.requestPasswordReset as any).mockImplementation(() => {
   return new Promise((resolve) => {
    setTimeout(() => {
     resolve({
      message: 'If your email is registered, you will receive a password reset link',
     });
    }, 100);
   });
  });

  render(
   <BrowserRouter>
    <ForgotPassword />
   </BrowserRouter>
  );

  const emailInput = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.click(submitButton);

  // Check for loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(submitButton).toBeDisabled();

  // Wait for the API call to complete
  await waitFor(() => {
   expect(screen.getByText(/if your email is registered, you will receive a password reset link shortly/i)).toBeInTheDocument();
  });
 });
});
