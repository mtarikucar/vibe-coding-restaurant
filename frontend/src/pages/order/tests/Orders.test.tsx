import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Orders from '../Orders';
import { orderAPI } from '../../../services/api';
import useAuthStore from '../../../store/authStore';

// Mock the API service
vi.mock('../../../services/api', () => ({
  orderAPI: {
    getOrders: vi.fn(),
    getOrdersByStatus: vi.fn(),
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../../store/authStore', () => ({
  default: {
    getState: vi.fn().mockReturnValue({
      user: {
        id: 'user-id',
        username: 'testuser',
        fullName: 'Test User',
        role: 'waiter',
      },
      accessToken: 'access-token',
    }),
  },
}));

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock data
const mockOrders = [
  {
    id: 'order-1',
    orderNumber: 'ORD-123456',
    status: 'pending',
    totalAmount: 21.98,
    createdAt: '2023-06-15T10:30:00Z',
    table: { id: 'table-1', number: 1 },
    waiter: { id: 'user-id', fullName: 'Test User' },
    items: [
      {
        id: 'item-1',
        menuItem: { id: 'menu-1', name: 'Caesar Salad' },
        quantity: 1,
        price: 8.99,
        status: 'pending',
      },
      {
        id: 'item-2',
        menuItem: { id: 'menu-2', name: 'Chicken Burger' },
        quantity: 1,
        price: 12.99,
        status: 'pending',
      },
    ],
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-789012',
    status: 'preparing',
    totalAmount: 15.98,
    createdAt: '2023-06-15T11:00:00Z',
    table: { id: 'table-2', number: 2 },
    waiter: { id: 'user-id', fullName: 'Test User' },
    items: [
      {
        id: 'item-3',
        menuItem: { id: 'menu-3', name: 'Greek Salad' },
        quantity: 1,
        price: 8.99,
        status: 'preparing',
      },
      {
        id: 'item-4',
        menuItem: { id: 'menu-4', name: 'Fries' },
        quantity: 1,
        price: 6.99,
        status: 'preparing',
      },
    ],
  },
];

describe('Orders Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    (orderAPI.getOrders as any).mockResolvedValue(mockOrders);
    (orderAPI.getOrdersByStatus as any).mockImplementation((status) => {
      return Promise.resolve(mockOrders.filter(order => order.status === status));
    });
  });

  it('should render the orders page with orders', async () => {
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    // Check that the page title is rendered
    expect(screen.getByText(/orders.title/i)).toBeInTheDocument();

    // Wait for the orders to be loaded
    await waitFor(() => {
      expect(orderAPI.getOrders).toHaveBeenCalled();
    });

    // Check that order numbers are rendered
    await waitFor(() => {
      expect(screen.getByText('ORD-123456')).toBeInTheDocument();
      expect(screen.getByText('ORD-789012')).toBeInTheDocument();
    });

    // Check that order statuses are displayed
    await waitFor(() => {
      expect(screen.getByText(/orders.status.pending/i)).toBeInTheDocument();
      expect(screen.getByText(/orders.status.preparing/i)).toBeInTheDocument();
    });

    // Check that table numbers are displayed
    await waitFor(() => {
      expect(screen.getByText(/orders.table/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Check that total amounts are displayed
    await waitFor(() => {
      expect(screen.getByText('$21.98')).toBeInTheDocument();
      expect(screen.getByText('$15.98')).toBeInTheDocument();
    });
  });

  it('should filter orders by status', async () => {
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    // Wait for the orders to be loaded
    await waitFor(() => {
      expect(orderAPI.getOrders).toHaveBeenCalled();
    });

    // Find the status filter dropdown
    const statusFilter = screen.getByLabelText(/orders.filterByStatus/i);
    
    // Select the "preparing" status
    fireEvent.change(statusFilter, { target: { value: 'preparing' } });
    
    // Check that the API was called with the correct status
    await waitFor(() => {
      expect(orderAPI.getOrdersByStatus).toHaveBeenCalledWith('preparing');
    });
    
    // Check that only the preparing order is displayed
    await waitFor(() => {
      expect(screen.queryByText('ORD-123456')).not.toBeInTheDocument();
      expect(screen.getByText('ORD-789012')).toBeInTheDocument();
    });
  });

  it('should open the order details when clicking on an order', async () => {
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    // Wait for the orders to be loaded
    await waitFor(() => {
      expect(orderAPI.getOrders).toHaveBeenCalled();
    });

    // Find and click the first order
    const orderRow = screen.getByText('ORD-123456').closest('tr');
    fireEvent.click(orderRow);
    
    // Check that the order details modal is displayed
    await waitFor(() => {
      expect(screen.getByText(/orders.details/i)).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
    });
  });

  it('should update order status', async () => {
    // Mock the updateOrderStatus API call
    (orderAPI.updateOrderStatus as any).mockResolvedValue({
      ...mockOrders[0],
      status: 'preparing',
    });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    // Wait for the orders to be loaded
    await waitFor(() => {
      expect(orderAPI.getOrders).toHaveBeenCalled();
    });

    // Find and click the first order
    const orderRow = screen.getByText('ORD-123456').closest('tr');
    fireEvent.click(orderRow);
    
    // Wait for the order details modal to be displayed
    await waitFor(() => {
      expect(screen.getByText(/orders.details/i)).toBeInTheDocument();
    });
    
    // Find and click the "Prepare" button
    const prepareButton = screen.getByText(/orders.actions.prepare/i);
    fireEvent.click(prepareButton);
    
    // Check that the API was called with the correct order ID and status
    await waitFor(() => {
      expect(orderAPI.updateOrderStatus).toHaveBeenCalledWith('order-1', 'preparing');
    });
    
    // Check that the order status is updated in the UI
    await waitFor(() => {
      expect(screen.getByText(/orders.status.preparing/i)).toBeInTheDocument();
    });
  });

  it('should open the create order form when clicking the add button', async () => {
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    // Wait for the orders to be loaded
    await waitFor(() => {
      expect(orderAPI.getOrders).toHaveBeenCalled();
    });

    // Find and click the add order button
    const addButton = screen.getByText(/orders.addOrder/i);
    fireEvent.click(addButton);
    
    // Check that the create order form is displayed
    await waitFor(() => {
      expect(screen.getByText(/orders.newOrder/i)).toBeInTheDocument();
    });
  });
});
