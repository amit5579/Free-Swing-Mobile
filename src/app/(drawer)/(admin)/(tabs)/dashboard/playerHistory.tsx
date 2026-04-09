import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
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
import { Skeleton } from "@/components/Skeleton";

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
        shadowColor: "#8BC34A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 14,
        backgroundColor: isDark
          ? "rgba(26,26,26,0.6)"
          : "rgba(255,255,255,0.6)",
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: isDark ? "rgba(139, 195, 74, 0.6)" : "#E0E0E0",
        borderRadius: 22,
        padding: 12,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {/* HEADER - Tap to Toggle */}
      <Pressable onPress={onToggle}>
        <HStack className="items-center justify-between">
          <VStack style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "800", fontSize: 16 }}>
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
        <VStack style={{ marginTop: 12 }}>
          <Divider
            style={{
              marginBottom: 12,
              backgroundColor: isDark ? "#333" : "#F0F0F0",
            }}
          />

          <Box
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              borderRadius: 14,
              padding: 8,
              marginBottom: 10,
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
                    fontSize: 16,
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
                    fontSize: 16,
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
                  style={{ fontWeight: "900", fontSize: 16, color: "#EF4444" }}
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
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(139,195,74,0.2)",
              }}
              onPress={() =>
                router.push({
                  pathname:
                    "/(drawer)/(admin)/scorecard/view/[scoreCard]",
                  params: {
                    scoreCard: item.scorecardId.toString(),
                    courseName: item.courseName,
                    username: username,
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
                  marginLeft: 6,
                  fontSize: 12,
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

  const navigation = useNavigation();

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "none" },
      headerShown: false,
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: "flex", backgroundColor: isDark ? "rgba(30,30,30,0.75)" : "#fff" },
        headerShown: true,
      });
    };
  }, [navigation, isDark]);

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
        <VStack className="space-y-4 px-4 pt-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
            <Box
              key={key}
              style={{
                shadowColor: "#8BC34A",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.4 : 0.15,
                shadowRadius: 14,
                backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.6)",
                borderRadius: 22,
                borderLeftWidth: 6,
                borderLeftColor: "#8BC34A",
                borderTopWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderColor: isDark ? "rgba(139, 195, 74, 0.6)" : "#E0E0E0",
                padding: 12,
                marginBottom: 12,
              }}
            >
              <HStack className="justify-between items-center mb-2">
                <VStack space="xs">
                  <Skeleton isDark={isDark} width={180} height={18} borderRadius={8} />
                  <Skeleton isDark={isDark} width={100} height={12} borderRadius={6} />
                </VStack>
                <Skeleton isDark={isDark} width={20} height={20} borderRadius={10} />
              </HStack>

              {key === 0 && (
                <VStack style={{ marginTop: 12 }}>
                  <Skeleton isDark={isDark} width="100%" height={1} style={{ marginBottom: 12 }} />
                  <Box
                    style={{
                      height: 60,
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      borderRadius: 14,
                      padding: 8,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(139, 195, 74, 0.3)" : "#E5E7EB",
                      justifyContent: "center",
                    }}
                  >
                    <HStack className="justify-between items-center px-4">
                      {[1, 2, 3].map((i) => (
                        <VStack key={i} style={{ alignItems: "center", flex: 1 }}>
                          <Skeleton isDark={isDark} width={16} height={16} borderRadius={8} style={{ marginBottom: 4 }} />
                          <Skeleton isDark={isDark} width={30} height={16} borderRadius={4} />
                        </VStack>
                      ))}
                    </HStack>
                  </Box>
                  <HStack style={{ justifyContent: "flex-end" }}>
                    <Skeleton isDark={isDark} width={100} height={30} borderRadius={8} />
                  </HStack>
                </VStack>
              )}
            </Box>
          ))}
        </VStack>
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
