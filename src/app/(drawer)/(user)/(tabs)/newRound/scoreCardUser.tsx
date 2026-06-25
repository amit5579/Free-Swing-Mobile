import {
  computeSplitSixSummary,
  computeNassauState,
  formatNassauHouses,
  formatNassauHousesSpaced,
  computeHighLowHolePoints,
  calculateSplitSixPoints,
  computeHighLowSummary,
} from "@/utils/scoringEngine";
import { getScoreCardDetails } from "@/api/modules/newRound.api";
import {
  saveScoreCard,
  getSubScorecardHandicap,
} from "@/api/modules/scoreCard.api";
import { saveDraft } from "@/utils/draftStorage";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  BackHandler,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { AppState } from "react-native";

type ScorePayload = {
  courseId: number;
  holeId: number;
  isCompleted: boolean;
  isExcluded: boolean;
  roundNumber: number;
  score: number | null;
  teeBoxId: number;
  tournamentId: number | null;
  userId: number;
};

export default function ScoreCardUserPage() {
  const {
    selectedScore,
    holes,
    handicap,
    courseId,
    teeBoxId,
    forceNew,
    numberOfPlayers,
    player2Id,
    player3Id,
    player4Id,
    roundContextId,
    startFrom,
    courseName,
  } = useLocalSearchParams();

  const [hasInitializedDraft, setHasInitializedDraft] = useState(false);

  const [pendingRoundContext, setPendingRoundContext] = useState<any>(null);

  useEffect(() => {
    // console.log("forceNew", forceNew);
    // console.log("selectedScore", selectedScore);
    // console.log("roundContextId", roundContextId);

    if (roundContextId) {
      AsyncStorage.getItem(`pending_round_context_v1_${roundContextId}`)
        .then((val) => {
          if (val) {
            const parsed = JSON.parse(val);
            setPendingRoundContext(parsed);
            // console.log("Retrieved pending round context response:", val);
          }
        })
        .catch((err) => {
          console.error("Error retrieving pending round context:", err);
        });
    }
  }, [roundContextId]);

  const routePage = useRouter();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [visible, setVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [scoreCardDetails, setScoreCardDetails] = useState<any>([]);
  const [companionHandicaps, setCompanionHandicaps] = useState<
    Record<number, number>
  >({});
  const partners = pendingRoundContext?.players || [];

  useEffect(() => {
    if (pendingRoundContext && pendingRoundContext.players && teeBoxId) {
      const fetchCompanionHandicaps = async () => {
        const handicapsMap: Record<number, number> = {};
        for (const p of pendingRoundContext.players) {
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
  }, [pendingRoundContext, teeBoxId]);

  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<any[]>([]);
  const [borderDisplay, setBorderDisplay] = useState(true);
  const parsedScore =
    typeof selectedScore === "string" ? JSON.parse(selectedScore) : {};
  const isExcluded = parsedScore.excluded === true;
  const isStableford = parsedScore.stableford === true;
  const isGross = parsedScore.gross === true;
  const isSplit6 = parsedScore.split_six === true;
  const isHighLow = parsedScore.high_low === true;
  const isNassauBest = parsedScore.nassau_best === true;
  const isNassauCombined = parsedScore.nassau_combined === true;
  const isNassau = isNassauBest || isNassauCombined;
  const isDoublePeoria =
    parsedScore.double_peoria === true ||
    parsedScore.scoring_type === "double-peoria" ||
    parsedScore.scoringType === "double-peoria" ||
    parsedScore.scoring_type === "double-peoria-net" ||
    parsedScore.scoringType === "double-peoria-net" ||
    parsedScore.scoring_type === "double-peoria-stableford" ||
    parsedScore.scoringType === "double-peoria-stableford" ||
    (scoreCardDetails &&
      scoreCardDetails.some((h: any) => h.isDoublePeoria === true));
  const [displayFront9, setDisplayFront9] = useState(true);
  const [displayBack9, setDisplayBack9] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreCardRef = useRef<any>([]);

  useEffect(() => {
    scoreCardRef.current = scoreCardDetails;
  }, [scoreCardDetails]);

  // const holesCount = Number(holes);

  const getScoringLabel = () => {
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
      return "Split 6";
    if (!isExcluded && !isStableford && !isSplit6 && isHighLow)
      return "High-Low";
    if (isNassauBest) return "Nassau • Best Score";
    if (isNassauCombined) return "Nassau • Combined Score";
    return "";
  };

  const showNetColumns =
    getScoringLabel() === "Net Score • Include Par 3" ||
    getScoringLabel() === "Net Score • Exclude Par 3" ||
    getScoringLabel() === "Stableford" ||
    getScoringLabel() === "Stableford • Exclude Par 3";

  const fetchScoreCard = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) setUserId(Number(storedUserId));

      const response = await getScoreCardDetails(
        Number(teeBoxId),
        Number(courseId),
        holes as string,
      );

      // console.log("response: ", response);
      setScoreCardDetails(response);
    } catch (error) {
      console.error("Fetching scorecard Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const is9Hole =
    holes === "front9" ||
    holes === "Front9" ||
    holes === "Front 9" ||
    holes === "back9" ||
    holes === "Back9" ||
    holes === "Back 9" ||
    holes === "9";

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

  const calculateHole = (hole: any) => {
    if (hole.score === null || hole.score === "" || hole.score === undefined) {
      return {
        ...hole,
        netScore: "-",
        stablefordPoints: null,
      };
    }
    const strokeIndex = hole.strokeIndex;

    let score = Number(hole.score);

    // REAL strokes calculation
    let strokesReceived = calculateStrokes(
      parseInt(String(handicap)) || 0, // from params
      hole.strokeIndex, // stroke index
    );

    // Excluded logic
    if (isExcluded && hole.par === 3) {
      strokesReceived = 0;
    }

    const isDP = isDoublePeoria || hole.isDoublePeoria === true;
    const netScore = isDP ? score : score - strokesReceived;

    // Stableford
    let stablefordPoints = null;

    if (isStableford && hole.score !== null) {
      const pts = hole.par - netScore + 2;
      stablefordPoints = pts > 0 ? pts : 0;
    }

    return {
      ...hole,
      strokeIndex,
      netScore,
      stablefordPoints,
    };
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

    const isDP = isDoublePeoria || hole.isDoublePeoria === true;
    const playerHandicap = isPrimary
      ? parseInt(String(handicap)) || 0
      : companionHandicaps[userId] || 0;
    let strokesReceived = calculateStrokes(playerHandicap, hole.strokeIndex);
    if (isExcluded && hole.par === 3) {
      strokesReceived = 0;
    }
    const netScore = isDP ? rawScore : rawScore - strokesReceived;

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

  const getScoreLegendCounts = (holesList: any[]) => {
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

    holesList.forEach((h) => {
      const playersToCount =
        partners.length >= 2 ? partners : [{ isPrimary: true, playerId: "p1" }];
      playersToCount.forEach((p: any) => {
        let score: number | null = null;
        if (partners.length >= 2) {
          const info = getPlayerHoleInfo(h, p);
          score = info.score;
        } else {
          score =
            h.score !== null && h.score !== "" && h.score !== undefined
              ? Number(h.score)
              : null;
        }

        if (score === null || score < 0) return;

        const diff = score - h.par;

        // 🟡 Hole-in-One
        if (score === 1) {
          counts.holeInOne++;
          return;
        }

        // 🟦 Albatross (-3)
        if (score === 0) {
          counts.albatross++;
          return;
        }

        // 🟢 Eagle (-2)
        if (diff === -2) {
          counts.eagle++;
          return;
        }

        // 🟢 Birdie (-1)
        if (diff === -1) {
          counts.birdie++;
          return;
        }

        // ⚪ Par
        if (diff === 0) {
          counts.par++;
          return;
        }

        // 🔴 Bogey (+1)
        if (diff === 1) {
          counts.bogey++;
          return;
        }

        // 🔴 Double (+2)
        if (diff === 2) {
          counts.double++;
          return;
        }

        // 🟣 Triple (+3)
        if (diff === 3) {
          counts.triple++;
          return;
        }

        // ⬛ Quad+
        if (diff >= 4) {
          counts.quadPlus++;
          return;
        }
      });
    });

    return counts;
  };

  const nassauStartingNine =
    startFrom === "front" || startFrom === "back" ? startFrom : null;

  const processedAllHoles = scoreCardDetails.map(calculateHole);

  const processedFront9 = processedAllHoles.filter((h: any) =>
    nassauStartingNine === "back" ? h.holeNumber >= 10 : h.holeNumber <= 9,
  );
  const processedBack9 = processedAllHoles.filter((h: any) =>
    nassauStartingNine === "back" ? h.holeNumber <= 9 : h.holeNumber >= 10,
  );
  const legendCounts = getScoreLegendCounts(processedAllHoles);

  const getTotals = (holes: any[], mode: string) => ({
    strokeIndex: "",
    yards: holes.reduce((sum, h) => sum + (h.yardage || 0), 0),
    par: holes.reduce((sum, h) => sum + (h.par || 0), 0),
    score: holes.reduce((sum, h) => sum + (Number(h.score) || 0), 0),
    net: holes.reduce((sum, h) => sum + (Number(h.netScore) || 0), 0),

    stableford: isStableford
      ? holes.reduce((sum, h) => sum + (Number(h.stablefordPoints) || 0), 0)
      : 0,
  });

  const frontTotals = getTotals(processedFront9, getScoringLabel());
  const backTotals = getTotals(processedBack9, getScoringLabel());

  const processedHoles = processedAllHoles
    .filter((h: any) => {
      if (holes === "18") return true;
      if (holes === "front9" || holes === "Front9" || holes === "Front 9")
        return h.holeNumber <= 9;
      if (holes === "back9" || holes === "Back9" || holes === "Back 9")
        return h.holeNumber >= 10;
      return true;
    })
    .sort((a: any, b: any) => {
      if (nassauStartingNine === "back") {
        const aVal = a.holeNumber >= 10 ? a.holeNumber - 10 : a.holeNumber + 8;
        const bVal = b.holeNumber >= 10 ? b.holeNumber - 10 : b.holeNumber + 8;
        return aVal - bVal;
      }
      return a.holeNumber - b.holeNumber;
    });

  const grandTotals = getTotals(processedHoles, getScoringLabel());

  const saveRound = useCallback(
    async (isCompleted: boolean, shouldGoBack: boolean = false) => {
      try {
        setVisible(false);
        const playingGroupRoundKey = roundContextId
          ? String(roundContextId)
          : undefined;
        const playingPartnersJson = pendingRoundContext
          ? JSON.stringify(pendingRoundContext.players)
          : undefined;

        const payload = scoreCardRef.current
          .map(calculateHole)
          .map((h: any) => ({
            courseId: courseId ? Number(courseId) : h.courseId,
            courseHalf:
              holes === "front9" || holes === "Front9" || holes === "Front 9"
                ? "Front9"
                : holes === "back9" || holes === "Back9" || holes === "Back 9"
                  ? "Back9"
                  : null,
            holeId: h.holeId,
            isCompleted: isCompleted,
            isExcluded: isExcluded,
            matchScoringType: isSplit6
              ? "split-six"
              : isHighLow
                ? "high-low"
                : isNassauBest
                  ? "nassau-best"
                  : isNassauCombined
                    ? "nassau-combined"
                    : null,
            roundNumber: h.roundNumber || 1,
            score:
              h.score === undefined || h.score === null || h.score === ""
                ? null
                : Number(h.score),
            stablefordPoints: h.stablefordPoints,
            teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
            tournamentId: null,
            userId: Number(userId),
            companionScoresJson: h.companionScoresJson || null,
            companionSandysJson: h.companionSandysJson || null,
            nassauStartingNine: nassauStartingNine,
            NassauStartingNine: nassauStartingNine,
            ...(playingGroupRoundKey
              ? {
                  playingGroupRoundKey,
                  PlayingGroupRoundKey: playingGroupRoundKey,
                }
              : {}),
            ...(playingPartnersJson
              ? {
                  playingPartnersJson,
                  PlayingPartnersJson: playingPartnersJson,
                }
              : {}),
          }));
        // console.log("saveRound payload", payload);

        await saveScoreCard(payload);

        if (isCompleted) {
          Toast.show({
            type: "success",
            text1: "Round Finished",
            text2: "Score submitted successfully",
          });
        }

        if (shouldGoBack) {
          // if (isCompleted) {
          //   setScoreCardDetails([]); // Clear inputs for fresh start
          // }
          routePage.push("/(drawer)/(user)/(tabs)/dashboard");
          setTimeout(() => {
            (navigation as any).reset({
              index: 0,
              routes: [{ name: "index" }],
            });
          }, 500);
        }
      } catch (error) {
        console.log("Error saving round:", error);
      }
    },
    [courseId, isExcluded, teeBoxId, userId, routePage, navigation],
  );

  const handleGoBack = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const playingGroupRoundKey = roundContextId
      ? String(roundContextId)
      : undefined;
    const playingPartnersJson = pendingRoundContext
      ? JSON.stringify(pendingRoundContext.players)
      : undefined;

    const payload = scoreCardRef.current.map(calculateHole).map((h: any) => ({
      courseId: courseId ? Number(courseId) : h.courseId,
      courseHalf:
        holes === "front9" || holes === "Front9" || holes === "Front 9"
          ? "Front9"
          : holes === "back9" || holes === "Back9" || holes === "Back 9"
            ? "Back9"
            : null,
      holeId: h.holeId,
      isCompleted: false,
      isExcluded: isExcluded,
      matchScoringType: isSplit6
        ? "split-six"
        : isHighLow
          ? "high-low"
          : isNassauBest
            ? "nassau-best"
            : isNassauCombined
              ? "nassau-combined"
              : null,
      roundNumber: h.roundNumber || 1,
      score:
        h.score === undefined || h.score === null || h.score === ""
          ? null
          : Number(h.score),
      stablefordPoints: h.stablefordPoints,
      teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
      tournamentId: null,
      userId: Number(userId),
      companionScoresJson: h.companionScoresJson || null,
      companionSandysJson: h.companionSandysJson || null,
      nassauStartingNine: nassauStartingNine,
      NassauStartingNine: nassauStartingNine,
      ...(playingGroupRoundKey
        ? {
            playingGroupRoundKey,
            PlayingGroupRoundKey: playingGroupRoundKey,
          }
        : {}),
      ...(playingPartnersJson
        ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson }
        : {}),
    }));

    try {
      await saveScoreCard(payload);
    } catch (err) {
      console.error("Final save failed:", err);
    }

    routePage.back();
  }, [
    routePage,
    courseId,
    holes,
    isExcluded,
    isSplit6,
    isHighLow,
    isNassauBest,
    isNassauCombined,
    teeBoxId,
    userId,
    nassauStartingNine,
    roundContextId,
    pendingRoundContext,
  ]);

  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [handleGoBack]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          saveRound(false, false);
        }
      },
    );

    return () => {
      appStateListener.remove();
    };
  }, [saveRound]);

  const handleFinishRound = async () => {
    await saveRound(true, true);
  };

  const triggerSaveDraft = async (updatedHoles: any[]) => {
    try {
      const sanitized = updatedHoles.map(calculateHole).map((h: any) => ({
        ...h,
        score:
          h.score !== null && h.score !== undefined && h.score !== ""
            ? Number(h.score)
            : null,
        netScore:
          h.netScore === "-" || h.netScore === undefined
            ? null
            : Number(h.netScore),
        stablefordPoints: h.stablefordPoints,
      }));

      const holesPlayed = sanitized.filter(
        (h: any) => h.score !== null && h.score > 0,
      ).length;
      const scoreVal = sanitized.reduce(
        (sum: number, h: any) => sum + (h.score && h.score > 0 ? h.score : 0),
        0,
      );
      const netScoreVal = sanitized.reduce(
        (sum: number, h: any) =>
          sum + (h.netScore && h.netScore > 0 ? h.netScore : 0),
        0,
      );
      const parVal = sanitized.reduce(
        (sum: number, h: any) => sum + (h.par || 0),
        0,
      );

      const courseHalfStr =
        holes === "front9" || holes === "Front9" || holes === "Front 9"
          ? "Front9"
          : holes === "back9" || holes === "Back9" || holes === "Back 9"
            ? "Back9"
            : "";

      const currentUserId =
        userId || Number(await AsyncStorage.getItem("userId")) || 0;
      const scorecardId = String(updatedHoles[0]?.scorecardId || "");

      if (scorecardId) {
        const newText: Record<number, string> = {};
        sanitized.forEach((h: any) => {
          if (h.score !== null && h.score !== undefined && h.score >= 0) {
            newText[h.holeId] = h.score.toString();
          }
        });

        await saveDraft({
          scorecardId,
          userId: currentUserId,
          courseName: (courseName as string) || "Unknown Course",
          date: new Date().toISOString(),
          holesPlayed,
          score: scoreVal,
          netScore: netScoreVal,
          par: parVal,
          courseHalf: courseHalfStr,
          holes: sanitized,
          textScores: newText,
        });
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  useEffect(() => {
    if (!scoreCardDetails || scoreCardDetails.length === 0) return;
    if (roundContextId && !pendingRoundContext) return;
    if (hasInitializedDraft) return;

    setHasInitializedDraft(true);

    const initializeDraftAndSave = async () => {
      try {
        const sanitized = scoreCardDetails.map(calculateHole).map((h: any) => ({
          ...h,
          score:
            h.score !== null && h.score !== undefined && h.score !== ""
              ? Number(h.score)
              : null,
          netScore:
            h.netScore === "-" || h.netScore === undefined
              ? null
              : Number(h.netScore),
          stablefordPoints: h.stablefordPoints,
        }));

        const holesPlayed = sanitized.filter(
          (h: any) => h.score !== null && h.score > 0,
        ).length;
        const scoreVal = sanitized.reduce(
          (sum: number, h: any) => sum + (h.score && h.score > 0 ? h.score : 0),
          0,
        );
        const netScoreVal = sanitized.reduce(
          (sum: number, h: any) =>
            sum + (h.netScore && h.netScore > 0 ? h.netScore : 0),
          0,
        );
        const parVal = sanitized.reduce(
          (sum: number, h: any) => sum + (h.par || 0),
          0,
        );

        const courseHalfStr =
          holes === "front9" || holes === "Front9" || holes === "Front 9"
            ? "Front9"
            : holes === "back9" || holes === "Back9" || holes === "Back 9"
              ? "Back9"
              : "";

        const currentUserId =
          userId || Number(await AsyncStorage.getItem("userId")) || 0;
        const scorecardId = String(scoreCardDetails[0]?.scorecardId || "");

        if (scorecardId) {
          const newText: Record<number, string> = {};
          sanitized.forEach((h: any) => {
            if (h.score !== null && h.score !== undefined && h.score >= 0) {
              newText[h.holeId] = h.score.toString();
            }
          });

          await saveDraft({
            scorecardId,
            userId: currentUserId,
            courseName: (courseName as string) || "Unknown Course",
            date: new Date().toISOString(),
            holesPlayed,
            score: scoreVal,
            netScore: netScoreVal,
            par: parVal,
            courseHalf: courseHalfStr,
            holes: sanitized,
            textScores: newText,
          });
        }

        const playingGroupRoundKey = roundContextId
          ? String(roundContextId)
          : undefined;
        const playingPartnersJson = pendingRoundContext
          ? JSON.stringify(pendingRoundContext.players)
          : undefined;

        const payload = sanitized.map((h: any) => ({
          courseId: courseId ? Number(courseId) : h.courseId,
          courseHalf: courseHalfStr || null,
          holeId: h.holeId,
          isCompleted: false,
          isExcluded: isExcluded,
          matchScoringType: isSplit6
            ? "split-six"
            : isHighLow
              ? "high-low"
              : isNassauBest
                ? "nassau-best"
                : isNassauCombined
                  ? "nassau-combined"
                  : null,
          roundNumber: h.roundNumber || 1,
          score:
            h.score === undefined || h.score === null || h.score === ""
              ? null
              : Number(h.score),
          stablefordPoints: h.stablefordPoints,
          teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
          tournamentId: null,
          userId: Number(currentUserId),
          companionScoresJson: h.companionScoresJson || null,
          companionSandysJson: h.companionSandysJson || null,
          nassauStartingNine: nassauStartingNine,
          NassauStartingNine: nassauStartingNine,
          ...(playingGroupRoundKey
            ? {
                playingGroupRoundKey,
                PlayingGroupRoundKey: playingGroupRoundKey,
              }
            : {}),
          ...(playingPartnersJson
            ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson }
            : {}),
        }));

        await saveScoreCard(payload);
      } catch (err) {
        console.error("Error in initial draft/server save:", err);
      }
    };

    initializeDraftAndSave();
  }, [
    scoreCardDetails,
    pendingRoundContext,
    roundContextId,
    hasInitializedDraft,
  ]);

  useEffect(() => {
    fetchScoreCard();
  }, [selectedScore, holes, handicap, courseId, teeBoxId]);

  useEffect(() => {
    if (scoreCardDetails && scoreCardDetails.length > 0) {
      setDisplayFront9(frontTotals.score > 0);
      setDisplayBack9(backTotals.score > 0);
    }
  }, [scoreCardDetails, frontTotals.score, backTotals.score]);
  // input fields

  // finds correct hole
  // updates only that hole
  // triggers re-render
  // recalculates everything automatically

  const triggerAutoSave = (updatedDetails: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const playingGroupRoundKey = roundContextId
        ? String(roundContextId)
        : undefined;
      const playingPartnersJson = pendingRoundContext
        ? JSON.stringify(pendingRoundContext.players)
        : undefined;

      const payload = updatedDetails.map(calculateHole).map((h: any) => ({
        courseId: courseId ? Number(courseId) : h.courseId,
        courseHalf:
          holes === "front9" || holes === "Front9" || holes === "Front 9"
            ? "Front9"
            : holes === "back9" || holes === "Back9" || holes === "Back 9"
              ? "Back9"
              : null,
        holeId: h.holeId,
        isCompleted: false,
        isExcluded: isExcluded,
        matchScoringType: isSplit6
          ? "split-six"
          : isHighLow
            ? "high-low"
            : isNassauBest
              ? "nassau-best"
              : isNassauCombined
                ? "nassau-combined"
                : null,
        roundNumber: h.roundNumber || 1,
        score:
          h.score === undefined || h.score === null || h.score === ""
            ? null
            : Number(h.score),
        stablefordPoints: h.stablefordPoints,
        teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
        tournamentId: null,
        userId: Number(userId),
        companionScoresJson: h.companionScoresJson || null,
        companionSandysJson: h.companionSandysJson || null,
        nassauStartingNine: nassauStartingNine,
        NassauStartingNine: nassauStartingNine,
        ...(playingGroupRoundKey
          ? { playingGroupRoundKey, PlayingGroupRoundKey: playingGroupRoundKey }
          : {}),
        ...(playingPartnersJson
          ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson }
          : {}),
      }));
      // console.log("Auto-saving payload:", payload);
      saveScoreCard(payload).catch((err) =>
        console.error("Auto-save error:", err),
      );
    }, 500);
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
      net: hasAnyScore ? (isHighLow ? "-" : net) : "-",
      stableford: hasAnyScore ? stableford : "-",
    };
  };

  const handleMultiplayerScoreChange = (
    holeId: number,
    playerId: string,
    value: string,
    index?: number,
    pIndex?: number,
  ) => {
    let finalVal: number | null = null;
    if (value !== "") {
      if (!/^\d+$/.test(value)) {
        Toast.show({ type: "error", text1: "Enter valid score" });
        return;
      }
      finalVal = Number(value);
      if (finalVal > 15) {
        Toast.show({ type: "error", text1: "Maximum score per hole is 15." });
        return;
      }
    }

    const updatedDetails = scoreCardDetails.map((h: any) => {
      if (h.holeId === holeId) {
        let companionScores: Record<string, number | null> = {};
        if (h.companionScoresJson) {
          try {
            companionScores =
              typeof h.companionScoresJson === "string"
                ? JSON.parse(h.companionScoresJson)
                : h.companionScoresJson;
          } catch (e) {
            console.error(e);
          }
        }

        companionScores[playerId] = finalVal;

        const newHole = {
          ...h,
          companionScoresJson: JSON.stringify(companionScores),
        };

        if (playerId === "p1") {
          newHole.score = finalVal !== null ? String(finalVal) : "";
        }

        return newHole;
      }
      return h;
    });

    setScoreCardDetails(updatedDetails);
    triggerAutoSave(updatedDetails);
    triggerSaveDraft(updatedDetails);

    if (index !== undefined && pIndex !== undefined) {
      const flatIndex = index * partners.length + pIndex;
      const nextFlatIndex = flatIndex + 1;
      const totalInputs = processedHoles.length * partners.length;

      // Auto-focus next input if 2 digits are entered
      if (value.length >= 2) {
        if (nextFlatIndex < totalInputs) {
          if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
          inputRefs.current[nextFlatIndex]?.focus();
        }
      }

      // Auto-focus next input after 3 seconds if a value is entered
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (value !== "") {
        focusTimeoutRef.current = setTimeout(() => {
          if (nextFlatIndex < totalInputs) {
            inputRefs.current[nextFlatIndex]?.focus();
          }
        }, 1500);
      }
    }
  };

  const handleSandyToggle = (holeId: number, playerId: string) => {
    const updatedDetails = scoreCardDetails.map((h: any) => {
      if (h.holeId === holeId) {
        let companionSandys: Record<string, boolean> = {};
        if (h.companionSandysJson) {
          try {
            companionSandys =
              typeof h.companionSandysJson === "string"
                ? JSON.parse(h.companionSandysJson)
                : h.companionSandysJson;
          } catch (e) {
            console.error(e);
          }
        }

        const nextVal = !companionSandys[playerId];
        companionSandys[playerId] = nextVal;

        if (nextVal) {
          const pObj = partners.find((p: any) => p.playerId === playerId);
          const name = pObj ? (pObj.isPrimary ? "You" : pObj.name) : "Player";
          Toast.show({
            type: "success",
            text1: `${name} got a Sandy!`,
          });
        }

        return {
          ...h,
          companionSandysJson: JSON.stringify(companionSandys),
        };
      }
      return h;
    });

    setScoreCardDetails(updatedDetails);
    triggerAutoSave(updatedDetails);
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
    if (score === null || score <= 0) return 0;
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

  const getHighLowHoleStats = (h: any) => {
    const empty = {
      isComplete: false,
      teamAMatchPts: 0,
      teamBMatchPts: 0,
    };

    if (partners.length < 4) return empty;

    const info1 = getPlayerHoleInfo(h, partners[0]);
    const info2 = getPlayerHoleInfo(h, partners[1]);
    const info3 = getPlayerHoleInfo(h, partners[2]);
    const info4 = getPlayerHoleInfo(h, partners[3]);

    const s1 = info1.score !== null ? info1.score : null;
    const s2 = info2.score !== null ? info2.score : null;
    const s3 = info3.score !== null ? info3.score : null;
    const s4 = info4.score !== null ? info4.score : null;

    if (s1 === null || s2 === null || s3 === null || s4 === null) {
      return empty;
    }

    const { teamA, teamB } = computeHighLowHolePoints([s1, s2], [s3, s4]);

    return {
      isComplete: true,
      teamAMatchPts: teamA,
      teamBMatchPts: teamB,
    };
  };

  const getHighLowTotals = (holesList: any[]) => {
    let teamAMatchPts = 0;
    let teamBMatchPts = 0;

    holesList.forEach((hole) => {
      const stats = getHighLowHoleStats(hole);
      if (!stats.isComplete) return;
      teamAMatchPts += stats.teamAMatchPts;
      teamBMatchPts += stats.teamBMatchPts;
    });

    return { teamAMatchPts, teamBMatchPts };
  };

  const handleScoreChange = (holeId: number, value: string, index: number) => {
    if (partners.length >= 2) {
      handleMultiplayerScoreChange(holeId, "p1", value);
    } else {
      // allow empty
      if (value === "") {
        const updatedDetails = scoreCardDetails.map((hole: any) =>
          hole.holeId === holeId ? { ...hole, score: "" } : hole,
        );
        setScoreCardDetails(updatedDetails);
        triggerAutoSave(updatedDetails);
        triggerSaveDraft(updatedDetails);
        return;
      }

      // only digits allowed
      if (!/^\d+$/.test(value)) {
        Toast.show({
          type: "error",
          text1: "Enter valid score",
        });
        return;
      }

      const numericValue = Number(value);

      if (numericValue > 15) {
        Toast.show({
          type: "error",
          text1: "Maximum score per hole is 15.",
        });
        const updatedDetails = scoreCardDetails.map((hole: any) =>
          hole.holeId === holeId ? { ...hole, score: "" } : hole,
        );
        setScoreCardDetails(updatedDetails);
        triggerAutoSave(updatedDetails);
        triggerSaveDraft(updatedDetails);
        return;
      }

      // ✅ store STRING (IMPORTANT)
      const updatedDetails = scoreCardDetails.map((hole: any) =>
        hole.holeId === holeId ? { ...hole, score: value } : hole,
      );
      setScoreCardDetails(updatedDetails);

      triggerAutoSave(updatedDetails);
      triggerSaveDraft(updatedDetails);
    }

    // Auto-focus next input if 2 digits are entered
    if (value.length >= 2) {
      const nextIndex = index + 1;
      if (nextIndex < processedHoles.length) {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        inputRefs.current[nextIndex]?.focus();
      }
    }

    // Auto-focus next input after 3 seconds if a value is entered
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    if (value !== "") {
      focusTimeoutRef.current = setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex < processedHoles.length) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 1500);
    }
  };

  const renderScoreIndicator = (
    score: number | string | null,
    par: number,
    isDark: boolean,
    rawValue?: string,
  ) => {
    const finalRaw =
      rawValue !== undefined
        ? rawValue
        : score !== null && score !== undefined
          ? String(score)
          : "";

    if (
      finalRaw === "" ||
      score === null ||
      score === undefined ||
      score === ""
    )
      return null;

    const numericScore = Number(score);

    if (numericScore === 0) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
            <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
          </View>
        </View>
      );
    }
    if (numericScore === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
            <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
          </View>
        </View>
      );
    }

    const diff = numericScore - par;

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

  const renderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 12,
          }}
        >
          {/* 🔝 TOP ROW */}
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 🔙 BACK */}
            <Pressable
              onPress={() => handleGoBack()}
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

            {/* 🧠 TITLE */}
            <ThemedText
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#fff" : "#020617",
              }}
            >
              Scorecard
            </ThemedText>

            {/* ⚖️ TOGGLE */}
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

          {/* 📌 META INFO ROW */}
          <HStack
            style={{
              marginTop: 12,
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: isDark ? "#111827" : "#f8fafc",
            }}
          >
            {/* 📝 SCORING TYPE */}
            <HStack style={{ alignItems: "center" }}>
              <Ionicons
                name="person-outline"
                size={14}
                color={isDark ? "#94a3b8" : "#64748b"}
              />

              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  fontWeight: "600",
                  color: isDark ? "#e5e7eb" : "#374151",
                }}
              >
                Handicap: {handicap ?? "N/A"}
              </Text>
            </HStack>

            {/* 🟢 HANDICAP BADGE */}
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
                textAlign: "right",
              }}
            >
              {getScoringLabel()}
            </Text>
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <>
      <View
        style={{
          flex: 1,
        }}
      >
        {/* Header */}

        {renderHeader()}

        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-6 pb-20">
            <VStack className="gap-4">
              {loading ? (
                <VStack style={{ gap: 12 }}>
                  {/* Header Skeleton */}
                  <HStack
                    style={{
                      paddingVertical: 14,
                      backgroundColor: isDark
                        ? "rgba(38, 38, 38, 0.5)"
                        : "rgba(243, 244, 246, 0.5)",
                      borderRadius: 10,
                      gap: 8,
                      paddingHorizontal: 8,
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton
                        key={i}
                        height={16}
                        width="14%"
                        isDark={isDark}
                      />
                    ))}
                  </HStack>

                  {/* Rows Skeleton */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                    <HStack
                      key={row}
                      style={{
                        paddingVertical: 14,
                        backgroundColor: isDark
                          ? "rgba(15, 23, 42, 0.4)"
                          : "rgba(255, 255, 255, 0.4)",
                        borderRadius: 10,
                        gap: 8,
                        paddingHorizontal: 8,
                        borderBottomWidth: 0.5,
                        borderColor: isDark ? "#1e293b" : "#e2e8f0",
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((col) => (
                        <Skeleton
                          key={col}
                          height={12}
                          width="14%"
                          isDark={isDark}
                        />
                      ))}
                    </HStack>
                  ))}

                  {/* Total Row Skeleton */}
                  <Box
                    style={{
                      marginTop: 10,
                      paddingVertical: 18,
                      backgroundColor: isDark
                        ? "rgba(139, 195, 74, 0.2)"
                        : "rgba(139, 195, 74, 0.1)",
                      borderRadius: 12,
                      paddingHorizontal: 8,
                    }}
                  >
                    <HStack style={{ gap: 8 }}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton
                          key={i}
                          height={16}
                          width="14%"
                          isDark={isDark}
                        />
                      ))}
                    </HStack>
                  </Box>
                </VStack>
              ) : (
                <>
                  {/* CARD WRAPPER */}
                  {partners.length < 2 ? (
                    <VStack
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: isDark ? "#1e293b" : "#e5e7eb",
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                        shadowColor: "#000",
                        shadowOpacity: 0.12,
                        shadowRadius: 6,
                        elevation: 2,
                      }}
                    >
                      {/* 🔹 HEADER */}
                      <HStack
                        style={{
                          paddingVertical: 12,
                          backgroundColor: isDark ? "#111827" : "#f8fafc",
                          borderBottomWidth: 1,
                          borderColor: isDark ? "#1e293b" : "#e5e7eb",
                        }}
                      >
                        {[
                          "Hole",
                          isDetailsVisible && "SI",
                          isDetailsVisible && "Yards",
                          "Par",
                          "Score",
                          showNetColumns && "Net",
                          isStableford && "Pts",
                        ]
                          .filter(Boolean)
                          .map((item, i) => (
                            <ThemedText
                              key={i}
                              style={{
                                flex: 1,
                                textAlign: "center",
                                fontWeight: "700",
                                fontSize: 12,
                              }}
                            >
                              {item}
                            </ThemedText>
                          ))}
                      </HStack>

                      {/* 🔹 ROWS */}
                      {processedHoles.map((h: any, index: number) => (
                        <View key={h.holeId}>
                          <HStack
                            style={{
                              paddingVertical: 12,
                              alignItems: "center",
                              borderBottomWidth: 0.5,
                              backgroundColor: isDark ? "#020617" : "#ffffff",
                              borderColor: isDark ? "#1e293b" : "#e5e7eb",
                            }}
                          >
                            <ThemedText
                              style={{ flex: 1, textAlign: "center" }}
                            >
                              {h.holeNumber}
                            </ThemedText>
                            {isDetailsVisible && (
                              <>
                                <ThemedText
                                  style={{ flex: 1, textAlign: "center" }}
                                >
                                  {h.strokeIndex}
                                </ThemedText>

                                <ThemedText
                                  style={{
                                    flex: 1,
                                    textAlign: "center",
                                    color: "#888",
                                  }}
                                >
                                  {h.yardage}
                                </ThemedText>
                              </>
                            )}

                            <ThemedText
                              style={{ flex: 1, textAlign: "center" }}
                            >
                              {h.par}
                            </ThemedText>

                            {/*  SCORE INPUT */}
                            <View
                              style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {renderScoreIndicator(h.score, h.par, isDark)}

                              <TextInput
                                value={
                                  h.score !== null && h.score !== undefined
                                    ? String(h.score)
                                    : ""
                                }
                                onChangeText={(val) =>
                                  handleScoreChange(h.holeId, val, index)
                                }
                                onBlur={() => {
                                  if (focusTimeoutRef.current)
                                    clearTimeout(focusTimeoutRef.current);
                                }}
                                onSubmitEditing={() => {
                                  if (index < processedHoles.length - 1) {
                                    inputRefs.current[index + 1]?.focus();
                                  }
                                }}
                                returnKeyType={
                                  index === processedHoles.length - 1
                                    ? "done"
                                    : "next"
                                }
                                ref={(el: any) =>
                                  (inputRefs.current[index] = el)
                                }
                                keyboardType="numeric"
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: borderDisplay ? 8 : 0,
                                  borderWidth: borderDisplay ? 1 : 0,
                                  borderColor: isDark ? "#444" : "#ccc",
                                  backgroundColor: "transparent",
                                  textAlign: "center",
                                  color: isDark ? "#fff" : "#000",
                                  fontWeight: "600",
                                  padding: 0,
                                }}
                              />
                            </View>

                            {showNetColumns && (
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
                            )}

                            {isStableford && (
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {h.stablefordPoints ?? "-"}
                              </ThemedText>
                            )}
                          </HStack>

                          {/*  FRONT 9 */}
                          {h.holeNumber === 9 && (
                            <HStack
                              style={{
                                backgroundColor: isDark ? "#111827" : "#f8fafc",
                                paddingVertical: 10,
                                borderTopWidth: 1,
                                borderColor: isDark ? "#1e293b" : "#e5e7eb",
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

                              {isDetailsVisible && (
                                <>
                                  <ThemedText
                                    style={{ flex: 1, textAlign: "center" }}
                                  >
                                    {frontTotals.strokeIndex}
                                  </ThemedText>
                                  <ThemedText
                                    style={{ flex: 1, textAlign: "center" }}
                                  >
                                    {frontTotals.yards}
                                  </ThemedText>
                                </>
                              )}

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
                                {Number(frontTotals.score)}
                              </ThemedText>

                              {showNetColumns && (
                                <ThemedText
                                  style={{
                                    flex: 1,
                                    textAlign: "center",
                                    fontWeight: "700",
                                  }}
                                >
                                  {frontTotals.net}
                                </ThemedText>
                              )}

                              {isStableford && (
                                <ThemedText
                                  style={{ flex: 1, textAlign: "center" }}
                                >
                                  {frontTotals.stableford}
                                </ThemedText>
                              )}
                            </HStack>
                          )}

                          {/*  BACK 9 */}
                          {h.holeNumber === 18 && (
                            <HStack
                              style={{
                                backgroundColor: isDark ? "#111827" : "#f8fafc",
                                paddingVertical: 10,
                                borderTopWidth: 1,
                                borderColor: isDark ? "#1e293b" : "#e5e7eb",
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

                              {isDetailsVisible && (
                                <>
                                  <ThemedText
                                    style={{ flex: 1, textAlign: "center" }}
                                  >
                                    {backTotals.strokeIndex}
                                  </ThemedText>
                                  <ThemedText
                                    style={{ flex: 1, textAlign: "center" }}
                                  >
                                    {backTotals.yards}
                                  </ThemedText>
                                </>
                              )}

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

                              {showNetColumns && (
                                <ThemedText
                                  style={{
                                    flex: 1,
                                    textAlign: "center",
                                    fontWeight: "700",
                                  }}
                                >
                                  {backTotals.net}
                                </ThemedText>
                              )}

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
                      ))}
                    </VStack>
                  ) : (
                    /* MULTIPLAYER SCORECARD GRID */
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

                      let ns: any = null;
                      if (isNassau && partners.length >= 2) {
                        const allData = processedHoles.map((h: any) => {
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
                        ns = computeNassauState(
                          mode as "best" | "combined",
                          allData,
                        );
                      }

                      const pScoreWidth = 75;
                      const pNetWidth = 80;
                      const pPtsWidth = 80;

                      let partnerColsWidth = 0;
                      partners.forEach(() => {
                        partnerColsWidth += pScoreWidth;
                        if (showNetColumns) partnerColsWidth += pNetWidth;
                        if (isStableford) partnerColsWidth += pPtsWidth;
                      });

                      const totalWidth =
                        50 +
                        50 + // par is always visible
                        (isDetailsVisible ? 55 + 60 : 0) +
                        partnerColsWidth +
                        (isSplit6 && partners.length >= 3 ? 3 * 95 : 0) +
                        (isHighLow && partners.length >= 4 ? 2 * 80 : 0) +
                        (isNassau && partners.length >= 2 ? 100 : 0);
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
                              borderWidth: 1,
                              borderColor: isDark ? "#1e293b" : "#e5e7eb",
                              backgroundColor: isDark ? "#020617" : "#ffffff",
                            }}
                          >
                            {/* Headers */}
                            <HStack
                              style={{
                                paddingVertical: 12,
                                backgroundColor: isDark ? "#111827" : "#f8fafc",
                                borderBottomWidth: 1,
                                borderColor: isDark ? "#1e293b" : "#e5e7eb",
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
                              {/* Score Input Headers (LHS) */}
                              {partners.map((p: any, idx: number) => {
                                let badgeText = "";
                                let badgeColor = "";
                                if (isHighLow) {
                                  badgeText = idx < 2 ? "Team A" : "Team B";
                                  badgeColor = idx < 2 ? "#0284c7" : "#e11d48";
                                }
                                const pName = p.isPrimary ? "You" : p.name;
                                return (
                                  <VStack
                                    key={`score-col-hdr-${p.playerId}`}
                                    style={{
                                      width: pScoreWidth,
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
                                      {pName}
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

                              {/* Calculated Net Points Headers (RHS) */}
                              {showNetColumns &&
                                partners.map((p: any) => {
                                  const pName = p.isPrimary ? "You" : p.name;
                                  return (
                                    <VStack
                                      key={`net-col-hdr-${p.playerId}`}
                                      style={{
                                        width: pNetWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ThemedText
                                        numberOfLines={1}
                                        style={{
                                          textAlign: "center",
                                          fontWeight: "700",
                                          fontSize: 11,
                                          color: "#8BC34A",
                                        }}
                                      >
                                        {`Net(${pName})`}
                                      </ThemedText>
                                    </VStack>
                                  );
                                })}

                              {/* Stableford Points Headers (RHS) */}
                              {isStableford &&
                                partners.map((p: any) => {
                                  const pName = p.isPrimary ? "You" : p.name;
                                  return (
                                    <VStack
                                      key={`pts-col-hdr-${p.playerId}`}
                                      style={{
                                        width: pPtsWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ThemedText
                                        numberOfLines={1}
                                        style={{
                                          textAlign: "center",
                                          fontWeight: "700",
                                          fontSize: 11,
                                          color: "#f59e0b",
                                        }}
                                      >
                                        {`Pts(${pName})`}
                                      </ThemedText>
                                    </VStack>
                                  );
                                })}
                              {isSplit6 &&
                                partners.length >= 3 &&
                                partners.slice(0, 3).map((p: any) => (
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
                              {isHighLow && partners.length >= 4 && (
                                <>
                                  <VStack
                                    style={{
                                      width: 80,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        textAlign: "center",
                                        fontWeight: "700",
                                        fontSize: 11,
                                        color: "#38bdf8",
                                      }}
                                    >
                                      Team A
                                    </ThemedText>
                                  </VStack>
                                  <VStack
                                    style={{
                                      width: 80,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        textAlign: "center",
                                        fontWeight: "700",
                                        fontSize: 11,
                                        color: "#f43f5e",
                                      }}
                                    >
                                      Team B
                                    </ThemedText>
                                  </VStack>
                                </>
                              )}
                              {isNassau && partners.length >= 2 && (
                                <VStack
                                  style={{
                                    width: 100,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ThemedText
                                    style={{
                                      textAlign: "center",
                                      fontWeight: "700",
                                      fontSize: 11,
                                    }}
                                  >
                                    Nassau Pts
                                  </ThemedText>
                                </VStack>
                              )}
                            </HStack>

                            {/* Rows */}
                            {processedHoles.map((h: any, index: number) => {
                              let s6Pts: number[] = [];
                              if (isSplit6 && partners.length >= 3) {
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
                                      borderColor: isDark
                                        ? "#1e293b"
                                        : "#e5e7eb",
                                      backgroundColor: isDark
                                        ? "#020617"
                                        : "#ffffff",
                                    }}
                                  >
                                    <ThemedText
                                      style={{ width: 50, textAlign: "center" }}
                                    >
                                      {h.holeNumber}
                                    </ThemedText>
                                    {isDetailsVisible && (
                                      <>
                                        <ThemedText
                                          style={{
                                            width: 55,
                                            textAlign: "center",
                                          }}
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
                                      style={{
                                        width: 50,
                                        textAlign: "center",
                                      }}
                                    >
                                      {h.par}
                                    </ThemedText>

                                    {/* Score Input Columns (LHS) */}
                                    {partners.map((p: any, pIndex: number) => {
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
                                          pIndex <
                                          (partners.length >= 4 ? 2 : 1);
                                        if (winner === "teamA" && isTeamA)
                                          bgColor = "rgba(25, 135, 84, 0.15)";
                                        if (winner === "teamB" && !isTeamA)
                                          bgColor = "rgba(13, 110, 253, 0.15)";
                                      }

                                      return (
                                        <View
                                          key={`score-cell-${p.playerId}`}
                                          style={{
                                            width: pScoreWidth,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingVertical: 4,
                                            backgroundColor: bgColor,
                                          }}
                                        >
                                          <View
                                            style={{
                                              position: "relative",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            {renderScoreIndicator(
                                              info.score,
                                              h.par,
                                              isDark,
                                            )}
                                            <TextInput
                                              value={
                                                info.score !== null
                                                  ? String(info.score)
                                                  : ""
                                              }
                                              onChangeText={(val) =>
                                                handleMultiplayerScoreChange(
                                                  h.holeId,
                                                  p.playerId,
                                                  val,
                                                  index,
                                                  pIndex,
                                                )
                                              }
                                              onBlur={() => {
                                                if (focusTimeoutRef.current)
                                                  clearTimeout(
                                                    focusTimeoutRef.current,
                                                  );
                                              }}
                                              ref={(el: any) =>
                                                (inputRefs.current[
                                                  index * partners.length +
                                                    pIndex
                                                ] = el)
                                              }
                                              onSubmitEditing={() => {
                                                const nextIdx =
                                                  index * partners.length +
                                                  pIndex +
                                                  1;
                                                if (
                                                  nextIdx <
                                                  processedHoles.length *
                                                    partners.length
                                                ) {
                                                  inputRefs.current[
                                                    nextIdx
                                                  ]?.focus();
                                                }
                                              }}
                                              returnKeyType={
                                                index ===
                                                  processedHoles.length - 1 &&
                                                pIndex === partners.length - 1
                                                  ? "done"
                                                  : "next"
                                              }
                                              keyboardType="numeric"
                                              style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: borderDisplay
                                                  ? 8
                                                  : 0,
                                                borderWidth: borderDisplay
                                                  ? 1
                                                  : 0,
                                                borderColor: isDark
                                                  ? "#444"
                                                  : "#ccc",
                                                backgroundColor: "transparent",
                                                textAlign: "center",
                                                color: isDark ? "#fff" : "#000",
                                                fontWeight: "700",
                                                padding: 0,
                                              }}
                                            />
                                          </View>

                                          {getScoringLabel() !==
                                            "Net Score • Include Par 3" &&
                                            getScoringLabel() !==
                                              "Net Score • Exclude Par 3" &&
                                            getScoringLabel() !==
                                              "Stableford" &&
                                            getScoringLabel() !==
                                              "Stableford • Exclude Par 3" && (
                                              <HStack
                                                style={{
                                                  alignItems: "center",
                                                  gap: 4,
                                                  marginTop: 4,
                                                }}
                                              >
                                                <Pressable
                                                  onPress={() =>
                                                    handleSandyToggle(
                                                      h.holeId,
                                                      p.playerId,
                                                    )
                                                  }
                                                  style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    backgroundColor: info.sandy
                                                      ? "#2e7d32"
                                                      : isDark
                                                        ? "#334155"
                                                        : "#e2e8f0",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                  }}
                                                >
                                                  <Text
                                                    style={{
                                                      fontSize: 9,
                                                      fontWeight: "bold",
                                                      color: info.sandy
                                                        ? "#fff"
                                                        : isDark
                                                          ? "#94a3b8"
                                                          : "#64748b",
                                                    }}
                                                  >
                                                    S
                                                  </Text>
                                                </Pressable>

                                                {info.score !== null &&
                                                  getScoringLabel() !==
                                                    "Net Score • Include Par 3" &&
                                                  getScoringLabel() !==
                                                    "Net Score • Exclude Par 3" &&
                                                  getScoringLabel() !==
                                                    "Stableford" &&
                                                  getScoringLabel() !==
                                                    "Stableford • Exclude Par 3" &&
                                                  (() => {
                                                    const badgeVal =
                                                      getBadgeMultiplier(
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
                                      );
                                    })}

                                    {/* Net Score Columns (RHS) */}
                                    {showNetColumns &&
                                      partners.map((p: any, pIndex: number) => {
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
                                            pIndex <
                                            (partners.length >= 4 ? 2 : 1);
                                          if (winner === "teamA" && isTeamA)
                                            bgColor = "rgba(25, 135, 84, 0.15)";
                                          if (winner === "teamB" && !isTeamA)
                                            bgColor =
                                              "rgba(13, 110, 253, 0.15)";
                                        }

                                        return (
                                          <View
                                            key={`net-cell-${p.playerId}`}
                                            style={{
                                              width: pNetWidth,
                                              alignItems: "center",
                                              justifyContent: "center",
                                              backgroundColor: bgColor,
                                            }}
                                          >
                                            <ThemedText
                                              style={{
                                                fontWeight: "bold",
                                                color: "#8BC34A",
                                                fontSize: 13,
                                              }}
                                            >
                                              {info.netScore ?? "-"}
                                            </ThemedText>
                                          </View>
                                        );
                                      })}

                                    {/* Stableford Points Columns (RHS) */}
                                    {isStableford &&
                                      partners.map((p: any, pIndex: number) => {
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
                                            pIndex <
                                            (partners.length >= 4 ? 2 : 1);
                                          if (winner === "teamA" && isTeamA)
                                            bgColor = "rgba(25, 135, 84, 0.15)";
                                          if (winner === "teamB" && !isTeamA)
                                            bgColor =
                                              "rgba(13, 110, 253, 0.15)";
                                        }

                                        return (
                                          <View
                                            key={`pts-cell-${p.playerId}`}
                                            style={{
                                              width: pPtsWidth,
                                              alignItems: "center",
                                              justifyContent: "center",
                                              backgroundColor: bgColor,
                                            }}
                                          >
                                            <ThemedText
                                              style={{
                                                fontWeight: "bold",
                                                color: "#f59e0b",
                                                fontSize: 13,
                                              }}
                                            >
                                              {info.stablefordPoints ?? "-"}
                                            </ThemedText>
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
                                        const pts = calculateSplitSixPoints(
                                          s1,
                                          s2,
                                          s3,
                                        );
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
                                          raw1 !== null &&
                                          raw2 !== null &&
                                          raw3 !== null;

                                        return partners
                                          .slice(0, 3)
                                          .map((p: any, idx: number) => (
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
                                    {isHighLow &&
                                      partners.length >= 4 &&
                                      (() => {
                                        const stats = getHighLowHoleStats(h);
                                        const allFilled = stats.isComplete;
                                        return (
                                          <>
                                            <View
                                              style={{
                                                width: 80,
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <ThemedText
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#38bdf8",
                                                  fontSize: 13,
                                                }}
                                              >
                                                {allFilled
                                                  ? stats.teamAMatchPts
                                                  : "-"}
                                              </ThemedText>
                                            </View>
                                            <View
                                              style={{
                                                width: 80,
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <ThemedText
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#f43f5e",
                                                  fontSize: 13,
                                                }}
                                              >
                                                {allFilled
                                                  ? stats.teamBMatchPts
                                                  : "-"}
                                              </ThemedText>
                                            </View>
                                          </>
                                        );
                                      })()}
                                    {isNassau &&
                                      partners.length >= 2 &&
                                      (() => {
                                        const hRes =
                                          ns?.holeResults[h.holeNumber];
                                        if (!hRes)
                                          return (
                                            <View style={{ width: 100 }} />
                                          );

                                        const renderHouse = (
                                          val: number,
                                          idx: number,
                                          arr: number[],
                                        ) => {
                                          let color = isDark ? "#fff" : "#000";
                                          if (val > 0) color = "#22c55e"; // green
                                          if (val < 0) color = "#3b82f6"; // blue
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
                                        };

                                        return (
                                          <View
                                            style={{
                                              width: 100,
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexDirection: "row",
                                              flexWrap: "wrap",
                                            }}
                                          >
                                            {hRes.overallHousesDisplay.map(
                                              (
                                                val: number,
                                                i: number,
                                                arr: number[],
                                              ) => renderHouse(val, i, arr),
                                            )}
                                            {(nassauStartingNine === "back"
                                              ? h.holeNumber <= 9
                                              : h.holeNumber >= 10) &&
                                              hRes.housesDisplay.length > 0 && (
                                                <Text
                                                  style={{
                                                    color: isDark
                                                      ? "#94a3b8"
                                                      : "#64748b",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  {" & "}
                                                </Text>
                                              )}
                                            {(nassauStartingNine === "back"
                                              ? h.holeNumber <= 9
                                              : h.holeNumber >= 10) &&
                                              hRes.housesDisplay.map(
                                                (
                                                  val: number,
                                                  i: number,
                                                  arr: number[],
                                                ) => renderHouse(val, i, arr),
                                              )}
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
                                          ? "#111827"
                                          : "#f8fafc",
                                        paddingVertical: 10,
                                        borderTopWidth: 1,
                                        borderColor: isDark
                                          ? "#1e293b"
                                          : "#e5e7eb",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          width: 50,
                                          fontWeight: "700",
                                          textAlign: "center",
                                        }}
                                      >
                                        {nassauStartingNine === "back"
                                          ? "B9"
                                          : "F9"}
                                      </ThemedText>
                                      {isDetailsVisible && (
                                        <>
                                          <ThemedText
                                            style={{
                                              width: 55,
                                              textAlign: "center",
                                            }}
                                          />
                                          <ThemedText
                                            style={{
                                              width: 60,
                                              textAlign: "center",
                                            }}
                                          >
                                            {frontTotals.yards}
                                          </ThemedText>
                                        </>
                                      )}
                                      <ThemedText
                                        style={{
                                          width: 50,
                                          textAlign: "center",
                                        }}
                                      >
                                        {frontTotals.par}
                                      </ThemedText>
                                      {/* Front 9 Gross Totals (LHS) */}
                                      {partners.map((p: any) => {
                                        const t = getPlayerTotals(
                                          processedFront9,
                                          p,
                                        );
                                        return (
                                          <VStack
                                            key={`gross-front-${p.playerId}`}
                                            style={{
                                              width: pScoreWidth,
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                fontWeight: "800",
                                                color: isDark ? "#fff" : "#000",
                                              }}
                                            >
                                              {t.gross}
                                            </Text>
                                          </VStack>
                                        );
                                      })}

                                      {/* Front 9 Net Totals (RHS) */}
                                      {showNetColumns &&
                                        partners.map((p: any) => {
                                          const t = getPlayerTotals(
                                            processedFront9,
                                            p,
                                          );
                                          return (
                                            <VStack
                                              key={`net-front-${p.playerId}`}
                                              style={{
                                                width: pNetWidth,
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: "800",
                                                  color: "#8BC34A",
                                                }}
                                              >
                                                {t.net}
                                              </Text>
                                            </VStack>
                                          );
                                        })}

                                      {/* Front 9 Stableford Totals (RHS) */}
                                      {isStableford &&
                                        partners.map((p: any) => {
                                          const t = getPlayerTotals(
                                            processedFront9,
                                            p,
                                          );
                                          return (
                                            <VStack
                                              key={`pts-front-${p.playerId}`}
                                              style={{
                                                width: pPtsWidth,
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: "800",
                                                  color: "#f59e0b",
                                                }}
                                              >
                                                {t.stableford}
                                              </Text>
                                            </VStack>
                                          );
                                        })}
                                      {isSplit6 &&
                                        partners.length >= 3 &&
                                        (() => {
                                          let f9Pts = [0, 0, 0];
                                          let hasAnyF9 = false;
                                          processedFront9.forEach((fh: any) => {
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
                                              const pts =
                                                calculateSplitSixPoints(
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
                                          return partners
                                            .slice(0, 3)
                                            .map((p: any, idx: number) => (
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
                                                    color: isDark
                                                      ? "#fff"
                                                      : "#000",
                                                  }}
                                                >
                                                  {hasAnyF9 ? f9Pts[idx] : "-"}
                                                </Text>
                                              </VStack>
                                            ));
                                        })()}
                                      {isHighLow &&
                                        partners.length >= 4 &&
                                        (() => {
                                          let f9A = 0,
                                            f9B = 0;
                                          let hasAny = false;
                                          processedFront9.forEach((fh: any) => {
                                            const st = getHighLowHoleStats(fh);
                                            if (st.isComplete) {
                                              f9A += st.teamAMatchPts;
                                              f9B += st.teamBMatchPts;
                                              hasAny = true;
                                            }
                                          });
                                          return (
                                            <>
                                              <VStack
                                                style={{
                                                  width: 80,
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: "700",
                                                    color: isDark
                                                      ? "#fff"
                                                      : "#000",
                                                  }}
                                                >
                                                  {hasAny ? f9A : "-"}
                                                </Text>
                                              </VStack>
                                              <VStack
                                                style={{
                                                  width: 80,
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: "700",
                                                    color: isDark
                                                      ? "#fff"
                                                      : "#000",
                                                  }}
                                                >
                                                  {hasAny ? f9B : "-"}
                                                </Text>
                                              </VStack>
                                            </>
                                          );
                                        })()}
                                      {isNassau &&
                                        partners.length >= 2 &&
                                        ns && (
                                          <VStack
                                            style={{
                                              width: 100,
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexDirection: "row",
                                              flexWrap: "wrap",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: isDark ? "#fff" : "#000",
                                                fontWeight: "bold",
                                                fontSize: 11,
                                              }}
                                            >
                                              {formatNassauHouses(
                                                nassauStartingNine === "back"
                                                  ? ns.back9Houses
                                                  : ns.front9Houses,
                                              )}
                                            </Text>
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
                                          ? "#111827"
                                          : "#f8fafc",
                                        paddingVertical: 10,
                                        borderTopWidth: 1,
                                        borderColor: isDark
                                          ? "#1e293b"
                                          : "#e5e7eb",
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          width: 50,
                                          fontWeight: "700",
                                          textAlign: "center",
                                        }}
                                      >
                                        {nassauStartingNine === "back"
                                          ? "F9"
                                          : "B9"}
                                      </ThemedText>
                                      {isDetailsVisible && (
                                        <>
                                          <ThemedText
                                            style={{
                                              width: 55,
                                              textAlign: "center",
                                            }}
                                          />
                                          <ThemedText
                                            style={{
                                              width: 60,
                                              textAlign: "center",
                                            }}
                                          >
                                            {backTotals.yards}
                                          </ThemedText>
                                        </>
                                      )}
                                      <ThemedText
                                        style={{
                                          width: 50,
                                          textAlign: "center",
                                        }}
                                      >
                                        {backTotals.par}
                                      </ThemedText>
                                      {/* Back 9 Gross Totals (LHS) */}
                                      {partners.map((p: any) => {
                                        const t = getPlayerTotals(
                                          processedBack9,
                                          p,
                                        );
                                        return (
                                          <VStack
                                            key={`gross-back-${p.playerId}`}
                                            style={{
                                              width: pScoreWidth,
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                fontWeight: "700",
                                                color: isDark ? "#fff" : "#000",
                                              }}
                                            >
                                              {t.gross}
                                            </Text>
                                          </VStack>
                                        );
                                      })}

                                      {/* Back 9 Net Totals (RHS) */}
                                      {showNetColumns &&
                                        partners.map((p: any) => {
                                          const t = getPlayerTotals(
                                            processedBack9,
                                            p,
                                          );
                                          return (
                                            <VStack
                                              key={`net-back-${p.playerId}`}
                                              style={{
                                                width: pNetWidth,
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: "700",
                                                  color: "#8BC34A",
                                                }}
                                              >
                                                {t.net}
                                              </Text>
                                            </VStack>
                                          );
                                        })}

                                      {/* Back 9 Stableford Totals (RHS) */}
                                      {isStableford &&
                                        partners.map((p: any) => {
                                          const t = getPlayerTotals(
                                            processedBack9,
                                            p,
                                          );
                                          return (
                                            <VStack
                                              key={`pts-back-${p.playerId}`}
                                              style={{
                                                width: pPtsWidth,
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: "700",
                                                  color: "#f59e0b",
                                                }}
                                              >
                                                {t.stableford}
                                              </Text>
                                            </VStack>
                                          );
                                        })}
                                      {isSplit6 &&
                                        partners.length >= 3 &&
                                        (() => {
                                          let b9Pts = [0, 0, 0];
                                          let hasAnyB9 = false;
                                          processedBack9.forEach((bh: any) => {
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
                                              const pts =
                                                calculateSplitSixPoints(
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
                                          return partners
                                            .slice(0, 3)
                                            .map((p: any, idx: number) => (
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
                                                    color: isDark
                                                      ? "#fff"
                                                      : "#000",
                                                  }}
                                                >
                                                  {hasAnyB9 ? b9Pts[idx] : "-"}
                                                </Text>
                                              </VStack>
                                            ));
                                        })()}
                                      {isHighLow &&
                                        partners.length >= 4 &&
                                        (() => {
                                          let b9A = 0,
                                            b9B = 0;
                                          let hasAny = false;
                                          processedBack9.forEach((bh: any) => {
                                            const st = getHighLowHoleStats(bh);
                                            if (st.isComplete) {
                                              b9A += st.teamAMatchPts;
                                              b9B += st.teamBMatchPts;
                                              hasAny = true;
                                            }
                                          });
                                          return (
                                            <>
                                              <VStack
                                                style={{
                                                  width: 80,
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: "700",
                                                    color: isDark
                                                      ? "#fff"
                                                      : "#000",
                                                  }}
                                                >
                                                  {hasAny ? b9A : "-"}
                                                </Text>
                                              </VStack>
                                              <VStack
                                                style={{
                                                  width: 80,
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: "700",
                                                    color: isDark
                                                      ? "#fff"
                                                      : "#000",
                                                  }}
                                                >
                                                  {hasAny ? b9B : "-"}
                                                </Text>
                                              </VStack>
                                            </>
                                          );
                                        })()}
                                      {isNassau &&
                                        partners.length >= 2 &&
                                        ns && (
                                          <VStack
                                            style={{
                                              width: 100,
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexDirection: "row",
                                              flexWrap: "wrap",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: isDark ? "#fff" : "#000",
                                                fontWeight: "bold",
                                                fontSize: 11,
                                              }}
                                            >
                                              {formatNassauHouses(
                                                nassauStartingNine === "back"
                                                  ? ns.front9Houses
                                                  : ns.back9Houses,
                                              )}
                                            </Text>
                                          </VStack>
                                        )}
                                    </HStack>
                                  )}
                                </View>
                              );
                            })}
                            {/* GRAND TOTAL ROW */}
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
                                    {grandTotals.yards}
                                  </ThemedText>
                                </>
                              )}
                              <ThemedText
                                style={{
                                  width: 50,
                                  textAlign: "center",
                                  color: "#fff",
                                }}
                              >
                                {grandTotals.par}
                              </ThemedText>
                              {/* Grand Gross Totals (LHS) */}
                              {partners.map((p: any) => {
                                const t = getPlayerTotals(processedHoles, p);
                                return (
                                  <VStack
                                    key={`gross-grand-${p.playerId}`}
                                    style={{
                                      width: pScoreWidth,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 13,
                                        fontWeight: "800",
                                        color: "#fff",
                                      }}
                                    >
                                      {t.gross}
                                    </Text>
                                  </VStack>
                                );
                              })}

                              {/* Grand Net Totals (RHS) */}
                              {showNetColumns &&
                                partners.map((p: any) => {
                                  const t = getPlayerTotals(processedHoles, p);
                                  return (
                                    <VStack
                                      key={`net-grand-${p.playerId}`}
                                      style={{
                                        width: pNetWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 13,
                                          fontWeight: "800",
                                          color: "#fff",
                                        }}
                                      >
                                        {t.net}
                                      </Text>
                                    </VStack>
                                  );
                                })}

                              {/* Grand Stableford Totals (RHS) */}
                              {isStableford &&
                                partners.map((p: any) => {
                                  const t = getPlayerTotals(processedHoles, p);
                                  return (
                                    <VStack
                                      key={`pts-grand-${p.playerId}`}
                                      style={{
                                        width: pPtsWidth,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 13,
                                          fontWeight: "800",
                                          color: "#fff",
                                        }}
                                      >
                                        {t.stableford}
                                      </Text>
                                    </VStack>
                                  );
                                })}
                              {isSplit6 &&
                                partners.length >= 3 &&
                                (() => {
                                  let totalPts = [0, 0, 0];
                                  let hasAnyTotal = false;
                                  processedHoles.forEach((th: any) => {
                                    const raw1 = getPlayerHoleInfo(
                                      th,
                                      partners[0],
                                    ).score;
                                    const raw2 = getPlayerHoleInfo(
                                      th,
                                      partners[1],
                                    ).score;
                                    const raw3 = getPlayerHoleInfo(
                                      th,
                                      partners[2],
                                    ).score;
                                    if (
                                      raw1 !== null &&
                                      raw2 !== null &&
                                      raw3 !== null
                                    ) {
                                      const s1 = getPlayerHoleInfo(
                                        th,
                                        partners[0],
                                      ).score;
                                      const s2 = getPlayerHoleInfo(
                                        th,
                                        partners[1],
                                      ).score;
                                      const s3 = getPlayerHoleInfo(
                                        th,
                                        partners[2],
                                      ).score;
                                      const pts = calculateSplitSixPoints(
                                        s1,
                                        s2,
                                        s3,
                                      );
                                      totalPts[0] += pts[0];
                                      totalPts[1] += pts[1];
                                      totalPts[2] += pts[2];
                                      hasAnyTotal = true;
                                    }
                                  });
                                  return partners
                                    .slice(0, 3)
                                    .map((p: any, idx: number) => (
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
                              {isHighLow &&
                                partners.length >= 4 &&
                                (() => {
                                  let totalA = 0,
                                    totalB = 0;
                                  let hasAny = false;
                                  processedHoles.forEach((th: any) => {
                                    const st = getHighLowHoleStats(th);
                                    if (st.isComplete) {
                                      totalA += st.teamAMatchPts;
                                      totalB += st.teamBMatchPts;
                                      hasAny = true;
                                    }
                                  });
                                  return (
                                    <>
                                      <VStack
                                        style={{
                                          width: 80,
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
                                          {hasAny ? totalA : "-"}
                                        </Text>
                                      </VStack>
                                      <VStack
                                        style={{
                                          width: 80,
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
                                          {hasAny ? totalB : "-"}
                                        </Text>
                                      </VStack>
                                    </>
                                  );
                                })()}
                              {isNassau && partners.length >= 2 && ns && (
                                <VStack
                                  style={{
                                    width: 100,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "#fff",
                                      fontWeight: "800",
                                      fontSize: 11,
                                    }}
                                  >
                                    {formatNassauHouses(ns.overallHouses)}
                                  </Text>
                                </VStack>
                              )}
                            </HStack>
                          </VStack>
                        </ScrollView>
                      );
                    })()
                  )}

                  {/*  GRAND TOTAL FOR SINGLE PLAYER */}
                  {partners.length < 2 && (
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

                      {isDetailsVisible && (
                        <>
                          <ThemedText
                            style={{
                              flex: 1,
                              textAlign: "center",
                              color: "#fff",
                            }}
                          >
                            {grandTotals.strokeIndex}
                          </ThemedText>
                          <ThemedText
                            style={{
                              flex: 1,
                              textAlign: "center",
                              color: "#fff",
                            }}
                          >
                            {grandTotals.yards}
                          </ThemedText>
                        </>
                      )}

                      <ThemedText
                        style={{
                          flex: 1,
                          textAlign: "center",
                          color: "#fff",
                        }}
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
                      {showNetColumns && (
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
                      )}

                      {isStableford && (
                        <ThemedText
                          style={{
                            flex: 1,
                            textAlign: "center",
                            color: "#fff",
                          }}
                        >
                          {Number(grandTotals.stableford)}
                        </ThemedText>
                      )}
                    </HStack>
                  )}

                  {/* 🔹 SUMMARY TABLES FOR SIDE GAMES */}
                  {partners.length >= 2 &&
                    (isSplit6 || isHighLow || isNassau) && (
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
                        }}
                      >
                        {/* ── SPLIT SIX SUMMARY ── */}
                        {isSplit6 &&
                          partners.length >= 3 &&
                          (() => {
                            const allData = processedHoles.map((h: any) => {
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
                            const hasBack = processedHoles.some(
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
                                      color: bold ? "#84cc16" : undefined,
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
                            const allData = processedHoles.map((h: any) => {
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
                            const hasBack = processedHoles.some(
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
                                    color: bold ? "#84cc16" : "#38bdf8",
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
                                    color: bold ? "#84cc16" : "#f43f5e",
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
                                      color: "#38bdf8",
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
                                      color: "#f43f5e",
                                    }}
                                  >
                                    Team B
                                  </ThemedText>
                                </HStack>
                                {/* <Row
                                  label="Front 9"
                                  a={s.front9MatchPts.teamA}
                                  b={s.front9MatchPts.teamB}
                                />
                                <Row
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
                                          ? "#38bdf8"
                                          : s.finalScore.teamB >
                                              s.finalScore.teamA
                                            ? "#f43f5e"
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
                            const allData = processedHoles.map((h: any) => {
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
                                teamARawScores: teamAInfos.map(
                                  (i: any) => i.score,
                                ),
                                teamBRawScores: teamBInfos.map(
                                  (i: any) => i.score,
                                ),
                                teamASandys: teamAInfos.map(
                                  (i: any) => i.sandy,
                                ),
                                teamBSandys: teamBInfos.map(
                                  (i: any) => i.sandy,
                                ),
                              };
                            });
                            const ns = computeNassauState(
                              mode as "best" | "combined",
                              allData,
                            );
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
                                    color: "#38bdf8",
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
                                    color: "#f43f5e",
                                  }}
                                >
                                  {b}
                                </ThemedText>
                                {/* <ThemedText
                                  style={{
                                    fontSize: 12,
                                    fontWeight: bold ? "700" : "500",
                                    width: 40,
                                    textAlign: "center",
                                    color: "#a855f7",
                                  }}
                                >
                                  {typeof a === "number" &&
                                  typeof b === "number"
                                    ? a - b > 0
                                      ? `A+${a - b}`
                                      : b - a > 0
                                        ? `B+${b - a}`
                                        : "0"
                                    : "-"}
                                </ThemedText> */}
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
                                      color: "#38bdf8",
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
                                      color: "#f43f5e",
                                    }}
                                  >
                                    Team B
                                  </ThemedText>
                                  {/* <ThemedText
                                    style={{
                                      fontWeight: "700",
                                      fontSize: 11,
                                      width: 40,
                                      textAlign: "center",
                                      color: "#a855f7",
                                    }}
                                  >
                                    Pts
                                  </ThemedText> */}
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
                                    // borderTopWidth: 0.5,
                                    // borderColor: isDark ? "#444" : "#ddd",
                                    paddingTop: 10,
                                    alignItems: "center",
                                    marginTop: 3,
                                  }}
                                >
                                  <HStack
                                    style={{
                                      alignItems: "center",
                                      borderBottomWidth: 0.5,
                                      borderColor: isDark ? "#333" : "#e5e5e5",
                                      paddingVertical: 8,
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        color: isDark ? "#e2e8f0" : "#334155",
                                        flex: 1,
                                        fontSize: 12,
                                        fontWeight: "700",
                                        textAlign: "center",
                                      }}
                                    >
                                      Final Result
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        color: isDark ? "#e2e8f0" : "#334155",
                                        fontSize: 12,
                                        fontWeight: "700",
                                      }}
                                    >
                                      Match -{" "}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        color: "#059669",
                                        fontSize: 12,
                                        fontWeight: "800",
                                      }}
                                    >
                                      {formatNassauHousesSpaced(
                                        ns.overallHouses,
                                      )}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        color: isDark ? "#e2e8f0" : "#334155",
                                        fontSize: 12,
                                        fontWeight: "700",
                                      }}
                                    >
                                      {"  &  Half - "}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        color: "#059669",
                                        fontSize: 12,
                                        fontWeight: "800",
                                      }}
                                    >
                                      {[
                                        ns.front9Halfs.team1,
                                        ns.front9Halfs.team2,
                                        ns.back9Halfs.team1,
                                        ns.back9Halfs.team2,
                                      ].join(" ")}
                                    </ThemedText>
                                  </HStack>
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
                                          ? "#38bdf8"
                                          : ns.finalResult < 0
                                            ? "#f43f5e"
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
                                      width: 70,
                                      fontWeight: "700",
                                      fontSize: 11,
                                      textAlign: "center",
                                    }}
                                  >
                                    Winner
                                  </ThemedText>
                                  <ThemedText
                                    style={{
                                      flex: 1,
                                      fontWeight: "700",
                                      fontSize: 11,
                                      textAlign: "center",
                                    }}
                                  >
                                    Houses
                                  </ThemedText>
                                </HStack>
                                {processedHoles.map((h: any) => {
                                  const hr = ns.holeResults[h.holeNumber];
                                  if (!hr) return null;
                                  const winColor =
                                    hr.winner === "teamA"
                                      ? "#22c55e"
                                      : hr.winner === "teamB"
                                        ? "#3b82f6"
                                        : isDark
                                          ? "#666"
                                          : "#999";
                                  const winLabel =
                                    hr.winner === "teamA"
                                      ? "Team A"
                                      : hr.winner === "teamB"
                                        ? "Team B"
                                        : "Tie";
                                  return (
                                    <HStack
                                      key={h.holeNumber}
                                      style={{
                                        paddingVertical: 6,
                                        borderBottomWidth: 0.5,
                                        borderColor: isDark ? "#222" : "#eee",
                                        alignItems: "center",
                                        backgroundColor: hr.winner === "teamA" ? "rgba(34, 197, 94, 0.05)" : hr.winner === "teamB" ? "rgba(59, 130, 246, 0.05)" : "transparent"
                                      }}
                                    >
                                      <ThemedText
                                        style={{
                                          width: 40,
                                          textAlign: "center",
                                          fontSize: 12,
                                        }}
                                      >
                                        {h.holeNumber}
                                      </ThemedText>
                                      <Text
                                        style={{
                                          width: 70,
                                          textAlign: "center",
                                          fontSize: 11,
                                          fontWeight: "600",
                                          color: winColor,
                                        }}
                                      >
                                        {winLabel}
                                      </Text>
                                      <HStack
                                        style={{
                                          flex: 1,
                                          justifyContent: "center",
                                          gap: 4,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        {hr.housesDisplay.map(
                                          (hv: number, hi: number) => {
                                            const bgColor =
                                              hv > 0
                                                ? "#22c55e"
                                                : hv < 0
                                                  ? "#3b82f6"
                                                  : "#06b6d4";
                                            return (
                                              <View
                                                key={hi}
                                                style={{
                                                  backgroundColor: bgColor,
                                                  borderRadius: 4,
                                                  paddingHorizontal: 6,
                                                  paddingVertical: 2,
                                                  minWidth: 22,
                                                  alignItems: "center",
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: "#fff",
                                                    fontSize: 10,
                                                    fontWeight: "700",
                                                  }}
                                                >
                                                  {Math.abs(hv)}
                                                </Text>
                                              </View>
                                            );
                                          },
                                        )}
                                      </HStack>
                                    </HStack>
                                  );
                                })} */}
                              </>
                            );
                          })()}
                      </VStack>
                    )}

                  <Pressable
                    onPress={() => setVisible(true)}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#8BC34A",
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#fff"
                    />

                    <ThemedText
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      Finish Round
                    </ThemedText>
                  </Pressable>

                  {/* Scorecard legend */}
                  <VStack
                    style={{
                      marginTop: 25,
                      padding: 16,
                      borderRadius: 14,
                      borderWidth: 1,
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                      borderColor: isDark ? "#1e293b" : "#e2e8f0",
                    }}
                  >
                    <ThemedText
                      style={{
                        textAlign: "left",
                        fontWeight: "700",
                        fontSize: 14,
                        marginBottom: 16,
                      }}
                    >
                      Scorecard Legend
                    </ThemedText>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* 🟡 Hole-in-One */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleCircle,
                            {
                              borderColor: "#fbc02d",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.holeInOne > 0
                              ? legendCounts.holeInOne
                              : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>
                          Hole-in-One
                        </ThemedText>
                      </View>

                      {/* 🔵 Albatross */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleCircle,
                            {
                              borderColor: "#00838f",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.albatross > 0
                              ? legendCounts.albatross
                              : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>
                          Albatross
                        </ThemedText>
                      </View>

                      {/* 🟢 Eagle */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleCircle,
                            {
                              borderColor: "#2e7d32",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.eagle > 0 ? legendCounts.eagle : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>Eagle</ThemedText>
                      </View>

                      {/* 🟢 Birdie */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleCircle,
                            {
                              borderColor: "#66bb6a",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.birdie > 0 ? legendCounts.birdie : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>
                          Birdie
                        </ThemedText>
                      </View>

                      {/* ⚪ Par (dashed square) */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderWidth: 1,
                            borderStyle: "dashed",
                            borderColor: "#999",
                            borderRadius: 4,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.par > 0 ? legendCounts.par : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>Par</ThemedText>
                      </View>

                      {/* 🔴 Bogey */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleSquare,
                            {
                              borderColor: "#e53935",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.bogey > 0 ? legendCounts.bogey : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>Bogey</ThemedText>
                      </View>

                      {/* 🔴 Double Bogey */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.doubleSquare,
                            {
                              borderColor: "#e53935",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.innerSquare,
                              {
                                borderColor: "#e53935",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <ThemedText style={{ textAlign: "center" }}>
                              {legendCounts.double > 0
                                ? legendCounts.double
                                : ""}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.legendText}>
                          Double Bogey
                        </ThemedText>
                      </View>

                      {/* 🟣 Triple Bogey */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.doubleSquare,
                            {
                              borderColor: "#8e24aa",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.innerSquare,
                              {
                                borderColor: "#8e24aa",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <ThemedText style={{ textAlign: "center" }}>
                              {legendCounts.triple > 0
                                ? legendCounts.triple
                                : ""}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.legendText}>
                          Triple Bogey
                        </ThemedText>
                      </View>

                      {/* ⬛ Quadruple+ */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleSquare,
                            {
                              borderColor: isDark ? "#fff" : "#000",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <ThemedText style={{ textAlign: "center" }}>
                            {legendCounts.quadPlus > 0
                              ? legendCounts.quadPlus
                              : ""}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.legendText}>
                          Quadruple Bogey+
                        </ThemedText>
                      </View>
                    </View>
                  </VStack>
                </>
              )}
            </VStack>
          </VStack>
        </ScrollView>
      </View>

      {/* modal */}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
            ]}
          >
            {/* Heading */}
            <Text style={[styles.heading, { color: isDark ? "#fff" : "#000" }]}>
              Finish Round
            </Text>

            {/* Content */}
            <Text style={[styles.content, { color: isDark ? "#ccc" : "#555" }]}>
              Are you sure you want to finish this round? Once submitted, you
              cannot edit your scores.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? "#333" : "#e5e5e5",
                  },
                ]}
                onPress={() => setVisible(false)}
              >
                <Text style={{ color: isDark ? "#fff" : "#000" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  handleFinishRound();
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    borderRadius: 12,
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  content: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmBtn: {
    backgroundColor: "#8BC34A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  indicatorContainer: {
    position: "absolute",
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    pointerEvents: "none",
  },

  doubleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderRadius: 17,
    borderWidth: 2,
  },

  singleSquare: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderRadius: 4,
  },

  doubleSquare: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  innerSquare: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
  },
  tripleSquareOuter: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareMid: {
    width: 28,
    height: 28,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareInner: {
    width: 20,
    height: 20,
    borderRadius: 2,
    borderWidth: 1.5,
  },
  legendItemStyle: {
    width: "48%",
    alignItems: "center",
    marginBottom: 18,
  },
  legendText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
});
