import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, ScrollView, RefreshControl, Linking, Image } from "react-native";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSubAdminList } from "@/api/modules/admin/subAdmins.api";
import { getDrivingRangeSlots, bookDrivingRangeSlot, uploadScreenshot } from "@/api/modules/drivingRange.api";
import { getProfile } from "@/api/modules/profile.api";
import ImageCropPicker from "react-native-image-crop-picker";

export default function DrivingRangeBookingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const [ranges, setRanges] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [slotsData, setSlotsData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [numberOfSlots, setNumberOfSlots] = useState<number>(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentPendingBookingId, setPaymentPendingBookingId] = useState<number | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [upiIntentUrl, setUpiIntentUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  }, [availableDates, selectedDateIndex, selectedRange]);

  const fetchSlots = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);

      const rangesResponse = await getSubAdminList();
      
      const formattedRanges = rangesResponse.map((r: any) => ({
        label: `${r.username} Range`,
        value: r.id,
        username: r.username,
        upiId: r.upiId,
        upiPayeeName: r.upiPayeeName,
      }));

      setRanges(formattedRanges);

      let currentRangeId = selectedRange;
      if (formattedRanges.length > 0 && !selectedRange) {
        currentRangeId = formattedRanges[0].value;
        setSelectedRange(currentRangeId);
      }

      if (currentRangeId && availableDates.length > 0) {
        const slotsDetails = await getDrivingRangeSlots(
          availableDates[selectedDateIndex],
          currentRangeId,
        );
        setSlotsData(slotsDetails);
      }
    } catch (error) {
      console.error("Error fetching driving range slots:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getProfile();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const today = new Date();
    const arr = [];

    for (let i = 0; i < 4; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      arr.push(formatDate(newDate));
    }

    setAvailableDates(arr);
  }, []);

  useEffect(() => {
    if (availableDates.length > 0) {
      fetchSlots();
    }
  }, [availableDates, selectedDateIndex, selectedRange]);

  const calculatePricePerSlot = (user: any, subAdminId: number) => {
    if (!user) return 567;
    if (user.invitedBySubAdminId === subAdminId) return 123;
    const category = user.memberCategory;
    if (category === "Defence" || category === "Affiliated") return 444;
    return 567;
  };

  const getPricingCategory = (user: any, subAdminId: number) => {
    if (!user) return "Civil";
    if (user.invitedBySubAdminId === subAdminId) return "Same Range Member";
    const category = user.memberCategory;
    if (category === "Defence" || category === "Affiliated") return "Discounted Admin Members";
    return "Civil";
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !selectedRange || numberOfSlots < 1) return;
    setBookingLoading(true);
    try {
      const pricePerSlot = calculatePricePerSlot(currentUser, selectedRange);
      const totalAmount = pricePerSlot * numberOfSlots;
      const refId = `DRB-${Date.now()}`;
      
      const payload = {
        date: availableDates[selectedDateIndex],
        numberOfSlots,
        paymentReferenceId: refId,
        subAdminId: selectedRange,
        time: selectedSlot.time,
        totalAmount
      };
      
      const subAdmin = ranges.find(s => s.value === selectedRange);
      const username = subAdmin?.username || "test";
      const upiId = subAdmin?.upiId || `${username.replace(/\s+/g, '').toLowerCase()}@upi`;
      const payeeName = subAdmin?.upiPayeeName || username;
      const intentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&tr=${refId}&am=${totalAmount}&cu=INR`;
      setUpiIntentUrl(intentUrl);
      
      const response = await bookDrivingRangeSlot(payload);
      
      setPaymentPendingBookingId(response.bookingId || response.id);
      setPaymentPending(true);
      
      Toast.show({ type: "info", text1: "Please complete payment via UPI." });
      
      setTimeout(async () => {
        try {
          const supported = await Linking.canOpenURL(intentUrl);
          if (supported) {
            await Linking.openURL(intentUrl);
          } else {
            Toast.show({ type: "error", text1: "UPI App Not Found", text2: "Please scan the QR code instead." });
          }
        } catch (error) {
          Toast.show({ type: "error", text1: "Error opening UPI app" });
        }
      }, 1500);

      fetchSlots(false);
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Booking Failed", text2: "An error occurred while booking." });
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePickAndUploadScreenshot = async () => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: true,
        cropperChooseText: "Done/Submit",
        cropperToolbarTitle: "Edit Image",
      });

      setIsUploading(true);
      const fileName = result.filename || result.path.split("/").pop() || "screenshot.jpg";
      const fileType = result.mime || "image/jpeg";
      
      if (paymentPendingBookingId) {
        const res = await uploadScreenshot(paymentPendingBookingId, result.path, fileType, fileName);
        setPaymentScreenshotUrl(res.url || "uploaded");
        Toast.show({ type: "success", text1: "Screenshot uploaded successfully. Awaiting verification." });
      }
    } catch (err: any) {
      if (err.code !== "E_PICKER_CANCELLED") {
        console.error(err);
        Toast.show({ type: "error", text1: "Upload Failed", text2: "Failed to upload screenshot." });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <HStack
            style={{
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
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "#fff" : "#020617"}
              />
            </Pressable>

            <ThemedText
              numberOfLines={1}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#fff" : "#020617",
                paddingHorizontal: 8,
              }}
            >
              Driving Range Booking
            </ThemedText>

            <View style={{ width: 40 }} />
          </HStack>

          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
            }}
          >
            Choose your range, date, and practice slot
          </ThemedText>
        </VStack>
      </Box>
    );
  };

  const DateSectionSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <ThemedView
        style={{
          backgroundColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(229, 231, 235, 0.6)",
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}
        className="mb-6 rounded-xl"
      >
        <Skeleton
          isDark={isDark}
          height={16}
          width="40%"
          style={{ alignSelf: "center", marginBottom: 12 }}
        />

        <HStack style={{ justifyContent: "space-between" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={36}
              width="22%"
              borderRadius={10}
            />
          ))}
        </HStack>

        <HStack style={{ marginTop: 12 }}>
          <Skeleton
            isDark={isDark}
            height={40}
            width="75%"
            borderRadius={8}
            style={{ marginRight: 10 }}
          />
          <Skeleton isDark={isDark} height={40} width={40} borderRadius={10} />
        </HStack>
      </ThemedView>
    );
  };

  const SlotsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <HStack style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            isDark={isDark}
            height={70}
            width="23%"
            borderRadius={10}
            style={{ marginBottom: 10 }}
          />
        ))}
      </HStack>
    );
  };

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        <RenderHeader />
        <Watermark />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack className="px-4 pt-5 pb-20">
            <ThemedView
              style={{
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.5)"
                  : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 12,
                shadowColor: "#000",
              }}
              className="mb-6"
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 16,
                  color: isDark ? "#94a3b8" : "#64748b",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Select Date
              </ThemedText>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {availableDates.map((date: string, index: number) => {
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dayNumber = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                  });
                  const active = selectedDateIndex === index;

                  return (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedDateIndex(index)}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 15,
                        alignItems: "center",
                        minWidth: 70,
                        backgroundColor: active
                          ? "#8BC34A"
                          : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "#f8fafc",
                        borderWidth: 1,
                        borderColor: active
                          ? "#8BC34A"
                          : isDark
                            ? "rgba(255,255,255,0.1)"
                            : "#e2e8f0",
                        shadowColor: active ? "#8BC34A" : "transparent",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: active ? 4 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: active
                            ? "rgba(255,255,255,0.9)"
                            : isDark
                              ? "#94a3b8"
                              : "#64748b",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {dayName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "800",
                          color: active
                            ? "#fff"
                            : isDark
                              ? "#f1f5f9"
                              : "#1e293b",
                        }}
                      >
                        {dayNumber}
                      </Text>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "600",
                          color: active
                            ? "rgba(255,255,255,0.8)"
                            : isDark
                              ? "#64748b"
                              : "#94a3b8",
                        }}
                      >
                        {monthName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <HStack
                style={{
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <Dropdown
                  style={{
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 40,
                    borderColor: isDark ? "#333" : "#ddd",
                    flex: 1,
                    marginRight: 10,
                  }}
                  placeholderStyle={{ color: isDark ? "#777" : "#999", fontSize: 14 }}
                  selectedTextStyle={{ color: isDark ? "white" : "black", fontSize: 14 }}
                  containerStyle={{
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    borderColor: isDark ? "#333" : "#ddd",
                  }}
                  itemTextStyle={{ color: isDark ? "white" : "black", fontSize: 14 }}
                  activeColor={isDark ? "#333" : "#f0f0f0"}
                  data={ranges}
                  labelField="label"
                  valueField="value"
                  mode="modal"
                  placeholder="Select Range"
                  value={selectedRange}
                  onChange={(item) => {                    
                    setSelectedRange(item.value);
                  }}
                />
                <Pressable
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: "#8BC34A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => fetchSlots()}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                </Pressable>
              </HStack>
            </ThemedView>

            <ThemedView
               style={{
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.5)"
                  : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 16,
                shadowColor: "#000",
              }}
            >
              <HStack style={{ alignItems: "center", marginBottom: 16, gap: 6 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#8BC34A" />
                <ThemedText style={{ fontSize: 14, fontWeight: "700" }}>Available Slots</ThemedText>
              </HStack>

              <Box>
                {loading ? (
                  <SlotsSkeleton isDark={isDark} />
                ) : (
                  <HStack style={{ flexWrap: "wrap", gap: 10, justifyContent: "flex-start" }}>
                    {slotsData?.map((slot: any) => (
                      <Pressable
                        key={slot.time}
                        onPress={() => {
                          if (slot.availableSeats > 0) {
                            setSelectedSlot(slot);
                            setNumberOfSlots(1);
                          }
                        }}
                        style={{
                          width: "31%", // roughly 3 per row for mobile instead of 4
                          paddingVertical: 12,
                          borderRadius: 10,
                          backgroundColor: slot.availableSeats === 0 
                            ? (isDark ? "rgba(255, 255, 255, 0.02)" : "#f1f5f9") 
                            : (isDark ? "rgba(255, 255, 255, 0.05)" : "#fff"),
                          borderWidth: 1,
                          borderColor: slot.availableSeats === 0 
                            ? (isDark ? "rgba(255, 255, 255, 0.05)" : "#cbd5e1") 
                            : (isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0"),
                          alignItems: "center",
                          opacity: slot.availableSeats === 0 ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "700", color: slot.availableSeats === 0 ? (isDark ? "#64748b" : "#94a3b8") : (isDark ? "#fff" : "#111") }}>
                          {slot.time}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: slot.availableSeats === 0 ? "#ef4444" : "#8BC34A", marginTop: 4 }}>
                          {slot.availableSeats === 0 ? "Expired" : `${slot.availableSeats} slots left`}
                        </Text>
                      </Pressable>
                    ))}

                    {slotsData?.length === 0 && (
                      <Text
                        style={{
                          textAlign: "center",
                          width: "100%",
                          marginTop: 20,
                          color: isDark ? "#94a3b8" : "#6b7280",
                        }}
                      >
                        No slots available for this date and range
                      </Text>
                    )}
                  </HStack>
                )}
              </Box>
            </ThemedView>
          </VStack>
        </ScrollView>
        {selectedSlot && (
          <Box
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: isDark ? "#1e293b" : "#fff",
              borderTopWidth: 1,
              borderTopColor: isDark ? "#334155" : "#e2e8f0",
              padding: 16,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <HStack style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <VStack>
                <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>Confirm Booking</ThemedText>
                <ThemedText style={{ fontSize: 14, color: isDark ? "#cbd5e1" : "#475569", marginTop: 4 }}>
                  Time: {selectedSlot.time}
                </ThemedText>
              </VStack>
              <Pressable onPress={() => setSelectedSlot(null)}>
                <Ionicons name="close" size={24} color={isDark ? "#94a3b8" : "#64748b"} />
              </Pressable>
            </HStack>

            <HStack style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <VStack>
                <ThemedText style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Slots</ThemedText>
                <HStack style={{ alignItems: "center" }}>
                  <Pressable
                    onPress={() => setNumberOfSlots(Math.max(1, numberOfSlots - 1))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: isDark ? "#334155" : "#f1f5f9",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="remove" size={18} color={isDark ? "#fff" : "#0f172a"} />
                  </Pressable>
                  <Text style={{ fontSize: 16, fontWeight: "700", marginHorizontal: 16, color: isDark ? "#fff" : "#0f172a" }}>
                    {numberOfSlots}
                  </Text>
                  <Pressable
                    onPress={() => setNumberOfSlots(Math.min(selectedSlot.availableSeats, numberOfSlots + 1))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: isDark ? "#334155" : "#f1f5f9",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="add" size={18} color={isDark ? "#fff" : "#0f172a"} />
                  </Pressable>
                </HStack>
              </VStack>

              <VStack
                style={{
                  flex: 1,
                  marginLeft: 20,
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <HStack style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>Pricing Category</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#e2e8f0" : "#334155" }}>
                    {getPricingCategory(currentUser, selectedRange)}
                  </Text>
                </HStack>
                <HStack style={{ justifyContent: "space-between", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#e2e8f0", paddingBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>Price per slot</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#e2e8f0" : "#334155" }}>
                    ₹{calculatePricePerSlot(currentUser, selectedRange)}
                  </Text>
                </HStack>
                <HStack style={{ justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#8BC34A" }}>Total</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#8BC34A" }}>
                    ₹{calculatePricePerSlot(currentUser, selectedRange) * numberOfSlots}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            {!paymentPending ? (
              <Pressable
                onPress={handleBookSlot}
                disabled={bookingLoading}
                style={{
                  backgroundColor: bookingLoading ? "#a3e635" : "#8BC34A",
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {bookingLoading ? (
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Pay via UPI & Book</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <VStack style={{ alignItems: "center", marginTop: 10 }}>
                {upiIntentUrl ? (
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUrl)}` }}
                    style={{ width: 200, height: 200, marginBottom: 12, borderRadius: 8 }}
                  />
                ) : null}
                <ThemedText style={{ fontSize: 14, fontWeight: "700", marginBottom: 4 }}>Scan with any UPI app</ThemedText>
                <Text style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
                  Awaiting admin confirmation after payment.
                </Text>

                <Pressable
                  onPress={() => Linking.openURL(upiIntentUrl).catch(() => {})}
                  style={{
                    borderWidth: 1,
                    borderColor: "#8BC34A",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginBottom: 16,
                    width: "100%",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#8BC34A", fontWeight: "600" }}>Open UPI App</Text>
                </Pressable>

                {!paymentScreenshotUrl ? (
                  <VStack style={{ width: "100%", borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#e2e8f0", paddingVertical: 16 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 8 }}>
                      Upload Payment Screenshot
                    </Text>
                    <Pressable
                      onPress={handlePickAndUploadScreenshot}
                      disabled={isUploading}
                      style={{
                        backgroundColor: isUploading ? "#a3e635" : "#8BC34A",
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        {isUploading ? "Uploading..." : "Upload Screenshot"}
                      </Text>
                    </Pressable>
                  </VStack>
                ) : (
                  <HStack style={{ width: "100%", borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#e2e8f0", paddingTop: 16, alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    <Text style={{ fontSize: 13, color: "#22c55e", fontWeight: "600" }}>Screenshot uploaded</Text>
                  </HStack>
                )}
              </VStack>
            )}
          </Box>
        )}
      </SafeAreaView>
    </>
  );
}
