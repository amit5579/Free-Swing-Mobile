import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RangefinderMap } from "./RangefinderMap";
import { useRangefinder } from "../../hooks/useRangefinder";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client from "@/api/client";
import Mapbox from "@rnmapbox/maps";
import { useRef } from "react";
import { pinMapLocation } from "@/api/modules/scoreCard.api";

interface RangefinderModalProps {
  visible: boolean;
  onClose: () => void;
  holes: any[];
  initialHoleId: number | null;
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
  <View style={styles.distanceContainer}>
    <View style={styles.row}>
      <Ionicons name="caret-up" size={12} color="#FFA500" />
      <Text style={[styles.smallDist, { color: "#FFA500" }]}>{back}</Text>
    </View>
    <Text style={styles.centerDist}>{center}</Text>
    <View style={styles.row}>
      <Ionicons name="caret-down" size={12} color="#8BC34A" />
      <Text style={[styles.smallDist, { color: "#8BC34A" }]}>{front}</Text>
    </View>
  </View>
);

const PlayerBottomBar = ({
  initials,
  scoreText,
  onAddScore,
  isDark,
}: {
  initials: string;
  scoreText: string;
  onAddScore: () => void;
  isDark: boolean;
}) => (
  <View
    style={[
      styles.bottomBar,
      { backgroundColor: isDark ? "#1A1C20" : "#ffffff" },
    ]}
  >
    <View style={styles.playerInfo}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View>
        <Text style={[styles.roundText, { color: isDark ? "#FFF" : "#000" }]}>
          Player Round
        </Text>
        <Text style={styles.scoreText}>Score: {scoreText}</Text>
      </View>
    </View>

    <TouchableOpacity style={styles.addScoreBtn} onPress={onAddScore}>
      <Text style={styles.addScoreText}>Add Score</Text>
    </TouchableOpacity>
  </View>
);

