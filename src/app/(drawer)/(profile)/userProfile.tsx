import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Mail, ChartBar, Flag, BookA } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { HStack } from "@/components/hstack";
import { Avatar } from "@/components/avatar";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { useEffect, useState, useRef } from "react";
import {
  getProfile,
  uploadProfileImage,
} from "@/api/profile";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";

export default function UserProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [userProfile, setUserProfile] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setPageLoading(true);
      const profile = await getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      setPageLoading(false);
    }
  };

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
      setImageError(false);

      try {
        setUploading(true);
        await uploadProfileImage(selectedImage);
        await fetchUserProfile();
      } catch (error) {
        console.log("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const onSubmit = (data: any) => {
    console.log("Validated Data:", data);
    // call API here
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const ProfileCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box className="rounded-3xl p-6 mb-6 bg-white/5">
        <VStack className="items-center">
          <Skeleton isDark={isDark} height={90} width={90} borderRadius={999} style={{ marginBottom: 14 }} />
          <Skeleton isDark={isDark} height={20} width="40%" style={{ marginBottom: 10 }} />
          <Skeleton isDark={isDark} height={30} width="30%" borderRadius={20} />
        </VStack>
      </Box>
    );
  };

  const StatsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <HStack className="justify-between mb-6">
        {[1, 2].map((_, i) => (
          <Box key={i} className="flex-1 mx-1 p-4 rounded-xl bg-white/10">
            <VStack className="items-center">
              <Skeleton isDark={isDark} height={20} width={20} style={{ marginBottom: 8 }} />
              <Skeleton isDark={isDark} height={18} width="40%" style={{ marginBottom: 6 }} />
              <Skeleton isDark={isDark} height={12} width="60%" />
            </VStack>
          </Box>
        ))}
      </HStack>
    );
  };

  const DetailsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
        <VStack space="lg">
          {[1, 2].map((_, i) => (
            <View key={i}>
              <HStack className="items-center gap-3">
                <Skeleton isDark={isDark} height={20} width={20} />
                <VStack>
                  <Skeleton isDark={isDark} height={10} width="30%" style={{ marginBottom: 6 }} />
                  <Skeleton isDark={isDark} height={14} width="60%" />
                </VStack>
              </HStack>
              {i === 0 && <Divider style={{ marginVertical: 12 }} />}
            </View>
          ))}
        </VStack>
      </Box>
    );
  };

  const ButtonsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <VStack space="md" className="mt-6">
        <Skeleton isDark={isDark} height={48} borderRadius={12} />
        <Skeleton isDark={isDark} height={48} borderRadius={12} />
      </VStack>
    );
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }} edges={["top", "left", "right"]}>
        <ThemedView className="flex-1 px-5">
          <Watermark />
          <ScrollView showsVerticalScrollIndicator={false}>
            {pageLoading ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative', width: '100%' }}>
                  <View style={{ position: 'absolute', left: 0, zIndex: 10 }}>
                    <Skeleton isDark={isDark} height={24} width={24} borderRadius={12} />
                  </View>
                  <Skeleton isDark={isDark} height={22} width="30%" borderRadius={4} style={{ marginLeft: 36, alignSelf: 'flex-start' }} />
                </View>
                <ProfileCardSkeleton isDark={isDark} />
                <StatsSkeleton isDark={isDark} />
                <DetailsSkeleton isDark={isDark} />
                <ButtonsSkeleton isDark={isDark} />
              </>
            ) : (
              <>
                <HStack className="items-center mb-6">
                  <Pressable onPress={() => router.back()} hitSlop={20}>
                    <Ionicons name="arrow-back-outline" size={24} color="#8BC34A" />
                  </Pressable>
                  <ThemedText style={{ fontSize: 22, fontWeight: "700", marginLeft: 12 }}>Profile</ThemedText>
                </HStack>

                <Box className="rounded-3xl p-6 mb-6 bg-white/5">
                  <VStack className="items-center">
                    <Pressable onPress={pickImage}>
                      <View style={{ borderWidth: 3, borderColor: "#8bc34a", borderRadius: 999, padding: 3, marginBottom: 14, position: "relative" }}>
                        <Avatar size="xl">
                          {(image || (userProfile?.profilePictureUrl && userProfile.profilePictureUrl.trim() !== "" && userProfile.profilePictureUrl !== "null")) && !imageError ? (
                            <Image
                              source={{ uri: image || (userProfile?.profilePictureUrl?.startsWith('http') ? userProfile.profilePictureUrl : `https://kolve18freeswing.com${userProfile.profilePictureUrl}`) }}
                              style={{ width: 90, height: 90, borderRadius: 45 }}
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "rgba(139,195,74,0.1)", justifyContent: "center", alignItems: "center" }}>
                              <ThemedText style={{ fontSize: 32, fontWeight: "bold", color: "#8BC34A" }}>
                                {userProfile?.username?.trim() ? userProfile.username.trim()[0].toUpperCase() : "U"}
                              </ThemedText>
                            </View>
                          )}
                        </Avatar>
                        <View style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "#8bc34a", borderRadius: 20, padding: 6 }}>
                          <Ionicons name="camera" size={14} color="white" />
                        </View>
                        {uploading && (
                          <View style={{ position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="cloud-upload-outline" size={22} color="white" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <ThemedText style={{ fontSize: 22, fontWeight: "700" }}>{userProfile?.username}</ThemedText>
                    <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                      <ThemedText style={{ fontSize: 14 }}>{userProfile?.role}</ThemedText>
                    </Box>
                  </VStack>
                </Box>

                <HStack className="justify-between mb-6">
                  <Box className="flex-1 mr-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]">
                    <VStack className="items-center">
                      <ChartBar size={22} color="#8bc34a" />
                      <ThemedText style={{ fontSize: 18, fontWeight: "700", marginTop: 4 }}>{userProfile?.handicapIndex}</ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Handicap Index</ThemedText>
                    </VStack>
                  </Box>
                  <Box className="flex-1 ml-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]">
                    <VStack className="items-center">
                      <Flag size={22} color="#8bc34a" />
                      <ThemedText style={{ fontSize: 18, fontWeight: "700", marginTop: 4 }}>{userProfile?.handicap}</ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Handicap</ThemedText>
                    </VStack>
                  </Box>
                </HStack>

                <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
                  <VStack space="lg">
                    <HStack className="items-center gap-3">
                      <Mail size={20} color="#8bc34a" />
                      <VStack>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Email</ThemedText>
                        <ThemedText>{userProfile?.email}</ThemedText>
                      </VStack>
                    </HStack>
                    <Divider />
                    <HStack className="items-center gap-3">
                      <BookA size={20} color="#8bc34a" />
                      <VStack>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Account Status</ThemedText>
                        <ThemedText style={{ color: userProfile?.isBlocked === false ? "#8bc34a" : "#E81515", fontWeight: "600" }}>
                          {userProfile?.isBlocked === false ? "Active" : "Inactive"}
                        </ThemedText>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                <VStack space="md" className="mt-6">
                  <Pressable
                    onPress={() => setPasswordModal(true)}
                    style={{ backgroundColor: "#8BC34A", padding: 14, borderRadius: 12, alignItems: "center" }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Change Password</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/(drawer)/(profile)/certificate')}
                    style={{ borderWidth: 1, borderColor: "#8BC34A", padding: 14, borderRadius: 12, alignItems: "center" }}
                  >
                    <ThemedText style={{ fontWeight: "600", color: "#8BC34A" }}>Handicap Certificate</ThemedText>
                  </Pressable>
                </VStack>
              </>
            )}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>

      <Modal animationType="slide" transparent visible={passwordModal} onRequestClose={() => setPasswordModal(false)}>
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 16 }}>
          <View style={{ backgroundColor: isDark ? "#111" : "#fff", borderRadius: 16, padding: 18 }}>
            <HStack style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>Change Password</ThemedText>
              <Pressable onPress={() => setPasswordModal(false)}>
                <Ionicons name="close" size={22} color={isDark ? "#fff" : "#000"} />
              </Pressable>
            </HStack>
            <ThemedText style={{ fontSize: 13, opacity: 0.6, marginBottom: 14 }}>Enter your current and new password</ThemedText>
            <VStack space="md">
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <TextInput
                      placeholder="Current Password"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                      style={{ borderWidth: 1, borderColor: errors.currentPassword ? "red" : "#e5e5e5", borderRadius: 10, padding: 12, color: isDark ? "#fff" : "#000" }}
                    />
                    {errors.currentPassword && <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>*{errors.currentPassword.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <TextInput
                      placeholder="New Password"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                      style={{ borderWidth: 1, borderColor: errors.newPassword ? "red" : "#e5e5e5", borderRadius: 10, padding: 12, color: isDark ? "#fff" : "#000" }}
                    />
                    {errors.newPassword && <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>*{errors.newPassword.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <TextInput
                      placeholder="Confirm Password"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                      style={{ borderWidth: 1, borderColor: errors.confirmPassword ? "red" : "#e5e5e5", borderRadius: 10, padding: 12, color: isDark ? "#fff" : "#000" }}
                    />
                    {errors.confirmPassword && <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>*{errors.confirmPassword.message}</Text>}
                  </View>
                )}
              />
            </VStack>
            <HStack style={{ marginTop: 18, justifyContent: "space-between" }}>
              <Pressable
                onPress={() => setPasswordModal(false)}
                style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center", marginRight: 8 }}
              >
                <ThemedText style={{ fontWeight: "600" }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSubmit(onSubmit)}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#8BC34A", alignItems: "center", marginLeft: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Update</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}
