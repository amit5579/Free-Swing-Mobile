import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Mail, ChartBar, Flag, UserIcon, BookA } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { Pressable, ScrollView, useColorScheme, View } from "react-native";
import { useRouter } from "expo-router";

import { HStack } from "@/components/hstack";
import { Avatar } from "@/components/avatar";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import { SafeAreaView } from "react-native-safe-area-context";
import Watermark from "@/components/watermark";
import { useEffect, useState } from "react";
import { getAdminProfile } from "@/api/profile";

export default function AdminProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const [pageLoading, setPageLoading] = useState(true);

  const [adminProfile, setAdminProfile] = useState<any>(null);


   const fetchAdminProfile = async () => {
    try {
      setPageLoading(true);

      const adminProfile = await getAdminProfile();


      console.log("adminProfile",adminProfile);
      
     console.log("adminProfile",adminProfile);
     setAdminProfile(adminProfile);
    } catch (error) {
      console.error("Failed to fetch admin profile", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDark ? "#000" : "#f2f2f2",
        }}
      >
        <ThemedView className="flex-1  px-5">
          <Watermark />
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ================= HEADER ================= */}
            <HStack className="items-center my-6">
              <Pressable onPress={() => router.back()}>
                <Ionicons
                  name="arrow-back-outline"
                  size={24}
                  color={isDark ? "#fff" : "#020617"}
                />
              </Pressable>

              <ThemedText
                style={{ fontSize: 20, fontWeight: "700", marginLeft: 12 }}
              >
                Profile
              </ThemedText>
            </HStack>

            {/* ================= PROFILE CARD ================= */}
            <Box className="rounded-3xl p-6 mb-6 bg-white/5">
              <VStack className="items-center">
                {/* Avatar */}
                <View
                  style={{
                    borderWidth: 3,
                    borderColor: "#8bc34a",
                    borderRadius: 999,
                    padding: 6,
                    marginBottom: 14,
                  }}
                >
                  <Avatar size="xl">
                    <UserIcon size={38} color="#8bc34a" />
                  </Avatar>
                </View>

                {/* Name */}
                <ThemedText style={{ fontSize: 22, fontWeight: "700" }}>
                  {adminProfile?.username}
                </ThemedText>

                {/* Role */}
                <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                  <ThemedText style={{ fontSize: 14 }}>{adminProfile?.role}</ThemedText>
                </Box>
              </VStack>
            </Box>


            {/* ================= DETAILS ================= */}
            <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
              <VStack space="lg">
                <HStack className="items-center gap-3">
                  <Mail size={20} color="#8bc34a" />
                  <VStack>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      Email
                    </ThemedText>

                    <ThemedText>{adminProfile?.email}</ThemedText>
                  </VStack>
                </HStack>

                <Divider />

                {/* <HStack className="items-center gap-3">
                  <BookA size={20} color="#8bc34a" />
                  <VStack>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      Account Status
                    </ThemedText>

                    <ThemedText style={{ color: "#8bc34a", fontWeight: "600" }}>
                      Active
                    </ThemedText>
                  </VStack>
                </HStack> */}
              </VStack>
            </Box>
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}
