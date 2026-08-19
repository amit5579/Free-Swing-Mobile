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

// Types
export interface NormalizedBooking {
  id: string; // Unique ID (e.g. 'tt-55' or 'dr-52')
  originalId: number;
  type: "Tee Time" | "Driving Range";
  date: string;
  time: string;
  location: string;
  details: string;
  amount: number;
  paymentStatus: string;
  paymentScreenshotUrl: string | null;
  createdAt: string;
}

export default function MyBookingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const routePage = useRouter();

  const [bookings, setBookings] = useState<NormalizedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "All" | "Pending" | "Approved" | "Tee Time" | "Driving Range"
  >("All");
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedForCancel, setSelectedForCancel] =
    useState<NormalizedBooking | null>(null);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedForUpload, setSelectedForUpload] =
    useState<NormalizedBooking | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBookings = useCallback(async (isRefresh?: boolean) => {
    if (!isRefresh) setLoading(false);
    try {
      const [teeTimeRes, drRes] = await Promise.all([
        getMyTeeTimeBookings().catch((e) => []),
        getMyDrivingRangeBookings().catch((e) => []),
      ]);

      const ttBookings: NormalizedBooking[] = (teeTimeRes || []).map(
        (b: any) => ({
          id: `tt-${b.id}`,
          originalId: b.id,
          type: "Tee Time",
          date: b.date,
          time: b.timeSlot,
          location: b.courseName,
          details: `Tee #${b.tee}, Seat #${b.seatNumber} (${b.selectedMemberCategory})`,
          amount: b.amountToPay,
          paymentStatus: b.paymentStatus,
          paymentScreenshotUrl: b.paymentScreenshotUrl,
          createdAt: b.createdAt,
        }),
      );

      const drBookings: NormalizedBooking[] = (drRes || []).map((b: any) => ({
        id: `dr-${b.id}`,
        originalId: b.id,
        type: "Driving Range",
        date: b.slotDate ? b.slotDate.split("T")[0] : "",
        time: b.slotTime,
        location: `Driving Range (${b.subAdmin?.username || "Unknown"})`,
        details: `${b.numberOfSlots} Slot(s)`,
        amount: b.totalAmount,
        paymentStatus: b.paymentStatus,
        paymentScreenshotUrl: b.paymentScreenshotUrl,
        createdAt: b.createdAt,
      }));

      const combined = [...ttBookings, ...drBookings].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setBookings(combined);
      isRefresh ? setRefreshing(false) : setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings", error);
      Toast.show({ type: "error", text1: "Failed to fetch bookings" });
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings(true);
    setRefreshing(false);
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Cancel Handler
  const handleCancelBooking = async () => {
    if (!selectedForCancel) return;
    try {
      if (selectedForCancel.type === "Tee Time") {
        await cancelSeatBooking(selectedForCancel.originalId);
      } else {
        await cancelDrivingRangeBooking(selectedForCancel.originalId);
      }
      Toast.show({ type: "success", text1: "Booking cancelled successfully" });
      setCancelModalVisible(false);
      setSelectedForCancel(null);
      fetchBookings();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to cancel booking" });
    }
  };

  // Upload Handlers
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
        name: result.filename || result.path.split('/').pop() || "screenshot.jpg",
      });
    } catch (error: any) {
      if (error.code !== "E_PICKER_CANCELLED") {
        console.log("Image picker error:", error);
      }
    }
  };

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
      fetchBookings();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to upload screenshot" });
    } finally {
      setUploading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "All") return true;
    if (filter === "Pending")
      return b.paymentStatus !== "Paid" && b.paymentStatus !== "Approved";
    if (filter === "Approved")
      return b.paymentStatus === "Paid" || b.paymentStatus === "Approved";
    return b.type === filter;
  });

  const renderCard = ({ item }: { item: NormalizedBooking }) => {
    const isTeeTime = item.type === "Tee Time";
    const isPaid =
      item.paymentStatus === "Paid" || item.paymentStatus === "Approved";

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeTag,
              {
                backgroundColor: isTeeTime
                  ? isDark
                    ? "rgba(76, 175, 80, 0.2)"
                    : "#E8F5E9"
                  : isDark
                    ? "rgba(156, 39, 176, 0.2)"
                    : "#F3E5F5",
              },
            ]}
          >
            <Ionicons
              name={isTeeTime ? "calendar-number-outline" : "golf-outline"}
              size={14}
              color={isTeeTime ? "#4CAF50" : "#9C27B0"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.typeText,
                { color: isTeeTime ? "#4CAF50" : "#9C27B0" },
              ]}
            >
              {item.type}
            </Text>
          </View>

          <View
            style={[
              styles.statusTag,
              {
                backgroundColor: isPaid
                  ? isDark
                    ? "rgba(76, 175, 80, 0.2)"
                    : "#E8F5E9"
                  : isDark
                    ? "rgba(255, 152, 0, 0.2)"
                    : "#FFF3E0",
              },
            ]}
          >
            {isPaid ? (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#4CAF50"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ color: "#4CAF50", fontSize: 12, fontWeight: "600" }}
                >
                  Confirmed
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="hourglass-outline"
                  size={14}
                  color="#FF9800"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ color: "#FF9800", fontSize: 12, fontWeight: "600" }}
                >
                  Pending Approval
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isDark ? "#AAA" : "#666"}
            />
            <Text
              style={[styles.infoText, { color: isDark ? "#EEE" : "#333" }]}
            >
              {item.date} at {item.time}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={isDark ? "#AAA" : "#666"}
            />
            <Text
              style={[styles.infoText, { color: isDark ? "#EEE" : "#333" }]}
            >
              {item.location}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={isDark ? "#AAA" : "#666"}
            />
            <Text
              style={[styles.infoText, { color: isDark ? "#EEE" : "#333" }]}
            >
              {item.details}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="cash-outline"
              size={16}
              color={isDark ? "#AAA" : "#666"}
            />
            <Text
              style={[
                styles.infoText,
                { color: isDark ? "#EEE" : "#333", fontWeight: "bold" },
              ]}
            >
              ₹{item.amount}
            </Text>
          </View>
        </View>

        {item.paymentScreenshotUrl && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: isDark ? "rgba(33, 150, 243, 0.1)" : "#E3F2FD",
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
            onPress={() => {
              setImageViewerUrl(
                `https://kolve18freeswing.com${item.paymentScreenshotUrl}`,
              );
              setImageViewerVisible(true);
            }}
          >
            <Ionicons name="image-outline" size={16} color="#2196F3" />
            <Text style={{ color: "#2196F3", fontSize: 13, fontWeight: "600" }}>
              View Screenshot
            </Text>
          </TouchableOpacity>
        )}

        {!isPaid && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.uploadBtn]}
              onPress={() => {
                setSelectedForUpload(item);
                setSelectedImage(null);
                setUploadModalVisible(true);
              }}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#2196F3" />
              <Text style={styles.uploadBtnText}>
                {item.paymentScreenshotUrl ? "Re-upload" : "Upload Proof"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => {
                setSelectedForCancel(item);
                setCancelModalVisible(true);
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color="#F44336" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
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

            <View style={{ width: 40 }} />
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
            backgroundColor: isDark ? "#333" : "#E0E0E0",
          }}
        />
        <View
          style={{
            width: 100,
            height: 24,
            borderRadius: 6,
            backgroundColor: isDark ? "#333" : "#E0E0E0",
          }}
        />
      </View>
      <View style={styles.cardBody}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: i !== 4 ? 8 : 0,
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: isDark ? "#333" : "#E0E0E0",
              }}
            />
            <View
              style={{
                width: "60%",
                height: 14,
                borderRadius: 4,
                backgroundColor: isDark ? "#333" : "#E0E0E0",
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
        { backgroundColor: isDark ? "#121212" : "#F5F7FA" },
      ]}
    >
      <Watermark />
      {RenderHeader()}

      <View>
        <View
          // horizontal
          // showsHorizontalScrollIndicator={false}
          // contentContainerStyle={styles.filterContainer}
          style={styles.filterContainer}
        >
          {["All","Tee Time","Driving Range", "Pending", "Approved"].map(
            (f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterTab,
                  filter === f && styles.filterTabActive,
                  { borderColor: isDark ? "#333" : "#E0E0E0" },
                ]}
                onPress={() => setFilter(f as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f
                      ? styles.filterTextActive
                      : { color: isDark ? "#AAA" : "#666" },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

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
          contentContainerStyle={styles.listContent}
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
              <Ionicons
                name="calendar-outline"
                size={48}
                color={isDark ? "#444" : "#CCC"}
              />
              <Text
                style={[styles.emptyText, { color: isDark ? "#888" : "#999" }]}
              >
                No bookings found.
              </Text>
            </View>
          }
        />
      )}

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1E1E1E" : "#FFF" },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? "#FFF" : "#333" }]}
            >
              Cancel Booking
            </Text>
            <Text
              style={[styles.modalDesc, { color: isDark ? "#CCC" : "#666" }]}
            >
              Are you sure you want to cancel this booking?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={handleCancelBooking}
              >
                <Text style={styles.modalBtnConfirmText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Proof Modal */}
      <Modal visible={uploadModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1E1E1E" : "#FFF" },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#FFF" : "#333", marginBottom: 0 },
                ]}
              >
                Upload Payment Proof
              </Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#AAA" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {selectedForUpload && (
              <View style={styles.modalDetails}>
                <Text
                  style={[
                    styles.modalDesc,
                    { color: isDark ? "#CCC" : "#333", fontWeight: "500" },
                  ]}
                >
                  Booking: {selectedForUpload.type} (
                  {selectedForUpload.location})
                </Text>
                <Text
                  style={[
                    styles.modalDesc,
                    { color: isDark ? "#CCC" : "#333", fontWeight: "500" },
                  ]}
                >
                  Date & Time: {selectedForUpload.date} at{" "}
                  {selectedForUpload.time}
                </Text>
                <Text
                  style={[
                    styles.modalDesc,
                    { color: isDark ? "#CCC" : "#333", fontWeight: "500" },
                  ]}
                >
                  Amount: ₹{selectedForUpload.amount}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.modalDesc,
                { color: isDark ? "#AAA" : "#666", marginTop: 16 },
              ]}
            >
              Select UPI Payment Screenshot / Receipt
            </Text>

            <TouchableOpacity
              style={[
                styles.filePicker,
                { borderColor: isDark ? "#444" : "#E0E0E0" },
              ]}
              onPress={pickImage}
            >
              <View
                style={[
                  styles.filePickerBtn,
                  { backgroundColor: isDark ? "#333" : "#F5F5F5" },
                ]}
              >
                <Text style={{ color: isDark ? "#DDD" : "#555" }}>
                  Choose File
                </Text>
              </View>
              <Text
                style={[
                  styles.filePickerText,
                  {
                    color: selectedImage
                      ? isDark
                        ? "#FFF"
                        : "#333"
                      : isDark
                        ? "#888"
                        : "#999",
                  },
                ]}
                numberOfLines={1}
              >
                {selectedImage ? selectedImage.name : "No file chosen"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActionsEnd}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setUploadModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnSubmit,
                  (!selectedImage || uploading) && { opacity: 0.5 },
                ]}
                onPress={handleUploadProof}
                disabled={!selectedImage || uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Submit Proof</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={imageViewerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1E1E1E" : "#FFF",
                padding: 12,
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              <TouchableOpacity onPress={() => setImageViewerVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#AAA" : "#666"}
                />
              </TouchableOpacity>
            </View>
            {imageViewerUrl && (
              <Image
                source={{ uri: imageViewerUrl }}
                style={{ width: "100%", height: 400, borderRadius: 8 }}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  filterContainer: {
    flexDirection: "row",
    flexWrap:"wrap",
    paddingHorizontal: 30,
    marginBottom: 16,
    gap: 17,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabActive: {
    backgroundColor: "#8bc34a",
    borderColor: "#8bc34a",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardBody: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  uploadBtn: {
    borderColor: "#2196F3",
    backgroundColor: "rgba(33, 150, 243, 0.05)",
  },
  uploadBtnText: {
    color: "#2196F3",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelBtn: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.05)",
  },
  cancelBtnText: {
    color: "#F44336",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  modalDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden",
  },
  filePickerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.1)",
  },
  filePickerText: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalActionsEnd: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  modalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  modalBtnCancelText: {
    fontWeight: "600",
    color: "#333",
  },
  modalBtnConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#F44336",
  },
  modalBtnConfirmText: {
    fontWeight: "600",
    color: "#FFF",
  },
  modalBtnSubmit: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#8bc34a",
  },
});
