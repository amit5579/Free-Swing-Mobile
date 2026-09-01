import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
  AppState,
  AppStateStatus,
  Modal,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

// Components
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Skeleton } from "@/components/Skeleton";
import Watermark from "@/components/watermark";
import { RangefinderModal } from "@/components/rangefinder/RangefinderModal";

// Subcomponents
import { ScoreIndicator } from "./ScoreIndicator";
import { ScoreInputCell } from "./ScoreInputCell";
import { NassauHouses } from "./NassauHouses";
import { ScoringLegend } from "./ScoringLegend";
import { PlayerHeaderRow } from "./PlayerHeaderRow";
import { ScoringTabContent } from "./ScoringTabContent";

// API
import {
  getScorecardDetails,
  updateHoleScoresApi,
  getDelegationStatuses,
  deleteScorecardApi,
} from "@/api/modules/dashboard.api";
import {
  saveScoreCard,
  getScorecardHandicap,
  getScoreCardOpen,
} from "@/api/modules/scoreCard.api";
import { getScoreCardDetails as getNewRoundDetails } from "@/api/modules/newRound.api";

// Utils
import {
  RoundPlayer,
  calculateStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  getHoleXPoints,
  getPlayerHoleInfo,
  normalizeHoleFromApi,
  parseRoundPlayers,
  computeDisplayHalves,
  getScoreLegendCounts,
  computeSplitSixSummary,
  computeHighLowSummary,
  computeNassauState,
} from "@/utils/scorecardUtils";
import { getDraft, saveDraft, deleteDraft } from "@/utils/draftStorage";

export type ScorecardMode = "view" | "resume" | "new-round" | "tournament-play";

export interface UnifiedScorecardProps {
  mode: ScorecardMode;
  scorecardId?: string | number;
  tournamentId?: string | number;
  tournamentName?: string;
  courseId?: string | number;
  teeBoxId?: string | number;
  handicap?: string | number;
  username?: string;
  courseName?: string;
  date?: string;
  holesCount?: string; // "front9", "back9", "18"
  selectedScore?: any;
  roundContextId?: string | null;
  startFrom?: "front" | "back" | string | null;
  scoringType?: string;
  forceNew?: string | boolean;
  onFinishRound?: () => void;
}

