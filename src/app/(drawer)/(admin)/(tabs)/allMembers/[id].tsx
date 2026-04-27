import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import https from "@/api/https";
import Watermark from "@/components/watermark";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Skeleton } from "@/components/Skeleton";

const { width } = Dimensions.get("window");

interface UserProfile {
  id: number;
  username: string;
  email: string;
  mobileNumber: string;
  role: string;
  handicap: number;
  handicapIndex: number | null;
  totalRounds: number;
  coursesPlayed: number;
  averageScore: number;
  calculatedHandicap: number;
  isBlocked: boolean;
  profilePictureUrl: string | null;
  invitedBySubAdminName: string | null;
  dateOfBirth: string | null;
  homeCourse: string | null;
  slope: number | null;
  rating: number | null;
  membershipLevel?: string;
  memberSince?: string;
  createdAt?: string;
  bestScore?: number;
  paradisePostCount?: number;
  paradisePhotoPostCount?: number;
  lastParadisePostAt?: string | null;
}

export default function MemberProfilePage({ id: propId, hideHeader = false }: { id?: string; hideHeader?: boolean }) {
  const { id: paramId } = useLocalSearchParams();
  const id = propId || paramId;
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  const [sections, setSections] = useState({
    account: false,
    golf: false,
    community: false,
  });

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await https.get(`/User/${id}`);
      setUser(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderInfoRow = (label: string, value: string | number | null, icon: any) => (
    <HStack className="items-center justify-between py-3">
      <HStack className="items-center" space="sm">
        <Ionicons name={icon} size={18} color="#8BC34A" />
        <Text style={{ color: isDark ? "#AAA" : "#666", fontSize: 13, fontWeight: "600" }}>{label}</Text>
      </HStack>
      <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 14, fontWeight: "700" }}>{value ?? "N/A"}</Text>
    </HStack>
  );

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor: isDark ? "#000" : "#F2F2F2" }}>
        <Watermark />
        {!hideHeader && (
            <View className="px-4 py-3">
                <TouchableOpacity 
                  onPress={async () => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      const role = await AsyncStorage.getItem("role");
                      if (role?.toLowerCase() === 'admin') {
                        router.replace("/(drawer)/(admin)/(tabs)/dashboard");
                      } else {
                        router.replace("/(drawer)/(user)/(tabs)/dashboard");
                      }
                    }
                  }}
                  className="bg-[#8BC34A] rounded-full p-2 h-10 w-10 items-center justify-center mb-4"
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
            </View>
        )}
        <View className="p-4">
          <Skeleton isDark={isDark} width={width - 32} height={180} borderRadius={32} style={{ marginBottom: 16 }} />
          <Skeleton isDark={isDark} width={width - 32} height={120} borderRadius={32} style={{ marginBottom: 16 }} />
          <Skeleton isDark={isDark} width={width - 32} height={60} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton isDark={isDark} width={width - 32} height={60} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton isDark={isDark} width={width - 32} height={60} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text style={{ color: isDark ? "#FFF" : "#000" }}>User not found</Text>
      </View>
    );
  }

  const hasProfileImage = user.profilePictureUrl && 
                         user.profilePictureUrl.trim() !== "" && 
                         user.profilePictureUrl !== "null" && 
                         !imageError;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#F8F9FA" }}>
      <Watermark />
      
      {/* Header */}
      {!hideHeader && (
        <HStack className="items-center px-4 py-3 justify-between">
          <TouchableOpacity 
            onPress={async () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                const role = await AsyncStorage.getItem("role");
                if (role?.toLowerCase() === 'admin') {
                  router.replace("/(drawer)/(admin)/(tabs)/dashboard");
                } else {
                  router.replace("/(drawer)/(user)/(tabs)/dashboard");
                }
              }
            }}
            style={{
              backgroundColor: "#8BC34A",
              padding: 10,
              borderRadius: 14,
              shadowColor: "#8BC34A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text 
            style={{ 
              fontSize: 18, 
              fontWeight: "900", 
              color: isDark ? "#FFF" : "#1A1A1A",
              letterSpacing: -0.5
            }}
          >
            Golfers Paradise Member
          </Text>
          <View style={{ width: 40 }} />
        </HStack>
      )}

      <Box 
        style={{
          backgroundColor: isDark ? "rgba(26,26,26,0.95)" : "#FFF",
          borderRadius: 28,
          marginHorizontal: 16,
          padding: 20,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDark ? "rgba(139,195,74,0.3)" : "rgba(139,195,74,0.1)",
          shadowColor: "#8BC34A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 10,
          zIndex: 10,
        }}
      >
        <HStack className="items-center" space="lg">
          <Box 
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 3,
              borderColor: "#8BC34A",
              padding: 2,
              backgroundColor: isDark ? "#000" : "#FFF",
            }}
          >
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => hasProfileImage && setImageModalVisible(true)}
              style={{ width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0", justifyContent: "center", alignItems: "center" }}
            >
              {hasProfileImage ? (
                  <Image 
                  source={{ uri: user.profilePictureUrl!.startsWith('http') ? user.profilePictureUrl! : `https://kolve18freeswing.com${user.profilePictureUrl}` }}
                  style={{ width: "100%", height: "100%" }}
                  onError={() => setImageError(true)}
                  resizeMode="cover"
                  />
              ) : (
                  <Text style={{ fontSize: 28, fontWeight: "900", color: "#8BC34A" }}>
                  {user.username.charAt(0).toUpperCase()}
                  </Text>
              )}
            </TouchableOpacity>
          </Box>
          
          <VStack style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: isDark ? "#FFF" : "#000" }} numberOfLines={1}>
              {user.username}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#8BC34A", marginVertical: 1 }}>
              Membership #{user.id}
            </Text>
            
            <HStack space="xs" className="items-center mt-1">
              <Box style={{ backgroundColor: "#8BC34A", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                 <Text style={{ color: "white", fontSize: 9, fontWeight: "900", textTransform: "uppercase" }}>
                      {user.role}
                  </Text>
              </Box>
              <Text style={{ color: isDark ? "#666" : "#888", fontSize: 10, fontWeight: "800", marginLeft: 8 }}>
                  {user.homeCourse ? user.homeCourse : "Not added yet"}
              </Text>
            </HStack>

            <Text style={{ color: isDark ? "#444" : "#AAA", fontSize: 9, fontWeight: "700", marginTop: 6 }}>
              Member since {(user.createdAt || user.memberSince) ? new Date(user.createdAt || user.memberSince!).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently joined"}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        
        <Box 
          style={{
            backgroundColor: isDark ? "rgba(26,26,26,0.9)" : "#FFF",
            borderRadius: 32,
            padding: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(139,195,74,0.2)" : "rgba(0,0,0,0.05)",
          }}
        >
          <HStack style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
            {[
              { label: "HC Index", value: user.handicapIndex ?? "--" },
              { label: "Handicap", value: user.handicap ?? "--" },
              { label: "Rounds", value: user.totalRounds || "--" },
              { label: "Avg Score", value: user.averageScore || "--" },
              { label: "Best Score", value: user.bestScore || "--" },
              { label: "Courses", value: user.coursesPlayed || "--" },
            ].map((stat, idx) => (
              <VStack key={idx} style={{ width: "31%", alignItems: "center", marginBottom: idx < 3 ? 24 : 0 }}>
                <Text style={{ color: "#8BC34A", fontSize: 20, fontWeight: "900" }}>{stat.value}</Text>
                <Text style={{ color: isDark ? "#999" : "#666", fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginTop: 4 }}>{stat.label}</Text>
              </VStack>
            ))}
          </HStack>
        </Box>

        <VStack space="md">
            <Box 
            style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFF",
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            }}
            >
            <TouchableOpacity 
                onPress={() => toggleSection('account')}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}
            >
                <HStack className="items-center" space="md">
                <Box style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(139,195,74,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="person-outline" size={20} color="#8BC34A" />
                </Box>
                <Text style={{ fontWeight: "900", fontSize: 16, color: isDark ? "#FFF" : "#1A1A1A" }}>Account Info</Text>
                </HStack>
                <Ionicons name={sections.account ? "chevron-up" : "chevron-down"} size={20} color="#8BC34A" />
            </TouchableOpacity>
            {sections.account && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <View style={{ height: 1, backgroundColor: "rgba(139,195,74,0.1)", marginBottom: 8 }} />
                {renderInfoRow("Email", user.email, "mail-outline")}
                {renderInfoRow("Mobile", user.mobileNumber, "call-outline")}
                {renderInfoRow("Date of Birth", user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A", "calendar-outline")}
                {renderInfoRow("Member Since", (user.createdAt || user.memberSince) ? new Date(user.createdAt || user.memberSince!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A", "time-outline")}
                </View>
            )}
            </Box>

            <Box 
            style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFF",
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            }}
            >
            <TouchableOpacity 
                onPress={() => toggleSection('golf')}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}
            >
                <HStack className="items-center" space="md">
                <Box style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(139,195,74,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="golf-outline" size={20} color="#8BC34A" />
                </Box>
                <Text style={{ fontWeight: "900", fontSize: 16, color: isDark ? "#FFF" : "#1A1A1A" }}>Golf Profile</Text>
                </HStack>
                <Ionicons name={sections.golf ? "chevron-up" : "chevron-down"} size={20} color="#8BC34A" />
            </TouchableOpacity>
            {sections.golf && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <View style={{ height: 1, backgroundColor: "rgba(139,195,74,0.1)", marginBottom: 8 }} />
                {renderInfoRow("Home Course", user.homeCourse || "N/A", "location-outline")}
                {renderInfoRow("Slope", user.slope || "N/A", "trending-up-outline")}
                {renderInfoRow("Rating", user.rating || "N/A", "star-outline")}
                {renderInfoRow("Invited By", user.invitedBySubAdminName || "Direct", "people-outline")}
                </View>
            )}
            </Box>

            <Box 
            style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFF",
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            }}
            >
            <TouchableOpacity 
                onPress={() => toggleSection('community')}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}
            >
                <HStack className="items-center" space="md">
                <Box style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(139,195,74,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#8BC34A" />
                </Box>
                <Text style={{ fontWeight: "900", fontSize: 16, color: isDark ? "#FFF" : "#1A1A1A" }}>Community Activity</Text>
                </HStack>
                <Ionicons name={sections.community ? "chevron-up" : "chevron-down"} size={20} color="#8BC34A" />
            </TouchableOpacity>
            {sections.community && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <View style={{ height: 1, backgroundColor: "rgba(139,195,74,0.1)", marginBottom: 8 }} />
                    {renderInfoRow("Posts Shared", user.paradisePostCount?.toString() || "0", "share-social-outline")}
                    {renderInfoRow("Photo Posts", user.paradisePhotoPostCount?.toString() || "0", "image-outline")}
                    {renderInfoRow("Latest Post", user.lastParadisePostAt ? new Date(user.lastParadisePostAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "No posts yet", "time-outline")}
                </View>
            )}
            </Box>
        </VStack>

      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity 
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10, backgroundColor: "rgba(255,255,255,0.2)", padding: 8, borderRadius: 20 }}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          {user.profilePictureUrl && (
            <Image 
              source={{ uri: user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `https://kolve18freeswing.com${user.profilePictureUrl}` }}
              style={{ width: width, height: width, resizeMode: "contain" }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
