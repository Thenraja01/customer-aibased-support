import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { apiClient } from "../../src/api/client";
import { useTheme } from "../../src/context/ThemeContext";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  X,
  ArrowRight,
} from "lucide-react-native";

interface TicketItem {
  _id: string;
  ticket_number?: string;
  title: string;
  description?: string;
  status: "open" | "pending" | "in_progress" | "resolved" | "closed" | string;
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  updated_at?: string;
}

export default function TicketsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiClient.get("/tickets");
      if (res.data?.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.tickets || [];
        setTickets(list);
      } else {
        setTickets([]);
      }
    } catch (_) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      setCreateError("Please provide both a title and description.");
      return;
    }

    setIsSubmitting(true);
    setCreateError("");

    try {
      const res = await apiClient.post("/tickets", {
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
      });

      if (res.data?.success || res.status === 200 || res.status === 201) {
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDesc("");
        fetchTickets();
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create ticket. Please verify your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return {
          bg: `${colors.accentEmerald}20`,
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
      case "open":
      default:
        return {
          bg: `${colors.accent}25`,
          text: colors.accent,
          label: "Open",
          icon: AlertCircle,
        };
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ticket_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && (t.status === "open" || t.status === "pending")) ||
      (statusFilter === "in_progress" && t.status === "in_progress") ||
      (statusFilter === "resolved" && (t.status === "resolved" || t.status === "closed"));

    return matchesSearch && matchesStatus;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Support Tickets</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Manage and track your reported issues
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsCreateOpen(true)}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tickets by ID or title…"
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { id: "all", label: "All", color: colors.primary },
            { id: "open", label: "Open", color: colors.accent },
            { id: "in_progress", label: "In Progress", color: colors.secondary },
            { id: "resolved", label: "Resolved", color: colors.accentEmerald },
          ].map((f) => {
            const active = statusFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && { backgroundColor: `${f.color}25`, borderColor: f.color },
                ]}
                onPress={() => setStatusFilter(f.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textMuted },
                    active && { color: f.color, fontWeight: "800" },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tickets FlatList */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ticket size={48} color={colors.textDim} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Tickets Found</Text>
                <Text style={[styles.emptyStateSub, { color: colors.textMuted }]}>
                  {searchQuery || statusFilter !== "all"
                    ? "No tickets match your filter criteria."
                    : "You haven't submitted any support tickets yet."}
                </Text>
                <TouchableOpacity
                  style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setIsCreateOpen(true)}
                >
                  <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyCreateBtnText}>Create Ticket</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => {
              const badge = getStatusBadge(item.status);
              const StatusIcon = badge.icon;
              return (
                <TouchableOpacity
                  style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/ticket/${item._id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.ticketNumber, { color: colors.primaryLight }]}>
                      {item.ticket_number || `#${item._id.substring(0, 8)}`}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <StatusIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>

                  {item.description ? (
                    <Text style={[styles.ticketDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <Text style={[styles.priorityText, { color: colors.textDim }]}>
                      Priority:{" "}
                      <Text style={{ color: colors.text, fontWeight: "700", textTransform: "capitalize" }}>
                        {item.priority || "normal"}
                      </Text>
                    </Text>
                    <View style={styles.viewLink}>
                      <Text style={[styles.viewLinkText, { color: colors.primaryLight }]}>View Details</Text>
                      <ArrowRight size={14} color={colors.primaryLight} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Create Ticket Modal */}
        <Modal
          visible={isCreateOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCreateOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Submit New Ticket</Text>
                <TouchableOpacity onPress={() => setIsCreateOpen(false)} style={styles.closeBtn}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {createError ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={14} color={colors.accentRose} style={{ marginRight: 6 }} />
                  <Text style={[styles.errorBannerText, { color: colors.accentRose }]}>{createError}</Text>
                </View>
              ) : null}

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Subject / Title *</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. SSO Login error for branch team"
                  placeholderTextColor={colors.textDim}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Priority</Text>
                <View style={styles.priorityRow}>
                  {["low", "medium", "high", "critical"].map((p) => {
                    const isSelected = newPriority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.priorityPill,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          isSelected && { backgroundColor: `${colors.primary}25`, borderColor: colors.primary },
                        ]}
                        onPress={() => setNewPriority(p)}
                      >
                        <Text
                          style={[
                            styles.priorityPillText,
                            { color: colors.textMuted },
                            isSelected && { color: colors.primaryLight, fontWeight: "700" },
                          ]}
                        >
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description *</Text>
                <TextInput
                  style={[styles.inputField, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="Please provide steps to reproduce, affected users, and error details…"
                  placeholderTextColor={colors.textDim}
                  multiline
                  numberOfLines={4}
                  value={newDesc}
                  onChangeText={setNewDesc}
                />

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleCreateTicket}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Submit Incident</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  priorityText: {
    fontSize: 11,
  },
  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewLinkText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCreateBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
  },
  textArea: {
    height: 90,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityPill: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: "600",
  },
  modalSubmitBtn: {
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
