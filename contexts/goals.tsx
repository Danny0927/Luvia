import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAccount } from "@/contexts/account";

const GOALS_STORAGE_KEY = "luvia:goals";
const getScopedStorageKey = (baseKey: string, accountKey: string) =>
  `${baseKey}:${accountKey}`;

type GoalsContextValue = {
  taskGoal: number;
  setTaskGoal: Dispatch<SetStateAction<number>>;
  stepGoal: number;
  setStepGoal: Dispatch<SetStateAction<number>>;
  waterGoal: number;
  setWaterGoal: Dispatch<SetStateAction<number>>;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { activeAccountKey } = useAccount();
  const [taskGoal, setTaskGoal] = useState(4);
  const [stepGoal, setStepGoal] = useState(10000);
  const [waterGoal, setWaterGoal] = useState(8);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!activeAccountKey) {
      return;
    }

    setTaskGoal(4);
    setStepGoal(10000);
    setWaterGoal(8);
    setHydrated(false);

    const loadGoals = async () => {
      try {
        const storedGoals = await AsyncStorage.getItem(
          getScopedStorageKey(GOALS_STORAGE_KEY, activeAccountKey)
        );

        if (storedGoals) {
          const parsedGoals = JSON.parse(storedGoals) as Partial<{
            taskGoal: number;
            stepGoal: number;
            waterGoal: number;
          }>;

          if (typeof parsedGoals.taskGoal === "number") {
            setTaskGoal(parsedGoals.taskGoal);
          }

          if (typeof parsedGoals.stepGoal === "number") {
            setStepGoal(parsedGoals.stepGoal);
          }

          if (typeof parsedGoals.waterGoal === "number") {
            setWaterGoal(parsedGoals.waterGoal);
          }
        }
      } catch {
        // Keep the default goals if local storage is unavailable or corrupted.
      } finally {
        setHydrated(true);
      }
    };

    void loadGoals();
  }, [activeAccountKey]);

  useEffect(() => {
    if (!hydrated || !activeAccountKey) {
      return;
    }

    void AsyncStorage.setItem(
      getScopedStorageKey(GOALS_STORAGE_KEY, activeAccountKey),
      JSON.stringify({ taskGoal, stepGoal, waterGoal })
    ).catch(() => {
      // Keep in-memory goals even if persistence fails.
    });
  }, [activeAccountKey, hydrated, stepGoal, taskGoal, waterGoal]);

  return (
    <GoalsContext.Provider
      value={{
        taskGoal,
        setTaskGoal,
        stepGoal,
        setStepGoal,
        waterGoal,
        setWaterGoal,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);

  if (!context) {
    throw new Error("useGoals must be used within GoalsProvider");
  }

  return context;
}
