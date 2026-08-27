import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, ScrollView, RefreshControl } from "react-native";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Pressable, useColorScheme, View, Modal, Linking, TouchableOpacity } from "react-native";
import ImageCropPicker from "react-native-image-crop-picker";
import QRCode from "react-native-qrcode-svg";

import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";
import {
  bookSeat,
  cancelSeatBooking,
  uploadTeeBookingScreenshot,
  getSubAdminCourses,
  getTeeTimeSeats,
} from "@/api/modules/teeTime.api";
import { getProfile } from "@/api/modules/profile.api";
import { getSubAdminList } from "@/api/modules/admin/subAdmins.api";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeeTimeBookingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const [activeTeeTab, setActiveTeeTab] = useState(1);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [teeData, setTeeData] = useState<any>(null);
  const [loadingSeats, setLoadingSeats] = useState<any>({});

  const [userId, setUserId] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [memberCategoryModalVisible, setMemberCategoryModalVisible] =
    useState(false);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<any>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [seatToCancel, setSeatToCancel] = useState<any>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeeTiming();
    setRefreshing(false);
  }, [availableDates, selectedDateIndex, activeTeeTab, selectedCourse]);
  const getSeatKey = (
    date: string,
    teeBox: number,
    timeSlot: string,
    seatNumber: number,
  ) => `${date}-${teeBox}-${timeSlot}-${seatNumber}`;

  const tabs = [
    { key: 1, label: "Tee1", icon: "grid-outline" },
    { key: 10, label: "Tee10", icon: "people-outline" },
  ];

  const fetchTeeTiming = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);

      const courseResponse = await getSubAdminCourses();
      // console.log("courseResponse", courseResponse);

      const formattedCourses = courseResponse.map((c: any) => ({
        label: c.name || `Course ${c.courseId}`,
        value: c.courseId,
        ...c,
      }));

      setCourses(formattedCourses);

      let currentCourseId = selectedCourse;
      if (formattedCourses.length > 0 && !selectedCourse) {
        currentCourseId = formattedCourses[0].value;
        setSelectedCourse(currentCourseId);
      }

      if (currentCourseId) {
        const teeDetails = await getTeeTimeSeats(
          currentCourseId,
          availableDates[selectedDateIndex],
          activeTeeTab,
        );
        setTeeData(teeDetails); // ✅ IMPORTANT
      }
    } catch (error) {
      console.error("Error fetching tee timings:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clubMemberCourseIds, setClubMemberCourseIds] = useState<number[]>([]);

  useEffect(() => {
    const loadUserAndClubData = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) {
          setUserId(Number(id));
        }
        const user = await getProfile();
        setCurrentUser(user);

        const userSubAdminId =
          user?.invitedBySubAdminId ?? user?.subAdminId;
        if (userSubAdminId) {
          const subAdmins = await getSubAdminList();
          const club = subAdmins?.find(
            (sa: any) => Number(sa.id) === Number(userSubAdminId),
          );
          const cIds: number[] = [];
          if (club?.courses && Array.isArray(club.courses)) {
            club.courses.forEach((c: any) => {
              const cid = Number(c.courseId ?? c.id);
              if (!isNaN(cid)) cIds.push(cid);
            });
          }
          if (club?.courseIds && Array.isArray(club.courseIds)) {
            club.courseIds.forEach((cid: any) => {
              const n = Number(cid);
              if (!isNaN(n) && !cIds.includes(n)) cIds.push(n);
            });
          }
          setClubMemberCourseIds(cIds);
        }
      } catch (err) {
        console.error("Error loading user or club data:", err);
      }
    };
    loadUserAndClubData();
  }, []);

  const currentCourseObj = courses.find(
    (c: any) => c.value === selectedCourse || c.courseId === selectedCourse,
  );

  const userSubAdminId =
    currentUser?.invitedBySubAdminId ?? currentUser?.subAdminId;

  const isClubMemberForSelectedCourse = Boolean(
    selectedCourse &&
      userSubAdminId &&
      (clubMemberCourseIds.includes(Number(selectedCourse)) ||
        (currentCourseObj?.subAdminId &&
          Number(currentCourseObj.subAdminId) === Number(userSubAdminId))),
  );

  const getSelectedDateRate = (category: "Affiliated" | "Non-Affiliated") => {
    if (!currentCourseObj) return 0;
    const dateStr = availableDates[selectedDateIndex];
    const isWeekend = (() => {
      if (!dateStr) return false;
      const day = new Date(dateStr).getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    })();

    if (category === "Affiliated") {
      if (isWeekend && currentCourseObj.affiliatedMemberWeekendRate != null) {
        return currentCourseObj.affiliatedMemberWeekendRate;
      }
      return (
        currentCourseObj.affiliatedMemberRate ??
        currentCourseObj.affiliatedMemberWeekdayRate ??
        currentCourseObj.affiliatedPrice ??
        0
      );
    } else {
      if (isWeekend && currentCourseObj.nonAffiliatedMemberWeekendRate != null) {
        return currentCourseObj.nonAffiliatedMemberWeekendRate;
      }
      return (
        currentCourseObj.nonAffiliatedMemberRate ??
        currentCourseObj.nonAffiliatedMemberWeekdayRate ??
        currentCourseObj.nonAffiliatedPrice ??
        0
      );
    }
  };

  const initiateBooking = (timeSlot: string, seatNumber: number) => {
    setSelectedSeatInfo({ timeSlot, seatNumber });

    // Auto-confirm if Club Member
    if (isClubMemberForSelectedCourse) {
      bookSeatHandler("Club Member");
      return;
    }

    // Otherwise open modal for guest categories
    setMemberCategoryModalVisible(true);
  };

  const bookSeatHandler = async (memberCategory: string) => {
    setMemberCategoryModalVisible(false);
    const { timeSlot, seatNumber } = selectedSeatInfo;
    const date = availableDates[selectedDateIndex];
    const teeBox = activeTeeTab;
    const key = getSeatKey(date, teeBox, timeSlot, seatNumber);

    if (loadingSeats[key]) return;

    const parseTimeToMinutes = (timeStr: string) => {
      const parts = timeStr.trim().split(" ");
      const timePart = parts[0];
      const modifier = parts[1];

      let [hours, minutes] = timePart.split(":").map(Number);

      if (modifier) {
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      return hours * 60 + (minutes || 0);
    };

    // Validation: Check if user already has a booking within 7 hours
    const userBookedSlots = teeData?.slots?.filter((slot: any) =>
      slot.seats?.some((seat: any) => seat.isBooked && seat.userId === userId),
    );

    if (userBookedSlots && userBookedSlots.length > 0) {
      const newBookingMinutes = parseTimeToMinutes(timeSlot);
      let isWithin7Hours = false;

      for (const bookedSlot of userBookedSlots) {
        const existingBookingMinutes = parseTimeToMinutes(bookedSlot.time);
        const diffHours =
          Math.abs(newBookingMinutes - existingBookingMinutes) / 60;

        if (diffHours < 7) {
          isWithin7Hours = true;
          break;
        }
      }

      if (isWithin7Hours) {
        Toast.show({
          type: "error",
          text1: "Booking Limit",
          text2: "You can book next seat after 7 hours of previous booking.",
        });
        return;
      }
    }

    setLoadingSeats((prev: any) => ({ ...prev, [key]: true }));

    try {
      const resp = await bookSeat(
        selectedCourse,
        date,
        memberCategory,
        seatNumber,
        teeBox,
        timeSlot,
      );

      await fetchTeeTiming(false);
      setBookingResponse(resp);
      setScreenshotUri(null);
      setScreenshotUploaded(false);

      if (resp?.amountToPay > 0 && resp?.paymentStatus === "Pending") {
        setPaymentModalVisible(true);
      }

      Toast.show({
        type: "success",
        text1: "Seat Booked",
        text2:
          memberCategory === "Club Member" || resp?.amountToPay === 0
            ? "Complimentary club member seat confirmed."
            : "Seat booked successfully. Please complete payment.",
      });
    } catch (error: any) {
      console.error(error);

      const apiMessage =
        error?.response?.data?.message || error?.message || "Booking failed";

      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: apiMessage,
      });
    } finally {
      setLoadingSeats((prev: any) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const cancelBookingHandler = async (
    bookingId: number,
    timeSlot: string,
    seatNumber: number,
  ) => {
    const date = availableDates[selectedDateIndex];
    const teeBox = activeTeeTab;
    const key = getSeatKey(date, teeBox, timeSlot, seatNumber);

    if (loadingSeats[key]) return;
    setLoadingSeats((prev: any) => ({ ...prev, [key]: true }));

    try {
      await cancelSeatBooking(bookingId);

      await fetchTeeTiming();
      Toast.show({
        type: "success",
        text1: "Booking Cancelled",
        text2: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Cancellation Failed",
        text2: "Booking cancellation failed",
      });
    } finally {
      setLoadingSeats((prev: any) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleUploadScreenshot = async () => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: false,
        cropperChooseText: "Done/Submit",
        cropperToolbarTitle: "Edit Image",
      });

      setScreenshotUri(result.path);
      try {
        setUploadingScreenshot(true);
        const fileName =
          result.filename || result.path.split("/").pop() || "screenshot.jpg";
        await uploadTeeBookingScreenshot(
          bookingResponse.bookingId,
          result.path,
          result.mime || "image/jpeg",
          fileName,
        );
        setScreenshotUploaded(true);
        Toast.show({
          type: "success",
          text1: "Screenshot Uploaded",
          text2: "Awaiting admin approval.",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Upload Failed",
          text2: "Failed to upload screenshot.",
        });
        setScreenshotUri(null);
      } finally {
        setUploadingScreenshot(false);
      }
    } catch (err: any) {
      if (err.code !== "E_PICKER_CANCELLED") {
        console.error(err);
      }
    }
  };

  const openUPIApp = () => {
    if (!bookingResponse) return;
    const url = `upi://pay?pa=${bookingResponse.subAdminUpiId}&pn=${encodeURIComponent(bookingResponse.subAdminUpiPayeeName)}&am=${bookingResponse.amountToPay}&cu=INR`;
    Linking.openURL(url).catch(() => {
      Toast.show({ type: "error", text1: "Error", text2: "No UPI app found." });
    });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

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
      fetchTeeTiming();
    }
  }, [availableDates, selectedDateIndex, activeTeeTab, selectedCourse]);

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
          {/* 🔝 TOP ROW */}
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 🔙 BACK */}
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

            {/* 🧠 TITLE */}
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
              Tee Time Booking
            </ThemedText>

            {/* ⚖️ RIGHT SPACER */}
            <View style={{ width: 40 }} />
          </HStack>

          {/* 📌 SUBTITLE */}
          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              // marginTop: 6,
              textAlign: "center",
            }}
          >
            Schedule and manage tee time slots
          </ThemedText>
        </VStack>
      </Box>
    );
  };

  const TeeRow = ({ slot }: any) => {
    const isSlotExpired = () => {
      if (!availableDates[selectedDateIndex]) return false;
      const parts = slot.time.trim().split(" ");
      const timePart = parts[0];
      const modifier = parts[1];

      let [hours, minutes] = timePart.split(":").map(Number);

      if (modifier) {
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      }

      const slotDate = new Date(availableDates[selectedDateIndex]);
      slotDate.setHours(hours, minutes, 0, 0);
      return slotDate.getTime() < new Date().getTime();
    };

    const isExpired = isSlotExpired();

    return (
      <Box
        style={{
          marginBottom: 16,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.2 : 0.05,
          // borderRadius: 6,
          // elevation: 2,
        }}
      >
        {/* Time Header */}
        <HStack
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#fff" : "#111",
            }}
          >
            {slot.time}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#6b7280",
            }}
          >
            {slot.seats?.length} slots
          </Text>
        </HStack>

        {/* Seats */}
        <HStack
          style={{
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {slot.seats.map((seat: any, index: number) => {
            const isBooked = seat?.isBooked;

            const date = availableDates[selectedDateIndex];
            const teeBox = activeTeeTab;
            const key = getSeatKey(date, teeBox, slot.time, seat.seatNumber);
            const isMine = seat?.userId === userId;
            const isLoading = loadingSeats[key];
            const isRequested =
              seat?.paymentStatus === "Pending" || seat?.status === "Requested";

            const seatExpired = !isBooked && isExpired;

            let bgColor = seatExpired
              ? "#94a3b8"
              : isBooked
                ? isMine
                  ? isRequested
                    ? "#eab308"
                    : "#ef4444"
                  : "grey"
                : "#8BC34A";

            return (
              <View
                key={seat.id ?? `${slot.time}-${index}`}
                style={{
                  width: "23%",
                  borderRadius: 10,
                  marginBottom: 10,
                  backgroundColor: bgColor,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => {
                    if (isLoading || seatExpired) return;

                    if (isBooked) {
                      if (isMine && seat.bookingId && !isRequested) {
                        setSeatToCancel({
                          bookingId: seat.bookingId,
                          timeSlot: slot.time,
                          seatNumber: seat.seatNumber,
                        });
                        setCancelModalVisible(true);
                      }
                    } else {
                      initiateBooking(slot.time, seat.seatNumber);
                    }
                  }}
                  disabled={isLoading || seatExpired || (isMine && isRequested)}
                  style={{
                    paddingVertical: 10,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Ionicons
                    name={
                      isLoading
                        ? "hourglass-outline"
                        : seatExpired
                          ? "ban"
                          : isBooked
                            ? isMine
                              ? isRequested
                                ? "time"
                                : "close-circle"
                              : "person"
                            : "add-circle-sharp"
                    }
                    size={20}
                    color="#fff"
                    style={{ marginBottom: 4 }}
                  />

                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: "#fff",
                      textAlign: "center",
                    }}
                  >
                    {isLoading
                      ? "Please wait"
                      : seatExpired
                        ? "Expired"
                        : isBooked
                          ? isMine
                            ? isRequested
                              ? "Requested"
                              : "Cancel"
                            : seat.userName || "Booked"
                          : "Book"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    Seat {seat.seatNumber}
                  </Text>
                </Pressable>

                {isBooked && isMine && isRequested && (
                  <Pressable
                    onPress={() => {
                      if (seat.bookingId) {
                        setSeatToCancel({
                          bookingId: seat.bookingId,
                          timeSlot: slot.time,
                          seatNumber: seat.seatNumber,
                        });
                        setCancelModalVisible(true);
                      }
                    }}
                    style={{
                      backgroundColor: "#ef4444",
                      paddingVertical: 6,
                      alignItems: "center",
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      CANCEL
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </HStack>
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

        {/* Date tabs */}
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

        {/* Dropdown + button */}
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

  const TeeRowSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          marginBottom: 16,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#ffffff",
        }}
      >
        {/* Header */}
        <HStack style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Skeleton isDark={isDark} height={16} width="30%" />
          <Skeleton isDark={isDark} height={12} width="20%" />
        </HStack>

        {/* Seats Grid (4 per row × 2 rows) */}
        <HStack style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={60}
              width="23%"
              borderRadius={10}
              style={{ marginBottom: 10 }}
            />
          ))}
        </HStack>
      </Box>
    );
  };

  const TeeTabsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <HStack
        className="rounded-full p-1 mb-6"
        style={{
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(229, 231, 235, 0.6)",
        }}
      >
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton
            key={i}
            isDark={isDark}
            height={40}
            width="48%"
            borderRadius={999}
            style={{ marginHorizontal: 4 }}
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
        {/* HEADER */}
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
            {/* Date tabs */}
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
                // shadowOffset: { width: 0, height: 4 },
                // shadowOpacity: isDark ? 0.3 : 0.05,
                // shadowRadius: 12,
                // elevation: 2,
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
                        minWidth: 70,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 15,
                        alignItems: "center",
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
                    // marginTop: 6,
                    borderColor: isDark ? "#333" : "#ddd",
                    flex: 1,
                    marginRight: 10,
                  }}
                  placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                  selectedTextStyle={{ color: isDark ? "white" : "black" }}
                  containerStyle={{
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    borderColor: isDark ? "#333" : "#ddd",
                  }}
                  itemTextStyle={{ color: isDark ? "white" : "black" }}
                  activeColor={isDark ? "#333" : "#f0f0f0"}
                  data={courses}
                  labelField="label"
                  valueField="value"
                  mode="modal"
                  placeholder="Select Course"
                  value={selectedCourse}
                  onChange={(item) => {
                    setSelectedCourse(item.value);
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
                  onPress={() => fetchTeeTiming()}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                </Pressable>
              </HStack>
            </ThemedView>

            {/* Tee tabs */}
            <HStack
              className="p-1 mb-6"
              style={{
                flex: 1,
                paddingVertical: 5,
                borderWidth: 1,
                borderRadius: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.2 : 0.05,
              }}
            >
              {tabs.map((tab) => {
                const active = activeTeeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      setActiveTeeTab(tab.key);
                    }}
                    className="flex-1 px-4 py-4 flex-row items-center justify-center"
                    style={[
                      { borderRadius: 30 },
                      active ? { backgroundColor: "#8BC34A" } : {},
                    ]}
                  >
                    <Ionicons
                      name="golf-outline"
                      size={16}
                      color={active ? "#fff" : isDark ? "#aaa" : "#6b7280"}
                      className="mr-1"
                    />
                    <Text
                      className={`text-md font-medium ${active ? "text-white" : isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>

            <Box>
              {loading ? (
                <>
                  <DateSectionSkeleton isDark={isDark} />
                  <TeeTabsSkeleton isDark={isDark} />

                  {/* Multiple fake cards */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TeeRowSkeleton key={i} isDark={isDark} />
                  ))}
                </>
              ) : (
                <>
                  {teeData?.slots?.map((slot: any) => (
                    <TeeRow key={slot.time} slot={slot} />
                  ))}

                  {teeData?.slots?.length === 0 && (
                    <Text
                      style={{
                        textAlign: "center",
                        marginTop: 40,
                        color: isDark ? "#94a3b8" : "#6b7280",
                      }}
                    >
                      No slots available
                    </Text>
                  )}
                </>
              )}
            </Box>
          </VStack>
        </ScrollView>

        {/* SELECT MEMBER CATEGORY MODAL */}
        <Modal
          visible={memberCategoryModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMemberCategoryModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                padding: 20,
                borderRadius: 20,
                width: "100%",
                maxWidth: 420,
                borderWidth: 1,
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: isDark ? "#ffffff" : "#0f172a",
                  }}
                >
                  Select Member Category
                </Text>
                <TouchableOpacity
                  onPress={() => setMemberCategoryModalVisible(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? "#94a3b8" : "#64748b"}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#94a3b8" : "#64748b",
                  marginBottom: 18,
                  lineHeight: 18,
                }}
              >
                Please select your category for this course. Club members are not charged.
              </Text>

              <View style={{ gap: 12 }}>
                {/* 1. CLUB MEMBER OPTION */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isClubMemberForSelectedCourse) {
                      bookSeatHandler("Club Member");
                    }
                  }}
                  disabled={!isClubMemberForSelectedCourse}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isClubMemberForSelectedCourse
                      ? "#8BC34A"
                      : isDark
                        ? "#1e293b"
                        : "#e2e8f0",
                    backgroundColor: isClubMemberForSelectedCourse
                      ? isDark
                        ? "rgba(139,195,74,0.12)"
                        : "rgba(139,195,74,0.06)"
                      : isDark
                        ? "rgba(30,41,59,0.3)"
                        : "#f8fafc",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: isClubMemberForSelectedCourse ? 1 : 0.6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginRight: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: isClubMemberForSelectedCourse
                          ? "rgba(139,195,74,0.2)"
                          : isDark
                            ? "#1e293b"
                            : "#e2e8f0",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name="star"
                        size={20}
                        color={
                          isClubMemberForSelectedCourse
                            ? "#8BC34A"
                            : "#94a3b8"
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: isClubMemberForSelectedCourse
                            ? "#8BC34A"
                            : isDark
                              ? "#94a3b8"
                              : "#64748b",
                        }}
                      >
                        Club Member (₹0)
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isClubMemberForSelectedCourse
                            ? isDark
                              ? "#a3e635"
                              : "#65a30d"
                            : "#ef4444",
                          marginTop: 2,
                        }}
                      >
                        {isClubMemberForSelectedCourse
                          ? "Complimentary access for club members"
                          : "Only available if this course belongs to your club."}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: isClubMemberForSelectedCourse
                        ? "#8BC34A"
                        : isDark
                          ? "#334155"
                          : "#cbd5e1",
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: isClubMemberForSelectedCourse
                          ? "#ffffff"
                          : isDark
                            ? "#94a3b8"
                            : "#475569",
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      ₹0
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. AFFILIATED CLUB OPTION */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => bookSeatHandler("Affiliated")}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: "#3b82f6",
                    backgroundColor: isDark
                      ? "rgba(59,130,246,0.12)"
                      : "rgba(59,130,246,0.06)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginRight: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: "rgba(59,130,246,0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="business" size={20} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: isDark ? "#60a5fa" : "#2563eb",
                        }}
                      >
                        Affiliated Club / Serving / Retired
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isDark ? "#94a3b8" : "#64748b",
                          marginTop: 2,
                        }}
                      >
                        Defence / Retired / Affiliated club rates
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: "#3b82f6",
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      ₹{getSelectedDateRate("Affiliated")}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. NON-AFFILIATED OPTION */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => bookSeatHandler("NonAffiliated")}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isDark ? "#475569" : "#94a3b8",
                    backgroundColor: isDark
                      ? "rgba(100,116,139,0.12)"
                      : "rgba(100,116,139,0.06)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginRight: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: isDark
                          ? "rgba(148,163,184,0.2)"
                          : "rgba(100,116,139,0.15)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name="person"
                        size={20}
                        color={isDark ? "#cbd5e1" : "#475569"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: isDark ? "#e2e8f0" : "#334155",
                        }}
                      >
                        Non-Affiliated Member
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isDark ? "#94a3b8" : "#64748b",
                          marginTop: 2,
                        }}
                      >
                        Civil / Non-affiliated guest rates
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: isDark ? "#475569" : "#64748b",
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      ₹{getSelectedDateRate("Non-Affiliated")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={paymentModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
              paddingBottom: 25,
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#1e293b" : "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                width: "100%",
                maxHeight: "90%",
                paddingBottom: 20,
              }}
            >
              {/* Drag Indicator */}
              <View
                style={{ alignItems: "center", marginTop: 12, marginBottom: 8 }}
              >
                <View
                  style={{
                    width: 40,
                    height: 5,
                    backgroundColor: isDark ? "#475569" : "#cbd5e1",
                    borderRadius: 3,
                  }}
                />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={50}
                  color="#fbbf24"
                  style={{ marginBottom: 10 }}
                />
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: isDark ? "#fff" : "#000",
                    marginBottom: 10,
                  }}
                >
                  Slot Requested!
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    color: isDark ? "#ccc" : "#555",
                    marginBottom: 20,
                  }}
                >
                  Your tee time slot has been reserved. Complete payment to
                  confirm your booking.
                </Text>

                <View
                  style={{
                    backgroundColor: isDark ? "#334155" : "#f8fafc",
                    padding: 15,
                    borderRadius: 10,
                    width: "100%",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: isDark ? "#fff" : "#000",
                    }}
                  >
                    Payment Required:{" "}
                    <Text style={{ color: "#8BC34A" }}>
                      ₹{bookingResponse?.amountToPay}
                    </Text>
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? "#aaa" : "#777",
                      marginTop: 4,
                    }}
                  >
                    Pay the club admin to confirm your slot.
                  </Text>
                </View>

                {bookingResponse?.subAdminUpiId && (
                  <View
                    style={{
                      marginBottom: 20,
                      padding: 10,
                      backgroundColor: "#fff",
                      borderRadius: 10,
                    }}
                  >
                    <QRCode
                      value={`upi://pay?pa=${bookingResponse.subAdminUpiId}&pn=${encodeURIComponent(bookingResponse.subAdminUpiPayeeName)}&am=${bookingResponse.amountToPay}&cu=INR`}
                      size={150}
                    />
                  </View>
                )}

                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                    marginBottom: 5,
                  }}
                >
                  Scan with any UPI app
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#aaa" : "#777",
                    marginBottom: 20,
                  }}
                >
                  Awaiting admin confirmation after payment.
                </Text>

                <Pressable
                  onPress={openUPIApp}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#3b82f6",
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={20}
                    color="#3b82f6"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#3b82f6", fontWeight: "600" }}>
                    Open UPI App
                  </Text>
                </Pressable>

                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#aaa" : "#777",
                    marginBottom: 5,
                  }}
                >
                  Or pay to this UPI ID:
                </Text>
                <View
                  style={{
                    width: "100%",
                    padding: 12,
                    backgroundColor: isDark ? "#334155" : "#f1f5f9",
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      color: isDark ? "#fff" : "#000",
                    }}
                  >
                    {bookingResponse?.subAdminUpiId}
                  </Text>
                </View>

                <View style={{ width: "100%", marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? "#fff" : "#000",
                      marginBottom: 5,
                      fontWeight: "500",
                    }}
                  >
                    Upload Payment Screenshot
                  </Text>
                  {screenshotUploaded ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        backgroundColor: "rgba(139,195,74,0.1)",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#8BC34A",
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#8BC34A"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{ color: "#8BC34A", fontWeight: "600", flex: 1 }}
                      >
                        Screenshot uploaded. Awaiting admin approval.
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleUploadScreenshot}
                      disabled={uploadingScreenshot}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        borderWidth: 1,
                        borderColor: isDark ? "#475569" : "#e2e8f0",
                        borderRadius: 10,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: isDark ? "#334155" : "#f1f5f9",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 5,
                          marginRight: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: isDark ? "#fff" : "#000",
                            fontSize: 12,
                          }}
                        >
                          Choose File
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: isDark ? "#aaa" : "#777",
                          fontSize: 12,
                        }}
                      >
                        {uploadingScreenshot
                          ? "Uploading..."
                          : screenshotUri
                            ? "File selected"
                            : "No file chosen"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <Pressable
                  onPress={() => {
                    setPaymentModalVisible(false);
                    fetchTeeTiming(false);
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#475569" : "#cbd5e1",
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#cbd5e1" : "#64748b",
                      fontWeight: "600",
                    }}
                  >
                    Close
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={cancelModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#1e293b" : "#fff",
                padding: 20,
                borderRadius: 12,
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "#fff" : "#000",
                  marginBottom: 15,
                }}
              >
                Cancel Booking
              </Text>
              <Text
                style={{ color: isDark ? "#ccc" : "#555", marginBottom: 20 }}
              >
                Are you sure you want to cancel this booking?
              </Text>
              <HStack style={{ justifyContent: "flex-end", gap: 10 }}>
                <Pressable
                  onPress={() => setCancelModalVisible(false)}
                  style={{ paddingVertical: 10, paddingHorizontal: 20 }}
                >
                  <Text
                    style={{
                      color: isDark ? "#aaa" : "#777",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCancelModalVisible(false);
                    if (seatToCancel) {
                      cancelBookingHandler(
                        seatToCancel.bookingId,
                        seatToCancel.timeSlot,
                        seatToCancel.seatNumber,
                      );
                    }
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    backgroundColor: "#ef4444",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Ok</Text>
                </Pressable>
              </HStack>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}
