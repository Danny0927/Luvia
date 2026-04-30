import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenGradient } from "@/components/screen-gradient";
import { useDailyProgress } from "@/contexts/daily-progress";
import { useGoals } from "@/contexts/goals";
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

const weekProgress = [
  { day: "Mon", value: 0.58 },
  { day: "Tue", value: 0.72 },
  { day: "Wed", value: 0.86 },
  { day: "Thu", value: 0.64 },
  { day: "Fri", value: 0.92 },
  { day: "Sat", value: 0.48 },
  { day: "Sun", value: 0.78 },
];

const walkSessions: {
  title: string;
  detail: string;
  icon: IconName;
  background: string;
  color: string;
  status: "Done" | "Planned";
}[] = [
  {
    title: "Morning walk",
    detail: "2,840 steps · 24 min",
    icon: "sunny-outline",
    background: "#FFF7CF",
    color: "#C9B85C",
    status: "Done",
  },
  {
    title: "Errands",
    detail: "1,620 steps · light pace",
    icon: "bag-handle-outline",
    background: "#FFF2BE",
    color: "#8D7A3A",
    status: "Done",
  },
  {
    title: "Evening reset",
    detail: "Planned · 20 min",
    icon: "moon-outline",
    background: "#E8F0DD",
    color: "#6D8A63",
    status: "Planned",
  },
];

const activityFilters = ["All", "Done", "Planned"] as const;

export default function StepsScreen() {
  const { stepGoal: goal } = useGoals();
  const { steps, setSteps } = useDailyProgress();
  const [showStats, setShowStats] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [activityFilter, setActivityFilter] =
    useState<(typeof activityFilters)[number]>("All");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const progress = goal > 0 ? steps / goal : 0;
  const remaining = Math.max(goal - steps, 0);
  const visibleSessions = walkSessions.filter(
    (item) => activityFilter === "All" || item.status === activityFilter
  );

  return (
    <ScreenGradient>
      <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>Movement</Text>
            <Text style={styles.title}>Steps</Text>
          </View>

          <View style={styles.topButtons}>
            <TouchableOpacity
              style={[styles.circleBtn, showStats && styles.activeCircleBtn]}
              onPress={() => setShowStats((visible) => !visible)}
            >
              <Ionicons name="stats-chart-outline" size={20} color="#C9B85C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setSteps((current) => Math.max(current - 250, 0))}
            >
              <Ionicons name="remove" size={22} color="#C9B85C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setSteps((current) => Math.min(current + 250, goal))}
            >
              <Ionicons name="add" size={22} color="#C9B85C" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.progressCircle}>
            <View style={styles.progressInner}>
              <Ionicons name="footsteps-outline" size={30} color="#C9B85C" />
              <Text style={styles.stepsNumber}>{steps.toLocaleString()}</Text>
              <Text style={styles.stepsLabel}>steps</Text>
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Daily goal</Text>
            <Text style={styles.heroText}>
              {remaining.toLocaleString()} steps left to complete today.
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {showStats && (
          <View style={styles.statsPanel}>
            <View>
              <Text style={styles.statsPanelTitle}>Progress</Text>
              <Text style={styles.statsPanelText}>
                {Math.round(progress * 100)}% complete today
              </Text>
            </View>
            <Text style={styles.statsPanelValue}>{remaining.toLocaleString()} left</Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>5.6 km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>312</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>68m</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly rhythm</Text>
          <TouchableOpacity
            style={[styles.filterButton, showChart && styles.activeCircleBtn]}
            onPress={() => setShowChart((visible) => !visible)}
          >
            <Ionicons name="calendar-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        {showChart && (
          <View style={styles.chartCard}>
            {weekProgress.map((item) => (
              <View key={item.day} style={styles.barItem}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${item.value * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Activity</Text>
            {activityFilter !== "All" && (
              <Text style={styles.activeFilterText}>{activityFilter}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, activityFilter !== "All" && styles.activeCircleBtn]}
            onPress={() =>
              setActivityFilter((current) => {
                const currentIndex = activityFilters.indexOf(current);
                return activityFilters[(currentIndex + 1) % activityFilters.length];
              })
            }
          >
            <Ionicons name="options-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <View style={styles.sessionList}>
          {visibleSessions.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.sessionCard}
              onPress={() =>
                setExpandedSession((current) =>
                  current === item.title ? null : item.title
                )
              }
            >
              <View style={[styles.sessionIcon, { backgroundColor: item.background }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>{item.title}</Text>
                <Text style={styles.sessionDetail}>{item.detail}</Text>
                {expandedSession === item.title && (
                  <Text style={styles.sessionMeta}>{item.status}</Text>
                )}
              </View>
              <Ionicons
                name={expandedSession === item.title ? "chevron-up" : "chevron-forward"}
                size={18}
                color="#C7B98F"
              />
            </TouchableOpacity>
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

  topButtons: {
    flexDirection: "row",
    gap: 10,
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

  heroCard: {
    backgroundColor: "#FFF3BE",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  progressCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#F3DF7D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  progressInner: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#FFF9E3",
    justifyContent: "center",
    alignItems: "center",
  },

  stepsNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2B2B",
    marginTop: 6,
  },

  stepsLabel: {
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

  statsPanel: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 20,
  },

  statsPanelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2B2B2B",
    marginBottom: 4,
  },

  statsPanelText: {
    fontSize: 13,
    color: "#8A8067",
  },

  statsPanelValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C9B85C",
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

  chartCard: {
    height: 170,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 28,
  },

  barItem: {
    alignItems: "center",
    justifyContent: "flex-end",
  },

  barTrack: {
    width: 20,
    height: 112,
    borderRadius: 10,
    backgroundColor: "#FFF4C8",
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  barFill: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#F3DF7D",
  },

  barLabel: {
    fontSize: 11,
    color: "#8A8067",
    marginTop: 10,
  },

  sessionList: {
    gap: 12,
  },

  sessionCard: {
    minHeight: 74,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  sessionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  sessionContent: {
    flex: 1,
  },

  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  sessionDetail: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 5,
  },

  sessionMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C9B85C",
    marginTop: 8,
  },
});
