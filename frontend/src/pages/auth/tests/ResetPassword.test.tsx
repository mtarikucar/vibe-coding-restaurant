import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ResetPassword from '../ResetPassword';
import { authAPI } from '../../../services/api';

// Mock the API and translations
vi.mock('../../../services/api', () => ({
 authAPI: {
  verifyResetToken: vi.fn(),
  resetPassword: vi.fn(),
 },
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
 const actual = await vi.importActual('react-router-dom');
 return {
  ...actual,
  useSearchParams: () => [
   new URLSearchParams({ token: 'valid-token' }),
   vi.fn(),
  ],
  useNavigate: () => vi.fn(),
 };
});

vi.mock('react-i18next', () => ({
 useTranslation: () => ({
  t: (key: string) => {
   const translations: Record<string, string> = {
    'auth.newPassword': 'New Password',
    'auth.confirmNewPassword': 'Confirm New Password',
    'auth.resetPassword': 'Reset Password',
    'auth.passwordResetSuccess': 'Password has been reset successfully',
    'auth.verifyingToken': 'Verifying token...',
    'auth.invalidResetToken': 'Invalid or expired reset token',
    'auth.requestNewReset': 'Request a new reset link',
    'common.loading': 'Loading...',
   };
   return translations[key] || key;
  },
 }),
}));

describe('ResetPassword Component', () => {
 beforeEach(() => {
  vi.clearAllMocks();
 });

 it('shows loading state while verifying token', () => {
  // Mock token verification in progress
  (authAPI.verifyResetToken as any).mockImplementation(() => new Promise(() => {}));

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  expect(screen.getByText(/verifying token/i)).toBeInTheDocument();
  expect(authAPI.verifyResetToken).toHaveBeenCalledWith('valid-token');
 });

 it('shows error message for invalid token', async () => {
  // Mock invalid token
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: false });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByText(/invalid or expired reset token/i)).toBeInTheDocument();
  });

  expect(screen.getByRole('link', { name: /request a new reset link/i })).toBeInTheDocument();
 });

 it('renders the reset password form for valid token', async () => {
  // Mock valid token
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: true });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
 });

 it('shows validation error when submitting without passwords', async () => {
  // Mock valid token
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: true });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  const submitButton = screen.getByRole('button', { name: /reset password/i });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
  });

  expect(authAPI.resetPassword).not.toHaveBeenCalled();
 });

 it('shows validation error when passwords do not match', async () => {
  // Mock valid token
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: true });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  const passwordInput = screen.getByLabelText(/new password/i);
  const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
  fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  expect(authAPI.resetPassword).not.toHaveBeenCalled();
 });

 it('shows validation error when password is too short', async () => {
  // Mock valid token
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: true });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  const passwordInput = screen.getByLabelText(/new password/i);
  const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(passwordInput, { target: { value: 'short' } });
  fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
  });

  expect(authAPI.resetPassword).not.toHaveBeenCalled();
 });

 it('calls the API and shows success message when form is submitted with valid data', async () => {
  // Mock valid token and successful password reset
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: true });
  (authAPI.resetPassword as any).mockResolvedValue({
   message: 'Password has been reset successfully',
  });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  const passwordInput = screen.getByLabelText(/new password/i);
  const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
  fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(authAPI.resetPassword).toHaveBeenCalledWith(
    'valid-token',
    'newpassword',
    'newpassword'
   );
  });

  await waitFor(() => {
   expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
  });
 });

 it('shows error message when API call fails', async () => {
  // Mock valid token but failed password reset
  (authAPI.verifyResetToken as any).mockResolvedValue({ valid: true });
  const errorMessage = 'Invalid or expired password reset token';
  (authAPI.resetPassword as any).mockRejectedValue({
   response: {
    data: {
     message: errorMessage,
    },
   },
  });

  render(
   <BrowserRouter>
    <ResetPassword />
   </BrowserRouter>
  );

  await waitFor(() => {
   expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  const passwordInput = screen.getByLabelText(/new password/i);
  const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
  const submitButton = screen.getByRole('button', { name: /reset password/i });

  fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
  fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });
  fireEvent.click(submitButton);

  await waitFor(() => {
   expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
 });
});
