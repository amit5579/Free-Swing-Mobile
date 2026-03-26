import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFeed, FeedApi } from "@/api/admin/dashboard";
import { likeFeedApi } from "@/api/dashboard";
import Watermark from "@/components/watermark";
import { Button, ButtonText } from "@/components/button";
import { useRouter } from "expo-router";

export type Scorecard = {
  id: string;
  playerName: string;
  date: string;
  courseName: string;
  teeBoxName: string;
  holes: number;
  grossScore: number;
  grossDiff: number;
  net: number;
  points: number;
  likes: number;
  isLiked?: boolean;
  isTournament: boolean;
  isAuthenticated: boolean;
  authenticatedBy: string | null;
  canAuthenticate: boolean;
};

const diffLabel = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const diffColor = (n: number) => (n < 0 ? "#ef4444" : "#10b981");

const FeedCard = ({
  card,
  isDark,
  isExpanded,
  onToggle,
  handleLike,
  handleViewScorecard
}: {
  card: Scorecard;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  handleLike: (id: string) => void;
  handleViewScorecard: (id: string) => void;
}) => {
  return (
    <Box
      className="mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 10,
        elevation: 4,
        backgroundColor: isDark
          ? "rgba(26,26,26,0.4)"
          : "rgba(255,255,255,0.35)",
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        borderTopWidth: isDark ? 1.5 : 1.0,
        borderRightWidth: isDark ? 1.5 : 0,
        borderBottomWidth: isDark ? 1.5 : 0,
        borderColor: isDark ? "#8BC34A" : "transparent",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* CARD HEADER (Toggle Expand/Collapse) */}
      <Pressable 
        onPress={onToggle} 
        className="px-4 pt-4 pb-3"
        style={{ borderRadius: 20 }}
      >
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center flex-1">
            <Box
              style={{
                width: 45,
                height: 45,
                borderRadius: 48,
                borderWidth: 2,
                borderColor: "#8BC34A",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
              }}
            >
              <Text
                style={{
                  color: isDark ? "#fff" : "#111",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                {card.playerName.charAt(0).toUpperCase()}
              </Text>
            </Box>
            <VStack>
              <Text
                className="font-bold text-2xl"
                style={{ color: isDark ? "#fff" : "#111" }}
              >
                {card.playerName}
              </Text>
              <HStack space="xs" className="items-center mt-0.5">
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={isDark ? "#aaa" : "#9ca3af"}
                />
                <Text
                  className="text-xs"
                  style={{ color: isDark ? "#ccc" : "#6b7280" }}
                >
                  {card.date}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack space="sm" className="items-center">
            {card.isTournament && (
              <Badge
                size="sm"
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: isDark ? "#F59E0B" : "#FBBF24",
                }}
              >
                <BadgeText
                  className="text-white font-bold text-[10px]"
                >
                  Tournament
                </BadgeText>
              </Badge>
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#8BC34A"
              style={{ marginLeft: 4 }}
            />
          </HStack>
        </HStack>

        {/* Course & Holes info always visible in header row or just below */}
        {!isExpanded && (
          <HStack space="sm" className="items-center mt-2 flex-wrap">
            <HStack space="xs" className="items-center">
              <Ionicons name="flag-outline" size={11} color={isDark ? "#aaa" : "#9ca3af"} />
              <Text className="text-xs" style={{ color: isDark ? "#ccc" : "#6b7280" }}>{card.courseName}</Text>
            </HStack>
            <Badge size="sm" className="rounded-full px-2 py-0.5" style={{ backgroundColor: isDark ? "#374151" : "#111827" }}>
              <BadgeText className="text-white font-semibold text-[10px]">{card.holes} Holes</BadgeText>
            </Badge>
          </HStack>
        )}
      </Pressable>

      {/* FULL CARD DETAILS (Visible when Expanded) */}
      {isExpanded && (
        <VStack style={{ marginTop: 0 }}>
          <Divider style={{ marginBottom: 16, backgroundColor: isDark ? "#333" : "#F0F0F0" }} />
          <VStack space="xs" className="px-4 pb-2">
            <HStack space="xs" className="items-center flex-wrap">
              <Ionicons
                name="flag-outline"
                size={11}
                color={isDark ? "#aaa" : "#9ca3af"}
              />
              <Text
                className="text-xs"
                style={{ color: isDark ? "#ccc" : "#6b7280" }}
              >
                {card.courseName}
              </Text>
              <Box
                className="rounded px-1.5 py-0.5"
                style={{
                  backgroundColor: isDark ? "#333" : "#DBEAFE",
                }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: isDark ? "#fff" : "#1E3A8A" }}
                >
                  {card.teeBoxName}
                </Text>
              </Box>
                <Badge
                  size="sm"
                  className="rounded-full px-3 py-1"
                  style={{
                    backgroundColor: isDark ? "#374151" : "#111827",
                  }}
                >
                  <BadgeText className="text-white font-semibold text-xs">
                    {card.holes} Holes
                  </BadgeText>
                </Badge>
            </HStack>
          </VStack>

          {/* Stats Block (Gross & To Par) */}
          <HStack space="sm" className="mx-4 mb-4">
            <Box
              className="flex-1 rounded-2xl py-6 items-center border"
              style={{
                borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
              }}
            >
              <Text
                className="text-[10px] uppercase font-bold tracking-widest mb-1"
                style={{ color: isDark ? "#aaa" : "#9CA3AF" }}
              >
                Gross
              </Text>
              <Text
                className="text-4xl font-black tracking-tighter"
                style={{ color: isDark ? "#fff" : "#111" }}
              >
                {card.grossScore}
              </Text>
            </Box>

            <Box
              className="flex-1 rounded-2xl py-6 items-center border"
              style={{
                borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
              }}
            >
              <Text
                className="text-[10px] uppercase font-bold tracking-widest mb-1"
                style={{ color: isDark ? "#aaa" : "#9CA3AF" }}
              >
                To Par
              </Text>
              <Text
                style={{ color: diffColor(card.grossDiff) }}
                className="text-4xl font-black tracking-tighter"
              >
                {diffLabel(card.grossDiff)}
              </Text>
            </Box>
          </HStack>

          {/* NET / POINTS */}
          <HStack space="sm" className="mx-4 mb-3">
            {[
              { label: "Net", value: card.net, green: true },
              { label: "Points", value: card.points, green: true },
            ].map((s) => (
              <Box
                key={s.label}
                className="flex-1 rounded-xl items-center py-3 border"
                style={{
                  backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                  borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                }}
              >
                <Text
                  className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: isDark ? "#aaa" : "#6b7280" }}
                >
                  {s.label}
                </Text>
                <Text
                  className={`text-base font-bold`}
                  style={{
                    color: s.green ? "#10B981" : isDark ? "#fff" : "#111",
                  }}
                >
                  {s.value}
                </Text>
              </Box>
            ))}
          </HStack>

          <Divider
            className="bg-outline-100"
            style={{ backgroundColor: isDark ? "#333" : "#E5E7EB" }}
          />

          {/* Footer */}
          <HStack
            className="px-4 py-4 justify-between items-center"
            style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.5)" : "rgba(249, 250, 251, 0.7)" }}
          >
            <HStack space="lg" className="items-center">
              <Pressable
                onPressIn={() => handleLike(card.id)}
                android_ripple={{ color: "#ccc", borderless: true }}
                hitSlop={10}
                className="p-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E5E7EB",
                }}
              >
                <Ionicons
                  name={card.isLiked ? "heart" : "heart-outline"}
                  size={20}
                  color={card.isLiked ? "#EF4444" : isDark ? "#fff" : "#6b7280"}
                />
                <Text
                  className="text-sm font-semibold ml-1.5"
                  style={{ color: isDark ? "#fff" : "#6b7280" }}
                >
                  {card.likes}
                </Text>
              </Pressable>

              {card.isAuthenticated && (
                <HStack space="xs" className="items-center ml-2">
                  <Ionicons name="shield-checkmark" size={16} color="#8BC34A" />
                  <Text className="text-xs font-bold text-green-600">Auth</Text>
                </HStack>
              )}
            </HStack>

            <HStack space="sm" className="items-center">
              <Pressable
                className="p-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E5E7EB",
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={isDark ? "#fff" : "#6b7280"}
                />
                <Text
                  className="ml-1.5 text-sm font-semibold"
                  style={{ color: isDark ? "#fff" : "#6b7280" }}
                >
                  Activity
                </Text>
              </Pressable>

              <Button
                size="sm"
                className="rounded-full px-4 h-9 shadow-sm"
                style={{ backgroundColor: "#8BC34A" }}
                onPress={() => handleViewScorecard(card.id)}
              >
                <Ionicons name="eye-outline" size={14} color="#fff" />
                <ButtonText className="text-white text-xs font-extrabold ml-1.5">View</ButtonText>
              </Button>

              {card.canAuthenticate && !card.isAuthenticated && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4 h-9 border"
                  style={{
                    borderColor: isDark ? "#fff" : "#8BC34A",
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "transparent",
                  }}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={13}
                    color={isDark ? "#fff" : "#8BC34A"}
                  />
                  <ButtonText
                    className="text-xs font-extrabold ml-1"
                    style={{ color: isDark ? "#fff" : "#8BC34A" }}
                  >
                    Auth
                  </ButtonText>
                </Button>
              )}
            </HStack>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export function GameFeedContent({ hideHeader = false }: { hideHeader?: boolean }) {
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await getFeed();
      if (data != null) {
        const mappedCards: Scorecard[] = data.map((item: FeedApi) => ({
          id: item.roundRefId?.toString() || Math.random().toString(),
          playerName: item.playerName || "Unknown",
          date: item.date || "",
          courseName: item.courseName,
          teeBoxName: item.teeBoxName,
          holes: item.holesPlayed || 0,
          grossScore: item.grossScore || 0,
          grossDiff: item.scoreToPar || 0,
          net: item.netScore || 0,
          points: item.stablefordPoints || 0,
          likes: item.likeCount || 0,
          isLiked: item.isLikedByMe || false,
          isTournament: !!item.isTournament,
          isAuthenticated: item.isAuthenticated,
          authenticatedBy: item.authenticatedBy,
          canAuthenticate: item.canAuthenticate,
        }));
        setCards(mappedCards);

        // Auto-expand first card
        if (mappedCards.length > 0) {
          setExpandedId(mappedCards[0].id);
        }
      }
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1,
            }
            : c
        )
      );
      await likeFeedApi(id);
    } catch (error) {
      console.error("Like toggle error:", error);
    }
  };

  const handleViewScorecard = (scorecardId: string) => {
    router.push({
      pathname: "/(drawer)/(admin)/(tabs)/dashboard/scorecardDetails",
      params: { scorecardId },
    });
  };

  const toggleCard = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <Box className="items-center justify-center py-10">
        <ActivityIndicator size="large" color="#8BC34A" />
        <Text className="mt-2 text-gray-500">Loading feed...</Text>
      </Box>
    );
  }

  return (
    <VStack space="md">
      {/* Header */}
      {!hideHeader && (
        <HStack className="justify-between items-center mb-2">
          <HStack space="sm" className="items-center">
            <Text
              className="text-3xl font-bold"
              style={{ color: isDark ? "#fff" : "#000" }}
            >
              Game Feed
            </Text>
            <HStack
              className="items-center px-3 py-1 rounded-full space-x-2"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#D1FAE5",
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? "#fff" : "transparent",
              }}
            >
              <Ionicons
                name="pulse"
                size={16}
                color={isDark ? "#fff" : "#22C55E"}
                style={{ marginRight: 4 }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: isDark ? "#fff" : "#15803D" }}
              >
                Live
              </Text>
            </HStack>
          </HStack>
        </HStack>
      )}

      {/* Empty state */}
      {cards.length === 0 && (
        <Box className="bg-background-0 rounded-2xl border border-outline-200 py-12 items-center">
          <Text className="text-4xl">⛳</Text>
          <Text className="text-typography-400 font-semibold text-sm mt-3">
            No scorecards yet
          </Text>
        </Box>
      )}

      {/* Cards List */}
      {cards.map((card) => (
        <FeedCard
          key={card.id}
          card={card}
          isDark={isDark}
          isExpanded={expandedId === card.id}
          onToggle={() => toggleCard(card.id)}
          handleLike={handleLike}
          handleViewScorecard={handleViewScorecard}
        />
      ))}
    </VStack>
  );
}

export default function GameFeed() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        <Box className="mt-4">
          <GameFeedContent />
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
