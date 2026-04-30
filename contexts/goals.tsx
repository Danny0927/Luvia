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

const GOALS_STORAGE_KEY = "luvia:goals";

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
  const [taskGoal, setTaskGoal] = useState(4);
  const [stepGoal, setStepGoal] = useState(10000);
  const [waterGoal, setWaterGoal] = useState(8);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const storedGoals = await AsyncStorage.getItem(GOALS_STORAGE_KEY);

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
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(
      GOALS_STORAGE_KEY,
      JSON.stringify({ taskGoal, stepGoal, waterGoal })
    ).catch(() => {
      // Keep in-memory goals even if persistence fails.
    });
  }, [hydrated, stepGoal, taskGoal, waterGoal]);

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
