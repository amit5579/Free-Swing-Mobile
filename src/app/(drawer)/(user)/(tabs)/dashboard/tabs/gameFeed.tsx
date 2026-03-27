import { Avatar, AvatarFallbackText } from "@/components/avatar";
import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { useRouter } from "expo-router";

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
};

const diffLabel = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const diffColor = (n: number) => (n < 0 ? "#ef4444" : "#10b981");

const FeedCard = ({
    card,
    isDark,
    isExpanded,
    onToggle,
    handleLike,
}: {
    card: Scorecard;
    isDark: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    handleLike: (id: string) => void;
}) => {
    const router = useRouter();

    const handleViewScorecard = () => {
        router.push(`/(drawer)/(user)/(tabs)/dashboard/tabs/scoreCard/${card.id}`);
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
                    ? "rgba(26,26,26,0.6)" // highly transparent
                    : "rgba(255,255,255,0.7)", // light mode transparent
                borderLeftWidth: 6,
                borderLeftColor: "#8BC34A",
                borderTopWidth: isDark ? 1 : 1,
                borderRightWidth: isDark ? 1 : 1,
                borderBottomWidth: isDark ? 1 : 1,
                borderColor: isDark ? "rgba(139, 195, 74, 0.3)" : "rgba(139, 195, 74, 0.3)",
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
                                numberOfLines={1}
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

                {/* Course & Holes info always visible when collapsed */}
                {!isExpanded && (
                    <HStack space="sm" className="items-center mt-2 flex-wrap">
                        <HStack space="xs" className="items-center mr-2">
                            <Ionicons name="flag-outline" size={11} color={isDark ? "#aaa" : "#9ca3af"} />
                            <Text className="text-xs" style={{ color: isDark ? "#ccc" : "#6b7280" }}>
                                {card.course}
                            </Text>
                        </HStack>
                        <Badge size="sm" className="rounded-full px-2 py-0.5" style={{ backgroundColor: isDark ? "rgba(55,65,81,0.8)" : "rgba(17,24,39,0.8)" }}>
                            <BadgeText className="text-white font-semibold text-[10px]">{card.holes} Holes</BadgeText>
                        </Badge>
                    </HStack>
                )}
            </Pressable>

            {/* FULL CARD DETAILS (Visible when Expanded) */}
            {isExpanded && (
                <VStack style={{ marginTop: 0 }}>
                    <Divider style={{ marginBottom: 16, backgroundColor: isDark ? "rgba(51,51,51,0.5)" : "rgba(240,240,240,0.5)" }} />
                    <VStack space="xs" className="px-4 pb-2">
                        <HStack space="xs" className="items-center flex-wrap">
                            <Ionicons name="flag-outline" size={11} color={isDark ? "#aaa" : "#9ca3af"} />
                            <Text className="text-xs mr-2" style={{ color: isDark ? "#ccc" : "#6b7280" }}>
                                {card.course}
                            </Text>
                            <Box className="rounded px-1.5 py-0.5" style={{ backgroundColor: isDark ? "rgba(51,51,51,0.8)" : "rgba(219,234,254,0.8)" }}>
                                <Text className="text-[10px] font-bold" style={{ color: isDark ? "#fff" : "#1E3A8A" }}>
                                    {card.tee}
                                </Text>
                            </Box>
                            <Badge size="sm" className="rounded-full px-3 py-1 ml-1" style={{ backgroundColor: isDark ? "rgba(55,65,81,0.8)" : "rgba(17,24,39,0.8)" }}>
                                <BadgeText className="text-white font-semibold text-xs">{card.holes} Holes</BadgeText>
                            </Badge>
                        </HStack>
                    </VStack>

                    <HStack space="sm" className="mx-4 mb-4">
                        <Box className="flex-1 rounded-2xl py-6 items-center border" style={{ borderColor: "rgba(139,195,74,0.3)", backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)" }}>
                            <Text className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: isDark ? "#aaa" : "#9CA3AF" }}>Gross</Text>
                            <Text className="text-4xl font-black tracking-tighter" style={{ color: isDark ? "#fff" : "#111" }}>{card.grossScore}</Text>
                        </Box>
                        <Box className="flex-1 rounded-2xl py-6 items-center border" style={{ borderColor: "rgba(139,195,74,0.3)", backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)" }}>
                            <Text className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: isDark ? "#aaa" : "#9CA3AF" }}>To Par</Text>
                            <Text style={{ color: diffColor(card.grossDiff) }} className="text-4xl font-black tracking-tighter">{diffLabel(card.grossDiff)}</Text>
                        </Box>
                    </HStack>

                    <HStack space="sm" className="mx-4 mb-3">
                        {[
                            { label: "Net", value: card.net, green: true },
                            { label: "Points", value: card.points, green: true },
                            { label: "Par", value: card.par, green: false },
                        ].map((s) => (
                            <Box key={s.label} className="flex-1 rounded-xl items-center py-3 border" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", borderColor: "rgba(139,195,74,0.3)" }}>
                                <Text className="text-[10px] uppercase tracking-widest mb-1" style={{ color: isDark ? "#aaa" : "#6b7280" }}>{s.label}</Text>
                                <Text className={`text-base font-bold`} style={{ color: s.green ? "#10B981" : isDark ? "#fff" : "#111" }}>{s.value}</Text>
                            </Box>
                        ))}
                    </HStack>

                    <Divider style={{ backgroundColor: isDark ? "rgba(51,51,51,0.5)" : "rgba(229,231,235,0.5)" }} />

                    {/* Footer */}
                    <HStack className="px-4 py-4 justify-between items-center" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.3)" : "rgba(249, 250, 251, 0.3)" }}>
                        <HStack space="lg" className="items-center">
                            <Pressable onPressIn={() => handleLike(card.id)} hitSlop={10} className="p-2 rounded-full flex-row items-center" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(229,231,235,0.5)" }}>
                                <Ionicons name={card.isLiked ? "heart" : "heart-outline"} size={20} color={card.isLiked ? "#EF4444" : isDark ? "#fff" : "#6b7280"} />
                                <Text className="text-sm font-semibold ml-1.5" style={{ color: isDark ? "#fff" : "#6b7280" }}>{card.likes}</Text>
                            </Pressable>
                        </HStack>

                        <HStack space="sm" className="items-center">
                            <Button size="sm" className="rounded-full px-4 h-9 shadow-sm" style={{ backgroundColor: "#8BC34A" }} onPress={handleViewScorecard}>
                                <Ionicons name="eye-outline" size={14} color="#fff" />
                                <ButtonText className="text-white text-xs font-extrabold ml-1.5">View</ButtonText>
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
};

