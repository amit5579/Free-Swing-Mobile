import React, { useState, useCallback } from "react";
import { Pressable, useColorScheme } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native";
import { getUsers, User } from "@/api/adminAPI/handicapSetup";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { Avatar } from "@/components/avatar";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";

export default function PlayerHandicapSetup() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setPlayers(data);

      // Auto-expand only the first card
      const initialExpanded = data.reduce((acc, player, index) => {
        acc[player.id.toString()] = index === 0;
        return acc;
      }, {} as { [key: string]: boolean });

      setExpanded(initialExpanded);
    } catch (error) {
      console.error("Fetch players error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ REFRESH ON FOCUS
  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
    }, [])
  );

  const togglePlayer = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />

      <VStack className="flex-1 px-4">

        {/* HEADER (FIXED) */}
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
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(139,195,74,0.2)" : "#D1FAE5",
              borderWidth: isDark ? 0 : 1,
              borderColor: "#A7F3D0",
            }}
          >
            <Ionicons name="people" size={14} color={isDark ? "#8bc34a" : "#059669"} />

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

        {/* SCROLLABLE CONTENT */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {loading ? (
            <Box className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#8bc34a" />
              <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>Loading Players...</ThemedText>
            </Box>
          ) : (
            <VStack space="md" className="pb-20">
              {players.length === 0 ? (
                <Box className="items-center py-10">
                  <ThemedText style={{ opacity: 0.5 }}>No players found</ThemedText>
                </Box>
              ) : players.map((player) => (
                <Box
                  key={player.id}
                  className="rounded-3xl border overflow-hidden mb-4 shadow-sm"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                    backgroundColor: isDark ? "rgba(22, 22, 24, 0.7)" : "rgba(255, 255, 255, 0.3)",
                    borderColor: isDark ? "#8bc34a" : "#F3F3F3",
                    borderLeftWidth: 6,
                    borderLeftColor: "#8BC34A",
                  }}
                >
                  {/* PLAYER HEADER */}
                  <Pressable onPress={() => togglePlayer(player.id.toString())} className="px-4 pt-4 pb-3">
                    <HStack className="items-center justify-between">

                      <HStack className="items-center">

                        {/* AVATAR LETTER */}
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
                          <ThemedText
                            style={{
                              fontWeight: "700",
                              fontSize: 16,
                              color: "#8bc34a",
                            }}
                          >
                            {player.username?.charAt(0).toUpperCase() || "?"}
                          </ThemedText>
                        </Avatar>

                        <ThemedText style={{ fontWeight: "700", fontSize: 16 }}>
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
                        style={{ marginLeft: 8 }}
                      />

                    </HStack>
                  </Pressable>

                  {/* DETAILS */}
                  {expanded[player.id.toString()] && (
                    <VStack className="px-4 pb-4">
                      <Divider style={{ marginBottom: 16, backgroundColor: isDark ? "#333" : "#F0F0F0" }} />
                      
                      <VStack space="md">
                        {/* EMAIL ROW */}
                        <HStack className="items-center justify-between">
                          <HStack className="items-center">
                            <Ionicons name="mail" size={16} color="#8bc34a" />
                            <ThemedText style={{ marginLeft: 10 }}>Email</ThemedText>
                          </HStack>
                          <ThemedText style={{ opacity: 0.6 }}>{player.email}</ThemedText>
                        </HStack>

                        {/* HANDICAP ROW */}
                        <HStack className="items-center justify-between py-1">
                          <HStack className="items-center">
                            <Ionicons name="trophy" size={16} color="#8bc34a" />
                            <ThemedText style={{ marginLeft: 10 }}>Current Handicap</ThemedText>
                          </HStack>
                          <ThemedText style={{ fontWeight: "800", color: "#8bc34a" }}>
                            {player.handicap}
                          </ThemedText>
                        </HStack>

                        {/* AVERAGE SCORE ROW */}
                        <HStack className="items-center justify-between py-1">
                          <HStack className="items-center">
                            <Ionicons name="analytics" size={16} color="#8bc34a" />
                            <ThemedText style={{ marginLeft: 10 }}>Average Score</ThemedText>
                          </HStack>
                          <ThemedText style={{ fontWeight: "800" }}>{player.averageScore}</ThemedText>
                        </HStack>

                        {/* ROLE ROW */}
                        <HStack className="items-center justify-between py-1">
                          <HStack className="items-center">
                            <Ionicons name="shield-checkmark" size={16} color="#8bc34a" />
                            <ThemedText style={{ marginLeft: 10 }}>Role</ThemedText>
                          </HStack>
                          <ThemedText style={{ opacity: 0.6 }}>{player.role || "Member"}</ThemedText>
                        </HStack>
                      </VStack>

                      <Divider style={{ marginVertical: 10, opacity: 0 }} />
                    </VStack>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </ScrollView>

      </VStack>
    </SafeAreaView>
  );
}