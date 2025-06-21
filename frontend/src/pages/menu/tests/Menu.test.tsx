import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Menu from '../Menu';
import { menuAPI } from '../../../services/api';
import { useTranslation } from 'react-i18next';

// Mock the API service
vi.mock('../../../services/api', () => ({
 menuAPI: {
  getCategories: vi.fn(),
  getMenuItems: vi.fn(),
  getMenuItemsByCategory: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
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
const mockCategories = [
 { id: 'category-1', name: 'Appetizers' },
 { id: 'category-2', name: 'Main Courses' },
 { id: 'category-3', name: 'Desserts' },
];

const mockMenuItems = [
 {
  id: 'item-1',
  name: 'Caesar Salad',
  description: 'Fresh romaine lettuce with Caesar dressing',
  price: 8.99,
  category: { id: 'category-1', name: 'Appetizers' },
  categoryId: 'category-1',
  isAvailable: true,
 },
 {
  id: 'item-2',
  name: 'Chicken Burger',
  description: 'Grilled chicken breast with lettuce and tomato',
  price: 12.99,
  category: { id: 'category-2', name: 'Main Courses' },
  categoryId: 'category-2',
  isAvailable: true,
 },
 {
  id: 'item-3',
  name: 'Chocolate Cake',
  description: 'Rich chocolate cake with frosting',
  price: 6.99,
  category: { id: 'category-3', name: 'Desserts' },
  categoryId: 'category-3',
  isAvailable: false,
 },
];

describe('Menu Component', () => {
 beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock API responses
  (menuAPI.getCategories as any).mockResolvedValue(mockCategories);
  (menuAPI.getMenuItems as any).mockResolvedValue(mockMenuItems);
  (menuAPI.getMenuItemsByCategory as any).mockImplementation((categoryId) => {
   return Promise.resolve(mockMenuItems.filter(item => item.categoryId === categoryId));
  });
 });

 it('should render the menu page with items', async () => {
  render(
   <BrowserRouter>
    <Menu />
   </BrowserRouter>
  );

  // Check that the page title is rendered
  expect(screen.getByText(/menu.title/i)).toBeInTheDocument();

  // Wait for the menu items to be loaded
  await waitFor(() => {
   expect(menuAPI.getCategories).toHaveBeenCalled();
   expect(menuAPI.getMenuItems).toHaveBeenCalled();
  });

  // Check that menu items are rendered
  await waitFor(() => {
   expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
   expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
   expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
  });

  // Check that prices are displayed
  await waitFor(() => {
   expect(screen.getByText('$8.99')).toBeInTheDocument();
   expect(screen.getByText('$12.99')).toBeInTheDocument();
   expect(screen.getByText('$6.99')).toBeInTheDocument();
  });
 });

 it('should filter menu items by category', async () => {
  render(
   <BrowserRouter>
    <Menu />
   </BrowserRouter>
  );

  // Wait for the menu items to be loaded
  await waitFor(() => {
   expect(menuAPI.getCategories).toHaveBeenCalled();
   expect(menuAPI.getMenuItems).toHaveBeenCalled();
  });

  // Find the category filter dropdown
  const categoryFilter = screen.getByLabelText(/menu.filterByCategory/i);
  
  // Select the"Appetizers" category
  fireEvent.change(categoryFilter, { target: { value: 'category-1' } });
  
  // Check that the API was called with the correct category ID
  await waitFor(() => {
   expect(menuAPI.getMenuItemsByCategory).toHaveBeenCalledWith('category-1');
  });
  
  // Check that only the appetizer is displayed
  await waitFor(() => {
   expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
   expect(screen.queryByText('Chicken Burger')).not.toBeInTheDocument();
   expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument();
  });
 });

 it('should filter menu items by search query', async () => {
  render(
   <BrowserRouter>
    <Menu />
   </BrowserRouter>
  );

  // Wait for the menu items to be loaded
  await waitFor(() => {
   expect(menuAPI.getMenuItems).toHaveBeenCalled();
  });

  // Find the search input
  const searchInput = screen.getByPlaceholderText(/menu.searchPlaceholder/i);
  
  // Search for"chicken"
  fireEvent.change(searchInput, { target: { value: 'chicken' } });
  
  // Check that only the chicken burger is displayed
  await waitFor(() => {
   expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
   expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
   expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument();
  });
 });

 it('should show availability status', async () => {
  render(
   <BrowserRouter>
    <Menu />
   </BrowserRouter>
  );

  // Wait for the menu items to be loaded
  await waitFor(() => {
   expect(menuAPI.getMenuItems).toHaveBeenCalled();
  });

  // Check that availability status is displayed correctly
  await waitFor(() => {
   expect(screen.getAllByText(/menu.available/i).length).toBe(2); // Two available items
   expect(screen.getByText(/menu.unavailable/i)).toBeInTheDocument(); // One unavailable item
  });
 });

 it('should open the add item modal when clicking the add button', async () => {
  render(
   <BrowserRouter>
    <Menu />
   </BrowserRouter>
  );

  // Wait for the menu items to be loaded
  await waitFor(() => {
   expect(menuAPI.getMenuItems).toHaveBeenCalled();
  });

  // Find and click the add item button
  const addButton = screen.getByText(/menu.addItem/i);
  fireEvent.click(addButton);
  
  // Check that the modal is displayed
  await waitFor(() => {
   expect(screen.getByText(/menu.newItem/i)).toBeInTheDocument();
  });
 });
});
