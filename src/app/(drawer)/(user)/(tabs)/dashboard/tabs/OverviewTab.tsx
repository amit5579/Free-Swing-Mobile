import { Avatar, AvatarFallbackText } from "@/components/avatar";
import { Badge, BadgeText } from "@/components/badge";
import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { Divider } from "@/components/divider";
import { HStack } from "@/components/hstack";
import { Text } from "@/components/text";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

type OverviewTabProps = {
    cards: Scorecard[];
    handleLike: (id: string) => void;
};

export function OverviewTab({ cards, handleLike }: OverviewTabProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: isDark ? "#161618" : "#f2f2f2",
            }}
        >
            <VStack space="md">
                {/* Header */}
                <HStack className="justify-between items-center">
                    <HStack space="sm" className="items-center">
                        <Text
                            className="text-xl font-bold"
                            style={{ color: isDark ? "#fff" : "#000" }}
                        >
                            Game Feed
                        </Text>
                        <HStack
                            className="items-center px-3 py-1 rounded-full space-x-2"
                            style={{
                                backgroundColor: isDark ? "transparent" : "#D1FAE5",
                                borderWidth: isDark ? 1 : 0,
                                borderColor: isDark ? "#fff" : "transparent",
                            }}
                        >
                            {/* Logo Icon */}
                            <Ionicons
                                name="pulse"
                                size={16}
                                color={isDark ? "#fff" : "#22C55E"}
                                style={{ marginRight: 4 }}
                            />

                            {/* Status text */}
                            <Text
                                className="text-xs font-semibold"
                                style={{ color: isDark ? "#fff" : "#15803D" }}
                            >
                                Live
                            </Text>
                        </HStack>
                    </HStack>
                </HStack>

                {/* Empty state */}
                {cards.length === 0 && (
                    <Box className="bg-background-0 rounded-2xl border border-outline-200 py-12 items-center">
                        <Text className="text-4xl">⛳</Text>
                        <Text className="text-typography-400 font-semibold text-sm mt-3">
                            No scorecards yet
                        </Text>
                    </Box>
                )}

                {/* Cards */}
                {cards.map((card: any, index: number) => (
                    <Box
                        key={card.roundRefId ?? `card-${index}`}
                        className="rounded-3xl border overflow-hidden mb-4 shadow-sm"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 10,
                            elevation: 2,
                            backgroundColor: isDark ? "#161618" : "#fff",
                            borderColor: isDark ? "#8bc34a" : "#F3F3F3",
                        }}
                    >
                        {/* Header row */}
                        <HStack className="px-4 pt-4 pb-3 justify-between items-start">
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
                                    >
                                        {card.playerName}
                                    </Text>
                                    <HStack space="xs" className="items-center flex-wrap mt-0.5">
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
                                        <Text
                                            className="text-xs"
                                            style={{ color: isDark ? "#666" : "#d1d5db" }}
                                        >
                                            •
                                        </Text>
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
                                        <Box
                                            className="rounded px-1.5 py-0.5"
                                            style={{ backgroundColor: isDark ? "#333" : "#DBEAFE" }}
                                        >
                                            <Text
                                                className="text-[10px] font-bold"
                                                style={{ color: isDark ? "#fff" : "#1E3A8A" }}
                                            >
                                                {card.teeBoxName}
                                            </Text>
                                        </Box>
                                    </HStack>
                                </VStack>
                            </HStack>

                            <HStack space="xs" className="items-center">
                                {card.isTournament && (
                                    <Badge
                                        size="sm"
                                        className="rounded-full px-3 py-1"
                                        style={{ backgroundColor: isDark ? "#F59E0B" : "#FBBF24" }}
                                    >
                                        <BadgeText
                                            className="text-white font-bold text-xs"
                                            style={{ color: "#fff" }}
                                        >
                                            Tournament
                                        </BadgeText>
                                    </Badge>
                                )}
                                <Badge
                                    size="sm"
                                    className="rounded-full px-3 py-1"
                                    style={{ backgroundColor: isDark ? "#374151" : "#111827" }}
                                >
                                    <BadgeText className="text-white font-semibold text-xs">
                                        {card.holes} Holes
                                    </BadgeText>
                                </Badge>
                            </HStack>
                        </HStack>

                        {/* Gross Score block */}
                        <Box
                            className="mx-4 mb-4 rounded-2xl py-8 items-center border"
                            style={{
                                borderColor: isDark ? "#8bc34a" : "#F3F3F3",
                                backgroundColor: isDark ? "#161618" : "#F9FAFB",
                            }}
                        >
                            <Text
                                className="text-6xl font-black tracking-tighter"
                                style={{ color: isDark ? "#fff" : "#111" }}
                            >
                                {card.grossScore}
                            </Text>
                            <HStack space="xs" className="items-center mt-1">
                                <Text
                                    style={{ color: diffColor(card.grossDiff) }}
                                    className="text-xl font-bold"
                                >
                                    {diffLabel(card.grossDiff)}
                                </Text>
                                <Text
                                    className="text-[10px] uppercase font-bold tracking-widest ml-1"
                                    style={{ color: isDark ? "#aaa" : "#9CA3AF" }}
                                >
                                    Gross
                                </Text>
                            </HStack>
                        </Box>

                        {/* NET / POINTS / PAR */}
                        <HStack space="sm" className="mx-4 mb-3">
                            {[
                                { label: "NET", value: card.net, green: true },
                                { label: "POINTS", value: card.points, green: true },
                                { label: "PAR", value: card.par, green: false },
                            ].map((s) => (
                                <Box
                                    key={s.label}
                                    className="flex-1 rounded-xl items-center py-3 border"
                                    style={{
                                        backgroundColor: isDark ? "#161618" : "#F9FAFB",
                                        borderColor: isDark ? "#8bc34a" : "#E5E7EB",
                                    }}
                                >
                                    <Text
                                        className="text-[10px] uppercase tracking-widest mb-1"
                                        style={{ color: isDark ? "#aaa" : "#6b7280" }}
                                    >
                                        {s.label}
                                    </Text>
                                    <Text
                                        className={`text-base font-bold`}
                                        style={{ color: s.green ? "#10B981" : isDark ? "#fff" : "#111" }}
                                    >
                                        {s.value}
                                    </Text>
                                </Box>
                            ))}
                        </HStack>

                        <Divider
                            className="bg-outline-100"
                            style={{ backgroundColor: isDark ? "#333" : "#E5E7EB" }}
                        />

                        {/* Footer */}
                        <HStack
                            className="px-4 py-4 justify-between items-center"
                            style={{ backgroundColor: isDark ? "#161618" : "#F9FAFB" }}
                        >
                            <HStack space="lg" className="items-center">
                                {/* <Pressable onPress={() => handleLike(card.id)} className="flex-row items-center">
                                    <Ionicons
                                        name="heart-outline"
                                        size={20}
                                        color={isDark ? "#fff" : "#6b7280"}
                                    />
                                    <Text
                                        className="text-sm font-semibold ml-1.5"
                                        style={{ color: isDark ? "#fff" : "#6b7280" }}
                                    >
                                        {card.likes}
                                    </Text>
                                </Pressable> */}
                                <Pressable
                                    onPressIn={() => handleLike(card.id)}
                                    android_ripple={{ color: "#ccc", borderless: true }}
                                    hitSlop={10}
                                    className="p-2 rounded-full flex-row items-center"
                                    style={{
                                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E5E7EB",
                                    }}
                                >
                                    <Ionicons
                                        name={card.isLiked ? "heart" : "heart-outline"}
                                        size={20}
                                        color={card.isLiked ? "#EF4444" : isDark ? "#fff" : "#6b7280"}
                                    />
                                    <Text
                                        className="text-sm font-semibold ml-1.5"
                                        style={{ color: isDark ? "#fff" : "#6b7280" }}
                                    >
                                        {card.likes}
                                    </Text>
                                </Pressable>
                            </HStack>

                            <HStack space="md" className="items-center">

                                <Pressable
                                    className="p-2 rounded-full flex-row items-center"
                                    style={{
                                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E5E7EB",
                                    }}
                                >
                                    <Ionicons
                                        name="people-outline"
                                        size={18}
                                        color={isDark ? "#fff" : "#6b7280"}
                                    />

                                    <Text
                                        className="ml-1.5 text-sm font-semibold"
                                        style={{ color: isDark ? "#fff" : "#6b7280" }}
                                    >
                                        Activity
                                    </Text>
                                </Pressable>
                                <Button
                                    size="sm"
                                    className="rounded-full px-6 h-10 shadow-sm"
                                    style={{ backgroundColor: "#8BC34A" }}
                                >
                                    <Ionicons name="eye-outline" size={14} color="#fff" />
                                    <ButtonText className="text-white text-xs font-bold ml-1.5">View</ButtonText>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full gap-1"
                                    style={{
                                        borderColor: isDark ? "#fff" : "#E5E7EB",
                                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB",
                                    }}
                                >
                                    <Ionicons
                                        name="shield-checkmark-outline"
                                        size={13}
                                        color={isDark ? "#fff" : "#6b7280"}
                                    />
                                    <ButtonText
                                        className="text-xs font-semibold"
                                        style={{ color: isDark ? "#fff" : "#6b7280" }}
                                    >
                                        Auth
                                    </ButtonText>
                                </Button>
                            </HStack>
                        </HStack>
                    </Box>
                ))}
            </VStack>
        </SafeAreaView>
    );
}
