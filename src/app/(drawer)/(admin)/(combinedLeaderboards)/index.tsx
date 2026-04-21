import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Skeleton } from "@/components/Skeleton";

import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { Modal, Pressable, View } from "react-native";

import { Text } from "@/components/text";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getTournaments } from "@/api/admin/tournaments";
import { getCombinedLeaderboard } from "@/api/combinedLeaderboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tournament = {
  tournamentId: number;
  name: string;
  startDate: string;
  course: { name: string };
};

type LeaderboardEntry = {
  rank?: number;
  userId: number;
  playerName: string;
  grossScore: number;
  netScore: number;
  points: number;
  holesPlayed: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CombinedLeaderboardsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  // Tournament picker modal
  const [modalVisible, setModalVisible] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  // Selected tournament IDs for combined leaderboard
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Combined leaderboard result
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // ─── Fetch tournament list ──────────────────────────────────────────────────

  const fetchTournaments = useCallback(async () => {
    setLoadingTournaments(true);
    try {
      const data = await getTournaments();
      // console.log("[CombinedLeaderboards] tournaments:", data?.length);
      setTournaments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[CombinedLeaderboards] fetchTournaments error:", error);
      setTournaments([]);
    } finally {
      setLoadingTournaments(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // ─── Toggle selection ───────────────────────────────────────────────────────

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // ─── Generate combined leaderboard ─────────────────────────────────────────

  const generateLeaderboard = async () => {
    if (selectedIds.length === 0) return;
    setModalVisible(false);
    setLoadingLeaderboard(true);
    setHasGenerated(true);

    try {
      // Fetch leaderboard for each selected tournament and merge
      const results = await Promise.all(
        selectedIds.map((id) => getCombinedLeaderboard(id)),
      );

      // Flatten and aggregate by userId
      const merged: Record<number, LeaderboardEntry> = {};
      for (const result of results) {
        const entries: any[] = Array.isArray(result) ? result : [];
        for (const entry of entries) {
          const uid = entry.userId ?? entry.playerId;
          if (uid == null) continue;
          if (merged[uid]) {
            merged[uid].grossScore += entry.grossScore ?? entry.gross ?? 0;
            merged[uid].netScore += entry.netScore ?? entry.net ?? 0;
            merged[uid].points += entry.points ?? 0;
            merged[uid].holesPlayed += entry.holesPlayed ?? entry.holes ?? 0;
          } else {
            merged[uid] = {
              userId: uid,
              playerName: entry.playerName ?? entry.name ?? "Unknown",
              grossScore: entry.grossScore ?? entry.gross ?? 0,
              netScore: entry.netScore ?? entry.net ?? 0,
              points: entry.points ?? 0,
              holesPlayed: entry.holesPlayed ?? entry.holes ?? 0,
            };
          }
        }
      }

      // Sort by points desc
      const sorted = Object.values(merged).sort((a, b) => b.points - a.points);
      // console.log("[CombinedLeaderboards] merged entries:", sorted.length);
      setLeaderboard(sorted);
    } catch (error) {
      console.error("[CombinedLeaderboards] generateLeaderboard error:", error);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const selectedTournamentNames = tournaments
    .filter((t) => selectedIds.includes(t.tournamentId))
    .map((t) => t.name);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <VStack className="my-3 px-4">
          <HStack className="items-center justify-between">
            <Pressable onPress={() => routePage.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color="#8bc34a" />
            </Pressable>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isDark ? "white" : "black",
              }}
            >
              Combined Leaderboards
            </Text>

            <View style={{ width: 24 }} />
          </HStack>

          <ThemedText
            style={{
              fontSize: 14,
              opacity: 0.6,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Aggregate scores across multiple tournaments
          </ThemedText>
        </VStack>

        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-4 pb-20">
            {/* Select button */}
            <Pressable
              onPress={() => setModalVisible(true)}
              style={[styles.selectButton, { borderColor: "#8bc34a" }]}
            >
              <Ionicons
                name="trophy-outline"
                size={16}
                color="#8bc34a"
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: "#8bc34a", fontWeight: "600" }}>
                Select Tournaments ({selectedIds.length} selected)
              </Text>
            </Pressable>

{/* Empty state */}
{selectedTournamentNames.length === 0 && (
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
                                        backgroundColor: isDark
                                          ? "rgba(30,41,59,0.5)"
                                          : "rgba(241,245,249,0.8)",
                                        padding: 18,
                                        borderRadius: 50,
                                        marginBottom: 16,
                                      }}
                                    >
                                      <Ionicons
                                        name="trophy"
                                        size={32}
                                        color={"#8bc34a"}
                                      />
                                    </View>
                                    <ThemedText
                                      style={{
                                        fontSize: 18,
                                        fontWeight: "600",
                                        color: isDark ? "#f1f5f9" : "#0f172a",
                                        marginBottom: 6,
                                      }}
                                    >
No Leaderboard Generated
                                    </ThemedText>
                                    <ThemedText
                                      style={{
                                        fontSize: 14,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        textAlign: "center",
                                        lineHeight: 20,
                                      }}
                                    >
                                      Select tournaments from above and generate the combined standings.
                                    </ThemedText>
                                  </VStack>
)}
            {/* Selected tournament chips */}
            {selectedTournamentNames.length > 0 && (
              <>
              <ThemedText style={{fontSize:16,fontWeight:"600",marginTop:10,marginBottom:5}}>Selected Tournaments:</ThemedText>
               <HStack className="flex-wrap gap-2">
                {selectedTournamentNames.map((name, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{name}</Text>
                  </View>
                ))}
              </HStack></>
             
            )}

            {/* Generate button */}
            {/* {selectedIds.length > 0 && (
              <Pressable
                style={[
                  styles.generateButton,
                  loadingLeaderboard && { opacity: 0.6 },
                ]}
                onPress={generateLeaderboard}
                disabled={loadingLeaderboard}
              >
                {loadingLeaderboard ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.generateButtonText}>
                    Generate Combined Leaderboard
                  </Text>
                )}
              </Pressable>
            )} */}

            {/* Loading state — skeleton cards */}
            {loadingLeaderboard && (
              <View style={{ marginTop: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                  <LeaderboardCardSkeleton key={i} isDark={isDark} />
                ))}
              </View>
            )}

            {/* Empty state */}
            {!loadingLeaderboard &&
              hasGenerated &&
              leaderboard.length === 0 && (
                <VStack className="items-center mt-10">
                  <Ionicons
                    name="bar-chart-outline"
                    size={40}
                    color="#9ca3af"
                  />
                  <Text
                    style={{
                      color: isDark ? "#aaa" : "#6b7280",
                      marginTop: 10,
                    }}
                  >
                    No data found for selected tournaments
                  </Text>
                </VStack>
              )}

            {/* Leaderboard rows */}
            {!loadingLeaderboard && leaderboard.length > 0 && (
              <View style={{ marginTop: 16 }}>
                {leaderboard.map((entry, index) => (
                  <CombinedPlayerCard
                    key={entry.userId}
                    entry={entry}
                    rank={index + 1}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}
          </VStack>
        </ScrollView>
      </SafeAreaView>

      {/* Tournament picker modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1e1e1e" : "white" },
            ]}
          >
            <HStack className="justify-between items-center mb-4">
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "white" : "black",
                }}
              >
                Select Tournaments
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>
            </HStack>

            {loadingTournaments ? (
              <View style={{ paddingVertical: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TournamentRowSkeleton key={i} isDark={isDark} />
                ))}
              </View>
            ) : tournaments.length === 0 ? (
              <VStack className="items-center py-8">
                <Ionicons name="trophy-outline" size={32} color="#9ca3af" />
                <Text style={{ color: "#9ca3af", marginTop: 8 }}>
                  No tournaments found
                </Text>
              </VStack>
            ) : (
              <ScrollView
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
              >
                {tournaments.map((tournament) => {
                  const isSelected = selectedIds.includes(
                    tournament.tournamentId,
                  );
                  return (
                    <Pressable
                      key={tournament.tournamentId}
                      onPress={() => toggleSelection(tournament.tournamentId)}
                      style={[
                        styles.tournamentRow,
                        isSelected && {
                          backgroundColor: isDark
                            ? "rgba(139,195,74,0.15)"
                            : "rgba(139,195,74,0.1)",
                        },
                        { borderBottomColor: isDark ? "#333" : "#f0f0f0" },
                      ]}
                    >
                      <VStack style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 15,
                            color: isSelected
                              ? "#8bc34a"
                              : isDark
                                ? "white"
                                : "black",
                          }}
                        >
                          # {tournament.tournamentId}
                        </Text>
                        <HStack className="items-center gap-2">
                          <Text
                            style={{
                              fontWeight: "700",
                              fontSize: 15,
                              color: isSelected
                                ? "#8bc34a"
                                : isDark
                                  ? "white"
                                  : "black",
                            }}
                          >
                            {tournament.name}
                          </Text>
                        </HStack>

                        <HStack className="gap-3 mt-1">
                          <HStack className="items-center gap-1">
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color="#9ca3af"
                            />
                            <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                              {tournament.course?.name ?? "—"}
                            </Text>
                          </HStack>
                          <HStack className="items-center gap-1">
                            <Ionicons
                              name="calendar-outline"
                              size={12}
                              color="#9ca3af"
                            />
                            <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                              {formatDate(tournament.startDate)}
                            </Text>
                          </HStack>
                        </HStack>
                      </VStack>

                      {/* Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={13} color="#fff" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              style={[
                styles.applyButton,
                selectedIds.length === 0 && { opacity: 0.5 },
              ]}
              onPress={generateLeaderboard}
              disabled={selectedIds.length === 0}
            >
              <Text style={styles.applyButtonText}>
                Generate ({selectedIds.length} selected)
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Combined Player Card ─────────────────────────────────────────────────────

function CombinedPlayerCard({
  entry,
  rank,
  isDark,
}: {
  entry: any;
  rank: number;
  isDark: boolean;
}) {
  const rankColor =
    rank === 1
      ? "#FFD700"
      : rank === 2
        ? "#C0C0C0"
        : rank === 3
          ? "#CD7F32"
          : "#84cc16";

  return (
    <View
      style={[
        cardStyles.card,
        { borderColor: rank <= 3 ? rankColor : isDark ? "#333" : "#ddd", backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
 },
      ]}
    >
      {/* HEADER */}
      <HStack style={cardStyles.header}>
        <View style={[cardStyles.rank, { backgroundColor: rankColor }]}>
          <ThemedText style={{ fontWeight: "700", fontSize: 13, color: "#fff" }}>
            {rank}
          </ThemedText>
        </View>

        <VStack style={{ flex: 1 }}>
          <ThemedText style={cardStyles.name}>{entry.playerName}</ThemedText>
          <ThemedText style={cardStyles.sub}>
            {entry.holesPlayed} holes played
          </ThemedText>
        </VStack>

        <VStack style={{ alignItems: "flex-end" }}>
          <ThemedText style={cardStyles.points}>{entry.points}</ThemedText>
          <ThemedText style={cardStyles.sub}>PTS</ThemedText>
        </VStack>
      </HStack>

      {/* SUMMARY STATS */}
      <HStack style={cardStyles.summary}>
        <CombinedStat label="GROSS" value={entry.grossScore} />
        <CombinedStat label="NET" value={entry.netScore} />
        <CombinedStat label="PTS" value={entry.points} />
        <CombinedStat label="HOLES" value={entry.holesPlayed} />
      </HStack>
    </View>
  );
}

function CombinedStat({ label, value }: { label: string; value: any }) {
  return (
    <VStack style={cardStyles.stat}>
      <ThemedText style={cardStyles.statValue}>{value ?? "-"}</ThemedText>
      <ThemedText style={cardStyles.statLabel}>{label}</ThemedText>
    </VStack>
  );
}

// ─── Skeleton: Leaderboard Card ───────────────────────────────────────────────

function LeaderboardCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        borderColor: isDark ? "#333" : "#ddd",
      }}
    >
      {/* Header row: rank circle + name + pts */}
      <HStack style={{ alignItems: "center" }}>
        <Skeleton isDark={isDark} height={32} width={32} borderRadius={16} style={{ marginRight: 10 }} />
        <VStack style={{ flex: 1, gap: 6 }}>
          <Skeleton isDark={isDark} height={14} width="55%" />
          <Skeleton isDark={isDark} height={11} width="35%" />
        </VStack>
        <VStack style={{ alignItems: "flex-end", gap: 4 }}>
          <Skeleton isDark={isDark} height={16} width={36} />
          <Skeleton isDark={isDark} height={10} width={24} />
        </VStack>
      </HStack>

      {/* Stats row: GROSS | NET | PTS | HOLES */}
      <HStack style={{ marginTop: 14, justifyContent: "space-between" }}>
        {[1, 2, 3, 4].map((i) => (
          <VStack key={i} style={{ alignItems: "center", flex: 1, gap: 4 }}>
            <Skeleton isDark={isDark} height={16} width={32} />
            <Skeleton isDark={isDark} height={10} width={28} />
          </VStack>
        ))}
      </HStack>
    </View>
  );
}

// ─── Skeleton: Tournament Row ─────────────────────────────────────────────────

function TournamentRowSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <HStack
      style={{
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#333" : "#f0f0f0",
        gap: 10,
      }}
    >
      <VStack style={{ flex: 1, gap: 6 }}>
        <Skeleton isDark={isDark} height={14} width="50%" />
        <HStack style={{ gap: 12 }}>
          <Skeleton isDark={isDark} height={11} width="30%" />
          <Skeleton isDark={isDark} height={11} width="30%" />
        </HStack>
      </VStack>
      <Skeleton isDark={isDark} height={22} width={22} borderRadius={6} />
    </HStack>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    alignItems: "center",
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  sub: {
    fontSize: 12,
    opacity: 0.6,
  },
  points: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
  },
  summary: {
    marginTop: 12,
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
});



const styles = StyleSheet.create({
  selectButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  generateButton: {
    backgroundColor: "#8bc34a",
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  generateButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "92%",
    borderRadius: 18,
    padding: 20,
    maxHeight: "80%",
  },
  tournamentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#8bc34a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxSelected: {
    backgroundColor: "#8bc34a",
  },
  applyButton: {
    backgroundColor: "#8bc34a",
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});
