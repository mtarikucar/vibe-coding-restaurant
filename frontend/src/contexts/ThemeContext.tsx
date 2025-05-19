import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Tema türleri
export type ThemeType = "system" | "light" | "dark";

// Tema context tipi
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDarkMode: boolean;
}

// Context oluşturma
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Context hook'u
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // localStorage'dan tema tercihini al veya varsayılan olarak 'system' kullan
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeType;
    return savedTheme || "system";
  });

  // Sistem tercihine göre karanlık mod durumunu belirle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    // Sistem teması için tarayıcı tercihini kontrol et
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Tema değişikliğini işle
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Sistem teması değişikliklerini dinle
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setIsDarkMode(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Tema değişikliklerini izle ve DOM'a uygula
  useEffect(() => {
    const root = document.documentElement;

    // Tema durumuna göre dark class'ını ekle veya kaldır
    if (
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      root.classList.add("dark");
      setIsDarkMode(true);
    } else {
      root.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
