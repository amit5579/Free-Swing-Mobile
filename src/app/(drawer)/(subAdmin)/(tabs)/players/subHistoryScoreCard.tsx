import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { useLocalSearchParams, useRouter } from "expo-router";
import { getPlayerScorecard } from "@/api/subAdmin/myPlayers";

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SubAdminGameHistoryScoreCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
    const {scorecardId} = useLocalSearchParams();
    const[scorecard,setScorecard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Colors ──
  const colors = {
    bg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBorder: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    dimText: isDark ? "#64748b" : "#94a3b8",
    accent: "#84cc16",
    accentSoft: isDark ? "rgba(132,204,22,0.15)" : "rgba(132,204,22,0.1)",
    divider: isDark ? "#334155" : "#f1f5f9",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
  };

  // ── Calculation Helpers ──
  const sumScores = (arr: any[]) => arr?.reduce((t, h) => t + (h.score || 0), 0) || 0;
  const sumNet = (arr: any[]) => arr?.reduce((t, h) => t + (h.netScore || 0), 0) || 0;
  const sumYardage = (arr: any[]) => arr?.reduce((t, h) => t + (h.yardage || 0), 0) || 0;
  const sumPar = (arr: any[]) => arr?.reduce((t, h) => t + (h.par || 0), 0) || 0;
  const sumPts = (arr: any[]) => arr?.reduce((t, h) => t + (h.stablefordPoints || 0), 0) || 0;

  const front9 = scorecard?.slice(0, 9) || [];
  const back9 = scorecard?.slice(9, 18) || [];

  const renderScoreIndicator = (score: number | null, par: number | null) => {
    if (score == null || par == null || score <= 0) return null;
    
    // Hole-in-one special case
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

    if (diff === -2) { // Eagle
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
            <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
          </View>
        </View>
      );
    }
    if (diff === -1) { // Birdie
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
        </View>
      );
    }
    if (diff === 0) return null; // Par
    if (diff === 1) { // Bogey
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
        </View>
      );
    }
    if (diff === 2) { // Double Bogey
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
            <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
          </View>
        </View>
      );
    }
    if (diff === 3) { // Triple Bogey
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a" }]}>
            <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a" }]}>
              <View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a" }]} />
            </View>
          </View>
        </View>
      );
    }
    if (diff >= 4) { // Quad Bogey+
      return (
        <View style={styles.indicatorContainer}>
          <View style={[styles.singleSquare, { borderColor: isDark ? "#fff" : "#000" }]} />
        </View>
      );
    }
    return null;
  };

  // ── Fetch ──
  const fetchScorecard = async () => {
    try {
      const response =  await getPlayerScorecard(Number(scorecardId))
    //   console.log("rrrr",response);
      
setScorecard(response);
    } catch (error) {
      console.error("Error fetching players:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load scorecard",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    
    fetchScorecard();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchScorecard();
    }, []),
  );

  // ── Submit Form ──
  const onSubmit = async () => {
    try {
    } catch (error) {
    } finally {
    }
  };

  // ── Skeleton ──
  const ScorecardSkeleton = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-6 mt-4">
        <Skeleton isDark={isDark} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <View className="flex-1">
          <Skeleton isDark={isDark} width="60%" height={24} style={{ marginBottom: 4 }} borderRadius={6} />
          <Skeleton isDark={isDark} width="40%" height={16} borderRadius={4} />
        </View>
      </View>
      
      <View className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} className="flex-1 items-center">
            <Skeleton isDark={isDark} width={20} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
      
      <View className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`}>
        {[...Array(9)].map((_, i) => (
          <View key={i} className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}>
            {[1, 2, 3, 4, 5, 6, 7].map((j) => (
              <View key={j} className="flex-1 items-center">
                <Skeleton isDark={isDark} width={22} height={16} borderRadius={4} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );

  // ── Empty State ──
  const EmptyState = () => (
    <VStack
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          backgroundColor: colors.iconBg,
          padding: 18,
          borderRadius: 50,
          marginBottom: 16,
        }}
      >
        <Ionicons name="people-outline" size={32} color={colors.subText} />
      </View>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 6,
        }}
      >
        No Players Found
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          color: colors.subText,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Players assigned to your account will appear here. Tap "Add Player" to
        invite one.
      </ThemedText>
    </VStack>
  );


  // ── Scorecard Row ──
  const ScorecardRow = ({ h, index }: { h: any; index: number }) => (
    <View
      key={h.holeId || index}
      className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
    >
      <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{h.holeNumber}</Text>
      <Text className={`flex-1 text-center text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.handicap}</Text>
      <Text className={`flex-1 text-center text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.yardage}</Text>
      <Text className={`flex-1 text-center text-xs ${isDark ? "text-white" : "text-black"}`}>{h.par}</Text>
      <View className="flex-1 items-center justify-center relative">
        {renderScoreIndicator(h.score ?? null, h.par ?? null)}
        <Text style={{ color: isDark ? "#fff" : "#000", fontWeight: "bold", textAlign: "center", zIndex: 10, fontSize: 13 }}>
          {h.score ?? "-"}
        </Text>
      </View>
      <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>
        {h.netScore ?? "-"}
      </Text>
      <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-blue-500" : "text-blue-700"}`}>
        {h.stablefordPoints ?? "0"}
      </Text>
    </View>
  );

  const SummaryRow = ({ title, data, isGrand = false }: { title: string; data: any[]; isGrand?: boolean }) => (
    <View
      className={`flex-row p-3 ${isGrand ? "" : isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
      style={{ backgroundColor: isGrand ? (isDark ? "#2e5209" : "#8BC34A") : isDark ? "rgba(139,195,74,0.12)" : "rgba(139,195,74,0.08)" }}
    >
      <Text className={`flex-1 text-center font-black text-[10px] ${isGrand ? "text-white" : isDark ? "text-[#8BC34A]" : "text-green-700"}`}>{title}</Text>
      <Text className="flex-1" />
      <Text className={`flex-1 text-center text-[10px] font-bold ${isGrand ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"}`}>{sumYardage(data)}</Text>
      <Text className={`flex-1 text-center text-[10px] font-bold ${isGrand ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"}`}>{sumPar(data)}</Text>
      <Text className={`flex-1 text-center font-black text-[10px] ${isGrand ? "text-white" : isDark ? "text-white" : "text-black"}`}>{sumScores(data)}</Text>
      <Text className={`flex-1 text-center font-black text-[10px] ${isGrand ? "text-white" : isDark ? "text-[#8BC34A]" : "text-green-700"}`}>{sumNet(data)}</Text>
      <Text className={`flex-1 text-center font-black text-[10px] ${isGrand ? "text-white" : "text-blue-500"}`}>{sumPts(data)}</Text>
    </View>
  );

  // ── Header ──
  const renderHeader = () => {
    return (
      <View>
        <HStack
          className="px-3 items-center"
          style={{ height: 60, justifyContent: "center" }}
        >
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

        {/* <HStack className="justify-between px-5 items-center mb-2">
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 13, opacity: 0.8 }}>
                {scoringType ? `(${scoringType})` : "(Net Score)"}
              </ThemedText>
            </View>
            {handicap !== null && handicap !== undefined && (
              <ThemedText style={{ fontWeight: "600" }}>
                Handicap: {typeof handicap === "object" ? JSON.stringify(handicap) : handicap}
              </ThemedText>
            )}
          </HStack> */}
      </View>
    );
  };
  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={{ flex: 1 }}>
      <Watermark />

      {/* ─── Header ─── */}
      {renderHeader()}

      {loading ? (
        <View className="px-4">
          <ScorecardSkeleton />
        </View>
      ) : !scorecard || scorecard.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView className="px-4 flex-1" showsVerticalScrollIndicator={false}>
          {/* ─── Table Header ─── */}
          <View
            className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
            style={{ borderWidth: 1, borderColor: isDark ? "#444" : "#ddd" }}
          >
            {["Hole", "SI", "Yards", "Par", "Score", "Net", "Pts"].map((h) => (
              <Text key={h} className={`flex-1 text-center font-bold text-[10px] ${isDark ? "text-white" : "text-black"}`}>
                {h}
              </Text>
            ))}
          </View>

          {/* ─── Table Body ─── */}
          <View
            className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden mb-6`}
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
          >
            {front9.map((h: any, index: number) => (
              <ScorecardRow key={h.holeId || `f-${index}`} h={h} index={index} />
            ))}
            <SummaryRow title="Front 9" data={front9} />

            {back9.length > 0 && back9.map((h: any, index: number) => (
              <ScorecardRow key={h.holeId || `b-${index}`} h={h} index={index} />
            ))}
            {back9.length > 0 && <SummaryRow title="Back 9" data={back9} />}

            <SummaryRow title="Grand Total" data={scorecard} isGrand />
          </View>

          {/* ─── Legend ─── */}
          {(() => {
            const scoreCounts: Record<string, number> = {};
            scorecard.forEach((h: any) => {
              const diff = h.score - h.par;
              if (h.score === 1) scoreCounts["HIO"] = (scoreCounts["HIO"] || 0) + 1;
              else if (diff === -2) scoreCounts["Eagle"] = (scoreCounts["Eagle"] || 0) + 1;
              else if (diff === -1) scoreCounts["Birdie"] = (scoreCounts["Birdie"] || 0) + 1;
              else if (diff === 0) scoreCounts["Par"] = (scoreCounts["Par"] || 0) + 1;
              else if (diff === 1) scoreCounts["Bogey"] = (scoreCounts["Bogey"] || 0) + 1;
              else if (diff === 2) scoreCounts["DoubleBogey"] = (scoreCounts["DoubleBogey"] || 0) + 1;
              else if (diff === 3) scoreCounts["TripleBogey"] = (scoreCounts["TripleBogey"] || 0) + 1;
              else if (diff >= 4) scoreCounts["QuadBogey"] = (scoreCounts["QuadBogey"] || 0) + 1;
            });

            const LegendItem = ({ count, color, label, icon }: { count: number; color: string; label: string; icon: () => React.ReactNode }) => (
              <View style={{ flex: 1, alignItems: "center", minWidth: "30%", marginBottom: 20 }}>
                <View style={{ position: "relative", marginBottom: 6 }}>
                  {icon()}
                  {count > 0 && (
                    <View style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center", zIndex: 10 }}>
                      <Text style={{ color, fontSize: 10, fontWeight: "900" }}>{count}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 9, fontWeight: "500", color: isDark ? "#D1D5DB" : "#4B5563", textAlign: "center" }}>{label}</Text>
              </View>
            );

            return (
              <View
                className="mb-20 p-5 rounded-2xl"
                style={{
                  backgroundColor: isDark ? "rgba(31,31,31,0.6)" : "rgba(255,255,255,0.6)",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(51,51,51,0.6)" : "rgba(238,238,238,0.6)",
                }}
              >
                <Text className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}>
                  Scorecard Legend
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <LegendItem count={scoreCounts["HIO"]} color="#ffd700" label="Hole-in-One" 
                    icon={() => <View style={[styles.doubleCircle, { borderColor: "#ffd700", width: 40, height: 40 }]}><View style={[styles.innerCircle, { borderColor: "#ffd700", width: 30, height: 30 }]} /></View>} 
                  />
                  <LegendItem count={scoreCounts["Eagle"]} color="#2e7d32" label="Eagle" 
                    icon={() => <View style={[styles.doubleCircle, { borderColor: "#2e7d32", width: 40, height: 40 }]}><View style={[styles.innerCircle, { borderColor: "#2e7d32", width: 30, height: 30 }]} /></View>} 
                  />
                  <LegendItem count={scoreCounts["Birdie"]} color="#2e7d32" label="Birdie" 
                    icon={() => <View style={[styles.singleCircle, { borderColor: "#2e7d32", width: 40, height: 40 }]} />} 
                  />
                  <LegendItem count={scoreCounts["Par"]} color="#9CA3AF" label="Par" 
                    icon={() => <View style={{ width: 40, height: 40, borderStyle: "dashed", borderWidth: 1.5, borderColor: "#9CA3AF" }} />} 
                  />
                  <LegendItem count={scoreCounts["Bogey"]} color="#d32f2f" label="Bogey" 
                    icon={() => <View style={[styles.singleSquare, { borderColor: "#d32f2f", width: 40, height: 40 }]} />} 
                  />
                  <LegendItem count={scoreCounts["DoubleBogey"]} color="#d32f2f" label="Double Bogey" 
                    icon={() => <View style={[styles.doubleSquare, { borderColor: "#d32f2f", width: 40, height: 40 }]}><View style={[styles.innerSquare, { borderColor: "#d32f2f", width: 30, height: 30 }]} /></View>} 
                  />
                  <LegendItem count={scoreCounts["TripleBogey"]} color="#6a1b9a" label="Triple Bogey" 
                    icon={() => <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a", width: 40, height: 40 }]}><View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a", width: 32, height: 32 }]}><View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a", width: 24, height: 24 }]} /></View></View>} 
                  />
                  <LegendItem count={scoreCounts["QuadBogey"]} color={isDark ? "#fff" : "#000"} label="Quad Bogey+" 
                    icon={() => <View style={[styles.singleSquare, { borderColor: isDark ? "#fff" : "#000", width: 40, height: 40 }]} />} 
                  />
                </View>
              </View>
            );
          })()}
        </ScrollView>
      )}
    </ThemedView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#84cc16",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  listContent: {
    padding: 16,
    paddingBottom: 80,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  indicatorContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  doubleCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 30,
    height: 30,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  singleCircle: {
    width: 34,
    height: 34,
    borderRadius: 18,
    borderWidth: 2,
  },
  doubleSquare: {
    width: 34,
    height: 34,
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
  singleSquare: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
  },
  tripleSquareOuter: {
    width: 38,
    height: 38,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareMid: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareInner: {
    width: 22,
    height: 22,
    borderRadius: 2,
    borderWidth: 1,
  },
});
