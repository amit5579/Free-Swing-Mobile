import React, { useMemo, useRef, useState, useEffect } from "react";
import { StyleSheet, View, Platform, Text } from "react-native";
import MapView, {
  Marker,
  Polyline,
  Circle,
  MAP_TYPES,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

export interface ClubDistance {
  name: string;
  distanceYards: number;
}

interface RangefinderMapProps {
  playerLocation: [number, number] | null; // [longitude, latitude]
  pinLocation: [number, number] | null; // [longitude, latitude]
  aimLocation: [number, number] | null; // [longitude, latitude]
  onMapPress: (feature: any) => void;
  isDark?: boolean;
  isFlagMode?: boolean;
  isAimMode?: boolean;
  onPinDragEnd?: (coords: [number, number]) => void;
  onAimDragEnd?: (coords: [number, number]) => void;
  cameraRef?: React.RefObject<MapView | null>;
  clubDistances?: ClubDistance[];
  distanceToAim?: number | null;
  distanceToPin?: number | null;
  aimToPin?: number | null;
  unit?: "YD" | "M";
}

export const RangefinderMap: React.FC<RangefinderMapProps> = ({
  playerLocation,
  pinLocation,
  aimLocation,
  onMapPress,
  isDark = false,
  isFlagMode = false,
  isAimMode = false,
  onPinDragEnd,
  onAimDragEnd,
  cameraRef,
  clubDistances,
  distanceToAim,
  distanceToPin,
  aimToPin,
  unit = "YD",
}) => {
  // Convert [lng, lat] to { latitude, longitude } safely
  const toCoord = (loc: [number, number] | null) => {
    if (!loc || !Array.isArray(loc) || loc.length < 2) return null;
    const [lng, lat] = loc;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    )
      return null;
    if (lat === 0 && lng === 0) return null;
    return { latitude: lat, longitude: lng };
  };

  const playerCoord = toCoord(playerLocation);
  const pinCoord = toCoord(pinLocation);
  const aimCoord = toCoord(aimLocation);

  // Controlled tracksViewChanges to allow initial native snapshot without continuous GPU overhead
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [
    pinCoord?.latitude,
    pinCoord?.longitude,
    aimCoord?.latitude,
    aimCoord?.longitude,
    playerCoord?.latitude,
    playerCoord?.longitude,
    isFlagMode,
    isAimMode,
    distanceToAim,
    distanceToPin,
    aimToPin,
    unit,
  ]);

  // Format distance based on unit
  const formatDist = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "-") return "-";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "-";
    if (unit === "M") return Math.round(num * 0.9144);
    return Math.round(num);
  };

  // Midpoint between Player and Aim (or Pin)
  const dist1Coord = useMemo(() => {
    if (!playerCoord) return null;
    const target = aimCoord || pinCoord;
    if (!target) return null;
    return {
      latitude: (playerCoord.latitude + target.latitude) / 2,
      longitude: (playerCoord.longitude + target.longitude) / 2,
    };
  }, [playerCoord, aimCoord, pinCoord]);

  // Midpoint between Aim and Pin
  const dist2Coord = useMemo(() => {
    if (!aimCoord || !pinCoord) return null;
    const isSame =
      Math.abs(aimCoord.latitude - pinCoord.latitude) < 0.00001 &&
      Math.abs(aimCoord.longitude - pinCoord.longitude) < 0.00001;
    if (isSame) return null;
    return {
      latitude: (aimCoord.latitude + pinCoord.latitude) / 2,
      longitude: (aimCoord.longitude + pinCoord.longitude) / 2,
    };
  }, [aimCoord, pinCoord]);

  // Connecting lines
  const lineCoords = useMemo(() => {
    if (!playerCoord || !pinCoord) return null;
    return aimCoord
      ? [playerCoord, aimCoord, pinCoord]
      : [playerCoord, pinCoord];
  }, [playerCoord, pinCoord, aimCoord]);

  // Club distances
  const distances = useMemo(() => {
    return clubDistances && clubDistances.length > 0
      ? clubDistances
      : [
          { name: "Driver", distanceYards: 250 },
          { name: "3-Wood", distanceYards: 225 },
          { name: "5-Iron", distanceYards: 185 },
          { name: "7-Iron", distanceYards: 160 },
          { name: "Pitching Wedge", distanceYards: 125 },
        ];
  }, [clubDistances]);

  // Static initial region - set once so Android MapView doesn't reset on GPS ticks
  const initialRegionRef = useRef({
    latitude: pinCoord?.latitude || playerCoord?.latitude || 37.78825,
    longitude: pinCoord?.longitude || playerCoord?.longitude || -122.4324,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent?.coordinate;
    if (
      coord &&
      typeof coord.latitude === "number" &&
      typeof coord.longitude === "number"
    ) {
      onMapPress({
        geometry: {
          coordinates: [coord.longitude, coord.latitude],
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={cameraRef as any}
        style={styles.map}
        provider={Platform.OS === "android" ? "google" : undefined}
        mapType={MAP_TYPES.SATELLITE}
        onPress={handleMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#8BC34A"
        initialRegion={initialRegionRef.current}
      >
        {/* Club Arcs */}
        {playerCoord &&
          distances.map((club, index) => (
            <Circle
              key={`club_${index}`}
              center={playerCoord}
              radius={club.distanceYards * 0.9144} // Convert yards to meters
              strokeColor="rgba(255, 255, 255, 0.5)"
              strokeWidth={1}
              lineDashPattern={[5, 5]}
            />
          ))}

        {/* Connecting Lines */}
        {lineCoords && lineCoords.length >= 2 && (
          <Polyline
            coordinates={lineCoords}
            strokeColor="#FFA500"
            strokeWidth={3.5}
          />
        )}

        {/* Distance Badge 1: Player -> Aim (or Player -> Pin) */}
        {dist1Coord && (
          <Marker
            coordinate={dist1Coord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={6}
          >
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>
                {formatDist(aimCoord ? distanceToAim : distanceToPin)}{" "}
                <Text style={styles.distanceBadgeUnit}>
                  {unit.toLowerCase()}
                </Text>
              </Text>
            </View>
          </Marker>
        )}

        {/* Player Marker */}
        {playerCoord && (
          <Marker
            coordinate={playerCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={4}
          >
            <View style={[styles.marker, { backgroundColor: "#4285F4" }]}>
              <View style={styles.innerPlayerDot} />
            </View>
          </Marker>
        )}

        {/* Aim Marker with Tooltip */}
        {aimCoord && (
          <Marker
            coordinate={aimCoord}
            draggable={isAimMode}
            onDragEnd={(e) => {
              if (onAimDragEnd) {
                const coord = e.nativeEvent.coordinate;
                onAimDragEnd([coord.longitude, coord.latitude]);
              }
            }}
            anchor={{ x: 0.5, y: 0.75 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={7}
          >
            <View style={{ alignItems: "center" }}>
              <View style={styles.aimTooltip}>
                <View style={styles.aimBadge}>
                  <Text style={styles.aimBadgeText}>Aim-Point</Text>
                </View>
                <Text style={styles.aimTooltipText}>Tap & Hold to move</Text>
              </View>
              <View style={[styles.marker, { backgroundColor: "#FFA500" }]}>
                <View style={styles.innerAimDot} />
              </View>
            </View>
          </Marker>
        )}

        {/* Distance Badge 2: Aim -> Pin */}
        {dist2Coord && aimToPin != null && Number(aimToPin) > 0 && (
          <Marker
            coordinate={dist2Coord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={6}
          >
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>
                {formatDist(aimToPin)}{" "}
                <Text style={styles.distanceBadgeUnit}>
                  {unit.toLowerCase()}
                </Text>
              </Text>
            </View>
          </Marker>
        )}

        {/* Pin / Flag Marker */}
        {pinCoord && (
          <Marker
            coordinate={pinCoord}
            draggable={isFlagMode}
            onDragEnd={(e) => {
              if (onPinDragEnd) {
                const coord = e.nativeEvent.coordinate;
                onPinDragEnd([coord.longitude, coord.latitude]);
              }
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={10}
          >
            <View style={styles.flagMarkerContainer}>
              <View
                style={[
                  styles.flagBadge,
                  isFlagMode && styles.flagBadgeActive,
                ]}
              >
                <Ionicons name="flag" size={16} color="#ffffff" />
              </View>
              <View style={styles.flagPole} />
              <View style={styles.flagBaseDot} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  innerPlayerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  innerAimDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  flagMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 48,
  },
  flagBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 6,
  },
  flagBadgeActive: {
    backgroundColor: "#15803d",
    borderColor: "#fbbf24",
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  flagPole: {
    width: 2.5,
    height: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  flagBaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  distanceBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  distanceBadgeText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: -0.3,
  },
  distanceBadgeUnit: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
  },
  aimTooltip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 4,
  },
  aimBadge: {
    backgroundColor: "#f59e0b",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
  },
  aimBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "800",
  },
  aimTooltipText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
});
