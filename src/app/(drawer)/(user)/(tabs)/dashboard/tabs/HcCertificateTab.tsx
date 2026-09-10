import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserProfile } from "@/api/modules/dashboard.api";
import { getCertificateByUserId } from "@/api/modules/profile.api";
import Watermark from "@/components/watermark";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface HcCertificateTabProps {
  profile: UserProfile | null;
  homeCourseText?: string;
}

export function HcCertificateTab({
  profile,
  homeCourseText,
}: HcCertificateTabProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const homeCourseDisplay =
    homeCourseText ||
    profile?.resolvedHomeCourse ||
    profile?.homeCourse ||
    "No home course or games played yet";

  const handleDownloadCertificate = async () => {
    try {
      setLoading(true);
      const res = await getCertificateByUserId();
      if (!res) {
        Alert.alert("Error", "Failed to load certificate information.");
        return;
      }

      if (res.isEligible) {
        setCertificateData(res);
        setShowModal(true);
      } else {
        Alert.alert(
          "Not Eligible",
          `You are not eligible for a Handicap Certificate. You have only completed ${res.completedHolesCount || 0} holes (requires 180).`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Certificate check error:", error);
      Alert.alert(
        "Error",
        "Failed to load certificate eligibility. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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

  const handlePrintPdf = async () => {
    try {
      if (!certificateData) return;
      const html = buildCertificateHtml(certificateData);
      await Print.printAsync({ html });
    } catch (error) {
      console.error("Print Error:", error);
      Alert.alert("Error", "Could not generate certificate download.");
    }
  };

  const handleSharePdf = async () => {
    try {
      if (!certificateData) return;
      setDownloading(true);
      const html = buildCertificateHtml(certificateData);
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(pdfUri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: "Share Handicap Certificate",
      });
    } catch (error) {
      console.error("Share Error:", error);
      Alert.alert("Error", "Could not share certificate.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
      }}
    >
      {/* Header Banner */}
      <Box
        className="rounded-2xl p-5 mb-4 border"
        style={{
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          shadowColor: "#8BC34A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.1,
          shadowRadius: 8,
          // elevation: 4,
        }}
      >
        <HStack className="items-center" space="sm">
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(139, 195, 74, 0.15)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(139, 195, 74, 0.4)",
            }}
          >
            <Ionicons name="ribbon" size={20} color="#8BC34A" />
          </Box>
          <VStack className="flex-1">
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: isDark ? "#FFFFFF" : "#111827",
              }}
            >
              Handicap Certificate
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 2,
              }}
            >
              View and download your officially generated HC certificate.
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Main Handicap Card */}
      <Box
        className="rounded-3xl p-6 items-center border"
        style={{
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.85)"
            : "rgba(255, 255, 255, 0.95)",
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.4)"
            : "rgba(139, 195, 74, 0.5)",
          shadowColor: "#8BC34A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.15,
          shadowRadius: 14,
          // elevation: 6,
        }}
      >
        {/* Award Circle Icon */}
        <Box
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: isDark
              ? "rgba(139, 195, 74, 0.15)"
              : "rgba(139, 195, 74, 0.12)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            borderWidth: 2,
            borderColor: "rgba(139, 195, 74, 0.3)",
          }}
        >
          <Ionicons name="ribbon-outline" size={46} color="#8BC34A" />
        </Box>

        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: isDark ? "#E5E7EB" : "#374151",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Your Home Course Handicap
        </Text>

        {/* Big Handicap Display */}
        <Text
          style={{
            fontSize: 48,
            fontWeight: "900",
            color: "#8BC34A",
            marginBottom: 16,
            letterSpacing: -1,
          }}
        >
          {profile?.handicap !== undefined && profile?.handicap !== null
            ? profile.handicap
            : "--"}
        </Text>

        {/* Course Details Block */}
        <Box
          className="w-full rounded-2xl p-4 mb-6 border"
          style={{
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.05)",
          }}
        >
          <VStack space="sm">
            <HStack className="justify-between items-center py-1">
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#9CA3AF" : "#6B7280",
                }}
              >
                Home Course
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isDark ? "#FFFFFF" : "#111827",
                  maxWidth: "60%",
                  textAlign: "right",
                }}
                numberOfLines={1}
              >
                {homeCourseDisplay}
              </Text>
            </HStack>

            <View
              style={{
                height: 1,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.04)",
              }}
            />

            <HStack className="justify-between items-center py-1">
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#9CA3AF" : "#6B7280",
                }}
              >
                Declared Handicap
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isDark ? "#FFFFFF" : "#111827",
                }}
              >
                {profile?.handicap ?? "--"}
              </Text>
            </HStack>

            <View
              style={{
                height: 1,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.04)",
              }}
            />

            <HStack className="justify-between items-center py-1">
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#9CA3AF" : "#6B7280",
                }}
              >
                Handicap Index
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isDark ? "#FFFFFF" : "#111827",
                }}
              >
                {profile?.handicapIndex !== undefined &&
                profile?.handicapIndex !== null
                  ? profile.handicapIndex.toFixed(1)
                  : "Not Available"}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Download Certificate Action Button */}
        <Pressable
          onPress={handleDownloadCertificate}
          disabled={loading}
          style={{ width: "100%", borderRadius: 9999 }}
        >
          <LinearGradient
            colors={["#8bc34a", "#558b2f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              paddingVertical: 14,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#8bc34a",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "white",
                    fontWeight: "800",
                    fontSize: 15,
                  }}
                >
                  Download Certificate
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Box>

      {/* HC CERTIFICATE MODAL */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowModal(false)}
          />

          <Box
            style={{
              width: "100%",
              maxWidth: 500,
              backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
              borderRadius: 24,
              maxHeight: SCREEN_HEIGHT * 0.85,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 18,
              elevation: 10,
              zIndex: 1,
            }}
          >
            {/* Modal Header */}
            <HStack
              className="px-5 py-4 border-b items-center justify-between"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              }}
            >
              <HStack className="items-center" space="xs">
                <Ionicons name="ribbon" size={18} color="#8BC34A" />
                <Text
                  className="font-bold text-base ml-1"
                  style={{ color: isDark ? "#fff" : "#111" }}
                >
                  Handicap Certificate
                </Text>
              </HStack>
              <Pressable
                onPress={() => setShowModal(false)}
                style={{
                  padding: 4,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "#F3F4F6",
                  borderRadius: 12,
                }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#fff" : "#6b7280"}
                />
              </Pressable>
            </HStack>

            {/* Modal Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 18 }}
            >
              <View
                style={{
                  borderWidth: 2.5,
                  borderColor: isDark ? "#22c55e" : "#198754",
                  borderRadius: 16,
                  padding: 20,
                  backgroundColor: isDark ? "#121214" : "#ffffff",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Watermark opacity={0.06} />

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    textAlign: "center",
                    marginBottom: 20,
                    color: isDark ? "#FFFFFF" : "#111827",
                    letterSpacing: 0.5,
                  }}
                >
                  WHOMSOEVER IT MAY CONCERN
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 22,
                    textAlign: "left",
                    marginBottom: 14,
                    color: isDark ? "#E5E7EB" : "#374151",
                  }}
                >
                  It is to certify that Mr./Mrs./Master{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.name}
                  </Text>
                  , Membership No.{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    #{certificateData?.membershipNo}
                  </Text>
                  , of{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.golfCourse}
                  </Text>
                  .
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 22,
                    textAlign: "left",
                    marginBottom: 14,
                    color: isDark ? "#E5E7EB" : "#374151",
                  }}
                >
                  His/Her HC is{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.handicap}
                  </Text>{" "}
                  as on{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.date}
                  </Text>{" "}
                  and his/her HC Index is{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.handicapIndex}
                  </Text>{" "}
                  for Slope{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.slope}
                  </Text>{" "}
                  and Rating{" "}
                  <Text
                    style={{
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {certificateData?.rating}
                  </Text>
                  .
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 22,
                    textAlign: "left",
                    marginBottom: 18,
                    color: isDark ? "#E5E7EB" : "#374151",
                  }}
                >
                  This is as per his/her scores submitted online.
                </Text>

                <Text
                  style={{
                    fontSize: 11,
                    fontStyle: "italic",
                    textAlign: "left",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    lineHeight: 16,
                  }}
                >
                  Note: This is an online-generated certificate
                  {certificateData?.showCourseApproval
                    ? " and is approved by the course"
                    : ""}
                  . No stamp or signature is required.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <Box
              className="p-4 border-t"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
                backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
              }}
            >
              <HStack space="sm" className="items-center">
                <Pressable
                  onPress={handleSharePdf}
                  disabled={downloading}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "#F3F4F6",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)",
                  }}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#8BC34A" />
                  ) : (
                    <>
                      <Ionicons
                        name="share-social-outline"
                        size={17}
                        color={isDark ? "#D1D5DB" : "#374151"}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          color: isDark ? "#D1D5DB" : "#374151",
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        Share PDF
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={handlePrintPdf}
                  style={{ flex: 1.3, borderRadius: 12 }}
                >
                  <LinearGradient
                    colors={["#8bc34a", "#558b2f"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 11,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#8bc34a",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <Ionicons
                      name="print-outline"
                      size={17}
                      color="white"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      Print / Save PDF
                    </Text>
                  </LinearGradient>
                </Pressable>
              </HStack>
            </Box>
          </Box>
        </View>
      </Modal>
    </ScrollView>
  );
}
