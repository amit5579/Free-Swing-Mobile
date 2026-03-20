import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addPlayerToTournament,
  getAllPlayers,
  getTournamentPlayers,
  removePlayerFromTournament,
} from "@/api/tournaments";

export default function managePlayers() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [tournamentsName, setTournamentName] = useState<any>();
  const [allPlayers, setAllPlayers] = useState<any>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<any>([]);

  const handleAdd = async (tournamentId: number, userId: number) => {
    try {
      await addPlayerToTournament(tournamentId, userId);
      console.log("ADD payload:", {
        tournamentId: tournamentId,
        userId: userId,
      });
      // update UI instantly
      setTournamentPlayers((prev: any) => [...prev, { userId }]);
    } catch (err) {
      console.log(err);
    }
  };

  async function handleRemove(userId: any) {
    try {
      console.log("Removing player:", { tournamentId, userId });
      await removePlayerFromTournament(tournamentId, userId);

      setTournamentPlayers((prev: any) =>
        prev.filter((p: any) => p.userId !== userId),
      );
    } catch (err) {
      console.log("Remove player error:", err);
    }
  }

  const fetchPlayers = async () => {
    try {
      const data = await getTournamentPlayers(Number(tournamentId));

      const allPlayersData = await getAllPlayers();
      setTournamentPlayers(data);
      setAllPlayers(allPlayersData);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  useEffect(() => {
    setTournamentName(tournamentName);
    fetchPlayers();
  }, []);

  // const togglePlayer = (id: number) => {
  //   setTournamentPlayers((prev: any) =>
  //     prev.map((player: any) =>
  //       player.id === id ? { ...player, added: !player.added } : player,
  //     ),
  //   );
  // };

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <Watermark />
      {/* HEADER */}
      <HStack
        className="px-3 pt-5 pb-3 items-center"
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
        <ThemedText
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 30,
          }}
        >
          Manage Players: {tournamentsName}
        </ThemedText>

        {/* RIGHT: Add Button */}
        <View style={{ width: 40 }} />
      </HStack>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="p-4 gap-4">
          {allPlayers.map((player: any) => (
            <PlayerCard
              key={player.id}
              player={player}
              tournamentPlayers={tournamentPlayers}
              setTournamentPlayers={setTournamentPlayers}
              tournamentId={tournamentId}
              handleAdd={handleAdd}
              handleRemove={handleRemove}
              isDark={isDark}
            />
          ))}
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}

function PlayerCard({
  player,
  tournamentPlayers,
  handleAdd,
  handleRemove,
  isDark,
  tournamentId,
}: any) {
  const tournamentPlayerIds = new Set(
    tournamentPlayers.map((p: any) => p.userId),
  );
  const isInTournament = tournamentPlayerIds.has(player.id);

  return (
    <Box
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <VStack className="gap-2">
        {/* Username */}
        <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
          {player.username}
        </ThemedText>

        {/* Email */}
        <ThemedText style={{ opacity: 0.7 }}>{player.email}</ThemedText>

        <Divider className="my-2" />

        {/* Handicap + Button */}
        <HStack className="justify-between items-center">
          <VStack>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              Handicap
            </ThemedText>

            <ThemedText style={{ fontWeight: "600" }}>
              {player.handicap}
            </ThemedText>
          </VStack>
          {/*  */}

          {isInTournament ? (
            <Pressable
              onPress={() => handleRemove(player.id)}
              style={[styles.button, styles.removeButton]}
            >
              <ThemedText
                style={{
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {"X Remove"}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => handleAdd(Number(tournamentId), player.id)}
              style={[styles.button, styles.addButton]}
            >
              <ThemedText
                style={{
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {"+ Add"}
              </ThemedText>
            </Pressable>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  addButton: {
    backgroundColor: "#8bc34a",
  },

  removeButton: {
    backgroundColor: "#ef4444",
  },
});
