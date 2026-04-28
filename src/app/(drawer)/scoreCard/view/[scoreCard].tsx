import {
  getScorecardDetails,
  ScorecardHole,
} from "@/api/modules/dashboard.api";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/box";

const ScoreCard: React.FC = () => {
  const {
    scoreCard,
    handicap: paramHandicap,
    username,
    courseName,
  } = useLocalSearchParams<{
    scoreCard: string;
    handicap: string;
    username: string;
    courseName: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const displayHandicap = parseInt(paramHandicap || "0");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [holes, setHoles] = useState<ScorecardHole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderScoring =
    holes && holes.length > 0
      ? holes[0].stablefordPoints == null && holes[0].isExcluded == false
        ? "Net Score Include Par 3"
        : holes[0].stablefordPoints == null && holes[0].isExcluded == true
          ? "Net Score Exclude Par 3"
          : "Stableford"
      : "";

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        setLoading(true);
        const data = await getScorecardDetails(scoreCard!);
        setHoles(data);
      } catch (err) {
        setError("Failed to load scorecard.");
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, [scoreCard]);

  const sumScores = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.score || 0), 0);
  const sumNet = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.netScore || 0), 0);
  const sumYardage = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.yardage || 0), 0);
  const sumPar = (arr: ScorecardHole[]) =>
    arr.reduce((t, h) => t + (h.par || 0), 0);

  const front9 = holes.slice(0, 9);
  const back9 = holes.slice(9, 18);

  const renderScoreIndicator = (score: number | null, isDark: boolean) => {
    if (score == null || score < 0) return null;
    if (score === 0)
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
            <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
          </View>
        </View>
      );
    if (score === 1)
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
            <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
          </View>
        </View>
      );
    if (score === 2)
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
            <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
          </View>
        </View>
      );
    if (score === 3)
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
        </View>
      );
    if (score === 4) return null;
    if (score === 5)
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
        </View>
      );
    if (score === 6)
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
            <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
          </View>
        </View>
      );
    if (score === 7)
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
    if (score !== null && score >= 8)
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
    return null;
  };

  if (loading) {
    return (
      <ThemedView
        style={{
          flex: 1,
          backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)",
        }}
      >
        <Watermark />
        <ScrollView
          className="px-3 py-4 mt-4"
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
                width={200}
                height={24}
                style={{ marginBottom: 4 }}
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
          <View
            className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} className="flex-1 items-center">
                <Skeleton
                  isDark={isDark}
                  width={24}
                  height={14}
                  borderRadius={4}
                />
              </View>
            ))}
          </View>
          <View
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`}
          >
            {[...Array(9)].map((_, i) => (
              <View
                key={i}
                className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
              >
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <View key={j} className="flex-1 items-center">
                    <Skeleton
                      isDark={isDark}
                      width={24}
                      height={16}
                      borderRadius={4}
                    />
                  </View>
                ))}
              </View>
            ))}
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
          backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)",
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

  const renderHeader = () => {
    return (
      <>
        <View style={{ paddingTop: 10 }}>
          <HStack
            className="px-3 items-center"
            style={{ height: 30, justifyContent: "center" }}
          >
            <Pressable
              onPress={() => router.back()}
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
              ({renderScoring})
            </ThemedText>
            <Box
              style={{
                padding: 8,
                backgroundColor: "#8bc34a",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: 700 }}>
                Handicap: nohc
                {/* {handicap.handicap} */}
              </Text>
            </Box>
          </HStack>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView>
      <ThemedView
        style={{
          flex: 1,
          backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)",
        }}
      >
        <Watermark />
        {renderHeader()}
        <View
          className="px-4 pt-4 pb-2 z-10 w-full"
          style={{ backgroundColor: isDark ? "#000" : "transparent" }}
        >
          <View className="flex-row items-center mb-4 mt-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View className="flex-1">
              <Text
                className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                numberOfLines={1}
              >
                {courseName ? courseName : "Scorecard (Stableford)"}
              </Text>
              {username ? (
                <View className="flex-row items-center">
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text
                    className={`text-sm ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}
                  >
                    {username}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text
                    className={`text-sm ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Handicap: {displayHandicap}
                  </Text>
                </View>
              )}
            </View>

            {!username && (
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9",
                  borderWidth: 1,
                  borderColor: "#8BC34A",
                }}
              >
                <Ionicons name="shield-checkmark" size={14} color="#8BC34A" />
                <Text
                  className="text-xs font-bold ml-1"
                  style={{ color: "#8BC34A" }}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>

          <View
            className={`p-3 rounded-xl border flex-row items-center ${isDark ? "bg-[#1A2E05] border-[#2e5209]" : "bg-green-50 border-green-200"}`}
          >
            <Ionicons
              name={username ? "eye-outline" : "lock-closed-outline"}
              size={18}
              color={isDark ? "#8BC34A" : "#4CAF50"}
            />
            <Text
              className={`ml-2 flex-1 text-sm font-medium ${isDark ? "text-[#8BC34A]" : "text-green-800"}`}
            >
              {username
                ? `Viewing scorecard for ${username} — read-only.`
                : "This scorecard has been verified and is read-only."}
            </Text>
          </View>
        </View>

        <ScrollView
          className="px-4 flex-1"
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          <View
            className="z-10 shadow-sm"
            style={{ backgroundColor: "transparent" }}
          >
            <View
              className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#444" : "#ddd",
              }}
            >
              {["Hole", "SI", "Yards", "Par", "Score", "Net"].map((h) => (
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
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {front9.map((h, index) => (
              <View
                key={h.holeId}
                className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
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
                  {renderScoreIndicator(h.score ?? null, isDark)}
                  <Text
                    style={{
                      color: isDark ? "#fff" : "#000",
                      fontWeight: "bold",
                      textAlign: "center",
                      zIndex: 10,
                      fontSize: 13,
                    }}
                  >
                    {h.score ?? "-"}
                  </Text>
                </View>
                <Text
                  className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                >
                  {h.netScore ?? "-"}
                </Text>
              </View>
            ))}

            <View
              className={`flex-row p-3 ${isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
              style={{
                backgroundColor: isDark
                  ? "rgba(139,195,74,0.12)"
                  : "rgba(139,195,74,0.08)",
              }}
            >
              <Text
                className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
              >
                Front 9
              </Text>
              <Text className="flex-1" />
              <Text
                className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {sumYardage(front9)}
              </Text>
              <Text
                className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {sumPar(front9)}
              </Text>
              <Text
                className={`flex-1 text-center font-black text-xs ${isDark ? "text-white" : "text-black"}`}
              >
                {sumScores(front9)}
              </Text>
              <Text
                className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
              >
                {sumNet(front9)}
              </Text>
            </View>

            {back9.length > 0 &&
              back9.map((h, index) => (
                <View
                  key={h.holeId}
                  className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
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
                    {renderScoreIndicator(h.score ?? null, isDark)}
                    <Text
                      style={{
                        color: isDark ? "#fff" : "#000",
                        fontWeight: "bold",
                        textAlign: "center",
                        zIndex: 10,
                        fontSize: 13,
                      }}
                    >
                      {h.score ?? "-"}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                  >
                    {h.netScore ?? "-"}
                  </Text>
                </View>
              ))}

            {back9.length > 0 && (
              <View
                className={`flex-row p-3 ${isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
                style={{
                  backgroundColor: isDark
                    ? "rgba(139,195,74,0.12)"
                    : "rgba(139,195,74,0.08)",
                }}
              >
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                >
                  Back 9
                </Text>
                <Text className="flex-1" />
                <Text
                  className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {sumYardage(back9)}
                </Text>
                <Text
                  className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {sumPar(back9)}
                </Text>
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-white" : "text-black"}`}
                >
                  {sumScores(back9)}
                </Text>
                <Text
                  className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}
                >
                  {sumNet(back9)}
                </Text>
              </View>
            )}

            <View
              className="flex-row p-3"
              style={{ backgroundColor: "#8BC34A" }}
            >
              <Text className="flex-1 text-center font-black text-xs text-white">
                Grand Total
              </Text>
              <Text className="flex-1" />
              <Text className="flex-1 text-center font-bold text-xs text-white">
                {sumYardage(holes)}
              </Text>
              <Text className="flex-1 text-center font-bold text-xs text-white">
                {sumPar(holes)}
              </Text>
              <Text className="flex-1 text-center font-black text-xs text-white">
                {sumScores(holes)}
              </Text>
              <Text className="flex-1 text-center font-black text-xs text-white">
                {sumNet(holes)}
              </Text>
            </View>
          </View>

          {(() => {
            const scoreCounts: Record<number, number> = {};
            holes.forEach((h) => {
              const s = h.score;
              if (s != null && s >= 0) {
                scoreCounts[s] = (scoreCounts[s] || 0) + 1;
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
                scoreVal: 1,
                label: "Hole-in-One",
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
                scoreVal: 0,
                label: "Albatross",
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
                scoreVal: 2,
                label: "Eagle",
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
                scoreVal: 3,
                label: "Birdie",
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
                scoreVal: 4,
                label: "Par",
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
                scoreVal: 5,
                label: "Bogey",
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
                scoreVal: 6,
                label: "Double Bogey",
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
                scoreVal: 7,
                label: "Triple Bogey",
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
                scoreVal: 8,
                label: "Quad Bogey+",
                render: (_count: number) => {
                  const quadCount = Object.entries(scoreCounts)
                    .filter(([k]) => Number(k) >= 8)
                    .reduce((s, [, v]) => s + v, 0);
                  return (
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
                      <InnerCount
                        count={quadCount}
                        color={isDark ? "#fff" : "#000"}
                      />
                    </View>
                  );
                },
              },
            ];

            const rows: (typeof dynamicLegend)[] = [];
            for (let i = 0; i < dynamicLegend.length; i += 3) {
              rows.push(dynamicLegend.slice(i, i + 3));
            }

            return (
              <View
                className="mb-20 p-4 rounded-2xl"
                style={{
                  backgroundColor: isDark
                    ? "rgba(31,31,31,0.6)"
                    : "rgba(255,255,255,0.6)",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(51,51,51,0.6)"
                    : "rgba(238,238,238,0.6)",
                }}
              >
                <Text
                  className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}
                >
                  Scorecard Legend
                </Text>
                {rows.map((row, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      marginBottom: 20,
                    }}
                  >
                    {row.map((item, idx) => {
                      const count =
                        item.scoreVal === 8
                          ? 0
                          : scoreCounts[item.scoreVal] || 0;
                      return (
                        <View
                          key={idx}
                          style={{ flex: 1, alignItems: "center" }}
                        >
                          {item.render(count)}
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
                ))}
              </View>
            );
          })()}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
};

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

export default ScoreCard;
