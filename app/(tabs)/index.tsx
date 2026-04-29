import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const today = new Date();

  // 🔥 WEEK GENEREREN
  const getWeek = () => {
    const start = new Date(today);
    const day = start.getDay();

    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const week = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      week.push({
        date: d.getDate(),
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        full: d,
      });
    }

    return week;
  };

  const days = getWeek();

  // 🔥 geselecteerde dag (vandaag)
  const [selectedDay, setSelectedDay] = useState(
    days.findIndex(
      (d) =>
        d.full.getDate() === today.getDate() &&
        d.full.getMonth() === today.getMonth()
    )
  );

  // 🔥 HEADER LOGIC (Today vs Monday etc.)
  const selectedDate = days[selectedDay]?.full;

  const isToday =
    selectedDate &&
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  const headerLabel = isToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

  // 🔥 taken
  const [tasks, setTasks] = useState([
    { text: "stretch & roll out", done: false },
    { text: "podcast walk", done: false },
    { text: "plan my day", done: false },
    { text: "get content", done: false },
    { text: "schedule posts", done: false },
  ]);

  const toggleTask = (index: number) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.topRow}>
          <Text style={styles.today}>{headerLabel}</Text>

          <View style={styles.topButtons}>
            <View style={styles.circleBtn} />
            <View style={styles.circleBtn} />
          </View>
        </View>

        {/* CALENDAR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {days.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                selectedDay === index && styles.activeDay,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={styles.dayText}>{item.day}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* EVENTS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events</Text>
          <TouchableOpacity style={styles.addCircle}>
            <Text style={styles.plus}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyLine} />

        {/* TODO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>To Do List</Text>
          <TouchableOpacity style={styles.addCircle}>
            <Text style={styles.plus}>+</Text>
          </TouchableOpacity>
        </View>

        {tasks.map((task, index) => (
          <TouchableOpacity
            key={index}
            style={styles.taskRow}
            onPress={() => toggleTask(index)}
          >
            <View
              style={[
                styles.checkbox,
                task.done && styles.checkboxActive,
              ]}
            />

            <Text
              style={[
                styles.taskText,
                task.done && styles.taskDone,
              ]}
            >
              {task.text}
            </Text>

            <View style={styles.arrow} />
          </TouchableOpacity>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffbeb",
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  today: {
    fontSize: 26,
    fontWeight: "500",
    color: "#2B2B2B",
  },

  topButtons: {
    flexDirection: "row",
    gap: 10,
  },

  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF6C1",
  },

  dayCard: {
    alignItems: "center",
    padding: 12,
    marginRight: 10,
    borderRadius: 18,
  },

  activeDay: {
    backgroundColor: "#EDE0C5",
    paddingHorizontal: 16,
  },

  dayText: {
    fontSize: 12,
    color: "#888",
  },

  dateText: {
    fontSize: 16,
    color: "#333",
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#2B2B2B",
  },

  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF6C1",
    justifyContent: "center",
    alignItems: "center",
  },

  plus: {
    fontSize: 18,
    color: "#BFA24A",
  },

  emptyLine: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 15,
  },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    marginRight: 12,
  },

  checkboxActive: {
    backgroundColor: "#FFF6C1",
    borderColor: "#FFF6C1",
  },

  taskText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  taskDone: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },

  arrow: {
    width: 6,
    height: 6,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#ccc",
    transform: [{ rotate: "-45deg" }],
  },
});

