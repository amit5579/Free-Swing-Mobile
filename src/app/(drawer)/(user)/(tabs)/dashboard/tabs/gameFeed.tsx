import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  useColorScheme,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { getLikedUsersApi, LikedUser } from "@/api/modules/dashboard.api";
import { verifyScoreApi } from "@/api/modules/admin/dashboard.api";
import GolferParadise from "./GolferParadise";
import AllMembersScreen from "@/app/(drawer)/(admin)/(tabs)/allMembers";
import { useFocusEffect } from "expo-router";

export type Scorecard = {
  id: string;
  playerName: string;
  groupName?: string;
  date: string;
  course: string;
  tee: string;
  holes: number;
  grossScore: number;
  grossDiff: number;
  net: number;
  points: number;
  par: number;
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
  handleVerify,
  onActivity,
}: {
  card: Scorecard;
  groupName?: string;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  handleLike: (id: string) => void;
  handleVerify?: (id: string, playerName: string) => void;
  onActivity: (id: string) => void | Promise<void>;
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleViewScorecard = (scorecardId: string) => {
    router.push({
      pathname: "/(drawer)/(user)/scorecard/view/[scoreCard]",
      params: {
        scoreCard: scorecardId,
        username: card.playerName || "",
        courseName: card.course || "",
      },
    });
  };

  return (
    <Box
      className="mb-4"
      style={{
        shadowColor: "#8BC34A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.35 : 0.1,
        shadowRadius: 16,
        elevation: 4,
        backgroundColor: card.isDQ ? (isDark ? "rgba(50, 20, 20, 0.9)" : "#FFF1F2") : (isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.95)"),
        borderLeftWidth: 6,
        borderLeftColor: card.isDQ ? "#EF4444" : "#8BC34A",
        borderWidth: 1,
        borderColor: card.isDQ
          ? "rgba(239, 68, 68, 0.4)"
          : isDark
            ? "rgba(139, 195, 74, 0.25)"
            : "rgba(224, 224, 224, 0.6)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onToggle}
        className="px-4 py-4"
        style={{ borderRadius: 20 }}
      >
        <HStack className="justify-between items-center">
          <HStack space="md" className="items-center flex-1">
            <Box style={{ position: "relative" }}>
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
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
                    style={{ width: "100%", height: "100%", borderRadius: 22 }}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text
                    style={{
                      color: isDark ? "#fff" : "#111",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {card.playerName
                      ? card.playerName.charAt(0).toUpperCase()
                      : "?"}
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
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                </Box>
              )}
            </Box>
            <VStack style={{ gap: 2 }}>
              <Text
                className="font-bold"
                style={{ color: isDark ? "#fff" : "#111", fontSize: 18 }}
                numberOfLines={1}
              >
                {card.playerName} {card.groupName ? `- ${card.groupName}` : ""}
              </Text>
              <HStack space="xs" className="items-center">
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={isDark ? "#aaa" : "#6b7280"}
                />
                <Text
                  style={{ color: isDark ? "#ccc" : "#6b7280", fontSize: 12 }}
                >
                  {card.date}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack space="xs" className="items-center pl-2">
            {card.isTournament && (
              <Badge
                size="sm"
                className="rounded-full px-2.5 py-0.75"
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
                className="rounded-full px-2.5 py-0.75"
                style={{ backgroundColor: "#ef4444" }}
              >
                <BadgeText className="text-white font-bold text-[10px]">
                  DQ
                </BadgeText>
              </Badge>
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#8BC34A"
              style={{ marginLeft: 6 }}
            />
          </HStack>
        </HStack>

        {!isExpanded && (
          <HStack space="sm" className="items-center mt-3 flex-wrap">
            <HStack space="xs" className="items-center mr-2">
              <Ionicons
                name="flag-outline"
                size={13}
                color={isDark ? "#aaa" : "#6b7280"}
              />
              <Text
                className="font-medium"
                style={{ color: isDark ? "#ccc" : "#6b7280", fontSize: 13 }}
              >
                {card.course}
              </Text>
            </HStack>
            <Badge
              size="sm"
              className="rounded-full px-2.5 py-0.75"
              style={{
                backgroundColor: isDark
                  ? "rgba(55,65,81,0.85)"
                  : "rgba(17,24,39,0.85)",
              }}
            >
              <BadgeText className="text-white font-semibold text-[11px]">
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
              marginBottom: 14,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            }}
          />
          <VStack space="xs" className="px-4 pb-2">
            <HStack space="xs" className="items-center flex-wrap">
              <Ionicons
                name="flag-outline"
                size={13}
                color={isDark ? "#aaa" : "#6b7280"}
              />
              <Text
                className="font-medium mr-2"
                style={{ color: isDark ? "#ccc" : "#6b7280", fontSize: 13 }}
              >
                {card.course}
              </Text>
              <Box
                className="rounded px-2 py-0.5"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(219,234,254,0.9)",
                }}
              >
                <Text
                  className="font-bold"
                  style={{ color: isDark ? "#fff" : "#1E3A8A", fontSize: 11 }}
                >
                  {card.tee}
                </Text>
              </Box>
              <Badge
                size="sm"
                className="rounded-full px-3 py-1 ml-1"
                style={{
                  backgroundColor: isDark
                    ? "rgba(55,65,81,0.85)"
                    : "rgba(17,24,39,0.85)",
                }}
              >
                <BadgeText className="text-white font-semibold text-xs">
                  {card.holes} Holes
                </BadgeText>
              </Badge>
            </HStack>
          </VStack>

          <HStack
            space="xs"
            className="mx-4 mb-4 mt-2 justify-between flex-wrap"
          >
            {[
              { label: "Gross", value: card.grossScore, normal: true },
              {
                label: "To Par",
                value: diffLabel(card.grossDiff),
                color: diffColor(card.grossDiff),
              },
              { label: "Net", value: card.net, green: true },
              { label: "Points", value: card.points, green: true },
            ].map((s) => (
              <Box
                key={s.label}
                className="rounded-xl items-center py-2.5 border mb-1"
                style={{
                  width: "23%",
                  backgroundColor: isDark
                    ? "rgba(22, 22, 24, 0.8)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderColor: isDark
                    ? "rgba(139,195,74,0.2)"
                    : "rgba(139,195,74,0.15)",
                }}
              >
                <Text
                  className="uppercase tracking-wider mb-0.5 font-bold"
                  style={{ color: isDark ? "#A0A0A0" : "#64748B", fontSize: 9 }}
                >
                  {s.label}
                </Text>
                <Text
                  className="font-black"
                  style={{
                    fontSize: 18,
                    color: s.color
                      ? s.color
                      : s.green
                        ? "#10B981"
                        : isDark
                          ? "#fff"
                          : "#111",
                  }}
                >
                  {s.value}
                </Text>
              </Box>
            ))}
          </HStack>

          {card.authenticatedBy && (
            <HStack
              className="mx-4 mb-3 px-3 py-2 rounded-lg items-center"
              style={{
                backgroundColor: isDark
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(16,185,129,0.05)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(16,185,129,0.1)",
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={isDark ? "#34D399" : "#059669"}
                style={{ marginRight: 6 }}
              />
              <Text
                className="font-bold"
                style={{
                  color: isDark ? "#34D399" : "#059669",
                  fontSize: 12,
                }}
              >
                Verified by {card.authenticatedBy}
              </Text>
            </HStack>
          )}

          <Divider
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            }}
          />

          <HStack
            className="px-4 py-3 justify-between items-center"
            style={{
              backgroundColor: isDark
                ? "rgba(22, 22, 24, 0.4)"
                : "rgba(249, 250, 251, 0.4)",
            }}
          >
            <HStack space="lg" className="items-center">
              <Pressable
                onPress={() => handleLike(card.id)}
                hitSlop={10}
                className="py-2 px-3 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                }}
              >
                <Ionicons
                  name={card.isLiked ? "heart" : "heart-outline"}
                  size={18}
                  color={card.isLiked ? "#EF4444" : isDark ? "#fff" : "#6B7280"}
                />
                <Text
                  className="font-bold ml-1.5"
                  style={{ color: isDark ? "#fff" : "#6B7280", fontSize: 13 }}
                >
                  {card.likes}
                </Text>
              </Pressable>
              {card.isAuthenticated ? (
                <HStack space="xs" className="items-center ml-1">
                  <Ionicons name="shield-checkmark" size={16} color="#8BC34A" />
                  <Text className="text-xs font-bold text-green-600">
                    Verified
                  </Text>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  disabled={card.isDQ || !card.canAuthenticate}
                  className={`rounded-full px-3 ml-1 h-8 shadow-none ${!card.isDQ && card.canAuthenticate ? "opacity-100" : "opacity-40"}`}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(139,195,74,0.12)"
                      : "rgba(139,195,74,0.08)",
                  }}
                  onPress={() =>
                    handleVerify && handleVerify(card.id, card.playerName)
                  }
                >
                  <Ionicons
                    name="shield"
                    size={12}
                    color={
                      !card.isDQ && card.canAuthenticate
                        ? "#8BC34A"
                        : isDark
                          ? "#9CA3AF"
                          : "#6B7280"
                    }
                  />
                  <ButtonText
                    className="text-xs font-bold ml-1"
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
                onPress={() => {
                  onActivity(card.id);
                }}
                className="px-3 h-10 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                }}
              >
                <Ionicons
                  name="people"
                  size={16}
                  color={isDark ? "#fff" : "#6B7280"}
                />
                <Text
                  className="mx-1 text-xs font-semibold"
                  style={{ color: isDark ? "#fff" : "#6B7280" }}
                >
                  Activity
                </Text>
              </Pressable>
              <Button
                size="md"
                className="rounded-full px-4 h-10 shadow-sm items-center"
                style={{ backgroundColor: "#8BC34A" }}
                onPress={() => handleViewScorecard(card.id)}
              >
                <Ionicons name="eye" size={16} color="#fff" />
                <ButtonText className="text-white text-xs font-bold mx-1">
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

type OverviewTabProps = {
  cards: Scorecard[];
  handleLike: (id: string) => void;
  handleVerify?: (id: string, playerName: string) => void;
  searchQuery?: string;
  isSearchFocused?: boolean;
  subTab: "feed" | "paradise" | "members";
  onSubTabChange: (tab: "feed" | "paradise" | "members") => void;
};

export function OverviewTab({
  cards,
  handleLike,
  handleVerify,
  searchQuery = "",
  isSearchFocused = false,
  subTab,
  onSubTabChange,
}: OverviewTabProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [expandedId, setExpandedId] = useState<string | null>(
    cards.length > 0 ? cards[0].id : null,
  );

  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const subTabScrollRef = useRef<ScrollView>(null);
  const SCREEN_WIDTH = Dimensions.get("window").width;

  const toggleCard = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSubTabChange = (tab: "feed" | "paradise" | "members") => {
    onSubTabChange(tab);
  };

  const handleShowActivity = async (id: string) => {
    setActivityLoading(true);
    setActivityModalVisible(true);
    setLikedUsers([]);
    try {
      const users = await getLikedUsersApi(id);
      setLikedUsers(users);
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
      <VStack>
        {!searchQuery && (
          <HStack
            className="mb-4 p-1.5 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(22, 22, 24, 0.6)"
                : "rgba(243, 244, 246, 0.95)",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(139,195,74,0.15)"
                : "rgba(229,231,235,1)",
            }}
          >
            <Pressable
              onPress={() => handleSubTabChange("feed")}
              className="flex-1 flex-row py-2.5 px-1 items-center justify-center rounded-full"
              style={{
                backgroundColor: subTab === "feed" ? "#8BC34A" : "transparent",
              }}
            >
              <HStack space="xs" className="items-center">
                <Ionicons
                  name="pulse"
                  size={16}
                  color={
                    subTab === "feed" ? "#fff" : isDark ? "#D1D5DB" : "#4B5563"
                  }
                />
                <Text
                  className="font-bold text-xs"
                  style={{
                    color:
                      subTab === "feed"
                        ? "#fff"
                        : isDark
                          ? "#D1D5DB"
                          : "#4B5563",
                  }}
                >
                  Game Feed
                </Text>
              </HStack>
            </Pressable>
            <Pressable
              onPress={() => handleSubTabChange("paradise")}
              className="flex-1 flex-row py-2.5 px-1 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  subTab === "paradise" ? "#8BC34A" : "transparent",
              }}
            >
              <HStack space="xs" className="items-center">
                <Ionicons
                  name="trophy-outline"
                  size={16}
                  color={
                    subTab === "paradise"
                      ? "#fff"
                      : isDark
                        ? "#D1D5DB"
                        : "#4B5563"
                  }
                />
                <Text
                  className="font-bold text-xs"
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
              onPress={() => handleSubTabChange("members")}
              className="flex-1 flex-row py-2.5 px-1 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  subTab === "members" ? "#8BC34A" : "transparent",
              }}
            >
              <HStack space="xs" className="items-center">
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={
                    subTab === "members"
                      ? "#fff"
                      : isDark
                        ? "#D1D5DB"
                        : "#4B5563"
                  }
                />
                <Text
                  className="font-bold text-xs"
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

        {subTab === "feed" || searchQuery ? (
          <View style={{ width: SCREEN_WIDTH - 32, overflow: "hidden" }}>
            {cards.length === 0 && (
              <Box
                className="rounded-2xl border py-14 items-center"
                style={{
                  backgroundColor: isDark
                    ? "rgba(30,30,30,0.7)"
                    : "rgba(255,255,255,0.7)",
                  borderColor: isDark
                    ? "rgba(139,195,74,0.3)"
                    : "rgba(229,231,235,0.5)",
                }}
              >
                <Text className="text-5xl">⛳</Text>
                <Text
                  className="font-semibold mt-3"
                  style={{ color: isDark ? "#aaa" : "#6B7280", fontSize: 15 }}
                >
                  {searchQuery
                    ? "No matching scorecards found"
                    : "No scorecards yet"}
                </Text>
              </Box>
            )}

            {cards.map((card) => (
              <FeedCard
                key={card.id}
                card={card}
                groupName={card.groupName}
                isDark={isDark}
                isExpanded={expandedId === card.id}
                onToggle={() => toggleCard(card.id)}
                handleLike={handleLike}
                handleVerify={handleVerify}
                onActivity={handleShowActivity}
              />
            ))}
          </View>
        ) : subTab === "paradise" ? (
          <View style={{ width: SCREEN_WIDTH - 32, overflow: "hidden" }}>
            <GolferParadise searchQuery={searchQuery} />
          </View>
        ) : (
          <View style={{ width: SCREEN_WIDTH - 32, overflow: "hidden" }}>
            <AllMembersScreen hideAdminControls={true} searchQuery={searchQuery} />
          </View>
        )}
      </VStack>

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
              backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              maxHeight: "80%",
              elevation: 10,
            }}
          >
            <HStack className="justify-between items-center mb-6">
              <VStack>
                <Text
                  className="font-extrabold"
                  style={{ color: isDark ? "#fff" : "#111", fontSize: 24 }}
                >
                  Activity
                </Text>
                <Text
                  style={{ color: "#8BC34A", fontWeight: "700", fontSize: 13, marginTop: 2 }}
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
                  <ActivityIndicator size="large" color="#8BC34A" />
                  <Text
                    className="mt-4 font-semibold"
                    style={{ color: isDark ? "#aaa" : "#666", fontSize: 14 }}
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
                    className="mt-4 text-center font-medium"
                    style={{ color: isDark ? "#aaa" : "#666", fontSize: 14 }}
                  >
                    No interactions yet.
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
                            width: 44,
                            height: 44,
                            borderRadius: 22,
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
                            />
                          ) : (
                            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                              {interaction.user
                                ? interaction.user.charAt(0).toUpperCase()
                                : "?"}
                            </Text>
                          )}
                        </Box>
                        <VStack className="ml-3 flex-1" style={{ gap: 2 }}>
                          <Text
                            className="font-bold"
                            style={{ color: isDark ? "#fff" : "#111", fontSize: 16 }}
                          >
                            {interaction.user}
                          </Text>
                          <Text
                            className="font-semibold"
                            style={{
                              fontSize: 12,
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
    </SafeAreaView>
  );
}

export default OverviewTab;
