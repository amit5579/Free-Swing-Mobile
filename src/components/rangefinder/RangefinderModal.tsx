import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
  BackHandler,
  StatusBar,
  Modal,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { RangefinderMap, ClubDistance } from "./RangefinderMap";
import { useRangefinder } from "../../hooks/useRangefinder";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "@/api/client";
import MapView from "react-native-maps";
import { useRef } from "react";
import { pinMapLocation } from "@/api/modules/scoreCard.api";
import { getCourseDetails } from "@/api/modules/subAdmin/tournaments.api";

interface RangefinderModalProps {
  visible: boolean;
  onClose: () => void;
  holes: any[];
  initialHoleId: number | null;
  courseName?: string;
}

const GreenDistances = ({
  back,
  center,
  front,
}: {
  back: number | string;
  center: number | string;
  front: number | string;
}) => (
  <View style={styles.greenDistanceCard}>
    <View style={styles.greenDistanceCol}>
      <View style={styles.distBadgeRow}>
        <Ionicons
          name="caret-up"
          size={11}
          color="#f59e0b"
          style={{ marginRight: 3 }}
        />
        <Text style={styles.backDistText}>{back}</Text>
      </View>
      <Text style={styles.centerDistText}>{center}</Text>
      <View style={styles.distBadgeRow}>
        <Ionicons
          name="caret-down"
          size={11}
          color="#10b981"
          style={{ marginRight: 3 }}
        />
        <Text style={styles.frontDistText}>{front}</Text>
      </View>
    </View>
  </View>
);

