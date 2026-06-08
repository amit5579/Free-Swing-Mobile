import {
  getScorecardDetails,
  ScorecardHole,
  finishScorecardApi,
  updateHoleScoresApi,
  updateScorecardApi,
  getInProgressGames,
} from "@/api/modules/dashboard.api";
import { getSubScorecardHandicap } from "@/api/modules/scoreCard.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  useColorScheme,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { ThemedText } from "@/components/themed-text";

export default function ResumeScorecard() {
  const { id, handicap: handicapParam } = useLocalSearchParams<{
    id: string;
    handicap: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const handicap = parseInt(handicapParam || "0");

  useLayoutEffect(() => {}, []);

  const [holes, setHoles] = useState<ScorecardHole[]>([]);
  const [textScores, setTextScores] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStableford, setIsStableford] = useState(false);
  const [displayFront, setDisplayFront] = useState(true);
  const [displayBack, setDisplayBack] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const textScoresRef = useRef<Record<number, string>>({});
  const holesRef = useRef<ScorecardHole[]>([]);
  const inputRefs = useRef<any[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `scorecard_draft_${id}`;

  const [partners, setPartners] = useState<any[]>([]);
  const [companionHandicaps, setCompanionHandicaps] = useState<Record<number, number>>({});
  const [isHighLow, setIsHighLow] = useState(false);
  const [isSplit6, setIsSplit6] = useState(false);
  const [isGross, setIsGross] = useState(false);
  const [isNassauBest, setIsNassauBest] = useState(false);
  const [isNassauCombined, setIsNassauCombined] = useState(false);
  const isNassau = isNassauBest || isNassauCombined;
  const [roundContextId, setRoundContextId] = useState<string | null>(null);


  // const renderScoringType =
  //   holes.length > 0
  //     ? holes[0].isDoublePeoria
  //       ? isStableford
  //         ? "Stableford"
  //         : "Double Peoria Net"
  //       : isStableford
  //         ? "Stableford"
  //         : holes[0].isExcluded
  //           ? "Net Score Exclude Par 3"
  //           : "Net Score Include Par 3"
  //     : "";

      const renderScoringType = (() => {
        if (isSplit6) return "Split Six";
        if (isHighLow) return "High - Low";
        if (isGross) return "Gross Score";
        if (isNassauBest) return "Nassau • Best Score";
        if (isNassauCombined) return "Nassau • Combined Score";
        if (holes.length > 0) {
          const showPts = holes.some(
            (h) => h.stablefordPoints !== null && h.stablefordPoints !== undefined,
          );
          if (showPts) return "Stableford";
          return holes[0].isExcluded ? "Net Score Exclude Par 3" : "Net Score Include Par 3";
        }
        return "";
      })();

  const saveToServer = async (holesToSave: ScorecardHole[]) => {
    const performSave = async () => {
      try {
        const playingGroupRoundKey = roundContextId ? String(roundContextId) : undefined;
        const playingPartnersJson = partners.length > 0 ? JSON.stringify(partners) : undefined;

        const payload = holesToSave.map((h) => ({
          userId: userId ? Number(userId) : h.userId || null,
          courseId: h.courseId || null,
          courseHalf: h.courseHalf || null,
          teeBoxId: h.teeBoxId || null,
          tournamentId: h.tournamentId || null,
          holeId: h.holeId,
          score: h.score === undefined || h.score === null ? null : h.score,
          stablefordPoints: h.stablefordPoints ?? null,
          roundNumber: h.roundNumber || 1,
          isCompleted: h.isCompleted || false,
          isExcluded: h.isExcluded || false,
          matchScoringType: isSplit6 ? "split-six" : isHighLow ? "high-low" : isNassauBest ? "nassau-best" : isNassauCombined ? "nassau-combined" : null,
          companionScoresJson: h.companionScoresJson || null,
          companionSandysJson: h.companionSandysJson || null,
          ...(playingGroupRoundKey ? { playingGroupRoundKey, PlayingGroupRoundKey: playingGroupRoundKey } : {}),
          ...(playingPartnersJson ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson } : {}),
        }));
        console.log(
          "SENDING EXACT PAYLOAD TO API:",
          JSON.stringify(payload, null, 2),
        );
        await updateHoleScoresApi(id!, payload);
        console.log("Successfully synced scorecard:", id);
        return true;
      } catch (err) {
        console.error("Sync failed for scorecard:", id, err);
        return false;
      }
    };

    const success = await performSave();
    if (!success) {
      console.log("API failed, will retry in 2 seconds...");
      setTimeout(() => saveToServer(holesToSave), 2000);
    }
  };
  const fetchScorecard = useCallback(async () => {
    try {
      setLoading(true);
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) setUserId(Number(storedUserId));

        let data: ScorecardHole[] | null = null;
        try {
          data = await getScorecardDetails(id!);
          // console.log("ddd", data);
        } catch (err) {
          console.error("Failed to load from API, checking local draft...");
          const draft = await AsyncStorage.getItem(storageKey);          
          if (draft) {
            const { holes: draftHoles, textScores: draftScores } =
              JSON.parse(draft);
            data = draftHoles;            
            setTextScores(draftScores);
            textScoresRef.current = draftScores;
            console.log("Loaded from local draft");
          } else {
            throw err;
          }
        }

        if (data) {
          const sanitizedData = data.map((h) => ({
            ...h,
            score: h.score !== null && h.score !== undefined ? h.score : null,
            netScore: h.netScore,
            stablefordPoints: h.stablefordPoints,
          }));
          setHoles(sanitizedData);
          // console.log("dd", sanitizedData);
          
          holesRef.current = sanitizedData;

          // Merge API scores into textScoresRef if not already present
          const currentText = textScoresRef.current || {};
          const newText = { ...currentText };
          let changed = false;
          data.forEach((h) => {
            if (h.score !== null && h.score !== undefined && h.score >= 0) {
              if (newText[h.holeId] === undefined) {
                newText[h.holeId] = h.score.toString();
                changed = true;
              }
            }
          });
          if (changed || Object.keys(currentText).length === 0) {
            setTextScores(newText);
            textScoresRef.current = newText;
          }

          const showPts = data.some(
            (h) =>
              h.stablefordPoints !== null && h.stablefordPoints !== undefined,
          );
          setIsStableford(showPts);

          // Parse partners
          let parsedPartners: any[] = [];
          const firstHole = data[0] as any;
          if (firstHole && firstHole.playingPartnersJson) {
            try {
              parsedPartners = typeof firstHole.playingPartnersJson === 'string'
                ? JSON.parse(firstHole.playingPartnersJson)
                : firstHole.playingPartnersJson;
              setPartners(parsedPartners || []);
            } catch (e) {
              console.error("Error parsing playingPartnersJson:", e);
            }
          }

          if (firstHole) {
            const matchScoring = (
              firstHole.matchScoringType ||
              firstHole.match_scoring_type ||
              firstHole.scoringType ||
              firstHole.scoring_type ||
              ""
            ).toLowerCase();
            const pLength = parsedPartners.length;
            const isHL = matchScoring.includes("high-low") || matchScoring.includes("high_low");
            const isS6 = matchScoring.includes("split-six") || matchScoring.includes("split_six");
            const isNB = matchScoring.includes("nassau-best") || matchScoring.includes("nassau_best");
            const isNC = matchScoring.includes("nassau-combined") || matchScoring.includes("nassau_combined");
            const isG =
              (pLength > 1 && (!matchScoring || matchScoring.trim() === "")) ||
              matchScoring.includes("gross") ||
              matchScoring.includes("gross_score");

            setIsHighLow(isHL);
            setIsSplit6(isS6);
            setIsGross(isG);
            setIsNassauBest(isNB);
            setIsNassauCombined(isNC);

            const teeBoxId = firstHole.teeBoxId;
            const playingGroupRoundKey = firstHole.playingGroupRoundKey || firstHole.PlayingGroupRoundKey;
            if (playingGroupRoundKey) {
              setRoundContextId(playingGroupRoundKey);
            }

            if (parsedPartners.length > 0 && teeBoxId) {
              const fetchCompanionHandicaps = async () => {
                const handicapsMap: Record<number, number> = {};
                for (const p of parsedPartners) {
                  if (!p.isPrimary && p.userId) {
                    try {
                      const hData = await getSubScorecardHandicap(p.userId, Number(teeBoxId));
                      const hc = typeof hData === 'object' && hData !== null ? (hData.handicap ?? 0) : (Number(hData) || 0);
                      handicapsMap[p.userId] = hc;
                    } catch (e) {
                      console.error("Error fetching companion handicap for userId", p.userId, e);
                    }
                  }
                }
                setCompanionHandicaps(handicapsMap);
              };
              fetchCompanionHandicaps();
            }
          }

        // Determine which halves to display based on courseHalf from API or hole numbers fallback
        // const apiCourseHalf = sanitizedData.length > 0 ? sanitizedData[0].courseHalf : null;
        const apiCourseHalf = sanitizedData[0].courseHalf;

        if (apiCourseHalf === "Front9") {
          setDisplayFront(true);
          setDisplayBack(false);
        } else if (apiCourseHalf === "Back9") {
          setDisplayFront(false);
          setDisplayBack(true);
        } else {
          // Fallback: Check hole number distribution if api returns null
          const hasFront = sanitizedData.some((h) => h.holeNumber <= 9);
          const hasBack = sanitizedData.some((h) => h.holeNumber >= 10);

          if (hasFront && !hasBack) {
            setDisplayFront(true);
            setDisplayBack(false);
          } else if (hasBack && !hasFront) {
            setDisplayFront(false);
            setDisplayBack(true);
          } else {
            // If both exist or it's empty, default to full 18/tournament view
            setDisplayFront(true);
            setDisplayBack(true);
          }
        }
        }
      } catch (err) {
        setError("Failed to load scorecard.");
    } finally {
      setLoading(false);
    }
  }, [id, storageKey]);

  useFocusEffect(
    useCallback(() => {
      fetchScorecard();
    }, [fetchScorecard]),
  );

  useEffect(() => {
    textScoresRef.current = textScores;
  }, [textScores]);

  useEffect(() => {
    holesRef.current = holes;
  }, [holes]);
  const handleGoBack = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const playingGroupRoundKey = roundContextId ? String(roundContextId) : undefined;
    const playingPartnersJson = partners.length > 0 ? JSON.stringify(partners) : undefined;

    const payload = holesRef.current.map((h) => ({
      userId: userId ? Number(userId) : h.userId,
      courseId: h.courseId,
      courseHalf: h.courseHalf || null,
      teeBoxId: h.teeBoxId,
      tournamentId: h.tournamentId,
      holeId: h.holeId,
      score: h.score === undefined || h.score === null ? null : h.score,
      stablefordPoints: h.stablefordPoints ?? null,
      roundNumber: h.roundNumber || 1,
      isCompleted: h.isCompleted || false,
      isExcluded: h.isExcluded || false,
      companionScoresJson: h.companionScoresJson || null,
      companionSandysJson: h.companionSandysJson || null,
      ...(playingGroupRoundKey ? { playingGroupRoundKey, PlayingGroupRoundKey: playingGroupRoundKey } : {}),
      ...(playingPartnersJson ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson } : {}),
    }));
    try {
      await updateHoleScoresApi(id!, payload);
    } catch (err) {
      console.error("Final save failed:", err);
    }

    router.back();
  }, [router, id, userId]);

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

  const calculateStrokes = (handicap: number, strokeIndex: number) => {
    const base = Math.floor(handicap / 18);
    const remainder = handicap % 18;
    return base + (strokeIndex <= remainder ? 1 : 0);
  };

  const getPlayerHoleInfo = (hole: any, partner: any) => {
    const isPrimary = partner.isPrimary;
    const playerId = partner.playerId; // "p1", "p2", etc.
    const partnerUserId = partner.userId;

    let companionScores: Record<string, number | null> = {};
    if (hole.companionScoresJson) {
      try {
        companionScores = typeof hole.companionScoresJson === 'string' 
          ? JSON.parse(hole.companionScoresJson) 
          : hole.companionScoresJson;
      } catch (e) {
        console.error(e);
      }
    }

    let companionSandys: Record<string, boolean> = {};
    if (hole.companionSandysJson) {
      try {
        companionSandys = typeof hole.companionSandysJson === 'string' 
          ? JSON.parse(hole.companionSandysJson) 
          : hole.companionSandysJson;
      } catch (e) {
        console.error(e);
      }
    }

    let rawScore = null;
    if (isPrimary) {
      rawScore = hole.score !== null && hole.score !== "" && hole.score !== undefined ? Number(hole.score) : null;
      if (rawScore === null && companionScores[playerId] !== undefined && companionScores[playerId] !== null) {
        rawScore = Number(companionScores[playerId]);
      }
    } else {
      rawScore = companionScores[playerId] !== undefined && companionScores[playerId] !== null ? Number(companionScores[playerId]) : null;
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

    const playerHandicap = isPrimary ? Number(handicap || 0) : (companionHandicaps[partnerUserId] || 0);
    let strokesReceived = calculateStrokes(playerHandicap, hole.handicap || hole.strokeIndex);
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

  const isExcluded = holes.length > 0 ? holes[0].isExcluded : false;

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

  const calculateHighLowPoints = (s1: number | null, s2: number | null, s3: number | null, s4: number | null) => {
    if (s1 === null || s2 === null || s3 === null || s4 === null) {
      return { teamAPoints: 0, teamBPoints: 0 };
    }

    const p1 = { team: 'A', score: s1 };
    const p2 = { team: 'A', score: s2 };
    const p3 = { team: 'B', score: s3 };
    const p4 = { team: 'B', score: s4 };

    const allPlayers = [p1, p2, p3, p4];

    // 1. Low Score (2 points)
    const minScore = Math.min(s1, s2, s3, s4);
    const lowPlayers = allPlayers.filter(p => p.score === minScore);
    const lowTeams = new Set(lowPlayers.map(p => p.team));

    let teamALowPts = 0;
    let teamBLowPts = 0;
    if (lowTeams.size === 1) {
      if (lowTeams.has('A')) teamALowPts = 2;
      else teamBLowPts = 2;
    }

    // 2. High Score (1 point)
    const remainingPlayers = allPlayers.filter(p => p.score > minScore);
    let teamAHighPts = 0;
    let teamBHighPts = 0;

    if (remainingPlayers.length > 0) {
      const nextMinScore = Math.min(...remainingPlayers.map(p => p.score));
      const nextPlayers = remainingPlayers.filter(p => p.score === nextMinScore);
      const nextTeams = new Set(nextPlayers.map(p => p.team));
      if (nextTeams.size === 1) {
        if (nextTeams.has('A')) teamAHighPts = 1;
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
        teamALow: null, teamBLow: null,
        teamAHigh: null, teamBHigh: null,
        teamAMatchPts: 0, teamBMatchPts: 0,
        teamAMult: 1, teamBMult: 1,
        teamAPts: 0, teamBPts: 0,
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
        teamALow: null, teamBLow: null,
        teamAHigh: null, teamBHigh: null,
        teamAMatchPts: 0, teamBMatchPts: 0,
        teamAMult: 1, teamBMult: 1,
        teamAPts: 0, teamBPts: 0,
      };
    }

    const teamALow = Math.min(s1, s2);
    const teamBLow = Math.min(s3, s4);
    const teamAHigh = Math.max(s1, s2);
    const teamBHigh = Math.max(s3, s4);

    const { teamAPoints, teamBPoints } = calculateHighLowPoints(s1, s2, s3, s4);

    const baseMultA = Math.max(getBaseMultiplier(info1.score, h.par), getBaseMultiplier(info2.score, h.par));
    const baseMultB = Math.max(getBaseMultiplier(info3.score, h.par), getBaseMultiplier(info4.score, h.par));

    const teamAMult = baseMultA;
    const teamBMult = baseMultB;

    return {
      teamALow, teamBLow,
      teamAHigh, teamBHigh,
      teamAMatchPts: teamAPoints, teamBMatchPts: teamBPoints,
      teamAMult, teamBMult,
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

  const calculateSplitSixPoints = (s1: number | null, s2: number | null, s3: number | null) => {
    if (s1 === null || s2 === null || s3 === null) return [0, 0, 0];

    const players = [
      { id: 'p1', score: s1 },
      { id: 'p2', score: s2 },
      { id: 'p3', score: s3 },
    ];

    players.sort((a, b) => a.score - b.score);

    const points: Record<string, number> = { p1: 0, p2: 0, p3: 0 };

    if (players[0].score === players[1].score && players[1].score === players[2].score) {
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

  const renderScoreIndicator = (
    score: number | string | null,
    par: number,
    isDark: boolean,
    textVal: string = "",
  ) => {
    if (score === null || score === "" || score === undefined || textVal === "") return null;

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

  const handleMultiplayerScoreChange = (holeId: number, playerId: string, value: string, flatIndex: number) => {
    let finalVal: number | null = null;
    if (value !== "") {
      if (!/^\d+$/.test(value)) {
        return;
      }
      finalVal = Number(value);
      if (finalVal > 15) {
        return;
      }
    }

    const updatedHoles = holes.map((h) => {
      if (h.holeId === holeId) {
        let companionScores: Record<string, number | null> = {};
        if (h.companionScoresJson) {
          try {
            companionScores = typeof h.companionScoresJson === 'string'
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
          newHole.score = finalVal;
        }

        // recalculate stableford points if isStableford
        if (isStableford) {
          const partner = partners.find(p => p.playerId === playerId);
          const pHc = partner?.isPrimary ? Number(handicap || 0) : (companionHandicaps[partner?.userId] || 0);
          const strokes = calculateStrokes(pHc, h.strokeIndex);
          const net = finalVal !== null ? finalVal - strokes : 0;
          const pts = h.par - net + 2;
          newHole.stablefordPoints = finalVal !== null && net > 0 ? (pts > 0 ? pts : 0) : 0;
        }

        return newHole;
      }
      return h;
    });

    setHoles(updatedHoles);
    holesRef.current = updatedHoles;

    const newTextScores = { ...textScoresRef.current };
    if (playerId === "p1") {
      newTextScores[holeId] = value;
      setTextScores(newTextScores);
      textScoresRef.current = newTextScores;
    }

    AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        holes: updatedHoles,
        textScores: newTextScores,
      }),
    ).catch((err) => console.error("Failed to save draft:", err));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveToServer(updatedHoles);
    }, 500);

    // Auto-focus next input if 2 digits are entered
    if (value.length >= 2) {
      const nextIndex = flatIndex + 1;
      if (nextIndex < holes.length * partners.length) {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        inputRefs.current[nextIndex]?.focus();
      }
    }

    // Auto-focus next input after 3 seconds if a value is entered
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    if (value !== "") {
      focusTimeoutRef.current = setTimeout(() => {
        const nextIndex = flatIndex + 1;
        if (nextIndex < holes.length * partners.length) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 3000);
    }
  };

  const handleSandyToggle = (holeId: number, playerId: string) => {
    const updatedHoles = holes.map((h) => {
      if (h.holeId === holeId) {
        let companionSandys: Record<string, boolean> = {};
        if (h.companionSandysJson) {
          try {
            companionSandys = typeof h.companionSandysJson === 'string'
              ? JSON.parse(h.companionSandysJson)
              : h.companionSandysJson;
          } catch (e) {
            console.error(e);
          }
        }
        companionSandys[playerId] = !companionSandys[playerId];
        return {
          ...h,
          companionSandysJson: JSON.stringify(companionSandys),
        };
      }
      return h;
    });
    setHoles(updatedHoles);
    holesRef.current = updatedHoles;

    AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        holes: updatedHoles,
        textScores: textScoresRef.current,
      }),
    ).catch((err) => console.error("Failed to save draft:", err));

    saveToServer(updatedHoles);
  };

  const handleScoreChange = (holeId: number, text: string) => {
    let formattedText = text.replace(/[^0-9]/g, "");

    if (formattedText !== "") {
      const num = parseInt(formattedText, 10);
      if (num > 15) return;
      formattedText = num.toString();
    }

    textScoresRef.current[holeId] = formattedText;
    setTextScores((prev) => ({ ...prev, [holeId]: formattedText }));
    const score = formattedText === "" ? null : parseInt(formattedText, 10);

    const updatedHoles = holes.map((h) => {
      if (h.holeId === holeId) {
        const strokes = calculateStrokes(handicap, h.strokeIndex);
        const validScore = score;
        const netScore =
          validScore !== null && validScore >= 0 ? validScore - strokes : 0;
        const stablefordPoints = isStableford
          ? validScore !== null && validScore >= 0 && netScore > 0
            ? Math.max(0, h.par - netScore + 2)
            : 0
          : h.stablefordPoints;

        console.log("Hole Updated:", {
          hole: h.holeNumber,
          si: h.strokeIndex,
          yard: h.yardage,
          par: h.par,
          score: validScore !== null && validScore >= 0 ? validScore : "-",
          net: netScore > 0 ? netScore : "-",
        });

        return { ...h, score: validScore, netScore, stablefordPoints };
      }
      return h;
    });

    setHoles(updatedHoles);
    holesRef.current = updatedHoles;

    const newTextScores = { ...textScoresRef.current };
    AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        holes: updatedHoles,
        textScores: newTextScores,
      }),
    ).catch((err) => console.error("Failed to save draft:", err));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      console.log("Triggering debounced save to web for scorecard:", id);
      saveToServer(updatedHoles);
    }, 500);

    if (formattedText.length >= 2) {
      const flatHoles = holes;
      const currentIndex = flatHoles.findIndex((h) => h.holeId === holeId);
      const nextIndex = currentIndex + 1;
      if (nextIndex < flatHoles.length) {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        inputRefs.current[nextIndex]?.focus();
      }
    }

    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    if (formattedText !== "") {
      focusTimeoutRef.current = setTimeout(() => {
        const flatHoles = holesRef.current;
        const currentIndex = flatHoles.findIndex((h) => h.holeId === holeId);
        const nextIndex = currentIndex + 1;
        if (nextIndex < flatHoles.length) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 3000);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const playingGroupRoundKey = roundContextId ? String(roundContextId) : undefined;
      const playingPartnersJson = partners.length > 0 ? JSON.stringify(partners) : undefined;

      const payload = holes.map((h) => ({
        userId: userId ? Number(userId) : h.userId,
        courseId: h.courseId,
        courseHalf: h.courseHalf || null,
        teeBoxId: h.teeBoxId,
        tournamentId: h.tournamentId,
        holeId: h.holeId,
        score: h.score === undefined || h.score === null ? null : h.score,
        stablefordPoints: h.stablefordPoints ?? null,
        roundNumber: h.roundNumber || 1,
        isCompleted: h.isCompleted || false,
        isExcluded: h.isExcluded || false,
        companionScoresJson: h.companionScoresJson || null,
        companionSandysJson: h.companionSandysJson || null,
        ...(playingGroupRoundKey ? { playingGroupRoundKey, PlayingGroupRoundKey: playingGroupRoundKey } : {}),
        ...(playingPartnersJson ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson } : {}),
      }));
      await updateHoleScoresApi(id!, payload);
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
            const playingGroupRoundKey = roundContextId ? String(roundContextId) : undefined;
            const playingPartnersJson = partners.length > 0 ? JSON.stringify(partners) : undefined;

            const payload = holes.map((h) => ({
              userId: userId ? Number(userId) : h.userId,
              courseId: h.courseId,
              courseHalf: h.courseHalf,
              teeBoxId: h.teeBoxId,
              tournamentId: h.tournamentId,
              holeId: h.holeId,
              score: h.score === undefined || h.score === null ? null : h.score,
              stablefordPoints: h.stablefordPoints ?? null,
              roundNumber: h.roundNumber || 1,
              isCompleted: true,
              isExcluded: h.isExcluded || false,
              companionScoresJson: h.companionScoresJson || null,
              companionSandysJson: h.companionSandysJson || null,
              ...(playingGroupRoundKey ? { playingGroupRoundKey, PlayingGroupRoundKey: playingGroupRoundKey } : {}),
              ...(playingPartnersJson ? { playingPartnersJson, PlayingPartnersJson: playingPartnersJson } : {}),
            }));
            await updateHoleScoresApi(id!, payload);
            await AsyncStorage.removeItem(storageKey);

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
    const total = arr.reduce((t, h) => {
      const val = textScores[h.holeId];
      const s =
        val !== undefined && val !== ""
          ? parseInt(val)
          : h.score !== null && h.score !== undefined
            ? h.score
            : 0;
      return t + s;
    }, 0);
    const hasAnyScore = arr.some(
      (h) =>
        (textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined) ||
        (h.score !== null && h.score !== undefined),
    );
    return hasAnyScore ? total : "-";
  };

  const sumNet = (arr: ScorecardHole[]) => {
    const total = arr.reduce(
      (t, h) => t + (h.score !== null && h.score >= 0 ? h.netScore || 0 : 0),
      0,
    );
    const hasAnyScore = arr.some(
      (h) =>
        (textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined) ||
        (h.score !== null && h.score !== undefined),
    );
    return hasAnyScore ? total : "-";
  };

  const sumPar = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.par || 0), 0);

  const sumYardage = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.yardage || 0), 0);

  const sumPts = (arr: ScorecardHole[]) => {
    if (!isStableford) return 0;
    const total = arr.reduce(
      (t, h) =>
        t +
          (h.score !== null && h.score >= 0
            ? (h.stablefordPoints ?? 0)
            : 0),
      0,
    );
    const hasAnyScore = arr.some(
      (h) =>
        (textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined) ||
        (h.score !== null && h.score !== undefined),
    );
    return hasAnyScore ? total : "-";
  };

  if (loading) {
    return (
      <ThemedView
        style={{
          flex: 1,
          backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)",
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

          <Skeleton
            isDark={isDark}
            width="100%"
            height={56}
            borderRadius={12}
            style={{ marginBottom: 20 }}
          />

          <View
            className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
          >
            {["Hole", "Stroke\nIndex", "Yards", "Par", "Scor", "Net"].map((_, i) => (
              <View key={i} className="flex-1 items-center">
                <Skeleton
                  isDark={isDark}
                  width={28}
                  height={12}
                  borderRadius={4}
                />
              </View>
            ))}
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
            {[...Array(9)].map((_, i) => (
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
          backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)",
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

  const renderHeader = () => (
    <View
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        paddingTop: Math.max(insets.top, 12),
        borderBottomWidth: 1,
        marginBottom: 7,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <VStack
        style={{
          paddingHorizontal: 16,
          paddingBottom: 14,
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
            onPress={handleGoBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
            }}
            android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#fff" : "#020617"}
            />
          </Pressable>

          {/* 🧠 TITLE */}
          <VStack
            style={{
              flex: 1,
              alignItems: "center",
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#fff" : "#020617",
              }}
            >
              Scorecard
            </Text>

            {/* <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
              }}
            >
              {renderScoringType || "Round Details"}
            </Text> */}
          </VStack>

          {/* ⚖️ SPACER */}
          <View style={{ width: 40 }} />
        </HStack>

        {/* 📊 INFO ROW */}
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
          {/* Handicap */}
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
              Handicap: {handicap}
            </Text>
          </HStack>

          {/* Scoring */}
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            {renderScoringType}
          </Text>
        </HStack>

        {/* ✏️ HELPER BANNER */}
        {/* <HStack
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: isDark
              ? "rgba(139,195,74,0.08)"
              : "rgba(139,195,74,0.08)",
            borderWidth: 1,
            borderColor: "rgba(139,195,74,0.18)",
          }}
        >
          <Ionicons name="create-outline" size={16} color="#84cc16" />

          <Text
            style={{
              marginLeft: 8,
              flex: 1,
              fontSize: 12,
              color: isDark ? "#d1d5db" : "#374151",
            }}
          >
            Tap any score box below to edit your round.
          </Text>
        </HStack> */}
      </VStack>
    </View>
  );

  return (
    <ThemedView
      style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#F8FAFC" }}
    >
      <Watermark />
      {renderHeader()}

      <ScrollView
        className="px-4 flex-1"
        showsVerticalScrollIndicator={false}
      >
        {partners.length < 2 ? (
          <>
            <View
              className="z-10 shadow-sm"
              style={{ backgroundColor: isDark ? "#020617" : "#FFFFFF" }}
            >
              <View
                className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#111827]" : "bg-slate-50"}`}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
                }}
              >
                {[
                  "Hole",
                  "SI",
                  "Yards",
                  "Par",
                  "Score ✎",
                  "Net",
                  ...(isStableford ? ["Pts"] : []),
                ].map((h) => (
                  <Text
                    key={h}
                    className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                  >
                    {h}
                  </Text>
                ))}
              </View>
            </View>

            <View
              className={`${isDark ? "bg-[#020617]" : "bg-white"} rounded-b-xl overflow-hidden mb-4`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {displayFront &&
                holes.filter((h) => h.holeNumber <= 9).length > 0 && (
                  <>
                    {holes
                      .filter((h) => h.holeNumber <= 9)
                      .map((h, index) => (
                        <View
                          key={h.holeId}
                          className={`flex-row items-center p-3 ${index < 8 ? (isDark ? "border-b border-[#1e293b]" : "border-b border-[#e5e7eb]") : ""}`}
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
                          <View className="flex-1 items-center justify-center relative">
                            {renderScoreIndicator(
                              h.score ?? null,
                              h.par,
                              isDark,
                              textScores[h.holeId] || "",
                            )}
                            <TextInput
                              ref={(el) => {
                                inputRefs.current[index] = el;
                              }}
                              style={{
                                width: 50,
                                height: 40,
                                backgroundColor:
                                  textScores[h.holeId] !== "" &&
                                  textScores[h.holeId] !== undefined
                                    ? "transparent"
                                    : isDark
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(0,0,0,0.04)",
                                borderColor:
                                  textScores[h.holeId] !== "" &&
                                  textScores[h.holeId] !== undefined
                                    ? "transparent"
                                    : isDark
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(0,0,0,0.1)",
                                borderWidth: 1,
                                color: isDark ? "#fff" : "#000",
                                textAlign: "center",
                                borderRadius: 8,
                                padding: 0,
                                zIndex: 10,
                                fontWeight: "bold",
                              }}
                              keyboardType="numeric"
                              value={
                                textScores[h.holeId] !== undefined
                                  ? textScores[h.holeId]
                                  : h.score !== null && h.score !== undefined
                                    ? h.score.toString()
                                    : ""
                              }
                              onChangeText={(val) =>
                                handleScoreChange(h.holeId, val)
                              }
                              onBlur={() => {
                                if (focusTimeoutRef.current)
                                  clearTimeout(focusTimeoutRef.current);
                              }}
                              placeholder="-"
                              placeholderTextColor={isDark ? "#666" : "#999"}
                            />
                          </View>
                          <Text
                            className={`flex-1 text-center font-semibold text-xs ${isDark ? "text-white" : "text-black"}`}
                          >
                            {h.netScore !== null &&
                            h.netScore !== undefined &&
                            (textScores[h.holeId] || h.score !== null)
                              ? h.netScore
                              : "-"}
                          </Text>
                          {isStableford && (
                            <Text
                              className={`flex-1 text-center font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}
                            >
                              {(textScores[h.holeId] !== "" &&
                                textScores[h.holeId] !== undefined) ||
                              (h.score !== null &&
                                h.score !== undefined &&
                                textScores[h.holeId] === undefined)
                                ? (h.stablefordPoints ?? 0)
                                : "-"}
                            </Text>
                          )}
                        </View>
                      ))}

                    <View
                      className={`flex-row p-3 ${isDark ? "bg-[#111827]" : "bg-slate-50"}`}
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: isDark ? "#1e293b" : "#e5e7eb",
                      }}
                    >
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                      >
                        Front 9
                      </Text>
                      <Text className="flex-1" />
                      <Text
                        className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {sumYardage(holes.filter((h) => h.holeNumber <= 9))}
                      </Text>
                      <Text
                        className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {sumPar(holes.filter((h) => h.holeNumber <= 9))}
                      </Text>
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                      >
                        {sumScores(holes.filter((h) => h.holeNumber <= 9))}
                      </Text>
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                      >
                        {sumNet(holes.filter((h) => h.holeNumber <= 9))}
                      </Text>
                      {isStableford && (
                        <Text
                          className={`flex-1 text-center font-bold text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                        >
                          {sumPts(holes.filter((h) => h.holeNumber <= 9))}
                        </Text>
                      )}
                    </View>
                  </>
                )}

              {displayBack &&
                holes.filter((h) => h.holeNumber >= 10).length > 0 && (
                  <>
                    {holes
                      .filter((h) => h.holeNumber >= 10)
                      .map((h, index) => (
                        <View
                          key={h.holeId}
                          className={`flex-row items-center p-3 ${index < 8 ? (isDark ? "border-b border-[#1e293b]" : "border-b border-[#e5e7eb]") : ""}`}
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
                          <View className="flex-1 items-center justify-center relative">
                            {renderScoreIndicator(
                              h.score ?? null,
                              h.par,
                              isDark,
                              textScores[h.holeId] || "",
                            )}
                            <TextInput
                              ref={(el) => {
                                inputRefs.current[
                                  holes.filter((h) => h.holeNumber <= 9).length +
                                    index
                                ] = el;
                              }}
                              style={{
                                width: 50,
                                height: 40,
                                backgroundColor:
                                  textScores[h.holeId] !== "" &&
                                  textScores[h.holeId] !== undefined
                                    ? "transparent"
                                    : isDark
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(0,0,0,0.04)",
                                borderColor:
                                  textScores[h.holeId] !== "" &&
                                  textScores[h.holeId] !== undefined
                                    ? "transparent"
                                    : isDark
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(0,0,0,0.1)",
                                borderWidth: 1,
                                color: isDark ? "#fff" : "#000",
                                textAlign: "center",
                                borderRadius: 8,
                                paddingVertical: 0,
                                zIndex: 10,
                                fontWeight: "bold",
                              }}
                              keyboardType="numeric"
                              value={
                                textScores[h.holeId] !== undefined
                                  ? textScores[h.holeId]
                                  : h.score !== null && h.score !== undefined
                                    ? h.score.toString()
                                    : ""
                              }
                              onChangeText={(val) =>
                                handleScoreChange(h.holeId, val)
                              }
                              onBlur={() => {
                                if (focusTimeoutRef.current)
                                  clearTimeout(focusTimeoutRef.current);
                              }}
                              placeholder="-"
                              placeholderTextColor={isDark ? "#666" : "#999"}
                            />
                          </View>
                          <Text
                            className={`flex-1 text-center font-semibold text-xs ${isDark ? "text-white" : "text-black"}`}
                          >
                            {h.netScore !== null &&
                            h.netScore !== undefined &&
                            (textScores[h.holeId] || h.score !== null)
                              ? h.netScore
                              : "-"}
                          </Text>
                          {isStableford && (
                            <Text
                              className={`flex-1 text-center font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}
                            >
                              {(textScores[h.holeId] !== "" &&
                                textScores[h.holeId] !== undefined) ||
                              (h.score !== null &&
                                h.score !== undefined &&
                                textScores[h.holeId] === undefined)
                                ? (h.stablefordPoints ?? 0)
                                : "-"}
                            </Text>
                          )}
                        </View>
                      ))}
                    <View
                      className={`flex-row p-3 ${isDark ? "bg-[#111827]" : "bg-slate-50"}`}
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: isDark ? "#1e293b" : "#e5e7eb",
                      }}
                    >
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                      >
                        Back 9
                      </Text>
                      <Text className="flex-1" />
                      <Text
                        className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {sumYardage(holes.filter((h) => h.holeNumber >= 10))}
                      </Text>
                      <Text
                        className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {sumPar(holes.filter((h) => h.holeNumber >= 10))}
                      </Text>
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                      >
                        {sumScores(holes.filter((h) => h.holeNumber >= 10))}
                      </Text>
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                      >
                        {sumNet(holes.filter((h) => h.holeNumber >= 10))}
                      </Text>
                      {isStableford && (
                        <Text
                          className={`flex-1 text-center font-bold text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                        >
                          {sumPts(holes.filter((h) => h.holeNumber >= 10))}
                        </Text>
                      )}
                    </View>
                  </>
                )}
            </View>

            <View className="mb-8">
              <View
                className={`flex-row p-3 rounded-xl items-center ${isDark ? "bg-[#8BC34A]" : "bg-[#8BC34A]"}`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text
                  className="flex-1 text-center font-bold text-white uppercase tracking-wider"
                  style={{ fontSize: 12, lineHeight: 12 }}
                >
                  Grand Total
                </Text>
                <Text className="flex-1" />
                <Text className="flex-1 text-center font-bold text-white">
                  {sumYardage(
                    holes.filter(
                      (h) =>
                        (displayFront && h.holeNumber <= 9) ||
                        (displayBack && h.holeNumber >= 10),
                    ),
                  )}
                </Text>
                <Text className="flex-1 text-center font-bold text-white">
                  {sumPar(
                    holes.filter(
                      (h) =>
                        (displayFront && h.holeNumber <= 9) ||
                        (displayBack && h.holeNumber >= 10),
                    ),
                  )}
                </Text>
                <Text className="flex-1 text-center font-bold text-white">
                  {sumScores(
                    holes.filter(
                      (h) =>
                        (displayFront && h.holeNumber <= 9) ||
                        (displayBack && h.holeNumber >= 10),
                    ),
                  )}
                </Text>
                <Text className="flex-1 text-center font-bold text-white">
                  {sumNet(
                    holes.filter(
                      (h) =>
                        (displayFront && h.holeNumber <= 9) ||
                        (displayBack && h.holeNumber >= 10),
                    ),
                  )}
                </Text>
                {isStableford && (
                  <Text className="flex-1 text-center font-bold text-white">
                    {sumPts(
                      holes.filter(
                        (h) =>
                          (displayFront && h.holeNumber <= 9) ||
                          (displayBack && h.holeNumber >= 10),
                      ),
                    )}
                  </Text>
                )}
              </View>
            </View>
          </>
        ) : (
          (() => {
            const totalWidth = 50 + 55 + 60 + 50 + partners.length * 95;
            
            const renderMultiplayerHeaders = () => (
              <HStack style={{ paddingVertical: 12, backgroundColor: isDark ? "rgba(38,38,38,0.8)" : "rgba(243,244,246,0.8)", borderBottomWidth: 1, borderColor: isDark ? "#444" : "#ddd" }}>
                <ThemedText style={{ width: 50, textAlign: 'center', fontWeight: '700', fontSize: 12 }}>Hole</ThemedText>
                <ThemedText style={{ width: 55, textAlign: 'center', fontWeight: '700', fontSize: 12 }}>SI</ThemedText>
                <ThemedText style={{ width: 60, textAlign: 'center', fontWeight: '700', fontSize: 12 }}>Yards</ThemedText>
                <ThemedText style={{ width: 50, textAlign: 'center', fontWeight: '700', fontSize: 12 }}>Par</ThemedText>
                {partners.map((p, idx) => {
                  let badgeText = "";
                  let badgeColor = "";
                  if (isHighLow) {
                    badgeText = idx < 2 ? "Team A" : "Team B";
                    badgeColor = idx < 2 ? "#0284c7" : "#e11d48";
                  }
                  return (
                    <VStack key={p.playerId} style={{ width: 95, alignItems: 'center' }}>
                      <ThemedText numberOfLines={1} style={{ textAlign: 'center', fontWeight: '700', fontSize: 12 }}>
                        {p.isPrimary ? "You" : p.name}
                      </ThemedText>
                      {badgeText !== "" && (
                        <View style={{ backgroundColor: badgeColor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2 }}>
                          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{badgeText}</Text>
                        </View>
                      )}
                    </VStack>
                  );
                })}
              </HStack>
            );

            const front9Holes = holes.filter((h) => h.holeNumber <= 9);
            const back9Holes = holes.filter((h) => h.holeNumber >= 10);

            return (
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                <VStack style={{ width: totalWidth, borderRadius: 14, overflow: 'hidden' }}>
                  {renderMultiplayerHeaders()}

                  {displayFront && front9Holes.map((h, index) => {
                    let s6Pts: number[] = [];
                    if (isSplit6 && partners.length >= 3) {
                      const s1 = getPlayerHoleInfo(h, partners[0]).netScore;
                      const s2 = getPlayerHoleInfo(h, partners[1]).netScore;
                      const s3 = getPlayerHoleInfo(h, partners[2]).netScore;
                      s6Pts = calculateSplitSixPoints(s1, s2, s3);
                    }

                    return (
                      <View key={h.holeId}>
                        <HStack style={{ paddingVertical: 8, alignItems: 'center', borderBottomWidth: 0.5, borderColor: isDark ? '#1e293b' : '#e2e8f0', backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)' }}>
                          <ThemedText style={{ width: 50, textAlign: 'center' }}>{h.holeNumber}</ThemedText>
                          <ThemedText style={{ width: 55, textAlign: 'center' }}>{h.strokeIndex}</ThemedText>
                          <ThemedText style={{ width: 60, textAlign: 'center', color: '#888' }}>{h.yardage}</ThemedText>
                          <ThemedText style={{ width: 50, textAlign: 'center' }}>{h.par}</ThemedText>
                          
                          {partners.map((p, pIndex) => {
                            const info = getPlayerHoleInfo(h, p);
                            const flatIndex = index * partners.length + pIndex;
                            let textVal = "";
                            let companionScores: Record<string, number | null> = {};
                            if (h.companionScoresJson) {
                              try {
                                companionScores = typeof h.companionScoresJson === 'string'
                                  ? JSON.parse(h.companionScoresJson)
                                  : h.companionScoresJson;
                              } catch (e) {}
                            }
                            if (p.isPrimary) {
                              textVal = h.score !== null && h.score !== undefined ? String(h.score) : "";
                            } else {
                              textVal = companionScores[p.playerId] !== undefined && companionScores[p.playerId] !== null ? String(companionScores[p.playerId]) : "";
                            }

                            return (
                              <View key={p.playerId} style={{ width: 95, alignItems: 'center', justifyContent: 'center' }}>
                                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
                                  {renderScoreIndicator(info.score, h.par, isDark, textVal)}
                                  <TextInput
                                    ref={(el) => {
                                      inputRefs.current[flatIndex] = el;
                                    }}
                                    keyboardType="numeric"
                                    value={textVal}
                                    onChangeText={(val) => handleMultiplayerScoreChange(h.holeId, p.playerId, val, flatIndex)}
                                    placeholder="-"
                                    placeholderTextColor={isDark ? "#666" : "#999"}
                                    style={{
                                      width: 30,
                                      height: 30,
                                      textAlign: "center",
                                      color: isDark ? "#fff" : "#000",
                                      fontWeight: "700",
                                      fontSize: 13,
                                      zIndex: 10,
                                      backgroundColor: 'transparent',
                                      padding: 0,
                                    }}
                                  />
                                </View>

                                <HStack style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
                                  <TouchableOpacity
                                    onPress={() => handleSandyToggle(h.holeId, p.playerId)}
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: 9,
                                      backgroundColor: info.sandy ? "#2e7d32" : (isDark ? "#333" : "#e5e5e5"),
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: info.sandy ? '#fff' : (isDark ? '#aaa' : '#666') }}>
                                      S
                                    </Text>
                                  </TouchableOpacity>

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
                      </View>
                    );
                  })}

                  {/* FRONT 9 TOTALS ROW */}
                  {displayFront && front9Holes.length > 0 && (
                    <HStack style={{ backgroundColor: isDark ? "rgba(38,38,38,0.8)" : "rgba(243,244,246,0.8)", paddingVertical: 10, borderTopWidth: 1, borderColor: isDark ? "#444" : "#ddd" }}>
                      <ThemedText style={{ width: 50, fontWeight: '700', textAlign: 'center' }}>F9</ThemedText>
                      <ThemedText style={{ width: 55, textAlign: 'center' }} />
                      <ThemedText style={{ width: 60, textAlign: 'center' }}>{sumYardage(front9Holes)}</ThemedText>
                      <ThemedText style={{ width: 50, textAlign: 'center' }}>{sumPar(front9Holes)}</ThemedText>
                      {partners.map((p) => {
                        const t = getPlayerTotals(front9Holes, p);
                        return (
                          <VStack key={p.playerId} style={{ width: 95, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#fff' : '#000' }}>
                              G:{t.gross}
                            </Text>
                            {isStableford ? (
                              <Text style={{ fontSize: 9, color: '#f59e0b' }}>Pts:{t.stableford}</Text>
                            ) : (
                              <Text style={{ fontSize: 9, color: '#84cc16' }}>Net:{t.net}</Text>
                            )}
                          </VStack>
                        );
                      })}
                    </HStack>
                  )}

                  {displayBack && back9Holes.map((h, index) => {
                    let s6Pts: number[] = [];
                    if (isSplit6 && partners.length >= 3) {
                      const s1 = getPlayerHoleInfo(h, partners[0]).netScore;
                      const s2 = getPlayerHoleInfo(h, partners[1]).netScore;
                      const s3 = getPlayerHoleInfo(h, partners[2]).netScore;
                      s6Pts = calculateSplitSixPoints(s1, s2, s3);
                    }

                    // For Back 9, flat index offsets by Front 9 holes * partners.length
                    const front9Offset = front9Holes.length * partners.length;

                    return (
                      <View key={h.holeId}>
                        <HStack style={{ paddingVertical: 8, alignItems: 'center', borderBottomWidth: 0.5, borderColor: isDark ? '#1e293b' : '#e2e8f0', backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)' }}>
                          <ThemedText style={{ width: 50, textAlign: 'center' }}>{h.holeNumber}</ThemedText>
                          <ThemedText style={{ width: 55, textAlign: 'center' }}>{h.strokeIndex}</ThemedText>
                          <ThemedText style={{ width: 60, textAlign: 'center', color: '#888' }}>{h.yardage}</ThemedText>
                          <ThemedText style={{ width: 50, textAlign: 'center' }}>{h.par}</ThemedText>
                          
                          {partners.map((p, pIndex) => {
                            const info = getPlayerHoleInfo(h, p);
                            const flatIndex = front9Offset + index * partners.length + pIndex;
                            let textVal = "";
                            let companionScores: Record<string, number | null> = {};
                            if (h.companionScoresJson) {
                              try {
                                companionScores = typeof h.companionScoresJson === 'string'
                                  ? JSON.parse(h.companionScoresJson)
                                  : h.companionScoresJson;
                              } catch (e) {}
                            }
                            if (p.isPrimary) {
                              textVal = h.score !== null && h.score !== undefined ? String(h.score) : "";
                            } else {
                              textVal = companionScores[p.playerId] !== undefined && companionScores[p.playerId] !== null ? String(companionScores[p.playerId]) : "";
                            }

                            return (
                              <View key={p.playerId} style={{ width: 95, alignItems: 'center', justifyContent: 'center' }}>
                                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
                                  {renderScoreIndicator(info.score, h.par, isDark, textVal)}
                                  <TextInput
                                    ref={(el) => {
                                      inputRefs.current[flatIndex] = el;
                                    }}
                                    keyboardType="numeric"
                                    value={textVal}
                                    onChangeText={(val) => handleMultiplayerScoreChange(h.holeId, p.playerId, val, flatIndex)}
                                    placeholder="-"
                                    placeholderTextColor={isDark ? "#666" : "#999"}
                                    style={{
                                      width: 30,
                                      height: 30,
                                      textAlign: "center",
                                      color: isDark ? "#fff" : "#000",
                                      fontWeight: "700",
                                      fontSize: 13,
                                      zIndex: 10,
                                      backgroundColor: 'transparent',
                                      padding: 0,
                                    }}
                                  />
                                </View>

                                <HStack style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
                                  <TouchableOpacity
                                    onPress={() => handleSandyToggle(h.holeId, p.playerId)}
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: 9,
                                      backgroundColor: info.sandy ? "#2e7d32" : (isDark ? "#333" : "#e5e5e5"),
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: info.sandy ? '#fff' : (isDark ? '#aaa' : '#666') }}>
                                      S
                                    </Text>
                                  </TouchableOpacity>

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
                      </View>
                    );
                  })}

                  {/* BACK 9 TOTALS ROW */}
                  {displayBack && back9Holes.length > 0 && (
                    <HStack style={{ backgroundColor: isDark ? "rgba(38,38,38,0.8)" : "rgba(243,244,246,0.8)", paddingVertical: 10, borderTopWidth: 1, borderColor: isDark ? "#444" : "#ddd" }}>
                      <ThemedText style={{ width: 50, fontWeight: '700', textAlign: 'center' }}>B9</ThemedText>
                      <ThemedText style={{ width: 55, textAlign: 'center' }} />
                      <ThemedText style={{ width: 60, textAlign: 'center' }}>{sumYardage(back9Holes)}</ThemedText>
                      <ThemedText style={{ width: 50, textAlign: 'center' }}>{sumPar(back9Holes)}</ThemedText>
                      {partners.map((p) => {
                        const t = getPlayerTotals(back9Holes, p);
                        return (
                          <VStack key={p.playerId} style={{ width: 95, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#fff' : '#000' }}>
                              G:{t.gross}
                            </Text>
                            {isStableford ? (
                              <Text style={{ fontSize: 9, color: '#f59e0b' }}>Pts:{t.stableford}</Text>
                            ) : (
                              <Text style={{ fontSize: 9, color: '#84cc16' }}>Net:{t.net}</Text>
                            )}
                          </VStack>
                        );
                      })}
                    </HStack>
                  )}

                  {/* GRAND TOTAL */}
                  <HStack
                    style={{
                      marginTop: 10,
                      paddingVertical: 14,
                      backgroundColor: "#8BC34A",
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText style={{ width: 50, textAlign: 'center', color: '#fff', fontWeight: '700' }}>Total</ThemedText>
                    <ThemedText style={{ width: 55, textAlign: 'center' }} />
                    <ThemedText style={{ width: 60, textAlign: 'center', color: '#fff' }}>{sumYardage(holes)}</ThemedText>
                    <ThemedText style={{ width: 50, textAlign: 'center', color: '#fff' }}>{sumPar(holes)}</ThemedText>
                    {partners.map((p) => {
                      const t = getPlayerTotals(holes, p);
                      return (
                        <VStack key={p.playerId} style={{ width: 95, alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
                            G:{t.gross}
                          </Text>
                          {isStableford ? (
                            <Text style={{ fontSize: 9, color: '#fff', fontWeight: '600' }}>Pts:{t.stableford}</Text>
                          ) : (
                            <Text style={{ fontSize: 9, color: '#fff', fontWeight: '600' }}>Net:{t.net}</Text>
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
              marginBottom: 10,
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
                  const summary = getSplitSixSummary(holes);
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
                  const summary = getHighLowSummary(holes);
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
                            Team A ({partners[0].isPrimary ? "You" : partners[0].name} & {partners[1].name})
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
                              fontWeight: "bold",
                              color: "#84cc16",
                            }}
                          >
                            Net: {summary.teamANormalized} pts
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
                            Team B ({partners[2].name} & {partners[3].name})
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
                              fontWeight: "bold",
                              color: "#84cc16",
                            }}
                          >
                            Net: {summary.teamBNormalized} pts
                          </ThemedText>
                        </HStack>
                      </VStack>
                    </VStack>
                  );
                })()}
              </>
            )}
          </VStack>
        )}

        {/* Finish Round Button */}
        <Pressable
          onPress={handleFinishRound}
          disabled={saving}
          className={`mt-6 p-4 rounded-xl mb-4 flex-row justify-center items-center ${saving ? "bg-gray-500" : "bg-[#8BC34A]"}`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-done-outline" size={20} color="white" />
              <Text className="text-white font-bold ml-2 text-lg">
                Finish Round
              </Text>
            </>
          )}
        </Pressable>

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
            const playersToCheck = partners.length >= 2 ? partners : [{ isPrimary: true, playerId: 'p1' }];
            playersToCheck.forEach((partner) => {
              const info = getPlayerHoleInfo(h, partner);
              const s = info.score;
              if (s === null || s === undefined || s <= 0) return;

              if (s === 1) scoreCounts.holeInOne++;
              else {
                const diff = s - h.par;
                if (diff <= -3) scoreCounts.albatross++;
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

          return (
            <View
              className="mb-20 p-4 rounded-2xl"
              style={{
                backgroundColor: isDark ? "#111827" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#1e293b" : "#e5e7eb",
              }}
            >
              <Text
                className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}
              >
                Scorecard Legend
              </Text>
              {(() => {
                const rows: (typeof dynamicLegend)[] = [];
                for (let i = 0; i < dynamicLegend.length; i += 3) {
                  rows.push(dynamicLegend.slice(i, i + 3));
                }
                return rows.map((row, rowIdx) => (
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
                        <View
                          key={idx}
                          style={{ flex: 1, alignItems: "center" }}
                        >
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
                ));
              })()}
            </View>
          );
        })()}
      </ScrollView>
    </ThemedView>
  );
}

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
