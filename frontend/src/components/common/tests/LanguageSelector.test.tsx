import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import LanguageSelector from "../LanguageSelector";

// Mock the i18n functionality
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.language": "Language",
        "common.languages.en": "English",
        "common.languages.es": "Spanish",
        "common.languages.fr": "French",
        "common.languages.tr": "Turkish",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("LanguageSelector Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the language selector with current language", () => {
    render(<LanguageSelector />);

    // Check if the button is rendered with the current language (English)
    const button = screen.getByRole("button", { name: /english/i });
    expect(button).toBeInTheDocument();

    // Check if the flag is displayed
    expect(button.textContent).toContain("🇺🇸");
  });

  it("opens the dropdown when clicked", async () => {
    render(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /english/i });
    fireEvent.click(button);

    // Check if the dropdown is open
    await waitFor(() => {
      expect(screen.getByText("Language")).toBeInTheDocument();
    });

    // Check if all languages are displayed
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Spanish")).toBeInTheDocument();
    expect(screen.getByText("French")).toBeInTheDocument();
    expect(screen.getByText("Turkish")).toBeInTheDocument();
  });

  it("changes the language when a language option is clicked", async () => {
    const { i18n } = require("react-i18next").useTranslation();

    render(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /english/i });
    fireEvent.click(button);

    // Click on Spanish
    const spanishOption = screen.getByText("Spanish");
    fireEvent.click(spanishOption);

    // Check if changeLanguage was called with 'es'
    expect(i18n.changeLanguage).toHaveBeenCalledWith("es");

    // Check if the language was saved to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "preferredLanguage",
      "es"
    );
  });

  it("loads the preferred language from localStorage on mount", () => {
    const { i18n } = require("react-i18next").useTranslation();

    // Set a preferred language in localStorage
    localStorageMock.getItem.mockReturnValueOnce("fr");

    render(<LanguageSelector />);

    // Check if changeLanguage was called with 'fr'
    expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
  });

  it("closes the dropdown when clicking outside", async () => {
    render(<LanguageSelector />);

    const button = screen.getByRole("button", { name: /english/i });
    fireEvent.click(button);

    // Check if the dropdown is open
    await waitFor(() => {
      expect(screen.getByText("Language")).toBeInTheDocument();
    });

    // Simulate clicking outside
    fireEvent.mouseDown(document.body);

    // Check if the dropdown is closed
    await waitFor(() => {
      expect(screen.queryByText("Language")).not.toBeInTheDocument();
    });
  });
});
