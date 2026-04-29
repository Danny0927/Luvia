import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Task = {
  text: string;
  time: string;
  icon: IconName;
  done: boolean;
};

const taskIconOptions: IconName[] = [
  "ellipse-outline",
  "body-outline",
  "headset-outline",
  "create-outline",
  "calendar-outline",
  "walk-outline",
  "water-outline",
  "sparkles-outline",
];

const TASK_SWIPE_WIDTH = 96;

const getWeek = (today: Date) => {
  const start = new Date(today);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date: date.getDate(),
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      full: date,
    };
  });
};

const formatTaskTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length === 3) {
    const firstHourDigit = Number(digits[0]);

    if (firstHourDigit > 2) {
      return `0${digits[0]}:${digits.slice(1)}`;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const days = getWeek(today);
  const todayIndex = days.findIndex(
    (item) =>
      item.full.getDate() === today.getDate() &&
      item.full.getMonth() === today.getMonth() &&
      item.full.getFullYear() === today.getFullYear()
  );

  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [tasks, setTasks] = useState<Task[]>([
    {
      text: "Stretch and roll out",
      time: "08:30",
      icon: "body-outline",
      done: false,
    },
    {
      text: "Podcast walk",
      time: "10:00",
      icon: "headset-outline",
      done: false,
    },
    {
      text: "Plan my day",
      time: "11:30",
      icon: "create-outline",
      done: true,
    },
    {
      text: "Schedule posts",
      time: "15:00",
      icon: "calendar-outline",
      done: false,
    },
  ]);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [selectedTaskIcon, setSelectedTaskIcon] =
    useState<IconName>("ellipse-outline");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedDate = days[selectedDay]?.full ?? today;
  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();
  const dayLabel = isToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const completedTasks = tasks.filter((task) => task.done).length;
  const taskProgress = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const visibleTasks = tasks.filter((task) =>
    task.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const toggleTask = (index: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, done: !task.done } : task
      )
    );
  };

  const deleteTask = (index: number) => {
    setTasks((currentTasks) =>
      currentTasks.filter((_, taskIndex) => taskIndex !== index)
    );
  };

  const addTask = () => {
    const trimmedText = newTaskText.trim();

    if (!trimmedText) {
      return;
    }

    setTasks((currentTasks) => [
      ...currentTasks,
      {
        text: trimmedText,
        time: newTaskTime.trim() || "Today",
        icon: selectedTaskIcon,
        done: false,
      },
    ]);
    setNewTaskText("");
    setNewTaskTime("");
    setSelectedTaskIcon("ellipse-outline");
    setShowTaskInput(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>Good morning</Text>
            <Text style={styles.title}>{dayLabel}</Text>
          </View>

          <View style={styles.topButtons}>
            <TouchableOpacity
              style={[styles.circleBtn, showSearch && styles.activeCircleBtn]}
              onPress={() => {
                setShowSearch((visible) => !visible);
                setSearchQuery("");
              }}
            >
              <Ionicons name="search-outline" size={20} color="#C9B85C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person-outline" size={20} color="#C9B85C" />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#C9B85C" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tasks"
              placeholderTextColor="#B8AD91"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#C7B98F" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroDate}>{dateLabel}</Text>
            <Text style={styles.heroTitle}>Your day is set up</Text>
            <Text style={styles.heroText}>
              {completedTasks} of {tasks.length} tasks complete. Keep the pace gentle and clear.
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="sparkles-outline" size={26} color="#C9B85C" />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekList}
        >
          {days.map((item, index) => {
            const active = selectedDay === index;

            return (
              <TouchableOpacity
                key={`${item.day}-${item.date}`}
                style={[styles.dayCard, active && styles.activeDayCard]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[styles.dayText, active && styles.activeDayText]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateText, active && styles.activeDateText]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>3</Text>
            <Text style={styles.summaryLabel}>Events</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>7,840</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>5/8</Text>
            <Text style={styles.summaryLabel}>Water</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next event</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="calendar-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.eventCard}>
          <View style={styles.eventTime}>
            <Text style={styles.eventTimeText}>11:30</Text>
          </View>
          <View style={styles.eventIcon}>
            <Ionicons name="create-outline" size={20} color="#C9B85C" />
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>Content planning</Text>
            <Text style={styles.eventNote}>Draft ideas and schedule posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7B98F" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>To do</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowTaskInput((visible) => !visible)}
          >
            <Ionicons name="add" size={20} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        {showTaskInput && (
          <View style={styles.addTaskPanel}>
            <View style={styles.addTaskBar}>
              <TextInput
                style={styles.addTaskInput}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="New task"
                placeholderTextColor="#B8AD91"
                returnKeyType="done"
                onSubmitEditing={addTask}
                autoFocus
              />
              <TextInput
                style={styles.addTaskTimeInput}
                value={newTaskTime}
                onChangeText={(value) =>
                  setNewTaskTime(formatTaskTimeInput(value))
                }
                placeholder="09:00"
                placeholderTextColor="#B8AD91"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={addTask}
              />
              <TouchableOpacity style={styles.addTaskButton} onPress={addTask}>
                <Ionicons name="checkmark" size={20} color="#4A432F" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconPicker}
            >
              {taskIconOptions.map((icon) => {
                const active = selectedTaskIcon === icon;

                return (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      active && styles.activeIconOption,
                    ]}
                    onPress={() => setSelectedTaskIcon(icon)}
                  >
                    <Ionicons
                      name={icon}
                      size={20}
                      color={active ? "#4A432F" : "#C9B85C"}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily tasks</Text>
            <Text style={styles.progressCount}>
              {completedTasks}/{tasks.length}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(taskProgress * 100, 100)}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.taskList}>
          {visibleTasks.map((task) => {
            const taskIndex = tasks.findIndex((item) => item === task);

            return (
            <SwipeableTaskCard
              key={`${task.text}-${taskIndex}`}
              task={task}
              onPress={() => toggleTask(taskIndex)}
              onDelete={() => deleteTask(taskIndex)}
            />
          );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SwipeableTaskCard({
  task,
  onPress,
  onDelete,
}: {
  task: Task;
  onPress: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeOffset = useRef(0);

  const animateSwipe = (toValue: number) => {
    swipeOffset.current = toValue;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      speed: 18,
      bounciness: 3,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const nextPosition = Math.min(
          0,
          Math.max(swipeOffset.current + gestureState.dx, -TASK_SWIPE_WIDTH)
        );
        translateX.setValue(nextPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextPosition = swipeOffset.current + gestureState.dx;
        const shouldOpen =
          nextPosition < -TASK_SWIPE_WIDTH / 2 || gestureState.vx < -0.7;

        if (shouldOpen && swipeOffset.current === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        animateSwipe(shouldOpen ? -TASK_SWIPE_WIDTH : 0);
      },
      onPanResponderTerminate: () => {
        animateSwipe(swipeOffset.current);
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#A46B54" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.swipeCard,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.taskCard}
          onPress={() => {
            if (swipeOffset.current < 0) {
              animateSwipe(0);
              return;
            }

            onPress();
          }}
        >
          <View style={[styles.taskIcon, task.done && styles.taskIconDone]}>
            <Ionicons
              name={task.done ? "checkmark" : task.icon}
              size={20}
              color={task.done ? "#4A432F" : "#C9B85C"}
            />
          </View>

          <View style={styles.taskContent}>
            <Text style={[styles.taskText, task.done && styles.taskDone]}>
              {task.text}
            </Text>
            <Text style={styles.taskTime}>{task.time}</Text>
          </View>

          <Ionicons
            name={task.done ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={task.done ? "#C9B85C" : "#E1D8BB"}
          />
        </TouchableOpacity>
      </Animated.View>
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

  topButtons: {
    flexDirection: "row",
    gap: 10,
  },

  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  activeCircleBtn: {
    backgroundColor: "#FFF0A8",
  },

  searchBar: {
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2B2B2B",
    paddingVertical: 10,
  },

  heroCard: {
    backgroundColor: "#FFF3BE",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  heroDate: {
    fontSize: 13,
    color: "#8A8067",
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 21,
    fontWeight: "600",
    color: "#2B2B2B",
    marginBottom: 8,
  },

  heroText: {
    maxWidth: 230,
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFBEA",
    justifyContent: "center",
    alignItems: "center",
  },

  weekList: {
    gap: 10,
    paddingBottom: 4,
  },

  dayCard: {
    width: 58,
    height: 78,
    borderRadius: 20,
    backgroundColor: "#FFF8DC",
    justifyContent: "center",
    alignItems: "center",
  },

  activeDayCard: {
    backgroundColor: "#FFF0A8",
  },

  dayText: {
    fontSize: 12,
    color: "#8A8067",
    marginBottom: 8,
  },

  activeDayText: {
    color: "#4A432F",
  },

  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  activeDateText: {
    color: "#4A432F",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 20,
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

  eventCard: {
    minHeight: 82,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  eventTime: {
    backgroundColor: "#FFF7CF",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 10,
  },

  eventTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C9B85C",
  },

  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF2BE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  eventContent: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  eventNote: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 5,
  },

  addTaskPanel: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 8,
    marginBottom: 14,
  },

  addTaskBar: {
    minHeight: 50,
    paddingLeft: 16,
    paddingRight: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  addTaskInput: {
    flex: 1,
    fontSize: 16,
    color: "#2B2B2B",
    paddingVertical: 12,
  },

  addTaskTimeInput: {
    width: 64,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7CF",
    color: "#2B2B2B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 10,
  },

  addTaskButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3DF7D",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  iconPicker: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 2,
  },

  iconOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  activeIconOption: {
    backgroundColor: "#F3DF7D",
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  progressCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C9B85C",
  },

  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FFF4C8",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#F3DF7D",
  },

  taskList: {
    gap: 12,
  },

  swipeContainer: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFE8DC",
  },

  deleteAction: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    paddingRight: 18,
  },

  deleteText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A46B54",
  },

  swipeCard: {
    backgroundColor: "#FFFFFF",
  },

  taskCard: {
    minHeight: 74,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  taskIconDone: {
    backgroundColor: "#F3DF7D",
  },

  taskContent: {
    flex: 1,
  },

  taskText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  taskDone: {
    textDecorationLine: "line-through",
    color: "#A9A08A",
  },

  taskTime: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 5,
  },
});
