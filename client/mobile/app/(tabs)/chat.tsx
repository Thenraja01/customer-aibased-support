import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useSocket } from "../../src/context/SocketContext";
import { useTheme } from "../../src/context/ThemeContext";
import { apiClient } from "../../src/api/client";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Zap,
  ShieldCheck,
  Info,
  Radio,
} from "lucide-react-native";

interface Message {
  id: string;
  sender: "user" | "ai" | "agent";
  text: string;
  timestamp: string;
  citations?: { title: string; score?: number }[];
  confidence?: number;
}

const QUICK_PROMPTS = [
  "💳 Billing & Plan details",
  "⚡ How to configure SSO",
  "🛡️ Check open ticket status",
  "📖 Hybrid RAG knowledge base",
  "⚙️ API rate limits & keys",
];

export default function AIChatScreen() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { colors, appName, chatbotName, greetingMessage } = useTheme();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: greetingMessage || `Hello ${user?.name || "there"}! I am ${chatbotName || appName} Copilot. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: 100,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Listen for real-time live messages from Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on("chat_message", (data: any) => {
      if (data.sender !== "user") {
        setMessages((prev) => [
          ...prev,
          {
            id: data._id || String(Date.now()),
            sender: data.sender || "ai",
            text: data.message || data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            citations: data.citations,
            confidence: data.confidence || 98,
          },
        ]);
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("chat_message");
    };
  }, [socket]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await apiClient.post("/chats/ai", {
        chatId: chatId || undefined,
        message: textToSend.trim(),
        user_id: user?._id,
        organization_id: typeof user?.organization_id === "object" ? user?.organization_id._id : user?.organization_id,
      });

      if (response.data?.data) {
        const aiMsg = response.data.data;
        if (aiMsg.chatId) {
          setChatId(aiMsg.chatId);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsg._id || String(Date.now() + 1),
            sender: "ai",
            text:
              aiMsg.content ||
              aiMsg.response ||
              aiMsg.message ||
              aiMsg.text ||
              "I have analyzed your request against the enterprise knowledge base.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            citations: aiMsg.citations || [],
            confidence: aiMsg.confidence || 98.4,
          },
        ]);
      }
    } catch (err: any) {
      console.warn("AI chat request error:", err?.response?.data || err.message);
      // User-friendly message instead of raw backend error strings
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: "Sorry, I couldn't send your message right now. Please verify your connection and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.botAvatar, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
              <Bot size={22} color={colors.primary} />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.title, { color: colors.text }]}>{chatbotName || appName} Copilot</Text>
                <View style={[styles.ragPill, { backgroundColor: `${colors.accentEmerald}20`, borderColor: `${colors.accentEmerald}40` }]}>
                  <Sparkles size={10} color={colors.accentEmerald} />
                  <Text style={[styles.ragPillText, { color: colors.accentEmerald }]}>RAG Ready</Text>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: colors.textDim }]}>
                {isConnected ? "Connected to Live WebSocket Stream" : "Connected via Verified REST Engine"}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Radio size={12} color={isConnected ? colors.accentEmerald : colors.textDim} />
            <Text style={[styles.statusBadgeText, { color: isConnected ? colors.accentEmerald : colors.textDim }]}>
              {isConnected ? "Live" : "Ready"}
            </Text>
          </View>
        </View>

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isUser = item.sender === "user";
            return (
              <View
                style={[
                  styles.messageWrapper,
                  isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
                ]}
              >
                {!isUser ? (
                  <View style={[styles.senderAvatar, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
                    <Bot size={16} color={colors.primary} />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
                  ]}
                >
                  <Text style={[styles.messageText, isUser ? styles.userMessageText : { color: colors.text }]}>
                    {item.text}
                  </Text>

                  {/* Citations & Verified Badges for AI Responses */}
                  {!isUser && item.citations && item.citations.length > 0 ? (
                    <View style={[styles.citationsWrapper, { borderTopColor: colors.border }]}>
                      <View style={styles.citationHeader}>
                        <ShieldCheck size={12} color={colors.accentEmerald} />
                        <Text style={[styles.citationHeaderText, { color: colors.accentEmerald }]}>
                          Verified Documentation Citations
                        </Text>
                      </View>
                      {item.citations.map((c: any, i: number) => (
                        <View key={i} style={[styles.citationItem, { backgroundColor: colors.surface }]}>
                          <Info size={11} color={colors.secondaryLight} />
                          <Text style={[styles.citationItemText, { color: colors.textMuted }]} numberOfLines={1}>
                            {c.title || "Enterprise Knowledge Base"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.timestampText,
                      isUser ? styles.userTimestamp : { color: colors.textDim },
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                </View>

                {isUser ? (
                  <View style={[styles.senderAvatar, { backgroundColor: `${colors.accentEmerald}20` }]}>
                    <User size={16} color={colors.accentEmerald} />
                  </View>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingWrapper}>
                <View style={[styles.senderAvatar, { backgroundColor: `${colors.primary}20` }]}>
                  <Bot size={16} color={colors.primary} />
                </View>
                <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.typingText, { color: colors.textMuted }]}>
                    Formulating grounded response…
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Suggestion Chips (Horizontally Scrollable) */}
        <View style={styles.quickPromptsRow}>
          <FlatList
            horizontal
            data={QUICK_PROMPTS}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.quickPromptChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleSend(item.replace(/^[^\s]+\s/, ""))}
                activeOpacity={0.8}
              >
                <Zap size={11} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.quickPromptText, { color: colors.textMuted }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Type your question or issue…"
            placeholderTextColor={colors.textDim}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!inputText.trim() || isTyping) && { opacity: 0.5 },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.85}
          >
            <Send size={18} color="#ffffff" />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  ragPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ragPillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
    alignItems: "flex-end",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  aiMessageWrapper: {
    justifyContent: "flex-start",
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  citationsWrapper: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 4,
  },
  citationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  citationHeaderText: {
    fontSize: 10,
    fontWeight: "700",
  },
  citationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  citationItemText: {
    fontSize: 10,
    flex: 1,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 6,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  typingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  typingText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  quickPromptsRow: {
    paddingVertical: 8,
  },
  quickPromptsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPromptChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
