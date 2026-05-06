import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAccount } from "@/contexts/account";
import { useGoals } from "@/contexts/goals";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useMemo,
  useContext,
  useEffect,
  useState,
} from "react";

const DAILY_PROGRESS_STORAGE_KEY = "luvia:daily-progress";
const getScopedStorageKey = (baseKey: string, accountKey: string) =>
  `${baseKey}:${accountKey}`;

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const parseDateKey = (dateKey: string) => {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

const getWeekDates = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + index);

    return weekDate;
  });
};

type StepsByDate = Record<string, number>;
type WaterByDate = Record<string, number>;

type WeekSteps = {
  day: string;
  dateKey: string;
  steps: number;
};

const getPreviousDateKey = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - 1);

  return getDateKey(date);
};

const getWaterStreak = (
  waterByDate: WaterByDate,
  waterGoal: number,
  todayKey: string
) => {
  if (waterGoal <= 0) {
    return 0;
  }

  let streak = 0;
  let dateKey =
    (waterByDate[todayKey] ?? 0) >= waterGoal
      ? todayKey
      : getPreviousDateKey(todayKey);

  while ((waterByDate[dateKey] ?? 0) >= waterGoal) {
    streak += 1;
    dateKey = getPreviousDateKey(dateKey);
  }

  return streak;
};

type DailyProgressContextValue = {
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  stepsByDate: StepsByDate;
  weekSteps: WeekSteps[];
  waterGlasses: number;
  setWaterGlasses: Dispatch<SetStateAction<number>>;
  waterByDate: WaterByDate;
  waterStreak: number;
};

const DailyProgressContext = createContext<DailyProgressContextValue | null>(
  null
);

export function DailyProgressProvider({ children }: { children: ReactNode }) {
  const { activeAccountKey } = useAccount();
  const { waterGoal } = useGoals();
  const [todayKey, setTodayKey] = useState(() => getDateKey(new Date()));
  const [stepsByDate, setStepsByDate] = useState<StepsByDate>({});
  const [waterByDate, setWaterByDate] = useState<WaterByDate>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refreshTodayKey = () => setTodayKey(getDateKey(new Date()));
    const timer = setInterval(refreshTodayKey, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeAccountKey) {
      return;
    }

    const currentDateKey = getDateKey(new Date());
    setTodayKey(currentDateKey);
    setStepsByDate({});
    setWaterByDate({});
    setHydrated(false);

    const loadDailyProgress = async () => {
      try {
        const storedProgress = await AsyncStorage.getItem(
          getScopedStorageKey(DAILY_PROGRESS_STORAGE_KEY, activeAccountKey)
        );

        if (storedProgress) {
          const parsedProgress = JSON.parse(storedProgress) as Partial<{
            steps: number;
            stepsByDate: StepsByDate;
            waterGlasses: number;
            waterByDate: WaterByDate;
          }>;

          if (
            parsedProgress.stepsByDate &&
            typeof parsedProgress.stepsByDate === "object"
          ) {
            setStepsByDate(parsedProgress.stepsByDate);
          } else if (typeof parsedProgress.steps === "number") {
            setStepsByDate({ [currentDateKey]: parsedProgress.steps });
          }

          if (
            parsedProgress.waterByDate &&
            typeof parsedProgress.waterByDate === "object"
          ) {
            setWaterByDate(parsedProgress.waterByDate);
          } else if (typeof parsedProgress.waterGlasses === "number") {
            setWaterByDate({ [currentDateKey]: parsedProgress.waterGlasses });
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
      JSON.stringify({
        steps: stepsByDate[todayKey] ?? 0,
        stepsByDate,
        waterGlasses: waterByDate[todayKey] ?? 0,
        waterByDate,
      })
    ).catch(() => {
      // Keep in-memory daily progress even if persistence fails.
    });
  }, [activeAccountKey, hydrated, stepsByDate, todayKey, waterByDate]);

  const steps = stepsByDate[todayKey] ?? 0;
  const waterGlasses = waterByDate[todayKey] ?? 0;
  const waterStreak = useMemo(
    () => getWaterStreak(waterByDate, waterGoal, todayKey),
    [todayKey, waterByDate, waterGoal]
  );

  const weekSteps = useMemo(() => {
    const today = parseDateKey(todayKey);

    return getWeekDates(today).map((date) => {
      const dateKey = getDateKey(date);

      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        dateKey,
        steps: stepsByDate[dateKey] ?? 0,
      };
    });
  }, [stepsByDate, todayKey]);

  const setSteps = useCallback<Dispatch<SetStateAction<number>>>((value) => {
    const currentDateKey = getDateKey(new Date());
    setTodayKey(currentDateKey);
    setStepsByDate((currentStepsByDate) => {
      const currentSteps = currentStepsByDate[currentDateKey] ?? 0;
      const nextSteps =
        typeof value === "function" ? value(currentSteps) : value;

      return {
        ...currentStepsByDate,
        [currentDateKey]: Math.max(nextSteps, 0),
      };
    });
  }, []);

  const setWaterGlasses = useCallback<Dispatch<SetStateAction<number>>>((value) => {
    const currentDateKey = getDateKey(new Date());
    setTodayKey(currentDateKey);
    setWaterByDate((currentWaterByDate) => {
      const currentGlasses = currentWaterByDate[currentDateKey] ?? 0;
      const nextGlasses =
        typeof value === "function" ? value(currentGlasses) : value;

      return {
        ...currentWaterByDate,
        [currentDateKey]: Math.max(nextGlasses, 0),
      };
    });
  }, []);

  return (
    <DailyProgressContext.Provider
      value={{
        steps,
        setSteps,
        stepsByDate,
        weekSteps,
        waterGlasses,
        setWaterGlasses,
        waterByDate,
        waterStreak,
      }}
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
