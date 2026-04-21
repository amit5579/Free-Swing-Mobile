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
import {
  getTournamentHistoryByUserId,
} from "@/api/admin/tournaments";

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
      ? "Net Score Include Par 3"
      : scoringType == "stableford"
        ? "Stableford"
        : scoringType == "excluded"
          ? "Net Score Exclude Par 3"
          : scoringType == "standard"
            ? "Standard"
            : scoringType == "double-peoria-net"
              ? "Double Peoria Net"
              : "Net Score Include Par 3";

  useEffect(() => {
    console.log("scoringType", scoringType);
    console.log("formatScoringType", formatScoringType);
  }, [scoringType, formatScoringType]);
  // Net Score Include Par 3
  const [loading, setLoading] = useState(true);

  const [handicap, setHandicap] = useState<any>(null);

  const [history, setTournamentHistory] = useState<any[]>([]); //contains  "isExcluded": true "scorecardId": 361,
  const [scorecardDetails, setScorecardDetails] = useState<any[]>([]);
  useEffect(() => {
    console.log("hhhhccc", handicap);

  }, [handicap])
  // ── Helper Functions (Defined early to avoid hoisting issues) ──

  // ── Score Indicator Helper ──
  const renderScoreIndicator = (
    score: number | string | null,
    par: number,
    dark: boolean,
  ) => {
    if (score === null || score === "" || score === undefined) return null;

    const numericScore = Number(score);
    const diff = numericScore - par;

    // Hole-in-One
    if (numericScore === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#fbc02d" }]} />
        </View>
      );
    }

    // Albatross (-3)
    if (diff <= -3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#00838f" }]} />
        </View>
      );
    }

    // Eagle (-2)
    if (diff === -2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
        </View>
      );
    }

    // Birdie (-1)
    if (diff === -1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#66bb6a" }]} />
        </View>
      );
    }

    // Par (0)
    if (diff === 0) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={{
              width: 32,
              height: 32,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#999",
              borderRadius: 4,
            }}
          />
        </View>
      );
    }

    // Quadruple+ (>= +4)
    if (diff >= 4) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.singleSquare,
              { borderColor: dark ? "#fff" : "#000" },
            ]}
          />
        </View>
      );
    }

    // Triple Bogey (+3)
    if (diff === 3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#8e24aa" }]}>
            <View style={[styles.innerSquare, { borderColor: "#8e24aa" }]} />
          </View>
        </View>
      );
    }

    // Double Bogey (+2)
    if (diff === 2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#e53935" }]}>
            <View style={[styles.innerSquare, { borderColor: "#e53935" }]} />
          </View>
        </View>
      );
    }

    // Bogey (+1)
    if (diff === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#e53935" }]} />
        </View>
      );
    }

    return null;
  };

  const getScoreLegendCounts = (holes: any[]) => {
    const counts = {
      holeInOne: 0,
      albatross: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      double: 0,
      triple: 0,
      quadPlus: 0,
    };

    holes.forEach((h) => {
      if (!h.score && h.score !== 0) return;

      const score = Number(h.score);
      const diff = score - h.par;

      if (score === 1) {
        counts.holeInOne++;
        return;
      }
      if (diff === -3) {
        counts.albatross++;
        return;
      }
      if (diff === -2) {
        counts.eagle++;
        return;
      }
      if (diff === -1) {
        counts.birdie++;
        return;
      }
      if (diff === 0) {
        counts.par++;
        return;
      }
      if (diff === 1) {
        counts.bogey++;
        return;
      }
      if (diff === 2) {
        counts.double++;
        return;
      }
      if (diff === 3) {
        counts.triple++;
        return;
      }
      if (diff >= 4) {
        counts.quadPlus++;
        return;
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
      <View>
        <HStack
          className="px-3 items-center"
          style={{ height: 60, justifyContent: "center" }}
        >
          <Pressable
            onPress={() => routePage.back()}
            style={{ position: "absolute", left: 16, zIndex: 10, padding: 8 }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={isDark ? "#ffffff" : "#020617"}
            />
          </Pressable>

          <ThemedText
            style={{
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {tournamentName}
          </ThemedText>
        </HStack>

        <VStack className="px-5 mb-2">
          <ThemedText
            style={{
              textAlign: "center",
              fontSize: 14,
              opacity: 0.8,
              marginBottom: 4,
            }}
          >
            {formatScoringType}
          </ThemedText>
          <HStack className="justify-between items-center">
            <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
              Declared HC: {handicap?.handicap || "-"}
            </ThemedText>

            {scoringType === "double-peoria" ||
            scoringType === "double-peoria-net" ||
            scoringType === "Net Score Include Par 3" ? (
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                DP HC: {getTotals(scorecardDetails).sumDoublePieora > 0 ? getTotals(scorecardDetails).sumDoublePieora : "NIL"}
              </ThemedText>
            ) : null}
          </HStack>
        </VStack>
      </View>
    );
  };

  const isStableford = formatScoringType === "Stableford";

  const getTotals = (holes: any[]) => ({
    yards: holes.reduce((sum, h) => sum + (Number(h.yardage) || 0), 0),
    par: holes.reduce((sum, h) => sum + (Number(h.par) || 0), 0),
    score: holes.reduce((sum, h) => sum + (Number(h.score) || 0), 0),
    net: holes.reduce((sum, h) => sum + (Number(h.netScore) || 0), 0),
    stableford: holes.reduce(
      (sum, h) => sum + (Number(h.stablefordPoints) || 0),
      0,
    ),
    sumDoublePieora: holes.reduce((sum, h) => sum + (Number(h.score) - Number(h.netScore)) || 0, 0),
  });
  // const sumDoublePieora = sumScores(scorecardDetails) - sumNet(scorecardDetails);

  const frontTotals = getTotals(scorecardDetails.slice(0, 9));
  const backTotals = getTotals(scorecardDetails.slice(9, 18));
  const grandTotals = getTotals(scorecardDetails);

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
        acc.stablefordPoints += Number(item.stablefordPoints) || 0;
        return acc;
      },
      { yardage: 0, par: 0, score: 0, net: 0, stablefordPoints: 0 },
    );
  };

  const legendCounts = getScoreLegendCounts(scorecardDetails || []);

  const legendData = [
    {
      label: "Hole-in-One",
      border: "#fbc02d",
      type: "circle",
      text: legendCounts.holeInOne || "",
    },
    {
      label: "Albatross",
      border: "#00838f",
      type: "circle",
      text: legendCounts.albatross || "",
    },
    {
      label: "Eagle",
      border: "#2e7d32",
      type: "circle",
      text: legendCounts.eagle || "",
    },
    {
      label: "Birdie",
      border: "#66bb6a",
      type: "circle",
      text: legendCounts.birdie || "",
    },
    {
      label: "Par",
      border: "#999",
      type: "square",
      text: legendCounts.par || "",
      dashed: true,
    },
    {
      label: "Bogey",
      border: "#e53935",
      type: "square",
      text: legendCounts.bogey || "",
    },
    {
      label: "Double Bogey",
      border: "#e53935",
      type: "double-square",
      text: legendCounts.double || "",
    },
    {
      label: "Triple Bogey",
      border: "#8e24aa",
      type: "double-square",
      text: legendCounts.triple || "",
    },
    {
      label: "Quadruple Bogey+",
      border: isDark ? "#fff" : "#000",
      type: "square",
      text: legendCounts.quadPlus || "",
    },
  ];

 
  return (
    <>
      <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
        <Watermark />
        {/* Header */}
        <RenderHeader />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-2 pb-20">
            <VStack className="gap-4">
              {loading ? (
                <ThemedView className="p-10 items-center">
                  <ThemedText>Loading...</ThemedText>
                </ThemedView>
              ) : (
                <>
                  {/* CARD WRAPPER */}
                  <VStack
                    style={{
                      backgroundColor: "transparent",
                      borderRadius: 14,
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                    }}
                  >
                    {/* 🔹 HEADER ROW */}
                    <HStack
                      style={{
                        paddingVertical: 10,
                        backgroundColor: isDark
                          ? "rgba(38, 38, 38, 0.8)"
                          : "rgba(243, 244, 246, 0.8)",
                        borderBottomWidth: 1,
                        borderColor: isDark ? "#444" : "#ddd",
                      }}
                    >
                      {[
                        "Hole",
                        "Yards",
                        "Par",
                        "Score",
                        "Net",
                        isStableford && "Pts",
                      ]
                        .filter(Boolean)
                        .map((item, i) => (
                          <ThemedText
                            key={i}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              fontWeight: "600",
                              fontSize: 13,
                            }}
                          >
                            {item as string}
                          </ThemedText>
                        ))}
                    </HStack>

                    {/* 🔹 ROWS */}
                    {scorecardDetails.length === 0 ? (
                      <ThemedText className="p-10 textAlign-center">
                        No games played in this tournament yet.
                      </ThemedText>
                    ) : (
                      scorecardDetails.map((h: any, index: number) => (
                        <View key={index}>
                          <HStack
                            style={{
                              paddingVertical: 12,
                              alignItems: "center",
                              borderBottomWidth: 0.5,
                              borderColor: isDark ? "#333" : "#eee",
                            }}
                          >
                            {/* Hole Number */}
                            <ThemedText style={{ flex: 1, textAlign: "center" }}>
                              {h.holeNumber}
                            </ThemedText>

                            {/* Yardage */}
                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                                color: "#888",
                              }}
                            >
                              {h.yardage}
                            </ThemedText>

                            {/* Par */}
                            <ThemedText style={{ flex: 1, textAlign: "center" }}>
                              {h.par}
                            </ThemedText>

                            {/* Score with indicator */}
                            <View
                              style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {renderScoreIndicator(h.score, h.par, isDark)}
                              <View
                                style={{
                                  position: "absolute",
                                  width: 42,
                                  height: 42,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <ThemedText
                                  style={{
                                    textAlign: "center",
                                    fontWeight: "600",
                                  }}
                                >
                                  {h.score}
                                </ThemedText>
                              </View>
                            </View>

                            {/* Net Score */}
                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#8BC34A",
                              }}
                            >
                              {h.netScore ?? "-"}
                            </ThemedText>

                            {/* Stableford Points */}
                            {isStableford && (
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {h.stablefordPoints ?? "-"}
                              </ThemedText>
                            )}
                          </HStack>

                          {/* FRONT 9 SUMMARY */}
                          {index === 8 && (
                            <HStack
                              style={{
                                backgroundColor: isDark
                                  ? "rgba(38, 38, 38, 0.8)"
                                  : "rgba(243, 244, 246, 0.8)",
                                paddingVertical: 10,
                                borderTopWidth: 1,
                                borderColor: isDark ? "#444" : "#ddd",
                              }}
                            >
                              <ThemedText
                                style={{
                                  flex: 1,
                                  fontWeight: "700",
                                  textAlign: "center",
                                }}
                              >
                                Front 9
                              </ThemedText>
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {frontTotals.yards}
                              </ThemedText>
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {frontTotals.par}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontWeight: "700",
                                }}
                              >
                                {frontTotals.score}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontWeight: "700",
                                }}
                              >
                                {frontTotals.net}
                              </ThemedText>
                              {isStableford && (
                                <ThemedText
                                  style={{ flex: 1, textAlign: "center" }}
                                >
                                  {frontTotals.stableford}
                                </ThemedText>
                              )}
                            </HStack>
                          )}

                          {/* BACK 9 SUMMARY */}
                          {index === 17 && (
                            <HStack
                              style={{
                                backgroundColor: isDark
                                  ? "rgba(38, 38, 38, 0.8)"
                                  : "rgba(243, 244, 246, 0.8)",
                                paddingVertical: 10,
                                borderTopWidth: 1,
                                borderColor: isDark ? "#444" : "#ddd",
                              }}
                            >
                              <ThemedText
                                style={{
                                  flex: 1,
                                  fontWeight: "700",
                                  textAlign: "center",
                                }}
                              >
                                Back 9
                              </ThemedText>
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {backTotals.yards}
                              </ThemedText>
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {backTotals.par}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontWeight: "700",
                                }}
                              >
                                {backTotals.score}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontWeight: "700",
                                }}
                              >
                                {backTotals.net}
                              </ThemedText>
                              {isStableford && (
                                <ThemedText
                                  style={{ flex: 1, textAlign: "center" }}
                                >
                                  {backTotals.stableford}
                                </ThemedText>
                              )}
                            </HStack>
                          )}
                        </View>
                      ))
                    )}
                  </VStack>

                  {/* GRAND TOTAL */}
                  {scorecardDetails.length > 0 && (
                    <HStack
                      style={{
                        marginTop: 10,
                        paddingVertical: 14,
                        backgroundColor: "#8BC34A",
                        borderRadius: 12,
                      }}
                    >
                      <ThemedText
                        style={{
                          flex: 1,
                          textAlign: "center",
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        Total
                      </ThemedText>
                      <ThemedText
                        style={{ flex: 1, textAlign: "center", color: "#fff" }}
                      >
                        {grandTotals.yards}
                      </ThemedText>
                      <ThemedText
                        style={{ flex: 1, textAlign: "center", color: "#fff" }}
                      >
                        {grandTotals.par}
                      </ThemedText>
                      <ThemedText
                        style={{
                          flex: 1,
                          textAlign: "center",
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        {grandTotals.score}
                      </ThemedText>
                      <ThemedText
                        style={{
                          flex: 1,
                          textAlign: "center",
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        {grandTotals.net}
                      </ThemedText>
                      {isStableford && (
                        <ThemedText
                          style={{
                            flex: 1,
                            textAlign: "center",
                            color: "#fff",
                          }}
                        >
                          {grandTotals.stableford}
                        </ThemedText>
                      )}
                    </HStack>
                  )}

                  {/* SCORECARD LEGEND */}
                  <VStack
                    style={{
                      marginTop: 25,
                      padding: 16,
                      borderRadius: 14,
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: isDark ? "#444" : "#eee",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontWeight: "700",
                        marginBottom: 16,
                        fontSize: 15,
                      }}
                    >
                      Scorecard Legend
                    </ThemedText>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      {legendData.map((item, index) => (
                        <View
                          key={index}
                          style={{
                            width: "30%",
                            alignItems: "center",
                            marginBottom: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 4,
                            }}
                          >
                            {/* Legend Icon Mapping */}
                            {item.type === "circle" ? (
                              <View
                                style={[
                                  styles.singleCircle,
                                  { borderColor: item.border },
                                ]}
                              />
                            ) : item.type === "square" ? (
                              <View
                                style={[
                                  styles.singleSquare,
                                  {
                                    borderColor: item.border,
                                    borderStyle: item.dashed
                                      ? "dashed"
                                      : "solid",
                                    borderWidth: item.dashed ? 1 : 2,
                                  },
                                ]}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.doubleSquare,
                                  { borderColor: item.border },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.innerSquare,
                                    { borderColor: item.border },
                                  ]}
                                />
                              </View>
                            )}

                            <View
                              style={{
                                position: "absolute",
                                width: 32,
                                height: 32,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ThemedText
                                style={{ fontSize: 11, fontWeight: "600" }}
                              >
                                {item.text}
                              </ThemedText>
                            </View>
                          </View>
                          <ThemedText
                            style={{
                              fontSize: 10,
                              textAlign: "center",
                              opacity: 0.8,
                            }}
                          >
                            {item.label}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </VStack>
                </>
              )}
            </VStack>
          </VStack>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  singleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  singleSquare: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
  },
  doubleSquare: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
    padding: 3,
  },
  innerSquare: {
    flex: 1,
    borderRadius: 1,
    borderWidth: 1,
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
});
