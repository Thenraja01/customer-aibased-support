import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { apiClient } from "../../src/api/client";
import {
  Search,
  Bot,
  Sparkles,
  Ticket,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react-native";

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, appName, logoUrl } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get("/tickets?limit=5");
      if (res.data?.data) {
        const tickets = Array.isArray(res.data.data) ? res.data.data : res.data.data.tickets || [];
        setActiveTickets(tickets);
        const open = tickets.filter((t: any) => t.status === "open" || t.status === "pending").length;
        const inProg = tickets.filter((t: any) => t.status === "in_progress").length;
        const resolved = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
        setStats({
          activeTickets: open + inProg,
          openTickets: open,
          inProgressTickets: inProg,
          resolvedTickets: resolved,
        });
      }
    } catch (_) {
      setActiveTickets([]);
      setStats({ activeTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          text: colors.accentEmerald,
          label: "Resolved",
          icon: CheckCircle2,
        };
      case "in_progress":
        return {
          bg: `${colors.secondary}25`,
          text: colors.secondaryLight,
          label: "In Progress",
          icon: Clock,
        };
      case "pending":
      default:
        return {
          bg: `${colors.accentAmber}25`,
          text: colors.accentAmber,
          label: "Open / Pending",
          icon: AlertCircle,
        };
    }
  };

  const orgName = typeof user?.organization_id === "object" ? user?.organization_id?.name : appName;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Top App Header */}
        <View style={styles.topHeader}>
          <View style={styles.userInfoWrapper}>
            <View style={[styles.avatarBadge, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>{user?.name?.charAt(0) || "U"}</Text>
              )}
            </View>
            <View>
              <Text style={[styles.greetingSub, { color: colors.textDim }]}>{orgName || "Enterprise Workspace"}</Text>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "Support User"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.securityPill, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <ShieldCheck size={14} color={colors.accentEmerald} />
            <Text style={[styles.securityPillText, { color: colors.textMuted }]}>Verified</Text>
          </TouchableOpacity>
        </View>

        {/* Global Knowledge Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Ask AI Copilot or search knowledge…"
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => router.push("/(tabs)/chat")}
          />
        </View>

        {/* Hero AI Copilot Card */}
        <TouchableOpacity
          style={[styles.heroAiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/chat")}
          activeOpacity={0.9}
        >
          <View style={styles.heroAiHeader}>
            <View style={[styles.heroAiIconWrapper, { backgroundColor: colors.primary }]}>
              <Bot size={22} color="#ffffff" />
            </View>
            <View style={[styles.heroAiBadge, { backgroundColor: `${colors.accentEmerald}20`, borderColor: `${colors.accentEmerald}40` }]}>
              <Sparkles size={12} color={colors.accentEmerald} />
              <Text style={[styles.heroAiBadgeText, { color: colors.accentEmerald }]}>24/7 Grounded AI</Text>
            </View>
          </View>

          <Text style={[styles.heroAiTitle, { color: colors.text }]}>Ask SupportAI Assistant</Text>
          <Text style={[styles.heroAiSubtitle, { color: colors.textMuted }]}>
            Get instant answers verified against approved enterprise documentation, SLAs, and technical guidelines.
          </Text>

          <View style={[styles.heroAiFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.heroAiFooterText, { color: colors.primaryLight }]}>Launch Live Chat Copilot</Text>
            <ArrowRight size={16} color={colors.primaryLight} />
          </View>
        </TouchableOpacity>

        {/* Live Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: `${colors.accent}30` }]}>
            <View style={[styles.metricIconBg, { backgroundColor: `${colors.accent}20` }]}>
              <Ticket size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: colors.text }]}>{stats.activeTickets}</Text>
              <Text style={[styles.metricLabel, { color: colors.accent }]}>Open Tickets</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: `${colors.secondary}30` }]}>
            <View style={[styles.metricIconBg, { backgroundColor: `${colors.secondary}20` }]}>
              <Zap size={18} color={colors.secondary} />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: colors.text }]}>{stats.inProgressTickets}</Text>
              <Text style={[styles.metricLabel, { color: colors.secondaryLight }]}>In Progress</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: `${colors.accentEmerald}30` }]}>
            <View style={[styles.metricIconBg, { backgroundColor: `${colors.accentEmerald}20` }]}>
              <TrendingUp size={18} color={colors.accentEmerald} />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: colors.text }]}>{stats.resolvedTickets}</Text>
              <Text style={[styles.metricLabel, { color: colors.accentEmerald }]}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Tiles */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionTile, { backgroundColor: colors.card, borderColor: `${colors.primary}35` }]}
            onPress={() => router.push("/(tabs)/chat")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.primary}20` }]}>
              <Bot size={22} color={colors.primary} />
            </View>
            <Text style={[styles.actionTileTitle, { color: colors.text }]}>Ask AI Copilot</Text>
            <Text style={[styles.actionTileDesc, { color: colors.primaryLight }]}>Instant answers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionTile, { backgroundColor: colors.card, borderColor: `${colors.secondary}35` }]}
            onPress={() => router.push("/(tabs)/tickets")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.secondary}20` }]}>
              <Ticket size={22} color={colors.secondary} />
            </View>
            <Text style={[styles.actionTileTitle, { color: colors.text }]}>New Ticket</Text>
            <Text style={[styles.actionTileDesc, { color: colors.secondaryLight }]}>Report issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionTile, { backgroundColor: colors.card, borderColor: `${colors.accent}35` }]}
            onPress={() => router.push("/(tabs)/faq")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.accent}20` }]}>
              <BookOpen size={22} color={colors.accent} />
            </View>
            <Text style={[styles.actionTileTitle, { color: colors.text }]}>Knowledge</Text>
            <Text style={[styles.actionTileDesc, { color: colors.accent }]}>Articles & FAQ</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Tickets Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Support Tickets</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/tickets")}>
            <Text style={[styles.seeAllText, { color: colors.primaryLight }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {activeTickets.length === 0 ? (
          <View style={[styles.emptyTicketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CheckCircle2 size={36} color={colors.accentEmerald} />
            <Text style={[styles.emptyTicketTitle, { color: colors.text }]}>No Active Incidents</Text>
            <Text style={[styles.emptyTicketSub, { color: colors.textMuted }]}>
              You currently have no open tickets. Tap "New Ticket" to report any issue.
            </Text>
          </View>
        ) : (
          activeTickets.slice(0, 3).map((ticket) => {
            const badge = getStatusBadge(ticket.status);
            const StatusIcon = badge.icon;
            return (
              <TouchableOpacity
                key={ticket._id}
                style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/ticket/${ticket._id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.ticketCardHeader}>
                  <Text style={[styles.ticketNumber, { color: colors.primaryLight }]}>{ticket.ticket_number || `#${ticket._id?.substring(0, 8)}`}</Text>
                  <View style={[styles.statusChip, { backgroundColor: badge.bg }]}>
                    <StatusIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>
                <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
                  {ticket.title}
                </Text>
                <View style={[styles.ticketCardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.ticketPriority, { color: colors.textDim }]}>
                    Priority: <Text style={{ color: colors.text, fontWeight: "700" }}>{ticket.priority || "Normal"}</Text>
                  </Text>
                  <ArrowRight size={14} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  userInfoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "800",
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  securityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  securityPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  heroAiCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  heroAiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heroAiIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  heroAiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroAiBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroAiTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroAiSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  heroAiFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  heroAiFooterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionTile: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionTileTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionTileDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyTicketCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTicketTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyTicketSub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  ticketCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  ticketCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  ticketCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  ticketPriority: {
    fontSize: 12,
  },
});
