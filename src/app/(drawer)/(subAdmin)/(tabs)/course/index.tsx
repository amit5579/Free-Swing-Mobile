import React, { useEffect, useState, useCallback } from "react";
import {
  useColorScheme,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import Watermark from "@/components/watermark";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Skeleton } from "@/components/Skeleton";
import {
  getSubAdminCourses,
  getSubAdminPlayers,
  SubAdminCourse,
  UserApi,
  invitePlayer,
  toggleBlockPlayer,
  removePlayer,
} from "@/api/subAdmin/dashboard";

const PlayerRowSkeleton = ({ isDark }: { isDark: boolean }) => (
  <HStack
    style={{
      alignItems: "center",
      marginBottom: 14,
      padding: 16,
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
      borderLeftWidth: 6,
      borderLeftColor: "#8BC34A",
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
    }}
  >
    <Skeleton isDark={isDark} width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
    <VStack style={{ flex: 1 }}>
      <Skeleton isDark={isDark} height={14} width="45%" style={{ marginBottom: 5 }} />
      <Skeleton isDark={isDark} height={11} width="65%" />
    </VStack>
    <Skeleton isDark={isDark} height={26} width={60} borderRadius={10} />
  </HStack>
);

const PlayerRow = ({
  player,
  isDark,
  onToggleBlock,
  onDelete,
}: {
  player: UserApi;
  isDark: boolean;
  onToggleBlock: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const isActive = !player.isBlocked;
  const initial = player.username?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <VStack
      style={{
        padding: 16,
        borderRadius: 22,
        backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.6)",
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: isDark ? "rgba(139,195,74,0.6)" : "#E0E0E0",
        marginBottom: 16,
        shadowColor: "#8BC34A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 14,
        elevation: 8,
      }}
    >
      <HStack style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <HStack style={{ alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isDark ? "#2a2a2a" : "#fff",
              borderWidth: 2,
              borderColor: "#8BC34A",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: isDark ? "#fff" : "#2E7D32" }}>
              {initial}
            </Text>
          </View>
          <VStack style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: isDark ? "#fff" : "#111" }} numberOfLines={1}>
              {player.username}
            </Text>
            <Text style={{ fontSize: 11, color: isDark ? "#888" : "#6b7280", fontWeight: "600", textTransform: "uppercase", marginTop: 1 }}>
              Course Marshal
            </Text>
          </VStack>
        </HStack>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: isActive ? "rgba(139,195,74,0.15)" : "rgba(239,68,68,0.15)",
            borderWidth: 1,
            borderColor: isActive ? "#8BC34A" : "#ef4444",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: isActive ? "#8BC34A" : "#ef4444", textTransform: "uppercase" }}>
            {isActive ? "Active" : "Blocked"}
          </Text>
        </View>
      </HStack>

      <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", marginBottom: 14 }} />

      <HStack style={{ alignItems: "center", justifyContent: "space-between" }}>
        <VStack style={{ flex: 1, gap: 6 }}>
          <HStack style={{ alignItems: "center", gap: 8 }}>
            <Ionicons name="mail-outline" size={16} color={isDark ? "#8BC34A" : "#666"} />
            <Text style={{ fontSize: 14, color: isDark ? "#fff" : "#444", fontWeight: "500" }} numberOfLines={1}>
              {player.email}
            </Text>
          </HStack>
          <HStack style={{ alignItems: "center", gap: 8 }}>
            <Ionicons name="call-outline" size={16} color={isDark ? "#8BC34A" : "#666"} />
            <Text style={{ fontSize: 14, color: isDark ? "#fff" : "#444", fontWeight: "600" }}>
              {player.mobileNumber || "—"}
            </Text>
          </HStack>
        </VStack>

        <HStack style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={() => onToggleBlock(player.id)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
            }}
          >
            <Ionicons
              name={isActive ? "ban-outline" : "lock-open-outline"}
              size={18}
              color={isActive ? "#ef4444" : "#8BC34A"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(player.id)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(239,68,68,0.2)" : "#fecaca",
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default function SubAdminCoursePage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<UserApi[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [, playerData] = await Promise.all([
        getSubAdminCourses(),
        getSubAdminPlayers(),
      ]);
      setPlayers(
        playerData.filter((p: UserApi) => p.role?.toLowerCase() === "coursemarshal")
      );
    } catch (error) {
      console.error("Failed to fetch SubAdmin course data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = (id: number) => {
    const player = players.find((p: UserApi) => p.id === id);
    if (!player) return;

    Alert.alert(
      player.isBlocked ? "Unblock Player" : "Block Player",
      `Are you sure you want to ${player.isBlocked ? "unblock" : "block"} ${player.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: player.isBlocked ? "Unblock" : "Block",
          style: player.isBlocked ? "default" : "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await toggleBlockPlayer(id);
              setPlayers((prev: UserApi[]) =>
                prev.map((p: UserApi) =>
                  p.id === id ? { ...p, isBlocked: !p.isBlocked } : p
                )
              );
              Alert.alert("Success", `Player ${player.isBlocked ? "unblocked" : "blocked"} successfully`);
            } catch (error) {
              Alert.alert("Error", "Failed to update player status");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemove = (id: number) => {
    const player = players.find((p: UserApi) => p.id === id);
    if (!player) return;

    Alert.alert(
      "Remove Player",
      `Are you sure you want to remove ${player.username}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await removePlayer(id);
              setPlayers((prev: UserApi[]) => prev.filter((p: UserApi) => p.id !== id));
              Alert.alert("Success", "Player removed successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to remove player");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
      <Watermark />

      <VStack style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <HStack style={{ alignItems: "center", justifyContent: "space-between" }}>
          <VStack>
            <HStack style={{ alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#111", letterSpacing: -0.5 }}>
                Course Marshals
              </Text>
            </HStack>
            {/* <Text style={{ fontSize: 13, color: isDark ? "#aaa" : "#6b7280", marginTop: 2 }}>
              Players assigned to manage your courses
            </Text> */}
          </VStack>
          <HStack style={{ gap: 8, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => router.push("/(drawer)/(subAdmin)/(tabs)/course/invite-marshal" as any)}
              style={{
                backgroundColor: "#8BC34A",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                shadowColor: "#8BC34A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                Invite
              </Text>
            </TouchableOpacity>
          </HStack>
        </HStack>
      </VStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
      >
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <PlayerRowSkeleton key={i} isDark={isDark} />
            ))}
          </>
        ) : players.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="person-outline" size={52} color={isDark ? "#333" : "#ddd"} />
            <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? "#555" : "#999", fontWeight: "600" }}>
              No course marshals found
            </Text>
          </View>
        ) : (
          players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isDark={isDark}
              onToggleBlock={handleToggleBlock}
              onDelete={handleRemove}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

