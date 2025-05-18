import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { useNotificationPreferenceStore } from '../store/notificationPreferenceStore';
import NotificationSettings from '../pages/settings/NotificationSettings';
import '@testing-library/jest-dom';

// Mock the notification stores
jest.mock('../store/notificationStore', () => ({
  useNotificationStore: jest.fn(),
}));

jest.mock('../store/notificationPreferenceStore', () => ({
  useNotificationPreferenceStore: jest.fn(),
}));

// Mock the API service
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Notification Components', () => {
  // Test data
  const mockNotificationPreferences = [
    {
      id: '1',
      userId: 'user-123',
      tenantId: 'tenant-123',
      notificationType: 'ORDER',
      channel: 'IN_APP',
      enabled: true,
      createdAt: '2023-05-15T10:00:00Z',
      updatedAt: '2023-05-15T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user-123',
      tenantId: 'tenant-123',
      notificationType: 'ORDER',
      channel: 'EMAIL',
      enabled: false,
      createdAt: '2023-05-15T10:00:00Z',
      updatedAt: '2023-05-15T10:00:00Z',
    },
    {
      id: '3',
      userId: 'user-123',
      tenantId: 'tenant-123',
      notificationType: 'PAYMENT',
      channel: 'IN_APP',
      enabled: true,
      createdAt: '2023-05-15T10:00:00Z',
      updatedAt: '2023-05-15T10:00:00Z',
    },
  ];

  // Test for NotificationSettings component
  describe('NotificationSettings Component', () => {
    beforeEach(() => {
      // Mock the notification preference store implementation
      (useNotificationPreferenceStore as jest.Mock).mockImplementation(() => ({
        preferences: mockNotificationPreferences,
        isLoading: false,
        error: null,
        fetchPreferences: jest.fn(),
        updatePreference: jest.fn(),
        createDefaultPreferences: jest.fn(),
        clearError: jest.fn(),
      }));
    });

    test('renders notification preferences correctly', async () => {
      render(
        <BrowserRouter>
          <NotificationSettings />
        </BrowserRouter>
      );

      // Check if preferences are rendered
      await waitFor(() => {
        expect(screen.getByText(/order/i)).toBeInTheDocument();
        expect(screen.getByText(/payment/i)).toBeInTheDocument();
      });
    });

    test('shows loading state', async () => {
      // Mock loading state
      (useNotificationPreferenceStore as jest.Mock).mockImplementation(() => ({
        preferences: [],
        isLoading: true,
        error: null,
        fetchPreferences: jest.fn(),
        updatePreference: jest.fn(),
        createDefaultPreferences: jest.fn(),
        clearError: jest.fn(),
      }));

      render(
        <BrowserRouter>
          <NotificationSettings />
        </BrowserRouter>
      );

      // Check if loading indicator is shown
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });

    test('shows error state', async () => {
      // Mock error state
      (useNotificationPreferenceStore as jest.Mock).mockImplementation(() => ({
        preferences: [],
        isLoading: false,
        error: 'Failed to load notification preferences',
        fetchPreferences: jest.fn(),
        updatePreference: jest.fn(),
        createDefaultPreferences: jest.fn(),
        clearError: jest.fn(),
      }));

      render(
        <BrowserRouter>
          <NotificationSettings />
        </BrowserRouter>
      );

      // Check if error message is shown
      await waitFor(() => {
        expect(screen.getByText(/failed to load notification preferences/i)).toBeInTheDocument();
      });
    });

    test('toggles notification preference', async () => {
      const updatePreferenceMock = jest.fn();
      
      // Mock the notification preference store implementation with update function
      (useNotificationPreferenceStore as jest.Mock).mockImplementation(() => ({
        preferences: mockNotificationPreferences,
        isLoading: false,
        error: null,
        fetchPreferences: jest.fn(),
        updatePreference: updatePreferenceMock,
        createDefaultPreferences: jest.fn(),
        clearError: jest.fn(),
      }));

      render(
        <BrowserRouter>
          <NotificationSettings />
        </BrowserRouter>
      );

      // Find and click a toggle switch
      const toggles = screen.getAllByRole('checkbox');
      fireEvent.click(toggles[0]);

      // Check if updatePreference was called
      await waitFor(() => {
        expect(updatePreferenceMock).toHaveBeenCalled();
      });
    });

    test('creates default preferences', async () => {
      const createDefaultPreferencesMock = jest.fn();
      
      // Mock the notification preference store implementation with create function
      (useNotificationPreferenceStore as jest.Mock).mockImplementation(() => ({
        preferences: [],
        isLoading: false,
        error: null,
        fetchPreferences: jest.fn(),
        updatePreference: jest.fn(),
        createDefaultPreferences: createDefaultPreferencesMock,
        clearError: jest.fn(),
      }));

      render(
        <BrowserRouter>
          <NotificationSettings />
        </BrowserRouter>
      );

      // Find and click the create default preferences button
      const button = screen.getByRole('button', { name: /create default preferences/i });
      fireEvent.click(button);

      // Check if createDefaultPreferences was called
      await waitFor(() => {
        expect(createDefaultPreferencesMock).toHaveBeenCalled();
      });
    });
  });
});
