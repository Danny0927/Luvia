import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const reminders: {
  time: string;
  title: string;
  detail: string;
  icon: IconName;
  color: string;
  background: string;
}[] = [
  {
    time: "10:30",
    title: "Morning refill",
    detail: "One glass after your planning block",
    icon: "cafe-outline",
    color: "#C9B85C",
    background: "#FFF7CF",
  },
  {
    time: "13:00",
    title: "Lunch hydration",
    detail: "Pair water with your meal",
    icon: "restaurant-outline",
    color: "#8D7A3A",
    background: "#FFF2BE",
  },
  {
    time: "17:30",
    title: "Evening top-up",
    detail: "Gentle reminder before winding down",
    icon: "notifications-outline",
    color: "#6D8A63",
    background: "#E8F0DD",
  },
];

export default function WaterScreen() {
  const [glasses, setGlasses] = useState(5);
  const [goal, setGoal] = useState(8);
  const [showSettings, setShowSettings] = useState(false);
  const progress = glasses / goal;
  const liters = (glasses * 0.25).toFixed(2);
  const goalLiters = (goal * 0.25).toFixed(2);

  const addGlass = () => {
    setGlasses((current) => Math.min(current + 1, goal));
  };

  const removeGlass = () => {
    setGlasses((current) => Math.max(current - 1, 0));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>Hydration</Text>
            <Text style={styles.title}>Water</Text>
          </View>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setShowSettings((visible) => !visible)}
          >
            <Ionicons name="settings-outline" size={20} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        {showSettings && (
          <View style={styles.settingsCard}>
            <View>
              <Text style={styles.settingsTitle}>Daily goal</Text>
              <Text style={styles.settingsText}>
                {goal} glasses · {goalLiters}L per day
              </Text>
            </View>

            <View style={styles.goalControls}>
              <TouchableOpacity
                style={styles.goalButton}
                onPress={() => {
                  setGoal((currentGoal) => {
                    const nextGoal = Math.max(currentGoal - 1, 1);
                    setGlasses((currentGlasses) =>
                      Math.min(currentGlasses, nextGoal)
                    );
                    return nextGoal;
                  });
                }}
              >
                <Ionicons name="remove" size={20} color="#C9B85C" />
              </TouchableOpacity>
              <Text style={styles.goalValue}>{goal}</Text>
              <TouchableOpacity
                style={styles.goalButton}
                onPress={() => setGoal((current) => Math.min(current + 1, 16))}
              >
                <Ionicons name="add" size={20} color="#C9B85C" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.dropCircle}>
            <Ionicons name="water-outline" size={42} color="#C9B85C" />
            <Text style={styles.waterNumber}>{glasses}/{goal}</Text>
            <Text style={styles.waterLabel}>glasses</Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Daily balance</Text>
            <Text style={styles.heroText}>
              {liters}L logged today. Keep a calm, steady pace.
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress * 100, 100)}%` },
                ]}
              />
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.logButton} onPress={addGlass}>
                <Ionicons name="add" size={18} color="#4A432F" />
                <Text style={styles.logButtonText}>Log glass</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.undoButton} onPress={removeGlass}>
                <Ionicons name="return-down-back" size={18} color="#C9B85C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.glassGrid}>
          {Array.from({ length: goal }, (_, index) => {
            const active = index < glasses;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.glassButton, active && styles.activeGlassButton]}
                onPress={() => setGlasses(index + 1)}
              >
                <Ionicons
                  name={active ? "water" : "water-outline"}
                  size={24}
                  color={active ? "#4A432F" : "#C9B85C"}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{liters}L</Text>
            <Text style={styles.summaryLabel}>Logged</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{goal - glasses}</Text>
            <Text style={styles.summaryLabel}>Left</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>63%</Text>
            <Text style={styles.summaryLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="time-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <View style={styles.reminderList}>
          {reminders.map((item) => (
            <TouchableOpacity key={item.time} style={styles.reminderCard}>
              <View style={styles.timePill}>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <View style={[styles.reminderIcon, { backgroundColor: item.background }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={styles.reminderDetail}>{item.detail}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffbeb",
  },

  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  kicker: {
    fontSize: 13,
    color: "#8A8067",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  settingsCard: {
    minHeight: 82,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  settingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
    marginBottom: 5,
  },

  settingsText: {
    fontSize: 13,
    color: "#8A8067",
  },

  goalControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  goalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  goalValue: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  heroCard: {
    backgroundColor: "#FFF3BE",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  dropCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#FFF9E3",
    borderWidth: 10,
    borderColor: "#F3DF7D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  waterNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2B2B",
    marginTop: 4,
  },

  waterLabel: {
    fontSize: 12,
    color: "#8A8067",
  },

  heroInfo: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2B2B2B",
    marginBottom: 8,
  },

  heroText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginBottom: 14,
  },

  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FFF9E3",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#F3DF7D",
  },

  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },

  logButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3DF7D",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  logButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A432F",
  },

  undoButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF9E3",
    justifyContent: "center",
    alignItems: "center",
  },

  glassGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  glassButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#FFF8DC",
    justifyContent: "center",
    alignItems: "center",
  },

  activeGlassButton: {
    backgroundColor: "#F3DF7D",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 28,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryNumber: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  summaryLabel: {
    fontSize: 12,
    color: "#8A8067",
    marginTop: 5,
  },

  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#EFE6CB",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  reminderList: {
    gap: 12,
  },

  reminderCard: {
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  timePill: {
    backgroundColor: "#FFF7CF",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 10,
  },

  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C9B85C",
  },

  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  reminderContent: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  reminderDetail: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 5,
  },
});
