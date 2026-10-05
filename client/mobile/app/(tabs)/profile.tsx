import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  Building2,
  Mail,
  Shield,
  Bell,
  Sparkles,
  LogOut,
  SunMoon,
  Palette,
  CheckCircle2,
  Bot,
  Layers,
  Phone,
  MapPin,
} from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    colors,
    isDark,
    toggleTheme,
    appName,
    orgName,
    orgDetails,
    brandColors,
    chatbotName,
    greetingMessage,
    loaderConfig,
  } = useTheme();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [aiAutoDeflect, setAiAutoDeflect] = useState(true);

  const handleLogout = () => {
    Alert.alert("Sign Out", `Are you sure you want to log out of ${orgName || appName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const roleFormatted = (user?.role || user?.role_id?.role_name || "customer")
    .replace(/_/g, " ")
    .toUpperCase();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Workspace & Identity</Text>
        </View>

        {/* User Profile Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "US"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "Support User"}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || "user@supportai.com"}</Text>
            <View style={[styles.roleBadge, { backgroundColor: `${colors.accentEmerald}20`, borderColor: `${colors.accentEmerald}40` }]}>
              <Shield size={10} color={colors.accentEmerald} />
              <Text style={[styles.roleText, { color: colors.accentEmerald }]}>{roleFormatted}</Text>
            </View>
          </View>
        </View>

        {/* Organization Visual Identity & Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Branding & Visual Identity</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Primary, Secondary, Accent Swatches */}
            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.primary}20` }]}>
                <Palette size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Database Palette</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                  P: {brandColors.primary} • S: {brandColors.secondary} • A: {brandColors.accent}
                </Text>
              </View>
              <View style={styles.swatchRow}>
                <View style={[styles.colorDot, { backgroundColor: brandColors.primary, borderColor: colors.borderHighlight }]} />
                <View style={[styles.colorDot, { backgroundColor: brandColors.secondary, borderColor: colors.borderHighlight }]} />
                <View style={[styles.colorDot, { backgroundColor: brandColors.accent, borderColor: colors.borderHighlight }]} />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Dark Mode Switch */}
            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.secondary}20` }]}>
                <SunMoon size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                  {isDark ? "Midnight Dark active" : "Daylight Clean active"}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Organization Context */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Organization Profile</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.primary}20` }]}>
                <Building2 size={18} color={colors.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Active Organization</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>{orgName}</Text>
              </View>
              <View style={[styles.planBadge, { backgroundColor: `${colors.primary}25`, borderColor: colors.primary }]}>
                <Text style={[styles.planBadgeText, { color: colors.primaryLight }]}>
                  {(orgDetails?.plan || "STARTER").toUpperCase()}
                </Text>
              </View>
            </View>

            {orgDetails?.phone ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.menuItem}>
                  <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.secondary}20` }]}>
                    <Phone size={16} color={colors.secondaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Support Helpline</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>{orgDetails.phone}</Text>
                  </View>
                </View>
              </>
            ) : null}

            {orgDetails?.address ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.menuItem}>
                  <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.accentEmerald}20` }]}>
                    <MapPin size={16} color={colors.accentEmerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Headquarters</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>{orgDetails.address}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* AI Copilot & Automation Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>AI Assistant & Automation</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.primary}20` }]}>
                <Bot size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Chatbot Identity</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>{chatbotName} (Hybrid RAG)</Text>
              </View>
              <CheckCircle2 size={16} color={colors.accentEmerald} />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.secondary}20` }]}>
                <Layers size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Opening Studio Quote</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]} numberOfLines={1}>
                  "{loaderConfig.subtitle || "Build fast, ship faster"}"
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.accentEmerald}20` }]}>
                <Sparkles size={18} color={colors.accentEmerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>AI Copilot Auto-Deflect</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>Instant ticket resolution</Text>
              </View>
              <Switch
                value={aiAutoDeflect}
                onValueChange={setAiAutoDeflect}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: `${colors.accentRose}15`, borderColor: `${colors.accentRose}35` }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={colors.accentRose} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: colors.accentRose }]}>Sign Out of {orgName || appName}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 22,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "800",
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 6,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  planBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 50,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
