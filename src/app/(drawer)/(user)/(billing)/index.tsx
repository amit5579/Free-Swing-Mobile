import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  useColorScheme,
  View,
  FlatList,
  ScrollView,
  RefreshControl,
  Text,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";

import { getMyBills, uploadBillScreenshot } from "@/api/modules/billing.api";

export default function UserBillingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBills(true);
    setRefreshing(false);
  }, []);

  const fetchBills = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data = await getMyBills();
      setBills(data);
    } catch (error) {
      console.error("Error fetching my bills:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(true);
  }, []);

  const handleUploadScreenshot = async (billId: number) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingId(billId);
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "screenshot.jpg";
        const fileType = asset.mimeType || "image/jpeg";
        
        await uploadBillScreenshot(billId, asset.uri, fileType, fileName);
        Toast.show({ type: "success", text1: "Screenshot uploaded successfully. Awaiting verification." });
        fetchBills(false);
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Upload Failed", text2: "Failed to upload screenshot." });
    } finally {
      setUploadingId(null);
    }
  };

  const RenderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => routePage.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#020617"} />
        </Pressable>

        <VStack style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "700",
              marginTop: 2,
              color: isDark ? "#fff" : "#020617",
            }}
          >
            My Bills
          </ThemedText>
        </VStack>

        <View style={{ width: 40 }} />
      </HStack>
    </Box>
  );

  const renderBillItem = ({ item }: any) => {
    const isPaid = item.paymentStatus === "Paid";
    const hasScreenshot = item.paymentScreenshotUrl && item.paymentScreenshotUrl.trim() !== "";
    const isUploading = uploadingId === item.id;
    
    const upiUri = item.subAdmin?.upiId
      ? `upi://pay?pa=${item.subAdmin.upiId}&pn=${encodeURIComponent(item.subAdmin.upiPayeeName || "SubAdmin")}&am=${item.totalAmount}&cu=INR`
      : "";

    const handlePayViaApp = async () => {
      if (!upiUri) {
        Toast.show({ type: "error", text1: "UPI ID not available for this admin." });
        return;
      }
      try {
        const supported = await Linking.canOpenURL(upiUri);
        if (supported) {
          await Linking.openURL(upiUri);
        } else {
          Toast.show({ type: "error", text1: "No UPI app found on your device." });
        }
      } catch (error) {
        Toast.show({ type: "error", text1: "Failed to open UPI app." });
      }
    };
    
    return (
      <Box
        className="p-4 rounded-2xl mb-4"
        style={{
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)",
        }}
      >
        <HStack className="items-center justify-between mb-3">
          <ThemedText style={{ fontWeight: "700", fontSize: 16 }}>Billing Month: {item.billingMonth ? new Date(item.billingMonth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</ThemedText>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: isPaid ? "rgba(34, 197, 94, 0.2)" : "rgba(234, 179, 8, 0.2)",
            }}
          >
            <ThemedText style={{ fontSize: 12, color: isPaid ? "#22c55e" : "#eab308", fontWeight: "600" }}>
              {item.paymentStatus}
            </ThemedText>
          </View>
        </HStack>

        <VStack style={{ gap: 6, marginBottom: 12 }}>
          <HStack style={{ justifyContent: "space-between" }}>
            <ThemedText style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>Subscription</ThemedText>
            <ThemedText style={{ fontSize: 13, fontWeight: "500" }}>₹{item.subscriptionAmount}</ThemedText>
          </HStack>
          <HStack style={{ justifyContent: "space-between" }}>
            <ThemedText style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>IGU Affiliation</ThemedText>
            <ThemedText style={{ fontSize: 13, fontWeight: "500" }}>₹{item.iguAffiliationAmount}</ThemedText>
          </HStack>
          <HStack style={{ justifyContent: "space-between" }}>
            <ThemedText style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>Software Fee</ThemedText>
            <ThemedText style={{ fontSize: 13, fontWeight: "500" }}>₹{item.softwareAutomationAmount}</ThemedText>
          </HStack>
          <View style={{ height: 1, backgroundColor: isDark ? "#334155" : "#e2e8f0", marginVertical: 4 }} />
          <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
            <ThemedText style={{ fontSize: 14, fontWeight: "700" }}>Total Amount</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: "800", color: "#84cc16" }}>₹{item.totalAmount}</ThemedText>
          </HStack>
        </VStack>

        {!isPaid && (
          <VStack style={{ borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#e2e8f0", paddingTop: 12, gap: 12 }}>
            {!!upiUri && (
              <VStack style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
                <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>Scan & Pay</ThemedText>
                <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 12 }}>
                  <QRCode value={upiUri} size={150} />
                </View>
                <ThemedText style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>
                  UPI ID: {item.subAdmin?.upiId}
                </ThemedText>
                <Pressable
                  onPress={handlePayViaApp}
                  style={{
                    backgroundColor: "rgba(132, 204, 22, 0.1)",
                    borderWidth: 1,
                    borderColor: "#84cc16",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Ionicons name="phone-portrait-outline" size={18} color="#84cc16" />
                  <Text style={{ color: "#84cc16", fontWeight: "600" }}>Pay via UPI App</Text>
                </Pressable>
              </VStack>
            )}

            <VStack style={{ borderTopWidth: upiUri ? 1 : 0, borderTopColor: isDark ? "#334155" : "#e2e8f0", paddingTop: upiUri ? 12 : 0 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 8, textAlign: "center" }}>
                {hasScreenshot ? "Awaiting admin approval" : "Upload Payment Screenshot"}
              </Text>
              <Pressable
                onPress={() => handleUploadScreenshot(item.id)}
                disabled={isUploading || hasScreenshot}
                style={{
                  backgroundColor: isUploading ? "#a3e635" : (hasScreenshot ? "transparent" : "#84cc16"),
                  borderWidth: hasScreenshot ? 1 : 0,
                  borderColor: "#84cc16",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {!isUploading && !hasScreenshot && <Ionicons name="cloud-upload-outline" size={18} color="#fff" />}
                <Text style={{ color: hasScreenshot ? "#84cc16" : "#fff", fontWeight: "600" }}>
                  {isUploading ? "Uploading..." : (hasScreenshot ? "Payment Screenshot Uploaded" : "Upload Screenshot")}
                </Text>
              </Pressable>
            </VStack>
          </VStack>
        )}
      </Box>
    );
  };

  const BillSkeleton = () => (
    <Box
      className="p-4 rounded-2xl mb-4"
      style={{
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)",
      }}
    >
      <HStack className="justify-between mb-4">
        <Skeleton isDark={isDark} height={18} width="50%" />
        <Skeleton isDark={isDark} height={20} width={60} borderRadius={8} />
      </HStack>
      <Skeleton isDark={isDark} height={14} width="100%" style={{ marginBottom: 8 }} />
      <Skeleton isDark={isDark} height={14} width="100%" style={{ marginBottom: 8 }} />
      <Skeleton isDark={isDark} height={14} width="100%" style={{ marginBottom: 12 }} />
      <HStack className="justify-between">
        <Skeleton isDark={isDark} height={16} width="30%" />
        <Skeleton isDark={isDark} height={22} width="30%" />
      </HStack>
    </Box>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#ffffff" }}>
      <RenderHeader />
      <Watermark />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8BC34A"]} />}
      >
        <VStack className="px-4 pb-20 pt-4">
          {/* <ThemedText style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 16 }}>
            View and pay your monthly generation bills. Upload payment screenshots to notify admins.
          </ThemedText> */}

          {loading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => <BillSkeleton key={i} />)}
            </>
          ) : bills.length === 0 ? (
            <VStack style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="receipt-outline" size={40} color={isDark ? "#334155" : "#cbd5e1"} />
              <ThemedText style={{ marginTop: 12, opacity: 0.7 }}>You have no bills at the moment.</ThemedText>
            </VStack>
          ) : (
            <FlatList
              data={bills}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBillItem}
              scrollEnabled={false}
            />
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
