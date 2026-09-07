import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import ImageCropPicker from "react-native-image-crop-picker";
import Toast from "react-native-toast-message";
import {
  getMyTeeTimeBookings,
  cancelSeatBooking,
  uploadTeeBookingScreenshot,
} from "@/api/modules/teeTime.api";
import {
  getMyDrivingRangeBookings,
  cancelDrivingRangeBooking,
  uploadScreenshot as uploadDrivingRangeScreenshot,
} from "@/api/modules/drivingRange.api";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import ENV from "@/config/env";

// Format date into human-readable e.g. "Mar 26, 2026" (aligned with web version)
const formatDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  const cleanDateStr = dateStr.split("T")[0];
  const parts = cleanDateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return d.toLocaleDateString("en-US", options);
  }
  return dateStr;
};

// Dynamic media origin resolution (never hardcoded to a dead domain)
const getScreenshotUrl = (url?: string | null): string => {
  if (!url || typeof url !== "string" || !url.trim()) return "";
  const trimmed = url.trim();
  if (
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = ENV.API_BASE_URL || "http://192.168.29.150:5281/api/";
  const apiOrigin = base.replace(/\/api\/?$/i, "");
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${normalizedPath}`;
};

// Unified Booking Interface (matching web UnifiedBooking model)
export interface NormalizedBooking {
  id: string; // Unique ID (e.g. 'tt-55' or 'dr-52')
  originalId: number;
  type: "Tee Time" | "Driving Range";
  date: string;
  displayDate: string;
  time: string;
  location: string;
  details: string;
  amount: number;
  status: string;
  paymentStatus: string;
  isApproved: boolean;
  isCancelled: boolean;
  isRejected: boolean;
  paymentScreenshotUrl: string | null;
  createdAt: string;
}

export default function MyBookingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [bookings, setBookings] = useState<NormalizedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states matching web (tabs + type filter)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<
    "all" | "Tee Time" | "Driving Range"
  >("all");

  // Screenshot viewer modal state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [selectedScreenshotBooking, setSelectedScreenshotBooking] =
    useState<NormalizedBooking | null>(null);

  // Cancel modal state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedForCancel, setSelectedForCancel] =
    useState<NormalizedBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedForUpload, setSelectedForUpload] =
    useState<NormalizedBooking | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Bookings with unified web mapping
  const fetchBookings = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [teeTimeRes, drRes] = await Promise.all([
        getMyTeeTimeBookings().catch((e) => {
          console.error("Error fetching tee time bookings:", e);
          return [];
        }),
        getMyDrivingRangeBookings().catch((e) => {
          console.error("Error fetching driving range bookings:", e);
          return [];
        }),
      ]);

      // Normalize Tee Time Bookings (exact web logic from my-bookings.ts)
      const ttBookings: NormalizedBooking[] = (teeTimeRes || []).map(
        (b: any) => {
          const isCanc =
            b.status === "Cancelled" || b.paymentStatus === "Cancelled";
          const isRejected =
            b.status === "Rejected" || b.paymentStatus === "Rejected";
          const isAppr =
            !isCanc &&
            !isRejected &&
            (b.paymentStatus === "Approved" ||
              b.paymentStatus === "NotRequired" ||
              b.status === "Booked" ||
              b.status === "Present");

          const ssUrl =
            b.paymentScreenshotUrl &&
            typeof b.paymentScreenshotUrl === "string" &&
            b.paymentScreenshotUrl.trim() !== "" &&
            b.paymentScreenshotUrl.trim().toLowerCase() !== "null" &&
            b.paymentScreenshotUrl.trim().toLowerCase() !== "undefined"
              ? b.paymentScreenshotUrl.trim()
              : null;

          return {
            id: `tt-${b.id}`,
            originalId: b.id,
            type: "Tee Time",
            date: b.date || "",
            displayDate: formatDateDisplay(b.date),
            time: b.timeSlot || "",
            location: b.courseName || "Golf Course",
            details:
              `Tee #${b.tee || 1}, Seat #${b.seatNumber || 1}` +
              (b.selectedMemberCategory
                ? ` (${b.selectedMemberCategory})`
                : ""),
            amount: b.amountToPay || 0,
            status: b.status || "Requested",
            paymentStatus: b.paymentStatus || "NotRequired",
            isApproved: isAppr,
            isCancelled: isCanc,
            isRejected: isRejected,
            paymentScreenshotUrl: ssUrl,
            createdAt: b.createdAt || b.date || "",
          };
        },
      );

      // Normalize Driving Range Bookings (exact web logic from my-bookings.ts)
      const drBookings: NormalizedBooking[] = (drRes || []).map((b: any) => {
        const isCanc = b.paymentStatus === "Cancelled";
        const isRejected = b.paymentStatus === "Rejected";
        const isAppr =
          !isCanc &&
          !isRejected &&
          (b.paymentStatus === "Paid" || b.paymentStatus === "Approved");

        const cleanDate = b.slotDate ? b.slotDate.split("T")[0] : "";
        const ssUrl =
          b.paymentScreenshotUrl &&
          typeof b.paymentScreenshotUrl === "string" &&
          b.paymentScreenshotUrl.trim() !== "" &&
          b.paymentScreenshotUrl.trim().toLowerCase() !== "null" &&
          b.paymentScreenshotUrl.trim().toLowerCase() !== "undefined"
            ? b.paymentScreenshotUrl.trim()
            : null;

        return {
          id: `dr-${b.id}`,
          originalId: b.id,
          type: "Driving Range",
          date: cleanDate,
          displayDate: formatDateDisplay(b.slotDate),
          time: b.slotTime || "",
          location: b.subAdmin
            ? `Driving Range (${b.subAdmin.courses && b.subAdmin.courses.length > 0 ? b.subAdmin.courses[0].name : b.subAdmin.username})`
            : "Driving Range",
          details: `${b.numberOfSlots || 1} Slot(s)`,
          amount: b.totalAmount || 0,
          status: b.paymentStatus || "Pending",
          paymentStatus: b.paymentStatus || "Pending",
          isApproved: isAppr,
          isCancelled: isCanc,
          isRejected: isRejected,
          paymentScreenshotUrl: ssUrl,
          createdAt: b.createdAt || cleanDate || "",
        };
      });

      // Sort newest first
      const combined = [...ttBookings, ...drBookings].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      });

      setBookings(combined);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Toast.show({ type: "error", text1: "Failed to fetch bookings" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Cancel Handler
  const handleCancelBooking = async () => {
    if (!selectedForCancel) return;
    setCancelling(true);
    try {
      if (selectedForCancel.type === "Tee Time") {
        await cancelSeatBooking(selectedForCancel.originalId);
      } else {
        await cancelDrivingRangeBooking(selectedForCancel.originalId);
      }
      Toast.show({ type: "success", text1: "Booking cancelled successfully" });
      setCancelModalVisible(false);
      setSelectedForCancel(null);
      // Immediately refresh bookings
      await fetchBookings(true);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Toast.show({ type: "error", text1: "Failed to cancel booking" });
    } finally {
      setCancelling(false);
    }
  };

  // Image picker for proof upload
  const pickImage = async () => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: true,
        cropperChooseText: "Done/Submit",
        cropperToolbarTitle: "Edit Image",
      });

      setSelectedImage({
        uri: result.path,
        type: result.mime || "image/jpeg",
        name:
          result.filename || result.path.split("/").pop() || "screenshot.jpg",
      });
    } catch (error: any) {
      if (error.code !== "E_PICKER_CANCELLED") {
        console.log("Image picker error:", error);
      }
    }
  };

  // Upload proof handler
  const handleUploadProof = async () => {
    if (!selectedForUpload || !selectedImage) return;
    setUploading(true);
    try {
      if (selectedForUpload.type === "Tee Time") {
        await uploadTeeBookingScreenshot(
          selectedForUpload.originalId,
          selectedImage.uri,
          selectedImage.type,
          selectedImage.name,
        );
      } else {
        await uploadDrivingRangeScreenshot(
          selectedForUpload.originalId,
          selectedImage.uri,
          selectedImage.type,
          selectedImage.name,
        );
      }
      Toast.show({
        type: "success",
        text1: "Screenshot uploaded successfully",
      });
      setUploadModalVisible(false);
      setSelectedForUpload(null);
      setSelectedImage(null);
      await fetchBookings(true);
    } catch (error) {
      console.error("Error uploading screenshot:", error);
      Toast.show({ type: "error", text1: "Failed to upload screenshot" });
    } finally {
      setUploading(false);
    }
  };

  // Open screenshot viewer
  const openScreenshot = (booking: NormalizedBooking) => {
    if (!booking.paymentScreenshotUrl) return;
    const url = getScreenshotUrl(booking.paymentScreenshotUrl);
    if (!url) {
      Toast.show({ type: "info", text1: "No screenshot available" });
      return;
    }
    setSelectedScreenshotBooking(booking);
    setImageViewerUrl(url);
    setImageLoading(true);
    setImageLoadError(false);
    setImageViewerVisible(true);
  };

  // Counts for tabs (exact match with web)
  const pendingCount = bookings.filter(
    (b) => !b.isApproved && !b.isCancelled && !b.isRejected,
  ).length;

  const approvedCount = bookings.filter((b) => b.isApproved).length;

  // Filtered bookings calculation
  const filteredBookings = bookings.filter((b) => {
    let tabMatch = true;
    if (activeTab === "pending") {
      tabMatch = !b.isApproved && !b.isCancelled && !b.isRejected;
    } else if (activeTab === "approved") {
      tabMatch = b.isApproved;
    }

    let typeMatch = true;
    if (typeFilter !== "all") {
      typeMatch = b.type === typeFilter;
    }

    return tabMatch && typeMatch;
  });

  // Card Component
  const renderCard = ({ item }: { item: NormalizedBooking }) => {
    const isTeeTime = item.type === "Tee Time";
    const hasScreenshot = Boolean(item.paymentScreenshotUrl);

    // Status styling & meta
    let statusBg = isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7";
    let statusColor = "#D97706";
    let statusText = "Pending Approval";
    let statusIcon: keyof typeof Ionicons.glyphMap = "hourglass-outline";

    if (item.isCancelled) {
      statusBg = isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2";
      statusColor = "#EF4444";
      statusText = "Cancelled";
      statusIcon = "close-circle";
    } else if (item.isRejected) {
      statusBg = isDark ? "rgba(100, 116, 139, 0.15)" : "#F1F5F9";
      statusColor = "#64748B";
      statusText = "Rejected";
      statusIcon = "ban";
    } else if (item.isApproved) {
      statusBg = isDark ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7";
      statusColor = "#16A34A";
      statusText = "Approved";
      statusIcon = "checkmark-circle";
    }

    // Action conditions aligned with web
    const showScreenshotBtn =
      hasScreenshot && !item.isCancelled && !item.isRejected;
    const showUploadBtn =
      !item.isApproved &&
      !item.isCancelled &&
      !item.isRejected &&
      item.amount > 0;
    const showCancelBtn = !item.isCancelled && !item.isRejected;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            borderColor: isDark ? "#334155" : "#e2e8f0",
          },
        ]}
      >
        {/* Card Header: Type Badge + Status Badge */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeTag,
              {
                backgroundColor: isTeeTime
                  ? isDark
                    ? "rgba(139, 195, 74, 0.15)"
                    : "#F1F8E9"
                  : isDark
                    ? "rgba(168, 85, 247, 0.15)"
                    : "#FAF5FF",
              },
            ]}
          >
            <Ionicons
              name={isTeeTime ? "calendar-number-outline" : "golf-outline"}
              size={13}
              color={isTeeTime ? "#689F38" : "#9333EA"}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.typeText,
                { color: isTeeTime ? "#558B2F" : "#7E22CE" },
              ]}
            >
              {item.type}
            </Text>
          </View>

          <View style={[styles.statusTag, { backgroundColor: statusBg }]}>
            <Ionicons
              name={statusIcon}
              size={13}
              color={statusColor}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Card Body: Info Grid */}
        <View style={styles.cardBody}>
          {/* Date & Time */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? "#334155" : "#f1f5f9" },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={[
                  styles.infoMainText,
                  { color: isDark ? "#f1f5f9" : "#0f172a" },
                ]}
              >
                {item.displayDate || item.date}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isDark ? "#cbd5e1" : "#475569",
                  }}
                >
                  {item.time}
                </Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? "#334155" : "#f1f5f9" },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.infoMainText,
                { color: isDark ? "#f1f5f9" : "#0f172a" },
              ]}
            >
              {item.location}
            </Text>
          </View>

          {/* Details & Amount in row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            {/* Details Badge */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#E2E8F0",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                maxWidth: "60%",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isDark ? "#cbd5e1" : "#334155",
                }}
              >
                {item.details}
              </Text>
            </View>

            {/* Amount */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color:
                    item.amount > 0
                      ? isDark
                        ? "#4ade80"
                        : "#16a34a"
                      : isDark
                        ? "#94a3b8"
                        : "#64748b",
                }}
              >
                {item.amount > 0 ? `₹${item.amount}` : "Free / N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Actions Footer */}
        {(showScreenshotBtn ||
          showUploadBtn ||
          showCancelBtn ||
          item.isCancelled ||
          item.isRejected) && (
          <View
            style={[
              styles.cardActions,
              { borderTopColor: isDark ? "#334155" : "#f1f5f9" },
            ]}
          >
            {item.isCancelled ? (
              <View style={styles.cancelledBanner}>
                <Ionicons
                  name="close-circle-outline"
                  size={15}
                  color="#EF4444"
                />
                <Text style={styles.cancelledBannerText}>
                  This booking has been cancelled.
                </Text>
              </View>
            ) : item.isRejected ? (
              <View style={styles.rejectedBanner}>
                <Ionicons name="ban-outline" size={15} color="#64748B" />
                <Text style={styles.rejectedBannerText}>
                  This booking was rejected.
                </Text>
              </View>
            ) : (
              <View style={styles.actionButtonsRow}>
                {/* View Screenshot (Conditional: hasScreenshot && !isCancelled && !isRejected) */}
                {showScreenshotBtn && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isDark
                          ? "rgba(33, 150, 243, 0.1)"
                          : "#EFF6FF",
                        borderColor: isDark
                          ? "rgba(33, 150, 243, 0.3)"
                          : "#BFDBFE",
                      },
                    ]}
                    onPress={() => openScreenshot(item)}
                  >
                    <Ionicons name="image-outline" size={15} color="#2563EB" />
                    <Text style={[styles.actionBtnText, { color: "#2563EB" }]}>
                      Screenshot
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Upload / Re-upload Proof (Conditional: !isApproved && !isCancelled && !isRejected && amount > 0) */}
                {showUploadBtn && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isDark
                          ? "rgba(139, 195, 74, 0.12)"
                          : "#F0FDF4",
                        borderColor: isDark
                          ? "rgba(139, 195, 74, 0.3)"
                          : "#BBF7D0",
                      },
                    ]}
                    onPress={() => {
                      setSelectedForUpload(item);
                      setSelectedImage(null);
                      setUploadModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={15}
                      color="#16A34A"
                    />
                    <Text style={[styles.actionBtnText, { color: "#16A34A" }]}>
                      {hasScreenshot ? "Re-upload" : "Upload Proof"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Cancel Booking */}
                {showCancelBtn && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isDark
                          ? "rgba(239, 68, 68, 0.08)"
                          : "#FEF2F2",
                        borderColor: isDark
                          ? "rgba(239, 68, 68, 0.25)"
                          : "#FECACA",
                      },
                    ]}
                    onPress={() => {
                      setSelectedForCancel(item);
                      setCancelModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={15}
                      color="#EF4444"
                    />
                    <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
          marginBottom: 10,
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 13,
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
              My Bookings
            </ThemedText>

            <Pressable
              onPress={() => fetchBookings(true)}
              disabled={refreshing || loading}
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
                name="refresh-outline"
                size={20}
                color={isDark ? "#fff" : "#020617"}
              />
            </Pressable>
          </HStack>

          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
            }}
          >
            Track Tee Time and Driving Range bookings and approval status.
          </ThemedText>
        </VStack>
      </Box>
    );
  };

  const SkeletonCard = () => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#334155" : "#e2e8f0",
          opacity: 0.7,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={{
            width: 80,
            height: 24,
            borderRadius: 6,
            backgroundColor: isDark ? "#334155" : "#E2E8F0",
          }}
        />
        <View
          style={{
            width: 100,
            height: 24,
            borderRadius: 6,
            backgroundColor: isDark ? "#334155" : "#E2E8F0",
          }}
        />
      </View>
      <View style={styles.cardBody}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: isDark ? "#334155" : "#E2E8F0",
              }}
            />
            <View
              style={{
                width: i === 1 ? "70%" : i === 2 ? "50%" : "30%",
                height: 14,
                borderRadius: 4,
                backgroundColor: isDark ? "#334155" : "#E2E8F0",
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f172a" : "#F8FAFC" },
      ]}
    >
      <Watermark />
      {RenderHeader()}

      {/* Primary Status Tabs (All, Pending, Approved with live counts) */}
      <View style={styles.statusTabsContainer}>
        <TouchableOpacity
          style={[
            styles.statusTabItem,
            activeTab === "all" && styles.statusTabItemActive,
            {
              backgroundColor:
                activeTab === "all"
                  ? isDark
                    ? "#334155"
                    : "#0f172a"
                  : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#ffffff",
              borderColor: isDark ? "#334155" : "#e2e8f0",
            },
          ]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.statusTabText,
              {
                color:
                  activeTab === "all"
                    ? "#ffffff"
                    : isDark
                      ? "#94a3b8"
                      : "#64748b",
              },
            ]}
          >
            All Bookings
          </Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor:
                  activeTab === "all"
                    ? isDark
                      ? "#1e293b"
                      : "#334155"
                    : isDark
                      ? "#334155"
                      : "#f1f5f9",
              },
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                {
                  color:
                    activeTab === "all"
                      ? "#ffffff"
                      : isDark
                        ? "#cbd5e1"
                        : "#475569",
                },
              ]}
            >
              {bookings.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusTabItem,
            activeTab === "pending" && styles.statusTabItemActive,
            {
              backgroundColor:
                activeTab === "pending"
                  ? isDark
                    ? "#334155"
                    : "#0f172a"
                  : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#ffffff",
              borderColor: isDark ? "#334155" : "#e2e8f0",
            },
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.statusTabText,
              {
                color:
                  activeTab === "pending"
                    ? "#ffffff"
                    : isDark
                      ? "#94a3b8"
                      : "#64748b",
              },
            ]}
          >
            Pending
          </Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor:
                  activeTab === "pending"
                    ? isDark
                      ? "#1e293b"
                      : "#334155"
                    : isDark
                      ? "#334155"
                      : "#f1f5f9",
              },
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                {
                  color:
                    activeTab === "pending"
                      ? "#ffffff"
                      : isDark
                        ? "#cbd5e1"
                        : "#475569",
                },
              ]}
            >
              {pendingCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusTabItem,
            activeTab === "approved" && styles.statusTabItemActive,
            {
              backgroundColor:
                activeTab === "approved"
                  ? isDark
                    ? "#334155"
                    : "#0f172a"
                  : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#ffffff",
              borderColor: isDark ? "#334155" : "#e2e8f0",
            },
          ]}
          onPress={() => setActiveTab("approved")}
        >
          <Text
            style={[
              styles.statusTabText,
              {
                color:
                  activeTab === "approved"
                    ? "#ffffff"
                    : isDark
                      ? "#94a3b8"
                      : "#64748b",
              },
            ]}
          >
            Approved
          </Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor:
                  activeTab === "approved"
                    ? isDark
                      ? "#1e293b"
                      : "#334155"
                    : isDark
                      ? "#334155"
                      : "#f1f5f9",
              },
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                {
                  color:
                    activeTab === "approved"
                      ? "#ffffff"
                      : isDark
                        ? "#cbd5e1"
                        : "#475569",
                },
              ]}
            >
              {approvedCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Secondary Type Filter Chips */}
      <View style={styles.typeChipsContainer}>
        {(["all", "Tee Time", "Driving Range"] as const).map((type) => {
          const active = typeFilter === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setTypeFilter(type)}
              style={[
                styles.typeChip,
                {
                  backgroundColor: active
                    ? "#8bc34a"
                    : isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#ffffff",
                  borderColor: active
                    ? "#8bc34a"
                    : isDark
                      ? "#334155"
                      : "#e2e8f0",
                },
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  {
                    color: active ? "#ffffff" : isDark ? "#94a3b8" : "#64748b",
                    fontWeight: active ? "700" : "500",
                  },
                ]}
              >
                {type === "all" ? "All Types" : type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[
            styles.listContent,
            filteredBookings.length === 0 && { flexGrow: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8bc34a"]}
              tintColor={"#8bc34a"}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color={isDark ? "#64748b" : "#94a3b8"}
                />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? "#f1f5f9" : "#0f172a" },
                ]}
              >
                No bookings found
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: isDark ? "#94a3b8" : "#64748b" },
                ]}
              >
                {activeTab === "pending"
                  ? "You have no bookings pending approval."
                  : activeTab === "approved"
                    ? "You have no approved bookings."
                    : "You haven't made any bookings yet."}
              </Text>
            </View>
          }
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCancelModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1e293b" : "#ffffff" },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                </View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? "#ffffff" : "#0f172a", marginBottom: 0 },
                  ]}
                >
                  Cancel Booking
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.modalDesc,
                { color: isDark ? "#cbd5e1" : "#475569" },
              ]}
            >
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </Text>

            {selectedForCancel && (
              <View
                style={[
                  styles.modalDetails,
                  {
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    marginBottom: 2,
                  }}
                >
                  {selectedForCancel.location}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  {selectedForCancel.displayDate || selectedForCancel.date} at{" "}
                  {selectedForCancel.time} &bull; {selectedForCancel.details}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtnCancel,
                  { backgroundColor: isDark ? "#334155" : "#f1f5f9" },
                ]}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
              >
                <Text
                  style={[
                    styles.modalBtnCancelText,
                    { color: isDark ? "#cbd5e1" : "#475569" },
                  ]}
                >
                  Keep Booking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, cancelling && { opacity: 0.6 }]}
                onPress={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Cancel Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Upload Proof Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setUploadModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1e293b" : "#ffffff" },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#ffffff" : "#0f172a", marginBottom: 0 },
                ]}
              >
                Upload Payment Proof
              </Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            </View>

            {selectedForUpload && (
              <View
                style={[
                  styles.modalDetails,
                  {
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    marginBottom: 2,
                  }}
                >
                  {selectedForUpload.location}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#94a3b8" : "#64748b",
                    marginBottom: 4,
                  }}
                >
                  {selectedForUpload.displayDate || selectedForUpload.date} at{" "}
                  {selectedForUpload.time} &bull; {selectedForUpload.details}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: isDark ? "#4ade80" : "#16a34a",
                  }}
                >
                  Amount: ₹{selectedForUpload.amount}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.modalDesc,
                { color: isDark ? "#94a3b8" : "#64748b", marginTop: 14 },
              ]}
            >
              Select UPI Payment Screenshot / Receipt:
            </Text>

            <TouchableOpacity
              style={[
                styles.filePicker,
                {
                  borderColor: selectedImage
                    ? "#8bc34a"
                    : isDark
                      ? "#334155"
                      : "#e2e8f0",
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                },
              ]}
              onPress={pickImage}
            >
              <View
                style={[
                  styles.filePickerBtn,
                  {
                    backgroundColor: isDark ? "#334155" : "#e2e8f0",
                    borderRightColor: isDark ? "#475569" : "#cbd5e1",
                  },
                ]}
              >
                <Ionicons
                  name="image"
                  size={16}
                  color={isDark ? "#f1f5f9" : "#0f172a"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Choose File
                </Text>
              </View>
              <Text
                style={[
                  styles.filePickerText,
                  {
                    color: selectedImage
                      ? isDark
                        ? "#f1f5f9"
                        : "#0f172a"
                      : isDark
                        ? "#64748b"
                        : "#94a3b8",
                  },
                ]}
                numberOfLines={1}
              >
                {selectedImage ? selectedImage.name : "No file chosen"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActionsEnd}>
              <TouchableOpacity
                style={[
                  styles.modalBtnCancel,
                  { backgroundColor: isDark ? "#334155" : "#f1f5f9" },
                ]}
                onPress={() => setUploadModalVisible(false)}
                disabled={uploading}
              >
                <Text
                  style={[
                    styles.modalBtnCancelText,
                    { color: isDark ? "#cbd5e1" : "#475569" },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUploadProof}
                disabled={!selectedImage || uploading}
                style={{
                  borderRadius: 10,
                  opacity: !selectedImage || uploading ? 0.5 : 1,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#8bc34a", "#558b2f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalBtnSubmit}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalBtnConfirmText}>Submit Proof</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setImageViewerVisible(false)}
        >
          <Pressable
            style={[
              styles.imageModalContent,
              { backgroundColor: isDark ? "#1e293b" : "#ffffff" },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.imageModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={[
                    styles.imageModalTitle,
                    { color: isDark ? "#ffffff" : "#0f172a" },
                  ]}
                >
                  Payment Screenshot
                </Text>
                {selectedScreenshotBooking && (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginTop: 2,
                    }}
                  >
                    {selectedScreenshotBooking.location} &bull;{" "}
                    {selectedScreenshotBooking.displayDate} (
                    {selectedScreenshotBooking.time})
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setImageViewerVisible(false)}
                style={[
                  styles.closeIconBtn,
                  { backgroundColor: isDark ? "#334155" : "#f1f5f9" },
                ]}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#ffffff" : "#0f172a"}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Image Body */}
            <View style={styles.imageModalBody}>
              {imageLoading && (
                <View style={styles.imageLoaderContainer}>
                  <ActivityIndicator size="large" color="#8bc34a" />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: isDark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    Loading screenshot...
                  </Text>
                </View>
              )}

              {imageLoadError ? (
                <View style={styles.imageErrorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={42}
                    color="#ef4444"
                  />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      fontWeight: "600",
                      color: isDark ? "#f87171" : "#dc2626",
                    }}
                  >
                    Unable to load screenshot
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: isDark ? "#94a3b8" : "#64748b",
                      textAlign: "center",
                      paddingHorizontal: 20,
                    }}
                  >
                    The image may not exist on the server or the network
                    connection was interrupted.
                  </Text>
                </View>
              ) : (
                imageViewerUrl && (
                  <Image
                    source={{ uri: imageViewerUrl }}
                    style={{
                      width: "100%",
                      height: 380,
                      borderRadius: 10,
                    }}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageLoadError(true);
                    }}
                  />
                )
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },

  // Status Tabs Container
  statusTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  statusTabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusTabItemActive: {
    borderWidth: 1,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Type Chips
  typeChipsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  typeChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
  },

  // Card Styles
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    // elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  cardBody: {
    gap: 10,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  infoMainText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Card Actions
  cardActions: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  cancelledBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  rejectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  rejectedBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  // Empty State
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 240,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  modalDetails: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  filePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
  },
  filePickerText: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalActionsEnd: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: {
    fontWeight: "700",
    fontSize: 13,
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnConfirmText: {
    fontWeight: "700",
    color: "#FFF",
    fontSize: 13,
  },
  modalBtnSubmit: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Image Viewer Modal Content
  imageModalContent: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  imageModalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalBody: {
    width: "100%",
    height: 380,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    overflow: "hidden",
  },
  imageLoaderContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  imageErrorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});
