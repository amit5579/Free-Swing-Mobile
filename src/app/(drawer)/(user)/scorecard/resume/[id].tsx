import {
  getScorecardDetails,
  ScorecardHole,
  finishScorecardApi,
  updateHoleScoresApi,
  updateScorecardApi,
  getInProgressGames,
} from "@/api/modules/dashboard.api";
import {
  computeSplitSixSummary,
  computeNassauState,
  formatNassauHouses,
  formatNassauHousesSpaced,
  computeHighLowHolePoints,
  calculateSplitSixPoints,
  computeHighLowSummary,
} from "@/utils/scoringEngine";
import { getSubScorecardHandicap } from "@/api/modules/scoreCard.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  getDraft,
  saveDraft,
  deleteDraft,
  getLatestRoundState,
} from "@/utils/draftStorage";
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
import Toast from "react-native-toast-message";

export default function ResumeScorecard() {
  const {
    id,
    handicap: handicapParam,
    courseName: courseNameParam,
    date: dateParam,
  } = useLocalSearchParams<{
    id: string;
    handicap: string;
    courseName?: string;
    date?: string;
  }>();
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
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const textScoresRef = useRef<Record<number, string>>({});
  const holesRef = useRef<ScorecardHole[]>([]);
  const inputRefs = useRef<any[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSaveDraft = async (
    updatedHoles: ScorecardHole[],
    newTextScores: Record<number, string>,
  ) => {
    try {
      const holesPlayed = updatedHoles.filter(
        (h) => h.score !== null && h.score > 0,
      ).length;
      const score = updatedHoles.reduce(
        (sum, h) => sum + (h.score && h.score > 0 ? h.score : 0),
        0,
      );
      const netScore = updatedHoles.reduce(
        (sum, h) => sum + (h.netScore && h.netScore > 0 ? h.netScore : 0),
        0,
      );
      const par = updatedHoles.reduce((sum, h) => sum + (h.par || 0), 0);
      const courseHalf = updatedHoles[0]?.courseHalf || "";
      const currentUserId =
        userId || Number(await AsyncStorage.getItem("userId")) || 0;

      await saveDraft({
        scorecardId: id!,
        userId: currentUserId,
        courseName: courseNameParam || "Unknown Course",
        date: dateParam || new Date().toISOString(),
        holesPlayed,
        score,
        netScore,
        par,
        courseHalf,
        holes: updatedHoles,
        textScores: newTextScores,
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  const [partners, setPartners] = useState<any[]>([]);
  const [companionHandicaps, setCompanionHandicaps] = useState<
    Record<number, number>
  >({});
  const [isHighLow, setIsHighLow] = useState(false);
  const [isSplit6, setIsSplit6] = useState(false);
  const [isGross, setIsGross] = useState(false);
  const [isNassauBest, setIsNassauBest] = useState(false);
  const [isNassauCombined, setIsNassauCombined] = useState(false);
  const isNassau = isNassauBest || isNassauCombined;
  const [roundContextId, setRoundContextId] = useState<string | null>(null);
  const nassauStartingNine =
    holes[0]?.nassauStartingNine || holes[0]?.NassauStartingNine || null;
  const front9Holes =
    nassauStartingNine === "back"
      ? holes.filter((h) => h.holeNumber >= 10)
      : holes.filter((h) => h.holeNumber <= 9);
  const back9Holes =
    nassauStartingNine === "back"
      ? holes.filter((h) => h.holeNumber <= 9)
      : holes.filter((h) => h.holeNumber >= 10);

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
      return holes[0].isExcluded
        ? "Net Score Exclude Par 3"
        : "Net Score Include Par 3";
    }
    return "";
  })();

  const saveToServer = async (holesToSave: ScorecardHole[]) => {
    const performSave = async () => {
      try {
        const playingGroupRoundKey = roundContextId
          ? String(roundContextId)
          : undefined;
        const playingPartnersJson =
          partners.length > 0 ? JSON.stringify(partners) : undefined;

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
          matchScoringType: isSplit6
            ? "split-six"
            : isHighLow
              ? "high-low"
              : isNassauBest
                ? "nassau-best"
                : isNassauCombined
                  ? "nassau-combined"
                  : h.matchScoringType || null,
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
        // console.log(
        //   "SENDING EXACT PAYLOAD TO API:",
        //   JSON.stringify(payload, null, 2),
        // );
        await updateHoleScoresApi(id!, payload);
        // console.log("Successfully synced scorecard:", id);
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
      const currentUserId = storedUserId ? Number(storedUserId) : 0;
      if (storedUserId) setUserId(currentUserId);

      const localDraft = await getDraft(id!);
      let data: ScorecardHole[] | null = null;
      let loadedFromDraft = false;

      try {
        const serverHoles = await getScorecardDetails(id!);
        if (serverHoles && serverHoles.length > 0) {
          const normalizedServerHoles = serverHoles.map((h: any) => ({
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
              h.nassauStartingNine !== undefined &&
              h.nassauStartingNine !== null
                ? h.nassauStartingNine
                : h.NassauStartingNine,
          }));

          const state = getLatestRoundState(
            localDraft,
            normalizedServerHoles,
            dateParam,
          );

          if (state.source === "draft" && localDraft) {
            data = localDraft.holes;
            setTextScores(localDraft.textScores);
            textScoresRef.current = localDraft.textScores;
            loadedFromDraft = true;
          } else {
            data = normalizedServerHoles;

            // Server is newer or no draft exists, save/update local draft with server data
            const sanitized = normalizedServerHoles.map((h) => ({
              ...h,
              score: h.score !== null && h.score !== undefined ? h.score : null,
              netScore: h.netScore,
              stablefordPoints: h.stablefordPoints,
            }));
            const newText: Record<number, string> = {};
            sanitized.forEach((h) => {
              if (h.score !== null && h.score !== undefined && h.score >= 0) {
                newText[h.holeId] = h.score.toString();
              }
            });

            const holesPlayed = sanitized.filter(
              (h) => h.score !== null && h.score > 0,
            ).length;
            const score = sanitized.reduce(
              (sum, h) => sum + (h.score && h.score > 0 ? h.score : 0),
              0,
            );
            const netScore = sanitized.reduce(
              (sum, h) => sum + (h.netScore && h.netScore > 0 ? h.netScore : 0),
              0,
            );
            const par = sanitized.reduce((sum, h) => sum + (h.par || 0), 0);
            const courseHalf = sanitized[0]?.courseHalf || "";

            await saveDraft({
              scorecardId: id!,
              userId: currentUserId || (localDraft ? localDraft.userId : 0),
              courseName:
                courseNameParam ||
                (localDraft ? localDraft.courseName : "Unknown Course"),
              date:
                dateParam ||
                (localDraft ? localDraft.date : new Date().toISOString()),
              holesPlayed,
              score,
              netScore,
              par,
              courseHalf,
              holes: sanitized,
              textScores: newText,
              updatedAt: dateParam || new Date().toISOString(),
            });

            // Update text scores in state/ref
            setTextScores(newText);
            textScoresRef.current = newText;
          }
        }
      } catch (err) {
        console.error("Failed to load from API, checking local draft...");
        if (localDraft) {
          data = localDraft.holes;
          setTextScores(localDraft.textScores);
          textScoresRef.current = localDraft.textScores;
          loadedFromDraft = true;
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
        holesRef.current = sanitizedData;

        // If not loaded from draft, merge API scores into textScoresRef if not already present
        if (!loadedFromDraft) {
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
            parsedPartners =
              typeof firstHole.playingPartnersJson === "string"
                ? JSON.parse(firstHole.playingPartnersJson)
                : firstHole.playingPartnersJson;
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

        if (firstHole) {
          const matchScoring = (
            firstHole.matchScoringType ||
            firstHole.match_scoring_type ||
            firstHole.scoringType ||
            firstHole.scoring_type ||
            ""
          ).toLowerCase();
          const pLength = parsedPartners.length;
          const isHL =
            matchScoring.includes("high-low") ||
            matchScoring.includes("high_low");
          const isS6 =
            matchScoring.includes("split-six") ||
            matchScoring.includes("split_six");
          const isNB =
            matchScoring.includes("nassau-best") ||
            matchScoring.includes("nassau_best");
          const isNC =
            matchScoring.includes("nassau-combined") ||
            matchScoring.includes("nassau_combined");
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
          const playingGroupRoundKey =
            firstHole.playingGroupRoundKey || firstHole.PlayingGroupRoundKey;
          if (playingGroupRoundKey) {
            setRoundContextId(playingGroupRoundKey);
          }

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

        // Determine which halves to display based on courseHalf from API or hole numbers fallback
        const apiCourseHalf = sanitizedData[0].courseHalf;
        if (apiCourseHalf === "Front9" || apiCourseHalf === "Front 9") {
          setDisplayFront(true);
          setDisplayBack(false);
        } else if (apiCourseHalf === "Back9" || apiCourseHalf === "Back 9") {
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
  }, [id, courseNameParam]);

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

    const playingGroupRoundKey = roundContextId
      ? String(roundContextId)
      : undefined;
    const playingPartnersJson =
      partners.length > 0 ? JSON.stringify(partners) : undefined;

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
      matchScoringType: isSplit6
        ? "split-six"
        : isHighLow
          ? "high-low"
          : isNassauBest
            ? "nassau-best"
            : isNassauCombined
              ? "nassau-combined"
              : h.matchScoringType || null,
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
    try {
      await updateHoleScoresApi(id!, payload);
    } catch (err) {
      console.error("Final save failed:", err);
    }

    router.back();
  }, [
    router,
    id,
    userId,
    partners,
    roundContextId,
    isSplit6,
    isHighLow,
    isNassauBest,
    isNassauCombined,
    nassauStartingNine,
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
      : companionHandicaps[partnerUserId] || 0;
    let strokesReceived = calculateStrokes(
      playerHandicap,
      hole.handicap || hole.strokeIndex,
    );
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
      net: hasAnyScore ? (isHighLow ? "-" : net) : "-",
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

  const isExcluded = holes.length > 0 ? holes[0].isExcluded : false;

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
      return "Net Score • Split 6";
    if (!isExcluded && !isStableford && !isSplit6 && isHighLow)
      return "Net Score • High-Low";
    if (isNassauBest) return "Nassau • Best Score";
    if (isNassauCombined) return "Nassau • Combined Score";
    return "";
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

  const renderScoreIndicator = (
    score: number | string | null,
    par: number,
    isDark: boolean,
    textVal: string = "",
  ) => {
    if (score === null || score === "" || score === undefined || textVal === "")
      return null;

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

  const handleMultiplayerScoreChange = (
    holeId: number,
    playerId: string,
    value: string,
    flatIndex: number,
  ) => {
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
          newHole.score = finalVal;
        }

        // recalculate stableford points if isStableford
        if (isStableford) {
          const partner = partners.find((p) => p.playerId === playerId);
          const pHc = partner?.isPrimary
            ? Number(handicap || 0)
            : companionHandicaps[partner?.userId] || 0;
          const strokes = calculateStrokes(pHc, h.strokeIndex);
          const net = finalVal !== null ? finalVal - strokes : 0;
          const pts = h.par - net + 2;
          newHole.stablefordPoints =
            finalVal !== null && finalVal > 0 ? (pts > 0 ? pts : 0) : null;
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

    triggerSaveDraft(updatedHoles, newTextScores);

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
      }, 1500);
    }
  };

  const handleSandyToggle = (holeId: number, playerId: string) => {
    const updatedHoles = holes.map((h) => {
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

    triggerSaveDraft(updatedHoles, textScoresRef.current);

    saveToServer(updatedHoles);
    Toast.show({
      type: "success",
      text1: "You got a sandy!",
    });
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
          ? validScore !== null && validScore > 0
            ? Math.max(0, h.par - netScore + 2)
            : null
          : h.stablefordPoints;

        // console.log("Hole Updated:", {
        //   hole: h.holeNumber,
        //   si: h.strokeIndex,
        //   yard: h.yardage,
        //   par: h.par,
        //   score: validScore !== null && validScore >= 0 ? validScore : "-",
        //   net: netScore > 0 ? netScore : "-",
        // });

        return { ...h, score: validScore, netScore, stablefordPoints };
      }
      return h;
    });

    setHoles(updatedHoles);
    holesRef.current = updatedHoles;

    const newTextScores = { ...textScoresRef.current };
    triggerSaveDraft(updatedHoles, newTextScores);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // console.log("Triggering debounced save to web for scorecard:", id);
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
      }, 1500);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const playingGroupRoundKey = roundContextId
        ? String(roundContextId)
        : undefined;
      const playingPartnersJson =
        partners.length > 0 ? JSON.stringify(partners) : undefined;

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
        matchScoringType: isSplit6
          ? "split-six"
          : isHighLow
            ? "high-low"
            : isNassauBest
              ? "nassau-best"
              : isNassauCombined
                ? "nassau-combined"
                : h.matchScoringType || null,
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
            const playingGroupRoundKey = roundContextId
              ? String(roundContextId)
              : undefined;
            const playingPartnersJson =
              partners.length > 0 ? JSON.stringify(partners) : undefined;

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
              matchScoringType: isSplit6
                ? "split-six"
                : isHighLow
                  ? "high-low"
                  : isNassauBest
                    ? "nassau-best"
                    : isNassauCombined
                      ? "nassau-combined"
                      : h.matchScoringType || "",
              nassauStartingNine: nassauStartingNine,
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
            // console.log("pppp", payload);

            await updateHoleScoresApi(id!, payload);
            await deleteDraft(id!);

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
    if (isHighLow) return "-";
    const total = arr.reduce(
      (t, h) => t + (h.score !== null && h.score >= 0 ? h.score || 0 : 0),
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
        t + (h.score !== null && h.score >= 0 ? (h.stablefordPoints ?? 0) : 0),
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
            {["Hole", "Stroke\nIndex", "Yards", "Par", "Scor", "Net"].map(
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

      <ScrollView className="px-4 flex-1" showsVerticalScrollIndicator={false}>
        {partners.length < 2 ? (
          <>
            <View
              className="z-10 shadow-sm"
              style={{
                backgroundColor: isDark ? "#020617" : "#FFFFFF",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: isDark ? "#1e293b" : "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <View
                className={`flex-row p-3 ${isDark ? "bg-[#111827]" : "bg-slate-50"}`}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
                }}
              >
                {[
                  "Hole",
                  isDetailsVisible && "SI",
                  isDetailsVisible && "Yards",
                  "Par",
                  "Score",
                  "Net",
                  ...(isStableford ? ["Pts"] : []),
                ]
                  .filter(Boolean)
                  .map((h) => (
                    <Text
                      key={h as string}
                      className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                    >
                      {h as string}
                    </Text>
                  ))}
              </View>
            </View>

            <View
              className={`${isDark ? "bg-[#020617]" : "bg-white"} rounded-b-xl overflow-hidden mb-4`}
              style={{
                borderWidth: 1,
                borderTopWidth: 0,
                borderColor: isDark ? "#1e293b" : "#e5e7eb",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {displayFront && front9Holes.length > 0 && (
                <>
                  {front9Holes.map((h, index) => (
                    <View
                      key={h.holeId}
                      className={`flex-row items-center p-3 ${index < 8 ? (isDark ? "border-b border-[#1e293b]" : "border-b border-[#e5e7eb]") : ""}`}
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
                        {/* {h.netScore !== null &&
                            h.netScore !== undefined &&
                            (textScores[h.holeId] || h.score !== null)
                              ? h.netScore
                              : "-"} */}
                        {textScores[h.holeId] !== undefined
                          ? textScores[h.holeId]
                          : h.score !== null && h.score !== undefined
                            ? h.score.toString()
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
                      {nassauStartingNine === "back" ? "Back 9" : "Front 9"}
                    </Text>
                    {isDetailsVisible && (
                      <>
                        <Text className="flex-1" />
                        <Text
                          className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {sumYardage(front9Holes)}
                        </Text>
                      </>
                    )}
                    <Text
                      className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {sumPar(front9Holes)}
                    </Text>
                    <Text
                      className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                    >
                      {sumScores(front9Holes)}
                    </Text>
                    <Text
                      className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                    >
                      {sumNet(front9Holes)}
                    </Text>
                    {isStableford && (
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                      >
                        {sumPts(front9Holes)}
                      </Text>
                    )}
                  </View>
                </>
              )}

              {displayBack && back9Holes.length > 0 && (
                <>
                  {back9Holes.map((h, index) => (
                    <View
                      key={h.holeId}
                      className={`flex-row items-center p-3 ${index < 8 ? (isDark ? "border-b border-[#1e293b]" : "border-b border-[#e5e7eb]") : ""}`}
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
                      {nassauStartingNine === "back" ? "Front 9" : "Back 9"}
                    </Text>
                    {isDetailsVisible && (
                      <>
                        <Text className="flex-1" />
                        <Text
                          className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {sumYardage(back9Holes)}
                        </Text>
                      </>
                    )}
                    <Text
                      className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {sumPar(back9Holes)}
                    </Text>
                    <Text
                      className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}
                    >
                      {sumScores(back9Holes)}
                    </Text>
                    <Text
                      className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                    >
                      {sumNet(back9Holes)}
                    </Text>
                    {isStableford && (
                      <Text
                        className={`flex-1 text-center font-bold text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}
                      >
                        {sumPts(back9Holes)}
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
                {isDetailsVisible && (
                  <>
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
                  </>
                )}
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
            const mode = isNassauBest ? "best" : "combined";
            const teamAPartners =
              partners.length >= 4 ? [partners[0], partners[1]] : [partners[0]];
            const teamBPartners =
              partners.length >= 4 ? [partners[2], partners[3]] : [partners[1]];

            let ns: any = null;
            if (isNassau && partners.length >= 2) {
              const allData = holes.map((h: any) => {
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

            const renderMultiplayerHeaders = () => (
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
                        {`${p.isPrimary ? "You" : p.name} PTS`}
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
                        fontSize: 11,
                      }}
                    >
                      Nassau Pts
                    </ThemedText>
                  </VStack>
                )}
              </HStack>
            );

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
                  {renderMultiplayerHeaders()}

                  {displayFront &&
                    front9Holes.map((h, index) => {
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
                              borderColor: isDark ? "#1e293b" : "#e5e7eb",
                              backgroundColor: isDark ? "#020617" : "#ffffff",
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
                              const flatIndex =
                                index * partners.length + pIndex;
                              let textVal = "";
                              let companionScores: Record<
                                string,
                                number | null
                              > = {};
                              if (h.companionScoresJson) {
                                try {
                                  companionScores =
                                    typeof h.companionScoresJson === "string"
                                      ? JSON.parse(h.companionScoresJson)
                                      : h.companionScoresJson;
                                } catch (e) {}
                              }
                              if (p.isPrimary) {
                                textVal =
                                  h.score !== null && h.score !== undefined
                                    ? String(h.score)
                                    : "";
                              } else {
                                textVal =
                                  companionScores[p.playerId] !== undefined &&
                                  companionScores[p.playerId] !== null
                                    ? String(companionScores[p.playerId])
                                    : "";
                              }

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
                                <View
                                  key={p.playerId}
                                  style={{
                                    width: colPartnerWidth,
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
                                      textVal,
                                    )}
                                    <TextInput
                                      ref={(el) => {
                                        inputRefs.current[flatIndex] = el;
                                      }}
                                      keyboardType="numeric"
                                      value={textVal}
                                      onChangeText={(val) =>
                                        handleMultiplayerScoreChange(
                                          h.holeId,
                                          p.playerId,
                                          val,
                                          flatIndex,
                                        )
                                      }
                                      placeholder="-"
                                      placeholderTextColor={
                                        isDark ? "#666" : "#999"
                                      }
                                      style={{
                                        width: 30,
                                        height: 30,
                                        textAlign: "center",
                                        color: isDark ? "#fff" : "#000",
                                        fontWeight: "700",
                                        fontSize: 13,
                                        zIndex: 10,
                                        backgroundColor: "transparent",
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
                                        <TouchableOpacity
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
                                                ? "#333"
                                                : "#e5e5e5",
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
                                                  ? "#aaa"
                                                  : "#666",
                                            }}
                                          >
                                            S
                                          </Text>
                                        </TouchableOpacity>

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
                              );
                            })}
                            {isSplit6 &&
                              partners.length >= 3 &&
                              (() => {
                                const pts = calculateSplitSixPoints(
                                  getPlayerHoleInfo(h, partners[0]).score,
                                  getPlayerHoleInfo(h, partners[1]).score,
                                  getPlayerHoleInfo(h, partners[2]).score,
                                );
                                const hasScore =
                                  getPlayerHoleInfo(h, partners[0]).score !==
                                    null &&
                                  getPlayerHoleInfo(h, partners[1]).score !==
                                    null &&
                                  getPlayerHoleInfo(h, partners[2]).score !==
                                    null;

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
                                const stats = getHighLowHoleStats(h);
                                const allFilled = stats.isComplete;
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
                                        {allFilled ? stats.teamAMatchPts : "-"}
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
                                        {allFilled ? stats.teamBMatchPts : "-"}
                                      </ThemedText>
                                    </View>
                                  </>
                                );
                              })()}
                            {isNassau && partners.length >= 2 && (
                              <VStack
                                style={{
                                  width: 100,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {(() => {
                                  const hRes = ns?.holeResults[h.holeNumber];
                                  if (!hRes)
                                    return <View style={{ width: 100 }} />;

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
                                      {renderNassauHouses(
                                        hRes.overallHousesDisplay,
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
                                        renderNassauHouses(hRes.housesDisplay)}
                                    </View>
                                  );
                                })()}
                              </VStack>
                            )}
                          </HStack>
                        </View>
                      );
                    })}

                  {/* FRONT 9 TOTALS ROW */}
                  {displayFront && front9Holes.length > 0 && (
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
                            {sumYardage(front9Holes)}
                          </ThemedText>
                        </>
                      )}
                      <ThemedText
                        style={{
                          width: colParWidth,
                          textAlign: "center",
                          fontWeight: "700",
                        }}
                      >
                        {sumPar(front9Holes)}
                      </ThemedText>
                      {partners.map((p) => {
                        const t = getPlayerTotals(front9Holes, p);
                        return (
                          <VStack
                            key={p.playerId}
                            style={{ width: colPartnerWidth, alignItems: "center" }}
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
                        );
                      })}
                      {isSplit6 &&
                        partners.length >= 3 &&
                        (() => {
                          let f9Pts = [0, 0, 0];
                          let hasAnyF9 = false;
                          front9Holes.forEach((fh) => {
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
                              const pts = calculateSplitSixPoints(
                                raw1,
                                raw2,
                                raw3,
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
                          let f9A = 0,
                            f9B = 0;
                          let hasAny = false;
                          front9Holes.forEach((fh: any) => {
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
                                  {hasAny ? f9A : "-"}
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
                                  {hasAny ? f9B : "-"}
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

                  {displayBack &&
                    back9Holes.map((h, index) => {
                      const front9Offset = front9Holes.length * partners.length;
                      return (
                        <View key={h.holeId}>
                          <HStack
                            style={{
                              paddingVertical: 8,
                              alignItems: "center",
                              borderBottomWidth: 0.5,
                              borderColor: isDark ? "#1e293b" : "#e5e7eb",
                              backgroundColor: isDark ? "#020617" : "#ffffff",
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
                              const flatIndex =
                                front9Offset + index * partners.length + pIndex;
                              let textVal = "";
                              let companionScores: Record<
                                string,
                                number | null
                              > = {};
                              if (h.companionScoresJson) {
                                try {
                                  companionScores =
                                    typeof h.companionScoresJson === "string"
                                      ? JSON.parse(h.companionScoresJson)
                                      : h.companionScoresJson;
                                } catch (e) {}
                              }
                              if (p.isPrimary) {
                                textVal =
                                  h.score !== null && h.score !== undefined
                                    ? String(h.score)
                                    : "";
                              } else {
                                textVal =
                                  companionScores[p.playerId] !== undefined &&
                                  companionScores[p.playerId] !== null
                                    ? String(companionScores[p.playerId])
                                    : "";
                              }

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
                                <View
                                  key={p.playerId}
                                  style={{
                                    width: colPartnerWidth,
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
                                      textVal,
                                    )}
                                    <TextInput
                                      ref={(el) => {
                                        inputRefs.current[flatIndex] = el;
                                      }}
                                      keyboardType="numeric"
                                      value={textVal}
                                      onChangeText={(val) =>
                                        handleMultiplayerScoreChange(
                                          h.holeId,
                                          p.playerId,
                                          val,
                                          flatIndex,
                                        )
                                      }
                                      placeholder="-"
                                      placeholderTextColor={
                                        isDark ? "#666" : "#999"
                                      }
                                      style={{
                                        width: 30,
                                        height: 30,
                                        textAlign: "center",
                                        color: isDark ? "#fff" : "#000",
                                        fontWeight: "700",
                                        fontSize: 13,
                                        zIndex: 10,
                                        backgroundColor: "transparent",
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
                                        <TouchableOpacity
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
                                                ? "#333"
                                                : "#e5e5e5",
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
                                                  ? "#aaa"
                                                  : "#666",
                                            }}
                                          >
                                            S
                                          </Text>
                                        </TouchableOpacity>

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
                              );
                            })}

                            {isSplit6 &&
                              partners.length >= 3 &&
                              (() => {
                                const pts = calculateSplitSixPoints(
                                  getPlayerHoleInfo(h, partners[0]).score,
                                  getPlayerHoleInfo(h, partners[1]).score,
                                  getPlayerHoleInfo(h, partners[2]).score,
                                );
                                const hasScore =
                                  getPlayerHoleInfo(h, partners[0]).score !==
                                    null &&
                                  getPlayerHoleInfo(h, partners[1]).score !==
                                    null &&
                                  getPlayerHoleInfo(h, partners[2]).score !==
                                    null;

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
                                const stats = getHighLowHoleStats(h);
                                const allFilled = stats.isComplete;
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
                                        {allFilled ? stats.teamAMatchPts : "-"}
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
                                        {allFilled ? stats.teamBMatchPts : "-"}
                                      </ThemedText>
                                    </View>
                                  </>
                                );
                              })()}
                            {isNassau && partners.length >= 2 && (
                              <VStack
                                style={{
                                  width: colNassauWidth,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {(() => {
                                  const hRes = ns?.holeResults[h.holeNumber];
                                  if (!hRes)
                                    return <View style={{ width: colNassauWidth }} />;

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
                                        renderNassauHouses(hRes.housesDisplay)}
                                    </View>
                                  );
                                })()}
                              </VStack>
                            )}
                          </HStack>
                        </View>
                      );
                    })}

                  {/* BACK 9 TOTALS ROW */}
                  {displayBack && back9Holes.length > 0 && (
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
                            {sumYardage(back9Holes)}
                          </ThemedText>
                        </>
                      )}
                      <ThemedText
                        style={{
                          width: colParWidth,
                          textAlign: "center",
                          fontWeight: "700",
                        }}
                      >
                        {sumPar(back9Holes)}
                      </ThemedText>
                      {partners.map((p) => {
                        const t = getPlayerTotals(back9Holes, p);
                        return (
                          <VStack
                            key={p.playerId}
                            style={{ width: colPartnerWidth, alignItems: "center" }}
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
                        );
                      })}
                      {isSplit6 &&
                        partners.length >= 3 &&
                        (() => {
                          let b9Pts = [0, 0, 0];
                          let hasAnyB9 = false;
                          back9Holes.forEach((bh) => {
                            const raw1 = getPlayerHoleInfo(bh, partners[0]).score;
                            const raw2 = getPlayerHoleInfo(bh, partners[1]).score;
                            const raw3 = getPlayerHoleInfo(bh, partners[2]).score;
                            if (raw1 !== null && raw2 !== null && raw3 !== null) {
                              const pts = calculateSplitSixPoints(raw1, raw2, raw3);
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
                          let b9A = 0,
                            b9B = 0;
                          let hasAny = false;
                          back9Holes.forEach((bh: any) => {
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
                                  {hasAny ? b9A : "-"}
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
                                  {hasAny ? b9B : "-"}
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
                      style={{
                        width: colParWidth,
                        textAlign: "center",
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      {sumPar(holes)}
                    </ThemedText>
                    {partners.map((p) => {
                      const t = getPlayerTotals(holes, p);
                      return (
                        <VStack
                          key={p.playerId}
                          style={{ width: colPartnerWidth, alignItems: "center" }}
                        >
                          <ThemedText
                            style={{
                              fontWeight: "800",
                              color: "#fff",
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
                        let totalA = 0,
                          totalB = 0;
                        let hasAny = false;
                        holes.forEach((th: any) => {
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
                                {hasAny ? totalA : "-"}
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
                                {hasAny ? totalB : "-"}
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
        {partners.length >= 2 && (isSplit6 || isHighLow || isNassau) && (
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
            {/* ── SPLIT SIX SUMMARY ── */}
            {isSplit6 &&
              partners.length >= 3 &&
              (() => {
                const allData = holes.map((h: any) => {
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
                const hasBack = holes.some((h: any) => h.holeNumber > 9);
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
                          color: bold ? "#84cc16" : isDark ? "#fff" : "#4B5563",
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
                        style={{ fontWeight: "700", fontSize: 12, flex: 1 }}
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
                    {hasBack && <SumRow label="7–12" vals={s.segment7_12} />}
                    {hasBack && <SumRow label="13–18" vals={s.segment13_18} />}
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

            {/* ── HIGH-LOW SUMMARY ── */}
            {isHighLow &&
              partners.length >= 4 &&
              (() => {
                const allData = holes.map((h: any) => {
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
                const teamAName = `${partners[0].isPrimary ? "You" : partners[0].name} & ${partners[1].name}`;
                const teamBName = `${partners[2].name} & ${partners[3].name}`;
                const margin = Math.abs(
                  s.finalScore.teamA - s.finalScore.teamB,
                );
                const hasBack = holes.some((h: any) => h.holeNumber > 9);
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
                        style={{ fontWeight: "700", fontSize: 12, flex: 1 }}
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
                    />
                    {hasBack && (
                      <Row
                        label="Back 9"
                        a={s.back9MatchPts.teamA}
                        b={s.back9MatchPts.teamB}
                      />
                    )} */}
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
                const allData = holes.map((h: any) => {
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
                              // borderTopWidth: 0.5,
                              // borderColor: isDark ? "#444" : "#ddd",
                              paddingTop: 10,
                              alignItems: "center",
                              marginTop: 6,
                            }}
                          >
                            <HStack
                              style={{
                                alignItems: "flex-start",
                                // borderBottomWidth: 0.5,
                                // borderColor: isDark ? "#333" : "#e5e5e5",
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
                              <HStack
                                style={{
                                  alignItems: "center",
                                  flex: 2,
                                  flexWrap: "wrap",
                                  justifyContent: "center",
                                }}
                              >
                                <ThemedText
                                  style={{
                                    color: isDark ? "#e2e8f0" : "#334155",
                                    fontSize: 12,
                                    fontWeight: "700",
                                  }}
                                >
                                  Match -{" "}
                                </ThemedText>
                                {renderNassauHouses(ns.overallHouses)}
                                <ThemedText
                                  style={{
                                    color: isDark ? "#e2e8f0" : "#334155",
                                    fontSize: 12,
                                    fontWeight: "700",
                                  }}
                                >
                                  {"  &  Half - "}
                                </ThemedText>
                                {renderNassauHouses(ns.front9Houses)}
                              </HStack>
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
            const playersToCheck =
              partners.length >= 2
                ? partners
                : [{ isPrimary: true, playerId: "p1" }];
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
