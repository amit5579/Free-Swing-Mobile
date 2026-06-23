import React, { useState, useEffect } from "react";
import {
  Pressable,
  useColorScheme,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { Avatar, AvatarImage } from "@/components/avatar";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import {
  getUsers,
  User,
  updateHandicapApi,
} from "@/api/modules/admin/handicapSetup.api";
import { Skeleton } from "@/components/Skeleton";

export default function PlayerHandicapSetup() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [players, setPlayers] = useState<User[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const [editedHandicaps, setEditedHandicaps] = useState<{
    [key: string]: number;
  }>({});
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({});

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPlayers();
    setRefreshing(false);
  }, []);

  const fetchPlayers = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data = await getUsers();
      setPlayers(data);

      if (searchQuery.trim() === "") {
        setFilteredPlayers(data);
      } else {
        const filtered = data.filter(
          (p) =>
            p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        setFilteredPlayers(filtered);
      }

      if (Object.keys(expanded).length === 0) {
        const initialExpanded = data.reduce(
          (acc, player, index) => {
            acc[player.id.toString()] = index === 0;
            return acc;
          },
          {} as { [key: string]: boolean },
        );
        setExpanded(initialExpanded);
      }
    } catch (error) {
      console.error("Fetch players error:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(
        (p) =>
          p.username.toLowerCase().includes(query.toLowerCase()) ||
          p.email.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredPlayers(filtered);
    }
  };

  useEffect(() => {
    fetchPlayers(true);
  }, []);

  const togglePlayer = (id: number | string) => {
    setExpanded((prev) => ({
      ...prev,
      [id.toString()]: !prev[id.toString()],
    }));

    if (editedHandicaps[id.toString()] === undefined) {
      const player = players.find((p) => p.id === id);
      if (player) {
        setEditedHandicaps((prev) => ({
          ...prev,
          [id.toString()]: player.handicap || 0,
        }));
      }
    }
  };

  const incrementHandicap = (id: string | number) => {
    setEditedHandicaps((prev) => {
      const current = prev[id.toString()] ?? 0;
      if (current >= 54) return prev;
      return { ...prev, [id.toString()]: current + 1 };
    });
  };

  const decrementHandicap = (id: string | number) => {
    setEditedHandicaps((prev) => {
      const current = prev[id.toString()] ?? 0;
      if (current <= 0) return prev;
      return { ...prev, [id.toString()]: current - 1 };
    });
  };

  const resetHandicap = (id: string | number) => {
    const player = players.find((p) => p.id === id);
    if (player) {
      setEditedHandicaps((prev) => ({
        ...prev,
        [id.toString()]: player.handicap,
      }));
    }
  };

  const saveHandicap = async (id: string | number) => {
    const newVal = editedHandicaps[id.toString()];
    if (newVal === undefined) return;

    try {
      setIsSaving((prev) => ({ ...prev, [id.toString()]: true }));
      const success = await updateHandicapApi(id, newVal);
      if (success) {
        setPlayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, handicap: newVal } : p)),
        );
        setFilteredPlayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, handicap: newVal } : p)),
        );
      } else {
        Alert.alert("Error", "Failed to update handicap. Please try again.");
      }
    } catch (error) {
      console.error("Save handicap manual error:", error);
    } finally {
      setIsSaving((prev) => ({ ...prev, [id.toString()]: false }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Watermark />
      <VStack className="flex-1 p-4">
        <HStack className="items-center justify-between mb-4">
          <HStack className="items-center">
            <Pressable
              onPress={() => router.back()}
              style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
              }}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={isDark ? "#fff" : "#020617"}
              />
            </Pressable>
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "900",
                marginLeft: 10,
                color: isDark ? "#fff" : "#1e293b",
              }}
            >
              Handicap Setup
            </ThemedText>
          </HStack>
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Ionicons name="people-outline" size={16} color="#8bc34a" />
            <ThemedText
              style={{
                color: isDark ? "#fff" : "#065f46",
                fontWeight: "800",
                marginLeft: 4,
                fontSize: 12,
              }}
            >
              {players.length} live
            </ThemedText>
          </Box>
        </HStack>

        <Box
          style={{
            marginBottom: 20,
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: isDark ? "#333" : "#e2e8f0",
          }}
        >
          <HStack className="items-center">
            <Ionicons
              name="search"
              size={20}
              color={isDark ? "#8bc34a" : "#64748b"}
            />
            <TextInput
              placeholder="Search players..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={isDark ? "#666" : "#94a3b8"}
              style={{
                flex: 1,
                height: 44,
                color: isDark ? "#fff" : "#1e293b",
                fontSize: 16,
                paddingHorizontal: 12,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearch("")}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </Pressable>
            )}
          </HStack>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8bc34a"
              colors={["#8bc34a"]}
            />
          }
        >
          {loading ? (
            <VStack style={{ gap: 10 }}>
              {[1, 2, 3, 4].map((key) => (
                <Box
                  key={key}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(26,26,26,0.85)"
                      : "rgba(255,255,255,0.85)",
                    borderRadius: 14,
                    borderLeftWidth: 4,
                    borderLeftColor: "#8BC34A",
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? "#8BC34A" : "transparent",
                    padding: 10,
                    marginBottom: 8,
                  }}
                >
                  <HStack className="items-center justify-between">
                    <HStack className="items-center" style={{ flex: 1 }}>
                      <Skeleton
                        isDark={isDark}
                        width={40}
                        height={40}
                        borderRadius={20}
                        style={{ marginRight: 10 }}
                      />
                      <VStack style={{ gap: 5 }}>
                        <Skeleton
                          isDark={isDark}
                          width={130}
                          height={15}
                          borderRadius={6}
                        />
                        <Skeleton
                          isDark={isDark}
                          width={80}
                          height={10}
                          borderRadius={4}
                        />
                      </VStack>
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <VStack space="md" className="pb-20">
              {filteredPlayers.map((player) => {
                const currentEdited =
                  editedHandicaps[player.id.toString()] ?? player.handicap;
                const isDirty = currentEdited !== player.handicap;

                return (
                  <Box
                    key={player.id}
                    style={{
                      backgroundColor: isDark
                        ? "rgba(26,26,26,0.85)"
                        : "rgba(255,255,255,0.85)",
                      borderRadius: 14,
                      borderLeftWidth: 4,
                      borderLeftColor: "#8BC34A",
                      padding: 10,
                      marginBottom: 8,
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark ? "#8BC34A" : "transparent",
                    }}
                  >
                    <Pressable onPress={() => togglePlayer(player.id)}>
                      <HStack className="items-center justify-between">
                        <HStack className="items-center">
                          <Avatar
                            size="md"
                            style={{
                              borderWidth: 2,
                              borderColor: "#8bc34a",
                              marginRight: 10,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(139,195,74,0.15)",
                            }}
                          >
                            {player.profilePictureUrl ? (
                              <AvatarImage
                                source={{ uri: player.profilePictureUrl }}
                              />
                            ) : (
                              <ThemedText
                                style={{
                                  fontWeight: "700",
                                  fontSize: 16,
                                  color: "#8bc34a",
                                }}
                              >
                                {player.username?.charAt(0).toUpperCase() ||
                                  "?"}
                              </ThemedText>
                            )}
                          </Avatar>
                          <ThemedText
                            style={{ fontWeight: "700", fontSize: 16 }}
                          >
                            {player.username}
                          </ThemedText>
                        </HStack>
                        <Ionicons
                          name={
                            expanded[player.id.toString()]
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={isDark ? "#8BC34A" : "#666"}
                        />
                      </HStack>
                    </Pressable>

                    {expanded[player.id.toString()] && (
                      <VStack style={{ paddingTop: 2, paddingBottom: 2 }}>
                        <Divider
                          style={{
                            marginVertical: 10,
                            backgroundColor: isDark ? "#333" : "#F0F0F0",
                          }}
                        />
                        <VStack space="md">
                          <HStack className="items-center justify-between">
                            <HStack className="items-center">
                              <Ionicons name="mail" size={16} color="#8bc34a" />
                              <ThemedText
                                style={{
                                  fontWeight: "700",
                                  fontSize: 13,
                                  color: isDark ? "#fff" : "#1e293b",
                                  marginLeft: 10,
                                }}
                              >
                                Email
                              </ThemedText>
                            </HStack>
                            <ThemedText style={{ opacity: 0.6, fontSize: 13 }}>
                              {player.email}
                            </ThemedText>
                          </HStack>

                          <HStack className="items-center justify-between">
                            <HStack className="items-center">
                              <Ionicons
                                name="trophy"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText
                                style={{
                                  fontWeight: "700",
                                  fontSize: 13,
                                  color: isDark ? "#fff" : "#1e293b",
                                  marginLeft: 10,
                                }}
                              >
                                Current Handicap
                              </ThemedText>
                            </HStack>
                            <ThemedText
                              style={{
                                fontWeight: "800",
                                color: "#8bc34a",
                                fontSize: 14,
                              }}
                            >
                              {player.handicap}
                            </ThemedText>
                          </HStack>

                          <HStack className="items-center justify-between">
                            <HStack className="items-center">
                              <Ionicons
                                name="calculator"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText
                                style={{
                                  fontWeight: "700",
                                  fontSize: 13,
                                  color: isDark ? "#fff" : "#1e293b",
                                  marginLeft: 10,
                                }}
                              >
                                Calculated Handicap
                              </ThemedText>
                            </HStack>
                            <ThemedText
                              style={{ fontWeight: "800", fontSize: 14 }}
                            >
                              {player.calculatedHandicap}
                            </ThemedText>
                          </HStack>

                          <HStack className="items-center justify-between">
                            <HStack className="items-center">
                              <Ionicons
                                name="shield-checkmark"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText
                                style={{
                                  fontWeight: "700",
                                  fontSize: 13,
                                  color: isDark ? "#fff" : "#1e293b",
                                  marginLeft: 10,
                                }}
                              >
                                Role
                              </ThemedText>
                            </HStack>
                            <ThemedText style={{ opacity: 0.6, fontSize: 13 }}>
                              {player.role || "Member"}
                            </ThemedText>
                          </HStack>

                          <Divider
                            style={{ marginVertical: 4, opacity: 0.3 }}
                          />

                          <HStack className="items-center justify-between">
                            <HStack className="items-center">
                              <Ionicons
                                name="settings-outline"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  fontSize: 13,
                                  color: "#8bc34a",
                                  marginLeft: 10,
                                }}
                              >
                                Set Handicap
                              </ThemedText>
                            </HStack>
                            <HStack
                              className="items-center"
                              style={{ gap: 12 }}
                            >
                              <Pressable
                                onPress={() => decrementHandicap(player.id)}
                                disabled={
                                  currentEdited === 0 ||
                                  isSaving[player.id.toString()]
                                }
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 10,
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "#f8fafc",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 1,
                                  borderColor: isDark ? "#444" : "#e2e8f0",
                                  opacity: currentEdited === 0 ? 0.5 : 1,
                                }}
                              >
                                <Ionicons
                                  name="remove"
                                  size={20}
                                  color={isDark ? "#fff" : "#1e293b"}
                                />
                              </Pressable>
                              <Box
                                style={{ minWidth: 24, alignItems: "center" }}
                              >
                                <ThemedText
                                  style={{
                                    fontWeight: "900",
                                    fontSize: 18,
                                    color: "#8bc34a",
                                  }}
                                >
                                  {currentEdited}
                                </ThemedText>
                              </Box>
                              <Pressable
                                onPress={() => incrementHandicap(player.id)}
                                disabled={
                                  currentEdited === 54 ||
                                  isSaving[player.id.toString()]
                                }
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 10,
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "#f8fafc",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 1,
                                  borderColor: isDark ? "#444" : "#e2e8f0",
                                  opacity: currentEdited === 54 ? 0.5 : 1,
                                }}
                              >
                                <Ionicons
                                  name="add"
                                  size={20}
                                  color={isDark ? "#fff" : "#1e293b"}
                                />
                              </Pressable>
                            </HStack>
                          </HStack>

                          <Divider
                            style={{
                              marginVertical: 4,
                              backgroundColor: isDark ? "#333" : "#F0F0F0",
                            }}
                          />

                          <HStack
                            className="items-center justify-end"
                            style={{ marginTop: 4 }}
                          >
                            <HStack
                              className="items-center"
                              style={{ gap: 10 }}
                            >
                              {isDirty && (
                                <Pressable
                                  onPress={() => resetHandicap(player.id)}
                                  disabled={isSaving[player.id.toString()]}
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 10,
                                    backgroundColor: isDark
                                      ? "rgba(255,255,255,0.05)"
                                      : "#f1f5f9",
                                    borderWidth: 1,
                                    borderColor: isDark ? "#444" : "#cbd5e1",
                                  }}
                                >
                                  <ThemedText
                                    style={{
                                      fontSize: 12,
                                      fontWeight: "800",
                                      color: isDark ? "#cbd5e1" : "#64748b",
                                    }}
                                  >
                                    Reset
                                  </ThemedText>
                                </Pressable>
                              )}
                              <Pressable
                                onPress={() => saveHandicap(player.id)}
                                disabled={
                                  isSaving[player.id.toString()] || !isDirty
                                }
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 10,
                                  backgroundColor: !isDirty
                                    ? isDark
                                      ? "rgba(139,195,74,0.1)"
                                      : "#f0fdf4"
                                    : "#8bc34a",
                                  borderWidth: 1,
                                  borderColor: "#8bc34a",
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                {isSaving[player.id.toString()] ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                  />
                                ) : (
                                  <>
                                    <Ionicons
                                      name={
                                        !isDirty
                                          ? "checkmark-circle"
                                          : "save-outline"
                                      }
                                      size={16}
                                      color={!isDirty ? "#8bc34a" : "#fff"}
                                      style={{ marginRight: 6 }}
                                    />
                                    <ThemedText
                                      style={{
                                        fontSize: 12,
                                        fontWeight: "800",
                                        color: !isDirty ? "#8bc34a" : "#fff",
                                      }}
                                    >
                                      {!isDirty ? "Saved" : "Save Handicap"}
                                    </ThemedText>
                                  </>
                                )}
                              </Pressable>
                            </HStack>
                          </HStack>
                        </VStack>
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
