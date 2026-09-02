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
  InteractionManager,
} from "react-native";
import {
  getInProgressGames,
  InProgressApiItem,
  deleteScorecardApi,
  getPendingScorecardRequests,
  approveScorecardRequest,
  rejectScorecardRequest,
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
  scoringType?: string;
  isDoublePeoria?: boolean;
  tournamentId?: number | null;
  hasLocalDraft?: boolean;
  isLocalDraftOnly?: boolean;
  courseHalf?: string;
  isGroupDelegation?: boolean;
  primaryUserName?: string;
  playingGroupRoundKey?: string;
  tournamentName?: string;
};

type InProgressTabProps = {
  playerId: number;
  onDelete?: (id: string) => void;
  onResume?: (
    id: string,
    courseName: string,
    date?: string,
    scoringType?: string,
    tournamentId?: number | null,
    isDoublePeoria?: boolean,
    courseHalf?: string,
    playingGroupRoundKey?: string,
    tournamentName?: string,
  ) => void;
  searchQuery?: string;
};

export function InProgressTab({
  playerId,
  onDelete = () => {},
  onResume = () => {},
  searchQuery = "",
}: InProgressTabProps) {
  const [games, setGames] = useState<InProgressGame[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleResume = (
    id: string,
    courseName: string,
    date?: string,
    scoringType?: string,
    tournamentId?: number | null,
    isDoublePeoria?: boolean,
    courseHalf?: string,
    playingGroupRoundKey?: string,
    tournamentName?: string,
  ) => {
    if (resumingId || deletingId) return;
    setResumingId(id);
    onResume(
      id,
      courseName,
      date,
      scoringType,
      tournamentId,
      isDoublePeoria,
      courseHalf,
      playingGroupRoundKey,
      tournamentName,
    );
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
      const task = InteractionManager.runAfterInteractions(() => {
        fetchGames(true);
      });
      return () => task.cancel();
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

      // Also fetch pending multiplayer requests
      try {
        const reqs = await getPendingScorecardRequests(playerId);
        setPendingRequests(Array.isArray(reqs) ? reqs : []);
      } catch (e) {
        console.error("Failed to load pending scorecard requests:", e);
      }

      const data: InProgressApiItem[] = await getInProgressGames(playerId);
      const drafts = await getUserDrafts(playerId);
      const merged = mergeInProgressRoundsWithDrafts(data, drafts);

      const mapped = merged.map((item: any) => ({
        id: item.scorecardId.toString(),
        courseName: item.courseName,
        date: item.date,
        holesPlayed: item.holesPlayed,
        isDQ: Boolean(
          item.isDQ ??
          item.IsDQ ??
          item.isDisqualified ??
          item.IsDisqualified ??
          false,
        ),
        scoringType:
          item.scoringType ??
          item.ScoringType ??
          item.tournamentScoringType ??
          item.TournamentScoringType ??
          item.scoring_type ??
          (item.isStableford ? "stableford" : undefined),
        isStableford: Boolean(
          item.isStableford ??
          item.IsStableford ??
          String(item.scoringType || "").toLowerCase().includes("stableford"),
        ),
        isDoublePeoria: Boolean(
          item.isDoublePeoria ??
          item.IsDoublePeoria ??
          item.is_double_peoria ??
          false,
        ),
        tournamentId: item.tournamentId ?? item.TournamentId ?? null,
        tournamentName: item.tournamentName ?? item.TournamentName ?? item.tournament?.name ?? undefined,
        hasLocalDraft: !!item.hasLocalDraft,
        isLocalDraftOnly: !!item.isLocalDraftOnly,
        courseHalf: item.courseHalf ?? item.CourseHalf ?? undefined,
        isGroupDelegation: Boolean(item.isGroupDelegation ?? item.IsGroupDelegation),
        primaryUserName: item.primaryUserName ?? item.PrimaryUserName ?? undefined,
        playingGroupRoundKey: item.playingGroupRoundKey ?? item.PlayingGroupRoundKey ?? undefined,
      }));

      // Filter out ghost rounds (duplicate API rounds with holesPlayed = 0)
      // Group by courseName + date
      const grouped = new Map<string, typeof mapped>();
      mapped.forEach((game: any) => {
        const key = `${game.courseName}_${new Date(game.date).toDateString()}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(game);
      });

      const finalGames: typeof mapped = [];
      grouped.forEach((gamesInGroup) => {
        if (gamesInGroup.length === 1) {
          finalGames.push(gamesInGroup[0]);
        } else {
          // Keep rounds that have holesPlayed > 0 OR have a local draft
          // If all are ghost rounds, just keep the latest one
          const validGames = gamesInGroup.filter((g: any) => g.holesPlayed > 0 || g.hasLocalDraft);
          if (validGames.length > 0) {
            finalGames.push(...validGames);
          } else {
            // All are ghost rounds, keep the one with max ID
            finalGames.push(gamesInGroup.reduce((prev: any, current: any) => (parseInt(prev.id) > parseInt(current.id)) ? prev : current));
          }
        }
      });

      setGames(finalGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
        {/* Pending Scorecard Requests Banner */}
        {pendingRequests.length > 0 && (
          <VStack space="sm" className="pt-2 pb-1">
            {pendingRequests.map((req) => (
              <Box
                key={req.id}
                style={{
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
                  borderColor: isDark ? "#F59E0B" : "#FDE68A",
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <HStack className="items-center justify-between">
                  <HStack space="sm" className="items-center flex-1 pr-2">
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#F59E0B",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="pencil" size={18} color="#ffffff" />
                    </View>
                    <VStack style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: isDark ? "#FBBF24" : "#92400E",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        Scorecard Request
                      </Text>
                      <Text
                        style={{
                          color: isDark ? "#F3F4F6" : "#1F2937",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        <Text style={{ fontWeight: "700" }}>{req.primaryUserName || "Round Scorer"}</Text> wants to fill in your scorecard for a multiplayer round.
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack space="xs">
                    <Button
                      size="xs"
                      onPress={async () => {
                        try {
                          await approveScorecardRequest(req.id);
                          fetchGames(false);
                        } catch (e) {
                          Alert.alert("Error", "Failed to approve request.");
                        }
                      }}
                      style={{
                        backgroundColor: "#16A34A",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        height: 32,
                      }}
                    >
                      <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>Approve</Text>
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onPress={async () => {
                        try {
                          await rejectScorecardRequest(req.id);
                          fetchGames(false);
                        } catch (e) {
                          Alert.alert("Error", "Failed to reject request.");
                        }
                      }}
                      style={{
                        borderColor: isDark ? "#EF4444" : "#DC2626",
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        height: 32,
                      }}
                    >
                      <Text style={{ color: isDark ? "#EF4444" : "#DC2626", fontWeight: "600", fontSize: 12 }}>Reject</Text>
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

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
          <VStack space="md" className="pt-2">
            {filteredGames.map((game) => (
              <Box
                key={game.id}
                className="mb-4"
                style={{
                  shadowColor: "#8BC34A",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDark ? 0.4 : 0.15,
                  shadowRadius: 14,
                  backgroundColor: game.isDQ
                    ? isDark
                      ? "rgba(50, 20, 20, 0.7)"
                      : "#FFF1F2"
                    : isDark
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
                  paddingHorizontal: 5,
                }}
              >
                <Box className="p-4">
                  <HStack className="items-center flex-wrap gap-2">
                    <Text
                      style={{
                        color: isDark ? "#FFFFFF" : "#111827",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      {game.courseName}
                    </Text>

                    {game.isGroupDelegation && (
                      <Badge
                        style={{
                          backgroundColor: isDark
                            ? "rgba(6, 182, 212, 0.2)"
                            : "#e0f2fe",
                          borderWidth: 1,
                          borderColor: isDark ? "#06b6d4" : "#0284c7",
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: isDark ? "#38bdf8" : "#0369a1",
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          👥 Multiplayer (Scorer: {game.primaryUserName || "Group Scorer"})
                        </Text>
                      </Badge>
                    )}
                  </HStack>

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
                    {!game.isGroupDelegation && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === game.id}
                        onPress={() =>
                          handleDelete(game.id, !!game.isLocalDraftOnly)
                        }
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
                    )}

                    <Button
                      size="sm"
                      disabled={resumingId === game.id}
                      onPress={() =>
                        handleResume(
                          game.id,
                          game.courseName,
                          game.date,
                          game.scoringType,
                          game.tournamentId,
                          game.isDoublePeoria,
                          game.courseHalf,
                          game.playingGroupRoundKey,
                          game.tournamentName,
                        )
                      }
                      className="rounded-full flex-row items-center justify-center"
                      style={{
                        backgroundColor:
                          game.isGroupDelegation
                            ? (isDark ? "#0284c7" : "#0284c7")
                            : (resumingId === game.id ? "#A5D6A7" : "#8BC34A"),
                        width: game.isGroupDelegation ? "100%" : "48%",
                        height: 42,
                        opacity: resumingId === game.id ? 0.7 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "700",
                          marginRight: 6,
                        }}
                      >
                        {resumingId === game.id
                          ? "Opening..."
                          : game.isGroupDelegation
                            ? "View Live"
                            : "Resume"}
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
