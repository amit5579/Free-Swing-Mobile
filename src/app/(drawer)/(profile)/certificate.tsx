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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { useEffect, useState, useRef } from "react";
import { getCertificateByUserId } from "@/api/profile";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Skeleton } from "@/components/Skeleton";
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
// import { generateCertificateHTML } from "@/utils/certificateTemplate";
import { Image } from "expo-image";
import { Alert } from "react-native";

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
        onBackPress
      );

      return () => backHandler.remove();
    }, [handleBack])
  );

  const [userCertificate, setUserCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watermarkUri, setWatermarkUri] = useState<string>("");
  const [logoUri, setLogoUri] = useState<string>("");

  const loadCertificateAssets = async () => {
    try {
      console.log("Starting to load certificate assets...");

      const watermarkAsset = Asset.fromModule(require("../../../../assets/images/freeswing-watermark.png"));
      await watermarkAsset.downloadAsync();
      const watermarkLocalUri = watermarkAsset.localUri || watermarkAsset.uri;

      if (watermarkLocalUri) {
        const watermarkBase64 = await FileSystem.readAsStringAsync(watermarkLocalUri, {
          encoding: "base64",
        });
        setWatermarkUri(`data:image/png;base64,${watermarkBase64}`);
        console.log("Watermark loaded successfully");
      }

      // Load logo
      const logoAsset = Asset.fromModule(require("../../../../assets/FreeSwing.png"));
      await logoAsset.downloadAsync();
      const logoLocalUri = logoAsset.localUri || logoAsset.uri;

      if (logoLocalUri) {
        const logoBase64 = await FileSystem.readAsStringAsync(logoLocalUri, {
          encoding: "base64",
        });
        setLogoUri(`data:image/png;base64,${logoBase64}`);
        console.log("Logo loaded successfully");
      }
    } catch (error) {
      console.log("Certificate asset load error:", error);
    }
  };

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
    loadCertificateAssets();
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
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share Handicap Certificate'
      });
    } catch (error) {
      console.log("Share Error:", error);
      Alert.alert("Error", "Could not generate certificate for sharing.");
    }
  };

  const CertificateSkeleton = () => {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }} edges={["top", "left", "right"]}>
        <ThemedView className="flex-1 px-5">
          <HStack className="items-center my-6">
            <Skeleton isDark={isDark} height={40} width={40} borderRadius={20} />
            <Skeleton isDark={isDark} height={24} width="50%" borderRadius={4} style={{ marginLeft: 12 }} />
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Box className="rounded-2xl p-4 mb-6 bg-white/5 border border-white/5">
              <VStack className="items-center mb-6">
                <Skeleton isDark={isDark} height={18} width="30%" borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} height={28} width="50%" borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton isDark={isDark} height={12} width="40%" borderRadius={4} />
              </VStack>

              <Divider style={{ marginBottom: 20, opacity: 0.1 }} />

              <Skeleton isDark={isDark} height={20} width="60%" style={{ alignSelf: 'center', marginBottom: 20 }} />

              <VStack style={{ marginBottom: 24 }}>
                <Skeleton isDark={isDark} height={14} width="30%" style={{ marginBottom: 10 }} />
                <Skeleton isDark={isDark} height={32} width="80%" style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} height={14} width="50%" />
              </VStack>

              <Box className="rounded-xl p-5 mb-6 bg-white/5 border border-white/5">
                <HStack className="justify-between items-center mb-4">
                  <VStack className="items-center flex-1">
                    <Skeleton isDark={isDark} height={12} width="30%" style={{ marginBottom: 8 }} />
                    <Skeleton isDark={isDark} height={24} width="50%" />
                  </VStack>
                  <Skeleton isDark={isDark} height={30} width={1} />
                  <VStack className="items-center flex-1">
                    <Skeleton isDark={isDark} height={12} width="30%" style={{ marginBottom: 8 }} />
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

              <Skeleton isDark={isDark} height={14} width="90%" style={{ alignSelf: 'center', marginBottom: 10 }} />
              <Skeleton isDark={isDark} height={14} width="70%" style={{ alignSelf: 'center' }} />

              <HStack className="justify-between items-end mt-10">
                <VStack>
                  <Skeleton isDark={isDark} height={2} width={100} style={{ marginBottom: 6 }} />
                  <Skeleton isDark={isDark} height={10} width={80} />
                </VStack>
                <Skeleton isDark={isDark} height={60} width={60} borderRadius={30} />
              </HStack>
            </Box>

            <HStack style={{ gap: 10, marginTop: 10 }}>
              <Skeleton isDark={isDark} height={44} width="25%" borderRadius={12} />
              <Skeleton isDark={isDark} height={44} width="35%" borderRadius={12} />
              <Skeleton isDark={isDark} height={44} width="35%" borderRadius={12} />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }} edges={["top", "left", "right"]}>
      <ThemedView className="flex-1 px-5">
        <HStack className="items-center my-6">
          <Pressable onPress={handleBack} hitSlop={20} style={{ padding: 10, borderRadius: 50, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9" }}>
            <Ionicons name="arrow-back-outline" size={24} color="#8BC34A" />
          </Pressable>
          <ThemedText style={{ fontSize: 20, fontWeight: "700", marginLeft: 12 }}>
            Handicap Certificate
          </ThemedText>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
                position: 'relative',
                overflow: 'hidden',
                minHeight: 400,
                justifyContent: 'center'
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

              <VStack className="items-center">

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

                <Image
                  source={require("../../../../assets/FreeSwing.png")}
                  style={{
                    width: 110,
                    height: 110,
                    resizeMode: "contain",
                    // marginBottom: 8,
                    opacity: 0.95,
                  }}
                />

                {/* <ThemedText
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
                </ThemedText> */}
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
                  <Text style={{ fontSize: 12, color: isDark ? "#888" : "#666", letterSpacing: 0.5 }}>
                    Membership No: <Text style={{ fontWeight: '800', color: '#8BC34A' }}>#{userCertificate?.membershipNo}</Text>
                  </Text>
                </View>
              </VStack>

              <View style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(139, 195, 74, 0.05)',
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(139,195,74,0.1)',
                marginBottom: 20
              }}>
                <HStack className="justify-between items-center">
                  <VStack className="items-center flex-1">
                    <Text style={{ fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 4 }}>HC INDEX</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#8BC34A' }}>{userCertificate?.handicapIndex}</Text>
                  </VStack>
                  <View style={{ width: 1, height: 30, backgroundColor: '#ddd', opacity: 0.4 }} />
                  <VStack className="items-center flex-1">
                    <Text style={{ fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 4 }}>HANDICAP</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#8BC34A' }}>{userCertificate?.handicap}</Text>
                  </VStack>
                </HStack>

                <Divider style={{ marginVertical: 12, opacity: 0.1 }} />

                <HStack className="justify-between">
                  <Text style={{ fontSize: 11, color: '#888' }}>Slope: <Text style={{ fontWeight: '800', color: isDark ? '#fff' : '#444' }}>{userCertificate?.slope}</Text></Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>Rating: <Text style={{ fontWeight: '800', color: isDark ? '#fff' : '#444' }}>{userCertificate?.rating}</Text></Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>Holes: <Text style={{ fontWeight: '800', color: isDark ? '#fff' : '#444' }}>{userCertificate?.completedHolesCount || 0}</Text></Text>
                </HStack>
              </View>

              <Text
                style={{
                  fontSize: 11,
                  fontStyle: 'italic',
                  color: isDark ? "#888" : "#666",
                  textAlign: 'center',
                  lineHeight: 18,
                  marginBottom: 8,
                }}
              >
                {"Issued on "}
                <Text style={{ fontWeight: 'bold' }}>
                  {userCertificate?.date}
                </Text>
                {" for scores submitted at "}
                {userCertificate?.golfCourse || "Free Swing"}
                {"."}
              </Text>

                {/* <HStack className="justify-between items-end mt-4">
                  <VStack>
                    <View style={{ width: 100, height: 1.5, backgroundColor: '#8BC34A', marginBottom: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#8BC34A' }}>COURSE OFFICIAL</Text>
                  </VStack>

                  <View style={{ position: 'relative' }}>
                    <Image
                      source={require("../../../../assets/images/freeswing-seal.png")}
                      style={{ width: 90, height: 90 }}
                      contentFit="contain"
                    />
                  </View>
                </HStack> */}

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 8, color: "#aaa", textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  This is an electronically generated document. Valid without physical signature.
                </Text>
              </View>
            </View>
          </ViewShot>

          <HStack style={{ gap: 8, marginTop: 24, alignItems: 'center' }}>
            {/* <Pressable
              onPress={handleBack}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
              }}
            >
              <ThemedText style={{ color: isDark ? "#fff" : "#475569", fontWeight: "600", fontSize: 13 }}>
                Cancel
              </ThemedText>
            </Pressable> */}

            <Pressable
              onPress={shareCertificate}
              style={{
                flex: 1.4,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "white",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderWidth: 1,
                borderColor: "#8BC34A",
              }}
            >
              <Ionicons name="share-social-outline" size={16} color="#8BC34A" />
              <ThemedText style={{ color: "#8BC34A", fontWeight: "600", fontSize: 13 }}>
                Share PDF
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={downloadCertificate}
              style={{
                flex: 1.6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "#8BC34A",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                shadowColor: "#8BC34A",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="download-outline" size={16} color="white" />
              <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                Download
              </ThemedText>
            </Pressable>
          </HStack>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
