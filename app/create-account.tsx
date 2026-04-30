import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CreateAccountScreen() {
  const router = useRouter();
  const {
    name,
    setName,
    email,
    setEmail,
    birthDate,
    setBirthDate,
    password,
    setPassword,
    activateAccount,
  } = useAccount();
  const canContinue =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 4;

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
            <Text style={styles.headerTitle}>Create account</Text>
            <View style={styles.circleSpacer} />
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="person-add-outline" size={28} color="#C9B85C" />
            </View>
            <Text style={styles.heroTitle}>Set up your Luvia profile</Text>
            <Text style={styles.heroText}>
              Save your details locally so your profile can feel personal.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Danny Landvreugd"
              placeholderTextColor="#B8AD91"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#B8AD91"
              autoCapitalize="none"
              keyboardType="email-address"
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

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 4 characters"
              placeholderTextColor="#B8AD91"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryButton, !canContinue && styles.disabledButton]}
              disabled={!canContinue}
              onPress={() => {
                activateAccount();
                router.replace("/home");
              }}
            >
              <Text style={styles.primaryButtonText}>Create account</Text>
              <Ionicons name="arrow-forward" size={18} color="#4A432F" />
            </TouchableOpacity>
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

  circleSpacer: {
    width: 38,
    height: 38,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  heroCard: {
    borderRadius: 24,
    backgroundColor: "#FFF3BE",
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
  },

  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFBEA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2B2B",
    textAlign: "center",
  },

  heroText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginTop: 8,
    textAlign: "center",
  },

  formCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 16,
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

  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3DF7D",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.45,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A432F",
  },
});
