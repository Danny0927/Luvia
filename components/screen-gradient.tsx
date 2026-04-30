import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { useThemePreference } from "@/contexts/theme-preference";

const gradientThemes = {
  Standard: ["#FFFBEA", "#FFF6D8", "#FAF7EF", "#FFFFFF"],
  Soft: ["#FFFDF5", "#F8F1E8", "#F2F5EA", "#FFFFFF"],
  Minimal: ["#FFFFFF", "#FAFAF7", "#F5F5F0", "#FFFFFF"],
} as const;

export function ScreenGradient({ children }: { children: ReactNode }) {
  const { theme } = useThemePreference();

  return (
    <LinearGradient
      colors={gradientThemes[theme]}
      locations={[0, 0.42, 0.74, 1]}
      start={{ x: 0.08, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