export const RangefinderModal: React.FC<RangefinderModalProps> = ({
  visible,
  onClose,
  holes,
  initialHoleId,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [unit, setUnit] = useState<"YD" | "M">("YD");
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [isAimMode, setIsAimMode] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const cameraRef = useRef<Mapbox.Camera>(null);

  const [isUiVisible, setIsUiVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleUiVisibility = () => {
    const toValue = isUiVisible ? 0 : 1;
    Animated.timing(fadeAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsUiVisible(!isUiVisible);
  };

  useEffect(() => {
    if (visible && initialHoleId && holes.length > 0) {
      const index = holes.findIndex((h) => h.holeId === initialHoleId);
      if (index !== -1) setCurrentHoleIndex(index);
    }
  }, [visible, initialHoleId, holes]);

  const currentHole = holes[currentHoleIndex];

  // Parse pin coordinates if available from API (default to some fallback if missing for now)
  const pinLat = currentHole?.pinLat || currentHole?.latitude || 0;
  const pinLng = currentHole?.pinLng || currentHole?.longitude || 0;

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

  useEffect(() => {
    if (visible) {
      startTracking();
      // Update pin location when switching holes
      if (pinLat && pinLng) {
        setPinLocation(pinLng, pinLat);
      } else {
        // Clear pin if no data
        // For testing, let's just leave it or you can set a fallback
      }
    } else {
      stopTracking();
    }
  }, [
    visible,
    currentHoleIndex,
    pinLat,
    pinLng,
    startTracking,
    stopTracking,
    setPinLocation,
  ]);

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
      const res = await pinMapLocation(
        currentHole.holeId,
        payload.pinLat,
        payload.pinLng,
      );

      if (res.status === 200 || res.status === 201) {
        Alert.alert("Success", "Pin location saved successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update pin location");
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleGpsPress = () => {
    if (playerLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: playerLocation,
        zoomLevel: 18,
        animationDuration: 1000,
      });
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#161618" : "#F9FAFB" },
        ]}
      >
        {/* Header HUD */}
        <Animated.View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16),
              backgroundColor: isDark ? "#1f1f1f" : "#ffffff",
              opacity: fadeAnim,
            },
          ]}
          pointerEvents={isUiVisible ? "auto" : "none"}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>

            <View style={styles.holeSelector}>
              <TouchableOpacity
                onPress={handlePrevHole}
                disabled={currentHoleIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={
                    currentHoleIndex === 0 ? "gray" : isDark ? "#fff" : "#000"
                  }
                />
              </TouchableOpacity>
              <View style={styles.holeInfo}>
                <Text
                  style={[
                    styles.courseName,
                    { color: isDark ? "#fff" : "#000" },
                  ]}
                  numberOfLines={1}
                >
                  {currentHole?.courseName || "Course"}
                </Text>
                <Text
                  style={[
                    styles.holeNumber,
                    { color: isDark ? "#fff" : "#000" },
                  ]}
                >
                  Hole {currentHole?.holeNumber || "-"}
                </Text>
                <Text
                  style={[styles.parYards, { color: isDark ? "#aaa" : "#666" }]}
                >
                  Par {currentHole?.par || "-"} •{" "}
                  {unit === "M"
                    ? Math.round((currentHole?.yardage || 0) * 0.9144)
                    : currentHole?.yardage || "-"}{" "}
                  {unit === "M" ? "m" : "yds"} • SI{" "}
                  {currentHole?.handicap || currentHole?.strokeIndex || "-"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleNextHole}
                disabled={currentHoleIndex === holes.length - 1}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    currentHoleIndex === holes.length - 1
                      ? "gray"
                      : isDark
                        ? "#fff"
                        : "#000"
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={{ width: 32 }} />
          </View>

          {/* Distances Row */}
          <View style={styles.distancesRow}>
            <View style={styles.distanceBox}>
              <Text style={styles.distanceLabel}>TO AIM</Text>
              <Text style={[styles.distanceValue, { color: "#FFA500" }]}>
                {displayDist(distanceToAim)}
              </Text>
            </View>
            <View style={styles.distanceBox}>
              <Text style={styles.distanceLabel}>AIM TO PIN</Text>
              <Text style={[styles.distanceValue, { color: "#FFA500" }]}>
                {displayDist(aimToPin)}
              </Text>
            </View>
            <View style={styles.distanceBox}>
              <Text style={styles.distanceLabel}>TO PIN</Text>
              <Text style={[styles.distanceValue, { color: "#EA4335" }]}>
                {displayDist(distanceToPin)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Map Container */}
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
            isDark={isDark}
            isFlagMode={isFlagMode}
            isAimMode={isAimMode}
            onPinDragEnd={handlePinDragEnd}
            onAimDragEnd={handleAimDragEnd}
            cameraRef={cameraRef as any}
          />

          {/* vertical buttons on right side are below */}
          <Animated.View
            style={[styles.rightSideButtons, { opacity: fadeAnim }]}
            pointerEvents={isUiVisible ? "auto" : "none"}
          >
            <TouchableOpacity
              onPress={() => setUnit(unit === "YD" ? "M" : "YD")}
              style={styles.sideButton}
            >
              <Text style={styles.sideButtonText}>{unit}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFlagMode}
              style={[styles.sideButton, isFlagMode && styles.activeSideButton]}
            >
              <Ionicons
                name="flag"
                size={20}
                color={isFlagMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleAimMode}
              style={[
                styles.sideButton,
                isAimMode && styles.activeAimSideButton,
              ]}
            >
              <Ionicons
                name="locate"
                size={20}
                color={isAimMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSavePin}
              style={styles.sideButton}
              disabled={isSavingPin}
            >
              {isSavingPin ? (
                <ActivityIndicator size="small" color={"#000"} />
              ) : (
                <Ionicons name="location" size={20} color={"#000"} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGpsPress}
              style={styles.sideButton}
            >
              <Ionicons name="navigate" size={20} color={"#000"} />
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.sideButton}>
              <Ionicons name="people" size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideButton}>
              <Ionicons name="analytics" size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity> */}
          </Animated.View>

          <Animated.View
            style={{ opacity: fadeAnim }}
            pointerEvents={isUiVisible ? "auto" : "none"}
          >
            <GreenDistances
              back={backDist}
              center={centerDist}
              front={frontDist}
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[styles.bottomBarContainer, { opacity: fadeAnim }]}
          pointerEvents={isUiVisible ? "auto" : "none"}
        >
          <PlayerBottomBar
            initials={initials}
            scoreText={scoreText}
            onAddScore={onClose}
            isDark={isDark}
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
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  holeSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  holeInfo: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  holeNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  courseName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 2,
    maxWidth: 200,
    textAlign: "center",
  },
  parYards: {
    fontSize: 12,
  },
  distancesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  distanceBox: {
    alignItems: "center",
  },
  distanceLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  errorToast: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(211, 47, 47, 0.9)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontWeight: "bold",
  },
  rightSideButtons: {
    position: "absolute",
    right: 16,
    top: 200,
    gap: 12,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  activeSideButton: {
    backgroundColor: "#4CAF50", // Match flag green
  },
  activeAimSideButton: {
    backgroundColor: "#FFA500", // Match aim orange
  },
  sideButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  distanceContainer: {
    position: "absolute",
    bottom: 120,
    left: 16,
    backgroundColor: "#1E2024", // Dark theme background
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    zIndex: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  centerDist: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  smallDist: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomBar: {
    backgroundColor: "#1A1C20",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 24, // Safe area for iOS
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.1)",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "bold",
    color: "#000",
  },
  roundText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  scoreText: {
    color: "#8BC34A",
    fontSize: 12,
    fontWeight: "600",
  },
  addScoreBtn: {
    backgroundColor: "#8BC34A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addScoreText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
