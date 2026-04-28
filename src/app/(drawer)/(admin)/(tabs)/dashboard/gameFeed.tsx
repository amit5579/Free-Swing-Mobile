import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFeed, FeedApi } from "@/api/modules/admin/dashboard.api";
import {
  likeFeedApi,
  getLikedUsersApi,
  LikedUser,
} from "@/api/modules/dashboard.api";
import Watermark from "@/components/watermark";
import { Button, ButtonText } from "@/components/button";
import { useFocusEffect, useRouter } from "expo-router";
import { Skeleton } from "@/components/Skeleton";
import { Image } from "expo-image";
import GolferParadise from "@/app/(drawer)/(user)/(tabs)/dashboard/tabs/GolferParadise";
import AllMembersScreen from "@/app/(drawer)/(admin)/(tabs)/allMembers/index";

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
  isDQ: boolean;
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
  handleViewScorecard: (
    id: string,
    playerName: string,
    courseName: string,
  ) => void;
  handleVerifyCard: (id: string, playerName: string) => void;
  onActivity: (id: string) => void;
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Box
      className="mb-3"
      style={{
        shadowColor: "#8BC34A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 14,
        backgroundColor: isDark
          ? "rgba(26,26,26,0.6)"
          : "rgba(255,255,255,0.6)",
        borderLeftWidth: 6,
        borderLeftColor: card.isDQ ? "#ef4444" : "#8BC34A",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor:
          card.isDQ && isDark
            ? "#ef4444"
            : isDark
              ? "rgba(139,195,74,0.6)"
              : "#E0E0E0",
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
            <Box style={{ position: "relative" }}>
              <Box
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 36,
                  borderWidth: card.isAuthenticated ? 2 : 1.5,
                  borderColor: card.isDQ
                    ? "#ef4444"
                    : card.isAuthenticated
                      ? "#4CAF50"
                      : "#8BC34A",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  backgroundColor: isDark ? "#222" : "#eee",
                }}
              >
                {card.profileImage &&
                card.profileImage.trim() !== "" &&
                card.profileImage !== "null" &&
                !imageError ? (
                  <Image
                    source={{
                      uri: card.profileImage.startsWith("http")
                        ? card.profileImage
                        : `https://kolve18freeswing.com${card.profileImage}`,
                    }}
                    style={{ width: "100%", height: "100%", borderRadius: 36 }}
                    contentFit="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text
                    style={{
                      color: isDark ? "#fff" : "#111",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    {card.playerName?.charAt(0).toUpperCase()}
                  </Text>
                )}
              </Box>
              {card.isAuthenticated && (
                <Box
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    backgroundColor: isDark ? "#222" : "#fff",
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isDark ? "#222" : "#fff",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                </Box>
              )}
            </Box>
            <VStack>
              <Text
                className="font-bold text-lg"
                style={{ color: isDark ? "#fff" : "#111" }}
                numberOfLines={1}
              >
                {card.playerName}
              </Text>
              <HStack space="xs" className="items-center mt-0.5">
                <Ionicons
                  name="calendar-outline"
                  size={10}
                  color={isDark ? "#aaa" : "#9ca3af"}
                />
                <Text
                  className="text-[10px]"
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
            {card.isDQ && (
              <Badge
                size="sm"
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: "#ef4444" }}
              >
                <BadgeText className="text-white font-bold text-[10px]">
                  DQ
                </BadgeText>
              </Badge>
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
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
              marginBottom: 12,
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

          <HStack space="xs" className="mx-4 mb-4">
            {[
              {
                label: "Gross",
                value: card.grossScore,
                color: isDark ? "#fff" : "#000",
              },
              {
                label: "To Par",
                value: diffLabel(card.grossDiff),
                color: diffColor(card.grossDiff),
              },
              {
                label: "Net",
                value: card.net,
                color: isDark ? "#fff" : "#000",
              },
              {
                label: "Points",
                value: card.points,
                color: isDark ? "#fff" : "#000",
              },
            ].map((s) => (
              <Box
                key={s.label}
                className="flex-1 rounded-2xl items-center py-2 border"
                style={{
                  backgroundColor: isDark
                    ? "rgba(22, 22, 24, 0.4)"
                    : "rgba(255, 255, 255, 0.35)",
                  borderColor: isDark ? "#8BC34A" : "rgba(139,195,74,0.3)",
                }}
              >
                <Text
                  className="text-[8px] uppercase font-bold tracking-widest mb-0.5"
                  style={{ color: isDark ? "#aaa" : "#9CA3AF" }}
                >
                  {s.label}
                </Text>
                <Text
                  className="text-sm font-black tracking-tighter"
                  style={{ color: s.color }}
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
                onPress={() => handleLike(card.id)}
                android_ripple={{ color: "#ccc", borderless: true }}
                hitSlop={10}
                className="p-1 px-2.5 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#E5E7EB",
                }}
              >
                <Ionicons
                  name={card.isLiked ? "heart" : "heart-outline"}
                  size={16}
                  color={card.isLiked ? "#EF4444" : isDark ? "#fff" : "#6b7280"}
                />
                <Text
                  className="text-xs font-semibold ml-1"
                  style={{ color: isDark ? "#fff" : "#6b7280" }}
                >
                  {card.likes}
                </Text>
              </Pressable>

              {card.isAuthenticated ? (
                <HStack space="xs" className="items-center ml-1">
                  <Ionicons name="shield-checkmark" size={14} color="#8BC34A" />
                  <Text className="text-[10px] font-bold text-green-600">
                    Verified
                  </Text>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  disabled={card.isDQ || !card.canAuthenticate}
                  className={`rounded-full px-2 ml-1 h-6 shadow-none ${!card.isDQ && card.canAuthenticate ? "opacity-100" : "opacity-40"}`}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(139,195,74,0.1)"
                      : "rgba(139,195,74,0.05)",
                  }}
                  onPress={() => handleVerifyCard(card.id, card.playerName)}
                >
                  <Ionicons
                    name="shield-outline"
                    size={10}
                    color={
                      !card.isDQ && card.canAuthenticate
                        ? "#8BC34A"
                        : isDark
                          ? "#9CA3AF"
                          : "#6B7280"
                    }
                  />
                  <ButtonText
                    className="text-[10px] font-bold ml-1"
                    style={{
                      color:
                        !card.isDQ && card.canAuthenticate
                          ? "#8BC34A"
                          : isDark
                            ? "#9CA3AF"
                            : "#6B7280",
                    }}
                  >
                    Auth
                  </ButtonText>
                </Button>
              )}
            </HStack>

            <HStack space="sm" className="items-center">
              <Pressable
                onPress={() => onActivity(card.id)}
                android_ripple={{ color: "#ccc", borderless: true }}
                className="p-1 px-2.5 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#E5E7EB",
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={isDark ? "#fff" : "#6b7280"}
                />
                <Text
                  className="ml-1 text-xs font-semibold"
                  style={{ color: isDark ? "#fff" : "#6b7280" }}
                >
                  Activity
                </Text>
              </Pressable>

              <Button
                size="xs"
                className="rounded-full px-3 h-8 shadow-sm"
                style={{ backgroundColor: "#8BC34A" }}
                onPress={() =>
                  handleViewScorecard(card.id, card.playerName, card.courseName)
                }
              >
                <Ionicons name="eye" size={12} color="#fff" />
                <ButtonText className="text-white text-[10px] font-extrabold">
                  View
                </ButtonText>
              </Button>
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
        backgroundColor: isDark
          ? "rgba(26,26,26,0.4)"
          : "rgba(255,255,255,0.35)",
        borderRadius: 20,
        borderLeftWidth: 6,
        borderLeftColor: "#8BC34A",
        padding: 16,
      }}
    >
      <HStack className="items-center justify-between mb-4">
        <HStack space="sm" className="items-center flex-1">
          <Skeleton isDark={isDark} width={38} height={38} borderRadius={24} />
          <VStack>
            <Skeleton
              isDark={isDark}
              width={120}
              height={18}
              style={{ marginBottom: 4 }}
            />
            <Skeleton isDark={isDark} width={80} height={10} />
          </VStack>
        </HStack>
      </HStack>

      <HStack space="xs" style={{ marginBottom: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            className="flex-1 rounded-2xl py-3 items-center border"
            style={{
              borderColor: isDark ? "#8BC34A" : "#E5E7EB",
              backgroundColor: isDark
                ? "rgba(22, 22, 24, 0.4)"
                : "rgba(255, 255, 255, 0.35)",
            }}
          >
            <Skeleton
              isDark={isDark}
              width="40%"
              height={6}
              style={{ marginBottom: 6 }}
            />
            <Skeleton isDark={isDark} width="70%" height={20} />
          </Box>
        ))}
      </HStack>

      <HStack space="sm" className="justify-between items-center">
        <Skeleton isDark={isDark} width={80} height={32} borderRadius={16} />
        <Skeleton isDark={isDark} width={80} height={32} borderRadius={16} />
      </HStack>
    </Box>
  );
};

