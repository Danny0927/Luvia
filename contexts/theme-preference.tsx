import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const THEME_STORAGE_KEY = "luvia:theme";

export type LuviaTheme = "Standard" | "Light" | "Dark";

type ThemePreferenceContextValue = {
  theme: LuviaTheme;
  setTheme: (theme: LuviaTheme) => void;
};

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

const normalizeTheme = (storedTheme: string | null): LuviaTheme | null => {
  if (
    storedTheme === "Standard" ||
    storedTheme === "Light" ||
    storedTheme === "Dark"
  ) {
    return storedTheme;
  }

  if (storedTheme === "Soft") {
    return "Light";
  }

  if (storedTheme === "Minimal") {
    return "Dark";
  }

  return null;
};

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<LuviaTheme>("Standard");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        const parsedTheme = normalizeTheme(storedTheme);

        if (parsedTheme) {
          setThemeState(parsedTheme);
        }
      } catch {
        // Keep the standard theme if local storage is unavailable.
      } finally {
        setHydrated(true);
      }
    };

    void loadTheme();
  }, []);

  const setTheme = (nextTheme: LuviaTheme) => {
    setThemeState(nextTheme);

    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme).catch(() => {
      // Keep the in-memory theme even if persistence fails.
    });
  };

  return (
    <ThemePreferenceContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider"
    );
  }

  return context;
}
