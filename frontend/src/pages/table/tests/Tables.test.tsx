import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Tables from '../Tables';
import { tableAPI, orderAPI } from '../../../services/api';
import useAuthStore from '../../../store/authStore';

// Mock the API service
vi.mock('../../../services/api', () => ({
 tableAPI: {
  getTables: vi.fn(),
  updateTableStatus: vi.fn(),
  createTable: vi.fn(),
 },
 orderAPI: {
  getOrdersByTable: vi.fn(),
  createOrder: vi.fn(),
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
const mockTables = [
 {
  id: 'table-1',
  number: 1,
  capacity: 4,
  status: 'available',
 },
 {
  id: 'table-2',
  number: 2,
  capacity: 2,
  status: 'occupied',
 },
 {
  id: 'table-3',
  number: 3,
  capacity: 6,
  status: 'reserved',
 },
];

const mockOrders = [
 {
  id: 'order-1',
  orderNumber: 'ORD-123456',
  status: 'served',
  totalAmount: 21.98,
  createdAt: '2023-06-15T10:30:00Z',
  table: { id: 'table-2', number: 2 },
  waiter: { id: 'user-id', fullName: 'Test User' },
  items: [
   {
    id: 'item-1',
    menuItem: { id: 'menu-1', name: 'Caesar Salad' },
    quantity: 1,
    price: 8.99,
    status: 'served',
   },
   {
    id: 'item-2',
    menuItem: { id: 'menu-2', name: 'Chicken Burger' },
    quantity: 1,
    price: 12.99,
    status: 'served',
   },
  ],
 },
];

describe('Tables Component', () => {
 beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock API responses
  (tableAPI.getTables as any).mockResolvedValue(mockTables);
  (orderAPI.getOrdersByTable as any).mockImplementation((tableId) => {
   return Promise.resolve(mockOrders.filter(order => order.table.id === tableId));
  });
 });

 it('should render the tables page with tables', async () => {
  render(
   <BrowserRouter>
    <Tables />
   </BrowserRouter>
  );

  // Check that the page title is rendered
  expect(screen.getByText(/tables.title/i)).toBeInTheDocument();

  // Wait for the tables to be loaded
  await waitFor(() => {
   expect(tableAPI.getTables).toHaveBeenCalled();
  });

  // Check that table numbers are rendered
  await waitFor(() => {
   expect(screen.getByText('1')).toBeInTheDocument();
   expect(screen.getByText('2')).toBeInTheDocument();
   expect(screen.getByText('3')).toBeInTheDocument();
  });

  // Check that table statuses are displayed with correct colors
  await waitFor(() => {
   const availableTable = screen.getByText('1').closest('.table-card');
   const occupiedTable = screen.getByText('2').closest('.table-card');
   const reservedTable = screen.getByText('3').closest('.table-card');
   
   expect(availableTable).toHaveClass('bg-green-100');
   expect(occupiedTable).toHaveClass('bg-red-100');
   expect(reservedTable).toHaveClass('bg-yellow-100');
  });

  // Check that capacity is displayed
  await waitFor(() => {
   expect(screen.getByText(/tables.capacity/i)).toBeInTheDocument();
   expect(screen.getByText('4')).toBeInTheDocument();
   expect(screen.getByText('2')).toBeInTheDocument();
   expect(screen.getByText('6')).toBeInTheDocument();
  });
 });

 it('should show table details when clicking on a table', async () => {
  render(
   <BrowserRouter>
    <Tables />
   </BrowserRouter>
  );

  // Wait for the tables to be loaded
  await waitFor(() => {
   expect(tableAPI.getTables).toHaveBeenCalled();
  });

  // Find and click the occupied table (table 2)
  const occupiedTable = screen.getByText('2').closest('.table-card');
  fireEvent.click(occupiedTable);
  
  // Check that the table details modal is displayed
  await waitFor(() => {
   expect(screen.getByText(/tables.details/i)).toBeInTheDocument();
   expect(screen.getByText(/tables.currentOrder/i)).toBeInTheDocument();
  });
  
  // Check that the API was called to get orders for this table
  expect(orderAPI.getOrdersByTable).toHaveBeenCalledWith('table-2');
  
  // Check that order details are displayed
  await waitFor(() => {
   expect(screen.getByText('ORD-123456')).toBeInTheDocument();
   expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
   expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
  });
 });

 it('should update table status', async () => {
  // Mock the updateTableStatus API call
  (tableAPI.updateTableStatus as any).mockResolvedValue({
   ...mockTables[0],
   status: 'reserved',
  });

  render(
   <BrowserRouter>
    <Tables />
   </BrowserRouter>
  );

  // Wait for the tables to be loaded
  await waitFor(() => {
   expect(tableAPI.getTables).toHaveBeenCalled();
  });

  // Find and click the available table (table 1)
  const availableTable = screen.getByText('1').closest('.table-card');
  fireEvent.click(availableTable);
  
  // Wait for the table details modal to be displayed
  await waitFor(() => {
   expect(screen.getByText(/tables.details/i)).toBeInTheDocument();
  });
  
  // Find and click the"Reserve" button
  const reserveButton = screen.getByText(/tables.actions.reserve/i);
  fireEvent.click(reserveButton);
  
  // Check that the API was called with the correct table ID and status
  await waitFor(() => {
   expect(tableAPI.updateTableStatus).toHaveBeenCalledWith('table-1', 'reserved');
  });
  
  // Check that the table status is updated in the UI
  await waitFor(() => {
   const updatedTable = screen.getByText('1').closest('.table-card');
   expect(updatedTable).toHaveClass('bg-yellow-100');
  });
 });

 it('should open the create order form when clicking the"New Order" button', async () => {
  render(
   <BrowserRouter>
    <Tables />
   </BrowserRouter>
  );

  // Wait for the tables to be loaded
  await waitFor(() => {
   expect(tableAPI.getTables).toHaveBeenCalled();
  });

  // Find and click the available table (table 1)
  const availableTable = screen.getByText('1').closest('.table-card');
  fireEvent.click(availableTable);
  
  // Wait for the table details modal to be displayed
  await waitFor(() => {
   expect(screen.getByText(/tables.details/i)).toBeInTheDocument();
  });
  
  // Find and click the"New Order" button
  const newOrderButton = screen.getByText(/tables.actions.newOrder/i);
  fireEvent.click(newOrderButton);
  
  // Check that the create order form is displayed
  await waitFor(() => {
   expect(screen.getByText(/orders.newOrder/i)).toBeInTheDocument();
  });
 });

 it('should open the add table form when clicking the add button', async () => {
  render(
   <BrowserRouter>
    <Tables />
   </BrowserRouter>
  );

  // Wait for the tables to be loaded
  await waitFor(() => {
   expect(tableAPI.getTables).toHaveBeenCalled();
  });

  // Find and click the add table button
  const addButton = screen.getByText(/tables.addTable/i);
  fireEvent.click(addButton);
  
  // Check that the add table form is displayed
  await waitFor(() => {
   expect(screen.getByText(/tables.newTable/i)).toBeInTheDocument();
  });
 });
});
