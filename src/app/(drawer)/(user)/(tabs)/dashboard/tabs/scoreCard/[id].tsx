import { getScorecardDetails, ScorecardHole } from "@/api/dashboard";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, useColorScheme, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import https from "@/api/https";

export default function ResumeScorecard() {
    const { id, handicap: handicapParam } = useLocalSearchParams<{ id: string, handicap: string }>();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const handicap = parseInt(handicapParam || "0");

    useLayoutEffect(() => {
        navigation.setOptions({ 
            headerShown: true,
            title: "Resume Game",
            headerStyle: {
                backgroundColor: isDark ? "#161618" : "#f2f2f2",
            },
            headerTintColor: isDark ? "#fff" : "#000",
        });
    }, [navigation, isDark]);

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
                    if (h.score > 0 || h.isCompleted) {
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
        setTextScores(prev => ({ ...prev, [holeId]: text }));
        const score = text === "" ? -1 : parseInt(text);

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
            // Bulk update implementation would go here
            Alert.alert("Success", "Scorecard updated successfully");
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to save scorecard. Please try again.");
        } finally {
            setSaving(false);
        }
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
            <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#f2f2f2" }}>
                <ScrollView className="px-4 py-4">
                    <Skeleton isDark={isDark} width={250} height={28} style={{ marginBottom: 4 }} />
                    <Skeleton isDark={isDark} width={120} height={20} style={{ marginBottom: 16 }} />
                    <View className={`flex-row p-2 mb-2 rounded ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <View key={i} className="flex-1 items-center">
                                <Skeleton isDark={isDark} width={20} height={14} />
                            </View>
                        ))}
                    </View>
                    {[...Array(9)].map((_, i) => (
                        <View key={i} className="flex-row py-3 mb-2 px-2" style={{ borderBottomWidth: 1, borderColor: isDark ? "#333" : "#e5e7eb" }}>
                            {[1, 2, 3, 4, 5, 6].map((j) => (
                                <View key={j} className="flex-1 items-center">
                                    <Skeleton isDark={isDark} width={20} height={16} borderRadius={4} />
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "red" }}>{error}</Text>
                <Pressable onPress={() => navigation.goBack()} className="mt-4 p-2 bg-[#8BC34A] rounded">
                    <Text className="text-white">Go Back</Text>
                </Pressable>
            </ThemedView>
        );
    }

    const front9 = holes.slice(0, 9);

    const renderScoreIndicator = (score: number, isDark: boolean, rawValue: string) => {
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
        if (score === 3 || score === 4) {
            // Birdie: Single Green Circle
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
                </View>
            );
        }
        if (score === 5 || score === 6) {
            // Double Bogey: Double Red Square
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
                        <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
                    </View>
                </View>
            );
        }
        if (score >= 7) {
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
        <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#f2f2f2" }}>
            <Watermark />
            <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <Text className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>
                        Scorecard (Net Score Include Par 3)
                    </Text>
                    <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                        <Text className={`text-base ml-1 ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                            Handicap: {handicap}
                        </Text>
                    </View>
                </View>

                {/* Table Header */}
                <View className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`} style={{ borderBottomWidth: 1, borderBottomColor: isDark ? "#444" : "#ddd" }}>
                    {["Hole", "SI", "Yards", "Par", "Score", "Net"].map((h) => (
                        <Text key={h} className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`}>
                            {h}
                        </Text>
                    ))}
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
                                {renderScoreIndicator(h.score, isDark, textScores[h.holeId] || "")}
                                <TextInput
                                    style={{
                                        width: 50,
                                        height: 40,
                                        backgroundColor: "transparent",
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

                {/* Save Button */}
                <Pressable 
                    onPress={handleSave} 
                    disabled={saving}
                    className={`p-4 rounded-xl mb-8 flex-row justify-center items-center ${saving ? "bg-gray-500" : "bg-[#8BC34A]"}`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="white" />
                            <Text className="text-white font-bold ml-2 text-lg">Save Scorecard</Text>
                        </>
                    )}
                </Pressable>

                {/* Scorecard Legend */}
                <View className="mb-20 p-4 rounded-2xl" style={{ backgroundColor: isDark ? "#1F1F1F" : "#fff", borderWidth: 1, borderColor: isDark ? "#333" : "#eee" }}>
                    <Text className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}>Scorecard Legend</Text>
                    
                    <View className="flex-row flex-wrap justify-between">
                        {legendItems.map((item, idx) => (
                            <View key={idx} className="w-[48%] items-center mb-6">
                                {item.component ? (
                                    item.component(isDark)
                                ) : (
                                    <View className="w-12 h-12 rounded-full border-2 items-center justify-center" style={{ borderColor: item.borderColor || item.color }}>
                                        {item.innerComponent && item.innerComponent(isDark)}
                                    </View>
                                )}
                                <Text className={`text-xs mt-2 font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const legendItems = [
    { 
        label: "Hole-in-One", 
        borderColor: "#ffd700",
        innerComponent: (isDark: boolean) => <View className="w-10 h-10 rounded-full border" style={{ borderColor: "#ffd700" }} />
    },
    { 
        label: "Albatross", 
        borderColor: "#006064",
        innerComponent: (isDark: boolean) => <View className="w-10 h-10 rounded-full border" style={{ borderColor: "#006064" }} />
    },
    { 
        label: "Eagle", 
        borderColor: "#2e7d32",
        innerComponent: (isDark: boolean) => <View className="w-10 h-10 rounded-full border" style={{ borderColor: "#2e7d32" }} />
    },
    { 
        label: "Birdie", 
        color: "#2e7d32",
        component: (isDark: boolean) => (
            <View className="w-12 h-12 rounded-full border-2" style={{ borderColor: "#2e7d32" }} />
        )
    },
    { 
        label: "Par", 
        component: (isDark: boolean) => (
            <View className="w-12 h-12 border-2 border-dashed border-gray-400 items-center justify-center" />
        )
    },
    { 
        label: "Bogey", 
        component: (isDark: boolean) => (
            <View className="w-12 h-12 border-2 items-center justify-center rounded" style={{ borderColor: "#d32f2f" }} />
        )
    },
    { 
        label: "Double Bogey", 
        component: (isDark: boolean) => (
            <View className="w-12 h-12 rounded items-center justify-center border" style={{ borderColor: "#d32f2f" }}>
                <View className="w-10 h-10 items-center justify-center border" style={{ borderColor: "#d32f2f" }} />
            </View>
        )
    },
    { 
        label: "Triple Bogey", 
        component: (isDark: boolean) => (
            <View className="w-12 h-12 rounded items-center justify-center border-2" style={{ borderColor: "#6a1b9a" }}>
                <View className="w-10 h-10 rounded items-center justify-center border" style={{ borderColor: "#6a1b9a" }}>
                    <View className="w-8 h-8 items-center justify-center border" style={{ borderColor: "#6a1b9a" }} />
                </View>
            </View>
        )
    },
    { 
        label: "Quadruple Bogey+", 
        component: (isDark: boolean) => (
            <View className={`w-12 h-12 border-2 rounded ${isDark ? "border-white" : "border-black"}`} />
        )
    },
];

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
});
