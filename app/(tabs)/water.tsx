import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { useDailyProgress } from "@/contexts/daily-progress";
import { useGoals } from "@/contexts/goals";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];
const RING_SEGMENT_COUNT = 44;

type Reminder = {
  id: string;
  time: string;
  title: string;
  detail: string;
  icon: IconName;
  color: string;
  background: string;
};

const REMINDERS_STORAGE_KEY = "luvia:water-reminders";
const getScopedStorageKey = (baseKey: string, accountKey: string) =>
  `${baseKey}:${accountKey}`;

const defaultReminders: Reminder[] = [
  {
    id: "morning-refill",
    time: "10:30",
    title: "Morning refill",
    detail: "One glass after your planning block",
    icon: "cafe-outline",
    color: "#C9B85C",
    background: "#FFF7CF",
  },
  {
    id: "lunch-hydration",
    time: "13:00",
    title: "Lunch hydration",
    detail: "Pair water with your meal",
    icon: "restaurant-outline",
    color: "#8D7A3A",
    background: "#FFF2BE",
  },
  {
    id: "evening-top-up",
    time: "17:30",
    title: "Evening top-up",
    detail: "Gentle reminder before winding down",
    icon: "notifications-outline",
    color: "#6D8A63",
    background: "#E8F0DD",
  },
];

