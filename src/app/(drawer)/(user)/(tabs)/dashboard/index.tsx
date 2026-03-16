import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
// import { Text } from "@/components/themed-";
import { VStack } from "@/components/vstack";
import { Spacing } from '@/constants/theme';
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useColorScheme, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoryTab, type GameHistory } from "./tabs/HistoryTab";
import { InProgressTab, type InProgressGame } from "./tabs/InProgressTab";
import { OverviewTab, type Scorecard } from "./tabs/OverviewTab";
import { ThemedView } from "@/components/themed-view";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 3 * CARD_MARGIN - 32) / 2; // two cards per row + padding

// Hardcoded data
const HARDCODED_CARDS: Scorecard[] = [
  { id: "1", playerName: "Kunal", date: "Mar 11, 2026", course: "Bangalore Golf Club", tee: "Red", holes: 18, grossScore: 62, grossDiff: -8, net: 62, points: 64, par: 70, likes: 0, isTournament: false },
  { id: "2", playerName: "x1", date: "Mar 10, 2026", course: "w12", tee: "BLUE", holes: 18, grossScore: 86, grossDiff: 16, net: 78, points: 30, par: 70, likes: 0, isTournament: true },
];

export default function DashboardScreen() {
  const [cards, setCards] = useState<Scorecard[]>(HARDCODED_CARDS);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const tabs = [
    { key: "overview", label: "Overview", icon: "grid-outline" },
    { key: "progress", label: "In Progress", icon: "hourglass-outline" },
    { key: "history", label: "Game History", icon: "time-outline" },
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLike = (id: string) =>
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    );

  return (
    <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {loading ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <>
            <VStack className="mb-4">
              <Text className="text-3xl font-bold text-gray-900">

                Welcome back, Kunal!
              </Text>
              <Text className="text-lg font-medium text-gray-700">
                Track your progress and manage your games
              </Text>
            </VStack>

            {/* Tabs */}
            <HStack className="rounded-full p-1 mb-4 justify-between bg-gray-200">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full flex-row items-center justify-center`}
                    style={active ? { backgroundColor: '#8BC34A' } : {}}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={16}
                      color={active ? '#fff' : '#6b7280'}
                      className="mr-1"
                    />
                    <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600'}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>

            {/* Overview Cards */}
            {activeTab === "overview" && (
              <VStack className="mt-0 space-y-4">

                {/* Row 1 */}
                <HStack className="space-x-3 mb-3">
                  {/* Card 1 */}
                  <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 relative min-h-[140px] mr-2">
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="location" size={22} color="#FBBF24" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text className="text-3xl font-bold text-gray-900">3</Text>
                      <Text className="text-sm font-bold text-gray-900">COURSES PLAYED</Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Unique</Text>
                      </Badge>
                    </VStack>
                  </Box>

                  {/* Card 2 */}
                  <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 relative min-h-[140px] ml-2">
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="stats-chart-outline" size={22} color="#06B6D4" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text className="text-3xl font-bold text-gray-900">72.3</Text>
                      <Text className="text-sm font-bold text-gray-900">AVG SCORE</Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Per 18 Holes</Text>
                      </Badge>
                    </VStack>
                  </Box>
                </HStack>

                {/* Row 2 */}
                <HStack className="space-x-3 mb-3">
                  {/* Card 3 */}
                  <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 relative min-h-[140px] mr-2">
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="star" size={22} color="#FBBF24" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text className="text-3xl font-bold text-gray-900">40</Text>
                      <Text className="text-sm font-bold text-gray-900">BEST SCORE</Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Personal Best</Text>
                      </Badge>
                    </VStack>
                  </Box>

                  {/* Card 4 */}
                  <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 relative min-h-[140px] ml-2">
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="flag" size={22} color="#EF4444" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text className="text-3xl font-bold text-gray-900">15</Text>
                      <Text className="text-sm font-bold text-gray-900">HANDICAP INDEX</Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Portable Index</Text>
                      </Badge>
                    </VStack>
                  </Box>
                </HStack>

                {/* Home Course */}
                <Box className="bg-white rounded-xl border border-gray-200 p-5 relative min-h-[140px]">
                  <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                    <Ionicons name="home" size={22} color="#8BC34A" />
                  </Box>

                  <VStack className="space-y-2">
                    <Text className="text-3xl font-bold text-gray-900">0</Text>
                    <Text className="text-sm font-bold text-gray-900">HOME COURSE HANDICAP</Text>
                    <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                      <Text className="text-[10px] font-semibold text-green-800">No Home Course</Text>
                    </Badge>
                  </VStack>
                </Box>

              </VStack>
            )}

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab cards={cards} handleLike={handleLike} />}
            {activeTab === "progress" && <InProgressTab games={[]} onDelete={() => { }} onResume={() => { }} />}
            {activeTab === "history" && <HistoryTab games={[]} onViewGame={() => { }} />}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 120,
    justifyContent: "space-between",
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  cardLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  cardIcon: {
    backgroundColor: "#e0f2fe",
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 12,
  },
});