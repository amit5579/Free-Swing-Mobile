import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  ScrollView,
  Modal,
  TouchableOpacity,
  Text,
  TextInput,
} from "react-native";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getTournamentPlayers,
  getGroups,
  saveGroups,
} from "@/api/modules/subAdmin/tournaments.api";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";

export default function manageGroups() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [tournamentGroups, setTournamentGroups] = useState<
    { scorerId: number | null; groupName: string; members: any[] }[]
  >([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentGroupIndexForAdd, setCurrentGroupIndexForAdd] = useState<number>(-1);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const players = await getTournamentPlayers(Number(tournamentId));
      setAllPlayers(players || []);

      const groupsData = await getGroups(Number(tournamentId));
      if (groupsData && Array.isArray(groupsData)) {
        const mappedGroups = groupsData.map((g: any, index: number) => ({
          scorerId: g.scorerId,
          groupName: `Group ${index + 1} - g.groupName`,
          members: g.memberIds
            ? g.memberIds
                .map((mId: number) => players.find((p: any) => (p.userId || p.id) === mId))
                .filter(Boolean)
            : g.members
            ? g.members.map((m: any) => players.find((p: any) => (p.userId || p.id) === (m.userId || m.id))).filter(Boolean)
            : [],
        }));
        setTournamentGroups(mappedGroups);
      } else {
        setTournamentGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups/players:", error);
      Toast.show({ type: "error", text1: "Failed to load groups" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [tournamentId]);

  const addGroup = () => {
    setTournamentGroups([...tournamentGroups, { scorerId: null, groupName: `Group ${tournamentGroups.length + 1}`, members: [] }]);
  };

  const removeGroup = (index: number) => {
    const nextGroups = [...tournamentGroups];
    nextGroups.splice(index, 1);
    setTournamentGroups(nextGroups);
  };

  const removePlayerFromGroup = (groupIndex: number, memberIndex: number) => {
    const nextGroups = [...tournamentGroups];
    const player = nextGroups[groupIndex].members.splice(memberIndex, 1)[0];
    
    // If scorer removed, reset scorer
    if (nextGroups[groupIndex].scorerId === (player.userId || player.id)) {
      if (nextGroups[groupIndex].members.length > 0) {
        nextGroups[groupIndex].scorerId = nextGroups[groupIndex].members[0].userId || nextGroups[groupIndex].members[0].id;
      } else {
        nextGroups[groupIndex].scorerId = null;
      }
    }
    setTournamentGroups(nextGroups);
  };

  const setScorer = (groupIndex: number, playerId: number) => {
    const nextGroups = [...tournamentGroups];
    nextGroups[groupIndex].scorerId = playerId;
    setTournamentGroups(nextGroups);
  };

  const handleSaveGroups = async () => {
    try {
      setSaving(true);
      const payload = [];
      for (let i = 0; i < tournamentGroups.length; i++) {
        const g = tournamentGroups[i];
        if (g.members.length === 0) continue;
        if (!g.scorerId) {
          Toast.show({ type: "error", text1: `Group ${i + 1} is missing a scorer.` });
          return;
        }
        if (g.members.length > 4) {
          Toast.show({ type: "error", text1: `Group ${i + 1} exceeds max 4 players.` });
          return;
        }
        payload.push({
          scorerId: g.scorerId,
          groupName: g.groupName,
          memberIds: g.members.map((m: any) => m.userId || m.id),
        });
      }

      await saveGroups(Number(tournamentId), payload);
      Toast.show({ type: "success", text1: "Groups saved successfully!" });
      routePage.back();
    } catch (error) {
      console.error("Save error:", error);
      Toast.show({ type: "error", text1: "Failed to save groups" });
    } finally {
      setSaving(false);
    }
  };

  const openAddPlayerModal = (groupIndex: number) => {
    setCurrentGroupIndexForAdd(groupIndex);
    setModalVisible(true);
  };

  const addPlayerToCurrentGroup = (player: any) => {
    if (currentGroupIndexForAdd === -1) return;
    const nextGroups = [...tournamentGroups];
    nextGroups[currentGroupIndexForAdd].members.push(player);
    
    // auto set scorer if first
    if (!nextGroups[currentGroupIndexForAdd].scorerId) {
      nextGroups[currentGroupIndexForAdd].scorerId = player.userId || player.id;
    }
    setTournamentGroups(nextGroups);
    setModalVisible(false);
  };

  // Get players not in any group
  const groupedPlayerIds = new Set(
    tournamentGroups.flatMap((g) => g.members.map((m) => m.userId || m.id))
  );
  const unassignedPlayers = allPlayers.filter(
    (p) => !groupedPlayerIds.has(p.userId || p.id)
  );

  const renderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => routePage.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#020617"} />
        </Pressable>

        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            marginHorizontal: 8,
            color: isDark ? "#fff" : "#020617",
          }}
        >
          Manage Groups
        </ThemedText>

        <View style={{ width: 40 }} />
      </HStack>
    </Box>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <Watermark />
      {renderHeader()}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <VStack className="p-4 gap-4">
          <ThemedText style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b" }}>
            Organize players into groups and designate a scorer for each group for the tournament: {tournamentName}
          </ThemedText>
          
          {loading ? (
            <Skeleton isDark={isDark} height={150} width="100%" borderRadius={14} />
          ) : (
            tournamentGroups.map((group, groupIndex) => (
              <Box
                key={`group-${groupIndex}`}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: 14,
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  padding: 16,
                }}
              >
                <HStack style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: "700", color: "#8bc34a" }}>
                    Group {groupIndex + 1}
                  </ThemedText>
                  <Pressable onPress={() => removeGroup(groupIndex)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </HStack>

                <TextInput
                  value={group.groupName}
                  onChangeText={(text) => {
                    const nextGroups = [...tournamentGroups];
                    nextGroups[groupIndex].groupName = text;
                    setTournamentGroups(nextGroups);
                  }}
                  placeholder="Enter Group Name"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  style={{
                    color: isDark ? "#fff" : "#000",
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                    paddingVertical: 8,
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                />
                <Divider style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0", marginBottom: 12 }} />

                {group.members.map((member, memberIndex) => (
                  <HStack key={`member-${memberIndex}`} style={{ alignItems: "center", marginBottom: 10, justifyContent: "space-between" }}>
                    <HStack style={{ alignItems: "center", flex: 1 }}>
                      <Pressable
                        onPress={() => setScorer(groupIndex, member.userId || member.id)}
                        style={{ marginRight: 10 }}
                      >
                        <Ionicons
                          name={group.scorerId === (member.userId || member.id) ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={group.scorerId === (member.userId || member.id) ? "#8bc34a" : (isDark ? "#64748b" : "#94a3b8")}
                        />
                      </Pressable>
                      <VStack>
                        <ThemedText style={{ fontSize: 15, fontWeight: "500" }}>
                          {member.username || member.firstName || "Unknown Player"}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 11, color: isDark ? "#64748b" : "#94a3b8" }}>
                          {group.scorerId === (member.userId || member.id) ? "Designated Scorer" : "Player"}
                        </ThemedText>
                      </VStack>
                    </HStack>
                    <Pressable onPress={() => removePlayerFromGroup(groupIndex, memberIndex)}>
                      <Ionicons name="close-circle" size={20} color={isDark ? "#64748b" : "#94a3b8"} />
                    </Pressable>
                  </HStack>
                ))}

                {group.members.length < 4 && (
                  <Pressable
                    onPress={() => openAddPlayerModal(groupIndex)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 10,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderColor: "#8bc34a",
                      borderRadius: 10,
                      backgroundColor: isDark ? "rgba(139,195,74,0.1)" : "rgba(139,195,74,0.05)",
                    }}
                  >
                    <Ionicons name="add" size={18} color="#8bc34a" style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: "#8bc34a", fontWeight: "600" }}>Add Player</ThemedText>
                  </Pressable>
                )}
              </Box>
            ))
          )}

          {!loading && (
            <Pressable
              onPress={addGroup}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={isDark ? "#f1f5f9" : "#0f172a"} style={{ marginRight: 8 }} />
              <ThemedText style={{ fontWeight: "600" }}>Add New Group</ThemedText>
            </Pressable>
          )}
        </VStack>
      </ScrollView>

      {/* Save Button Fixed Footer */}
      {!loading && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: 30,
            backgroundColor: isDark ? "rgba(2,6,23,0.9)" : "rgba(255,255,255,0.9)",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1e293b" : "#e2e8f0",
          }}
        >
          <Pressable
            onPress={handleSaveGroups}
            disabled={saving}
            style={{
              backgroundColor: "#8bc34a",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <ThemedText style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              {saving ? "Saving..." : "Save Groups"}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Add Player Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: "70%",
              padding: 20,
            }}
          >
            <HStack style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>Select Player</ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
              </Pressable>
            </HStack>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {unassignedPlayers.length === 0 ? (
                <ThemedText style={{ textAlign: "center", marginTop: 40, color: isDark ? "#94a3b8" : "#64748b" }}>
                  No unassigned players available.
                </ThemedText>
              ) : (
                unassignedPlayers.map((p) => (
                  <Pressable
                    key={p.userId || p.id}
                    onPress={() => addPlayerToCurrentGroup(p)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={30} color={isDark ? "#cbd5e1" : "#475569"} style={{ marginRight: 12 }} />
                    <ThemedText style={{ fontSize: 16 }}>
                      {p.username || p.firstName || "Unknown"}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