export default function WaterScreen() {
  const { activeAccountKey } = useAccount();
  const { waterGoal: goal, setWaterGoal: setGoal } = useGoals();
  const { waterGlasses: glasses, setWaterGlasses: setGlasses, waterStreak } =
    useDailyProgress();
  const [showSettings, setShowSettings] = useState(false);
  const [reverseReminders, setReverseReminders] = useState(false);
  const [expandedReminder, setExpandedReminder] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(defaultReminders);
  const [hydratedReminders, setHydratedReminders] = useState(false);
  const progress = glasses / goal;
  const circleProgress = Math.min(progress, 1);
  const activeRingSegments = Math.round(circleProgress * RING_SEGMENT_COUNT);
  const liters = (glasses * 0.25).toFixed(2);
  const goalLiters = (goal * 0.25).toFixed(2);
  const visibleReminders = reverseReminders ? [...reminders].reverse() : reminders;

  useEffect(() => {
    if (!activeAccountKey) {
      return;
    }

    setHydratedReminders(false);
    setReminders(defaultReminders);

    const loadReminders = async () => {
      try {
        const storedReminders = await AsyncStorage.getItem(
          getScopedStorageKey(REMINDERS_STORAGE_KEY, activeAccountKey)
        );

        if (storedReminders) {
          setReminders(JSON.parse(storedReminders) as Reminder[]);
        }
      } catch {
        setReminders(defaultReminders);
      } finally {
        setHydratedReminders(true);
      }
    };

    void loadReminders();
  }, [activeAccountKey]);

  useEffect(() => {
    if (!activeAccountKey || !hydratedReminders) {
      return;
    }

    void AsyncStorage.setItem(
      getScopedStorageKey(REMINDERS_STORAGE_KEY, activeAccountKey),
      JSON.stringify(reminders)
    ).catch(() => {
      // Keep in-memory reminders if persistence fails.
    });
  }, [activeAccountKey, hydratedReminders, reminders]);

  const updateReminder = (
    reminderId: string,
    updates: Partial<Pick<Reminder, "time" | "title" | "detail">>
  ) => {
    setReminders((currentReminders) =>
      currentReminders.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, ...updates } : reminder
      )
    );
  };

  const addGlass = () => {
    setGlasses((current) => Math.min(current + 1, goal));
  };

  const removeGlass = () => {
    setGlasses((current) => Math.max(current - 1, 0));
  };

  return (
    <ScreenGradient>
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
            <View
              style={[
                styles.fullGoalLight,
                { opacity: circleProgress >= 1 ? 1 : 0 },
              ]}
            />
            <View
              style={[
                styles.progressGlow,
                {
                  opacity: circleProgress * 0.85,
                  transform: [{ scale: 1 + circleProgress * 0.03 }],
                },
              ]}
            />
            <View style={styles.progressRing}>
              {Array.from({ length: RING_SEGMENT_COUNT }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.ringSegment,
                    index < activeRingSegments && styles.activeRingSegment,
                    {
                      transform: [
                        { rotate: `${(360 / RING_SEGMENT_COUNT) * index}deg` },
                        { translateY: -55 },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.dropInner}>
              <Ionicons name="water-outline" size={42} color="#C9B85C" />
              <Text style={styles.waterNumber}>{glasses}/{goal}</Text>
              <Text style={styles.waterLabel}>glasses</Text>
            </View>
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
            <Text style={styles.summaryNumber}>
              {waterStreak} {waterStreak === 1 ? "day" : "days"}
            </Text>
            <Text style={styles.summaryLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Reminders</Text>
            {reverseReminders && <Text style={styles.activeFilterText}>Latest first</Text>}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, reverseReminders && styles.activeCircleBtn]}
            onPress={() => setReverseReminders((current) => !current)}
          >
            <Ionicons name="time-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <View style={styles.reminderList}>
          {visibleReminders.map((item) => (
            <View
              key={item.id}
              style={styles.reminderCard}
            >
              {expandedReminder === item.id ? (
                <TextInput
                  style={styles.timeInput}
                  value={item.time}
                  onChangeText={(value) => updateReminder(item.id, { time: value })}
                  placeholder="09:00"
                  placeholderTextColor="#B8AD91"
                />
              ) : (
                <View style={styles.timePill}>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              )}
              <View style={[styles.reminderIcon, { backgroundColor: item.background }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.reminderContent}>
                {expandedReminder === item.id ? (
                  <View style={styles.reminderEditor}>
                    <TextInput
                      style={styles.editorInput}
                      value={item.title}
                      onChangeText={(value) =>
                        updateReminder(item.id, { title: value })
                      }
                      placeholder="Reminder title"
                      placeholderTextColor="#B8AD91"
                    />
                    <TextInput
                      style={styles.editorInput}
                      value={item.detail}
                      onChangeText={(value) =>
                        updateReminder(item.id, { detail: value })
                      }
                      placeholder="Reminder detail"
                      placeholderTextColor="#B8AD91"
                    />
                    <Text style={styles.reminderMeta}>Reminder enabled</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <Text style={styles.reminderDetail}>{item.detail}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  setExpandedReminder((current) =>
                    current === item.id ? null : item.id
                  )
                }
              >
                <Ionicons
                  name={expandedReminder === item.id ? "chevron-up" : "chevron-forward"}
                  size={18}
                  color="#C7B98F"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: "#FFF3BE",
    justifyContent: "center",
    alignItems: "center",
  },

  activeCircleBtn: {
    backgroundColor: "#FFF0A8",
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#F3DF7D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "visible",
  },

  fullGoalLight: {
    position: "absolute",
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: "rgba(243, 223, 125, 0.18)",
    shadowColor: "#F3DF7D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 8,
  },

  progressGlow: {
    position: "absolute",
    width: 134,
    height: 134,
    borderRadius: 67,
    borderWidth: 4,
    borderColor: "#F7E789",
    backgroundColor: "transparent",
    shadowColor: "#F3DF7D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },

  progressRing: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },

  ringSegment: {
    position: "absolute",
    width: 5,
    height: 13,
    borderRadius: 3,
    backgroundColor: "#FFF4C8",
  },

  activeRingSegment: {
    backgroundColor: "#F3DF7D",
    shadowColor: "#F3DF7D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  dropInner: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#FFF9E3",
    justifyContent: "center",
    alignItems: "center",
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

  activeFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C9B85C",
    marginTop: 4,
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

  timeInput: {
    width: 54,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#FFF7CF",
    color: "#C9B85C",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginRight: 10,
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

  reminderMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C9B85C",
    marginTop: 8,
  },

  reminderEditor: {
    gap: 8,
  },

  editorInput: {
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: "#FFFBEA",
    color: "#2B2B2B",
    fontSize: 14,
    paddingHorizontal: 12,
  },
});
