import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { apiClient } from "../../src/api/client";
import { useTheme } from "../../src/context/ThemeContext";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Bot,
  ArrowRight,
} from "lucide-react-native";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  status?: string;
}

export default function FAQScreen() {
  const router = useRouter();
  const { colors, appName } = useTheme();

  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchFaqs = useCallback(async () => {
    try {
      // Try active FAQs first, then general /faqs
      let res;
      try {
        res = await apiClient.get("/faqs/active");
      } catch {
        res = await apiClient.get("/faqs");
      }

      if (res.data?.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.faqs || [];
        setFaqs(list);
        if (list.length > 0) {
          setExpandedId(list[0]._id);
        }
      } else {
        setFaqs([]);
      }
    } catch (_) {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFaqs();
    setRefreshing(false);
  };

  // Derive dynamic categories from DB faqs
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ["All", ...Array.from(set)];
  }, [faqs]);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      (faq.question || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.answer || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Knowledge Base</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Verified self-service guides & enterprise FAQs
          </Text>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search articles, policies, errors…"
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Bar */}
        {categories.length > 1 ? (
          <View style={styles.categoriesWrapper}>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = selectedCategory === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryPill,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      active && { backgroundColor: `${colors.primary}25`, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: colors.textMuted },
                        active && { color: colors.primaryLight, fontWeight: "700" },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        ) : null}

        {/* FAQ List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredFaqs}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BookOpen size={44} color={colors.textDim} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Knowledge Articles</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  {searchQuery
                    ? "No articles matched your search query."
                    : `No published FAQs found in this organization yet. Ask ${appName} Copilot directly.`}
                </Text>
                <TouchableOpacity
                  style={[styles.askAiBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/(tabs)/chat")}
                >
                  <Bot size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.askAiBtnText}>Ask AI Copilot</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => {
              const isExpanded = expandedId === item._id;
              return (
                <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleExpand(item._id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      {item.category ? (
                        <Text style={[styles.faqCategory, { color: colors.secondaryLight }]}>{item.category}</Text>
                      ) : null}
                      <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={colors.primaryLight} />
                    ) : (
                      <ChevronDown size={20} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
                      <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>{item.answer}</Text>
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )}
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
  categoriesWrapper: {
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 32,
  },
  faqCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqCategory: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  askAiBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  askAiBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
