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

  const filteredHoles = (() => {
    if (holes === "18") return scoreCardDetails;

    if (holes === "front9") return scoreCardDetails.slice(0, 9);

    if (holes === "back9") return scoreCardDetails.slice(9, 18);

    return scoreCardDetails;
  })();

  const calculateStrokes = (playerHandicap: number, strokeIndex: number) => {
    const base = Math.floor(playerHandicap / 18);
    const remainder = playerHandicap % 18;

    return base + (strokeIndex <= remainder ? 1 : 0);
  };

  const calculateHole = (hole: any) => {
    if (hole.score === null) {
      return {
        ...hole,
        netScore: 0,
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

  const processedAllHoles = scoreCardDetails.map(calculateHole);

  const processedFront9 = processedAllHoles.slice(0, 9);
  const processedBack9 = processedAllHoles.slice(9, 18);

  const getTotals = (holes: any[]) => ({
    yards: holes.reduce((sum, h) => sum + (h.yardage || 0), 0),
    par: holes.reduce((sum, h) => sum + (h.par || 0), 0),
    score: holes.reduce((sum, h) => sum + (h.score || 0), 0),
    net: holes.reduce((sum, h) => sum + (h.netScore || 0), 0),
    stableford: holes.reduce((sum, h) => sum + (h.stablefordPoints || 0), 0),
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
    // console.log("ppppp",payload);
    saveScoreCard(payload);
    Toast.show({
      type: "success",
      text1: "Round Finished",
      text2: "Round has been submitted successfully",
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
        hole.holeId === holeId ? { ...hole, score: "" } : hole
      )
    );
    return;
  }

  // only digits allowed
  if (!/^\d+$/.test(value)) {
    Toast.show({
      type: "error",
      text1: "Numbers only",
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
      hole.holeId === holeId ? { ...hole, score: value } : hole
    )
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

    // 🟡 Eagle / better
    if (diff <= -2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#FFD700" }]}>
            <View style={[styles.innerCircle, { borderColor: "#FFD700" }]} />
          </View>
        </View>
      );
    }

    // 🟢 Birdie
    if (diff === -1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
        </View>
      );
    }

    // ⚪ Par (optional)
    if (diff === 0) {
      return null;
    }

    // 🔴 Bogey
    if (diff === 1) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
        </View>
      );
    }

    // 🔴 Double Bogey+
    if (diff >= 2) {
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
            <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
          </View>
        </View>
      );
    }

    return null;
  };

  const RenderHeader = () => {
    return (
      <>
        <HStack
          className="px-3 pt-5 items-center"
          style={{ justifyContent: "space-between" }}
        >
          {/* LEFT: Back button */}
          <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={isDark ? "#ffffff" : "#020617"}
            />
          </Pressable>

          {/* CENTER: Title */}
          <ThemedText
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Scorecard
          </ThemedText>

          {/* RIGHT: Add Button */}
          <View style={{ width: 40 }} />
        </HStack>
        <HStack className="justify-between px-5 items-center">
          <ThemedText
            style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: "400",
              lineHeight: 30,
            }}
          >
            {excluded === "true" && stableford === "false" && (
              <ThemedText>(Net Score Exclude Par 3)</ThemedText>
            )}
            {excluded === "false" && stableford === "true" && (
              <ThemedText>(Stableford)</ThemedText>
            )}
            {excluded === "false" && stableford === "false" && (
              <ThemedText>(Net Score Include Par 3)</ThemedText>
            )}
          </ThemedText>
          <ThemedText>Handicap: {handicap as string}</ThemedText>
        </HStack>
      </>
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

        <RenderHeader />

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
                        backgroundColor: isDark ? "#262626" : "#f3f4f6",
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
                              value={h.score !== null && h.score !== undefined ? String(h.score) : ""}
                              onChangeText={(val) => handleScoreChange(h.holeId, val)}
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
                              backgroundColor: isDark ? "#262626" : "#f3f4f6",
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

                        {/*  BACK 9 */}
                        {index === 17 && (
                          <HStack
                            style={{
                              backgroundColor: isDark ? "#262626" : "#f3f4f6",
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
                        {grandTotals.stableford}
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
                      // isDark ? "#1f1f1f" : "#fff"
                      borderWidth: 1,
                      borderColor: isDark ? "#eee" : "#333",
                    }}
                  >
                    <ThemedText
                      style={{
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: 16,
                        marginBottom: 16,
                      }}
                    >
                      Score Legend
                    </ThemedText>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* 🟡 Eagle */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.doubleCircle,
                            { borderColor: "#FFD700" },
                          ]}
                        >
                          <View
                            style={[
                              styles.innerCircle,
                              { borderColor: "#FFD700" },
                            ]}
                          />
                        </View>
                        <ThemedText style={styles.legendText}>
                          Eagle (-2)
                        </ThemedText>
                      </View>

                      {/* 🟢 Birdie */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleCircle,
                            { borderColor: "#2e7d32" },
                          ]}
                        />
                        <ThemedText style={styles.legendText}>
                          Birdie (-1)
                        </ThemedText>
                      </View>

                      {/* ⚪ Par */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            borderWidth: 1,
                            borderStyle: "dashed",
                            borderColor: "#999",
                          }}
                        />
                        <ThemedText style={styles.legendText}>
                          Par (0)
                        </ThemedText>
                      </View>

                      {/* 🔴 Bogey */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleSquare,
                            { borderColor: "#d32f2f" },
                          ]}
                        />
                        <ThemedText style={styles.legendText}>
                          Bogey (+1)
                        </ThemedText>
                      </View>

                      {/* 🔴 Double Bogey */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.doubleSquare,
                            { borderColor: "#d32f2f" },
                          ]}
                        >
                          <View
                            style={[
                              styles.innerSquare,
                              { borderColor: "#d32f2f" },
                            ]}
                          />
                        </View>
                        <ThemedText style={styles.legendText}>
                          Double Bogey (+2)
                        </ThemedText>
                      </View>

                      {/* ⬛ High */}
                      <View style={styles.legendItemStyle}>
                        <View
                          style={[
                            styles.singleSquare,
                            { borderColor: isDark ? "#fff" : "#000" },
                          ]}
                        />
                        <ThemedText style={styles.legendText}>
                          +3 or more
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
