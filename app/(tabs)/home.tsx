import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { useDailyProgress } from "@/contexts/daily-progress";
import { useGoals } from "@/contexts/goals";
import { useFocusEffect } from "@react-navigation/native";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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

type TasksByDate = Record<string, Task[]>;

type TaskSearchResult = {
  task: Task;
  date: Date;
  dateKey: string;
  dateLabel: string;
  taskIndex: number;
};

type AgendaItem = {
  time: string;
  title: string;
  note: string;
  type: string;
  icon: IconName;
  color: string;
  background: string;
};

type AgendaByDate = Record<string, AgendaItem[]>;

type UpcomingEvent = AgendaItem & {
  date: Date;
  dateLabel: string;
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
const TASKS_STORAGE_KEY = "luvia:tasks";
const AGENDA_STORAGE_KEY = "luvia:agenda";
const getScopedStorageKey = (baseKey: string, accountKey: string) =>
  `${baseKey}:${accountKey}`;

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

const getGreeting = (date: Date) => {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
};

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const isSameDate = (firstDate: Date, secondDate: Date) =>
  firstDate.getDate() === secondDate.getDate() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getFullYear() === secondDate.getFullYear();

const parseDateKey = (dateKey: string) => {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const parseBirthDate = (value: string) => {
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const getNextBirthday = (birthDate: string, today: Date) => {
  const date = parseBirthDate(birthDate);

  if (!date) {
    return null;
  }

  const nextBirthday = new Date(
    today.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (nextBirthday < todayStart) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  return nextBirthday;
};

const formatCompactNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return value.toString();
};

const getTaskTimeLabel = (task: Task, taskDate: Date, today: Date) => {
  if (task.time !== "Today") {
    return task.time;
  }

  return isSameDate(taskDate, today) ? "Today" : "Anytime";
};

export default function HomeScreen() {
  const router = useRouter();
  const { activeAccountKey, birthDate, profileImageUri } = useAccount();
  const { steps, waterGlasses } = useDailyProgress();
  const { waterGoal } = useGoals();
  const [now, setNow] = useState(() => new Date());
  const today = now;
  const [selectedDate, setSelectedDate] = useState(today);
  const days = getWeek(selectedDate);
  const selectedDay = days.findIndex((item) =>
    isSameDate(item.full, selectedDate)
  );
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [agendaByDate, setAgendaByDate] = useState<AgendaByDate>({});
  const [hydratedTasks, setHydratedTasks] = useState(false);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [selectedTaskIcon, setSelectedTaskIcon] =
    useState<IconName>("ellipse-outline");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const greeting = getGreeting(now);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadHomeData = useCallback(async () => {
    if (!activeAccountKey) {
      return;
    }

    setHydratedTasks(false);
    setTasksByDate({});
    setAgendaByDate({});

    try {
      const [storedTasks, storedAgenda] = await Promise.all([
        AsyncStorage.getItem(
          getScopedStorageKey(TASKS_STORAGE_KEY, activeAccountKey)
        ),
        AsyncStorage.getItem(
          getScopedStorageKey(AGENDA_STORAGE_KEY, activeAccountKey)
        ),
      ]);

      if (storedTasks) {
        setTasksByDate(JSON.parse(storedTasks) as TasksByDate);
      }

      if (storedAgenda) {
        setAgendaByDate(JSON.parse(storedAgenda) as AgendaByDate);
      }
    } catch {
      // Keep current in-memory data if local storage is unavailable or corrupted.
    } finally {
      setHydratedTasks(true);
    }
  }, [activeAccountKey]);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  useEffect(() => {
    if (!hydratedTasks || !activeAccountKey) {
      return;
    }

    void AsyncStorage.setItem(
      getScopedStorageKey(TASKS_STORAGE_KEY, activeAccountKey),
      JSON.stringify(tasksByDate)
    ).catch(() => {
        // Keep in-memory tasks even if persistence fails.
      });
  }, [activeAccountKey, hydratedTasks, tasksByDate]);

  const isToday = isSameDate(selectedDate, today);
  const dayLabel = isToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const selectedDateKey = getDateKey(selectedDate);
  const tasks = tasksByDate[selectedDateKey] ?? [];
  const agenda = agendaByDate[selectedDateKey] ?? [];
  const upcomingEvents: UpcomingEvent[] = Object.entries(agendaByDate).flatMap(
    ([dateKey, items]) => {
      const date = parseDateKey(dateKey);

      if (!date) {
        return [];
      }

      const dateLabelForEvent = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

      return items.map((item) => ({
        ...item,
        date,
        dateLabel: dateLabelForEvent,
      }));
    }
  );
  const birthdayDate = getNextBirthday(birthDate, today);

  if (birthdayDate) {
    upcomingEvents.push({
      time: "All day",
      title: "Your birthday",
      note: "Your birthday is coming up.",
      type: "Birthday",
      icon: "gift-outline",
      color: "#C9B85C",
      background: "#FFF0A8",
      date: birthdayDate,
      dateLabel: birthdayDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      }),
    });
  }

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nextEvent =
    upcomingEvents
      .filter((item) => item.date >= todayStart)
      .sort((firstEvent, secondEvent) => {
        const dateDifference =
          firstEvent.date.getTime() - secondEvent.date.getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return firstEvent.time.localeCompare(secondEvent.time);
      })[0] ?? null;
  const completedTasks = tasks.filter((task) => task.done).length;
  const taskProgress = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearchingTasks = normalizedSearchQuery.length > 0;
  const taskSearchResults: TaskSearchResult[] = isSearchingTasks
    ? Object.entries(tasksByDate)
        .flatMap(([dateKey, dateTasks]) => {
          const date = parseDateKey(dateKey);

          if (!date) {
            return [];
          }

          const dateLabelForTask = date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
          });

          return dateTasks
            .map((task, taskIndex) => ({
              task,
              taskIndex,
              date,
              dateKey,
              dateLabel: dateLabelForTask,
            }))
            .filter(({ task }) =>
              task.text.toLowerCase().includes(normalizedSearchQuery)
            );
        })
        .sort((firstTask, secondTask) => {
          const dateDifference =
            firstTask.date.getTime() - secondTask.date.getTime();

          if (dateDifference !== 0) {
            return dateDifference;
          }

          return firstTask.task.time.localeCompare(secondTask.task.time);
        })
    : [];
  const visibleTasks = isSearchingTasks ? [] : tasks;

  const updateSelectedDateTasks = (updater: (currentTasks: Task[]) => Task[]) => {
    setTasksByDate((currentTasksByDate) => ({
      ...currentTasksByDate,
      [selectedDateKey]: updater(currentTasksByDate[selectedDateKey] ?? []),
    }));
  };

  const toggleTask = (index: number) => {
    updateSelectedDateTasks((currentTasks) =>
      currentTasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, done: !task.done } : task
      )
    );
  };

  const deleteTask = (index: number) => {
    updateSelectedDateTasks((currentTasks) =>
      currentTasks.filter((_, taskIndex) => taskIndex !== index)
    );
  };

  const deleteTaskForDate = (dateKey: string, index: number) => {
    setTasksByDate((currentTasksByDate) => ({
      ...currentTasksByDate,
      [dateKey]: (currentTasksByDate[dateKey] ?? []).filter(
        (_, taskIndex) => taskIndex !== index
      ),
    }));
  };

  const openTaskDate = (date: Date) => {
    setSelectedDate(date);
    setSearchQuery("");
    setShowSearch(false);
  };

  const openNextEventInAgenda = (openCalendar = false) => {
    if (!nextEvent) {
      router.push("/plans");
      return;
    }

    router.push({
      pathname: "/plans",
      params: {
        date: getDateKey(nextEvent.date),
        openCalendar: openCalendar ? "true" : "false",
        openedAt: Date.now().toString(),
      },
    });
  };

  const addTask = () => {
    const trimmedText = newTaskText.trim();

    if (!trimmedText) {
      return;
    }

    updateSelectedDateTasks((currentTasks) => [
      ...currentTasks,
      {
        text: trimmedText,
        time: newTaskTime.trim() || "Anytime",
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
    <ScreenGradient>
      <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>{greeting}</Text>
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
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.profileButtonImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person-outline" size={20} color="#C9B85C" />
              )}
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
            <Text style={styles.heroTitle}>
              {tasks.length === 0 ? "Your day is clear" : "Your day is set up"}
            </Text>
            <Text style={styles.heroText}>
              {tasks.length === 0
                ? "Add your own tasks when you are ready."
                : `${completedTasks} of ${tasks.length} tasks complete. Keep the pace gentle and clear.`}
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
                onPress={() => setSelectedDate(item.full)}
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
            <Text style={styles.summaryNumber}>{agenda.length}</Text>
            <Text style={styles.summaryLabel}>Events</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{formatCompactNumber(steps)}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {waterGlasses}/{waterGoal}
            </Text>
            <Text style={styles.summaryLabel}>Water</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next event</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => openNextEventInAgenda(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        {nextEvent ? (
          <>
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => openNextEventInAgenda(false)}
            >
              <View style={styles.eventTime}>
                <Text style={styles.eventTimeText}>{nextEvent.time}</Text>
              </View>
              <View
                style={[
                  styles.eventIcon,
                  { backgroundColor: nextEvent.background },
                ]}
              >
                <Ionicons
                  name={nextEvent.icon}
                  size={20}
                  color={nextEvent.color}
                />
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{nextEvent.title}</Text>
                <Text style={styles.eventNote}>
                  {nextEvent.dateLabel} - {nextEvent.note}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#C7B98F"
              />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyEventCard}>
            <Ionicons name="calendar-outline" size={24} color="#C9B85C" />
            <Text style={styles.emptyEventTitle}>No events yet</Text>
            <Text style={styles.emptyEventText}>
              Add an event in Agenda and it will show here.
            </Text>
          </View>
        )}

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
          {visibleTasks.length === 0 && taskSearchResults.length === 0 && (
            <View style={styles.emptyTaskCard}>
              <Ionicons name="add-circle-outline" size={24} color="#C9B85C" />
              <Text style={styles.emptyTaskTitle}>
                {searchQuery.trim().length > 0 ? "No tasks found" : "No tasks yet"}
              </Text>
              <Text style={styles.emptyTaskText}>
                {searchQuery.trim().length > 0
                  ? "Try another search term across your calendar."
                  : "Tap the plus button above to add one for this day."}
              </Text>
            </View>
          )}
          {taskSearchResults.map((result) => (
            <View
              key={`${result.dateKey}-${result.task.text}-${result.taskIndex}`}
            >
              <SwipeableTaskCard
                task={result.task}
                dateLabel={result.dateLabel}
                timeLabel={getTaskTimeLabel(result.task, result.date, today)}
                onPress={() => openTaskDate(result.date)}
                onDelete={() =>
                  deleteTaskForDate(result.dateKey, result.taskIndex)
                }
              />
            </View>
          ))}
          {visibleTasks.map((task) => {
            const taskIndex = tasks.findIndex((item) => item === task);

            return (
            <SwipeableTaskCard
              key={`${task.text}-${taskIndex}`}
              task={task}
              timeLabel={getTaskTimeLabel(task, selectedDate, today)}
              onPress={() => toggleTask(taskIndex)}
              onDelete={() => deleteTask(taskIndex)}
            />
          );
          })}
        </View>
      </ScrollView>
      </View>
    </ScreenGradient>
  );
}

function SwipeableTaskCard({
  task,
  dateLabel,
  timeLabel,
  onPress,
  onDelete,
}: {
  task: Task;
  dateLabel?: string;
  timeLabel?: string;
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
            {dateLabel && (
              <Text style={styles.taskDateBadge}>{dateLabel}</Text>
            )}
            <Text style={[styles.taskText, task.done && styles.taskDone]}>
              {task.text}
            </Text>
            <Text style={styles.taskTime}>{timeLabel ?? task.time}</Text>
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
    overflow: "hidden",
  },

  activeCircleBtn: {
    backgroundColor: "#FFF0A8",
  },

  profileButtonImage: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
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

  emptyEventCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
    marginBottom: 28,
  },

  emptyEventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B2B2B",
    marginTop: 10,
  },

  emptyEventText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginTop: 5,
    textAlign: "center",
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

  emptyTaskCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
  },

  emptyTaskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B2B2B",
    marginTop: 10,
  },

  emptyTaskText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginTop: 5,
    textAlign: "center",
  },

  taskDateBadge: {
    alignSelf: "flex-start",
    borderRadius: 11,
    backgroundColor: "#FFF7CF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#C9B85C",
    marginBottom: 7,
    overflow: "hidden",
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
