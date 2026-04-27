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
} from "@/api/admin/tournaments";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";


export default function managePlayers() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadActions, setLoadActions] = useState(false);
  const [tournamentsName, setTournamentName] = useState<any>();
  const [allPlayers, setAllPlayers] = useState<any>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<any>([]);

  const handleAdd = async (tournamentId: number, userId: number) => {
    try {
      await addPlayerToTournament(tournamentId, userId);
      setLoadActions(true);
      // update UI instantly
      setTournamentPlayers((prev: any) => [...prev, { userId }]);

      Toast.show({
        type: "success",
        text1: "Player added successfully",
      });
    } catch (err) {
      console.log(err);
       Toast.show({
        type: "error",
        text1: "Failed to add Player",
      });
    } finally {
      setLoadActions(false);
    }
  };

  async function handleRemove(tournamentId: number, userId: number) {
    try {
      // console.log("Removing player:", { tournamentId, userId });
      await removePlayerFromTournament(tournamentId, userId);

      setTournamentPlayers((prev: any) =>
        prev.filter((p: any) => p.userId !== userId),
      );
      Toast.show({
        type: "success",
        text1: "Player removed successfully",
      });
    } catch (err) {
      console.log("Remove player error:", err);
    } finally {
      setLoadActions(false);
    }
  }

  const fetchPlayers = async () => {
    try {
      setLoading(true);

      const data = await getTournamentPlayers(Number(tournamentId));

      const allPlayersData = await getAllPlayers();
      setTournamentPlayers(data);
      setAllPlayers(allPlayersData);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
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

  const PlayerCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <VStack className="gap-2">
          {/* Username */}
          <Skeleton isDark={isDark} height={16} width="50%" />

          {/* Email */}
          <Skeleton isDark={isDark} height={12} width="70%" />

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? "#262626" : "#e5e5e5",
              marginVertical: 8,
            }}
          />

          {/* Bottom Row */}
          <HStack className="justify-between items-center">
            <VStack>
              <Skeleton isDark={isDark} height={10} width={60} />
              <Skeleton
                isDark={isDark}
                height={14}
                width={40}
                style={{ marginTop: 4 }}
              />
            </VStack>

            {/* Button */}
            <Skeleton isDark={isDark} height={32} width={80} borderRadius={8} />
          </HStack>
        </VStack>
      </Box>
    );
  };

 const renderHeader = () => (
  <Box
    style={{
      backgroundColor: isDark ? "#020617" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
    }}
  >
    <HStack
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* 🔙 BACK */}
      <Pressable
        onPress={() => routePage.back()}
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

      {/* 🧠 TITLE ONLY (NO LABEL) */}
      {loading ? (
        <Skeleton
          isDark={isDark}
          height={18}
          width={160}
          style={{ borderRadius: 6 }}
        />
      ) : (
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            marginHorizontal: 8,
            color: isDark ? "#fff" : "#020617",
          }}
        >
          {tournamentsName}
        </ThemedText>
      )}

      {/* ⚖️ RIGHT SPACER */}
      <View style={{ width: 40 }} />
    </HStack>
  </Box>
);


  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <Watermark />
      {/* HEADER */}
      {renderHeader()}

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="p-4 gap-4">
          {loading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <PlayerCardSkeleton key={i} isDark={isDark} />
              ))}
            </>
          ) : (
            <>
              {allPlayers.map((player: any) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  tournamentPlayers={tournamentPlayers}
                  setTournamentPlayers={setTournamentPlayers}
                  loadActions={loadActions}
                  tournamentId={tournamentId}
                  handleAdd={handleAdd}
                  handleRemove={handleRemove}
                  isDark={isDark}
                />
              ))}
            </>
          )}
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}

function PlayerCard({
  player,
  tournamentPlayers,
  loadActions,
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
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
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
              {player.handicap == 0 ? "-" : player.handicap}
            </ThemedText>
          </VStack>
          {/*  */}

          {isInTournament ? (
            <Pressable
              onPress={() => handleRemove(Number(tournamentId), Number(player.id))}
              style={[styles.button, styles.removeButton]}
            >
              <ThemedText
                style={{
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {loadActions ? "Removing..." : "X Remove"}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => handleAdd(Number(tournamentId), Number(player.id))}
              style={[styles.button, styles.addButton]}
            >
              <ThemedText
                style={{
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {loadActions ? "Adding..." : "+ Add"}
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
