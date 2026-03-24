import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Mail, ChartBar, Flag, UserIcon, BookA } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { HStack } from "@/components/hstack";
import { Avatar } from "@/components/avatar";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { useEffect, useState } from "react";
import {
  getCertificateByUserId,
  getProfile,
  uploadProfileImage,
} from "@/api/profile";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/schema/adminSchemas";

import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useRef } from "react";

export default function UserProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const certificateRef = useRef<any>(null);

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
  const [userCertificate, setUserCertificate] = useState<any>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [passwordModal, setPasswordModal] = useState(false);
  const [certificateModal, setCertificateModal] = useState(false);

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
        await fetchUserProfile();
      } catch (error) {
        console.log("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      setPageLoading(true);

      const profile = await getProfile();
      const certificate = await getCertificateByUserId();
      console.log("certificate", certificate);
      setUserProfile(profile);
      setUserCertificate(certificate);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      setPageLoading(false);
    }
  };
  const onSubmit = (data: any) => {
    console.log("Validated Data:", data);

    // call API here
  };

  const generatePDFfromView = async () => {
    try {
      if (!certificateRef.current) return;

      const uri = await certificateRef.current.capture();

      const html = `
      <html>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh;">
          <img src="${uri}" style="width:90%;" />
        </body>
      </html>
    `;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(pdfUri);
    } catch (error) {
      console.log("Error:", error);
    }
  };
  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <>
      <ThemedView className="flex-1 pt-16 px-5">
        <Watermark />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ================= HEADER ================= */}
          <HStack className="items-center mb-6">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#8BC34A" />
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
                    {image || userProfile?.profilePictureUrl ? (
                      <Image
                        source={{
                          uri: image || userProfile?.profilePictureUrl,
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
                {userProfile?.username}
              </ThemedText>

              {/* Role */}
              <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                <ThemedText style={{ fontSize: 14 }}>
                  {userProfile?.role}
                </ThemedText>
              </Box>
            </VStack>
          </Box>

          {/* ================= STATS ================= */}
          <HStack className="justify-between mb-6">
            <Box className="flex-1 mr-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]">
              <VStack className="items-center">
                <ChartBar size={22} color="#8bc34a" />

                <ThemedText
                  style={{ fontSize: 18, fontWeight: "700", marginTop: 4 }}
                >
                  {userProfile?.handicapIndex}
                </ThemedText>

                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                  Handicap Index
                </ThemedText>
              </VStack>
            </Box>

            <Box className="flex-1 ml-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]">
              <VStack className="items-center">
                <Flag size={22} color="#8bc34a" />

                <ThemedText
                  style={{ fontSize: 18, fontWeight: "700", marginTop: 4 }}
                >
                  {userProfile?.handicap}
                </ThemedText>

                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                  Handicap
                </ThemedText>
              </VStack>
            </Box>
          </HStack>

          {/* ================= DETAILS ================= */}
          <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
            <VStack space="lg">
              <HStack className="items-center gap-3">
                <Mail size={20} color="#8bc34a" />
                <VStack>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    Email
                  </ThemedText>

                  <ThemedText>{userProfile?.email}</ThemedText>
                </VStack>
              </HStack>

              <Divider />

              <HStack className="items-center gap-3">
                <BookA size={20} color="#8bc34a" />
                <VStack>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    Account Status
                  </ThemedText>
                  {userProfile?.isBlocked === false ? (
                    <ThemedText style={{ color: "#8bc34a", fontWeight: "600" }}>
                      Active
                    </ThemedText>
                  ) : (
                    <ThemedText style={{ color: "E81515", fontWeight: "600" }}>
                      Inactive
                    </ThemedText>
                  )}
                </VStack>
              </HStack>
            </VStack>
          </Box>

          <VStack space="md" className="mt-6">
            {/* Change Password */}
            <Pressable
              onPress={() => setPasswordModal(true)}
              style={{
                backgroundColor: "#8BC34A",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                Change Password
              </ThemedText>
            </Pressable>

            {/* Handicap Certificate */}
            <Pressable
              onPress={() => setCertificateModal(true)}
              style={{
                borderWidth: 1,
                borderColor: "#8BC34A",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <ThemedText style={{ fontWeight: "600", color: "#8BC34A" }}>
                Handicap Certificate
              </ThemedText>
            </Pressable>
          </VStack>
        </ScrollView>
      </ThemedView>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={passwordModal}
        onRequestClose={() => setPasswordModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? "#111" : "#fff",
              borderRadius: 16,
              padding: 18,
            }}
          >
            {/* HEADER */}
            <HStack
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                Change Password
              </ThemedText>

              <Pressable onPress={() => setPasswordModal(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "#fff" : "#000"}
                />
              </Pressable>
            </HStack>

            {/* SUBTEXT */}
            <ThemedText
              style={{
                fontSize: 13,
                opacity: 0.6,
                marginBottom: 14,
              }}
            >
              Enter your current and new password
            </ThemedText>

            {/* INPUTS */}
            <VStack space="md">
              {/* CURRENT PASSWORD */}
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
                      style={{
                        borderWidth: 1,
                        borderColor: errors.currentPassword ? "red" : "#e5e5e5",
                        borderRadius: 10,
                        padding: 12,
                        color: isDark ? "#fff" : "#000",
                      }}
                    />

                    {errors.currentPassword && (
                      <Text
                        style={{ color: "red", fontSize: 12, marginTop: 4 }}
                      >
                        *{errors.currentPassword.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* NEW PASSWORD */}
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
                      style={{
                        borderWidth: 1,
                        borderColor: errors.newPassword ? "red" : "#e5e5e5",
                        borderRadius: 10,
                        padding: 12,
                        color: isDark ? "#fff" : "#000",
                      }}
                    />

                    {errors.newPassword && (
                      <Text
                        style={{ color: "red", fontSize: 12, marginTop: 4 }}
                      >
                        *{errors.newPassword.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* CONFIRM PASSWORD */}
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
                      style={{
                        borderWidth: 1,
                        borderColor: errors.confirmPassword ? "red" : "#e5e5e5",
                        borderRadius: 10,
                        padding: 12,
                        color: isDark ? "#fff" : "#000",
                      }}
                    />

                    {errors.confirmPassword && (
                      <Text
                        style={{ color: "red", fontSize: 12, marginTop: 4 }}
                      >
                        *{errors.confirmPassword.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </VStack>

            {/* BUTTONS */}
            <HStack
              style={{
                marginTop: 18,
                justifyContent: "space-between",
              }}
            >
              {/* CANCEL */}
              <Pressable
                onPress={() => setPasswordModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  alignItems: "center",
                  marginRight: 8,
                }}
              >
                <ThemedText style={{ fontWeight: "600" }}>Cancel</ThemedText>
              </Pressable>

              {/* SUBMIT */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: "#8BC34A",
                  alignItems: "center",
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Update</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>

      {/* Certificate modal */}
      <Modal visible={certificateModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? "#111" : "#fff",
              borderRadius: 16,
              padding: 16,
            }}
          >
            {/* HEADER */}
            <HStack
              style={{ justifyContent: "space-between", marginBottom: 12 }}
            >
              <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                Handicap Certificate
              </ThemedText>
              <Pressable onPress={() => setCertificateModal(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            <ScrollView style={{ maxHeight: 400 }}>
              <ViewShot
                ref={certificateRef}
                options={{
                  format: "png",
                  quality: 1,
                  result: "tmpfile",
                }}
              >
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor: "#8BC34A",
                    borderRadius: 10,
                    padding: 16,
                    backgroundColor: isDark ? "#1a1a1a" : "#f9fafb",
                  }}
                >
                  {/* TITLE */}
                  <ThemedText
                    style={{
                      textAlign: "center",
                      fontWeight: "800",
                      fontSize: 16,
                      marginBottom: 12,
                      letterSpacing: 0.5,
                    }}
                  >
                    WHOMSOEVER IT MAY CONCERN
                  </ThemedText>

                  {/* BODY */}
                  <Text
                    style={{
                      marginBottom: 10,
                      lineHeight: 20,
                      color: isDark ? "white" : "black",
                    }}
                  >
                    It is to certify that{" "}
                    <Text style={{ fontWeight: "700" }}>
                      Mr./Mrs./Master {userCertificate?.username}
                    </Text>
                    , Membership No.{" "}
                    <Text style={{ fontWeight: "700" }}>
                      #{userCertificate?.membershipNo}
                    </Text>
                    , of{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {userCertificate?.golfCourse}
                    </Text>
                    .
                  </Text>

                  <Text
                    style={{
                      marginBottom: 10,
                      lineHeight: 20,
                      color: isDark ? "white" : "black",
                    }}
                  >
                    His/Her HC is{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {userCertificate?.handicap}
                    </Text>{" "}
                    as on{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {userCertificate?.date}
                    </Text>{" "}
                    and his/her HC Index is{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {userCertificate?.handicapIndex}
                    </Text>{" "}
                    for Slope{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {userCertificate?.slope}
                    </Text>{" "}
                    and Rating{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {userCertificate?.rating}
                    </Text>
                    .
                  </Text>

                  <Text
                    style={{
                      marginBottom: 10,
                      lineHeight: 20,
                      color: isDark ? "white" : "black",
                    }}
                  >
                    This is as per his/her scores submitted online.
                  </Text>

                  {/* NOTE */}
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 10,
                      fontStyle: "italic",
                      lineHeight: 18,
                    }}
                  >
                    Note: This is an online-generated certificate and is
                    approved by the course. No stamp or signature is required.
                  </ThemedText>
                </View>
              </ViewShot>
            </ScrollView>

            {/* BUTTONS */}
            <HStack style={{ justifyContent: "space-between", marginTop: 14 }}>
              <Pressable
                onPress={() => setCertificateModal(false)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  width: "48%",
                  alignItems: "center",
                }}
              >
                <ThemedText>Close</ThemedText>
              </Pressable>

              <Pressable
                onPress={generatePDFfromView}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: "#8BC34A",
                  width: "48%",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>Print / Save PDF</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}
