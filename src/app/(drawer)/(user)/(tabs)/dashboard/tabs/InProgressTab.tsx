import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme } from "react-native";
import { getInProgressGames, InProgressApiItem } from "@/api/dashboard";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "expo-router";

export type InProgressGame = {
  id: string;
  courseName: string;
  date: string;
  holesPlayed: number;
};

type InProgressTabProps = {
  playerId: number;
  onDelete?: (id: string) => void;
  onResume?: (id: string) => void;
};

export function InProgressTab({
  playerId,
  onDelete = () => { },
  onResume = () => { },
}: InProgressTabProps) {
  const [games, setGames] = useState<InProgressGame[]>([]);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useFocusEffect(
  useCallback(() => {
    fetchGames();
  }, [playerId])
);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const data: InProgressApiItem[] = await getInProgressGames(playerId);

      const mapped = data.map((item) => ({
        id: item.scorecardId.toString(),
        courseName: item.courseName,
        date: item.date,
        holesPlayed: item.holesPlayed,
      }));

      setGames(mapped);
    } catch (error) {
      console.error("Error fetching in-progress games:", error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <VStack space="md" className="p-4">
        {[1, 2].map((key) => (
          <Box
            key={key}
            className="mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 10,
              elevation: 4,
              backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)",
              borderLeftWidth: 6,
              borderLeftColor: "#8BC34A",
              borderTopWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: "rgba(139, 195, 74, 0.3)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <Box className="p-4">
              <Skeleton isDark={isDark} width="60%" height={24} style={{ marginBottom: 8 }} />
              <HStack space="sm" className="items-center mb-4">
                <Skeleton isDark={isDark} width={80} height={14} />
                <Skeleton isDark={isDark} width={100} height={20} borderRadius={6} />
              </HStack>
              <HStack space="sm">
                <Skeleton isDark={isDark} width="48%" height={36} borderRadius={20} />
                <Skeleton isDark={isDark} width="48%" height={36} borderRadius={20} />
              </HStack>
            </Box>
          </Box>
        ))}
      </VStack>
    );
  }

  if (!games.length) {
    return (
      <Box
        className="p-8 rounded-xl items-center"
        style={{
          backgroundColor: isDark ? "#161618" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? "#8BC34A" : "#E5E7EB",
        }}
      >
        <Ionicons name="documents-outline" size={32} color="#9ca3af" />
        <Text
          style={{
            color: isDark ? "#FFFFFF" : "#6B7280",
            fontWeight: "500",
            marginTop: 8,
          }}
        >
          No games in progress
        </Text>
      </Box>
    );
  }

  return (
    <VStack space="md">
      {games.map((game) => (
        <Box
          key={game.id}
          className="mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 10,
            elevation: 4,
            backgroundColor: isDark
              ? "rgba(26,26,26,0.6)"
              : "rgba(255,255,255,0.7)",
            borderLeftWidth: 6,
            borderLeftColor: "#8BC34A",
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor: "rgba(139, 195, 74, 0.3)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <Box className="p-4">
            {/* Course Name */}
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {game.courseName}
            </Text>

            {/* Date + Holes Played */}
            <HStack className="items-center mt-1 space-x-2">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: 12,
                }}
              >
                {new Date(game.date).toDateString()}
              </Text>

              <Text
                style={{
                  color: isDark ? "#6B7280" : "#9CA3AF",
                  marginHorizontal: 4,
                }}
              >
                •
              </Text>

              <Badge
                style={{
                  backgroundColor: isDark ? "rgba(22, 22, 24, 0.8)" : "rgba(243, 244, 246, 0.8)",
                  borderWidth: 1,
                  borderColor: "rgba(139, 195, 74, 0.3)",
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: 10,
                    fontWeight: "500",
                  }}
                >
                  {game.holesPlayed} Holes Played
                </Text>
              </Badge>
            </HStack>

            {/* Buttons */}
            <HStack className="mt-4 justify-between">
              <Button
                variant="outline"
                size="sm"
                onPress={() => onDelete(game.id)}
                className="rounded-full flex-row items-center justify-center"
                style={{
                  borderColor: isDark ? "#EF4444" : "#FCA5A5",
                  width: "48%",
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={14}
                  color={isDark ? "#EF4444" : "#DC2626"}
                />
                <Text
                  style={{
                    color: isDark ? "#EF4444" : "#DC2626",
                    fontWeight: "600",
                    marginLeft: 6,
                  }}
                >
                  Delete
                </Text>
              </Button>

              <Button
                size="sm"
                onPress={() => onResume(game.id)}
                className="rounded-full flex-row items-center justify-center"
                style={{
                  backgroundColor: "#8BC34A",
                  width: "48%",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                    marginRight: 6,
                  }}
                >
                  Resume
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </Button>
            </HStack>
          </Box>
        </Box>
      ))}
    </VStack>
  );
}