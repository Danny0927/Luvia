import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAccount } from "@/contexts/account";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

const DAILY_PROGRESS_STORAGE_KEY = "luvia:daily-progress";
const getScopedStorageKey = (baseKey: string, accountKey: string) =>
  `${baseKey}:${accountKey}`;

type DailyProgressContextValue = {
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  waterGlasses: number;
  setWaterGlasses: Dispatch<SetStateAction<number>>;
};

const DailyProgressContext = createContext<DailyProgressContextValue | null>(
  null
);

export function DailyProgressProvider({ children }: { children: ReactNode }) {
  const { activeAccountKey } = useAccount();
  const [steps, setSteps] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!activeAccountKey) {
      return;
    }

    setSteps(0);
    setWaterGlasses(0);
    setHydrated(false);

    const loadDailyProgress = async () => {
      try {
        const storedProgress = await AsyncStorage.getItem(
          getScopedStorageKey(DAILY_PROGRESS_STORAGE_KEY, activeAccountKey)
        );

        if (storedProgress) {
          const parsedProgress = JSON.parse(storedProgress) as Partial<{
            steps: number;
            waterGlasses: number;
          }>;

          if (typeof parsedProgress.steps === "number") {
            setSteps(parsedProgress.steps);
          }

          if (typeof parsedProgress.waterGlasses === "number") {
            setWaterGlasses(parsedProgress.waterGlasses);
          }
        }
      } catch {
        // Keep the default daily progress if local storage is unavailable.
      } finally {
        setHydrated(true);
      }
    };

    void loadDailyProgress();
  }, [activeAccountKey]);

  useEffect(() => {
    if (!hydrated || !activeAccountKey) {
      return;
    }

    void AsyncStorage.setItem(
      getScopedStorageKey(DAILY_PROGRESS_STORAGE_KEY, activeAccountKey),
      JSON.stringify({ steps, waterGlasses })
    ).catch(() => {
      // Keep in-memory daily progress even if persistence fails.
    });
  }, [activeAccountKey, hydrated, steps, waterGlasses]);

  return (
    <DailyProgressContext.Provider
      value={{ steps, setSteps, waterGlasses, setWaterGlasses }}
    >
      {children}
    </DailyProgressContext.Provider>
  );
}

export function useDailyProgress() {
  const context = useContext(DailyProgressContext);

  if (!context) {
    throw new Error("useDailyProgress must be used within DailyProgressProvider");
  }

  return context;
}
