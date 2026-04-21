import React, { useEffect, useMemo, useState } from "react";
import {
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
        className="px-3 items-center mt-3"
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
            marginHorizontal: 10,
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
            marginVertical: 14,
            marginHorizontal: 10,
          }}
        >
          Hole-by-hole scoring with cleaner front nine, back nine, totals, and
          player stat sections.
        </ThemedText>

        {/* STATS GRID */}
        {/* <View style={{ gap: 12 }}>
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
        </View> */}
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

  const RANK_WIDTH = 40;
  const PLAYER_WIDTH = 90;
  const HCP_WIDTH = 50;
  const HOLE_WIDTH = 35;
  const TOTAL_WIDTH = 45;
  const STAT_WIDTH = 55;

  const LEFT_FIXED_WIDTH = RANK_WIDTH + PLAYER_WIDTH + HCP_WIDTH;


  const rightContentWidth = useMemo(() => {
    const holeCols = HOLE_WIDTH * 18;
    const totals = TOTAL_WIDTH * 2;
    const stats = STAT_WIDTH * 6; // GROSS, NET, PTS, EGL, BRD, PAR
    return holeCols + totals + stats;
  }, []);

  const TableHeaderLeft = () => (
    <HStack
      style={{
        height: 45,
        width: LEFT_FIXED_WIDTH,
        backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
        borderRightWidth: 1,
        borderColor: isDark ? "#334155" : "#e2e8f0",
      }}
    >
      <ThemedText style={[styles.headerText, { width: RANK_WIDTH }]}>
        RNK
      </ThemedText>
      <ThemedText
        style={[
          styles.headerText,
          { width: PLAYER_WIDTH, textAlign: "left", paddingLeft: 10 },
        ]}
      >
        PLAYER
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: HCP_WIDTH }]}>
        HCP
      </ThemedText>
    </HStack>
  );

  const TableHeaderRight = () => (
    <HStack
      style={{
        height: 45,
        width: rightContentWidth,
        backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <ThemedText key={i} style={[styles.headerText, { width: HOLE_WIDTH }]}>
          {i + 1}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.headerText, { width: TOTAL_WIDTH, fontWeight: "800" }]}
      >
        OUT
      </ThemedText>
      {Array.from({ length: 9 }).map((_, i) => (
        <ThemedText
          key={i + 9}
          style={[styles.headerText, { width: HOLE_WIDTH }]}
        >
          {i + 10}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.headerText, { width: TOTAL_WIDTH, fontWeight: "800" }]}
      >
        IN
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800" }]}
      >
        GROSS
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800" }]}
      >
        NET
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800" }]}
      >
        PTS
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: STAT_WIDTH }]}>
        EGL
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: STAT_WIDTH }]}>
        BRD
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: STAT_WIDTH }]}>
        PAR
      </ThemedText>
    </HStack>
  );

  const InfoRowLeft = ({ label }: { label: string }) => (
    <HStack
      style={{
        height: 40,
        width: LEFT_FIXED_WIDTH,
        borderBottomWidth: 1,
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        borderRightWidth: 1,
        backgroundColor: isDark ? "#0b1220" : "#ffffff",
      }}
    >
      <View style={{ width: RANK_WIDTH }} />
      <ThemedText style={[styles.infoLabel, { width: PLAYER_WIDTH }]}>
        {label}
      </ThemedText>
      <View style={{ width: HCP_WIDTH }} />
    </HStack>
  );

  const InfoRowRight = ({ data, type }: { data: any[]; type: "par" | "si" }) => (
    <HStack
      style={{
        height: 40,
        width: rightContentWidth,
        borderBottomWidth: 1,
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        backgroundColor: isDark ? "#0b1220" : "#ffffff",
      }}
    >
      {data.slice(0, 9).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.handicap}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.slice(0, 9).reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      {data.slice(9, 18).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.handicap}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.slice(9, 18).reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      <ThemedText
        style={[styles.infoCellText, { width: STAT_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      <View style={{ width: STAT_WIDTH * 5 }} />
    </HStack>
  );

  const PlayerRowLeft = ({ player, index }: { player: any; index: number }) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? isDark
        ? "#0f172a"
        : "#fff"
      : isDark
        ? "#1e293b"
        : "#f8fafc";

    return (
      <HStack
        style={{
          height: 50,
          width: LEFT_FIXED_WIDTH,
          backgroundColor: rowBg,
          borderBottomWidth: 0.5,
          borderColor: isDark ? "#333" : "#eee",
          borderRightWidth: 1,
        }}
      >
        <ThemedText
          style={[styles.cellText, { width: RANK_WIDTH, fontWeight: "600" }]}
        >
          {player.rank || "-"}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={[
            styles.cellText,
            {
              width: PLAYER_WIDTH,
              textAlign: "left",
              paddingLeft: 10,
              fontWeight: "600",
            },
          ]}
        >
          {player.playerName}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: HCP_WIDTH }]}>
          {player.handicap}
        </ThemedText>
      </HStack>
    );
  };

  const PlayerRowRight = ({ player, index }: { player: any; index: number }) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? isDark
        ? "#0f172a"
        : "#fff"
      : isDark
        ? "#1e293b"
        : "#f8fafc";

    return (
      <HStack
        style={{
          height: 50,
          width: rightContentWidth,
          backgroundColor: rowBg,
          borderBottomWidth: 0.5,
          borderColor: isDark ? "#333" : "#eee",
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const score = player.holeScores?.[i + 1];
          return (
            <View key={i} style={[styles.cell, { width: HOLE_WIDTH }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                {score ?? "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.cellText,
            { width: TOTAL_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.front9}
        </ThemedText>
        {Array.from({ length: 9 }).map((_, i) => {
          const score = player.holeScores?.[i + 10];
          return (
            <View key={i} style={[styles.cell, { width: HOLE_WIDTH }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                {score ?? "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.cellText,
            { width: TOTAL_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.back9}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH, fontWeight: "800" }]}>
          {player.gross}
        </ThemedText>
        <ThemedText
          style={[
            styles.cellText,
            { width: STAT_WIDTH, fontWeight: "800", color: "#3b82f6" },
          ]}
        >
          {player.net}
        </ThemedText>
        <ThemedText
          style={[
            styles.cellText,
            { width: STAT_WIDTH, fontWeight: "800", color: "#16a34a" },
          ]}
        >
          {player.points}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH }]}>
          {player.eagles}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH }]}>
          {player.birdies}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH }]}>
          {player.pars}
        </ThemedText>
      </HStack>
    );
  };

  const TableLoadingSkeleton = () => {
    const rows = 8;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <HStack style={{ borderTopWidth: 1, borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
          {/* Left fixed skeleton */}
          <VStack style={{ width: LEFT_FIXED_WIDTH }}>
            <View
              style={{
                height: 45,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderRightWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
                justifyContent: "center",
                paddingHorizontal: 10,
              }}
            >
              <Skeleton isDark={isDark} height={12} width={120} />
            </View>
            {Array.from({ length: rows }).map((_, i) => (
              <HStack
                key={i}
                style={{
                  height: 50,
                  borderBottomWidth: 0.5,
                  borderColor: isDark ? "#333" : "#eee",
                  borderRightWidth: 1,
                  paddingHorizontal: 8,
                  alignItems: "center",
                  gap: 8,
                  backgroundColor:
                    i % 2 === 0
                      ? isDark
                        ? "#0f172a"
                        : "#fff"
                      : isDark
                        ? "#1e293b"
                        : "#f8fafc",
                }}
              >
                <Skeleton isDark={isDark} height={12} width={20} />
                <Skeleton isDark={isDark} height={12} width={60} />
                <Skeleton isDark={isDark} height={12} width={25} />
              </HStack>
            ))}
          </VStack>

          {/* Right scrollable skeleton */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <VStack style={{ width: rightContentWidth }}>
              <View
                style={{
                  height: 45,
                  backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                  justifyContent: "center",
                  paddingHorizontal: 10,
                }}
              >
                <Skeleton isDark={isDark} height={12} width={220} />
              </View>

              {Array.from({ length: rows }).map((_, r) => (
                <HStack
                  key={r}
                  style={{
                    height: 50,
                    borderBottomWidth: 0.5,
                    borderColor: isDark ? "#333" : "#eee",
                    backgroundColor:
                      r % 2 === 0
                        ? isDark
                          ? "#0f172a"
                          : "#fff"
                        : isDark
                          ? "#1e293b"
                          : "#f8fafc",
                    paddingHorizontal: 6,
                    alignItems: "center",
                  }}
                >
                  {Array.from({ length: 10 }).map((__, c) => (
                    <View
                      key={c}
                      style={{
                        width: c === 9 ? TOTAL_WIDTH : HOLE_WIDTH,
                        alignItems: "center",
                      }}
                    >
                      <Skeleton isDark={isDark} height={12} width={18} />
                    </View>
                  ))}
                  <View style={{ width: 12 }} />
                  <Skeleton isDark={isDark} height={12} width={260} />
                </HStack>
              ))}
            </VStack>
          </ScrollView>
        </HStack>
      </ScrollView>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <RenderHeader />
      <Watermark />

      <View style={{ flex: 1, marginTop: 10 }}>
        <RenderStatsSection />

        {loading ? (
          <TableLoadingSkeleton />
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            <HStack style={{ borderTopWidth: 1, borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
              {/* Fixed left block */}
              <VStack style={{ width: LEFT_FIXED_WIDTH }}>
                <TableHeaderLeft />
                {holes.length > 0 && (
                  <>
                    <InfoRowLeft label="COURSE PAR" />
                    <InfoRowLeft label="STROKE INDEX" />
                  </>
                )}
                {leaderboard.map((player, idx) => (
                  <PlayerRowLeft key={player.userId} player={player} index={idx} />
                ))}
              </VStack>

              {/* Horizontally scrollable right block */}
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <VStack style={{ width: rightContentWidth }}>
                  <TableHeaderRight />
                  {holes.length > 0 && (
                    <>
                      <InfoRowRight data={holes} type="par" />
                      <InfoRowRight data={holes} type="si" />
                    </>
                  )}
                  {leaderboard.map((player, idx) => (
                    <PlayerRowRight key={player.userId} player={player} index={idx} />
                  ))}
                </VStack>
              </ScrollView>
            </HStack>
            {leaderboard.length == 0 && (
              <ThemedText style={{ textAlign: "center", marginTop: 20 }}>
                No Players or scores available yet.
              </ThemedText>
            )}
          </ScrollView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 45,
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 50,
  },
  infoCellText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 40,
    opacity: 0.6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "left",
    paddingLeft: 10,
    lineHeight: 40,
    color: "#84cc16",
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  card: { /* removed as we move to table */ },
  header: { /* removed as we move to table */ },
  rank: { /* removed as we move to table */ },
  name: { /* removed as we move to table */ },
  sub: { /* removed as we move to table */ },
  points: { /* removed as we move to table */ },
  holeCell: { /* removed as we move to table */ },
  holeNumber: { /* removed as we move to table */ },
  summary: { /* removed as we move to table */ },
  stat: { /* removed as we move to table */ },
  statValue: { /* removed as we move to table */ },
  statLabel: { /* removed as we move to table */ },
  gridRow: { /* removed as we move to table */ },
  gridCell: { /* removed as we move to table */ },
});