export function GameFeedContent({
  hideHeader = false,
  searchQuery = "",
}: {
  hideHeader?: boolean;
  searchQuery?: string;
}) {
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [subTab, setSubTab] = useState<"feed" | "paradise" | "members">("feed");
  const SCREEN_WIDTH = Dimensions.get("window").width;

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, []),
  );

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await getFeed();
      if (data != null) {
        const mappedCards: Scorecard[] = data.map((item: FeedApi) => ({
          id: item.roundRefId?.toString() || Math.random().toString(),
          playerName: item.playerName || "Unknown",
          date: item.date
            ? new Date(item.date).toLocaleDateString()
            : "Unknown",
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
          isDQ: !!item.isDQ,
        }));
        setCards(mappedCards);

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
            : c,
        ),
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
              // Optimistic update
              setCards((prev) =>
                prev.map((c) =>
                  c.id === id
                    ? {
                        ...c,
                        isAuthenticated: true,
                        canAuthenticate: false,
                        authenticatedBy: "Admin",
                      }
                    : c,
                ),
              );
              
              await verifyScoreApi(id);
            } catch (error) {
              console.error("verify score error:", error);
              // Revert optimistic update on error
              fetchFeed();
              Alert.alert("Error", "Failed to verify scorecard. Please try again.");
            }
          },
        },
      ],
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

  const handleViewScorecard = (
    scorecardId: string,
    playerName: string,
    courseName: string,
  ) => {
    router.push({
      pathname: "/(drawer)/(admin)/scorecard/view/[scoreCard]",
      params: {
        scoreCard: scorecardId,
        username: playerName,
        courseName: courseName,
      },
    });
  };

  const toggleCard = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading && subTab === "feed") {
    return (
      <VStack space="md" className="py-2">
        <FeedCardSkeleton />
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </VStack>
    );
  }

  return (
    <VStack space="md">
      {/* Header Tabs */}
      {!hideHeader && (
        <HStack
          className="mb-4 p-1 rounded-full"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(139,195,74,0.1)"
              : "rgba(229,231,235,1)",
          }}
        >
          <Pressable
            onPress={() => setSubTab("feed")}
            className="flex-1 flex-row py-2 px-1 items-center justify-center rounded-full"
            style={{
              backgroundColor: subTab === "feed" ? "#8BC34A" : "transparent",
            }}
          >
            <HStack space="xs" className="items-center">
              <Ionicons
                name="pulse"
                size={14}
                color={
                  subTab === "feed" ? "#fff" : isDark ? "#D1D5DB" : "#4B5563"
                }
              />
              <Text
                className="font-bold text-[11px]"
                style={{
                  color:
                    subTab === "feed" ? "#fff" : isDark ? "#D1D5DB" : "#4B5563",
                }}
              >
                Game Feed
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={() => setSubTab("paradise")}
            className="flex-1 flex-row py-2 px-1 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                subTab === "paradise" ? "#8BC34A" : "transparent",
            }}
          >
            <HStack space="xs" className="items-center">
              <Ionicons
                name="trophy-outline"
                size={14}
                color={
                  subTab === "paradise"
                    ? "#fff"
                    : isDark
                      ? "#D1D5DB"
                      : "#4B5563"
                }
              />
              <Text
                className="font-bold text-[11px]"
                style={{
                  color:
                    subTab === "paradise"
                      ? "#fff"
                      : isDark
                        ? "#D1D5DB"
                        : "#4B5563",
                }}
              >
                Golfer Paradise
              </Text>
            </HStack>
          </Pressable>
          <Pressable
            onPress={() => setSubTab("members")}
            className="flex-1 flex-row py-2 px-1 items-center justify-center rounded-full"
            style={{
              backgroundColor: subTab === "members" ? "#8BC34A" : "transparent",
            }}
          >
            <HStack space="xs" className="items-center">
              <Ionicons
                name="people-outline"
                size={14}
                color={
                  subTab === "members" ? "#fff" : isDark ? "#D1D5DB" : "#4B5563"
                }
              />
              <Text
                className="font-bold text-[11px]"
                style={{
                  color:
                    subTab === "members"
                      ? "#fff"
                      : isDark
                        ? "#D1D5DB"
                        : "#4B5563",
                }}
              >
                Members
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      )}

      {/* Content Rendering */}
      {subTab === "feed" ? (
        <View>
          {cards.length === 0 && (
            <Box className="bg-background-0 rounded-2xl border border-outline-200 py-12 items-center">
              <Text className="text-4xl">⛳</Text>
              <Text className="text-typography-400 font-semibold text-sm mt-3">
                No scorecards yet
              </Text>
            </Box>
          )}

          {cards
            .filter((c) => {
              const q = searchQuery.toLowerCase();
              return (
                c.playerName.toLowerCase().includes(q) ||
                c.courseName.toLowerCase().includes(q)
              );
            })
            .map((card) => (
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
        </View>
      ) : subTab === "paradise" ? (
        <View style={{ width: SCREEN_WIDTH - 32 }}>
          <GolferParadise searchQuery={searchQuery} />
        </View>
      ) : (
        <View style={{ width: SCREEN_WIDTH - 32 }}>
          <AllMembersScreen
            hideAdminControls={true}
            searchQuery={searchQuery}
          />
        </View>
      )}

      {/* ACTIVITY MODAL */}
      <Modal
        visible={activityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActivityModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            padding: 20,
          }}
        >
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
                <Text
                  className="text-2xl font-bold"
                  style={{ color: isDark ? "#fff" : "#111" }}
                >
                  Activity
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: "#8BC34A", fontWeight: "600" }}
                >
                  Interactions on this scorecard
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
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#fff" : "#6b7280"}
                />
              </TouchableOpacity>
            </HStack>

            <Divider className="mb-4" />

            <ScrollView showsVerticalScrollIndicator={false}>
              {activityLoading ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Skeleton
                    isDark={isDark}
                    width={50}
                    height={50}
                    borderRadius={25}
                  />
                  <Text
                    className="mt-4"
                    style={{ color: isDark ? "#aaa" : "#666" }}
                  >
                    Loading...
                  </Text>
                </View>
              ) : likedUsers.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={48}
                    color="#ccc"
                  />
                  <Text
                    className="mt-4 text-center"
                    style={{ color: isDark ? "#aaa" : "#666" }}
                  >
                    No interactions on this score yet.
                  </Text>
                </View>
              ) : (
                <VStack space="md">
                  {Array.isArray(likedUsers) &&
                    likedUsers.map((interaction, idx) => (
                      <HStack
                        key={idx}
                        className="items-center p-3 rounded-xl"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "#F9FAFB",
                        }}
                      >
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor:
                              interaction.type === "Like"
                                ? "#EF4444"
                                : "#8BC34A",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                          }}
                        >
                          {interaction.profilePictureUrl &&
                          interaction.profilePictureUrl !== "null" ? (
                            <Image
                              source={{
                                uri: interaction.profilePictureUrl.startsWith(
                                  "http",
                                )
                                  ? interaction.profilePictureUrl
                                  : `https://kolve18freeswing.com${interaction.profilePictureUrl}`,
                              }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : (
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>
                              {interaction.user
                                ? interaction.user.charAt(0).toUpperCase()
                                : "?"}
                            </Text>
                          )}
                        </Box>
                        <VStack className="ml-3 flex-1">
                          <Text
                            className="font-bold text-lg"
                            style={{ color: isDark ? "#fff" : "#111" }}
                          >
                            {interaction.user}
                          </Text>
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color:
                                interaction.type === "Like"
                                  ? "#EF4444"
                                  : "#8BC34A",
                            }}
                          >
                            {interaction.type === "Like"
                              ? "Liked this scorecard"
                              : "Verified this scorecard"}
                          </Text>
                        </VStack>
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
