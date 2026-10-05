import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { apiClient } from "../../src/api/client";
import { User, Mail, Lock, Eye, EyeOff, Building2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, appName, logoUrl } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [organizations, setOrganizations] = useState<{ _id: string; name: string }[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLoadingOrgs(true);
    apiClient
      .get("/auth/v1/organizations")
      .then((res) => {
        if (res.data?.data) {
          setOrganizations(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedOrgId(res.data.data[0]._id);
          }
        }
      })
      .catch((_) => {})
      .finally(() => setLoadingOrgs(false));
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "customer",
      organization_id: selectedOrgId || undefined,
    });

    setLoading(false);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setErrorMessage(result.message || "Registration failed. Please try again.");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg-aimodel.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: `${colors.primary}20`,
                  borderColor: `${colors.primary}40`,
                },
              ]}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
              ) : (
                <Image
                  source={require("../../assets/images/networking.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text style={styles.title}>{appName}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Join your organization's support workspace
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.glassCard,
              {
                backgroundColor: colors.cardGlass,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardHeading, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.cardSubheading, { color: colors.textMuted }]}>
              Get 24/7 AI-powered support and ticket resolution
            </Text>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color={colors.accentRose} style={{ marginRight: 6 }} />
                <Text style={[styles.errorText, { color: colors.accentRose }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textDim }]}>FULL NAME</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <User size={18} color={colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Sarah Johnson"
                  placeholderTextColor={colors.textDim}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textDim }]}>WORK EMAIL</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Mail size={18} color={colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="name@company.com"
                  placeholderTextColor={colors.textDim}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Organization Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textDim }]}>ORGANIZATION</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Building2 size={18} color={colors.textDim} style={styles.inputIcon} />
                <View style={styles.orgPickerContainer}>
                  {loadingOrgs ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : organizations.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orgChipsScroll}>
                      {organizations.map((org) => {
                        const isSelected = selectedOrgId === org._id;
                        return (
                          <TouchableOpacity
                            key={org._id}
                            onPress={() => setSelectedOrgId(org._id)}
                            style={[
                              styles.orgChip,
                              { backgroundColor: colors.surface, borderColor: colors.border },
                              isSelected && { backgroundColor: `${colors.primary}25`, borderColor: colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.orgChipText,
                                { color: colors.textMuted },
                                isSelected && { color: colors.primaryLight, fontWeight: "700" },
                              ]}
                            >
                              {org.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <Text style={[styles.noOrgsText, { color: colors.textDim }]}>Default Organization</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textDim }]}>PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Lock size={18} color={colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textDim} />
                  ) : (
                    <Eye size={18} color={colors.textDim} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textDim }]}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Lock size={18} color={colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.submitButtonText}>Create Account</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.securityBadge}>
              <ShieldCheck size={14} color={colors.accentEmerald} />
              <Text style={[styles.securityText, { color: colors.textDim }]}>
                End-to-End Enterprise Encryption
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>Already registered? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={[styles.footerLink, { color: colors.primaryLight }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8, 12, 20, 0.84)",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    elevation: 4,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSubheading: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 13,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  orgPickerContainer: {
    flex: 1,
    justifyContent: "center",
  },
  orgChipsScroll: {
    alignItems: "center",
    gap: 6,
  },
  orgChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  orgChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  noOrgsText: {
    fontSize: 12,
  },
  submitButton: {
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  securityText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "700",
  },
});
