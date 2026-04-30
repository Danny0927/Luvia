import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";

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
  const [steps, setSteps] = useState(7840);
  const [waterGlasses, setWaterGlasses] = useState(5);

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
