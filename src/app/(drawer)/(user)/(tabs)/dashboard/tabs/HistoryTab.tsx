import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { getScoreHistory, ScoreHistoryItem } from "@/api/modules/dashboard.api";
import { router, useFocusEffect } from "expo-router";
import { Skeleton } from "@/components/Skeleton";
import { ThemedText } from "@/components/themed-text";

export type GameHistory = {
  id: string;
  date: string;
  time: string;
  course: string;
  score: number | null;
  net: number | null;
  par: number;
  isTournament: boolean;
  isDQ: boolean;
};

type HistoryTabProps = {
  playerId: number;
  onViewGame?: (id: string) => void;
  searchQuery?: string;
};

export function HistoryTab({
  playerId,
  onViewGame,
  searchQuery = "",
}: HistoryTabProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHistory(true);
    }, [playerId]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [playerId]);

  const fetchHistory = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data: ScoreHistoryItem[] = await getScoreHistory(playerId);

      const mapped: GameHistory[] = data.map((item) => ({
        id: item.scorecardId.toString(),
        date: new Date(item.date).toLocaleDateString(),
        time: new Date(item.date).toLocaleTimeString(),
        course: item.courseName,
        score: item.score,
        net: item.netScore,
        par: item.par,
        isTournament: !!item.tournamentId,
        isDQ: !!item.isDQ,
      }));

      setHistory(mapped);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.course.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack className="pt-4 space-y-4">
            <HStack className="justify-between items-center mb-3">
              <VStack>
                <Skeleton
                  isDark={isDark}
                  width={140}
                  height={20}
                  style={{ marginBottom: 6 }}
                />
                <Skeleton isDark={isDark} width={220} height={14} />
              </VStack>
              <Skeleton
                isDark={isDark}
                width={36}
                height={36}
                borderRadius={18}
              />
            </HStack>

            {[1, 2, 3].map((key) => (
              <Box
                key={key}
                className="rounded-2xl mb-4"
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
                  padding: 16,
                }}
              >
                <HStack className="justify-between items-start">
                  <VStack style={{ flex: 1 }}>
                    <Skeleton
                      isDark={isDark}
                      width="70%"
                      height={18}
                      style={{ marginBottom: 8 }}
                    />

                    <Skeleton
                      isDark={isDark}
                      width={90}
                      height={18}
                      borderRadius={12}
                    />
                  </VStack>

                  <VStack className="items-end">
                    <Skeleton
                      isDark={isDark}
                      width={80}
                      height={14}
                      style={{ marginBottom: 6 }}
                    />
                    <Skeleton isDark={isDark} width={60} height={12} />
                  </VStack>
                </HStack>

                <HStack space="sm" className="mt-4">
                  {[1, 2, 3].map((i) => (
                    <Box
                      key={i}
                      className="flex-1 items-center py-3 rounded-xl"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(22, 22, 24, 0.6)"
                          : "rgba(255, 255, 255, 0.6)",
                        borderColor: "rgba(139,195,74,0.3)",
                        borderWidth: 1,
                      }}
                    >
                      <Skeleton
                        isDark={isDark}
                        width={40}
                        height={10}
                        style={{ marginBottom: 6 }}
                      />
                      <Skeleton isDark={isDark} width={50} height={20} />
                    </Box>
                  ))}
                </HStack>

                <Skeleton
                  isDark={isDark}
                  width="100%"
                  height={40}
                  borderRadius={20}
                  style={{ marginTop: 16 }}
                />
              </Box>
            ))}
          </VStack>
        </ScrollView>
      </View>
    );
  }

  const handleViewScorecard = (id: string, course: string) => {
    router.push({
      pathname: "/(drawer)/(user)/scorecard/view/[scoreCard]",
      params: { scoreCard: id, courseName: course },
    });
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 0,
        backgroundColor: isDark ? "#161618" : "#FFFFFF",
      }}
    >
      <HStack className="justify-between items-center px-4 mb-3 mt-0 pt-0">
        <VStack>
          <Text
            className={`font-bold ${isDark ? "text-white" : "text-gray-900"} text-lg`}
            style={{ marginTop: 0 }}
          >
            Recent Activity
          </Text>
          <Text
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Your game history and performance
          </Text>
        </VStack>

        <Pressable onPress={() => fetchHistory()} className="p-2 rounded-full">
          <Ionicons
            name="sync-outline"
            size={20}
            color={isDark ? "#fff" : "#6B7280"}
          />
        </Pressable>
      </HStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8BC34A"]}
            tintColor="#8BC34A"
          />
        }
      >
        {filteredHistory.length === 0 ? (
          <Box
            className="bg-background-0 rounded-2xl border border-outline-200 py-12 items-center mt-4"
            style={{ borderColor: isDark ? "#8BC34A" : "#E5E7EB" }}
          >
            <Ionicons name="time-outline" size={40} color="#9ca3af" />
            <ThemedText className="text-typography-400 font-semibold text-sm mt-3">
              {searchQuery ? "No matching history found" : "No history yet"}
            </ThemedText>
          </Box>
        ) : (
          // history.map((item) => (
          //     <Pressable key={item.id} onPress={() => handleViewScorecard(item.id)}>
          filteredHistory.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleViewScorecard(item.id, item.course)}
            >
              <Box
                className="rounded-2xl mb-4"
                style={{
                  shadowColor: "#8BC34A",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDark ? 0.4 : 0.15,
                  shadowRadius: 14,
                  backgroundColor: isDark
                    ? "rgba(26,26,26,0.6)"
                    : "rgba(255,255,255,0.6)",
                  borderLeftWidth: 6,
                  borderLeftColor: item.isDQ ? "#ef4444" : "#8BC34A",
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderColor:
                    item.isDQ && isDark
                      ? "#ef4444"
                      : isDark
                        ? "rgba(139,195,74,0.6)"
                        : "#E0E0E0",
                  borderRadius: 22,
                  overflow: "hidden",
                }}
              >
                <Box className="p-4">
                  <HStack className="justify-between items-start">
                    <VStack space="xs" style={{ flex: 1, paddingRight: 12 }}>
                      <Text
                        className="text-[#8BC34A] font-bold text-lg"
                        style={{ fontSize: 17 }}
                        numberOfLines={2}
                      >
                        {item.course}
                      </Text>

                      {(item.isTournament || item.isDQ) && (
                        <HStack space="xs" className="mt-1 flex-wrap">
                          {item.isTournament && (
                            <Badge
                              className="rounded-full px-3 py-1 flex-row items-center border"
                              style={{
                                backgroundColor: isDark ? "#0891B2" : "#A3D977",
                                borderColor: isDark ? "#0891B2" : "#A3D977",
                              }}
                            >
                              <Ionicons
                                name="trophy"
                                size={11}
                                color="#fff"
                                style={{ marginRight: 4 }}
                              />
                              <BadgeText className="text-white text-[10px] font-bold">
                                Tournament
                              </BadgeText>
                            </Badge>
                          )}
                          {item.isDQ && (
                            <Badge
                              className="rounded-full px-3 py-1 flex-row items-center border"
                              style={{
                                backgroundColor: "#ef4444",
                                borderColor: "#ef4444",
                              }}
                            >
                              <BadgeText className="text-white text-[10px] font-bold">
                                DQ
                              </BadgeText>
                            </Badge>
                          )}
                        </HStack>
                      )}
                    </VStack>

                    <VStack className="items-end" style={{ flexShrink: 0 }}>
                      <Text
                        className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {item.date}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {item.time}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack space="sm" className="mt-4">
                    {[
                      { label: "SCORE", value: item.score, type: "normal" },
                      { label: "NET", value: item.net, type: "green" },
                      { label: "PAR", value: item.par, type: "par" },
                    ].map((s) => (
                      <Box
                        key={s.label}
                        className="flex-1 rounded-xl items-center py-3 border"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(22, 22, 24, 0.6)"
                            : "rgba(255, 255, 255, 0.6)",
                          borderColor: "rgba(139,195,74,0.3)",
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          className="text-[10px] uppercase tracking-widest mb-1"
                          style={{
                            color:
                              s.type === "par"
                                ? isDark
                                  ? "#FCA5A5"
                                  : "#B91C1C"
                                : isDark
                                  ? "#9CA3AF"
                                  : "#6B7280",
                          }}
                        >
                          {s.label}
                        </Text>

                        <Text
                          className="text-base font-bold"
                          style={{
                            color:
                              s.type === "par"
                                ? isDark
                                  ? "#FECACA"
                                  : "#DC2626"
                                : s.type === "green"
                                  ? "#10B981"
                                  : isDark
                                    ? "#FFFFFF"
                                    : "#111827",
                          }}
                        >
                          {s.type === "par"
                            ? (item.score === 0 && item.net === 0) ||
                              item.par === 0
                              ? "E"
                              : item.par > 0
                                ? `+${item.par}`
                                : item.par
                            : s.value}
                        </Text>
                      </Box>
                    ))}
                  </HStack>

                  <HStack className="mt-4 w-full">
                    <Button
                      size="sm"
                      className="w-full rounded-2xl h-10 flex-row items-center justify-center"
                      style={{ backgroundColor: "#8BC34A" }}
                      onPress={() => handleViewScorecard(item.id, item.course)}
                    >
                      <Ionicons name="eye-outline" size={14} color="white" />
                      <ButtonText className="text-white text-md font-bold ml-1.5">
                        View
                      </ButtonText>
                    </Button>
                  </HStack>
                </Box>
              </Box>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default HistoryTab;
