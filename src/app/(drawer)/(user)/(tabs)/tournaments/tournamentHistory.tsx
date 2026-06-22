import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, Pressable, View, Text } from "react-native";
import { Skeleton } from "@/components/Skeleton";

const ScorecardSkeleton = () => (
  <VStack style={{ gap: 10, marginTop: 20 }}>
    <Skeleton
      height={50}
      width="100%"
      style={{ borderRadius: 12, opacity: 0.5 }}
    />
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton
        key={i}
        height={40}
        width="100%"
        style={{ borderRadius: 8, opacity: 0.3 }}
      />
    ))}
  </VStack>
);
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTournamentHistoryByUserId } from "@/api/modules/admin/tournaments.api";

import {
  getScorecardHandicap,
  getScorecardDetails,
  getScoreCardOpen,
} from "@/api/modules/scoreCard.api";

import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";

export default function TournamentHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeBoxId, scoringType, scorecardId, handicap: paramHandicap } =
    useLocalSearchParams();

  // const formatScoringType =
  //   scoringType == "double-peoria"
  //     ? "Net Score Include Par 3"
  //     : scoringType == "stableford"
  //       ? "Stableford"
  //       : scoringType == "excluded"
  //         ? "Net Score Exclude Par 3"
  //         : scoringType == "standard"
  //           ? "Standard"
  //           : scoringType == "double-peoria-net"
  //             ? "Double Peoria Net"
  //             : "Net Score Include Par 3";

  // Net Score Include Par 3
  const [loading, setLoading] = useState(true);

  const [handicap, setHandicap] = useState<any>(null);

  // const [history, setTournamentHistory] = useState<any[]>([]);
  //contains  "isExcluded": true "scorecardId": 361,
  const [scorecardDetails, setScorecardDetails] = useState<any[]>([]);

  const renderScoringType =
    scorecardDetails.length > 0
      ? scorecardDetails[0].stablefordPoints == null
        ? scorecardDetails[0].isExcluded
          ? "Net Score Exclude Par 3"
          : "Net Score Include Par 3"
        : "Stableford"
      : "";
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
          <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
            <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
          </View>
        </View>
      );
    }

    // Albatross (-3)
    if (diff <= -3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#00838f" }]}>
            <View style={[styles.innerCircle, { borderColor: "#00838f" }]} />
          </View>
        </View>
      );
    }

    // Eagle (-2)
    if (diff === -2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
            <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
          </View>
        </View>
      );
    }

    // Birdie (-1)
    if (diff === -1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]}>
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 18,
                borderWidth: 2,
                borderColor: "#2e7d32",
              }}
            />
          </View>
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
          <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a" }]}>
            <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a" }]}>
              <View
                style={[styles.tripleSquareInner, { borderColor: "#6a1b9a" }]}
              />
            </View>
          </View>
        </View>
      );
    }

    // Double Bogey (+2)
    if (diff === 2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
            <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
          </View>
        </View>
      );
    }

    // Bogey (+1)
    if (diff === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
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
      
      let hcp = null;
      if (paramHandicap) {
        hcp = { handicap: Number(paramHandicap) };
        setHandicap(hcp);
      } else if (teeBoxId) {
        hcp = await getScorecardHandicap(Number(teeBoxId));
        setHandicap(hcp);
      }

      if (tournamentId) {
        try {
          const sco = await getScoreCardOpen(Number(tournamentId));
          // console.log("Scorecard Open:", sco);
        } catch (e) {
          console.log("Error fetching scorecard open:", e);
        }
      }

      let finalScorecardId = scorecardId ? Number(scorecardId) : null;
      if (!finalScorecardId && tournamentId) {
        const sht = await getTournamentHistoryByUserId(Number(tournamentId));
        // console.log("Tournament History:", sht);
        finalScorecardId = Array.isArray(sht)
          ? sht[0]?.scorecardId
          : sht?.scorecardId;
      }

      if (finalScorecardId) {
        const scd = await getScorecardDetails(finalScorecardId);
        // console.log("Scorecard Details:", scd);
        setScorecardDetails(scd);
      } else {
        console.warn("No scorecardId found in history results");
      }
    } catch (error) {
      console.log("Error fetching scorecard details apis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreCard();
  }, []);

  const ScorecardRow = ({ h, index }: { h: any; index: number }) => (
    <View
      key={h.holeId || index}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
        },
        isDark
          ? { borderBottomWidth: 1, borderBottomColor: "#333" }
          : { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
      ]}
    >
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
          isDark ? { color: "#fff" } : { color: "#000" },
        ]}
      >
        {h.holeNumber}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "500" },
          isDark ? { color: "#94a3b8" } : { color: "#64748b" },
        ]}
      >
        {h.strokeIndex}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "500" },
          isDark ? { color: "#94a3b8" } : { color: "#64748b" },
        ]}
      >
        {h.yardage}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12 },
          isDark ? { color: "#fff" } : { color: "#000" },
        ]}
      >
        {h.par}
      </ThemedText>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {renderScoreIndicator(h.score ?? null, h.par ?? null, isDark)}
        <Text
          style={{
            color: isDark ? "#fff" : "#000",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: 10,
            fontSize: 13,
          }}
        >
          {h.score ?? "-"}
        </Text>
      </View>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
          isDark ? { color: "#8BC34A" } : { color: "#15803d" },
        ]}
      >
        {h.netScore ?? "-"}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
          isDark ? { color: "#3b82f6" } : { color: "#1d4ed8" },
        ]}
      >
        {h.stablefordPoints ?? "0"}
      </ThemedText>
    </View>
  );

  const SummaryRow = ({
    title,
    totals,
    isGrand = false,
  }: {
    title: string;
    totals: any;
    isGrand?: boolean;
  }) => (
    <View
      style={[
        {
          flexDirection: "row",
          padding: 12,
        },
        !isGrand &&
          (isDark
            ? { borderBottomWidth: 1, borderBottomColor: "#444" }
            : { borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }),
        {
          backgroundColor: isGrand
            ? isDark
              ? "#2e5209"
              : "#8BC34A"
            : isDark
              ? "rgba(139,195,74,0.12)"
              : "rgba(139,195,74,0.08)",
        },
      ]}
    >
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "900" },
          isGrand
            ? { color: "#fff" }
            : isDark
              ? { color: "#8BC34A" }
              : { color: "#15803d" },
        ]}
      >
        {title}
      </ThemedText>
      <View style={{ flex: 1 }} />
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
          isGrand
            ? { color: "#fff" }
            : isDark
              ? { color: "#94a3b8" }
              : { color: "#64748b" },
        ]}
      >
        {totals.yards}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700" },
          isGrand
            ? { color: "#fff" }
            : isDark
              ? { color: "#94a3b8" }
              : { color: "#64748b" },
        ]}
      >
        {totals.par}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "900" },
          isGrand ? { color: "#fff" } : isDark ? { color: "#fff" } : { color: "#000" },
        ]}
      >
        {totals.score}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "900" },
          isGrand
            ? { color: "#fff" }
            : isDark
              ? { color: "#8BC34A" }
              : { color: "#15803d" },
        ]}
      >
        {totals.net}
      </ThemedText>
      <ThemedText
        style={[
          { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "900" },
          isGrand
            ? { color: "#fff" }
            : isDark
              ? { color: "#3b82f6" }
              : { color: "#1d4ed8" },
        ]}
      >
        {totals.stableford}
      </ThemedText>
    </View>
  );

  const RenderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        paddingBottom: 12,
      }}
    >
      {/* 🔝 TOP HEADER */}
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 🔙 BACK BUTTON */}
        <Pressable
          onPress={() => routePage.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#fff" : "#020617"}
          />
        </Pressable>

        {/* 🧠 TITLE */}
        <VStack
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 19,
              fontWeight: "800",
              color: isDark ? "#fff" : "#0f172a",
              letterSpacing: -0.5,
            }}
          >
            {tournamentName}
          </ThemedText>
        </VStack>

        {/* ⚖️ RIGHT PLACEHOLDER */}
        <View style={{ width: 44 }} />
      </HStack>

      {/* 📌 SCORING TYPE */}
      <ThemedText
        style={{
          textAlign: "center",
          fontSize: 13,
          fontWeight: "500",
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      >
        {renderScoringType}
      </ThemedText>

      {/* 📊 STATS ROW */}
      <HStack
        style={{
          marginTop: 8,
          marginHorizontal: 16,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 10,
          justifyContent: "space-between",
          backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
        }}
      >
        <ThemedText style={{ fontSize: 12 }}>
          Handicap:{" "}
          <ThemedText style={{ fontWeight: "600" }}>
            {handicap?.handicap ?? "N/A"}
          </ThemedText>
        </ThemedText>
        {getTotals(scorecardDetails).sumDoublePieora > 0 && (
          <ThemedText style={{ fontSize: 12 }}>
            DP HC:{" "}
            <ThemedText style={{ fontWeight: "600" }}>
              {getTotals(scorecardDetails).sumDoublePieora}
            </ThemedText>
          </ThemedText>
        )}
      </HStack>
    </Box>
  );

  const sumScores = (holes: any[]) =>
    holes.reduce((sum, h) => sum + (Number(h.score) || 0), 0);
  const sumNet = (holes: any[]) =>
    holes.reduce((sum, h) => sum + (Number(h.netScore) || 0), 0);
  const sumYardage = (holes: any[]) =>
    holes.reduce((sum, h) => sum + (Number(h.yardage) || 0), 0);
  const sumPar = (holes: any[]) =>
    holes.reduce((sum, h) => sum + (Number(h.par) || 0), 0);
  const sumPts = (holes: any[]) =>
    holes.reduce((sum, h) => sum + (Number(h.stablefordPoints) || 0), 0);

  const getTotals = (holes: any[]) => ({
    strokeIndex: "",
    yards: sumYardage(holes),
    par: sumPar(holes),
    score: sumScores(holes),
    net: sumNet(holes),
    stableford: sumPts(holes),
    sumDoublePieora: holes.reduce(
      (sum, h) => sum + (Number(h.score) - Number(h.netScore)) || 0,
      0,
    ),
  });

  const frontTotals = getTotals(scorecardDetails.slice(0, 9));
  const backTotals = getTotals(scorecardDetails.slice(9, 18));
  const grandTotals = getTotals(scorecardDetails);

  const sumDoublePieora = grandTotals.sumDoublePieora;

  const front9 = scorecardDetails?.slice(0, 9) || [];
  const back9 = scorecardDetails?.slice(9, 18) || [];

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* HEADER */}
      <RenderHeader />

      <Watermark />

      {loading ? (
        <View className="px-4">
          <ScorecardSkeleton />
        </View>
      ) : !scorecardDetails || scorecardDetails.length === 0 ? (
        <ScrollView className="px-4">
          <VStack
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={48}
              color={isDark ? "#333" : "#ccc"}
            />
            <ThemedText
              style={{ fontSize: 18, fontWeight: "600", marginTop: 16 }}
            >
              No Scorecard Data
            </ThemedText>
            <ThemedText
              style={{ opacity: 0.6, textAlign: "center", marginTop: 8 }}
            >
              This player may not have submitted their round yet.
            </ThemedText>
          </VStack>
        </ScrollView>
      ) : (
        <ScrollView
          className="px-4 flex-1"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Table Header ─── */}
          <View
            className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"} mt-4`}
            style={{ borderWidth: 1, borderColor: isDark ? "#444" : "#ddd" }}
          >
            {[
              "Hole",
              "Stroke\nIndex",
              "Yards",
              "Par",
              "Score",
              "Net",
              "Pts",
            ].map((h) => (
              <Text
                key={h}
                className={`flex-1 text-center font-bold text-[13px] ${isDark ? "text-white" : "text-black"}`}
              >
                {h}
              </Text>
            ))}
          </View>

          {/* ─── Table Body ─── */}
          <View
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden mb-6`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {front9.map((h: any, index: number) => (
              <ScorecardRow
                key={h.holeId || `f-${index}`}
                h={h}
                index={index}
              />
            ))}
            <SummaryRow title="Front 9" totals={frontTotals} />

            {back9.length > 0 &&
              back9.map((h: any, index: number) => (
                <ScorecardRow
                  key={h.holeId || `b-${index}`}
                  h={h}
                  index={index}
                />
              ))}
            {back9.length > 0 && (
              <SummaryRow title="Back 9" totals={backTotals} />
            )}

            <SummaryRow title="Grand Total" totals={grandTotals} isGrand />
          </View>

          {/* ─── Legend ─── */}
          {(() => {
            const counts = getScoreLegendCounts(scorecardDetails || []);

            const LegendItem = ({
              count,
              color,
              label,
              icon,
            }: {
              count: number | string;
              color: string;
              label: string;
              icon: () => React.ReactNode;
            }) => (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  minWidth: "30%",
                  marginBottom: 20,
                }}
              >
                <View style={{ position: "relative", marginBottom: 6 }}>
                  {icon()}
                  {Number(count) > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        inset: 0,
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10,
                      }}
                    >
                      <Text style={{ color, fontSize: 10, fontWeight: "900" }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "500",
                    color: isDark ? "#D1D5DB" : "#4B5563",
                    textAlign: "center",
                  }}
                >
                  {label}
                </Text>
              </View>
            );

            return (
              <View
                className="mb-20 p-5 rounded-2xl"
                style={{
                  backgroundColor: isDark
                    ? "rgba(31,31,31,0.6)"
                    : "rgba(255,255,255,0.6)",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(51,51,51,0.6)"
                    : "rgba(238,238,238,0.6)",
                }}
              >
                <Text
                  className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}
                >
                  Scorecard Legend
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  <LegendItem
                    count={counts.holeInOne}
                    color="#ffd700"
                    label="Hole-in-One"
                    icon={() => (
                      <View
                        style={[
                          styles.doubleCircle,
                          { borderColor: "#ffd700", width: 40, height: 40 },
                        ]}
                      >
                        <View
                          style={[
                            styles.innerCircle,
                            { borderColor: "#ffd700", width: 30, height: 30 },
                          ]}
                        />
                      </View>
                    )}
                  />
                  <LegendItem
                    count={counts.eagle}
                    color="#2e7d32"
                    label="Eagle"
                    icon={() => (
                      <View
                        style={[
                          styles.doubleCircle,
                          { borderColor: "#2e7d32", width: 40, height: 40 },
                        ]}
                      >
                        <View
                          style={[
                            styles.innerCircle,
                            { borderColor: "#2e7d32", width: 30, height: 30 },
                          ]}
                        />
                      </View>
                    )}
                  />
                  <LegendItem
                    count={counts.birdie}
                    color="#2e7d32"
                    label="Birdie"
                    icon={() => (
                      <View
                        style={[
                          styles.singleCircle,
                          { borderColor: "#2e7d32", width: 40, height: 40 },
                        ]}
                      />
                    )}
                  />
                  <LegendItem
                    count={counts.par}
                    color="#9CA3AF"
                    label="Par"
                    icon={() => (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderStyle: "dashed",
                          borderWidth: 1.5,
                          borderColor: "#9CA3AF",
                        }}
                      />
                    )}
                  />
                  <LegendItem
                    count={counts.bogey}
                    color="#d32f2f"
                    label="Bogey"
                    icon={() => (
                      <View
                        style={[
                          styles.singleSquare,
                          { borderColor: "#d32f2f", width: 40, height: 40 },
                        ]}
                      />
                    )}
                  />
                  <LegendItem
                    count={counts.double}
                    color="#d32f2f"
                    label="Double Bogey"
                    icon={() => (
                      <View
                        style={[
                          styles.doubleSquare,
                          { borderColor: "#d32f2f", width: 40, height: 40 },
                        ]}
                      >
                        <View
                          style={[
                            styles.innerSquare,
                            { borderColor: "#d32f2f", width: 30, height: 30 },
                          ]}
                        />
                      </View>
                    )}
                  />
                  <LegendItem
                    count={counts.triple}
                    color="#6a1b9a"
                    label="Triple Bogey"
                    icon={() => (
                      <View
                        style={[
                          styles.tripleSquareOuter,
                          { borderColor: "#6a1b9a", width: 40, height: 40 },
                        ]}
                      >
                        <View
                          style={[
                            styles.tripleSquareMid,
                            { borderColor: "#6a1b9a", width: 32, height: 32 },
                          ]}
                        >
                          <View
                            style={[
                              styles.tripleSquareInner,
                              { borderColor: "#6a1b9a", width: 24, height: 24 },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                  />
                  <LegendItem
                    count={counts.quadPlus}
                    color={isDark ? "#fff" : "#000"}
                    label="Quad Bogey+"
                    icon={() => (
                      <View
                        style={[
                          styles.singleSquare,
                          {
                            borderColor: isDark ? "#fff" : "#000",
                            width: 40,
                            height: 40,
                          },
                        ]}
                      />
                    )}
                  />
                </View>
              </View>
            );
          })()}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  doubleCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  singleCircle: {
    width: 34,
    height: 34,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  singleSquare: {
    width: 32,
    height: 32,
    borderWidth: 2,
  },
  doubleSquare: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  innerSquare: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
  },
  tripleSquareOuter: {
    width: 42,
    height: 42,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareMid: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareInner: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
  },
});
