// strokeIndex
import { getScoreCardDetails } from "@/api/modules/newRound.api";
import {
  saveScoreCard,
  getSubScorecardHandicap,
} from "@/api/modules/scoreCard.api";
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
  } = useLocalSearchParams();

  const [pendingRoundContext, setPendingRoundContext] = useState<any>(null);

  useEffect(() => {
    console.log("forceNew", forceNew);
    console.log("selectedScore", selectedScore);
    console.log("roundContextId", roundContextId);

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
    if (!isExcluded && !isStableford && !isSplit6 && !isHighLow && !isGross && !isNassau)
      return "Net Score • Include Par 3";
    if (isExcluded && isStableford) return "Stableford • Exclude Par 3";
    if (isGross && !isExcluded && !isStableford && !isSplit6 && !isHighLow && !isNassau)
      return "Gross Score";
    if (!isExcluded && !isStableford && isSplit6 && !isHighLow)
      return "Net Score • Split 6";
    if (!isExcluded && !isStableford && !isSplit6 && isHighLow)
      return "Net Score • High-Low";
    if (isNassauBest) return "Nassau • Best Score";
    if (isNassauCombined) return "Nassau • Combined Score";
    return "";
  };

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

  const calculateStrokes = (playerHandicap: number, strokeIndex: number) => {
    const base = Math.floor(playerHandicap / 18);
    const remainder = playerHandicap % 18;

    return base + (strokeIndex <= remainder ? 1 : 0);
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
      Number(handicap), // from params
      hole.handicap, // stroke index
    );

    // Excluded logic
    if (isExcluded && hole.par === 3) {
      strokesReceived = 0;
    }

    const netScore = score - strokesReceived;

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

    const playerHandicap = isPrimary
      ? Number(handicap || 0)
      : companionHandicaps[userId] || 0;
    let strokesReceived = calculateStrokes(playerHandicap, hole.handicap);
    if (isExcluded && hole.par === 3) {
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

  const processedAllHoles = scoreCardDetails.map(calculateHole);

  const processedFront9 = processedAllHoles.filter(
    (h: any) => h.holeNumber <= 9,
  );
  const processedBack9 = processedAllHoles.filter(
    (h: any) => h.holeNumber >= 10,
  );
  const legendCounts = getScoreLegendCounts(processedAllHoles);

  const getTotals = (holes: any[]) => ({
    strokeIndex: "",
    yards: holes.reduce((sum, h) => sum + (h.yardage || 0), 0),
    par: holes.reduce((sum, h) => sum + (h.par || 0), 0),
    score: holes.reduce((sum, h) => sum + (Number(h.score) || 0), 0),
    // net: holes.reduce((sum, h) => sum + (Number(h.netScore) || 0), 0),
    stableford: holes.reduce(
      (sum, h) => sum + (Number(h.stablefordPoints) || 0),
      0,
    ),
  });

  const frontTotals = getTotals(processedFront9);
  const backTotals = getTotals(processedBack9);

  const processedHoles = processedAllHoles.filter((h: any) => {
    if (holes === "18") return true;
    if (holes === "front9") return h.holeNumber <= 9;
    if (holes === "back9") return h.holeNumber >= 10;
    return true;
  });

  const grandTotals = getTotals(processedHoles);

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
              holes === "front9"
                ? "Front9"
                : holes === "back9"
                  ? "Back9"
                  : null,
            holeId: h.holeId,
            isCompleted: isCompleted,
            isExcluded: isExcluded,
            matchScoringType: isSplit6 ? "split-six" : isHighLow ? "high-low" : isNassauBest ? "nassau-best" : isNassauCombined ? "nassau-combined" : null,
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
        console.log("saveRound payload", payload);

        await saveScoreCard(payload);

        if (isCompleted) {
          Toast.show({
            type: "success",
            text1: "Round Finished",
            text2: "Score submitted successfully",
          });
        }

        if (shouldGoBack) {
          if (isCompleted) {
            setScoreCardDetails([]); // Clear inputs for fresh start
          }
          routePage.push("/(drawer)/(user)/(tabs)/dashboard");
        }
      } catch (error) {
        console.log("Error saving round:", error);
      }
    },
    [courseId, isExcluded, teeBoxId, userId, routePage],
  );

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          saveRound(false, false);
        }
      },
    );

    const beforeRemoveListener = navigation.addListener("beforeRemove", () => {
      saveRound(false, false);
    });

    return () => {
      appStateListener.remove();
      beforeRemoveListener();
    };
  }, [saveRound, navigation]);

  const handleFinishRound = async () => {
    await saveRound(true, true);
  };

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
          holes === "front9" ? "Front9" : holes === "back9" ? "Back9" : null,
        holeId: h.holeId,
        isCompleted: false,
        isExcluded: isExcluded,
        matchScoringType: isSplit6 ? "split-six" : isHighLow ? "high-low" : isNassauBest ? "nassau-best" : isNassauCombined ? "nassau-combined" : null,
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
        ...(playingGroupRoundKey
          ? { playingGroupRoundKey, PlayingGroupRoundKey: playingGroupRoundKey }
          : {}),
        ...(playingPartnersJson
          ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson }
          : {}),
      }));
      console.log("Auto-saving payload:", payload);
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
      net: hasAnyScore ? net : "-",
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
        }, 3000);
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

  const calculateHighLowPoints = (
    s1: number | null,
    s2: number | null,
    s3: number | null,
    s4: number | null,
  ) => {
    if (s1 === null || s2 === null || s3 === null || s4 === null) {
      return { teamAPoints: 0, teamBPoints: 0 };
    }

    const p1 = { team: "A", score: s1 };
    const p2 = { team: "A", score: s2 };
    const p3 = { team: "B", score: s3 };
    const p4 = { team: "B", score: s4 };

    const allPlayers = [p1, p2, p3, p4];

    // 1. Low Score (2 points)
    const minScore = Math.min(s1, s2, s3, s4);
    const lowPlayers = allPlayers.filter((p) => p.score === minScore);
    const lowTeams = new Set(lowPlayers.map((p) => p.team));

    let teamALowPts = 0;
    let teamBLowPts = 0;
    if (lowTeams.size === 1) {
      if (lowTeams.has("A")) teamALowPts = 2;
      else teamBLowPts = 2;
    }

    // 2. High Score (1 point)
    const remainingPlayers = allPlayers.filter((p) => p.score > minScore);
    let teamAHighPts = 0;
    let teamBHighPts = 0;

    if (remainingPlayers.length > 0) {
      const nextMinScore = Math.min(...remainingPlayers.map((p) => p.score));
      const nextPlayers = remainingPlayers.filter(
        (p) => p.score === nextMinScore,
      );
      const nextTeams = new Set(nextPlayers.map((p) => p.team));
      if (nextTeams.size === 1) {
        if (nextTeams.has("A")) teamAHighPts = 1;
        else teamBHighPts = 1;
      }
    }

    return {
      teamAPoints: teamALowPts + teamAHighPts,
      teamBPoints: teamBLowPts + teamBHighPts,
    };
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

  const handleScoreChange = (holeId: number, value: string, index: number) => {
    if (partners.length >= 2) {
      handleMultiplayerScoreChange(holeId, "p1", value);
    } else {
      // allow empty
      if (value === "") {
        setScoreCardDetails((prev: any[]) =>
          prev.map((hole) =>
            hole.holeId === holeId ? { ...hole, score: "" } : hole,
          ),
        );
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
        setScoreCardDetails((prev: any[]) =>
          prev.map((hole) =>
            hole.holeId === holeId ? { ...hole, score: "" } : hole,
          ),
        );
        return;
      }

      // ✅ store STRING (IMPORTANT)
      const updatedDetails = scoreCardDetails.map((hole: any) =>
        hole.holeId === holeId ? { ...hole, score: value } : hole,
      );
      setScoreCardDetails(updatedDetails);

      triggerAutoSave(updatedDetails);
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
      }, 3000);
    }
  };

  const renderScoreIndicator = (
    score: number | string | null,
    par: number,
    isDark: boolean,
  ) => {
    if (score === null || score === "" || score === undefined) return null;

    const numericScore = Number(score);
    const diff = numericScore - par;

    // 🟡 Hole-in-One (Priority 1)
    if (numericScore === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.singleCircle,
              {
                borderColor: "#fbc02d",
              },
            ]}
          />
        </View>
      );
    }

    // 🟦 Albatross (-3)
    if (diff <= -3) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.singleCircle,
              {
                borderColor: "#00838f",
              },
            ]}
          />
        </View>
      );
    }

    // 🟢 Eagle (-2)
    if (diff === -2) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.singleCircle,
              {
                borderColor: "#2e7d32",
              },
            ]}
          />
        </View>
      );
    }

    // 🟢 Birdie (-1)
    if (diff === -1) {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.singleCircle,
              {
                borderColor: "#66bb6a",
              },
            ]}
          />
        </View>
      );
    }

    // ⚪ Par (0) - Dashed square
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

    // ⬛ Quadruple+ (>= +4) - Check most specific bogey first
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

    // 🟣 Triple Bogey (+3)
    if (diff === 3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#8e24aa" }]}>
            <View style={[styles.innerSquare, { borderColor: "#8e24aa" }]} />
          </View>
        </View>
      );
    }

    // 🔴 Double Bogey (+2)
    if (diff === 2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#e53935" }]}>
            <View style={[styles.innerSquare, { borderColor: "#e53935" }]} />
          </View>
        </View>
      );
    }

    // 🔴 Bogey (+1)
    if (diff === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#e53935" }]} />
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
              onPress={() => routePage.back()}
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

            {/* ⚖️ SPACER */}
            <View style={{ width: 40 }} />
          </HStack>

          {/* 📌 META INFO ROW */}
          <HStack
            style={{
              marginTop: 8,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 📝 SCORING TYPE */}
            <ThemedText
              style={{
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
                flex: 1,
              }}
            >
              {getScoringLabel()}
            </ThemedText>

            {/* 🟢 HANDICAP BADGE */}
            <Box
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: "rgba(139,195,74,0.15)",
                borderWidth: 1,
                borderColor: "rgba(139,195,74,0.3)",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#2E7D32",
                }}
              >
                HC: {handicap ?? "N/A"}
              </ThemedText>
            </Box>
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
                        backgroundColor: "transparent",
                        borderRadius: 14,
                        overflow: "hidden",
                        shadowColor: "#000",
                        shadowOpacity: 0.12,
                        shadowRadius: 6,
                      }}
                    >
                      {/* 🔹 HEADER */}
                      <HStack
                        style={{
                          paddingVertical: 12,
                          backgroundColor: isDark
                            ? "rgba(38, 38, 38, 0.8)"
                            : "rgba(243, 244, 246, 0.8)",
                          borderBottomWidth: 1,
                          borderColor: isDark ? "#444" : "#ddd",
                        }}
                      >
                        {[
                          "Hole",
                          "Stroke\nIndex",
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
                              backgroundColor: isDark
                                ? "rgba(15, 23, 42, 0.7)"
                                : "rgba(255, 255, 255, 0.7)",
                              borderColor: isDark ? "#1e293b" : "#e2e8f0",
                            }}
                          >
                            <ThemedText
                              style={{ flex: 1, textAlign: "center" }}
                            >
                              {h.holeNumber}
                            </ThemedText>
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

                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#8BC34A",
                              }}
                            >
                              {h.netScore}
                            </ThemedText>

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
                                {frontTotals.strokeIndex}
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
                                {Number(frontTotals.score)}
                              </ThemedText>

                              {/* <ThemedText
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontWeight: "700",
                                }}
                              >
                                {frontTotals.net}
                              </ThemedText> */}

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
                                {backTotals.strokeIndex}
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

                              {/* <ThemedText
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontWeight: "700",
                                }}
                              >
                                {backTotals.net}
                              </ThemedText> */}

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
                      const colWidths = {
                        hole: 50,
                        si: 55,
                        yards: 60,
                        par: 50,
                        player: 95,
                      };
                      const totalWidth =
                        50 + 55 + 60 + 50 + partners.length * 95;
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
                              {partners.map((p: any, idx: number) => {
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
                            </HStack>

                            {/* Rows */}
                            {processedHoles.map((h: any, index: number) => {
                              let s6Pts: number[] = [];
                              if (isSplit6 && partners.length >= 3) {
                                const s1 = getPlayerHoleInfo(
                                  h,
                                  partners[0],
                                ).netScore;
                                const s2 = getPlayerHoleInfo(
                                  h,
                                  partners[1],
                                ).netScore;
                                const s3 = getPlayerHoleInfo(
                                  h,
                                  partners[2],
                                ).netScore;
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
                                        : "#e2e8f0",
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

                                    {partners.map((p: any, pIndex: number) => {
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

                                            {/* {isSplit6 && s6Pts.length > 0 && info.score !== null && (
                                              <Text style={{ fontSize: 9, color: '#84cc16', fontWeight: 'bold' }}>
                                                P:{s6Pts[pIndex]}
                                              </Text>
                                            )}

                                            {isHighLow && hlStats && info.score !== null && (
                                              <Text style={{ fontSize: 9, color: pIndex < 2 ? '#38bdf8' : '#f43f5e', fontWeight: 'bold' }}>
                                                N:{info.netScore}
                                              </Text>
                                            )} */}
                                            {/* const getScoringLabel = () => {
    if (isExcluded && !isStableford)
      return "Net Score • Exclude Par 3";
    if (!isExcluded && isStableford) return "Stableford";
    if (!isExcluded && !isStableford && !isSplit6 && !isHighLow && !isGross)
      return "Net Score • Include Par 3";
    if (isExcluded && isStableford)
      return "Stableford • Exclude Par 3";
    if (isGross && !isExcluded && !isStableford && !isSplit6 && !isHighLow)
      return "Gross Score";
    if (!isExcluded && !isStableford && isSplit6 && !isHighLow)
      return "Net Score • Split 6";
    if (!isExcluded && !isStableford && !isSplit6 && isHighLow)
      return "Net Score • High-Low";
    return "";
  }; */}
                                            {info.score !== null &&
                                              getScoringLabel() !== "Net Score • Include Par 3" &&
                                              getScoringLabel() !== "Net Score • Exclude Par 3" &&
                                              getScoringLabel() !== "Stableford" &&
                                              getScoringLabel() !== "Stableford • Exclude Par 3" &&
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
                                        </View>
                                      );
                                    })}
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
                                      <ThemedText
                                        style={{
                                          width: 50,
                                          textAlign: "center",
                                        }}
                                      >
                                        {frontTotals.par}
                                      </ThemedText>
                                      {partners.map((p: any) => {
                                        const t = getPlayerTotals(
                                          processedFront9,
                                          p,
                                        );
                                        return (
                                          <VStack
                                            key={p.playerId}
                                            style={{
                                              width: 95,
                                              alignItems: "center",
                                            }}
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
                                                style={{
                                                  fontSize: 9,
                                                  color: "#f59e0b",
                                                }}
                                              >
                                                Pts:{t.stableford}
                                              </Text>
                                            ) : (
                                              <Text
                                                style={{
                                                  fontSize: 9,
                                                  color: "#84cc16",
                                                }}
                                              >
                                                Net:{t.net}
                                              </Text>
                                            )}
                                          </VStack>
                                        );
                                      })}
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
                                      <ThemedText
                                        style={{
                                          width: 50,
                                          textAlign: "center",
                                        }}
                                      >
                                        {backTotals.par}
                                      </ThemedText>
                                      {partners.map((p: any) => {
                                        const t = getPlayerTotals(
                                          processedBack9,
                                          p,
                                        );
                                        return (
                                          <VStack
                                            key={p.playerId}
                                            style={{
                                              width: 95,
                                              alignItems: "center",
                                            }}
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
                                                style={{
                                                  fontSize: 9,
                                                  color: "#f59e0b",
                                                }}
                                              >
                                                Pts:{t.stableford}
                                              </Text>
                                            ) : (
                                              <Text
                                                style={{
                                                  fontSize: 9,
                                                  color: "#84cc16",
                                                }}
                                              >
                                                Net:{t.net}
                                              </Text>
                                            )}
                                          </VStack>
                                        );
                                      })}
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
                              <ThemedText style={{ width: 55, textAlign: "center" }} />
                              <ThemedText
                                style={{
                                  width: 60,
                                  textAlign: "center",
                                  color: "#fff",
                                }}
                              >
                                {grandTotals.yards}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  width: 50,
                                  textAlign: "center",
                                  color: "#fff",
                                }}
                              >
                                {grandTotals.par}
                              </ThemedText>
                              {partners.map((p: any) => {
                                const t = getPlayerTotals(processedHoles, p);
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

                      <ThemedText
                        style={{ flex: 1, textAlign: "center", color: "#fff" }}
                      >
                        {grandTotals.strokeIndex}
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
                      }}
                    >
                      {isSplit6 && partners.length >= 3 && (
                        <>
                          <ThemedText
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              marginBottom: 12,
                            }}
                          >
                            Split Six (9-Points) Standings
                          </ThemedText>
                          {(() => {
                            const summary = getSplitSixSummary(processedHoles);
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
                                  <ThemedText
                                    style={{ fontWeight: "600", fontSize: 13 }}
                                  >
                                    Player
                                  </ThemedText>
                                  <ThemedText
                                    style={{ fontWeight: "600", fontSize: 13 }}
                                  >
                                    Total Points
                                  </ThemedText>
                                </HStack>
                                {partners
                                  .slice(0, 3)
                                  .map((p: any, idx: number) => {
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
                                            fontWeight: "bold",
                                            color: "#84cc16",
                                            fontSize: 13,
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
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              marginBottom: 12,
                            }}
                          >
                            High-Low / Summary
                          </ThemedText>
                          {(() => {
                            const summary = getHighLowSummary(processedHoles);
                            return (
                              <VStack style={{ gap: 12 }}>
                                {/* Team A */}
                                <VStack
                                  style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: isDark
                                      ? "rgba(30,41,59,0.5)"
                                      : "#f8fafc",
                                  }}
                                >
                                  <HStack
                                    style={{
                                      justifyContent: "space-between",
                                      marginBottom: 4,
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "bold",
                                        color: "#38bdf8",
                                        fontSize: 13,
                                      }}
                                    >
                                      Team A (
                                      {partners[0].isPrimary
                                        ? "You"
                                        : partners[0].name}{" "}
                                      & {partners[1].name})
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontWeight: "bold",
                                        fontSize: 13,
                                      }}
                                    >
                                      {summary.teamAPts} pts
                                    </ThemedText>
                                  </HStack>
                                  <HStack style={{ gap: 12 }}>
                                    <ThemedText
                                      style={{
                                        fontSize: 11,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                      }}
                                    >
                                      Match Points: {summary.teamAMatchPts}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontSize: 11,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                      }}
                                    >
                                      Sandys: {summary.teamASandys}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontSize: 11,
                                        color: "#38bdf8",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Normalized: {summary.teamANormalized} pts
                                    </ThemedText>
                                  </HStack>
                                </VStack>

                                {/* Team B */}
                                <VStack
                                  style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: isDark
                                      ? "rgba(30,41,59,0.5)"
                                      : "#f8fafc",
                                  }}
                                >
                                  <HStack
                                    style={{
                                      justifyContent: "space-between",
                                      marginBottom: 4,
                                    }}
                                  >
                                    <ThemedText
                                      style={{
                                        fontWeight: "bold",
                                        color: "#f43f5e",
                                        fontSize: 13,
                                      }}
                                    >
                                      Team B ({partners[2].name} &{" "}
                                      {partners[3].name})
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontWeight: "bold",
                                        fontSize: 13,
                                      }}
                                    >
                                      {summary.teamBPts} pts
                                    </ThemedText>
                                  </HStack>
                                  <HStack style={{ gap: 12 }}>
                                    <ThemedText
                                      style={{
                                        fontSize: 11,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                      }}
                                    >
                                      Match Points: {summary.teamBMatchPts}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontSize: 11,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                      }}
                                    >
                                      Sandys: {summary.teamBSandys}
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontSize: 11,
                                        color: "#f43f5e",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Normalized: {summary.teamBNormalized} pts
                                    </ThemedText>
                                  </HStack>
                                </VStack>

                                {/* Final Margin */}
                                <View
                                  style={{
                                    borderTopWidth: 0.5,
                                    borderColor: isDark ? "#444" : "#ddd",
                                    paddingTop: 8,
                                    alignItems: "center",
                                  }}
                                >
                                  <ThemedText
                                    style={{
                                      fontWeight: "bold",
                                      color: "#84cc16",
                                      fontSize: 13,
                                    }}
                                  >
                                    {summary.teamANormalized >
                                    summary.teamBNormalized
                                      ? `Team A wins by ${summary.teamANormalized} pts!`
                                      : summary.teamBNormalized >
                                          summary.teamANormalized
                                        ? `Team B wins by ${summary.teamBNormalized} pts!`
                                        : "The match is a tie!"}
                                  </ThemedText>
                                </View>
                              </VStack>
                            );
                          })()}
                        </>
                      )}
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
