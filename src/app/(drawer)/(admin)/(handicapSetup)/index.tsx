// import React, { useState, useCallback } from "react";
// import { Pressable, useColorScheme, TextInput, RefreshControl } from "react-native";
// import { ScrollView } from "react-native-gesture-handler";

// import { SafeAreaView } from "react-native-safe-area-context";
// import { router } from "expo-router";
// import { ActivityIndicator, View } from "react-native";

// import { VStack } from "@/components/vstack";
// import { HStack } from "@/components/hstack";
// import { Box } from "@/components/box";
// import { Divider } from "@/components/divider";
// import { Avatar, AvatarImage } from "@/components/avatar";
// import { ThemedText } from "@/components/themed-text";
// import Watermark from "@/components/watermark";
// import { Ionicons } from "@expo/vector-icons";
// import { getUsers, User } from "@/api/admin/handicapSetup";
// import { Skeleton } from "@/components/Skeleton";
// import { useFocusEffect } from "expo-router";


// export default function PlayerHandicapSetup() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === "dark";

//   const [players, setPlayers] = useState<User[]>([]);
//   const [filteredPlayers, setFilteredPlayers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
//   const [searchQuery, setSearchQuery] = useState("");

//   const fetchPlayers = async (isRefreshing = false) => {
//     try {
//       if (!isRefreshing) setLoading(true);
//       const data = await getUsers();
//       setPlayers(data);

//       if (searchQuery.trim() === "") {
//         setFilteredPlayers(data);
//       } else {
//         const filtered = data.filter((p) =>
//           p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           p.email.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//         setFilteredPlayers(filtered);
//       }

//       // Auto-expand only the first card if nothing was expanded yet
//       if (Object.keys(expanded).length === 0) {
//         const initialExpanded = data.reduce((acc, player, index) => {
//           acc[player.id.toString()] = index === 0;
//           return acc;
//         }, {} as { [key: string]: boolean });
//         setExpanded(initialExpanded);
//       }
//     } catch (error) {
//       console.error("Fetch players error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (query: string) => {
//     setSearchQuery(query);
//     if (query.trim() === "") {
//       setFilteredPlayers(players);
//     } else {
//       const filtered = players.filter((p) =>
//         p.username.toLowerCase().includes(query.toLowerCase()) ||
//         p.email.toLowerCase().includes(query.toLowerCase())
//       );
//       setFilteredPlayers(filtered);
//     }
//   };

//   // ✅ REFRESH ON FOCUS
//   useFocusEffect(
//     useCallback(() => {
//       fetchPlayers();
//     }, [])
//   );

//   const togglePlayer = (id: number | string) => {
//     setExpanded((prev) => ({
//       ...prev,
//       [id.toString()]: !prev[id.toString()],
//     }));
//   };

//   return (
//     <SafeAreaView
//       style={{
//         flex: 1,
//       }}
//     >
//       <Watermark />

//       <VStack className="flex-1 p-4">

//         {/* HEADER (FIXED) */}
//         <HStack className="items-center justify-between mb-4">
//           <HStack className="items-center">
//             <Pressable
//               onPress={() => router.back()}
//               style={{
//                 padding: 8,
//                 borderRadius: 12,
//                 backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
//               }}
//             >
//               <Ionicons
//                 name="arrow-back"
//                 size={22}
//                 color={isDark ? "#fff" : "#020617"}
//               />
//             </Pressable>

//             <ThemedText
//               style={{
//                 fontSize: 24,
//                 fontWeight: "900",
//                 marginLeft: 10,
//                 color: isDark ? "#fff" : "#1e293b",
//               }}
//             >
//               Handicap Setup
//             </ThemedText>
//           </HStack>

//           <Box
//             style={{
//               flexDirection: "row",
//               alignItems: "center",
//               paddingHorizontal: 12,
//               paddingVertical: 6,
//               borderRadius: 12,
//               // backgroundColor: "rgba(139,195,74,0.15)",
//             }}
//           >
//             <Ionicons name="people-outline" size={16} color="#8bc34a" />

