import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // kleuren
        tabBarActiveTintColor: "#C9B85C",
        tabBarInactiveTintColor: "#999",

        // hele balk
        tabBarStyle: {
          backgroundColor: "#FFF9E3",
          borderTopWidth: 0,
          height: 80,
        },
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plans"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="steps"
        options={{
          title: "Steps",
          tabBarIcon: ({ color }) => (
            <Ionicons name="footsteps-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="water"
        options={{
          title: "Water",
          tabBarIcon: ({ color }) => (
            <Ionicons name="water-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
