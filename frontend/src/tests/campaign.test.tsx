import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useCampaignStore } from '../store/campaignStore';
import Campaigns from '../pages/marketing/Campaigns';
import CampaignForm from '../pages/marketing/CampaignForm';
import '@testing-library/jest-dom';

// Mock the campaign store
jest.mock('../store/campaignStore', () => ({
 useCampaignStore: jest.fn(),
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
 useParams: () => ({ id: '123' }),
}));

describe('Campaign Components', () => {
 // Test data
 const mockCampaigns = [
  {
   id: '1',
   name: 'Summer Sale',
   description: 'Summer discount campaign',
   type: 'DISCOUNT',
   status: 'ACTIVE',
   startDate: '2023-06-01',
   endDate: '2023-08-31',
   discountValue: 15,
   discountType: 'PERCENTAGE',
   applicability: 'ALL_ITEMS',
   code: 'SUMMER15',
   createdAt: '2023-05-15T10:00:00Z',
   updatedAt: '2023-05-15T10:00:00Z',
  },
  {
   id: '2',
   name: 'Happy Hour',
   description: 'Discount on drinks',
   type: 'DISCOUNT',
   status: 'SCHEDULED',
   startDate: '2023-07-01',
   endDate: '2023-07-31',
   discountValue: 20,
   discountType: 'PERCENTAGE',
   applicability: 'CATEGORY',
   categoryId: 'drinks-123',
   code: 'HAPPY20',
   createdAt: '2023-06-15T10:00:00Z',
   updatedAt: '2023-06-15T10:00:00Z',
  },
 ];

 // Test for Campaigns component
 describe('Campaigns Component', () => {
  beforeEach(() => {
   // Mock the campaign store implementation
   (useCampaignStore as jest.Mock).mockImplementation(() => ({
    campaigns: mockCampaigns,
    isLoading: false,
    error: null,
    fetchCampaigns: jest.fn(),
    deleteCampaign: jest.fn(),
   }));
  });

  test('renders campaigns list correctly', async () => {
   render(
    <BrowserRouter>
     <Campaigns />
    </BrowserRouter>
   );

   // Check if campaigns are rendered
   await waitFor(() => {
    expect(screen.getByText('Summer Sale')).toBeInTheDocument();
    expect(screen.getByText('Happy Hour')).toBeInTheDocument();
   });
  });

  test('shows loading state', async () => {
   // Mock loading state
   (useCampaignStore as jest.Mock).mockImplementation(() => ({
    campaigns: [],
    isLoading: true,
    error: null,
    fetchCampaigns: jest.fn(),
    deleteCampaign: jest.fn(),
   }));

   render(
    <BrowserRouter>
     <Campaigns />
    </BrowserRouter>
   );

   // Check if loading indicator is shown
   await waitFor(() => {
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
   });
  });

  test('shows error state', async () => {
   // Mock error state
   (useCampaignStore as jest.Mock).mockImplementation(() => ({
    campaigns: [],
    isLoading: false,
    error: 'Failed to load campaigns',
    fetchCampaigns: jest.fn(),
    deleteCampaign: jest.fn(),
   }));

   render(
    <BrowserRouter>
     <Campaigns />
    </BrowserRouter>
   );

   // Check if error message is shown
   await waitFor(() => {
    expect(screen.getByText(/failed to load campaigns/i)).toBeInTheDocument();
   });
  });
 });

 // Test for CampaignForm component
 describe('CampaignForm Component', () => {
  beforeEach(() => {
   // Mock the campaign store implementation for form
   (useCampaignStore as jest.Mock).mockImplementation(() => ({
    campaign: null,
    isLoading: false,
    error: null,
    fetchCampaign: jest.fn(),
    createCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    clearCampaign: jest.fn(),
   }));
  });

  test('renders form correctly', () => {
   render(
    <BrowserRouter>
     <CampaignForm />
    </BrowserRouter>
   );

   // Check if form elements are rendered
   expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
   expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
   expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
   expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  test('submits form with correct data', async () => {
   const createCampaignMock = jest.fn();
   
   // Mock the campaign store implementation with create function
   (useCampaignStore as jest.Mock).mockImplementation(() => ({
    campaign: null,
    isLoading: false,
    error: null,
    fetchCampaign: jest.fn(),
    createCampaign: createCampaignMock,
    updateCampaign: jest.fn(),
    clearCampaign: jest.fn(),
   }));

   render(
    <BrowserRouter>
     <CampaignForm />
    </BrowserRouter>
   );

   // Fill the form
   fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Campaign' } });
   fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
   
   // Submit the form
   fireEvent.click(screen.getByRole('button', { name: /save/i }));

   // Check if createCampaign was called
   await waitFor(() => {
    expect(createCampaignMock).toHaveBeenCalled();
   });
  });
 });
});
