import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme } from "react-native";
import { getInProgressGames, InProgressApiItem } from "@/api/dashboard";

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
  onDelete = () => {},
  onResume = () => {},
}: InProgressTabProps) {
  const [games, setGames] = useState<InProgressGame[]>([]);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    fetchGames();
  }, [playerId]);

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
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="small" color="#8BC34A" />
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
          className="p-4 rounded-xl"
          style={{
            backgroundColor: isDark ? "#161618" : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? "#8BC34A" : "#E5E7EB",
          }}
        >
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
                backgroundColor: isDark ? "#161618" : "#F3F4F6",
                borderWidth: 1,
                borderColor: isDark ? "#8BC34A" : "#E5E7EB",
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
          <HStack className="mt-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => onDelete(game.id)}
              className="rounded-full flex-1 flex-row items-center justify-center"
              style={{
                borderColor: isDark ? "#EF4444" : "#FCA5A5",
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
              className="rounded-full flex-1 flex-row items-center justify-center"
              style={{
                backgroundColor: "#8BC34A",
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
      ))}
    </VStack>
  );
}