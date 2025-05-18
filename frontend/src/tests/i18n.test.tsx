import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';
import LanguageSelector from '../components/common/LanguageSelector';
import Campaigns from '../pages/marketing/Campaigns';
import NotificationSettings from '../pages/settings/NotificationSettings';
import '@testing-library/jest-dom';

// Mock the stores
jest.mock('../store/campaignStore', () => ({
  useCampaignStore: jest.fn().mockReturnValue({
    campaigns: [],
    isLoading: false,
    error: null,
    fetchCampaigns: jest.fn(),
    deleteCampaign: jest.fn(),
    updateCampaign: jest.fn(),
  }),
  CampaignStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SCHEDULED: 'SCHEDULED',
    EXPIRED: 'EXPIRED',
  },
  CampaignType: {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT',
    BUY_X_GET_Y: 'BUY_X_GET_Y',
    FREE_ITEM: 'FREE_ITEM',
  },
}));

jest.mock('../store/notificationPreferenceStore', () => ({
  useNotificationPreferenceStore: jest.fn().mockReturnValue({
    preferences: [],
    isLoading: false,
    error: null,
    fetchPreferences: jest.fn(),
    updatePreference: jest.fn(),
    createDefaultPreferences: jest.fn(),
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Create a wrapper component that provides i18n
const I18nWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('Internationalization Tests', () => {
  beforeEach(() => {
    // Reset language to English before each test
    i18n.changeLanguage('en');
  });

  test('LanguageSelector changes language correctly', async () => {
    render(
      <I18nWrapper>
        <LanguageSelector />
      </I18nWrapper>
    );

    // Initially should show English
    expect(screen.getByText('English')).toBeInTheDocument();

    // Open the language dropdown
    fireEvent.click(screen.getByRole('button'));

    // Select Turkish
    fireEvent.click(screen.getByText('Turkish'));

    // Wait for language to change
    await waitFor(() => {
      expect(i18n.language).toBe('tr');
    });

    // Open the dropdown again to verify Turkish is selected
    fireEvent.click(screen.getByRole('button'));
    
    // Should now show Turkish text
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
  });

  test('Campaigns component displays correct translations', async () => {
    render(
      <I18nWrapper>
        <Campaigns />
      </I18nWrapper>
    );

    // Check English text
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('No campaigns found')).toBeInTheDocument();

    // Change language to Turkish
    i18n.changeLanguage('tr');

    // Wait for re-render with Turkish text
    await waitFor(() => {
      expect(screen.getByText('Kampanyalar')).toBeInTheDocument();
      expect(screen.getByText('Kampanya bulunamadı')).toBeInTheDocument();
    });
  });

  test('NotificationSettings component displays correct translations', async () => {
    render(
      <I18nWrapper>
        <NotificationSettings />
      </I18nWrapper>
    );

    // Check English text
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(screen.getByText('Create Default Preferences')).toBeInTheDocument();

    // Change language to Turkish
    i18n.changeLanguage('tr');

    // Wait for re-render with Turkish text
    await waitFor(() => {
      expect(screen.getByText('Bildirim Ayarları')).toBeInTheDocument();
      expect(screen.getByText('Varsayılan Tercihleri Oluştur')).toBeInTheDocument();
    });
  });

  test('Language persists after page reload', async () => {
    // Set language to Turkish
    i18n.changeLanguage('tr');
    localStorage.setItem('preferredLanguage', 'tr');

    // Simulate page reload by re-rendering the component
    render(
      <I18nWrapper>
        <LanguageSelector />
      </I18nWrapper>
    );

    // Should still be in Turkish
    expect(i18n.language).toBe('tr');
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
  });
});
