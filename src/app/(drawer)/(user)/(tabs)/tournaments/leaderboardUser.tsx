import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";

import { getLeaderboard, getTeeboxDetails } from "@/api/admin/tournaments";
import { Ionicons } from "@expo/vector-icons";

export default function LeaderboardUser() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeboxId } = useLocalSearchParams();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const lb = await getLeaderboard(Number(tournamentId));
      const teebox = await getTeeboxDetails(Number(teeboxId));

      setLeaderboard(lb);
      setHoles(teebox);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const RenderHeader = () => {
    return (
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
          Leaderboard: {tournamentName}
        </ThemedText>

        {/* RIGHT: Add Button */}
        <View style={{ width: 40 }} />
      </HStack>
    );
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <RenderHeader />
        <Watermark />
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 10 }}>
          Loading leaderboard...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        <RenderHeader />
        <Watermark />

        <ScrollView contentContainerStyle={{ padding: 12, marginBottom:20 }}>
          {leaderboard.map((player) => (
            <PlayerCard
              key={player.userId}
              player={player}
              holes={holes}
              isDark={isDark}
            />
          ))}
        </ScrollView>
      </ThemedView>
    </>
  );
}

function PlayerCard({ player, holes, isDark }: any) {
  return (
    <View style={[styles.card, { borderColor: isDark ? "#333" : "#ddd" }]}>
      {/* HEADER */}
      <HStack style={styles.header}>
        <View style={styles.rank}>
          <ThemedText style={{ fontWeight: "700" }}>
            {player.rank || "-"}
          </ThemedText>
        </View>

        <VStack style={{ flex: 1 }}>
          <ThemedText style={styles.name}>{player.playerName}</ThemedText>
          <ThemedText style={styles.sub}>HC: {player.handicap}</ThemedText>
        </VStack>

        <VStack style={{ alignItems: "flex-end" }}>
          <ThemedText style={styles.points}>{player.points}</ThemedText>
          <ThemedText style={styles.sub}>PTS</ThemedText>
        </VStack>
      </HStack>

      {/* HOLES GRID */}
      <View style={{ marginTop: 10 }}>
        {/* FRONT 9 */}
        <HStack style={styles.gridRow}>
          {Array.from({ length: 9 }).map((_, i) => {
            const holeNum = i + 1;
            const score = player.holeScores?.[holeNum];

            return (
              <View key={holeNum} style={styles.gridCell}>
                <ThemedText style={styles.holeNumber}>{holeNum}</ThemedText>
                <View
                  style={[
                    styles.scoreCircle,
                    getScoreStyle(score, holes[i]?.par),
                  ]}
                >
                  <ThemedText>{score ?? "-"}</ThemedText>
                </View>
              </View>
            );
          })}
        </HStack>

        {/* BACK 9 */}
        <HStack style={styles.gridRow}>
          {Array.from({ length: 9 }).map((_, i) => {
            const holeNum = i + 10;
            const score = player.holeScores?.[holeNum];

            return (
              <View key={holeNum} style={styles.gridCell}>
                <ThemedText style={styles.holeNumber}>{holeNum}</ThemedText>
                <View
                  style={[
                    styles.scoreCircle,
                    getScoreStyle(score, holes[i + 9]?.par),
                  ]}
                >
                  <ThemedText>{score ?? "-"}</ThemedText>
                </View>
              </View>
            );
          })}
        </HStack>
      </View>

      {/* SUMMARY */}
      <HStack style={styles.summary}>
        <Stat label="OUT" value={player.front9} />
        <Stat label="IN" value={player.back9} />
        <Stat label="GROSS" value={player.gross} />
        <Stat label="NET" value={player.net} />
        <Stat label="PTS" value={player.points} />
      </HStack>

      {/* EXTRA STATS */}
      <HStack style={styles.summary}>
        <Stat label="Birdies" value={player.birdies} />
        <Stat label="Pars" value={player.pars} />
        <Stat label="Eagles" value={player.eagles} />
      </HStack>
    </View>
  );
}

function Stat({ label, value }: any) {
  return (
    <VStack style={styles.stat}>
      <ThemedText style={styles.statValue}>{value ?? "-"}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </VStack>
  );
}

function getScoreStyle(score: number, par: number): ViewStyle {
  if (!score || !par) return {};

  const diff = score - par;

  if (diff <= -2) return { borderColor: "#166534", borderWidth: 2 }; // eagle
  if (diff === -1) return { borderColor: "#16a34a", borderWidth: 2 }; // birdie
  if (diff === 0)
    return { borderColor: "#9ca3af", borderStyle: "dashed", borderWidth: 1 };
  if (diff === 1) return { borderColor: "#ef4444", borderWidth: 2 };
  if (diff >= 2) return { borderColor: "#dc2626", borderWidth: 2 };

  return {};
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  header: {
    alignItems: "center",
  },

  rank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#84cc16",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  sub: {
    fontSize: 12,
    opacity: 0.6,
  },

  points: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
  },

  holeCell: {
    alignItems: "center",
    marginRight: 10,
  },

  holeNumber: {
    fontSize: 11,
    opacity: 0.6,
  },

  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginTop: 4,
  },

  summary: {
    marginTop: 12,
    justifyContent: "space-between",
  },

  stat: {
    alignItems: "center",
    flex: 1,
  },

  statValue: {
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 8,
  },

  gridCell: {
    alignItems: "center",
    flex: 1,
  },
});