//             <ThemedText
//               style={{
//                 color: isDark ? "#fff" : "#065f46",
//                 fontWeight: "800",
//                 marginLeft: 4,
//                 fontSize: 12,
//               }}
//             >
//               {players.length} live
//             </ThemedText>
//           </Box>
//         </HStack>

//         {/* SEARCH BAR */}
//         <Box
//           style={{
//             marginBottom: 20,
//             backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
//             borderRadius: 16,
//             paddingHorizontal: 16,
//             paddingVertical: 4,
//             borderWidth: 1,
//             borderColor: isDark ? "#333" : "#e2e8f0",
//           }}
//         >
//           <HStack className="items-center">
//             <Ionicons
//               name="search"
//               size={20}
//               color={isDark ? "#8bc34a" : "#64748b"}
//             />
//             <TextInput
//               placeholder="Search players..."
//               value={searchQuery}
//               onChangeText={handleSearch}
//               placeholderTextColor={isDark ? "#666" : "#94a3b8"}
//               style={{
//                 flex: 1,
//                 height: 44,
//                 color: isDark ? "#fff" : "#1e293b",
//                 fontSize: 16,
//                 paddingHorizontal: 12,
//               }}
//             />
//             {searchQuery.length > 0 && (
//               <Pressable onPress={() => handleSearch("")}>
//                 <Ionicons name="close-circle" size={20} color="#94a3b8" />
//               </Pressable>
//             )}
//           </HStack>
//         </Box>

//         {/* SCROLLABLE CONTENT */}
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={loading && players.length > 0}
//               onRefresh={() => fetchPlayers(true)}
//               tintColor="#8bc34a"
//               colors={["#8bc34a"]}
//             />
//           }
//         >
//           {loading ? (
//             <VStack space="md" className="pb-20">
//               {[1, 2, 3, 4, 5, 6].map((i) => (
//                 <HandicapSkeleton key={i} isExpanded={i === 1} />
//               ))}
//             </VStack>
//           ) : (

//             <VStack space="md" className="pb-20">
//               {filteredPlayers.map((player) => (
//                 <Box
//                   key={player.id}
//                   className="p-4 rounded-2xl mb-3"
//                   style={{
//                     backgroundColor: isDark
//                       ? "rgba(26,26,26,0.85)"
//                       : "rgba(255,255,255,0.85)",
//                     borderRadius: 20,
//                     borderLeftWidth: 6,
//                     borderLeftColor: "#8BC34A",
//                     padding: 16,
//                     shadowColor: "#000",
//                     shadowOffset: { width: 0, height: 4 },
//                     shadowOpacity: isDark ? 0.3 : 0.08,
//                     shadowRadius: 10,
//                     elevation: 4,
//                   }}
//                 >
//                   {/* PLAYER HEADER */}
//                   <Pressable onPress={() => togglePlayer(player.id)}>
//                     <HStack className="items-center justify-between">

//                       <HStack className="items-center">

//                         {/* AVATAR LETTER */}
//                         <Avatar
//                           size="md"
//                           style={{
//                             borderWidth: 2,
//                             borderColor: "#8bc34a",
//                             marginRight: 10,
//                             alignItems: "center",
//                             justifyContent: "center",
//                             backgroundColor: "rgba(139,195,74,0.15)",
//                           }}
//                         >
//                           {player.profilePictureUrl ? (
//                             <AvatarImage source={{ uri: player.profilePictureUrl }} />
//                           ) : (
//                             <ThemedText
//                               style={{
//                                 fontWeight: "700",
//                                 fontSize: 16,
//                                 color: "#8bc34a",
//                               }}
//                             >
//                               {player.username?.charAt(0).toUpperCase() || "?"}
//                             </ThemedText>
//                           )}
//                         </Avatar>

