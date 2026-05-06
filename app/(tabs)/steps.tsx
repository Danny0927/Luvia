import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { useDailyProgress } from "@/contexts/daily-progress";
import { useGoals } from "@/contexts/goals";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type WalkSession = {
  id: string;
  title: string;
  detail: string;
  icon: IconName;
  background: string;
  color: string;
  status: "Done" | "Planned";
};

const ACTIVITY_STORAGE_KEY = "luvia:step-activity";
const getScopedStorageKey = (baseKey: string, accountKey: string) =>
  `${baseKey}:${accountKey}`;

const defaultWalkSessions: WalkSession[] = [
  {
    id: "morning-walk",
    title: "Morning walk",
    detail: "0 steps · 0 min",
    icon: "sunny-outline",
    background: "#FFF7CF",
    color: "#C9B85C",
    status: "Planned",
  },
  {
    id: "errands",
    title: "Errands",
    detail: "0 steps · not started",
    icon: "bag-handle-outline",
    background: "#FFF2BE",
    color: "#8D7A3A",
    status: "Planned",
  },
  {
    id: "evening-reset",
    title: "Evening reset",
    detail: "Planned · 0 min",
    icon: "moon-outline",
    background: "#E8F0DD",
    color: "#6D8A63",
    status: "Planned",
  },
];

