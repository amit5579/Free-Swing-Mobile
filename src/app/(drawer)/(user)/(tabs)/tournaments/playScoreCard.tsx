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
// import {
//   getScorecardHandicap,
//   getScoreCardOpen,
//   saveScoreCard,
// } from "@/api/modules/scoreCard.api";
import Toast from "react-native-toast-message";
import { Box } from "@/components/box";

import { fetchScoreCardOpen, fetchHandicap } from "@/redux/slices/userScorecard.slice";
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
  (state: RootState) => state.userScoreCard as any
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


  useEffect(() => {
    if (scorecardData) {
      setScoreCard(scorecardData);
      // console.log("scorecard data", scorecardData);
    }
  }, [scorecardData]);

  const renderScoringType =
    scorecardData && scorecardData.length > 0
      ? scorecardData[0].stablefordPoints == null
        ? scorecardData[0].isExcluded
          ? "Net Score Exclude Par 3"
          : "Net Score Include Par 3"
        : "Stableford"
      : "";
 
  useEffect(() => {
    scoreCardRef.current = scoreCard;    
  }, [scoreCard]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const processedScoreCardRef = useRef<any>([]);
  const inputRefs = useRef<any[]>([]);

  const isStableford =
    scoringType === "stableford" || scoringType === "Stableford";

  const isExcluded = scoringType === "excluded" || scoringType === "Excluded";

  // const renderScoringType =
  //   scoringType === "stableford" || scoringType === "Stableford"
  //     ? "Stableford"
  //     : scoringType === "double-peoria" ||
  //         scoringType === "Double-Peoria" ||
  //         scoringType === "double-peoria-stableford" ||
  //         scoringType === "Double-Peoria-Stableford" ||
  //         scoringType === "double-peoria-net" ||
  //         scoringType === "Double-Peoria-Net"
  //       ? "Net Score Include Par 3"
  //       : scoringType === "excluded" || scoringType === "Excluded"
  //         ? "Net Score Excluded Par 3"
  //         : scoringType === "standard" || scoringType === "Standard"
  //           ? "Standard"
  //           : "Net Score Include Par 3";

  // const fetchScoreCard = async () => {
  //   try {
  //     // setLoading(true);

  //     const response = await getScoreCardOpen(Number(tournamentId));

  //     const hcDetails = await getScorecardHandicap(Number(teeBoxId));

  //     // console.log("hcDetails", hcDetails);
  //     // console.log("scorecard details", response);

  //     const clearedScores = response.map((h: any) => ({
  //       ...h,
  //       score: null,
  //       netScore: null,
  //       stablefordPoints: null,
  //     }));
  //     setScoreCard(clearedScores);
  //   } catch (error) {
  //     console.error("Fetching scorecard Error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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

    const netScore = score - strokesReceived;

    let stablefordPoints = null;
    if (isStableford) {
      const pts = hole.par - netScore + 2;
      stablefordPoints = pts > 0 ? pts : 0;
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
  ) => {
    if (value === "") {
      setScoreCard((prev: any[]) =>
        prev.map((hole) =>
          hole.holeId === holeId ? { ...hole, score: "" } : hole,
        ),
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

    const updatedScoreCard = scoreCard.map((hole: any) =>
      hole.holeId === holeId
        ? {
            ...hole,
            score: currentScoreText === "" ? null : Number(currentScoreText),
          }
        : hole,
    );

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
        teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
        tournamentId: tournamentId ? Number(tournamentId) : h.tournamentId,
        userId: Number(userId),
      }));
      // console.log(
      //   "Triggering debounced save for new round tournamentId:",
      //   tournamentId,
      // );
      console.log("Payload is ", payload);

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
            teeBoxId: teeBoxId ? Number(teeBoxId) : h.teeBoxId,
            tournamentId: tournamentId ? Number(tournamentId) : h.tournamentId,
            userId: Number(userId),
          }));
        console.log("finishPayload", finishPayload);

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
  ) => {
    if (score === null || score === "" || score === undefined) return null;

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
      <>
        <View style={{ paddingTop: 10 }}>
          <HStack
            className="px-3 items-center"
            style={{ height: 30, justifyContent: "center" }}
          >
            <Pressable
              onPress={handleGoBack}
              style={{ position: "absolute", left: 16, zIndex: 10, padding: 8 }}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={isDark ? "#ffffff" : "#020617"}
              />
            </Pressable>

            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Scorecard
            </ThemedText>
          </HStack>

          <HStack className="justify-between m-3">
            <ThemedText style={{ fontSize: 13, opacity: 0.8 }}>
              ({renderScoringType})
            </ThemedText>
            <Box
              style={{
                padding: 8,
                backgroundColor: "#8bc34a",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: 700 }}>
                Handicap: {handicapData?.handicap}
              </Text>
            </Box>
          </HStack>
        </View>
      </>
    );
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
                          <ThemedText style={{ flex: 1, textAlign: "center" }}>
                            {h.holeNumber}
                          </ThemedText>

                          <ThemedText
                            style={{
                              flex: 1,
                              textAlign: "center",
                              color: "#888",
                            }}
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

                          <ThemedText style={{ flex: 1, textAlign: "center" }}>
                            {h.par}
                          </ThemedText>

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
                                 if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
                                 saveRound(false, false);
                               }}
                              onSubmitEditing={() => {
                                if (index < 17) {
                                  inputRefs.current[index + 1]?.focus();
                                }
                              }}
                              returnKeyType={index === 17 ? "done" : "next"}
                              ref={(el: any) => (inputRefs.current[index] = el)}
                              keyboardType="numeric"
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 5,
                                borderColor: "#b9b9b9ff",
                                borderWidth: 1,
                                backgroundColor: "transparent",
                                textAlign: "center",
                                color: isDark ? "#fff" : "#000",
                                fontWeight: "600",
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
                            {h.netScore ?? "-"}
                          </ThemedText>

                          {isStableford && (
                            <ThemedText
                              style={{ flex: 1, textAlign: "center" }}
                            >
                              {h.stablefordPoints ?? "-"}
                            </ThemedText>
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
                              style={{
                                flex: 1,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              Front 9
                            </ThemedText>
                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                              }}
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
                              {frontTotals.score}
                            </ThemedText>
                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                                fontWeight: "700",
                              }}
                            >
                              {frontTotals.net}
                            </ThemedText>
                            {isStableford && (
                              <ThemedText
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                {frontTotals.stableford}
                              </ThemedText>
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
                              style={{
                                flex: 1,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                            >
                              Back 9
                            </ThemedText>
                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                              }}
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
                            <ThemedText
                              style={{
                                flex: 1,
                                textAlign: "center",
                                fontWeight: "700",
                              }}
                            >
                              {backTotals.net}
                            </ThemedText>
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

                    {scorecardData && scorecardData.length == 0  && (
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
                    {isStableford && (
                      <ThemedText
                        style={{ flex: 1, textAlign: "center", color: "#fff" }}
                      >
                        {grandTotals.stableford}
                      </ThemedText>
                    )}
                  </HStack>

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
