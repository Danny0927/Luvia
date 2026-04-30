import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { useDailyProgress } from "@/contexts/daily-progress";
import { useGoals } from "@/contexts/goals";
import { useThemePreference } from "@/contexts/theme-preference";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

type ProfileSection =
  | "settings"
  | "details"
  | "goals"
  | "notifications"
  | "theme";

type StoredTask = {
  done: boolean;
};

type StoredTasksByDate = Record<string, StoredTask[]>;

const TASKS_STORAGE_KEY = "luvia:tasks";

const profileOptions: {
  key: ProfileSection;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "details", title: "Personal details", icon: "person-outline" },
  { key: "goals", title: "Goals", icon: "flag-outline" },
  { key: "notifications", title: "Notifications", icon: "notifications-outline" },
  { key: "theme", title: "Theme", icon: "color-palette-outline" },
];

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

const getAge = (birthDate: string) => {
  const date = parseBirthDate(birthDate);

  if (!date) {
    return null;
  }

  const today = new Date();

  if (date > today) {
    return null;
  }

  let age = today.getFullYear() - date.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (today < birthdayThisYear) {
    age -= 1;
  }

  return age;
};

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const formatCompactNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return value.toString();
};

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    name,
    setName,
    email,
    birthDate,
    setBirthDate,
    logOut,
  } = useAccount();
  const {
    taskGoal,
    setTaskGoal,
    stepGoal,
    setStepGoal,
    waterGoal,
    setWaterGoal,
  } = useGoals();
  const { steps, waterGlasses } = useDailyProgress();
  const { theme, setTheme } = useThemePreference();
  const [activeSection, setActiveSection] = useState<ProfileSection | null>(null);
  const [todayTasks, setTodayTasks] = useState<StoredTask[]>([]);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const age = getAge(birthDate);
  const todayTaskCount = todayTasks.length;
  const profileStats = [
    { label: "Tasks", value: todayTaskCount.toString() },
    { label: "Steps", value: formatCompactNumber(steps) },
    { label: "Water", value: `${waterGlasses}/${waterGoal}` },
  ];

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);

        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks) as StoredTasksByDate;
          setTodayTasks(parsedTasks[getDateKey(new Date())] ?? []);
        }
      } catch {
        setTodayTasks([]);
      }
    };

    void loadTasks();
  }, []);

  const openSection = (section: ProfileSection) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSection((current) => (current === section ? null : section));
  };

  const handleLogOut = () => {
    logOut();
    router.replace("/login");
  };

  const renderSectionPanel = (section: ProfileSection) => {
    if (section === "settings") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Profile settings</Text>
          <SettingSwitch
            title="Haptic feedback"
            detail="Small taps when actions are completed."
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
          <SettingSwitch
            title="Compact cards"
            detail="Show tighter cards across your dashboard."
            value={compactMode}
            onValueChange={setCompactMode}
          />
        </View>
      );
    }

    if (section === "details") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Personal details</Text>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#B8AD91"
          />
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            placeholder="you@example.com"
            placeholderTextColor="#B8AD91"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={false}
          />
          <Text style={styles.inputLabel}>Date of birth</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD-MM-YYYY"
            placeholderTextColor="#B8AD91"
            keyboardType="numbers-and-punctuation"
          />
          <View style={styles.ageCard}>
            <View style={styles.ageIcon}>
              <Ionicons name="calendar-outline" size={18} color="#C9B85C" />
            </View>
            <View style={styles.ageCopy}>
              <Text style={styles.ageTitle}>Age</Text>
              <Text style={styles.ageValue}>
                {age === null ? "Add a valid date of birth" : `${age}`}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (section === "goals") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Goals</Text>
          <GoalRow
            title="Daily tasks"
            value={taskGoal}
            suffix="tasks"
            onDecrease={() => setTaskGoal((current) => Math.max(current - 1, 1))}
            onIncrease={() => setTaskGoal((current) => Math.min(current + 1, 12))}
          />
          <GoalRow
            title="Daily steps"
            value={stepGoal}
            suffix="steps"
            onDecrease={() =>
              setStepGoal((current) => Math.max(current - 500, 1000))
            }
            onIncrease={() =>
              setStepGoal((current) => Math.min(current + 500, 30000))
            }
          />
          <GoalRow
            title="Water"
            value={waterGoal}
            suffix="glasses"
            onDecrease={() => setWaterGoal((current) => Math.max(current - 1, 1))}
            onIncrease={() => setWaterGoal((current) => Math.min(current + 1, 16))}
          />
        </View>
      );
    }

    if (section === "notifications") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Notifications</Text>
          <SettingSwitch
            title="Daily planning"
            detail="Reminder to review your day."
            value={dailyReminders}
            onValueChange={setDailyReminders}
          />
          <SettingSwitch
            title="Water reminders"
            detail="Gentle hydration reminders."
            value={waterReminders}
            onValueChange={setWaterReminders}
          />
          <SettingSwitch
            title="Weekly summary"
            detail="Progress overview at the end of the week."
            value={weeklySummary}
            onValueChange={setWeeklySummary}
          />
        </View>
      );
    }

    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Theme</Text>
        <View style={styles.themeRow}>
          {(["Standard", "Soft", "Minimal"] as const).map((item) => {
            const active = theme === item;

            return (
              <TouchableOpacity
                key={item}
                style={[styles.themeButton, active && styles.activeThemeButton]}
                onPress={() => setTheme(item)}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    active && styles.activeThemeButtonText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.themePreview}>
          <View style={styles.themePreviewIcon}>
            <Ionicons name="sparkles-outline" size={20} color="#C9B85C" />
          </View>
          <View>
            <Text style={styles.themePreviewTitle}>{theme} theme</Text>
            <Text style={styles.themePreviewText}>
              Your selected Luvia look.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenGradient>
      <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#C9B85C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={[
              styles.circleBtn,
              activeSection === "settings" && styles.activeCircleBtn,
            ]}
            onPress={() => openSection("settings")}
          >
            <Ionicons name="settings-outline" size={20} color="#C9B85C" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={42} color="#C9B85C" />
          </View>
          <Text style={styles.name}>
            {name.trim().length === 0
              ? "Your profile"
              : age === null
                ? name
                : `${name}, ${age}`}
          </Text>
          <Text style={styles.subtitle}>Daily planning, movement and hydration</Text>
        </View>

        <View style={styles.statsRow}>
          {profileStats.map((item, index) => (
            <View key={item.label} style={styles.statItem}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
              {index !== profileStats.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {activeSection === "settings" && renderSectionPanel("settings")}

        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.optionList}>
          {profileOptions.map((item) => {
            const active = activeSection === item.key;

            return (
              <View key={item.title} style={styles.optionGroup}>
                <TouchableOpacity
                  style={[styles.optionCard, active && styles.activeOptionCard]}
                  onPress={() => openSection(item.key)}
                >
                  <View style={[styles.optionIcon, active && styles.activeOptionIcon]}>
                    <Ionicons name={item.icon} size={20} color="#C9B85C" />
                  </View>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  <Ionicons
                    name={active ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#C7B98F"
                  />
                </TouchableOpacity>
                {active && renderSectionPanel(item.key)}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
          <Ionicons name="log-out-outline" size={18} color="#A46B54" />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </ScreenGradient>
  );
}

function GoalRow({
  title,
  value,
  suffix,
  onDecrease,
  onIncrease,
}: {
  title: string;
  value: number;
  suffix: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.goalRow}>
      <View>
        <Text style={styles.goalTitle}>{title}</Text>
        <Text style={styles.goalValue}>
          {value.toLocaleString()} {suffix}
        </Text>
      </View>
      <View style={styles.goalControls}>
        <TouchableOpacity style={styles.goalButton} onPress={onDecrease}>
          <Ionicons name="remove" size={18} color="#C9B85C" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.goalButton} onPress={onIncrease}>
          <Ionicons name="add" size={18} color="#C9B85C" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SettingSwitch({
  title,
  detail,
  value,
  onValueChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDetail}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#EFE6CB", true: "#FFF0A8" }}
        thumbColor={value ? "#C9B85C" : "#FFFFFF"}
      />
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
    paddingBottom: 40,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
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

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  profileCard: {
    borderRadius: 24,
    backgroundColor: "#FFF3BE",
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#FFFBEA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  subtitle: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 6,
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 18,
    marginBottom: 18,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  statLabel: {
    fontSize: 12,
    color: "#8A8067",
    marginTop: 5,
  },

  divider: {
    position: "absolute",
    right: 0,
    top: 5,
    width: 1,
    height: 34,
    backgroundColor: "#EFE6CB",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2B2B",
    marginTop: 10,
    marginBottom: 16,
  },

  optionList: {
    gap: 14,
  },

  optionGroup: {
    gap: 8,
  },

  optionCard: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  activeOptionCard: {
    backgroundColor: "#FFF3BE",
  },

  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  activeOptionIcon: {
    backgroundColor: "#FFF0A8",
  },

  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2B2B2B",
  },

  panel: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 10,
  },

  panelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2B2B2B",
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A8067",
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#FFFBEA",
    color: "#2B2B2B",
    fontSize: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  disabledInput: {
    backgroundColor: "#F1EEE6",
    color: "#A9A08A",
  },

  ageCard: {
    minHeight: 66,
    borderRadius: 20,
    backgroundColor: "#FFFBEA",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  ageIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  ageCopy: {
    flex: 1,
  },

  ageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2B2B2B",
    marginBottom: 4,
  },

  ageValue: {
    fontSize: 13,
    color: "#8A8067",
  },

  goalRow: {
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: "#FFFBEA",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  goalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2B2B2B",
    marginBottom: 4,
  },

  goalValue: {
    fontSize: 13,
    color: "#8A8067",
  },

  goalControls: {
    flexDirection: "row",
    gap: 8,
  },

  goalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
  },

  switchRow: {
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: "#FFFBEA",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  switchCopy: {
    flex: 1,
    paddingRight: 12,
  },

  switchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2B2B2B",
    marginBottom: 4,
  },

  switchDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: "#8A8067",
  },

  logoutButton: {
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: "#FFE8DC",
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },

  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#A46B54",
  },

  themeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  themeButton: {
    flex: 1,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#FFFBEA",
    justifyContent: "center",
    alignItems: "center",
  },

  activeThemeButton: {
    backgroundColor: "#FFF0A8",
  },

  themeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A8067",
  },

  activeThemeButtonText: {
    color: "#4A432F",
  },

  themePreview: {
    borderRadius: 20,
    backgroundColor: "#FFFBEA",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  themePreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7CF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  themePreviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  themePreviewText: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 4,
  },
});
