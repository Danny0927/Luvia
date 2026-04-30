import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const luviaLogo = require("@/assets/images/luvia-logo.png");

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
    resetAccountDraft,
    activateAccount,
  } = useAccount();
  const [errorMessage, setErrorMessage] = useState("");
  const canContinue =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 4;

  useEffect(() => {
    resetAccountDraft();
  }, []);

  const createAccount = () => {
    if (!activateAccount()) {
      setErrorMessage("An account with this email already exists.");
      return;
    }

    setErrorMessage("");
    router.replace("/home");
  };

  return (
    <ScreenGradient>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={24}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
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
            <View style={styles.logoTile}>
              <Image
                source={luviaLogo}
                style={styles.heroLogo}
                contentFit="contain"
                transition={200}
              />
            </View>
            <Text style={styles.heroTitle}>Create your Luvia profile</Text>
            <Text style={styles.heroText}>
              Save your details locally and make Luvia feel like your own.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Account details</Text>
              <Text style={styles.formSubtitle}>Stored locally on your device.</Text>
            </View>
            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#B8AD91"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrorMessage("");
              }}
              placeholder="Email address"
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
              placeholder="Create a password"
              placeholderTextColor="#B8AD91"
              secureTextEntry
            />

            {errorMessage.length > 0 && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, !canContinue && styles.disabledButton]}
              disabled={!canContinue}
              onPress={createAccount}
            >
              <Text style={styles.primaryButtonText}>Start Luvia</Text>
              <Ionicons name="arrow-forward" size={18} color="#4A432F" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingTop: 64,
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
    backgroundColor: "#FFF3BE",
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
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    alignItems: "center",
    marginBottom: 16,
  },

  logoTile: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: "#FFFBEA",
    borderWidth: 1,
    borderColor: "#EFE6CB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  heroLogo: {
    width: 90,
    height: 90,
  },

  heroTitle: {
    fontSize: 27,
    fontWeight: "700",
    color: "#2B2B2B",
    textAlign: "center",
  },

  heroText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#8A8067",
    marginTop: 10,
    textAlign: "center",
  },

  formCard: {
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3EAD2",
  },

  formHeader: {
    marginBottom: 18,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2B2B",
  },

  formSubtitle: {
    fontSize: 13,
    color: "#8A8067",
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A8067",
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#FFFDF5",
    borderWidth: 1,
    borderColor: "#EFE6CB",
    color: "#2B2B2B",
    fontSize: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A46B54",
    marginBottom: 14,
    textAlign: "center",
  },

  primaryButton: {
    height: 54,
    borderRadius: 26,
    backgroundColor: "#F3DF7D",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
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
