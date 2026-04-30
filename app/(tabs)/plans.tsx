import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { ScreenGradient } from "@/components/screen-gradient";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
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

const eventIconOptions: {
  icon: IconName;
  type: string;
  color: string;
  background: string;
}[] = [
  {
    icon: "calendar-outline",
    type: "Event",
    color: "#C9B85C",
    background: "#FFF7CF",
  },
  {
    icon: "gift-outline",
    type: "Birthday",
    color: "#C9B85C",
    background: "#FFF0A8",
  },
  {
    icon: "briefcase-outline",
    type: "Work",
    color: "#8D7A3A",
    background: "#FFF2BE",
  },
  {
    icon: "leaf-outline",
    type: "Health",
    color: "#6D8A63",
    background: "#E8F0DD",
  },
  {
    icon: "sparkles-outline",
    type: "Personal",
    color: "#A77A48",
    background: "#FFE8DC",
  },
];

const agendaFilters = ["All", "Event", "Birthday", "Work", "Health", "Personal"] as const;
const AGENDA_STORAGE_KEY = "luvia:agenda";
const EVENT_SWIPE_WIDTH = 96;

const getWeek = (today: Date) => {
  const start = new Date(today);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate().toString(),
      full: date,
    };
  });
};

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (firstDay.getDay() + 6) % 7;

  return [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return new Date(year, month, day);
    }),
  ];
};

