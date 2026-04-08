import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  FlatList,
  ActivityIndicator,
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
import {
  addToRoaster,
  getRoasterPlayers,
  getTournamentPlayers,
  removeFromRoaster,
} from "@/api/subAdmin/tournaments";

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ManageRoasterPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [players, setPlayers] = useState<any[]>([]);
  const [tournamentPlayerIds, setTournamentPlayerIds] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
    statusActive: "#22c55e",
    statusBlocked: "#ef4444",
    divider: isDark ? "#334155" : "#f1f5f9",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
  };

  // ── Fetch ──
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const [rosterResponse, tournamentPlayersResponse] = await Promise.all([
        getRoasterPlayers(),
        getTournamentPlayers(Number(tournamentId)),
      ]);

      setPlayers(rosterResponse || []);

      const inTournamentIds = new Set<number>(
        (tournamentPlayersResponse || []).map((p: any) => p.id || p.userId),
      );
      setTournamentPlayerIds(inTournamentIds);
    } catch (error) {
      console.error("Error fetching roaster players:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load players roster",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRoaster = async (playerId: number) => {
    if (actionLoading) return;
    try {
      setActionLoading(playerId);
      await addToRoaster(Number(tournamentId), playerId);

      Toast.show({
        type: "success",
        text1: "Player Added to Tournament",
      });
      setTournamentPlayerIds((prev) => new Set(prev).add(playerId));
    } catch (error) {
      console.error("Error adding to roaster:", error);
      Toast.show({
        type: "error",
        text1: "Failed to add player to roster",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromRoaster = async (playerId: number) => {
    if (actionLoading) return;
    try {
      setActionLoading(playerId);
      await removeFromRoaster(Number(tournamentId), playerId);

      Toast.show({
        type: "success",
        text1: "Player Removed from Tournament",
      });
      setTournamentPlayerIds((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    } catch (error) {
      console.error("Error removing from roaster:", error);
      Toast.show({
        type: "error",
        text1: "Failed to remove player from roster",
      });
    } finally {
      setActionLoading(null);
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
  const PlayerSkeleton = () => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <HStack style={{ alignItems: "center", marginBottom: 16 }}>
        <Skeleton
          isDark={isDark}
          height={46}
          width={46}
          borderRadius={23}
          style={{ marginRight: 14 }}
        />
        <VStack style={{ flex: 1, gap: 8 }}>
          <Skeleton isDark={isDark} height={18} width="60%" />
          <Skeleton isDark={isDark} height={14} width="80%" />
        </VStack>
        <VStack style={{ alignItems: "center", gap: 4 }}>
          <Skeleton isDark={isDark} height={10} width={30} />
          <Skeleton isDark={isDark} height={24} width={40} borderRadius={12} />
        </VStack>
      </HStack>
      <Skeleton isDark={isDark} height={40} width="100%" borderRadius={10} />
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
        You have no players in your sub-admin roster. Please add some players to
        your account first to invite them.
      </ThemedText>
    </VStack>
  );

  // ── Player Card ──
  const renderPlayerCard = ({ item }: { item: any }) => {
    const isAdded = tournamentPlayerIds.has(item.id);
    const isLoading = actionLoading === item.id;

    // Dynamic avatar color
    const getAvatarColor = (name: string) => {
      const colorsArr = [
        "#ef4444",
        "#3b82f6",
        "#8b5cf6",
        "#f59e0b",
        "#10b981",
        "#ec4899",
      ];
      const idx = (name?.charCodeAt(0) || 0) % colorsArr.length;
      return colorsArr[idx];
    };
    const avatarColor = getAvatarColor(item.username);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            borderColor: isAdded ? "#84cc16" : isDark ? "#1e293b" : "#e2e8f0",
            borderWidth: isAdded ? 1.5 : 1,
            elevation: 0,
            shadowOpacity: 0,
          },
        ]}
      >
        <HStack style={{ alignItems: "center", marginBottom: 12 }}>
          {/* Avatar Area */}
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              backgroundColor: `${avatarColor}20`,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <ThemedText
              style={{ fontSize: 20, fontWeight: "700", color: avatarColor }}
            >
              {item.username?.charAt(0).toUpperCase()}
            </ThemedText>
          </View>

          {/* Player Info */}
          <VStack style={{ flex: 1, justifyContent: "center" }}>
            <ThemedText
              style={{ fontSize: 16, fontWeight: "700", color: colors.text }}
            >
              {item.username}
            </ThemedText>
            <ThemedText
              style={{ fontSize: 12, color: colors.subText, marginTop: 2 }}
            >
              {item.email}
            </ThemedText>
          </VStack>

          {/* Handicap Display */}
          <VStack style={{ alignItems: "center" }}>
            <ThemedText
              style={{
                fontSize: 9,
                fontWeight: "600",
                color: colors.subText,
                marginBottom: 4,
              }}
            >
              HANDICAP
            </ThemedText>
            <View
              style={[
                styles.handicapBadge,
                { backgroundColor: isDark ? "#1e293b" : "#f8fafc", width: 40 },
              ]}
            >
              <ThemedText style={{ fontSize: 14, fontWeight: "700" }}>
                {item.handicap}
              </ThemedText>
            </View>
          </VStack>
        </HStack>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
            marginBottom: 12,
          }}
        />

        {/* Action Button - Simplified */}
        {isAdded ? (
          <Pressable
            onPress={() => handleRemoveFromRoaster(item.id)}
            disabled={isLoading}
            style={[
              styles.actionBtn,
              {
                backgroundColor: "#fff0f0",
                borderColor: "#f87171",
                borderWidth: 1,
                minHeight: 45,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="remove-circle-outline"
                  size={18}
                  color="#ef4444"
                />
                <ThemedText
                  style={{ color: "#ef4444", fontWeight: "700", marginLeft: 8 }}
                >
                  Remove from Tournament
                </ThemedText>
              </View>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => handleAddToRoaster(item.id)}
            disabled={isLoading}
            style={[
              styles.actionBtn,
              {
                backgroundColor: "#84cc16",
                minHeight: 45,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="person-add-outline" size={18} color="#ffffff" />
                <ThemedText
                  style={{ color: "#ffffff", fontWeight: "700", marginLeft: 8 }}
                >
                  Add to Tournament
                </ThemedText>
              </View>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  // ── Header ──
  const renderHeader = () => {
    return (
      <View style={{ marginBottom: 16 }}>
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
            Manage Roster:{" "}
            <ThemedText
              style={{
                color: colors.accent,
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {tournamentName}
            </ThemedText>
          </ThemedText>
        </HStack>

        <ThemedText
          style={{
            fontSize: 14,
            color: colors.subText,
            textAlign: "center",
            marginTop: 4,
            paddingHorizontal: 20,
          }}
        >
          Select players from your roster to invite them to this tournament.
        </ThemedText>
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
      {loading && players.length === 0 ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <PlayerSkeleton />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : players.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          renderItem={renderPlayerCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  handicapBadge: {
    borderWidth: 1,
    height: 26,
    minWidth: 36,
    paddingHorizontal: 8,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
});
