import { getScorecardDetails, ScorecardHole, updateHoleScoresApi } from "@/api/dashboard";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    TouchableOpacity,
    useColorScheme,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { updateScorecardApi } from "@/api/dashboard";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { useRouter } from "expo-router";

const ScoreCard: React.FC = () => {
    const { scoreCard, handicap: paramHandicap, username, courseName } = useLocalSearchParams<{
        scoreCard: string;
        handicap: string;
        username: string;
        courseName: string;
    }>();
    const navigation = useNavigation();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const insets = useSafeAreaInsets();
    const displayHandicap = parseInt(paramHandicap || "0");

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const [holes, setHoles] = useState<ScorecardHole[]>([]);
    const [textScores, setTextScores] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStableford, setIsStableford] = useState(false);

    useEffect(() => {
        const fetchScorecard = async () => {
            try {
                setLoading(true);
                const data = await getScorecardDetails(scoreCard!);
                setHoles(data);

                const showPts = data.some(h => h.stablefordPoints !== null && h.stablefordPoints !== undefined);
                setIsStableford(showPts);

                const initialText: Record<number, string> = {};
                data.forEach(h => {
                    if (h.score != null && h.score >= 0) {
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
    }, [scoreCard]);

    const calculateStrokes = (handicap: number, strokeIndex: number) => {
        const base = Math.floor(handicap / 18);
        const remainder = handicap % 18;
        return base + (strokeIndex <= remainder ? 1 : 0);
    };

    const handleScoreChange = (holeId: number, text: string) => {
        let formattedText = text.replace(/[^0-9]/g, '');

        if (formattedText !== "") {
            const num = parseInt(formattedText, 10);
            if (num > 15) return;
            formattedText = num.toString();
        }

        setTextScores(prev => ({ ...prev, [holeId]: formattedText }));
        const score = formattedText === "" ? -1 : parseInt(formattedText, 10);

        setHoles(prev => prev.map(h => {
            if (h.holeId === holeId) {
                const strokes = calculateStrokes(displayHandicap, h.strokeIndex);
                const netScore = score > 0 ? score - strokes : null;
                const stablefordPoints = (score !== null && score > 0 && netScore !== null) ? Math.max(0, h.par - netScore + 2) : null;
                return { ...h, score: score !== null && score >= 0 ? score : null, netScore, stablefordPoints };
            }
            return h;
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = holes.map(h => ({
                ...h,
                score: (h.score !== null && h.score >= 0) ? h.score : 0
            }));
            await updateHoleScoresApi(scoreCard!, payload);
        } catch (err) {
            console.error(err);
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
                            const payload = holes.map(h => ({
                                ...h,
                                isCompleted: true,
                                score: (h.score !== null && h.score >= 0) ? h.score : 0
                            }));
                            await updateHoleScoresApi(scoreCard!, payload);
                            Alert.alert("Success", "Round finished successfully", [
                                { text: "OK", onPress: () => router.back() }
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
        arr.reduce((t, h) => t + ((h.score !== null && h.score > 0) ? (h.netScore || 0) : 0), 0);
    const sumYardage = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + (h.yardage || 0), 0);
    const sumPar = (arr: ScorecardHole[]) =>
        arr.reduce((t, h) => t + (h.par || 0), 0);
    const sumPts = (arr: ScorecardHole[]) => {
        if (!isStableford) return 0;
        return arr.reduce((t, h) => t + ((h.score !== null && h.score > 0) ? (h.stablefordPoints || 0) : 0), 0);
    };

    const front9 = holes.slice(0, 9);
    const back9 = holes.slice(9, 18);

    const renderScoreIndicator = (score: number | null, par: number, isDark: boolean, rawValue: string) => {
        if (rawValue === "" || rawValue === undefined || score === null) return null;

        if (score === 0) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
                    </View>
                </View>
            );
        }
        if (score === 1) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
                    </View>
                </View>
            );
        }

        const diff = score - par;

        if (diff === -3) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
                    </View>
                </View>
            );
        }
        if (diff === -2) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
                        <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
                    </View>
                </View>
            );
        }
        if (diff === -1) {
            // Birdie: Single Green Circle
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
                </View>
            );
        }
        if (diff === 0) {
            return null;
        }
        if (diff === 1) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
                </View>
            );
        }
        if (diff === 2) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
                        <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
                    </View>
                </View>
            );
        }
        if (diff === 3) {
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
        if (diff >= 4) {
            return (
                <View style={styles.indicatorContainer}>
                    <View style={[styles.singleSquare, { borderColor: isDark ? "#fff" : "#000" }]} />
                </View>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)", paddingTop: insets.top }}>
                <Watermark />
                <ScrollView className="px-4 py-4 mt-0" showsVerticalScrollIndicator={false}>
                    <View className="flex-row items-center mb-6 mt-4">
                        <Skeleton isDark={isDark} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                        <View className="flex-1">
                            <Skeleton isDark={isDark} width={180} height={24} style={{ marginBottom: 6 }} borderRadius={6} />
                            <Skeleton isDark={isDark} width={100} height={16} borderRadius={4} />
                        </View>
                    </View>

                    {/* Info Banner Skeleton */}
                    <Skeleton isDark={isDark} width="100%" height={56} borderRadius={12} style={{ marginBottom: 20 }} />

                    {/* Table Header Skeleton - Match 6 columns */}
                    <View className={`flex-row p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}>
                        {["Hole", "Stroke\nIndex", "Yards", "Par", "Score", "Net"].map((_, i) => (
                            <View key={i} className="flex-1 items-center">
                                <Skeleton isDark={isDark} width={28} height={12} borderRadius={4} />
                            </View>
                        ))}
                        {isStableford && (
                            <View className="flex-1 items-center">
                                <Skeleton isDark={isDark} width={28} height={12} borderRadius={4} />
                            </View>
                        )}
                    </View>

                    {/* Table Rows Skeleton */}
                    <View className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`} style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                        {[...Array(18)].map((_, i) => (
                            <View key={i} className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={24} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={16} height={16} borderRadius={4} /></View>
                                <View className="flex-1 items-center">
                                    <Skeleton isDark={isDark} width={46} height={36} borderRadius={8} />
                                </View>
                                <View className="flex-1 items-center"><Skeleton isDark={isDark} width={20} height={16} borderRadius={4} /></View>
                                {isStableford && <View className="flex-1 items-center"><Skeleton isDark={isDark} width={20} height={16} borderRadius={4} /></View>}
                            </View>
                        ))}
                    </View>

                    <View className="mt-6 mb-12">
                        <Skeleton isDark={isDark} width="100%" height={48} borderRadius={12} />
                    </View>
                </ScrollView>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.7)" }}>
                <Watermark />
                <Text style={{ color: "red" }}>{error}</Text>
                <Pressable onPress={() => router.back()} className="mt-4 p-4 bg-[#8BC34A] rounded-full">
                    <Text className="text-white font-bold">Go Back</Text>
                </Pressable>
            </ThemedView>
        );
    }
    return (
        <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#F9FAFB" }}>
            <Watermark />

            <View className="px-4 pb-2 z-10 w-full" style={{ backgroundColor: isDark ? "#161618" : "#FFFFFF", paddingTop: Math.max(insets.top, 16) }}>
                <View className="flex-row items-center mb-4 mt-0">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
                                {courseName ? courseName : "Scorecard"}
                                {isStableford && (
                                    <Text style={{ fontWeight: "400", fontSize: 13, opacity: 0.8 }}> (Stableford)</Text>
                                )}
                            </Text>
                            <View className="flex-row items-center px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#E8F5E9", borderWidth: 1, borderColor: "#8BC34A" }}>
                                <Ionicons name="person-outline" size={12} color="#8BC34A" />
                                <Text className="text-xs font-bold ml-1" style={{ color: "#8BC34A" }}>
                                    Handicap: {displayHandicap}
                                </Text>
                            </View>
                        </View>
                        {username && (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="person-outline" size={12} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                <Text className={`text-xs ml-1 font-bold ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                                    {username}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>


            </View>

            <ScrollView
                className="px-4 flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                <View className="z-10 shadow-sm" style={{ backgroundColor: isDark ? "#161618" : "#FFFFFF" }}>
                    <View
                        className={`flex-row items-center p-3 rounded-t-xl ${isDark ? "bg-[#262626]" : "bg-gray-200"}`}
                        style={{ borderBottomWidth: 1, borderBottomColor: isDark ? "#444" : "#ddd" }}
                    >
                        {["Hole", "Stroke\nIndex", "Yards", "Par", "Score", "Net", ...(isStableford ? ["Pts"] : [])].map((h) => (
                            <Text key={h} className={`flex-1 text-center font-bold text-xs ${isDark ? "text-white" : "text-black"}`} style={{ textAlignVertical: 'center' }}>
                                {h}
                            </Text>
                        ))}
                    </View>
                </View>

                <View
                    className={`${isDark ? "bg-[#1f1f1f]" : "bg-white"} rounded-b-xl overflow-hidden`}
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                >
                    {front9.map((h, index) => (
                        <View
                            key={h.holeId}
                            className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
                        >
                            <Text className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}>{h.holeNumber}</Text>
                            <Text className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.strokeIndex}</Text>
                            <Text className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.yardage}</Text>
                            <Text className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}>{h.par}</Text>
                            <View className="flex-1 items-center justify-center relative">
                                {renderScoreIndicator(h.score ?? null, h.par, isDark, textScores[h.holeId] || "")}
                                <TextInput
                                    style={{
                                        width: 50,
                                        height: 36,
                                        backgroundColor: "transparent",
                                        borderColor: "transparent",
                                        borderWidth: 0,
                                        color: isDark ? "#fff" : "#000",
                                        textAlign: "center",
                                        borderRadius: 8,
                                        paddingVertical: 0,
                                        paddingHorizontal: 0,
                                        zIndex: 10,
                                        fontWeight: "bold",
                                        fontSize: 14,
                                    }}
                                    editable={false}
                                    value={textScores[h.holeId] || ""}
                                    placeholder="-"
                                    placeholderTextColor={isDark ? "#666" : "#999"}
                                />
                            </View>
                            <Text className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>
                                {(textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined && parseInt(textScores[h.holeId]) >= 0) ? h.netScore : "-"}
                            </Text>
                            {isStableford && (
                                <Text className={`flex-1 text-center font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                                    {(textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined && parseInt(textScores[h.holeId]) >= 0) ? (h.stablefordPoints || 0) : "-"}
                                </Text>
                            )}
                        </View>
                    ))}

                    <View
                        className={`flex-row p-3 ${isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
                        style={{ backgroundColor: isDark ? "rgba(139,195,74,0.12)" : "rgba(139,195,74,0.08)" }}
                    >
                        <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>Front 9</Text>
                        <Text className="flex-1" />
                        <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sumYardage(front9)}</Text>
                        <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sumPar(front9)}</Text>
                        <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-white" : "text-black"}`}>{sumScores(front9)}</Text>
                        <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>{sumNet(front9)}</Text>
                        {isStableford && <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}>{sumPts(front9)}</Text>}
                    </View>

                    {back9.length > 0 && back9.map((h, index) => (
                        <View
                            key={h.holeId}
                            className={`flex-row items-center p-3 ${isDark ? "border-b border-[#333]" : "border-b border-gray-100"}`}
                        >
                            <Text className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}>{h.holeNumber}</Text>
                            <Text className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.strokeIndex}</Text>
                            <Text className={`flex-1 text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h.yardage}</Text>
                            <Text className={`flex-1 text-center ${isDark ? "text-white" : "text-black"}`}>{h.par}</Text>
                            <View className="flex-1 items-center justify-center relative">
                                {renderScoreIndicator(h.score ?? null, h.par, isDark, textScores[h.holeId] || "")}
                                <TextInput
                                    style={{
                                        width: 50,
                                        height: 36,
                                        backgroundColor: "transparent",
                                        borderColor: "transparent",
                                        borderWidth: 0,
                                        color: isDark ? "#fff" : "#000",
                                        textAlign: "center",
                                        borderRadius: 8,
                                        paddingVertical: 0,
                                        paddingHorizontal: 0,
                                        zIndex: 10,
                                        fontWeight: "bold",
                                        fontSize: 14,
                                    }}
                                    editable={false}
                                    value={textScores[h.holeId] || ""}
                                    placeholder="-"
                                    placeholderTextColor={isDark ? "#666" : "#999"}
                                />
                            </View>
                            <Text className={`flex-1 text-center font-bold ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>
                                {(textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined && parseInt(textScores[h.holeId]) >= 0) ? h.netScore : "-"}
                            </Text>
                            {isStableford && (
                                <Text className={`flex-1 text-center font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                                    {(textScores[h.holeId] !== "" && textScores[h.holeId] !== undefined && parseInt(textScores[h.holeId]) >= 0) ? (h.stablefordPoints || 0) : "-"}
                                </Text>
                            )}
                        </View>
                    ))}

                    {back9.length > 0 && (
                        <View
                            className={`flex-row p-3 ${isDark ? "border-b border-[#444]" : "border-b border-gray-200"}`}
                            style={{ backgroundColor: isDark ? "rgba(139,195,74,0.12)" : "rgba(139,195,74,0.08)" }}
                        >
                            <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>Back 9</Text>
                            <Text className="flex-1" />
                            <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sumYardage(back9)}</Text>
                            <Text className={`flex-1 text-center text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sumPar(back9)}</Text>
                            <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-white" : "text-black"}`}>{sumScores(back9)}</Text>
                            <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-[#8BC34A]" : "text-green-700"}`}>{sumNet(back9)}</Text>
                            {isStableford && <Text className={`flex-1 text-center font-black text-xs ${isDark ? "text-orange-400" : "text-orange-600"}`}>{sumPts(back9)}</Text>}
                        </View>
                    )}

                    <View className="flex-row p-3 items-center" style={{ backgroundColor: "#8BC34A" }}>
                        <Text className="flex-1 text-center font-black text-l text-white">Grand Total</Text>
                        <Text className="flex-1" />
                        <Text className="flex-1 text-center font-bold text-l text-white">{sumYardage(holes)}</Text>
                        <Text className="flex-1 text-center font-bold text-l text-white">{sumPar(holes)}</Text>
                        <Text className="flex-1 text-center font-black text-l text-white">{sumScores(holes)}</Text>
                        <Text className="flex-1 text-center font-black text-l text-white">{sumNet(holes)}</Text>
                        {isStableford && <Text className="flex-1 text-center font-black text-l text-white">{sumPts(holes)}</Text>}
                    </View>
                </View>
                {(() => {
                    const scoreCounts: Record<string, number> = {
                        holeInOne: 0,
                        albatross: 0,
                        eagle: 0,
                        birdie: 0,
                        par: 0,
                        bogey: 0,
                        doubleBogey: 0,
                        tripleBogey: 0,
                        quadBogey: 0,
                    };

                    holes.forEach((h) => {
                        const s = h.score;
                        if (s == null || s < 0 || textScores[h.holeId] === "" || textScores[h.holeId] === undefined) return;

                        if (s === 1) scoreCounts.holeInOne++;
                        else if (s === 0) scoreCounts.albatross++;
                        else {
                            const diff = s - h.par;
                            if (diff === -3) scoreCounts.albatross++;
                            else if (diff === -2) scoreCounts.eagle++;
                            else if (diff === -1) scoreCounts.birdie++;
                            else if (diff === 0) scoreCounts.par++;
                            else if (diff === 1) scoreCounts.bogey++;
                            else if (diff === 2) scoreCounts.doubleBogey++;
                            else if (diff === 3) scoreCounts.tripleBogey++;
                            else if (diff >= 4) scoreCounts.quadBogey++;
                        }
                    });

                    const InnerCount = ({ count, color, small = false }: { count: number; color: string; small?: boolean }) =>
                        count > 0 ? (
                            <Text style={{ color, fontSize: small ? 9 : 13, fontWeight: "900", textAlign: "center", lineHeight: small ? 11 : 15 }}>
                                {count}
                            </Text>
                        ) : null;

                    const dynamicLegend = [
                        {
                            label: "Hole-in-One",
                            count: scoreCounts.holeInOne,
                            render: (count: number) => (
                                <View style={[styles.doubleCircle, { borderColor: "#ffd700", width: 48, height: 48, borderRadius: 24 }]}>
                                    <View style={[styles.innerCircle, { borderColor: "#ffd700", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#ffd700" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            label: "Albatross",
                            count: scoreCounts.albatross,
                            render: (count: number) => (
                                <View style={[styles.doubleCircle, { borderColor: "#006064", width: 48, height: 48, borderRadius: 24 }]}>
                                    <View style={[styles.innerCircle, { borderColor: "#006064", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#006064" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            label: "Eagle",
                            count: scoreCounts.eagle,
                            render: (count: number) => (
                                <View style={[styles.doubleCircle, { borderColor: "#2e7d32", width: 48, height: 48, borderRadius: 24 }]}>
                                    <View style={[styles.innerCircle, { borderColor: "#2e7d32", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#2e7d32" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            label: "Birdie",
                            count: scoreCounts.birdie,
                            render: (count: number) => (
                                <View style={[styles.singleCircle, { borderColor: "#2e7d32", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" }]}>
                                    <InnerCount count={count} color="#2e7d32" />
                                </View>
                            ),
                        },
                        {
                            label: "Par",
                            count: scoreCounts.par,
                            render: (count: number) => (
                                <View style={{ width: 48, height: 48, borderWidth: 2, borderStyle: "dashed", borderColor: "#9CA3AF", justifyContent: "center", alignItems: "center" }}>
                                    <InnerCount count={count} color="#6B7280" />
                                </View>
                            ),
                        },
                        {
                            label: "Bogey",
                            count: scoreCounts.bogey,
                            render: (count: number) => (
                                <View style={[styles.singleSquare, { borderColor: "#d32f2f", width: 48, height: 48, justifyContent: "center", alignItems: "center" }]}>
                                    <InnerCount count={count} color="#d32f2f" />
                                </View>
                            ),
                        },
                        {
                            label: "Double Bogey",
                            count: scoreCounts.doubleBogey,
                            render: (count: number) => (
                                <View style={[styles.doubleSquare, { borderColor: "#d32f2f", width: 48, height: 48 }]}>
                                    <View style={[styles.innerSquare, { borderColor: "#d32f2f", width: 34, height: 34, justifyContent: "center", alignItems: "center" }]}>
                                        <InnerCount count={count} color="#d32f2f" />
                                    </View>
                                </View>
                            ),
                        },
                        {
                            label: "Triple Bogey",
                            count: scoreCounts.tripleBogey,
                            render: (count: number) => (
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
                            label: "Quad Bogey+",
                            count: scoreCounts.quadBogey,
                            render: (count: number) => (
                                <View style={[styles.singleSquare, { borderColor: isDark ? "#fff" : "#000", width: 48, height: 48, justifyContent: "center", alignItems: "center" }]}>
                                    <InnerCount count={count} color={isDark ? "#fff" : "#000"} />
                                </View>
                            ),
                        },
                    ];

                    const rows: (typeof dynamicLegend)[] = [];
                    for (let i = 0; i < dynamicLegend.length; i += 3) {
                        rows.push(dynamicLegend.slice(i, i + 3));
                    }

                    return (
                        <View
                            className="mb-20 p-4 rounded-2xl"
                            style={{
                                backgroundColor: isDark ? "rgba(31,31,31,0.6)" : "rgba(255,255,255,0.6)",
                                borderWidth: 1,
                                borderColor: isDark ? "rgba(51,51,51,0.6)" : "rgba(238,238,238,0.6)",
                            }}
                        >
                            <Text className={`font-bold mb-6 text-center text-lg ${isDark ? "text-white" : "text-black"}`}>
                                Scorecard Legend
                            </Text>
                            {rows.map((row, rowIdx) => (
                                <View key={rowIdx} style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
                                    {row.map((item, idx) => {
                                        return (
                                            <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                                                {item.render(item.count)}
                                                <Text style={{ fontSize: 11, marginTop: 6, fontWeight: "500", color: isDark ? "#D1D5DB" : "#4B5563", textAlign: "center" }}>
                                                    {item.label}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    );
                })()}
            </ScrollView>
        </ThemedView>
    );
};

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

export default ScoreCard;
