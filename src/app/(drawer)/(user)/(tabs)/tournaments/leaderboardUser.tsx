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
import { Skeleton } from "@/components/Skeleton";

export default function LeaderboardUser() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeboxId, scoringType } =
    useLocalSearchParams();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const getScoringLabel = (scoringType: string) => {
    switch (scoringType) {
      case "double-peoria-stableford":
        return "Double Peoria Stableford";
      case "double-peoria":
        return "Double Peoria Net";
      case "double-peoria-net":
        return "Double Peoria Net";
      case "stableford":
        return "Stableford";
      case "excluded":
        return "Practice Round";
      default:
        return "Gross / Net";
    }
  };

  const getFront9 = (holes: any[]) => {
    return holes.filter((hole) => hole.holeNumber <= 9);
  };

  const getBack9 = (holes: any[]) => {
    return holes.filter((hole) => hole.holeNumber > 9);
  };

  const getTotalPar = (holes: any[]) => {
    return holes.reduce((total, hole) => total + hole.par, 0);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // getHolesByTeeBox
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
        className="px-3 items-center"
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
              lineHeight: 30,
            }}
          >
            Leaderboard:
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

        {/* RIGHT: Add Button */}
        <View style={{ width: 40 }} />
      </HStack>
    );
  };

  const RenderStatsSection = () => {
    const isDark = colorScheme === "dark";

    const bg = isDark ? "#0f172a" : "#ffffff";
    const cardBg = isDark
      ? "rgba(15, 23, 42, 0.7)"
      : "rgba(255, 255, 255, 0.7)";
    const border = isDark ? "#334155" : "#e2e8f0";

    const primaryText = isDark ? "#f1f5f9" : "#020617";
    const secondaryText = isDark ? "#94a3b8" : "#64748b";

    const StatCard = ({
      label,
      value,
      loading = false,
    }: {
      label: string;
      value: string | number;
      loading?: boolean;
    }) => (
      <View
        style={{
          flex: 1,
          backgroundColor: cardBg,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: border,
        }}
      >
        <ThemedText
          style={{
            fontSize: 11,
            color: secondaryText,
            fontWeight: "500",
            marginBottom: 6,
          }}
        >
          {label}
        </ThemedText>

        {loading ? (
          <Skeleton isDark={isDark} height={18} width={40} />
        ) : (
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: primaryText,
            }}
          >
            {value}
          </ThemedText>
        )}
      </View>
    );

    return (
      <View style={{ paddingHorizontal: 3, paddingVertical: 8 }}>
        {/* TOP TAGS */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          {/* Left Tag */}
          <View
            style={{
              backgroundColor: isDark ? "#134e4a" : "#d1fae5",
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#5eead4" : "#065f46",
              }}
            >
              TOURNAMENT SCOREBOARD
            </ThemedText>
          </View>

          {/* Right Badge */}
          <View
            style={{
              backgroundColor: isDark ? "#1e40af" : "#e0f2fe",
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#93c5fd" : "#0369a1",
              }}
            >
              {getScoringLabel(scoringType as string)}
            </ThemedText>
          </View>
        </View>

        {/* SUBTITLE */}
        <ThemedText
          style={{
            fontSize: 12,
            color: secondaryText,
            marginBottom: 14,
          }}
        >
          Hole-by-hole scoring with cleaner front nine, back nine, totals, and
          player stat sections.
        </ThemedText>

        {/* STATS GRID */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard
              label="PLAYERS"
              value={leaderboard.length}
              loading={loading}
            />
            <StatCard
              label="COURSE PAR"
              value={getTotalPar(holes)}
              loading={loading}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard
              label="FRONT / BACK"
              value={`${getFront9(holes).length} / ${getBack9(holes).length}`}
              loading={loading}
            />
            <StatCard label="SECRET HOLES" value="0/12" loading={loading} />
          </View>
        </View>
      </View>
    );
  };

  const PlayerCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
          borderColor: isDark ? "#333" : "#ddd",
        }}
      >
        {/* HEADER */}
        <HStack>
          <Skeleton isDark={isDark} height={30} width={30} borderRadius={15} />

          <VStack style={{ flex: 1, marginLeft: 10 }}>
            <Skeleton isDark={isDark} height={14} width="60%" />
            <Skeleton
              isDark={isDark}
              height={10}
              width="40%"
              style={{ marginTop: 4 }}
            />
          </VStack>

          <VStack style={{ alignItems: "flex-end" }}>
            <Skeleton isDark={isDark} height={14} width={30} />
            <Skeleton
              isDark={isDark}
              height={10}
              width={20}
              style={{ marginTop: 4 }}
            />
          </VStack>
        </HStack>

        {/* GRID (Front 9) */}
        <HStack style={{ marginTop: 12, justifyContent: "space-between" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <VStack key={i} style={{ alignItems: "center", flex: 1 }}>
              <Skeleton isDark={isDark} height={8} width={12} />
              <Skeleton
                isDark={isDark}
                height={28}
                width={28}
                borderRadius={14}
                style={{ marginTop: 4 }}
              />
            </VStack>
          ))}
        </HStack>

        {/* GRID (Back 9) */}
        <HStack style={{ marginTop: 10, justifyContent: "space-between" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <VStack key={i} style={{ alignItems: "center", flex: 1 }}>
              <Skeleton isDark={isDark} height={8} width={12} />
              <Skeleton
                isDark={isDark}
                height={28}
                width={28}
                borderRadius={14}
                style={{ marginTop: 4 }}
              />
            </VStack>
          ))}
        </HStack>

        {/* SUMMARY */}
        <HStack style={{ marginTop: 14, justifyContent: "space-between" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <VStack key={i} style={{ alignItems: "center", flex: 1 }}>
              <Skeleton isDark={isDark} height={14} width={30} />
              <Skeleton
                isDark={isDark}
                height={8}
                width={20}
                style={{ marginTop: 4 }}
              />
            </VStack>
          ))}
        </HStack>

        {/* EXTRA STATS */}
        <HStack style={{ marginTop: 12, justifyContent: "space-between" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <VStack key={i} style={{ alignItems: "center", flex: 1 }}>
              <Skeleton isDark={isDark} height={14} width={36} />
              <Skeleton
                isDark={isDark}
                height={8}
                width={24}
                style={{ marginTop: 4 }}
              />
            </VStack>
          ))}
        </HStack>
      </View>
    );
  };

  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        <RenderHeader />
        <Watermark />

        <ScrollView contentContainerStyle={{ padding: 12, marginBottom: 20 }}>
          <RenderStatsSection />

          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <PlayerCardSkeleton key={i} isDark={isDark} />
              ))}
            </>
          ) : (
            <>
              {leaderboard.map((player) => (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  holes={holes}
                  isDark={isDark}
                />
              ))}
            </>
          )}
        </ScrollView>
      </ThemedView>
    </>
  );
}

interface Player {
  userId: string | number;
  playerName: string;
  handicap: number;
  points: number;
  rank?: string | number;
  holeScores: Record<number, number>;
  front9: number;
  back9: number;
  gross: number;
  net: number;
  birdies: number;
  pars: number;
  eagles: number;
}

function PlayerCard({
  player,
  holes,
  isDark,
}: {
  player: Player;
  holes: any[];
  isDark: boolean;
}) {
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

      {/* STATS */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 12,
          rowGap: 12,
        }}
      >
        {[
          { label: "OUT", value: player.front9 },
          { label: "IN", value: player.back9 },
          { label: "GROSS", value: player.gross },
          { label: "NET", value: player.net },
          { label: "PTS", value: player.points },
          { label: "Birdies", value: player.birdies },
          { label: "Pars", value: player.pars },
          { label: "Eagles", value: player.eagles },
        ]
          .filter((s) => s.value !== undefined && s.value !== null)
          .map((stat, idx) => (
            <Stat key={idx} label={stat.label} value={stat.value} />
          ))}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
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
    minWidth: "18%",
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
