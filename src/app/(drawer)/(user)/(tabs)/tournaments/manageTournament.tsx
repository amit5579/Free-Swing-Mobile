import {
  getAddedPlayers,
  addPlayerToTournament,
  getMembersList,
  removePlayerFromTournament,
} from "@/api/admin/tournaments";
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
import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function ManageTournament() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [addedPlayers, setAddedPlayers] = useState<any>([]);
  const [search, setSearch] = useState("");

  const handleAddPlayer = async (userId: number) => {
    try {
      setLoading(true);
      await addPlayerToTournament(Number(tournamentId), userId);
      setAddedPlayers((prev: any[]) => [...prev, { userId, id: userId }]); // Optimistic update or at least tracking
      Toast.show({
        type: "success",
        text1: "Player added successfully",
      });
    } catch (error) {
      console.error("Adding user to tournament Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to add player",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (userId: number) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const membersData = await getMembersList();
      const addedPlayersData = await getAddedPlayers(Number(tournamentId));
      //  console.log("addedPlayersData",addedPlayersData);

      setMembers(membersData);
      setAddedPlayers(addedPlayersData);

      // console.log("Fetching Tournament players list:", members);
    } catch (error) {
      console.error("Fetching tournament players Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(
    (user: any) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const isSearching = search.length > 0;
  const dataToShow = isSearching ? filteredMembers : members;

  const RenderHeader = () => {
    return (
      <HStack
        className="px-3 mt-3 items-center"
        style={{ justifyContent: "space-between" }}
      >
        {/* LEFT: Back button */}
        <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={colorScheme === "dark" ? "#ffffff" : "#020617"}
          />
        </Pressable>

        {/* CENTER: Title */}
        <HStack
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Manage :
          </ThemedText>

          {loading ? (
            <Skeleton
              isDark={isDark}
              height={18}
              width={120}
              style={{ marginLeft: 8 }}
            />
          ) : (
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
                marginLeft: 6,
              }}
            >
              {tournamentName}
            </ThemedText>
          )}
        </HStack>

        {/* RIGHT*/}
        <View style={{ width: 40 }} />
      </HStack>
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
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {/* 🔍 Search Input */}
            {loading ? (
              <SearchSkeleton isDark={isDark} />
            ) : (
              <>
                <HStack className="bg-[#e0f2fe] border border-[#7dd3fc] rounded-lg p-3 items-start gap-2 mb-2">
                  {/* Icon */}
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#0284c7"
                  />

                  {/* Text */}
                  <Text className="flex-1 text-[13px] text-[#0369a1] leading-5">
                    You are the creator of this tournament. You can add up to{" "}
                    <Text className="font-semibold">4 members</Text>.
                  </Text>
                </HStack>
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

            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <UserCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {/* ❌ No Users Found */}
                {isSearching || dataToShow.length === 0 ? (
                  <ThemedText style={{ textAlign: "center", marginTop: 20 }}>
                    No users found
                  </ThemedText>
                ) : (
                  dataToShow.map((user: any) => (
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
                        //   backgroundColor: isDark ? "#111827" : "#ffffff",
                      }}
                    >
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* LEFT SIDE */}
                        <View>
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
                        {addedPlayers.some(
                          (p: any) => p.userId === user.id || p.id === user.id,
                        ) ? (
                          <Pressable
                            className="flex-row items-center gap-1 border border-red-500 px-3 py-1 rounded-md"
                            style={{ borderColor: "#ef4444" }}
                            onPress={() => handleRemovePlayer(user.id)}
                          >
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
                          </Pressable>
                        ) : (
                          <Pressable
                            className="flex-row items-center gap-1 border border-blue-500 px-3 py-1 rounded-md"
                            style={{ borderColor: "#3b82f6" }}
                            onPress={() => handleAddPlayer(user.id)}
                          >
                            <Ionicons
                              name="person-add"
                              size={15}
                              color="#3b82f6"
                            />
                            <ThemedText
                              style={{
                                color: "#3b82f6",
                                fontSize: 13,
                                fontWeight: "700",
                              }}
                            >
                              Add
                            </ThemedText>
                          </Pressable>
                        )}
                      </HStack>
                    </View>
                  ))
                )}
                {/* ✅ Done Button */}
                {/* {isSearching && dataToShow.length === 0 ? (
                  ""
                ) : (
                  <Pressable
                    style={{
                      marginVertical: 20,
                      alignSelf: "center",
                      borderWidth: 1,
                      borderColor: "#9ca3af",
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <ThemedText>Done</ThemedText>
                  </Pressable>
                )} */}
              </>
            )}
          </ScrollView>
        </ScrollView>
      </ThemedView>
    </>
  );
}
