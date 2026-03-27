import { getScorecardDetails, ScorecardHole } from "@/api/dashboard";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Skeleton } from "@/components/Skeleton";

type Props = {
    handicap: number;
};

const ScoreCard: React.FC<Props> = ({ handicap }) => {
    const { scoreCard } = useLocalSearchParams<{ scoreCard: string }>();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
        const parent = navigation.getParent();

        return () => {
            parent?.setOptions({ headerShown: true });
        };
    }, [navigation]);

    const [holes, setHoles] = useState<ScorecardHole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchScorecard = async () => {
            try {
                setLoading(true);
                const data = await getScorecardDetails(scoreCard!);
                setHoles(data);
            } catch (err) {
                setError("Failed to load scorecard.");
            } finally {
                setLoading(false);
            }
        };
        fetchScorecard();
    }, [scoreCard]);

    const sumPoints = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + h.stablefordPoints, 0);
    const sumScores = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + h.score, 0);
    const sumNet = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + h.netScore, 0);
    if (loading) {
        return (
            <ScrollView className="flex-1 bg-white px-4 py-4 mt-8">
                <Skeleton width={200} height={28} style={{ marginBottom: 4 }} />
                <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />

                <View className="flex-row bg-gray-200 py-2 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <View key={i} className="flex-1 items-center">
                            <Skeleton width={20} height={14} />
                        </View>
                    ))}
                </View>

                {[...Array(9)].map((_, i) => (
                    <View key={i} className="flex-row py-3 mb-2" style={{ borderBottomWidth: 1, borderColor: "#e5e7eb" }}>
                        {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                            <View key={j} className="flex-1 items-center">
                                <Skeleton width={20} height={16} borderRadius={4} />
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
        );
    }
    if (error)
        return <Text className="mt-12 text-center text-red-500">{error}</Text>;

    const front9 = holes.slice(0, 9);
    const back9 = holes.slice(9, 18);

    return (
        <ScrollView className="flex-1 bg-white px-4 py-4">
            <Text className="text-xl font-bold mb-1">
                Scorecard (Stableford)
            </Text>
            <Text className="text-base mb-4">
                Handicap: {handicap}
            </Text>

            {/* Header */}
            <View className="flex-row bg-gray-200 py-2">
                {["Hole", "SI", "Yards", "Par", "Score", "Net", "Pts"].map((h) => (
                    <Text key={h} className="flex-1 text-center font-semibold text-xs">
                        {h}
                    </Text>
                ))}
            </View>

            {/* Rows */}
            {holes.map((h) => (
                <View key={h.holeId} className="flex-row border-b border-gray-200 py-2">
                    <Text className="flex-1 text-center">{h.holeNumber}</Text>
                    <Text className="flex-1 text-center">{h.handicap}</Text>
                    <Text className="flex-1 text-center">{h.yardage}</Text>
                    <Text className="flex-1 text-center">{h.par}</Text>
                    <Text className="flex-1 text-center">{h.score}</Text>
                    <Text className="flex-1 text-center">{h.netScore}</Text>
                    <Text className="flex-1 text-center">{h.stablefordPoints}</Text>
                </View>
            ))}

            {/* Summary */}
            {/* Front 9 */}
            <View className="flex-row bg-gray-100 py-2">
                <Text className="flex-1 text-center font-semibold">Front 9</Text>
                <Text className="flex-1" />
                <Text className="flex-1 text-center">
                    {front9.reduce((a, h) => a + h.yardage, 0)}
                </Text>
                <Text className="flex-1 text-center">
                    {front9.reduce((a, h) => a + h.par, 0)}
                </Text>
                <Text className="flex-1 text-center">{sumScores(front9)}</Text>
                <Text className="flex-1 text-center">{sumNet(front9)}</Text>
                <Text className="flex-1 text-center">{sumPoints(front9)}</Text>
            </View>

            {/* Back 9 */}
            <View className="flex-row bg-gray-100 py-2">
                <Text className="flex-1 text-center font-semibold">Back 9</Text>
                <Text className="flex-1" />
                <Text className="flex-1 text-center">
                    {back9.reduce((a, h) => a + h.yardage, 0)}
                </Text>
                <Text className="flex-1 text-center">
                    {back9.reduce((a, h) => a + h.par, 0)}
                </Text>
                <Text className="flex-1 text-center">{sumScores(back9)}</Text>
                <Text className="flex-1 text-center">{sumNet(back9)}</Text>
                <Text className="flex-1 text-center">{sumPoints(back9)}</Text>
            </View>

            {/* Total */}
            <View className="flex-row bg-gray-200 py-2">
                <Text className="flex-1 text-center font-bold">Total</Text>
                <Text className="flex-1" />
                <Text className="flex-1 text-center">
                    {holes.reduce((a, h) => a + h.yardage, 0)}
                </Text>
                <Text className="flex-1 text-center">
                    {holes.reduce((a, h) => a + h.par, 0)}
                </Text>
                <Text className="flex-1 text-center">{sumScores(holes)}</Text>
                <Text className="flex-1 text-center">{sumNet(holes)}</Text>
                <Text className="flex-1 text-center font-bold">
                    {sumPoints(holes)}
                </Text>
            </View>

            {/* Legend */}
            <View className="mt-6">
                <Text className="font-semibold text-center mb-4">
                    Scorecard Legend (Points Mode)
                </Text>

                <View className="flex-row flex-wrap justify-between">

                    {/* Hole-in-One */}
                    <View className="w-[48%] items-center mb-4">
                        <View className="w-12 h-12 rounded-full border items-center justify-center" style={{ borderColor: "#ffd700" }}>
                            <View className="w-10 h-10 rounded-full border" style={{ borderColor: "#ffd700" }} />
                        </View>
                        <Text className="text-xs mt-1">Hole-in-One</Text>
                    </View>

                    {/* Albatross */}
                    <View className="w-[48%] items-center mb-4">
                        <View className="w-12 h-12 rounded-full border items-center justify-center" style={{ borderColor: "#006064" }}>
                            <View className="w-10 h-10 rounded-full border" style={{ borderColor: "#006064" }} />
                        </View>
                        {/* <View className="w-6 h-6 rounded-full border-2 border-cyan-800" /> */}
                        <Text className="text-xs mt-1">Albatross</Text>
                    </View>

                    {/* Eagle */}
                    <View className="w-[48%] items-center mb-4">
                        <View className="w-12 h-12 rounded-full border items-center justify-center" style={{ borderColor: "#2e7d32" }}>
                            <View className="w-10 h-10 rounded-full border" style={{ borderColor: "#2e7d32" }} />
                        </View>
                        <Text className="text-xs mt-1">Eagle</Text>
                    </View>

                    {/* Birdie */}
                    <View className="w-[48%] items-center mb-4">
                        <View
                            className="w-12 h-12 rounded-full border-2"
                            style={{ borderColor: "#2e7d32" }}
                        />
                        <Text className="text-xs mt-1">Birdie</Text>
                    </View>

                    {/* Par */}
                    <View className="w-[48%] items-center mb-4">
                        <View className="w-12 h-12 border-2 border-dashed border-gray-400 items-center justify-center">
                            {/* <Text className="text-xs text-gray-500">7</Text> */}
                        </View>
                        <Text className="text-xs mt-1">Par</Text>
                    </View>

                    {/* Bogey */}
                    <View className="w-[48%] items-center mb-4">
                        <View
                            className="w-12 h-12 border-2 items-center justify-center rounded"
                            style={{ borderColor: "#d32f2f" }}
                        >
                            {/* <Text className="text-xs" style={{ color: "#d32f2f" }}>
                                8
                            </Text> */}
                        </View>
                        <Text className="text-xs mt-1">Bogey</Text>
                    </View>

                    {/* Double Bogey */}
                    <View className="w-[48%] items-center mb-4">
                        <View
                            className="w-12 h-12 rounded items-center justify-center border"
                            style={{ borderColor: "#d32f2f" }}
                        >
                            <View
                                className="w-10 h-10 items-center justify-center border"
                                style={{ borderColor: "#d32f2f" }}
                            >
                                {/* <Text className="text-xs" style={{ color: "#d32f2f" }}>
                                    3
                                </Text> */}
                            </View>
                        </View>
                        <Text className="text-xs mt-1">Double Bogey</Text>
                    </View>

                    {/* Triple Bogey */}
                    <View className="w-[48%] items-center mb-4">
                        <View
                            className="w-12 h-12 rounded items-center justify-center border-2"
                            style={{ borderColor: "#6a1b9a" }}
                        >
                            <View
                                className="w-10 h-10 rounded items-center justify-center border"
                                style={{ borderColor: "#6a1b9a" }}
                            >
                                <View
                                    className="w-8 h-8 items-center justify-center border"
                                    style={{ borderColor: "#6a1b9a" }}
                                >
                                </View>
                            </View>
                        </View>
                        <Text className="text-xs mt-1">Triple Bogey</Text>
                    </View>

                    {/* Quad+ */}
                    <View className="w-[48%] items-center mb-4">
                        <View className="w-12 h-12 border-2 border-black rounded" />
                        <Text className="text-xs mt-1">Quadruple Bogey+</Text>
                    </View>

                </View>
            </View>
        </ScrollView>
    );
};

export default ScoreCard;