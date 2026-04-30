import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenGradient } from "@/components/screen-gradient";
import { useAccount } from "@/contexts/account";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const luviaLogo = require("@/assets/images/luvia-logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const { accountExists, logIn: logInAccount } = useAccount();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const canLogIn = emailInput.trim().length > 0 && passwordInput.length > 0;

  const logIn = () => {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail || !passwordInput) {
      return;
    }

    if (!accountExists) {
      setErrorMessage("Create an account first.");
      return;
    }

    if (!logInAccount(trimmedEmail, passwordInput)) {
      setErrorMessage("Email or password is incorrect.");
      return;
    }

    setErrorMessage("");
    router.replace("/home");
  };

  return (
    <ScreenGradient>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Image
              source={luviaLogo}
              style={styles.logo}
              contentFit="contain"
              transition={200}
            />
            <Text style={styles.heroTitle}>Start your day with Luvia</Text>
            <Text style={styles.heroText}>A calm place for your plans, steps and water.</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="you@example.com"
              placeholderTextColor="#B8AD91"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={logIn}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={passwordInput}
              onChangeText={(value) => {
                setPasswordInput(value);
                setErrorMessage("");
              }}
              placeholder="Your password"
              placeholderTextColor="#B8AD91"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={logIn}
            />

            {errorMessage.length > 0 && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, !canLogIn && styles.disabledButton]}
              disabled={!canLogIn}
              onPress={logIn}
            >
              <Ionicons name="log-in-outline" size={18} color="#4A432F" />
              <Text style={styles.primaryButtonText}>Log in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/create-account")}
            >
              <Ionicons name="person-add-outline" size={18} color="#C9B85C" />
              <Text style={styles.secondaryButtonText}>Create account</Text>
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
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 48,
  },

  logo: {
    width: 170,
    height: 170,
    alignSelf: "center",
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2B2B2B",
    textAlign: "center",
  },

  heroText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8067",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },

  formCard: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 18,
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

  errorText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A46B54",
    marginBottom: 14,
    textAlign: "center",
  },

  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3DF7D",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  disabledButton: {
    opacity: 0.45,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A432F",
  },

  secondaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF7CF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8D7A3A",
  },
});
