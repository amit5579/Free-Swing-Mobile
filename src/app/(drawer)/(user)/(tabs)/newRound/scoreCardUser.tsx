import { getScoreCardDetails } from "@/api/newRound";
import { saveScoreCard } from "@/api/scoreCard";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

type ScorePayload = {
  courseId: number;
  holeId: number;
  isCompleted: boolean;
  isExcluded: boolean;
  roundNumber: number;
  score: number;
  stablefordPoints: number | null;
  teeBoxId: number;
  userId: number;
};

export default function ScoreCardUserPage() {
  const { excluded, stableford, holes, handicap, courseId, teeBoxId } =
    useLocalSearchParams();

  const routePage = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [visible, setVisible] = useState(false);
  const [scoreCardDetails, setScoreCardDetails] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [borderDisplay, setBorderDisplay] = useState(true);
  const isExcluded = excluded === "true";
  const isStableford = stableford === "true";
  // const holesCount = Number(holes);

  const fetchScoreCard = async () => {
    try {
      setLoading(true);
      const response = await getScoreCardDetails(
        Number(teeBoxId),
        Number(courseId),
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
      netScore,
      stablefordPoints,
    };
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

      // 🟡 Hole-in-One
      if (score === 1) {
        counts.holeInOne++;
        return;
      }

      // 🟦 Albatross (-3)
      if (diff === -3) {
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

    return counts;
  };

  const processedAllHoles = scoreCardDetails.map(calculateHole);

  const processedFront9 = processedAllHoles.slice(0, 9);
  const processedBack9 = processedAllHoles.slice(9, 18);
  const legendCounts = getScoreLegendCounts(processedAllHoles);

  const getTotals = (holes: any[]) => ({
    yards: holes.reduce((sum, h) => sum + (h.yardage || 0), 0),
    par: holes.reduce((sum, h) => sum + (h.par || 0), 0),
    score: holes.reduce((sum, h) => sum + (Number(h.score) || 0), 0),
    net: holes.reduce((sum, h) => sum + (Number(h.netScore) || 0), 0),
    stableford: holes.reduce(
      (sum, h) => sum + (Number(h.stablefordPoints) || 0),
      0,
    ),
  });

  const frontTotals = getTotals(processedFront9);
  const backTotals = getTotals(processedBack9);
  const grandTotals = getTotals(processedAllHoles);

  const processedHoles = processedAllHoles.filter((h: any, index: number) => {
    if (holes === "18") return true;
    if (holes === "front9") return index < 9;
    if (holes === "back9") return index >= 9;
    return true;
  });

  const payload = processedAllHoles.map((h: any) => ({
    courseId: Number(courseId),
    holeId: h.holeId,
    isCompleted: true,
    isExcluded: excluded === "true" && h.par === 3,
    roundNumber: 1,
    score: h.score ?? 0,
    stablefordPoints: h.stablefordPoints ?? 0,
    teeBoxId: Number(teeBoxId),
  }));

  const handleFinishRound = () => {
    setVisible(false);
    saveScoreCard(payload);
    Toast.show({
      type: "success",
      text1: "Round Finished",
      text2: "Score submitted successfully",
    });
  };

  useEffect(() => {
    fetchScoreCard();
  }, [excluded, stableford, holes, handicap, courseId, teeBoxId]);

  // input fields

  // finds correct hole
  // updates only that hole
  // triggers re-render
  // recalculates everything automatically

  const handleScoreChange = (holeId: number, value: string) => {
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
        text1: "Max score is 15",
      });
      return;
    }

    // ✅ store STRING (IMPORTANT)
    setScoreCardDetails((prev: any[]) =>
      prev.map((hole) =>
        hole.holeId === holeId ? { ...hole, score: value } : hole,
      ),
    );
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
      <View style={{ paddingTop: 10 }}>
        <HStack
          className="px-3 items-center"
          style={{ height: 60, justifyContent: "center" }}
        >
          {/* LEFT: Back button (Absolute positioned for centering) */}
          <Pressable
            onPress={() => routePage.back()}
            style={{ position: "absolute", left: 16, zIndex: 10, padding: 8 }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={isDark ? "#ffffff" : "#020617"}
            />
          </Pressable>

          {/* CENTER: Title */}
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

        <HStack className="justify-between px-5 items-center mb-2">
          <View style={{ flex: 1 }}>
            {excluded === "true" && stableford === "false" && (
              <ThemedText style={{ fontSize: 13, opacity: 0.8 }}>
                (Net Score Exclude Par 3)
              </ThemedText>
            )}
            {excluded === "false" && stableford === "true" && (
              <ThemedText style={{ fontSize: 13, opacity: 0.8 }}>
                (Stableford)
              </ThemedText>
            )}
            {excluded === "false" && stableford === "false" && (
              <ThemedText style={{ fontSize: 13, opacity: 0.8 }}>
                (Net Score Include Par 3)
              </ThemedText>
            )}
            {excluded === "true" && stableford === "true" && (
              <ThemedText style={{ fontSize: 13, opacity: 0.8 }}>
                (Stableford Exclude Par 3)
              </ThemedText>
            )}
          </View>
          <ThemedText style={{ fontWeight: "600" }}>
            Handicap: {handicap}
          </ThemedText>
        </HStack>
      </View>
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
                <>
                  <ThemedText>Loading...</ThemedText>
                </>
              ) : (
                <>
                  {/* CARD WRAPPER */}
                  <VStack
                    style={{
                      backgroundColor: "transparent",
                      // isDark ? "#1f1f1f" : "#fff"
                      borderRadius: 14,
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                      // elevation: 4,
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
                            {h.yardage}
                          </ThemedText>

                          <ThemedText style={{ flex: 1, textAlign: "center" }}>
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
                              // value={h.score !== null ? String(h.score) : ""}
                              // placeholder="-"
                              // onChangeText={(val) => {
                              //   setBorderDisplay(false);
                              //   handleScoreChange(h.holeId, val);
                              // }}
                              value={
                                h.score !== null && h.score !== undefined
                                  ? String(h.score)
                                  : ""
                              }
                              onChangeText={(val) =>
                                handleScoreChange(h.holeId, val)
                              }
                              keyboardType="numeric"
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: borderDisplay ? 8 : 0,
                                borderWidth: borderDisplay ? 1 : 0,
                                borderColor: isDark ? "#444" : "#ccc",
                                backgroundColor:
                                  // isDark ? "#111" : "#fff",
                                  "transparent",
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

                        {/*  BACK 9 */}
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
                  </VStack>

                  {/*  GRAND TOTAL */}
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
                        {Number(grandTotals.stableford)}
                      </ThemedText>
                    )}
                  </HStack>

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
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: isDark ? "#eee" : "#333",
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
