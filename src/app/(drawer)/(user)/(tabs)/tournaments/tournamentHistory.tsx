import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTournamentHistoryByUserId } from "@/api/admin/tournaments";

import {
  getScorecardHandicap,
  getScorecardDetails,
  getScoreCardOpen,
} from "@/api/scoreCard";

import { Skeleton } from "@/components/Skeleton";
import { VStack } from "@/components/vstack";

export default function TournamentHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeBoxId, scoringType } =
    useLocalSearchParams();
  const formatScoringType =
    scoringType == "double-peoria"
      ? "Double Peoria"
      : scoringType == "stableford"
        ? "Stableford"
        : scoringType == "excluded"
          ? "Net Score Exclude Par 3"
          : scoringType == "standard"
            ? "Standard"
            : scoringType == "double-peoria-net"
              ? "Double Peoria Net"
              : "Net Score Include Par 3";
  // Net Score Include Par 3
  const [loading, setLoading] = useState(true);

  const [handicap, setHandicap] = useState(null);

  const [history, setTournamentHistory] = useState<any[]>([]); //contains  "isExcluded": true "scorecardId": 361,
  const [scorecardDetails, setScorecardDetails] = useState<any[]>([]);

  // ── Helper Functions (Defined early to avoid hoisting issues) ──
  const getScoreType = (score: number, par: number) => {
    const diff = score - par;
    if (score === 1) return "hole-in-one";
    if (diff <= -3) return "albatross";
    if (diff === -2) return "eagle";
    if (diff === -1) return "birdie";
    if (diff === 0) return "par";
    if (diff === 1) return "bogey";
    if (diff === 2) return "double";
    if (diff === 3) return "triple";
    return "quad";
  };

  const getScoreStyle = (type: string) => {
    switch (type) {
      case "hole-in-one":
        return { borderColor: "#facc15", shape: "circle" };
      case "albatross":
        return { borderColor: "#0f766e", shape: "circle" };
      case "eagle":
        return { borderColor: "#166534", shape: "circle" };
      case "birdie":
        return { borderColor: "#16a34a", shape: "circle" };
      case "par":
        return { borderColor: "#9ca3af", shape: "square", dashed: true };
      case "bogey":
        return { borderColor: "#ef4444", shape: "square" };
      case "double":
        return { borderColor: "#dc2626", shape: "square" };
      case "triple":
        return { borderColor: "#7c3aed", shape: "square" };
      default:
        return { borderColor: "#000", shape: "square" };
    }
  };

  const getScoreLegendCounts = (holes: any[]) => {
    const counts: any = {
      "hole-in-one": 0,
      albatross: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      double: 0,
      triple: 0,
      quad: 0,
    };

    holes.forEach((h) => {
      if (!h.score && h.score !== 0) return;
      const type = getScoreType(Number(h.score), Number(h.par));
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  };

  const fetchScoreCard = async () => {
    try {
      setLoading(true);
      const hcp = await getScorecardHandicap(Number(teeBoxId));
      // console.log("Handicap:", hcp);

      const sco = await getScoreCardOpen(Number(tournamentId));
      // console.log("Scorecard Open:", sco);

      const sht = await getTournamentHistoryByUserId(Number(tournamentId));
      // console.log("Tournament History:", sht);

      const scorecardId = Array.isArray(sht)
        ? sht[0]?.scorecardId
        : sht?.scorecardId;

      if (scorecardId) {
        const scd = await getScorecardDetails(scorecardId);
        // console.log("Scorecard Details:", scd);
        setScorecardDetails(scd);
      } else {
        console.warn("No scorecardId found in history results");
      }

      setHandicap(hcp);
      setTournamentHistory(Array.isArray(sht) ? sht : [sht].filter(Boolean));
    } catch (error) {
      console.log("Error fetching scorecard details apis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreCard();
  }, []);

  const RenderHeader = () => {
    return (
      <>
        <VStack className="mb-3">
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
            <ThemedText
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 30,
              }}
            >
              Scorecard : {tournamentName}
            </ThemedText>

            {/* RIGHT: Add Button */}
            {/* <View style={{ width: 40 }} /> */}
          </HStack>
          <ThemedText
            style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: "400",
              lineHeight: 30,
            }}
          >
            {/* (Net Score Exclude Par 3) */}
            {formatScoringType}
          </ThemedText>
        </VStack>
      </>
    );
  };

  const renderRow = (item: any) => {
    // ✅ ADD HERE
    const type = getScoreType(item.score, item.par);
    const styleConfig = getScoreStyle(type);

    return (
      <HStack
        key={item.holeNumber}
        style={styles.row}
        // isDark = colorScheme === "dark"
      >
        <View style={styles.cell}>
          <ThemedText>{item.holeNumber}</ThemedText>
        </View>

        <View style={styles.cell}>
          <ThemedText>{item.handicap}</ThemedText>
        </View>

        <View style={styles.cell}>
          <ThemedText>{item.yardage}</ThemedText>
        </View>

        <View style={styles.cell}>
          <ThemedText>{item.par}</ThemedText>
        </View>

        {/* ✅ SCORE UI */}
        <View style={styles.cell}>
          <View
            style={[
              styles.scoreBox,
              styleConfig.shape === "circle" && styles.circle,
              styleConfig.shape === "square" && styles.square,
              {
                borderColor: styleConfig.borderColor,
                borderStyle: styleConfig.dashed ? "dashed" : "solid",
              },
            ]}
          >
            <ThemedText style={{ fontWeight: "700" }}>{item.score}</ThemedText>
          </View>
        </View>

        <View style={styles.cell}>
          <ThemedText>{item.netScore}</ThemedText>
        </View>
      </HStack>
    );
  };

  const renderTotals = (label: string, data: any[], keySuffix?: string) => {
    const t = calculateTotals(data);

    return (
      <HStack
        key={`${label}-${keySuffix || ""}`}
        style={[
          styles.tableHeader,
          { backgroundColor: isDark ? "#1f2937" : "#e5e7eb" },
        ]}
      >
        <View style={styles.cell}>
          <ThemedText style={{ fontWeight: "700" }}>{label}</ThemedText>
        </View>

        <View style={styles.cell} />
        <View style={styles.cell}>
          <ThemedText>{t.yardage}</ThemedText>
        </View>

        <View style={styles.cell}>
          <ThemedText>{t.par}</ThemedText>
        </View>

        <View style={styles.cell}>
          <ThemedText>{t.score}</ThemedText>
        </View>

        <View style={styles.cell}>
          <ThemedText>{t.net}</ThemedText>
        </View>
      </HStack>
    );
  };

  const front9 = scorecardDetails?.slice(0, 9) || [];
  const back9 = scorecardDetails?.slice(9, 18) || [];

  const getScoreColor = (score: number, par: number) => {
    if (score < par) return "#22c55e"; // green
    if (score === par) return "#eab308"; // yellow
    return "#3b82f6"; // blue
  };

  const calculateTotals = (data: any[]) => {
    return data.reduce(
      (acc, item) => {
        acc.yardage += Number(item.yardage) || 0;
        acc.par += Number(item.par) || 0;
        acc.score += Number(item.score) || 0;
        acc.net += Number(item.netScore) || 0;
        return acc;
      },
      { yardage: 0, par: 0, score: 0, net: 0 },
    );
  };

  const legendCounts = getScoreLegendCounts(scorecardDetails || []);

  const legendData = [
    {
      label: "Hole-in-One",
      border: "#facc15",
      type: "circle",
      text: legendCounts["hole-in-one"] || "",
    },
    {
      label: "Albatross",
      border: "#0f766e",
      type: "circle",
      text: legendCounts.albatross || "",
    },
    {
      label: "Eagle",
      border: "#166534",
      type: "circle",
      text: legendCounts.eagle || "",
    },
    {
      label: "Birdie",
      border: "#16a34a",
      type: "circle",
      text: legendCounts.birdie || "",
    },
    {
      label: "Par",
      border: "#9ca3af",
      type: "square",
      text: legendCounts.par || "",
      dashed: true,
    },
    {
      label: "Bogey",
      border: "#ef4444",
      type: "square",
      text: legendCounts.bogey || "",
    },
    {
      label: "Double Bogey",
      border: "#dc2626",
      type: "square",
      text: legendCounts.double || "",
    },
    {
      label: "Triple Bogey",
      border: "#7c3aed",
      type: "square",
      text: legendCounts.triple || "",
    },
    {
      label: "Quadruple Bogey+",
      border: "#000",
      type: "square",
      text: legendCounts.quad || "",
    },
  ];

  const ScoreRowSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <HStack style={styles.row}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.cell}>
            <Skeleton isDark={isDark} height={14} width={30} borderRadius={6} />
          </View>
        ))}
      </HStack>
    );
  };

  const ScoreCircleSkeleton = ({ isDark }: { isDark: boolean }) => (
    <Skeleton isDark={isDark} height={28} width={28} borderRadius={14} />
  );

  return (
    <>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.safeArea}>
          <Watermark />

          {/* Header */}
          <RenderHeader />
          <ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header */}
                <HStack
                  // "#e5e7eb"
                  style={[
                    styles.tableHeader,
                    { backgroundColor: isDark ? "#1f2937" : "#e5e7eb" },
                  ]}
                >
                  {["Hole", "Stroke\nIndex", "Yds", "Par", "Score", "Net"].map(
                    (h) => (
                      <View key={h} style={styles.cell}>
                        <ThemedText
                        // style={styles.headerText}
                        >
                          {h}
                        </ThemedText>
                      </View>
                    ),
                  )}
                </HStack>
                {loading ? (
                  <>
                    {/* Front 9 Skeleton */}
                    {Array.from({ length: 9 }).map((_, i) => (
                      <ScoreRowSkeleton key={`f-${i}`} isDark={isDark} />
                    ))}

                    {/* Back 9 Skeleton */}
                    {Array.from({ length: 9 }).map((_, i) => (
                      <ScoreRowSkeleton key={`b-${i}`} isDark={isDark} />
                    ))}
                  </>
                ) : (
                  <>
                    {/* REAL DATA */}
                    {front9.map(renderRow)}
                    {renderTotals("Front 9", front9, "f")}

                    {back9.map(renderRow)}
                    {renderTotals("Back 9", back9, "b")}

                    {renderTotals("Total", scorecardDetails || [], "final")}
                  </>
                )}
              </View>
            </ScrollView>

            <ThemedText className="mt-3">Scorecard Legend</ThemedText>

            <VStack style={styles.legendRow}>
              {legendData.map((item, index) => (
                <ThemedView key={index} style={styles.legendItem}>
                  <ThemedView
                    style={[
                      styles.icon,
                      item.type === "circle" && styles.circle,
                      item.type === "square" && styles.square,
                      {
                        borderColor: item.border,
                        borderStyle: item.dashed ? "dashed" : "solid",
                      },
                    ]}
                  >
                    {item.text ? (
                      <ThemedText style={styles.iconText}>
                        {item.text}
                      </ThemedText>
                    ) : null}
                  </ThemedView>

                  <ThemedText style={styles.label}>{item.label}</ThemedText>
                </ThemedView>
              ))}
            </VStack>
          </ScrollView>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.one,
    // paddingBottom: BottomTabInset + Spacing.one,
    maxWidth: MaxContentWidth,
  },
  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },
  list: {
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  tableHeader: {
    flexDirection: "row",
    // backgroundColor: "#e5e7eb",
    paddingVertical: 10,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
  },

  cell: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    fontWeight: "700",
    fontSize: 13,
  },

  // scoreCircle: {
  //   width: 28,
  //   height: 28,
  //   borderRadius: 14,
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  legendContainer: {
    marginTop: 20,
  },

  legendTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  legendRow: {
    marginTop: 20,
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  // container: {
  //   marginTop: 20,
  //   padding: 14,
  //   borderRadius: 12,
  // },

  legendItem: {
    width: "25%", // 4 items per row
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    width: 28,
    height: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  circle: {
    borderRadius: 20,
  },

  square: {
    borderRadius: 4,
  },

  iconText: {
    fontSize: 12,
    fontWeight: "600",
  },

  label: {
    fontSize: 11,
    textAlign: "center",
  },
  scoreBox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
