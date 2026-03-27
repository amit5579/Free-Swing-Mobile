import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  useColorScheme,
  View,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFeed, FeedApi, verifyScoreApi } from "@/api/admin/dashboard";
import { likeFeedApi, getLikedUsersApi, LikedUser } from "@/api/dashboard";
import Watermark from "@/components/watermark";
import { Button, ButtonText } from "@/components/button";
import { useFocusEffect, useRouter } from "expo-router";
import { Skeleton } from "@/components/Skeleton";
import { Image } from "expo-image";

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
  totalPar: number;
  likes: number;
  isLiked?: boolean;
  isTournament: boolean;
  isAuthenticated: boolean;
  authenticatedBy: string | null;
  canAuthenticate: boolean;
  profileImage?: string | null;
};

const diffLabel = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const diffColor = (n: number) => (n < 0 ? "#ef4444" : "#10b981");

const FeedCard = ({
  card,
  isDark,
  isExpanded,
  onToggle,
  handleLike,
  handleViewScorecard,
  handleVerifyCard,
  onActivity,
}: {
  card: Scorecard;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  handleLike: (id: string) => void;
  handleViewScorecard: (id: string) => void;
  handleVerifyCard: (id: string, playerName: string) => void;
  onActivity: (id: string) => void;
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Box
      className="mb-4"
      style={{
        shadowColor: "#8BC34A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 14,
        elevation: 8,
        backgroundColor: isDark
          ? "rgba(26,26,26,0.6)"
          : "rgba(255,255,255,0.6)",
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: isDark ? "rgba(139,195,74,0.6)" : "#E0E0E0",
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
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
                overflow: "hidden",
                backgroundColor: isDark ? "#222" : "#eee",
              }}
            >
              {card.profileImage && card.profileImage.trim() !== "" && card.profileImage !== "null" && !imageError ? (
                <Image
                  source={{ uri: card.profileImage.startsWith('http') ? card.profileImage : `https://kolve18freeswing.com${card.profileImage}` }}
                  style={{ width: "100%", height: "100%", borderRadius: 48 }}
                  contentFit="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text
                  style={{
                    color: isDark ? "#fff" : "#111",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  {card.playerName?.charAt(0).toUpperCase()}
                </Text>
              )}
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

          <HStack space="sm" className="items-center pl-2">
            {card.isTournament && (
              <Badge
                size="sm"
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: isDark ? "#F59E0B" : "#FBBF24" }}
              >
                <BadgeText className="text-white font-bold text-[10px]">
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

        {!isExpanded && (
          <HStack space="sm" className="items-center mt-2 flex-wrap">
            <HStack space="xs" className="items-center mr-2">
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
            </HStack>
            <Badge
              size="sm"
              className="rounded-full px-2 py-0.5"
              style={{
                backgroundColor: isDark
                  ? "rgba(55,65,81,0.8)"
                  : "rgba(17,24,39,0.8)",
              }}
            >
              <BadgeText className="text-white font-semibold text-[10px]">
                {card.holes} Holes
              </BadgeText>
            </Badge>
          </HStack>
        )}
      </Pressable>

      {isExpanded && (
        <VStack style={{ marginTop: 0 }}>
          <Divider
            style={{
              marginBottom: 16,
              backgroundColor: isDark
                ? "rgba(51,51,51,0.5)"
                : "rgba(240,240,240,0.5)",
            }}
          />
          <VStack space="xs" className="px-4 pb-2">
            <HStack space="xs" className="items-center flex-wrap">
              <Ionicons
                name="flag-outline"
                size={11}
                color={isDark ? "#aaa" : "#9ca3af"}
              />
              <Text
                className="text-xs mr-2"
                style={{ color: isDark ? "#ccc" : "#6b7280" }}
              >
                {card.courseName}
              </Text>
              <Box
                className="rounded px-1.5 py-0.5"
                style={{
                  backgroundColor: isDark
                    ? "rgba(51,51,51,0.8)"
                    : "rgba(219,234,254,0.8)",
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
                className="rounded-full px-3 py-1 ml-1"
                style={{
                  backgroundColor: isDark
                    ? "rgba(55,65,81,0.8)"
                    : "rgba(17,24,39,0.8)",
                }}
              >
                <BadgeText className="text-white font-semibold text-xs">
                  {card.holes} Holes
                </BadgeText>
              </Badge>
            </HStack>
          </VStack>

          <HStack space="sm" className="mx-4 mb-4">
            <Box
              className="flex-1 rounded-2xl py-6 items-center border"
              style={{
                borderColor: isDark ? "#8BC34A" : "rgba(139,195,74,0.3)",
                backgroundColor: isDark
                  ? "rgba(22, 22, 24, 0.4)"
                  : "rgba(255, 255, 255, 0.35)",
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
                borderColor: isDark ? "#8BC34A" : "rgba(139,195,74,0.3)",
                backgroundColor: isDark
                  ? "rgba(22, 22, 24, 0.4)"
                  : "rgba(255, 255, 255, 0.35)",
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

          <HStack space="sm" className="mx-4 mb-3">
            {[
              { label: "Net", value: card.net, green: true },
              { label: "Points", value: card.points, green: true },
              { label: "Par", value: card.totalPar || 72, green: false }, // Fallback to 72 if missing
            ].map((s) => (
              <Box
                key={s.label}
                className="flex-1 rounded-xl items-center py-3 border"
                style={{
                  backgroundColor: isDark
                    ? "rgba(22, 22, 24, 0.4)"
                    : "rgba(255, 255, 255, 0.35)",
                  borderColor: isDark ? "#8BC34A" : "rgba(139,195,74,0.3)",
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

          {card.isAuthenticated && card.authenticatedBy && (
            <HStack
              space="xs"
              className="mx-4 mb-3 items-center justify-center py-2 rounded-xl border"
              style={{
                backgroundColor: isDark
                  ? "rgba(139, 195, 74, 0.15)"
                  : "#E8F5E9",
                borderColor: isDark ? "#8BC34A" : "#C8E6C9",
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text
                className="text-xs font-bold"
                style={{ color: isDark ? "#8BC34A" : "#2E7D32" }}
              >
                Verified by {card.authenticatedBy}
              </Text>
            </HStack>
          )}

          <Divider
            style={{
              backgroundColor: isDark
                ? "rgba(51,51,51,0.5)"
                : "rgba(229,231,235,0.5)",
            }}
          />

          <HStack
            className="px-4 py-4 justify-between items-center"
            style={{
              backgroundColor: isDark
                ? "rgba(22, 22, 24, 0.3)"
                : "rgba(249, 250, 251, 0.3)",
            }}
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
                onPress={() => onActivity(card.id)}
                android_ripple={{ color: "#ccc", borderless: true }}
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
                  onPress={() => handleVerifyCard(card.id, card.playerName)}
                >
                  <ButtonText className={`${isDark ? "text-white" : "text-green-600"} text-xs font-extrabold`}>Verify Score</ButtonText>
                </Button>
              )}
            </HStack>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

const FeedCardSkeleton = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Box
      className="mb-4"
      style={{
        backgroundColor: isDark ? "rgba(26,26,26,0.4)" : "rgba(255,255,255,0.35)",
        borderRadius: 20,
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        padding: 16,
        borderColor: isDark ? "#8BC34A" : "transparent",
        borderTopWidth: isDark ? 1.5 : 0,
      }}
    >
      <HStack className="items-center justify-between mb-4">
        <HStack space="sm" className="items-center flex-1">
          <Skeleton isDark={isDark} width={45} height={45} borderRadius={24} />
          <VStack>
            <Skeleton isDark={isDark} width={120} height={20} style={{ marginBottom: 4 }} />
            <Skeleton isDark={isDark} width={80} height={12} />
          </VStack>
        </HStack>
      </HStack>

      <HStack space="sm" style={{ marginBottom: 12 }}>
        <Box className="flex-1 rounded-2xl py-6 items-center border" style={{ borderColor: isDark ? "#8BC34A" : "#E5E7EB", backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)" }}>
          <Skeleton isDark={isDark} width="30%" height={10} style={{ marginBottom: 8 }} />
          <Skeleton isDark={isDark} width="60%" height={32} />
        </Box>
        <Box className="flex-1 rounded-2xl py-6 items-center border" style={{ borderColor: isDark ? "#8BC34A" : "#E5E7EB", backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)" }}>
          <Skeleton isDark={isDark} width="30%" height={10} style={{ marginBottom: 8 }} />
          <Skeleton isDark={isDark} width="60%" height={32} />
        </Box>
      </HStack>

      <HStack space="sm" className="justify-between items-center">
        <Skeleton isDark={isDark} width={80} height={32} borderRadius={16} />
        <Skeleton isDark={isDark} width={80} height={32} borderRadius={16} />
      </HStack>
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
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [])
  );

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
          totalPar: item.totalPar || 72,
          likes: item.likeCount || 0,
          isLiked: item.isLikedByMe || false,
          isTournament: !!item.isTournament,
          isAuthenticated: item.isAuthenticated,
          authenticatedBy: item.authenticatedBy,
          canAuthenticate: item.canAuthenticate,
          profileImage: item.playerAvatar,
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

  const handleVerifyCard = (id: string, playerName: string) => {
    Alert.alert(
      "Verify Score",
      `Are you sure you want to verify this score for ${playerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          onPress: async () => {
            try {
              // Optimistic UI update
              setCards((prev) =>
                prev.map((c) =>
                  c.id === id
                    ? {
                      ...c,
                      isAuthenticated: true,
                      canAuthenticate: false,
                      authenticatedBy: "Admin",
                    }
                    : c
                )
              );
              await verifyScoreApi(id);
            } catch (error) {
              console.error("verify score error:", error);
            }
          }
        }
      ]
    );
  };

  const handleShowActivity = async (id: string) => {
    setActivityLoading(true);
    setActivityModalVisible(true);
    setLikedUsers([]);
    try {
      const users = await getLikedUsersApi(id);
      setLikedUsers(users);
    } catch (err) {
      console.error("Fetch liked users error:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleViewScorecard = (scorecardId: string) => {
    router.push({
      pathname: "/(drawer)/scoreCard/resume/[id]" as any,
      params: { id: scorecardId, handicap: 0 },
    });
  };

  const toggleCard = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <VStack space="md">
        {!hideHeader && (
          <Skeleton isDark={isDark} width="50%" height={36} style={{ marginBottom: 16 }} />
        )}
        {[1, 2, 3].map((i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </VStack>
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
          handleVerifyCard={handleVerifyCard}
          onActivity={handleShowActivity}
        />
      ))}

      {/* ACTIVITY MODAL */}
      <Modal
        visible={activityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActivityModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <Box
            style={{
              backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              maxHeight: "80%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <HStack className="justify-between items-center mb-6">
              <VStack>
                <Text className="text-2xl font-bold" style={{ color: isDark ? "#fff" : "#111" }}>
                  Activity
                </Text>
                <Text className="text-sm" style={{ color: "#8BC34A", fontWeight: "600" }}>
                  Who liked this scorecard
                </Text>
              </VStack>
              <TouchableOpacity
                onPress={() => setActivityModalVisible(false)}
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#6b7280"} />
              </TouchableOpacity>
            </HStack>

            <Divider className="mb-4" />

            <ScrollView showsVerticalScrollIndicator={false}>
              {activityLoading ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Skeleton isDark={isDark} width={50} height={50} borderRadius={25} />
                  <Text className="mt-4" style={{ color: isDark ? "#aaa" : "#666" }}>Loading...</Text>
                </View>
              ) : likedUsers.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Ionicons name="heart-dislike-outline" size={48} color="#ccc" />
                  <Text className="mt-4 text-center" style={{ color: isDark ? "#aaa" : "#666" }}>
                    No likes on this score yet.
                  </Text>
                </View>
              ) : (
                <VStack space="md">
                  {Array.isArray(likedUsers) && likedUsers.map((user, idx) => (
                    <HStack key={idx} className="items-center p-3 rounded-xl" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB" }}>
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#8BC34A",
                          justifyContent: "center",
                          alignItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        {user.profilePictureUrl && user.profilePictureUrl !== "null" ? (
                          <Image
                            source={{ uri: user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `https://kolve18freeswing.com${user.profilePictureUrl}` }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <Text style={{ color: "#fff", fontWeight: "bold" }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </Box>
                      <Text className="ml-3 font-bold text-lg" style={{ color: isDark ? "#fff" : "#111" }}>
                        {user.username}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </ScrollView>
          </Box>
        </View>
      </Modal>
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