export const RangefinderModal: React.FC<RangefinderModalProps> = ({
  visible,
  onClose,
  holes,
  initialHoleId,
  courseName,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [unit, setUnit] = useState<"YD" | "M">("YD");
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [myClubs, setMyClubs] = useState<ClubDistance[]>([]);
  const [locationPermission, setLocationPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [fetchedCourseName, setFetchedCourseName] = useState<string>("");

  // Stable courseId ref to avoid re-triggering API on holes array reference changes
  const courseIdRef = useRef<number | null>(null);

  useEffect(() => {
    const courseId = holes[0]?.courseId;
    if (visible && courseId && courseId !== courseIdRef.current) {
      courseIdRef.current = courseId;
      getCourseDetails(courseId)
        .then((response) => {
          if (response?.name) {
            setFetchedCourseName(response.name);
          }
        })
        .catch((error) =>
          console.error(
            "Failed to fetch course details for rangefinder",
            error,
          ),
        );
    }
    if (!visible) {
      courseIdRef.current = null;
    }
  }, [visible, holes[0]?.courseId]);

  // Check location permission when component mounts
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission("granted");
      } else {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        setLocationPermission(newStatus === "granted" ? "granted" : "denied");
      }
    })();
  }, []);

  const handleRetryPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setLocationPermission("granted");
      startTracking();
    } else {
      setLocationPermission("denied");
    }
  };

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const saved = await AsyncStorage.getItem("rangefinder_clubs");
        if (saved) {
          setMyClubs(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load clubs from AsyncStorage:", error);
      }
    };
    loadClubs();
  }, []);

  const [isAimMode, setIsAimMode] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const cameraRef = useRef<MapView>(null);

  const [isUiVisible, setIsUiVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    playerLocation,
    pinLocation,
    aimLocation,
    distanceToAim,
    distanceToPin,
    aimToPin,
    isTracking,
    errorMsg,
    setAimLocation,
    setPinLocation,
    startTracking,
    stopTracking,
  } = useRangefinder();

  // Handle Android hardware back button (replaces Modal's onRequestClose)
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true; // Prevent default back navigation
      },
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  const toggleUiVisibility = () => {
    const toValue = isUiVisible ? 0 : 1;
    Animated.timing(fadeAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsUiVisible(!isUiVisible);
  };

  // Track if we've already set the initial hole for this session
  const hasInitializedHole = useRef(false);
  const hasAutoCentered = useRef(false);

  // Reset the tracker when the overlay is closed
  useEffect(() => {
    if (!visible) {
      hasInitializedHole.current = false;
      hasAutoCentered.current = false;
    }
  }, [visible]);

  // Only set the initial hole once when the overlay opens and data is ready
  useEffect(() => {
    if (
      visible &&
      !hasInitializedHole.current &&
      initialHoleId &&
      holes &&
      holes.length > 0
    ) {
      const index = holes.findIndex(
        (h) => h.holeId === initialHoleId || h.holeNumber === initialHoleId,
      );
      if (index !== -1) {
        setCurrentHoleIndex(index);
        hasInitializedHole.current = true;
      }
    }
  }, [visible, initialHoleId, holes]);

  // Auto-center map when location first becomes available
  useEffect(() => {
    if (
      visible &&
      !hasAutoCentered.current &&
      playerLocation &&
      playerLocation[0] &&
      playerLocation[1] &&
      cameraRef.current &&
      typeof cameraRef.current.animateCamera === "function"
    ) {
      try {
        cameraRef.current.animateCamera(
          {
            center: {
              latitude: playerLocation[1],
              longitude: playerLocation[0],
            },
            zoom: 17,
          },
          { duration: 1000 },
        );
        hasAutoCentered.current = true;
      } catch (e) {
        console.warn("animateCamera warning:", e);
      }
    }
  }, [visible, playerLocation]);

  const currentHole = holes[currentHoleIndex];

  // Parse pin coordinates if available from API (default to some fallback if missing for now)
  const pinLat = currentHole?.pinLat || currentHole?.latitude || 0;
  const pinLng = currentHole?.pinLng || currentHole?.longitude || 0;

  // Tracking lifecycle: only start/stop based on visibility
  const isTrackingStarted = useRef(false);
  useEffect(() => {
    if (visible && !isTrackingStarted.current) {
      isTrackingStarted.current = true;
      startTracking();
    } else if (!visible && isTrackingStarted.current) {
      isTrackingStarted.current = false;
      stopTracking();
    }
  }, [visible]);

  // Update pin when hole changes (separate from tracking to avoid loop)
  useEffect(() => {
    if (visible && pinLat && pinLng) {
      setPinLocation(pinLng, pinLat);
    }
  }, [visible, currentHoleIndex, pinLat, pinLng, setPinLocation]);

  const handleMapPress = (feature: any) => {
    const coords = feature?.geometry?.coordinates;
    if (coords && Array.isArray(coords) && coords.length === 2) {
      if (isFlagMode) {
        setPinLocation(coords[0], coords[1]);
      } else if (isAimMode) {
        setAimLocation(coords[0], coords[1]);
      } else {
        toggleUiVisibility();
      }
    }
  };

  const handlePinDragEnd = (coords: [number, number]) => {
    setPinLocation(coords[0], coords[1]);
  };

  const handleAimDragEnd = (coords: [number, number]) => {
    setAimLocation(coords[0], coords[1]);
  };

  const toggleFlagMode = () => {
    setIsFlagMode(!isFlagMode);
    if (!isFlagMode) setIsAimMode(false);
  };

  const toggleAimMode = () => {
    setIsAimMode(!isAimMode);
    if (!isAimMode) setIsFlagMode(false);
  };

  const handleSavePin = async () => {
    if (!currentHole?.holeId || !pinLocation) return;
    try {
      setIsSavingPin(true);
      const payload = { pinLat: pinLocation[1], pinLng: pinLocation[0] };
      if (!payload) {
        Alert.alert("Error", "Pin location is required");
        return;
      }
      const res = await pinMapLocation(
        currentHole.holeId,
        payload.pinLat,
        payload.pinLng,
      );

      if (res) {
        Alert.alert("Success", "Pin location saved successfully");
        currentHole.pinLat = payload.pinLat;
        currentHole.pinLng = payload.pinLng;
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update pin location");
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleGpsPress = () => {
    if (playerLocation && cameraRef.current) {
      cameraRef.current.animateCamera(
        {
          center: { latitude: playerLocation[1], longitude: playerLocation[0] },
          zoom: 18,
        },
        { duration: 1000 },
      );
    }
  };

  const displayDist = (distInYards: number | null) => {
    if (distInYards === null) return "-";
    if (unit === "M") return Math.round(distInYards * 0.9144);
    return Math.round(distInYards);
  };

  const centerDist = displayDist(distanceToPin);
  const backDist = typeof centerDist === "number" ? centerDist + 16 : "-";
  const frontDist = typeof centerDist === "number" ? centerDist - 16 : "-";

  const scoreText = "E 0";
  const initials = "AJ";

  const handlePrevHole = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  const handleNextHole = () => {
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  // Don't render anything when not visible (same as web's *ngIf="showGpsModal")
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent={true}
      />
      <View style={styles.container}>
        {/* Location Permission Denied Screen */}
        {locationPermission === "denied" && (
          <View
            style={[
              styles.permissionOverlay,
              { backgroundColor: "#0f172a" },
            ]}
          >
            <View style={styles.permissionCloseRow}>
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.permissionContent}>
              <View style={styles.permissionIconCircle}>
                <Ionicons name="location-outline" size={48} color="#8BC34A" />
              </View>
              <Text style={[styles.permissionTitle, { color: "#fff" }]}>
                Location Permission Required
              </Text>
              <Text style={[styles.permissionDesc, { color: "#aaa" }]}>
                The GPS Rangefinder needs access to your location to show
                distances to the pin and track your position on the course.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={handleRetryPermission}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.permissionBtnText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.permissionBtn,
                  {
                    backgroundColor: "#334155",
                    marginTop: 10,
                  },
                ]}
                onPress={() => Linking.openSettings()}
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.permissionBtnText, { color: "#fff" }]}>
                  Open Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Map Container (Full Screen Bleed) */}
        <View style={styles.mapContainer}>
          {!isTracking && !errorMsg && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#8BC34A" />
              <Text style={{ color: "#fff", marginTop: 10 }}>
                Acquiring GPS...
              </Text>
            </View>
          )}

          <RangefinderMap
            playerLocation={playerLocation}
            pinLocation={pinLocation}
            aimLocation={aimLocation}
            onMapPress={handleMapPress}
            isDark={true}
            isFlagMode={isFlagMode}
            isAimMode={isAimMode}
            onPinDragEnd={handlePinDragEnd}
            onAimDragEnd={handleAimDragEnd}
            cameraRef={cameraRef}
            clubDistances={myClubs}
            distanceToAim={distanceToAim}
            distanceToPin={distanceToPin}
            aimToPin={aimToPin}
            unit={unit}
          />
        </View>

        {/* Floating Top-Left Back Button (Glass Circle) */}
        <Animated.View
          style={[
            styles.backButtonGlass,
            { top: Math.max(insets.top, 24) + 6, opacity: fadeAnim },
          ]}
          pointerEvents={isUiVisible ? "auto" : "none"}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButtonTouchable}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Floating Top Hole Pill Container (Compact Web Style) */}
        <Animated.View
          style={[
            styles.holePillWrapper,
            { top: Math.max(insets.top, 24) + 4, opacity: fadeAnim },
          ]}
          pointerEvents={isUiVisible ? "auto" : "none"}
        >
          <View style={styles.holePillContainer}>
            {/* Row 1: Chevron - Flag & Number - Chevron */}
            <View style={styles.holePillRow1}>
              <TouchableOpacity
                onPress={handlePrevHole}
                disabled={currentHoleIndex === 0}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={
                    currentHoleIndex === 0
                      ? "rgba(255,255,255,0.3)"
                      : "#ffffff"
                  }
                />
              </TouchableOpacity>

              <View style={styles.holeFlagBadge}>
                <Ionicons
                  name="flag"
                  size={15}
                  color="#f59e0b"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.holeNumberText}>
                  {currentHole?.holeNumber || currentHoleIndex + 1}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNextHole}
                disabled={currentHoleIndex === holes.length - 1}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    currentHoleIndex === holes.length - 1
                      ? "rgba(255,255,255,0.3)"
                      : "#ffffff"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Row 2: Par • Yds • SI */}
            <View style={styles.holeMetaRow}>
              <Text style={styles.holeMetaText}>
                Par {currentHole?.par || "-"}
              </Text>
              <Text style={styles.holeMetaText}>
                {unit === "M"
                  ? Math.round((currentHole?.yardage || 0) * 0.9144)
                  : currentHole?.yardage || "-"}{" "}
                {unit.toLowerCase()}
              </Text>
              <Text style={styles.holeMetaText}>
                SI {currentHole?.handicap || currentHole?.strokeIndex || "-"}
              </Text>
            </View>

            {/* Row 3: Location / Course Name */}
            {Boolean(
              courseName || fetchedCourseName || currentHole?.courseName,
            ) && (
              <View style={styles.courseLocationRow}>
                <Ionicons
                  name="location-sharp"
                  size={11}
                  color="#f59e0b"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.courseLocationText} numberOfLines={1}>
                  {(
                    courseName ||
                    fetchedCourseName ||
                    currentHole?.courseName ||
                    ""
                  ).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Floating Right Action Controls (Web Stacked Glass Pills) */}
        <Animated.View
          style={[styles.rightSideButtons, { opacity: fadeAnim }]}
          pointerEvents={isUiVisible ? "auto" : "none"}
        >
          <TouchableOpacity
            onPress={() => setUnit(unit === "YD" ? "M" : "YD")}
            style={styles.actionPillBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.actionPillUnitText}>{unit}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleFlagMode}
            style={[styles.actionPillBtn, isFlagMode && styles.activeActionPill]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flag"
              size={18}
              color={"#ffffff"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleAimMode}
            style={[styles.actionPillBtn, isAimMode && styles.activeAimActionPill]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="locate"
              size={18}
              color={"#ffffff"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSavePin}
            style={styles.actionPillBtn}
            disabled={isSavingPin}
            activeOpacity={0.8}
          >
            {isSavingPin ? (
              <ActivityIndicator size="small" color={"#ffffff"} />
            ) : (
              <Ionicons name="location" size={18} color={"#ffffff"} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGpsPress}
            style={styles.actionPillBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={18} color={"#ffffff"} />
          </TouchableOpacity>
        </Animated.View>

        {/* Floating Bottom-Left Green Distance Card */}
        <Animated.View
          style={[
            styles.greenDistanceCardWrapper,
            { bottom: Math.max(insets.bottom, 16) + 16, opacity: fadeAnim },
          ]}
          pointerEvents={isUiVisible ? "auto" : "none"}
        >
          <GreenDistances
            back={backDist}
            center={centerDist}
            front={frontDist}
          />
        </Animated.View>

        {errorMsg && (
          <View style={styles.errorToast}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    zIndex: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  // Floating Top-Left Back Button (Glass Circle)
  backButtonGlass: {
    position: "absolute",
    left: 16,
    zIndex: 20,
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },

  // Floating Top Hole Pill Container (Compact Web Style)
  holePillWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 15,
  },
  holePillContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 7,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: "80%",
  },
  holePillRow1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  holeFlagBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  holeNumberText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f59e0b",
  },
  holeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  holeMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  courseLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    maxWidth: 220,
  },
  courseLocationText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f59e0b",
    letterSpacing: 0.3,
  },

  // Floating Right Action Controls (Web Stacked Glass Pills)
  rightSideButtons: {
    position: "absolute",
    right: 14,
    top: "38%",
    gap: 10,
    zIndex: 15,
  },
  actionPillBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  activeActionPill: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  activeAimActionPill: {
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
  },
  actionPillUnitText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },

  // Floating Bottom-Left Green Distance Card
  greenDistanceCardWrapper: {
    position: "absolute",
    left: 16,
    zIndex: 15,
  },
  greenDistanceCard: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  greenDistanceCol: {
    alignItems: "flex-start",
  },
  distBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backDistText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f59e0b",
  },
  centerDistText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.8,
    marginVertical: 1,
  },
  frontDistText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#10b981",
  },

  // Error Toast
  errorToast: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(211, 47, 47, 0.9)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 30,
  },
  errorText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Permission Overlay
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionCloseRow: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 101,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContent: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(139, 195, 74, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8BC34A",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: "100%",
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
