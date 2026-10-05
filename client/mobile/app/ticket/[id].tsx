import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  ArrowLeft,
  Clock,
  Send,
  User,
  Bot,
  AlertCircle,
  FileText,
} from "lucide-react-native";

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    try {
      setFetchError("");
      const res = await apiClient.get(`/tickets/${id}`);
      if (res.data?.data) {
        const t = res.data.data;
        setTicket(t);
        setMessages(t.messages || t.conversation || []);
      }
    } catch (err: any) {
      setFetchError(err.response?.data?.message || "Ticket not found or network error.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText("");

    try {
      const res = await apiClient.post(`/tickets/${id}/messages`, {
        message: content,
        sender_name: user?.name || "Customer",
      });

      if (res.data?.data) {
        const savedMsg = res.data.data;
        setMessages((prev) => [...prev, savedMsg]);
      } else {
        fetchTicket();
      }
    } catch (_) {
      // Re-fetch to synchronize
      fetchTicket();
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return { bg: "rgba(16, 185, 129, 0.15)", text: colors.accentEmerald, label: "Resolved" };
      case "in_progress":
        return { bg: `${colors.secondary}25`, text: colors.secondaryLight, label: "In Progress" };
      case "open":
      default:
        return { bg: `${colors.accentAmber}25`, text: colors.accentAmber, label: "Open" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError || !ticket) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Incident Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={44} color={colors.accentRose} style={{ marginBottom: 12 }} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Could Not Load Ticket</Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>{fetchError || "The requested ticket could not be found."}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchTicket}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getStatusBadge(ticket.status);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.ticketIdText, { color: colors.primaryLight }]}>
              {ticket.ticket_number || `#${ticket._id?.substring(0, 8)}`}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {ticket.title}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Metadata Overview Card */}
          <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metaTitle, { color: colors.text }]}>{ticket.title}</Text>
            {ticket.description ? (
              <Text style={[styles.metaDesc, { color: colors.textMuted }]}>{ticket.description}</Text>
            ) : null}

            <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.textDim} style={{ marginRight: 4 }} />
                <Text style={[styles.metaItemText, { color: colors.textDim }]}>
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "Recent"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaItemText, { color: colors.textDim }]}>
                  Priority:{" "}
                  <Text style={{ color: colors.text, fontWeight: "700", textTransform: "capitalize" }}>
                    {ticket.priority || "Normal"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Messages / Conversation Stream */}
          <Text style={[styles.streamTitle, { color: colors.text }]}>Communication History</Text>

          {messages.length === 0 ? (
            <View style={[styles.emptyMessagesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FileText size={24} color={colors.textDim} />
              <Text style={[styles.emptyMessagesText, { color: colors.textMuted }]}>
                No replies posted on this incident yet. Type below to leave a comment.
              </Text>
            </View>
          ) : (
            messages.map((m: any, idx: number) => {
              const isAi = m.sender_role === "ai" || m.sender === "ai" || m.is_ai;
              const isMe = m.sender_role === "customer" || m.sender_id === user?._id || m.sender_name === user?.name;

              return (
                <View
                  key={m._id || idx}
                  style={[
                    styles.msgBubble,
                    isMe
                      ? [styles.myBubble, { backgroundColor: colors.card, borderColor: colors.border }]
                      : isAi
                      ? [styles.aiBubble, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` }]
                      : [styles.agentBubble, { backgroundColor: colors.card, borderColor: colors.border }],
                  ]}
                >
                  <View style={styles.bubbleHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {isAi ? (
                        <Bot size={14} color={colors.primaryLight} />
                      ) : (
                        <User size={14} color={isMe ? colors.accentEmerald : colors.secondaryLight} />
                      )}
                      <Text style={[styles.senderName, { color: colors.text }]}>
                        {m.sender_name || (isAi ? "SupportAI Assistant" : isMe ? "You" : "Support Engineer")}
                      </Text>
                    </View>
                    <Text style={[styles.msgTime, { color: colors.textDim }]}>
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </Text>
                  </View>

                  <Text style={[styles.msgText, { color: colors.text }]}>{m.text || m.message || ""}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Reply Input Bar */}
        <View style={[styles.replyBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.replyInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Reply to this incident…"
            placeholderTextColor={colors.textDim}
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              (!replyText.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color="#ffffff" /> : <Send size={18} color="#ffffff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketIdText: {
    fontSize: 11,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  metaCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  metaDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItemText: {
    fontSize: 11,
  },
  streamTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  emptyMessagesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessagesText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  msgBubble: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  myBubble: {
    marginLeft: 20,
  },
  aiBubble: {
    marginRight: 20,
  },
  agentBubble: {
    marginRight: 20,
  },
  bubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "700",
  },
  msgTime: {
    fontSize: 10,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    borderTopWidth: 1,
  },
  replyInput: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 90,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  errorSub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 19,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});
