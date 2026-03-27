import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Pressable,
} from "react-native";
import { PlayerApi } from "@/api/admin/dashboard";
import { useRouter } from "expo-router";
import { Avatar, AvatarImage } from "@/components/avatar";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Divider } from "@/components/divider";
import { Ionicons } from "@expo/vector-icons";

const PlayerCard = ({
  player,
  isDark,
  isExpanded,
  onToggle,
}: {
  player: PlayerApi;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleViewHistory = () => {
    router.push({
      pathname: "/(drawer)/(admin)/(tabs)/dashboard/playerHistory",
      params: {
        userId: player.id.toString(),
        username: player.username,
      },
    });
  };

  return (
    <Box
      style={{
        backgroundColor: isDark
          ? "rgba(26,26,26,0.4)"
          : "rgba(255,255,255,0.35)",
        borderRadius: 20,
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        borderTopWidth: isDark ? 1.5 : 0,
        borderRightWidth: isDark ? 1.5 : 0,
        borderBottomWidth: isDark ? 1.5 : 0,
        borderColor: isDark ? "#8BC34A" : "transparent",
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: "hidden",
      }}
    >
      {/* CARD HEADER */}
      <Pressable onPress={onToggle}>
        <HStack className="items-center justify-between">
          <HStack className="items-center" style={{ flex: 1 }}>
            <Avatar
              size="md"
              style={{
                borderWidth: 2,
                borderColor: !player.isBlocked ? "#8BC34A" : "#EF4444",
                backgroundColor: !player.isBlocked
                  ? "rgba(139,195,74,0.1)"
                  : "rgba(239,68,68,0.1)",
                marginRight: 12,
              }}
            >
              {player.profilePictureUrl && player.profilePictureUrl.trim() !== "" && player.profilePictureUrl !== "null" && !imageError ? (
                <AvatarImage
                  source={{
                    uri: player.profilePictureUrl.startsWith('http') ? player.profilePictureUrl : `https://kolve18freeswing.com${player.profilePictureUrl}`,
                  }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <ThemedText
                  style={{
                    fontWeight: "800",
                    color: !player.isBlocked ? "#8BC34A" : "#EF4444",
                  }}
                >
                  {player.username.charAt(0).toUpperCase()}
                </ThemedText>
              )}
            </Avatar>
            <VStack>
              <ThemedText style={{ fontWeight: "800", fontSize: 17 }}>
                {player.username}
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 11,
                  color: isDark ? "#888" : "#999",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Player ID: #{player.id}
              </ThemedText>
            </VStack>
          </HStack>

          <HStack className="items-center">
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#8BC34A"
            />
          </HStack>
        </HStack>
      </Pressable>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <VStack style={{ marginTop: 20 }}>
          <Divider
            style={{
              marginBottom: 16,
              backgroundColor: isDark ? "#333" : "#F0F0F0",
            }}
          />

          {/* Statistics Grid */}
          <HStack style={{ flexWrap: "wrap", gap: 16 }}>
            <VStack style={{ width: "47%" }}>
              <ThemedText
                style={{
                  fontSize: 10,
                  color: "#999",
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                HANDICAP INDEX
              </ThemedText>
              <HStack className="items-center">
                <Ionicons name="ribbon-outline" size={14} color="#FFB300" />
                <ThemedText
                  style={{
                    marginLeft: 6,
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#FFB300",
                  }}
                >
                  {player.handicap}
                </ThemedText>
              </HStack>
            </VStack>

            <VStack style={{ width: "47%" }}>
              <ThemedText
                style={{
                  fontSize: 10,
                  color: "#999",
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                TOTAL ROUNDS
              </ThemedText>
              <HStack className="items-center">
                <Ionicons name="golf-outline" size={14} color="#8BC34A" />
                <ThemedText
                  style={{ marginLeft: 6, fontSize: 14, fontWeight: "700" }}
                >
                  {player.totalRounds}
                </ThemedText>
              </HStack>
            </VStack>

            <VStack style={{ width: "47%" }}>
              <ThemedText
                style={{
                  fontSize: 10,
                  color: "#999",
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                AVERAGE SCORE
              </ThemedText>
              <HStack className="items-center">
                <Ionicons
                  name="stats-chart-outline"
                  size={14}
                  color="#8BC34A"
                />
                <ThemedText
                  style={{ marginLeft: 6, fontSize: 14, fontWeight: "700" }}
                >
                  {player.averageScore?.toFixed(1) ?? "-"}
                </ThemedText>
              </HStack>
            </VStack>

            <VStack style={{ width: "47%" }}>
              <ThemedText
                style={{
                  fontSize: 10,
                  color: "#999",
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                COURSES PLAYED
              </ThemedText>
              <HStack className="items-center">
                <Ionicons name="map-outline" size={14} color="#8BC34A" />
                <ThemedText
                  style={{ marginLeft: 6, fontSize: 14, fontWeight: "700" }}
                >
                  {player.coursesPlayed}
                </ThemedText>
              </HStack>
            </VStack>
          </HStack>

          {/* Action Button */}
          <HStack style={{ marginTop: 24, justifyContent: "flex-end" }}>
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(139,195,74,0.15)",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(139,195,74,0.2)",
              }}
              onPress={handleViewHistory}
            >
              <Ionicons name="time-outline" size={16} color="#2E7D32" />
              <ThemedText
                style={{
                  color: "#2E7D32",
                  fontWeight: "800",
                  marginLeft: 8,
                  fontSize: 13,
                }}
              >
                View History
              </ThemedText>
            </TouchableOpacity>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

interface PlayerStatisticsProps {
  players: PlayerApi[];
  loading: boolean;
}

export default function PlayerStatistics({
  players,
  loading,
}: PlayerStatisticsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Auto-expand first item if it exists and no others are expanded
    if (players && players.length > 0 && Object.keys(expanded).length === 0) {
      setExpanded({ [players[0].id]: true });
    }
  }, [players]);

  const toggleMember = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#000" : "#f2f2f2",
        }}
      >
        <ActivityIndicator size="large" color="#8BC34A" />
        <ThemedText style={{ marginTop: 12, color: "#8BC34A" }}>
          Loading statistics...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PlayerCard
            player={item}
            isDark={isDark}
            isExpanded={!!expanded[item.id]}
            onToggle={() => toggleMember(item.id)}
          />
        )}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: 10,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
