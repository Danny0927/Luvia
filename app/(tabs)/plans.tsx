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

type AgendaItem = {
  time: string;
  title: string;
  note: string;
  type: string;
  icon: IconName;
  color: string;
  background: string;
};

const agendaItems: AgendaItem[] = [
  {
    time: "09:00",
    title: "Morning planning",
    note: "Priorities, calendar check, and focus block",
    type: "Focus",
    icon: "sunny-outline",
    color: "#C9B85C",
    background: "#FFF7CF",
  },
  {
    time: "11:30",
    title: "Content session",
    note: "Create drafts and schedule posts",
    type: "Work",
    icon: "create-outline",
    color: "#8D7A3A",
    background: "#FFF2BE",
  },
  {
    time: "15:00",
    title: "Walk and reset",
    note: "Light movement before the afternoon tasks",
    type: "Health",
    icon: "leaf-outline",
    color: "#6D8A63",
    background: "#E8F0DD",
  },
];

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

  return (
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
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="search-outline" size={20} color="#C9B85C" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="add" size={22} color="#C9B85C" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.monthCard}>
          <View>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Text style={styles.monthTitle}>Balanced week ahead</Text>
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
                        {isToday && <View style={styles.todayDot} />}
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
            <Text style={styles.summaryNumber}>2h 45m</Text>
            <Text style={styles.summaryLabel}>Planned</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>1</Text>
            <Text style={styles.summaryLabel}>Free block</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedDayLabel}</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={18} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <View style={styles.timeline}>
          {agendaItems.map((item, index) => (
            <View key={item.time} style={styles.timelineRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{item.time}</Text>
                {index !== agendaItems.length - 1 && <View style={styles.line} />}
              </View>

              <TouchableOpacity style={styles.eventCard}>
                <View
                  style={[
                    styles.eventIcon,
                    { backgroundColor: item.background },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color}
                  />
                </View>

                <View style={styles.eventContent}>
                  <View style={styles.eventTitleRow}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventType}>{item.type}</Text>
                  </View>
                  <Text style={styles.eventNote}>{item.note}</Text>
                </View>
              </TouchableOpacity>
            </View>
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

  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C9B85C",
    marginTop: 3,
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

  timeline: {
    gap: 14,
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
});