//                         <ThemedText style={{ fontWeight: "700", fontSize: 16 }}>
//                           {player.username}
//                         </ThemedText>

//                       </HStack>

//                       <Ionicons
//                         name={
//                           expanded[player.id.toString()]
//                             ? "chevron-up"
//                             : "chevron-down"
//                         }
//                         size={20}
//                         color={isDark ? "#8BC34A" : "#666"}
//                         style={{ marginLeft: 8 }}
//                       />

//                     </HStack>
//                   </Pressable>

//                   {/* DETAILS */}
//                   {expanded[player.id.toString()] && (
//                     <VStack className="px-4 pb-4">
//                       <Divider style={{ marginBottom: 16, backgroundColor: isDark ? "#333" : "#F0F0F0" }} />

//                       <VStack space="md">
//                         {/* EMAIL ROW */}
//                         <HStack className="items-center justify-between">
//                           <HStack className="items-center">
//                             <Ionicons name="mail" size={16} color="#8bc34a" />
//                             <ThemedText style={{ marginLeft: 10 }}>Email</ThemedText>
//                           </HStack>
//                           <ThemedText style={{ opacity: 0.6 }}>{player.email}</ThemedText>
//                         </HStack>

//                         {/* HANDICAP ROW */}
//                         <HStack className="items-center justify-between py-1">
//                           <HStack className="items-center">
//                             <Ionicons name="trophy" size={16} color="#8bc34a" />
//                             <ThemedText style={{ marginLeft: 10 }}>Current Handicap</ThemedText>
//                           </HStack>
//                           <ThemedText style={{ fontWeight: "800", color: "#8bc34a" }}>
//                             {player.handicap}
//                           </ThemedText>
//                         </HStack>

//                         {/* CALCULATED HANDICAP ROW */}
//                         <HStack className="items-center justify-between py-1">
//                           <HStack className="items-center">
//                             <Ionicons name="calculator" size={16} color="#8bc34a" />
//                             <ThemedText style={{ marginLeft: 10 }}>Calculated Handicap</ThemedText>
//                           </HStack>
//                           <ThemedText style={{ fontWeight: "800" }}>{player.calculatedHandicap}</ThemedText>
//                         </HStack>

//                         {/* HANDICAP INDEX ROW */}
//                         {/* <HStack className="items-center justify-between py-1">
//                           <HStack className="items-center">
//                             <Ionicons name="ribbon" size={16} color="#8bc34a" />
//                             <ThemedText style={{ marginLeft: 10 }}>Handicap Index</ThemedText>
//                           </HStack>
//                           <ThemedText style={{ fontWeight: "800" }}>{player.handicapIndex ?? "N/A"}</ThemedText>
//                         </HStack> */}

//                         {/* AVERAGE SCORE ROW */}
//                         {/* <HStack className="items-center justify-between py-1">
//                           <HStack className="items-center">
//                             <Ionicons name="analytics" size={16} color="#8bc34a" />
//                             <ThemedText style={{ marginLeft: 10 }}>Average Score</ThemedText>
//                           </HStack>
//                           <ThemedText style={{ fontWeight: "800" }}>{player.averageScore}</ThemedText>
//                         </HStack> */}

//                         {/* STATS ROW */}
//                         {/* <HStack space="lg" className="mt-2">
//                           <VStack className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
//                             <ThemedText style={{ fontSize: 10, opacity: 0.6 }}>Total Rounds</ThemedText>
//                             <ThemedText style={{ fontWeight: "800", fontSize: 16 }}>{player.totalRounds}</ThemedText>
//                           </VStack>
//                           <VStack className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
//                             <ThemedText style={{ fontSize: 10, opacity: 0.6 }}>Courses Played</ThemedText>
//                             <ThemedText style={{ fontWeight: "800", fontSize: 16 }}>{player.coursesPlayed}</ThemedText>
//                           </VStack>
//                         </HStack> */}

