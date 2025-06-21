import '@testing-library/jest-dom';

// Mock matchMedia for tests
window.matchMedia = window.matchMedia || function() {
 return {
  matches: false,
  addListener: function() {},
  removeListener: function() {},
  addEventListener: function() {},
  removeEventListener: function() {},
  dispatchEvent: function() {
   return true;
  },
 };
};

// Mock IntersectionObserver
class MockIntersectionObserver {
 observe = jest.fn();
 disconnect = jest.fn();
 unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
 writable: true,
 configurable: true,
 value: MockIntersectionObserver,
});

// Mock localStorage
const localStorageMock = (() => {
 let store: Record<string, string> = {};
 return {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
   store[key] = value.toString();
  },
  removeItem: (key: string) => {
   delete store[key];
  },
  clear: () => {
   store = {};
  },
 };
})();

Object.defineProperty(window, 'localStorage', {
 value: localStorageMock,
});
