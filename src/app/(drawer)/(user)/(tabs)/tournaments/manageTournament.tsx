import {
  getAddedPlayers,
  addPlayerToTournament,
  getMembersList,
  removePlayerFromTournament,
} from "@/api/modules/admin/tournaments.api";
import Toast from "react-native-toast-message";
import { HStack } from "@/components/hstack";
import { Skeleton } from "@/components/Skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchMembers } from "@/redux/slices/userTournament.slice";

export default function ManageTournament() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, maxPlayers } = useLocalSearchParams();
  const maxLimit = Number(maxPlayers) > 0 ? Number(maxPlayers) : 4;

  const dispatch = useAppDispatch();

  const { loading, membersData, addedPlayersData, error } = useAppSelector(
    (state) => state.userTournament
  );

  const [loadingLocal, setLoadingLocal] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [addedPlayers, setAddedPlayers] = useState<any>([]);
  const [search, setSearch] = useState("");

  const isLimitReached = (addedPlayers?.length || 0) >= maxLimit;

  const handleAddPlayer = async (userId: number) => {
    if (processingUserId !== null) return;
    if ((addedPlayers?.length || 0) >= maxLimit) {
      Toast.show({
        type: "error",
        text1: `Tournament is full (Max ${maxLimit} members)`,
      });
      return;
    }

    try {
      setProcessingUserId(userId);
      await addPlayerToTournament(Number(tournamentId), userId);
      setAddedPlayers((prev: any[]) => [...prev, { userId, id: userId }]); // Optimistic update
      Toast.show({
        type: "success",
        text1: "Player added successfully",
      });
    } catch (error: any) {
      console.error("Adding user to tournament Error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Failed to add player";

      if (
        typeof msg === "string" &&
        (msg === "Tournament is full." || msg.toLowerCase().includes("full"))
      ) {
        Toast.show({
          type: "error",
          text1: `Tournament is full (Max ${maxLimit} members)`,
        });
      } else if (
        typeof msg === "string" &&
        msg.toLowerCase().includes("already joined")
      ) {
        Toast.show({
          type: "info",
          text1: "Already joined",
        });
      } else {
        Toast.show({
          type: "error",
          text1: typeof msg === "string" ? msg : "Failed to add player",
        });
      }
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRemovePlayer = async (userId: number) => {
    if (processingUserId !== null) return;
    try {
      setProcessingUserId(userId);
      await removePlayerFromTournament(Number(tournamentId), userId);
      setAddedPlayers((prev: any[]) =>
        prev.filter((p: any) => p.userId !== userId && p.id !== userId),
      );
      Toast.show({
        type: "success",
        text1: "Player removed successfully",
      });
    } catch (error) {
      console.error("Removing user from tournament Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to remove player",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const fetchAddedPlayers = async () => {
    try {
      setLoadingLocal(true);
      const addedPlayersData = await getAddedPlayers(Number(tournamentId));
      setAddedPlayers(addedPlayersData);
    } catch (error) {
      console.error("Fetching tournament players Error:", error);
      throw error;
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    dispatch(fetchMembers());
    fetchAddedPlayers();
  }, [dispatch, tournamentId]);

  const isPageLoading = loading || loadingLocal;

  const filteredMembers = membersData.filter(
    (user: any) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const isSearching = search.length > 0;
  const dataToShow = isSearching ? filteredMembers : membersData;

  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 12,
          }}
        >
          {/* 🔝 TOP ROW */}
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 🔙 BACK */}
            <Pressable
              onPress={() => {
                if (routePage.canGoBack()) {
                  routePage.back();
                } else {
                  routePage.replace("/(drawer)/(user)/(tabs)/tournaments");
                }
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              }}
              android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "#fff" : "#020617"}
              />
            </Pressable>

            {/* 🧠 TITLE BLOCK */}
            <VStack
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              {/* LABEL */}
              <ThemedText
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: "500",
                }}
              >
                Manage Tournament
              </ThemedText>

              {/* MAIN TITLE */}
              {isPageLoading ? (
                <Skeleton
                  isDark={isDark}
                  height={18}
                  width={140}
                  style={{ marginTop: 2, borderRadius: 6 }}
                />
              ) : (
                <ThemedText
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    marginTop: 2,
                    maxWidth: "85%",
                    textAlign: "center",
                    color: isDark ? "#fff" : "#020617",
                  }}
                >
                  {tournamentName}
                </ThemedText>
              )}
            </VStack>

            {/* ⚖️ RIGHT SPACER */}
            <View style={{ width: 40 }} />
          </HStack>
        </VStack>
      </Box>
    );
  };

  const SearchSkeleton = ({ isDark }: { isDark: boolean }) => (
    <Skeleton
      isDark={isDark}
      height={40}
      borderRadius={10}
      style={{ marginBottom: 12 }}
    />
  );

  const UserCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#374151" : "#e5e7eb",
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
        }}
      >
        <HStack
          style={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* LEFT */}
          <View style={{ flex: 1 }}>
            <Skeleton isDark={isDark} height={14} width="60%" />

            <Skeleton
              isDark={isDark}
              height={12}
              width="80%"
              style={{ marginTop: 6 }}
            />
          </View>

          {/* BUTTON */}
          <Skeleton isDark={isDark} height={28} width={60} borderRadius={6} />
        </HStack>
      </View>
    );
  };

  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        <RenderHeader />
        <Watermark />

        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {/*  Search Input & Quota Banner */}
          {isPageLoading ? (
            <SearchSkeleton isDark={isDark} />
          ) : (
            <>
              {isLimitReached ? (
                <HStack className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 items-start gap-2 mb-3">
                  <Ionicons
                    name="warning-outline"
                    size={18}
                    color="#ef4444"
                  />
                  <Text className="flex-1 text-[13px] text-[#b91c1c] leading-5">
                    <Text className="font-semibold">Tournament is full:</Text> You have reached the maximum capacity ({addedPlayers.length}/{maxLimit} members). Remove a member to add someone else.
                  </Text>
                </HStack>
              ) : (
                <HStack className="bg-[#e0f2fe] border border-[#7dd3fc] rounded-lg p-3 items-start gap-2 mb-3">
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#0284c7"
                  />
                  <Text className="flex-1 text-[13px] text-[#0369a1] leading-5">
                    You are the creator of this tournament. You can add up to{" "}
                    <Text className="font-semibold">{maxLimit} members</Text> ({addedPlayers.length}/{maxLimit} added).
                  </Text>
                </HStack>
              )}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#1e293b" : "#e2e8f0",
                  backgroundColor: isDark
                    ? "rgba(15, 23, 42, 0.7)"
                    : "rgba(255, 255, 255, 0.7)",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 12,
                }}
              >
                <TextInput
                  placeholder="Search users by name or email..."
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  value={search}
                  onChangeText={setSearch}
                  style={{
                    color: isDark ? "#fff" : "#000",
                  }}
                />
              </View>
            </>
          )}

          {isPageLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <UserCardSkeleton key={i} isDark={isDark} />
              ))}
            </>
          ) : (
            <>
              {/* ❌ No Users Found */}
              {dataToShow.length === 0 ? (
                <ThemedText style={{ textAlign: "center", marginTop: 20 }}>
                  No users found
                </ThemedText>
              ) : (
                dataToShow.map((user: any) => {
                  const isAdded = addedPlayers.some(
                    (p: any) => p.userId === user.id || p.id === user.id,
                  );

                  return (
                    <View
                      key={user.id}
                      style={{
                        borderWidth: 1,
                        borderColor: isDark ? "#1e293b" : "#e2e8f0",
                        backgroundColor: isDark
                          ? "rgba(15, 23, 42, 0.7)"
                          : "rgba(255, 255, 255, 0.7)",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* LEFT SIDE */}
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <ThemedText
                            style={{ fontSize: 16, fontWeight: "600" }}
                          >
                            {user.username}
                          </ThemedText>

                          <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
                            Handicap: {user.handicap} | {user.email}
                          </ThemedText>
                        </View>

                        {/* RIGHT SIDE BUTTON */}
                        {isAdded ? (
                          <Pressable
                            className="flex-row items-center gap-1 border border-red-500 px-3 py-1 rounded-md"
                            style={{
                              borderColor: "#ef4444",
                              opacity: processingUserId === user.id ? 0.6 : 1,
                            }}
                            disabled={processingUserId === user.id}
                            onPress={() => handleRemovePlayer(user.id)}
                          >
                            {processingUserId === user.id ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <>
                                <Ionicons
                                  name="person-remove"
                                  size={15}
                                  color="#ef4444"
                                />
                                <ThemedText
                                  style={{
                                    color: "#ef4444",
                                    fontSize: 13,
                                    fontWeight: "700",
                                  }}
                                >
                                  Remove
                                </ThemedText>
                              </>
                            )}
                          </Pressable>
                        ) : (
                          <Pressable
                            className="flex-row items-center gap-1 border px-3 py-1 rounded-md"
                            style={{
                              borderColor: isLimitReached ? "#94a3b8" : "#3b82f6",
                              opacity:
                                isLimitReached || processingUserId === user.id
                                  ? 0.5
                                  : 1,
                            }}
                            disabled={
                              processingUserId === user.id || isLimitReached
                            }
                            onPress={() => handleAddPlayer(user.id)}
                          >
                            {processingUserId === user.id ? (
                              <ActivityIndicator size="small" color="#3b82f6" />
                            ) : (
                              <>
                                <Ionicons
                                  name="person-add"
                                  size={15}
                                  color={isLimitReached ? "#94a3b8" : "#3b82f6"}
                                />
                                <ThemedText
                                  style={{
                                    color: isLimitReached
                                      ? "#94a3b8"
                                      : "#3b82f6",
                                    fontSize: 13,
                                    fontWeight: "700",
                                  }}
                                >
                                  Add
                                </ThemedText>
                              </>
                            )}
                          </Pressable>
                        )}
                      </HStack>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </ThemedView>
    </>
  );
}
