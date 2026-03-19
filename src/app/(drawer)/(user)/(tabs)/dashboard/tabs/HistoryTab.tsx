import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, useColorScheme, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { getScoreHistory, ScoreHistoryItem } from "@/api/dashboard";
import { router } from "expo-router";

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
    playerId: number;
    onViewGame?: (id: string) => void;
};

export function HistoryTab({ playerId, onViewGame }: HistoryTabProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [history, setHistory] = useState<GameHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [playerId]);

    const fetchHistory = async () => {
        try {
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

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#8BC34A" />
            </SafeAreaView>
        );
    }

    const handleViewScorecard = (id: string) => {
        router.push(`/(drawer)/(user)/(tabs)/dashboard/tabs/scoreCard/${id}`);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#f2f2f2" }}>
            <VStack space="md" className="pb-8">
                <HStack
                    className="justify-between items-center px-4 mb-3"
                >
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

                {history.length === 0 ? (
                    <Box className="bg-background-0 rounded-2xl border border-outline-200 py-12 items-center mt-4">
                        <Ionicons name="time-outline" size={40} color="#9ca3af" />
                        <Text className="text-typography-400 font-semibold text-sm mt-3">
                            No history yet
                        </Text>
                    </Box>
                ) : (
                    history.map((item) => (
                        <Pressable key={item.id} onPress={() => handleViewScorecard(item.id)}>
                            <Box
                                className="rounded-2xl p-4 mb-3"
                                style={{
                                    backgroundColor: isDark ? "#161618" : "#fff",
                                    borderWidth: 1,
                                    borderColor: isDark ? "#8BC34A" : "#E5E7EB", // ✅ green in dark mode
                                }}
                            >
                                {/* 🔹 Top Row */}
                                <HStack className="justify-between items-start">

                                    {/* LEFT */}
                                    <VStack space="xs">
                                        <Text
                                            className="text-[#8BC34A] font-semibold text-base"
                                            style={{ fontSize: 16 }}
                                        >
                                            {item.course}
                                        </Text>

                                        {item.isTournament && (
                                            <Badge
                                                className="rounded-full px-3 py-1 self-start flex-row items-center border"
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
                                    <VStack className="items-end">
                                        <Text className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                            {item.date}
                                        </Text>
                                        <Text className="text-xs text-gray-400">
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
                                                backgroundColor:
                                                    isDark
                                                        ? "#161618"
                                                        : s.type === "par"
                                                            ? "#FEE2E2"
                                                            : "#F9FAFB",

                                                borderColor:
                                                    s.type === "par"
                                                        ? isDark
                                                            ? "#EF4444"
                                                            : "#FCA5A5"
                                                        : isDark
                                                            ? "#8BC34A"
                                                            : "#E5E7EB",

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
                        </Pressable>
                    ))
                )}
            </VStack>
        </SafeAreaView>
    );

}