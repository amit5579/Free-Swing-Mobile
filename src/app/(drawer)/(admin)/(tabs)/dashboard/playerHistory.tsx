import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getScorecardHistory,
  ScorecardHistoryApi,
} from "@/api/admin/dashboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

const HistoryCard = ({
  item,
  isDark,
  isExpanded,
  onToggle,
  username,
}: {
  item: ScorecardHistoryApi;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  username: string;
}) => {
  const router = useRouter();

  return (
    <Box
      style={{
        backgroundColor: isDark
          ? "rgba(26,26,26,0.4)"
          : "rgba(255,255,255,0.35)",
        borderRadius: 20,
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        borderTopWidth: isDark ? 1.5 : 0,
        borderRightWidth: isDark ? 1.5 : 0,
        borderBottomWidth: isDark ? 1.5 : 0,
        borderColor: isDark ? "#8BC34A" : "transparent",
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: "hidden",
      }}
    >
      {/* HEADER - Tap to Toggle */}
      <Pressable onPress={onToggle}>
        <HStack className="items-center justify-between">
          <VStack style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "800", fontSize: 17 }}>
              {item.courseName}
            </ThemedText>
            <HStack className="items-center" style={{ marginTop: 4 }}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isDark ? "#888" : "#666"}
              />
              <ThemedText
                style={{
                  fontSize: 12,
                  color: isDark ? "#888" : "#666",
                  marginLeft: 4,
                }}
              >
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </ThemedText>
            </HStack>
          </VStack>

          <HStack className="items-center">
            {item.tournamentId && (
              <Box
                style={{
                  backgroundColor: "rgba(255,179,0,0.1)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  marginRight: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,179,0,0.2)",
                }}
              >
                <Ionicons
                  name="trophy-outline"
                  size={10}
                  color="#FFB300"
                  style={{ marginRight: 4 }}
                />
                <ThemedText
                  style={{ color: "#FFB300", fontSize: 9, fontWeight: "800" }}
                >
                  TOURNAMENT
                </ThemedText>
              </Box>
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#8BC34A"
            />
          </HStack>
        </HStack>
      </Pressable>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <VStack style={{ marginTop: 20 }}>
          <Divider
            style={{
              marginBottom: 16,
              backgroundColor: isDark ? "#333" : "#F0F0F0",
            }}
          />

          <Box
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              borderRadius: 18,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? "#8BC34A" : "#E5E7EB",
            }}
          >
            <HStack className="justify-between items-center">
              <VStack style={{ alignItems: "center", flex: 1 }}>
                <Ionicons
                  name="golf-outline"
                  size={16}
                  color={isDark ? "#8BC34A" : "#2E7D32"}
                  style={{ marginBottom: 4 }}
                />
                <ThemedText
                  style={{
                    fontWeight: "900",
                    fontSize: 18,
                    color: isDark ? "#fff" : "#1B5E20",
                  }}
                >
                  {item.score}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 8,
                    color: "#999",
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  GROSS
                </ThemedText>
              </VStack>

              <View
                style={{
                  width: 1,
                  height: 30,
                  backgroundColor: isDark ? "#333" : "#DDD",
                }}
              />

              <VStack style={{ alignItems: "center", flex: 1 }}>
                <Ionicons
                  name="stats-chart-outline"
                  size={16}
                  color={isDark ? "#bbb" : "#666"}
                  style={{ marginBottom: 4 }}
                />
                <ThemedText
                  style={{
                    fontWeight: "900",
                    fontSize: 18,
                    color: isDark ? "#fff" : "#333",
                  }}
                >
                  {item.netScore}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 8,
                    color: "#999",
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  NET SCORE
                </ThemedText>
              </VStack>

              <View
                style={{
                  width: 1,
                  height: 30,
                  backgroundColor: isDark ? "#333" : "#DDD",
                }}
              />

              <VStack style={{ alignItems: "center", flex: 1 }}>
                <Ionicons
                  name="ribbon-outline"
                  size={16}
                  color="#EF4444"
                  style={{ marginBottom: 4 }}
                />
                <ThemedText
                  style={{ fontWeight: "900", fontSize: 18, color: "#EF4444" }}
                >
                  {item.par}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 8,
                    color: "#999",
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  PAR
                </ThemedText>
              </VStack>
            </HStack>
          </Box>

          <HStack style={{ justifyContent: "flex-end" }}>
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(139,195,74,0.15)",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(139,195,74,0.2)",
              }}
              onPress={() =>
                router.push({
                  pathname: "/(drawer)/scoreCard/view/[scoreCard]" as any,
                  params: {
                    scoreCard: item.scorecardId.toString(),
                    username: username,
                    courseName: item.courseName,
                  },
                })
              }
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#2E7D32"
              />
              <ThemedText
                style={{
                  color: "#2E7D32",
                  fontWeight: "800",
                  marginLeft: 8,
                  fontSize: 13,
                }}
              >
                Details
              </ThemedText>
            </TouchableOpacity>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default function PlayerHistoryScreen() {
  const { userId, username } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [history, setHistory] = useState<ScorecardHistoryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getScorecardHistory(Number(userId));
      setHistory(data);
      // Automatically expand the first round
      if (data.length > 0) {
        setExpanded({ [data[0].scorecardId]: true });
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRound = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#F2F2F2" }}
    >
      <Watermark />

      {/* Premium Header */}
      <VStack className="px-4 pt-2 mb-2">
        <HStack className="items-center mb-1">
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
          </Pressable>
          <VStack style={{ marginLeft: 16 }}>
            <ThemedText
              style={{ fontSize: 22, fontWeight: "800", color: "#2E7D32" }}
            >
              {username || "Player"}
            </ThemedText>
            <ThemedText
              style={{ fontSize: 13, color: isDark ? "#888" : "#666" }}
            >
              Performance History
            </ThemedText>
          </VStack>
        </HStack>
      </VStack>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#8BC34A" />
          <ThemedText style={{ marginTop: 12, color: "#8BC34A" }}>
            Analyzing history...
          </ThemedText>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {history.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 40,
              }}
            >
              <Box
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={isDark ? "#333" : "#ddd"}
                />
              </Box>
              <ThemedText
                style={{
                  color: isDark ? "#666" : "#999",
                  textAlign: "center",
                  fontSize: 16,
                }}
              >
                No rounds recorded yet for this player.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.scorecardId.toString()}
              renderItem={({ item }) => (
                <HistoryCard
                  item={item}
                  isDark={isDark}
                  isExpanded={!!expanded[item.scorecardId]}
                  onToggle={() => toggleRound(item.scorecardId)}
                  username={String(username)}
                />
              )}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 120,
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
