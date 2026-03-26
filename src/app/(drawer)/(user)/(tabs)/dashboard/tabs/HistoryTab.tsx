import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, useColorScheme, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getScoreHistory, ScoreHistoryItem } from "@/api/dashboard";
import { router } from "expo-router";
import { Skeleton } from "@/components/Skeleton";

export type GameHistory = {
    id: string;
    date: string;
    time: string;
    course: string;
    score: number;
    net: number;
    parDiff: number;
    isTournament: boolean;
};

type HistoryTabProps = {
    activeTab: string;
    playerId: number;
    onViewGame?: (id: string) => void;
};

export function HistoryTab({ activeTab, playerId, onViewGame }: HistoryTabProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [history, setHistory] = useState<GameHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [playerId])
    );

    useEffect(() => {
        if (activeTab === "history") {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data: ScoreHistoryItem[] = await getScoreHistory(playerId);

            const mapped: GameHistory[] = data.map((item) => ({
                id: item.scorecardId.toString(),
                date: new Date(item.date).toLocaleDateString(),
                time: new Date(item.date).toLocaleTimeString(),
                course: item.courseName,
                score: item.score,
                net: item.netScore,
                parDiff: item.score - item.par,
                isTournament: !!item.tournamentId,
            }));

            setHistory(mapped);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewScorecard = (id: string) => {
        if (onViewGame) {
            onViewGame(id);
        } else {
            router.push(`/(drawer)/scoreCard/resume/${id}` as any);
        }
    };

    return (
        <VStack space="md" className="pb-8 mt-0 pt-0">
            <HStack className="justify-between items-center px-4 mb-2">
                <VStack>
                    <Text className={`font-bold ${isDark ? "text-white" : "text-gray-900"} text-lg`}>
                        Recent Activity
                    </Text>
                    <Text className={`text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}>
                        Your game history and performance
                    </Text>
                </VStack>

                <Pressable onPress={fetchHistory} className="p-2 rounded-full">
                    <Ionicons
                        name="refresh-outline"
                        size={20}
                        color={isDark ? "#fff" : "#6B7280"}
                    />
                </Pressable>
            </HStack>

            {loading ? (
                <VStack className="px-0 space-y-4">
                    {/* Cards Skeleton */}
                    {[1, 2, 3].map((key) => (
                        <Box
                            key={key}
                            className="rounded-2xl mb-4"
                            style={{
                                backgroundColor: isDark
                                    ? "rgba(26,26,26,0.6)"
                                    : "rgba(255,255,255,0.7)",
                                borderLeftWidth: 6,
                                borderLeftColor: "#8BC34A",
                                borderWidth: 1,
                                borderColor: "rgba(139, 195, 74, 0.3)",
                                borderRadius: 20,
                                padding: 16,
                            }}
                        >
                            {/* 🔹 Top Row */}
                            <HStack className="justify-between items-start">
                                <VStack style={{ flex: 1 }}>
                                    <Skeleton isDark={isDark} width="70%" height={18} style={{ marginBottom: 8 }} />

                                    {/* Tournament badge skeleton */}
                                    <Skeleton isDark={isDark} width={90} height={18} borderRadius={12} />
                                </VStack>

                                <VStack className="items-end">
                                    <Skeleton isDark={isDark} width={80} height={14} style={{ marginBottom: 6 }} />
                                    <Skeleton isDark={isDark} width={60} height={12} />
                                </VStack>
                            </HStack>

                            {/* 🔹 Stats Row */}
                            <HStack space="sm" className="mt-4">
                                {[1, 2, 3].map((i) => (
                                    <Box
                                        key={i}
                                        className="flex-1 items-center py-3 rounded-xl"
                                        style={{
                                            backgroundColor: isDark
                                                ? "rgba(22, 22, 24, 0.6)"
                                                : "rgba(255, 255, 255, 0.6)",
                                            borderColor: "rgba(139,195,74,0.3)",
                                            borderWidth: 1,
                                        }}
                                    >
                                        <Skeleton isDark={isDark} width={40} height={10} style={{ marginBottom: 6 }} />
                                        <Skeleton isDark={isDark} width={50} height={20} />
                                    </Box>
                                ))}
                            </HStack>

                            {/* 🔹 Button Skeleton */}
                            <Skeleton
                                isDark={isDark}
                                width="100%"
                                height={40}
                                borderRadius={20}
                                style={{ marginTop: 16 }}
                            />
                        </Box>
                    ))}
                </VStack>
            ) : (
                <VStack space="md">
                    {history.length === 0 ? (
                        <Box
                            className="rounded-2xl border py-12 items-center mt-4"
                            style={{
                                backgroundColor: isDark ? "rgba(22, 22, 24, 0.7)" : "rgba(255, 255, 255, 0.7)",
                                borderWidth: 1,
                                borderColor: "rgba(139, 195, 74, 0.3)",
                            }}
                        >
                            <Ionicons name="time-outline" size={40} color="#9ca3af" />
                            <Text className="text-typography-400 font-semibold text-sm mt-3">
                                No history yet
                            </Text>
                        </Box>
                    ) : (
                        history.map((item) => (
                            <Pressable key={item.id} onPress={() => handleViewScorecard(item.id)}>
                                <Box
                                    className="rounded-2xl mb-4"
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
                                        {/* 🔹 Top Row */}
                                        <HStack className="justify-between items-start">

                                            {/* LEFT */}
                                            <VStack space="xs" style={{ flex: 1, paddingRight: 12 }}>
                                                <Text
                                                    className="text-[#8BC34A] font-bold text-lg"
                                                    style={{ fontSize: 17 }}
                                                    numberOfLines={2}
                                                >
                                                    {item.course}
                                                </Text>

                                                {item.isTournament && (
                                                    <Badge
                                                        className="rounded-full px-3 py-1 self-start flex-row items-center border mt-1"
                                                        style={{
                                                            backgroundColor: isDark ? "#06B6D4" : "#22D3EE", // sky/cyan
                                                            borderColor: isDark ? "#06B6D4" : "#22D3EE",     // same as bg
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name="trophy"
                                                            size={12}
                                                            color="#fff"
                                                            style={{ marginRight: 4 }}
                                                        />

                                                        <BadgeText className="text-white text-xs">
                                                            Tournament
                                                        </BadgeText>
                                                    </Badge>
                                                )}
                                            </VStack>

                                            {/* RIGHT */}
                                            <VStack className="items-end" style={{ flexShrink: 0 }}>
                                                <Text className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                                    {item.date}
                                                </Text>
                                                <Text className="text-xs text-gray-400 mt-1">
                                                    {item.time}
                                                </Text>
                                            </VStack>
                                        </HStack>

                                        {/* 🔹 Stats Row */}
                                        <HStack space="sm" className="mt-4">
                                            {[
                                                { label: "SCORE", value: item.score, type: "normal" },
                                                { label: "NET", value: item.net, type: "green" },
                                                { label: "PAR", value: item.parDiff, type: "par" },
                                            ].map((s) => (
                                                <Box
                                                    key={s.label}
                                                    className="flex-1 rounded-xl items-center py-3 border"
                                                    style={{
                                                        backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)",
                                                        borderColor: "rgba(139,195,74,0.3)",
                                                        borderWidth: 1,
                                                    }}
                                                >
                                                    {/* Label */}
                                                    <Text
                                                        className="text-[10px] uppercase tracking-widest mb-1"
                                                        style={{
                                                            color:
                                                                s.type === "par"
                                                                    ? isDark
                                                                        ? "#FCA5A5"
                                                                        : "#B91C1C"
                                                                    : isDark
                                                                        ? "#9CA3AF"
                                                                        : "#6B7280",
                                                        }}
                                                    >
                                                        {s.label}
                                                    </Text>

                                                    {/* Value */}
                                                    <Text
                                                        className="text-base font-bold"
                                                        style={{
                                                            color:
                                                                s.type === "par"
                                                                    ? isDark
                                                                        ? "#FECACA"
                                                                        : "#DC2626"
                                                                    : s.type === "green"
                                                                        ? "#10B981"
                                                                        : isDark
                                                                            ? "#FFFFFF"
                                                                            : "#111827",
                                                        }}
                                                    >
                                                        {s.type === "par"
                                                            ? item.parDiff >= 0
                                                                ? `+${item.parDiff}`
                                                                : item.parDiff
                                                            : s.value}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </HStack>

                                        {/* 🔹 View Button */}
                                        <HStack className="mt-4 w-full">
                                            <Button
                                                size="sm"
                                                className="w-full rounded-full h-10 flex-row items-center justify-center"
                                                style={{ backgroundColor: "#8BC34A" }}
                                                onPress={() => handleViewScorecard(item.id)}
                                            >
                                                <Ionicons name="eye-outline" size={14} color="white" />
                                                <ButtonText className="text-white text-xs font-bold ml-1.5">
                                                    View
                                                </ButtonText>
                                            </Button>
                                        </HStack>
                                    </Box>
                                </Box>
                            </Pressable>
                        ))
                    )}
                </VStack>
            )}
        </VStack>
    );

}