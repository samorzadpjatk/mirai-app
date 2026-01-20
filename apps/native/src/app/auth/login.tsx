import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useLoginForm } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Logo from "../../components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

export default function LoginScreen() {
  const { formState, setEmail, setPassword, handleSubmit } = useLoginForm();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();

  const onSubmit = async () => {
    await handleSubmit(() => {
      router.replace("/");
    });
  };

  const { email, password, isLoading, error } = formState;

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header Spacer */}
        <View style={[styles.headerSpacer, { paddingTop: insets.top + 24 }]} />

        {/* Logo & Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Logo size={96} />
          </View>
          <Text style={styles.title}>
            Welcome back
          </Text>
          <Text style={styles.subtitle}>
            Unlock your next adventure with PJapp
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Inputs Card */}
          <View style={styles.inputsCard}>
            {/* Email Input */}
            <View style={[styles.inputSection, styles.inputSectionBorder]}>
              <Text style={styles.inputLabel}>
                Student Email or ID
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconOpacity}>
                  <Ionicons name="at" size={20} color="#00ced1" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="s12345@pjwstk.edu.pl"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Password
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconOpacity}>
                  <Ionicons name="lock-closed" size={20} color="#00ced1" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#4b5563"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
                <Ionicons name="eye" size={20} color="#9ca3af" />
              </View>
            </View>
          </View>

          {/* Forgot Password */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#17181c" />
                <Text style={styles.loginButtonText}>
                  Logging In...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  Log In
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#17181c" />
              </>
            )}
          </TouchableOpacity>


        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}> 
          {/* Sign Up Link */}
          <Text style={styles.signupText}>
            Don't have an account?{" "}
            <Text
              style={styles.signupLink}
              onPress={() => router.push("/auth/signup")}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  headerSpacer: {
    padding: 24,
    paddingBottom: 8,
  },
  logoContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoWrapper: {
    marginBottom: 24,
  },
  title: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: "rgba(127, 29, 29, 0.3)",
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    flex: 1,
  },
  inputsCard: {
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 24,
  },
  inputSection: {
    padding: 16,
  },
  inputSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  inputLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(23, 24, 28, 0.5)",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#395556",
  },
  iconOpacity: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    color: "white",
    fontWeight: "500",
  },
  forgotPasswordContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: "rgba(0, 206, 209, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#00ced1",
    borderRadius: 12,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  loginButtonText: {
    color: "#17181c",
    fontWeight: "bold",
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 32,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  footer: {
    marginTop: "auto",
    padding: 24,
  },
  signupText: {
    textAlign: "center",
    color: "#4b5563",
    fontSize: 14,
  },
  signupLink: {
    color: "white",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
