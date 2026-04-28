import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { useEffect, useState, useRef } from "react";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Skeleton } from "@/components/Skeleton";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import { getPlayerCertificateById } from "@/api/modules/subAdmin/myPlayers.api";

export default function PlayerCertificatePage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const certificateRef = useRef<any>(null);
  const { userId } = useLocalSearchParams();

  const [userCertificate, setUserCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watermarkBase64, setWatermarkBase64] = useState<string>("");

  const loadWatermark = async () => {
    try {
      const asset = Asset.fromModule(
        require("/assets/images/freeswing-watermark.png"),
      );
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: "base64",
      });
      setWatermarkBase64(`data:image/png;base64,${base64}`);
    } catch (error) {
      console.log("Watermark Load Error:", error);
    }
  };

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const certificate = await getPlayerCertificateById(Number(userId));
      setUserCertificate(certificate);
    } catch (error) {
      console.error("Failed to fetch certificate", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
    loadWatermark();
  }, []);

  const downloadCertificate = async () => {
    try {
      if (!certificateRef.current) return;

      const base64 = await captureRef(certificateRef, {
        format: "png",
        quality: 1,
        result: "base64",
        width: 2000, // HD Resolution
      });

      const html = `
         <html>
           <head>
             <style>
               @page { size: auto; margin: 0mm; }
               body { margin: 0; padding: 50px 0; background-color: white; display: flex; justify-content: center; align-items: flex-start; }
               img { width: 100%; height: auto; max-width: 90vw; max-height: 90vh; object-fit: contain; }
             </style>
           </head>
           <body>
             <img src="data:image/png;base64,${base64}" />
           </body>
         </html>
       `;

      await Print.printAsync({ html });
    } catch (error) {
      console.log("Download Error:", error);
      Alert.alert("Error", "Could not generate certificate download.");
    }
  };

  const shareCertificate = async () => {
    try {
      if (!certificateRef.current) return;

      const base64 = await captureRef(certificateRef, {
        format: "png",
        quality: 1,
        result: "base64",
        width: 2000, // HD Resolution
      });

      const html = `
         <html>
           <head>
             <style>
               @page { size: auto; margin: 0mm; }
               body { margin: 0; padding: 50px 0; background-color: white; display: flex; justify-content: center; align-items: flex-start; }
               img { width: 100%; height: auto; max-width: 90vw; max-height: 90vh; object-fit: contain; }
             </style>
           </head>
           <body>
             <img src="data:image/png;base64,${base64}" />
           </body>
         </html>
       `;

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
            <Box className="rounded-2xl p-4 mb-6 bg-white/5 border border-white/5">
              <VStack className="items-center mb-6">
                <Skeleton
                  isDark={isDark}
                  height={18}
                  width="30%"
                  borderRadius={4}
                  style={{ marginBottom: 8 }}
                />
                <Skeleton
                  isDark={isDark}
                  height={28}
                  width="50%"
                  borderRadius={4}
                  style={{ marginBottom: 6 }}
                />
                <Skeleton
                  isDark={isDark}
                  height={12}
                  width="40%"
                  borderRadius={4}
                />
              </VStack>

              <Divider style={{ marginBottom: 20, opacity: 0.1 }} />

              <Skeleton
                isDark={isDark}
                height={20}
                width="60%"
                style={{ alignSelf: "center", marginBottom: 20 }}
              />

              <VStack style={{ marginBottom: 24 }}>
                <Skeleton
                  isDark={isDark}
                  height={14}
                  width="30%"
                  style={{ marginBottom: 10 }}
                />
                <Skeleton
                  isDark={isDark}
                  height={32}
                  width="80%"
                  style={{ marginBottom: 8 }}
                />
                <Skeleton isDark={isDark} height={14} width="50%" />
              </VStack>

              <Box className="rounded-xl p-5 mb-6 bg-white/5 border border-white/5">
                <HStack className="justify-between items-center mb-4">
                  <VStack className="items-center flex-1">
                    <Skeleton
                      isDark={isDark}
                      height={12}
                      width="30%"
                      style={{ marginBottom: 8 }}
                    />
                    <Skeleton isDark={isDark} height={24} width="50%" />
                  </VStack>
                  <Skeleton isDark={isDark} height={30} width={1} />
                  <VStack className="items-center flex-1">
                    <Skeleton
                      isDark={isDark}
                      height={12}
                      width="30%"
                      style={{ marginBottom: 8 }}
                    />
                    <Skeleton isDark={isDark} height={24} width="50%" />
                  </VStack>
                </HStack>
                <Divider style={{ marginBottom: 16, opacity: 0.1 }} />
                <HStack className="justify-between">
                  <Skeleton isDark={isDark} height={12} width="25%" />
                  <Skeleton isDark={isDark} height={12} width="25%" />
                  <Skeleton isDark={isDark} height={12} width="25%" />
                </HStack>
              </Box>

              <Skeleton
                isDark={isDark}
                height={14}
                width="90%"
                style={{ alignSelf: "center", marginBottom: 10 }}
              />
              <Skeleton
                isDark={isDark}
                height={14}
                width="70%"
                style={{ alignSelf: "center" }}
              />

              <HStack className="justify-between items-end mt-10">
                <VStack>
                  <Skeleton
                    isDark={isDark}
                    height={2}
                    width={100}
                    style={{ marginBottom: 6 }}
                  />
                  <Skeleton isDark={isDark} height={10} width={80} />
                </VStack>
                <Skeleton
                  isDark={isDark}
                  height={60}
                  width={60}
                  borderRadius={30}
                />
              </HStack>
            </Box>

            <HStack style={{ gap: 12 }}>
              <Skeleton
                isDark={isDark}
                height={54}
                width="75%"
                borderRadius={14}
              />
              <Skeleton
                isDark={isDark}
                height={54}
                width={64}
                borderRadius={14}
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

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}>
      <ThemedView className="flex-1 px-5">
        <HStack className="justify-between items-center my-2">
          <Pressable
            onPress={() => router.back()}
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
          <View style={{ width: 50 }} />
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
                borderWidth: 2,
                borderColor: "#8BC34A",
                borderRadius: 16,
                padding: 16,
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
                position: "relative",
                overflow: "hidden",
                minHeight: 400,
                justifyContent: "center",
              }}
            >
              <Watermark opacity={0.25} />

              {/* <VStack className="items-center mb-6">
                <View style={{ backgroundColor: '#8BC34A', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, marginBottom: 8 }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 2 }}>OFFICIAL DOCUMENT</Text>
                </View>
                <ThemedText style={{ fontSize: 24, fontWeight: "900", color: "#8BC34A", letterSpacing: 1 }}>FREE SWING</ThemedText>
                <ThemedText style={{ fontSize: 11, fontWeight: "700", opacity: 0.6, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>Gold Handicap League</ThemedText>
              </VStack> */}

              {/* <ThemedText
                style={{
                  textAlign: "center",
                  fontWeight: "900",
                  fontSize: 18,
                  marginBottom: 20,
                  color: "#8BC34A",
                  letterSpacing: 2,
                  textDecorationLine: 'underline'
                }}
              >
                HANDICAP CERTIFICATE
              </ThemedText> */}

              <VStack className="items-center mb-4">
                <Image
                  source={require("/assets/FreeSwing.png")}
                  style={{
                    width: 110,
                    height: 110,
                    resizeMode: "contain",
                    // marginBottom: 8,
                    opacity: 0.95,
                  }}
                />

                <ThemedText
                  style={{
                    textAlign: "center",
                    fontWeight: "900",
                    fontSize: 18,
                    color: "#8BC34A",
                    letterSpacing: 2,
                    textDecorationLine: "underline",
                  }}
                >
                  HANDICAP CERTIFICATE
                </ThemedText>
              </VStack>

              <VStack className="items-center mb-6">
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#aaa" : "#666",
                    textAlign: "center",
                    marginBottom: 2,
                  }}
                >
                  Mr. / Mrs. / Master
                </Text>

                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "900",
                    color: isDark ? "#fff" : "#000",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {userCertificate?.name}
                </Text>

                <View
                  style={{
                    height: 2,
                    width: 200,
                    backgroundColor: "#8BC34A",
                    marginTop: 10,
                    opacity: 0.4,
                    borderRadius: 2,
                  }}
                />

                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? "#888" : "#666",
                      letterSpacing: 0.5,
                    }}
                  >
                    Membership No:{" "}
                    <Text style={{ fontWeight: "800", color: "#8BC34A" }}>
                      #{userCertificate?.membershipNo}
                    </Text>
                  </Text>
                </View>
              </VStack>

              <View
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.01)"
                    : "rgba(139, 195, 74, 0.05)",
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(139,195,74,0.1)",
                  marginBottom: 20,
                }}
              >
                <HStack className="justify-between items-center">
                  <VStack className="items-center flex-1">
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#888",
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      HC INDEX
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "900",
                        color: "#8BC34A",
                      }}
                    >
                      {userCertificate?.handicapIndex}
                    </Text>
                  </VStack>
                  <View
                    style={{
                      width: 1,
                      height: 30,
                      backgroundColor: "#ddd",
                      opacity: 0.4,
                    }}
                  />
                  <VStack className="items-center flex-1">
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#888",
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      HANDICAP
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "900",
                        color: "#8BC34A",
                      }}
                    >
                      {userCertificate?.handicap}
                    </Text>
                  </VStack>
                </HStack>

                <Divider style={{ marginVertical: 12, opacity: 0.1 }} />

                <HStack className="justify-between">
                  <Text style={{ fontSize: 11, color: "#888" }}>
                    Slope:{" "}
                    <Text
                      style={{
                        fontWeight: "800",
                        color: isDark ? "#fff" : "#444",
                      }}
                    >
                      {userCertificate?.slope}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: "#888" }}>
                    Rating:{" "}
                    <Text
                      style={{
                        fontWeight: "800",
                        color: isDark ? "#fff" : "#444",
                      }}
                    >
                      {userCertificate?.rating}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: "#888" }}>
                    Holes:{" "}
                    <Text
                      style={{
                        fontWeight: "800",
                        color: isDark ? "#fff" : "#444",
                      }}
                    >
                      {userCertificate?.completedHolesCount || 0}
                    </Text>
                  </Text>
                </HStack>
              </View>

              <Text
                style={{
                  fontSize: 11,
                  fontStyle: "italic",
                  color: isDark ? "#888" : "#666",
                  textAlign: "center",
                  lineHeight: 18,
                  marginBottom: 8,
                }}
              >
                {"Issued on "}
                <Text style={{ fontWeight: "bold" }}>
                  {userCertificate?.date}
                </Text>
                {" for scores submitted at "}
                {userCertificate?.golfCourse || "Free Swing"}
                {"."}
              </Text>

              {userCertificate?.showCourseApproval && (
                <HStack className="justify-between items-end mt-4">
                  <VStack>
                    <View
                      style={{
                        width: 100,
                        height: 1.5,
                        backgroundColor: "#8BC34A",
                        marginBottom: 4,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: "#8BC34A",
                      }}
                    >
                      COURSE OFFICIAL
                    </Text>
                  </VStack>

                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 27,
                      borderWidth: 4,
                      borderColor: "rgba(139, 195, 74, 0.15)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        borderStyle: "dashed",
                        borderWidth: 1,
                        borderColor: "#8BC34A",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color="#8BC34A"
                      />
                    </View>
                  </View>
                </HStack>
              )}

              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 8,
                    color: "#aaa",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  This is an electronically generated document. Valid without
                  physical signature.
                </Text>
              </View>
            </View>
          </ViewShot>

          <VStack style={{ gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={downloadCertificate}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                backgroundColor: "#8BC34A",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: "#8BC34A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Download Certificate
              </Text>
            </Pressable>

            <HStack style={{ gap: 12 }}>
              <Pressable
                onPress={() => router.back()}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#fff" : "#475569",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={shareCertificate}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "white",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#8BC34A",
                }}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color="#8BC34A"
                />
                <Text
                  style={{ color: "#8BC34A", fontWeight: "700", fontSize: 16 }}
                >
                  Share as PDF
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </ScrollView>
      </ThemedView>
    </View>
  );
}
