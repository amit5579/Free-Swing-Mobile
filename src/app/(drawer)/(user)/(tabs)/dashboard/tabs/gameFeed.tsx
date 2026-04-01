import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, useColorScheme, View, Modal, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { getLikedUsersApi, LikedUser } from "@/api/dashboard";
import { Skeleton } from "@/components/Skeleton";

export type Scorecard = {
    id: string;
    playerName: string;
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
    onActivity,
}: {
    card: Scorecard;
    isDark: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    handleLike: (id: string) => void;
    onActivity: (id: string) => void;
}) => {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);

    const handleViewScorecard = () => {
        if (card.isAuthenticated) {
            router.push({
                pathname: "/(drawer)/(user)/scorecard/view/[scoreCard]" as any,
                params: { scoreCard: card.id, username: card.playerName, courseName: card.course },
            });
        } else {
            router.push({
                pathname: "/(drawer)/(user)/scorecard/resume/[id]" as any,
                params: { id: card.id, handicap: 0 },
            });
        }
    };

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
                                    borderColor: card.isAuthenticated ? "#4CAF50" : "#8BC34A",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    overflow: "hidden",
                                    backgroundColor: isDark ? "#222" : "#eee",
                                }}
                            >
                                {card.profileImage && card.profileImage.trim() !== "" && card.profileImage !== "null" && !imageError ? (
                                    <Image
                                        source={{ uri: card.profileImage.startsWith('http') ? card.profileImage : `https://kolve18freeswing.com${card.profileImage}` }}
                                        style={{ width: "100%", height: "100%", borderRadius: 36 }}
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <Text style={{ color: isDark ? "#fff" : "#111", fontWeight: "bold", fontSize: 14 }}>
                                        {card.playerName ? card.playerName.charAt(0).toUpperCase() : "?"}
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
                            <Text className="font-bold text-lg" style={{ color: isDark ? "#fff" : "#111" }} numberOfLines={1}>
                                {card.playerName}
                            </Text>
                            <HStack space="xs" className="items-center">
                                <Ionicons name="calendar-outline" size={10} color={isDark ? "#aaa" : "#9ca3af"} />
                                <Text className="text-[10px]" style={{ color: isDark ? "#ccc" : "#6b7280" }}>{card.date}</Text>
                            </HStack>
                        </VStack>
                    </HStack>

                    <HStack space="sm" className="items-center pl-2">
                        {card.isTournament && (
                            <Badge size="sm" className="rounded-full px-2 py-0.5" style={{ backgroundColor: isDark ? "#F59E0B" : "#FBBF24" }}>
                                <BadgeText className="text-white font-bold text-[9px]">Tournament</BadgeText>
                            </Badge>
                        )}
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#8BC34A" style={{ marginLeft: 4 }} />
                    </HStack>
                </HStack>

                {!isExpanded && (
                    <HStack space="sm" className="items-center mt-2 flex-wrap">
                        <HStack space="xs" className="items-center mr-2">
                            <Ionicons name="flag-outline" size={11} color={isDark ? "#aaa" : "#9ca3af"} />
                            <Text className="text-xs" style={{ color: isDark ? "#ccc" : "#6b7280" }}>{card.course}</Text>
                        </HStack>
                        <Badge size="sm" className="rounded-full px-2 py-0.5" style={{ backgroundColor: isDark ? "rgba(55,65,81,0.8)" : "rgba(17,24,39,0.8)" }}>
                            <BadgeText className="text-white font-semibold text-[10px]">{card.holes} Holes</BadgeText>
                        </Badge>
                    </HStack>
                )}
            </Pressable>

            {isExpanded && (
                <VStack style={{ marginTop: 0 }}>
                    <Divider style={{ marginBottom: 16, backgroundColor: isDark ? "rgba(51,51,51,0.5)" : "rgba(240,240,240,0.5)" }} />
                    <VStack space="xs" className="px-4 pb-2">
                        <HStack space="xs" className="items-center flex-wrap">
                            <Ionicons name="flag-outline" size={11} color={isDark ? "#aaa" : "#9ca3af"} />
                            <Text className="text-xs mr-2" style={{ color: isDark ? "#ccc" : "#6b7280" }}>{card.course}</Text>
                            <Box className="rounded px-1.5 py-0.5" style={{ backgroundColor: isDark ? "rgba(51,51,51,0.8)" : "rgba(219,234,254,0.8)" }}>
                                <Text className="text-[10px] font-bold" style={{ color: isDark ? "#fff" : "#1E3A8A" }}>{card.tee}</Text>
                            </Box>
                            <Badge size="sm" className="rounded-full px-3 py-1 ml-1" style={{ backgroundColor: isDark ? "rgba(55,65,81,0.8)" : "rgba(17,24,39,0.8)" }}>
                                <BadgeText className="text-white font-semibold text-xs">{card.holes} Holes</BadgeText>
                            </Badge>
                        </HStack>
                    </VStack>

                    <HStack space="xs" className="mx-4 mb-4 mt-2 justify-between flex-wrap">
                        {[
                            { label: "Gross", value: card.grossScore, normal: true },
                            { label: "To Par", value: diffLabel(card.grossDiff), color: diffColor(card.grossDiff) },
                            { label: "Net", value: card.net, green: true },
                            { label: "Points", value: card.points, green: true },
                        ].map((s) => (
                            <Box 
                                key={s.label} 
                                className="rounded-xl items-center py-2 border mb-1" 
                                style={{ 
                                    width: "23.5%",
                                    backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", 
                                    borderColor: "rgba(139,195,74,0.3)" 
                                }}
                            >
                                <Text className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: isDark ? "#aaa" : "#6b7280" }}>{s.label}</Text>
                                <Text className={`text-sm font-bold`} style={{ color: s.color ? s.color : (s.green ? "#10B981" : isDark ? "#fff" : "#111") }}>{s.value}</Text>
                            </Box>
                        ))}
                    </HStack>

                    <Divider style={{ backgroundColor: isDark ? "rgba(51,51,51,0.3)" : "rgba(229,231,235,0.3)" }} />

                    <HStack className="px-4 py-3 justify-between items-center" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.2)" : "rgba(249, 250, 251, 0.2)" }}>
                        <HStack space="lg" className="items-center">
                            <Pressable onPress={() => handleLike(card.id)} hitSlop={10} className="p-1 px-2.5 rounded-full flex-row items-center" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(229,231,235,0.35)" }}>
                                <Ionicons name={card.isLiked ? "heart" : "heart-outline"} size={16} color={card.isLiked ? "#EF4444" : isDark ? "#fff" : "#6b7280"} />
                                <Text className="text-xs font-semibold ml-1" style={{ color: isDark ? "#fff" : "#6b7280" }}>{card.likes}</Text>
                            </Pressable>
                            {card.isAuthenticated && (
                                <HStack space="xs" className="items-center ml-1">
                                    <Ionicons name="shield-checkmark" size={14} color="#8BC34A" />
                                    <Text className="text-[10px] font-bold text-green-600">Verified</Text>
                                </HStack>
                            )}
                        </HStack>

                        <HStack space="sm" className="items-center">
                            <Pressable
                                onPress={() => onActivity(card.id)}
                                className="p-1 px-2.5 rounded-full flex-row items-center"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(229,231,235,0.35)" }}
                            >
                                <Ionicons name="people-outline" size={14} color={isDark ? "#fff" : "#6b7280"} />
                                <Text className="ml-1 text-xs font-semibold" style={{ color: isDark ? "#fff" : "#6b7280" }}>Activity</Text>
                            </Pressable>

                            <Button size="xs" className="rounded-full px-3 h-8 shadow-sm" style={{ backgroundColor: "#8BC34A" }} onPress={handleViewScorecard}>
                                <Ionicons name="eye-outline" size={12} color="#fff" />
                                <ButtonText className="text-white text-[10px] font-extrabold ml-1">View</ButtonText>
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
    searchQuery?: string;
    isSearchFocused?: boolean;
};

