import Ionicons from "@expo/vector-icons/Ionicons";
import { useAccount } from "@/contexts/account";
import { useThemePreference } from "@/contexts/theme-preference";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";

const tabThemes = {
  Standard: {
    active: "#8D7A3A",
    inactive: "#B8AD91",
    colors: ["#FFFFFF", "#FFFDF5", "#FFF5D6"],
    border: "rgba(255, 248, 220, 0.9)",
  },
  Soft: {
    active: "#6D8A63",
    inactive: "#A9A08A",
    colors: ["#FFFFFF", "#FAF8F0", "#EAF3DD"],
    border: "rgba(232, 240, 221, 0.95)",
  },
  Minimal: {
    active: "#4A432F",
    inactive: "#A9A08A",
    colors: ["#FFFFFF", "#FCFCFA", "#F3F3EE"],
    border: "rgba(239, 239, 232, 0.95)",
  },
} as const;

export default function TabLayout() {
  const { hasAccount, hydrated } = useAccount();
  const { theme } = useThemePreference();
  const tabTheme = tabThemes[theme];

  if (hydrated && !hasAccount) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // kleuren
        tabBarActiveTintColor: tabTheme.active,
        tabBarInactiveTintColor: tabTheme.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginTop: 3,
          textShadowColor: "rgba(255, 255, 255, 0.9)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
        },
        tabBarIconStyle: {
          marginTop: 6,
          shadowColor: "#8A8067",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 1.5,
        },

        // hele balk
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: 80,
          overflow: "hidden",
          elevation: 10,
          shadowColor: "#8A8067",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.14,
          shadowRadius: 12,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={tabTheme.colors}
            locations={[0, 0.58, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              flex: 1,
              borderTopWidth: 1,
              borderColor: tabTheme.border,
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="home" size={focused ? 26 : 23} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plans"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={focused ? 26 : 23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="steps"
        options={{
          title: "Steps",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "footsteps" : "footsteps-outline"}
              size={focused ? 26 : 23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="water"
        options={{
          title: "Water",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "water" : "water-outline"}
              size={focused ? 26 : 23}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