export const UnifiedScorecard: React.FC<UnifiedScorecardProps> = ({
  mode,
  scorecardId: propScorecardId,
  tournamentId: propTournamentId,
  tournamentName,
  courseId: propCourseId,
  teeBoxId: propTeeBoxId,
  handicap: propHandicap,
  username,
  courseName: propCourseName,
  date: propDate,
  holesCount: propHolesCount = "18",
  selectedScore,
  roundContextId: propRoundContextId,
  startFrom,
  scoringType: propScoringType,
  forceNew,
  onFinishRound,
}) => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Hide default react navigation header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Main state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [primaryHandicap, setPrimaryHandicap] = useState<number>(
    Number(propHandicap || 0),
  );

  // Scorecard data
  const [holes, setHoles] = useState<any[]>([]);
  const [textScores, setTextScores] = useState<Record<string, string>>({});
  const [partners, setPartners] = useState<RoundPlayer[]>([]);
  const [companionHandicaps, setCompanionHandicaps] = useState<
    Record<string | number, number>
  >({});
  const [delegationStatuses, setDelegationStatuses] = useState<
    Record<number, string>
  >({});

  // Active round context
  const [roundKey, setRoundKey] = useState<string | null>(
    propRoundContextId ? String(propRoundContextId) : null,
  );
  const [groupName, setGroupName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scorecard" | "scoring">(
    "scorecard",
  );
  const [activeCourseHalf, setActiveCourseHalf] = useState<
    "all" | "front" | "back"
  >("all");
  const [nassauStartNine, setNassauStartNine] = useState<"front" | "back">(
    "front",
  );
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // GPS Modal
  const [rangefinderModalVisible, setRangefinderModalVisible] = useState(false);
  const [rangefinderHole, setRangefinderHole] = useState<number | null>(null);

  // Finish confirmation modal
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Refs
  const holesRef = useRef<any[]>([]);
  const textScoresRef = useRef<Record<string, string>>({});
  const debounceSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  useEffect(() => {
    holesRef.current = holes;
  }, [holes]);

  useEffect(() => {
    textScoresRef.current = textScores;
  }, [textScores]);

  // Auth User ID
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("userId");
      if (stored) setUserId(Number(stored));
    };
    loadUser();
  }, []);

  // Determine scoring format and game flags
  const gameConfig = useMemo(() => {
    const first = holes[0] || {};
    const parsedSelectedScore =
      typeof selectedScore === "string"
        ? JSON.parse(selectedScore)
        : selectedScore || {};

    const allScoringStrings = [
      propScoringType,
      first.scoringType,
      first.ScoringType,
      first.tournamentScoringType,
      first.TournamentScoringType,
      first.matchScoringType,
      first.MatchScoringType,
      parsedSelectedScore.scoring_type,
      parsedSelectedScore.scoringType,
      ...holes.map(
        (h) =>
          h.scoringType ||
          h.ScoringType ||
          h.tournamentScoringType ||
          h.TournamentScoringType ||
          h.matchScoringType ||
          h.MatchScoringType,
      ),
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());

    const rawType = String(
      propScoringType ||
      first.scoringType ||
      first.ScoringType ||
      first.matchScoringType ||
      first.tournamentScoringType ||
      first.TournamentScoringType ||
      parsedSelectedScore.scoring_type ||
      parsedSelectedScore.scoringType ||
      ""
    ).toLowerCase();

    const hasStablefordType = allScoringStrings.some((s) =>
      s.includes("stableford"),
    );

    const hasDpType = allScoringStrings.some(
      (s) =>
        s.includes("double-peoria") ||
        s.includes("double_peoria") ||
        s.includes("doublepeoria") ||
        s.includes("dp-") ||
        s.includes("dp ") ||
        s.startsWith("dp"),
    );

    const isDoublePeoria =
      parsedSelectedScore.double_peoria === true ||
      parsedSelectedScore.doublePeoria === true ||
      hasDpType ||
      holes.some(
        (h) =>
          h.isDoublePeoria === true ||
          h.isDoublePeoria === "true" ||
          h.IsDoublePeoria === true,
      );

    const hasSavedStablefordPoints = holes.some(
      (h) =>
        h.stablefordPoints !== null &&
        h.stablefordPoints !== undefined &&
        (h.score !== null && h.score !== undefined && Number(h.score) > 0),
    );

    // Match Web: Detect Stableford if data has points OR type indicates stableford
    const isStableford =
      parsedSelectedScore.stableford === true ||
      parsedSelectedScore.stableford === "true" ||
      hasStablefordType ||
      holes.some(
        (h) =>
          h.isStableford === true ||
          h.isStableford === "true" ||
          h.IsStableford === true,
      ) ||
      hasSavedStablefordPoints;

    const isExcluded =
      parsedSelectedScore.excluded === true ||
      rawType.includes("exclude") ||
      holes.some((h) => h.isExcluded);

    const isGross =
      parsedSelectedScore.gross === true || rawType.includes("gross");

    const isSplit6 =
      parsedSelectedScore.split_six === true ||
      rawType.includes("split_six") ||
      rawType.includes("split-six");

    const isHighLow =
      parsedSelectedScore.high_low === true ||
      rawType.includes("high_low") ||
      rawType.includes("high-low");

    const isNassauBest =
      parsedSelectedScore.nassau_best === true ||
      rawType.includes("nassau_best") ||
      rawType.includes("nassau-best");

    const isNassauCombined =
      parsedSelectedScore.nassau_combined === true ||
      rawType.includes("nassau_combined") ||
      rawType.includes("nassau-combined");

    const isNassau = isNassauBest || isNassauCombined;

    const isSystem36 =
      parsedSelectedScore.isSystem36 === true ||
      rawType.includes("system-36") ||
      rawType.includes("system_36") ||
      holes.some((h) => h.isSystem36);

    const hasMatchTab = isSplit6 || isHighLow || isNassau;

    let formatLabel = "Net Score • Include Par 3";
    if (isSystem36) formatLabel = "System 36";
    else if (isDoublePeoria && isStableford)
      formatLabel = "Stableford";
    else if (isDoublePeoria) formatLabel = "Net Include Par 3";
    else if (isExcluded && !isStableford)
      formatLabel = "Net Score • Exclude Par 3";
    else if (isStableford && !isExcluded) formatLabel = "Stableford";
    else if (isStableford && isExcluded)
      formatLabel = "Stableford • Exclude Par 3";
    else if (isGross) formatLabel = "Gross Score";
    else if (isSplit6) formatLabel = "Split Six";
    else if (isHighLow) formatLabel = "High-Low";
    else if (isNassauBest) formatLabel = "Nassau • Best Score";
    else if (isNassauCombined) formatLabel = "Nassau • Combined Score";

    return {
      isExcluded,
      isStableford,
      isGross,
      isSplit6,
      isHighLow,
      isNassauBest,
      isNassauCombined,
      isNassau,
      isDoublePeoria,
      isSystem36,
      hasMatchTab,
      formatLabel,
      showNetColumns:
        !isGross &&
        !isSystem36 &&
        !isHighLow &&
        !isNassau,
      showPtsColumns: isStableford || isSystem36,
    };
  }, [holes, propScoringType, selectedScore]);

  // Read-only / Companion checks
  const isCompanionView = useMemo(() => {
    if (!roundKey) return false;
    const parts = String(roundKey).split("_");
    if (parts.length >= 2) {
      const groupScorerId = parseInt(parts[1], 10);
      if (
        !isNaN(groupScorerId) &&
        userId !== null &&
        groupScorerId !== userId
      ) {
        return true;
      }
    }
    return false;
  }, [roundKey, userId]);

  const isRoundCompleted = useMemo(() => {
    return Boolean(holes.length > 0 && holes[0]?.isCompleted);
  }, [holes]);

  const isReadOnly = mode === "view" || isRoundCompleted || isCompanionView;

  // ─────────────────────────────────────────────
  // Location Permission & Rangefinder Handler
  // ─────────────────────────────────────────────
  const handleOpenRangefinder = async (holeNumber?: number) => {
    const targetHole = holeNumber ?? holes[0]?.holeNumber ?? 1;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setRangefinderHole(targetHole);
        setRangefinderModalVisible(true);
        return;
      }

      const { status: requestStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (requestStatus === "granted") {
        setRangefinderHole(targetHole);
        setRangefinderModalVisible(true);
      } else {
        Alert.alert(
          "Location Permission Required",
          "Free Swing needs location permission to calculate GPS distances on the course.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (err) {
      console.warn("Location permission check error:", err);
      setRangefinderHole(targetHole);
      setRangefinderModalVisible(true);
    }
  };

  // ─────────────────────────────────────────────
  // Initial Data Fetching
  // ─────────────────────────────────────────────
  const loadScorecardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveId = propScorecardId || propTournamentId;
      const storedUserId = await AsyncStorage.getItem("userId");
      const currentUserId = storedUserId ? Number(storedUserId) : userId;

      let rawHoles: any[] = [];
      let initialPartners: RoundPlayer[] = [];
      let initialKey: string | null = propRoundContextId
        ? String(propRoundContextId)
        : null;
      let effectiveTeeBoxId = propTeeBoxId ? Number(propTeeBoxId) : null;
      let effectiveCourseId = propCourseId ? Number(propCourseId) : null;

      // Mode: view / resume
      if (mode === "view" || mode === "resume") {
        if (effectiveId) {
          try {
            rawHoles = await getScorecardDetails(effectiveId);
          } catch (e) {
            console.warn("Could not fetch details directly:", e);
          }
        }

        // Merge local draft if resuming
        if (mode === "resume" && effectiveId) {
          try {
            const draft = await getDraft(effectiveId);
            if (draft && draft.holes && draft.holes.length > 0) {
              rawHoles = draft.holes.map((h) => ({
                ...h,
                isDoublePeoria: draft.isDoublePeoria ?? h.isDoublePeoria,
                isStableford: draft.isStableford ?? h.isStableford,
                isExcluded: draft.isExcluded ?? h.isExcluded,
                scoringType: draft.scoringType || h.scoringType,
              }));
            }
          } catch (draftErr) {
            console.warn("Draft restore failed:", draftErr);
          }
        }

        // Fetch tournament context to recover scoringType if hole belongs to a tournament
        const detectedTourId =
          propTournamentId ||
          rawHoles?.[0]?.tournamentId ||
          rawHoles?.[0]?.TournamentId;

        if (detectedTourId) {
          try {
            const tourHoles = await getScoreCardOpen(Number(detectedTourId));
            if (Array.isArray(tourHoles) && tourHoles.length > 0) {
              const tourFirst = tourHoles[0];
              const tourScoringType =
                tourFirst?.scoringType ||
                tourFirst?.ScoringType ||
                tourFirst?.tournamentScoringType ||
                tourFirst?.TournamentScoringType;
              const tourIsDoublePeoria =
                tourFirst?.isDoublePeoria ?? tourFirst?.IsDoublePeoria;

              if (tourScoringType !== undefined || tourIsDoublePeoria !== undefined) {
                const normTourType = tourScoringType ? String(tourScoringType).toLowerCase() : "";
                const isTourStableford = normTourType.includes("stableford");
                const isTourDp =
                  tourIsDoublePeoria === true ||
                  normTourType.includes("double-peoria") ||
                  normTourType.includes("dp");

                rawHoles = rawHoles.map((h) => ({
                  ...h,
                  scoringType: tourScoringType || h.scoringType,
                  tournamentScoringType: tourScoringType || h.tournamentScoringType,
                  isDoublePeoria:
                    isTourDp ||
                    (h.isDoublePeoria !== undefined && h.isDoublePeoria !== null
                      ? h.isDoublePeoria
                      : false),
                  isStableford:
                    isTourStableford ||
                    (h.isStableford !== undefined && h.isStableford !== null
                      ? h.isStableford
                      : false),
                }));
              }
            }
          } catch (tourErr) {
            console.warn("Tournament context enrichment error:", tourErr);
          }
        }
      }
      // Mode: new-round
      else if (mode === "new-round") {
        if (propTeeBoxId && propCourseId) {
          rawHoles = await getNewRoundDetails(
            Number(propTeeBoxId),
            Number(propCourseId),
            String(propHolesCount || "18"),
          );
        }

        // Retrieve pending round context if group round
        if (propRoundContextId) {
          try {
            const storedPending = await AsyncStorage.getItem(
              `pending_round_context_v1_${propRoundContextId}`,
            );
            if (storedPending) {
              const parsedContext = JSON.parse(storedPending);
              if (parsedContext.players) {
                initialPartners = parseRoundPlayers(
                  parsedContext.players,
                  currentUserId,
                );
              }
            }
          } catch (e) {
            console.error("Error reading pending round context:", e);
          }
        }

        // Restore local draft for new-round if present and not forceNew
        const draftKey = propRoundContextId
          ? `round_${propRoundContextId}`
          : propCourseId && propTeeBoxId
            ? `draft_${propCourseId}_${propTeeBoxId}`
            : null;

        if (draftKey && !forceNew) {
          try {
            const draft = await getDraft(draftKey);
            if (draft && draft.holes && draft.holes.length > 0) {
              rawHoles = draft.holes;
            }
          } catch (draftErr) {
            console.warn("Local new round draft load warning:", draftErr);
          }
        }
      }
      // Mode: tournament-play
      else if (mode === "tournament-play") {
        if (propTournamentId) {
          rawHoles = await getScoreCardOpen(Number(propTournamentId));
          try {
            const draft = await getDraft(propTournamentId);
            if (draft && draft.holes && draft.holes.length > 0) {
              rawHoles = draft.holes;
            }
          } catch (draftErr) {
            console.warn("Tournament draft restore warning:", draftErr);
          }
        }
      }

      if (!rawHoles || rawHoles.length === 0) {
        setLoading(false);
        return;
      }

      // Deduplicate raw holes by holeNumber (1-18)
      const uniqueHolesMap = new Map<number, any>();
      for (const h of rawHoles) {
        const hNum = Number(h.holeNumber || h.HoleNumber || h.hole_number);
        if (isNaN(hNum)) continue;
        if (!uniqueHolesMap.has(hNum)) {
          uniqueHolesMap.set(hNum, h);
        } else {
          const existing = uniqueHolesMap.get(hNum);
          if (
            h.score !== null &&
            h.score !== undefined &&
            h.score !== "" &&
            (existing.score === null ||
              existing.score === undefined ||
              existing.score === "")
          ) {
            uniqueHolesMap.set(hNum, { ...existing, ...h });
          }
        }
      }
      const uniqueRawHoles =
        uniqueHolesMap.size > 0
          ? Array.from(uniqueHolesMap.values()).sort((a, b) => {
              const numA = Number(a.holeNumber || a.HoleNumber || 0);
              const numB = Number(b.holeNumber || b.HoleNumber || 0);
              return numA - numB;
            })
          : rawHoles;

      // Normalize holes
      const normalizedHoles = uniqueRawHoles.map(normalizeHoleFromApi);
      const first = normalizedHoles[0] || {};

      if (!effectiveTeeBoxId && first.teeBoxId) {
        effectiveTeeBoxId = Number(first.teeBoxId);
      }
      if (!effectiveCourseId && first.courseId) {
        effectiveCourseId = Number(first.courseId);
      }

      // Extract scorecard owner & determine viewer identity
      const scorecardOwnerUserId = first.userId ? Number(first.userId) : null;
      const isViewerOwner = Boolean(
        currentUserId && scorecardOwnerUserId
          ? currentUserId === scorecardOwnerUserId
          : mode !== "view",
      );

      const ownerName =
        username ||
        first.userName ||
        first.playerName ||
        (isViewerOwner ? "You" : "Player 1");

      // Extract Partners
      if (initialPartners.length === 0 && first.playingPartnersJson) {
        initialPartners = parseRoundPlayers(
          first.playingPartnersJson,
          currentUserId,
          ownerName,
        );
      }
      if (initialPartners.length === 0) {
        initialPartners = [
          {
            playerId: scorecardOwnerUserId
              ? String(scorecardOwnerUserId)
              : currentUserId
                ? String(currentUserId)
                : "p1",
            userId: scorecardOwnerUserId || currentUserId,
            name: ownerName,
            isPrimary: true,
            isCurrentUser: isViewerOwner,
            team: 1,
          },
        ];
      }
      setPartners(initialPartners);

      // Extract Playing Group Round Key
      if (first.playingGroupRoundKey) {
        initialKey = String(first.playingGroupRoundKey);
        setRoundKey(initialKey);
      }

      // Extract Group Name
      if (first.groupName) {
        setGroupName(first.groupName);
      }

      // Extract Nassau Start Nine
      if (first.nassauStartingNine === "back" || startFrom === "back") {
        setNassauStartNine("back");
      }

      // Fetch primary handicap if teeBoxId is available
      let fetchedPrimaryHc = Number(propHandicap || 0);
      if (effectiveTeeBoxId) {
        try {
          const hcDetails = await getScorecardHandicap(effectiveTeeBoxId);
          if (hcDetails) {
            fetchedPrimaryHc = Number(
              hcDetails.courseHandicap ??
                hcDetails.handicap ??
                fetchedPrimaryHc,
            );
            setPrimaryHandicap(fetchedPrimaryHc);
          }
        } catch (hcErr) {
          console.warn("Handicap lookup warning:", hcErr);
        }
      }

      // Map Companion Handicaps
      const hcMap: Record<string | number, number> = {};
      initialPartners.forEach((p) => {
        if (!p.isPrimary) {
          const directHc =
            p.appliedHandicap ??
            p.courseHandicap ??
            p.handicap ??
            p.userHandicap;
          if (
            directHc !== undefined &&
            directHc !== null &&
            String(directHc) !== ""
          ) {
            const hVal = Math.round(Number(directHc) || 0);
            if (p.userId) hcMap[p.userId] = hVal;
            if (p.playerId) hcMap[p.playerId] = hVal;
          }
        }
      });
      setCompanionHandicaps(hcMap);

      // Map initial Text Scores
      const initialTextMap: Record<string, string> = {};
      normalizedHoles.forEach((h) => {
        initialPartners.forEach((p) => {
          const key = `${h.holeId}_${p.playerId}`;
          if (p.isPrimary) {
            if (h.score !== null && h.score !== undefined && h.score >= 0) {
              initialTextMap[key] = String(h.score);
            }
          } else if (h.companionScoresJson) {
            try {
              const compScores =
                typeof h.companionScoresJson === "string"
                  ? JSON.parse(h.companionScoresJson)
                  : h.companionScoresJson;
              if (
                compScores &&
                compScores[p.playerId] !== undefined &&
                compScores[p.playerId] !== null
              ) {
                initialTextMap[key] = String(compScores[p.playerId]);
              }
            } catch (e) {}
          }
        });
      });
      setTextScores(initialTextMap);

      // Sanitize holes with calculated net / stableford
      const sanitizedHoles = normalizedHoles.map((h) => {
        const strokeIndex = Number(h.strokeIndex || 0);
        const strokes =
          gameConfig.isExcluded && h.par === 3
            ? 0
            : calculateStrokes(fetchedPrimaryHc, strokeIndex);
        const netScore = calculateNetScore(h.score, strokes, {
          isDoublePeoria: gameConfig.isDoublePeoria,
          isGross: gameConfig.isGross,
        });
        const isStablefordMode = Boolean(
          gameConfig.isStableford || gameConfig.isSystem36,
        );
        const stablefordPoints =
          isStablefordMode && h.score !== null && h.score !== undefined
            ? calculateStablefordPoints(
                netScore,
                h.par,
                gameConfig.isSystem36,
                h.score,
              )
            : null;

        return {
          ...h,
          netScore:
            h.netScore !== null && h.netScore !== undefined
              ? h.netScore
              : netScore,
          stablefordPoints: isStablefordMode
            ? (h.stablefordPoints ?? stablefordPoints)
            : null,
        };
      });

      setHoles(sanitizedHoles);
    } catch (err: any) {
      console.error("Scorecard loading error:", err);
      setError("Failed to load scorecard data.");
    } finally {
      setLoading(false);
    }
  }, [
    mode,
    propScorecardId,
    propTournamentId,
    propTeeBoxId,
    propCourseId,
    propHolesCount,
    propRoundContextId,
    propHandicap,
    username,
    startFrom,
    gameConfig.isDoublePeoria,
    gameConfig.isExcluded,
    gameConfig.isGross,
    gameConfig.isSystem36,
    userId,
  ]);

  useEffect(() => {
    loadScorecardData();
  }, [loadScorecardData]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadScorecardData();
      if (roundKey) {
        try {
          const statuses = await getDelegationStatuses(String(roundKey));
          if (Array.isArray(statuses)) {
            const newStatuses: Record<number, string> = {};
            statuses.forEach((s: any) => {
              newStatuses[s.targetUserId] = (s.status || "").toLowerCase();
            });
            setDelegationStatuses(newStatuses);
          }
        } catch (e) {
          console.error("Delegation refresh error:", e);
        }
      }
    } catch (e) {
      console.error("Scorecard refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [loadScorecardData, roundKey]);

  // ─────────────────────────────────────────────
  // Universal Polling Engine
  // ─────────────────────────────────────────────
  useEffect(() => {
    const effectiveId = propScorecardId || propTournamentId;
    if (!effectiveId && !roundKey) return;

    const pollIntervalTime = isCompanionView ? 5000 : 10000;

    const interval = setInterval(async () => {
      // 1. Delegation Status Poll
      if (roundKey) {
        try {
          const statuses = await getDelegationStatuses(String(roundKey));
          if (Array.isArray(statuses)) {
            const newStatuses: Record<number, string> = {};
            statuses.forEach((s: any) => {
              newStatuses[s.targetUserId] = (s.status || "").toLowerCase();
            });
            setDelegationStatuses(newStatuses);
          }
        } catch (e) {
          console.error("Delegation poll error:", e);
        }
      }

      // 2. Silent Live Scorecard Sync (for read-only or companion views)
      if (effectiveId && (isReadOnly || isCompanionView)) {
        try {
          const liveData = await getScorecardDetails(effectiveId);
          if (Array.isArray(liveData) && liveData.length > 0) {
            const normalized = liveData.map(normalizeHoleFromApi);
            setHoles(normalized);
          }
        } catch (e) {
          console.error("Scorecard live sync error:", e);
        }
      }
    }, pollIntervalTime);

    return () => clearInterval(interval);
  }, [
    propScorecardId,
    propTournamentId,
    roundKey,
    isReadOnly,
    isCompanionView,
  ]);

  // ─────────────────────────────────────────────
  // Auto-Save & Draft Synchronization
  // ─────────────────────────────────────────────
  const syncServerAndDraft = useCallback(
    async (
      updatedHoles: any[],
      updatedTextScores: Record<string, string>,
      isCompleted: boolean = false,
    ) => {
      if (isReadOnly && !isCompleted) return;

      const effectiveId =
        propScorecardId ||
        propTournamentId ||
        holes[0]?.scorecardId ||
        (propRoundContextId ? `round_${propRoundContextId}` : null) ||
        (propCourseId && propTeeBoxId
          ? `draft_${propCourseId}_${propTeeBoxId}`
          : null);

      const currentUserId =
        userId || Number(await AsyncStorage.getItem("userId")) || 0;

      // 1. Save Local Draft
      if (effectiveId && !isCompleted) {
        try {
          const holesPlayed = updatedHoles.filter(
            (h) => h.score !== null && h.score > 0,
          ).length;
          const score = updatedHoles.reduce((s, h) => s + (h.score || 0), 0);
          const netScore = updatedHoles.reduce(
            (s, h) => s + (h.netScore || 0),
            0,
          );
          const par = updatedHoles.reduce((s, h) => s + (h.par || 0), 0);

          await saveDraft({
            scorecardId: effectiveId,
            userId: currentUserId,
            courseName: propCourseName || holes[0]?.courseName || "Scorecard",
            date: propDate || new Date().toISOString(),
            holesPlayed,
            score,
            netScore,
            par,
            courseHalf: propHolesCount || "",
            holes: updatedHoles,
            textScores: updatedTextScores as any,
            isStableford: gameConfig.isStableford,
            isDoublePeoria: gameConfig.isDoublePeoria,
            isExcluded: gameConfig.isExcluded,
            isGross: gameConfig.isGross,
            isSystem36: gameConfig.isSystem36,
            tournamentId: propTournamentId
              ? Number(propTournamentId)
              : holes[0]?.tournamentId || null,
            scoringType:
              gameConfig.isDoublePeoria && gameConfig.isStableford
                ? "double-peoria-stableford"
                : gameConfig.isDoublePeoria
                  ? "double-peoria-net"
                  : gameConfig.isSystem36
                    ? "system-36"
                    : gameConfig.isStableford
                      ? "stableford"
                      : undefined,
          });
        } catch (draftErr) {
          console.error("Failed to save draft:", draftErr);
          Toast.show({
            type: "error",
            text1: "Failed to save draft",
            text2: "Please try again",
          });
        }
      }

      // 2. Save to Server
      try {
        const playingGroupRoundKey = roundKey ? String(roundKey) : undefined;
        const playingPartnersJson =
          partners.length > 0 ? JSON.stringify(partners) : undefined;

        const payload = updatedHoles.map((h) => ({
          courseId: propCourseId ? Number(propCourseId) : h.courseId || null,
          courseHalf:
            propHolesCount === "front9" || propHolesCount === "Front9"
              ? "Front9"
              : propHolesCount === "back9" || propHolesCount === "Back9"
                ? "Back9"
                : h.courseHalf || null,
          teeBoxId: propTeeBoxId ? Number(propTeeBoxId) : h.teeBoxId || null,
          tournamentId: propTournamentId
            ? Number(propTournamentId)
            : h.tournamentId || null,
          holeId: h.holeId,
          score:
            h.score !== undefined && h.score !== null && h.score !== ""
              ? Number(h.score)
              : null,
          netScore: h.netScore,
          stablefordPoints:
            (gameConfig.isStableford || gameConfig.isSystem36) &&
            h.score !== null &&
            h.score !== undefined &&
            h.score !== ""
              ? h.stablefordPoints !== null && h.stablefordPoints !== undefined
                ? Number(h.stablefordPoints)
                : null
              : null,
          roundNumber: h.roundNumber || 1,
          isCompleted: isCompleted,
          isExcluded: gameConfig.isExcluded,
          isDoublePeoria: gameConfig.isDoublePeoria || h.isDoublePeoria || false,
          isSystem36: gameConfig.isSystem36 || h.isSystem36 || false,
          scoringType:
            h.scoringType ||
            (gameConfig.isDoublePeoria && gameConfig.isStableford
              ? "double-peoria-stableford"
              : gameConfig.isDoublePeoria
                ? "double-peoria-net"
                : gameConfig.isSystem36
                  ? "system-36"
                  : gameConfig.isStableford
                    ? "stableford"
                    : null),
          matchScoringType: gameConfig.isSplit6
            ? "split-six"
            : gameConfig.isHighLow
              ? "high-low"
              : gameConfig.isNassauBest
                ? "nassau-best"
                : gameConfig.isNassauCombined
                  ? "nassau-combined"
                  : gameConfig.isGross
                    ? "gross"
                    : h.matchScoringType || null,
          companionScoresJson: h.companionScoresJson || null,
          companionSandysJson: h.companionSandysJson || null,
          companionRsJson: h.companionRsJson || null,
          nassauStartingNine: nassauStartNine,
          groupName: groupName || h.groupName || null,
          userId: currentUserId,
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
        console.log("ppp", payload);

        if (mode === "new-round") {
          await saveScoreCard(payload);
        } else if (effectiveId) {
          await updateHoleScoresApi(effectiveId, payload);
        }

        // If round is completed, clear local draft
        if (isCompleted) {
          if (effectiveId) await deleteDraft(effectiveId);
          if (propRoundContextId)
            await deleteDraft(`round_${propRoundContextId}`);
          if (propCourseId && propTeeBoxId)
            await deleteDraft(`draft_${propCourseId}_${propTeeBoxId}`);
        }
      } catch (err) {
        console.error("Server sync error:", err);
      }
    },
    [
      isReadOnly,
      propScorecardId,
      propTournamentId,
      propCourseId,
      propTeeBoxId,
      propCourseName,
      propDate,
      propHolesCount,
      roundKey,
      partners,
      gameConfig,
      nassauStartNine,
      groupName,
      mode,
      userId,
    ],
  );

  // Debounced auto-save on score input
  const triggerDebouncedSave = (
    nextHoles: any[],
    nextTextScores: Record<string, string>,
  ) => {
    if (debounceSaveTimerRef.current) {
      clearTimeout(debounceSaveTimerRef.current);
    }
    debounceSaveTimerRef.current = setTimeout(() => {
      syncServerAndDraft(nextHoles, nextTextScores, false);
    }, 600);
  };

  // AppState listener to flush saves when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState.match(/inactive|background/)) {
          if (holesRef.current.length > 0) {
            syncServerAndDraft(holesRef.current, textScoresRef.current, false);
          }
        }
      },
    );
    return () => subscription.remove();
  }, [syncServerAndDraft]);

  // Back handler with confirmation if unsaved changes exist
  const handleBack = useCallback(() => {
    if (debounceSaveTimerRef.current) {
      clearTimeout(debounceSaveTimerRef.current);
      syncServerAndDraft(holesRef.current, textScoresRef.current, false);
    }
    router.back();
  }, [router, syncServerAndDraft]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => sub.remove();
    }, [handleBack]),
  );

  // Check if player is allowed to be scored by current user
  const isPlayerApprovedToScore = useCallback(
    (partner: RoundPlayer) => {
      if (partner.isCurrentUser || partner.isPrimary) return true;
      if (partner.userId && roundKey) {
        const status = delegationStatuses[partner.userId]?.toLowerCase();
        if (status) {
          return status === "approved";
        }
      }
      return true;
    },
    [delegationStatuses, roundKey],
  );

  // Focus navigation / Cursor Auto-Advance Ref
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  const moveToNextCell = (currentHoleId: number, currentPlayerId: string) => {
    // Only cycle through approved / editable players
    const editablePartners = partners.filter((p) => isPlayerApprovedToScore(p));
    if (editablePartners.length === 0) return;

    const currentHoleIndex = displayedHoles.findIndex(
      (h) => h.holeId === currentHoleId,
    );
    if (currentHoleIndex === -1) return;

    const currentPartnerIndex = editablePartners.findIndex(
      (p) => p.playerId === currentPlayerId,
    );

    let nextHoleIndex = currentHoleIndex;
    let nextPartnerIndex = currentPartnerIndex + 1;

    // If reached end of partners on current hole, move to next hole
    if (nextPartnerIndex >= editablePartners.length) {
      nextPartnerIndex = 0;
      nextHoleIndex = currentHoleIndex + 1;
    }

    if (nextHoleIndex < displayedHoles.length) {
      const nextHole = displayedHoles[nextHoleIndex];
      const nextPartner = editablePartners[nextPartnerIndex];
      if (nextHole && nextPartner) {
        const nextKey = `${nextHole.holeId}_${nextPartner.playerId}`;
        inputRefs.current[nextKey]?.focus();
      }
    }
  };

  // ─────────────────────────────────────────────
  // Score Input & Sandy/R Handlers
  // ─────────────────────────────────────────────
  const handleScoreChange = (
    holeId: number,
    playerId: string,
    text: string,
  ) => {
    const key = `${holeId}_${playerId}`;
    const nextTextMap = { ...textScores, [key]: text };
    setTextScores(nextTextMap);

    const numericScore = text === "" ? null : Number(text);

    const nextHoles = holes.map((h) => {
      if (h.holeId !== holeId) return h;

      const isPrimary = partners.find(
        (p) => p.playerId === playerId,
      )?.isPrimary;

      let companionScores: Record<string, number | null> = {};
      if (h.companionScoresJson) {
        try {
          companionScores =
            typeof h.companionScoresJson === "string"
              ? JSON.parse(h.companionScoresJson)
              : h.companionScoresJson;
        } catch (e) {}
      }

      companionScores[playerId] = numericScore;
      const companionScoresJson = JSON.stringify(companionScores);

      const primaryScore = isPrimary ? numericScore : h.score;
      const strokeIndex = Number(h.strokeIndex || 0);
      const strokes =
        gameConfig.isExcluded && h.par === 3
          ? 0
          : calculateStrokes(primaryHandicap, strokeIndex);
      const netScore = calculateNetScore(primaryScore, strokes, {
        isDoublePeoria: gameConfig.isDoublePeoria,
        isGross: gameConfig.isGross,
      });
      const isStablefordMode = Boolean(
        gameConfig.isStableford || gameConfig.isSystem36,
      );
      const stablefordPoints =
        isStablefordMode && primaryScore !== null
          ? calculateStablefordPoints(
              netScore,
              h.par,
              gameConfig.isSystem36,
              primaryScore,
            )
          : null;

      return {
        ...h,
        score: primaryScore,
        netScore,
        stablefordPoints,
        companionScoresJson,
      };
    });

    setHoles(nextHoles);
    triggerDebouncedSave(nextHoles, nextTextMap);

    // Auto-advance focus to next hole / next approved player
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    if (text !== "") {
      focusTimeoutRef.current = setTimeout(() => {
        moveToNextCell(holeId, playerId);
      }, 500);
    }
  };

  const handleToggleSandy = (holeId: number, playerId: string) => {
    const nextHoles = holes.map((h) => {
      if (h.holeId !== holeId) return h;

      let companionSandys: Record<string, boolean> = {};
      if (h.companionSandysJson) {
        try {
          companionSandys =
            typeof h.companionSandysJson === "string"
              ? JSON.parse(h.companionSandysJson)
              : h.companionSandysJson;
        } catch (e) {}
      }

      companionSandys[playerId] = !companionSandys[playerId];
      return {
        ...h,
        companionSandysJson: JSON.stringify(companionSandys),
      };
    });

    setHoles(nextHoles);
    triggerDebouncedSave(nextHoles, textScores);
  };

  const handleToggleR = (holeId: number, playerId: string) => {
    const nextHoles = holes.map((h) => {
      if (h.holeId !== holeId) return h;

      let companionRs: Record<string, boolean> = {};
      if (h.companionRsJson) {
        try {
          companionRs =
            typeof h.companionRsJson === "string"
              ? JSON.parse(h.companionRsJson)
              : h.companionRsJson;
        } catch (e) {}
      }

      companionRs[playerId] = !companionRs[playerId];
      return {
        ...h,
        companionRsJson: JSON.stringify(companionRs),
      };
    });

    setHoles(nextHoles);
    triggerDebouncedSave(nextHoles, textScores);
  };

  // ─────────────────────────────────────────────
  // Round Completion / Finish
  // ─────────────────────────────────────────────
  const handleFinishRound = async () => {
    setShowFinishModal(false);
    setSaving(true);
    try {
      await syncServerAndDraft(holes, textScores, true);
      Toast.show({
        type: "success",
        text1: "Scorecard Completed",
        text2: "Your round has been saved successfully.",
      });

      if (onFinishRound) {
        onFinishRound();
      } else {
        router.back();
      }
    } catch (e) {
      console.error("Finishing round error:", e);
      Alert.alert("Error", "Could not complete scorecard. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Display Calculations & Summaries
  // ─────────────────────────────────────────────
  const halvesData = useMemo(() => {
    return computeDisplayHalves(holes, propHolesCount, nassauStartNine);
  }, [holes, propHolesCount, nassauStartNine]);

  const displayedHoles = useMemo(() => {
    if (activeCourseHalf === "front") return halvesData.front9;
    if (activeCourseHalf === "back") return halvesData.back9;
    return halvesData.allSorted;
  }, [activeCourseHalf, halvesData]);

  const legendCounts = useMemo(() => {
    return getScoreLegendCounts(holes, partners);
  }, [holes, partners]);

  // Summaries for Match Formats
  const sideScoringSummaries = useMemo(() => {
    if (gameConfig.isSplit6 && partners.length >= 3) {
      const allHolesData = holes.map((h) => {
        const p1Info = getPlayerHoleInfo(
          h,
          partners[0],
          primaryHandicap,
          companionHandicaps,
          gameConfig,
        );
        const p2Info = getPlayerHoleInfo(
          h,
          partners[1],
          primaryHandicap,
          companionHandicaps,
          gameConfig,
        );
        const p3Info = getPlayerHoleInfo(
          h,
          partners[2],
          primaryHandicap,
          companionHandicaps,
          gameConfig,
        );

        return {
          holeNumber: h.holeNumber,
          p1Score: p1Info.score,
          p2Score: p2Info.score,
          p3Score: p3Info.score,
          p1Net: p1Info.netScore,
          p2Net: p2Info.netScore,
          p3Net: p3Info.netScore,
          par: h.par,
          p1Sandy: p1Info.sandy,
          p2Sandy: p2Info.sandy,
          p3Sandy: p3Info.sandy,
        };
      });
      return { splitSixSummary: computeSplitSixSummary(allHolesData) };
    }

    if (gameConfig.isHighLow && partners.length >= 2) {
      const team1Partners = partners.filter((p) => (p.team ?? 1) === 1);
      const team2Partners = partners.filter((p) => p.team === 2);

      const allHolesData = holes.map((h) => {
        const t1p1 = team1Partners[0]
          ? getPlayerHoleInfo(
              h,
              team1Partners[0],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;
        const t1p2 = team1Partners[1]
          ? getPlayerHoleInfo(
              h,
              team1Partners[1],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;
        const t2p1 = team2Partners[0]
          ? getPlayerHoleInfo(
              h,
              team2Partners[0],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;
        const t2p2 = team2Partners[1]
          ? getPlayerHoleInfo(
              h,
              team2Partners[1],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;

        return {
          holeNumber: h.holeNumber,
          par: h.par,
          teamAScores: [t1p1?.netScore ?? null, t1p2?.netScore ?? null] as [
            number | null,
            number | null,
          ],
          teamBScores: [t2p1?.netScore ?? null, t2p2?.netScore ?? null] as [
            number | null,
            number | null,
          ],
          teamARawScores: [t1p1?.score ?? null, t1p2?.score ?? null] as [
            number | null,
            number | null,
          ],
          teamBRawScores: [t2p1?.score ?? null, t2p2?.score ?? null] as [
            number | null,
            number | null,
          ],
          teamASandys: [Boolean(t1p1?.sandy), Boolean(t1p2?.sandy)] as [
            boolean,
            boolean,
          ],
          teamBSandys: [Boolean(t2p1?.sandy), Boolean(t2p2?.sandy)] as [
            boolean,
            boolean,
          ],
        };
      });
      return { highLowSummary: computeHighLowSummary(allHolesData) };
    }

    if (gameConfig.isNassau && partners.length >= 2) {
      const team1Partners = partners.filter((p) => (p.team ?? 1) === 1);
      const team2Partners = partners.filter((p) => p.team === 2);

      const allHolesData = holes.map((h) => {
        const t1p1 = team1Partners[0]
          ? getPlayerHoleInfo(
              h,
              team1Partners[0],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;
        const t1p2 = team1Partners[1]
          ? getPlayerHoleInfo(
              h,
              team1Partners[1],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;
        const t2p1 = team2Partners[0]
          ? getPlayerHoleInfo(
              h,
              team2Partners[0],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;
        const t2p2 = team2Partners[1]
          ? getPlayerHoleInfo(
              h,
              team2Partners[1],
              primaryHandicap,
              companionHandicaps,
              gameConfig,
            )
          : null;

        return {
          holeNumber: h.holeNumber,
          par: h.par,
          teamANetScores: [t1p1?.netScore ?? null, t1p2?.netScore ?? null],
          teamBNetScores: [t2p1?.netScore ?? null, t2p2?.netScore ?? null],
          teamARawScores: [t1p1?.score ?? null, t1p2?.score ?? null],
          teamBRawScores: [t2p1?.score ?? null, t2p2?.score ?? null],
          teamASandys: [Boolean(t1p1?.sandy), Boolean(t1p2?.sandy)],
          teamBSandys: [Boolean(t2p1?.sandy), Boolean(t2p2?.sandy)],
        };
      });

      return {
        nassauState: computeNassauState(
          gameConfig.isNassauBest ? "best" : "combined",
          allHolesData,
        ),
      };
    }

    return {};
  }, [holes, partners, primaryHandicap, companionHandicaps, gameConfig]);

  // Totals calculations
  const calculateTotalsForPlayer = (player: RoundPlayer, holesList: any[]) => {
    let gross = 0;
    let net = 0;
    let pts = 0;
    let hasScore = false;

    holesList.forEach((h) => {
      const info = getPlayerHoleInfo(
        h,
        player,
        primaryHandicap,
        companionHandicaps,
        gameConfig,
      );
      if (info.score !== null) {
        gross += info.score;
        net += info.netScore ?? 0;
        if (
          info.stablefordPoints !== null &&
          info.stablefordPoints !== undefined
        ) {
          pts += info.stablefordPoints;
        }
        hasScore = true;
      }
    });

    const isPtsMode = Boolean(gameConfig.isStableford || gameConfig.isSystem36);

    return {
      gross: hasScore ? gross : "-",
      net: hasScore ? net : "-",
      pts: isPtsMode && hasScore ? pts : "-",
    };
  };

  const getSubtotal = (holesList: any[]) => {
    return {
      yards: holesList.reduce((s, h) => s + (h.yardage || 0), 0),
      par: holesList.reduce((s, h) => s + (h.par || 0), 0),
    };
  };

  // ─────────────────────────────────────────────
  // Loading Skeleton View
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Watermark />
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-6">
            <Skeleton
              isDark={isDark}
              width={38}
              height={38}
              borderRadius={19}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Skeleton
                isDark={isDark}
                width={180}
                height={20}
                style={{ marginBottom: 6 }}
                borderRadius={4}
              />
              <Skeleton
                isDark={isDark}
                width={110}
                height={14}
                borderRadius={4}
              />
            </View>
          </View>
          <Skeleton
            isDark={isDark}
            width="100%"
            height={48}
            borderRadius={12}
            style={{ marginBottom: 16 }}
          />
          <Skeleton
            isDark={isDark}
            width="100%"
            height={280}
            borderRadius={12}
          />
        </View>
      </ThemedView>
    );
  }

  // ─────────────────────────────────────────────
  // Main Render View
  // ─────────────────────────────────────────────
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Watermark />

      {/* ── Top Header Bar (Back, Title, Completed / Finish Status) ── */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? "#121214" : "#ffffff",
            borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#ffffff" : "#0f172a"}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            numberOfLines={1}
            style={[
              styles.headerTitle,
              { color: isDark ? "#ffffff" : "#0f172a" },
            ]}
          >
            {tournamentName ||
              propCourseName ||
              (holes[0]?.groupName ? `${holes[0].groupName}` : "Scorecard")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? "#9ca3af" : "#64748b" },
            ]}
          >
            {gameConfig.formatLabel} {groupName ? `• ${groupName}` : ""}
          </Text>
        </View>

        {/* Top Right: Completed Status or Finish Button */}
        <View style={styles.headerTopRight}>
          {!isReadOnly ? (
            <TouchableOpacity
              onPress={() => setShowFinishModal(true)}
              style={styles.finishRoundButton}
            >
              <Text style={styles.finishRoundText}>Finish</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyBadgeText}>
                {isCompanionView ? "Live Viewer" : "Completed"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Subheader Controls Bar (Handicap & Inline Action Buttons) ── */}
      <View
        style={[
          styles.subHeaderControlsBar,
          {
            backgroundColor: isDark ? "#18181b" : "#f8fafc",
            borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
          },
        ]}
      >
        <View style={styles.subHeaderLeft}>
          <View
            style={[
              styles.handicapBadge,
              {
                backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9",
                borderColor: isDark ? "#4d7c0f" : "#8bc34a",
              },
            ]}
          >
            <Text
              style={[
                styles.handicapText,
                { color: isDark ? "#8bc34a" : "#2e7d32" },
              ]}
            >
              Handicap:{" "}
              {primaryHandicap !== undefined && primaryHandicap !== null
                ? primaryHandicap
                : 0}
            </Text>
          </View>
        </View>

        {/* Inline Actions: GPS and Eye Details Toggle */}
        <View style={styles.subHeaderRight}>
          <TouchableOpacity
            onPress={() => handleOpenRangefinder(holes[0]?.holeNumber || 1)}
            style={styles.gpsButton}
          >
            <Ionicons
              name="navigate-outline"
              size={14}
              color="#ffffff"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.gpsButtonText}>GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsDetailsVisible(!isDetailsVisible)}
            style={[
              styles.iconActionButton,
              { backgroundColor: isDark ? "#27272a" : "#e2e8f0" },
            ]}
          >
            <Ionicons
              name={isDetailsVisible ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={isDark ? "#ffffff" : "#0f172a"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher (Scorecard vs Match Scoring) */}
      {gameConfig.hasMatchTab && (
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: isDark ? "#18181b" : "#f4f4f5",
              borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
            },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab("scorecard")}
            style={[
              styles.tabItem,
              activeTab === "scorecard" && {
                backgroundColor: isDark ? "#27272a" : "#ffffff",
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                styles.tabItemText,
                {
                  color:
                    activeTab === "scorecard"
                      ? isDark
                        ? "#ffffff"
                        : "#0f172a"
                      : isDark
                        ? "#71717a"
                        : "#a1a1aa",
                },
                activeTab === "scorecard" && styles.tabActiveText,
              ]}
            >
              Scorecard
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("scoring")}
            style={[
              styles.tabItem,
              activeTab === "scoring" && {
                backgroundColor: isDark ? "#27272a" : "#ffffff",
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                styles.tabItemText,
                {
                  color:
                    activeTab === "scoring"
                      ? isDark
                        ? "#ffffff"
                        : "#0f172a"
                      : isDark
                        ? "#71717a"
                        : "#a1a1aa",
                },
                activeTab === "scoring" && styles.tabActiveText,
              ]}
            >
              Side Game Summary
            </Text>
          </Pressable>
        </View>
      )}

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0284c7", "#16a34a"]}
            tintColor={isDark ? "#38bdf8" : "#0284c7"}
          />
        }
      >
        {activeTab === "scoring" && gameConfig.hasMatchTab ? (
          <ScoringTabContent
            mode={
              gameConfig.isSplit6
                ? "split-six"
                : gameConfig.isHighLow
                  ? "high-low"
                  : gameConfig.isNassauBest
                    ? "nassau-best"
                    : "nassau-combined"
            }
            players={partners}
            splitSixSummary={sideScoringSummaries.splitSixSummary}
            highLowSummary={sideScoringSummaries.highLowSummary}
            nassauState={sideScoringSummaries.nassauState}
            isDark={isDark}
          />
        ) : (
          <>
            {/* Player Header Cards (only for multiplayer rounds) */}
            {partners.length > 1 && (
              <PlayerHeaderRow
                players={partners}
                delegationStatuses={delegationStatuses}
                isDark={isDark}
                showTeams={gameConfig.isHighLow || gameConfig.isNassau}
              />
            )}

            {/* Halves Selector (Front 9 / Back 9 / All 18) */}
            <View style={styles.halfFilterRow}>
              <Pressable
                onPress={() => setActiveCourseHalf("all")}
                style={[
                  styles.halfFilterButton,
                  activeCourseHalf === "all"
                    ? styles.halfFilterActive
                    : { backgroundColor: isDark ? "#27272a" : "#e2e8f0" },
                ]}
              >
                <Text
                  style={[
                    styles.halfFilterText,
                    {
                      color:
                        activeCourseHalf === "all"
                          ? "#ffffff"
                          : isDark
                            ? "#a1a1aa"
                            : "#475569",
                    },
                  ]}
                >
                  All 18
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveCourseHalf("front")}
                style={[
                  styles.halfFilterButton,
                  activeCourseHalf === "front"
                    ? styles.halfFilterActive
                    : { backgroundColor: isDark ? "#27272a" : "#e2e8f0" },
                ]}
              >
                <Text
                  style={[
                    styles.halfFilterText,
                    {
                      color:
                        activeCourseHalf === "front"
                          ? "#ffffff"
                          : isDark
                            ? "#a1a1aa"
                            : "#475569",
                    },
                  ]}
                >
                  Front 9
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveCourseHalf("back")}
                style={[
                  styles.halfFilterButton,
                  activeCourseHalf === "back"
                    ? styles.halfFilterActive
                    : { backgroundColor: isDark ? "#27272a" : "#e2e8f0" },
                ]}
              >
                <Text
                  style={[
                    styles.halfFilterText,
                    {
                      color:
                        activeCourseHalf === "back"
                          ? "#ffffff"
                          : isDark
                            ? "#a1a1aa"
                            : "#475569",
                    },
                  ]}
                >
                  Back 9
                </Text>
              </Pressable>
            </View>

            {/* Scorecard Table */}
            <View
              style={[
                styles.tableContainer,
                {
                  backgroundColor: isDark ? "#18181b" : "#ffffff",
                  borderColor: isDark ? "#27272a" : "#e4e4e7",
                },
              ]}
            >
              {/* Table Column Headers */}
              <View
                style={[
                  styles.tableRowHeader,
                  { backgroundColor: isDark ? "#27272a" : "#f1f5f9" },
                ]}
              >
                <Text
                  style={[
                    styles.colHole,
                    { color: isDark ? "#9ca3af" : "#64748b" },
                  ]}
                >
                  Hole
                </Text>
                {isDetailsVisible && (
                  <>
                    <Text
                      style={[
                        styles.colSI,
                        { color: isDark ? "#9ca3af" : "#64748b" },
                      ]}
                    >
                      SI
                    </Text>
                    <Text
                      style={[
                        styles.colYard,
                        { color: isDark ? "#9ca3af" : "#64748b" },
                      ]}
                    >
                      Yds
                    </Text>
                  </>
                )}
                <Text
                  style={[
                    styles.colPar,
                    { color: isDark ? "#9ca3af" : "#64748b" },
                  ]}
                >
                  Par
                </Text>

                {partners.map((partner) => (
                  <View key={partner.playerId} style={styles.colPlayerScores}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.playerScoreHeaderTitle,
                        { color: isDark ? "#ffffff" : "#0f172a" },
                      ]}
                    >
                      {partners.length === 1
                        ? "Score"
                        : partner.isCurrentUser
                          ? "You"
                          : partner.name || "Score"}
                    </Text>
                    {gameConfig.showNetColumns && (
                      <Text
                        style={[
                          styles.subColHeader,
                          { color: isDark ? "#9ca3af" : "#64748b" },
                        ]}
                      >
                        Net
                      </Text>
                    )}
                    {gameConfig.showPtsColumns && (
                      <Text
                        style={[
                          styles.subColHeader,
                          { color: isDark ? "#9ca3af" : "#64748b" },
                        ]}
                      >
                        Pts
                      </Text>
                    )}
                  </View>
                ))}

                {gameConfig.isNassau && (
                  <Text
                    style={[
                      styles.colNassau,
                      { color: isDark ? "#9ca3af" : "#64748b" },
                    ]}
                  >
                    Houses
                  </Text>
                )}
              </View>

              {/* Hole Rows & Subtotals */}
              {(() => {
                const renderHoleRow = (hole: any, index: number) => {
                  const isEven = index % 2 === 0;
                  const holeResult =
                    sideScoringSummaries.nassauState?.holeResults?.[
                      hole.holeNumber
                    ];

                  return (
                    <View
                      key={hole.holeId || hole.holeNumber}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: isEven
                            ? isDark
                              ? "#18181b"
                              : "#ffffff"
                            : isDark
                              ? "#202024"
                              : "#f8fafc",
                          borderBottomColor: isDark ? "#27272a" : "#f1f5f9",
                        },
                      ]}
                    >
                      <View style={styles.colHoleContainer}>
                        <Text
                          style={[
                            styles.colHoleVal,
                            { color: isDark ? "#ffffff" : "#0f172a" },
                          ]}
                        >
                          {hole.holeNumber}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleOpenRangefinder(hole.holeNumber)}
                          style={styles.perHoleGpsButton}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name="locate-outline"
                            size={13}
                            color={isDark ? "#4ade80" : "#16a34a"}
                          />
                        </TouchableOpacity>
                      </View>

                      {isDetailsVisible && (
                        <>
                          <Text
                            style={[
                              styles.colSIVal,
                              { color: isDark ? "#9ca3af" : "#64748b" },
                            ]}
                          >
                            {hole.strokeIndex || "-"}
                          </Text>
                          <Text
                            style={[
                              styles.colYardVal,
                              { color: isDark ? "#9ca3af" : "#64748b" },
                            ]}
                          >
                            {hole.yardage || "-"}
                          </Text>
                        </>
                      )}

                      <Text
                        style={[
                          styles.colParVal,
                          { color: isDark ? "#ffffff" : "#0f172a" },
                        ]}
                      >
                        {hole.par}
                      </Text>

                      {/* Players Score Cells */}
                      {partners.map((partner) => {
                        const holeInfo = getPlayerHoleInfo(
                          hole,
                          partner,
                          primaryHandicap,
                          companionHandicaps,
                          gameConfig,
                        );
                        const key = `${hole.holeId}_${partner.playerId}`;
                        const valueText =
                          textScores[key] ??
                          (holeInfo.score !== null
                            ? String(holeInfo.score)
                            : "");
                        const multiplier = getHoleXPoints(
                          holeInfo.score,
                          hole.par,
                          holeInfo.sandy,
                          holeInfo.r,
                        );

                        return (
                          <View
                            key={partner.playerId}
                            style={styles.colPlayerScores}
                          >
                            <ScoreInputCell
                              score={holeInfo.score}
                              par={hole.par}
                              isReadOnly={isReadOnly}
                              isDark={isDark}
                              valueText={valueText}
                              onChangeText={(t) =>
                                handleScoreChange(
                                  hole.holeId,
                                  partner.playerId,
                                  t,
                                )
                              }
                              sandy={holeInfo.sandy}
                              onToggleSandy={() =>
                                handleToggleSandy(hole.holeId, partner.playerId)
                              }
                              r={holeInfo.r}
                              onToggleR={() =>
                                handleToggleR(hole.holeId, partner.playerId)
                              }
                              multiplier={multiplier}
                              showBadges={
                                gameConfig.isHighLow ||
                                gameConfig.isSplit6 ||
                                gameConfig.isNassau
                              }
                              isPrimary={partner.isPrimary}
                              allowPartnerEdit={
                                !isReadOnly && isPlayerApprovedToScore(partner)
                              }
                              inputRef={(el) => {
                                inputRefs.current[key] = el;
                              }}
                            />

                            {gameConfig.showNetColumns && (
                              <Text
                                style={[
                                  styles.subColVal,
                                  { color: isDark ? "#38bdf8" : "#0284c7" },
                                ]}
                              >
                                {holeInfo.netScore !== null
                                  ? holeInfo.netScore
                                  : "-"}
                              </Text>
                            )}

                            {gameConfig.showPtsColumns && (
                              <Text
                                style={[
                                  styles.subColVal,
                                  { color: isDark ? "#fbbf24" : "#d97706" },
                                ]}
                              >
                                {holeInfo.stablefordPoints !== null
                                  ? holeInfo.stablefordPoints
                                  : "-"}
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* Nassau Houses Cell */}
                      {gameConfig.isNassau && (
                        <View style={styles.colNassau}>
                          <NassauHouses
                            houses={holeResult?.housesDisplay}
                            isDark={isDark}
                            fontSize={11}
                          />
                        </View>
                      )}
                    </View>
                  );
                };

                const renderTotalRow = (
                  label: string,
                  holesSubset: any[],
                  nassauHouses?: number[],
                  isGrandTotal: boolean = false,
                ) => {
                  const subtotal = getSubtotal(holesSubset);

                  return (
                    <View
                      key={`subtotal_${label}`}
                      style={[
                        isGrandTotal
                          ? styles.tableTotalRow
                          : styles.tableSubtotalRow,
                        {
                          backgroundColor: isGrandTotal
                            ? isDark
                              ? "#27272a"
                              : "#e2e8f0"
                            : isDark
                              ? "#202025"
                              : "#f1f5f9",
                          borderTopColor: isGrandTotal
                            ? isDark
                              ? "#3f3f46"
                              : "#cbd5e1"
                            : isDark
                              ? "#27272a"
                              : "#e2e8f0",
                          borderBottomColor: isGrandTotal
                            ? undefined
                            : isDark
                              ? "#27272a"
                              : "#e2e8f0",
                          borderBottomWidth: isGrandTotal ? 0 : 1,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.colHole,
                          {
                            fontWeight: "800",
                            fontSize: isGrandTotal ? 12 : 11,
                            color: isGrandTotal
                              ? isDark
                                ? "#ffffff"
                                : "#0f172a"
                              : isDark
                                ? "#4ade80"
                                : "#16a34a",
                          },
                        ]}
                      >
                        {label}
                      </Text>

                      {isDetailsVisible && (
                        <>
                          <Text style={styles.colSI}>-</Text>
                          <Text
                            style={[
                              styles.colYard,
                              {
                                fontWeight: "700",
                                color: isDark ? "#d1d5db" : "#334155",
                              },
                            ]}
                          >
                            {subtotal.yards}
                          </Text>
                        </>
                      )}

                      <Text
                        style={[
                          styles.colPar,
                          {
                            fontWeight: "800",
                            color: isDark ? "#ffffff" : "#0f172a",
                          },
                        ]}
                      >
                        {subtotal.par}
                      </Text>

                      {partners.map((partner) => {
                        const totals = calculateTotalsForPlayer(
                          partner,
                          holesSubset,
                        );
                        return (
                          <View
                            key={partner.playerId}
                            style={styles.colPlayerScores}
                          >
                            <Text
                              style={[
                                isGrandTotal
                                  ? styles.playerTotalScore
                                  : styles.playerSubtotalScore,
                                { color: isDark ? "#ffffff" : "#0f172a" },
                              ]}
                            >
                              {totals.gross}
                            </Text>
                            {gameConfig.showNetColumns && (
                              <Text
                                style={[
                                  styles.subColVal,
                                  {
                                    fontWeight: "700",
                                    color: isDark ? "#38bdf8" : "#0284c7",
                                  },
                                ]}
                              >
                                {totals.net}
                              </Text>
                            )}
                            {gameConfig.showPtsColumns && (
                              <Text
                                style={[
                                  styles.subColVal,
                                  {
                                    fontWeight: "700",
                                    color: isDark ? "#fbbf24" : "#d97706",
                                  },
                                ]}
                              >
                                {totals.pts}
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {gameConfig.isNassau && (
                        <View style={styles.colNassau}>
                          <NassauHouses
                            houses={nassauHouses}
                            isTotalRow={true}
                            isDark={isDark}
                            fontSize={11}
                          />
                        </View>
                      )}
                    </View>
                  );
                };

                if (
                  activeCourseHalf === "all" &&
                  halvesData.front9.length > 0 &&
                  halvesData.back9.length > 0
                ) {
                  return (
                    <>
                      {/* Front 9 Holes */}
                      {halvesData.front9.map((hole, index) =>
                        renderHoleRow(hole, index),
                      )}

                      {/* Front 9 Subtotal */}
                      {renderTotalRow(
                        "Front 9",
                        halvesData.front9,
                        sideScoringSummaries.nassauState?.front9Houses,
                        false,
                      )}

                      {/* Back 9 Holes */}
                      {halvesData.back9.map((hole, index) =>
                        renderHoleRow(hole, index + halvesData.front9.length),
                      )}

                      {/* Back 9 Subtotal */}
                      {renderTotalRow(
                        "Back 9",
                        halvesData.back9,
                        sideScoringSummaries.nassauState?.back9Houses,
                        false,
                      )}

                      {/* Grand Total */}
                      {renderTotalRow(
                        "Total",
                        halvesData.allSorted,
                        sideScoringSummaries.nassauState?.overallHouses,
                        true,
                      )}
                    </>
                  );
                }

                if (activeCourseHalf === "front") {
                  return (
                    <>
                      {halvesData.front9.map((hole, index) =>
                        renderHoleRow(hole, index),
                      )}
                      {renderTotalRow(
                        "Front 9",
                        halvesData.front9,
                        sideScoringSummaries.nassauState?.front9Houses,
                        true,
                      )}
                    </>
                  );
                }

                if (activeCourseHalf === "back") {
                  return (
                    <>
                      {halvesData.back9.map((hole, index) =>
                        renderHoleRow(hole, index),
                      )}
                      {renderTotalRow(
                        "Back 9",
                        halvesData.back9,
                        sideScoringSummaries.nassauState?.back9Houses,
                        true,
                      )}
                    </>
                  );
                }

                return (
                  <>
                    {displayedHoles.map((hole, index) =>
                      renderHoleRow(hole, index),
                    )}
                    {renderTotalRow(
                      "Total",
                      displayedHoles,
                      sideScoringSummaries.nassauState?.overallHouses,
                      true,
                    )}
                  </>
                );
              })()}
            </View>

            {/* Scorecard Legend */}
            <ScoringLegend counts={legendCounts} isDark={isDark} />
          </>
        )}
      </ScrollView>

      {/* GPS Rangefinder Modal */}
      {rangefinderHole !== null && (
        <RangefinderModal
          visible={rangefinderModalVisible}
          onClose={() => setRangefinderModalVisible(false)}
          holes={holes}
          initialHoleId={
            holes.find((h) => h.holeNumber === rangefinderHole)?.holeId ||
            holes[0]?.holeId ||
            null
          }
          courseName={propCourseName || holes[0]?.courseName}
        />
      )}

      {/* Finish Confirmation Modal */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1f1f23" : "#ffffff" },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={44}
              color="#16a34a"
            />
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#ffffff" : "#0f172a" },
              ]}
            >
              Complete Round?
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: isDark ? "#9ca3af" : "#64748b" },
              ]}
            >
              Are you sure you want to finish and submit this scorecard? Once
              completed, the scorecard will be marked as finalized.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setShowFinishModal(false)}
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: isDark ? "#27272a" : "#f1f5f9" },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: isDark ? "#e4e4e7" : "#475569" },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFinishRound}
                style={styles.modalConfirmButton}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm & Finish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  headerTopRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  subHeaderControlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  subHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  handicapBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  handicapText: {
    fontSize: 11,
    fontWeight: "700",
  },
  gpsButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  gpsButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  iconActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  finishRoundButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  finishRoundText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  readOnlyBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readOnlyBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  tabBar: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabActiveText: {
    fontWeight: "700",
  },
  scrollContainer: {
    padding: 16,
  },
  halfFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  halfFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  halfFilterActive: {
    backgroundColor: "#8bc34a",
  },
  halfFilterText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tableContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableRowHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  tableSubtotalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    borderTopWidth: 1,
  },
  tableTotalRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderTopWidth: 2,
  },
  colHole: {
    width: 44,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  colHoleContainer: {
    width: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  colHoleVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  perHoleGpsButton: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  colSI: {
    width: 28,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
  },
  colSIVal: {
    width: 28,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  colYard: {
    width: 38,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
  },
  colYardVal: {
    width: 38,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
  },
  colPar: {
    width: 30,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  colParVal: {
    width: 30,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },
  colPlayerScores: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  playerScoreHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  subColHeader: {
    fontSize: 10,
    fontWeight: "600",
    width: 24,
    textAlign: "center",
  },
  subColVal: {
    fontSize: 12,
    fontWeight: "600",
    width: 24,
    textAlign: "center",
  },
  playerSubtotalScore: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  playerTotalScore: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  colNassau: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1.3,
    backgroundColor: "#8bc34a",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default UnifiedScorecard;
