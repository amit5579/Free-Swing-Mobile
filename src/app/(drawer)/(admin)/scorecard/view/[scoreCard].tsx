import {
  getScorecardDetails,
  ScorecardHoleApi as ScorecardHole,
  saveScorecardApi,
} from "@/api/modules/admin/dashboard.api";
import {
  calculateSplitSixPoints,
  computeHighLowSummary,
  computeHighLowHolePoints,
  computeNassauState,
  formatNassauHouses,
  formatNassauHousesSpaced,
  computeSplitSixSummary,
} from "@/utils/scoringEngine";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  useColorScheme,
  StyleSheet,
  Alert,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { updateScorecardApi } from "@/api/modules/admin/dashboard.api";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { useRouter } from "expo-router";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/box";
import { getSubScorecardHandicap } from "@/api/modules/scoreCard.api";
import { getHandicapDetails } from "@/api/modules/newRound.api";
import { RangefinderModal } from "@/components/rangefinder/RangefinderModal";

const ScoreCard: React.FC = () => {
  const { scoreCard, handicap: paramHandicap } = useLocalSearchParams<{
    scoreCard: string;
    handicap: string;
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

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      setRole(storedRole);
    };
    fetchRole();

    fetchRole();
  }, []);

  const handleBack = useCallback(() => {
    const normalizedRole = role?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (normalizedRole === "subadmin") {
      router.navigate("/(drawer)/(subAdmin)/(tabs)/dashboard");
    } else if (normalizedRole === "admin") {
      router.navigate("/(drawer)/(admin)/(tabs)/dashboard");
    } else {
      router.navigate("/(drawer)/(user)/(tabs)/dashboard");
    }
  }, [role, router]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [handleBack]),
  );

  const [holes, setHoles] = useState<ScorecardHole[]>([]);
  const [textScores, setTextScores] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStableford, setIsStableford] = useState(false);
  const [displayFront9, setDisplayFront9] = useState(true);
  const [displayBack9, setDisplayBack9] = useState(true);
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [activeRangefinderHole, setActiveRangefinderHole] = useState<
    number | null
  >(null);

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
  const [handicap, setHandicap] = useState<any>();
  const isNassau = isNassauBest || isNassauCombined;

  const getDisplayHandicap = useCallback(
    (value: any) => {
      if (value && typeof value === "object") {
        return value.handicap ?? value.handicapIndex ?? displayHandicap;
      }
      return value ?? displayHandicap;
    },
    [displayHandicap],
  );

  const isExcluded = holes.length > 0 && holes.some((h: any) => h.isExcluded);

  const isSystem36Hole = (h: any) =>
    h.matchScoringType === "system-36" ||
    h.scoringType === "system-36" ||
    h.scoring_type === "system-36" ||
    h.isSystem36 === true ||
    h.IsSystem36 === true;

  const isSystem36 =
    holes.length > 0 && holes.some((h: any) => isSystem36Hole(h));
  const getScoringLabel = () => {
    if (holes.length === 0) return "";

    if (isSystem36) return "System 36";
    if (isExcluded && !isStableford) return "Net Score • Exclude Par 3";
    if (!isExcluded && isStableford) return "Stableford";
    if (isExcluded && isStableford) return "Stableford • Exclude Par 3";
    if (
      !isExcluded &&
      !isStableford &&
      !isSplit6 &&
      !isHighLow &&
      !isGross &&
      !isNassau &&
      !isSystem36
    )
      return "Net Score • Include Par 3";
    if (
      isGross &&
      !isExcluded &&
      !isStableford &&
      !isSplit6 &&
      !isHighLow &&
      !isNassau &&
      !isSystem36
    )
      return "Gross Score";
    if (!isExcluded && !isStableford && isSplit6 && !isHighLow)
      return "Split 6";
    if (!isExcluded && !isStableford && !isSplit6 && isHighLow)
      return "High-Low";
    if (isNassauBest) return "Nassau • Best Score";
    if (isNassauCombined) return "Nassau • Combined Score";
    return "";
  };

  const showPtsColumns = isStableford || isSystem36;
  const showNetColumns =
    getScoringLabel() === "Net Score • Include Par 3" ||
    getScoringLabel() === "Net Score • Exclude Par 3" ||
    isStableford;
  const hasSubColumn = showPtsColumns || showNetColumns;

  const shouldShowSandyXControls = () => {
    const label = getScoringLabel();
    return (
      !label.startsWith("Net Score") &&
      !label.startsWith("Stableford") &&
      label !== "System 36"
    );
  };

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        setLoading(true);
        const data = await getScorecardDetails(scoreCard!);
        // console.log("data", data);

        if (data.length > 0) {
          try {
            const hc = await getHandicapDetails(
              data[0].userId,
              data[0].teeBoxId,
            );
            setHandicap(getDisplayHandicap(hc));
          } catch (e) {
            console.error("Error fetching scorecard handicap:", e);
            setHandicap(displayHandicap);
          }
        }

        const dataIsSystem36 = data.some((h: any) => isSystem36Hole(h));
        const normalizedData = data.map((h: any) => {
          const score =
            h.score !== null && h.score !== undefined ? Number(h.score) : null;
          const sys36Points =
            dataIsSystem36 && score !== null && score > 0
              ? score <= h.par
                ? 2
                : score === h.par + 1
                  ? 1
                  : 0
              : null;

          return {
            ...h,
            score,
            stablefordPoints:
              h.stablefordPoints !== null && h.stablefordPoints !== undefined
                ? h.stablefordPoints
                : sys36Points,
          };
        });

        setHoles(normalizedData);

        const hasStablefordPoints = data.some(
          (h) =>
            h.stablefordPoints !== null && h.stablefordPoints !== undefined,
        );
        setIsStableford(!dataIsSystem36 && hasStablefordPoints);

        const initialText: Record<number, string> = {};
        normalizedData.forEach((h) => {
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
              const sortedPartners = (parsedPartners || [])
                .slice()
                .sort((a: any, b: any) => {
                  const teamA = a.team ?? 1;
                  const teamB = b.team ?? 1;
                  return teamA - teamB;
                });
              setPartners(sortedPartners);
            } catch (e) {
              console.error("Error parsing playingPartnersJson:", e);
            }
          }

          const mode = (
            (firstHole as any).scoringType ||
            (firstHole as any).scoring_type ||
            (firstHole as any).matchScoringType ||
            (firstHole as any).match_scoring_type ||
            ""
          ).toLowerCase();

          const isGr =
            mode.includes("gross_score") ||
            mode.includes("gross") ||
            mode === "gross";
          setIsGross(isGr);

          const isNB =
            mode.includes("nassau_best") || mode.includes("nassau-best");
          const isNC =
            mode.includes("nassau_combined") ||
            mode.includes("nassau-combined");
          const isHL =
            (mode.includes("high_low") || mode.includes("high-low")) &&
            !(isNB || isNC);
          const isS6 =
            (mode.includes("split_six") ||
              mode.includes("split-six") ||
              mode.includes("split 6") ||
              mode.includes("split6") ||
              mode.includes("split_6") ||
              data.some((h: any) => {
                const m = (
                  h.scoringType ||
                  h.scoring_type ||
                  h.matchScoringType ||
                  h.match_scoring_type ||
                  h.matchScoringMode ||
                  ""
                ).toLowerCase();
                return (
                  m.includes("split_six") ||
                  m.includes("split-six") ||
                  m.includes("split 6") ||
                  m.includes("split6") ||
                  m.includes("split_6") ||
                  h.isSplit6 === true ||
                  h.split_six === true
                );
              })) &&
            !(isNB || isNC);

          setIsHighLow(isHL);
          setIsSplit6(isS6);
          setIsNassauBest(isNB);
          setIsNassauCombined(isNC);

          if (parsedPartners.length > 0) {
            const handicapsMap: Record<string | number, number> = {};
            for (const p of parsedPartners) {
              if (!p.isPrimary) {
                const directHc =
                  p.playingHandicap ??
                  p.appliedHandicap ??
                  p.courseHandicap ??
                  p.handicap ??
                  p.userHandicap;
                if (
                  directHc !== undefined &&
                  directHc !== null &&
                  directHc !== ""
                ) {
                  const hVal = Math.round(Number(directHc) || 0);
                  if (p.userId) handicapsMap[p.userId] = hVal;
                  if (p.playerId) handicapsMap[p.playerId] = hVal;
                }
              }
            }
            setCompanionHandicaps(handicapsMap);
          }
        }
      } catch (err) {
        setError("Failed to load scorecard.");
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, [scoreCard, displayHandicap, getDisplayHandicap]);
  //         "nassauStartingNine": "back"

  useEffect(() => {
    if (holes.length > 0) {
      const courseHalfStr =
        holes.length > 0 ? (holes[0] as any).courseHalf : null;
      const isFront9Only =
        courseHalfStr === "Front9" || courseHalfStr === "Front 9";
      const isBack9Only =
        courseHalfStr === "Back9" || courseHalfStr === "Back 9";
      const nassauStartingNine =
        holes[0]?.nassauStartingNine ||
        (holes[0] as any)?.NassauStartingNine ||
        null;
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

      const f9 =
        nassauStartingNine === "back"
          ? displayHoles.filter((h: any) => h.holeNumber > 9)
          : displayHoles.filter((h: any) => h.holeNumber <= 9);
      const b9 =
        nassauStartingNine === "back"
          ? displayHoles.filter((h: any) => h.holeNumber <= 9)
          : displayHoles.filter((h: any) => h.holeNumber > 9);

      const f9HasScore = f9.some(
        (h: any) => h.score !== null && h.score !== undefined,
      );
      const b9HasScore = b9.some(
        (h: any) => h.score !== null && h.score !== undefined,
      );
      const f9Sum = f9HasScore
        ? f9.reduce((t: number, h: any) => t + (h.score || 0), 0)
        : "-";
      const b9Sum = b9HasScore
        ? b9.reduce((t: number, h: any) => t + (h.score || 0), 0)
        : "-";

      const hasTournamentId =
        holes.length > 0 &&
        holes.some(
          (h: any) => h.tournamentId !== null && h.tournamentId !== undefined,
        );

      const hasFrontNine = holes.some((h: any) => h.courseHalf === "Front9");
      const hasBackNine = holes.some((h: any) => h.courseHalf === "Back9");

      const hasNullCourseHalf = holes.some(
        (h: any) => !h.courseHalf || h.courseHalf === "null",
      );

      if (hasNullCourseHalf) {
        setDisplayFront9(true);
        setDisplayBack9(true);
      } else if (hasFrontNine && !hasBackNine) {
        setDisplayFront9(true);
        setDisplayBack9(false);
      } else if (hasBackNine && !hasFrontNine) {
        setDisplayFront9(false);
        setDisplayBack9(true);
      } else if (hasTournamentId) {
        setDisplayFront9(true);
        setDisplayBack9(true);
      } else {
        setDisplayFront9(f9Sum !== "-" && f9Sum > 0);
        setDisplayBack9(b9Sum !== "-" && b9Sum > 0);
      }
    }
  }, [holes]);

  const calculateStrokes = (playerHandicap: number, strokeIndex: number) => {
    if (!playerHandicap || playerHandicap === 0) return 0;
    const absoluteHandicap = Math.abs(playerHandicap);
    const base = Math.floor(absoluteHandicap / 18);
    const remainder = absoluteHandicap % 18;
    if (playerHandicap > 0) {
      return base + (strokeIndex <= remainder ? 1 : 0);
    }
    return -(base + (remainder > 0 && strokeIndex > 18 - remainder ? 1 : 0));
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

    const rawCompanionSandys =
      hole.companionSandysJson ?? hole.CompanionSandysJson;
    let companionSandys: Record<string, boolean> = {};
    if (rawCompanionSandys) {
      try {
        companionSandys =
          typeof rawCompanionSandys === "string"
            ? JSON.parse(rawCompanionSandys)
            : rawCompanionSandys;
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

    const directHc =
      partner.playingHandicap ??
      partner.appliedHandicap ??
      partner.courseHandicap ??
      partner.handicap ??
      partner.userHandicap;
    const playerHandicap = isPrimary
      ? Number(displayHandicap || 0)
      : directHc !== undefined && directHc !== null && directHc !== ""
        ? Math.round(Number(directHc) || 0)
        : userId && companionHandicaps[userId] !== undefined
          ? companionHandicaps[userId]
          : playerId && companionHandicaps[playerId] !== undefined
            ? companionHandicaps[playerId]
            : 0;
    const strokeIndexVal = Number(
      hole.strokeIndex ??
        hole.StrokeIndex ??
        hole.handicap ??
        hole.Handicap ??
        0,
    );
    let strokesReceived = calculateStrokes(playerHandicap, strokeIndexVal);
    if (hole.isExcluded && hole.par === 3) {
      strokesReceived = 0;
    }
    const netScore = rawScore - strokesReceived;

    let stablefordPoints = null;
    if (isSystem36 && rawScore > 0) {
      stablefordPoints =
        rawScore <= hole.par ? 2 : rawScore === hole.par + 1 ? 1 : 0;
    } else if (isStableford) {
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
    let sandys = 0;
    let hasAnyScore = false;

    holesList.forEach((h) => {
      const info = getPlayerHoleInfo(h, partner);
      if (info.score !== null) {
        gross += info.score;
        net += info.netScore ?? 0;
        stableford += info.stablefordPoints ?? 0;
        if (info.sandy) sandys += 1;
        hasAnyScore = true;
      }
    });

    return {
      gross: hasAnyScore ? gross : "-",
      net: hasAnyScore ? net : "-",
      stableford: hasAnyScore ? stableford : "-",
      sandys: hasAnyScore ? sandys : "-",
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
    }

    const sandyBonus = isSandy && diff <= 0 ? 1 : 0;
    return basePoints + sandyBonus;
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
        isComplete: false,
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

    const s1 = info1.score !== null ? info1.score : null;
    const s2 = info2.score !== null ? info2.score : null;
    const s3 = info3.score !== null ? info3.score : null;
    const s4 = info4.score !== null ? info4.score : null;

    if (s1 === null || s2 === null || s3 === null || s4 === null) {
      return {
        isComplete: false,
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
      isComplete: true,
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

  const calculateSplitSixPoints = (
    s1: number | null,
    s2: number | null,
    s3: number | null,
  ) => {
    if (s1 === null || s2 === null || s3 === null) return [0, 0, 0];

    const players = [
      { id: "p1", score: s1 },
      { id: "p2", score: s2 },
      { id: "p3", score: s3 },
    ];

    players.sort((a, b) => a.score - b.score);

    const points: Record<string, number> = { p1: 0, p2: 0, p3: 0 };

    if (
      players[0].score === players[1].score &&
      players[1].score === players[2].score
    ) {
      points[players[0].id] = 2;
      points[players[1].id] = 2;
      points[players[2].id] = 2;
    } else if (players[0].score === players[1].score) {
      points[players[0].id] = 3;
      points[players[1].id] = 3;
      points[players[2].id] = 0;
    } else if (players[1].score === players[2].score) {
      points[players[0].id] = 4;
      points[players[1].id] = 1;
      points[players[2].id] = 1;
    } else {
      points[players[0].id] = 4;
      points[players[1].id] = 2;
      points[players[2].id] = 0;
    }

    return [points.p1, points.p2, points.p3];
  };

  const getSplitSixSummary = (holesList: any[]) => {
    let p1Total = 0;
    let p2Total = 0;
    let p3Total = 0;

    holesList.forEach((h) => {
      const info1 = getPlayerHoleInfo(h, partners[0]);
      const info2 = getPlayerHoleInfo(h, partners[1]);
      const info3 = getPlayerHoleInfo(h, partners[2]);

      const s1 = info1.score !== null ? info1.netScore : null;
      const s2 = info2.score !== null ? info2.netScore : null;
      const s3 = info3.score !== null ? info3.netScore : null;

      const [pts1, pts2, pts3] = calculateSplitSixPoints(s1, s2, s3);
      p1Total += pts1;
      p2Total += pts2;
      p3Total += pts3;
    });

    return { p1Total, p2Total, p3Total };
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
      prev.map((h: any) => {
        if (h.holeId === holeId) {
          const strokes = calculateStrokes(displayHandicap, h.strokeIndex);
          const netScore = score > 0 ? score - strokes : 0;
          const stablefordPoints =
            score > 0
              ? isSystem36
                ? score <= h.par
                  ? 2
                  : score === h.par + 1
                    ? 1
                    : 0
                : Math.max(0, h.par - netScore + 2)
              : 0;
          return {
            ...h,
            score: score >= 0 ? score : 0,
            netScore,
            stablefordPoints,
          };
        }
        return h;
      }),
    );
  };

  const handleSandyToggle = (holeId: number, playerId: string) => {
    setHoles((prev) =>
      prev.map((h: any) => {
        if (h.holeId !== holeId) return h;

        const rawCompanionSandys =
          h.companionSandysJson ?? h.CompanionSandysJson;
        let companionSandys: Record<string, boolean> = {};
        if (rawCompanionSandys) {
          try {
            companionSandys =
              typeof rawCompanionSandys === "string"
                ? JSON.parse(rawCompanionSandys)
                : rawCompanionSandys;
          } catch (e) {
            console.error(e);
          }
        }

        companionSandys[playerId] = !companionSandys[playerId];
        const companionSandysJson = JSON.stringify(companionSandys);

        return {
          ...h,
          companionSandysJson,
          CompanionSandysJson: companionSandysJson,
        };
      }),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const holeScores = Object.entries(textScores).map(([holeId, score]) => ({
        holeId: parseInt(holeId),
        score: score === "" ? 0 : parseInt(score),
      }));
      await updateScorecardApi(scoreCard!, holeScores);
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
            const holeScores = Object.entries(textScores).map(
              ([holeId, score]) => ({
                holeId: parseInt(holeId),
                score: score === "" ? 0 : parseInt(score),
              }),
            );
            await updateScorecardApi(scoreCard!, holeScores);

            await saveScorecardApi(scoreCard!);
            Alert.alert("Success", "Round finished successfully", [
              { text: "OK", onPress: handleBack },
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
  const nassauStartingNine =
    holes[0]?.nassauStartingNine ||
    (holes[0] as any)?.NassauStartingNine ||
    null;

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

  const displayedHoles = [
    ...(displayFront9 ? front9 : []),
    ...(displayBack9 ? back9 : []),
  ];
  // useEffect(() => {
  //     console.log("bbbb", back9);

  // }, [back9])
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
      // Quadruple Bogey+: Single Black/White Square
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
          {/* Header Row Skeleton */}
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

          {/* Table Header Skeleton - Match 7 columns */}
          <View
            className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
          >
            {["Hole", "SI", "Yards", "Par", "Score", "Net", "Pts"].map(
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
                <View className="flex-1 items-center">
                  <Skeleton
                    isDark={isDark}
                    width={20}
                    height={16}
                    borderRadius={4}
                  />
                </View>
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

          {/* Grand Total Skeleton */}
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
          onPress={handleBack}
          className="mt-4 p-4 bg-[#8BC34A] rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </ThemedView>
    );
  }
  const renderHeader = () => {
    const groupName = holes.length > 0 ? (holes[0] as any).groupName : null;
    return (
      <View
        style={{
          paddingTop: 10,
          paddingBottom: 5,
          backgroundColor: isDark ? "#000" : "#F9FAFB",
          zIndex: 10,
          elevation: 10,
        }}
      >
        <HStack
          className="px-3 items-center"
          style={{ justifyContent: "flex-start" }}
        >
          <Pressable
            onPress={handleBack}
            style={{ padding: 8, marginRight: 8 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#ffffff" : "#020617"}
            />
          </Pressable>

          <View className="flex-row items-center justify-between flex-1">
            <View style={{ flex: 1, marginRight: 8 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                Scorecard
                <ThemedText
                  style={{ fontSize: 12, fontWeight: "400", opacity: 0.8 }}
                >
                  {" "}
                  ({getScoringLabel()})
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </HStack>
        <ThemedText style={{ padding: 10 }}>
          {groupName ? `${groupName}` : ""}
        </ThemedText>

        <HStack
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
          }}
        >
          <HStack className="gap-5">
            {isSystem36 && (
              <Box
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: isDark
                    ? "rgba(14, 165, 233, 0.2)"
                    : "rgba(2, 132, 199, 0.1)",
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: isDark ? "#38bdf8" : "#0284c7",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#38bdf8" : "#0284c7",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  Sys36 HC:{" "}
                  {holes.some((h: any) => h.score !== null && h.score > 0)
                    ? 36 -
                      holes.reduce(
                        (t, h) =>
                          t +
                          (h.score !== null && h.score >= 0
                            ? h.stablefordPoints || 0
                            : 0),
                        0,
                      )
                    : "N/A"}
                </Text>
              </Box>
            )}
            <Box
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9",
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#8bc34a",
              }}
            >
              <Text
                style={{ color: "#8bc34a", fontWeight: "700", fontSize: 12 }}
              >
                Handicap: {getDisplayHandicap(handicap)}
              </Text>
            </Box>
          </HStack>
          <HStack style={{ alignItems: "center" }}>
            <Pressable
              onPress={() => setActiveRangefinderHole(holes[0]?.holeId || null)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "#198754",
                borderRadius: 6,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="map"
                size={14}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                GPS
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsDetailsVisible(!isDetailsVisible)}
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
                name={isDetailsVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={isDark ? "#fff" : "#020617"}
              />
            </Pressable>
          </HStack>
        </HStack>
      </View>
    );
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#F9FAFB" }}
    >
      <Watermark />
      {renderHeader()}
      {/* ── Fixed Top Area ── */}

      {/* <View className="px-4 pb-2 z-10 w-full" style={{ backgroundColor: isDark ? "#161618" : "#FFFFFF", paddingTop: Math.max(insets.top, 16) }}>
                <View className="flex-row items-center mb-4 mt-0">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="flex-1">
                        <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`} numberOfLines={1}>
                            {courseName ? courseName : "Scorecard (Stableford)"}
                        </Text>
                        {username ? (
                            <View className="flex-row items-center">
                                <Ionicons name="person-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                <Text className={`text-sm ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                                    {username}
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center">
                                <Ionicons name="person-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                <Text className={`text-sm ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                                    Handicap: {displayHandicap}
                                </Text>
                            </View>
                        )}
                    </View>

                    {!username && (
                        <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9", borderWidth: 1, borderColor: "#8BC34A" }}>
                            <Ionicons name="shield-checkmark" size={14} color="#8BC34A" />
                            <Text className="text-xs font-bold ml-1" style={{ color: "#8BC34A" }}>Verified</Text>
                        </View>
                    )}
                </View>

            </View> */}

      {/* ── Scrollable Table ── */}
      <ScrollView
        className="px-4 flex-1"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={partners.length < 2 ? [0] : undefined}
      >
        {/* 0th child → sticky table header */}
        {partners.length < 2 && (
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
                ...(showNetColumns ? ["Net"] : []),
                ...(showPtsColumns
                  ? [isSystem36 ? "Sys36\nPts" : "Pts"]
                  : []),
              ].map((h) => (
                <Text
                  key={h}
                  className={`flex-1 text-center font-bold text-[10px] ${isDark ? "text-white" : "text-black"}`}
                  style={{ textAlignVertical: "center" }}
                >
                  {h}
                </Text>
              ))}
            </View>
          </View>
        )}

        {partners.length < 2 && (
          <View
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden mb-4`}
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >

            {displayFront9 && (
              <>
                {front9.map((h, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
                  >
                    <View className="flex-1 flex-row justify-center items-center">
                      <Text
                        className={`text-center ${isDark ? "text-white" : "text-black"}`}
                      >
                        {h.holeNumber}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setActiveRangefinderHole(h.holeId)}
                        className="ml-1"
                      >
                        <Ionicons
                          name="locate-outline"
                          size={14}
                          color={isDark ? "#8BC34A" : "#198754"}
                        />
                      </TouchableOpacity>
                    </View>
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
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(139,195,74,0.05)",
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
                    {showNetColumns && (
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                      >
                        {textScores[h.holeId] !== "" &&
                        textScores[h.holeId] !== undefined &&
                        parseInt(textScores[h.holeId]) >= 0
                          ? h.netScore
                          : "-"}
                      </Text>
                    )}
                    {showPtsColumns && (
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
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
                    {sumScores(front9) === 0 ? "-" : sumScores(front9)}
                  </Text>
                  {showNetColumns && (
                    <Text
                      className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                    >
                      {sumNet(front9) === 0 ? "-" : sumNet(front9)}
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
              </>
            )}

            {displayBack9 && back9.length > 0 && (
              <>
                {back9.map((h, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
                  >
                    <View className="flex-1 flex-row justify-center items-center">
                      <Text
                        className={`text-center ${isDark ? "text-white" : "text-black"}`}
                      >
                        {h.holeNumber}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setActiveRangefinderHole(h.holeId)}
                        className="ml-1"
                      >
                        <Ionicons
                          name="locate-outline"
                          size={14}
                          color={isDark ? "#8BC34A" : "#198754"}
                        />
                      </TouchableOpacity>
                    </View>
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
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(139,195,74,0.05)",
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
                    {showNetColumns && (
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                      >
                        {textScores[h.holeId] !== "" &&
                        textScores[h.holeId] !== undefined &&
                        parseInt(textScores[h.holeId]) >= 0
                          ? h.netScore
                          : "-"}
                      </Text>
                    )}
                    {showPtsColumns && (
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
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
                    {sumScores(back9) === 0 ? "-" : sumScores(back9)}
                  </Text>
                  {showNetColumns && (
                    <Text
                      className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                    >
                      {sumNet(back9) === 0 ? "-" : sumNet(back9)}
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
              </>
            )}

            <View
              className="flex-row p-3"
              style={{ backgroundColor: "#8BC34A" }}
            >
              <Text className="flex-1 text-center font-black text-xs text-white">
                Grand Total
              </Text>
              <Text className="flex-1" />
              <Text className="flex-1 text-center font-bold text-xs text-white">
                {sumYardage(displayedHoles)}
              </Text>
              <Text className="flex-1 text-center font-bold text-xs text-white">
                {sumPar(displayedHoles)}
              </Text>
              <Text className="flex-1 text-center font-black text-xs text-white">
                {sumScores(displayedHoles) === 0
                  ? "0"
                  : sumScores(displayedHoles)}
              </Text>
              {showNetColumns && (
                <Text className="flex-1 text-center font-black text-xs text-white">
                  {sumNet(displayedHoles) === 0 ? "0" : sumNet(displayedHoles)}
                </Text>
              )}
              {showPtsColumns && (
                <Text className="flex-1 text-center font-black text-xs text-white">
                  {sumPts(displayedHoles)}
                </Text>
              )}
            </View>
          </View>
        )}

        {partners.length >= 2 &&
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
            const colNassauWidth = 80;
            const colHighLowWidth = 65;
            const teamAColor = isDark ? "#4ade80" : "#198754";
            const teamBColor = isDark ? "#60a5fa" : "#0d6efd";
            const detailsWidth = isDetailsVisible ? 115 : 0;
            const colScoreWidth = showNetColumns || showPtsColumns ? 50 : 95;
            const colNetWidth = 45;
            const colPtsWidth = 45;
            const playerSubWidth =
              colScoreWidth +
              (showNetColumns ? colNetWidth : 0) +
              (showPtsColumns ? colPtsWidth : 0);
            const totalWidth =
              50 +
              detailsWidth +
              50 +
              partners.length * playerSubWidth +
              (isHighLow && partners.length >= 4 ? 2 * colHighLowWidth : 0) +
              (isNassau && partners.length >= 2 ? colNassauWidth : 0);
            const renderNassauHouses = (
              houses: number[],
              isTotalRow?: boolean,
            ) => {
              return (houses || []).map(
                (val: number, idx: number, arr: number[]) => {
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
                },
              );
            };

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
                    {isDetailsVisible && (
                      <>
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
                      </>
                    )}
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
                      } else if (isNassau) {
                        const isTeamA = idx < (partners.length >= 4 ? 2 : 1);
                        badgeText = isTeamA ? "Team A" : "Team B";
                        badgeColor = isTeamA ? "#0284c7" : "#e11d48";
                      }
                      return (
                        <View key={p.playerId} style={{ flexDirection: "row" }}>
                          <VStack
                            style={{
                              width: colScoreWidth,
                              alignItems: "center",
                            }}
                          >
                            <ThemedText
                              style={{
                                textAlign: "center",
                                fontWeight: "700",
                                fontSize: 12,
                              }}
                            >
                              {p.name}
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
                          {showNetColumns && (
                            <VStack
                              style={{
                                width: colNetWidth,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  textAlign: "center",
                                  fontWeight: "700",
                                  fontSize: 10,
                                }}
                              >
                                {`${p.name}\nNet`}
                              </ThemedText>
                            </VStack>
                          )}
                          {showPtsColumns && (
                            <VStack
                              style={{
                                width: colPtsWidth,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  textAlign: "center",
                                  fontWeight: "700",
                                  fontSize: 10,
                                }}
                              >
                                {p.name}
                              </ThemedText>
                            </VStack>
                          )}
                        </View>
                      );
                    })}
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
                            style={{
                              textAlign: "center",
                              fontWeight: "700",
                              fontSize: 11,
                              color: teamAColor,
                            }}
                          >
                            Team A
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
                              textAlign: "center",
                              fontWeight: "700",
                              fontSize: 11,
                              color: teamBColor,
                            }}
                          >
                            Team B
                          </ThemedText>
                        </VStack>
                      </>
                    )}
                    {isNassau && partners.length >= 2 && (
                      <ThemedText
                        style={{
                          width: colNassauWidth,
                          textAlign: "center",
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {`Nassau\nPTS`}
                      </ThemedText>
                    )}
                  </HStack>

                  {/* Rows */}
                  {displayHoles.map((h: any, index: number) => {
                    let s6Pts: number[] = [];
                    if (isSplit6 && partners.length >= 3) {
                      const s1 = getPlayerHoleInfo(h, partners[0]).netScore;
                      const s2 = getPlayerHoleInfo(h, partners[1]).netScore;
                      const s3 = getPlayerHoleInfo(h, partners[2]).netScore;
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
                          <View
                            style={{
                              width: 50,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ThemedText style={{ textAlign: "center" }}>
                              {h.holeNumber}
                            </ThemedText>
                            <TouchableOpacity
                              onPress={() => setActiveRangefinderHole(h.holeId)}
                              style={{ marginLeft: 2 }}
                            >
                              <Ionicons
                                name="locate-outline"
                                size={12}
                                color={isDark ? "#8BC34A" : "#198754"}
                              />
                            </TouchableOpacity>
                          </View>
                          {isDetailsVisible && (
                            <>
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
                            </>
                          )}
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
                                style={{ flexDirection: "row" }}
                              >
                                <View
                                  style={{
                                    width: colScoreWidth,
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

                                  {shouldShowSandyXControls() && (
                                    <HStack
                                      style={{
                                        alignItems: "center",
                                        gap: 4,
                                        marginTop: 4,
                                      }}
                                    >
                                      {info.score !== null &&
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
                                    </HStack>
                                  )}
                                </View>
                                {showNetColumns && (
                                  <View
                                    style={{
                                      width: colNetWidth,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: isDark ? "#8BC34A" : "#198754",
                                        fontWeight: "700",
                                        fontSize: 12,
                                        textAlign: "center",
                                      }}
                                    >
                                      {info.score !== null && info.score >= 0
                                        ? (info.netScore ?? "-")
                                        : "-"}
                                    </Text>
                                  </View>
                                )}
                                {showPtsColumns && (
                                  <View
                                    style={{
                                      width: colPtsWidth,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: isDark ? "#f59e0b" : "#d97706",
                                        fontWeight: "700",
                                        fontSize: 12,
                                        textAlign: "center",
                                      }}
                                    >
                                      {info.score !== null && info.score >= 0
                                        ? (info.stablefordPoints ?? 0)
                                        : "-"}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                          {isNassau &&
                            partners.length >= 2 &&
                            (() => {
                              const hRes = ns?.holeResults[h.holeNumber];
                              if (!hRes)
                                return (
                                  <View style={{ width: colNassauWidth }} />
                                );

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
                                  {renderNassauHouses(
                                    hRes.overallHousesDisplay,
                                  )}
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
                          {isHighLow &&
                            partners.length >= 4 &&
                            (() => {
                              const allFilled = hlStats?.isComplete;
                              return (
                                <>
                                  <View
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
                                      {allFilled ? hlStats.teamAMatchPts : "-"}
                                    </ThemedText>
                                  </View>
                                  <View
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
                                      {allFilled ? hlStats.teamBMatchPts : "-"}
                                    </ThemedText>
                                  </View>
                                </>
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
                                width: 50,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              {nassauStartingNine === "back" ? "B9" : "F9"}
                            </ThemedText>
                            {isDetailsVisible && (
                              <>
                                <ThemedText
                                  style={{ width: 55, textAlign: "center" }}
                                />
                                <ThemedText
                                  style={{ width: 60, textAlign: "center" }}
                                >
                                  {sumYardage(front9)}
                                </ThemedText>
                              </>
                            )}
                            <ThemedText
                              style={{ width: 50, textAlign: "center" }}
                            >
                              {sumPar(front9)}
                            </ThemedText>
                            {partners.map((p) => {
                              const t = getPlayerTotals(front9, p);
                              return (
                                <View
                                  key={p.playerId}
                                  style={{ flexDirection: "row" }}
                                >
                                  <VStack
                                    style={{
                                      width: colScoreWidth,
                                      alignItems: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {t.gross}
                                    </ThemedText>
                                  </VStack>
                                  {showNetColumns && (
                                    <VStack
                                      style={{
                                        width: colNetWidth,
                                        alignItems: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#8BC34A" : "#198754",
                                        }}
                                      >
                                        {t.net}
                                      </ThemedText>
                                    </VStack>
                                  )}
                                  {showPtsColumns && (
                                    <VStack
                                      style={{
                                        width: colPtsWidth,
                                        alignItems: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#f59e0b" : "#d97706",
                                        }}
                                      >
                                        {t.stableford}
                                      </ThemedText>
                                    </VStack>
                                  )}
                                </View>
                              );
                            })}
                            {isHighLow &&
                              partners.length >= 4 &&
                              (() => {
                                let f9A = 0,
                                  f9B = 0;
                                let hasAny = false;
                                front9.forEach((fh: any) => {
                                  const st = getHighLowHoleStats(fh);
                                  if (st && st.isComplete) {
                                    f9A += st.teamAMatchPts;
                                    f9B += st.teamBMatchPts;
                                    hasAny = true;
                                  }
                                });
                                return (
                                  <>
                                    <View
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
                                        {hasAny ? f9A : "-"}
                                      </ThemedText>
                                    </View>
                                    <View
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
                                        {hasAny ? f9B : "-"}
                                      </ThemedText>
                                    </View>
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
                                {renderNassauHouses(ns.front9Houses)}
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
                                width: 50,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              {nassauStartingNine === "back" ? "F9" : "B9"}
                            </ThemedText>
                            {isDetailsVisible && (
                              <>
                                <ThemedText
                                  style={{ width: 55, textAlign: "center" }}
                                />
                                <ThemedText
                                  style={{ width: 60, textAlign: "center" }}
                                >
                                  {sumYardage(back9)}
                                </ThemedText>
                              </>
                            )}
                            <ThemedText
                              style={{ width: 50, textAlign: "center" }}
                            >
                              {sumPar(back9)}
                            </ThemedText>
                            {partners.map((p) => {
                              const t = getPlayerTotals(back9, p);
                              return (
                                <View
                                  key={p.playerId}
                                  style={{ flexDirection: "row" }}
                                >
                                  <VStack
                                    style={{
                                      width: colScoreWidth,
                                      alignItems: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "700",
                                        color: isDark ? "#fff" : "#000",
                                      }}
                                    >
                                      {t.gross}
                                    </ThemedText>
                                  </VStack>
                                  {showNetColumns && (
                                    <VStack
                                      style={{
                                        width: colNetWidth,
                                        alignItems: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#8BC34A" : "#198754",
                                        }}
                                      >
                                        {t.net}
                                      </ThemedText>
                                    </VStack>
                                  )}
                                  {showPtsColumns && (
                                    <VStack
                                      style={{
                                        width: colPtsWidth,
                                        alignItems: "center",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          fontWeight: "700",
                                          color: isDark ? "#f59e0b" : "#d97706",
                                        }}
                                      >
                                        {t.stableford}
                                      </ThemedText>
                                    </VStack>
                                  )}
                                </View>
                              );
                            })}
                            {isHighLow &&
                              partners.length >= 4 &&
                              (() => {
                                let b9A = 0,
                                  b9B = 0;
                                let hasAny = false;
                                back9.forEach((bh: any) => {
                                  const st = getHighLowHoleStats(bh);
                                  if (st && st.isComplete) {
                                    b9A += st.teamAMatchPts;
                                    b9B += st.teamBMatchPts;
                                    hasAny = true;
                                  }
                                });
                                return (
                                  <>
                                    <View
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
                                        {hasAny ? b9A : "-"}
                                      </ThemedText>
                                    </View>
                                    <View
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
                                        {hasAny ? b9B : "-"}
                                      </ThemedText>
                                    </View>
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
                                {renderNassauHouses(ns.back9Houses)}
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
                        width: 50,
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
                          style={{ width: 55, textAlign: "center" }}
                        />
                        <ThemedText
                          style={{
                            width: 60,
                            textAlign: "center",
                            color: "#fff",
                          }}
                        >
                          {sumYardage(holes)}
                        </ThemedText>
                      </>
                    )}
                    <ThemedText
                      style={{ width: 50, textAlign: "center", color: "#fff" }}
                    >
                      {sumPar(holes)}
                    </ThemedText>
                    {partners.map((p) => {
                      const t = getPlayerTotals(holes, p);
                      return (
                        <View key={p.playerId} style={{ flexDirection: "row" }}>
                          <VStack
                            style={{
                              width: colScoreWidth,
                              alignItems: "center",
                            }}
                          >
                            <ThemedText
                              style={{
                                fontWeight: "800",
                                color: "#fff",
                              }}
                            >
                              {t.gross}
                            </ThemedText>
                          </VStack>
                          {showNetColumns && (
                            <VStack
                              style={{
                                width: colNetWidth,
                                alignItems: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  color: "#fff",
                                }}
                              >
                                {t.net}
                              </ThemedText>
                            </VStack>
                          )}
                          {showPtsColumns && (
                            <VStack
                              style={{
                                width: colPtsWidth,
                                alignItems: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  color: "#fff",
                                }}
                              >
                                {t.stableford}
                              </ThemedText>
                            </VStack>
                          )}
                        </View>
                      );
                    })}
                    {isHighLow &&
                      partners.length >= 4 &&
                      (() => {
                        let totalA = 0,
                          totalB = 0;
                        let hasAny = false;
                        displayHoles.forEach((th: any) => {
                          const st = getHighLowHoleStats(th);
                          if (st && st.isComplete) {
                            totalA += st.teamAMatchPts;
                            totalB += st.teamBMatchPts;
                            hasAny = true;
                          }
                        });
                        return (
                          <>
                            <View
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
                                {hasAny ? totalA : "-"}
                              </ThemedText>
                            </View>
                            <View
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
                                {hasAny ? totalB : "-"}
                              </ThemedText>
                            </View>
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
                        {renderNassauHouses(ns.overallHousesDisplay)}
                      </VStack>
                    )}
                  </HStack>
                </VStack>
              </ScrollView>
            );
          })()}

        {/* 🔹 SUMMARY TABLES FOR SIDE GAMES */}
        {(isHighLow ||
          isSplit6 ||
          isNassauBest ||
          isNassauCombined ||
          isNassau) &&
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
              {/* 🔹 SUMMARY TABLES FOR SIDE GAMES */}
              {(() => {
                const teamAColor = isDark ? "#4ade80" : "#198754";
                const teamBColor = isDark ? "#60a5fa" : "#0d6efd";
                return (
                  <>
                    {/* ── SPLIT SIX SUMMARY ── */}
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
                          .map((p: any) => (p.isPrimary ? "You" : p.name));
                        const hasBack = holes.some(
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
                                  color: bold
                                    ? "#84cc16"
                                    : isDark
                                      ? "#fff"
                                      : "#000",
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
                            <SumRow
                              label="Final X Points"
                              vals={s.finalXPoints}
                            />
                            <SumRow
                              label="Final Score"
                              vals={s.finalScore}
                              bold
                            />
                          </>
                        );
                      })()}

                    {/* ── HIGH-LOW SUMMARY ── */}
                    {isHighLow &&
                      partners.length >= 4 &&
                      (() => {
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
                            teamASandys: [i1.sandy, i2.sandy] as [
                              boolean,
                              boolean,
                            ],
                            teamBSandys: [i3.sandy, i4.sandy] as [
                              boolean,
                              boolean,
                            ],
                          };
                        });
                        const s = computeHighLowSummary(allData);
                        const teamAName = `${partners[0].isPrimary ? "You" : partners[0].name} & ${partners[1].name}`;
                        const teamBName = `${partners[2].name} & ${partners[3].name}`;
                        const margin = Math.abs(
                          s.finalScore.teamA - s.finalScore.teamB,
                        );
                        const hasBack = holes.some(
                          (h: any) => h.holeNumber > 9,
                        );
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
                          </>
                        );
                      })()}

                    {/* ── NASSAU SUMMARY ── */}
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
                        // compute ns inside an IIFE to scope it correctly
                        const teamAName =
                          partners.length >= 4
                            ? `${partners[0].isPrimary ? "You" : partners[0].name} & ${partners[1].name}`
                            : partners[0].isPrimary
                              ? "You"
                              : partners[0].name;
                        const teamBName =
                          partners.length >= 4
                            ? `${partners[2].name} & ${partners[3].name}`
                            : partners[1].isPrimary
                              ? "You"
                              : partners[1].name;
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
                          <View>
                            {(() => {
                              const ns = computeNassauState(
                                mode as "best" | "combined",
                                allData,
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
                                    Nassau{" "}
                                    {isNassauBest ? "Best Score" : "Combined"}{" "}
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
                                        <ThemedText
                                          style={{
                                            fontSize: 11,
                                            fontWeight: "700",
                                            color: teamAColor,
                                          }}
                                        >
                                          Match -{" "}
                                          {ns?.overallMatches?.team1 || 0} Half
                                          -{" "}
                                          {(ns?.front9Halfs?.team1 || 0) +
                                            (ns?.back9Halfs?.team1 || 0)}
                                        </ThemedText>
                                      }
                                      b={
                                        <ThemedText
                                          style={{
                                            fontSize: 11,
                                            fontWeight: "700",
                                            color: teamBColor,
                                          }}
                                        >
                                          Match -{" "}
                                          {ns?.overallMatches?.team2 || 0} Half
                                          -{" "}
                                          {(ns?.front9Halfs?.team2 || 0) +
                                            (ns?.back9Halfs?.team2 || 0)}
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
                                </>
                              );
                            })()}
                          </View>
                        );
                      })()}
                  </>
                );
              })()}
            </VStack>
          )}

        {partners.length < 2 &&
          (() => {
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

      <RangefinderModal
        visible={activeRangefinderHole !== null}
        onClose={() => setActiveRangefinderHole(null)}
        holes={holes}
        initialHoleId={activeRangefinderHole}
        courseName={holes[0]?.courseName || ""}
      />
    </SafeAreaView>
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
