import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
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
      <Box className="bg-white border border-gray-200 p-8 rounded-xl items-center">
        <Ionicons name="documents-outline" size={32} color="#9ca3af" />
        <Text className="text-gray-400 font-medium mt-2">
          No games in progress
        </Text>
      </Box>
    );
  }

  return (
    <VStack space="md">
      {games.map((game) => (
        <Box key={game.id} className="p-4 bg-white border border-gray-200 rounded-xl">
          <Text className="font-bold text-gray-900">{game.courseName}</Text>
          <HStack className="items-center mt-1 space-x-2">
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text className="text-xs text-gray-500">
              {new Date(game.date).toDateString()}
            </Text>
            <Text className="text-xs text-gray-300 mx-1">•</Text>
            <Badge className="bg-gray-100 rounded-md px-2 py-0.5 shrink-0 self-start">
              <Text className="text-[10px] font-medium text-gray-800">
                {game.holesPlayed} Holes Played
              </Text>
            </Badge>
          </HStack>

          <HStack className="mt-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => onDelete(game.id)}
              className="border border-red-200 rounded-full flex-1 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
              <Text className="text-red-500 text-sm font-semibold ml-1.5">
                Delete
              </Text>
            </Button>

            <Button
              size="sm"
              onPress={() => onResume(game.id)}
              className="bg-[#8BC34A] rounded-full flex-1 flex-row items-center justify-center"
            >
              <Text className="text-white text-sm font-semibold mr-1.5">
                Resume
              </Text>
              <Ionicons name="arrow-forward" size={14} color="white" />
            </Button>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}