const isSameDate = (firstDate: Date, secondDate: Date) =>
  firstDate.getDate() === secondDate.getDate() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getFullYear() === secondDate.getFullYear();

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const formatEventTimeInput = (value: string) => {
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

export default function PlansScreen() {
  const today = new Date();
  const weekDays = getWeek(today);
  const todayIndex = weekDays.findIndex(
    (item) =>
      item.full.getDate() === today.getDate() &&
      item.full.getMonth() === today.getMonth() &&
      item.full.getFullYear() === today.getFullYear()
  );
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [agendaByDate, setAgendaByDate] = useState<AgendaByDate>({});
  const [hydratedAgenda, setHydratedAgenda] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [selectedEventIcon, setSelectedEventIcon] =
    useState<(typeof eventIconOptions)[number]>(eventIconOptions[0]);
  const [activeFilter, setActiveFilter] =
    useState<(typeof agendaFilters)[number]>("All");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const selectedDateKey = getDateKey(selectedDate);
  const agenda = agendaByDate[selectedDateKey] ?? [];
  const monthDays = getMonthDays(visibleMonth);
  const monthDisplayDate = showCalendar ? visibleMonth : selectedDate;
  const monthLabel = monthDisplayDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const selectedDayLabel =
    isSameDate(selectedDate, today)
      ? "Today"
      : selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const hasEventsOnDate = (date: Date) =>
    (agendaByDate[getDateKey(date)] ?? []).length > 0;
  const visibleAgenda = agenda.filter((item) => {
    const matchesFilter = activeFilter === "All" || item.type === activeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      item.title.toLowerCase().includes(query) ||
      item.note.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    const loadAgenda = async () => {
      try {
        const storedAgenda = await AsyncStorage.getItem(AGENDA_STORAGE_KEY);

        if (storedAgenda) {
          setAgendaByDate(JSON.parse(storedAgenda) as AgendaByDate);
        }
      } catch {
        // Keep agenda empty if local storage is unavailable or corrupted.
      } finally {
        setHydratedAgenda(true);
      }
    };

    void loadAgenda();
  }, []);

  useEffect(() => {
    if (!hydratedAgenda) {
      return;
    }

    void AsyncStorage.setItem(
      AGENDA_STORAGE_KEY,
      JSON.stringify(agendaByDate)
    ).catch(() => {
      // Keep in-memory agenda even if persistence fails.
    });
  }, [agendaByDate, hydratedAgenda]);

  const updateSelectedDateAgenda = (
    updater: (currentAgenda: AgendaItem[]) => AgendaItem[]
  ) => {
    setAgendaByDate((currentAgendaByDate) => ({
      ...currentAgendaByDate,
      [selectedDateKey]: updater(currentAgendaByDate[selectedDateKey] ?? []),
    }));
  };

  const deleteEvent = (index: number) => {
    updateSelectedDateAgenda((currentAgenda) =>
      currentAgenda.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const addEvent = () => {
    const title = newEventTitle.trim();

    if (!title) {
      return;
    }

    updateSelectedDateAgenda((current) => [
      ...current,
      {
        time: newEventTime.trim() || "All day",
        title,
        note: `${selectedEventIcon.type} event`,
        type: selectedEventIcon.type,
        icon: selectedEventIcon.icon,
        color: selectedEventIcon.color,
        background: selectedEventIcon.background,
      },
    ]);
    setNewEventTitle("");
    setNewEventTime("");
    setSelectedEventIcon(eventIconOptions[0]);
    setShowAddEvent(false);
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
            <Text style={styles.kicker}>This week</Text>
            <Text style={styles.title}>Agenda</Text>
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
              style={[styles.circleBtn, showAddEvent && styles.activeCircleBtn]}
              onPress={() => setShowAddEvent((visible) => !visible)}
            >
              <Ionicons name="add" size={22} color="#C9B85C" />
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
              placeholder="Search agenda"
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

        {showAddEvent && (
          <View style={styles.addEventPanel}>
            <View style={styles.addEventBar}>
              <TextInput
                style={styles.addEventInput}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="New event"
                placeholderTextColor="#B8AD91"
                returnKeyType="done"
                onSubmitEditing={addEvent}
                autoFocus
              />
              <TextInput
                style={styles.addEventTimeInput}
                value={newEventTime}
                onChangeText={(value) =>
                  setNewEventTime(formatEventTimeInput(value))
                }
                placeholder="14:00"
                placeholderTextColor="#B8AD91"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={addEvent}
              />
              <TouchableOpacity style={styles.addEventButton} onPress={addEvent}>
                <Ionicons name="checkmark" size={20} color="#4A432F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.eventTypeHint}>{selectedEventIcon.type}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventIconPicker}
            >
              {eventIconOptions.map((item) => {
                const active = selectedEventIcon.icon === item.icon;

                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.eventIconOption,
                      { backgroundColor: item.background },
                      active && styles.activeEventIconOption,
                    ]}
                    onPress={() => setSelectedEventIcon(item)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={active ? "#4A432F" : item.color}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.monthCard}>
          <View>
            <Text style={styles.monthLabel}>{selectedDateLabel}</Text>
            <Text style={styles.monthTitle}>
              {agenda.length === 0 ? "No events planned" : `${agenda.length} events planned`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.monthIcon}
            onPress={() => {
              setVisibleMonth(selectedDate);
              setShowCalendar((visible) => !visible);
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        {showCalendar && (
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() =>
                  setVisibleMonth(
                    (currentMonth) =>
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1
                      )
                  )
                }
              >
                <Ionicons name="chevron-back" size={18} color="#C9B85C" />
              </TouchableOpacity>

              <Text style={styles.calendarTitle}>{monthLabel}</Text>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() =>
                  setVisibleMonth(
                    (currentMonth) =>
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1
                      )
                  )
                }
              >
                <Ionicons name="chevron-forward" size={18} color="#C9B85C" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <Text key={day} style={styles.calendarWeekText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {monthDays.map((date, index) => {
                const active = date ? isSameDate(date, selectedDate) : false;
                const isToday = date ? isSameDate(date, today) : false;
                const hasEvents = date ? hasEventsOnDate(date) : false;

                return (
                  <TouchableOpacity
                    key={date?.toISOString() ?? `empty-${index}`}
                    style={[
                      styles.calendarDay,
                      active && styles.activeCalendarDay,
                    ]}
                    disabled={!date}
                    onPress={() => {
                      if (!date) {
                        return;
                      }

                      setSelectedDate(date);
                      setVisibleMonth(date);
                      setShowCalendar(false);
                      const weekIndex = weekDays.findIndex((item) =>
                        isSameDate(item.full, date)
                      );
                      setSelectedDay(weekIndex);
                    }}
                  >
                    {date && (
                      <>
                        <Text
                          style={[
                            styles.calendarDayText,
                            active && styles.activeCalendarDayText,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                        <View style={styles.calendarDotRow}>
                          {isToday && <View style={styles.todayDot} />}
                          {hasEvents && <View style={styles.eventDot} />}
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekList}
        >
          {weekDays.map((item, index) => {
            const active = selectedDay === index;
            const hasEvents = hasEventsOnDate(item.full);

            return (
              <TouchableOpacity
                key={item.date}
                style={[styles.dayCard, active && styles.activeDayCard]}
                onPress={() => {
                  setSelectedDay(index);
                  setSelectedDate(item.full);
                }}
              >
                <Text style={[styles.dayText, active && styles.activeDayText]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateText, active && styles.activeDateText]}>
                  {item.date}
                </Text>
                {hasEvents && <View style={styles.weekEventDot} />}
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
            <Text style={styles.summaryNumber}>{visibleAgenda.length}</Text>
            <Text style={styles.summaryLabel}>Planned</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {activeFilter === "All" ? "-" : activeFilter}
            </Text>
            <Text style={styles.summaryLabel}>Filter</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{selectedDayLabel}</Text>
            {activeFilter !== "All" && (
              <Text style={styles.activeFilterText}>{activeFilter}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter !== "All" && styles.activeCircleBtn]}
            onPress={() =>
              setActiveFilter((current) => {
                const currentIndex = agendaFilters.indexOf(current);
                return agendaFilters[(currentIndex + 1) % agendaFilters.length];
              })
            }
          >
            <Ionicons name="options-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <View style={styles.timeline}>
          {visibleAgenda.length === 0 && (
            <View style={styles.emptyAgendaCard}>
              <Ionicons name="calendar-outline" size={24} color="#C9B85C" />
              <Text style={styles.emptyAgendaTitle}>
                {searchQuery.trim().length > 0 ? "No events found" : "No events yet"}
              </Text>
              <Text style={styles.emptyAgendaText}>
                {searchQuery.trim().length > 0
                  ? "Try another search term for this date."
                  : "Tap the plus button above to add an event for this date."}
              </Text>
            </View>
          )}
          {visibleAgenda.map((item, index) => (
            <View key={`${item.time}-${item.title}-${index}`} style={styles.timelineRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{item.time}</Text>
                {index !== visibleAgenda.length - 1 && <View style={styles.line} />}
              </View>

              <SwipeableEventCard
                item={item}
                expanded={expandedEvent === `${item.time}-${item.title}`}
                onPress={() =>
                  setExpandedEvent((current) =>
                    current === `${item.time}-${item.title}`
                      ? null
                      : `${item.time}-${item.title}`
                  )
                }
                onDelete={() => {
                  const agendaIndex = agenda.findIndex((event) => event === item);

                  if (agendaIndex >= 0) {
                    deleteEvent(agendaIndex);
                  }
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      </View>
    </ScreenGradient>
  );
}

function SwipeableEventCard({
  item,
  expanded,
  onPress,
  onDelete,
}: {
  item: AgendaItem;
  expanded: boolean;
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
          Math.max(swipeOffset.current + gestureState.dx, -EVENT_SWIPE_WIDTH)
        );
        translateX.setValue(nextPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextPosition = swipeOffset.current + gestureState.dx;
        const shouldOpen =
          nextPosition < -EVENT_SWIPE_WIDTH / 2 || gestureState.vx < -0.7;

        if (shouldOpen && swipeOffset.current === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        animateSwipe(shouldOpen ? -EVENT_SWIPE_WIDTH : 0);
      },
      onPanResponderTerminate: () => {
        animateSwipe(swipeOffset.current);
      },
    })
  ).current;

  return (
    <View style={styles.eventSwipeContainer}>
      <TouchableOpacity style={styles.eventDeleteAction} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#A46B54" />
        <Text style={styles.eventDeleteText}>Delete</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.eventSwipeCard,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.eventCard}
          onPress={() => {
            if (swipeOffset.current < 0) {
              animateSwipe(0);
              return;
            }

            onPress();
          }}
        >
          <View style={[styles.eventIcon, { backgroundColor: item.background }]}>
            <Ionicons name={item.icon} size={20} color={item.color} />
          </View>

          <View style={styles.eventContent}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventType}>{item.type}</Text>
            </View>
            <Text style={styles.eventNote}>{item.note}</Text>
            {expanded && (
              <Text style={styles.eventMeta}>
                Swipe left to delete this event.
              </Text>
            )}
          </View>
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

  addEventPanel: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 8,
    marginBottom: 18,
  },

  addEventBar: {
    minHeight: 50,
    paddingLeft: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  addEventInput: {
    flex: 1,
    fontSize: 16,
    color: "#2B2B2B",
    paddingVertical: 12,
  },

  addEventTimeInput: {
    width: 68,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7CF",
    color: "#2B2B2B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 10,
  },

  addEventButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3DF7D",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  eventTypeHint: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C9B85C",
    marginTop: 8,
    marginLeft: 8,
  },

  eventIconPicker: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 2,
  },

  eventIconOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  activeEventIconOption: {
    borderWidth: 2,
    borderColor: "#C9B85C",
  },

  monthCard: {
    backgroundColor: "#FFF3BE",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  monthLabel: {
    fontSize: 13,
    color: "#8A8067",
    marginBottom: 6,
  },

  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  monthIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF9E3",
    justifyContent: "center",
    alignItems: "center",
  },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    marginTop: -4,
    marginBottom: 18,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  calendarTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  calendarNavButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  calendarWeekRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  calendarWeekText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#8A8067",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarDay: {
    width: "14.285%",
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },

  activeCalendarDay: {
    backgroundColor: "#FFF0A8",
  },

  calendarDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  activeCalendarDayText: {
    color: "#4A432F",
  },

  calendarDotRow: {
    height: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },

  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C9B85C",
  },

  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#6D8A63",
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

  weekEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6D8A63",
    marginTop: 7,
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

  timeline: {
    gap: 14,
  },

  emptyAgendaCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
  },

  emptyAgendaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B2B2B",
    marginTop: 10,
  },

  emptyAgendaText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginTop: 5,
    textAlign: "center",
  },

  timelineRow: {
    flexDirection: "row",
  },

  timeColumn: {
    width: 58,
    alignItems: "flex-start",
  },

  timeText: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 18,
  },

  line: {
    width: 1,
    flex: 1,
    backgroundColor: "#E8DDC0",
    marginTop: 10,
    marginLeft: 18,
  },

  eventSwipeContainer: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFE8DC",
  },

  eventDeleteAction: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    paddingRight: 18,
  },

  eventDeleteText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A46B54",
  },

  eventSwipeCard: {
    backgroundColor: "#FFFFFF",
  },

  eventCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  eventContent: {
    flex: 1,
  },

  eventTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  eventType: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C9B85C",
    backgroundColor: "#FFF7CF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
  },

  eventNote: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginTop: 8,
  },

  eventMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: "#A9A08A",
    marginTop: 8,
  },
});