export function OverviewTab({ cards, handleLike }: OverviewTabProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const [expandedId, setExpandedId] = useState<string | null>(cards.length > 0 ? cards[0].id : null);

    const toggleCard = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <VStack space="md">
                <HStack className="justify-between items-center mb-2">
                    <HStack space="sm" className="items-center">
                        <Text className="text-xl font-bold" style={{ color: isDark ? "#fff" : "#000" }}>
                            Game Feed
                        </Text>
                        <HStack className="items-center px-3 py-1 rounded-full space-x-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(209,250,229,0.7)", borderWidth: isDark ? 1 : 0, borderColor: isDark ? "#fff" : "transparent" }}>
                            <Ionicons name="pulse" size={16} color={isDark ? "#fff" : "#22C55E"} style={{ marginRight: 4 }} />
                            <Text className="text-xs font-semibold" style={{ color: isDark ? "#fff" : "#15803D" }}>Live</Text>
                        </HStack>
                    </HStack>
                </HStack>

                {cards.length === 0 && (
                    <Box className="rounded-2xl border py-12 items-center" style={{ backgroundColor: isDark ? "rgba(30,30,30,0.6)" : "rgba(255,255,255,0.6)", borderColor: isDark ? "rgba(139,195,74,0.3)" : "rgba(229,231,235,0.5)" }}>
                        <Text className="text-4xl">⛳</Text>
                        <Text className="font-semibold text-sm mt-3" style={{ color: isDark ? "#aaa" : "#6B7280" }}>No scorecards yet</Text>
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
                    />
                ))}
            </VStack>
        </SafeAreaView>
    );
}

export default OverviewTab;
