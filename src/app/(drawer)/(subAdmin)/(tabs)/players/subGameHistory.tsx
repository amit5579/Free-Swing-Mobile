import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";


import { useLocalSearchParams, useRouter } from "expo-router";
import { getPlayerGameHistory } from "@/api/subAdmin/myPlayers";


// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SubAdminGameHistoryPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

    const {playerId , playerName} = useLocalSearchParams();

const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Colors ──
  const colors = {
    bg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "rgba(15, 23, 42, 0.7)"  : "rgba(255, 255, 255, 0.7)",
    cardBorder: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    dimText: isDark ? "#64748b" : "#94a3b8",
    accent: "#84cc16",
    accentSoft: isDark ? "rgba(132,204,22,0.15)" : "rgba(132,204,22,0.1)",
    statusActive: "#22c55e",
    statusBlocked: "#ef4444",
    divider: isDark ? "#334155" : "#f1f5f9",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
    modalBg: isDark ? "#1e293b" : "#ffffff",
    inputBg: isDark ? "#0f172a" : "#f8fafc",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
    disabledBg: isDark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.6)",
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

 
  // ── Fetch ──
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await getPlayerGameHistory(Number(playerId));
      // console.log(response);
      
      setGameHistory(response || []);
    } catch (error) {
      console.error("Error fetching player game history:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load game history",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();    
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchPlayers();
    }, []),
  );
 
  // ── Skeleton ──
  const GameHistorySkeleton = () => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <HStack className="justify-between items-center mb-4">
        <Skeleton isDark={isDark} height={14} width="30%" />
        <Skeleton isDark={isDark} height={30} width={80} borderRadius={8} />
      </HStack>

      <VStack className="mb-4 gap-2">
        <Skeleton isDark={isDark} height={20} width="70%" />
        <Skeleton isDark={isDark} height={18} width={100} borderRadius={10} />
      </VStack>

      <HStack className="justify-between p-3 rounded-xl" style={{ backgroundColor: colors.iconBg }}>
        {[1, 2, 3].map((i) => (
          <VStack key={i} className="items-center gap-1" style={{ flex: 1 }}>
            <Skeleton isDark={isDark} height={10} width={30} />
            <Skeleton isDark={isDark} height={16} width={25} />
          </VStack>
        ))}
      </HStack>
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
        <Ionicons name="golf-outline" size={32} color={colors.subText} />
      </View>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 6,
        }}
      >
        No Games Found
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          color: colors.subText,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        This player hasn't recorded any rounds in this module yet. Once they
        complete a game, the scorecard and stats will be listed here.
      </ThemedText>
    </VStack>
  );

  // ── Action Button (for card) ──
  const ActionButton = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        gap: 3,
        flex: 1,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: color,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: `${color}10`,
        }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <ThemedText
        style={{
          fontSize: 10,
          color: colors.subText,
          fontWeight: "500",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  // ── Game Card ──
  const renderGameCard = ({ item }: { item: any }) => {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <HStack className="justify-between items-center mb-3">
          <HStack className="items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color={colors.subText} />
            <ThemedText style={{ fontSize: 13, color: colors.subText }}>
              {formatDate(item.date)}
            </ThemedText>
          </HStack>

          <Pressable
            onPress={() => routePage.push({
              pathname: "/(drawer)/(subAdmin)/(tabs)/players/subHistoryScoreCard",
              params: { scorecardId: item.scorecardId }
            })}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.7 : 1,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              }
            ]}
          >
            <HStack className="items-center gap-1">
              <Ionicons name="eye-outline" size={14} color={colors.accent} />
              <ThemedText style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>
                View
              </ThemedText>
            </HStack>
          </Pressable>
        </HStack>

        <VStack className="mb-4">
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
              lineHeight: 22,
            }}
          >
            {item.courseName}
          </ThemedText>
          
          {item.tournamentId && (
            <HStack className="mt-2 items-center px-2 py-0.5 rounded-md self-start" style={{ backgroundColor: "#facc1520" }}>
              <Ionicons name="trophy" size={12} color="#facc15" />
              <ThemedText style={{ fontSize: 11, fontWeight: "600", color: "#facc15", marginLeft: 4 }}>
                Tournament
              </ThemedText>
            </HStack>
          )}
        </VStack>

        <HStack
          className="justify-between p-3 rounded-xl"
          style={{
            backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "rgba(241,245,249,0.6)",
          }}
        >
          <VStack className="items-center" style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>SCORE</ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{item.score}</ThemedText>
          </VStack>
          
          <View style={{ width: 1, backgroundColor: colors.divider, height: "100%" }} />
          
          <VStack className="items-center" style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>NET SCORE</ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{item.netScore}</ThemedText>
          </VStack>
          
          <View style={{ width: 1, backgroundColor: colors.divider, height: "100%" }} />
          
          <VStack className="items-center" style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>PAR</ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{item.par}</ThemedText>
          </VStack>
        </HStack>

        {item.isDQ && (
          <HStack className="mt-3 items-center justify-center py-1 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <ThemedText style={{ fontSize: 12, fontWeight: "600", color: "#ef4444", marginLeft: 4 }}>
              Disqualified (DQ)
            </ThemedText>
          </HStack>
        )}
      </View>
    );
  };

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
             {playerName}&apos;s Games
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

      {/* ─── List ─── */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <GameHistorySkeleton />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : gameHistory.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={gameHistory}
          keyExtractor={(item, index) => item.scorecardId?.toString() || index.toString()}
          renderItem={renderGameCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 12,
  },

  statBox: {
    alignItems: "center",
    flex: 1,
  },

  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },

  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },

  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  formCol: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  fieldContainer: {
    flex: 1,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingBottom: 4,
  },

  cancelBtn: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#84cc16",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 140,
  },
});
