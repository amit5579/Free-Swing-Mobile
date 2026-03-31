import { getScorecardDetails, ScorecardHoleApi as ScorecardHole, updateScorecardApi, saveScorecardApi } from "@/api/admin/dashboard";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, useColorScheme, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";

export default function ResumeScorecard() {
    const { id, handicap: handicapParam } = useLocalSearchParams<{ id: string, handicap: string }>();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const handicap = parseInt(handicapParam || "0");

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const [holes, setHoles] = useState<ScorecardHole[]>([]);
    const [textScores, setTextScores] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchScorecard = async () => {
            try {
                setLoading(true);
                const data = await getScorecardDetails(id!);
                setHoles(data);

                const initialText: Record<number, string> = {};
                data.forEach(h => {
                    if (h.score != null && h.score > 0) {
                        initialText[h.holeId] = h.score.toString();
                    }
                });
                setTextScores(initialText);
            } catch (err) {
                setError("Failed to load scorecard.");
            } finally {
                setLoading(false);
            }
        };
        fetchScorecard();
    }, [id]);

    const calculateStrokes = (handicap: number, strokeIndex: number) => {
        const base = Math.floor(handicap / 18);
        const remainder = handicap % 18;
        return base + (strokeIndex <= remainder ? 1 : 0);
    };

    const handleScoreChange = (holeId: number, text: string) => {
        // Remove non-numeric chars to prevent negative numbers
        let formattedText = text.replace(/[^0-9]/g, '');

        if (formattedText !== "") {
            const num = parseInt(formattedText, 10);
            if (num > 15) return; // block entering values above 15
            formattedText = num.toString();
        }

        setTextScores(prev => ({ ...prev, [holeId]: formattedText }));
        const score = formattedText === "" ? -1 : parseInt(formattedText, 10);

        setHoles(prev => prev.map(h => {
            if (h.holeId === holeId) {
                const strokes = calculateStrokes(handicap, h.handicap);
                const netScore = score >= 0 ? score - strokes : 0;
                return { ...h, score: score >= 0 ? score : 0, netScore };
            }
            return h;
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const holeScores = Object.entries(textScores).map(([holeId, score]) => ({
                holeId: parseInt(holeId),
                score: score === "" ? 0 : parseInt(score)
            }));
            await updateScorecardApi(id!, holeScores);
            // Alert.alert("Success", "Scorecard updated successfully");
        } catch (err) {
            console.error(err);
            // Alert.alert("Error", "Failed to save scorecard. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleFinishRound = async () => {
        Alert.alert(
            "Finish Round",
            "Are you sure you want to finish this round?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            setSaving(true);
                            // First save current scores
                            const holeScores = Object.entries(textScores).map(([holeId, score]) => ({
                                holeId: parseInt(holeId),
                                score: score === "" ? 0 : parseInt(score)
                            }));
                            await updateScorecardApi(id!, holeScores);

                            // Then finish the round
                            await saveScorecardApi(id!);
                            Alert.alert("Success", "Round finished successfully", [
                                { text: "OK", onPress: () => navigation.goBack() }
                            ]);
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Error", "Failed to finish round. Please try again.");
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    const sumScores = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + (h.score || 0), 0);

    const sumNet = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + (h.netScore || 0), 0);

    const sumYardage = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + (h.yardage || 0), 0);

    const sumPar = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + (h.par || 0), 0);

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)" }}>
                <Watermark />
                <ScrollView className="px-4 py-4 mt-4" showsVerticalScrollIndicator={false}>
                    {/* Header Row Skeleton */}
                    <View className="flex-row items-center mb-6 mt-4">
                        <Skeleton isDark={isDark} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                        <View className="flex-1">
                            <Skeleton isDark={isDark} width={200} height={24} style={{ marginBottom: 4 }} borderRadius={6} />
                            <Skeleton isDark={isDark} width={100} height={16} borderRadius={4} />
                        </View>
                    </View>

                    {/* Banner Skeleton */}
                    <Skeleton isDark={isDark} width="100%" height={56} borderRadius={12} style={{ marginBottom: 12 }} />

                    {/* Table Header Skeleton */}
                    <View className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <View key={i} className="flex-1 items-center">
                                <Skeleton isDark={isDark} width={24} height={14} borderRadius={4} />
                            </View>
                        ))}
                    </View>

                    {/* Table Rows Skeleton */}
                    <View className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`} style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                        {[...Array(9)].map((_, i) => (
                            <View key={i} className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={24} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center">
                                    <Skeleton isDark={isDark} width={46} height={36} borderRadius={8} />
                                </View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)" }}>
                <Watermark />
                <Text style={{ color: "red" }}>{error}</Text>
                <Pressable onPress={() => navigation.goBack()} className="mt-4 p-4 bg-[#8BC34A] rounded-full">
                    <Text className="text-white font-bold">Go Back</Text>
                </Pressable>
            </ThemedView>
        );
    }

    const front9 = holes.slice(0, 9);

    const renderScoreIndicator = (score: number | null, isDark: boolean, rawValue: string) => {
        if (rawValue === "" || rawValue === undefined) return null;

        if (score === 0) {
            // Albatross: Double Dark Cyan Circle
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
                    </View>
                </View>
            );
        }
        if (score === 1) {
            // Hole-in-One: Double Gold Circle
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
                    </View>
                </View>
            );
        }
        if (score === 2) {
            // Eagle: Double Green Circle
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
                    </View>
                </View>
            );
        }
        if (score === 3) {
            // Birdie: Single Green Circle
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
                </View>
            );
        }
        if (score === 4) {
            // Par: no indicator
            return null;
        }
        if (score === 5) {
            // Bogey: Single Red Square
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
                </View>
            );
        }
        if (score === 6) {
            // Double Bogey: Double Red Square
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
                        <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
                    </View>
                </View>
            );
        }
        if (score === 7) {
            // Triple Bogey: Triple Purple Square
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a" }]}>
                        <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a" }]}>
                            <View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a" }]} />
                        </View>
                    </View>
                </View>
            );
        }
        if (score !== null && score >= 8) {
            // Quadruple Bogey+: Single Black/White Square
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleSquare, { borderColor: isDark ? "#fff" : "#000" }]} />
                </View>
            );
        }
        return null;
    };

    return (
        <ThemedView style={{ flex: 1, backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)" }}>
            <Watermark />

            {/* Top Fixed Area */}
            <View className="px-4 pt-4 pb-2 z-10 w-full" style={{ backgroundColor: isDark ? "#000" : "transparent" }}>
                <View className="flex-row items-center mb-4 mt-8">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="flex-1">
                        <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                            Scorecard (Stableford)
                        </Text>
                        <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                            <Text className={`text-sm ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                                Handicap: {handicap}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Instruction Banner */}
                <View className={`p-3 rounded-xl border flex-row items-center ${isDark ? "bg-[#1A2E05] border-[#2e5209]" : "bg-green-50 border-green-200"}`}>
                    <Ionicons name="pencil" size={18} color={isDark ? "#8BC34A" : "#4CAF50"} />
                    <Text className={`ml-2 flex-1 text-sm font-medium ${isDark ? "text-[#8BC34A]" : "text-green-800"}`}>
                        Tap on any score box below to edit your round.
                    </Text>
                </View>
            </View>

            {/* Scrollable Table Area */}
            <ScrollView
                className="px-4 flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* 0th Element: Table Header (Sticky) */}
                <View className="z-10 shadow-sm" style={{ backgroundColor: "transparent" }}>
                    <View className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`} style={{ borderBottomWidth: 1, borderBottomColor: isDark ? "#444" : "#ddd" }}>
                        {["Hole", "SI", "Yards", "Par", "Score ✎", "Net"].map((h) => (
                            <Text key={h} className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}>
                                {h}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Table Rows */}
                <View className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`} style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                    {holes.map((h, index) => (
                        <View key={h.holeId} className={`flex-row items-center p-3 ${index < holes.length - 1 ? (isDark ? "border-b border-[#333]" : "border-b border-gray-100") : ""}`}>
                            <Text className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}>{h.holeNumber}</Text>
                            <Text className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.handicap}</Text>
                            <Text className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.yardage}</Text>
                            <Text className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}>{h.par}</Text>
                            <View className="flex-1 items-center justify-center relative">
                                {renderScoreIndicator(h.score ?? null, isDark, textScores[h.holeId] || "")}
                                <TextInput
                                    style={{
                                        width: 50,
                                        height: 40,
                                        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                        borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                                        borderWidth: 1,
                                        color: isDark ? "#fff" : "#000",
                                        textAlign: "center",
                                        borderRadius: 8,
                                        paddingVertical: 0,
                                        zIndex: 10,
                                        fontWeight: "bold",
                                    }}
                                    keyboardType="numeric"
                                    value={textScores[h.holeId] || ""}
                                    onChangeText={(val) => handleScoreChange(h.holeId, val)}
                                    placeholder="-"
                                    placeholderTextColor={isDark ? "#666" : "#999"}
                                />
                            </View>
                            <Text className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>
                                {(textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined) ? h.netScore : "0"}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Totals Section */}
                <View className="mt-6 mb-8 gap-y-2">
                    {/* Front 9 Subtotal */}
                    <View className={`flex-row p-3 rounded-xl ${isDark ? "bg-[#262626]" : "bg-gray-100"}`}>
                        <Text className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}>Front 9</Text>
                        <Text className="flex-1" />
                        <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sumYardage(holes.slice(0, 9))}</Text>
                        <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sumPar(holes.slice(0, 9))}</Text>
                        <Text className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}>{sumScores(holes.slice(0, 9))}</Text>
                        <Text className={`flex-1 text-center font-bold text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>{sumNet(holes.slice(0, 9))}</Text>
                    </View>

                    {/* Grand Total */}
                    <View className={`flex-row p-3 rounded-xl ${isDark ? "bg-[#8BC34A]" : "bg-[#8BC34A]"}`}>
                        <Text className="flex-1 text-center font-bold text-white">Grand Total</Text>
                        <Text className="flex-1" />
                        <Text className="flex-1 text-center font-bold text-white">{sumYardage(holes)}</Text>
                        <Text className="flex-1 text-center font-bold text-white">{sumPar(holes)}</Text>
                        <Text className="flex-1 text-center font-bold text-white">{sumScores(holes)}</Text>
                        <Text className="flex-1 text-center font-bold text-white">{sumNet(holes)}</Text>
                    </View>
                </View>

                {/* Finish Round Button */}
                <Pressable
                    onPress={handleFinishRound}
                    disabled={saving}
                    className={`mt-6 p-4 rounded-xl mb-4 flex-row justify-center items-center ${saving ? "bg-gray-500" : "bg-[#8BC34A]"}`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-done-outline" size={20} color="white" />
                            <Text className="text-white font-bold ml-2 text-lg">Finish Round</Text>
                        </>
                    )}
                </Pressable>

                {/* Scorecard Legend */}
                {(() => {
                    // Count occurrences of each raw score value (include 0 for Albatross)
                    const scoreCounts: Record<number, number> = {};
                    holes.forEach(h => {
                        const s = h.score;
                        if (s != null && s >= 0) {
                            scoreCounts[s] = (scoreCounts[s] || 0) + 1;
                        }
                    });

                    // Renders count text centered inside a shape; shows nothing if count=0
                    const InnerCount = ({ count, color, small = false }: { count: number; color: string; small?: boolean }) =>
                        count > 0 ? (
                            <Text style={{
                                color,
                                fontSize: small ? 9 : 13,
                                fontWeight: "900",
                                textAlign: "center",
                                lineHeight: small ? 11 : 15,
                            }}>{count}</Text>
                        ) : null;

                    const dynamicLegend = [
                        {
                            scoreVal: 1,
                            label: "Hole-in-One",
                            render: (count: number) => (
                                // Double gold circle — count in inner circle
                                <View style={[styles.doubleCircle, { borderColor: "#ffd700", width: 48, height: 48, borderRadius: 24 }]}>
                                    <View style={[styles.innerCircle, { borderColor: "#ffd700", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#ffd700" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            scoreVal: 0,
                            label: "Albatross",
                            render: (count: number) => (
                                // Double cyan circle — count in inner circle
                                <View style={[styles.doubleCircle, { borderColor: "#006064", width: 48, height: 48, borderRadius: 24 }]}>
                                    <View style={[styles.innerCircle, { borderColor: "#006064", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#006064" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            scoreVal: 2,
                            label: "Eagle",
                            render: (count: number) => (
                                // Double green circle — count in inner circle
                                <View style={[styles.doubleCircle, { borderColor: "#2e7d32", width: 48, height: 48, borderRadius: 24 }]}>
                                    <View style={[styles.innerCircle, { borderColor: "#2e7d32", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#2e7d32" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            scoreVal: 3,
                            label: "Birdie",
                            render: (count: number) => (
                                // Single green circle — count centered inside
                                <View style={[styles.singleCircle, { borderColor: "#2e7d32", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" }]}>
                                    <InnerCount count={count} color="#2e7d32" />
                                </View>
                            ),
                        },
                        {
                            scoreVal: 4,
                            label: "Par",
                            render: (count: number) => (
                                // Dashed square — count centered inside
                                <View style={{ width: 48, height: 48, borderWidth: 2, borderStyle: "dashed", borderColor: "#9CA3AF", justifyContent: "center", alignItems: "center" }}>
                                    <InnerCount count={count} color="#6B7280" />
                                </View>
                            ),
                        },
                        {
                            scoreVal: 5,
                            label: "Bogey",
                            render: (count: number) => (
                                // Single red square — count centered inside
                                <View style={[styles.singleSquare, { borderColor: "#d32f2f", width: 48, height: 48, justifyContent: "center", alignItems: "center" }]}>
                                    <InnerCount count={count} color="#d32f2f" />
                                </View>
                            ),
                        },
                        {
                            scoreVal: 6,
                            label: "Double Bogey",
                            render: (count: number) => (
                                // Double red square — count in inner square
                                <View style={[styles.doubleSquare, { borderColor: "#d32f2f", width: 48, height: 48 }]}>
                                    <View style={[styles.innerSquare, { borderColor: "#d32f2f", width: 34, height: 34, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#d32f2f" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            scoreVal: 7,
                            label: "Triple Bogey",
                            render: (count: number) => (
                                // Triple purple square — count in innermost square
                                <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a", width: 48, height: 48 }]}>
                                    <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a", width: 37, height: 37 }]}>
                                        <View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a", width: 26, height: 26, justifyContent: "center", alignItems: "center" }]}>
                                            <InnerCount count={count} color="#6a1b9a" small />
                                        </View>
                                    </View>
                                </View>
                            ),
                        },
                        {
                            scoreVal: 8,
                            label: "Quad Bogey+",
                            render: (_count: number) => {
                                // count all scores >= 8
                                const quadCount = Object.entries(scoreCounts)
                                    .filter(([k]) => Number(k) >= 8)
                                    .reduce((s, [, v]) => s + v, 0);
                                return (
                                    <View style={[styles.singleSquare, { borderColor: isDark ? "#fff" : "#000", width: 48, height: 48, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={quadCount} color={isDark ? "#fff" : "#000"} />
                                    </View>
                                );
                            },
                        },
                    ];

                    return (
                        <View className="mb-20 p-4 rounded-2xl" style={{ backgroundColor: isDark ? "rgba(31,31,31,0.6)" : "rgba(255,255,255,0.6)", borderWidth: 1, borderColor: isDark ? "rgba(51,51,51,0.6)" : "rgba(238,238,238,0.6)" }}>
                            <Text className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}>Scorecard Legend</Text>
                            {(() => {
                                // Chunk into rows of 3
                                const rows: (typeof dynamicLegend)[] = [];
                                for (let i = 0; i < dynamicLegend.length; i += 3) {
                                    rows.push(dynamicLegend.slice(i, i + 3));
                                }
                                return rows.map((row, rowIdx) => (
                                    <View key={rowIdx} style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
                                        {row.map((item, idx) => {
                                            const count = item.scoreVal === 8
                                                ? 0 // handled inside render
                                                : (scoreCounts[item.scoreVal] || 0);
                                            return (
                                                <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                                                    {item.render(count)}
                                                    <Text style={{ fontSize: 11, marginTop: 6, fontWeight: "500", color: isDark ? "#D1D5DB" : "#4B5563", textAlign: "center" }}>
                                                        {item.label}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ));
                            })()}
                        </View>
                    );
                })()}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    indicatorContainer: {
        position: "absolute",
        width: 45,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    doubleCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    innerCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    singleCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
    },
    doubleSquare: {
        width: 36,
        height: 36,
        borderRadius: 4,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    innerSquare: {
        width: 28,
        height: 28,
        borderRadius: 2,
        borderWidth: 1.5,
    },
    singleSquare: {
        width: 34,
        height: 34,
        borderRadius: 4,
        borderWidth: 2,
    },
    tripleSquareOuter: {
        width: 40,
        height: 40,
        borderRadius: 4,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    tripleSquareMid: {
        width: 31,
        height: 31,
        borderRadius: 3,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    tripleSquareInner: {
        width: 22,
        height: 22,
        borderRadius: 2,
        borderWidth: 1.5,
    },
});
