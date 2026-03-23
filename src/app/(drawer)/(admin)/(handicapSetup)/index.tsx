import React, { useState, useCallback } from "react";
import { Pressable, useColorScheme } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native";
import { getUsers, User } from "@/api/admin/handicapSetup";
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
  style={{
    flex: 1,
  }}
>
  <Watermark />

  <VStack className="flex-1 p-4">

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
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          // backgroundColor: "rgba(139,195,74,0.15)",
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

    {/* SCROLLABLE CONTENT */}
    <ScrollView showsVerticalScrollIndicator={false}>

      <VStack space="md" className="pb-20">
        {players.map((player) => (
          <Box
            key={player.id}
            className="p-4 rounded-2xl mb-3"
            style={{
              // backgroundColor: isDark
              //   ? "rgba(30,30,30,0.75)"
              //   : "rgba(255,255,255,0.75)",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
            }}
          >
            {/* PLAYER HEADER */}
            <Pressable onPress={() => togglePlayer(player.id)}>
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
        </ScrollView>

  </VStack>
</SafeAreaView>
  );
}