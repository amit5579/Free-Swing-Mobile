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
import {
  Pressable,
  useColorScheme,
  View,
  Modal,
  Linking,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import ImageCropPicker from "react-native-image-crop-picker";
import QRCode from "react-native-qrcode-svg";

import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
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
import { paymentScreenshotCompulsorySchema } from "@/schema/userSchemas";
import ENV from "@/config/env";

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
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<any>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [screenshotViewerUrl, setScreenshotViewerUrl] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [seatToCancel, setSeatToCancel] = useState<any>(null);
  const [seatActionModalVisible, setSeatActionModalVisible] = useState(false);
  const [activeSeatAction, setActiveSeatAction] = useState<any>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeeTiming(false);
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

  const fetchCourses = async () => {
    try {
      const courseResponse = await getSubAdminCourses();
      const formattedCourses = courseResponse.map((c: any) => ({
        label: c.name || `Course ${c.courseId}`,
        value: c.courseId,
        ...c,
      }));

      setCourses(formattedCourses);
      if (formattedCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(formattedCourses[0].value);
      }
      return formattedCourses;
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  };

  const fetchTeeTiming = async (
    showSkeleton = false,
    courseIdToUse?: any,
    dateToUse?: string,
    teeToUse?: number,
  ) => {
    const courseId = courseIdToUse ?? selectedCourse;
    const date = dateToUse ?? availableDates[selectedDateIndex];
    const tee = teeToUse ?? activeTeeTab;

    if (!courseId || !date) return;

    try {
      if (showSkeleton) setLoading(true);
      const teeDetails = await getTeeTimeSeats(courseId, date, tee);
      setTeeData(teeDetails);
    } catch (error) {
      console.error("Error fetching tee timings:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clubMemberCourseIds, setClubMemberCourseIds] = useState<number[]>([]);
  const [allSubAdmins, setAllSubAdmins] = useState<any[]>([]);

  useEffect(() => {
    const loadUserAndClubData = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) {
          setUserId(Number(id));
        }
        const user = await getProfile();
        setCurrentUser(user);

        const subAdmins = await getSubAdminList();
        if (Array.isArray(subAdmins)) {
          setAllSubAdmins(subAdmins);
        }

        const userSubAdminId =
          user?.invitedBySubAdminId ?? user?.subAdminId;
        if (userSubAdminId && Array.isArray(subAdmins)) {
          const club = subAdmins.find(
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

  const getSubAdminForCourse = (courseId: any) => {
    if (!courseId || !allSubAdmins || allSubAdmins.length === 0) return null;
    const numId = Number(courseId);
    return allSubAdmins.find(
      (sa: any) =>
        (Array.isArray(sa.courses) &&
          sa.courses.some(
            (c: any) => Number(c.courseId ?? c.id) === numId,
          )) ||
        (Array.isArray(sa.courseIds) &&
          sa.courseIds.some((cid: any) => Number(cid) === numId)),
    );
  };

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

      setScreenshotUri(null);
      setSelectedFileForUpload(null);
      setScreenshotUploaded(false);

      const matchedSubAdmin = getSubAdminForCourse(selectedCourse);
      const subAdminUpi = (
        resp?.subAdminUpiId ||
        matchedSubAdmin?.upiId ||
        currentCourseObj?.subAdminUpiId ||
        currentCourseObj?.upiId ||
        ""
      ).trim();

      const subAdminPayee = (
        resp?.subAdminUpiPayeeName ||
        resp?.subAdminName ||
        matchedSubAdmin?.upiPayeeName ||
        matchedSubAdmin?.username ||
        currentCourseObj?.subAdminUpiPayeeName ||
        "Club Admin"
      ).trim();

      const amt = Number(resp?.amountToPay ?? 0);

      if (amt > 0) {
        setScreenshotError(null);
        setBookingResponse({
          ...resp,
          amountToPay: amt,
          subAdminUpiId: subAdminUpi,
          subAdminUpiPayeeName: subAdminPayee,
          subAdminName: subAdminPayee,
        });
        setPaymentModalVisible(true);
        // Silently update slots in background without blocking payment modal
        fetchTeeTiming(false);
      } else {
        Toast.show({
          type: "success",
          text1: "Seat Booked",
          text2:
            memberCategory === "Club Member" || amt === 0
              ? "Complimentary club member seat confirmed."
              : "Seat booked successfully.",
        });
        await fetchTeeTiming(false);
      }
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

  const openPaymentForExistingBooking = (seat: any) => {
    const matchedSubAdmin = getSubAdminForCourse(selectedCourse);
    const upiId = (
      matchedSubAdmin?.upiId ||
      currentCourseObj?.subAdminUpiId ||
      currentCourseObj?.upiId ||
      ""
    ).trim();
    const payee = (
      matchedSubAdmin?.upiPayeeName ||
      matchedSubAdmin?.username ||
      currentCourseObj?.subAdminUpiPayeeName ||
      "Club Admin"
    ).trim();
    const amount = Number(
      seat.amountToPay ?? getSelectedDateRate("Non-Affiliated"),
    );

    setScreenshotError(null);
    setBookingResponse({
      bookingId: seat.bookingId,
      amountToPay: amount,
      paymentStatus: seat.paymentStatus || "Pending",
      subAdminUpiId: upiId,
      subAdminUpiPayeeName: payee,
      subAdminName: payee,
    });
    const apiOrigin = (ENV.API_BASE_URL || "http://192.168.29.150:5281/api/").replace(/\/api\/?$/i, "");
    setScreenshotUri(
      seat.paymentScreenshotUrl
        ? seat.paymentScreenshotUrl.startsWith("http")
          ? seat.paymentScreenshotUrl
          : `${apiOrigin}${seat.paymentScreenshotUrl.startsWith("/") ? "" : "/"}${seat.paymentScreenshotUrl}`
        : null,
    );
    setSelectedFileForUpload(null);
    setScreenshotUploaded(Boolean(seat.paymentScreenshotUrl));
    setPaymentModalVisible(true);
  };

  const handleOpenSeatActions = (seat: any, slot: any) => {
    setActiveSeatAction({ seat, slot });
    setSeatActionModalVisible(true);
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

      await fetchTeeTiming(false);
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

  const handlePickScreenshot = async () => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: false,
        cropperChooseText: "Done/Submit",
        cropperToolbarTitle: "Select Payment Screenshot",
      });

      const fileName =
        result.filename || result.path.split("/").pop() || "screenshot.jpg";
      const mimeType = result.mime || "image/jpeg";

      setSelectedFileForUpload({
        path: result.path,
        mime: mimeType,
        filename: fileName,
      });
      setScreenshotUri(result.path);
      setScreenshotUploaded(false);
      setScreenshotError(null);
    } catch (err: any) {
      if (err.code !== "E_PICKER_CANCELLED") {
        console.error("Screenshot picker error:", err);
      }
    }
  };

  const handleUploadScreenshot = async () => {
    if (!selectedFileForUpload || !bookingResponse?.bookingId) {
      setScreenshotError("Please choose a payment screenshot image first.");
      return;
    }

    try {
      setScreenshotError(null);
      setUploadingScreenshot(true);
      await uploadTeeBookingScreenshot(
        bookingResponse.bookingId,
        selectedFileForUpload.path,
        selectedFileForUpload.mime,
        selectedFileForUpload.filename,
      );
      setScreenshotUploaded(true);
      Toast.show({
        type: "success",
        text1: "Screenshot Uploaded",
        text2: "Awaiting admin verification.",
      });
      fetchTeeTiming(false);
      setTimeout(() => {
        setPaymentModalVisible(false);
        setSelectedFileForUpload(null);
        setScreenshotUri(null);
        setScreenshotUploaded(false);
        setScreenshotError(null);
      }, 1500);
    } catch (error) {
      setScreenshotError("Failed to upload screenshot. Please try again.");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleClosePaymentModal = () => {
    const result = paymentScreenshotCompulsorySchema.safeParse({
      screenshotUploaded,
    });
    if (!result.success) {
      const errorMsg =
        result.error.issues[0]?.message ||
        "Upload of the screenshot is compulsory.";
      setScreenshotError(errorMsg);
      return;
    }
    setScreenshotError(null);
    setPaymentModalVisible(false);
    setSelectedFileForUpload(null);
    setScreenshotUri(null);
    setScreenshotUploaded(false);
    fetchTeeTiming(false);
  };

  const handleCancelFromPaymentModal = async () => {
    setScreenshotError(null);
    if (!bookingResponse?.bookingId) {
      setPaymentModalVisible(false);
      return;
    }
    try {
      setLoading(true);
      await cancelSeatBooking(bookingResponse.bookingId);
      Toast.show({
        type: "info",
        text1: "Booking Cancelled",
        text2: "Your reservation was released.",
      });
      setPaymentModalVisible(false);
      setSelectedFileForUpload(null);
      setScreenshotUri(null);
      setScreenshotUploaded(false);
      await fetchTeeTiming(false);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to cancel booking.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openUPIApp = () => {
    if (!bookingResponse) return;
    const upiId = bookingResponse.subAdminUpiId?.trim();
    if (!upiId) {
      Toast.show({
        type: "error",
        text1: "UPI Not Configured",
        text2: "The club admin has not configured a UPI ID.",
      });
      return;
    }
    const payeeName =
      bookingResponse.subAdminUpiPayeeName ||
      bookingResponse.subAdminName ||
      "Club Admin";
    const url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${bookingResponse.amountToPay}&cu=INR`;
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

    for (let i = 0; i < 7; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      arr.push(formatDate(newDate));
    }

    setAvailableDates(arr);
  }, []);

  // Initial load: fetch courses once, then fetch initial slots once
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const cList = await fetchCourses();
        const initialCourse = cList.length > 0 ? cList[0].value : null;
        if (initialCourse && availableDates.length > 0) {
          const initialDate = availableDates[0] || formatDate(new Date());
          const teeDetails = await getTeeTimeSeats(
            initialCourse,
            initialDate,
            activeTeeTab,
          );
          setTeeData(teeDetails);
        }
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (availableDates.length > 0) {
      init();
    }
  }, [availableDates.length]);

  // Update slots silently on date, tee, or course changes without full screen flicker
  useEffect(() => {
    if (availableDates.length > 0 && selectedCourse) {
      fetchTeeTiming(false);
    }
  }, [selectedDateIndex, activeTeeTab, selectedCourse]);
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
                backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#f1f5f9",
              }}
              android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color="#8BC34A"
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
        </VStack>
      </Box>
    );
  };

  const TeeRow = ({ slot }: any) => {
    const isSlotExpired = () => {
      if (!availableDates[selectedDateIndex]) return false;
      const [slotHours, slotMinutes] = slot.time.split(":").map(Number);
      let hours = slotHours;
      if (slot.time.toLowerCase().includes("pm") && hours < 12) hours += 12;
      if (slot.time.toLowerCase().includes("am") && hours === 12) hours = 0;
      const minutes = isNaN(slotMinutes) ? 0 : slotMinutes;

      const slotDate = new Date(availableDates[selectedDateIndex]);
      slotDate.setHours(hours, minutes, 0, 0);
      return slotDate.getTime() < new Date().getTime();
    };

    const isExpired = isSlotExpired();

    return (
      <Box
        style={{
          marginBottom: 16,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.2 : 0.05,
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
                  height: 74,
                  borderRadius: 12,
                  marginBottom: 10,
                  backgroundColor: bgColor,
                  overflow: "hidden",
                  position: "relative",
                  borderWidth: isMine ? 1.5 : 0,
                  borderColor: isMine
                    ? isRequested
                      ? "#ca8a04"
                      : "#dc2626"
                    : "transparent",
                }}
              >
                <Pressable
                  onPress={() => {
                    if (isLoading || seatExpired) return;

                    if (isBooked) {
                      if (isMine && seat.bookingId) {
                        handleOpenSeatActions(seat, slot);
                      } else {
                        Toast.show({
                          type: "info",
                          text1: "Seat Booked",
                          text2: `This seat is booked by ${seat.userName || "another player"}.`,
                        });
                      }
                    } else {
                      initiateBooking(slot.time, seat.seatNumber);
                    }
                  }}
                  disabled={isLoading || seatExpired}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
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
                                ? "time-outline"
                                : "checkmark-circle"
                              : "person"
                            : "add-circle-sharp"
                    }
                    size={20}
                    color="#fff"
                    style={{ marginBottom: 2 }}
                  />

                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "#fff",
                      textAlign: "center",
                    }}
                  >
                    {isLoading
                      ? "Wait..."
                      : seatExpired
                        ? "Expired"
                        : isBooked
                          ? isMine
                            ? isRequested
                              ? "Requested"
                              : "My Seat"
                            : seat.userName || "Booked"
                          : "Book"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: "#fff",
                    }}
                  >
                    Seat {seat.seatNumber}
                  </Text>
                </Pressable>

                {/* Status indicator badge on top-right */}
                {isBooked && isMine && (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: isRequested
                        ? seat.paymentScreenshotUrl
                          ? "#3b82f6"
                          : "#f59e0b"
                        : "#22c55e",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: "#fff",
                    }}
                  >
                    <Ionicons
                      name={
                        isRequested
                          ? seat.paymentScreenshotUrl
                            ? "document-text"
                            : "alert"
                          : "checkmark"
                      }
                      size={8}
                      color="#fff"
                    />
                  </View>
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
          backgroundColor: isDark ? "#161618" : "#ffffff",
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
                  style={{ borderRadius: 10 }}
                  onPress={() => fetchTeeTiming(false)}
                >
                  <LinearGradient
                    colors={["#8bc34a", "#558b2f"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#8bc34a",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      elevation: 3,
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#fff" />
                  </LinearGradient>
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
                    className="flex-1"
                    style={{ borderRadius: 30 }}
                  >
                    {active ? (
                      <LinearGradient
                        colors={["#8bc34a", "#558b2f"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: 30,
                          shadowColor: "#8bc34a",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.35,
                          shadowRadius: 8,
                          elevation: 5,
                        }}
                        className="px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons
                          name="golf-outline"
                          size={16}
                          color="#fff"
                          className="mr-1"
                        />
                        <Text
                          className="text-md text-white"
                          style={{ fontWeight: "800" }}
                        >
                          {tab.label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View className="px-4 py-4 flex-row items-center justify-center">
                        <Ionicons
                          name="golf-outline"
                          size={16}
                          color={isDark ? "#aaa" : "#6b7280"}
                          className="mr-1"
                        />
                        <Text
                          className={`text-md font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {tab.label}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </HStack>

            <Box>
              {loading ? (
                <>
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

                  {(!teeData?.slots || teeData?.slots?.length === 0) && (
                    <Box
                      className="py-12 px-6 rounded-2xl items-center mt-2 border"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(15, 23, 42, 0.7)"
                          : "rgba(255, 255, 255, 0.7)",
                        borderColor: isDark
                          ? "rgba(139, 195, 74, 0.35)"
                          : "rgba(139, 195, 74, 0.45)",
                        borderRadius: 20,
                        shadowColor: "#8BC34A",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.2 : 0.08,
                        shadowRadius: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: isDark
                            ? "rgba(139, 195, 74, 0.12)"
                            : "rgba(139, 195, 74, 0.15)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 14,
                        }}
                      >
                        <Ionicons name="golf-outline" size={34} color="#8BC34A" />
                      </View>
                      <Text
                        style={{
                          color: isDark ? "#ffffff" : "#111827",
                          fontSize: 17,
                          fontWeight: "700",
                          textAlign: "center",
                        }}
                      >
                        No Tee Time Slots Available
                      </Text>
                      <Text
                        style={{
                          color: isDark ? "#94a3b8" : "#64748b",
                          fontSize: 13,
                          textAlign: "center",
                          marginTop: 6,
                          lineHeight: 18,
                          maxWidth: 280,
                        }}
                      >
                        There are no tee times scheduled for this date or course. Try picking another date or refresh.
                      </Text>
                      <Pressable
                        onPress={() => fetchTeeTiming()}
                        style={{ borderRadius: 9999, marginTop: 20 }}
                      >
                        <LinearGradient
                          colors={["#8bc34a", "#558b2f"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 9999,
                            flexDirection: "row",
                            alignItems: "center",
                            shadowColor: "#8bc34a",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 13 }}>
                            Refresh Slots
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </Box>
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
                  onPress={() => bookSeatHandler("Non-Affiliated")}
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

        {/* SEAT ACTION BOTTOM SHEET MODAL */}
        <Modal
          visible={seatActionModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSeatActionModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 32,
                borderWidth: 1,
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              {/* Drag Handle */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 44,
                    height: 5,
                    backgroundColor: isDark ? "#475569" : "#cbd5e1",
                    borderRadius: 3,
                  }}
                />
              </View>

              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: isDark ? "#fff" : "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    Seat {activeSeatAction?.seat?.seatNumber} • {activeSeatAction?.slot?.time}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    {currentCourseObj?.name || "Golf Course"} • Tee {activeTeeTab} • {availableDates[selectedDateIndex]}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSeatActionModalVisible(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? "#94a3b8" : "#64748b"}
                  />
                </Pressable>
              </View>

              {/* Status Banner */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 20,
                  backgroundColor:
                    activeSeatAction?.seat?.paymentStatus === "Pending" ||
                    activeSeatAction?.seat?.status === "Requested"
                      ? activeSeatAction?.seat?.paymentScreenshotUrl
                        ? "rgba(59, 130, 246, 0.12)"
                        : "rgba(234, 179, 8, 0.12)"
                      : "rgba(34, 197, 94, 0.12)",
                  borderWidth: 1,
                  borderColor:
                    activeSeatAction?.seat?.paymentStatus === "Pending" ||
                    activeSeatAction?.seat?.status === "Requested"
                      ? activeSeatAction?.seat?.paymentScreenshotUrl
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(234, 179, 8, 0.3)"
                      : "rgba(34, 197, 94, 0.3)",
                }}
              >
                <Ionicons
                  name={
                    activeSeatAction?.seat?.paymentStatus === "Pending" ||
                    activeSeatAction?.seat?.status === "Requested"
                      ? activeSeatAction?.seat?.paymentScreenshotUrl
                        ? "shield-checkmark-outline"
                        : "time-outline"
                      : "checkmark-circle-outline"
                  }
                  size={22}
                  color={
                    activeSeatAction?.seat?.paymentStatus === "Pending" ||
                    activeSeatAction?.seat?.status === "Requested"
                      ? activeSeatAction?.seat?.paymentScreenshotUrl
                        ? "#3b82f6"
                        : "#eab308"
                      : "#22c55e"
                  }
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color:
                        activeSeatAction?.seat?.paymentStatus === "Pending" ||
                        activeSeatAction?.seat?.status === "Requested"
                          ? activeSeatAction?.seat?.paymentScreenshotUrl
                            ? "#3b82f6"
                            : "#eab308"
                          : "#22c55e",
                      marginBottom: 2,
                    }}
                  >
                    {activeSeatAction?.seat?.paymentStatus === "Pending" ||
                    activeSeatAction?.seat?.status === "Requested"
                      ? activeSeatAction?.seat?.paymentScreenshotUrl
                        ? "Proof Uploaded"
                        : "Payment Pending"
                      : "Booking Confirmed"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: isDark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    {activeSeatAction?.seat?.paymentStatus === "Pending" ||
                    activeSeatAction?.seat?.status === "Requested"
                      ? activeSeatAction?.seat?.paymentScreenshotUrl
                        ? "Your payment screenshot is awaiting admin approval."
                        : "Please complete payment and upload screenshot to confirm."
                      : "Your seat has been successfully booked and confirmed."}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 10 }}>
                {/* Pay / Upload Screenshot Button */}
                {(activeSeatAction?.seat?.paymentStatus === "Pending" ||
                  activeSeatAction?.seat?.status === "Requested") &&
                  !activeSeatAction?.seat?.paymentScreenshotUrl && (
                  <Pressable
                    onPress={() => {
                      const seat = activeSeatAction?.seat;
                      setSeatActionModalVisible(false);
                      setTimeout(() => {
                        if (seat) openPaymentForExistingBooking(seat);
                      }, 250);
                    }}
                    style={{ borderRadius: 12, overflow: "hidden" }}
                  >
                    <LinearGradient
                      colors={["#8bc34a", "#558b2f"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        Pay & Upload Screenshot
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}

                {/* View Uploaded Screenshot Button */}
                {/* {activeSeatAction?.seat?.paymentScreenshotUrl ? (
                  <Pressable
                    onPress={() => {
                      const seat = activeSeatAction?.seat;
                      setSeatActionModalVisible(false);
                      setTimeout(() => {
                        if (seat?.paymentScreenshotUrl) {
                          const apiOrigin = (ENV.API_BASE_URL || "http://192.168.29.150:5281/api/").replace(/\/api\/?$/i, "");
                          const path = seat.paymentScreenshotUrl.startsWith("/")
                            ? seat.paymentScreenshotUrl
                            : `/${seat.paymentScreenshotUrl}`;
                          const url = seat.paymentScreenshotUrl.startsWith("http")
                            ? seat.paymentScreenshotUrl
                            : `${apiOrigin}${path}`;
                          setScreenshotViewerUrl(url);
                        }
                      }, 250);
                    }}
                    style={{
                      paddingVertical: 13,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59, 130, 246, 0.08)",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="image-outline"
                      size={18}
                      color="#3b82f6"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: "#3b82f6",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      View Uploaded Screenshot
                    </Text>
                  </Pressable>
                ) : null} */}

                {/* Cancel Booking Button */}
                <Pressable
                  onPress={() => {
                    const seat = activeSeatAction?.seat;
                    const slot = activeSeatAction?.slot;
                    setSeatActionModalVisible(false);
                    setTimeout(() => {
                      if (seat?.bookingId) {
                        setSeatToCancel({
                          bookingId: seat.bookingId,
                          timeSlot: slot?.time,
                          seatNumber: seat.seatNumber,
                        });
                        setCancelModalVisible(true);
                      }
                    }, 250);
                  }}
                  style={{
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color="#ef4444"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: "#ef4444",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Cancel Booking
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={paymentModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClosePaymentModal}
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

                {bookingResponse?.subAdminUpiId ? (
                  <>
                    <View
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 5,
                        elevation: 3,
                      }}
                    >
                      <QRCode
                        value={`upi://pay?pa=${encodeURIComponent(
                          bookingResponse.subAdminUpiId.trim()
                        )}&pn=${encodeURIComponent(
                          bookingResponse.subAdminUpiPayeeName ||
                            bookingResponse.subAdminName ||
                            "Club Admin"
                        )}&am=${bookingResponse.amountToPay}&cu=INR`}
                        size={150}
                      />
                    </View>

                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: isDark ? "#fff" : "#000",
                        marginBottom: 4,
                      }}
                    >
                      Scan with any UPI app
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#aaa" : "#777",
                        marginBottom: 16,
                        textAlign: "center",
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
                        marginBottom: 16,
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
                        selectable
                        style={{
                          fontWeight: "700",
                          color: isDark ? "#fff" : "#000",
                          fontSize: 15,
                        }}
                      >
                        {bookingResponse.subAdminUpiId}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      backgroundColor: isDark
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(245, 158, 11, 0.1)",
                      borderWidth: 1,
                      borderColor: "#f59e0b",
                      marginBottom: 20,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={24}
                      color="#f59e0b"
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={{
                        color: isDark ? "#fbbf24" : "#d97706",
                        fontSize: 13,
                        textAlign: "center",
                        fontWeight: "500",
                        lineHeight: 18,
                      }}
                    >
                      The club admin has not configured a UPI ID. Please contact the club directly for payment and upload your receipt below.
                    </Text>
                  </View>
                )}

                <View style={{ width: "100%", marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? "#fff" : "#000",
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    Upload Payment Screenshot
                  </Text>

                  {screenshotUploaded ? (
                    <View style={{ width: "100%" }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 14,
                          backgroundColor: "rgba(139,195,74,0.15)",
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: "#8BC34A",
                          width: "100%",
                          marginBottom: 10,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#8BC34A"
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: "#8BC34A",
                            fontWeight: "600",
                            flex: 1,
                            fontSize: 13,
                          }}
                        >
                          Screenshot uploaded. Awaiting admin approval.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ width: "100%" }}>
                      {/* Button to pick image */}
                      <Pressable
                        onPress={handlePickScreenshot}
                        disabled={uploadingScreenshot}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          borderWidth: 1,
                          borderColor: isDark ? "#475569" : "#e2e8f0",
                          borderRadius: 10,
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "#f8fafc",
                          marginBottom: screenshotUri ? 10 : 0,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: isDark ? "#334155" : "#e2e8f0",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                            marginRight: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: isDark ? "#fff" : "#000",
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            {screenshotUri ? "Change File" : "Choose File"}
                          </Text>
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: isDark ? "#cbd5e1" : "#64748b",
                            fontSize: 12,
                            flex: 1,
                          }}
                        >
                          {selectedFileForUpload?.filename ||
                            (screenshotUri
                              ? "Screenshot selected"
                              : "No file chosen")}
                        </Text>
                      </Pressable>

                      {/* Preview selected image thumbnail */}
                      {screenshotUri ? (
                        <View
                          style={{
                            marginVertical: 10,
                            borderRadius: 10,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: isDark ? "#334155" : "#e2e8f0",
                            backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                            alignItems: "center",
                            padding: 8,
                          }}
                        >
                          <Image
                            source={{ uri: screenshotUri }}
                            style={{
                              width: "100%",
                              height: 140,
                              borderRadius: 8,
                              resizeMode: "contain",
                            }}
                          />
                        </View>
                      ) : null}

                      {/* Explicit Upload Button */}
                      {selectedFileForUpload ? (
                        <Pressable
                          onPress={handleUploadScreenshot}
                          disabled={uploadingScreenshot}
                          style={{
                            borderRadius: 10,
                            marginTop: 6,
                            overflow: "hidden",
                          }}
                        >
                          <LinearGradient
                            colors={["#8bc34a", "#558b2f"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              paddingVertical: 12,
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "row",
                            }}
                          >
                            {uploadingScreenshot ? (
                              <ActivityIndicator
                                size="small"
                                color="#fff"
                                style={{ marginRight: 8 }}
                              />
                            ) : (
                              <Ionicons
                                name="cloud-upload-outline"
                                size={18}
                                color="#fff"
                                style={{ marginRight: 8 }}
                              />
                            )}
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: 14,
                              }}
                            >
                              {uploadingScreenshot
                                ? "Uploading..."
                                : "Upload Screenshot"}
                            </Text>
                          </LinearGradient>
                        </Pressable>
                      ) : null}
                    </View>
                  )}
                </View>

                {screenshotError && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark
                        ? "rgba(239,68,68,0.2)"
                        : "#fee2e2",
                      borderWidth: 1.5,
                      borderColor: "#ef4444",
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 10,
                      width: "100%",
                    }}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color="#ef4444"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: isDark ? "#fca5a5" : "#b91c1c",
                        fontSize: 12,
                        fontWeight: "700",
                        flex: 1,
                      }}
                    >
                      {screenshotError}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={handleClosePaymentModal}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#475569" : "#cbd5e1",
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 10,
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

                {!screenshotUploaded && bookingResponse?.bookingId && (
                  <Pressable
                    onPress={handleCancelFromPaymentModal}
                    style={{
                      width: "100%",
                      padding: 10,
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ef4444",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Cancel Booking Instead
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* SCREENSHOT VIEWER MODAL */}
        <Modal
          visible={Boolean(screenshotViewerUrl)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setScreenshotViewerUrl(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.92)",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            <HStack
              style={{
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingHorizontal: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Payment Screenshot
              </Text>
              <Pressable
                onPress={() => setScreenshotViewerUrl(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </HStack>

            {screenshotViewerUrl ? (
              <Image
                source={{ uri: screenshotViewerUrl }}
                style={{
                  width: "100%",
                  height: "80%",
                  borderRadius: 12,
                  resizeMode: "contain",
                }}
              />
            ) : null}
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
