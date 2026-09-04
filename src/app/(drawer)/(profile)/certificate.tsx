import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
  BackHandler,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useRef } from "react";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { getCertificateByUserId } from "@/api/modules/profile.api";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Skeleton } from "@/components/Skeleton";
import { LinearGradient } from "expo-linear-gradient";

export default function CertificatePage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const certificateRef = useRef<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      setRole(storedRole);
    };
    fetchRole();
  }, []);

  const handleBack = useCallback(() => {
    const normalizedRole = role?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (normalizedRole === "subadmin") {
      router.navigate("/(drawer)/(profile)/subAdminProfile");
    } else {
      router.navigate("/(drawer)/(profile)/userProfile");
    }
  }, [role, router]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [handleBack]),
  );

  const [userCertificate, setUserCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const certificate = await getCertificateByUserId();
      setUserCertificate(certificate);
    } catch (error) {
      console.error("Failed to fetch certificate", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
  }, []);

  const buildCertificateHtml = (data: any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            color: #212529;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh;
          }
          .certificate-container {
            border: 3px solid #198754;
            border-radius: 12px;
            padding: 48px;
            width: 100%;
            max-width: 720px;
            box-sizing: border-box;
            background: #ffffff;
          }
          .certificate-title {
            font-size: 22px;
            font-weight: 800;
            text-align: center;
            margin-top: 0;
            margin-bottom: 28px;
            letter-spacing: 0.5px;
            color: #111827;
          }
          .certificate-text {
            font-size: 16px;
            line-height: 1.8;
            text-align: left;
            margin-bottom: 20px;
            color: #374151;
          }
          .certificate-text strong {
            color: #111827;
            font-weight: 700;
          }
          .certificate-note {
            font-size: 13px;
            font-style: italic;
            color: #6c757d;
            text-align: left;
            margin-top: 36px;
            margin-bottom: 0;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <h2 class="certificate-title">WHOMSOEVER IT MAY CONCERN</h2>
          <p class="certificate-text">
            It is to certify that Mr./Mrs./Master <strong>${data?.name || ""}</strong>, 
            Membership No. <strong>#${data?.membershipNo || ""}</strong>, 
            of <strong>${data?.golfCourse || ""}</strong>.
          </p>
          <p class="certificate-text">
            His/Her HC is <strong>${data?.handicap ?? ""}</strong> as on <strong>${data?.date || ""}</strong> 
            and his/her HC Index is <strong>${data?.handicapIndex ?? ""}</strong> 
            for Slope <strong>${data?.slope ?? ""}</strong> and Rating <strong>${data?.rating ?? ""}</strong>.
          </p>
          <p class="certificate-text">
            This is as per his/her scores submitted online.
          </p>
          <p class="certificate-note">
            <em>Note: This is an online-generated certificate${data?.showCourseApproval ? " and is approved by the course" : ""}. No stamp or signature is required.</em>
          </p>
        </div>
      </body>
    </html>
  `;

  const downloadCertificate = async () => {
    try {
      const html = buildCertificateHtml(userCertificate);
      await Print.printAsync({ html });
    } catch (error) {
      console.log("Download Error:", error);
      Alert.alert("Error", "Could not generate certificate download.");
    }
  };

  const shareCertificate = async () => {
    try {
      const html = buildCertificateHtml(userCertificate);
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(pdfUri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: "Share Handicap Certificate",
      });
    } catch (error) {
      console.log("Share Error:", error);
      Alert.alert("Error", "Could not generate certificate for sharing.");
    }
  };

  const CertificateSkeleton = () => {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
        edges={["top", "left", "right"]}
      >
        <ThemedView className="flex-1 px-5">
          <HStack className="items-center my-6">
            <Skeleton
              isDark={isDark}
              height={40}
              width={40}
              borderRadius={20}
            />
            <Skeleton
              isDark={isDark}
              height={24}
              width="50%"
              borderRadius={4}
              style={{ marginLeft: 12 }}
            />
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={{
                borderWidth: 3,
                borderColor: isDark ? "rgba(139, 195, 74, 0.3)" : "rgba(25, 135, 84, 0.3)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <Skeleton
                isDark={isDark}
                height={24}
                width="70%"
                borderRadius={4}
                style={{ alignSelf: "center", marginBottom: 28 }}
              />

              <Skeleton
                isDark={isDark}
                height={16}
                width="100%"
                borderRadius={4}
                style={{ marginBottom: 10 }}
              />
              <Skeleton
                isDark={isDark}
                height={16}
                width="85%"
                borderRadius={4}
                style={{ marginBottom: 20 }}
              />

              <Skeleton
                isDark={isDark}
                height={16}
                width="100%"
                borderRadius={4}
                style={{ marginBottom: 10 }}
              />
              <Skeleton
                isDark={isDark}
                height={16}
                width="90%"
                borderRadius={4}
                style={{ marginBottom: 20 }}
              />

              <Skeleton
                isDark={isDark}
                height={16}
                width="60%"
                borderRadius={4}
                style={{ marginBottom: 30 }}
              />

              <Skeleton
                isDark={isDark}
                height={14}
                width="80%"
                borderRadius={4}
              />
            </View>

            <HStack style={{ gap: 10, marginTop: 10 }}>
              <Skeleton
                isDark={isDark}
                height={44}
                width="50%"
                borderRadius={12}
              />
              <Skeleton
                isDark={isDark}
                height={44}
                width="50%"
                borderRadius={12}
              />
            </HStack>
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  };

  if (loading) {
    return <CertificateSkeleton />;
  }

  // Not eligible condition
  if (userCertificate && !userCertificate.isEligible) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
        edges={["top", "left", "right"]}
      >
        <ThemedView className="flex-1 px-5">
          <HStack className="items-center my-6">
            <Pressable
              onPress={handleBack}
              hitSlop={20}
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
              }}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#8BC34A" />
            </Pressable>
            <ThemedText
              style={{ fontSize: 20, fontWeight: "700", marginLeft: 12 }}
            >
              Handicap Certificate
            </ThemedText>
          </HStack>

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 24,
              paddingBottom: 60,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="alert-circle-outline" size={44} color="#F59E0B" />
            </View>

            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Not Eligible
            </ThemedText>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: isDark ? "#9CA3AF" : "#6B7280",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              You are not eligible. You have only completed{" "}
              <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                {userCertificate?.completedHolesCount || 0} holes
              </Text>{" "}
              (requires 180).
            </Text>

            <Pressable
              onPress={handleBack}
              style={{ borderRadius: 12 }}
            >
              <LinearGradient
                colors={["#8bc34a", "#558b2f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 12,
                  borderRadius: 12,
                  shadowColor: "#8bc34a",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>
                  Back to Profile
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
      edges={["top", "left", "right"]}
    >
      <ThemedView className="flex-1 px-5">
        <HStack className="items-center my-6">
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            style={{
              padding: 10,
              borderRadius: 50,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
            }}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#8BC34A" />
          </Pressable>
          <ThemedText
            style={{ fontSize: 20, fontWeight: "700", marginLeft: 12 }}
          >
            Handicap Certificate
          </ThemedText>
        </HStack>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <ViewShot
            ref={certificateRef}
            options={{
              format: "png",
              quality: 1,
            }}
            style={{ borderRadius: 16 }}
          >
            <View
              style={{
                borderWidth: 3,
                borderColor: isDark ? "#22c55e" : "#198754",
                borderRadius: 16,
                padding: 24,
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
                position: "relative",
                overflow: "hidden",
                minHeight: 380,
                justifyContent: "center",
              }}
            >
              <Watermark opacity={0.08} />

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: 24,
                  color: isDark ? "#FFFFFF" : "#111827",
                  letterSpacing: 0.5,
                }}
              >
                WHOMSOEVER IT MAY CONCERN
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 25,
                  textAlign: "left",
                  marginBottom: 16,
                  color: isDark ? "#E5E7EB" : "#374151",
                }}
              >
                It is to certify that Mr./Mrs./Master{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.name}
                </Text>
                , Membership No.{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  #{userCertificate?.membershipNo}
                </Text>
                , of{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.golfCourse}
                </Text>
                .
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 25,
                  textAlign: "left",
                  marginBottom: 16,
                  color: isDark ? "#E5E7EB" : "#374151",
                }}
              >
                His/Her HC is{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.handicap}
                </Text>{" "}
                as on{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.date}
                </Text>{" "}
                and his/her HC Index is{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.handicapIndex}
                </Text>{" "}
                for Slope{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.slope}
                </Text>{" "}
                and Rating{" "}
                <Text style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {userCertificate?.rating}
                </Text>
                .
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 25,
                  textAlign: "left",
                  marginBottom: 24,
                  color: isDark ? "#E5E7EB" : "#374151",
                }}
              >
                This is as per his/her scores submitted online.
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  fontStyle: "italic",
                  textAlign: "left",
                  marginTop: 8,
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  lineHeight: 18,
                }}
              >
                Note: This is an online-generated certificate
                {userCertificate?.showCourseApproval ? " and is approved by the course" : ""}.
                No stamp or signature is required.
              </Text>
            </View>
          </ViewShot>

          <HStack style={{ gap: 8, marginTop: 24, alignItems: "center" }}>
            <Pressable
              onPress={shareCertificate}
              style={{
                flex: 1.4,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "white",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: "#8BC34A",
              }}
            >
              <Ionicons name="share-social-outline" size={18} color="#8BC34A" />
              <ThemedText
                style={{ color: "#8BC34A", fontWeight: "600", fontSize: 13 }}
              >
                Share PDF
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={downloadCertificate}
              style={{ flex: 1.6, borderRadius: 12 }}
            >
              <LinearGradient
                colors={["#8bc34a", "#558b2f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  shadowColor: "#8bc34a",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name="download-outline" size={18} color="white" />
                <ThemedText
                  style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}
                >
                  Print / Save PDF
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </HStack>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
