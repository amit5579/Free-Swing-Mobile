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
  computeHighLowSummary,
  computeHighLowHolePoints,
  computeNassauState,
  formatNassauHouses,
  formatNassauHousesSpaced,
  computeSplitSixSummary,
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
  const teamAColor = isDark ? "#4ade80" : "#198754";
  const teamBColor = isDark ? "#60a5fa" : "#0d6efd";
  const renderNassauHouses = (houses: number[], isTotalRow?: boolean) => {
    return (houses || []).map((val: number, idx: number, arr: number[]) => {
      let color = isDark ? "#fff" : "#000";
      if (isTotalRow) {
        if (val > 0) color = "#1b4332"; // dark green for Team A
        if (val < 0) color = "#1e3a8a"; // dark blue for Team B
      } else {
        if (val > 0) color = "#198754"; // green for Team A (web color)
        if (val < 0) color = "#0d6efd"; // blue for Team B (web color)
      }
      return (
        <Text
          key={idx}
          style={{
            color,
            fontWeight: "bold",
            fontSize: 11,
          }}
        >
          {Math.abs(val)}
          {idx < arr.length - 1 ? " " : ""}
        </Text>
      );
    });
  };
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
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);

  // Multiplayer layout state variables
  const [partners, setPartners] = useState<any[]>([]);
  const [companionHandicaps, setCompanionHandicaps] = useState<
    Record<number, number>
  >({});
  const [isHighLow, setIsHighLow] = useState(false);
  const [isSplit6, setIsSplit6] = useState(false);
  const [isNassauBest, setIsNassauBest] = useState(false);
  const [isNassauCombined, setIsNassauCombined] = useState(false);
  const [isGross, setIsGross] = useState(false);
  const isNassau = isNassauBest || isNassauCombined;

  const getPlayerName = (p: any) => {
    if (!p) return "Player";
    if (p.isPrimary) return "You";
    return (
      p.name ||
      p.username ||
      p.nickName ||
      p.firstName ||
      p.fullName ||
      "Player"
    );
  };

  const isExcluded = holes.length > 0 && holes.some((h: any) => h.isExcluded);
  const isSystem36 = holes.length > 0 && holes.some(
    (h: any) =>
      h.matchScoringType === "system-36" ||
      h.scoringType === "system-36" ||
      h.scoring_type === "system-36" ||
      h.isSystem36 === true ||
      h.IsSystem36 === true
  );

  const getScoringLabel = () => {
    if (holes.length === 0) return "";

    if (isExcluded && !isStableford) return "Net Score • Exclude Par 3";
    if (!isExcluded && isStableford) return "Stableford";
    if (
      !isExcluded &&
      !isStableford &&
      !isSplit6 &&
      !isHighLow &&
      !isGross &&
      !isNassau
    )
      return "Net Score • Include Par 3";
    if (isExcluded && isStableford) return "Stableford • Exclude Par 3";
    if (
      isGross &&
      !isExcluded &&
      !isStableford &&
      !isSplit6 &&
      !isHighLow &&
      !isNassau
    )
      return "Gross Score";
    if (!isExcluded && !isStableford && isSplit6 && !isHighLow)
      return "Split Six";
    if (!isExcluded && !isStableford && !isSplit6 && isHighLow)
      return "High-Low";
    if (isNassauBest) return "Nassau • Best Score";
    if (isNassauCombined) return "Nassau • Combined Score";
    if (isSystem36) return "System 36";
    return "";
  };

  const showNetColumns =
    getScoringLabel() === "Net Score • Include Par 3" ||
    getScoringLabel() === "Net Score • Exclude Par 3" ||
    getScoringLabel() === "Stableford" ||
    getScoringLabel() === "Stableford • Exclude Par 3";

  const showPtsColumns = isStableford || isSystem36;

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        setLoading(true);
        const rawData = await getScorecardDetails(scoreCard!);
        const data = rawData.map((h: any) => ({
          ...h,
          courseHalf:
            h.courseHalf !== undefined && h.courseHalf !== null
              ? h.courseHalf
              : h.CourseHalf,
          companionScoresJson:
            h.companionScoresJson !== undefined &&
            h.companionScoresJson !== null
              ? h.companionScoresJson
              : h.CompanionScoresJson,
          companionSandysJson:
            h.companionSandysJson !== undefined &&
            h.companionSandysJson !== null
              ? h.companionSandysJson
              : h.CompanionSandysJson,
          playingPartnersJson:
            h.playingPartnersJson !== undefined &&
            h.playingPartnersJson !== null
              ? h.playingPartnersJson
              : h.PlayingPartnersJson,
          playingGroupRoundKey:
            h.playingGroupRoundKey !== undefined &&
            h.playingGroupRoundKey !== null
              ? h.playingGroupRoundKey
              : h.PlayingGroupRoundKey,
          matchScoringType:
            h.matchScoringType !== undefined && h.matchScoringType !== null
              ? h.matchScoringType
              : h.MatchScoringType,
          nassauStartingNine:
            h.nassauStartingNine !== undefined && h.nassauStartingNine !== null
              ? h.nassauStartingNine
              : h.NassauStartingNine,
          netScore:
            h.netScore !== undefined && h.netScore !== null
              ? h.netScore
              : h.NetScore,
          score: h.score !== undefined && h.score !== null ? h.score : h.Score,
          stablefordPoints:
            h.stablefordPoints !== undefined && h.stablefordPoints !== null
              ? h.stablefordPoints
              : h.StablefordPoints,
        }));
        // console.log("dd",data);
        

        // Parse partners
        let parsedPartners: any[] = [];
        const firstHole = data[0];
        if (firstHole) {
          if ((firstHole as any).playingPartnersJson) {
            try {
              parsedPartners =
                typeof (firstHole as any).playingPartnersJson === "string"
                  ? JSON.parse((firstHole as any).playingPartnersJson)
                  : (firstHole as any).playingPartnersJson;
              const sortedPartners = (parsedPartners || []).slice().sort((a: any, b: any) => {
                const teamA = a.team ?? 1;
                const teamB = b.team ?? 1;
                return teamA - teamB;
              });
              setPartners(sortedPartners);
            } catch (e) {
              console.error("Error parsing playingPartnersJson:", e);
            }
          }
        }

        const mode = firstHole
          ? (
              (firstHole as any).scoringType ||
              (firstHole as any).scoring_type ||
              (firstHole as any).matchScoringType ||
              (firstHole as any).match_scoring_type ||
              ""
            ).toLowerCase()
          : "";

        const showPts = data.some(
          (h) =>
            h.stablefordPoints !== null && h.stablefordPoints !== undefined,
        );
        const isStablefordMode = mode ? mode.includes("stableford") : showPts;
        setIsStableford(isStablefordMode);

        const is9HoleRound =
          data.length === 9 ||
          (data.length > 0 &&
            (data[0].courseHalf === "Front9" ||
              data[0].courseHalf === "Back9"));

        const getInitialStrokes = (
          playerHandicap: number,
          strokeIndex: number,
        ) => {
          const rawHc = Math.round(Number(playerHandicap) || 0);
          const hc = is9HoleRound ? Math.round(rawHc / 2) : rawHc;

          if (hc >= 0) {
            const base = Math.floor(hc / 18);
            const remainder = hc % 18;
            return base + (strokeIndex <= remainder ? 1 : 0);
          } else {
            const absHandicap = Math.abs(hc);
            const base = Math.floor(absHandicap / 18);
            const remainder = absHandicap % 18;
            return -(base + (strokeIndex > 18 - remainder ? 1 : 0));
          }
        };

        const sanitizedData = data.map((h) => {
          const score =
            h.score !== null && h.score !== undefined ? Number(h.score) : null;
          let strokes = getInitialStrokes(
            Number(displayHandicap || 0),
            h.strokeIndex,
          );
          if (h.isExcluded && h.par === 3) {
            strokes = 0;
          }
          const isDP = h.isDoublePeoria === true;
          const netScore =
            score !== null && score >= 0
              ? isDP
                ? score
                : score - strokes
              : null;
          let stablefordPoints = null;
          if (score !== null && score > 0) {
            if (isSystem36) {
              stablefordPoints = score <= h.par ? 2 : score === h.par + 1 ? 1 : 0;
            } else if (netScore !== null) {
              stablefordPoints = Math.max(0, h.par - netScore + 2);
            }
          }

          return {
            ...h,
            score,
            netScore:
              h.netScore !== null && h.netScore !== undefined
                ? h.netScore
                : netScore,
            stablefordPoints:
              h.stablefordPoints !== null && h.stablefordPoints !== undefined
                ? h.stablefordPoints
                : stablefordPoints,
          };
        });

        setHoles(sanitizedData);

        const initialText: Record<number, string> = {};
        sanitizedData.forEach((h) => {
          if (h.score != null && h.score >= 0) {
            initialText[h.holeId] = h.score.toString();
          }
        });
        setTextScores(initialText);

        const isGr =
          mode.includes("gross_score") ||
          mode.includes("gross") ||
          mode === "gross";
        setIsGross(isGr);

        const pLength = parsedPartners.length;
        const isNB =
          mode.includes("nassau_best") || mode.includes("nassau-best");
        const isNC =
          mode.includes("nassau_combined") || mode.includes("nassau-combined");
        const isHL =
          (mode.includes("high_low") ||
            mode.includes("high-low") ||
            (pLength === 4 && !isGr)) &&
          !(isNB || isNC);
        const isS6 =
          (mode.includes("split_six") ||
            mode.includes("split-six") ||
            (pLength === 3 && !isGr)) &&
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
      } catch (err) {
        setError("Failed to load scorecard.");
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, [scoreCard]);

  const is9Hole =
    holes.length === 9 ||
    (holes.length > 0 &&
      (holes[0].courseHalf === "Front9" || holes[0].courseHalf === "Back9"));

  const calculateStrokes = (playerHandicap: number, strokeIndex: number) => {
    const rawHc = Math.round(Number(playerHandicap) || 0);
    const hc = is9Hole ? Math.round(rawHc / 2) : rawHc;

    if (hc >= 0) {
      const base = Math.floor(hc / 18);
      const remainder = hc % 18;
      // Positive handicap: Receives strokes on hardest holes (lowest index)
      return base + (strokeIndex <= remainder ? 1 : 0);
    } else {
      const absHandicap = Math.abs(hc);
      const base = Math.floor(absHandicap / 18);
      const remainder = absHandicap % 18;
      // Plus handicap: Gives strokes back on easiest holes (highest index)
      return -(base + (strokeIndex > 18 - remainder ? 1 : 0));
    }
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
    } else if (isSystem36 && rawScore !== null && rawScore > 0) {
      // System 36: 2 pts for par or better, 1 pt for bogey, 0 otherwise
      if (rawScore <= hole.par) stablefordPoints = 2;
      else if (rawScore === hole.par + 1) stablefordPoints = 1;
      else stablefordPoints = 0;
    }

    return {
      score: rawScore,
      netScore,
      stablefordPoints,
      sandy,
    };
  };

  const getBadgeMultiplier = (
    score: number | null,
    par: number,
    isSandy: boolean,
  ) => {
    if (score === null || score < 0) return 0;
    const diff = score - par;
    let basePoints = 0;
    if (score === 1) {
      basePoints = 25;
    } else if (diff <= -3) {
      basePoints = 15;
    } else if (diff === -2) {
      basePoints = 5;
    } else if (diff === -1) {
      basePoints = 2;
    } else {
      basePoints = 0;
    }

    let sandyBonus = 0;
    if (isSandy && diff <= 0) {
      sandyBonus = 1;
    }
    return basePoints + sandyBonus;
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
          let strokes = calculateStrokes(displayHandicap, h.strokeIndex);
          if (h.isExcluded && h.par === 3) {
            strokes = 0;
          }
          const isDP = h.isDoublePeoria === true;
          const netScore = score > 0 ? (isDP ? score : score - strokes) : null;
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
        matchScoringType: isSplit6
          ? "split-six"
          : isHighLow
            ? "high-low"
            : isNassauBest
              ? "nassau-best"
              : isNassauCombined
                ? "nassau-combined"
                : isGross
                  ? "gross"
                  : h.matchScoringType || null,
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
              matchScoringType: isSplit6
                ? "split-six"
                : isHighLow
                  ? "high-low"
                  : isNassauBest
                    ? "nassau-best"
                    : isNassauCombined
                      ? "nassau-combined"
                      : isGross
                        ? "gross"
                        : h.matchScoringType || null,
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
    if (!showPtsColumns) return 0;
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

  const courseHalfStr = holes.length > 0 ? (holes[0] as any).courseHalf : null;
  const isFront9Only =
    courseHalfStr === "Front9" || courseHalfStr === "Front 9";
  const isBack9Only = courseHalfStr === "Back9" || courseHalfStr === "Back 9";
  useEffect(() => {
    // console.log("inside useEffect   courseHalfStr", courseHalfStr);
  }, [courseHalfStr]);
  const nassauStartingNine =
    holes[0]?.nassauStartingNine || holes[0]?.NassauStartingNine || null;

  const rawDisplayHoles = holes.filter((h: any) => {
    if (isFront9Only) return h.holeNumber <= 9;
    if (isBack9Only) return h.holeNumber > 9;
    return true;
  });

  const displayHoles =
    nassauStartingNine === "back"
      ? [...rawDisplayHoles].sort((a: any, b: any) => {
          const aVal =
            a.holeNumber >= 10 ? a.holeNumber - 10 : a.holeNumber + 8;
          const bVal =
            b.holeNumber >= 10 ? b.holeNumber - 10 : b.holeNumber + 8;
          return aVal - bVal;
        })
      : rawDisplayHoles;

  const front9 =
    nassauStartingNine === "back"
      ? displayHoles.filter((h: any) => h.holeNumber > 9)
      : displayHoles.filter((h: any) => h.holeNumber <= 9);
  const back9 =
    nassauStartingNine === "back"
      ? displayHoles.filter((h: any) => h.holeNumber <= 9)
      : displayHoles.filter((h: any) => h.holeNumber > 9);

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
            {[
              "Hole",
              "Stroke\nIndex",
              "Yards",
              "Par",
              "Score",
              ...(showNetColumns ? ["Net"] : []),
            ].map((_, i) => (
                <View key={i} className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={28}
                    height={12}
                    borderRadius={4}
                  />
                </View>
              ))}
            {showPtsColumns && (
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
                {!isGross && (
                  <View className="flex-1 items-center">
                    <Skeleton
                      isDark={isDark}
                      width={20}
                      height={16}
                      borderRadius={4}
                    />
                  </View>
                )}
                {showPtsColumns && (
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

  const renderHeader = () => {
    return (
      <View
        className="px-4 pb-4"
        style={{
          backgroundColor: isDark ? "#161618" : "#FFFFFF",
          paddingTop: Math.max(insets.top, 16),
        }}
      >
        {/* Top Row */}
        <View className="flex-row items-center">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full items-center justify-center mr-3"
            style={{
              backgroundColor: "#8BC34A",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Title Section */}
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {courseName || "Scorecard"}
            </Text>

            <View className="flex-row items-center mt-1 flex-wrap">
              {getScoringLabel() !== "" && (
                <Text
                  className={`text-xs mr-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {getScoringLabel()}
                </Text>
              )}
              {isSystem36 && (
                <Text
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isDark
                      ? "text-sky-400 bg-sky-400/20"
                      : "text-sky-600 bg-sky-600/10"
                  }`}
                >
                  Sys36 HC: {holes.some((h: any) => h.score !== null && h.score > 0) ? 36 - Number(sumPts(holes)) : "N/A"}
                </Text>
              )}

              {username && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="person-outline"
                    size={12}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text
                    className={`text-xs ml-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {username}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Handicap Badge */}
          {/* <View
            className="px-3 py-2 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9",
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: "#8BC34A" }}
            >
              HCP {displayHandicap}
            </Text>
          </View> */}

          {/* Toggle Button */}
          <Pressable
            onPress={() => setIsDetailsVisible(!isDetailsVisible)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              marginLeft: 12,
            }}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
          >
            <Ionicons
              name={isDetailsVisible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={isDark ? "#fff" : "#020617"}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ThemedView
      style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#F9FAFB" }}
    >
      <Watermark />

      {renderHeader()}

      <ScrollView className="px-4 flex-1" showsVerticalScrollIndicator={false}>
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
                  isDetailsVisible && "Stroke\nIndex",
                  isDetailsVisible && "Yards",
                  "Par",
                  "Score",
                  !isGross && showNetColumns && "Net",
                  showPtsColumns && (isSystem36 ? "Sys36\nPts" : "Pts"),
                ]
                  .filter(Boolean)
                  .map((h) => (
                    <Text
                      key={h as string}
                      className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                      style={{ textAlignVertical: "center" }}
                    >
                      {h as string}
                    </Text>
                  ))}
              </View>
            </View>

            {front9.length > 0 &&
              front9.map((h, index) => (
                <View
                  key={h.holeId}
                  className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
                >
                  <Text
                    className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}
                  >
                    {h.holeNumber}
                  </Text>
                  {isDetailsVisible && (
                    <>
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
                    </>
                  )}
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
                  {!isGross && (
                    <Text
                      className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                    >
                      {h.netScore !== null && h.netScore !== undefined
                        ? h.netScore
                        : "-"}
                    </Text>
                  )}
                  {showPtsColumns && (
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

            {front9.length > 0 && (
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
                {isDetailsVisible && (
                  <>
                    <Text className="flex-1" />
                    <Text
                      className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {sumYardage(front9)}
                    </Text>
                  </>
                )}
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
                {!isGross && (
                  <Text
                    className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                  >
                    {sumNet(front9)}
                  </Text>
                )}
                {showPtsColumns && (
                  <Text
                    className={`flex-1 text-center font-black text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                  >
                    {sumPts(front9)}
                  </Text>
                )}
              </View>
            )}

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
                  {isDetailsVisible && (
                    <>
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
                    </>
                  )}
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
                  {!isGross && (
                    <Text
                      className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                    >
                      {h.netScore !== null && h.netScore !== undefined
                        ? h.netScore
                        : "-"}
                    </Text>
                  )}
                  {showPtsColumns && (
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
                {isDetailsVisible && (
                  <>
                    <Text className="flex-1" />
                    <Text
                      className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {sumYardage(back9)}
                    </Text>
                  </>
                )}
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
                {!isGross && (
                  <Text
                    className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                  >
                    {sumNet(back9)}
                  </Text>
                )}
                {showPtsColumns && (
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
              {isDetailsVisible && (
                <>
                  <Text className="flex-1" />
                  <Text className="flex-1 text-center font-bold text-l text-white">
                    {sumYardage(displayHoles)}
                  </Text>
                </>
              )}
              <Text className="flex-1 text-center font-bold text-l text-white">
                {sumPar(displayHoles)}
              </Text>
              <Text className="flex-1 text-center font-black text-l text-white">
                {sumScores(displayHoles)}
              </Text>
              {!isGross && (
                <Text className="flex-1 text-center font-black text-l text-white">
                  {sumNet(displayHoles)}
                </Text>
              )}
              {showPtsColumns && (
                <Text className="flex-1 text-center font-black text-l text-white">
                  {sumPts(displayHoles)}
                </Text>
              )}
            </View>
          </View>
        ) : (
          (() => {
            const mode = isNassauBest ? "best" : "combined";
            const teamAPartners =
              partners.length >= 4 ? [partners[0], partners[1]] : [partners[0]];
            const teamBPartners =
              partners.length >= 4 ? [partners[2], partners[3]] : [partners[1]];

            let ns: any = null;
            if (isNassau && partners.length >= 2) {
              const allData = displayHoles.map((h: any) => {
                const teamAInfos = teamAPartners.map((p: any) =>
                  getPlayerHoleInfo(h, p),
                );
                const teamBInfos = teamBPartners.map((p: any) =>
                  getPlayerHoleInfo(h, p),
                );
                return {
                  holeNumber: h.holeNumber,
                  par: h.par,
                  teamANetScores: teamAInfos.map((i: any) =>
                    i.score !== null ? i.netScore : null,
                  ),
                  teamBNetScores: teamBInfos.map((i: any) =>
                    i.score !== null ? i.netScore : null,
                  ),
                  teamARawScores: teamAInfos.map((i: any) => i.score),
                  teamBRawScores: teamBInfos.map((i: any) => i.score),
                  teamASandys: teamAInfos.map((i: any) => i.sandy),
                  teamBSandys: teamBInfos.map((i: any) => i.sandy),
                };
              });
              ns = computeNassauState(mode as "best" | "combined", allData);
            }

            const colHoleWidth = 40;
            const colParWidth = 40;
            const colSIWidth = 40;
            const colYardsWidth = 45;
            const colPartnerWidth = 65;
            const colSplit6Width = 70;
            const colHighLowWidth = 65;
            const colNassauWidth = 80;

            const totalWidth =
              colHoleWidth +
              colParWidth + // Par is always visible
              (isDetailsVisible ? colSIWidth + colYardsWidth : 0) +
              partners.length * colPartnerWidth +
              (isSplit6 && partners.length >= 3 ? 3 * colSplit6Width : 0) +
              (isHighLow && partners.length >= 4 ? 2 * colHighLowWidth : 0) +
              (isNassau && partners.length >= 2 ? colNassauWidth : 0);
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
                        width: colHoleWidth,
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Hole
                    </ThemedText>
                    {isDetailsVisible && (
                      <>
                        <ThemedText
                          style={{
                            width: colSIWidth,
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          SI
                        </ThemedText>
                        <ThemedText
                          style={{
                            width: colYardsWidth,
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          Yards
                        </ThemedText>
                      </>
                    )}
                    <ThemedText
                      style={{
                        width: colParWidth,
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
                        badgeColor = idx < 2 ? teamAColor : teamBColor;
                      } else if (isNassau) {
                        const isTeamA = idx < (partners.length >= 4 ? 2 : 1);
                        badgeText = isTeamA ? "Team A" : "Team B";
                        badgeColor = isTeamA ? teamAColor : teamBColor;
                      }
                      return (
                        <VStack
                          key={p.playerId}
                          style={{ width: colPartnerWidth, alignItems: "center" }}
                        >
                          <ThemedText
                            style={{
                              textAlign: "center",
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {getPlayerName(p)}
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
                            width: colSplit6Width,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ThemedText
                            style={{
                              textAlign: "center",
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {`${getPlayerName(p)} PTS`}
                          </ThemedText>
                        </VStack>
                      ))}
                    {isHighLow && partners.length >= 4 && (
                      <>
                        <VStack
                          style={{
                            width: colHighLowWidth,
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
                              color: teamAColor,
                            }}
                          >
                            Team A Pts
                          </ThemedText>
                        </VStack>
                        <VStack
                          style={{
                            width: colHighLowWidth,
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
                              color: teamBColor,
                            }}
                          >
                            Team B Pts
                          </ThemedText>
                        </VStack>
                      </>
                    )}
                    {isNassau && partners.length >= 2 && (
                      <VStack
                        style={{
                          width: colNassauWidth,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ThemedText
                          style={{
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          Nassau Pts
                        </ThemedText>
                      </VStack>
                    )}
                  </HStack>

                  {/* Rows */}
                  {displayHoles.map((h: any, index: number) => {
                    let s6Pts: number[] = [];
                    if (isSplit6 && partners.length >= 3) {
                      const s1 = getPlayerHoleInfo(h, partners[0]).score;
                      const s2 = getPlayerHoleInfo(h, partners[1]).score;
                      const s3 = getPlayerHoleInfo(h, partners[2]).score;
                      s6Pts = calculateSplitSixPoints(s1, s2, s3);
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
                            style={{ width: colHoleWidth, textAlign: "center" }}
                          >
                            {h.holeNumber}
                          </ThemedText>
                          {isDetailsVisible && (
                            <>
                              <ThemedText
                                style={{ width: colSIWidth, textAlign: "center" }}
                              >
                                {h.strokeIndex}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  width: colYardsWidth,
                                  textAlign: "center",
                                  color: "#888",
                                }}
                              >
                                {h.yardage}
                              </ThemedText>
                            </>
                          )}
                          <ThemedText
                            style={{ width: colParWidth, textAlign: "center" }}
                          >
                            {h.par}
                          </ThemedText>

                          {partners.map((p, pIndex) => {
                            const info = getPlayerHoleInfo(h, p);

                            let bgColor = "transparent";
                            if (
                              isNassau &&
                              ns &&
                              ns.holeResults[h.holeNumber]
                            ) {
                              const winner =
                                ns.holeResults[h.holeNumber].winner;
                              const isTeamA =
                                pIndex < (partners.length >= 4 ? 2 : 1);
                              if (winner === "teamA" && isTeamA)
                                bgColor = "rgba(25, 135, 84, 0.15)";
                              if (winner === "teamB" && !isTeamA)
                                bgColor = "rgba(13, 110, 253, 0.15)";
                            }

                            return (
                              <View key={p.playerId} style={{ flexDirection: "row" }}>
                                <View
                                  style={{
                                    width: showPtsColumns ? 50 : colPartnerWidth,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: bgColor,
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

                                    {/* {isSplit6 &&
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
                                      )} */}

                                    {info.score !== null &&
                                      getScoringLabel() !==
                                        "Net Score • Include Par 3" &&
                                      getScoringLabel() !==
                                        "Net Score • Exclude Par 3" &&
                                      getScoringLabel() !== "Stableford" &&
                                      getScoringLabel() !==
                                        "Stableford • Exclude Par 3" &&
                                      (() => {
                                        const badgeVal = getBadgeMultiplier(
                                          info.score,
                                          h.par,
                                          info.sandy,
                                        );
                                        if (badgeVal > 0) {
                                          return (
                                            <Text
                                              style={{
                                                fontSize: 9,
                                                color: "#f59e0b",
                                                fontWeight: "bold",
                                              }}
                                            >
                                              {badgeVal}x
                                            </Text>
                                          );
                                        }
                                        return null;
                                      })()}

                                    {/* {isHighLow &&
                                        partners.length >= 4 &&
                                        info.score !== null && (
                                          <Text
                                            style={{
                                              fontSize: 9,
                                              color:
                                                pIndex < 2 ? teamAColor : teamBColor,
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
                                        )} */}
                                  </HStack>
                                </View>
                                {showPtsColumns && (
                                  <View style={{ width: 45, alignItems: "center", justifyContent: "center" }}>
                                    <Text
                                      style={{
                                        color: isDark ? "#fff" : "#000",
                                        fontWeight: "700",
                                        fontSize: 12,
                                        textAlign: "center",
                                      }}
                                    >
                                      {info.score !== null && info.score >= 0 ? info.stablefordPoints ?? 0 : "-"}
                                    </Text>
                                  </View>
                                )}
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
                                    width: colSplit6Width,
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

                          {isHighLow &&
                            partners.length >= 4 &&
                            (() => {
                              const i1 = getPlayerHoleInfo(h, partners[0]);
                              const i2 = getPlayerHoleInfo(h, partners[1]);
                              const i3 = getPlayerHoleInfo(h, partners[2]);
                              const i4 = getPlayerHoleInfo(h, partners[3]);
                              const hasScore =
                                i1.score !== null &&
                                i2.score !== null &&
                                i3.score !== null &&
                                i4.score !== null;
                              const pts = hasScore
                                ? computeHighLowHolePoints(
                                    [i1.score, i2.score],
                                    [i3.score, i4.score],
                                  )
                                : { teamA: "-", teamB: "-" };

                              return (
                                <>
                                  <View
                                    key={`hl-a-${h.holeId}`}
                                    style={{
                                      width: colHighLowWidth,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "bold",
                                        color: teamAColor,
                                        fontSize: 13,
                                      }}
                                    >
                                      {pts.teamA}
                                    </ThemedText>
                                  </View>
                                  <View
                                    key={`hl-b-${h.holeId}`}
                                    style={{
                                      width: colHighLowWidth,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "bold",
                                        color: teamBColor,
                                        fontSize: 13,
                                      }}
                                    >
                                      {pts.teamB}
                                    </ThemedText>
                                  </View>
                                </>
                              );
                            })()}
                          {isNassau &&
                            partners.length >= 2 &&
                            (() => {
                              const hRes = ns?.holeResults[h.holeNumber];
                              if (!hRes) return <View style={{ width: colNassauWidth }} />;

                              return (
                                <View
                                  style={{
                                    width: colNassauWidth,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {renderNassauHouses(hRes.overallHousesDisplay)}
                                  {(nassauStartingNine === "back"
                                    ? h.holeNumber <= 9
                                    : h.holeNumber >= 10) &&
                                    hRes.housesDisplay.length > 0 && (
                                      <Text
                                        style={{
                                          color: isDark ? "#94a3b8" : "#64748b",
                                          fontSize: 11,
                                        }}
                                      >
                                        {" & "}
                                      </Text>
                                    )}
                                  {(nassauStartingNine === "back"
                                    ? h.holeNumber <= 9
                                    : h.holeNumber >= 10) &&
                                    renderNassauHouses(hRes.housesDisplay)}
                                </View>
                              );
                            })()}
                        </HStack>

                        {/* FRONT 9 TOTALS ROW */}
                        {(nassauStartingNine === "back"
                          ? index === 8
                          : h.holeNumber === 9) && (
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
                                width: colHoleWidth,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              {nassauStartingNine === "back" ? "B9" : "F9"}
                            </ThemedText>
                            {isDetailsVisible && (
                              <>
                                <ThemedText
                                  style={{ width: colSIWidth, textAlign: "center" }}
                                />
                                <ThemedText
                                  style={{ width: colYardsWidth, textAlign: "center" }}
                                >
                                  {sumYardage(front9)}
                                </ThemedText>
                              </>
                            )}
                            <ThemedText
                              style={{ width: colParWidth, textAlign: "center" }}
                            >
                              {sumPar(front9)}
                            </ThemedText>
                            {partners.map((p) => {
                              const t = getPlayerTotals(front9, p);
                              return (
                                <View key={p.playerId} style={{ flexDirection: "row" }}>
                                  <VStack
                                    style={{ width: showPtsColumns ? 50 : colPartnerWidth, alignItems: "center" }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {t.gross}
                                    </ThemedText>
                                    {/* {isStableford ? (
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
                                    )} */}
                                  </VStack>
                                  {showPtsColumns && (
                                    <VStack style={{ width: 45, alignItems: "center" }}>
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#fff" : "#000",
                                        }}
                                      >
                                        {t.stableford}
                                      </ThemedText>
                                    </VStack>
                                  )}
                                </View>
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
                                      width: colSplit6Width,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {hasAnyF9 ? f9Pts[idx] : "-"}
                                    </ThemedText>
                                  </VStack>
                                ));
                              })()}

                            {isHighLow &&
                              partners.length >= 4 &&
                              (() => {
                                let f9PtsA = 0;
                                let f9PtsB = 0;
                                let hasAnyF9 = false;
                                front9.forEach((fh) => {
                                  const i1 = getPlayerHoleInfo(fh, partners[0]);
                                  const i2 = getPlayerHoleInfo(fh, partners[1]);
                                  const i3 = getPlayerHoleInfo(fh, partners[2]);
                                  const i4 = getPlayerHoleInfo(fh, partners[3]);
                                  if (
                                    i1.score !== null &&
                                    i2.score !== null &&
                                    i3.score !== null &&
                                    i4.score !== null
                                  ) {
                                    const pts = computeHighLowHolePoints(
                                      [i1.score, i2.score],
                                      [i3.score, i4.score],
                                    );
                                    f9PtsA += pts.teamA;
                                    f9PtsB += pts.teamB;
                                    hasAnyF9 = true;
                                  }
                                });
                                return (
                                  <>
                                    <VStack
                                      style={{
                                        width: colHighLowWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#fff" : "#000",
                                        }}
                                      >
                                        {hasAnyF9 ? f9PtsA : "-"}
                                      </ThemedText>
                                    </VStack>
                                    <VStack
                                      style={{
                                        width: colHighLowWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#fff" : "#000",
                                        }}
                                      >
                                        {hasAnyF9 ? f9PtsB : "-"}
                                      </ThemedText>
                                    </VStack>
                                  </>
                                );
                              })()}
                            {isNassau && partners.length >= 2 && ns && (
                              <VStack
                                style={{
                                  width: colNassauWidth,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                }}
                              >
                                {renderNassauHouses(
                                  nassauStartingNine === "back"
                                    ? ns.back9Houses
                                    : ns.front9Houses,
                                )}
                              </VStack>
                            )}
                          </HStack>
                        )}

                        {/* BACK 9 TOTALS ROW */}
                        {(nassauStartingNine === "back"
                          ? index === 17
                          : h.holeNumber === 18) && (
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
                                width: colHoleWidth,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              {nassauStartingNine === "back" ? "F9" : "B9"}
                            </ThemedText>
                            {isDetailsVisible && (
                              <>
                                <ThemedText
                                  style={{ width: colSIWidth, textAlign: "center" }}
                                />
                                <ThemedText
                                  style={{ width: colYardsWidth, textAlign: "center" }}
                                >
                                  {sumYardage(back9)}
                                </ThemedText>
                              </>
                            )}
                            <ThemedText
                              style={{ width: colParWidth, textAlign: "center" }}
                            >
                              {sumPar(back9)}
                            </ThemedText>
                            {partners.map((p) => {
                              const t = getPlayerTotals(back9, p);
                              return (
                                <View key={p.playerId} style={{ flexDirection: "row" }}>
                                  <VStack
                                    style={{ width: showPtsColumns ? 50 : colPartnerWidth, alignItems: "center" }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {t.gross}
                                    </ThemedText>
                                    {/* {isStableford ? (
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
                                    )} */}
                                  </VStack>
                                  {showPtsColumns && (
                                    <VStack style={{ width: 45, alignItems: "center" }}>
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#fff" : "#000",
                                        }}
                                      >
                                        {t.stableford}
                                      </ThemedText>
                                    </VStack>
                                  )}
                                </View>
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
                                      width: colSplit6Width,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {hasAnyB9 ? b9Pts[idx] : "-"}
                                    </ThemedText>
                                  </VStack>
                                ));
                              })()}

                            {isHighLow &&
                              partners.length >= 4 &&
                              (() => {
                                let b9PtsA = 0;
                                let b9PtsB = 0;
                                let hasAnyB9 = false;
                                back9.forEach((fh) => {
                                  const i1 = getPlayerHoleInfo(fh, partners[0]);
                                  const i2 = getPlayerHoleInfo(fh, partners[1]);
                                  const i3 = getPlayerHoleInfo(fh, partners[2]);
                                  const i4 = getPlayerHoleInfo(fh, partners[3]);
                                  if (
                                    i1.score !== null &&
                                    i2.score !== null &&
                                    i3.score !== null &&
                                    i4.score !== null
                                  ) {
                                    const pts = computeHighLowHolePoints(
                                      [i1.score, i2.score],
                                      [i3.score, i4.score],
                                    );
                                    b9PtsA += pts.teamA;
                                    b9PtsB += pts.teamB;
                                    hasAnyB9 = true;
                                  }
                                });
                                return (
                                  <>
                                    <VStack
                                      style={{
                                        width: colHighLowWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#fff" : "#000",
                                        }}
                                      >
                                        {hasAnyB9 ? b9PtsA : "-"}
                                      </ThemedText>
                                    </VStack>
                                    <VStack
                                      style={{
                                        width: colHighLowWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#fff" : "#000",
                                        }}
                                      >
                                        {hasAnyB9 ? b9PtsB : "-"}
                                      </ThemedText>
                                    </VStack>
                                  </>
                                );
                              })()}
                            {isNassau && partners.length >= 2 && ns && (
                              <VStack
                                style={{
                                  width: colNassauWidth,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                }}
                              >
                                {renderNassauHouses(
                                  nassauStartingNine === "back"
                                    ? ns.front9Houses
                                    : ns.back9Houses,
                                )}
                              </VStack>
                            )}
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
                        width: colHoleWidth,
                        textAlign: "center",
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      Total
                    </ThemedText>
                    {isDetailsVisible && (
                      <>
                        <ThemedText
                          style={{ width: colSIWidth, textAlign: "center" }}
                        />
                        <ThemedText
                          style={{
                            width: colYardsWidth,
                            textAlign: "center",
                            color: "#fff",
                          }}
                        >
                          {sumYardage(holes)}
                        </ThemedText>
                      </>
                    )}
                    <ThemedText
                      style={{ width: colParWidth, textAlign: "center", color: "#fff" }}
                    >
                      {sumPar(holes)}
                    </ThemedText>
                    {partners.map((p) => {
                      const t = getPlayerTotals(holes, p);
                      return (
                        <View key={p.playerId} style={{ flexDirection: "row" }}>
                          <VStack
                            style={{ width: showPtsColumns ? 50 : colPartnerWidth, alignItems: "center" }}
                          >
                            <ThemedText
                              style={{
                                textAlign: "center",
                                color: "#fff",
                                fontWeight: "700",
                              }}
                            >
                              {t.gross}
                            </ThemedText>
                            {/* {isStableford ? (
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
                            )} */}
                          </VStack>
                          {showPtsColumns && (
                            <VStack style={{ width: 45, alignItems: "center" }}>
                              <ThemedText
                                style={{
                                  textAlign: "center",
                                  color: "#fff",
                                  fontWeight: "700",
                                }}
                              >
                                {t.stableford}
                              </ThemedText>
                            </VStack>
                          )}
                        </View>
                      );
                    })}
                    {isSplit6 &&
                      partners.length >= 3 &&
                      (() => {
                        let totalPts = [0, 0, 0];
                        let hasAnyTotal = false;
                        displayHoles.forEach((th) => {
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
                              width: colSplit6Width,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ThemedText
                              style={{
                                fontWeight: "800",
                                color: "#fff",
                              }}
                            >
                              {hasAnyTotal ? totalPts[idx] : "-"}
                            </ThemedText>
                          </VStack>
                        ));
                      })()}

                    {isHighLow &&
                      partners.length >= 4 &&
                      (() => {
                        let totalPtsA = 0;
                        let totalPtsB = 0;
                        let hasAnyTotal = false;
                        displayHoles.forEach((fh) => {
                          const i1 = getPlayerHoleInfo(fh, partners[0]);
                          const i2 = getPlayerHoleInfo(fh, partners[1]);
                          const i3 = getPlayerHoleInfo(fh, partners[2]);
                          const i4 = getPlayerHoleInfo(fh, partners[3]);
                          if (
                            i1.score !== null &&
                            i2.score !== null &&
                            i3.score !== null &&
                            i4.score !== null
                          ) {
                            const pts = computeHighLowHolePoints(
                              [i1.score, i2.score],
                              [i3.score, i4.score],
                            );
                            totalPtsA += pts.teamA;
                            totalPtsB += pts.teamB;
                            hasAnyTotal = true;
                          }
                        });
                        return (
                          <>
                            <VStack
                              style={{
                                width: colHighLowWidth,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  color: "#fff",
                                }}
                              >
                                {hasAnyTotal ? totalPtsA : "-"}
                              </ThemedText>
                            </VStack>
                            <VStack
                              style={{
                                width: colHighLowWidth,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  color: "#fff",
                                }}
                              >
                                {hasAnyTotal ? totalPtsB : "-"}
                              </ThemedText>
                            </VStack>
                          </>
                        );
                      })()}
                    {isNassau && partners.length >= 2 && ns && (
                      <VStack
                        style={{
                          width: colNassauWidth,
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          flexWrap: "wrap",
                        }}
                      >
                        {renderNassauHouses(ns.overallHouses, true)}
                      </VStack>
                    )}
                  </HStack>
                </VStack>
              </ScrollView>
            );
          })()
        )}

        {/* 🔹 SUMMARY TABLES FOR SIDE GAMES */}
        {(isHighLow || isSplit6 || isNassauBest || isNassauCombined) &&
          partners.length >= 2 && (
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
              {isSplit6 &&
                partners.length >= 3 &&
                (() => {
                  const allData = displayHoles.map((h: any) => {
                    const i1 = getPlayerHoleInfo(h, partners[0]);
                    const i2 = getPlayerHoleInfo(h, partners[1]);
                    const i3 = getPlayerHoleInfo(h, partners[2]);
                    return {
                      holeNumber: h.holeNumber,
                      p1Score: i1.score,
                      p2Score: i2.score,
                      p3Score: i3.score,
                      p1Net: i1.score !== null ? i1.netScore : null,
                      p2Net: i2.score !== null ? i2.netScore : null,
                      p3Net: i3.score !== null ? i3.netScore : null,
                      par: h.par,
                      p1Sandy: i1.sandy,
                      p2Sandy: i2.sandy,
                      p3Sandy: i3.sandy,
                    };
                  });
                  const s = computeSplitSixSummary(allData);
                  const pNames = partners
                    .slice(0, 3)
                    .map((p: any) => getPlayerName(p));
                  const hasBack = displayHoles.some(
                    (h: any) => h.holeNumber > 9,
                  );
                  const SumRow = ({
                    label,
                    vals,
                    bold = false,
                  }: {
                    label: string;
                    vals: [number, number, number];
                    bold?: boolean;
                  }) => (
                    <HStack
                      style={{
                        justifyContent: "space-between",
                        paddingVertical: 5,
                        borderBottomWidth: 0.5,
                        borderColor: isDark ? "#333" : "#e5e5e5",
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: bold ? "700" : "500",
                          flex: 1,
                        }}
                      >
                        {label}
                      </ThemedText>
                      {vals.map((v, i) => (
                        <ThemedText
                          key={i}
                          style={{
                            fontSize: 12,
                            fontWeight: bold ? "700" : "500",
                            width: 60,
                            textAlign: "center",
                            color: bold ? "#84cc16" : isDark ? "white" : "black",
                          }}
                        >
                          {v}
                        </ThemedText>
                      ))}
                    </HStack>
                  );
                  return (
                    <>
                      <ThemedText
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          marginBottom: 8,
                        }}
                      >
                        Split Six Summary
                      </ThemedText>
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          borderBottomWidth: 1,
                          borderColor: isDark ? "#444" : "#ddd",
                        }}
                      >
                        <ThemedText
                          style={{
                            fontWeight: "700",
                            fontSize: 12,
                            flex: 1,
                          }}
                        >
                          Row
                        </ThemedText>
                        {pNames.map((n: string, i: number) => (
                          <ThemedText
                            key={i}
                            style={{
                              fontWeight: "700",
                              fontSize: 11,
                              width: 60,
                              textAlign: "center",
                            }}
                          >
                            {n}
                          </ThemedText>
                        ))}
                      </HStack>
                      <SumRow label="1–6" vals={s.segment1_6} />
                      <SumRow label="7–12" vals={s.segment7_12} />
                      <SumRow label="13–18" vals={s.segment13_18} />
                      <SumRow
                        label="Overall Match Pts"
                        vals={s.overallMatchPts}
                        bold
                      />
                      <SumRow label="Final X Points" vals={s.finalXPoints} />
                      <SumRow label="Final Score" vals={s.finalScore} bold />
                    </>
                  );
                })()}

              {isHighLow && partners.length >= 4 && (
                <>
                  <ThemedText
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    High-Low Summary
                  </ThemedText>
                  {(() => {
                    const allData = displayHoles.map((h: any) => {
                      const i1 = getPlayerHoleInfo(h, partners[0]);
                      const i2 = getPlayerHoleInfo(h, partners[1]);
                      const i3 = getPlayerHoleInfo(h, partners[2]);
                      const i4 = getPlayerHoleInfo(h, partners[3]);
                      return {
                        holeNumber: h.holeNumber,
                        par: h.par,
                        teamAScores: [i1.score, i2.score] as [
                          number | null,
                          number | null,
                        ],
                        teamBScores: [i3.score, i4.score] as [
                          number | null,
                          number | null,
                        ],
                        teamARawScores: [i1.score, i2.score] as [
                          number | null,
                          number | null,
                        ],
                        teamBRawScores: [i3.score, i4.score] as [
                          number | null,
                          number | null,
                        ],
                        teamASandys: [i1.sandy, i2.sandy] as [boolean, boolean],
                        teamBSandys: [i3.sandy, i4.sandy] as [boolean, boolean],
                      };
                    });
                    const s = computeHighLowSummary(allData);
                    const teamAName = `${getPlayerName(partners[0])} & ${getPlayerName(partners[1])}`;
                    const teamBName = `${getPlayerName(partners[2])} & ${getPlayerName(partners[3])}`;
                    const margin = Math.abs(
                      s.finalScore.teamA - s.finalScore.teamB,
                    );
                    const hasBack = displayHoles.some(
                      (h: any) => h.holeNumber > 9,
                    );
                    const Row = ({
                      label,
                      a,
                      b,
                      bold = false,
                    }: {
                      label: string;
                      a: number | string;
                      b: number | string;
                      bold?: boolean;
                    }) => (
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          paddingVertical: 5,
                          borderBottomWidth: 0.5,
                          borderColor: isDark ? "#333" : "#e5e5e5",
                        }}
                      >
                        <ThemedText
                          style={{
                            fontSize: 12,
                            fontWeight: bold ? "700" : "500",
                            flex: 1,
                          }}
                        >
                          {label}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 12,
                            fontWeight: bold ? "700" : "500",
                            width: 70,
                            textAlign: "center",
                            color: bold ? "#84cc16" : teamAColor,
                          }}
                        >
                          {a}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 12,
                            fontWeight: bold ? "700" : "500",
                            width: 70,
                            textAlign: "center",
                            color: bold ? "#84cc16" : teamBColor,
                          }}
                        >
                          {b}
                        </ThemedText>
                      </HStack>
                    );

                    return (
                      <VStack>
                        <HStack
                          style={{
                            justifyContent: "space-between",
                            paddingVertical: 6,
                            borderBottomWidth: 1,
                            borderColor: isDark ? "#444" : "#ddd",
                          }}
                        >
                          <ThemedText
                            style={{
                              fontWeight: "700",
                              fontSize: 12,
                              flex: 1,
                            }}
                          >
                            Row
                          </ThemedText>
                          <ThemedText
                            style={{
                              fontWeight: "700",
                              fontSize: 11,
                              width: 70,
                              textAlign: "center",
                              color: teamAColor,
                            }}
                          >
                            Team A
                          </ThemedText>
                          <ThemedText
                            style={{
                              fontWeight: "700",
                              fontSize: 11,
                              width: 70,
                              textAlign: "center",
                              color: teamBColor,
                            }}
                          >
                            Team B
                          </ThemedText>
                        </HStack>
                        {/* <Row
                        label="Front 9"
                        a={s.front9MatchPts.teamA}
                        b={s.front9MatchPts.teamB}
                      /> */}
                        {/* {hasBack && ( */}
                        {/* <Row
                        label="Back 9"
                        a={s.back9MatchPts.teamA}
                        b={s.back9MatchPts.teamB}
                      /> */}
                        <Row
                          label="Overall Match Pts"
                          a={s.overallMatchPts.teamA}
                          b={s.overallMatchPts.teamB}
                          bold
                        />
                        <Row
                          label="Patiala X"
                          a={`${s.patialaX.teamA}x`}
                          b={`${s.patialaX.teamB}x`}
                        />
                        <Row
                          label="Final X Points"
                          a={`${s.finalXPoints.teamA}x`}
                          b={`${s.finalXPoints.teamB}x`}
                        />
                        <Row
                          label="Final Score"
                          a={s.finalScore.teamA}
                          b={s.finalScore.teamB}
                          bold
                        />
                        <View
                          style={{
                            // borderTopWidth: 0.5,
                            // borderColor: isDark ? "#444" : "#ddd",
                            paddingTop: 10,
                            alignItems: "center",
                            marginTop: 6,
                          }}
                        >
                          <ThemedText
                            style={{
                              fontSize: 11,
                              color: isDark ? "#94a3b8" : "#64748b",
                              marginBottom: 4,
                            }}
                          >
                            Team A: {teamAName} • Team B: {teamBName}
                          </ThemedText>
                          <ThemedText
                            style={{
                              fontWeight: "bold",
                              color:
                                s.finalScore.teamA > s.finalScore.teamB
                                  ? teamAColor
                                  : s.finalScore.teamB > s.finalScore.teamA
                                    ? teamBColor
                                    : "#84cc16",
                              fontSize: 13,
                            }}
                          >
                            {s.finalScore.teamA > s.finalScore.teamB
                              ? `Team A Wins by ${margin}`
                              : s.finalScore.teamB > s.finalScore.teamA
                                ? `Team B Wins by ${margin}`
                                : "Tie"}
                          </ThemedText>
                        </View>
                      </VStack>
                    );
                  })()}
                </>
              )}

              {isNassau &&
                partners.length >= 2 &&
                (() => {
                  const mode = isNassauBest ? "best" : "combined";
                  const teamAPartners =
                    partners.length >= 4
                      ? [partners[0], partners[1]]
                      : [partners[0]];
                  const teamBPartners =
                    partners.length >= 4
                      ? [partners[2], partners[3]]
                      : [partners[1]];
                  const allData = displayHoles.map((h: any) => {
                    const teamAInfos = teamAPartners.map((p: any) =>
                      getPlayerHoleInfo(h, p),
                    );
                    const teamBInfos = teamBPartners.map((p: any) =>
                      getPlayerHoleInfo(h, p),
                    );
                    return {
                      holeNumber: h.holeNumber,
                      par: h.par,
                      teamANetScores: teamAInfos.map((i: any) =>
                        i.score !== null ? i.netScore : null,
                      ),
                      teamBNetScores: teamBInfos.map((i: any) =>
                        i.score !== null ? i.netScore : null,
                      ),
                      teamARawScores: teamAInfos.map((i: any) => i.score),
                      teamBRawScores: teamBInfos.map((i: any) => i.score),
                      teamASandys: teamAInfos.map((i: any) => i.sandy),
                      teamBSandys: teamBInfos.map((i: any) => i.sandy),
                    };
                  });
                  const ns = computeNassauState(
                    mode as "best" | "combined",
                    allData,
                  );
                  const teamAName =
                    partners.length >= 4
                      ? `${getPlayerName(partners[0])} & ${getPlayerName(partners[1])}`
                      : getPlayerName(partners[0]);
                  const teamBName =
                    partners.length >= 4
                      ? `${getPlayerName(partners[2])} & ${getPlayerName(partners[3])}`
                      : getPlayerName(partners[1]);
                  const Row = ({
                    label,
                    a,
                    b,
                    bold = false,
                  }: {
                    label: string;
                    a: number | string | React.ReactNode;
                    b: number | string | React.ReactNode;
                    bold?: boolean;
                  }) => (
                    <HStack
                      style={{
                        justifyContent: "space-between",
                        paddingVertical: 5,
                        borderBottomWidth: 0.5,
                        borderColor: isDark ? "#333" : "#e5e5e5",
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: bold ? "700" : "500",
                          flex: 1,
                        }}
                      >
                        {label}
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: bold ? "700" : "500",
                          width: 70,
                          textAlign: "center",
                          color: teamAColor,
                        }}
                      >
                        {a}
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: bold ? "700" : "500",
                          width: 70,
                          textAlign: "center",
                          color: teamBColor,
                        }}
                      >
                        {b}
                      </ThemedText>
                    </HStack>
                  );

                  return (
                    <>
                      <ThemedText
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          marginBottom: 8,
                        }}
                      >
                        Nassau {isNassauBest ? "Best Score" : "Combined"}{" "}
                        Summary
                      </ThemedText>
                      <HStack
                        style={{
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          borderBottomWidth: 1,
                          borderColor: isDark ? "#444" : "#ddd",
                        }}
                      >
                        <ThemedText
                          style={{
                            fontWeight: "700",
                            fontSize: 12,
                            flex: 1,
                          }}
                        >
                          Row
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontWeight: "700",
                            fontSize: 11,
                            width: 70,
                            textAlign: "center",
                            color: teamAColor,
                          }}
                        >
                          Team A
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontWeight: "700",
                            fontSize: 11,
                            width: 70,
                            textAlign: "center",
                            color: teamBColor,
                          }}
                        >
                          Team B
                        </ThemedText>
                      </HStack>
                      <Row
                        label="Front 9 Halfs"
                        a={ns.front9Halfs.team1}
                        b={ns.front9Halfs.team2}
                      />
                      <Row
                        label="Back 9 Halfs"
                        a={ns.back9Halfs.team1}
                        b={ns.back9Halfs.team2}
                      />
                      <Row
                        label="Overall Matches"
                        a={ns.overallMatches.team1}
                        b={ns.overallMatches.team2}
                      />
                      <Row
                        label="Patiala X"
                        a={`${ns.patialaX.teamA}x`}
                        b={`${ns.patialaX.teamB}x`}
                      />
                      <Row
                        label="Final X Points"
                        a={`${ns.finalXPoints.teamA}x`}
                        b={`${ns.finalXPoints.teamB}x`}
                      />
                      <View
                        style={{
                          paddingTop: 10,
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                      <Row
                        label="Final Result"
                        a={
                          <ThemedText style={{ fontSize: 11, fontWeight: "700", color: teamAColor }}>
                            Match - {ns?.overallMatches?.team1 || 0}{" "}
                            {/* <ThemedText style={{ color: isDark ? "#94a3b8" : "#64748b", marginHorizontal: 2 }}>&</ThemedText> */}
                            {" "}
                            Half - {(ns?.front9Halfs?.team1 || 0) + (ns?.back9Halfs?.team1 || 0)}
                          </ThemedText>
                        }
                        b={
                          <ThemedText style={{ fontSize: 11, fontWeight: "700", color: teamBColor }}>
                            Match - {ns?.overallMatches?.team2 || 0}{" "}
                            {/* <ThemedText style={{ color: isDark ? "#94a3b8" : "#64748b", marginHorizontal: 2 }}>&</ThemedText> */}
                            {" "}
                            Half - {(ns?.front9Halfs?.team2 || 0) + (ns?.back9Halfs?.team2 || 0)}
                          </ThemedText>
                        }
                        bold
                      />
                        <ThemedText
                          style={{
                            fontSize: 11,
                            color: isDark ? "#94a3b8" : "#64748b",
                            marginBottom: 4,
                          }}
                        >
                          Team A: {teamAName} • Team B: {teamBName}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontWeight: "bold",
                            color:
                              ns.finalResult > 0
                                ? teamAColor
                                : ns.finalResult < 0
                                  ? teamBColor
                                  : "#84cc16",
                            fontSize: 14,
                          }}
                        >
                          {ns.finalResult > 0
                            ? `Team A Wins by ${ns.finalResult}`
                            : ns.finalResult < 0
                              ? `Team B Wins by ${Math.abs(ns.finalResult)}`
                              : "Tie"}
                        </ThemedText>
                      </View>

                      {/* Nassau Hole-by-Hole Table */}
                      {/* <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        marginTop: 18,
                        marginBottom: 8,
                      }}
                    >
                      Hole-by-Hole
                    </ThemedText>
                    <HStack
                      style={{
                        paddingVertical: 6,
                        borderBottomWidth: 1,
                        borderColor: isDark ? "#444" : "#ddd",
                      }}
                    >
                      <ThemedText
                        style={{
                          width: 40,
                          fontWeight: "700",
                          fontSize: 11,
                          textAlign: "center",
                        }}
                      >
                        Hole
                      </ThemedText>
                      <ThemedText
                        style={{
                          flex: 1,
                          fontWeight: "700",
                          fontSize: 11,
                          textAlign: "center",
                          color: teamAColor,
                        }}
                      >
                        Team A
                      </ThemedText>
                      <ThemedText
                        style={{
                          flex: 1,
                          fontWeight: "700",
                          fontSize: 11,
                          textAlign: "center",
                          color: teamBColor,
                        }}
                      >
                        Team B
                      </ThemedText>
                      <ThemedText
                        style={{
                          width: 60,
                          fontWeight: "700",
                          fontSize: 11,
                          textAlign: "center",
                          color: "#84cc16",
                        }}
                      >
                        Winner
                      </ThemedText>
                      <ThemedText
                        style={{
                          width: 50,
                          fontWeight: "700",
                          fontSize: 11,
                          textAlign: "center",
                          color: "#a855f7",
                        }}
                      >
                        Houses
                      </ThemedText>
                    </HStack>
                    {displayHoles.map((h: any) => {
                      const r = ns.holeResults[h.holeNumber];
                      if (!r) return null;
                      return (
                        <HStack
                          key={`ns-sum-${h.holeNumber}`}
                          style={{
                            paddingVertical: 4,
                            borderBottomWidth: 0.5,
                            borderColor: isDark ? "#333" : "#e5e5e5",
                          }}
                        >
                          <ThemedText
                            style={{
                              width: 40,
                              textAlign: "center",
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            {h.holeNumber}
                          </ThemedText>
                          <ThemedText
                            style={{
                              flex: 1,
                              textAlign: "center",
                              fontSize: 11,
                            }}
                          >
                            {r.teamAScore !== Infinity ? r.teamAScore : "-"}
                          </ThemedText>
                          <ThemedText
                            style={{
                              flex: 1,
                              textAlign: "center",
                              fontSize: 11,
                            }}
                          >
                            {r.teamBScore !== Infinity ? r.teamBScore : "-"}
                          </ThemedText>
                          <ThemedText
                            style={{
                              width: 60,
                              textAlign: "center",
                              fontSize: 11,
                              color:
                                r.winner === "teamA"
                                  ? teamAColor
                                  : r.winner === "teamB"
                                    ? teamBColor
                                    : "#64748b",
                              fontWeight: "700",
                            }}
                          >
                            {r.winner === "teamA"
                              ? "A"
                              : r.winner === "teamB"
                                ? "B"
                                : "Tie"}
                          </ThemedText>
                          <ThemedText
                            style={{
                              width: 50,
                              textAlign: "center",
                              fontSize: 11,
                              color: "#a855f7",
                            }}
                          >
                            {r.housesDisplay.length > 0
                              ? r.housesDisplay
                                  .map((v: number) => Math.abs(v))
                                  .join(" ")
                              : "-"}
                          </ThemedText>
                        </HStack>
                      );
                    })} */}
                    </>
                  );
                })()}
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

          displayHoles.forEach((h) => {
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
              className="mb-20 mt-7 p-4 rounded-2xl"
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