//                         {/* ROLE ROW */}
//                         <HStack className="items-center justify-between py-1 mt-2">
//                           <HStack className="items-center">
//                             <Ionicons name="shield-checkmark" size={16} color="#8bc34a" />
//                             <ThemedText style={{ marginLeft: 10 }}>Role</ThemedText>
//                           </HStack>
//                           <ThemedText style={{ opacity: 0.6 }}>{player.role || "Member"}</ThemedText>
//                         </HStack>
//                       </VStack>

//                       <Divider style={{ marginVertical: 10, opacity: 0 }} />
//                     </VStack>
//                   )}
//                 </Box>
//               ))}
//             </VStack>
//           )}
//           </ScrollView>
//       </VStack>
//     </SafeAreaView>
//   );
// }

// const HandicapSkeleton = ({ isExpanded = false }: { isExpanded?: boolean }) => {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === "dark";

//   return (
//     <Box
//       className="p-4 rounded-2xl mb-3"
//       style={{
//         backgroundColor: isDark ? "rgba(26,26,26,0.85)" : "rgba(255,255,255,0.85)",
//         borderRadius: 20,
//         borderLeftWidth: 6,
//         borderLeftColor: "#8BC34A",
//         padding: 16,
//       }}
//     >
//       <HStack className="items-center justify-between">
//         <HStack className="items-center">
//           <Skeleton isDark={isDark} width={45} height={45} borderRadius={24} style={{ marginRight: 10 }} />
//           <Skeleton isDark={isDark} width={120} height={20} />
//         </HStack>
//         <Skeleton isDark={isDark} width={20} height={20} borderRadius={10} />
//       </HStack>

