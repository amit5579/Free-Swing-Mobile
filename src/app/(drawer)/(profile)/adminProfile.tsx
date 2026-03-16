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
import * as ImagePicker from "expo-image-picker";
import { getAdminProfile, uploadProfileImage } from "@/api/profile";
import { Image } from "expo-image";

export default function AdminProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const [pageLoading, setPageLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required to access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];

      setImage(selectedImage.uri);

      try {
        setUploading(true);

        await uploadProfileImage(selectedImage);

        // refresh profile after upload
        await fetchAdminProfile();
      } catch (error) {
        console.log("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };
  const fetchAdminProfile = async () => {
    try {
      setPageLoading(true);

      const adminProfile = await getAdminProfile();

      // console.log("adminProfile", adminProfile);
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
          // backgroundColor: isDark ? "#000" : "#f2f2f2",
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
                {/* <View
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
                </View> */}

                <Pressable onPress={pickImage}>
                  <View
                    style={{
                      borderWidth: 3,
                      borderColor: "#8bc34a",
                      borderRadius: 999,
                      padding: 3,
                      marginBottom: 14,
                      position: "relative",
                    }}
                  >
                    <Avatar size="xl">
                      {image || adminProfile?.profilePictureUrl ? (
                        <Image
                          source={{
                            uri: image || adminProfile?.profilePictureUrl,
                          }}
                          style={{
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            padding: 3,
                          }}
                        />
                      ) : (
                        <UserIcon size={38} color="#8bc34a" />
                      )}
                    </Avatar>

                    {/* CAMERA ICON OVERLAY */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        backgroundColor: "#8bc34a",
                        borderRadius: 20,
                        padding: 6,
                      }}
                    >
                      <Ionicons name="camera" size={14} color="white" />
                    </View>

                    {/* LOADING OVERLAY */}
                    {uploading && (
                      <View
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderRadius: 999,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={22}
                          color="white"
                        />
                      </View>
                    )}
                  </View>
                </Pressable>

                {/* Name */}
                <ThemedText style={{ fontSize: 22, fontWeight: "700" }}>
                  {adminProfile?.username}
                </ThemedText>

                {/* Role */}
                <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                  <ThemedText style={{ fontSize: 14 }}>
                    {adminProfile?.role}
                  </ThemedText>
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
              </VStack>
            </Box>
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}
