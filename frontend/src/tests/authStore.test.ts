import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
 authAPI: {
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
 },
}));

// Mock localStorage
const localStorageMock = (() => {
 let store: Record<string, string> = {};
 return {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
   store[key] = value.toString();
  }),
  removeItem: vi.fn((key: string) => {
   delete store[key];
  }),
  clear: vi.fn(() => {
   store = {};
  }),
 };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth Store', () => {
 beforeEach(() => {
  // Clear the store before each test
  const store = useAuthStore.getState();
  store.logout = vi.fn().mockResolvedValue(undefined);
  useAuthStore.setState({
   user: null,
   accessToken: null,
   refreshToken: null,
   expiresAt: null,
   isAuthenticated: false,
   authProvider: 'local',
   isRefreshing: false,
   token: null,
  });
  vi.clearAllMocks();
  localStorageMock.clear();
 });

 afterEach(() => {
  vi.resetAllMocks();
 });

 it('should initialize with default values', () => {
  const state = useAuthStore.getState();
  expect(state.user).toBeNull();
  expect(state.accessToken).toBeNull();
  expect(state.refreshToken).toBeNull();
  expect(state.expiresAt).toBeNull();
  expect(state.isAuthenticated).toBe(false);
  expect(state.authProvider).toBe('local');
  expect(state.isRefreshing).toBe(false);
  expect(state.token).toBeNull();
 });

 it('should set user and tokens on login', () => {
  const store = useAuthStore.getState();
  const user = {
   id: 'user-id',
   username: 'testuser',
   fullName: 'Test User',
   role: 'waiter',
  };
  const accessToken = 'access-token';
  const refreshToken = 'refresh-token';
  const expiresIn = 3600; // 1 hour

  store.login(user, accessToken, refreshToken, expiresIn);

  const state = useAuthStore.getState();
  expect(state.user).toEqual(user);
  expect(state.accessToken).toBe(accessToken);
  expect(state.refreshToken).toBe(refreshToken);
  expect(state.isAuthenticated).toBe(true);
  expect(state.token).toBe(accessToken); // For backward compatibility
  
  // Check that expiresAt is set to approximately now + expiresIn
  const expectedExpiry = Date.now() + expiresIn * 1000;
  expect(state.expiresAt).toBeGreaterThan(expectedExpiry - 1000); // Allow 1 second tolerance
  expect(state.expiresAt).toBeLessThan(expectedExpiry + 1000);
 });

 it('should clear user and tokens on logout', async () => {
  // Setup initial state
  const store = useAuthStore.getState();
  const user = {
   id: 'user-id',
   username: 'testuser',
   fullName: 'Test User',
   role: 'waiter',
  };
  store.login(user, 'access-token', 'refresh-token', 3600);
  
  // Mock the logout API call
  (authAPI.logout as any).mockResolvedValue({ message: 'Logged out successfully' });
  
  // Reset the mocked logout function to use the real one
  store.logout = useAuthStore.getState().logout;
  
  // Call logout
  await store.logout();
  
  // Verify state is cleared
  const state = useAuthStore.getState();
  expect(state.user).toBeNull();
  expect(state.accessToken).toBeNull();
  expect(state.refreshToken).toBeNull();
  expect(state.expiresAt).toBeNull();
  expect(state.isAuthenticated).toBe(false);
  expect(state.token).toBeNull();
  
  // Verify API was called
  expect(authAPI.logout).toHaveBeenCalled();
 });

 it('should refresh the access token', async () => {
  // Setup initial state with expired token
  const store = useAuthStore.getState();
  const user = {
   id: 'user-id',
   username: 'testuser',
   fullName: 'Test User',
   role: 'waiter',
  };
  const refreshToken = 'refresh-token';
  store.login(user, 'expired-token', refreshToken, -3600); // Expired 1 hour ago
  
  // Mock the refresh token API call
  (authAPI.refreshToken as any).mockResolvedValue({
   accessToken: 'new-access-token',
   refreshToken: 'new-refresh-token',
   expiresIn: 3600,
  });
  
  // Call refresh token
  const result = await store.refreshAccessToken();
  
  // Verify new tokens are set
  const state = useAuthStore.getState();
  expect(state.accessToken).toBe('new-access-token');
  expect(state.refreshToken).toBe('new-refresh-token');
  expect(state.token).toBe('new-access-token'); // For backward compatibility
  
  // Check that expiresAt is updated
  const expectedExpiry = Date.now() + 3600 * 1000;
  expect(state.expiresAt).toBeGreaterThan(expectedExpiry - 1000);
  expect(state.expiresAt).toBeLessThan(expectedExpiry + 1000);
  
  // Verify API was called with the refresh token
  expect(authAPI.refreshToken).toHaveBeenCalledWith(refreshToken);
  
  // Verify the function returns the new access token
  expect(result).toBe('new-access-token');
 });

 it('should handle refresh token failure', async () => {
  // Setup initial state with expired token
  const store = useAuthStore.getState();
  const user = {
   id: 'user-id',
   username: 'testuser',
   fullName: 'Test User',
   role: 'waiter',
  };
  store.login(user, 'expired-token', 'refresh-token', -3600); // Expired 1 hour ago
  
  // Mock the refresh token API call to fail
  (authAPI.refreshToken as any).mockRejectedValue(new Error('Refresh token expired'));
  
  // Mock the logout function
  store.logout = vi.fn().mockResolvedValue(undefined);
  
  // Call refresh token
  const result = await store.refreshAccessToken();
  
  // Verify logout was called
  expect(store.logout).toHaveBeenCalled();
  
  // Verify the function returns null
  expect(result).toBeNull();
 });

 it('should set tokens directly', () => {
  const store = useAuthStore.getState();
  
  store.setTokens('new-access-token', 'new-refresh-token', 3600);
  
  const state = useAuthStore.getState();
  expect(state.accessToken).toBe('new-access-token');
  expect(state.refreshToken).toBe('new-refresh-token');
  expect(state.token).toBe('new-access-token'); // For backward compatibility
  
  // Check that expiresAt is set correctly
  const expectedExpiry = Date.now() + 3600 * 1000;
  expect(state.expiresAt).toBeGreaterThan(expectedExpiry - 1000);
  expect(state.expiresAt).toBeLessThan(expectedExpiry + 1000);
 });
});