//       {isExpanded && (
//         <VStack style={{ marginTop: 20 }}>
//           <Box style={{ height: 1, backgroundColor: isDark ? "#333" : "#F0F0F0", marginBottom: 16 }} />
//           <VStack space="md">
//             {[1, 2, 3, 4].map(i => (
//               <HStack key={i} className="items-center justify-between">
//                 <HStack className="items-center">
//                   <Skeleton isDark={isDark} width={16} height={16} borderRadius={8} />
//                   <Skeleton isDark={isDark} width={100} height={14} style={{ marginLeft: 10 }} />
//                 </HStack>
//                 <Skeleton isDark={isDark} width={80} height={14} />
//               </HStack>
//             ))}
//           </VStack>
//         </VStack>
//       )}
//     </Box>
//   );
// };
import React, { useState, useCallback } from "react";
import {
  Pressable,
  useColorScheme,
  TextInput,
  RefreshControl,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { Avatar, AvatarImage, AvatarFallbackText } from "@/components/avatar";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { getUsers, User } from "@/api/admin/handicapSetup";

export default function PlayerHandicapSetup() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [players, setPlayers] = useState<User[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPlayers = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getUsers();
      setPlayers(data);

      if (searchQuery.trim() === "") {
        setFilteredPlayers(data);
      } else {
        const filtered = data.filter(
          (p) =>
            p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        setFilteredPlayers(filtered);
      }

      // Auto-expand only the first card if nothing was expanded yet
      if (Object.keys(expanded).length === 0) {
        const initialExpanded = data.reduce(
          (acc, player, index) => {
            acc[player.id.toString()] = index === 0;
            return acc;
          },
          {} as { [key: string]: boolean },
        );
        setExpanded(initialExpanded);
      }
    } catch (error) {
      console.error("Fetch players error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(
        (p) =>
          p.username.toLowerCase().includes(query.toLowerCase()) ||
          p.email.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredPlayers(filtered);
    }
  };

  // ✅ REFRESH ON FOCUS
  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
    }, []),
  );

  const togglePlayer = (id: number | string) => {
    setExpanded((prev) => ({
      ...prev,
      [id.toString()]: !prev[id.toString()],
    }));
  };

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <Watermark />

        <VStack className="flex-1 p-4">
          {/* HEADER (FIXED) */}
          <HStack className="items-center justify-between mb-4">
            <HStack className="items-center">
              <Pressable
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#f1f5f9",
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={isDark ? "#fff" : "#020617"}
                />
              </Pressable>

              <ThemedText
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  marginLeft: 10,
                  color: isDark ? "#fff" : "#1e293b",
                }}
              >
                Handicap Setup
              </ThemedText>
            </HStack>

            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                // backgroundColor: "rgba(139,195,74,0.15)",
              }}
            >
              <Ionicons name="people-outline" size={16} color="#8bc34a" />

              <ThemedText
                style={{
                  color: isDark ? "#fff" : "#065f46",
                  fontWeight: "800",
                  marginLeft: 4,
                  fontSize: 12,
                }}
              >
                {players.length} live
              </ThemedText>
            </Box>
          </HStack>

          {/* SEARCH BAR */}
          <Box
            style={{
              marginBottom: 20,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: isDark ? "#333" : "#e2e8f0",
            }}
          >
            <HStack className="items-center">
              <Ionicons
                name="search"
                size={20}
                color={isDark ? "#8bc34a" : "#64748b"}
              />
              <TextInput
                placeholder="Search players..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor={isDark ? "#666" : "#94a3b8"}
                style={{
                  flex: 1,
                  height: 44,
                  color: isDark ? "#fff" : "#1e293b",
                  fontSize: 16,
                  paddingHorizontal: 12,
                }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => handleSearch("")}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </Pressable>
              )}
            </HStack>
          </Box>

          {/* SCROLLABLE CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading && players.length > 0}
                onRefresh={() => fetchPlayers(true)}
                tintColor="#8bc34a"
                colors={["#8bc34a"]}
              />
            }
          >
            {loading ? (
              <VStack className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#8bc34a" />
                <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>
                  Loading Players...
                </ThemedText>
              </VStack>
            ) : (
              <VStack space="md" className="pb-20">
                {filteredPlayers.map((player) => (
                  <Box
                    key={player.id}
                    className="p-4 rounded-2xl mb-3"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(26,26,26,0.85)"
                        : "rgba(255,255,255,0.85)",
                      borderRadius: 20,
                      borderLeftWidth: 6,
                      borderLeftColor: "#8BC34A",
                      padding: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.08,
                      shadowRadius: 10,
                      elevation: 4,
                    }}
                  >
                    {/* PLAYER HEADER */}
                    <Pressable onPress={() => togglePlayer(player.id)}>
                      <HStack className="items-center justify-between">
                        <HStack className="items-center">
                          {/* AVATAR LETTER */}
                          <Avatar
                            size="md"
                            style={{
                              borderWidth: 2,
                              borderColor: "#8bc34a",
                              marginRight: 10,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(139,195,74,0.15)",
                            }}
                          >
                            {player.profilePictureUrl ? (
                              <AvatarImage
                                source={{ uri: player.profilePictureUrl }}
                              />
                            ) : (
                              <ThemedText
                                style={{
                                  fontWeight: "700",
                                  fontSize: 16,
                                  color: "#8bc34a",
                                }}
                              >
                                {player.username?.charAt(0).toUpperCase() ||
                                  "?"}
                              </ThemedText>
                            )}
                          </Avatar>

                          <ThemedText
                            style={{ fontWeight: "700", fontSize: 16 }}
                          >
                            {player.username}
                          </ThemedText>
                        </HStack>

                        <Ionicons
                          name={
                            expanded[player.id.toString()]
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={isDark ? "#8BC34A" : "#666"}
                          style={{ marginLeft: 8 }}
                        />
                      </HStack>
                    </Pressable>

                    {/* DETAILS */}
                    {expanded[player.id.toString()] && (
                      <VStack className="px-4 pb-4">
                        <Divider
                          style={{
                            marginBottom: 16,
                            backgroundColor: isDark ? "#333" : "#F0F0F0",
                          }}
                        />

                        <VStack space="md">
                          {/* EMAIL ROW */}
                          <HStack className="items-center justify-between">
                            <HStack className="items-center">
                              <Ionicons name="mail" size={16} color="#8bc34a" />
                              <ThemedText style={{ marginLeft: 10 }}>
                                Email
                              </ThemedText>
                            </HStack>
                            <ThemedText style={{ opacity: 0.6 }}>
                              {player.email}
                            </ThemedText>
                          </HStack>

                          {/* HANDICAP ROW */}
                          <HStack className="items-center justify-between py-1">
                            <HStack className="items-center">
                              <Ionicons
                                name="trophy"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText style={{ marginLeft: 10 }}>
                                Current Handicap
                              </ThemedText>
                            </HStack>
                            <ThemedText
                              style={{ fontWeight: "800", color: "#8bc34a" }}
                            >
                              {player.handicap}
                            </ThemedText>
                          </HStack>

                          {/* CALCULATED HANDICAP ROW */}
                          <HStack className="items-center justify-between py-1">
                            <HStack className="items-center">
                              <Ionicons
                                name="calculator"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText style={{ marginLeft: 10 }}>
                                Calculated Handicap
                              </ThemedText>
                            </HStack>
                            <ThemedText style={{ fontWeight: "800" }}>
                              {player.calculatedHandicap}
                            </ThemedText>
                          </HStack>

                          {/* HANDICAP INDEX ROW */}
                          {/* <HStack className="items-center justify-between py-1">
                          <HStack className="items-center">
                            <Ionicons name="ribbon" size={16} color="#8bc34a" />
                            <ThemedText style={{ marginLeft: 10 }}>Handicap Index</ThemedText>
                          </HStack>
                          <ThemedText style={{ fontWeight: "800" }}>{player.handicapIndex ?? "N/A"}</ThemedText>
                        </HStack> */}

                          {/* AVERAGE SCORE ROW */}
                          {/* <HStack className="items-center justify-between py-1">
                          <HStack className="items-center">
                            <Ionicons name="analytics" size={16} color="#8bc34a" />
                            <ThemedText style={{ marginLeft: 10 }}>Average Score</ThemedText>
                          </HStack>
                          <ThemedText style={{ fontWeight: "800" }}>{player.averageScore}</ThemedText>
                        </HStack> */}

                          {/* STATS ROW */}
                          {/* <HStack space="lg" className="mt-2">
                          <VStack className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                            <ThemedText style={{ fontSize: 10, opacity: 0.6 }}>Total Rounds</ThemedText>
                            <ThemedText style={{ fontWeight: "800", fontSize: 16 }}>{player.totalRounds}</ThemedText>
                          </VStack>
                          <VStack className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                            <ThemedText style={{ fontSize: 10, opacity: 0.6 }}>Courses Played</ThemedText>
                            <ThemedText style={{ fontWeight: "800", fontSize: 16 }}>{player.coursesPlayed}</ThemedText>
                          </VStack>
                        </HStack> */}

                          {/* ROLE ROW */}
                          <HStack className="items-center justify-between py-1 mt-2">
                            <HStack className="items-center">
                              <Ionicons
                                name="shield-checkmark"
                                size={16}
                                color="#8bc34a"
                              />
                              <ThemedText style={{ marginLeft: 10 }}>
                                Role
                              </ThemedText>
                            </HStack>
                            <ThemedText style={{ opacity: 0.6 }}>
                              {player.role || "Member"}
                            </ThemedText>
                          </HStack>
                        </VStack>

                        <Divider style={{ marginVertical: 10, opacity: 0 }} />
                      </VStack>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </ScrollView>
        </VStack>
      </SafeAreaView>
    </>
  );
}