export function OverviewTab({ cards, handleLike, searchQuery = "", isSearchFocused = false }: OverviewTabProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const [expandedId, setExpandedId] = useState<string | null>(cards.length > 0 ? cards[0].id : null);
    const [activityModalVisible, setActivityModalVisible] = useState(false);
    const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);

    const toggleCard = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
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
                    <HStack className="justify-between items-center mb-2 mt-0">
                        <HStack space="sm" className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: isDark ? "#fff" : "#000" }}>Game Feed</Text>
                            <HStack className="items-center px-3 py-1 rounded-full space-x-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(209,250,229,0.7)", borderWidth: isDark ? 1 : 0, borderColor: isDark ? "#fff" : "transparent" }}>
                                <Ionicons name="pulse" size={16} color={isDark ? "#fff" : "#22C55E"} style={{ marginRight: 4 }} />
                                <Text className="text-xs font-semibold" style={{ color: isDark ? "#fff" : "#15803D" }}>Live</Text>
                            </HStack>
                        </HStack>
                    </HStack>
                )}
                

                {cards.length === 0 && (
                    <Box className="rounded-2xl border py-12 items-center" style={{ backgroundColor: isDark ? "rgba(30,30,30,0.6)" : "rgba(255,255,255,0.6)", borderColor: isDark ? "rgba(139,195,74,0.3)" : "rgba(229,231,235,0.5)" }}>
                        <Text className="text-4xl">⛳</Text>
                        <Text className="font-semibold text-sm mt-3" style={{ color: isDark ? "#aaa" : "#6B7280" }}>
                            {searchQuery ? "No matching scorecards found" : "No scorecards yet"}
                        </Text>
                    </Box>
                )}

                {cards.map((card) => (
                    <FeedCard
                        key={card.id}
                        card={card}
                        isDark={isDark}
                        isExpanded={expandedId === card.id}
                        onToggle={() => toggleCard(card.id)}
                        handleLike={handleLike}
                        onActivity={handleShowActivity}
                    />
                ))}
            </VStack>

            <Modal
                visible={activityModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setActivityModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
                    <Box style={{ backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderRadius: 24, padding: 24, maxHeight: "80%", elevation: 10 }}>
                        <HStack className="justify-between items-center mb-6">
                            <VStack>
                                <Text className="text-2xl font-bold" style={{ color: isDark ? "#fff" : "#111" }}>Activity</Text>
                                <Text className="text-sm" style={{ color: "#8BC34A", fontWeight: "600" }}>Interactions on this scorecard</Text>
                            </VStack>
                            <TouchableOpacity onPress={() => setActivityModalVisible(false)} style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6", padding: 8, borderRadius: 12 }}>
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
                                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
                                    <Text className="mt-4 text-center" style={{ color: isDark ? "#aaa" : "#666" }}>No interactions yet.</Text>
                                </View>
                            ) : (
                                <VStack space="md">
                                    {Array.isArray(likedUsers) && likedUsers.map((interaction, idx) => (
                                        <HStack key={idx} className="items-center p-3 rounded-xl" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB" }}>
                                            <Box style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: interaction.type === "Like" ? "#EF4444" : "#8BC34A", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                                {interaction.profilePictureUrl && interaction.profilePictureUrl !== "null" ? (
                                                    <Image source={{ uri: interaction.profilePictureUrl.startsWith('http') ? interaction.profilePictureUrl : `https://kolve18freeswing.com${interaction.profilePictureUrl}` }} style={{ width: "100%", height: "100%" }} />
                                                ) : (
                                                    <Text style={{ color: "#fff", fontWeight: "bold" }}>{interaction.user ? interaction.user.charAt(0).toUpperCase() : "?"}</Text>
                                                )}
                                            </Box>
                                            <VStack className="ml-3 flex-1">
                                                <Text className="font-bold text-lg" style={{ color: isDark ? "#fff" : "#111" }}>{interaction.user}</Text>
                                                <Text className="text-xs font-semibold" style={{ color: interaction.type === "Like" ? "#EF4444" : "#8BC34A" }}>
                                                    {interaction.type === "Like" ? "Liked this scorecard" : "Verified this scorecard"}
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
