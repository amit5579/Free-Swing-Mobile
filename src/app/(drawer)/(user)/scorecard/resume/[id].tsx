import {
  getScorecardDetails,
  ScorecardHole,
  finishScorecardApi,
  updateHoleScoresApi,
  updateScorecardApi,
  getInProgressGames,
} from "@/api/modules/dashboard.api";
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

      const renderScoringType =
    holes.length > 0
      ? holes.some(
            (h: any) =>
              h.stablefordPoints !== null && h.stablefordPoints !== undefined,
          )
        ? "Stableford"
        : holes[0].isExcluded
          ? "Net Score Exclude Par 3"
          : "Net Score Include Par 3"
      : "";

  const saveToServer = async (holesToSave: ScorecardHole[]) => {
    const performSave = async () => {
      try {
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

  const front9 = holes.slice(0, 9);

  const renderScoreIndicator = (
    score: number | null,
    par: number,
    isDark: boolean,
    rawValue: string,
  ) => {
    if (score === null || score === undefined) return null;
    // rawValue is used to check if the user has cleared the input
    if (rawValue === "" && (score === null || score === undefined)) return null;

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
        stickyHeaderIndices={[0]}
      >
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
            const rawVal = textScores[h.holeId];
            if (rawVal === undefined || rawVal === "") return;
            const s = parseInt(rawVal, 10);
            if (isNaN(s) || s < 0) return;

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
