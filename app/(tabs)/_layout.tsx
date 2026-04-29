import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // kleuren
        tabBarActiveTintColor: "#BFA24A",
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
          title: "Tasks",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>☰</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="steps"
        options={{
          title: "Steps",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>👟</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="water"
        options={{
          title: "Water",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>💧</Text>
          ),
        }}
      />
    </Tabs>
  );
}

