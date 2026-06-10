import {
  getScorecardDetails,
  ScorecardHole,
  updateHoleScoresApi,
} from "@/api/modules/dashboard.api";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { updateScorecardApi } from "@/api/modules/dashboard.api";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import {
  calculateSplitSixPoints,
  computeHighLowHolePoints,
} from "@/utils/scoringEngine";
import { useRouter } from "expo-router";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { ThemedText } from "@/components/themed-text";
import { getSubScorecardHandicap } from "@/api/modules/scoreCard.api";

const ScoreCard: React.FC = () => {
  const {
    scoreCard,
    handicap: paramHandicap,
    username,
    courseName,
  } = useLocalSearchParams<{
    scoreCard: string;
    handicap: string;
    username: string;
    courseName: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const displayHandicap = parseInt(paramHandicap || "0");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [holes, setHoles] = useState<ScorecardHole[]>([]);
  const [textScores, setTextScores] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStableford, setIsStableford] = useState(false);

  // Multiplayer layout state variables
  const [partners, setPartners] = useState<any[]>([]);
  const [companionHandicaps, setCompanionHandicaps] = useState<
    Record<number, number>
  >({});
  const [isHighLow, setIsHighLow] = useState(false);
  const [isSplit6, setIsSplit6] = useState(false);
  const [isNassauBest, setIsNassauBest] = useState(false);
  const [isNassauCombined, setIsNassauCombined] = useState(false);
  const isNassau = isNassauBest || isNassauCombined;

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        setLoading(true);
        const data = await getScorecardDetails(scoreCard!);
        setHoles(data);

        const showPts = data.some(
          (h) =>
            h.stablefordPoints !== null && h.stablefordPoints !== undefined,
        );
        setIsStableford(showPts);

        const initialText: Record<number, string> = {};
        data.forEach((h) => {
          if (h.score != null && h.score >= 0) {
            initialText[h.holeId] = h.score.toString();
          }
        });
        setTextScores(initialText);

        // Parse partners
        let parsedPartners: any[] = [];
        if (data && data.length > 0) {
          const firstHole = data[0];
          if ((firstHole as any).playingPartnersJson) {
            try {
              parsedPartners =
                typeof (firstHole as any).playingPartnersJson === "string"
                  ? JSON.parse((firstHole as any).playingPartnersJson)
                  : (firstHole as any).playingPartnersJson;
              setPartners(parsedPartners || []);
            } catch (e) {
              console.error("Error parsing playingPartnersJson:", e);
            }
          }

          const mode = (
            (firstHole as any).scoringType ||
            (firstHole as any).scoring_type ||
            ""
          ).toLowerCase();
          const pLength = parsedPartners.length;
          const isNB =
            mode.includes("nassau_best") || mode.includes("nassau-best");
          const isNC =
            mode.includes("nassau_combined") ||
            mode.includes("nassau-combined");
          const isHL =
            (mode.includes("high_low") ||
              mode.includes("high-low") ||
              pLength === 4) &&
            !(isNB || isNC);
          const isS6 =
            (mode.includes("split_six") ||
              mode.includes("split-six") ||
              pLength === 3) &&
            !(isNB || isNC);

          setIsHighLow(isHL);
          setIsSplit6(isS6);
          setIsNassauBest(isNB);
          setIsNassauCombined(isNC);

          const teeBoxId = (firstHole as any).teeBoxId;
          if (parsedPartners.length > 0 && teeBoxId) {
            const fetchCompanionHandicaps = async () => {
              const handicapsMap: Record<number, number> = {};
              for (const p of parsedPartners) {
                if (!p.isPrimary && p.userId) {
                  try {
                    const hData = await getSubScorecardHandicap(
                      p.userId,
                      Number(teeBoxId),
                    );
                    const hc =
                      typeof hData === "object" && hData !== null
                        ? (hData.handicap ?? 0)
                        : Number(hData) || 0;
                    handicapsMap[p.userId] = hc;
                  } catch (e) {
                    console.error(
                      "Error fetching companion handicap for userId",
                      p.userId,
                      e,
                    );
                  }
                }
              }
              setCompanionHandicaps(handicapsMap);
            };
            fetchCompanionHandicaps();
          }
        }
      } catch (err) {
        setError("Failed to load scorecard.");
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, [scoreCard]);

  const calculateStrokes = (handicap: number, strokeIndex: number) => {
    const base = Math.floor(handicap / 18);
    const remainder = handicap % 18;
    return base + (strokeIndex <= remainder ? 1 : 0);
  };

  const getPlayerHoleInfo = (hole: any, partner: any) => {
    const isPrimary = partner.isPrimary;
    const playerId = partner.playerId; // "p1", "p2", etc.
    const userId = partner.userId;

    let companionScores: Record<string, number | null> = {};
    if (hole.companionScoresJson) {
      try {
        companionScores =
          typeof hole.companionScoresJson === "string"
            ? JSON.parse(hole.companionScoresJson)
            : hole.companionScoresJson;
      } catch (e) {
        console.error(e);
      }
    }

    let companionSandys: Record<string, boolean> = {};
    if (hole.companionSandysJson) {
      try {
        companionSandys =
          typeof hole.companionSandysJson === "string"
            ? JSON.parse(hole.companionSandysJson)
            : hole.companionSandysJson;
      } catch (e) {
        console.error(e);
      }
    }

    let rawScore = null;
    if (isPrimary) {
      rawScore =
        hole.score !== null && hole.score !== "" && hole.score !== undefined
          ? Number(hole.score)
          : null;
      if (
        rawScore === null &&
        companionScores[playerId] !== undefined &&
        companionScores[playerId] !== null
      ) {
        rawScore = Number(companionScores[playerId]);
      }
    } else {
      rawScore =
        companionScores[playerId] !== undefined &&
        companionScores[playerId] !== null
          ? Number(companionScores[playerId])
          : null;
    }

    const sandy = companionSandys[playerId] === true;

    if (rawScore === null) {
      return {
        score: null,
        netScore: null,
        stablefordPoints: null,
        sandy,
      };
    }

    const playerHandicap = isPrimary
      ? Number(displayHandicap || 0)
      : companionHandicaps[userId] || 0;
    let strokesReceived = calculateStrokes(playerHandicap, hole.strokeIndex);
    if (hole.isExcluded && hole.par === 3) {
      strokesReceived = 0;
    }
    const netScore = rawScore - strokesReceived;

    let stablefordPoints = null;
    if (isStableford) {
      const pts = hole.par - netScore + 2;
      stablefordPoints = pts > 0 ? pts : 0;
    }

    return {
      score: rawScore,
      netScore,
      stablefordPoints,
      sandy,
    };
  };

  const getPlayerTotals = (holesList: any[], partner: any) => {
    let gross = 0;
    let net = 0;
    let stableford = 0;
    let hasAnyScore = false;

    holesList.forEach((h) => {
      const info = getPlayerHoleInfo(h, partner);
      if (info.score !== null) {
        gross += info.score;
        net += info.netScore ?? 0;
        stableford += info.stablefordPoints ?? 0;
        hasAnyScore = true;
      }
    });

    return {
      gross: hasAnyScore ? gross : "-",
      net: hasAnyScore ? net : "-",
      stableford: hasAnyScore ? stableford : "-",
    };
  };

  const getBaseMultiplier = (score: number | null, par: number) => {
    if (score === null || score <= 0) return 1;
    if (score === 1) return 25;
    const diff = score - par;
    if (diff <= -2) return 5;
    if (diff === -1) return 2;
    return 1;
  };

  const calculateHighLowPoints = (
    s1: number | null,
    s2: number | null,
    s3: number | null,
    s4: number | null,
  ) => {
    const { teamA, teamB } = computeHighLowHolePoints([s1, s2], [s3, s4]);
    return { teamAPoints: teamA, teamBPoints: teamB };
  };

  const getHighLowHoleStats = (h: any) => {
    if (partners.length < 4) {
      return {
        teamALow: null,
        teamBLow: null,
        teamAHigh: null,
        teamBHigh: null,
        teamAMatchPts: 0,
        teamBMatchPts: 0,
        teamAMult: 1,
        teamBMult: 1,
        teamAPts: 0,
        teamBPts: 0,
      };
    }
    const info1 = getPlayerHoleInfo(h, partners[0]);
    const info2 = getPlayerHoleInfo(h, partners[1]);
    const info3 = getPlayerHoleInfo(h, partners[2]);
    const info4 = getPlayerHoleInfo(h, partners[3]);

    const s1 = info1.score !== null ? info1.netScore : null;
    const s2 = info2.score !== null ? info2.netScore : null;
    const s3 = info3.score !== null ? info3.netScore : null;
    const s4 = info4.score !== null ? info4.netScore : null;

    if (s1 === null || s2 === null || s3 === null || s4 === null) {
      return {
        teamALow: null,
        teamBLow: null,
        teamAHigh: null,
        teamBHigh: null,
        teamAMatchPts: 0,
        teamBMatchPts: 0,
        teamAMult: 1,
        teamBMult: 1,
        teamAPts: 0,
        teamBPts: 0,
      };
    }

    const teamALow = Math.min(s1, s2);
    const teamBLow = Math.min(s3, s4);
    const teamAHigh = Math.max(s1, s2);
    const teamBHigh = Math.max(s3, s4);

    const { teamAPoints, teamBPoints } = calculateHighLowPoints(s1, s2, s3, s4);

    const baseMultA = Math.max(
      getBaseMultiplier(info1.score, h.par),
      getBaseMultiplier(info2.score, h.par),
    );
    const baseMultB = Math.max(
      getBaseMultiplier(info3.score, h.par),
      getBaseMultiplier(info4.score, h.par),
    );

    const teamASandys = (info1.sandy ? 1 : 0) + (info2.sandy ? 1 : 0);
    const teamBSandys = (info3.sandy ? 1 : 0) + (info4.sandy ? 1 : 0);

    const teamAMult = baseMultA + teamASandys;
    const teamBMult = baseMultB + teamBSandys;

    return {
      teamALow,
      teamBLow,
      teamAHigh,
      teamBHigh,
      teamAMatchPts: teamAPoints,
      teamBMatchPts: teamBPoints,
      teamAMult,
      teamBMult,
      teamAPts: teamAPoints * teamAMult,
      teamBPts: teamBPoints * teamBMult,
    };
  };

  const getHighLowSummary = (holesList: any[]) => {
    let teamAMatchPtsTotal = 0;
    let teamBMatchPtsTotal = 0;
    let teamASandysTotal = 0;
    let teamBSandysTotal = 0;
    let teamAPtsTotal = 0;
    let teamBPtsTotal = 0;

    holesList.forEach((h) => {
      const stats = getHighLowHoleStats(h);
      teamAMatchPtsTotal += stats.teamAMatchPts;
      teamBMatchPtsTotal += stats.teamBMatchPts;

      const info1 = getPlayerHoleInfo(h, partners[0]);
      const info2 = getPlayerHoleInfo(h, partners[1]);
      const info3 = getPlayerHoleInfo(h, partners[2]);
      const info4 = getPlayerHoleInfo(h, partners[3]);

      teamASandysTotal += (info1.sandy ? 1 : 0) + (info2.sandy ? 1 : 0);
      teamBSandysTotal += (info3.sandy ? 1 : 0) + (info4.sandy ? 1 : 0);

      teamAPtsTotal += stats.teamAPts;
      teamBPtsTotal += stats.teamBPts;
    });

    let teamANormalized = 0;
    let teamBNormalized = 0;
    if (teamAPtsTotal > teamBPtsTotal) {
      teamANormalized = teamAPtsTotal - teamBPtsTotal;
    } else if (teamBPtsTotal > teamAPtsTotal) {
      teamBNormalized = teamBPtsTotal - teamAPtsTotal;
    }

    return {
      teamAMatchPts: teamAMatchPtsTotal,
      teamBMatchPts: teamBMatchPtsTotal,
      teamASandys: teamASandysTotal,
      teamBSandys: teamBSandysTotal,
      teamAPts: teamAPtsTotal,
      teamBPts: teamBPtsTotal,
      teamANormalized,
      teamBNormalized,
    };
  };

  const handleScoreChange = (holeId: number, text: string) => {
    let formattedText = text.replace(/[^0-9]/g, "");

    if (formattedText !== "") {
      const num = parseInt(formattedText, 10);
      if (num > 15) return;
      formattedText = num.toString();
    }

    setTextScores((prev) => ({ ...prev, [holeId]: formattedText }));
    const score = formattedText === "" ? -1 : parseInt(formattedText, 10);

    setHoles((prev) =>
      prev.map((h) => {
        if (h.holeId === holeId) {
          const strokes = calculateStrokes(displayHandicap, h.strokeIndex);
          const netScore = score > 0 ? score - strokes : null;
          const stablefordPoints =
            score !== null && score > 0 && netScore !== null
              ? Math.max(0, h.par - netScore + 2)
              : null;
          return {
            ...h,
            score: score !== null && score >= 0 ? score : null,
            netScore,
            stablefordPoints,
          };
        }
        return h;
      }),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = holes.map((h) => ({
        ...h,
        score: h.score !== null && h.score >= 0 ? h.score : 0,
      }));
      await updateHoleScoresApi(scoreCard!, payload);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFinishRound = async () => {
    Alert.alert("Finish Round", "Are you sure you want to finish this round?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            setSaving(true);
            const payload = holes.map((h) => ({
              ...h,
              isCompleted: true,
              score: h.score !== null && h.score >= 0 ? h.score : 0,
            }));
            await updateHoleScoresApi(scoreCard!, payload);
            Alert.alert("Success", "Round finished successfully", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to finish round. Please try again.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const sumScores = (arr: ScorecardHole[]) => {
    const total = arr.reduce((t, h) => t + (h.score || 0), 0);
    const hasAnyScore = arr.some(
      (h) => h.score !== null && h.score !== undefined,
    );
    return hasAnyScore ? total : "-";
  };
  const sumNet = (arr: ScorecardHole[]) => {
    const total = arr.reduce(
      (t, h) => t + (h.score !== null && h.score >= 0 ? h.netScore || 0 : 0),
      0,
    );
    const hasAnyScore = arr.some(
      (h) => h.score !== null && h.score !== undefined,
    );
    return hasAnyScore ? total : "-";
  };
  const sumYardage = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.yardage || 0), 0);
  const sumPar = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.par || 0), 0);
  const sumPts = (arr: ScorecardHole[]) => {
    if (!isStableford) return 0;
    const total = arr.reduce(
      (t, h) =>
        t + (h.score !== null && h.score >= 0 ? h.stablefordPoints || 0 : 0),
      0,
    );
    const hasAnyScore = arr.some(
      (h) => h.score !== null && h.score !== undefined,
    );
    return hasAnyScore ? total : "-";
  };

  const front9 = holes.slice(0, 9);
  const back9 = holes.slice(9, 18);

  const renderScoreIndicator = (
    score: number | null,
    par: number,
    isDark: boolean,
    rawValue: string,
  ) => {
    if (rawValue === "" || rawValue === undefined || score === null)
      return null;

    if (score === 0) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
            <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
          </View>
        </View>
      );
    }
    if (score === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
            <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
          </View>
        </View>
      );
    }

    const diff = score - par;

    if (diff === -3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
            <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
          </View>
        </View>
      );
    }
    if (diff === -2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
            <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
          </View>
        </View>
      );
    }
    if (diff === -1) {
      // Birdie: Single Green Circle
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
        </View>
      );
    }
    if (diff === 0) {
      return null;
    }
    if (diff === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
        </View>
      );
    }
    if (diff === 2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
            <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
          </View>
        </View>
      );
    }
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
    if (diff >= 4) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.singleSquare,
              { borderColor: isDark ? "#fff" : "#000" },
            ]}
          />
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <ThemedView
        style={{
          flex: 1,
          backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)",
          paddingTop: insets.top,
        }}
      >
        <Watermark />
        <ScrollView
          className="px-4 py-4 mt-0"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center mb-6 mt-4">
            <Skeleton
              isDark={isDark}
              width={40}
              height={40}
              borderRadius={20}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Skeleton
                isDark={isDark}
                width={180}
                height={24}
                style={{ marginBottom: 6 }}
                borderRadius={6}
              />
              <Skeleton
                isDark={isDark}
                width={100}
                height={16}
                borderRadius={4}
              />
            </View>
          </View>

          {/* Info Banner Skeleton */}
          <Skeleton
            isDark={isDark}
            width="100%"
            height={56}
            borderRadius={12}
            style={{ marginBottom: 20 }}
          />

          {/* Table Header Skeleton - Match 6 columns */}
          <View
            className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
          >
            {["Hole", "Stroke\nIndex", "Yards", "Par", "Score", "Net"].map(
              (_, i) => (
                <View key={i} className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={28}
                    height={12}
                    borderRadius={4}
                  />
                </View>
              ),
            )}
            {isStableford && (
              <View className="flex-1 items-center">
                <Skeleton
                  isDark={isDark}
                  width={28}
                  height={12}
                  borderRadius={4}
                />
              </View>
            )}
          </View>

          {/* Table Rows Skeleton */}
          <View
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {[...Array(18)].map((_, i) => (
              <View
                key={i}
                className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
              >
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={16}
                    height={16}
                    borderRadius={4}
                  />
                </View>
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={16}
                    height={16}
                    borderRadius={4}
                  />
                </View>
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={24}
                    height={16}
                    borderRadius={4}
                  />
                </View>
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={16}
                    height={16}
                    borderRadius={4}
                  />
                </View>
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={46}
                    height={36}
                    borderRadius={8}
                  />
                </View>
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={20}
                    height={16}
                    borderRadius={4}
                  />
                </View>
                {isStableford && (
                  <View className="flex-1 items-center">
                    <Skeleton
                      isDark={isDark}
                      width={20}
                      height={16}
                      borderRadius={4}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          <View className="mt-6 mb-12">
            <Skeleton
              isDark={isDark}
              width="100%"
              height={48}
              borderRadius={12}
            />
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)",
        }}
      >
        <Watermark />
        <Text style={{ color: "red" }}>{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 p-4 bg-[#8BC34A] rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </ThemedView>
    );
  }
  return (
    <ThemedView
      style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#F9FAFB" }}
    >
      <Watermark />

      <View
        className="px-4 pb-2 z-10 w-full"
        style={{
          backgroundColor: isDark ? "#161618" : "#FFFFFF",
          paddingTop: Math.max(insets.top, 16),
        }}
      >
        <View className="flex-row items-center mb-4 mt-0">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}
              >
                {courseName ? courseName : "Scorecard"}
                {isStableford && (
                  <Text
                    style={{ fontWeight: "400", fontSize: 13, opacity: 0.8 }}
                  >
                    {" "}
                    (Stableford)
                  </Text>
                )}
              </Text>
              <View
                className="flex-row items-center px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9",
                  borderWidth: 1,
                  borderColor: "#8BC34A",
                }}
              >
                <Ionicons name="person-outline" size={12} color="#8BC34A" />
                <Text
                  className="text-xs font-bold ml-1"
                  style={{ color: "#8BC34A" }}
                >
                  Handicap: {displayHandicap}
                </Text>
              </View>
            </View>
            {username && (
              <View className="flex-row items-center mt-1">
                <Ionicons
                  name="person-outline"
                  size={12}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}
                >
                  {username}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        className="px-4 flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {partners.length < 2 ? (
          <View
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              className="z-10 shadow-sm"
              style={{ backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
            >
              <View
                className={`flex-row items-center p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#444" : "#ddd",
                }}
              >
                {[
                  "Hole",
                  "Stroke\nIndex",
                  "Yards",
                  "Par",
                  "Score",
                  "Net",
                  ...(isStableford ? ["Pts"] : []),
                ].map((h) => (
                  <Text
                    key={h}
                    className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                    style={{ textAlignVertical: "center" }}
                  >
                    {h}
                  </Text>
                ))}
              </View>
            </View>

            {front9.map((h, index) => (
              <View
                key={h.holeId}
                className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
              >
                <Text
                  className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}
                >
                  {h.holeNumber}
                </Text>
                <Text
                  className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {h.strokeIndex}
                </Text>
                <Text
                  className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {h.yardage}
                </Text>
                <Text
                  className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}
                >
                  {h.par}
                </Text>
                <View
                  className="flex-1 items-center justify-center relative"
                  pointerEvents="none"
                >
                  {renderScoreIndicator(
                    h.score ?? null,
                    h.par,
                    isDark,
                    textScores[h.holeId] || "",
                  )}
                  <TextInput
                    style={{
                      width: 50,
                      height: 36,
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                      borderWidth: 0,
                      color: isDark ? "#fff" : "#000",
                      textAlign: "center",
                      borderRadius: 8,
                      paddingVertical: 0,
                      paddingHorizontal: 0,
                      zIndex: 10,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                    editable={false}
                    value={textScores[h.holeId] || ""}
                    placeholder="-"
                    placeholderTextColor={isDark ? "#666" : "#999"}
                  />
                </View>
                <Text
                  className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                >
                  {textScores[h.holeId] !== "" &&
                  textScores[h.holeId] !== undefined &&
                  parseInt(textScores[h.holeId]) >= 0
                    ? h.netScore
                    : "-"}
                </Text>
                {isStableford && (
                  <Text
                    className={`flex-1 text-center font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}
                  >
                    {textScores[h.holeId] !== "" &&
                    textScores[h.holeId] !== undefined &&
                    parseInt(textScores[h.holeId]) >= 0
                      ? h.stablefordPoints || 0
                      : "-"}
                  </Text>
                )}
              </View>
            ))}

            <View
              className={`flex-row p-3 ${isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
              style={{
                backgroundColor: isDark
                  ? "rgba(139,195,74,0.12)"
                  : "rgba(139,195,74,0.08)",
              }}
            >
              <Text
                className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
              >
                Front 9
              </Text>
              <Text className="flex-1" />
              <Text
                className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {sumYardage(front9)}
              </Text>
              <Text
                className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {sumPar(front9)}
              </Text>
              <Text
                className={`flex-1 text-center font-black text-xs ${isDark ? "text-white" : "text-black"}`}
              >
                {sumScores(front9)}
              </Text>
              <Text
                className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
              >
                {sumNet(front9)}
              </Text>
              {isStableford && (
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                >
                  {sumPts(front9)}
                </Text>
              )}
            </View>

            {back9.length > 0 &&
              back9.map((h, index) => (
                <View
                  key={h.holeId}
                  className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
                >
                  <Text
                    className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}
                  >
                    {h.holeNumber}
                  </Text>
                  <Text
                    className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {h.strokeIndex}
                  </Text>
                  <Text
                    className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {h.yardage}
                  </Text>
                  <Text
                    className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}
                  >
                    {h.par}
                  </Text>
                  <View
                    className="flex-1 items-center justify-center relative"
                    pointerEvents="none"
                  >
                    {renderScoreIndicator(
                      h.score ?? null,
                      h.par,
                      isDark,
                      textScores[h.holeId] || "",
                    )}
                    <TextInput
                      style={{
                        width: 50,
                        height: 36,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        borderWidth: 0,
                        color: isDark ? "#fff" : "#000",
                        textAlign: "center",
                        borderRadius: 8,
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                        zIndex: 10,
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                      editable={false}
                      value={textScores[h.holeId] || ""}
                      placeholder="-"
                      placeholderTextColor={isDark ? "#666" : "#999"}
                    />
                  </View>
                  <Text
                    className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                  >
                    {textScores[h.holeId] !== "" &&
                    textScores[h.holeId] !== undefined &&
                    parseInt(textScores[h.holeId]) >= 0
                      ? h.netScore
                      : "-"}
                  </Text>
                  {isStableford && (
                    <Text
                      className={`flex-1 text-center font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}
                    >
                      {textScores[h.holeId] !== "" &&
                      textScores[h.holeId] !== undefined &&
                      parseInt(textScores[h.holeId]) >= 0
                        ? h.stablefordPoints || 0
                        : "-"}
                    </Text>
                  )}
                </View>
              ))}

            {back9.length > 0 && (
              <View
                className={`flex-row p-3 ${isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
                style={{
                  backgroundColor: isDark
                    ? "rgba(139,195,74,0.12)"
                    : "rgba(139,195,74,0.08)",
                }}
              >
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                >
                  Back 9
                </Text>
                <Text className="flex-1" />
                <Text
                  className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {sumYardage(back9)}
                </Text>
                <Text
                  className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {sumPar(back9)}
                </Text>
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-white" : "text-black"}`}
                >
                  {sumScores(back9)}
                </Text>
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                >
                  {sumNet(back9)}
                </Text>
                {isStableford && (
                  <Text
                    className={`flex-1 text-center font-black text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                  >
                    {sumPts(back9)}
                  </Text>
                )}
              </View>
            )}

            <View
              className="flex-row p-3 items-center"
              style={{ backgroundColor: "#8BC34A" }}
            >
              <Text className="flex-1 text-center font-black text-l text-white">
                Grand Total
              </Text>
              <Text className="flex-1" />
              <Text className="flex-1 text-center font-bold text-l text-white">
                {sumYardage(holes)}
              </Text>
              <Text className="flex-1 text-center font-bold text-l text-white">
                {sumPar(holes)}
              </Text>
              <Text className="flex-1 text-center font-black text-l text-white">
                {sumScores(holes)}
              </Text>
              <Text className="flex-1 text-center font-black text-l text-white">
                {sumNet(holes)}
              </Text>
              {isStableford && (
                <Text className="flex-1 text-center font-black text-l text-white">
                  {sumPts(holes)}
                </Text>
              )}
            </View>
          </View>
        ) : (
          (() => {
            const totalWidth =
              50 +
              55 +
              60 +
              50 +
              partners.length * 95 +
              (isSplit6 && partners.length >= 3 ? 3 * 95 : 0);
            return (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}
              >
                <VStack
                  style={{
                    width: totalWidth,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {/* Headers */}
                  <HStack
                    style={{
                      paddingVertical: 12,
                      backgroundColor: isDark
                        ? "rgba(38,38,38,0.8)"
                        : "rgba(243,244,246,0.8)",
                      borderBottomWidth: 1,
                      borderColor: isDark ? "#444" : "#ddd",
                    }}
                  >
                    <ThemedText
                      style={{
                        width: 50,
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Hole
                    </ThemedText>
                    <ThemedText
                      style={{
                        width: 55,
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      SI
                    </ThemedText>
                    <ThemedText
                      style={{
                        width: 60,
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Yards
                    </ThemedText>
                    <ThemedText
                      style={{
                        width: 50,
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Par
                    </ThemedText>
                    {partners.map((p, idx) => {
                      let badgeText = "";
                      let badgeColor = "";
                      if (isHighLow) {
                        badgeText = idx < 2 ? "Team A" : "Team B";
                        badgeColor = idx < 2 ? "#0284c7" : "#e11d48";
                      }
                      return (
                        <VStack
                          key={p.playerId}
                          style={{ width: 95, alignItems: "center" }}
                        >
                          <ThemedText
                            numberOfLines={1}
                            style={{
                              textAlign: "center",
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {p.isPrimary ? "You" : p.name}
                          </ThemedText>
                          {badgeText !== "" && (
                            <View
                              style={{
                                backgroundColor: badgeColor,
                                borderRadius: 4,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                marginTop: 2,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 8,
                                  fontWeight: "700",
                                }}
                              >
                                {badgeText}
                              </Text>
                            </View>
                          )}
                        </VStack>
                      );
                    })}
                    {isSplit6 &&
                      partners.length >= 3 &&
                      partners.slice(0, 3).map((p) => (
                        <VStack
                          key={`pts-hdr-${p.playerId}`}
                          style={{
                            width: 95,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ThemedText
                            numberOfLines={1}
                            style={{
                              textAlign: "center",
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {`${p.isPrimary ? "You" : p.name} PTS`}
                          </ThemedText>
                        </VStack>
                      ))}
                  </HStack>

                  {/* Rows */}
                  {holes.map((h: any, index: number) => {
                    let s6Pts: number[] = [];
                    if (isSplit6 && partners.length >= 3) {
                      const s1 = getPlayerHoleInfo(h, partners[0]).score;
                      const s2 = getPlayerHoleInfo(h, partners[1]).score;
                      const s3 = getPlayerHoleInfo(h, partners[2]).score;
                      s6Pts = calculateSplitSixPoints(s1, s2, s3);
                    }

                    let hlStats: any = null;
                    if (isHighLow && partners.length >= 4) {
                      hlStats = getHighLowHoleStats(h);
                    }

                    return (
                      <View key={h.holeId}>
                        <HStack
                          style={{
                            paddingVertical: 8,
                            alignItems: "center",
                            borderBottomWidth: 0.5,
                            borderColor: isDark ? "#1e293b" : "#e2e8f0",
                            backgroundColor: isDark
                              ? "rgba(15, 23, 42, 0.7)"
                              : "rgba(255, 255, 255, 0.7)",
                          }}
                        >
                          <ThemedText
                            style={{ width: 50, textAlign: "center" }}
                          >
                            {h.holeNumber}
                          </ThemedText>
                          <ThemedText
                            style={{ width: 55, textAlign: "center" }}
                          >
                            {h.strokeIndex}
                          </ThemedText>
                          <ThemedText
                            style={{
                              width: 60,
                              textAlign: "center",
                              color: "#888",
                            }}
                          >
                            {h.yardage}
                          </ThemedText>
                          <ThemedText
                            style={{ width: 50, textAlign: "center" }}
                          >
                            {h.par}
                          </ThemedText>

                          {partners.map((p, pIndex) => {
                            const info = getPlayerHoleInfo(h, p);
                            return (
                              <View
                                key={p.playerId}
                                style={{
                                  width: 95,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <View
                                  style={{
                                    position: "relative",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 36,
                                    height: 36,
                                  }}
                                >
                                  {renderScoreIndicator(
                                    info.score,
                                    h.par,
                                    isDark,
                                    info.score !== null
                                      ? String(info.score)
                                      : "",
                                  )}
                                  <Text
                                    style={{
                                      color: isDark ? "#fff" : "#000",
                                      fontWeight: "700",
                                      fontSize: 13,
                                      textAlign: "center",
                                      zIndex: 10,
                                    }}
                                  >
                                    {info.score !== null ? info.score : "-"}
                                  </Text>
                                </View>

                                <HStack
                                  style={{
                                    alignItems: "center",
                                    gap: 4,
                                    marginTop: 4,
                                  }}
                                >
                                  {info.sandy && (
                                    <View
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        backgroundColor: "#2e7d32",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 9,
                                          fontWeight: "bold",
                                          color: "#fff",
                                        }}
                                      >
                                        S
                                      </Text>
                                    </View>
                                  )}

                                  {isSplit6 &&
                                    s6Pts.length > 0 &&
                                    info.score !== null && (
                                      <Text
                                        style={{
                                          fontSize: 9,
                                          color: "#84cc16",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        P:{s6Pts[pIndex]}
                                      </Text>
                                    )}

                                  {isHighLow &&
                                    hlStats &&
                                    info.score !== null && (
                                      <Text
                                        style={{
                                          fontSize: 9,
                                          color:
                                            pIndex < 2 ? "#38bdf8" : "#f43f5e",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        N:{info.netScore}
                                      </Text>
                                    )}

                                  {!isSplit6 &&
                                    !isHighLow &&
                                    info.score !== null && (
                                      <>
                                        {isStableford ? (
                                          <Text
                                            style={{
                                              fontSize: 9,
                                              color: "#f59e0b",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            P:{info.stablefordPoints ?? 0}
                                          </Text>
                                        ) : (
                                          <Text
                                            style={{
                                              fontSize: 9,
                                              color: "#84cc16",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            N:{info.netScore}
                                          </Text>
                                        )}
                                      </>
                                    )}
                                </HStack>
                              </View>
                            );
                          })}
                          {isSplit6 &&
                            partners.length >= 3 &&
                            (() => {
                              const s1 = getPlayerHoleInfo(
                                h,
                                partners[0],
                              ).score;
                              const s2 = getPlayerHoleInfo(
                                h,
                                partners[1],
                              ).score;
                              const s3 = getPlayerHoleInfo(
                                h,
                                partners[2],
                              ).score;
                              const pts = calculateSplitSixPoints(s1, s2, s3);
                              const raw1 = getPlayerHoleInfo(
                                h,
                                partners[0],
                              ).score;
                              const raw2 = getPlayerHoleInfo(
                                h,
                                partners[1],
                              ).score;
                              const raw3 = getPlayerHoleInfo(
                                h,
                                partners[2],
                              ).score;
                              const hasScore =
                                raw1 !== null && raw2 !== null && raw3 !== null;

                              return partners.slice(0, 3).map((p, idx) => (
                                <View
                                  key={`pts-${h.holeId}-${p.playerId}`}
                                  style={{
                                    width: 95,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ThemedText
                                    style={{
                                      fontWeight: "bold",
                                      color: "#84cc16",
                                      fontSize: 13,
                                    }}
                                  >
                                    {hasScore ? pts[idx] : "-"}
                                  </ThemedText>
                                </View>
                              ));
                            })()}
                        </HStack>

                        {/* FRONT 9 TOTALS ROW */}
                        {h.holeNumber === 9 && (
                          <HStack
                            style={{
                              backgroundColor: isDark
                                ? "rgba(38,38,38,0.8)"
                                : "rgba(243,244,246,0.8)",
                              paddingVertical: 10,
                              borderTopWidth: 1,
                              borderColor: isDark ? "#444" : "#ddd",
                            }}
                          >
                            <ThemedText
                              style={{
                                width: 50,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              F9
                            </ThemedText>
                            <ThemedText
                              style={{ width: 55, textAlign: "center" }}
                            />
                            <ThemedText
                              style={{ width: 60, textAlign: "center" }}
                            >
                              {sumYardage(front9)}
                            </ThemedText>
                            <ThemedText
                              style={{ width: 50, textAlign: "center" }}
                            >
                              {sumPar(front9)}
                            </ThemedText>
                            {partners.map((p) => {
                              const t = getPlayerTotals(front9, p);
                              return (
                                <VStack
                                  key={p.playerId}
                                  style={{ width: 95, alignItems: "center" }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: "700",
                                      color: isDark ? "#fff" : "#000",
                                    }}
                                  >
                                    G:{t.gross}
                                  </Text>
                                  {isStableford ? (
                                    <Text
                                      style={{ fontSize: 9, color: "#f59e0b" }}
                                    >
                                      Pts:{t.stableford}
                                    </Text>
                                  ) : (
                                    <Text
                                      style={{ fontSize: 9, color: "#84cc16" }}
                                    >
                                      Net:{t.net}
                                    </Text>
                                  )}
                                </VStack>
                              );
                            })}
                            {isSplit6 &&
                              partners.length >= 3 &&
                              (() => {
                                let f9Pts = [0, 0, 0];
                                let hasAnyF9 = false;
                                front9.forEach((fh) => {
                                  const raw1 = getPlayerHoleInfo(
                                    fh,
                                    partners[0],
                                  ).score;
                                  const raw2 = getPlayerHoleInfo(
                                    fh,
                                    partners[1],
                                  ).score;
                                  const raw3 = getPlayerHoleInfo(
                                    fh,
                                    partners[2],
                                  ).score;
                                  if (
                                    raw1 !== null &&
                                    raw2 !== null &&
                                    raw3 !== null
                                  ) {
                                    const s1 = getPlayerHoleInfo(
                                      fh,
                                      partners[0],
                                    ).score;
                                    const s2 = getPlayerHoleInfo(
                                      fh,
                                      partners[1],
                                    ).score;
                                    const s3 = getPlayerHoleInfo(
                                      fh,
                                      partners[2],
                                    ).score;
                                    const pts = calculateSplitSixPoints(
                                      s1,
                                      s2,
                                      s3,
                                    );
                                    f9Pts[0] += pts[0];
                                    f9Pts[1] += pts[1];
                                    f9Pts[2] += pts[2];
                                    hasAnyF9 = true;
                                  }
                                });
                                return partners.slice(0, 3).map((p, idx) => (
                                  <VStack
                                    key={`f9-pts-${p.playerId}`}
                                    style={{
                                      width: 95,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {hasAnyF9 ? f9Pts[idx] : "-"}
                                    </Text>
                                  </VStack>
                                ));
                              })()}
                          </HStack>
                        )}

                        {/* BACK 9 TOTALS ROW */}
                        {h.holeNumber === 18 && (
                          <HStack
                            style={{
                              backgroundColor: isDark
                                ? "rgba(38,38,38,0.8)"
                                : "rgba(243,244,246,0.8)",
                              paddingVertical: 10,
                              borderTopWidth: 1,
                              borderColor: isDark ? "#444" : "#ddd",
                            }}
                          >
                            <ThemedText
                              style={{
                                width: 50,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              B9
                            </ThemedText>
                            <ThemedText
                              style={{ width: 55, textAlign: "center" }}
                            />
                            <ThemedText
                              style={{ width: 60, textAlign: "center" }}
                            >
                              {sumYardage(back9)}
                            </ThemedText>
                            <ThemedText
                              style={{ width: 50, textAlign: "center" }}
                            >
                              {sumPar(back9)}
                            </ThemedText>
                            {partners.map((p) => {
                              const t = getPlayerTotals(back9, p);
                              return (
                                <VStack
                                  key={p.playerId}
                                  style={{ width: 95, alignItems: "center" }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: "700",
                                      color: isDark ? "#fff" : "#000",
                                    }}
                                  >
                                    G:{t.gross}
                                  </Text>
                                  {isStableford ? (
                                    <Text
                                      style={{ fontSize: 9, color: "#f59e0b" }}
                                    >
                                      Pts:{t.stableford}
                                    </Text>
                                  ) : (
                                    <Text
                                      style={{ fontSize: 9, color: "#84cc16" }}
                                    >
                                      Net:{t.net}
                                    </Text>
                                  )}
                                </VStack>
                              );
                            })}
                            {isSplit6 &&
                              partners.length >= 3 &&
                              (() => {
                                let b9Pts = [0, 0, 0];
                                let hasAnyB9 = false;
                                back9.forEach((bh) => {
                                  const raw1 = getPlayerHoleInfo(
                                    bh,
                                    partners[0],
                                  ).score;
                                  const raw2 = getPlayerHoleInfo(
                                    bh,
                                    partners[1],
                                  ).score;
                                  const raw3 = getPlayerHoleInfo(
                                    bh,
                                    partners[2],
                                  ).score;
                                  if (
                                    raw1 !== null &&
                                    raw2 !== null &&
                                    raw3 !== null
                                  ) {
                                    const s1 = getPlayerHoleInfo(
                                      bh,
                                      partners[0],
                                    ).score;
                                    const s2 = getPlayerHoleInfo(
                                      bh,
                                      partners[1],
                                    ).score;
                                    const s3 = getPlayerHoleInfo(
                                      bh,
                                      partners[2],
                                    ).score;
                                    const pts = calculateSplitSixPoints(
                                      s1,
                                      s2,
                                      s3,
                                    );
                                    b9Pts[0] += pts[0];
                                    b9Pts[1] += pts[1];
                                    b9Pts[2] += pts[2];
                                    hasAnyB9 = true;
                                  }
                                });
                                return partners.slice(0, 3).map((p, idx) => (
                                  <VStack
                                    key={`b9-pts-${p.playerId}`}
                                    style={{
                                      width: 95,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {hasAnyB9 ? b9Pts[idx] : "-"}
                                    </Text>
                                  </VStack>
                                ));
                              })()}
                          </HStack>
                        )}
                      </View>
                    );
                  })}

                  {/* GRAND TOTAL */}
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
                        width: 50,
                        textAlign: "center",
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      Total
                    </ThemedText>
                    <ThemedText style={{ width: 55, textAlign: "center" }} />
                    <ThemedText
                      style={{ width: 60, textAlign: "center", color: "#fff" }}
                    >
                      {sumYardage(holes)}
                    </ThemedText>
                    <ThemedText
                      style={{ width: 50, textAlign: "center", color: "#fff" }}
                    >
                      {sumPar(holes)}
                    </ThemedText>
                    {partners.map((p) => {
                      const t = getPlayerTotals(holes, p);
                      return (
                        <VStack
                          key={p.playerId}
                          style={{ width: 95, alignItems: "center" }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color: "#fff",
                            }}
                          >
                            G:{t.gross}
                          </Text>
                          {isStableford ? (
                            <Text
                              style={{
                                fontSize: 9,
                                color: "#fff",
                                fontWeight: "600",
                              }}
                            >
                              Pts:{t.stableford}
                            </Text>
                          ) : (
                            <Text
                              style={{
                                fontSize: 9,
                                color: "#fff",
                                fontWeight: "600",
                              }}
                            >
                              Net:{t.net}
                            </Text>
                          )}
                        </VStack>
                      );
                    })}
                    {isSplit6 &&
                      partners.length >= 3 &&
                      (() => {
                        let totalPts = [0, 0, 0];
                        let hasAnyTotal = false;
                        holes.forEach((th) => {
                          const raw1 = getPlayerHoleInfo(th, partners[0]).score;
                          const raw2 = getPlayerHoleInfo(th, partners[1]).score;
                          const raw3 = getPlayerHoleInfo(th, partners[2]).score;
                          if (raw1 !== null && raw2 !== null && raw3 !== null) {
                            const s1 = getPlayerHoleInfo(th, partners[0]).score;
                            const s2 = getPlayerHoleInfo(th, partners[1]).score;
                            const s3 = getPlayerHoleInfo(th, partners[2]).score;
                            const pts = calculateSplitSixPoints(s1, s2, s3);
                            totalPts[0] += pts[0];
                            totalPts[1] += pts[1];
                            totalPts[2] += pts[2];
                            hasAnyTotal = true;
                          }
                        });
                        return partners.slice(0, 3).map((p, idx) => (
                          <VStack
                            key={`total-pts-${p.playerId}`}
                            style={{
                              width: 95,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "800",
                                color: "#fff",
                              }}
                            >
                              {hasAnyTotal ? totalPts[idx] : "-"}
                            </Text>
                          </VStack>
                        ));
                      })()}
                  </HStack>
                </VStack>
              </ScrollView>
            );
          })()
        )}

        {/* 🔹 SUMMARY TABLES FOR SIDE GAMES */}
        {partners.length >= 2 && (
          <VStack
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              gap: 12,
              marginBottom: 10,
            }}
          >
            {isSplit6 && partners.length >= 3 && (
              <>
                <ThemedText
                  style={{ fontSize: 15, fontWeight: "700", marginBottom: 4 }}
                >
                  Split Six (9-Points) Standings
                </ThemedText>
                {(() => {
                  const summary = (() => {
                    let p1Total = 0;
                    let p2Total = 0;
                    let p3Total = 0;
                    holes.forEach((h: any) => {
                      const raw1 = getPlayerHoleInfo(h, partners[0]).score;
                      const raw2 = getPlayerHoleInfo(h, partners[1]).score;
                      const raw3 = getPlayerHoleInfo(h, partners[2]).score;
                      if (raw1 !== null && raw2 !== null && raw3 !== null) {
                        const s1 = getPlayerHoleInfo(h, partners[0]).score;
                        const s2 = getPlayerHoleInfo(h, partners[1]).score;
                        const s3 = getPlayerHoleInfo(h, partners[2]).score;
                        const [pts1, pts2, pts3] = calculateSplitSixPoints(
                          s1,
                          s2,
                          s3,
                        );
                        p1Total += pts1;
                        p2Total += pts2;
                        p3Total += pts3;
                      }
                    });
                    return { p1Total, p2Total, p3Total };
                  })();
                  return (
                    <VStack style={{ gap: 8 }}>
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          borderBottomWidth: 0.5,
                          borderColor: isDark ? "#444" : "#ddd",
                        }}
                      >
                        <ThemedText style={{ fontWeight: "600", fontSize: 13 }}>
                          Player
                        </ThemedText>
                        <ThemedText style={{ fontWeight: "600", fontSize: 13 }}>
                          Total Points
                        </ThemedText>
                      </HStack>
                      {partners.slice(0, 3).map((p, idx) => {
                        const totalPts =
                          idx === 0
                            ? summary.p1Total
                            : idx === 1
                              ? summary.p2Total
                              : summary.p3Total;
                        return (
                          <HStack
                            key={p.playerId}
                            style={{
                              justifyContent: "space-between",
                              paddingVertical: 4,
                            }}
                          >
                            <ThemedText style={{ fontSize: 13 }}>
                              {p.isPrimary ? "You" : p.name}
                            </ThemedText>
                            <ThemedText
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: "#84cc16",
                              }}
                            >
                              {totalPts} pts
                            </ThemedText>
                          </HStack>
                        );
                      })}
                    </VStack>
                  );
                })()}
              </>
            )}

            {isHighLow && partners.length >= 4 && (
              <>
                <ThemedText
                  style={{ fontSize: 15, fontWeight: "700", marginBottom: 4 }}
                >
                  High-Low Side Game Summary
                </ThemedText>
                {(() => {
                  const summary = getHighLowSummary(holes);
                  return (
                    <VStack style={{ gap: 10 }}>
                      {/* Table Header */}
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          borderBottomWidth: 0.5,
                          borderColor: isDark ? "#444" : "#ddd",
                        }}
                      >
                        <ThemedText
                          style={{ fontWeight: "600", fontSize: 13, flex: 2 }}
                        >
                          Team
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontWeight: "600",
                            fontSize: 13,
                            flex: 1,
                            textAlign: "center",
                          }}
                        >
                          Match Pts
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontWeight: "600",
                            fontSize: 13,
                            flex: 1,
                            textAlign: "center",
                          }}
                        >
                          Sandys
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontWeight: "600",
                            fontSize: 13,
                            flex: 1.2,
                            textAlign: "right",
                          }}
                        >
                          Total Points
                        </ThemedText>
                      </HStack>

                      {/* Team A */}
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 4,
                        }}
                      >
                        <VStack style={{ flex: 2 }}>
                          <ThemedText
                            style={{ fontSize: 13, fontWeight: "600" }}
                          >
                            Team A
                          </ThemedText>
                          <ThemedText style={{ fontSize: 10, color: "#888" }}>
                            {partners[0].name} & {partners[1].name}
                          </ThemedText>
                        </VStack>
                        <ThemedText
                          style={{ fontSize: 13, flex: 1, textAlign: "center" }}
                        >
                          {summary.teamAMatchPts}
                        </ThemedText>
                        <ThemedText
                          style={{ fontSize: 13, flex: 1, textAlign: "center" }}
                        >
                          {summary.teamASandys}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 13,
                            flex: 1.2,
                            textAlign: "right",
                            fontWeight: "700",
                            color: "#0284c7",
                          }}
                        >
                          {summary.teamAPts} pts
                        </ThemedText>
                      </HStack>

                      {/* Team B */}
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 4,
                        }}
                      >
                        <VStack style={{ flex: 2 }}>
                          <ThemedText
                            style={{ fontSize: 13, fontWeight: "600" }}
                          >
                            Team B
                          </ThemedText>
                          <ThemedText style={{ fontSize: 10, color: "#888" }}>
                            {partners[2].name} & {partners[3].name}
                          </ThemedText>
                        </VStack>
                        <ThemedText
                          style={{ fontSize: 13, flex: 1, textAlign: "center" }}
                        >
                          {summary.teamBMatchPts}
                        </ThemedText>
                        <ThemedText
                          style={{ fontSize: 13, flex: 1, textAlign: "center" }}
                        >
                          {summary.teamBSandys}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 13,
                            flex: 1.2,
                            textAlign: "right",
                            fontWeight: "700",
                            color: "#e11d48",
                          }}
                        >
                          {summary.teamBPts} pts
                        </ThemedText>
                      </HStack>

                      {/* Divider */}
                      <View
                        style={{
                          height: 0.5,
                          backgroundColor: isDark ? "#444" : "#ddd",
                          marginVertical: 4,
                        }}
                      />

                      {/* Normalized Standings */}
                      <VStack style={{ gap: 4 }}>
                        <ThemedText style={{ fontSize: 12, fontWeight: "700" }}>
                          Standings (Normalized):
                        </ThemedText>
                        {summary.teamANormalized > 0 ? (
                          <ThemedText
                            style={{
                              fontSize: 13,
                              color: "#0284c7",
                              fontWeight: "600",
                            }}
                          >
                            Team A wins by {summary.teamANormalized} points!
                          </ThemedText>
                        ) : summary.teamBNormalized > 0 ? (
                          <ThemedText
                            style={{
                              fontSize: 13,
                              color: "#e11d48",
                              fontWeight: "600",
                            }}
                          >
                            Team B wins by {summary.teamBNormalized} points!
                          </ThemedText>
                        ) : (
                          <ThemedText
                            style={{
                              fontSize: 13,
                              color: "#888",
                              fontWeight: "600",
                            }}
                          >
                            The match is a tie!
                          </ThemedText>
                        )}
                      </VStack>
                    </VStack>
                  );
                })()}
              </>
            )}
          </VStack>
        )}

        {(() => {
          const scoreCounts: Record<string, number> = {
            holeInOne: 0,
            albatross: 0,
            eagle: 0,
            birdie: 0,
            par: 0,
            bogey: 0,
            doubleBogey: 0,
            tripleBogey: 0,
            quadBogey: 0,
          };

          holes.forEach((h) => {
            const playersToCount =
              partners.length >= 2
                ? partners
                : [{ isPrimary: true, playerId: "p1" }];
            playersToCount.forEach((p) => {
              let s: number | null = null;
              if (partners.length >= 2) {
                const info = getPlayerHoleInfo(h, p);
                s = info.score;
              } else {
                s = h.score;
              }

              if (s == null || s < 0) return;

              if (s === 1) scoreCounts.holeInOne++;
              else if (s === 0) scoreCounts.albatross++;
              else {
                const diff = s - h.par;
                if (diff === -3) scoreCounts.albatross++;
                else if (diff === -2) scoreCounts.eagle++;
                else if (diff === -1) scoreCounts.birdie++;
                else if (diff === 0) scoreCounts.par++;
                else if (diff === 1) scoreCounts.bogey++;
                else if (diff === 2) scoreCounts.doubleBogey++;
                else if (diff === 3) scoreCounts.tripleBogey++;
                else if (diff >= 4) scoreCounts.quadBogey++;
              }
            });
          });

          const InnerCount = ({
            count,
            color,
            small = false,
          }: {
            count: number;
            color: string;
            small?: boolean;
          }) =>
            count > 0 ? (
              <Text
                style={{
                  color,
                  fontSize: small ? 9 : 13,
                  fontWeight: "900",
                  textAlign: "center",
                  lineHeight: small ? 11 : 15,
                }}
              >
                {count}
              </Text>
            ) : null;

          const dynamicLegend = [
            {
              label: "Hole-in-One",
              count: scoreCounts.holeInOne,
              render: (count: number) => (
                <View
                  style={[
                    styles.doubleCircle,
                    {
                      borderColor: "#ffd700",
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerCircle,
                      {
                        borderColor: "#ffd700",
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <InnerCount count={count} color="#ffd700" />
                  </View>
                </View>
              ),
            },
            {
              label: "Albatross",
              count: scoreCounts.albatross,
              render: (count: number) => (
                <View
                  style={[
                    styles.doubleCircle,
                    {
                      borderColor: "#006064",
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerCircle,
                      {
                        borderColor: "#006064",
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <InnerCount count={count} color="#006064" />
                  </View>
                </View>
              ),
            },
            {
              label: "Eagle",
              count: scoreCounts.eagle,
              render: (count: number) => (
                <View
                  style={[
                    styles.doubleCircle,
                    {
                      borderColor: "#2e7d32",
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerCircle,
                      {
                        borderColor: "#2e7d32",
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <InnerCount count={count} color="#2e7d32" />
                  </View>
                </View>
              ),
            },
            {
              label: "Birdie",
              count: scoreCounts.birdie,
              render: (count: number) => (
                <View
                  style={[
                    styles.singleCircle,
                    {
                      borderColor: "#2e7d32",
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <InnerCount count={count} color="#2e7d32" />
                </View>
              ),
            },
            {
              label: "Par",
              count: scoreCounts.par,
              render: (count: number) => (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: "#9CA3AF",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <InnerCount count={count} color="#6B7280" />
                </View>
              ),
            },
            {
              label: "Bogey",
              count: scoreCounts.bogey,
              render: (count: number) => (
                <View
                  style={[
                    styles.singleSquare,
                    {
                      borderColor: "#d32f2f",
                      width: 48,
                      height: 48,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <InnerCount count={count} color="#d32f2f" />
                </View>
              ),
            },
            {
              label: "Double Bogey",
              count: scoreCounts.doubleBogey,
              render: (count: number) => (
                <View
                  style={[
                    styles.doubleSquare,
                    { borderColor: "#d32f2f", width: 48, height: 48 },
                  ]}
                >
                  <View
                    style={[
                      styles.innerSquare,
                      {
                        borderColor: "#d32f2f",
                        width: 34,
                        height: 34,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <InnerCount count={count} color="#d32f2f" />
                  </View>
                </View>
              ),
            },
            {
              label: "Triple Bogey",
              count: scoreCounts.tripleBogey,
              render: (count: number) => (
                <View
                  style={[
                    styles.tripleSquareOuter,
                    { borderColor: "#6a1b9a", width: 48, height: 48 },
                  ]}
                >
                  <View
                    style={[
                      styles.tripleSquareMid,
                      { borderColor: "#6a1b9a", width: 37, height: 37 },
                    ]}
                  >
                    <View
                      style={[
                        styles.tripleSquareInner,
                        {
                          borderColor: "#6a1b9a",
                          width: 26,
                          height: 26,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <InnerCount count={count} color="#6a1b9a" small />
                    </View>
                  </View>
                </View>
              ),
            },
            {
              label: "Quad Bogey+",
              count: scoreCounts.quadBogey,
              render: (count: number) => (
                <View
                  style={[
                    styles.singleSquare,
                    {
                      borderColor: isDark ? "#fff" : "#000",
                      width: 48,
                      height: 48,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <InnerCount count={count} color={isDark ? "#fff" : "#000"} />
                </View>
              ),
            },
          ];

          const rows: (typeof dynamicLegend)[] = [];
          for (let i = 0; i < dynamicLegend.length; i += 3) {
            rows.push(dynamicLegend.slice(i, i + 3));
          }

          return (
            <View
              className="mb-20 p-4 rounded-2xl"
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
              {rows.map((row, rowIdx) => (
                <View
                  key={rowIdx}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginBottom: 20,
                  }}
                >
                  {row.map((item, idx) => {
                    return (
                      <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                        {item.render(item.count)}
                        <Text
                          style={{
                            fontSize: 11,
                            marginTop: 6,
                            fontWeight: "500",
                            color: isDark ? "#D1D5DB" : "#4B5563",
                            textAlign: "center",
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          );
        })()}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  indicatorContainer: {
    position: "absolute",
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  doubleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  singleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  doubleSquare: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  innerSquare: {
    width: 28,
    height: 28,
    borderRadius: 2,
    borderWidth: 1.5,
  },
  singleSquare: {
    width: 34,
    height: 34,
    borderRadius: 4,
    borderWidth: 2,
  },
  tripleSquareOuter: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareMid: {
    width: 31,
    height: 31,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareInner: {
    width: 22,
    height: 22,
    borderRadius: 2,
    borderWidth: 1.5,
  },
});

export default ScoreCard;
