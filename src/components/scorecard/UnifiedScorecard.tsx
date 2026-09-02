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
  KeyboardAvoidingView,
  Platform,
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
  finishScorecardApi,
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
  courseHalf?: string; // "Front9", "Back9", etc.
  selectedScore?: any;
  roundContextId?: string | null;
  startFrom?: "front" | "back" | string | null;
  scoringType?: string;
  forceNew?: string | boolean;
  onFinishRound?: () => void;
  isTabScreen?: boolean;
  disableTopInset?: boolean;
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
  courseHalf: propCourseHalf,
  selectedScore,
  roundContextId: propRoundContextId,
  startFrom,
  scoringType: propScoringType,
  forceNew,
  onFinishRound,
  isTabScreen,
  disableTopInset,
}) => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isInsideTabs =
    isTabScreen || mode === "new-round" || mode === "tournament-play";
  const effectiveTopInset =
    disableTopInset || isInsideTabs ? 0 : insets.top;
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
  const [fetchedTournamentName, setFetchedTournamentName] = useState<
    string | null
  >(null);
  const [fetchedCourseName, setFetchedCourseName] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"scorecard" | "scoring">(
    "scorecard",
  );
  const [detectedCourseHalf, setDetectedCourseHalf] = useState<string | null>(
    () => {
      const raw =
        propCourseHalf || (propHolesCount !== "18" ? propHolesCount : "") || "";
      const norm = String(raw)
        .toLowerCase()
        .replace(/[\s-_]/g, "");
      if (norm === "front9" || norm === "front") return "Front9";
      if (norm === "back9" || norm === "back") return "Back9";
      return null;
    },
  );
  const [activeCourseHalf, setActiveCourseHalf] = useState<
    "all" | "front" | "back"
  >(() => {
    const raw =
      propCourseHalf || (propHolesCount !== "18" ? propHolesCount : "") || "";
    const norm = String(raw)
      .toLowerCase()
      .replace(/[\s-_]/g, "");
    if (norm === "front9" || norm === "front") return "front";
    if (norm === "back9" || norm === "back") return "back";
    return "all";
  });
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
        "",
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
        (h.stablefordPoints !== null && h.stablefordPoints !== undefined) ||
        (h.StablefordPoints !== null && h.StablefordPoints !== undefined),
    );

    // Match Web: Detect Stableford if data has points OR type indicates stableford
    const isStableford =
      parsedSelectedScore.stableford === true ||
      parsedSelectedScore.stableford === "true" ||
      parsedSelectedScore.scoringType === "stableford" ||
      parsedSelectedScore.scoring_type === "stableford" ||
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
    else if (isDoublePeoria && isStableford) formatLabel = "Stableford";
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
        !isGross && !isSystem36 && !isHighLow && !isNassau && !isSplit6,
      showPtsColumns:
        !isSplit6 && !isHighLow && !isNassau && (isStableford || isSystem36),
    };
  }, [holes, propScoringType, selectedScore]);

  const displayGroupName = useMemo(() => {
    const directName =
      groupName || holes[0]?.groupName || holes[0]?.GroupName || "";
    return String(directName).trim();
  }, [groupName, holes]);

  const headerTitleText = useMemo(() => {
    if (tournamentName) return tournamentName;
    if (fetchedTournamentName) return fetchedTournamentName;
    if (propCourseName) return propCourseName;
    if (fetchedCourseName) return fetchedCourseName;
    const first = holes[0] || {};
    const holeTournament = first.tournamentName || first.TournamentName;
    if (holeTournament) return holeTournament;
    const holeCourse = first.courseName || first.CourseName;
    if (holeCourse) return holeCourse;
    if (propTournamentId || first.tournamentId || first.TournamentId)
      return "Tournament Scorecard";
    return "Scorecard";
  }, [
    tournamentName,
    fetchedTournamentName,
    propCourseName,
    fetchedCourseName,
    holes,
    propTournamentId,
  ]);

  // Designated Scorer ID for multiplayer / tournament grouped games
  const groupScorerId = useMemo(() => {
    // 1. Check playingGroupRoundKey / roundKey / propRoundContextId
    const effectiveKey =
      roundKey ||
      propRoundContextId ||
      holes[0]?.playingGroupRoundKey ||
      holes[0]?.PlayingGroupRoundKey;
    if (effectiveKey) {
      const parts = String(effectiveKey).split("_");
      if (parts.length >= 2) {
        const rawId =
          parts[0].toLowerCase() === "group" ||
          parts[0].toLowerCase() === "round"
            ? parts[1]
            : parts[0];
        const parsed = parseInt(rawId, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }

    // 2. Check primary partner
    const primary = partners.find((p) => p.isPrimary);
    if (primary?.userId && Number(primary.userId) > 0) {
      return Number(primary.userId);
    }

    // 3. Check scorecard record owner
    if (holes.length > 0) {
      const ownerId = holes[0]?.userId ?? holes[0]?.UserId;
      if (ownerId && Number(ownerId) > 0) {
        return Number(ownerId);
      }
    }

    return null;
  }, [roundKey, propRoundContextId, holes, partners]);

  // Read-only / Companion / Spectator checks
  const isCompanionView = useMemo(() => {
    // Mode 'view' is a normal static scorecard view
    if (mode === "view") return false;
    // Completed rounds are viewed as normal static scorecards
    if (holes.length > 0 && holes[0]?.isCompleted) return false;

    const currentUserId = userId;
    if (!currentUserId) return false;

    // Check if this round is a multiplayer/tournament group round
    const hasGroup =
      partners.length > 1 ||
      Boolean(
        roundKey ||
        propRoundContextId ||
        holes.some((h) => h.playingGroupRoundKey || h.PlayingGroupRoundKey),
      );

    if (hasGroup && groupScorerId !== null) {
      if (currentUserId === groupScorerId) {
        // Current user is the designated round scorer -> can edit
        return false;
      } else {
        // Current user is a non-scorer player -> Spectator / Companion Mode (read-only)
        return true;
      }
    }

    // Fallback: In resume mode, if scorecard belongs to another player
    const ownerId = holes[0]?.userId ?? holes[0]?.UserId;
    if (ownerId && Number(ownerId) !== currentUserId && mode === "resume") {
      return true;
    }

    return false;
  }, [
    mode,
    holes,
    userId,
    partners,
    roundKey,
    propRoundContextId,
    groupScorerId,
  ]);

  const isRoundCompleted = useMemo(() => {
    return Boolean(holes.length > 0 && holes[0]?.isCompleted);
  }, [holes]);

  const isReadOnly = useMemo(() => {
    if (mode === "view") return true;
    if (isRoundCompleted) return true;
    if (isCompanionView) return true;
    return false;
  }, [mode, isRoundCompleted, isCompanionView]);

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
      if (currentUserId && currentUserId !== userId) {
        setUserId(currentUserId);
      }

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
            if (mode === "resume") {
              console.log(
                "=== SCORECARD RESUME API DATA ===",
                JSON.stringify(rawHoles, null, 2),
              );
            }
          } catch (e) {
            console.warn("Could not fetch details directly:", e);
          }
        }

        // Merge local draft if resuming
        if (mode === "resume" && effectiveId) {
          try {
            let draft = await getDraft(effectiveId);
            if (!draft && rawHoles && rawHoles.length > 0) {
              const firstHole = rawHoles[0];
              if (firstHole.courseId && firstHole.teeBoxId) {
                draft = await getDraft(
                  `draft_${firstHole.courseId}_${firstHole.teeBoxId}`,
                );
              }
            }
            console.log(
              "=== SCORECARD RESUME DRAFT DATA ===",
              draft ? JSON.stringify(draft, null, 2) : "No Draft Found",
            );
            if (draft && draft.holes && draft.holes.length > 0) {
              rawHoles = draft.holes.map((h) => {
                const apiHole =
                  rawHoles.find((rh) => rh.holeNumber === h.holeNumber) || {};
                return {
                  ...apiHole,
                  ...h,
                  playingPartnersJson:
                    h.playingPartnersJson ?? apiHole.playingPartnersJson,
                  groupName: h.groupName ?? apiHole.groupName,
                  nassauStartingNine:
                    h.nassauStartingNine ?? apiHole.nassauStartingNine,
                  matchScoringType:
                    h.matchScoringType ?? apiHole.matchScoringType,
                  isSystem36: h.isSystem36 ?? apiHole.isSystem36 ?? false,
                  appliedHandicap:
                    h.appliedHandicap ?? apiHole.appliedHandicap ?? 0,
                  handicapAllowancePercent:
                    h.handicapAllowancePercent ??
                    apiHole.handicapAllowancePercent ??
                    100,
                  isDoublePeoria:
                    draft.isDoublePeoria ??
                    h.isDoublePeoria ??
                    apiHole.isDoublePeoria,
                  isStableford:
                    draft.isStableford ??
                    h.isStableford ??
                    apiHole.isStableford,
                  isExcluded:
                    draft.isExcluded ?? h.isExcluded ?? apiHole.isExcluded,
                  scoringType:
                    draft.scoringType || h.scoringType || apiHole.scoringType,
                };
              });
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

              if (
                tourScoringType !== undefined ||
                tourIsDoublePeoria !== undefined
              ) {
                const normTourType = tourScoringType
                  ? String(tourScoringType).toLowerCase()
                  : "";
                const isTourStableford = normTourType.includes("stableford");
                const isTourDp =
                  tourIsDoublePeoria === true ||
                  normTourType.includes("double-peoria") ||
                  normTourType.includes("dp");

                rawHoles = rawHoles.map((h) => ({
                  ...h,
                  scoringType: tourScoringType || h.scoringType,
                  tournamentScoringType:
                    tourScoringType || h.tournamentScoringType,
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

      // Detect Course Half (Front9 / Back9 / All 18)
      const rawCourseHalf =
        propCourseHalf ||
        (propHolesCount && propHolesCount !== "18" ? propHolesCount : null) ||
        first.courseHalf ||
        first.CourseHalf ||
        (normalizedHoles.some((h) =>
          String(h.courseHalf || "")
            .toLowerCase()
            .includes("front"),
        )
          ? "Front9"
          : null) ||
        (normalizedHoles.some((h) =>
          String(h.courseHalf || "")
            .toLowerCase()
            .includes("back"),
        )
          ? "Back9"
          : null) ||
        null;

      const normHalf = rawCourseHalf
        ? String(rawCourseHalf)
            .toLowerCase()
            .replace(/[\s-_]/g, "")
        : "";
      let filteredHoles = normalizedHoles;
      if (normHalf === "front9" || normHalf === "front") {
        filteredHoles = normalizedHoles.filter((h) => h.holeNumber <= 9);
        setDetectedCourseHalf("Front9");
        setActiveCourseHalf("front");
      } else if (normHalf === "back9" || normHalf === "back") {
        filteredHoles = normalizedHoles.filter((h) => h.holeNumber >= 10);
        setDetectedCourseHalf("Back9");
        setActiveCourseHalf("back");
      } else {
        setDetectedCourseHalf(null);
      }

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
        username || first.userName || first.playerName || "Player 1";

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
      const holeWithKey = uniqueRawHoles.find(
        (h: any) =>
          h.playingGroupRoundKey || h.PlayingGroupRoundKey || h.roundContextId,
      );
      const keyFromHole =
        holeWithKey?.playingGroupRoundKey ||
        holeWithKey?.PlayingGroupRoundKey ||
        holeWithKey?.roundContextId ||
        propRoundContextId;

      if (keyFromHole) {
        initialKey = String(keyFromHole);
        setRoundKey(initialKey);
        try {
          const statuses = await getDelegationStatuses(initialKey);
          if (Array.isArray(statuses)) {
            const newStatuses: Record<number, string> = {};
            statuses.forEach((s: any) => {
              const targetUserId =
                s.targetUserId ??
                s.TargetUserId ??
                s.userId ??
                s.UserId ??
                s.target_user_id ??
                s.playerId;
              const rawStatus = (
                s.status ??
                s.Status ??
                s.delegationStatus ??
                s.DelegationStatus ??
                s.approvalStatus ??
                ""
              )
                .toString()
                .toLowerCase()
                .trim();
              if (targetUserId != null) {
                newStatuses[Number(targetUserId)] = rawStatus;
              }
            });
            setDelegationStatuses(newStatuses);
          }
        } catch (e) {
          console.error("Initial delegation fetch error:", e);
        }
      }

      // Extract Group Name
      const foundGroupName =
        first.groupName ||
        first.GroupName ||
        uniqueRawHoles.find((h: any) => h.groupName || h.GroupName)
          ?.groupName ||
        uniqueRawHoles.find((h: any) => h.groupName || h.GroupName)?.GroupName;
      if (foundGroupName) {
        setGroupName(String(foundGroupName));
      }

      // Extract Tournament Name
      const foundTournamentName =
        first.tournamentName ||
        first.TournamentName ||
        uniqueRawHoles.find((h: any) => h.tournamentName || h.TournamentName)
          ?.tournamentName ||
        uniqueRawHoles.find((h: any) => h.tournamentName || h.TournamentName)
          ?.TournamentName;
      if (foundTournamentName) {
        setFetchedTournamentName(String(foundTournamentName));
      }

      // Extract Course Name
      const foundCourseName =
        first.courseName ||
        first.CourseName ||
        uniqueRawHoles.find((h: any) => h.courseName || h.CourseName)
          ?.courseName ||
        uniqueRawHoles.find((h: any) => h.courseName || h.CourseName)
          ?.CourseName;
      if (foundCourseName) {
        setFetchedCourseName(String(foundCourseName));
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

      // Map initial Text Scores from raw API/draft holes
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

      // Preserve in-memory text scores if user had already entered values
      const inMemoryTextMap = textScoresRef.current || {};
      const mergedTextMap = { ...initialTextMap };
      Object.keys(inMemoryTextMap).forEach((k) => {
        if (inMemoryTextMap[k] !== undefined && inMemoryTextMap[k] !== "") {
          mergedTextMap[k] = inMemoryTextMap[k];
        }
      });
      setTextScores(mergedTextMap);
      textScoresRef.current = mergedTextMap;

      // Sanitize holes with calculated net / stableford while preserving in-memory edits
      const inMemoryHolesMap = new Map(
        (holesRef.current || []).map((h) => [h.holeId || h.holeNumber, h]),
      );

      // Determine data-level mode flags from loaded holes and parameters
      const parsedSelectedScoreObj =
        typeof selectedScore === "string"
          ? JSON.parse(selectedScore)
          : selectedScore || {};

      const allDataScoringStrings = [
        propScoringType,
        parsedSelectedScoreObj.scoring_type,
        parsedSelectedScoreObj.scoringType,
        ...normalizedHoles.map(
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

      const isDataStableford =
        parsedSelectedScoreObj.stableford === true ||
        parsedSelectedScoreObj.stableford === "true" ||
        parsedSelectedScoreObj.scoringType === "stableford" ||
        parsedSelectedScoreObj.scoring_type === "stableford" ||
        allDataScoringStrings.some((s) => s.includes("stableford")) ||
        normalizedHoles.some(
          (h) =>
            h.isStableford === true ||
            h.isStableford === "true" ||
            h.IsStableford === true ||
            (h.stablefordPoints !== null && h.stablefordPoints !== undefined),
        );

      const isDataSystem36 =
        parsedSelectedScoreObj.isSystem36 === true ||
        allDataScoringStrings.some(
          (s) => s.includes("system-36") || s.includes("system_36"),
        ) ||
        normalizedHoles.some((h) => h.isSystem36);

      const isDataDoublePeoria =
        parsedSelectedScoreObj.double_peoria === true ||
        parsedSelectedScoreObj.doublePeoria === true ||
        allDataScoringStrings.some(
          (s) =>
            s.includes("double-peoria") ||
            s.includes("double_peoria") ||
            s.includes("doublepeoria") ||
            s.includes("dp"),
        ) ||
        normalizedHoles.some(
          (h) =>
            h.isDoublePeoria === true ||
            h.isDoublePeoria === "true" ||
            h.IsDoublePeoria === true,
        );

      const isDataExcluded =
        parsedSelectedScoreObj.excluded === true ||
        allDataScoringStrings.some((s) => s.includes("exclude")) ||
        normalizedHoles.some((h) => h.isExcluded);

      const isDataGross =
        parsedSelectedScoreObj.gross === true ||
        allDataScoringStrings.some((s) => s.includes("gross")) ||
        normalizedHoles.some((h) => h.isGross);

      const sanitizedHoles = filteredHoles.map((h) => {
        const inMem = inMemoryHolesMap.get(h.holeId || h.holeNumber);

        // Merge companion scores JSON
        let mergedCompanionScores = h.companionScoresJson;
        if (inMem?.companionScoresJson) {
          try {
            const serverComp =
              typeof h.companionScoresJson === "string"
                ? JSON.parse(h.companionScoresJson)
                : h.companionScoresJson || {};
            const localComp =
              typeof inMem.companionScoresJson === "string"
                ? JSON.parse(inMem.companionScoresJson)
                : inMem.companionScoresJson || {};
            mergedCompanionScores = JSON.stringify({
              ...serverComp,
              ...localComp,
            });
          } catch (e) {
            mergedCompanionScores = inMem.companionScoresJson;
          }
        }

        // Merge companion sandys
        let mergedCompanionSandys = h.companionSandysJson;
        if (inMem?.companionSandysJson) {
          try {
            const serverSandys =
              typeof h.companionSandysJson === "string"
                ? JSON.parse(h.companionSandysJson)
                : h.companionSandysJson || {};
            const localSandys =
              typeof inMem.companionSandysJson === "string"
                ? JSON.parse(inMem.companionSandysJson)
                : inMem.companionSandysJson || {};
            mergedCompanionSandys = JSON.stringify({
              ...serverSandys,
              ...localSandys,
            });
          } catch (e) {
            mergedCompanionSandys = inMem.companionSandysJson;
          }
        }

        // Merge companion Rs
        let mergedCompanionRs = h.companionRsJson;
        if (inMem?.companionRsJson) {
          try {
            const serverRs =
              typeof h.companionRsJson === "string"
                ? JSON.parse(h.companionRsJson)
                : h.companionRsJson || {};
            const localRs =
              typeof inMem.companionRsJson === "string"
                ? JSON.parse(inMem.companionRsJson)
                : inMem.companionRsJson || {};
            mergedCompanionRs = JSON.stringify({
              ...serverRs,
              ...localRs,
            });
          } catch (e) {
            mergedCompanionRs = inMem.companionRsJson;
          }
        }

        const effectivePrimaryScore =
          inMem?.score !== undefined && inMem?.score !== null
            ? inMem.score
            : h.score;

        const effectiveIsExcluded = isDataExcluded;
        const effectiveIsDoublePeoria = isDataDoublePeoria;
        const effectiveIsGross = isDataGross;
        const effectiveIsStableford = isDataStableford;
        const effectiveIsSystem36 = isDataSystem36;

        const strokeIndex = Number(h.strokeIndex || 0);
        const strokes =
          effectiveIsExcluded && h.par === 3
            ? 0
            : calculateStrokes(fetchedPrimaryHc, strokeIndex);
        const netScore = calculateNetScore(effectivePrimaryScore, strokes, {
          isDoublePeoria: effectiveIsDoublePeoria,
          isGross: effectiveIsGross,
        });
        const isStablefordMode = Boolean(
          effectiveIsStableford || effectiveIsSystem36,
        );
        const calculatedPoints =
          isStablefordMode &&
          effectivePrimaryScore !== null &&
          effectivePrimaryScore !== undefined
            ? calculateStablefordPoints(
                netScore,
                h.par,
                effectiveIsSystem36,
                effectivePrimaryScore,
              )
            : null;

        return {
          ...h,
          score: effectivePrimaryScore,
          isStableford: effectiveIsStableford || h.isStableford,
          isDoublePeoria: effectiveIsDoublePeoria || h.isDoublePeoria,
          isExcluded: effectiveIsExcluded || h.isExcluded,
          isSystem36: effectiveIsSystem36 || h.isSystem36,
          companionScoresJson: mergedCompanionScores,
          companionSandysJson: mergedCompanionSandys,
          companionRsJson: mergedCompanionRs,
          netScore:
            h.netScore !== null && h.netScore !== undefined && !inMem
              ? h.netScore
              : netScore,
          stablefordPoints:
            h.stablefordPoints !== null && h.stablefordPoints !== undefined
              ? h.stablefordPoints
              : isStablefordMode
                ? calculatedPoints
                : null,
        };
      });

      setHoles(sanitizedHoles);
      holesRef.current = sanitizedHoles;
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
    propScoringType,
    selectedScore,
    username,
    startFrom,
  ]);

  useEffect(() => {
    loadScorecardData();
  }, [loadScorecardData]);

  // ─────────────────────────────────────────────
  // Universal Polling Engine
  // ─────────────────────────────────────────────
  useEffect(() => {
    const effectiveId = propScorecardId || propTournamentId;
    const effectiveKey = roundKey || propRoundContextId;
    if (!effectiveId && !effectiveKey) return;

    const pollIntervalTime = isCompanionView ? 5000 : 10000;

    const interval = setInterval(async () => {
      // 1. Delegation Status Poll
      if (effectiveKey) {
        try {
          const statuses = await getDelegationStatuses(String(effectiveKey));
          if (Array.isArray(statuses)) {
            const newStatuses: Record<number, string> = {};
            statuses.forEach((s: any) => {
              const targetUserId =
                s.targetUserId ??
                s.TargetUserId ??
                s.userId ??
                s.UserId ??
                s.target_user_id ??
                s.playerId;
              const rawStatus = (
                s.status ??
                s.Status ??
                s.delegationStatus ??
                s.DelegationStatus ??
                s.approvalStatus ??
                ""
              )
                .toString()
                .toLowerCase()
                .trim();
              if (targetUserId != null) {
                newStatuses[Number(targetUserId)] = rawStatus;
              }
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
            courseHalf:
              detectedCourseHalf ||
              propCourseHalf ||
              (propHolesCount !== "18" ? propHolesCount : "") ||
              "",
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
          scorecardId: h.scorecardId || propScorecardId || undefined,
          courseId: propCourseId ? Number(propCourseId) : h.courseId || null,
          courseHalf:
            detectedCourseHalf === "Front9" ||
            propCourseHalf === "Front9" ||
            propCourseHalf === "front9" ||
            propHolesCount === "front9" ||
            propHolesCount === "Front9"
              ? "Front9"
              : detectedCourseHalf === "Back9" ||
                  propCourseHalf === "Back9" ||
                  propCourseHalf === "back9" ||
                  propHolesCount === "back9" ||
                  propHolesCount === "Back9"
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
          isDoublePeoria:
            gameConfig.isDoublePeoria || h.isDoublePeoria || false,
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
        // console.log("ppp", payload);

        const targetId =
          effectiveId ||
          holes[0]?.scorecardId ||
          holesRef.current[0]?.scorecardId;

        if (mode === "new-round" && !targetId) {
          const res = await saveScoreCard(payload);

          let newId = null;
          if (Array.isArray(res) && res.length > 0) {
            newId = res[0].scorecardId || res[0].id;
          } else if (res && typeof res === "object") {
            newId = res.scorecardId || res.id;
          }

          if (newId) {
            setHoles((prev) => prev.map((h) => ({ ...h, scorecardId: newId })));
            holesRef.current = holesRef.current.map((h) => ({
              ...h,
              scorecardId: newId,
            }));
          }
        } else if (targetId) {
          const updatedPayload = payload.map((h) => ({
            ...h,
            scorecardId: targetId,
          }));
          await updateHoleScoresApi(targetId, updatedPayload);
        } else {
          await saveScoreCard(payload);
        }

        // If round is completed, clear local draft
        if (isCompleted) {
          if (effectiveId) await deleteDraft(effectiveId);
          if (propRoundContextId)
            await deleteDraft(`round_${propRoundContextId}`);

          const delCourseId = propCourseId || holes[0]?.courseId;
          const delTeeBoxId = propTeeBoxId || holes[0]?.teeBoxId;
          if (delCourseId && delTeeBoxId) {
            await deleteDraft(`draft_${delCourseId}_${delTeeBoxId}`);
          }
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

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (holesRef.current && holesRef.current.length > 0 && mode !== "view") {
        await syncServerAndDraft(holesRef.current, textScoresRef.current || {});
      }
      const effectiveKey = roundKey || propRoundContextId;
      if (effectiveKey) {
        try {
          const statuses = await getDelegationStatuses(String(effectiveKey));
          if (Array.isArray(statuses)) {
            const newStatuses: Record<number, string> = {};
            statuses.forEach((s: any) => {
              const targetUserId =
                s.targetUserId ??
                s.TargetUserId ??
                s.userId ??
                s.UserId ??
                s.target_user_id ??
                s.playerId;
              const rawStatus = (
                s.status ??
                s.Status ??
                s.delegationStatus ??
                s.DelegationStatus ??
                s.approvalStatus ??
                ""
              )
                .toString()
                .toLowerCase()
                .trim();
              if (targetUserId != null) {
                newStatuses[Number(targetUserId)] = rawStatus;
              }
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
  }, [loadScorecardData, roundKey, mode, syncServerAndDraft]);

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
      if (propTournamentId) return true;
      const effectiveKey = roundKey || propRoundContextId;
      if (partner.userId && effectiveKey) {
        const uid = Number(partner.userId);
        const raw = (
          (uid != null ? delegationStatuses[uid] : "") ||
          (partner.userId != null
            ? (delegationStatuses as any)[partner.userId]
            : "") ||
          (partner.playerId
            ? (delegationStatuses as any)[partner.playerId]
            : "") ||
          ""
        )
          .toString()
          .toLowerCase()
          .trim();

        const isApproved =
          raw === "approved" ||
          raw === "accepted" ||
          raw.includes("approv") ||
          raw.includes("accept") ||
          raw === "true" ||
          raw === "1";

        return isApproved;
      }
      return true;
    },
    [delegationStatuses, roundKey, propRoundContextId, propTournamentId],
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
    const partnerObj = partners.find((p) => p.playerId === playerId);
    if (partnerObj && !isPlayerApprovedToScore(partnerObj)) {
      Toast.show({
        type: "info",
        text1: "Pending Approval",
        text2: `${partnerObj.name} has not approved this round yet.`,
      });
      return;
    }

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
    const partnerObj = partners.find((p) => p.playerId === playerId);
    if (partnerObj && !isPlayerApprovedToScore(partnerObj)) {
      Toast.show({
        type: "info",
        text1: "Pending Approval",
        text2: `${partnerObj.name} has not approved this round yet.`,
      });
      return;
    }

    let nowActive = false;
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
      nowActive = companionSandys[playerId];
      return {
        ...h,
        companionSandysJson: JSON.stringify(companionSandys),
      };
    });

    setHoles(nextHoles);
    triggerDebouncedSave(nextHoles, textScores);

    if (nowActive) {
      Toast.show({
        type: "success",
        text1: "You got an Sandy.",
      });
    }
  };

  const handleToggleR = (holeId: number, playerId: string) => {
    const partnerObj = partners.find((p) => p.playerId === playerId);
    if (partnerObj && !isPlayerApprovedToScore(partnerObj)) {
      Toast.show({
        type: "info",
        text1: "Pending Approval",
        text2: `${partnerObj.name} has not approved this round yet.`,
      });
      return;
    }

    let nowActive = false;
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
      nowActive = companionRs[playerId];
      return {
        ...h,
        companionRsJson: JSON.stringify(companionRs),
      };
    });

    setHoles(nextHoles);
    triggerDebouncedSave(nextHoles, textScores);

    if (nowActive) {
      Toast.show({
        type: "success",
        text1: "You got an Regulation.",
      });
    }
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
    return computeDisplayHalves(
      holes,
      detectedCourseHalf || propCourseHalf || propHolesCount,
      nassauStartNine,
    );
  }, [
    holes,
    detectedCourseHalf,
    propCourseHalf,
    propHolesCount,
    nassauStartNine,
  ]);

  const displayedHoles = useMemo(() => {
    if (activeCourseHalf === "front") return halvesData.front9;
    if (activeCourseHalf === "back") return halvesData.back9;
    return halvesData.allSorted;
  }, [activeCourseHalf, halvesData]);

  const isNineHoleOnly = useMemo(() => {
    return Boolean(
      detectedCourseHalf === "Front9" ||
      detectedCourseHalf === "Back9" ||
      (halvesData.front9.length > 0 && halvesData.back9.length === 0) ||
      (halvesData.back9.length > 0 && halvesData.front9.length === 0),
    );
  }, [detectedCourseHalf, halvesData]);

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
          p1Regulation: p1Info.r,
          p2Regulation: p2Info.r,
          p3Regulation: p3Info.r,
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
          teamAScores: [t1p1?.score ?? null, t1p2?.score ?? null] as [
            number | null,
            number | null,
          ],
          teamBScores: [t2p1?.score ?? null, t2p2?.score ?? null] as [
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
          teamARs: [Boolean(t1p1?.r), Boolean(t1p2?.r)] as [boolean, boolean],
          teamBRs: [Boolean(t2p1?.r), Boolean(t2p2?.r)] as [boolean, boolean],
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
          teamARs: [Boolean(t1p1?.r), Boolean(t1p2?.r)],
          teamBRs: [Boolean(t2p1?.r), Boolean(t2p2?.r)],
        };
      });

      return {
        nassauState: computeNassauState(
          gameConfig.isNassauBest ? "best" : "combined",
          allHolesData,
          nassauStartNine,
        ),
      };
    }

    return {};
  }, [
    holes,
    partners,
    primaryHandicap,
    companionHandicaps,
    gameConfig,
    nassauStartNine,
  ]);

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

  // Primary player totals for Header Handicap display (DP HC / Sys36 HC)
  const primaryTotals = useMemo(() => {
    const primary =
      partners.find((p) => p.isPrimary || p.isCurrentUser) || partners[0];
    if (!primary) return { gross: 0, net: 0, pts: 0, hasScore: false };
    let gross = 0;
    let net = 0;
    let pts = 0;
    let hasScore = false;
    holes.forEach((h) => {
      const info = getPlayerHoleInfo(
        h,
        primary,
        primaryHandicap,
        companionHandicaps,
        gameConfig,
      );
      if (info.score !== null && info.score !== undefined && info.score >= 0) {
        gross += info.score;
        net += info.netScore ?? info.score;
        if (
          info.stablefordPoints !== null &&
          info.stablefordPoints !== undefined
        ) {
          pts += info.stablefordPoints;
        }
        hasScore = true;
      }
    });
    return { gross, net, pts, hasScore };
  }, [holes, partners, primaryHandicap, companionHandicaps, gameConfig]);

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
      <ThemedView
        style={[styles.container, { paddingTop: effectiveTopInset }]}
      >
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
    <ThemedView style={[styles.container, { paddingTop: effectiveTopInset }]}>
      <Watermark />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* ── Top Header Bar (Back, Title, Completed / Finish Status) ── */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: isDark
                ? "rgba(18, 18, 20, 0.55)"
                : "rgba(255, 255, 255, 0.55)",
              borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
              paddingVertical: isInsideTabs ? 6 : 12,
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.headerTitle,
                  { color: isDark ? "#ffffff" : "#0f172a", flexShrink: 1 },
                ]}
              >
                {headerTitleText}
              </Text>
            </View>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDark ? "#9ca3af" : "#64748b" },
              ]}
            >
              {gameConfig.formatLabel}
            </Text>
            {displayGroupName ? (
              <View
                style={[
                  styles.groupBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(139, 195, 74, 0.2)"
                      : "rgba(139, 195, 74, 0.15)",
                    borderColor: isDark ? "#8bc34a" : "#689f38",
                  },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={11}
                  color={isDark ? "#a3e635" : "#33691e"}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.groupBadgeText,
                    { color: isDark ? "#a3e635" : "#33691e" },
                  ]}
                >
                  {displayGroupName}
                </Text>
              </View>
            ) : null}
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
              isCompanionView && (
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyBadgeText}>Live Viewer</Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* ── Subheader Controls Bar (Handicap & Inline Action Buttons) ── */}
        <View
          style={[
            styles.subHeaderControlsBar,
            {
              backgroundColor: isDark
                ? "rgba(24, 24, 27, 0.45)"
                : "rgba(248, 250, 252, 0.45)",
              borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
            },
          ]}
        >
          <View style={styles.subHeaderLeft}>
            {!gameConfig.isDoublePeoria &&
              !gameConfig.isSystem36 &&
              partners.length <= 1 && (
                <View
                  style={[
                    styles.handicapBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(139,195,74,0.15)"
                        : "rgba(232, 245, 233, 0.50)",
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
              )}

            {gameConfig.isDoublePeoria && (
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <View
                  style={[
                    styles.handicapBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(139,195,74,0.15)"
                        : "rgba(232, 245, 233, 0.50)",
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
                    Declared HC: {primaryHandicap ?? 0}
                  </Text>
                </View>
                <View
                  style={[
                    styles.handicapBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(148,163,184,0.15)"
                        : "rgba(241, 245, 249, 0.50)",
                      borderColor: isDark ? "#64748b" : "#94a3b8",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.handicapText,
                      { color: isDark ? "#cbd5e1" : "#475569" },
                    ]}
                  >
                    DP HC:{" "}
                    {isReadOnly &&
                    primaryTotals.hasScore &&
                    primaryTotals.gross > 0
                      ? primaryTotals.gross - primaryTotals.net
                      : "NIL"}
                  </Text>
                </View>
              </View>
            )}

            {gameConfig.isSystem36 && (
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <View
                  style={[
                    styles.handicapBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(139,195,74,0.15)"
                        : "rgba(232, 245, 233, 0.50)",
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
                    Declared HC: {primaryHandicap ?? 0}
                  </Text>
                </View>
                <View
                  style={[
                    styles.handicapBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(148,163,184,0.15)"
                        : "rgba(241, 245, 249, 0.50)",
                      borderColor: isDark ? "#64748b" : "#94a3b8",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.handicapText,
                      { color: isDark ? "#cbd5e1" : "#475569" },
                    ]}
                  >
                    Sys36 HC:{" "}
                    {primaryTotals.hasScore && primaryTotals.gross > 0
                      ? Math.min(24, Math.max(0, 36 - primaryTotals.pts))
                      : "NIL"}
                  </Text>
                </View>
              </View>
            )}
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
                {
                  backgroundColor: isDark
                    ? "rgba(39, 39, 42, 0.45)"
                    : "rgba(226, 232, 240, 0.45)",
                },
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

        {/* Multiplayer Companion View Banner */}
        {isCompanionView && (
          <View
            style={[
              styles.companionBanner,
              {
                backgroundColor: isDark ? "#0c4a6e33" : "#e0f2fe",
                borderColor: isDark ? "#0284c7" : "#bae6fd",
              },
            ]}
          >
            <Ionicons
              name="radio-outline"
              size={22}
              color={isDark ? "#38bdf8" : "#0284c7"}
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.companionBannerTitle,
                  { color: isDark ? "#38bdf8" : "#0369a1" },
                ]}
              >
                Multiplayer Companion View
              </Text>
              <Text
                style={[
                  styles.companionBannerSub,
                  { color: isDark ? "#94a3b8" : "#475569" },
                ]}
              >
                The round scorer is entering scores for this round. Your
                scorecard updates in real-time.
              </Text>
            </View>
          </View>
        )}

        {/* Tab Switcher (Scorecard vs Match Scoring) */}
        {gameConfig.hasMatchTab && (
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: isDark
                  ? "rgba(24, 24, 27, 0.45)"
                  : "rgba(244, 244, 245, 0.45)",
                borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
              },
            ]}
          >
            <Pressable
              onPress={() => setActiveTab("scorecard")}
              style={[
                styles.tabItem,
                activeTab === "scorecard" && {
                  backgroundColor: isDark
                    ? "rgba(39, 39, 42, 0.60)"
                    : "rgba(255, 255, 255, 0.60)",
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
                  backgroundColor: isDark
                    ? "rgba(39, 39, 42, 0.60)"
                    : "rgba(255, 255, 255, 0.60)",
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
                Game Summary
              </Text>
            </Pressable>
          </View>
        )}

        {/* Main Scroll Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
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

              {/* Halves Selector (Front 9 / Back 9 / All 18) - only for 18-hole rounds */}
              {!isNineHoleOnly && (
                <View style={styles.halfFilterRow}>
                  <Pressable
                    onPress={() => setActiveCourseHalf("all")}
                    style={[
                      styles.halfFilterButton,
                      activeCourseHalf === "all"
                        ? styles.halfFilterActive
                        : {
                            backgroundColor: isDark
                              ? "rgba(39, 39, 42, 0.35)"
                              : "rgba(226, 232, 240, 0.35)",
                          },
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
                        : {
                            backgroundColor: isDark
                              ? "rgba(39, 39, 42, 0.35)"
                              : "rgba(226, 232, 240, 0.35)",
                          },
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
                        : {
                            backgroundColor: isDark
                              ? "rgba(39, 39, 42, 0.35)"
                              : "rgba(226, 232, 240, 0.35)",
                          },
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
              )}

              {/* Scorecard Table */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ minWidth: "100%" }}
              >
                <View
                  style={[
                    styles.tableContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(24, 24, 27, 0.30)"
                        : "rgba(255, 255, 255, 0.30)",
                      borderColor: isDark ? "#27272a" : "#e4e4e7",
                      minWidth: "100%",
                    },
                  ]}
                >
                  {/* Table Column Headers */}
                  <View
                    style={[
                      styles.tableRowHeader,
                      {
                        backgroundColor: isDark
                          ? "rgba(39, 39, 42, 0.45)"
                          : "rgba(241, 245, 249, 0.45)",
                      },
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
                      <View
                        key={partner.playerId}
                        style={styles.colPlayerScores}
                      >
                        <View style={styles.colScoreInputWrapper}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.playerScoreHeaderTitle,
                              { color: isDark ? "#ffffff" : "#0f172a" },
                            ]}
                          >
                            {partners.length === 1 ? "Score" : partner.name}
                          </Text>
                        </View>
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

                    {gameConfig.isSplit6 && (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {partners.slice(0, 3).map((partner) => (
                          <Text
                            key={`split6_hdr_${partner.playerId}`}
                            numberOfLines={2}
                            style={[
                              styles.colSplitSixPts,
                              { color: isDark ? "#9ca3af" : "#64748b" },
                            ]}
                          >
                            {partner.name}
                            {"\n"}Pts
                          </Text>
                        ))}
                      </View>
                    )}

                    {gameConfig.isNassau && (
                      <Text
                        style={[
                          styles.colNassau,
                          {
                            color: isDark ? "#9ca3af" : "#64748b",
                            textAlign: "center",
                          },
                        ]}
                      >
                        Nassau{"\n"}Pts
                      </Text>
                    )}

                    {gameConfig.isHighLow && (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={[
                            styles.colTeamPts,
                            { color: isDark ? "#9ca3af" : "#64748b" },
                          ]}
                        >
                          Team A
                        </Text>
                        <Text
                          style={[
                            styles.colTeamPts,
                            { color: isDark ? "#9ca3af" : "#64748b" },
                          ]}
                        >
                          Team B
                        </Text>
                      </View>
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
                                  ? "rgba(24, 24, 27, 0.20)"
                                  : "rgba(255, 255, 255, 0.20)"
                                : isDark
                                  ? "rgba(32, 32, 36, 0.20)"
                                  : "rgba(248, 250, 252, 0.20)",
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
                              onPress={() =>
                                handleOpenRangefinder(hole.holeNumber)
                              }
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

                            const isWinningTeamA =
                              (holeResult?.winner === "teamA" ||
                                (holeResult?.winner as any) === 1) &&
                              (partner.team === 1 ||
                                partner.team === undefined);
                            const isWinningTeamB =
                              (holeResult?.winner === "teamB" ||
                                (holeResult?.winner as any) === 2) &&
                              partner.team === 2;
                            const isWinner = isWinningTeamA || isWinningTeamB;

                            const nassauCellBg =
                              gameConfig.isNassau && isWinner
                                ? isWinningTeamA
                                  ? isDark
                                    ? "rgba(25, 135, 84, 0.28)"
                                    : "rgba(25, 135, 84, 0.15)"
                                  : isDark
                                    ? "rgba(13, 110, 253, 0.28)"
                                    : "rgba(13, 110, 253, 0.15)"
                                : undefined;

                            return (
                              <View
                                key={partner.playerId}
                                style={[
                                  styles.colPlayerScores,
                                  !!nassauCellBg && {
                                    backgroundColor: nassauCellBg,
                                    borderRadius: 6,
                                    paddingVertical: 2,
                                  },
                                ]}
                              >
                                <View style={styles.colScoreInputWrapper}>
                                  <ScoreInputCell
                                    score={holeInfo.score}
                                    par={hole.par}
                                    isReadOnly={isReadOnly}
                                    isDark={isDark}
                                    valueText={valueText}
                                    cellBackgroundColor={nassauCellBg}
                                    onChangeText={(t) =>
                                      handleScoreChange(
                                        hole.holeId,
                                        partner.playerId,
                                        t,
                                      )
                                    }
                                    sandy={holeInfo.sandy}
                                    onToggleSandy={() =>
                                      handleToggleSandy(
                                        hole.holeId,
                                        partner.playerId,
                                      )
                                    }
                                    r={holeInfo.r}
                                    onToggleR={() =>
                                      handleToggleR(
                                        hole.holeId,
                                        partner.playerId,
                                      )
                                    }
                                    onDisabledPress={() => {
                                      if (isReadOnly) return;
                                      if (partner.userId) {
                                        const uid = Number(partner.userId);
                                        const raw = (
                                          (uid != null
                                            ? delegationStatuses[uid]
                                            : "") ||
                                          (partner.userId != null
                                            ? (delegationStatuses as any)[
                                                partner.userId
                                              ]
                                            : "") ||
                                          (partner.playerId
                                            ? (delegationStatuses as any)[
                                                partner.playerId
                                              ]
                                            : "") ||
                                          ""
                                        )
                                          .toString()
                                          .toLowerCase()
                                          .trim();

                                        if (
                                          raw === "rejected" ||
                                          raw === "declined" ||
                                          raw.includes("reject") ||
                                          raw.includes("declin") ||
                                          raw === "0" ||
                                          raw === "false"
                                        ) {
                                          Toast.show({
                                            type: "error",
                                            text1: "Request Declined",
                                            text2: `${partner.name} declined participation in this round.`,
                                          });
                                        } else {
                                          Toast.show({
                                            type: "info",
                                            text1: "Pending Approval",
                                            text2: `${partner.name} has not approved this round yet.`,
                                          });
                                        }
                                      }
                                    }}
                                    multiplier={multiplier}
                                    showBadges={
                                      gameConfig.isHighLow ||
                                      gameConfig.isSplit6 ||
                                      gameConfig.isNassau
                                    }
                                    isPrimary={partner.isPrimary}
                                    allowPartnerEdit={
                                      !isReadOnly &&
                                      isPlayerApprovedToScore(partner)
                                    }
                                    inputRef={(el) => {
                                      inputRefs.current[key] = el;
                                    }}
                                  />
                                </View>

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

                          {/* Split-Six Points Cell */}
                          {gameConfig.isSplit6 && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {partners.slice(0, 3).map((partner, pIdx) => {
                                const pts =
                                  sideScoringSummaries.splitSixSummary
                                    ?.holeResults?.[hole.holeNumber]?.[pIdx];
                                const displayPts =
                                  pts !== undefined ? String(pts) : "-";
                                return (
                                  <Text
                                    key={`split6_pts_${hole.holeId || hole.holeNumber}_${partner.playerId}`}
                                    style={[
                                      styles.colSplitSixPts,
                                      {
                                        color: isDark ? "#ffffff" : "#0f172a",
                                        fontWeight: "700",
                                      },
                                    ]}
                                  >
                                    {displayPts}
                                  </Text>
                                );
                              })}
                            </View>
                          )}

                          {/* Nassau Houses Cell */}
                          {gameConfig.isNassau && (
                            <View style={styles.colNassau}>
                              <NassauHouses
                                overallHouses={holeResult?.overallHousesDisplay}
                                halfHouses={holeResult?.housesDisplay}
                                isSecondNine={
                                  nassauStartNine === "back"
                                    ? hole.holeNumber <= 9
                                    : hole.holeNumber >= 10
                                }
                                isDark={isDark}
                                fontSize={12}
                              />
                            </View>
                          )}

                          {/* High-Low Team Points Cell */}
                          {gameConfig.isHighLow && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={[
                                  styles.colTeamPts,
                                  {
                                    color: isDark ? "#ffffff" : "#0f172a",
                                    fontWeight: "700",
                                  },
                                ]}
                              >
                                {sideScoringSummaries.highLowSummary
                                  ?.holeResults?.[hole.holeNumber]?.teamA ??
                                  "-"}
                              </Text>
                              <Text
                                style={[
                                  styles.colTeamPts,
                                  {
                                    color: isDark ? "#ffffff" : "#0f172a",
                                    fontWeight: "700",
                                  },
                                ]}
                              >
                                {sideScoringSummaries.highLowSummary
                                  ?.holeResults?.[hole.holeNumber]?.teamB ??
                                  "-"}
                              </Text>
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
                                  ? "rgba(39, 39, 42, 0.45)"
                                  : "rgba(226, 232, 240, 0.45)"
                                : isDark
                                  ? "rgba(32, 32, 37, 0.35)"
                                  : "rgba(241, 245, 249, 0.35)",
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
                                fontSize: isGrandTotal ? 13 : 12,
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
                                <View style={styles.colScoreInputWrapper}>
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
                                </View>
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

                          {/* Split-Six Points Total Cell */}
                          {gameConfig.isSplit6 && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {partners.slice(0, 3).map((partner, pIdx) => {
                                let totalPts = 0;
                                holesSubset.forEach((h) => {
                                  const pts =
                                    sideScoringSummaries.splitSixSummary
                                      ?.holeResults?.[h.holeNumber]?.[pIdx];
                                  if (pts !== undefined) totalPts += pts;
                                });
                                return (
                                  <Text
                                    key={`split6_tot_${label}_${partner.playerId}`}
                                    style={[
                                      styles.colSplitSixPts,
                                      {
                                        color: isDark ? "#ffffff" : "#0f172a",
                                        fontWeight: isGrandTotal
                                          ? "800"
                                          : "700",
                                      },
                                    ]}
                                  >
                                    {totalPts}
                                  </Text>
                                );
                              })}
                            </View>
                          )}

                          {gameConfig.isNassau && (
                            <View style={styles.colNassau}>
                              <NassauHouses
                                houses={nassauHouses}
                                isTotalRow={true}
                                isDark={isDark}
                                fontSize={12}
                              />
                            </View>
                          )}

                          {gameConfig.isHighLow && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={[
                                  styles.colTeamPts,
                                  {
                                    color: isDark ? "#ffffff" : "#0f172a",
                                    fontWeight: "800",
                                  },
                                ]}
                              >
                                {isGrandTotal
                                  ? sideScoringSummaries.highLowSummary
                                      ?.overallMatchPts?.teamA || 0
                                  : (holesSubset === halvesData.front9
                                      ? sideScoringSummaries.highLowSummary
                                          ?.front9MatchPts?.teamA
                                      : sideScoringSummaries.highLowSummary
                                          ?.back9MatchPts?.teamA) || 0}
                              </Text>
                              <Text
                                style={[
                                  styles.colTeamPts,
                                  {
                                    color: isDark ? "#ffffff" : "#0f172a",
                                    fontWeight: "800",
                                  },
                                ]}
                              >
                                {isGrandTotal
                                  ? sideScoringSummaries.highLowSummary
                                      ?.overallMatchPts?.teamB || 0
                                  : (holesSubset === halvesData.front9
                                      ? sideScoringSummaries.highLowSummary
                                          ?.front9MatchPts?.teamB
                                      : sideScoringSummaries.highLowSummary
                                          ?.back9MatchPts?.teamB) || 0}
                              </Text>
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
                      const firstHalf = halvesData.isBackStart
                        ? halvesData.back9
                        : halvesData.front9;
                      const firstLabel = halvesData.isBackStart
                        ? "Back 9"
                        : "Front 9";
                      const firstNassauHouses = halvesData.isBackStart
                        ? sideScoringSummaries.nassauState?.back9Houses
                        : sideScoringSummaries.nassauState?.front9Houses;

                      const secondHalf = halvesData.isBackStart
                        ? halvesData.front9
                        : halvesData.back9;
                      const secondLabel = halvesData.isBackStart
                        ? "Front 9"
                        : "Back 9";
                      const secondNassauHouses = halvesData.isBackStart
                        ? sideScoringSummaries.nassauState?.front9Houses
                        : sideScoringSummaries.nassauState?.back9Houses;

                      return (
                        <>
                          {/* First 9 Holes (Back 9 if isBackStart, else Front 9) */}
                          {firstHalf.map((hole, index) =>
                            renderHoleRow(hole, index),
                          )}

                          {/* First 9 Subtotal */}
                          {renderTotalRow(
                            firstLabel,
                            firstHalf,
                            firstNassauHouses,
                            false,
                          )}

                          {/* Second 9 Holes */}
                          {secondHalf.map((hole, index) =>
                            renderHoleRow(hole, index + firstHalf.length),
                          )}

                          {/* Second 9 Subtotal */}
                          {renderTotalRow(
                            secondLabel,
                            secondHalf,
                            secondNassauHouses,
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
              </ScrollView>

              {/* Scorecard Legend (only for single player rounds) */}
              {partners.length <= 1 && (
                <ScoringLegend counts={legendCounts} isDark={isDark} />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* GPS Rangefinder Overlay */}
      {rangefinderModalVisible && (
        <RangefinderModal
          visible={rangefinderModalVisible}
          onClose={() => {
            setRangefinderModalVisible(false);
            setRangefinderHole(null);
          }}
          holes={holes}
          initialHoleId={
            rangefinderHole !== null
              ? holes.find((h) => h.holeNumber === rangefinderHole)?.holeId ||
                holes[0]?.holeId ||
                null
              : holes[0]?.holeId || null
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
    paddingBottom: 280,
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
    paddingVertical: 8,
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
    fontSize: 13,
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
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: "500",
  },
  colSIVal: {
    width: 28,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  colYard: {
    width: 38,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
  colYardVal: {
    width: 38,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
  colPar: {
    width: 30,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
  colParVal: {
    width: 30,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  colPlayerScores: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
  colScoreInputWrapper: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  playerScoreHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  subColHeader: {
    fontSize: 12,
    fontWeight: "600",
    width: 32,
    textAlign: "center",
  },
  subColVal: {
    fontSize: 13,
    fontWeight: "600",
    width: 32,
    textAlign: "center",
  },
  colTeamPts: {
    width: 44,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  colSplitSixPts: {
    width: 46,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  playerSubtotalScore: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  playerTotalScore: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  colNassau: {
    minWidth: 70,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 7,
    alignSelf: "flex-start",
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  companionBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  companionBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  companionBannerSub: {
    fontSize: 12,
    marginTop: 2,
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
