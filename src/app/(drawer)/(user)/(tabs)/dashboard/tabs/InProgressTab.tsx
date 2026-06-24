import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  useColorScheme,
  View,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import {
  getInProgressGames,
  InProgressApiItem,
  deleteScorecardApi,
} from "@/api/modules/dashboard.api";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "expo-router";
import {
  getUserDrafts,
  deleteDraft,
  mergeInProgressRoundsWithDrafts,
} from "@/utils/draftStorage";

export type InProgressGame = {
  id: string;
  courseName: string;
  date: string;
  holesPlayed: number;
  isDQ: boolean;
  hasLocalDraft?: boolean;
  isLocalDraftOnly?: boolean;
};

type InProgressTabProps = {
  playerId: number;
  onDelete?: (id: string) => void;
  onResume?: (id: string, courseName: string, date?: string) => void;
  searchQuery?: string;
};

export function InProgressTab({
  playerId,
  onDelete = () => { },
  onResume = () => { },
  searchQuery = "",
}: InProgressTabProps) {
  const [games, setGames] = useState<InProgressGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleResume = (id: string, courseName: string, date?: string) => {
    if (resumingId || deletingId) return;
    setResumingId(id);
    onResume(id, courseName, date);
    setTimeout(() => setResumingId(null), 1000);
  };

  const handleDelete = (id: string, isLocalOnly: boolean) => {
    if (resumingId || deletingId) return;
    Alert.alert(
      "Delete Game",
      "Are you sure you want to delete this game in progress?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(id);
              if (isLocalOnly) {
                await deleteDraft(id);
              } else {
                await deleteScorecardApi(id);
                await deleteDraft(id);
              }
              fetchGames();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete game.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useFocusEffect(
    useCallback(() => {
      fetchGames(true);
    }, [playerId]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGames();
    setRefreshing(false);
  }, [playerId]);

  const fetchGames = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data: InProgressApiItem[] = await getInProgressGames(playerId);
      const drafts = await getUserDrafts(playerId);
      const merged = mergeInProgressRoundsWithDrafts(data, drafts);

      const mapped = merged.map((item: any) => ({
        id: item.scorecardId.toString(),
        courseName: item.courseName,
        date: item.date,
        holesPlayed: item.holesPlayed,
        isDQ: !!item.isDQ,
        hasLocalDraft: !!item.hasLocalDraft,
        isLocalDraftOnly: !!item.isLocalDraftOnly,
      }));

      setGames(mapped);
    } catch (error) {
      console.error("Error fetching in-progress games:", error);
      setGames([]);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const filteredGames = games.filter((game) =>
    game.courseName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
      >
        <HStack className="justify-between items-center px-4 mb-3 mt-0 pt-0">
          <VStack>
            <Text
              className={`font-bold ${isDark ? "text-white" : "text-gray-900"} text-lg`}
              style={{ marginTop: 0 }}
            >
              In Progress
            </Text>
            <Text
              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}
            >
              Games you are currently playing
            </Text>
          </VStack>
          {/* <Pressable onPress={() => fetchGames()} className="p-2 rounded-full">
            <Ionicons
              name="sync-outline"
              size={20}
              color={isDark ? "#fff" : "#6B7280"}
            />
          </Pressable> */}
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
          <VStack space="md" className="pt-4">
            {[1, 2].map((key) => (
              <Box
                key={key}
                className="mb-4"
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
                  overflow: "hidden",
                }}
              >
                <Box className="p-4">
                  <Skeleton
                    isDark={isDark}
                    width="60%"
                    height={24}
                    style={{ marginBottom: 8 }}
                  />
                  <HStack space="sm" className="items-center mb-4">
                    <Skeleton isDark={isDark} width={80} height={14} />
                    <Skeleton
                      isDark={isDark}
                      width={100}
                      height={20}
                      borderRadius={6}
                    />
                  </HStack>
                  <HStack space="sm">
                    <Skeleton
                      isDark={isDark}
                      width="48%"
                      height={36}
                      borderRadius={20}
                    />
                    <Skeleton
                      isDark={isDark}
                      width="48%"
                      height={36}
                      borderRadius={20}
                    />
                  </HStack>
                </Box>
              </Box>
            ))}
          </VStack>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}>
      <HStack className="justify-between items-center px-4 mb-3 mt-0 pt-0">
        <VStack>
          <Text
            className={`font-bold ${isDark ? "text-white" : "text-gray-900"} text-lg`}
            style={{ marginTop: 0 }}
          >
            In Progress
          </Text>
          <Text
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Games you are currently playing
          </Text>
        </VStack>
        {/* <Pressable onPress={() => fetchGames()} className="p-2 rounded-full">
          <Ionicons
            name="sync-outline"
            size={20}
            color={isDark ? "#fff" : "#6B7280"}
          />
        </Pressable> */}
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
        {!filteredGames.length ? (
          <Box
            className="p-8 rounded-xl items-center mt-4"
            style={{
              backgroundColor: isDark ? "#161618" : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDark ? "#8BC34A" : "#E5E7EB",
            }}
          >
            <Ionicons name="documents-outline" size={32} color="#9ca3af" />
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#6B7280",
                fontWeight: "500",
                marginTop: 8,
              }}
            >
              {searchQuery ? "No matching games found" : "No games in progress"}
            </Text>
          </Box>
        ) : (
          <VStack space="md" className="pt-4">
            {filteredGames.map((game) => (
              <Box
                key={game.id}
                className="mb-4"
                style={{
                  shadowColor: "#8BC34A",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDark ? 0.4 : 0.15,
                  shadowRadius: 14,
                  backgroundColor: isDark
                    ? "rgba(26,26,26,0.6)"
                    : "rgba(255,255,255,0.6)",
                  borderLeftWidth: 6,
                  borderLeftColor: game.isDQ ? "#ef4444" : "#8BC34A",
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderColor:
                    game.isDQ && isDark
                      ? "#ef4444"
                      : isDark
                        ? "rgba(139,195,74,0.6)"
                        : "#E0E0E0",
                  borderRadius: 22,
                  overflow: "hidden",
                  paddingVertical: 9,
                  paddingHorizontal: 5
                }}
              >
                <Box className="p-4">
                  <Text
                    style={{
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {game.courseName}
                  </Text>

                  <HStack className="items-center mt-1 space-x-2">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <Text
                      style={{
                        color: isDark ? "#9CA3AF" : "#6B7280",
                        fontSize: 12,
                      }}
                    >
                      {new Date(game.date).toDateString()}
                    </Text>

                    <Text
                      style={{
                        color: isDark ? "#6B7280" : "#9CA3AF",
                        marginHorizontal: 4,
                      }}
                    >
                      •
                    </Text>

                    <Badge
                      style={{
                        backgroundColor: isDark
                          ? "rgba(22, 22, 24, 0.8)"
                          : "rgba(243, 244, 246, 0.8)",
                        borderWidth: 1,
                        borderColor: "rgba(139, 195, 74, 0.3)",
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: 10,
                          fontWeight: "500",
                        }}
                      >
                        {game.holesPlayed} Holes Played
                      </Text>
                    </Badge>
                    {game.hasLocalDraft && !game.isLocalDraftOnly && (
                      <Badge
                        style={{
                          backgroundColor: isDark
                            ? "rgba(139, 195, 74, 0.15)"
                            : "rgba(139, 195, 74, 0.1)",
                          borderWidth: 1,
                          borderColor: "#8BC34A",
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginLeft: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#8BC34A",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          Draft
                        </Text>
                      </Badge>
                    )}
                    {game.isLocalDraftOnly && (
                      <Badge
                        style={{
                          backgroundColor: isDark
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(245, 158, 11, 0.1)",
                          borderWidth: 1,
                          borderColor: "#F59E0B",
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginLeft: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#F59E0B",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          Offline Draft
                        </Text>
                      </Badge>
                    )}
                    {game.isDQ && (
                      <Badge
                        style={{
                          backgroundColor: "#ef4444",
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginLeft: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          DQ
                        </Text>
                      </Badge>
                    )}
                  </HStack>

                  <HStack className="mt-4 justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === game.id}
                      onPress={() => handleDelete(game.id, !!game.isLocalDraftOnly)}
                      className="rounded-full flex-row items-center justify-center"
                      style={{
                        borderColor: isDark ? "#EF4444" : "#FCA5A5",
                        width: "48%",
                        height: 42,
                        opacity: deletingId === game.id ? 0.7 : 1,
                      }}
                    >
                      {deletingId === game.id ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#EF4444" : "#DC2626"}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={isDark ? "#EF4444" : "#DC2626"}
                          />
                          <Text
                            style={{
                              color: isDark ? "#EF4444" : "#DC2626",
                              fontWeight: "600",
                              marginLeft: 6,
                            }}
                          >
                            Delete
                          </Text>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      disabled={resumingId === game.id}
                      onPress={() => handleResume(game.id, game.courseName, game.date)}
                      className="rounded-full flex-row items-center justify-center"
                      style={{
                        backgroundColor:
                          resumingId === game.id ? "#A5D6A7" : "#8BC34A",
                        width: "48%",
                        height: 42,
                        opacity: resumingId === game.id ? 0.7 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "600",
                          marginRight: 6,
                          
                        }}
                      >
                        {resumingId === game.id ? "Opening..." : "Resume"}
                      </Text>
                      {resumingId !== game.id && (
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color="#FFFFFF"
                        />
                      )}
                    </Button>
                  </HStack>
                </Box>
              </Box>
            ))}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}

export default InProgressTab;