const activityFilters = ["All", "Done", "Planned"] as const;
const STEP_INCREMENT = 250;
const STEP_REPEAT_DELAY = 350;
const STEP_REPEAT_INTERVAL = 90;
const RING_RADIUS = 55;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function StepsScreen() {
  const { activeAccountKey } = useAccount();
  const { stepGoal: goal } = useGoals();
  const { steps, setSteps, weekSteps } = useDailyProgress();
  const stepRepeatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRepeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const didRepeatSteps = useRef(false);
  const [showStats, setShowStats] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [activityFilter, setActivityFilter] =
    useState<(typeof activityFilters)[number]>("All");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [walkSessions, setWalkSessions] =
    useState<WalkSession[]>(defaultWalkSessions);
  const [hydratedActivity, setHydratedActivity] = useState(false);
  const ringSegmentCount = Math.max(Math.ceil(goal / STEP_INCREMENT), 1);
  const ringSegmentArc = RING_CIRCUMFERENCE / ringSegmentCount;
  const ringSegmentWidth = Math.min(
    34,
    Math.max(2.5, ringSegmentArc * 0.72)
  );
  const ringSegmentHeight = Math.min(
    14,
    Math.max(7, ringSegmentArc * 0.42)
  );
  const progress = goal > 0 ? steps / goal : 0;
  const circleProgress = Math.min(progress, 1);
  const activeRingSegments = Math.min(
    Math.ceil(steps / STEP_INCREMENT),
    ringSegmentCount
  );
  const remaining = Math.max(goal - steps, 0);
  const distance = steps * 0.00075;
  const calories = Math.round(steps * 0.04);
  const activeMinutes = Math.round(steps / 100);
  const weekProgress = weekSteps.map((item) => ({
    day: item.day,
    value: goal > 0 ? item.steps / goal : 0,
  }));
  const visibleSessions = walkSessions.filter(
    (item) => activityFilter === "All" || item.status === activityFilter
  );

  useEffect(() => {
    if (!activeAccountKey) {
      return;
    }

    setHydratedActivity(false);
    setWalkSessions(defaultWalkSessions);

    const loadActivity = async () => {
      try {
        const storedActivity = await AsyncStorage.getItem(
          getScopedStorageKey(ACTIVITY_STORAGE_KEY, activeAccountKey)
        );

        if (storedActivity) {
          setWalkSessions(JSON.parse(storedActivity) as WalkSession[]);
        }
      } catch {
        setWalkSessions(defaultWalkSessions);
      } finally {
        setHydratedActivity(true);
      }
    };

    void loadActivity();
  }, [activeAccountKey]);

  useEffect(() => {
    if (!activeAccountKey || !hydratedActivity) {
      return;
    }

    void AsyncStorage.setItem(
      getScopedStorageKey(ACTIVITY_STORAGE_KEY, activeAccountKey),
      JSON.stringify(walkSessions)
    ).catch(() => {
      // Keep in-memory activity if persistence fails.
    });
  }, [activeAccountKey, hydratedActivity, walkSessions]);

  const updateSession = (
    sessionId: string,
    updates: Partial<Pick<WalkSession, "title" | "detail" | "status">>
  ) => {
    setWalkSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const clearStepRepeat = useCallback(() => {
    if (stepRepeatTimeout.current) {
      clearTimeout(stepRepeatTimeout.current);
      stepRepeatTimeout.current = null;
    }

    if (stepRepeatInterval.current) {
      clearInterval(stepRepeatInterval.current);
      stepRepeatInterval.current = null;
    }
  }, []);

  const updateSteps = (change: number) => {
    setSteps((current) => Math.min(Math.max(current + change, 0), goal));
  };

  const startStepRepeat = (change: number) => {
    clearStepRepeat();
    didRepeatSteps.current = false;

    stepRepeatTimeout.current = setTimeout(() => {
      didRepeatSteps.current = true;
      updateSteps(change);
      stepRepeatInterval.current = setInterval(() => {
        didRepeatSteps.current = true;
        updateSteps(change);
      }, STEP_REPEAT_INTERVAL);
    }, STEP_REPEAT_DELAY);
  };

  const updateStepsOnTap = (change: number) => {
    if (didRepeatSteps.current) {
      didRepeatSteps.current = false;
      return;
    }

    updateSteps(change);
  };

  useEffect(() => clearStepRepeat, [clearStepRepeat]);

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
              onPress={() => updateStepsOnTap(-STEP_INCREMENT)}
              onPressIn={() => startStepRepeat(-STEP_INCREMENT)}
              onPressOut={clearStepRepeat}
            >
              <Ionicons name="remove" size={22} color="#C9B85C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => updateStepsOnTap(STEP_INCREMENT)}
              onPressIn={() => startStepRepeat(STEP_INCREMENT)}
              onPressOut={clearStepRepeat}
            >
              <Ionicons name="add" size={22} color="#C9B85C" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.progressCircle}>
            <View
              style={[
                styles.fullGoalLight,
                { opacity: circleProgress >= 1 ? 1 : 0 },
              ]}
            />
            <View
              style={[
                styles.completedGlow,
                {
                  opacity: circleProgress * 0.85,
                  transform: [{ scale: 1 + circleProgress * 0.03 }],
                },
              ]}
            />
            <View style={styles.progressRing}>
              {Array.from({ length: ringSegmentCount }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.ringSegment,
                    index < activeRingSegments && styles.activeRingSegment,
                    {
                      width: ringSegmentWidth,
                      height: ringSegmentHeight,
                      borderRadius: Math.min(6, ringSegmentWidth / 2),
                      transform: [
                        { rotate: `${(360 / ringSegmentCount) * index}deg` },
                        { translateY: -RING_RADIUS },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
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
            <Text style={styles.summaryNumber}>{distance.toFixed(1)} km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{calories}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{activeMinutes}m</Text>
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
            <View
              key={item.id}
              style={styles.sessionCard}
            >
              <View style={[styles.sessionIcon, { backgroundColor: item.background }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.sessionContent}>
                {expandedSession === item.id ? (
                  <View style={styles.sessionEditor}>
                    <TextInput
                      style={styles.editorInput}
                      value={item.title}
                      onChangeText={(value) =>
                        updateSession(item.id, { title: value })
                      }
                      placeholder="Activity title"
                      placeholderTextColor="#B8AD91"
                    />
                    <TextInput
                      style={styles.editorInput}
                      value={item.detail}
                      onChangeText={(value) =>
                        updateSession(item.id, { detail: value })
                      }
                      placeholder="Activity detail"
                      placeholderTextColor="#B8AD91"
                    />
                    <TouchableOpacity
                      style={styles.statusToggle}
                      onPress={() =>
                        updateSession(item.id, {
                          status: item.status === "Done" ? "Planned" : "Done",
                        })
                      }
                    >
                      <Text style={styles.sessionMeta}>{item.status}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.sessionTitle}>{item.title}</Text>
                    <Text style={styles.sessionDetail}>{item.detail}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  setExpandedSession((current) =>
                    current === item.id ? null : item.id
                  )
                }
              >
                <Ionicons
                  name={expandedSession === item.id ? "chevron-up" : "chevron-forward"}
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

  completedGlow: {
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

  sessionEditor: {
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

  statusToggle: {
    alignSelf: "flex-start",
  },
});
