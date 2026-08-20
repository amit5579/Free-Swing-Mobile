import {
  AppState,
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  TextInput,
  Modal,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateHoleScoresApi } from "@/api/modules/dashboard.api";
import Watermark from "@/components/watermark";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { RangefinderModal } from "@/components/rangefinder/RangefinderModal";
// import {
//   getScorecardHandicap,
//   getScoreCardOpen,
//   saveScoreCard,
// } from "@/api/modules/scoreCard.api";
import Toast from "react-native-toast-message";
import { Box } from "@/components/box";

import {
  fetchScoreCardOpen,
  fetchHandicap,
} from "@/redux/slices/userScorecard.slice";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { RootState } from "@/redux/store";

export default function PlayScoreCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  const navigation = useNavigation();

  const { tournamentId, teeBoxId, courseId, scoringType } =
    useLocalSearchParams();

  const dispatch = useAppDispatch();

  const { loading, scorecardData, handicapData, error } = useAppSelector(
    (state: RootState) => state.userScoreCard as any,
  );

  // const [loading, setLoading] = useState(false);
  const [scoreCard, setScoreCard] = useState<any>([]);
  // const [handicapData, setHandicap] = useState<any>([]);
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const userIdRef = useRef<number | null>(null);
  const scoreCardRef = useRef<any>([]);
  const timeoutRef = useRef<any>(null);
  const focusTimeoutRef = useRef<any>(null);

  const [roundPlayers, setRoundPlayers] = useState<any[]>([]);
  const [playingGroupRoundKey, setPlayingGroupRoundKey] = useState<
    string | null
  >(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [activeRangefinderHole, setActiveRangefinderHole] = useState<number | null>(null);

  useEffect(() => {    
    if (scorecardData) {
      // parse playingPartnersJson if it exists
      const firstWithPlayers = scorecardData.find(
        (item: any) => item.playingPartnersJson || item.PlayingPartnersJson,
      );
      let players = [];
      if (firstWithPlayers) {
        try {
          const jsonStr =
            firstWithPlayers.playingPartnersJson ||
            firstWithPlayers.PlayingPartnersJson;
          players = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Error parsing playingPartnersJson:", e);
        }
      }

      if (players.length === 0) {
        players = [
          {
            playerId: "p1",
            userId: userId,
            name: "You",
            isPrimary: true,
          },
        ];
      }
      setRoundPlayers(players);

      const firstWithRoundKey = scorecardData.find(
        (item: any) => item.playingGroupRoundKey || item.PlayingGroupRoundKey,
      );
      if (firstWithRoundKey) {
        setPlayingGroupRoundKey(
          firstWithRoundKey.playingGroupRoundKey ||
            firstWithRoundKey.PlayingGroupRoundKey,
        );
      }

      const parsedScoreCard = scorecardData.map((hole: any) => {
        let companionScores = {};
        if (hole.companionScoresJson || hole.CompanionScoresJson) {
          try {
            companionScores = JSON.parse(
              hole.companionScoresJson || hole.CompanionScoresJson,
            );
          } catch (e) {}
        }
        return {
          ...hole,
          companionScores,
        };
      });

      setScoreCard(parsedScoreCard);
    }
  }, [scorecardData, userId]);

  const isStablefordStr = Array.isArray(scoringType) ? scoringType[0] : scoringType;
  const isStableford =
    isStablefordStr ? isStablefordStr.toLowerCase().includes("stableford") : false;

  const renderScoringType =
    scorecardData && scorecardData.length > 0
      ? scorecardData[0].isSystem36
        ? "System 36"
        : (isStableford || scorecardData[0].stablefordPoints != null)
          ? "Stableford"
          : scorecardData[0].isExcluded
            ? "Net Score Exclude Par 3"
            : "Net Score Include Par 3"
      : "";

  const showNetColumns =
    renderScoringType === "Net Score Include Par 3" ||
    renderScoringType === "Net Score Exclude Par 3" ||
    renderScoringType === "Stableford";

  const showPtsColumns =
    renderScoringType === "Stableford" || renderScoringType === "System 36";

  useEffect(() => {
    scoreCardRef.current = scoreCard;
  }, [scoreCard]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const processedScoreCardRef = useRef<any>([]);
  const inputRefs = useRef<any[]>([]);


  const isExcluded = scoringType === "excluded" || scoringType === "Excluded";

  const isSystem36 =
    scoringType === "system-36" ||
    scoringType === "System-36" ||
    (scoreCard &&
      scoreCard.length > 0 &&
      (scoreCard[0].isSystem36 === true || scoreCard[0].IsSystem36 === true));

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) setUserId(Number(storedUserId));
    };
    getUserId();

    dispatch(fetchScoreCardOpen(Number(tournamentId)));
    dispatch(fetchHandicap(Number(teeBoxId)));

    // fetchScoreCard();
  }, []);

  // ── Calculation helpers ──
  const calculateStrokes = (playerHandicap: number, strokeIndex: number) => {
    const base = Math.floor(playerHandicap / 18);
    const remainder = playerHandicap % 18;
    return base + (strokeIndex <= remainder ? 1 : 0);
  };

  const calculateHole = (hole: any) => {
    if (
      hole.score === null ||
      hole.score === "" ||
      hole.score === undefined ||
      Number(hole.score) < 0
    ) {
      return {
        ...hole,
        netScore: null,
        stablefordPoints: null,
      };
    }

    const score = Number(hole.score);
    const playerHandicapVal =
      handicapData && typeof handicapData === "object"
        ? (handicapData.courseHandicap ?? handicapData.handicap ?? 0)
        : Number(handicapData || 0);

    let strokesReceived = calculateStrokes(
      Number(playerHandicapVal),
      hole.handicap,
    );

    const calculateStrokesReceived = (strokeIndex: number) => {
      const handicapValue = handicapData?.userHandicap || 0;
      let strokes = 0;

      if (handicapValue > 0) {
        strokes = Math.floor(handicapValue / 18);
        const remainder = handicapValue % 18;
        if (strokeIndex <= remainder) {
          strokes++;
        }
      }
      return strokes;
    };
    // Excluded logic
    if (isExcluded && hole.par === 3) {
      strokesReceived = 0;
    }

    const netScore = isSystem36 ? hole.netScore : score - strokesReceived;

    let stablefordPoints = null;
    if (isStableford) {
      const pts = hole.par - netScore + 2;
      stablefordPoints = pts > 0 ? pts : 0;
    } else if (isSystem36 && score > 0) {
      // System 36: 2 pts for par or better, 1 pt for bogey, 0 otherwise
      if (score <= hole.par) stablefordPoints = 2;
      else if (score === hole.par + 1) stablefordPoints = 1;
      else stablefordPoints = 0;
    }

    return {
      ...hole,
      netScore,
      stablefordPoints,
    };
  };

  // ── Score change handler ──
  const handleScoreChange = async (
    holeId: number,
    value: string,
    index: number,
    playerId: string,
    isPrimary: boolean,
  ) => {
    if (value === "") {
      setScoreCard((prev: any[]) =>
        prev.map((hole) => {
          if (hole.holeId === holeId) {
            if (isPrimary) return { ...hole, score: "" };
            return {
              ...hole,
              companionScores: {
                ...(hole.companionScores || {}),
                [playerId]: "",
              },
            };
          }
          return hole;
        }),
      );
      return;
    }

    if (!/^\d+$/.test(value)) {
      Toast.show({ type: "error", text1: "Enter valid score" });
      return;
    }

    let currentScoreText = value;
    if (currentScoreText !== "") {
      const numericValue = Number(currentScoreText);
      if (numericValue > 15) {
        Toast.show({ type: "error", text1: "Maximum score per hole is 15." });
        currentScoreText = "";
      }
    }

    const updatedScoreCard = scoreCard.map((hole: any) => {
      if (hole.holeId === holeId) {
        if (isPrimary) {
          return {
            ...hole,
            score: currentScoreText === "" ? null : Number(currentScoreText),
          };
        } else {
          return {
            ...hole,
            companionScores: {
              ...(hole.companionScores || {}),
              [playerId]:
                currentScoreText === "" ? null : Number(currentScoreText),
            },
          };
        }
      }
      return hole;
    });

    setScoreCard(updatedScoreCard);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const payload = updatedScoreCard.map(calculateHole).map((h: any) => ({
        // ...h,
        courseId: courseId ? Number(courseId) : h.courseId,
        holeId: h.holeId,
        isCompleted: false,
        isExcluded: isExcluded && h.par === 3,
        roundNumber: h.roundNumber || 1,
        score:
          h.score === undefined || h.score === null || h.score === ""
            ? null
            : Number(h.score),
        companionScoresJson:
          roundPlayers && roundPlayers.length > 1
            ? JSON.stringify(h.companionScores || {})
            : null,
        companionSandysJson:
          roundPlayers && roundPlayers.length > 1
            ? JSON.stringify(h.companionSandys || {})
            : null,
        playingGroupRoundKey: playingGroupRoundKey || null,
        playingPartnersJson:
          roundPlayers && roundPlayers.length > 1
            ? JSON.stringify(roundPlayers)
            : null,
        teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
        tournamentId: tournamentId ? Number(tournamentId) : h.tournamentId,
        userId: Number(userId),
      }));
      // console.log(
      //   "Triggering debounced save for new round tournamentId:",
      //   tournamentId,
      // );
      // console.log("Payload is ", payload);

      updateHoleScoresApi(
        tournamentId
          ? Number(tournamentId)
          : scoreCardRef.current[0]?.scorecardId || 0,
        payload,
      ).catch((err) => console.error("Debounced save error:", err));
    }, 300);

    // Auto-focus next input after 5 seconds if a value is entered
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    if (value !== "") {
      focusTimeoutRef.current = setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex < updatedScoreCard.length) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 1500);
    }
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
      if (score === -0) {
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

  const getTotals = (holes: any[]) => {
    const scoreTotal = holes.reduce(
      (sum, h) => sum + (Number(h.score) || 0),
      0,
    );
    const netTotal = holes.reduce(
      (sum, h) => sum + (Number(h.netScore) || 0),
      0,
    );
    const ptsTotal = holes.reduce(
      (sum, h) => sum + (Number(h.stablefordPoints) || 0),
      0,
    );

    return {
      strokeIndex: "",
      yards: holes.reduce((sum, h) => sum + (h.yardage || 0), 0),
      par: holes.reduce((sum, h) => sum + (h.par || 0), 0),
      score: scoreTotal > 0 ? scoreTotal : "-",
      net: netTotal > 0 ? netTotal : "-",
      stableford: ptsTotal > 0 ? ptsTotal : "-",
    };
  };

  const processedScoreCard = scoreCard.map(calculateHole);
  const processedFront9 = processedScoreCard.slice(0, 9);
  const processedBack9 = processedScoreCard.slice(9, 18);
  const legendCounts = getScoreLegendCounts(processedScoreCard);

  const frontTotals = getTotals(processedFront9);
  const backTotals = getTotals(processedBack9);
  const grandTotals = getTotals(processedScoreCard);

  const handleGoBack = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const payload = scoreCardRef.current.map(calculateHole).map((h: any) => ({
      courseId: courseId ? Number(courseId) : h.courseId,
      holeId: h.holeId,
      isCompleted: false,
      isExcluded: isExcluded && h.par === 3,
      roundNumber: h.roundNumber || 1,
      score:
        h.score === undefined || h.score === null || h.score === ""
          ? null
          : Number(h.score),
      companionScoresJson:
        roundPlayers && roundPlayers.length > 1
          ? JSON.stringify(h.companionScores || {})
          : null,
      companionSandysJson:
        roundPlayers && roundPlayers.length > 1
          ? JSON.stringify(h.companionSandys || {})
          : null,
      playingGroupRoundKey: playingGroupRoundKey || null,
      playingPartnersJson:
        roundPlayers && roundPlayers.length > 1
          ? JSON.stringify(roundPlayers)
          : null,
      teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
      tournamentId: tournamentId ? Number(tournamentId) : h.tournamentId,
      userId: Number(userId),
    }));
    try {
      await updateHoleScoresApi(
        tournamentId
          ? Number(tournamentId)
          : scoreCardRef.current[0]?.scorecardId || 0,
        payload,
      );
    } catch (err) {
      console.error("Final save failed:", err);
    }
    routePage.back();
  };

  const saveRound = useCallback(
    async (isCompleted: boolean, shouldGoBack: boolean = false) => {
      try {
        setVisible(false);
        const finishPayload = scoreCardRef.current
          .map(calculateHole)
          .map((h: any) => ({
            // ...h,
            courseId: courseId ? Number(courseId) : h.courseId,
            holeId: h.holeId,
            isCompleted: isCompleted,
            isExcluded: isExcluded && h.par === 3,
            roundNumber: h.roundNumber || 1,
            score:
              h.score === undefined || h.score === null || h.score === ""
                ? null
                : Number(h.score),
            matchScoringType: null,
            nassauStartingNine: null,
            companionScoresJson:
              roundPlayers && roundPlayers.length > 1
                ? JSON.stringify(h.companionScores || {})
                : null,
            companionSandysJson:
              roundPlayers && roundPlayers.length > 1
                ? JSON.stringify(h.companionSandys || {})
                : null,
            playingGroupRoundKey: playingGroupRoundKey || null,
            playingPartnersJson:
              roundPlayers && roundPlayers.length > 1
                ? JSON.stringify(roundPlayers)
                : null,
            teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
            tournamentId: tournamentId ? Number(tournamentId) : h.tournamentId,
            userId: Number(userId),
          }));
        // console.log("finishPayload", finishPayload);

        await updateHoleScoresApi(
          tournamentId
            ? Number(tournamentId)
            : scoreCardRef.current[0]?.scorecardId || 0,
          finishPayload,
        );

        if (isCompleted) {
          Toast.show({
            type: "success",
            text1: "Round Finished",
            text2: "Score submitted successfully",
          });
        }

        if (shouldGoBack) {
          routePage.back();
        }
      } catch (error) {
        console.log("Error saving round:", error);
      }
    },
    [
      courseId,
      isExcluded,
      scoringType,
      teeBoxId,
      tournamentId,
      userId,
      routePage,
    ],
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
      saveRound(false);
    });

    return () => {
      appStateListener.remove();
      beforeRemoveListener();
    };
  }, [navigation, saveRound]);

  const handleFinishRound = async () => {
    setVisible(false);
    await saveRound(true);
    Toast.show({
      type: "success",
      text1: "Round Finished",
      text2: "Score submitted successfully",
    });
    routePage.back();
  };

  const renderScoreIndicator = (
    score: number | string | null,
    par: number,
    dark: boolean,
    textVal: string = "",
  ) => {
    if (score === null || score === "" || score === undefined || textVal === "") {
      return (
        <View style={styles.indicatorContainer}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: dark ? "#444" : "#ccc",
            }}
          />
        </View>
      );
    }

    const numericScore = Number(score);
    const diff = numericScore - par;

    if (numericScore === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#fbc02d" }]} />
        </View>
      );
    }

    if (diff <= -3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#00838f" }]} />
        </View>
      );
    }

    if (diff === -2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
        </View>
      );
    }

    if (diff === -1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#66bb6a" }]} />
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

    if (diff === 3) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#8e24aa" }]}>
            <View style={[styles.innerSquare, { borderColor: "#8e24aa" }]} />
          </View>
        </View>
      );
    }

    if (diff === 2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#e53935" }]}>
            <View style={[styles.innerSquare, { borderColor: "#e53935" }]} />
          </View>
        </View>
      );
    }

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
    <View>
      {/* Main Header */}
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          position: "relative",
        }}
      >
        {/* Back Button */}
        <Pressable
          onPress={handleGoBack}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={isDark ? "#ffffff" : "#020617"}
          />
        </Pressable>

        {/* Centered Title */}
        <View
          style={{
            position: "absolute",
            left: 60,
            right: 120,
            alignItems: "center",
          }}
        >
          <ThemedText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Scorecard
            {scoreCard?.[0]?.groupName
              ? ` - ${scoreCard[0].groupName}`
              : ""}
          </ThemedText>
        </View>

        {/* Right Actions */}
        <View
          style={{
            marginLeft: "auto",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* GPS */}
          <Pressable
            onPress={() =>
              setActiveRangefinderHole(scoreCard?.[0]?.holeId || null)
            }
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: "#198754",
              borderRadius: 6,
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

            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              GPS
            </Text>
          </Pressable>

          {/* Details Toggle */}
          <Pressable
            onPress={() => setIsDetailsVisible(!isDetailsVisible)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={
                isDetailsVisible
                  ? "eye-outline"
                  : "eye-off-outline"
              }
              size={24}
              color={isDark ? "#ffffff" : "#020617"}
            />
          </Pressable>
        </View>
      </View>

      {/* Score Information */}
      <View
        style={{
          marginHorizontal: 12,
          marginTop: 4,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Scoring Type */}
        <ThemedText
          style={{
            fontSize: 13,
            opacity: 0.8,
            flex: 1,
          }}
        >
          ({renderScoringType})
        </ThemedText>

        {/* Handicap Information */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Handicap */}
          <Box
            style={{
              paddingHorizontal: 10,
              paddingVertical: 7,
              backgroundColor: "#8bc34a",
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              Handicap: {scoreCard?.[0]?.appliedHandicap}
            </Text>
          </Box>

          {/* System 36 Handicap */}
          {isSystem36 && (
            <Box
              style={{
                paddingHorizontal: 10,
                paddingVertical: 7,
                backgroundColor: "#0ea5e9",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                Sys36 HC:{" "}
                {scoreCard.some(
                  (h: any) => h.score !== null && h.score > 0
                )
                  ? 36 - Number(grandTotals.stableford)
                  : "N/A"}
              </Text>
            </Box>
          )}
        </View>
      </View>
    </View>
  );
};

  const isGroup = roundPlayers && roundPlayers.length > 1;
  const colStyle = isGroup
    ? { width: 70, textAlign: "center" as const }
    : { flex: 1, textAlign: "center" as const };
  const headerStyle = { ...colStyle, fontWeight: "600" as const, fontSize: 13 };

  const getPlayerScore = (h: any, p: any) => {
    if (p.isPrimary) return h.score;
    return h.companionScores?.[p.playerId];
  };

  const getPlayerNetScore = (h: any, p: any) => {
    if (p.isPrimary) return h.netScore;
    return getPlayerScore(h, p);
  };

  const getPlayerStablefordPoints = (h: any, p: any) => {
    if (p.isPrimary) return h.stablefordPoints;
    const score = getPlayerScore(h, p);
    if (!score) return null;
    if (isSystem36) {
      if (score <= h.par) return 2;
      if (score === h.par + 1) return 1;
      return 0;
    }
    return "-";
  };

  const getPlayerTotals = (
    holes: any[],
    playerId: string,
    isPrimary: boolean,
    type: "score" | "net" | "pts",
  ) => {
    return holes.reduce((sum, h) => {
      let s;
      if (type === "score") s = getPlayerScore(h, { playerId, isPrimary });
      else if (type === "net")
        s = getPlayerNetScore(h, { playerId, isPrimary });
      else s = getPlayerStablefordPoints(h, { playerId, isPrimary });

      const num = Number(s);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
        {renderHeader()}
        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-2 pb-20">
            <VStack className="gap-4">
              {loading ? (
                <ThemedText>Loading...</ThemedText>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                  >
                    <VStack style={{ minWidth: "100%" }}>
                      <VStack
                        style={{
                          backgroundColor: isDark
                            ? "rgba(15, 23, 42, 0.7)"
                            : "rgba(255, 255, 255, 0.7)",
                          borderColor: isDark ? "#1e293b" : "#e2e8f0",
                          borderRadius: 14,
                          overflow: "hidden",
                          shadowColor: "#000",
                          shadowOpacity: 0.12,
                          shadowRadius: 6,
                        }}
                      >
                        <HStack
                          style={{
                            paddingVertical: 10,
                            backgroundColor: isDark
                              ? "rgba(38, 38, 38, 0.8)"
                              : "rgba(243, 244, 246, 0.8)",
                            borderBottomWidth: 1,
                            borderColor: isDark ? "#444" : "#ddd",
                          }}
                        >
                          <ThemedText style={headerStyle}>Hole</ThemedText>
                          {isDetailsVisible && (
                            <ThemedText style={headerStyle}>
                              Stroke{"\n"}Index
                            </ThemedText>
                          )}
                          {isDetailsVisible && (
                            <ThemedText style={headerStyle}>Yards</ThemedText>
                          )}
                          <ThemedText style={headerStyle}>Par</ThemedText>

                          {roundPlayers && roundPlayers.length > 0 ? (
                            roundPlayers.map((p) => (
                              <React.Fragment key={p.playerId}>
                                <ThemedText
                                  style={headerStyle}
                                  numberOfLines={1}
                                >
                                  {isGroup ? p.name : "Score"}
                                </ThemedText>
                                {showNetColumns && (
                                  <ThemedText style={headerStyle}>
                                    Net
                                  </ThemedText>
                                )}
                                {showPtsColumns && renderScoringType === "Stableford" && (
                                    <ThemedText style={headerStyle}>
                                      Pts
                                    </ThemedText>
                                  )}
                                {showPtsColumns && renderScoringType === "System 36" && (
                                    <ThemedText style={headerStyle}>
                                      Sys36{"\n"}Pts
                                    </ThemedText>
                                  )}
                              </React.Fragment>
                            ))
                          ) : (
                            <React.Fragment>
                              <ThemedText style={headerStyle}>Score</ThemedText>
                              {showNetColumns && (
                                <ThemedText style={headerStyle}>Net</ThemedText>
                              )}
                              {showPtsColumns && renderScoringType === "Stableford" && (
                                  <ThemedText style={headerStyle}>
                                    Pts
                                  </ThemedText>
                                )}
                              {showPtsColumns && renderScoringType === "System 36" && (
                                  <ThemedText style={headerStyle}>
                                    Sys36{"\n"}Pts
                                  </ThemedText>
                                )}
                            </React.Fragment>
                          )}
                        </HStack>

                        {processedScoreCard.map((h: any, index: number) => (
                          <View key={h.holeId}>
                            <HStack
                              style={{
                                paddingVertical: 12,
                                alignItems: "center",
                                borderBottomWidth: 0.5,
                                borderColor: isDark ? "#333" : "#eee",
                              }}
                            >
                              <View style={{...colStyle, alignItems: 'center', justifyContent: 'center'} as any}>
                                <ThemedText style={{ fontWeight: 'bold' }}>
                                  {h.holeNumber}
                                </ThemedText>
                                <TouchableOpacity onPress={() => setActiveRangefinderHole(h.holeId)} style={{ marginTop: 2 }}>
                                  <Ionicons name="location-outline" size={16} color={isDark ? "#8BC34A" : "#198754"} />
                                </TouchableOpacity>
                              </View>
                              {isDetailsVisible && (
                                <ThemedText
                                  style={{ ...colStyle, color: "#888" }}
                                >
                                  {h.strokeIndex}
                                </ThemedText>
                              )}
                              {isDetailsVisible && (
                                <ThemedText
                                  style={{ ...colStyle, color: "#888" }}
                                >
                                  {h.yardage}
                                </ThemedText>
                              )}
                              <ThemedText style={colStyle}>{h.par}</ThemedText>

                              {roundPlayers && roundPlayers.length > 0 ? (
                                roundPlayers.map((p, pIndex) => {
                                  const rawVal = getPlayerScore(h, p);
                                  const textVal =
                                    rawVal !== null && rawVal !== undefined
                                      ? String(rawVal)
                                      : "";
                                  return (
                                    <React.Fragment key={p.playerId}>
                                      <View
                                        style={
                                          {
                                            ...colStyle,
                                            alignItems: "center",
                                            justifyContent: "center",
                                          } as any
                                        }
                                      >
                                        <View
                                          style={{
                                            position: "relative",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 38,
                                            height: 38,
                                          }}
                                        >
                                          {renderScoreIndicator(
                                            rawVal,
                                            h.par,
                                            isDark,
                                            textVal,
                                          )}
                                          <TextInput
                                            value={textVal}
                                            onChangeText={(val) =>
                                              handleScoreChange(
                                                h.holeId,
                                                val,
                                                index,
                                                p.playerId,
                                                p.isPrimary,
                                              )
                                            }
                                            onBlur={() => {
                                              if (focusTimeoutRef.current)
                                                clearTimeout(
                                                  focusTimeoutRef.current,
                                                );
                                              saveRound(false, false);
                                            }}
                                            onSubmitEditing={() => {
                                              if (index < 17) {
                                                inputRefs.current[
                                                  index + 1
                                                ]?.focus();
                                              }
                                            }}
                                            returnKeyType={
                                              index === 17 ? "done" : "next"
                                            }
                                            ref={(el: any) =>
                                              p.isPrimary &&
                                              (inputRefs.current[index] = el)
                                            }
                                            keyboardType="numeric"
                                            style={{
                                              width: 32,
                                              height: 32,
                                              textAlign: "center",
                                              color: isDark ? "#fff" : "#000",
                                              fontWeight: "600",
                                              zIndex: 10,
                                              backgroundColor: "transparent",
                                              padding: 0,
                                            }}
                                          />
                                        </View>
                                      </View>

                                      {showNetColumns && (
                                        <ThemedText
                                          style={{
                                            ...colStyle,
                                            fontWeight: "600",
                                            color: "#8BC34A",
                                          }}
                                        >
                                          {getPlayerNetScore(h, p) ?? "-"}
                                        </ThemedText>
                                      )}

                                      {showPtsColumns &&
                                        renderScoringType === "Stableford" && (
                                          <ThemedText style={colStyle}>
                                            {getPlayerStablefordPoints(h, p) ??
                                              "-"}
                                          </ThemedText>
                                        )}

                                      {showPtsColumns &&
                                        renderScoringType === "System 36" && (
                                          <ThemedText
                                            style={{
                                              ...colStyle,
                                              fontWeight: "600",
                                              color: "#0ea5e9",
                                            }}
                                          >
                                            {getPlayerStablefordPoints(h, p) ??
                                              "-"}
                                          </ThemedText>
                                        )}
                                    </React.Fragment>
                                  );
                                })
                              ) : (
                                <React.Fragment>
                                  <View
                                    style={
                                      {
                                        ...colStyle,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      } as any
                                    }
                                  >
                                    <View
                                      style={{
                                        position: "relative",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 38,
                                        height: 38,
                                      }}
                                    >
                                      {renderScoreIndicator(
                                        h.score,
                                        h.par,
                                        isDark,
                                        h.score !== null &&
                                          h.score !== undefined
                                          ? String(h.score)
                                          : "",
                                      )}
                                      <TextInput
                                        value={
                                          h.score !== null &&
                                          h.score !== undefined
                                            ? String(h.score)
                                            : ""
                                        }
                                        onChangeText={(val) =>
                                          handleScoreChange(
                                            h.holeId,
                                            val,
                                            index,
                                            "",
                                            true,
                                          )
                                        }
                                        onBlur={() => {
                                          if (focusTimeoutRef.current)
                                            clearTimeout(
                                              focusTimeoutRef.current,
                                            );
                                          saveRound(false, false);
                                        }}
                                        onSubmitEditing={() => {
                                          if (index < 17) {
                                            inputRefs.current[
                                              index + 1
                                            ]?.focus();
                                          }
                                        }}
                                        returnKeyType={
                                          index === 17 ? "done" : "next"
                                        }
                                        ref={(el: any) =>
                                          (inputRefs.current[index] = el)
                                        }
                                        keyboardType="numeric"
                                        style={{
                                          width: 32,
                                          height: 32,
                                          textAlign: "center",
                                          color: isDark ? "#fff" : "#000",
                                          fontWeight: "600",
                                          zIndex: 10,
                                          backgroundColor: "transparent",
                                          padding: 0,
                                        }}
                                      />
                                    </View>
                                  </View>

                                  {showNetColumns && (
                                    <ThemedText
                                      style={{
                                        ...colStyle,
                                        fontWeight: "600",
                                        color: "#8BC34A",
                                      }}
                                    >
                                      {h.netScore ?? "-"}
                                    </ThemedText>
                                  )}

                                  {showPtsColumns && renderScoringType === "Stableford" && (
                                      <ThemedText style={colStyle}>
                                        {h.stablefordPoints ?? "-"}
                                      </ThemedText>
                                    )}

                                  {showPtsColumns && renderScoringType === "System 36" && (
                                      <ThemedText
                                        style={{
                                          ...colStyle,
                                          fontWeight: "600",
                                          color: "#0ea5e9",
                                        }}
                                      >
                                        {h.stablefordPoints ?? "-"}
                                      </ThemedText>
                                    )}
                                </React.Fragment>
                              )}
                            </HStack>

                            {/* FRONT 9 SUMMARY */}
                            {index === 8 && (
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
                                  style={{ ...colStyle, fontWeight: "700" }}
                                >
                                  Front 9
                                </ThemedText>
                                {isDetailsVisible && (
                                  <ThemedText style={colStyle}>
                                    {frontTotals.strokeIndex}
                                  </ThemedText>
                                )}
                                {isDetailsVisible && (
                                  <ThemedText style={colStyle}>
                                    {frontTotals.yards}
                                  </ThemedText>
                                )}
                                <ThemedText style={colStyle}>
                                  {frontTotals.par}
                                </ThemedText>

                                {roundPlayers && roundPlayers.length > 0 ? (
                                  roundPlayers.map((p) => {
                                    const s = getPlayerTotals(
                                      processedFront9,
                                      p.playerId,
                                      p.isPrimary,
                                      "score",
                                    );
                                    const n = getPlayerTotals(
                                      processedFront9,
                                      p.playerId,
                                      p.isPrimary,
                                      "net",
                                    );
                                    const pt = getPlayerTotals(
                                      processedFront9,
                                      p.playerId,
                                      p.isPrimary,
                                      "pts",
                                    );
                                    return (
                                      <React.Fragment key={p.playerId}>
                                        <ThemedText
                                          style={{
                                            ...colStyle,
                                            fontWeight: "700",
                                          }}
                                        >
                                          {s > 0 ? s : "-"}
                                        </ThemedText>
                                        {showNetColumns && (
                                          <ThemedText
                                            style={{
                                              ...colStyle,
                                              fontWeight: "700",
                                            }}
                                          >
                                            {n > 0 ? n : "-"}
                                          </ThemedText>
                                        )}
                                        {showPtsColumns && renderScoringType === "Stableford" && (
                                            <ThemedText style={colStyle}>
                                              {pt > 0 ? pt : "-"}
                                            </ThemedText>
                                          )}
                                        {showPtsColumns && renderScoringType === "System 36" && (
                                            <ThemedText
                                              style={{
                                                ...colStyle,
                                                fontWeight: "700",
                                                color: "#0ea5e9",
                                              }}
                                            >
                                              {pt > 0 ? pt : "-"}
                                            </ThemedText>
                                          )}
                                      </React.Fragment>
                                    );
                                  })
                                ) : (
                                  <React.Fragment>
                                    <ThemedText
                                      style={{ ...colStyle, fontWeight: "700" }}
                                    >
                                      {frontTotals.score}
                                    </ThemedText>
                                    {showNetColumns && (
                                      <ThemedText
                                        style={{
                                          ...colStyle,
                                          fontWeight: "700",
                                        }}
                                      >
                                        {frontTotals.net}
                                      </ThemedText>
                                    )}
                                    {showPtsColumns && renderScoringType === "Stableford" && (
                                        <ThemedText style={colStyle}>
                                          {frontTotals.stableford}
                                        </ThemedText>
                                      )}
                                    {showPtsColumns && renderScoringType === "System 36" && (
                                        <ThemedText
                                          style={{
                                            ...colStyle,
                                            fontWeight: "700",
                                            color: "#0ea5e9",
                                          }}
                                        >
                                          {frontTotals.stableford}
                                        </ThemedText>
                                      )}
                                  </React.Fragment>
                                )}
                              </HStack>
                            )}

                            {/* BACK 9 SUMMARY */}
                            {index === 17 && (
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
                                  style={{ ...colStyle, fontWeight: "700" }}
                                >
                                  Back 9
                                </ThemedText>
                                {isDetailsVisible && (
                                  <ThemedText style={colStyle}>
                                    {backTotals.strokeIndex}
                                  </ThemedText>
                                )}
                                {isDetailsVisible && (
                                  <ThemedText style={colStyle}>
                                    {backTotals.yards}
                                  </ThemedText>
                                )}
                                <ThemedText style={colStyle}>
                                  {backTotals.par}
                                </ThemedText>

                                {roundPlayers && roundPlayers.length > 0 ? (
                                  roundPlayers.map((p) => {
                                    const s = getPlayerTotals(
                                      processedBack9,
                                      p.playerId,
                                      p.isPrimary,
                                      "score",
                                    );
                                    const n = getPlayerTotals(
                                      processedBack9,
                                      p.playerId,
                                      p.isPrimary,
                                      "net",
                                    );
                                    const pt = getPlayerTotals(
                                      processedBack9,
                                      p.playerId,
                                      p.isPrimary,
                                      "pts",
                                    );
                                    return (
                                      <React.Fragment key={p.playerId}>
                                        <ThemedText
                                          style={{
                                            ...colStyle,
                                            fontWeight: "700",
                                          }}
                                        >
                                          {s > 0 ? s : "-"}
                                        </ThemedText>
                                        {showNetColumns && (
                                          <ThemedText
                                            style={{
                                              ...colStyle,
                                              fontWeight: "700",
                                            }}
                                          >
                                            {n > 0 ? n : "-"}
                                          </ThemedText>
                                        )}
                                        {showPtsColumns && renderScoringType === "Stableford" && (
                                            <ThemedText style={colStyle}>
                                              {pt > 0 ? pt : "-"}
                                            </ThemedText>
                                          )}
                                        {showPtsColumns && renderScoringType === "System 36" && (
                                            <ThemedText
                                              style={{
                                                ...colStyle,
                                                fontWeight: "700",
                                                color: "#0ea5e9",
                                              }}
                                            >
                                              {pt > 0 ? pt : "-"}
                                            </ThemedText>
                                          )}
                                      </React.Fragment>
                                    );
                                  })
                                ) : (
                                  <React.Fragment>
                                    <ThemedText
                                      style={{ ...colStyle, fontWeight: "700" }}
                                    >
                                      {backTotals.score}
                                    </ThemedText>
                                    {showNetColumns && (
                                      <ThemedText
                                        style={{
                                          ...colStyle,
                                          fontWeight: "700",
                                        }}
                                      >
                                        {backTotals.net}
                                      </ThemedText>
                                    )}
                                    {showPtsColumns && renderScoringType === "Stableford" && (
                                        <ThemedText style={colStyle}>
                                          {backTotals.stableford}
                                        </ThemedText>
                                      )}
                                    {showPtsColumns && renderScoringType === "System 36" && (
                                        <ThemedText
                                          style={{
                                            ...colStyle,
                                            fontWeight: "700",
                                            color: "#0ea5e9",
                                          }}
                                        >
                                          {backTotals.stableford}
                                        </ThemedText>
                                      )}
                                  </React.Fragment>
                                )}
                              </HStack>
                            )}
                          </View>
                        ))}

                        {scorecardData && scorecardData.length == 0 && (
                          <ThemedText style={{ textAlign: "center" }}>
                            No games played in this tournament yet.
                          </ThemedText>
                        )}
                      </VStack>

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
                            ...colStyle,
                            color: "#fff",
                            fontWeight: "700",
                          }}
                        >
                          Total
                        </ThemedText>
                        {isDetailsVisible && (
                          <ThemedText style={{ ...colStyle, color: "#fff" }}>
                            {grandTotals.strokeIndex}
                          </ThemedText>
                        )}
                        {isDetailsVisible && (
                          <ThemedText style={{ ...colStyle, color: "#fff" }}>
                            {grandTotals.yards}
                          </ThemedText>
                        )}
                        <ThemedText style={{ ...colStyle, color: "#fff" }}>
                          {grandTotals.par}
                        </ThemedText>

                        {roundPlayers && roundPlayers.length > 0 ? (
                          roundPlayers.map((p) => {
                            const s = getPlayerTotals(
                              processedScoreCard,
                              p.playerId,
                              p.isPrimary,
                              "score",
                            );
                            const n = getPlayerTotals(
                              processedScoreCard,
                              p.playerId,
                              p.isPrimary,
                              "net",
                            );
                            const pt = getPlayerTotals(
                              processedScoreCard,
                              p.playerId,
                              p.isPrimary,
                              "pts",
                            );
                            return (
                              <React.Fragment key={p.playerId}>
                                <ThemedText
                                  style={{
                                    ...colStyle,
                                    color: "#fff",
                                    fontWeight: "700",
                                  }}
                                >
                                  {s > 0 ? s : "-"}
                                </ThemedText>
                                {showNetColumns && (
                                  <ThemedText
                                    style={{
                                      ...colStyle,
                                      color: "#fff",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {n > 0 ? n : "-"}
                                  </ThemedText>
                                )}
                                {showPtsColumns && renderScoringType === "Stableford" && (
                                    <ThemedText
                                      style={{ ...colStyle, color: "#fff" }}
                                    >
                                      {pt > 0 ? pt : "-"}
                                    </ThemedText>
                                  )}
                                {showPtsColumns && renderScoringType === "System 36" && (
                                    <ThemedText
                                      style={{
                                        ...colStyle,
                                        color: "#fff",
                                        fontWeight: "700",
                                      }}
                                    >
                                      {pt > 0 ? pt : "-"}
                                    </ThemedText>
                                  )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <React.Fragment>
                            <ThemedText
                              style={{
                                ...colStyle,
                                color: "#fff",
                                fontWeight: "700",
                              }}
                            >
                              {grandTotals.score}
                            </ThemedText>
                            {showNetColumns && (
                              <ThemedText
                                style={{
                                  ...colStyle,
                                  color: "#fff",
                                  fontWeight: "700",
                                }}
                              >
                                {grandTotals.net}
                              </ThemedText>
                            )}
                            {showPtsColumns && renderScoringType === "Stableford" && (
                                <ThemedText
                                  style={{ ...colStyle, color: "#fff" }}
                                >
                                  {grandTotals.stableford}
                                </ThemedText>
                              )}
                            {showPtsColumns && renderScoringType === "System 36" && (
                                <ThemedText
                                  style={{
                                    ...colStyle,
                                    color: "#fff",
                                    fontWeight: "700",
                                  }}
                                >
                                  {grandTotals.stableford}
                                </ThemedText>
                              )}
                          </React.Fragment>
                        )}
                      </HStack>
                    </VStack>
                  </ScrollView>

                  {/* FINISH ROUND BUTTON */}
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

                  {/* SCORECARD LEGEND */}
                  <VStack
                    style={{
                      marginTop: 25,
                      padding: 16,
                      borderRadius: 14,
                      backgroundColor: isDark
                        ? "rgba(38, 38, 38, 0.8)"
                        : "rgba(243, 244, 246, 0.8)",
                      borderWidth: 1,
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
                      {/* Hole-in-One */}
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

                      {/* Albatross */}
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

                      {/* Eagle */}
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

                      {/* Birdie */}
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

                      {/* Par */}
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

                      {/* Bogey */}
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

                      {/* Double Bogey */}
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

                      {/* Triple Bogey */}
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

                      {/* Quadruple Bogey+ */}
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

      {/* FINISH ROUND MODAL */}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
            ]}
          >
            <Text style={[styles.heading, { color: isDark ? "#fff" : "#000" }]}>
              Finish Round
            </Text>

            <Text style={[styles.content, { color: isDark ? "#ccc" : "#555" }]}>
              Are you sure you want to finish this round? Once submitted, you
              cannot edit your scores.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: isDark ? "#333" : "#e5e5e5" },
                ]}
                onPress={() => setVisible(false)}
              >
                <Text style={{ color: isDark ? "#fff" : "#000" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => handleFinishRound()}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <RangefinderModal
        visible={activeRangefinderHole !== null}
        onClose={() => setActiveRangefinderHole(null)}
        holes={scoreCard}
        initialHoleId={activeRangefinderHole}
        courseName={scoreCard[0]?.courseName || ""}
      />
    </>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    position: "absolute",
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  singleCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },
  singleSquare: {
    width: 34,
    height: 34,
    borderRadius: 4,
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
    width: 26,
    height: 26,
    borderRadius: 2,
    borderWidth: 1.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#22c55e",
  },
  legendItemStyle: {
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    marginBottom: 8,
  },
  legendText: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
});