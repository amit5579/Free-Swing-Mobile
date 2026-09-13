import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  Linking,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
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

import { getSubAdminList } from "@/api/modules/admin/subAdmins.api";
import {
  getDrivingRangeSlots,
  bookDrivingRangeSlot,
  uploadScreenshot,
  getMyDrivingRangeBookings,
  cancelDrivingRangeBooking,
} from "@/api/modules/drivingRange.api";
import { getProfile } from "@/api/modules/profile.api";
import ImageCropPicker from "react-native-image-crop-picker";
import { LinearGradient } from "expo-linear-gradient";

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
  const [paymentPendingBookingId, setPaymentPendingBookingId] = useState<
    number | null
  >(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<
    string | null
  >(null);
  const [upiIntentUrl, setUpiIntentUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(
    null,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSlots(), fetchMyBookings()]);
    setRefreshing(false);
  }, [availableDates, selectedDateIndex, selectedRange]);

  const handleCloseSheet = () => {
    if (bookingLoading || isUploading) return;
    if (paymentPending && !paymentScreenshotUrl) {
      Toast.show({
        type: "error",
        text1: "Upload Required",
        text2: "Screenshot upload of payment is compulsory for booking.",
      });
      return;
    }
    setSelectedSlot(null);
    setPaymentPending(false);
    setPaymentPendingBookingId(null);
    setPaymentScreenshotUrl(null);
    setUpiIntentUrl("");
    fetchSlots(false);
    fetchMyBookings();
  };

  const fetchMyBookings = async (rangeId?: number) => {
    const targetRangeId = rangeId ?? selectedRange;
    if (!targetRangeId || availableDates.length === 0) {
      setMyBookings([]);
      return;
    }
    try {
      const selectedDateStr = availableDates[selectedDateIndex];
      const data = await getMyDrivingRangeBookings();
      if (Array.isArray(data)) {
        const filtered = data.filter((b: any) => {
          const cleanDate = b.slotDate ? b.slotDate.split("T")[0] : "";
          return (
            Number(b.subAdminId) === Number(targetRangeId) &&
            (cleanDate === selectedDateStr ||
              (b.slotDate && b.slotDate.startsWith(selectedDateStr))) &&
            b.paymentStatus !== "Cancelled" &&
            b.paymentStatus !== "Rejected"
          );
        });
        setMyBookings(filtered);
      } else {
        setMyBookings([]);
      }
    } catch (error) {
      console.error("Error fetching my driving range bookings:", error);
      setMyBookings([]);
    }
  };

  const handleCancelBooking = (booking: any) => {
    const bookingId = booking.id ?? booking._id;
    if (!bookingId) return;

    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel your driving range booking for ${booking.slotTime} (${booking.numberOfSlots || 1} slot${(booking.numberOfSlots || 1) > 1 ? "s" : ""})?`,
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingBookingId(bookingId);
              await cancelDrivingRangeBooking(bookingId);
              Toast.show({
                type: "success",
                text1: "Booking Cancelled",
                text2: "Your driving range booking has been cancelled.",
              });
              await Promise.all([fetchSlots(false), fetchMyBookings()]);
            } catch (err: any) {
              console.error("Error cancelling driving range booking:", err);
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to cancel booking";
              Toast.show({
                type: "error",
                text1: "Cancellation Failed",
                text2: msg,
              });
            } finally {
              setCancellingBookingId(null);
            }
          },
        },
      ],
    );
  };

  const fetchSlots = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);

      const rangesResponse = await getSubAdminList();

      const formattedRanges = rangesResponse.map((r: any) => ({
        label: `${r.username} Range`,
        value: r.id,
        id: r.id,
        username: r.username,
        upiId: r.upiId,
        upiPayeeName: r.upiPayeeName,
        drivingRangeCivilPrice: r.drivingRangeCivilPrice,
        drivingRangeCivilWeekendPrice: r.drivingRangeCivilWeekendPrice,
        drivingRangeDefencePrice: r.drivingRangeDefencePrice,
        drivingRangeDefenceWeekendPrice: r.drivingRangeDefenceWeekendPrice,
        drivingRangeMemberPrice: r.drivingRangeMemberPrice,
        drivingRangeMemberWeekendPrice: r.drivingRangeMemberWeekendPrice,
      }));

      setRanges(formattedRanges);

      let currentRangeId = selectedRange;
      if (formattedRanges.length > 0 && !selectedRange) {
        const userSubAdminId =
          currentUser?.invitedBySubAdminId ?? currentUser?.subAdminId;
        const matched = formattedRanges.find(
          (r: any) => Number(r.value) === Number(userSubAdminId),
        );
        currentRangeId = matched ? matched.value : formattedRanges[0].value;
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

  // When currentUser or ranges load, try to pre-select their home range if not yet set
  useEffect(() => {
    if (currentUser && ranges.length > 0 && !selectedRange) {
      const userSubAdminId =
        currentUser?.invitedBySubAdminId ?? currentUser?.subAdminId;
      const matched = ranges.find(
        (r: any) => Number(r.value) === Number(userSubAdminId),
      );
      if (matched) {
        setSelectedRange(matched.value);
      }
    }
  }, [currentUser, ranges]);

  useEffect(() => {
    const today = new Date();
    const arr = [];

    for (let i = 0; i < 7; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      arr.push(formatDate(newDate));
    }

    setAvailableDates(arr);
  }, []);

  useEffect(() => {
    if (availableDates.length > 0) {
      fetchSlots();
      fetchMyBookings();
    }
  }, [availableDates, selectedDateIndex, selectedRange]);

  const [selectedCategory, setSelectedCategory] = useState<
    "ClubMember" | "Defence" | "Civil" | "Member"
  >("Civil");

  const userSubAdminId =
    currentUser?.invitedBySubAdminId ?? currentUser?.subAdminId;

  const isClubMemberForSelectedRange = Boolean(
    selectedRange &&
    ((userSubAdminId && Number(userSubAdminId) === Number(selectedRange)) ||
      (currentUser?.role === "SubAdmin" &&
        Number(currentUser?.id) === Number(selectedRange))),
  );

  const isSelectedDateWeekend = (() => {
    const dateStr = availableDates[selectedDateIndex];
    if (!dateStr) return false;
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = d.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 6;
  })();

  const currentRangeObj = ranges.find(
    (r) => Number(r.value) === Number(selectedRange),
  );

  const getCivilPrice = () => {
    if (!currentRangeObj) return 0;
    return isSelectedDateWeekend
      ? Number(
          currentRangeObj.drivingRangeCivilWeekendPrice ??
            currentRangeObj.drivingRangeCivilPrice ??
            0,
        )
      : Number(currentRangeObj.drivingRangeCivilPrice ?? 0);
  };

  const getDefencePrice = () => {
    if (!currentRangeObj) return 0;
    return isSelectedDateWeekend
      ? Number(
          currentRangeObj.drivingRangeDefenceWeekendPrice ??
            currentRangeObj.drivingRangeDefencePrice ??
            0,
        )
      : Number(currentRangeObj.drivingRangeDefencePrice ?? 0);
  };

  const getMemberPrice = () => {
    if (!currentRangeObj) return 0;
    return isSelectedDateWeekend
      ? Number(
          currentRangeObj.drivingRangeMemberWeekendPrice ??
            currentRangeObj.drivingRangeMemberPrice ??
            0,
        )
      : Number(currentRangeObj.drivingRangeMemberPrice ?? 0);
  };

  // Sync category default when range or currentUser changes
  useEffect(() => {
    if (isClubMemberForSelectedRange) {
      setSelectedCategory("ClubMember");
    } else {
      const userCat = currentUser?.memberCategory;
      if (userCat === "Defence" || userCat === "Affiliated") {
        setSelectedCategory("Defence");
      } else {
        setSelectedCategory("Civil");
      }
    }
  }, [selectedRange, isClubMemberForSelectedRange, currentUser]);

  const calculatePricePerSlot = (cat?: string) => {
    if (isClubMemberForSelectedRange) return 0;
    const categoryToUse = cat || selectedCategory;
    if (categoryToUse === "ClubMember") return 0;
    if (categoryToUse === "Defence") return getDefencePrice();
    if (categoryToUse === "Member") return getMemberPrice();
    return getCivilPrice();
  };

  const getPricingCategory = () => {
    if (isClubMemberForSelectedRange) return "Club Member (Complimentary)";
    if (selectedCategory === "Defence") return "Defence / Affiliated";
    if (selectedCategory === "Member") return "Other Club Member";
    return "Civil / Non-Affiliated";
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !selectedRange) return;
    setBookingLoading(true);
    try {
      const bookingCategory = isClubMemberForSelectedRange
        ? "ClubMember"
        : selectedCategory;
      const pricePerSlot = calculatePricePerSlot(bookingCategory);
      const totalAmount = pricePerSlot; // 1 slot per backend rules
      const refId = `DRB-${Date.now()}`;

      const payload = {
        date: availableDates[selectedDateIndex],
        numberOfSlots: 1,
        paymentReferenceId:
          isClubMemberForSelectedRange || totalAmount <= 0 ? null : refId,
        subAdminId: selectedRange,
        time: selectedSlot.time,
        totalAmount,
        category: bookingCategory,
      };

      const subAdmin = ranges.find(
        (s) => Number(s.value) === Number(selectedRange),
      );
      const username = subAdmin?.username || "Club";
      const upiId = subAdmin?.upiId || "";
      const payeeName = subAdmin?.upiPayeeName || username;

      const response = await bookDrivingRangeSlot(payload);

      if (
        response.isClubMember ||
        response.paymentStatus === "Paid" ||
        totalAmount <= 0
      ) {
        Toast.show({
          type: "success",
          text1: "Booking Confirmed!",
          text2: isClubMemberForSelectedRange
            ? "Complimentary club member slot confirmed."
            : "Driving range slot booked successfully.",
        });
        setSelectedSlot(null);
        await Promise.all([fetchSlots(false), fetchMyBookings()]);
      } else {
        const intentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&tr=${refId}&am=${totalAmount}&cu=INR`;
        setUpiIntentUrl(intentUrl);
        setPaymentPendingBookingId(response.bookingId || response.id);
        setPaymentPending(true);

        Toast.show({
          type: "info",
          text1: "Please complete payment via UPI.",
        });

        if (upiId) {
          setTimeout(async () => {
            try {
              const supported = await Linking.canOpenURL(intentUrl);
              if (supported) {
                await Linking.openURL(intentUrl);
              } else {
                Toast.show({
                  type: "error",
                  text1: "UPI App Not Found",
                  text2: "Please scan the QR code instead.",
                });
              }
            } catch (error) {
              Toast.show({ type: "error", text1: "Error opening UPI app" });
            }
          }, 1500);
        }

        await Promise.all([fetchSlots(false), fetchMyBookings()]);
      }
    } catch (err: any) {
      console.error(err);
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while booking.";
      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: apiMessage,
      });
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
      const fileName =
        result.filename || result.path.split("/").pop() || "screenshot.jpg";
      const fileType = result.mime || "image/jpeg";

      if (paymentPendingBookingId) {
        const res = await uploadScreenshot(
          paymentPendingBookingId,
          result.path,
          fileType,
          fileName,
        );
        setPaymentScreenshotUrl(res.url || "uploaded");
        Toast.show({
          type: "success",
          text1: "Screenshot uploaded successfully. Awaiting verification.",
        });
      }
    } catch (err: any) {
      if (err.code !== "E_PICKER_CANCELLED") {
        console.error(err);
        Toast.show({
          type: "error",
          text1: "Upload Failed",
          text2: "Failed to upload screenshot.",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#161618" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
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
                backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#f1f5f9",
              }}
              android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            >
              <Ionicons name="arrow-back" size={20} color="#8BC34A" />
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
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(229, 231, 235, 0.6)",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          borderWidth: 1,
        }}
        className="mb-6 rounded-2xl"
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
          backgroundColor: isDark ? "#161618" : "#ffffff",
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
          <VStack className="px-2 pt-5 pb-20">
            <ThemedView
              style={{
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark
                  ? "rgba(139, 195, 74, 0.35)"
                  : "rgba(139, 195, 74, 0.45)",
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 12,
                shadowColor: "#000",
                marginBottom: 9,
              }}
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
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
                  placeholderStyle={{
                    color: isDark ? "#777" : "#999",
                    fontSize: 14,
                  }}
                  selectedTextStyle={{
                    color: isDark ? "white" : "black",
                    fontSize: 14,
                  }}
                  containerStyle={{
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    borderColor: isDark ? "#333" : "#ddd",
                  }}
                  itemTextStyle={{
                    color: isDark ? "white" : "black",
                    fontSize: 14,
                  }}
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
                  onPress={() => {
                    fetchSlots();
                    fetchMyBookings();
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                </Pressable>
              </HStack>
            </ThemedView>

            {/* Your Bookings for this Date */}
            {myBookings && myBookings.length > 0 && (
              <ThemedView
                style={{
                  backgroundColor: isDark
                    ? "rgba(15, 23, 42, 0.7)"
                    : "rgba(255, 255, 255, 0.7)",
                  borderColor: isDark
                    ? "rgba(139, 195, 74, 0.35)"
                    : "rgba(139, 195, 74, 0.45)",
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  marginBottom: 9,
                  shadowColor: "#000",
                }}
              >
                <HStack
                  style={{ alignItems: "center", marginBottom: 14, gap: 8 }}
                >
                  <Ionicons name="calendar-sharp" size={18} color="#8BC34A" />
                  <ThemedText
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#8BC34A",
                    }}
                  >
                    Your Bookings for this Date
                  </ThemedText>
                </HStack>

                <VStack style={{ gap: 10 }}>
                  {myBookings.map((myB: any) => {
                    const bookingId = myB.id ?? myB._id;
                    const isConfirmed =
                      myB.paymentStatus === "Paid" ||
                      myB.paymentStatus === "Approved";
                    const isCancelling = cancellingBookingId === bookingId;

                    return (
                      <View
                        key={bookingId || Math.random()}
                        style={{
                          backgroundColor: isDark
                            ? "rgba(15, 23, 42, 0.7)"
                            : "rgba(255, 255, 255, 0.7)",
                          borderColor: isDark ? "#334155" : "#e2e8f0",
                          borderWidth: 1,
                          borderRadius: 14,
                          padding: 14,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.2 : 0.06,
                          shadowRadius: 3,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: isDark ? "#f8fafc" : "#0f172a",
                            }}
                          >
                            {myB.slotTime}
                          </Text>
                          <HStack
                            style={{
                              alignItems: "center",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            <HStack style={{ alignItems: "center", gap: 4 }}>
                              <Ionicons
                                name="person-outline"
                                size={14}
                                color={isDark ? "#94a3b8" : "#64748b"}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "500",
                                  color: isDark ? "#94a3b8" : "#64748b",
                                }}
                              >
                                {myB.numberOfSlots || 1} Slot
                                {(myB.numberOfSlots || 1) > 1 ? "s" : ""}
                              </Text>
                            </HStack>
                            <View
                              style={{
                                backgroundColor: isConfirmed
                                  ? isDark
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "#dcfce7"
                                  : isDark
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "#fef3c7",
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 12,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: "600",
                                  color: isConfirmed
                                    ? isDark
                                      ? "#4ade80"
                                      : "#15803d"
                                    : isDark
                                      ? "#fbbf24"
                                      : "#b45309",
                                }}
                              >
                                {myB.paymentStatus === "Paid"
                                  ? "Confirmed"
                                  : myB.paymentStatus}
                              </Text>
                            </View>
                          </HStack>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          disabled={isCancelling}
                          onPress={() => handleCancelBooking(myB)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            borderColor: "#ef4444",
                            borderWidth: 1.2,
                            borderRadius: 8,
                            backgroundColor: isDark
                              ? "rgba(239, 68, 68, 0.12)"
                              : "#fef2f2",
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            opacity: isCancelling ? 0.6 : 1,
                          }}
                        >
                          {isCancelling ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <>
                              <Ionicons
                                name="close-circle-outline"
                                size={16}
                                color="#ef4444"
                              />
                              <Text
                                style={{
                                  color: "#ef4444",
                                  fontWeight: "600",
                                  fontSize: 13,
                                }}
                              >
                                Cancel
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </VStack>
              </ThemedView>
            )}

            <ThemedView
              style={{
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark
                  ? "rgba(139, 195, 74, 0.35)"
                  : "rgba(139, 195, 74, 0.45)",
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 7,
                shadowColor: "#000",
              }}
            >
              <HStack
                style={{ alignItems: "center", marginBottom: 16, gap: 6 }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#8BC34A"
                />
                <ThemedText style={{ fontSize: 14, fontWeight: "700" }}>
                  Available Slots
                </ThemedText>
              </HStack>

              <Box>
                {loading ? (
                  <SlotsSkeleton isDark={isDark} />
                ) : (
                  <HStack
                    style={{
                      flexWrap: "wrap",
                      gap: 10,
                      justifyContent: "flex-start",
                    }}
                  >
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
                          backgroundColor:
                            slot.availableSeats === 0
                              ? isDark
                                ? "rgba(255, 255, 255, 0.02)"
                                : "#f1f5f9"
                              : isDark
                                ? "rgba(255, 255, 255, 0.05)"
                                : "#fff",
                          borderWidth: 1,
                          borderColor:
                            slot.availableSeats === 0
                              ? isDark
                                ? "rgba(255, 255, 255, 0.05)"
                                : "#cbd5e1"
                              : isDark
                                ? "rgba(255, 255, 255, 0.1)"
                                : "#e2e8f0",
                          alignItems: "center",
                          opacity: slot.availableSeats === 0 ? 0.6 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color:
                              slot.availableSeats === 0
                                ? isDark
                                  ? "#64748b"
                                  : "#94a3b8"
                                : isDark
                                  ? "#fff"
                                  : "#111",
                          }}
                        >
                          {slot.time}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "600",
                            color:
                              slot.availableSeats === 0 ? "#ef4444" : "#8BC34A",
                            marginTop: 4,
                          }}
                        >
                          {slot.availableSeats === 0
                            ? "Expired"
                            : `${slot.availableSeats} slots left`}
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
          <Modal
            visible={Boolean(selectedSlot)}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={handleCloseSheet}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.75)"
                  : "rgba(0, 0, 0, 0.5)",
                justifyContent: "flex-end",
              }}
            >
              <Pressable style={{ flex: 1 }} onPress={handleCloseSheet} />
              <Box
                style={{
                  maxHeight: "88%",
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  borderTopWidth: 1,
                  borderTopColor: isDark ? "#334155" : "#e2e8f0",
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 24,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 12,
                }}
              >
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <HStack
                    style={{
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <VStack>
                      <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                        Confirm Booking
                      </ThemedText>
                    </VStack>
                    <Pressable
                      disabled={bookingLoading || isUploading}
                      onPress={() => {
                        // if (paymentPending && !paymentScreenshotUrl) {
                        //   Toast.show({
                        //     type: "error",
                        //     text1: "Upload Required",
                        //     text2:
                        //       "Screenshot upload of payment is compulsory for booking.",
                        //   });
                        //   return;
                        // }
                        handleCloseSheet();
                      }}
                      style={{
                        opacity:
                          paymentPending && !paymentScreenshotUrl ? 0.25 : 1,
                        padding: 4,
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={isDark ? "#94a3b8" : "#64748b"}
                      />
                    </Pressable>
                  </HStack>

                  {!paymentPending ? (
                    <VStack style={{ gap: 14 }}>
                      {/* Slot Details Header */}
                      <HStack
                        style={{
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingBottom: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                        }}
                      >
                        <HStack style={{ alignItems: "center", gap: 6 }}>
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color="#8BC34A"
                          />
                          <ThemedText
                            style={{ fontSize: 14, fontWeight: "700" }}
                          >
                            {selectedSlot.time} • 1 Slot
                          </ThemedText>
                        </HStack>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: isSelectedDateWeekend
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(139, 195, 74, 0.15)",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isSelectedDateWeekend
                                ? "#ef4444"
                                : "#8BC34A",
                            }}
                          >
                            {isSelectedDateWeekend
                              ? "Weekend Rate"
                              : "Weekday Rate"}
                          </Text>
                        </View>
                      </HStack>

                      {/* Category Selection / Club Member Badge */}
                      {isClubMemberForSelectedRange ? (
                        <View
                          style={{
                            backgroundColor: isDark
                              ? "rgba(139, 195, 74, 0.15)"
                              : "rgba(139, 195, 74, 0.1)",
                            borderColor: "#8BC34A",
                            borderWidth: 1.5,
                            borderRadius: 14,
                            padding: 14,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              backgroundColor: "#8BC34A",
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 12,
                            }}
                          >
                            <Ionicons name="ribbon" size={22} color="#fff" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "700",
                                color: isDark ? "#fff" : "#1e293b",
                              }}
                            >
                              Club Member
                            </Text>
                            {/* <Text
                        style={{
                          fontSize: 11,
                          color: isDark ? "#a3e635" : "#558b2f",
                          marginTop: 2,
                        }}
                      >
                        Complimentary access for members of this club
                      </Text> */}
                          </View>
                          <View
                            style={{
                              backgroundColor: "#8BC34A",
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "800",
                                fontSize: 13,
                              }}
                            >
                              ₹0
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <VStack style={{ gap: 8 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: isDark ? "#94a3b8" : "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Select Category
                          </Text>

                          {/* Defence Option */}
                          <Pressable
                            onPress={() => setSelectedCategory("Defence")}
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor:
                                selectedCategory === "Defence"
                                  ? "#8BC34A"
                                  : isDark
                                    ? "#334155"
                                    : "#e2e8f0",
                              backgroundColor:
                                selectedCategory === "Defence"
                                  ? isDark
                                    ? "rgba(139,195,74,0.12)"
                                    : "rgba(139,195,74,0.08)"
                                  : isDark
                                    ? "#0f172a"
                                    : "#f8fafc",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <HStack
                              style={{ alignItems: "center", flex: 1, gap: 10 }}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  backgroundColor:
                                    selectedCategory === "Defence"
                                      ? "#8BC34A"
                                      : isDark
                                        ? "#1e293b"
                                        : "#e2e8f0",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons
                                  name="shield-checkmark"
                                  size={18}
                                  color={
                                    selectedCategory === "Defence"
                                      ? "#fff"
                                      : isDark
                                        ? "#94a3b8"
                                        : "#64748b"
                                  }
                                />
                              </View>
                              <VStack style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "700",
                                    color: isDark ? "#f1f5f9" : "#1e293b",
                                  }}
                                >
                                  Defence / Affiliated
                                </Text>
                                {/* <Text
                            style={{
                              fontSize: 11,
                              color: isDark ? "#94a3b8" : "#64748b",
                              marginTop: 1,
                            }}
                          >
                            Defence / Retired / Affiliated club rate
                          </Text> */}
                              </VStack>
                            </HStack>
                            <View
                              style={{
                                backgroundColor:
                                  selectedCategory === "Defence"
                                    ? "#8BC34A"
                                    : isDark
                                      ? "#334155"
                                      : "#e2e8f0",
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    selectedCategory === "Defence"
                                      ? "#fff"
                                      : isDark
                                        ? "#cbd5e1"
                                        : "#334155",
                                  fontWeight: "700",
                                  fontSize: 13,
                                }}
                              >
                                ₹{getDefencePrice()}
                              </Text>
                            </View>
                          </Pressable>

                          {/* Civil Option */}
                          <Pressable
                            onPress={() => setSelectedCategory("Civil")}
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor:
                                selectedCategory === "Civil"
                                  ? "#8BC34A"
                                  : isDark
                                    ? "#334155"
                                    : "#e2e8f0",
                              backgroundColor:
                                selectedCategory === "Civil"
                                  ? isDark
                                    ? "rgba(139,195,74,0.12)"
                                    : "rgba(139,195,74,0.08)"
                                  : isDark
                                    ? "#0f172a"
                                    : "#f8fafc",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <HStack
                              style={{ alignItems: "center", flex: 1, gap: 10 }}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  backgroundColor:
                                    selectedCategory === "Civil"
                                      ? "#8BC34A"
                                      : isDark
                                        ? "#1e293b"
                                        : "#e2e8f0",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons
                                  name="person"
                                  size={18}
                                  color={
                                    selectedCategory === "Civil"
                                      ? "#fff"
                                      : isDark
                                        ? "#94a3b8"
                                        : "#64748b"
                                  }
                                />
                              </View>
                              <VStack style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "700",
                                    color: isDark ? "#f1f5f9" : "#1e293b",
                                  }}
                                >
                                  Civil / Non-Affiliated
                                </Text>
                                {/* <Text
                            style={{
                              fontSize: 11,
                              color: isDark ? "#94a3b8" : "#64748b",
                              marginTop: 1,
                            }}
                          >
                            General civilian & guest rate
                          </Text> */}
                              </VStack>
                            </HStack>
                            <View
                              style={{
                                backgroundColor:
                                  selectedCategory === "Civil"
                                    ? "#8BC34A"
                                    : isDark
                                      ? "#334155"
                                      : "#e2e8f0",
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    selectedCategory === "Civil"
                                      ? "#fff"
                                      : isDark
                                        ? "#cbd5e1"
                                        : "#334155",
                                  fontWeight: "700",
                                  fontSize: 13,
                                }}
                              >
                                ₹{getCivilPrice()}
                              </Text>
                            </View>
                          </Pressable>

                          {/* Member Option (if configured) */}
                          {getMemberPrice() > 0 && (
                            <Pressable
                              onPress={() => setSelectedCategory("Member")}
                              style={{
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor:
                                  selectedCategory === "Member"
                                    ? "#8BC34A"
                                    : isDark
                                      ? "#334155"
                                      : "#e2e8f0",
                                backgroundColor:
                                  selectedCategory === "Member"
                                    ? isDark
                                      ? "rgba(139,195,74,0.12)"
                                      : "rgba(139,195,74,0.08)"
                                    : isDark
                                      ? "#0f172a"
                                      : "#f8fafc",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <HStack
                                style={{
                                  alignItems: "center",
                                  flex: 1,
                                  gap: 10,
                                }}
                              >
                                <View
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor:
                                      selectedCategory === "Member"
                                        ? "#8BC34A"
                                        : isDark
                                          ? "#1e293b"
                                          : "#e2e8f0",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <Ionicons
                                    name="golf"
                                    size={18}
                                    color={
                                      selectedCategory === "Member"
                                        ? "#fff"
                                        : isDark
                                          ? "#94a3b8"
                                          : "#64748b"
                                    }
                                  />
                                </View>
                                <VStack style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      fontWeight: "700",
                                      color: isDark ? "#f1f5f9" : "#1e293b",
                                    }}
                                  >
                                    Other Club Member
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      color: isDark ? "#94a3b8" : "#64748b",
                                      marginTop: 1,
                                    }}
                                  >
                                    Visiting golf club member rate
                                  </Text>
                                </VStack>
                              </HStack>
                              <View
                                style={{
                                  backgroundColor:
                                    selectedCategory === "Member"
                                      ? "#8BC34A"
                                      : isDark
                                        ? "#334155"
                                        : "#e2e8f0",
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    color:
                                      selectedCategory === "Member"
                                        ? "#fff"
                                        : isDark
                                          ? "#cbd5e1"
                                          : "#334155",
                                    fontWeight: "700",
                                    fontSize: 13,
                                  }}
                                >
                                  ₹{getMemberPrice()}
                                </Text>
                              </View>
                            </Pressable>
                          )}
                        </VStack>
                      )}

                      {/* Pricing Summary */}
                      <VStack
                        style={{
                          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#e2e8f0",
                        }}
                      >
                        <HStack
                          style={{
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: isDark ? "#94a3b8" : "#64748b",
                            }}
                          >
                            Category
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: isDark ? "#e2e8f0" : "#334155",
                            }}
                          >
                            {getPricingCategory()}
                          </Text>
                        </HStack>
                        <HStack
                          style={{
                            justifyContent: "space-between",
                            marginBottom: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                            paddingBottom: 10,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: isDark ? "#94a3b8" : "#64748b",
                            }}
                          >
                            Price per slot
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: isDark ? "#e2e8f0" : "#334155",
                            }}
                          >
                            ₹{calculatePricePerSlot()}
                          </Text>
                        </HStack>
                        <HStack style={{ justifyContent: "space-between" }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: "#8BC34A",
                            }}
                          >
                            Total Amount
                          </Text>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "800",
                              color: "#8BC34A",
                            }}
                          >
                            ₹{calculatePricePerSlot()}
                          </Text>
                        </HStack>
                      </VStack>

                      {/* Booking Button */}
                      <Pressable
                        onPress={handleBookSlot}
                        disabled={bookingLoading}
                        style={{ borderRadius: 12, marginTop: 4 }}
                      >
                        <LinearGradient
                          colors={
                            bookingLoading
                              ? ["#a3e635", "#8bc34a"]
                              : ["#8bc34a", "#558b2f"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            paddingVertical: 14,
                            borderRadius: 12,
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 8,
                            shadowColor: "#8bc34a",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                            elevation: 6,
                          }}
                        >
                          {bookingLoading ? (
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 16,
                                fontWeight: "800",
                              }}
                            >
                              Processing...
                            </Text>
                          ) : (
                            <>
                              <Ionicons
                                name={
                                  isClubMemberForSelectedRange ||
                                  calculatePricePerSlot() === 0
                                    ? "checkmark-circle"
                                    : "flash"
                                }
                                size={18}
                                color="#fff"
                              />
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 16,
                                  fontWeight: "800",
                                }}
                              >
                                {isClubMemberForSelectedRange ||
                                calculatePricePerSlot() === 0
                                  ? "Confirm Free Booking"
                                  : `Pay ₹${calculatePricePerSlot()} via UPI & Book`}
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </VStack>
                  ) : (
                    <VStack style={{ alignItems: "center", marginTop: 10 }}>
                      {upiIntentUrl ? (
                        <Image
                          source={{
                            uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUrl)}`,
                          }}
                          style={{
                            width: 200,
                            height: 200,
                            marginBottom: 12,
                            borderRadius: 8,
                          }}
                        />
                      ) : null}
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          marginBottom: 4,
                        }}
                      >
                        Scan with any UPI app
                      </ThemedText>
                      <View
                        style={{
                          backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 10,
                          marginVertical: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: isDark ? "#fff" : "#0f172a",
                            textAlign: "center",
                          }}
                        >
                          Amount to Pay:{" "}
                          <Text style={{ color: "#8BC34A" }}>
                            ₹{calculatePricePerSlot()}
                          </Text>
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: isDark ? "#94a3b8" : "#64748b",
                          fontSize: 12,
                          marginBottom: 16,
                          textAlign: "center",
                        }}
                      >
                        Awaiting admin confirmation after payment.
                      </Text>

                      <Pressable
                        onPress={() =>
                          Linking.openURL(upiIntentUrl).catch(() => {})
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: "#8BC34A",
                          paddingVertical: 10,
                          paddingHorizontal: 20,
                          borderRadius: 8,
                          marginBottom: 16,
                          width: "100%",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#8BC34A", fontWeight: "600" }}>
                          Open UPI App
                        </Text>
                      </Pressable>

                      {!paymentScreenshotUrl ? (
                        <>{/* Upload Required Banner */}
                      {!paymentScreenshotUrl && (
                        <View
                          style={{
                            width: "100%",
                            backgroundColor: isDark
                              ? "rgba(245, 158, 11, 0.12)"
                              : "#fffbeb",
                            borderColor: isDark
                              ? "rgba(245, 158, 11, 0.4)"
                              : "#f59e0b",
                            borderWidth: 1,
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Ionicons
                            name="warning"
                            size={22}
                            color="#f59e0b"
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: isDark ? "#fbbf24" : "#b45309",
                              }}
                            >
                              Screenshot upload is required.
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: isDark ? "#fde68a" : "#92400e",
                                marginTop: 2,
                              }}
                            >
                              Screenshot upload of payment is compulsory for booking.
                            </Text>
                          </View>
                        </View>
                      )}
                       <VStack
                          style={{
                            width: "100%",
                            borderTopWidth: 1,
                            borderTopColor: isDark ? "#334155" : "#e2e8f0",
                            paddingVertical: 16,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: isDark ? "#94a3b8" : "#64748b",
                              marginBottom: 8,
                            }}
                          >
                            Upload Payment Screenshot
                          </Text>
                          <Pressable
                            onPress={handlePickAndUploadScreenshot}
                            disabled={isUploading}
                            style={{ borderRadius: 8 }}
                          >
                            <LinearGradient
                              colors={
                                isUploading
                                  ? ["#a3e635", "#8bc34a"]
                                  : ["#8bc34a", "#558b2f"]
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                paddingVertical: 12,
                                borderRadius: 8,
                                alignItems: "center",
                                shadowColor: "#8bc34a",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.3,
                                elevation: 4,
                              }}
                            >
                              <Text
                                style={{ color: "#fff", fontWeight: "700" }}
                              >
                                {isUploading
                                  ? "Uploading..."
                                  : "Upload Screenshot"}
                              </Text>
                            </LinearGradient>
                          </Pressable>
                        </VStack>
</>
                       
                      ) : (
                        <VStack
                          style={{
                            width: "100%",
                            borderTopWidth: 1,
                            borderTopColor: isDark ? "#334155" : "#e2e8f0",
                            paddingTop: 16,
                            alignItems: "center",
                          }}
                        >
                          <HStack
                            style={{
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              marginBottom: 12,
                            }}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#22c55e"
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#22c55e",
                                fontWeight: "600",
                              }}
                            >
                              Screenshot uploaded successfully
                            </Text>
                          </HStack>
                          <Pressable
                            onPress={handleCloseSheet}
                            style={{
                              backgroundColor: "#8BC34A",
                              paddingVertical: 10,
                              paddingHorizontal: 32,
                              borderRadius: 8,
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: 14,
                              }}
                            >
                              Done
                            </Text>
                          </Pressable>
                        </VStack>
                      )}
                    </VStack>
                  )}
                </ScrollView>
              </Box>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}
